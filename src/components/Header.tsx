import { BrandMark } from './BrandMark'
import { FhevmStatusPill } from './FhevmStatusPill'
import { WalletButton } from './WalletButton'

import { REPO_URL } from '@/config/app'

const NAV = [
  { label: 'Registry', href: '#registry', external: false },
  { label: 'Decrypt', href: '#decrypt', external: false },
  { label: 'Docs', href: REPO_URL, external: true },
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
                {...(item.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-paper-sunken hover:text-ink"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex">
            <FhevmStatusPill />
          </span>
          <WalletButton />
        </div>
      </div>
    </header>
  )
}
