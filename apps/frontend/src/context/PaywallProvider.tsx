import type React from "react"
import { setToStorage, removeFromStorage, getFromStorage } from "../utils/environment"
import { createContext, useContext, useState, useEffect } from "react"

type SubscriptionTier = "free" | "basic" | "premium" | null

interface PaywallContextType {
  subscriptionTier: SubscriptionTier
  isSubscribed: boolean
  hasAccess: (requiredTier: SubscriptionTier) => boolean
  setSubscriptionTier: (tier: SubscriptionTier) => void
}

const PaywallContext = createContext<PaywallContextType | undefined>(undefined)

interface PaywallProviderProps {
  children: React.ReactNode
  initialTier?: SubscriptionTier
}

export function PaywallProvider({ children, initialTier = null }: PaywallProviderProps) {
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>(initialTier)

  // In a real app, you would fetch the user's subscription status from your backend
  useEffect(() => {
    // Example: Load subscription from localStorage for demo purposes
    const getSavedTier = async () => {
      const savedTier = await getFromStorage<SubscriptionTier>("subscriptionTier")
      if (savedTier) {
        setSubscriptionTier(savedTier)
      }
    }
    getSavedTier()
  }, [])

  // Save subscription changes to localStorage for demo purposes
  useEffect(() => {
    if (subscriptionTier) {
      setToStorage("subscriptionTier", subscriptionTier)
    } else {
      removeFromStorage("subscriptionTier")
      //Remove after testing 
      setSubscriptionTier('free')
    }
  }, [subscriptionTier])

  const isSubscribed = subscriptionTier !== null && subscriptionTier !== "free"

  const hasAccess = (requiredTier: SubscriptionTier): boolean => {
    if (!requiredTier || requiredTier === "free") return true
    if (!subscriptionTier) return false

    if (requiredTier === "basic") {
      return subscriptionTier === "basic" || subscriptionTier === "premium"
    }

    if (requiredTier === "premium") {
      return subscriptionTier === "premium"
    }

    return false
  }

  return (
    <PaywallContext.Provider
      value={{
        subscriptionTier,
        isSubscribed,
        hasAccess,
        setSubscriptionTier,
      }}
    >
      {children}
    </PaywallContext.Provider>
  )
}

export function usePaywall() {
  const context = useContext(PaywallContext)
  if (context === undefined) {
    throw new Error("usePaywall must be used within a PaywallProvider")
  }
  return context
}

