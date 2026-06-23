import { useMemo } from 'react'
import { useAccount, useReadContracts } from 'wagmi'
import type { Address, Hex } from 'viem'
import { erc20Abi } from '@/abi/erc20'
import { wrapperAbi } from '@/abi/wrapper'
import type { RegistryPair } from '@/types'

const ZERO_HANDLE = '0x0000000000000000000000000000000000000000000000000000000000000000'

export interface PairBalances {
  /** Public ERC-20 balance (raw units). */
  erc20: bigint
  /** Encrypted ERC-7984 balance handle (bytes32); zero handle means no balance. */
  confidentialHandle: Hex
  hasConfidential: boolean
}

interface UseUserBalancesResult {
  balances: Record<string, PairBalances>
  isLoading: boolean
  refetch: () => void
}

/**
 * Batches every pair's public ERC-20 balance and encrypted ERC-7984 balance
 * handle for the connected wallet into a single multicall. The confidential
 * value stays encrypted here — decryption is an explicit user action (Phase 7).
 */
export function useUserBalances(pairs: RegistryPair[]): UseUserBalancesResult {
  const { address, isConnected } = useAccount()

  const contracts = useMemo(() => {
    if (!address) return []
    return pairs.flatMap((p) => [
      { address: p.erc20 as Address, abi: erc20Abi, functionName: 'balanceOf', args: [address] },
      {
        address: p.confidential as Address,
        abi: wrapperAbi,
        functionName: 'confidentialBalanceOf',
        args: [address],
      },
    ])
  }, [pairs, address])

  const { data, isLoading, refetch } = useReadContracts({
    contracts,
    allowFailure: true,
    query: { enabled: isConnected && contracts.length > 0 },
  })

  const balances = useMemo<Record<string, PairBalances>>(() => {
    const out: Record<string, PairBalances> = {}
    pairs.forEach((p, i) => {
      const erc20Entry = data?.[i * 2]
      const confEntry = data?.[i * 2 + 1]
      const erc20 =
        erc20Entry && erc20Entry.status === 'success' ? (erc20Entry.result as bigint) : 0n
      const confidentialHandle =
        confEntry && confEntry.status === 'success' ? (confEntry.result as Hex) : (ZERO_HANDLE as Hex)
      out[p.confidential.toLowerCase()] = {
        erc20,
        confidentialHandle,
        hasConfidential: confidentialHandle !== ZERO_HANDLE,
      }
    })
    return out
  }, [pairs, data])

  return { balances, isLoading, refetch: () => void refetch() }
}
