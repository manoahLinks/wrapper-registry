import { useState } from 'react'
import { useAccount } from 'wagmi'
import { FaucetDialog } from '@/components/actions/FaucetDialog'
import { WrapDialog } from '@/components/actions/WrapDialog'
import { UnwrapDialog } from '@/components/actions/UnwrapDialog'
import type { EnrichedPair } from '@/types'
import type { PairBalances } from '@/hooks/useUserBalances'

interface PairActionsProps {
  pair: EnrichedPair
  balances?: PairBalances
  /** Refetch balances after a successful action. */
  onRefresh?: () => void
}

/**
 * The per-pair action bar. Actions are added phase by phase:
 * Faucet (now), Wrap / Unwrap / Decrypt (upcoming).
 */
export function PairActions({ pair, balances, onRefresh }: PairActionsProps) {
  const { isConnected } = useAccount()
  const [faucetOpen, setFaucetOpen] = useState(false)
  const [wrapOpen, setWrapOpen] = useState(false)
  const [unwrapOpen, setUnwrapOpen] = useState(false)

  const disabledTitle = isConnected ? undefined : 'Connect a wallet first'
  const hasConfidential = balances?.hasConfidential ?? false

  return (
    <div className="mt-3.5 flex gap-2 border-t border-line pt-3">
      <button
        className="btn-outline flex-1 py-2 text-xs"
        disabled={!isConnected}
        onClick={() => setFaucetOpen(true)}
        title={disabledTitle ?? 'Claim test tokens'}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v6m0 0 3-3m-3 3L9 5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 13h14l-1.5 7.5a2 2 0 0 1-2 1.5h-7a2 2 0 0 1-2-1.5L5 13Z" strokeLinejoin="round" />
        </svg>
        Faucet
      </button>

      <button
        className="btn-primary flex-1 py-2 text-xs"
        disabled={!isConnected || !pair.isValid}
        onClick={() => setWrapOpen(true)}
        title={!pair.isValid ? 'This pair is revoked' : disabledTitle ?? 'Wrap into the confidential token'}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2 4 6v6c0 5 3.4 7.7 8 10 4.6-2.3 8-5 8-10V6l-8-4Z" strokeLinejoin="round" />
        </svg>
        Wrap
      </button>

      <button
        className="btn-outline flex-1 py-2 text-xs"
        disabled={!isConnected || !hasConfidential}
        onClick={() => setUnwrapOpen(true)}
        title={
          !isConnected
            ? 'Connect a wallet first'
            : !hasConfidential
              ? `No ${pair.confidentialMeta.symbol} balance to unwrap`
              : 'Unwrap back to the public token'
        }
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M11 6 5 12l6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Unwrap
      </button>

      <FaucetDialog
        pair={pair}
        open={faucetOpen}
        onClose={() => setFaucetOpen(false)}
        onSuccess={onRefresh}
      />
      <WrapDialog
        pair={pair}
        open={wrapOpen}
        onClose={() => setWrapOpen(false)}
        onSuccess={onRefresh}
      />
      <UnwrapDialog
        pair={pair}
        balances={balances}
        open={unwrapOpen}
        onClose={() => setUnwrapOpen(false)}
        onSuccess={onRefresh}
      />
    </div>
  )
}
