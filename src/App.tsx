import { Header } from './components/Header'
import { BrandMark } from './components/BrandMark'

const FEATURES = [
  {
    k: 'browse',
    title: 'Browse the registry',
    body: 'Every official ERC-20 ↔ ERC-7984 pair, read straight from the on-chain Wrappers Registry — with live token metadata.',
  },
  {
    k: 'faucet',
    title: 'Claim test tokens',
    body: 'Mint the official cTokenMock ERC-20s on Sepolia and try the full flow in seconds. No external faucet required.',
  },
  {
    k: 'wrap',
    title: 'Wrap & unwrap',
    body: 'Convert any registry ERC-20 into its confidential equivalent and back, with approvals and rate handling done for you.',
  },
  {
    k: 'decrypt',
    title: 'Decrypt balances',
    body: 'Reveal your own ERC-7984 balance for any token — registered or not — via the EIP-712 user-decryption flow.',
  },
]

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="bg-grain pointer-events-none absolute inset-0 opacity-70" />
      <div className="relative mx-auto max-w-6xl px-5 pb-14 pt-16 sm:pt-24">
        <div className="animate-fade-up max-w-3xl">
          <div className="pill mb-6 border-zama-yellow/60 bg-zama-soft-yellow">
            <span className="h-1.5 w-1.5 rounded-full bg-zama-yellow" />
            Official Zama Confidential Wrappers · Sepolia
          </div>
          <h1 className="font-display text-4xl font-bold leading-[1.04] tracking-tight text-ink sm:text-6xl">
            Confidential tokens,
            <br />
            <span className="relative inline-block">
              <span className="relative z-10">made usable.</span>
              <span className="absolute inset-x-0 bottom-1 z-0 h-3 bg-zama-yellow/70 sm:bottom-2 sm:h-4" />
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
            One home for the canonical ERC-20 ↔ ERC-7984 pairs. Browse the registry,
            claim test tokens, wrap into encrypted balances, and decrypt what's yours —
            all in one place.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#registry" className="btn-primary">
              Open the registry
            </a>
            <a href="#decrypt" className="btn-outline">
              Decrypt a balance
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

function FeatureGrid() {
  return (
    <section id="registry" className="mx-auto max-w-6xl px-5 py-12">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f, i) => (
          <div
            key={f.k}
            className="card animate-fade-up p-5"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="mb-3 grid h-8 w-8 place-items-center rounded-lg bg-zama-soft-yellow text-ink">
              <span className="text-sm font-bold tabular">{i + 1}</span>
            </div>
            <h3 className="font-display text-base font-bold tracking-tight text-ink">
              {f.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{f.body}</p>
          </div>
        ))}
      </div>

      <div className="surface-cipher mt-3 flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zama-yellow">
            Coming together
          </p>
          <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-white/70">
            The live registry table, faucet, wrap/unwrap panel and decryption flow are
            being wired in. The scaffold, wallet connection and design system are ready.
          </p>
        </div>
        <div className="font-mono text-xs text-white/50">phase 1 / 11</div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="mt-8 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-5 py-8 sm:flex-row sm:items-center">
        <BrandMark size={30} />
        <p className="text-xs text-ink-faint">
          Built on the official Zama Wrappers Registry · Not affiliated with Zama ·
          Sepolia testnet
        </p>
      </div>
    </footer>
  )
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <FeatureGrid />
      </main>
      <Footer />
    </div>
  )
}
