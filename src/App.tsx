import { useChainId } from 'wagmi'
import { Header } from './components/Header'
import { NetworkBanner } from './components/NetworkBanner'
import { BrandMark } from './components/BrandMark'
import { RegistryGrid } from './components/registry/RegistryGrid'
import { DecryptPanel } from './components/decrypt/DecryptPanel'
import { REPO_URL, ZAMA_DOCS_URL, registryExplorerUrl } from './config/app'

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="bg-grain pointer-events-none absolute inset-0 opacity-70" />
      <div className="relative mx-auto max-w-6xl px-5 pb-10 pt-14 sm:pt-20">
        <div className="animate-fade-up max-w-3xl">
          <div className="pill mb-6 border-zama-yellow/60 bg-zama-soft-yellow">
            <span className="h-1.5 w-1.5 rounded-full bg-zama-yellow" />
            Official Zama Confidential Wrappers · Sepolia &amp; Mainnet
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

function Footer() {
  const chainId = useChainId()
  const links = [
    { label: 'Source', href: REPO_URL },
    { label: 'Registry docs', href: ZAMA_DOCS_URL },
    { label: 'Registry contract', href: registryExplorerUrl(chainId) },
  ]
  return (
    <footer className="mt-8 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
        <BrandMark size={30} />
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-ink-muted hover:text-ink"
            >
              {l.label} ↗
            </a>
          ))}
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-5 pb-8">
        <p className="text-xs text-ink-faint">
          Built on the official Zama Wrappers Registry · Not affiliated with Zama · Sepolia &amp; Ethereum mainnet
        </p>
      </div>
    </footer>
  )
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <NetworkBanner />
      <main className="flex-1">
        <Hero />
        <RegistryGrid />
        <DecryptPanel />
      </main>
      <Footer />
    </div>
  )
}
