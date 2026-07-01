/**
 * ConfidentialWrapperFactory — our own factory that deploys an ERC-7984 wrapper
 * for an ERC-20 and registers the pair in our community WrapperRegistry.
 * (Deployed from contracts/. The community registry is read with `registryAbi`,
 * which it intentionally mirrors.)
 */
export const factoryAbi = [
  {
    inputs: [
      { internalType: 'contract IERC20', name: 'token', type: 'address' },
      { internalType: 'string', name: 'name_', type: 'string' },
      { internalType: 'string', name: 'symbol_', type: 'string' },
      { internalType: 'string', name: 'uri_', type: 'string' },
    ],
    name: 'createWrapper',
    outputs: [{ internalType: 'address', name: 'wrapper', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'token', type: 'address' },
      { indexed: true, internalType: 'address', name: 'confidentialToken', type: 'address' },
      { indexed: true, internalType: 'address', name: 'creator', type: 'address' },
    ],
    name: 'WrapperCreated',
    type: 'event',
  },
] as const
