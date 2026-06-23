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
TODO(build): resolve pair #8's symbol when seeding config (cosmetic only — it renders dynamically regardless).

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
- ⚠️ OPEN ITEM (resolve in Phase 6): confirm WHO submits `finalizeUnwrap` — Zama decryption
  oracle auto-callback (most likely; user just waits for `UnwrapFinalized`) vs. our frontend
  driving tx2 from a relayer `publicDecrypt` proof. Verify by tracing a real
  UnwrapRequested→UnwrapFinalized pair on Sepolia before building the UX.

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
