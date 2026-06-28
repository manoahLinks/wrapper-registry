# Verified Sepolia Chain Facts — Confidential Wrapper Registry

> Source of truth for the build. Every address/ABI/selector below was read directly
> from Sepolia (chain `11155111`) via Blockscout on 2026-06-23 — NOT from docs.
> Where docs and chain disagreed, the chain wins (and they did disagree — see "8 vs 7").

## 1. Wrappers Registry

- **Proxy (call this):** `0x2f0750Bbb0A246059d80e94c454586a7F27a128e` (ERC1967 / UUPS, Ownable2Step)
- **Implementation:** `0x50C271E25Ee953DD21E916311db81E228c9Bdb59` — `ConfidentialTokenWrappersRegistry`

### Read ABI (use proxy address)
- `getTokenConfidentialTokenPairs() → TokenWrapperPair[]`  ← primary enumeration
- `getTokenConfidentialTokenPairsLength() → uint256`
- `getTokenConfidentialTokenPairsSlice(uint256 fromIndex, uint256 toIndex) → TokenWrapperPair[]`
- `getTokenConfidentialTokenPair(uint256 index) → TokenWrapperPair`
- `getConfidentialTokenAddress(address erc20) → (bool found, address confidential)`
- `getTokenAddress(address confidential) → (bool found, address erc20)`
- `getTokenIndex(address erc20) → uint256`
- `isConfidentialTokenValid(address confidential) → bool`

### Write ABI (owner-gated — Ownable2Step; not for our app users)
- `registerConfidentialToken(address erc20, address confidential)`
  - Reverts `NotERC7984` / `ConfidentialTokenDoesNotSupportERC165` if target isn't a valid ERC-7984.
- `revokeConfidentialToken(address confidential)`

### Struct
```solidity
struct TokenWrapperPair {
    address tokenAddress;            // public ERC-20
    address confidentialTokenAddress;// ERC-7984 wrapper
    bool    isValid;                 // false = revoked → render as revoked/hidden
}
```

### Events (for indexing/add-a-pair docs)
- `ConfidentialTokenRegistered(address indexed tokenAddress, address indexed confidentialTokenAddress)`
- `ConfidentialTokenRevoked(address indexed tokenAddress, address indexed confidentialTokenAddress)`

## 2. Registered pairs — LIVE (8 pairs, all isValid=true)

> ⚠️ The Sepolia docs page lists **7** cTokenMocks. The chain has **8**.
> Pair #8 is NOT in the docs. Reading on-chain (our approach) surfaces it for free →
> direct Coverage advantage over teams that hardcode the doc list.

| # | Symbol (expected) | Underlying ERC-20 | Confidential ERC-7984 wrapper |
|---|---|---|---|
| 1 | cUSDC  | `0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF` | `0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639` |
| 2 | cUSDT  | `0xa7dA08FafDC9097Cc0E7D4f113A61e31d7e8e9b0` | `0x4E7B06D78965594eB5EF5414c357ca21E1554491` |
| 3 | cWETH  | `0xff54739b16576FA5402F211D0b938469Ab9A5f3F` | `0x46208622DA27d91db4f0393733C8BA082ed83158` |
| 4 | cBRON  | `0xFf021fB13cA64e5354c62c954b949a88cfDEb25E` | `0xaa5612FA27c927a0c7961f5AEFEE5ba3A0F9C891` |
| 5 | cZAMA  | `0x75355a85c6FB9df5f0C80FF54e8747EEe9a0BF57` | `0xf2D628d2598aF4eAF94CB76a437Ff86CA78FfbFB` |
| 6 | ctGBP  | `0x93c931278A2aad1916783F952f94276eA5111442` | `0xfCE5c7069c5525eF6c8C2b2E35A745bA20a2F7CC` |
| 7 | cXAUt  | `0x24377AE4AA0C45ecEe71225007f17c5D423dd940` | `0xe4FcF848739845BC81Dee1d5352cf3844F0a60C7` |
| 8 | **??? (undocumented)** | `0xf6Ef9ADB61A48E29E36bc873070A46A3D2667ff3` | `0x167DC962808B32CFFFc7e14B5018c0bE06A3A208` |

