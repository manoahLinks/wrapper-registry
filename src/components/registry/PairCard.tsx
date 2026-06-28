import { TokenGlyph } from '@/components/ui/TokenGlyph'
import { CopyButton } from '@/components/ui/CopyButton'
import { ConfidentialBalance } from '@/components/ConfidentialBalance'
import { PairActions } from './PairActions'
import { formatAmount, shortAddress, explorerAddress } from '@/lib/format'
import { useChainId } from 'wagmi'
import type { EnrichedPair } from '@/types'
import type { PairBalances } from '@/hooks/useUserBalances'

interface PairCardProps {
  pair: EnrichedPair
  balances?: PairBalances
  isConnected: boolean
  onRefresh?: () => void
  style?: React.CSSProperties
}

function Badge({ tone, children }: { tone: 'registry' | 'local' | 'danger' | 'warn'; children: React.ReactNode }) {
  const map = {
    registry: 'border-zama-yellow bg-zama-soft-yellow text-ink',
    local: 'border-line bg-paper-soft text-ink-muted',
    danger: 'border-state-danger/40 bg-state-danger/5 text-state-danger',
    warn: 'border-state-warn/50 bg-zama-soft-orange text-ink-soft',
  } as const
  return (
    <span className={`whitespace-nowrap rounded-md border px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.1em] ${map[tone]}`}>
      {children}
    </span>
  )
}

function AddressRow({ label, address, chainId }: { label: string; address: string; chainId: number }) {
  return (
    <div className="flex items-center justify-between px-3.5 py-[11px]">
      <span className="font-mono text-[11px] tracking-[0.03em] text-ink-faint">{label}</span>
      <div className="flex items-center gap-1">
        <a
          href={explorerAddress(address, chainId)}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-xs font-medium text-ink-soft underline-offset-2 hover:text-ink hover:underline"
        >
          {shortAddress(address, 5)}
        </a>
        <CopyButton value={address} label={label} />
      </div>
    </div>
  )
}

export function PairCard({ pair, balances, isConnected, onRefresh, style }: PairCardProps) {
  const { erc20Meta, confidentialMeta, isValid, source, metaDegraded, rate } = pair
  const chainId = useChainId()

  return (
    <div
      className={`card flex animate-fade-up flex-col p-[18px] transition-all duration-200 hover:-translate-y-[3px] hover:border-line-strong hover:shadow-lift ${
        !isValid ? 'opacity-75' : ''
      }`}
      style={style}
    >
      {/* Header: avatars + ERC-20 → ERC-7984 + badge */}
      <div className="flex items-start gap-3">
        <div className="flex shrink-0 items-center -space-x-[11px]">
          <span className="rounded-full ring-1 ring-paper-card">
            <TokenGlyph symbol={erc20Meta.symbol} address={erc20Meta.address} size={34} />
          </span>
          <span className="rounded-full ring-1 ring-paper-card">
            <TokenGlyph symbol={confidentialMeta.symbol} address={confidentialMeta.address} size={34} confidential />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-mono text-sm font-bold tracking-tight">
            {erc20Meta.symbol} <span className="text-line-dashed">→</span> {confidentialMeta.symbol}
          </div>
          <div className="mt-[3px] truncate text-xs text-ink-faint" title={confidentialMeta.name}>
            {confidentialMeta.name}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge tone={source}>{source === 'registry' ? 'Registry' : 'Local'}</Badge>
          {!isValid && <Badge tone="danger">Revoked</Badge>}
          {metaDegraded && <Badge tone="warn">Limited</Badge>}
        </div>
      </div>

      {/* Addresses */}
      <div className="mt-[15px] overflow-hidden rounded-[11px] border border-line bg-paper-soft">
        <AddressRow label="ERC-20" address={erc20Meta.address} chainId={chainId} />
        <div className="h-px bg-line" />
        <AddressRow label="ERC-7984" address={confidentialMeta.address} chainId={chainId} />
      </div>

      {/* Meta row */}
      <div className="mt-[13px] flex items-center gap-4 text-xs">
        <span className="text-ink-faint">
          Decimals <span className="font-mono font-semibold text-ink-soft">{confidentialMeta.decimals}</span>
        </span>
        {rate != null && rate > 1n && (
          <span className="text-ink-faint">
            Rate <span className="font-mono font-semibold text-ink-soft">{rate.toString()}</span>
          </span>
        )}
      </div>

      {/* Balances (when connected) */}
      {isConnected && (
        <div className="mt-3.5 grid grid-cols-2 gap-0 border-t border-line pt-3.5">
          <div>
            <div className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-dim">
              {erc20Meta.symbol} balance
            </div>
            <div className="mt-1.5 font-mono text-[19px] font-bold tracking-tight text-ink">
              {balances ? formatAmount(balances.erc20, erc20Meta.decimals) : '—'}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-dim">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="9" rx="1.5" stroke="#A8A294" strokeWidth="2.2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="#A8A294" strokeWidth="2.2" /></svg>
              {confidentialMeta.symbol} balance
            </div>
            <div className="mt-1.5 flex min-h-[24px] items-center">
              {balances ? (
                <ConfidentialBalance
                  contract={confidentialMeta.address}
                  handle={balances.confidentialHandle}
                  decimals={confidentialMeta.decimals}
                  symbol={confidentialMeta.symbol}
                  hasBalance={balances.hasConfidential}
                />
              ) : (
                <span className="font-mono text-[19px] font-bold text-ink">—</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Spacer pushes actions to the bottom for equal-height cards */}
      <div className="flex-1" />
      <PairActions pair={pair} balances={balances} onRefresh={onRefresh} />
    </div>
  )
}
