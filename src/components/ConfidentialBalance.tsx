import { useState } from 'react'
import type { Hex } from 'viem'
import { useDecryption } from '@/fhevm/DecryptionProvider'
import { useToast } from '@/components/ui/Toast'
import { parseTxError } from '@/lib/errors'
import { formatAmount } from '@/lib/format'

interface ConfidentialBalanceProps {
  contract: string
  handle: Hex
  decimals: number
  symbol: string
  /** Whether the wallet holds any confidential balance (non-zero handle). */
  hasBalance: boolean
  size?: 'sm' | 'lg'
}

/**
 * Renders an ERC-7984 balance as a shimmering ciphertext that the owner can
 * reveal via the EIP-712 user-decryption flow. Once revealed it can be hidden
 * again (cosmetic — no re-signing needed thanks to the decryption cache).
 */
export function ConfidentialBalance({
  contract,
  handle,
  decimals,
  symbol,
  hasBalance,
  size = 'sm',
}: ConfidentialBalanceProps) {
  const { decrypt, getValue, isPending } = useDecryption()
  const toast = useToast()
  const [hidden, setHidden] = useState(false)

  const value = getValue(contract, handle)
  const pending = isPending(contract, handle)
  const text = size === 'lg' ? 'text-2xl' : 'text-sm'

  if (!hasBalance) {
    return <span className={`tabular font-mono ${text} text-ink`}>0 {size === 'lg' ? symbol : ''}</span>
  }

  async function reveal() {
    try {
      await decrypt(contract, handle)
      setHidden(false)
    } catch (e) {
      toast.push({ kind: 'error', title: 'Decryption failed', description: parseTxError(e) })
    }
  }

  // Decrypted and visible.
  if (value !== undefined && !hidden) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className={`tabular font-mono font-semibold ${text} text-ink`}>
          {formatAmount(value, decimals)} {size === 'lg' ? symbol : ''}
        </span>
        <button
          onClick={() => setHidden(true)}
          className="text-ink-faint hover:text-ink"
          title="Hide"
          aria-label="Hide balance"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" strokeLinecap="round" />
            <path d="M9.4 5.2A9.5 9.5 0 0 1 12 5c5 0 9 4.5 9 7a13 13 0 0 1-2.2 3M6.3 6.3A13 13 0 0 0 3 12c0 2.5 4 7 9 7a9.6 9.6 0 0 0 3.3-.6" strokeLinecap="round" />
          </svg>
        </button>
      </span>
    )
  }

  // Decrypted but hidden — reveal instantly from cache.
  if (value !== undefined && hidden) {
    return (
      <button onClick={() => setHidden(false)} className="inline-flex items-center gap-1.5 group" title="Show">
        <span className={`cipher-text font-mono font-semibold tracking-widest ${text}`}>••••••</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-faint group-hover:text-ink">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>
    )
  }

  // Encrypted — offer to reveal (triggers EIP-712 signature).
  return (
    <button
      onClick={reveal}
      disabled={pending}
      className="inline-flex items-center gap-1.5 group disabled:opacity-70"
      title="Decrypt your balance (signature required)"
    >
      <span className={`cipher-text font-mono font-semibold tracking-widest ${text}`}>••••••</span>
      {pending ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin text-zama-orange">
          <path d="M21 12a9 9 0 1 1-6.2-8.6" strokeLinecap="round" />
        </svg>
      ) : (
        <span className="rounded-md bg-ink px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zama-yellow group-hover:bg-ink-soft">
          Reveal
        </span>
      )}
    </button>
  )
}