Symbols/decimals/names are read at runtime from each token (do NOT hardcode — render from chain).

### Per-token metadata — verified live (node scripts/verify-registry.mjs)

| # | ERC-20 sym | ERC-20 dec | Confidential sym | Conf. dec | rate | valid |
|---|---|---|---|---|---|---|
| 1 | USDCMock | 6  | cUSDCMock | 6 | 1            | ✓ |
| 2 | USDTMock | 6  | cUSDTMock | 6 | 1            | ✓ |
| 3 | WETHMock | 18 | cWETHMock | 6 | 1000000000000 | ✓ |
| 4 | BRONMock | 18 | cBRONMock | 6 | 1000000000000 | ✓ |
| 5 | ZAMAMock | 18 | cZAMAMock | 6 | 1000000000000 | ✓ |
| 6 | tGBPMock | 18 | ctGBPMock | 6 | 1000000000000 | ✓ |
| 7 | XAUtMock | 6  | cXAUtMock | 6 | 1            | ✓ |
| 8 | tGBP (undocumented) | 18 | ctGBP | 6 | 1000000000000 | ✓ |

### ⚠️ Wrap/unwrap math — decimals are asymmetric (critical for Phase 5/6)

- The confidential ERC-7984 wrapper is **always 6 decimals** (euint64 fits ~1.8e19).
- The underlying ERC-20 may be 6 or 18 decimals.
- `rate = 10^(erc20Decimals - 6)`:  6-dec tokens → rate 1;  18-dec tokens → rate 1e12.
- **wrap(to, amount):** `amount` is in ERC-20 raw units; mints `amount / rate` confidential
  units (6 dec). Amount is rounded DOWN to a multiple of `rate` (sub-rate dust ignored).
- **unwrap:** burns confidential units (6 dec); releases `confidentialUnits * rate` ERC-20 raw.
- UX rule: take the user's human amount → ERC-20 raw = `parseUnits(x, erc20Decimals)`;
  confidential display = `formatUnits(handleValue, 6)`. Never assume the two decimals match.

## 3. Confidential wrapper logic — `ConfidentialWrapperV3`

- Current impl (e.g. for cUSDC proxy `0x7c5BF43B…`): `0x390aA02fB7ebA565bfCFC43f67DB7E4D05c1D0Ee`
- This is **Zama's own wrapper**, richer than raw OZ `ERC7984ERC20Wrapper`.

### Wrap (ERC-20 → ERC-7984)
1. `approve(wrapper, amount)` on the underlying ERC-20.
2. `wrap(address to, uint256 amount) → euint64` — pulls ERC-20 via transferFrom, mints encrypted to `to`.
   - Emits `Wrap(address indexed to, uint256 roundedAmount, euint64 encryptedWrappedAmount)`.
   - Amount is rounded down to a multiple of `rate()` (dust below the rate is not wrapped).

### Unwrap (ERC-7984 → ERC-20) — async, KMS-verified
- `unwrap(address from, address to, euint64 amount) → bytes32 unwrapRequestId`
- `unwrap(address from, address to, externalEuint64 encryptedAmount, bytes inputProof) → bytes32 unwrapRequestId`
  - Emits `UnwrapRequested(address indexed receiver, bytes32 indexed unwrapRequestId, euint64 amount)`.
- `finalizeUnwrap(bytes32 unwrapRequestId, uint64 unwrapAmountCleartext, bytes decryptionProof)`
  - Verifies KMS signatures (reverts `InvalidKMSSignatures`); on success releases underlying ERC-20.
  - Emits `UnwrapFinalized(address indexed receiver, bytes32 indexed unwrapRequestId, euint64 encryptedAmount, uint64 cleartextAmount)`.
