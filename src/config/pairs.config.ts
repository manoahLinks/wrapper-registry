import type { Address } from 'viem'

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  LOCAL / CUSTOM PAIRS  —  the app's extensibility mechanism
 * ─────────────────────────────────────────────────────────────────────────
 *
 * The registry grid is sourced as a HYBRID:
 *   1. PRIMARY — the official on-chain Wrappers Registry (source of truth).
 *   2. ADDITIONAL — the entries you declare below.
 *
 * Pairs listed here are MERGED with the on-chain pairs. If a `confidential`
 * address already exists on-chain, the on-chain entry wins (no duplicates).
 * Local-only entries render with a "Local" badge.
 *
 * ── How to add a new ERC-20 ↔ ERC-7984 pair ──────────────────────────────
 * Append an object to `LOCAL_PAIRS` with:
 *   - erc20:        the public ERC-20 token address
 *   - confidential: its ERC-7984 confidential wrapper address
 *   - label:        (optional) a friendly name shown on the card
 *
 * Example:
 *   export const LOCAL_PAIRS: LocalPair[] = [
 *     {
 *       erc20: '0xYourErc20Address...',
 *       confidential: '0xYourErc7984WrapperAddress...',
 *       label: 'My dev token',
 *     },
 *   ]
 *
 * That's it — save, and the pair appears in the registry grid with full
 * metadata, faucet/wrap/unwrap/decrypt actions, just like an official pair.
 * (For pairs you want EVERYONE to see, register them on-chain instead — see
 * the README "Adding a new pair" section.)
 */
export interface LocalPair {
  erc20: Address
  confidential: Address
  label?: string
}

export const LOCAL_PAIRS: LocalPair[] = [
  // Add custom or dev-only pairs here. Empty by default — the app shows the
  // full official registry out of the box.
]
