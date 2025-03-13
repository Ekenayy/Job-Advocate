import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { UserProvider } from './context/UserProvder.tsx'
import { ClerkProvider } from '@clerk/chrome-extension'
import { MemoryRouter } from 'react-router'
import { PaywallProvider } from './context/PaywallProvider.tsx'

if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

if (!import.meta.env.VITE_CLERK_SYNC_HOST) {
  throw new Error("Missing Sync Host")
}

const root = createRoot(document.getElementById('root')!)

root.render(
  <React.StrictMode>
    <MemoryRouter initialEntries={["/"]}>
      <ClerkProvider 
        publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
        syncHost={import.meta.env.VITE_CLERK_SYNC_HOST}
      >
        <UserProvider>
          <PaywallProvider>
              <App />
          </PaywallProvider>
          </UserProvider>
      </ClerkProvider>
    </MemoryRouter>
  </React.StrictMode>
)