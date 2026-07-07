import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useActiveChain } from '@/hooks/useActiveChain'
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
  const { config } = useActiveChain()
  const [faucetOpen, setFaucetOpen] = useState(false)
  const [wrapOpen, setWrapOpen] = useState(false)
  const [unwrapOpen, setUnwrapOpen] = useState(false)

  const disabledTitle = isConnected ? undefined : 'Connect a wallet first'
  const hasConfidential = balances?.hasConfidential ?? false

  // The mintable faucet only exists on testnets (mock ERC-20s). On mainnet the
  // underlying tokens are real, so we drop the column and widen the rest.
  const showFaucet = config.hasFaucet
  const gridCols = showFaucet ? 'grid-cols-3' : 'grid-cols-2'

  return (
    <div className={`mt-3.5 grid ${gridCols} gap-2 border-t border-line pt-3`}>
      {showFaucet && (
        <button
          className="btn-outline w-full px-2 py-2 text-xs"
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
      )}

      <button
        className="btn-primary w-full px-2 py-2 text-xs"
        disabled={!isConnected || !pair.isValid}
        onClick={() => setWrapOpen(true)}
        title={!pair.isValid ? 'This pair is revoked' : disabledTitle ?? 'Shield into the confidential token'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="6" y="3" width="12" height="18" rx="6" />
          <path d="M6 9c4 0 8 2 12 4" />
          <path d="M6 14c4 0 8-2 12-2" />
          <line x1="9" y1="6" x2="10" y2="6" />
          <line x1="14" y1="18" x2="15" y2="18" />
        </svg>

        Wrap
      </button>

      <button
        className="btn-outline w-full px-2 py-2 text-xs"
        disabled={!isConnected || !hasConfidential}
        onClick={() => setUnwrapOpen(true)}
        title={
          !isConnected
            ? 'Connect a wallet first'
            : !hasConfidential
              ? `No ${pair.confidentialMeta.symbol} balance to unshield`
              : 'Unshield back to the public token'
        }
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12c0 5 4 9 9 9s9-4 9-9H3z" />
          <path d="M5 12c1-2 2-3 4-3s3 2 3 2 1-3 3-3 3 2 4 4" />
          <circle cx="10" cy="11" r="1" fill="currentColor" />
          <circle cx="14" cy="10" r="1" fill="currentColor" />
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
