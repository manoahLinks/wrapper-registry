import { sepolia } from 'wagmi/chains'

/** The only network this dApp targets. */
export const APP_CHAIN = sepolia
export const APP_CHAIN_ID = sepolia.id // 11155111

/**
 * Official Zama Confidential Token Wrappers Registry (Sepolia).
 * Verified on-chain 2026-06-23 — see docs/VERIFIED_CHAIN_FACTS.md.
 * This is a UUPS proxy; call read/write functions against this address.
 */
export const REGISTRY_ADDRESS = '0x2f0750Bbb0A246059d80e94c454586a7F27a128e' as const

/** A dedicated RPC if provided, otherwise wagmi falls back to a public endpoint. */
export const SEPOLIA_RPC_URL = import.meta.env.VITE_SEPOLIA_RPC_URL

/** Block explorer base for building links. */
export const EXPLORER_URL = sepolia.blockExplorers.default.url // https://sepolia.etherscan.io
