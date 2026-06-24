import { parseEventLogs, type Hex, type TransactionReceipt } from 'viem'
import type { FhevmInstance } from '@zama-fhe/relayer-sdk/web'
import { wrapperAbi } from '@/abi/wrapper'

/** Largest euint64 value — used to "unwrap everything" (the contract caps at balance). */
export const UINT64_MAX = (1n << 64n) - 1n

/**
 * Extract the unwrap request id (the burned-amount ciphertext handle) from a
 * confirmed unwrap transaction's logs.
 */
export function parseUnwrapRequestId(receipt: TransactionReceipt): Hex | null {
  const logs = parseEventLogs({
    abi: wrapperAbi,
    eventName: 'UnwrapRequested',
    logs: receipt.logs,
  })
  const event = logs[0] as { args?: { unwrapRequestId?: Hex } } | undefined
  return event?.args?.unwrapRequestId ?? null
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export interface PublicDecryptOutcome {
  cleartext: bigint
  decryptionProof: Hex
}

/**
 * Public-decrypt a handle, retrying while the relayer indexes the unwrap tx
 * (it briefly returns "not_ready_for_decryption"). The handle was made
 * publicly decryptable on-chain, so no signature is required.
 */
export async function publicDecryptWithRetry(
  instance: FhevmInstance,
  handle: Hex,
  attempts = 10,
  delayMs = 2500,
): Promise<PublicDecryptOutcome> {
  let lastError: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await instance.publicDecrypt([handle])
      // clearValues is keyed by handle; match case-insensitively to be safe.
      const key =
        (Object.keys(res.clearValues) as Hex[]).find(
          (k) => k.toLowerCase() === handle.toLowerCase(),
        ) ?? handle
      const raw = res.clearValues[key]
      return {
        cleartext: BigInt(raw as bigint | number | string),
        decryptionProof: res.decryptionProof,
      }
    } catch (e) {
      lastError = e
      await sleep(delayMs)
    }
  }
  throw lastError ?? new Error('Public decryption timed out.')
}
