import { useChainId } from 'wagmi'
import { Header } from './components/Header'
import { NetworkBanner } from './components/NetworkBanner'
import { WrapLoop } from './components/WrapLoop'
import { RegistryGrid } from './components/registry/RegistryGrid'
import { DecryptPanel } from './components/decrypt/DecryptPanel'
import { useRegistryPairs } from './hooks/useRegistryPairs'
import { shortAddress } from './lib/format'
import { useActiveChain } from './hooks/useActiveChain'
import { REPO_URL, ZAMA_DOCS_URL, registryExplorerUrl } from './config/app'

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 font-mono text-[26px] font-bold tracking-tight">{value}</div>
      <div className="mt-1 font-mono text-[11px] tracking-[0.04em] text-ink-faint">{label}</div>
    </div>
  )
}

function Hero() {
  const { counts } = useRegistryPairs()

  return (
    <section className="pb-[30px] pt-[58px]">
      <div className="grid items-center gap-11 lg:grid-cols-[1.04fr_0.96fr]">
        <div className="animate-fade-up">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-line bg-paper-card px-3.5 py-[7px] text-xs font-semibold text-ink-soft">
            <span className="grid h-[13px] w-[13px] place-items-center rounded bg-zama-yellow">
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-11" stroke="#0B0B0C" strokeWidth="3" /></svg>
            </span>
            Official Zama Confidential Wrappers · Sepolia &amp; Mainnet
          </div>

          <h1
            className="mt-6 max-w-[12ch] font-display font-black"
            style={{ fontSize: 'clamp(46px, 4.6vw, 72px)', lineHeight: 0.96, letterSpacing: '-0.035em' }}
          >
            Confidential tokens,
            <br />
            <span
              style={{
                backgroundImage:
                  'linear-gradient(180deg, transparent 56%, #FFD000 56%, #FFD000 94%, transparent 94%)',
                padding: '0 2px',
                WebkitBoxDecorationBreak: 'clone',
                boxDecorationBreak: 'clone',
              }}
            >
              made usable.
            </span>
          </h1>

          <p className="mt-[26px] max-w-[52ch] text-[17px] leading-[1.55] text-ink-muted">
            One home for the canonical ERC-20 ↔ ERC-7984 pairs. Browse the registry, claim test
            tokens, shield into encrypted balances, and decrypt what's yours — all in one place.
          </p>

          <div className="mt-[30px] flex flex-wrap items-center gap-3">
            <a href="#registry" className="btn-brutal px-[22px] py-3.5 text-[15px]">
              Open the registry<span className="text-base">→</span>
            </a>
            <a
              href="#decrypt"
              className="btn px-[22px] py-3.5 text-[15px] font-bold border border-ink bg-paper-card text-ink hover:bg-ink hover:text-white"
            >
              Decrypt a balance
            </a>
          </div>

          <div className="mt-11 flex gap-[30px] font-mono">
            <Stat value={counts.total || '—'} label="registry pairs" />
            <div className="w-px bg-line" />
            <Stat value="ERC-7984" label="confidential standard" />
            <div className="w-px bg-line" />
            <Stat
              value={
                <>
                  <span className="h-2 w-2 rounded-full bg-state-success animate-pulse-soft" />
                  live
                </>
              }
              label="read from on-chain registry"
            />
          </div>
        </div>

        <div className="min-w-0">
          <WrapLoop sym="USDC" csym="cUSDC" chrome />
        </div>
      </div>
    </section>
  )
}

function Footer() {
  const chainId = useChainId()
  const { registryAddress, config } = useActiveChain()
  return (
    <footer className="mt-14 flex flex-wrap items-center gap-5 border-t border-line py-[18px] pb-10 font-mono text-[11px] text-ink-faint">
      <span className="inline-flex items-center gap-[7px]">
        <span className="h-[7px] w-[7px] rounded-full bg-state-success" />
        live · {config.chain.name.toLowerCase()}
      </span>
      <a href={registryExplorerUrl(chainId)} target="_blank" rel="noreferrer" className="hover:text-ink">
        registry {shortAddress(registryAddress)}
      </a>
      <a href={REPO_URL} target="_blank" rel="noreferrer" className="hover:text-ink">source ↗</a>
      <a href={ZAMA_DOCS_URL} target="_blank" rel="noreferrer" className="hover:text-ink">docs ↗</a>
      <span className="flex-1" />
      <span>FHEVM relayer · connected</span>
    </footer>
  )
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <NetworkBanner />
      <main className="mx-auto w-full max-w-[1240px] flex-1 px-7">
        <Hero />
        <RegistryGrid />
        <DecryptPanel />
      </main>
      <div className="mx-auto w-full max-w-[1240px] px-7">
        <Footer />
      </div>
    </div>
  )
}
