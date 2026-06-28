import { useChainId } from 'wagmi'
import { shortAddress, explorerAddress } from '@/lib/format'
import { chainConfigOrDefault } from '@/config/chain'
import { CopyButton } from './CopyButton'

interface AddressChipProps {
  address: string
  label: string
}

/** A labelled, copyable, explorer-linked address row. */
export function AddressChip({ address, label }: AddressChipProps) {
  const chainId = useChainId()
  const explorerName =
    chainConfigOrDefault(chainId).chain.blockExplorers?.default.name ?? 'the explorer'
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-paper-soft px-2.5 py-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
        {label}
      </span>
      <div className="flex items-center gap-0.5">
        <a
          href={explorerAddress(address, chainId)}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-xs text-ink-muted underline-offset-2 hover:text-ink hover:underline"
          title={`View on ${explorerName}`}
        >
          {shortAddress(address, 5)}
        </a>
        <CopyButton value={address} label={label} />
      </div>
    </div>
  )
}
