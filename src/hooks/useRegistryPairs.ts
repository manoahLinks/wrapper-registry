import { useMemo } from 'react'
import { useReadContract, useReadContracts } from 'wagmi'
import type { Address } from 'viem'
import { REGISTRY_ADDRESS } from '@/config/chain'
import { registryAbi } from '@/abi/registry'
import { erc20Abi } from '@/abi/erc20'
import { wrapperAbi } from '@/abi/wrapper'
import { LOCAL_PAIRS } from '@/config/pairs.config'
import { fallbackSymbol } from '@/lib/format'
import type { EnrichedPair, RegistryPair, TokenMeta } from '@/types'

const META_CALLS_PER_PAIR = 7

interface UseRegistryPairsResult {
  pairs: EnrichedPair[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
  counts: { total: number; registry: number; local: number; valid: number }
}

/**
 * Hybrid source of truth for the registry grid:
 *   1. reads the official on-chain Wrappers Registry (primary), then
 *   2. merges in any locally-declared pairs (LOCAL_PAIRS), then
 *   3. batch-fetches token metadata for every pair via multicall.
 *
 * All metadata reads use `allowFailure` so a single misbehaving token
 * (the registry is known to contain odd entries) never breaks the grid.
 */
export function useRegistryPairs(): UseRegistryPairsResult {
  const {
    data: onchain,
    isLoading: pairsLoading,
    isError: pairsError,
    refetch,
  } = useReadContract({
    address: REGISTRY_ADDRESS,
    abi: registryAbi,
    functionName: 'getTokenConfidentialTokenPairs',
  })

  // 1 + 2: merge on-chain (primary) with local pairs, deduped by wrapper address.
  const basePairs = useMemo<RegistryPair[]>(() => {
    const seen = new Set<string>()
    const out: RegistryPair[] = []

    for (const p of onchain ?? []) {
      const key = p.confidentialTokenAddress.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      out.push({
        erc20: p.tokenAddress,
        confidential: p.confidentialTokenAddress,
        isValid: p.isValid,
        source: 'registry',
      })
    }

    for (const lp of LOCAL_PAIRS) {
      const key = lp.confidential.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      out.push({
        erc20: lp.erc20,
        confidential: lp.confidential,
        isValid: true,
        source: 'local',
        label: lp.label,
      })
    }

    return out
  }, [onchain])

  // 3: one multicall for all token metadata (7 reads per pair).
  const metaContracts = useMemo(
    () =>
      basePairs.flatMap((p) => [
        { address: p.erc20, abi: erc20Abi, functionName: 'symbol' },
        { address: p.erc20, abi: erc20Abi, functionName: 'name' },
        { address: p.erc20, abi: erc20Abi, functionName: 'decimals' },
        { address: p.confidential, abi: wrapperAbi, functionName: 'symbol' },
        { address: p.confidential, abi: wrapperAbi, functionName: 'name' },
        { address: p.confidential, abi: wrapperAbi, functionName: 'decimals' },
        { address: p.confidential, abi: wrapperAbi, functionName: 'rate' },
      ]),
    [basePairs],
  )

  const { data: metaData, isLoading: metaLoading } = useReadContracts({
    contracts: metaContracts,
    allowFailure: true,
    query: { enabled: basePairs.length > 0 },
  })

  const pairs = useMemo<EnrichedPair[]>(() => {
    return basePairs.map((p, i) => {
      const base = i * META_CALLS_PER_PAIR
      const at = <T,>(offset: number): T | undefined => {
        const entry = metaData?.[base + offset]
        return entry && entry.status === 'success' ? (entry.result as T) : undefined
      }

      const erc20Symbol = at<string>(0)
      const erc20Name = at<string>(1)
      const erc20Decimals = at<number>(2)
      const cSymbol = at<string>(3)
      const cName = at<string>(4)
      const cDecimals = at<number>(5)
      const rate = at<bigint>(6)

      const degraded =
        metaData != null &&
        (erc20Symbol == null || erc20Decimals == null || cSymbol == null || cDecimals == null)

      const erc20Meta: TokenMeta = {
        address: p.erc20,
        symbol: erc20Symbol ?? fallbackSymbol(p.erc20),
        name: erc20Name ?? 'Unknown token',
        decimals: erc20Decimals ?? 18,
      }
      const confidentialMeta: TokenMeta = {
        address: p.confidential,
        symbol: cSymbol ?? (erc20Symbol ? `c${erc20Symbol}` : fallbackSymbol(p.confidential)),
        name: cName ?? 'Confidential token',
        decimals: cDecimals ?? erc20Meta.decimals,
      }

      return { ...p, erc20Meta, confidentialMeta, rate, metaDegraded: degraded }
    })
  }, [basePairs, metaData])

  const counts = useMemo(
    () => ({
      total: pairs.length,
      registry: pairs.filter((p) => p.source === 'registry').length,
      local: pairs.filter((p) => p.source === 'local').length,
      valid: pairs.filter((p) => p.isValid).length,
    }),
    [pairs],
  )

  return {
    pairs,
    isLoading: pairsLoading || (metaLoading && basePairs.length > 0),
    isError: pairsError,
    refetch: () => void refetch(),
    counts,
  }
}

export type { Address }
