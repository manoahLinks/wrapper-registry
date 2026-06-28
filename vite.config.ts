import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import path from 'node:path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Server-side env (NOT prefixed with VITE_, so never bundled). Used only by the
  // dev proxy below to mirror the Vercel serverless relayer proxy locally.
  const env = loadEnv(mode, process.cwd(), '')
  const relayerApiKey = env.RELAYER_API_KEY

  return {
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
  // Dev-only mirror of api/relayer/[...path].ts (Vercel runs the function in
  // prod; `pnpm dev` does not). Forwards mainnet relayer calls upstream with the
  // x-api-key injected from server-side env. Only active when a key is present.
  server: relayerApiKey
    ? {
        proxy: {
          '/api/relayer': {
            target: 'https://relayer.mainnet.zama.org',
            changeOrigin: true,
            rewrite: (p) => p.replace(/^\/api\/relayer/, ''),
            headers: { 'x-api-key': relayerApiKey },
          },
        },
      }
    : undefined,
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          wallet: ['wagmi', 'viem', '@wagmi/core', '@rainbow-me/rainbowkit', '@tanstack/react-query'],
        },
      },
    },
  },
  }
})
