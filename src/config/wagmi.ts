import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { SUPPORTED_CHAINS } from './chain'

// WalletConnect requires a project id. A placeholder keeps dev working with
// injected wallets (MetaMask); set VITE_WALLETCONNECT_PROJECT_ID for full support.
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'PLACEHOLDER_PROJECT_ID'

export const wagmiConfig = getDefaultConfig({
  appName: 'Confidential Wrapper Registry',
  projectId,
  // Sepolia first → it's the default/initial chain (no real funds at risk).
  chains: [sepolia, mainnet],
  transports: {
    // `http(undefined)` uses the chain's public RPC; a custom URL is preferred.
    [sepolia.id]: http(SUPPORTED_CHAINS[sepolia.id].rpcUrl),
    [mainnet.id]: http(SUPPORTED_CHAINS[mainnet.id].rpcUrl),
  },
  ssr: false,
})
