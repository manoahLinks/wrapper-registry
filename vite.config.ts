import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    // The Zama relayer SDK (and some web3 deps) expect a Node-ish `global`.
    global: 'globalThis',
  },
  optimizeDeps: {
    // The relayer SDK ships WASM and must not be pre-bundled by esbuild.
    exclude: ['@zama-fhe/relayer-sdk'],
  },
})
