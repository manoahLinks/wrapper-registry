import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { http } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { SEPOLIA_RPC_URL } from './chain'

// WalletConnect requires a project id. A placeholder keeps dev working with
// injected wallets (MetaMask); set VITE_WALLETCONNECT_PROJECT_ID for full support.
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'PLACEHOLDER_PROJECT_ID'

export const wagmiConfig = getDefaultConfig({
  appName: 'Confidential Wrapper Registry',
  projectId,
  chains: [sepolia],
  transports: {
    // `http(undefined)` uses the chain's public RPC; a custom URL is preferred.
    [sepolia.id]: http(SEPOLIA_RPC_URL),
  },
  ssr: false,
})
