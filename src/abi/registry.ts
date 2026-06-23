/**
 * Zama Confidential Token Wrappers Registry (Sepolia) — read/write surface.
 * Verified on-chain from impl `ConfidentialTokenWrappersRegistry`
 * (see docs/VERIFIED_CHAIN_FACTS.md). Only the functions this app uses.
 */
export const registryAbi = [
  {
    inputs: [],
    name: 'getTokenConfidentialTokenPairs',
    outputs: [
      {
        components: [
          { internalType: 'address', name: 'tokenAddress', type: 'address' },
          { internalType: 'address', name: 'confidentialTokenAddress', type: 'address' },
          { internalType: 'bool', name: 'isValid', type: 'bool' },
        ],
        internalType: 'struct ConfidentialTokenWrappersRegistry.TokenWrapperPair[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getTokenConfidentialTokenPairsLength',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'confidentialTokenAddress', type: 'address' }],
    name: 'getTokenAddress',
    outputs: [
      { internalType: 'bool', name: '', type: 'bool' },
      { internalType: 'address', name: '', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'tokenAddress', type: 'address' }],
    name: 'getConfidentialTokenAddress',
    outputs: [
      { internalType: 'bool', name: '', type: 'bool' },
      { internalType: 'address', name: '', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'confidentialTokenAddress', type: 'address' }],
    name: 'isConfidentialTokenValid',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Write (owner-gated — documented for the "add a pair" flow, not called by app users)
  {
    inputs: [
      { internalType: 'address', name: 'tokenAddress', type: 'address' },
      { internalType: 'address', name: 'confidentialTokenAddress', type: 'address' },
    ],
    name: 'registerConfidentialToken',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const
