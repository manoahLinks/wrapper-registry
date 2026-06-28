import { useChainId } from 'wagmi'
import {
  chainConfigOrDefault,
  isSupportedChain,
  type ChainConfig,
} from '@/config/chain'

interface ActiveChain {
  /** The wallet's current chainId (or the configured default when disconnected). */
  chainId: number
  /** Config for the active chain, or the default network's config if unsupported. */
  config: ChainConfig
  /** Whether the active chainId is one this dApp supports. */
  isSupported: boolean
  /** Convenience: the registry address for the active (or default) chain. */
  registryAddress: `0x${string}`
}

/**
 * The single source of truth for "which chain is the app currently acting on".
 * Reads the connected chain via wagmi and resolves it to a ChainConfig, so every
 * chain-dependent value (registry address, explorer, faucet availability) flows
 * from one place and reacts to network switches automatically.
 */
export function useActiveChain(): ActiveChain {
  const chainId = useChainId()
  const config = chainConfigOrDefault(chainId)
  return {
    chainId,
    config,
    isSupported: isSupportedChain(chainId),
    registryAddress: config.registryAddress,
  }
}
