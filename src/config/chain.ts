import { mainnet, sepolia } from 'wagmi/chains'
import type { Chain } from 'viem'

export type RelayerPreset = 'sepolia' | 'mainnet'

export interface ChainConfig {
  /** The wagmi/viem chain object. */
  chain: Chain
  /**
   * Official Zama Confidential Token Wrappers Registry (UUPS proxy) on this
   * chain. Verified on-chain — see docs/VERIFIED_CHAIN_FACTS.md.
   */
  registryAddress: `0x${string}`
  /** Preferred RPC (from env); falls back to {@link ChainConfig.fallbackRpcUrl}. */
  rpcUrl?: string
  /** Public RPC used by the FHEVM SDK's own chain reads when no key is set. */
  fallbackRpcUrl: string
  /** Which relayer-sdk preset (SepoliaConfig / MainnetConfig) to spread. */
  preset: RelayerPreset
  /**
   * Same-origin path the FHEVM relayer SDK should call instead of the public
   * relayer. Used on mainnet, where the relayer requires an API key that must
   * be injected server-side (see api/relayer). Resolved to an absolute URL at
   * runtime against window.location.origin. Undefined → use the SDK's default
   * relayer URL (Sepolia's testnet relayer is keyless and CORS-open).
   */
  relayerProxyPath?: string
  /**
   * Whether this chain exposes a mintable mock-ERC-20 faucet. Only true on
   * testnets — you cannot mint real USDC/WETH on mainnet.
   */
  hasFaucet: boolean
}

const SEPOLIA_RPC_URL = import.meta.env.VITE_SEPOLIA_RPC_URL as string | undefined
const MAINNET_RPC_URL = import.meta.env.VITE_MAINNET_RPC_URL as string | undefined

export const SUPPORTED_CHAINS: Record<number, ChainConfig> = {
  [sepolia.id]: {
    chain: sepolia,
    registryAddress: '0x2f0750Bbb0A246059d80e94c454586a7F27a128e',
    rpcUrl: SEPOLIA_RPC_URL,
    fallbackRpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
    preset: 'sepolia',
    // Testnet relayer is keyless → SDK default (SepoliaConfig.relayerUrl) is fine.
    hasFaucet: true,
  },
  [mainnet.id]: {
    chain: mainnet,
    registryAddress: '0xeb5015fF021DB115aCe010f23F55C2591059bBA0',
    rpcUrl: MAINNET_RPC_URL,
    fallbackRpcUrl: 'https://ethereum-rpc.publicnode.com',
    preset: 'mainnet',
    // Mainnet relayer needs an x-api-key → proxy through our own backend so the
    // key never ships in the browser bundle. /v2 matches the SDK default route.
    relayerProxyPath: '/api/relayer/v2',
    hasFaucet: false,
  },
}

/** All chainIds this dApp can operate on. */
export const SUPPORTED_CHAIN_IDS = Object.keys(SUPPORTED_CHAINS).map(Number)

/** Network to suggest when the wallet sits on an unsupported chain (cheap testnet). */
export const DEFAULT_CHAIN_ID = sepolia.id

export function getChainConfig(chainId: number | undefined): ChainConfig | undefined {
  return chainId == null ? undefined : SUPPORTED_CHAINS[chainId]
}

export function isSupportedChain(chainId: number | undefined): chainId is number {
  return chainId != null && chainId in SUPPORTED_CHAINS
}

/** The config for `chainId`, or the default network's config as a fallback. */
export function chainConfigOrDefault(chainId: number | undefined): ChainConfig {
  return getChainConfig(chainId) ?? SUPPORTED_CHAINS[DEFAULT_CHAIN_ID]
}

/** Block-explorer base URL for `chainId`, falling back to the default network. */
export function explorerUrl(chainId: number | undefined): string {
  return chainConfigOrDefault(chainId).chain.blockExplorers?.default.url ?? ''
}
