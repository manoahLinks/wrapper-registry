import { useMemo, useState } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { toHex } from 'viem'
import { Modal } from '@/components/ui/Modal'
import { useTxRunner } from '@/hooks/useTxRunner'
import { useToast } from '@/components/ui/Toast'
import { useFhevm } from '@/fhevm/FhevmProvider'
import { parseTxError } from '@/lib/errors'
import { formatAmount, explorerTx } from '@/lib/format'
import { safeParseUnits } from '@/lib/amount'
import { parseUnwrapRequestId, publicDecryptWithRetry, UINT64_MAX } from '@/lib/unwrap'
import { wrapperAbi } from '@/abi/wrapper'
import { AmountConvert, AmountError, PrivacyNote, PendingStep, DoneStep, type Stage } from './steps'
import type { EnrichedPair } from '@/types'
import type { PairBalances } from '@/hooks/useUserBalances'

type Step = 'idle' | 'encrypting' | 'unwrapping' | 'decrypting' | 'finalizing' | 'done' | 'error'

const STEP_ORDER: Step[] = ['encrypting', 'unwrapping', 'decrypting', 'finalizing']
const STEP_LABEL: Record<string, string> = {
  encrypting: 'Encrypt the amount',
  unwrapping: 'Submit unshield request',
  decrypting: 'Reveal amount (relayer)',
  finalizing: 'Finalize & release tokens',
}
const STEP_DETAIL: Record<string, string> = {
  encrypting: 'Building the encrypted input client-side',
  unwrapping: 'Burns the confidential balance on-chain',
  decrypting: 'Relayer publicly decrypts the burned amount',
  finalizing: 'Verifies the proof and releases your ERC-20',
}

interface UnwrapDialogProps {
  pair: EnrichedPair
  balances?: PairBalances
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function UnwrapDialog({ pair, balances, open, onClose, onSuccess }: UnwrapDialogProps) {
  const { address } = useAccount()
  const chainId = useChainId()
  const { instance, status: fhevmStatus } = useFhevm()
  const { run } = useTxRunner()
  const toast = useToast()

  const conf = pair.confidentialMeta
  const erc20 = pair.erc20Meta
  const rate = pair.rate ?? 1n

  const [amount, setAmount] = useState('')
  const [unwrapAll, setUnwrapAll] = useState(false)
  const [step, setStep] = useState<Step>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [released, setReleased] = useState<bigint | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  const amountRaw = useMemo(
    () => (unwrapAll ? UINT64_MAX : safeParseUnits(amount, conf.decimals)),
    [amount, unwrapAll, conf.decimals],
  )

  const busy = step !== 'idle' && step !== 'done' && step !== 'error'
  const ready = fhevmStatus === 'ready' && !!instance && !!address
  const invalid = !unwrapAll && amountRaw === 0n

  const receiveText = unwrapAll
    ? 'all'
    : amountRaw > 0n
      ? formatAmount(amountRaw * rate, erc20.decimals, 6)
      : '0'

  function reset() {
    setStep('idle')
    setErrorMsg(null)
    setReleased(null)
    setTxHash(null)
    setAmount('')
    setUnwrapAll(false)
  }

  function close() {
    if (busy) return
    reset()
    onClose()
  }

  async function start() {
    if (!instance || !address || invalid) return
    setErrorMsg(null)
    setReleased(null)
    setTxHash(null)

    try {
      setStep('encrypting')
      const input = instance.createEncryptedInput(conf.address, address)
      input.add64(amountRaw)
      const enc = await input.encrypt()

      setStep('unwrapping')
      const { receipt } = await run({
        address: conf.address,
        abi: wrapperAbi,
        functionName: 'unwrap',
        args: [address, address, toHex(enc.handles[0]), toHex(enc.inputProof)],
        chainId,
      })
      const requestId = parseUnwrapRequestId(receipt)
      if (!requestId) throw new Error('Could not read the unwrap request id from the transaction.')

      setStep('decrypting')
      const { cleartext, decryptionProof } = await publicDecryptWithRetry(instance, requestId)

      setStep('finalizing')
      const { hash } = await run({
        address: conf.address,
        abi: wrapperAbi,
        functionName: 'finalizeUnwrap',
        args: [requestId, cleartext, decryptionProof],
        chainId,
      })

      const releasedErc20 = cleartext * rate
      setReleased(releasedErc20)
      setTxHash(hash)
      setStep('done')
      toast.push({
        kind: 'success',
        title: `Unshielded to ${erc20.symbol}`,
        description: `Released ${formatAmount(releasedErc20, erc20.decimals)} ${erc20.symbol} to your wallet.`,
        txHash: hash,
      })
      onSuccess?.()
    } catch (e) {
      setStep('error')
      setErrorMsg(parseTxError(e))
      toast.push({ kind: 'error', title: 'Unshield failed', description: parseTxError(e) })
    }
  }

  const currentIndex = STEP_ORDER.indexOf(step)
  const stages: Stage[] = STEP_ORDER.map((s, i) => ({
    key: s,
    title: STEP_LABEL[s],
    detail: STEP_DETAIL[s],
    state: step === 'done' || i < currentIndex ? 'done' : i === currentIndex ? 'active' : 'todo',
  }))

  return (
    <Modal
      open={open}
      onClose={close}
      title={`Unshield ${conf.symbol}`}
      subtitle={`Convert confidential ${conf.symbol} back into public ${erc20.symbol}.`}
    >
      {step === 'done' ? (
        <DoneStep
          title={`Unshielded to ${erc20.symbol}`}
          sub="The public tokens have been released to your wallet."
          reveal={released != null ? `${formatAmount(released, erc20.decimals)} ${erc20.symbol}` : undefined}
          txHash={txHash ?? undefined}
          txUrl={txHash ? explorerTx(txHash, chainId) : undefined}
          onDone={close}
        />
      ) : busy ? (
        <PendingStep
          stages={stages}
          morph={{ sym: erc20.symbol, csym: conf.symbol }}
          foot={
            step === 'decrypting'
              ? 'Waiting for the relayer to reveal the burned amount…'
              : 'Confirm each step in your wallet'
          }
        />
      ) : (
        <>
          <AmountConvert
            fromLabel="From · confidential"
            balanceText="encrypted"
            value={unwrapAll ? '' : amount}
            onValue={(v) => {
              setUnwrapAll(false)
              setAmount(v)
            }}
            onMax={() => setUnwrapAll(true)}
            fromSymbol={conf.symbol}
            toLabel="To · public"
            receiveText={receiveText}
            toSymbol={erc20.symbol}
            disabled={unwrapAll}
            autoFocus
          />

          {unwrapAll && (
            <p className="mt-2.5 text-center text-xs font-medium text-ink-muted">
              Unshielding your entire {conf.symbol} balance.
            </p>
          )}
          {!balances?.hasConfidential && (
            <p className="mt-2.5 text-center text-xs text-state-warn">
              You don't appear to hold any {conf.symbol} yet — shield some first.
            </p>
          )}
          {errorMsg && <AmountError>{errorMsg}</AmountError>}

          <button
            onClick={start}
            disabled={invalid || !ready}
            className="btn-primary mt-4 w-full py-3.5 text-[14.5px]"
            title={!ready ? 'Waiting for the encryption engine…' : undefined}
          >
            {step === 'error' ? 'Try again' : `Unshield ${conf.symbol}`}
          </button>
          <PrivacyNote>Burned confidentially, released publicly to you.</PrivacyNote>
        </>
      )}
    </Modal>
  )
}