- Helpers: `unwrapAmount(bytes32 id) → euint64`, `unwrapRequester(bytes32 id) → address`.
- ✅ RESOLVED (Phase 6, from V3 source `ERC7984ERC20WrapperUpgradeable`): there is **no oracle
  auto-callback**. `_unwrap` burns the amount, calls `FHE.makePubliclyDecryptable(burnedAmount)`,
  and stores the request. The **frontend must drive `finalizeUnwrap`** using the relayer's
  PUBLIC decryption. Key facts:
  - `unwrapRequestId` **IS** the burned-amount ciphertext handle (`euint64.unwrap(burned)`),
    emitted as the indexed `unwrapRequestId` in `UnwrapRequested(to, unwrapRequestId, amount)`.
  - `_burn` caps at the user's balance and returns the ACTUAL burned amount → over-requesting
    is safe (unwraps exactly what you hold). Sending `uint64.max` = "unwrap everything".
  - Self-unwrap (`from == msg.sender`) needs NO operator/approval when using the
    `unwrap(from,to,externalEuint64,inputProof)` variant (the input proof authorizes use).
  - `finalizeUnwrap(id, cleartext, proof)` runs `FHE.checkSignatures` then sends
    `cleartext * rate` underlying ERC-20 to the stored recipient. Permissionless to call.
  - SDK 0.4.1 `instance.publicDecrypt([handle])` → `{ clearValues: {[handle]: bigint},
    abiEncodedClearValues, decryptionProof }`. Pass `clearValues[id]` as cleartext and
    `decryptionProof` straight into `finalizeUnwrap`. publicDecrypt is permissionless (no EIP-712).
  - FLOW (3 steps): encrypt amount client-side → `unwrap(...)` tx1 → `publicDecrypt(id)` (retry
    until relayer indexes tx1) → `finalizeUnwrap(...)` tx2. No live example existed on-chain to
    trace (zero unwrap events chain-wide), so this is sourced from the verified V3 contract.

### ACL / operator
- `setOperator(address operator, uint48 until)` — time-bounded operator approval.
- `isOperator(address holder, address spender) → bool`.
- Unwrapping `from` an address other than caller needs operator rights or the
  `externalEuint64 + inputProof` variant. For self-unwrap, the proofless `euint64` variant
  works when the caller holds ACL on the handle.

### Deny list (⚠️ new error surface to handle)
- `blockUser(address)` / `unblockUser(address)` (owner), `isBlocked(address) → bool`.
- Reverts `BlockedUser` / `UnderlyingDenyListedAddress`. Surface gracefully in UI.

### Metadata / balances
- `confidentialBalanceOf(address) → euint64 (bytes32 handle)` — decrypt client-side (EIP-712).
- `underlying() → address`, `rate() → uint256`, `decimals() → uint8`, `name()`, `symbol()`, `contractURI()`.
- Holder gets ACL on their own balance by default (ERC-7984 behavior) → arbitrary-token
  self-decrypt works without extra contract calls.

## 4. Underlying mock ERC-20 (faucet)

Verified on cUSDC underlying `0x9b5Cd13b…` (all mocks share this shape):
- **Faucet = `mint(address to, uint256 amount)`** — public, permissionless, no allowlist.
- `MAX_MINT_AMOUNT_TOKENS() → uint256` — per-call cap; reverts `MintAmountExceedsMax(amount, max)`.
- Standard ERC-20: `name/symbol/decimals/balanceOf/approve/allowance/transfer/transferFrom`.
- Build: read `MAX_MINT_AMOUNT_TOKENS` and `decimals` per token; cap the faucet input.

## 5. Relayer SDK (frontend) — from skill, to validate in P2
- Package `@zama-fhe/relayer-sdk@0.4.1`; `createInstance({ ...SepoliaConfig, network: window.ethereum })`.
- Sepolia chainId `11155111`; Gateway chainId `10901`.
- User decryption: EIP-712 `createEIP712` → `signTypedData` → `userDecrypt`. ≤ 2048 bits/request.

## Phase 0 status: COMPLETE
Open items intentionally deferred (not blockers):
- finalizeUnwrap submitter (→ P6, verify via real tx trace).
- Pair #8 symbol + per-token decimals/symbols (→ read at runtime / seed in P3 config).

