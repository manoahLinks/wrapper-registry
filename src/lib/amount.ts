import { formatUnits, parseUnits } from 'viem'

/** Parse a human decimal string to raw units; returns 0n on malformed input. */
export function safeParseUnits(value: string, decimals: number): bigint {
  try {
    if (!value || value === '.') return 0n
    return parseUnits(value, decimals)
  } catch {
    return 0n
  }
}

/**
 * Convert an ERC-20 raw amount to the confidential side, honoring the wrapper
 * rate (confidential units = erc20Raw / rate; rounded down). Returns both the
 * confidential raw units (6 dec) and the actually-wrapped erc20 amount.
 */
export function wrapPreview(erc20Raw: bigint, rate: bigint) {
  const r = rate > 0n ? rate : 1n
  const confidentialRaw = erc20Raw / r
  const wrappedErc20Raw = confidentialRaw * r
  const dustRaw = erc20Raw - wrappedErc20Raw
  return { confidentialRaw, wrappedErc20Raw, dustRaw }
}

/** Inverse of wrap: confidential raw (6 dec) → erc20 raw released on unwrap. */
export function unwrapPreview(confidentialRaw: bigint, rate: bigint) {
  const r = rate > 0n ? rate : 1n
  return { erc20Raw: confidentialRaw * r }
}

export { formatUnits, parseUnits }
