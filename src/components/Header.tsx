import { BrandMark } from './BrandMark'
import { FhevmStatusPill } from './FhevmStatusPill'
import { WalletButton } from './WalletButton'

const NAV = [
  { label: 'Registry', href: '#registry' },
  { label: 'Decrypt', href: '#decrypt' },
]

const navClass =
  'rounded-lg px-3 py-2 text-[13.5px] font-semibold text-ink-muted transition-colors hover:bg-paper-sunken hover:text-ink'

export function Header({ onOpenDocs }: { onOpenDocs: () => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/[0.86] backdrop-blur-md">
      <div className="mx-auto flex h-[66px] max-w-[1240px] items-center gap-3 px-4 sm:gap-6 sm:px-7">
        <a href="#top" className="shrink-0">
          <BrandMark />
        </a>
        <nav className="ml-2.5 hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <a key={item.label} href={item.href} className={navClass}>
              {item.label}
            </a>
          ))}
          <button onClick={onOpenDocs} className={navClass}>
            Docs
          </button>
        </nav>

        <div className="flex-1" />

        <div className="flex items-center gap-2.5">
          <span className="hidden sm:inline-flex">
            <FhevmStatusPill />
          </span>
          <WalletButton />
        </div>
      </div>
    </header>
  )
}
