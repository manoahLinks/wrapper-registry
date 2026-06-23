import { useState } from 'react'
import { useAccount } from 'wagmi'
import { parseUnits } from 'viem'
import { Modal } from '@/components/ui/Modal'
import { AmountField } from '@/components/ui/AmountField'
import { TokenGlyph } from '@/components/ui/TokenGlyph'
import { useTxRunner } from '@/hooks/useTxRunner'
import { useToast } from '@/components/ui/Toast'
import { parseTxError } from '@/lib/errors'
import { erc20Abi } from '@/abi/erc20'
import { APP_CHAIN_ID } from '@/config/chain'
import type { EnrichedPair } from '@/types'

/** Per-claim cap enforced by the mock ERC-20 (`MAX_MINT_AMOUNT_TOKENS`). */
const FAUCET_MAX_TOKENS = 1_000_000

interface FaucetDialogProps {
  pair: EnrichedPair
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function FaucetDialog({ pair, open, onClose, onSuccess }: FaucetDialogProps) {
  const { address } = useAccount()
  const { run, isBusy } = useTxRunner()
  const toast = useToast()
  const [amount, setAmount] = useState('1000')

  const { symbol, decimals, address: tokenAddress } = pair.erc20Meta
  const amountNum = Number(amount)
  const tooLarge = amountNum > FAUCET_MAX_TOKENS
  const invalid = !amount || amountNum <= 0 || tooLarge || Number.isNaN(amountNum)

  async function claim() {
    if (!address || invalid) return
    const raw = parseUnits(amount, decimals)
    const toastId = toast.push({
      kind: 'pending',
      title: `Claiming ${symbol}`,
      description: 'Confirm the transaction in your wallet…',
    })
    try {
      const { hash } = await run({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'mint',
        args: [address, raw],
        chainId: APP_CHAIN_ID,
      })
      toast.update(toastId, {
        kind: 'success',
        title: `Claimed ${amountNum.toLocaleString()} ${symbol}`,
        description: 'Test tokens minted to your wallet.',
        txHash: hash,
      })
      onSuccess?.()
      onClose()
    } catch (e) {
      toast.update(toastId, {
        kind: 'error',
        title: 'Faucet failed',
        description: parseTxError(e),
      })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Claim ${symbol}`}
      subtitle="Mint free test tokens on Sepolia, then wrap them into their confidential form."
    >
      <div className="mb-4 flex items-center gap-3 rounded-card bg-paper-soft p-3">
        <TokenGlyph symbol={symbol} address={tokenAddress} />
        <div className="min-w-0">
          <div className="font-display text-sm font-bold text-ink">{pair.erc20Meta.name}</div>
          <div className="truncate text-xs text-ink-muted">{symbol} · {decimals} decimals</div>
        </div>
      </div>

      <AmountField
        value={amount}
        onChange={setAmount}
        symbol={symbol}
        autoFocus
        onMax={() => setAmount(String(FAUCET_MAX_TOKENS))}
        hint={
          tooLarge ? (
            <span className="text-state-danger">
              Max {FAUCET_MAX_TOKENS.toLocaleString()} {symbol} per claim.
            </span>
          ) : (
            <>Up to {FAUCET_MAX_TOKENS.toLocaleString()} {symbol} per claim.</>
          )
        }
      />

      <div className="mt-5 flex gap-2">
        <button className="btn-ghost flex-1" onClick={onClose} disabled={isBusy}>
          Cancel
        </button>
        <button className="btn-primary flex-1" onClick={claim} disabled={invalid || isBusy}>
          {isBusy ? 'Claiming…' : `Claim ${symbol}`}
        </button>
      </div>
    </Modal>
  )
}
