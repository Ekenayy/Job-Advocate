import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import { createCheckoutSessionHandler, verifySubscriptionHandler, webhookHandler } from '../handlers/stripe.handler';

export default async function stripeRoutes(fastify: FastifyInstance) {
  // Create a checkout session
  fastify.post(
    '/stripe/create-checkout-session',
    {
      schema: {
        body: Type.Object({
          priceId: Type.String(),
          userId: Type.String(),
          customerEmail: Type.String(),
          successUrl: Type.String(),
          cancelUrl: Type.String(),
        }),
      },
    },
    createCheckoutSessionHandler
  );

  // Verify subscription status
  fastify.get(
    '/stripe/verify-subscription/:userId',
    {
      schema: {
        params: Type.Object({
          userId: Type.String(),
        }),
      },
    },
    verifySubscriptionHandler
  );

  // Stripe webhook endpoint (no validation as it comes from Stripe)
  fastify.post('/stripe/webhook', webhookHandler);
} 