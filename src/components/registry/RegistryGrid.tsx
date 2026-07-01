import { useMemo, useState } from 'react'
import { useAccount } from 'wagmi'
import { useRegistryPairs } from '@/hooks/useRegistryPairs'
import { useUserBalances } from '@/hooks/useUserBalances'
import { useActiveChain } from '@/hooks/useActiveChain'
import { AddPairModal } from '@/components/actions/AddPairModal'
import { DeployWrapperModal } from '@/components/actions/DeployWrapperModal'
import { PairCard } from './PairCard'

type SourceFilter = 'all' | 'registry' | 'community' | 'local'

function CardSkeleton() {
  return (
    <div className="card p-[18px]">
      <div className="flex items-center gap-3">
        <div className="h-[34px] w-16 animate-pulse rounded-full bg-paper-sunken" />
        <div className="space-y-2">
          <div className="h-3.5 w-32 animate-pulse rounded bg-paper-sunken" />
          <div className="h-2.5 w-24 animate-pulse rounded bg-paper-sunken" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-12 animate-pulse rounded-xl bg-paper-sunken" />
        <div className="h-9 animate-pulse rounded-lg bg-paper-sunken" />
      </div>
    </div>
  )
}

export function RegistryGrid() {
  const { isConnected } = useAccount()
  const { pairs, isLoading, isError, refetch, counts } = useRegistryPairs()
  const { balances, refetch: refetchBalances } = useUserBalances(pairs)
  const [query, setQuery] = useState('')
  const [source, setSource] = useState<SourceFilter>('all')
  const [showRevoked, setShowRevoked] = useState(true)
  const [spinning, setSpinning] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [deployOpen, setDeployOpen] = useState(false)
  const { config } = useActiveChain()

  const known = useMemo(
    () => new Set(pairs.map((p) => p.confidential.toLowerCase())),
    [pairs],
  )
  const knownErc20 = useMemo(
    () => new Set(pairs.map((p) => p.erc20.toLowerCase())),
    [pairs],
  )

  const hasRevoked = counts.total - counts.valid > 0
  const hasLocal = counts.local > 0
  const hasCommunity = counts.community > 0

  const chips: { key: SourceFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: counts.total },
    { key: 'registry', label: 'Registry', count: counts.registry },
    ...(hasCommunity ? [{ key: 'community' as const, label: 'Community', count: counts.community }] : []),
    ...(hasLocal ? [{ key: 'local' as const, label: 'Local', count: counts.local }] : []),
  ]

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return pairs.filter((p) => {
      if (source !== 'all' && p.source !== source) return false
      if (!showRevoked && !p.isValid) return false
      if (!q) return true
      return (
        p.erc20Meta.symbol.toLowerCase().includes(q) ||
        p.confidentialMeta.symbol.toLowerCase().includes(q) ||
        p.confidentialMeta.name.toLowerCase().includes(q) ||
        p.erc20.toLowerCase().includes(q) ||
        p.confidential.toLowerCase().includes(q)
      )
    })
  }, [pairs, query, source, showRevoked])

  function onRefresh() {
    setSpinning(true)
    refetch()
    setTimeout(() => setSpinning(false), 900)
  }

  return (
    <section id="registry" className="pb-5 pt-11">
      {/* Section header */}
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h2 className="font-display text-[30px] font-extrabold tracking-tight text-ink">
            The registry
          </h2>
          <p className="mt-2 text-sm text-ink-muted">
            Official ERC-20 ↔ ERC-7984 pairs, read live from the on-chain Wrappers Registry.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {config.factoryAddress && (
            <button
              onClick={() => setDeployOpen(true)}
              className="btn-primary px-3.5 py-2.5 text-[13px]"
            >
              ⚡ Deploy a wrapper
            </button>
          )}
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-[7px] rounded-[10px] border border-dashed border-line-dashed bg-paper-card px-3.5 py-2.5 text-[13px] font-bold text-ink-soft transition-colors hover:border-solid hover:border-ink"
          >
            ＋ Add a pair
          </button>
        </div>
      </div>

      <AddPairModal open={addOpen} onClose={() => setAddOpen(false)} known={known} />
      <DeployWrapperModal
        open={deployOpen}
        onClose={() => setDeployOpen(false)}
        onDeployed={refetch}
        knownErc20={knownErc20}
      />

      {/* Controls */}
      <div className="mt-[22px] flex flex-wrap items-center gap-3.5">
        <div className="flex gap-[7px]">
          {chips.map((c) => {
            const active = source === c.key
            return (
              <button
                key={c.key}
                onClick={() => setSource(c.key)}
                className={`rounded-full border px-3.5 py-[7px] font-mono text-xs font-semibold transition-colors ${
                  active
                    ? 'border-ink bg-ink text-white'
                    : 'border-line bg-paper-card text-ink-muted hover:border-ink/40'
                }`}
              >
                {c.label} {c.count}
              </button>
            )
          })}
          {hasRevoked && (
            <button
              onClick={() => setShowRevoked((v) => !v)}
              className={`rounded-full border px-3.5 py-[7px] font-mono text-xs font-semibold transition-colors ${
                showRevoked
                  ? 'border-line bg-paper-card text-ink-muted hover:border-ink/40'
                  : 'border-ink bg-ink text-white'
              }`}
              title="Toggle revoked pairs"
            >
              {showRevoked ? 'Hide revoked' : 'Show revoked'}
            </button>
          )}
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2.5">
          <div className="flex h-[42px] w-[280px] max-w-full items-center gap-2.5 rounded-[11px] border border-line bg-paper-card px-3.5 focus-within:border-ink">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#A8A294" strokeWidth="2" className="shrink-0">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" strokeLinecap="round" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search symbol or address"
              className="w-full bg-transparent font-mono text-[12.5px] text-ink outline-none placeholder:text-ink-dim"
            />
          </div>
          <button
            onClick={onRefresh}
            className="grid h-[42px] w-[42px] place-items-center rounded-[11px] border border-line bg-paper-card text-ink-muted transition-colors hover:border-ink hover:text-ink"
            title="Refresh from chain"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={spinning ? 'animate-spin' : ''}>
              <path d="M20 11a8 8 0 1 0-.6 4" strokeLinecap="round" />
              <path d="M20 4v6h-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* States */}
      {isError ? (
        <div className="mt-[22px] flex flex-col items-center gap-3 rounded-card border border-line bg-paper-card p-12 text-center">
          <p className="text-sm text-ink-muted">
            Couldn't read the registry. Check your network connection and RPC, then retry.
          </p>
          <button onClick={refetch} className="btn-primary">Retry</button>
        </div>
      ) : isLoading && pairs.length === 0 ? (
        <div className="mt-[22px] grid gap-[18px]" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(372px, 1fr))' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-[22px] rounded-card border border-dashed border-line-strong bg-paper-soft px-6 py-14 text-center">
          <div className="font-mono text-[13px] text-ink-faint">
            <span className="text-state-success">$</span> registry --search="{query}"
          </div>
          <div className="mt-3.5 text-base font-bold">No pairs match your search.</div>
          <div className="mt-1.5 text-[13px] text-ink-faint">
            Try a different symbol or address, or clear the filter.
          </div>
          <button onClick={() => { setQuery(''); setSource('all') }} className="btn-dark mt-[18px]">
            Clear search
          </button>
        </div>
      ) : (
        <div className="mt-[22px] grid gap-[18px]" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(372px, 1fr))' }}>
          {filtered.map((pair, i) => (
            <PairCard
              key={pair.confidential}
              pair={pair}
              balances={balances[pair.confidential.toLowerCase()]}
              isConnected={isConnected}
              onRefresh={refetchBalances}
              style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
            />
          ))}
        </div>
      )}
    </section>
  )
}
