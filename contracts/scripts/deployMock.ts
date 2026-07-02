import { ethers, network } from "hardhat";

// Deploy a publicly-mintable ERC-20 for testing the wrapper + faucet flow.
// Override via env: MOCK_NAME, MOCK_SYMBOL, MOCK_DECIMALS.
//   MOCK_SYMBOL=T21 npx hardhat run scripts/deployMock.ts --network sepolia
//
// Uses a tight, computed EIP-1559 fee so the upfront reserve (gasLimit*maxFee)
// stays close to the real cost — important when the deployer is low on ETH.
async function main() {
  const name = process.env.MOCK_NAME ?? "Test Token 21";
  const symbol = process.env.MOCK_SYMBOL ?? "T21";
  const decimals = Number(process.env.MOCK_DECIMALS ?? 6);

  const [deployer] = await ethers.getSigners();
  const provider = ethers.provider;
  const balance = await provider.getBalance(deployer.address);

  console.log("network: ", network.name);
  console.log("deployer:", deployer.address);
  console.log("balance: ", ethers.formatEther(balance), "ETH");

  const Mock = await ethers.getContractFactory("MockERC20");
  const deployTx = await Mock.getDeployTransaction(name, symbol, decimals);
  const gas = await provider.estimateGas({ ...deployTx, from: deployer.address });
  const gasLimit = (gas * 102n) / 100n; // +2% headroom

  const fee = await provider.getFeeData();
  const base = fee.gasPrice ?? ethers.parseUnits("30", "gwei");
  const maxFeePerGas = (base * 115n) / 100n; // 15% over base — enough to include
  const maxPriorityFeePerGas = ethers.parseUnits("1", "gwei");

  const reserve = gasLimit * maxFeePerGas;
  console.log("est gas: ", gas.toString(), "| maxFee:", ethers.formatUnits(maxFeePerGas, "gwei"), "gwei");
  console.log("upfront reserve:", ethers.formatEther(reserve), "ETH");
  if (balance < reserve) {
    const short = reserve - balance;
    console.error(`\n⚠ Insufficient funds. Top up ${deployer.address} with ~${ethers.formatEther(short)} more Sepolia ETH and retry.`);
    process.exit(1);
  }

  const mock = await Mock.deploy(name, symbol, decimals, { gasLimit, maxFeePerGas, maxPriorityFeePerGas });
  await mock.waitForDeployment();
  const addr = await mock.getAddress();

  console.log("");
  console.log(`Deployed MockERC20  ${name} (${symbol}, ${decimals} decimals)`);
  console.log(`  address: ${addr}`);
  console.log("  publicly mintable via mint(address,uint256) — the faucet works.");
  console.log("");
  console.log("Next: in the app, ⚡ Deploy a wrapper → paste this address.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
