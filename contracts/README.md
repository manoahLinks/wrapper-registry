# Confidential Wrapper contracts

A **factory** that deploys an ERC-7984 confidential wrapper for any ERC-20, plus
a permissionless **community registry** the factory registers into — so users can
"deploy a confidential wrapper for my token" entirely from the frontend, and the
new pair shows up for everyone (Zama's official registry is owner-gated and
can't accept user pairs).

| Contract | Purpose |
|---|---|
| `ConfidentialERC20Wrapper.sol` | The deployable ERC-7984 wrapper (OZ `ERC7984ERC20Wrapper` + `ZamaEthereumConfig`). |
| `WrapperRegistry.sol` | Permissionless registry; validates `underlying()`; read shape mirrors Zama's `getTokenConfidentialTokenPairs()`. |
| `ConfidentialWrapperFactory.sol` | `createWrapper(token,name,symbol,uri)` → deploys a wrapper + registers it, emits `WrapperCreated`. |
| `mocks/MockERC20.sol` | Mintable ERC-20 for tests. |

## Develop

```bash
cd contracts
npm install --legacy-peer-deps   # FHEVM toolchain has overlapping peer ranges
npm run compile
npm run test            # runs against the in-process FHE mock
```

> Node must be an even LTS (v20 or v22). If install/compile fights you, scaffold
> from `git clone https://github.com/zama-ai/fhevm-hardhat-template` and drop the
> four contracts + `deploy/01_factory.ts` + `test/factory.ts` in — same config.

## Deploy

```bash
npx hardhat vars set MNEMONIC        # deployer mnemonic (funded)
npx hardhat vars set INFURA_API_KEY
npx hardhat vars set ETHERSCAN_API_KEY   # optional, for verify

npm run deploy:sepolia       # then: npm run deploy:mainnet
```

The deploy prints the two addresses. Paste them into the frontend at
`src/config/chain.ts` for the matching chain:

```ts
customRegistryAddress: '0x…',  // WrapperRegistry
factoryAddress:        '0x…',  // ConfidentialWrapperFactory
```

Until those are set, the frontend hides the "Deploy a wrapper" button and skips
the community-registry read — everything else keeps working.
