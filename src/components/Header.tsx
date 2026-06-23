import { ConnectButton } from '@rainbow-me/rainbowkit'
import { BrandMark } from './BrandMark'

const NAV = [
  { label: 'Registry', href: '#registry' },
  { label: 'Decrypt', href: '#decrypt' },
  { label: 'Docs', href: '#docs' },
]

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <div className="flex items-center gap-8">
          <a href="#top" className="shrink-0">
            <BrandMark />
          </a>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-paper-sunken hover:text-ink"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://docs.zama.org/protocol/protocol-apps/registry-contract"
            target="_blank"
            rel="noreferrer"
            className="pill hidden hover:border-ink/30 sm:inline-flex"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-state-success" />
            Sepolia
          </a>
          <ConnectButton
            showBalance={false}
            accountStatus={{ smallScreen: 'avatar', largeScreen: 'full' }}
            chainStatus="icon"
          />
        </div>
      </div>
    </header>
  )
}
