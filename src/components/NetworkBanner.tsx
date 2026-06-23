import { useAccount, useSwitchChain } from 'wagmi'
import { APP_CHAIN, APP_CHAIN_ID } from '@/config/chain'

/**
 * Shown only when a wallet is connected to a chain other than Sepolia.
 * Offers a one-click switch and otherwise gates the app's write actions.
 */
export function NetworkBanner() {
  const { isConnected, chainId } = useAccount()
  const { switchChain, isPending } = useSwitchChain()

  if (!isConnected || chainId === APP_CHAIN_ID) return null

  return (
    <div className="border-b border-state-danger/25 bg-state-danger/[0.06]">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 px-5 py-2.5 sm:flex-row sm:items-center">
        <p className="text-sm text-ink">
          <span className="font-semibold text-state-danger">Wrong network.</span> This
          app runs on <span className="font-semibold">Sepolia</span> — switch to continue.
        </p>
        <button
          className="btn-dark py-1.5 text-xs"
          disabled={isPending}
          onClick={() => switchChain({ chainId: APP_CHAIN_ID })}
        >
          {isPending ? 'Switching…' : `Switch to ${APP_CHAIN.name}`}
        </button>
      </div>
    </div>
  )
}
