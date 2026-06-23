import { useState } from 'react'
import { useAccount } from 'wagmi'
import { FaucetDialog } from '@/components/actions/FaucetDialog'
import type { EnrichedPair } from '@/types'

interface PairActionsProps {
  pair: EnrichedPair
  /** Refetch balances after a successful action. */
  onRefresh?: () => void
}

/**
 * The per-pair action bar. Actions are added phase by phase:
 * Faucet (now), Wrap / Unwrap / Decrypt (upcoming).
 */
export function PairActions({ pair, onRefresh }: PairActionsProps) {
  const { isConnected } = useAccount()
  const [faucetOpen, setFaucetOpen] = useState(false)

  return (
    <div className="mt-3.5 flex gap-2 border-t border-line pt-3">
      <button
        className="btn-outline flex-1 py-2 text-xs"
        disabled={!isConnected}
        onClick={() => setFaucetOpen(true)}
        title={isConnected ? 'Claim test tokens' : 'Connect a wallet to claim'}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v6m0 0 3-3m-3 3L9 5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 13h14l-1.5 7.5a2 2 0 0 1-2 1.5h-7a2 2 0 0 1-2-1.5L5 13Z" strokeLinejoin="round" />
        </svg>
        Faucet
      </button>

      <FaucetDialog
        pair={pair}
        open={faucetOpen}
        onClose={() => setFaucetOpen(false)}
        onSuccess={onRefresh}
      />
    </div>
  )
}
