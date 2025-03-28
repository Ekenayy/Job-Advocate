import { PostHog } from 'posthog-node'
import { POSTHOG_API_KEY } from '../constants/environmentVariables'
export const postHogClient = new PostHog(
    POSTHOG_API_KEY,
    { host: 'https://us.i.posthog.com' }
)