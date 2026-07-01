import { ethers, network } from "hardhat";

// Read-only sanity check: confirms the RPC URL + signer resolve and prints the
// deployer's balance. Run: npx hardhat run scripts/checknet.ts --network sepolia
async function main() {
  const url = (network.config as { url?: string }).url;
  console.log("network:        ", network.name);
  console.log("rpc url set:    ", !!url);
  const bn = await ethers.provider.getBlockNumber();
  console.log("block number:   ", bn);
  const [signer] = await ethers.getSigners();
  const addr = await signer.getAddress();
  const bal = await ethers.provider.getBalance(addr);
  console.log("deployer:       ", addr);
  console.log("balance:        ", ethers.formatEther(bal), "ETH");
  if (bal === 0n) console.log("⚠ deployer has 0 ETH — fund it before deploying.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
