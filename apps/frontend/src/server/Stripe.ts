interface CheckoutSessionParams {
  priceId: string;
  userId: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}

interface CheckoutSession {
  url: string;
  id: string;
}

/**
 * Creates a Stripe checkout session by calling the backend API
 */
export const createCheckoutSession = async (params: CheckoutSessionParams): Promise<CheckoutSession | null> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/stripe/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create checkout session');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return null;
  }
};

/**
 * Verifies a subscription status by calling the backend API
 */
export const verifySubscription = async (userId: string): Promise<{ isSubscribed: boolean; tier: string }> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/stripe/verify-subscription/${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to verify subscription');
    }

    return await response.json();
  } catch (error) {
    console.error('Error verifying subscription:', error);
    return { isSubscribed: false, tier: 'free' };
  }
}; 