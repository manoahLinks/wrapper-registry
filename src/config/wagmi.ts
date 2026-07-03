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
    // Prefer the env RPC; otherwise use our vetted public fallback (publicnode)
    // rather than viem's chain default (cloudflare-eth), which rate-limits hard
    // on mainnet and intermittently drops the registry read.
    [sepolia.id]: http(SUPPORTED_CHAINS[sepolia.id].rpcUrl || SUPPORTED_CHAINS[sepolia.id].fallbackRpcUrl),
    [mainnet.id]: http(SUPPORTED_CHAINS[mainnet.id].rpcUrl || SUPPORTED_CHAINS[mainnet.id].fallbackRpcUrl),
  },
  ssr: false,
})
