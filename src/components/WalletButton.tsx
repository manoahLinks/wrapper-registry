import { ConnectButton } from '@rainbow-me/rainbowkit'

interface WalletButtonProps {
  /** Style for placement on the dark "confidential" surface. */
  onDark?: boolean
}

/**
 * A wallet connect / account / network control styled to the Zama brand.
 * Wraps RainbowKit's headless ConnectButton.Custom so we keep its modals
 * (wallet selection, account details, chain switching) but own the look.
 */
export function WalletButton({ onDark = false }: WalletButtonProps) {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, authenticationStatus, mounted }) => {
        const ready = mounted && authenticationStatus !== 'loading'
        const connected =
          ready && account && chain && (!authenticationStatus || authenticationStatus === 'authenticated')

        const chip = onDark
          ? 'border-white/15 bg-white/5 text-white hover:border-white/30'
          : 'border-line bg-paper-card text-ink hover:border-ink'

        return (
          <div
            className="flex items-center gap-2"
            {...(!ready && {
              'aria-hidden': true,
              style: { opacity: 0, pointerEvents: 'none', userSelect: 'none' as const },
            })}
          >
            {!connected ? (
              <button onClick={openConnectModal} className="btn-primary px-4 py-2 text-sm">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="5" width="20" height="14" rx="3" />
                  <path d="M16 12h2M2 10h20" strokeLinecap="round" />
                </svg>
                Connect wallet
              </button>
            ) : chain.unsupported ? (
              <button
                onClick={openChainModal}
                className="btn inline-flex items-center gap-1.5 rounded-[10px] border border-state-danger/50 bg-state-danger/5 px-3 py-2 text-sm font-semibold text-state-danger hover:bg-state-danger/10"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-state-danger" />
                Wrong network
              </button>
            ) : (
              <>
                {/* Network selector */}
                <button
                  onClick={openChainModal}
                  className={`inline-flex items-center gap-1.5 rounded-[10px] border px-2.5 py-2 text-[12.5px] font-bold transition-colors ${chip}`}
                  title="Switch network"
                >
                  {chain.hasIcon && (
                    <span
                      className="grid h-4 w-4 place-items-center overflow-hidden rounded-full"
                      style={{ background: chain.iconBackground }}
                    >
                      {chain.iconUrl && (
                        <img alt={chain.name ?? 'Chain'} src={chain.iconUrl} className="h-4 w-4" />
                      )}
                    </span>
                  )}
                  <span className="hidden sm:inline">{chain.name}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-50">
                    <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {/* Account */}
                <button
                  onClick={openAccountModal}
                  className={`inline-flex items-center gap-2 rounded-[10px] border px-2.5 py-2 text-sm font-medium transition-colors ${chip}`}
                  title="Account details"
                >
                  <span className="h-5 w-5 rounded-full bg-gradient-to-br from-zama-yellow to-zama-orange" />
                  <span className="tabular font-mono text-xs">{account.displayName}</span>
                </button>
              </>
            )}
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}
