import { useMemo, useState } from 'react'
import { useAccount, useChainId, useReadContracts } from 'wagmi'
import { Modal } from '@/components/ui/Modal'
import { useTxRunner } from '@/hooks/useTxRunner'
import { useToast } from '@/components/ui/Toast'
import { parseTxError } from '@/lib/errors'
import { erc20Abi } from '@/abi/erc20'
import { wrapperAbi } from '@/abi/wrapper'
import { safeParseUnits, formatUnits, wrapPreview } from '@/lib/amount'
import { formatAmount, explorerTx } from '@/lib/format'
import { AmountConvert, AmountError, PrivacyNote, PendingStep, DoneStep, type Stage } from './steps'
import type { EnrichedPair } from '@/types'

type Step = 'idle' | 'approving' | 'wrapping' | 'done' | 'error'

interface WrapDialogProps {
  pair: EnrichedPair
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function WrapDialog({ pair, open, onClose, onSuccess }: WrapDialogProps) {
  const { address } = useAccount()
  const chainId = useChainId()
  const { run } = useTxRunner()
  const toast = useToast()
  const [amount, setAmount] = useState('')
  const [step, setStep] = useState<Step>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [approveInFlow, setApproveInFlow] = useState(false)

  const erc20 = pair.erc20Meta
  const conf = pair.confidentialMeta
  const rate = pair.rate ?? 1n

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
  const busy = step === 'approving' || step === 'wrapping'

  function reset() {
    setStep('idle')
    setErrorMsg(null)
    setTxHash(null)
    setApproveInFlow(false)
    setAmount('')
  }

  function close() {
    if (busy) return
    reset()
    onClose()
  }

  async function submit() {
    if (!address || invalid) return
    setErrorMsg(null)
    const willApprove = needsApproval
    setApproveInFlow(willApprove)

    try {
      if (willApprove) {
        setStep('approving')
        await run({ address: erc20.address, abi: erc20Abi, functionName: 'approve', args: [conf.address, amountRaw], chainId })
      }
      setStep('wrapping')
      const { hash } = await run({ address: conf.address, abi: wrapperAbi, functionName: 'wrap', args: [address, amountRaw], chainId })
      setTxHash(hash)
      setStep('done')
      toast.push({
        kind: 'success',
        title: `Wrapped into ${conf.symbol}`,
        description: `Received ~${receiveDisplay} ${conf.symbol} (encrypted).`,
        txHash: hash,
      })
      void refetch()
      onSuccess?.()
    } catch (e) {
      setStep('error')
      setErrorMsg(parseTxError(e))
      toast.push({ kind: 'error', title: 'Wrap failed', description: parseTxError(e) })
    }
  }

  const stages: Stage[] = [
    ...(approveInFlow
      ? [{
          key: 'approve',
          title: `Approve ${erc20.symbol}`,
          detail: 'Allow the wrapper to pull your tokens',
          state: step === 'approving' ? ('active' as const) : ('done' as const),
        }]
      : []),
    {
      key: 'wrap',
      title: `Wrap into ${conf.symbol}`,
      detail: 'Mints your confidential balance',
      state: step === 'wrapping' ? 'active' : step === 'done' ? 'done' : 'todo',
    },
  ]

  return (
    <Modal
      open={open}
      onClose={close}
      title={`Wrap ${erc20.symbol}`}
      subtitle={`Convert public ${erc20.symbol} into confidential ${conf.symbol}.`}
    >
      {step === 'done' ? (
        <DoneStep
          title={`Wrapped into ${conf.symbol}`}
          sub={`~${receiveDisplay} ${conf.symbol} is now in your wallet — encrypted on-chain.`}
          txHash={txHash ?? undefined}
          txUrl={txHash ? explorerTx(txHash, chainId) : undefined}
          onDone={close}
        />
      ) : busy ? (
        <PendingStep stages={stages} morph={{ sym: erc20.symbol, csym: conf.symbol }} foot="Confirm in your wallet" />
      ) : (
        <>
          <AmountConvert
            fromLabel="From · public"
            balanceText={formatAmount(balance, erc20.decimals)}
            value={amount}
            onValue={setAmount}
            onMax={() => setAmount(formatUnits(balance, erc20.decimals))}
            fromSymbol={erc20.symbol}
            toLabel="To · confidential"
            receiveText={`~${receiveDisplay}`}
            toSymbol={conf.symbol}
            autoFocus
          />

          {overBalance ? (
            <AmountError>Exceeds your balance.</AmountError>
          ) : belowMin ? (
            <AmountError>Minimum {minHuman} {erc20.symbol} to wrap.</AmountError>
          ) : errorMsg ? (
            <AmountError>{errorMsg}</AmountError>
          ) : dustRaw > 0n ? (
            <p className="mt-2.5 text-center text-[11.5px] text-ink-faint">
              {formatAmount(dustRaw, erc20.decimals, 6)} {erc20.symbol} below the wrap increment stays in your wallet.
            </p>
          ) : null}

          <button onClick={submit} disabled={invalid} className="btn-primary mt-4 w-full py-3.5 text-[14.5px]">
            {needsApproval && amountRaw > 0n ? 'Approve & Wrap' : `Wrap ${erc20.symbol}`}
          </button>
          <PrivacyNote>Your wrapped balance is encrypted on-chain.</PrivacyNote>
        </>
      )}
    </Modal>
  )
}
