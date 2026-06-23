/**
 * ERC-7984 confidential wrapper — Zama `ConfidentialWrapperV3` (Sepolia).
 * Verified on-chain (see docs/VERIFIED_CHAIN_FACTS.md). Covers metadata,
 * balances, wrap/unwrap (async) and the operator/ACL surface.
 */
export const wrapperAbi = [
  // --- Metadata ---
  { inputs: [], name: 'name', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'symbol', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'decimals', outputs: [{ type: 'uint8' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'underlying', outputs: [{ type: 'address' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'rate', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },

  // --- Confidential balance (returns an euint64 handle as bytes32) ---
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'confidentialBalanceOf',
    outputs: [{ internalType: 'euint64', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },

  // --- Deny list (read) ---
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'isBlocked',
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },

  // --- Operator / ACL ---
  {
    inputs: [
      { name: 'holder', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'isOperator',
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'until', type: 'uint48' },
    ],
    name: 'setOperator',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },

  // --- Wrap (ERC-20 -> ERC-7984) ---
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'wrap',
    outputs: [{ internalType: 'euint64', name: '', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },

  // --- Unwrap (ERC-7984 -> ERC-20), async two-step ---
  {
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { internalType: 'externalEuint64', name: 'encryptedAmount', type: 'bytes32' },
      { name: 'inputProof', type: 'bytes' },
    ],
    name: 'unwrap',
    outputs: [{ type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { internalType: 'euint64', name: 'amount', type: 'bytes32' },
    ],
    name: 'unwrap',
    outputs: [{ type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'unwrapRequestId', type: 'bytes32' },
      { name: 'unwrapAmountCleartext', type: 'uint64' },
      { name: 'decryptionProof', type: 'bytes' },
    ],
    name: 'finalizeUnwrap',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'unwrapRequestId', type: 'bytes32' }],
    name: 'unwrapRequester',
    outputs: [{ type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },

  // --- Events relevant to wrap/unwrap lifecycle ---
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'to', type: 'address' },
      { indexed: false, name: 'roundedAmount', type: 'uint256' },
      { indexed: false, internalType: 'euint64', name: 'encryptedWrappedAmount', type: 'bytes32' },
    ],
    name: 'Wrap',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'receiver', type: 'address' },
      { indexed: true, name: 'unwrapRequestId', type: 'bytes32' },
      { indexed: false, internalType: 'euint64', name: 'amount', type: 'bytes32' },
    ],
    name: 'UnwrapRequested',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'receiver', type: 'address' },
      { indexed: true, name: 'unwrapRequestId', type: 'bytes32' },
      { indexed: false, internalType: 'euint64', name: 'encryptedAmount', type: 'bytes32' },
      { indexed: false, name: 'cleartextAmount', type: 'uint64' },
    ],
    name: 'UnwrapFinalized',
    type: 'event',
  },
] as const