---

# Verified Ethereum MAINNET Chain Facts (chain `1`)

> Added 2026-06-28. Registry verified on-chain via Blockscout (mainnet `1`).
> Wrapper pairs + relayer config from Zama's official addresses doc + the
> installed `@zama-fhe/relayer-sdk@0.4.1` presets. App reads pairs at runtime, so
> per-token addresses are not hardcoded — the registry address is the only pin.

## M1. Wrappers Registry (mainnet)

- **Proxy (call this):** `0xeb5015fF021DB115aCe010f23F55C2591059bBA0`
  - On-chain: ERC1967 proxy, `is_verified=true`, deployed 2025-12-26. Same
    `ConfidentialTokenWrappersRegistry` contract family as Sepolia.
  - **Implementation:** `0xA989D32d7348e0Da8145C6282E839dfC4DB8954f`
- ABI is identical to Sepolia → `src/abi/registry.ts` works unchanged.

## M2. Registered pairs (from Zama official addresses doc — verify at runtime)

| # | Symbol | Underlying ERC-20 | Confidential ERC-7984 wrapper |
|---|---|---|---|
| 1 | cUSDC      | `0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48` | `0xe978F22157048E5DB8E5d07971376e86671672B2` |
| 2 | cUSDT      | `0xdAC17F958D2ee523a2206206994597C13D831ec7` | `0xAe0207C757Aa2B4019Ad96edD0092ddc63EF0c50` |
| 3 | cWETH      | `0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2` | `0xda9396b82634Ea99243cE51258B6A5Ae512D4893` |
| 4 | cBRON      | `0xBA2C598E11eD093079cC324FCa5BbbA99F616E83` | `0x85dE671c3bec1aDeD752c3Cea943521181C826bc` |
| 5 | cZAMA      | `0xA12CC123ba206d4031D1c7f6223D1C2Ec249f4f3` | `0x80CB147Fd86dC6dEe3Eee7e4Cee33d1397d98071` |
| 6 | ctGBP      | `0x27f6c8289550fce67f6b50bed1f519966afe5287` | `0xa873750ccBafD5ec7Dd13bfD5237d7129832eDD9` |
| 7 | cXAUt      | `0x68749665FF8D2d112Fa859AA293F07A622782F38` | `0x73cc9aF9d6BEFdb3c3fAf8a5E8c05Cb95FdaEEf1` |
| 8 | cbbqTGBP   | `0xbeeffABcd0dB09589Dd21854aa760C52aB4bf04F` | `0xBA4cFF6ED6F7Cb2A58776dECa4E984b498446762` |
| 9 | csteakcUSDC| `0xbEEF00A59B577423653A1526c7009bdE103F542B` | `0x66Bf74E96900D1a19c7070D939D124f2F565C458` |

> NOTE: these are REAL tokens (real USDC/USDT/WETH + yield vaults). There is **no
> faucet** on mainnet — `ChainConfig.hasFaucet=false` hides the faucet action.

## M3. FHEVM relayer (mainnet) — needs an API key

- From `@zama-fhe/relayer-sdk@0.4.1` `MainnetConfig`:
  - chainId `1`, gatewayChainId `261131`
  - relayerUrl `https://relayer.mainnet.zama.org`, default route version **2**
- Mainnet relayer requires auth: `auth: { __type: 'ApiKeyHeader', value: KEY }`
  → HTTP header **`x-api-key`**. Key must NOT ship in the browser.
- **Our solution:** SDK `relayerUrl` is overridden to same-origin `/api/relayer/v2`;
  the Vercel Edge function `api/relayer/[...path].ts` strips `/api/relayer` and
  forwards to `https://relayer.mainnet.zama.org/*` with `x-api-key` injected from
  the server-side `RELAYER_API_KEY` env var. SDK endpoints hit
  `{relayerUrl}/keyurl|input-proof|user-decrypt|public-decrypt`.
- Sepolia relayer is keyless + CORS-open → no proxy, SDK default URL used.
