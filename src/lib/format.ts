import { formatUnits, getAddress, type Address } from 'viem'
import { EXPLORER_URL } from '@/config/chain'

/** 0x1234…abcd */
export function shortAddress(address: string, chars = 4): string {
  if (!address || address.length < 2 + chars * 2) return address
  return `${address.slice(0, 2 + chars)}…${address.slice(-chars)}`
}

/** Checksum an address; returns input unchanged if invalid. */
export function checksum(address: string): string {
  try {
    return getAddress(address)
  } catch {
    return address
  }
}

/** Etherscan (Sepolia) link for an address or token. */
export function explorerAddress(address: string): string {
  return `${EXPLORER_URL}/address/${address}`
}

/** Etherscan (Sepolia) link for a transaction. */
export function explorerTx(hash: string): string {
  return `${EXPLORER_URL}/tx/${hash}`
}

/**
 * Format a raw token amount for display, trimming trailing zeros and capping
 * fractional digits. Returns "0" for zero.
 */
export function formatAmount(value: bigint, decimals: number, maxFractionDigits = 4): string {
  if (value === 0n) return '0'
  const full = formatUnits(value, decimals)
  const [whole, frac = ''] = full.split('.')
  const wholeFmt = BigInt(whole).toLocaleString('en-US')
  if (!frac) return wholeFmt
  const trimmed = frac.slice(0, maxFractionDigits).replace(/0+$/, '')
  return trimmed ? `${wholeFmt}.${trimmed}` : wholeFmt
}

/** A short fallback symbol derived from an address, e.g. "0x9b5C". */
export function fallbackSymbol(address: Address): string {
  return address.slice(0, 6)
}
