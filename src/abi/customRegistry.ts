/**
 * Write surface of our own community WrapperRegistry (contracts/WrapperRegistry.sol).
 * Reads reuse `registryAbi` (it mirrors Zama's `getTokenConfidentialTokenPairs`).
 * `register` is permissionless but validated on-chain (underlying() must match).
 */
export const communityRegistryAbi = [
  {
    inputs: [
      { internalType: 'address', name: 'token', type: 'address' },
      { internalType: 'address', name: 'confidentialToken', type: 'address' },
    ],
    name: 'register',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const
