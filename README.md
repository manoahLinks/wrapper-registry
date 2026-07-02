# Confidential Wrapper Registry

A usable product on top of the official **Zama Confidential Token Wrappers Registry**:
browse the canonical ERC‑20 ↔ ERC‑7984 pairs, claim test tokens, **wrap** public
tokens into encrypted balances, **decrypt** what's yours (EIP‑712), and **unwrap**
back — on **Sepolia** and **Ethereum mainnet**.

Frontend: Vite + React + TypeScript, wagmi/RainbowKit, `@zama-fhe/relayer-sdk`,
Tailwind. Contracts (factory + community registry): `contracts/` (Hardhat + FHEVM).

```bash
pnpm install
cp .env.example .env      # fill in RPC + WalletConnect id (see .env.example)
pnpm dev                  # http://localhost:5173
pnpm build
```

---

## How the registry is sourced (hybrid)

The grid is a **hybrid** with a strict precedence — the official on‑chain registry
is the primary source of truth, and additional sources layer on top. Pairs are
**deduplicated by wrapper (ERC‑7984) address; the first source to declare a wrapper
wins**, so nothing below can override an official entry. All token metadata
(symbol/name/decimals/rate) is read **live from chain** — never hardcoded.

Precedence (highest → lowest), in `src/hooks/useRegistryPairs.ts`:

| # | Source | Where | Scope |
|---|--------|-------|-------|
| 1 | **Official Zama registry** (primary) | on‑chain `getTokenConfidentialTokenPairs()` | everyone |
| 2 | **Community registry** (ours) | on‑chain `WrapperRegistry` | everyone |
| 3 | **Local config** | `src/config/pairs.config.ts` | ships with the app |
| 4 | **Browser‑saved custom** | `localStorage` (per user, per chain) | just that browser |

---

## Adding a new ERC‑20 ↔ ERC‑7984 pair

There are four supported ways, from quickest to most permanent. Pick the one that
matches how widely the pair should be visible.

### A. In‑app, on‑chain for everyone — **⚡ Deploy a wrapper** (recommended)

If the ERC‑20 has **no** wrapper yet, deploy one and register it — all from the UI.
Our `ConfidentialWrapperFactory` deploys an ERC‑7984 wrapper and registers the pair
in our community `WrapperRegistry` in a single transaction, so it appears for
everyone (Zama's official registry is owner‑gated and can't accept user pairs).

1. Connect a wallet on a supported chain where the factory is configured (Sepolia).
2. Click **⚡ Deploy a wrapper** → paste the **ERC‑20 address**.
3. It reads the token, derives `Confidential <name>` / `c<SYMBOL>`, and on confirm
   calls `factory.createWrapper(erc20, name, symbol, uri)`.
4. The new pair shows up with a **Community** badge.

**Example (Sepolia):** paste the test token `0x72FC66F04E68C522BE4EF7D4A15C563308945393`
→ deploys `cT21` and registers `T21 ↔ cT21`.

Prefer the CLI? `contracts/` exposes the same factory:

```solidity
// factory: 0xDA57C2140F159ED819F3EE8101C5569740f42DBA (Sepolia)
factory.createWrapper(
  0x72FC66F04E68C522BE4EF7D4A15C563308945393, // ERC-20
  "Confidential Test Token 21",               // name
  "cT21",                                     // symbol
  ""                                          // metadata URI
);
```

If a wrapper already exists but isn't registered, call the registry directly —
it's permissionless and validated (`confidentialToken.underlying()` must match):

```solidity
// registry: 0x9bdCA1F93a5082a34A2Eed5e906a2e0f3c453A99 (Sepolia)
registry.register(erc20Address, existingWrapperAddress);
```

### B. In‑app, per user — **＋ Add a pair**

Track any already‑deployed ERC‑7984 wrapper privately in your own browser (no gas).

1. Click **＋ Add a pair** → paste the **ERC‑7984 wrapper address**.
2. It reads `underlying()` to derive the ERC‑20 and validates the token, showing a
   "Detected `cXYZ` ✓" preview.
3. Save → the pair appears with a **Custom** badge and is stored in `localStorage`
   (per chain). Remove it anytime via the **×** on the card.

### C. Local config — ship a pair as an app default

To bundle a pair with the app (e.g. a dev/test token that should always appear),
add it to `LOCAL_PAIRS` in **`src/config/pairs.config.ts`**. It's merged on top of
the on‑chain registry (on‑chain wins on conflict) and rendered with a **Local** badge.

```ts
// src/config/pairs.config.ts — edit the exported LOCAL_PAIRS array (LocalPair
// is already defined in this file):
export const LOCAL_PAIRS: LocalPair[] = [
  {
    erc20:        '0x72FC66F04E68C522BE4EF7D4A15C563308945393', // public ERC-20
    confidential: '0x…',                                        // ERC-7984 wrapper
    label:        'Test Token 21 (dev)',                        // optional
  },
]
```

Save, and the pair shows in the grid with full faucet/wrap/unwrap/decrypt actions.

### D. Official on‑chain registry (owner‑gated)

Pairs registered in Zama's official `ConfidentialTokenWrappersRegistry` appear
**automatically** as the primary source — no app change needed. This is
owner‑gated, so it's not something app users call; it's how the canonical tokens
(cUSDC, cUSDT, cWETH, …) already show up.

```
registerConfidentialToken(tokenAddress, confidentialTokenAddress) // onlyOwner
```

---

## Deployed addresses

| | Sepolia (11155111) | Ethereum mainnet (1) |
|---|---|---|
| Zama official registry | `0x2f0750Bbb0A246059d80e94c454586a7F27a128e` | `0xeb5015fF021DB115aCe010f23F55C2591059bBA0` |
| Community registry (ours) | `0x9bdCA1F93a5082a34A2Eed5e906a2e0f3c453A99` | — (deploy via `contracts/`) |
| Wrapper factory (ours) | `0xDA57C2140F159ED819F3EE8101C5569740f42DBA` | — |

Configured per chain in `src/config/chain.ts`. See `contracts/README.md` to deploy
the factory/registry to a new network, and `docs/VERIFIED_CHAIN_FACTS.md` for the
verified protocol facts.

## Notes

- **Faucet** works only for tokens with a public `mint(address,uint256)` (the
  official mocks and `contracts/mocks/MockERC20.sol`) — arbitrary ERC‑20s can't be
  minted. Deploy a mintable test token with `cd contracts && MOCK_SYMBOL=T21 npm run deploy:mock:sepolia`.
- **Mainnet** decryption requires a Zama relayer API key proxied server‑side
  (`api/relayer/`); Sepolia's relayer is keyless.
