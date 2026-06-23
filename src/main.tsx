import React from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'
import './index.css'
import { wagmiConfig } from './config/wagmi'
import { FhevmProvider } from './fhevm/FhevmProvider'
import { ToastProvider } from './components/ui/Toast'
import App from './App'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 15_000, retry: 1 },
  },
})

// RainbowKit themed to the Zama brand (yellow accent, ink foreground).
const rainbowTheme = lightTheme({
  accentColor: '#ffd208',
  accentColorForeground: '#111314',
  borderRadius: 'medium',
  fontStack: 'system',
  overlayBlur: 'small',
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={rainbowTheme} initialChain={wagmiConfig.chains[0]}>
          <FhevmProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </FhevmProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
)
