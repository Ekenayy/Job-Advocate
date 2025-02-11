import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
  ],
  // build: {
  //   rollupOptions: {
  //     input: {
  //       main: 'index.html',
  //       background: 'src/background/background.ts',
  //       content: 'src/content/content.tsx',
  //       options: 'src/optionsPage/optionsPage.html'
  //     },
  //     output: {
  //       entryFileNames: (chunk) => {
  //         if (chunk.name === 'background') {
  //           return 'src/background/background.js';
  //         }
  //         if (chunk.name === 'content') {
  //           return 'src/content/content.js';
  //         }
  //         return '[name].js';
  //       },
  //       chunkFileNames: 'assets/[name].[hash].js',
  //       assetFileNames: 'assets/[name].[ext]'
  //     },
  //   },
  // },
  // server: {
  //   port: 5173,
  //   strictPort: true,
  //   hmr: {
  //     port: 5173,
  //   },
  // },
})
