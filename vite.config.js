import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'crypto', 'util', 'stream', 'vm']
    })
  ],
  resolve: {
    alias: {
      util: 'util',
      buffer: 'buffer'
    }
  },
  optimizeDeps: {
    include: [
      '@near-wallet-selector/core',
      '@near-wallet-selector/modal-ui',
      '@near-wallet-selector/my-near-wallet',
      '@near-wallet-selector/react-hook'
    ],
    esbuildOptions: {
      target: 'esnext'
    }
  },
  build: {
    target: 'esnext',
    commonjsOptions: {
      transformMixedEsModules: true
    }
  }
})
