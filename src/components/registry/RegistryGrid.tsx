import { useMemo, useState } from 'react'
import { useAccount } from 'wagmi'
import { useRegistryPairs } from '@/hooks/useRegistryPairs'
import { useUserBalances } from '@/hooks/useUserBalances'
import { PairCard } from './PairCard'

function StatPill({ label, value }: { label: string; value: number | string }) {
  return (
    <span className="pill">
      <span className="tabular font-bold text-ink">{value}</span>
      <span className="text-ink-faint">{label}</span>
    </span>
  )
}

function CardSkeleton() {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2">
        <div className="h-9 w-16 animate-pulse rounded-full bg-paper-sunken" />
        <div className="space-y-1.5">
          <div className="h-3.5 w-28 animate-pulse rounded bg-paper-sunken" />
          <div className="h-2.5 w-20 animate-pulse rounded bg-paper-sunken" />
        </div>
      </div>
      <div className="mt-4 space-y-1.5">
        <div className="h-8 animate-pulse rounded-lg bg-paper-sunken" />
        <div className="h-8 animate-pulse rounded-lg bg-paper-sunken" />
      </div>
    </div>
  )
}

export function RegistryGrid() {
  const { isConnected } = useAccount()
  const { pairs, isLoading, isError, refetch, counts } = useRegistryPairs()
  const { balances, refetch: refetchBalances } = useUserBalances(pairs)
  const [query, setQuery] = useState('')
  const [showRevoked, setShowRevoked] = useState(true)

  const hasRevoked = counts.total - counts.valid > 0

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return pairs.filter((p) => {
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
  }, [pairs, query, showRevoked])

  return (
    <section id="registry" className="mx-auto max-w-6xl px-5 py-10">
      {/* Section header */}
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
            The registry
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Official ERC-20 ↔ ERC-7984 pairs, read live from the on-chain Wrappers Registry.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatPill label="pairs" value={counts.total} />
            <StatPill label="from registry" value={counts.registry} />
            {counts.local > 0 && <StatPill label="local" value={counts.local} />}
            <StatPill label="active" value={counts.valid} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" strokeLinecap="round" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search symbol or address"
              className="w-full rounded-[10px] border border-line-strong bg-paper-card py-2 pl-9 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-ink/30 sm:w-64"
            />
          </div>
          {hasRevoked && (
            <button
              onClick={() => setShowRevoked((v) => !v)}
              className={`btn px-3 py-2 text-xs ${
                showRevoked ? 'btn-outline' : 'btn-dark'
              }`}
              title="Toggle revoked pairs"
            >
              {showRevoked ? 'Hide revoked' : 'Show revoked'}
            </button>
          )}
          <button onClick={refetch} className="btn-outline px-3 py-2" title="Refresh">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* States */}
      {isError ? (
        <div className="card flex flex-col items-center gap-3 p-10 text-center">
          <p className="text-sm text-ink-muted">
            Couldn't read the registry. Check your network connection and RPC, then retry.
          </p>
          <button onClick={refetch} className="btn-primary">
            Retry
          </button>
        </div>
      ) : isLoading && pairs.length === 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center text-sm text-ink-muted">
          No pairs match "{query}".
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
