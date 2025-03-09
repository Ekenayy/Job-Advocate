import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useUser } from './UserProvder';
import { verifySubscription } from '../server/Stripe';
import { getFromStorage, setToStorage } from '../utils/environment';

export type SubscriptionTier = 'free' | 'basic' | 'premium';

interface PaywallContextType {
  isSubscribed: boolean;
  subscriptionTier: SubscriptionTier;
  emailsRemaining: number;
  checkSubscription: () => Promise<void>;
  hasAccess: (requiredTier: SubscriptionTier) => boolean;
  decrementEmailsRemaining: () => void;
  setSubscriptionTier: (tier: SubscriptionTier) => void;
}

const PaywallContext = createContext<PaywallContextType | undefined>(undefined);

export const PaywallProvider = ({ children }: { children: ReactNode }) => {
  const { user, isSignedIn } = useUser();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('free');
  const [emailsRemaining, setEmailsRemaining] = useState(5); // Free tier gets 5 emails
  const [_isInitialized, setIsInitialized] = useState(false);

  // Check subscription status on mount and when user changes
  const checkSubscription = async () => {
    if (!user?.externalId) {
      setIsSubscribed(false);
      setSubscriptionTier('free');
      return;
    }

    try {
      // First check local storage for cached subscription data
      const cachedData = await getFromStorage<{
        isSubscribed: boolean;
        tier: SubscriptionTier;
        timestamp: number;
      }>('subscription');

      // If we have cached data that's less than 1 hour old, use it
      const ONE_HOUR = 60 * 60 * 1000;
      if (
        cachedData && 
        cachedData.timestamp && 
        Date.now() - cachedData.timestamp < ONE_HOUR
      ) {
        setIsSubscribed(cachedData.isSubscribed);
        setSubscriptionTier(cachedData.tier);
        return;
      }

      // Otherwise, verify with the server
      const { isSubscribed: subStatus, tier } = await verifySubscription(user.externalId);
      
      setIsSubscribed(subStatus);
      setSubscriptionTier(tier as SubscriptionTier);
      
      // Cache the result
      await setToStorage('subscription', {
        isSubscribed: subStatus,
        tier: tier as SubscriptionTier,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  // Initialize emails remaining from storage
  const initializeEmailsRemaining = async () => {
    const storedEmails = await getFromStorage<number>('emailsRemaining');
    if (storedEmails !== null) {
      setEmailsRemaining(storedEmails);
    } else {
      // Default to 5 for new users
      setEmailsRemaining(5);
      await setToStorage('emailsRemaining', 5);
    }
    setIsInitialized(true);
  };

  // Decrement emails remaining
  const decrementEmailsRemaining = async () => {
    if (isSubscribed) return; // Subscribed users have unlimited emails
    
    const newCount = Math.max(0, emailsRemaining - 1);
    setEmailsRemaining(newCount);
    await setToStorage('emailsRemaining', newCount);
  };

  // Check if user has access to a specific tier
  const hasAccess = (requiredTier: SubscriptionTier): boolean => {
    if (!requiredTier || requiredTier === 'free') return true;
    if (!subscriptionTier) return false;

    if (requiredTier === 'basic') {
      return subscriptionTier === 'basic' || subscriptionTier === 'premium';
    }

    if (requiredTier === 'premium') {
      return subscriptionTier === 'premium';
    }

    return false;
  };

  // Initialize on mount
  useEffect(() => {
    initializeEmailsRemaining();
  }, []);

  // Check subscription when user changes
  useEffect(() => {
    if (isSignedIn && user?.externalId) {
      checkSubscription();
    } else {
      setIsSubscribed(false);
      setSubscriptionTier('free');
    }
  }, [isSignedIn, user?.externalId]);

  // Listen for payment success in URL parameters
  useEffect(() => {
    const checkPaymentStatus = async () => {
      const url = new URL(window.location.href);
      const paymentStatus = url.searchParams.get('payment');
      
      if (paymentStatus === 'success') {
        // Clear the URL parameter
        url.searchParams.delete('payment');
        window.history.replaceState({}, '', url.toString());
        
        // Verify subscription status immediately
        await checkSubscription();
        
        // Show success message
        alert('Thank you for your subscription! Your account has been upgraded.');
      }
    };
    
    checkPaymentStatus();
  }, []);

  return (
    <PaywallContext.Provider
      value={{
        isSubscribed,
        subscriptionTier,
        emailsRemaining,
        checkSubscription,
        hasAccess,
        decrementEmailsRemaining,
        setSubscriptionTier
      }}
    >
      {children}
    </PaywallContext.Provider>
  );
};

export const usePaywall = () => {
  const context = useContext(PaywallContext);
  if (!context) {
    throw new Error('usePaywall must be used within a PaywallProvider');
  }
  return context;
};

