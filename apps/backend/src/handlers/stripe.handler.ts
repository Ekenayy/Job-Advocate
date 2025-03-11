import { FastifyRequest, FastifyReply } from 'fastify';
import Stripe from 'stripe';
import { supabase } from '../services/supabaseClient';
import { STRIPE_SECRET_KEY, YEARLY_PRICE_ID, MONTHLY_PRICE_ID, STRIPE_WEBHOOK_SECRET } from '../constants/environmentVariables';
import clerkClient from '../services/clerkClient';

// Add interface for FastifyRequest with rawBody
interface FastifyRequestWithRawBody extends FastifyRequest {
  rawBody?: string | Buffer;
}

const stripe = new Stripe(STRIPE_SECRET_KEY);

const PRICE_IDS = {
  [YEARLY_PRICE_ID]: 'annual',
  [MONTHLY_PRICE_ID]: 'monthly',
};

interface CreateCheckoutSessionBody {
  priceId: string;
  userId: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}

export const createCheckoutSessionHandler = async (
  request: FastifyRequest<{ Body: CreateCheckoutSessionBody }>,
  reply: FastifyReply
) => {
  const { priceId, userId, customerEmail, successUrl, cancelUrl } = request.body;
  console.log('Creating checkout session for:', { priceId, userId, customerEmail });

  try {
    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
      client_reference_id: userId, // Store user ID for webhook
      metadata: {
        userId,
      },
    });
    
    console.log('Successfully created checkout session:', { sessionId: session.id });

    return reply.status(200).send({
      url: session.url,
      id: session.id,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return reply.status(500).send({ error: 'Failed to create checkout session' });
  }
};

export const verifySubscriptionHandler = async (
  request: FastifyRequest<{ Params: { userId: string } }>,
  reply: FastifyReply
) => {
  const { userId } = request.params;
  console.log('Verifying subscription for user:', userId);

  try {
    // Get user's subscription from database
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error) {
      console.error('Error fetching subscription:', error);
      return reply.status(500).send({ error: 'Failed to verify subscription' });
    }

    // If no subscription found, user is on free tier
    if (!data) {
      console.log('No active subscription found for user:', userId);
      return reply.status(200).send({ isSubscribed: false, tier: 'free' });
    }

    console.log('Found active subscription for user:', { userId, tier: data.tier });

    // Return subscription status and tier
    return reply.status(200).send({
      isSubscribed: true,
      tier: data.tier,
      expiresAt: data.current_period_end,
    });
  } catch (error) {
    console.error('Error verifying subscription:', error);
    return reply.status(500).send({ error: 'Failed to verify subscription' });
  }
};

export const webhookHandler = async (request: FastifyRequestWithRawBody, reply: FastifyReply) => {
  console.log('Received Stripe webhook event');

  const signature = request.headers['stripe-signature'] as string;
  const endpointSecret = STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    console.error('Missing webhook secret in environment variables');
    return reply.status(500).send({ error: 'Webhook secret not configured' });
  }

  let event;

  try {
    // Use the rawBody field provided by fastify-raw-body
    const rawBody = request.rawBody;
    
    if (!rawBody) {
      console.error('No raw body found in request');
      return reply.status(400).send({ error: 'No raw body found in request' });
    }
    
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      endpointSecret
    );
    console.log('Verified webhook signature, event type:', event.type);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return reply.status(400).send({ error: 'Invalid signature' });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('Processing checkout.session.completed:', { sessionId: session.id });
      await handleCheckoutSessionCompleted(session);
      break;
    }
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      console.log('Processing customer.subscription.updated:', { subscriptionId: subscription.id });
      await handleSubscriptionUpdated(subscription);
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      console.log('Processing customer.subscription.deleted:', { subscriptionId: subscription.id });
      await handleSubscriptionDeleted(subscription);
      break;
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return reply.status(200).send({ received: true });
};

// Helper functions for webhook events
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId || session.client_reference_id;
  
  if (!userId) {
    console.error('No user ID found in session metadata');
    return;
  }

  console.log('Processing completed checkout session for user:', userId);

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
  const priceId = subscription.items.data[0].price.id;
  const tier = PRICE_IDS[priceId as keyof typeof PRICE_IDS] || 'basic';

  console.log('Retrieved subscription details:', { subscriptionId: subscription.id, tier });

  // Store subscription in database
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('clerk_id')
    .eq('id', userId)
    .single();

  if (userError || !userData) {
    console.error('Error finding clerk_id for user:', userError);
    return;
  }

  const { error } = await supabase.from('subscriptions').insert({
    user_id: userId,
    stripe_customer_id: session.customer as string,
    stripe_subscription_id: subscription.id,
    status: subscription.status,
    tier,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
  });

  if (error) {
    console.error('Error storing subscription:', error);
    return;
  }

  console.log('Successfully stored subscription in database');

  // Update user metadata in Clerk
  try {
    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        subscribed: true,
        tier,
      },
    });
    console.log('Successfully updated Clerk user metadata');
  } catch (error) {
    console.error('Error updating Clerk user metadata:', error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Handling subscription update:', { subscriptionId: subscription.id });
  
  // Get user ID from subscription metadata or customer
  const { data, error } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (error || !data) {
    console.error('Error finding user for subscription:', error);
    return;
  }

  const userId = data.user_id;
  const priceId = subscription.items.data[0].price.id;
  const tier = PRICE_IDS[priceId as keyof typeof PRICE_IDS] || 'basic';

  console.log('Updating subscription for user:', { userId, tier });

  // Update subscription in database
  await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      tier,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  console.log('Successfully updated subscription in database');

  // Update user metadata in Clerk
  try {
    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        subscribed: subscription.status === 'active',
        tier: subscription.status === 'active' ? tier : 'free',
      },
    });
    console.log('Successfully updated Clerk user metadata');
  } catch (error) {
    console.error('Error updating Clerk user metadata:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Handling subscription deletion:', { subscriptionId: subscription.id });
  
  // Get user ID from subscription
  const { data, error } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (error || !data) {
    console.error('Error finding user for subscription:', error);
    return;
  }

  const userId = data.user_id;
  console.log('Found user for deleted subscription:', userId);

  // Update subscription in database
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
    })
    .eq('stripe_subscription_id', subscription.id);

  console.log('Successfully marked subscription as canceled in database');

  // Update user metadata in Clerk
  try {
    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        subscribed: false,
        tier: 'free',
      },
    });
    console.log('Successfully updated Clerk user metadata for canceled subscription');
  } catch (error) {
    console.error('Error updating Clerk user metadata:', error);
  }
} 