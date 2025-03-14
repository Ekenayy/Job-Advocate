import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  
  console.log('Loaded environment variables:');
  console.log('NODE_ENV:', env.NODE_ENV);
  console.log('VITE_OAUTH_CLIENT_ID:', env.VITE_OAUTH_CLIENT_ID);
  console.log('VITE_BACKEND_URL:', env.VITE_BACKEND_URL);
  console.log('VITE_CLERK_SYNC_HOST:', env.VITE_CLERK_SYNC_HOST);
  console.log('VITE_CLERK_FRONTEND_API:', env.VITE_CLERK_FRONTEND_API);
  
  // Expose env variables to the client
  const envWithProcessPrefix = Object.entries(env).reduce(
    (prev, [key, val]) => {
      return {
        ...prev,
        ['process.env.' + key]: JSON.stringify(val)
      }
    },
    {}
  )
  
  return {
    base: './', // Use relative paths instead of absolute paths
    define: envWithProcessPrefix,
    plugins: [
      react(),
      crx({ manifest }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
})
