import { useMemo, useState } from 'react'
import { useAccount } from 'wagmi'
import { toHex } from 'viem'
import { Modal } from '@/components/ui/Modal'
import { AmountField } from '@/components/ui/AmountField'
import { TokenGlyph } from '@/components/ui/TokenGlyph'
import { useTxRunner } from '@/hooks/useTxRunner'
import { useToast } from '@/components/ui/Toast'
import { useFhevm } from '@/fhevm/FhevmProvider'
import { parseTxError } from '@/lib/errors'
import { formatAmount } from '@/lib/format'
import { safeParseUnits } from '@/lib/amount'
import { parseUnwrapRequestId, publicDecryptWithRetry, UINT64_MAX } from '@/lib/unwrap'
import { wrapperAbi } from '@/abi/wrapper'
import { APP_CHAIN_ID } from '@/config/chain'
import type { EnrichedPair } from '@/types'
import type { PairBalances } from '@/hooks/useUserBalances'

type Step = 'idle' | 'encrypting' | 'unwrapping' | 'decrypting' | 'finalizing' | 'done' | 'error'

const STEP_ORDER: Step[] = ['encrypting', 'unwrapping', 'decrypting', 'finalizing']
const STEP_LABEL: Record<string, string> = {
  encrypting: 'Encrypt the amount',
  unwrapping: 'Submit unwrap request',
  decrypting: 'Reveal amount (relayer)',
  finalizing: 'Finalize & release tokens',
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

  const amountRaw = useMemo(
    () => (unwrapAll ? UINT64_MAX : safeParseUnits(amount, conf.decimals)),
    [amount, unwrapAll, conf.decimals],
  )

  const busy = step !== 'idle' && step !== 'done' && step !== 'error'
  const ready = fhevmStatus === 'ready' && !!instance && !!address
  const invalid = !unwrapAll && amountRaw === 0n

  function reset() {
    setStep('idle')
    setErrorMsg(null)
    setReleased(null)
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

    try {
      // 1) Encrypt the amount to unwrap (client-side).
      setStep('encrypting')
      const input = instance.createEncryptedInput(conf.address, address)
      input.add64(amountRaw)
      const enc = await input.encrypt()

      // 2) Submit the unwrap request (burns + marks publicly decryptable).
      setStep('unwrapping')
      const { receipt } = await run({
        address: conf.address,
        abi: wrapperAbi,
        functionName: 'unwrap',
        args: [address, address, toHex(enc.handles[0]), toHex(enc.inputProof)],
        chainId: APP_CHAIN_ID,
      })
      const requestId = parseUnwrapRequestId(receipt)
      if (!requestId) throw new Error('Could not read the unwrap request id from the transaction.')

      // 3) Public-decrypt the burned amount via the relayer (retry until indexed).
      setStep('decrypting')
      const { cleartext, decryptionProof } = await publicDecryptWithRetry(instance, requestId)

      // 4) Finalize: verifies the proof on-chain and releases the ERC-20.
      setStep('finalizing')
      const { hash } = await run({
        address: conf.address,
        abi: wrapperAbi,
        functionName: 'finalizeUnwrap',
        args: [requestId, cleartext, decryptionProof],
        chainId: APP_CHAIN_ID,
      })

      const releasedErc20 = cleartext * rate
      setReleased(releasedErc20)
      setStep('done')
      toast.push({
        kind: 'success',
        title: `Unwrapped to ${erc20.symbol}`,
        description: `Released ${formatAmount(releasedErc20, erc20.decimals)} ${erc20.symbol} to your wallet.`,
        txHash: hash,
      })
      onSuccess?.()
    } catch (e) {
      setStep('error')
      setErrorMsg(parseTxError(e))
      toast.push({ kind: 'error', title: 'Unwrap failed', description: parseTxError(e) })
    }
  }

  const currentIndex = STEP_ORDER.indexOf(step)

  return (
    <Modal
      open={open}
      onClose={close}
      title={`Unwrap ${conf.symbol}`}
      subtitle={`Convert confidential ${conf.symbol} back into public ${erc20.symbol}.`}
    >
      {/* Conversion visual */}
      <div className="mb-4 flex items-center justify-between gap-2 rounded-card bg-paper-soft p-3">
        <div className="flex items-center gap-2">
          <TokenGlyph symbol={conf.symbol} address={conf.address} size={32} confidential />
          <div className="text-sm font-bold text-ink">{conf.symbol}</div>
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-faint">
          <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="flex items-center gap-2">
          <TokenGlyph symbol={erc20.symbol} address={erc20.address} size={32} />
          <div className="text-sm font-bold text-ink">{erc20.symbol}</div>
        </div>
      </div>

      {step === 'idle' || step === 'error' ? (
        <>
          <AmountField
            value={unwrapAll ? '' : amount}
            onChange={(v) => {
              setUnwrapAll(false)
              setAmount(v)
            }}
            symbol={conf.symbol}
            disabled={unwrapAll}
            autoFocus
            onMax={() => setUnwrapAll(true)}
            hint={
              unwrapAll ? (
                <span className="font-medium text-ink">Unwrapping your entire {conf.symbol} balance.</span>
              ) : (
                <>Enter an amount, or tap Max to unwrap everything. Over-requests unwrap only what you hold.</>
              )
            }
          />

          {!balances?.hasConfidential && (
            <p className="mt-2 text-xs text-state-warn">
              You don't appear to hold any {conf.symbol} yet — wrap some first.
            </p>
          )}

          {errorMsg && (
            <p className="mt-3 rounded-lg bg-state-danger/5 px-3 py-2 text-xs text-state-danger">
              {errorMsg}
            </p>
          )}

          <div className="mt-5 flex gap-2">
            <button className="btn-ghost flex-1" onClick={close}>
              Cancel
            </button>
            <button
              className="btn-primary flex-1"
              onClick={start}
              disabled={invalid || !ready}
              title={!ready ? 'Waiting for the encryption engine…' : undefined}
            >
              {step === 'error' ? 'Try again' : `Unwrap ${conf.symbol}`}
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Stepper */}
          <ol className="space-y-2.5">
            {STEP_ORDER.map((s, i) => {
              const state =
                step === 'done' || i < currentIndex
                  ? 'done'
                  : i === currentIndex
                    ? 'active'
                    : 'pending'
              return (
                <li key={s} className="flex items-center gap-3">
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                      state === 'done'
                        ? 'bg-state-success text-white'
                        : state === 'active'
                          ? 'bg-zama-yellow text-ink'
                          : 'bg-paper-sunken text-ink-faint'
                    }`}
                  >
                    {state === 'done' ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : state === 'active' ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
                        <path d="M21 12a9 9 0 1 1-6.2-8.6" strokeLinecap="round" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span className={`text-sm ${state === 'pending' ? 'text-ink-faint' : 'text-ink'}`}>
                    {STEP_LABEL[s]}
                  </span>
                </li>
              )
            })}
          </ol>

          {step === 'done' && (
            <div className="mt-5 rounded-card bg-state-success/[0.07] p-4 text-center">
              <p className="text-sm font-semibold text-ink">Released to your wallet</p>
              <p className="mt-1 font-mono text-2xl font-bold text-ink">
                {released != null ? formatAmount(released, erc20.decimals) : '—'} {erc20.symbol}
              </p>
            </div>
          )}

          <div className="mt-5">
            <button className="btn-primary w-full" onClick={close} disabled={busy}>
              {step === 'done' ? 'Done' : busy ? 'Working…' : 'Close'}
            </button>
          </div>

          {step === 'decrypting' && (
            <p className="mt-3 text-center text-xs text-ink-muted">
              Waiting for the relayer to reveal the burned amount — this can take a few seconds.
            </p>
          )}
        </>
      )}
    </Modal>
  )
}
