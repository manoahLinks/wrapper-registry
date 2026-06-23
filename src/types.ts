import type { Address } from 'viem'

export type PairSource = 'registry' | 'local'

export interface TokenMeta {
  address: Address
  symbol: string
  name: string
  decimals: number
}

/** A raw ERC-20 ↔ ERC-7984 association, before metadata is loaded. */
export interface RegistryPair {
  erc20: Address
  confidential: Address
  /** Registry `isValid` flag (revoked pairs are false). Local pairs default true. */
  isValid: boolean
  source: PairSource
  /** Optional human label from local config. */
  label?: string
}

/** A pair enriched with on-chain token metadata for rendering. */
export interface EnrichedPair extends RegistryPair {
  erc20Meta: TokenMeta
  confidentialMeta: TokenMeta
  /** Wrapper conversion rate (units of ERC-20 per 1 confidential unit). */
  rate?: bigint
  /** True if some metadata calls failed and fallbacks are shown. */
  metaDegraded: boolean
}
