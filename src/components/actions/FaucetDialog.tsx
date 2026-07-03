import { useState } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { parseUnits } from 'viem'
import { Modal } from '@/components/ui/Modal'
import { AmountField } from '@/components/ui/AmountField'
import { useTxRunner } from '@/hooks/useTxRunner'
import { useToast } from '@/components/ui/Toast'
import { parseTxError } from '@/lib/errors'
import { erc20Abi } from '@/abi/erc20'
import { explorerTx } from '@/lib/format'
import { AmountError, PendingStep, DoneStep, type Stage } from './steps'
import type { EnrichedPair } from '@/types'

/** Per-claim cap enforced by the mock ERC-20 (`MAX_MINT_AMOUNT_TOKENS`). */
const FAUCET_MAX_TOKENS = 1_000_000

type Step = 'idle' | 'claiming' | 'done' | 'error'

interface FaucetDialogProps {
  pair: EnrichedPair
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function FaucetDialog({ pair, open, onClose, onSuccess }: FaucetDialogProps) {
  const { address } = useAccount()
  const chainId = useChainId()
  const { run } = useTxRunner()
  const toast = useToast()
  const [amount, setAmount] = useState('1000')
  const [step, setStep] = useState<Step>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  const { symbol, decimals, address: tokenAddress } = pair.erc20Meta
  const amountNum = Number(amount)
  const tooLarge = amountNum > FAUCET_MAX_TOKENS
  const invalid = !amount || amountNum <= 0 || tooLarge || Number.isNaN(amountNum)
  const busy = step === 'claiming'

  function reset() {
    setStep('idle')
    setErrorMsg(null)
    setTxHash(null)
    setAmount('1000')
  }

  function close() {
    if (busy) return
    reset()
    onClose()
  }

  async function claim() {
    if (!address || invalid) return
    setErrorMsg(null)
    setStep('claiming')
    try {
      const { hash } = await run({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'mint',
        args: [address, parseUnits(amount, decimals)],
        chainId,
      })
      setTxHash(hash)
      setStep('done')
      toast.push({
        kind: 'success',
        title: `Claimed ${amountNum.toLocaleString()} ${symbol}`,
        description: 'Test tokens minted to your wallet.',
        txHash: hash,
      })
      onSuccess?.()
    } catch (e) {
      setStep('error')
      setErrorMsg(parseTxError(e))
      toast.push({ kind: 'error', title: 'Faucet failed', description: parseTxError(e) })
    }
  }

  const stages: Stage[] = [
    { key: 'mint', title: `Mint ${symbol}`, detail: 'Minting test tokens to your wallet', state: 'active' },
  ]

  return (
    <Modal
      open={open}
      onClose={close}
      title={`Claim ${symbol}`}
      subtitle="Mint free test tokens, then shield them into their confidential form."
    >
      {step === 'done' ? (
        <DoneStep
          title={`Claimed ${amountNum.toLocaleString()} ${symbol}`}
          sub={`Test ${symbol} has been minted to your wallet. Shield it into the confidential form next.`}
          txHash={txHash ?? undefined}
          txUrl={txHash ? explorerTx(txHash, chainId) : undefined}
          onDone={close}
        />
      ) : busy ? (
        <PendingStep stages={stages} foot="Confirm in your wallet" />
      ) : (
        <>
          <p className="text-[13.5px] leading-[1.55] text-ink-muted">
            Claim official test tokens for{' '}
            <b className="font-mono text-ink">{symbol}</b> from the Sepolia cTokenMock faucet.
          </p>

          <div className="mt-4">
            <AmountField
              value={amount}
              onChange={setAmount}
              symbol={symbol}
              autoFocus
              onMax={() => setAmount(String(FAUCET_MAX_TOKENS))}
            />
          </div>

          {tooLarge ? (
            <AmountError>Max {FAUCET_MAX_TOKENS.toLocaleString()} {symbol} per claim.</AmountError>
          ) : errorMsg ? (
            <AmountError>{errorMsg}</AmountError>
          ) : (
            <p className="mt-2.5 text-center text-[11.5px] text-ink-faint">
              Up to {FAUCET_MAX_TOKENS.toLocaleString()} {symbol} per claim.
            </p>
          )}

          <button onClick={claim} disabled={invalid} className="btn-dark mt-4 w-full py-3.5 text-[14.5px]">
            Claim {symbol}
          </button>
        </>
      )}
    </Modal>
  )
}
