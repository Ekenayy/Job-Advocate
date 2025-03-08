import type React from "react"

import { useState } from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUser } from "../../context/UserProvder"
import { createCheckoutSession } from "../../server/Stripe"
interface PaywallProps {
  children: React.ReactNode
  isLocked?: boolean
  buttonText?: string
  onSubscribe?: (plan: string) => void
}

export function Paywall({
  children,
  isLocked = true,
  buttonText = "Send Paywall",
  onSubscribe,
}: PaywallProps) {
  const [selectedPlan, setSelectedPlan] = useState("yearly")
  const [showPaywall, setShowPaywall] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useUser()

  const handleSubscribe = async (plan: string) => {
    setIsLoading(true)
    
    try {
      const session = await createCheckoutSession({
        priceId: getPriceId(plan),
        userId: user?.externalId || '',
        customerEmail: user?.primaryEmailAddress?.emailAddress || '',
        successUrl: chrome.runtime.getURL('index.html?payment=success'),
        cancelUrl: chrome.runtime.getURL('index.html?payment=canceled')
      })
      
      if (onSubscribe) {
        onSubscribe(plan)
      }
      
      if (session?.url) {
        window.open(session.url, '_blank')
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const getPriceId = (plan: string): string => {
    switch (plan) {
      case 'yearly':
        return 'price_1R0CynB3ggUnx14rwznRt37Q'
      case 'monthly':
        return 'price_1R0D2ZB3ggUnx14rSIofGZT5'
      default:
        return 'price_1R0CynB3ggUnx14rwznRt37Q'
    }
  }

  if (!showPaywall) {
    return <>{children}</>
  }

  if (!isLocked) {
    return <>{children}</>
  }

  return (
    <Dialog>
      <DialogTrigger className="w-full" asChild>
        <Button className="w-full text-centerw-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed">{buttonText}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Unlock Unlimited Networking Power</DialogTitle>
          <DialogDescription>
            You've sent 5/5 free emails—upgrade now to connect with unlimited advocates, get AI-crafted emails, and
            boost your outreach!
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="yearly" value={selectedPlan} onValueChange={setSelectedPlan}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="yearly">Yearly (Save 60%)</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
          <TabsContent value="yearly">
            <Card className="mt-4 border-primary">
              <div className="absolute -top-3 left-0 right-0 mx-auto w-fit rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                Save 60%
              </div>
              <CardHeader>
                <CardTitle>Annual Plan</CardTitle>
                <CardDescription>
                  <span className="text-2xl font-bold">$7</span>
                  <span className="text-muted-foreground">/month</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Connect with unlimited advocates</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>AI-generated emails tailored to your resume</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Unlimited outreaches to land your dream role</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Premium support from our expert team</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button onClick={() => handleSubscribe(`yearly`)} className="w-full" disabled={isLoading}>
                  {isLoading ? 'Processing...' : 'Start networking'}
                </Button>
                <p className="mt-2 text-sm text-muted-foreground">
                  Cancel anytime with a 30-day money-back guarantee
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="monthly">
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Monthly Plan</CardTitle>
                <CardDescription>
                  <span className="text-2xl font-bold">$19</span>
                  <span className="text-muted-foreground">/month</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Connect with unlimited advocates</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>AI-generated emails tailored to your resume</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Unlimited outreaches to land your dream role</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>Premium support from our expert team</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="pt-2 flex flex-col gap-2">
                <Button onClick={() => handleSubscribe(`monthly`)} className="w-full" disabled={isLoading}>
                  {isLoading ? 'Processing...' : 'Start networking'}
                </Button>
                <p className="mt-2 text-sm text-muted-foreground">
                  Cancel anytime with a 30-day money-back guarantee
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

