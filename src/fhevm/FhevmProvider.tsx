import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useChainId } from 'wagmi'
import type { FhevmInstance } from '@zama-fhe/relayer-sdk/web'
import { getChainConfig, isSupportedChain } from '@/config/chain'

export type FhevmStatus = 'loading' | 'ready' | 'error'

interface FhevmContextValue {
  /** The relayer SDK instance for the active chain, or null until ready. */
  instance: FhevmInstance | null
  status: FhevmStatus
  error: string | null
  /** Re-attempt initialization after a failure. */
  retry: () => void
}

const FhevmContext = createContext<FhevmContextValue | undefined>(undefined)

// One singleton instance per chainId: switching networks builds (and caches) a
// fresh instance bound to that chain's KMS/relayer config rather than reusing a
// stale one. StrictMode's double-mount still shares a single expensive init.
const instanceByChain = new Map<number, Promise<FhevmInstance>>()

async function buildInstance(chainId: number): Promise<FhevmInstance> {
  const cfg = getChainConfig(chainId)
  if (!cfg) throw new Error(`Unsupported network (chainId ${chainId}).`)

  // Dynamically import the (large, WASM-bearing) relayer SDK so it ships as a
  // separate chunk instead of bloating the initial bundle.
  const sdk = await import('@zama-fhe/relayer-sdk/web')

  // Loads the TFHE/KMS WASM. Single-threaded by default — no SharedArrayBuffer,
  // so no cross-origin-isolation (COOP/COEP) headers are required to deploy.
  await sdk.initSDK()

  const preset = cfg.preset === 'mainnet' ? sdk.MainnetConfig : sdk.SepoliaConfig

  // A string RPC keeps instance creation independent of the connected wallet;
  // signing for user-decryption happens separately via the wallet (wagmi).
  const network = cfg.rpcUrl || cfg.fallbackRpcUrl

  const config: Parameters<typeof sdk.createInstance>[0] = { ...preset, network }

  // On chains that require an API key (mainnet), route relayer calls through our
  // own same-origin proxy, which injects the key server-side. No key in the
  // browser. The SDK needs an absolute, parseable URL here.
  if (cfg.relayerProxyPath) {
    config.relayerUrl = new URL(cfg.relayerProxyPath, window.location.origin).toString()
  }

  return sdk.createInstance(config)
}

function getInstance(chainId: number): Promise<FhevmInstance> {
  let promise = instanceByChain.get(chainId)
  if (!promise) {
    promise = buildInstance(chainId)
    instanceByChain.set(chainId, promise)
  }
  return promise
}

export function FhevmProvider({ children }: { children: ReactNode }) {
  const chainId = useChainId()
  const [instance, setInstance] = useState<FhevmInstance | null>(null)
  const [status, setStatus] = useState<FhevmStatus>('loading')
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    // Drop any instance from the previous chain so consumers never decrypt
    // against the wrong network mid-switch.
    setInstance(null)

    if (!isSupportedChain(chainId)) {
      setStatus('error')
      setError(
        'Unsupported network. Switch to Sepolia or Ethereum mainnet to use confidential features.',
      )
      return
    }

    setStatus('loading')
    setError(null)

    getInstance(chainId)
      .then((inst) => {
        if (cancelled) return
        setInstance(inst)
        setStatus('ready')
      })
      .catch((e: unknown) => {
        if (cancelled) return
        instanceByChain.delete(chainId) // clear so retry rebuilds
        setError(e instanceof Error ? e.message : 'Failed to initialize the FHEVM relayer')
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [chainId, reloadKey])

  const value = useMemo<FhevmContextValue>(
    () => ({
      instance,
      status,
      error,
      retry: () => setReloadKey((k) => k + 1),
    }),
    [instance, status, error],
  )

  return <FhevmContext.Provider value={value}>{children}</FhevmContext.Provider>
}

/** Access the FHEVM relayer instance and its initialization status. */
export function useFhevm(): FhevmContextValue {
  const ctx = useContext(FhevmContext)
  if (!ctx) throw new Error('useFhevm must be used within <FhevmProvider>')
  return ctx
}
