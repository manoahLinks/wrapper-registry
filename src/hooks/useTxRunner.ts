import { useCallback, useState } from 'react'
import { useConfig, useWriteContract } from 'wagmi'
import { waitForTransactionReceipt } from '@wagmi/core'
import type { Hex } from 'viem'
import type { TransactionReceipt } from 'viem'

export type TxPhase = 'idle' | 'signing' | 'mining' | 'success' | 'error'

interface RunResult {
  hash: Hex
  receipt: TransactionReceipt
}

/**
 * Imperative write-transaction runner shared by every on-chain action
 * (faucet, approve, wrap, unwrap, finalize). Handles the wallet-signing →
 * mining → confirmation lifecycle and surfaces a single phase value.
 *
 * Returns the hash and full receipt so callers that need logs (e.g. unwrap's
 * request id) can read them.
 */
export function useTxRunner() {
  const config = useConfig()
  const { writeContractAsync } = useWriteContract()
  const [phase, setPhase] = useState<TxPhase>('idle')
  const [hash, setHash] = useState<Hex | undefined>()

  const run = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (params: any): Promise<RunResult> => {
      setPhase('signing')
      setHash(undefined)
      try {
        const txHash = (await writeContractAsync(params)) as Hex
        setHash(txHash)
        setPhase('mining')
        const receipt = await waitForTransactionReceipt(config, { hash: txHash })
        if (receipt.status === 'reverted') {
          setPhase('error')
          throw new Error('Transaction reverted on-chain.')
        }
        setPhase('success')
        return { hash: txHash, receipt }
      } catch (e) {
        setPhase('error')
        throw e
      }
    },
    [config, writeContractAsync],
  )

  const reset = useCallback(() => {
    setPhase('idle')
    setHash(undefined)
  }, [])

  return {
    run,
    reset,
    phase,
    hash,
    isBusy: phase === 'signing' || phase === 'mining',
  }
}
