import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { UserProvider } from './context/UserProvder.tsx'
import { ClerkProvider } from '@clerk/chrome-extension'
import { MemoryRouter } from 'react-router'

if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

const root = createRoot(document.getElementById('root')!)

root.render(
  <React.StrictMode>
    <MemoryRouter initialEntries={["/"]}>
      <ClerkProvider 
        publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
      >
        <UserProvider>
          <App />
        </UserProvider>
      </ClerkProvider>
    </MemoryRouter>
  </React.StrictMode>
)