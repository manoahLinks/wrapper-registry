import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import { useChainId } from 'wagmi'
import { explorerTx } from '@/lib/format'

export type ToastKind = 'success' | 'error' | 'info' | 'pending'

export interface ToastItem {
  id: number
  kind: ToastKind
  title: string
  description?: string
  /** A transaction hash to link to Etherscan. */
  txHash?: string
}

interface ToastContextValue {
  push: (toast: Omit<ToastItem, 'id'>) => number
  update: (id: number, patch: Partial<Omit<ToastItem, 'id'>>) => void
  dismiss: (id: number) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)
let counter = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: number) => {
    setItems((s) => s.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = ++counter
      setItems((s) => [...s, { ...toast, id }])
      // Auto-dismiss terminal toasts; pending ones persist until updated.
      if (toast.kind !== 'pending') setTimeout(() => dismiss(id), 6500)
      return id
    },
    [dismiss],
  )

  const update = useCallback(
    (id: number, patch: Partial<Omit<ToastItem, 'id'>>) => {
      setItems((s) => s.map((t) => (t.id === id ? { ...t, ...patch } : t)))
      if (patch.kind && patch.kind !== 'pending') setTimeout(() => dismiss(id), 6500)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={{ push, update, dismiss }}>
      {children}
      <ToastViewport items={items} dismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}

const ICONS: Record<ToastKind, ReactNode> = {
  success: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  ),
  pending: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
      <path d="M21 12a9 9 0 1 1-6.2-8.6" strokeLinecap="round" />
    </svg>
  ),
}

const TONES: Record<ToastKind, string> = {
  success: 'text-state-success',
  error: 'text-state-danger',
  info: 'text-ink',
  pending: 'text-zama-orange',
}

function ToastViewport({ items, dismiss }: { items: ToastItem[]; dismiss: (id: number) => void }) {
  const chainId = useChainId()
  return (
    <div className="pointer-events-none fixed bottom-0 right-0 z-[60] flex w-full max-w-sm flex-col gap-2 p-4">
      {items.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto animate-fade-up overflow-hidden rounded-card border border-line bg-paper-card shadow-pop"
        >
          <div className="flex items-start gap-3 p-3.5">
            <span className={`mt-0.5 shrink-0 ${TONES[t.kind]}`}>{ICONS[t.kind]}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{t.title}</p>
              {t.description && (
                <p className="mt-0.5 break-words text-xs text-ink-muted">{t.description}</p>
              )}
              {t.txHash && (
                <a
                  href={explorerTx(t.txHash, chainId)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-xs font-medium text-ink underline underline-offset-2 hover:text-zama-orange"
                >
                  View on explorer ↗
                </a>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 text-ink-faint hover:text-ink"
              aria-label="Dismiss"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
