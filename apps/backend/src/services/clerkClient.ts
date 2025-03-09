import { createClerkClient } from '@clerk/backend'
import { CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY } from '../constants/environmentVariables'

const clerkClient = createClerkClient({
  publishableKey: CLERK_PUBLISHABLE_KEY,
  secretKey: CLERK_SECRET_KEY,
})

export default clerkClient;