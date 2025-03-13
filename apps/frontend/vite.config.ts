import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { manifestPlugin } from './vite-plugin-manifest'
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
    define: envWithProcessPrefix,
    plugins: [
      react(),
      manifestPlugin(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          background: path.resolve(__dirname, 'src/background/background.ts'),
          content: path.resolve(__dirname, 'src/content/content.tsx')
        },
        output: {
          entryFileNames: (chunkInfo) => {
            // Use consistent filenames for background and content scripts
            if (chunkInfo.name === 'background') {
              return 'assets/background.js';
            }
            if (chunkInfo.name === 'content') {
              return 'assets/content.js';
            }
            return 'assets/[name]-[hash].js';
          },
          assetFileNames: (assetInfo) => {
            // Don't hash favicon.svg so it can be referenced directly in manifest
            if (assetInfo.name === 'favicon.svg') {
              return 'assets/favicon.svg';
            }
            return 'assets/[name]-[hash][extname]';
          }
        }
      }
    }
  }
})
