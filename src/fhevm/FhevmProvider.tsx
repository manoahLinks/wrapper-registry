import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { FhevmInstance } from '@zama-fhe/relayer-sdk/web'
import { SEPOLIA_RPC_URL } from '@/config/chain'

export type FhevmStatus = 'loading' | 'ready' | 'error'

interface FhevmContextValue {
  /** The relayer SDK instance, or null until ready. */
  instance: FhevmInstance | null
  status: FhevmStatus
  error: string | null
  /** Re-attempt initialization after a failure. */
  retry: () => void
}

const FhevmContext = createContext<FhevmContextValue | undefined>(undefined)

// Public Sepolia RPC used only for the SDK's own chain reads when no key is set.
const FALLBACK_RPC = 'https://ethereum-sepolia-rpc.publicnode.com'

// Module-level singleton so React StrictMode's double-mount (and any remounts)
// reuse a single, expensive WASM init + KMS parameter fetch.
let instancePromise: Promise<FhevmInstance> | null = null

async function buildInstance(): Promise<FhevmInstance> {
  // Dynamically import the (large, WASM-bearing) relayer SDK so it ships as a
  // separate chunk instead of bloating the initial bundle.
  const { initSDK, createInstance, SepoliaConfig } = await import('@zama-fhe/relayer-sdk/web')

  // Loads the TFHE/KMS WASM. Single-threaded by default — no SharedArrayBuffer,
  // so no cross-origin-isolation (COOP/COEP) headers are required to deploy.
  await initSDK()

  // A string RPC keeps instance creation independent of the connected wallet;
  // signing for user-decryption happens separately via the wallet (wagmi).
  const network = SEPOLIA_RPC_URL || FALLBACK_RPC

  return createInstance({ ...SepoliaConfig, network })
}

function getInstance(): Promise<FhevmInstance> {
  if (!instancePromise) instancePromise = buildInstance()
  return instancePromise
}

export function FhevmProvider({ children }: { children: ReactNode }) {
  const [instance, setInstance] = useState<FhevmInstance | null>(null)
  const [status, setStatus] = useState<FhevmStatus>('loading')
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    setError(null)

    getInstance()
      .then((inst) => {
        if (cancelled) return
        setInstance(inst)
        setStatus('ready')
      })
      .catch((e: unknown) => {
        if (cancelled) return
        instancePromise = null // clear so retry rebuilds
        setError(e instanceof Error ? e.message : 'Failed to initialize the FHEVM relayer')
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [reloadKey])

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
