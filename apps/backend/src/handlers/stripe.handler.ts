import { FastifyRequest, FastifyReply } from 'fastify';
import Stripe from 'stripe';
import { supabase } from '../services/supabaseClient';
import { clerkClient } from '@clerk/fastify';
import { STRIPE_SECRET_KEY, YEARLY_PRICE_ID, MONTHLY_PRICE_ID } from '../constants/environmentVariables';

// Initialize Stripe
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
      return reply.status(200).send({ isSubscribed: false, tier: 'free' });
    }

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

export const webhookHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const signature = request.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    return reply.status(500).send({ error: 'Webhook secret not configured' });
  }

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      request.body as Buffer,
      signature,
      endpointSecret
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return reply.status(400).send({ error: 'Invalid signature' });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutSessionCompleted(session);
      break;
    }
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionUpdated(subscription);
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
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

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
  const priceId = subscription.items.data[0].price.id;
  const tier = PRICE_IDS[priceId as keyof typeof PRICE_IDS] || 'basic';

  // Store subscription in database
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

  // Update user metadata in Clerk
  try {
    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        subscribed: true,
        tier,
      },
    });
  } catch (error) {
    console.error('Error updating Clerk user metadata:', error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
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

  // Update user metadata in Clerk
  try {
    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        subscribed: subscription.status === 'active',
        tier: subscription.status === 'active' ? tier : 'free',
      },
    });
  } catch (error) {
    console.error('Error updating Clerk user metadata:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
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

  // Update subscription in database
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
    })
    .eq('stripe_subscription_id', subscription.id);

  // Update user metadata in Clerk
  try {
    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        subscribed: false,
        tier: 'free',
      },
    });
  } catch (error) {
    console.error('Error updating Clerk user metadata:', error);
  }
} 