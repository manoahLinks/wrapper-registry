import { useEffect, useRef, useState } from 'react'
import type { Hex } from 'viem'
import { useDecryption } from '@/fhevm/DecryptionProvider'
import { useToast } from '@/components/ui/Toast'
import { parseTxError } from '@/lib/errors'
import { formatAmount } from '@/lib/format'

const HEX = '0123456789abcdef'
/** A random ciphertext-looking token, e.g. "7f3a··c2e1". */
function randCipher(): string {
  const r = (n: number) => Array.from({ length: n }, () => HEX[(Math.random() * 16) | 0]).join('')
  return `${r(4)}··${r(4)}`
}
const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

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
  // Non-null while the "cracking" animation runs (during sign + decrypt).
  const [scramble, setScramble] = useState<string | null>(null)
  const scrambleIv = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => () => clearInterval(scrambleIv.current), [])

  const value = getValue(contract, handle)
  const pending = isPending(contract, handle)
  const text = size === 'lg' ? 'text-2xl' : 'text-sm'
  const cipherSize = size === 'lg' ? 'text-2xl' : 'text-[14px]'

  // A deterministic, ciphertext-looking preview of the encrypted handle —
  // shown in place of the real balance until the owner decrypts it.
  const cipher = `${handle.slice(2, 6)}··${handle.slice(-4)}`

  if (!hasBalance) {
    return <span className={`tabular font-mono ${text} text-ink`}>0 {size === 'lg' ? symbol : ''}</span>
  }

  async function reveal() {
    const reduced = prefersReducedMotion()
    // Kick off the "cracking" scramble immediately so it covers the wallet
    // signature prompt and the relayer round-trip.
    if (!reduced) {
      setScramble(randCipher())
      scrambleIv.current = setInterval(() => setScramble(randCipher()), 55)
    } else {
      setScramble('decrypting…')
    }
    try {
      await decrypt(contract, handle)
      // A short dramatic beat so the resolve always reads as "decrypting".
      if (!reduced) await new Promise((r) => setTimeout(r, 650))
      setHidden(false)
    } catch (e) {
      toast.push({ kind: 'error', title: 'Decryption failed', description: parseTxError(e) })
    } finally {
      clearInterval(scrambleIv.current)
      setScramble(null)
    }
  }

  // Active decryption — the ciphertext "cracks" before the value lands.
  if (scramble !== null) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className={`font-mono font-bold tracking-[0.04em] text-ink ${cipherSize}`}>{scramble}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin text-zama-orange">
          <path d="M21 12a9 9 0 1 1-6.2-8.6" strokeLinecap="round" />
        </svg>
      </span>
    )
  }

  // Decrypted and visible.
  if (value !== undefined && !hidden) {
    return (
      <span className="inline-flex animate-fade-up items-center gap-1.5">
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
      <button onClick={() => setHidden(false)} className="group inline-flex items-center gap-2" title="Show">
        <span className={`font-mono font-medium tracking-[0.04em] text-ink-dim ${cipherSize}`}>{cipher}</span>
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
      className="group inline-flex items-center gap-2 disabled:opacity-70"
      title="Decrypt your balance (signature required)"
    >
      <span
        className={`font-mono font-medium tracking-[0.04em] text-ink-dim ${cipherSize}`}
        title="Encrypted on-chain"
      >
        {cipher}
      </span>
      {pending ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin text-zama-orange">
          <path d="M21 12a9 9 0 1 1-6.2-8.6" strokeLinecap="round" />
        </svg>
      ) : (
        <span className="rounded-md border border-ink bg-zama-yellow px-2 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.08em] text-ink group-hover:bg-zama-medium-yellow">
          Reveal
        </span>
      )}
    </button>
  )
}
