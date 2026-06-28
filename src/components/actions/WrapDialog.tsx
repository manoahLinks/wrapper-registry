import { useMemo, useState } from 'react'
import { useAccount, useChainId, useReadContracts } from 'wagmi'
import { Modal } from '@/components/ui/Modal'
import { AmountField } from '@/components/ui/AmountField'
import { TokenGlyph } from '@/components/ui/TokenGlyph'
import { useTxRunner } from '@/hooks/useTxRunner'
import { useToast } from '@/components/ui/Toast'
import { parseTxError } from '@/lib/errors'
import { erc20Abi } from '@/abi/erc20'
import { wrapperAbi } from '@/abi/wrapper'
import { safeParseUnits, formatUnits, wrapPreview } from '@/lib/amount'
import { formatAmount } from '@/lib/format'
import type { EnrichedPair } from '@/types'

interface WrapDialogProps {
  pair: EnrichedPair
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function WrapDialog({ pair, open, onClose, onSuccess }: WrapDialogProps) {
  const { address } = useAccount()
  const chainId = useChainId()
  const { run, isBusy } = useTxRunner()
  const toast = useToast()
  const [amount, setAmount] = useState('')

  const erc20 = pair.erc20Meta
  const conf = pair.confidentialMeta
  const rate = pair.rate ?? 1n

  // Live balance + allowance for the connected wallet.
  const { data, refetch } = useReadContracts({
    contracts: [
      { address: erc20.address, abi: erc20Abi, functionName: 'balanceOf', args: address ? [address] : undefined },
      {
        address: erc20.address,
        abi: erc20Abi,
        functionName: 'allowance',
        args: address ? [address, conf.address] : undefined,
      },
    ],
    query: { enabled: open && !!address },
  })
  const balance = (data?.[0]?.result as bigint | undefined) ?? 0n
  const allowance = (data?.[1]?.result as bigint | undefined) ?? 0n

  const amountRaw = useMemo(() => safeParseUnits(amount, erc20.decimals), [amount, erc20.decimals])
  const { confidentialRaw, dustRaw } = useMemo(() => wrapPreview(amountRaw, rate), [amountRaw, rate])

  const needsApproval = amountRaw > allowance
  const overBalance = amountRaw > balance
  const belowMin = amountRaw > 0n && confidentialRaw === 0n
  const invalid = amountRaw === 0n || overBalance || belowMin

  const minHuman = formatUnits(rate, erc20.decimals)
  const receiveDisplay = formatAmount(confidentialRaw, conf.decimals, 6)

  async function submit() {
    if (!address || invalid) return

    if (needsApproval) {
      const id = toast.push({
        kind: 'pending',
        title: `Approve ${erc20.symbol}`,
        description: 'Confirm the approval in your wallet…',
      })
      try {
        const { hash } = await run({
          address: erc20.address,
          abi: erc20Abi,
          functionName: 'approve',
          args: [conf.address, amountRaw],
          chainId,
        })
        toast.update(id, { kind: 'success', title: `${erc20.symbol} approved`, txHash: hash })
      } catch (e) {
        toast.update(id, { kind: 'error', title: 'Approval failed', description: parseTxError(e) })
        return
      }
    }

    const id = toast.push({
      kind: 'pending',
      title: `Wrapping ${erc20.symbol}`,
      description: 'Confirm the wrap in your wallet…',
    })
    try {
      const { hash } = await run({
        address: conf.address,
        abi: wrapperAbi,
        functionName: 'wrap',
        args: [address, amountRaw],
        chainId,
      })
      toast.update(id, {
        kind: 'success',
        title: `Wrapped into ${conf.symbol}`,
        description: `Received ~${receiveDisplay} ${conf.symbol} (encrypted).`,
        txHash: hash,
      })
      void refetch()
      onSuccess?.()
      onClose()
      setAmount('')
    } catch (e) {
      toast.update(id, { kind: 'error', title: 'Wrap failed', description: parseTxError(e) })
    }
  }

  const primaryLabel = isBusy
    ? 'Working…'
    : needsApproval && amountRaw > 0n
      ? `Approve & Wrap`
      : `Wrap ${erc20.symbol}`

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Wrap ${erc20.symbol}`}
      subtitle={`Convert public ${erc20.symbol} into confidential ${conf.symbol}.`}
    >
      {/* Conversion visual */}
      <div className="mb-4 flex items-center justify-between gap-2 rounded-card bg-paper-soft p-3">
        <div className="flex items-center gap-2">
          <TokenGlyph symbol={erc20.symbol} address={erc20.address} size={32} />
          <div className="text-sm font-bold text-ink">{erc20.symbol}</div>
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-faint">
          <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="flex items-center gap-2">
          <TokenGlyph symbol={conf.symbol} address={conf.address} size={32} confidential />
          <div className="flex items-center gap-1 text-sm font-bold text-ink">
            {conf.symbol}
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="text-ink-faint">
              <path d="M17 10V7a5 5 0 0 0-10 0v3H5v12h14V10h-2zM9 7a3 3 0 0 1 6 0v3H9V7z" />
            </svg>
          </div>
        </div>
      </div>

      <AmountField
        value={amount}
        onChange={setAmount}
        symbol={erc20.symbol}
        autoFocus
        onMax={() => setAmount(formatUnits(balance, erc20.decimals))}
        hint={
          overBalance ? (
            <span className="text-state-danger">Exceeds your balance.</span>
          ) : belowMin ? (
            <span className="text-state-danger">Minimum {minHuman} {erc20.symbol}.</span>
          ) : (
            <>Balance: <span className="tabular font-medium text-ink">{formatAmount(balance, erc20.decimals)}</span> {erc20.symbol}</>
          )
        }
      />

      {/* Receive preview */}
      <div className="mt-3 flex items-center justify-between rounded-lg border border-line bg-paper-card px-3.5 py-2.5">
        <span className="text-xs text-ink-muted">You receive</span>
        <span className="font-mono text-sm font-semibold text-ink">
          ~{receiveDisplay} {conf.symbol}
        </span>
      </div>
      {dustRaw > 0n && (
        <p className="mt-1.5 text-xs text-ink-faint">
          {formatAmount(dustRaw, erc20.decimals, 6)} {erc20.symbol} below the wrap increment
          will be left in your wallet.
        </p>
      )}

      {needsApproval && amountRaw > 0n && !overBalance && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-muted">
          <span className="grid h-4 w-4 place-items-center rounded-full bg-zama-soft-yellow text-[10px] font-bold">1</span>
          Approve, then
          <span className="grid h-4 w-4 place-items-center rounded-full bg-zama-soft-yellow text-[10px] font-bold">2</span>
          wrap — two wallet confirmations.
        </p>
      )}

      <div className="mt-5 flex gap-2">
        <button className="btn-ghost flex-1" onClick={onClose} disabled={isBusy}>
          Cancel
        </button>
        <button className="btn-primary flex-1" onClick={submit} disabled={invalid || isBusy}>
          {primaryLabel}
        </button>
      </div>
    </Modal>
  )
}
