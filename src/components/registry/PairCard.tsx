import { TokenGlyph } from '@/components/ui/TokenGlyph'
import { AddressChip } from '@/components/ui/AddressChip'
import { formatAmount } from '@/lib/format'
import type { EnrichedPair } from '@/types'
import type { PairBalances } from '@/hooks/useUserBalances'

interface PairCardProps {
  pair: EnrichedPair
  balances?: PairBalances
  isConnected: boolean
  style?: React.CSSProperties
}

function Badge({ tone, children }: { tone: 'registry' | 'local' | 'danger' | 'warn'; children: React.ReactNode }) {
  const map = {
    registry: 'border-zama-yellow/60 bg-zama-soft-yellow text-ink',
    local: 'border-line-strong bg-paper-soft text-ink-muted',
    danger: 'border-state-danger/40 bg-state-danger/5 text-state-danger',
    warn: 'border-state-warn/50 bg-zama-soft-orange text-ink-soft',
  } as const
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${map[tone]}`}>
      {children}
    </span>
  )
}

export function PairCard({ pair, balances, isConnected, style }: PairCardProps) {
  const { erc20Meta, confidentialMeta, isValid, source, metaDegraded, rate } = pair

  return (
    <div
      className={`card animate-fade-up flex flex-col p-4 transition-shadow hover:shadow-pop ${
        !isValid ? 'opacity-75' : ''
      }`}
      style={style}
    >
      {/* Header: ERC-20 → ERC-7984 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center -space-x-2">
            <TokenGlyph symbol={erc20Meta.symbol} address={erc20Meta.address} />
            <TokenGlyph symbol={confidentialMeta.symbol} address={confidentialMeta.address} confidential />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5 font-display text-[15px] font-bold tracking-tight text-ink">
              {erc20Meta.symbol}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-ink-faint">
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {confidentialMeta.symbol}
            </div>
            <div className="truncate text-xs text-ink-muted" title={confidentialMeta.name}>
              {confidentialMeta.name}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge tone={source}>{source === 'registry' ? 'Registry' : 'Local'}</Badge>
          {!isValid && <Badge tone="danger">Revoked</Badge>}
          {metaDegraded && <Badge tone="warn">Limited metadata</Badge>}
        </div>
      </div>

      {/* Addresses */}
      <div className="mt-3.5 space-y-1.5">
        <AddressChip address={erc20Meta.address} label="ERC-20" />
        <AddressChip address={confidentialMeta.address} label="ERC-7984" />
      </div>

      {/* Meta row */}
      <div className="mt-3 flex items-center gap-4 text-[11px] text-ink-faint">
        <span>
          Decimals <span className="tabular font-medium text-ink-muted">{confidentialMeta.decimals}</span>
        </span>
        {rate != null && rate > 1n && (
          <span>
            Rate <span className="tabular font-medium text-ink-muted">{rate.toString()}</span>
          </span>
        )}
      </div>

      {/* Balances (when connected) */}
      {isConnected && (
        <div className="mt-3.5 grid grid-cols-2 gap-2 border-t border-line pt-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
              {erc20Meta.symbol} balance
            </div>
            <div className="tabular mt-0.5 font-mono text-sm text-ink">
              {balances ? formatAmount(balances.erc20, erc20Meta.decimals) : '—'}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 10V7a5 5 0 0 0-10 0v3H5v12h14V10h-2zM9 7a3 3 0 0 1 6 0v3H9V7z" />
              </svg>
              {confidentialMeta.symbol} balance
            </div>
            <div className="mt-0.5 font-mono text-sm">
              {balances?.hasConfidential ? (
                <span className="cipher-text font-semibold tracking-widest">••••••</span>
              ) : (
                <span className="tabular text-ink">0</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
