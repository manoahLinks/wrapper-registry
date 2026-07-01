import { useCallback } from 'react'
import { useSyncExternalStore } from 'react'
import { getAddress, type Address } from 'viem'

/** A user-added pair, persisted in the browser (not on-chain). */
export interface CustomPair {
  erc20: Address
  confidential: Address
  label?: string
}

const KEY = 'wr.customPairs.v1'
/** chainId (string) → pairs. Addresses differ per network, so we key by chain. */
type StoreShape = Record<string, CustomPair[]>

let cache: StoreShape | null = null
const listeners = new Set<() => void>()
const EMPTY: CustomPair[] = []

function read(): StoreShape {
  if (cache) return cache
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null
    cache = raw ? (JSON.parse(raw) as StoreShape) : {}
  } catch {
    cache = {}
  }
  return cache
}

function persist(next: StoreShape) {
  cache = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* storage unavailable (private mode / quota) — keep in-memory */
  }
  listeners.forEach((l) => l())
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

// Keep tabs in sync.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      cache = null
      listeners.forEach((l) => l())
    }
  })
}

/** Read the current custom pairs for a chain (non-reactive). */
export function getCustomPairs(chainId: number): CustomPair[] {
  return read()[String(chainId)] ?? EMPTY
}

/**
 * Reactive access to the user's browser-saved custom pairs for `chainId`,
 * plus add/remove. Backed by localStorage and shared across all consumers
 * (the registry grid, the add-pair modal, the cards) via an external store.
 */
export function useCustomPairs(chainId: number) {
  const customPairs = useSyncExternalStore(
    subscribe,
    () => getCustomPairs(chainId),
    () => EMPTY,
  )

  const addPair = useCallback(
    (p: CustomPair) => {
      const all = read()
      const k = String(chainId)
      const list = all[k] ?? []
      const norm: CustomPair = {
        erc20: getAddress(p.erc20),
        confidential: getAddress(p.confidential),
        label: p.label,
      }
      if (list.some((x) => x.confidential.toLowerCase() === norm.confidential.toLowerCase())) return
      persist({ ...all, [k]: [...list, norm] })
    },
    [chainId],
  )

  const removePair = useCallback(
    (confidential: string) => {
      const all = read()
      const k = String(chainId)
      const list = all[k] ?? []
      persist({
        ...all,
        [k]: list.filter((x) => x.confidential.toLowerCase() !== confidential.toLowerCase()),
      })
    },
    [chainId],
  )

  return { customPairs, addPair, removePair }
}
