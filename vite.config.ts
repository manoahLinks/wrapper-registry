import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import path from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // The Zama relayer SDK pulls in Node built-ins (Buffer, process, global,
    // util) that don't exist in the browser. Polyfill them so the SDK runs.
    nodePolyfills({
      globals: { Buffer: true, global: true, process: true },
      protocolImports: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    // The relayer SDK ships WASM and must not be pre-bundled by esbuild.
    exclude: ['@zama-fhe/relayer-sdk'],
  },
})
