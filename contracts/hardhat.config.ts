import "@fhevm/hardhat-plugin";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-network-helpers";
import "@nomicfoundation/hardhat-verify";
import "@typechain/hardhat";
import "hardhat-deploy";

import type { HardhatUserConfig } from "hardhat/config";
import { vars } from "hardhat/config";

// Deployer & RPC — set the ones you have via `npx hardhat vars set <NAME>`:
//   PRIVATE_KEY            deployer key (preferred), or MNEMONIC (12 words)
//   RPC URL, in order of precedence per network:
//     SEPOLIA_RPC_URL / MAINNET_RPC_URL   (a full URL), or
//     ALCHEMY_API_KEY_SEPOLIA / ALCHEMY_API_KEY_MAINNET, or
//     INFURA_API_KEY
//   ETHERSCAN_API_KEY     optional, for `npm run verify:*`
const DEV_MNEMONIC = "test test test test test test test test test test test junk";

const PRIVATE_KEY: string = vars.get("PRIVATE_KEY", "");
const MNEMONIC: string = vars.get("MNEMONIC", DEV_MNEMONIC);
const INFURA_API_KEY: string = vars.get("INFURA_API_KEY", "");
const ETHERSCAN_API_KEY: string = vars.get("ETHERSCAN_API_KEY", "");

// Accepts a full URL, a scheme-less host/path (e.g. "eth-sepolia.g.alchemy.com/v2/KEY"),
// or a bare Alchemy key — and normalises all three to a usable https URL.
function asUrl(raw: string, alchemyHost: string): string {
  if (!raw) return "";
  if (raw.startsWith("http")) return raw;
  if (raw.includes("/") || raw.includes(".")) return `https://${raw}`;
  return `https://${alchemyHost}/v2/${raw}`; // bare key
}
function rpcUrl(urlVar: string, alchemyVar: string, alchemyHost: string, infuraHost: string): string {
  const explicit = vars.get(urlVar, "");
  if (explicit) return asUrl(explicit, alchemyHost);
  const alchemy = vars.get(alchemyVar, "");
  if (alchemy) return asUrl(alchemy, alchemyHost);
  if (INFURA_API_KEY) return `https://${infuraHost}/v3/${INFURA_API_KEY}`;
  return "";
}
const SEPOLIA_RPC_URL = rpcUrl("SEPOLIA_RPC_URL", "ALCHEMY_API_KEY_SEPOLIA", "eth-sepolia.g.alchemy.com", "sepolia.infura.io");
const MAINNET_RPC_URL = rpcUrl("MAINNET_RPC_URL", "ALCHEMY_API_KEY_MAINNET", "eth-mainnet.g.alchemy.com", "mainnet.infura.io");

// Live-network signer: a private key (if set) wins over the mnemonic.
const accounts = PRIVATE_KEY
  ? [PRIVATE_KEY.startsWith("0x") ? PRIVATE_KEY : `0x${PRIVATE_KEY}`]
  : { mnemonic: MNEMONIC, path: "m/44'/60'/0'/0/", count: 10 };

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  namedAccounts: { deployer: 0 },
  etherscan: {
    apiKey: { sepolia: ETHERSCAN_API_KEY, mainnet: ETHERSCAN_API_KEY },
  },
  networks: {
    // Local network always uses the canonical test mnemonic (never your vars).
    hardhat: { accounts: { mnemonic: DEV_MNEMONIC }, chainId: 31337 },
    sepolia: { accounts, chainId: 11155111, url: SEPOLIA_RPC_URL },
    mainnet: { accounts, chainId: 1, url: MAINNET_RPC_URL },
  },
  paths: { sources: "./contracts", tests: "./test", artifacts: "./artifacts", cache: "./cache" },
  solidity: {
    version: "0.8.27",
    settings: {
      metadata: { bytecodeHash: "none" },
      optimizer: { enabled: true, runs: 800 },
      evmVersion: "cancun",
    },
  },
  typechain: { outDir: "types", target: "ethers-v6" },
  mocha: { timeout: 120_000 },
};

export default config;
