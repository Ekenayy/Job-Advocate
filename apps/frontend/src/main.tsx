import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { UserProvider } from './context/UserProvder.tsx'
import { ClerkProvider } from '@clerk/chrome-extension'
import { PaywallProvider } from './context/PaywallProvider.tsx'
import { NavigationProvider } from './context/NavigationContext.tsx'

if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

const root = createRoot(document.getElementById('root')!)

const EXTENSION_URL = chrome.runtime.getURL('.')

root.render(
  <React.StrictMode>
    <NavigationProvider initialRoute="/">
      <ClerkProvider 
        publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
        afterSignOutUrl={`${EXTENSION_URL}/index.html`}
        signInFallbackRedirectUrl={`${EXTENSION_URL}/index.html`}
        signUpFallbackRedirectUrl={`${EXTENSION_URL}/index.html`}
      >
        <UserProvider>
          <PaywallProvider>
            <App />
          </PaywallProvider>
        </UserProvider>
      </ClerkProvider>
    </NavigationProvider>
  </React.StrictMode>
)