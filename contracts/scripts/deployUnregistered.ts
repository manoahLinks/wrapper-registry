import { ethers, network } from "hardhat";

// Deploys a publicly-mintable ERC-20 AND a ConfidentialERC20Wrapper for it,
// DIRECTLY (not via the factory) — so the pair is NOT in the community registry.
// Use it to demo the "Register existing" flow: paste the printed wrapper address.
//   MOCK_SYMBOL=EXT npx hardhat run scripts/deployUnregistered.ts --network sepolia
async function main() {
  const name = process.env.MOCK_NAME ?? "External Token";
  const symbol = process.env.MOCK_SYMBOL ?? "EXT";
  const decimals = Number(process.env.MOCK_DECIMALS ?? 6);

  const [deployer] = await ethers.getSigners();
  const provider = ethers.provider;
  const balance = await provider.getBalance(deployer.address);
  console.log("network: ", network.name);
  console.log("deployer:", deployer.address);
  console.log("balance: ", ethers.formatEther(balance), "ETH");

  const fee = await provider.getFeeData();
  const base = fee.gasPrice ?? ethers.parseUnits("30", "gwei");
  const maxFeePerGas = (base * 115n) / 100n;
  const maxPriorityFeePerGas = ethers.parseUnits("1", "gwei");

  const Mock = await ethers.getContractFactory("MockERC20");
  const Wrapper = await ethers.getContractFactory("ConfidentialERC20Wrapper");

  // Preflight: estimate BOTH deploys before spending anything.
  const mockTx = await Mock.getDeployTransaction(name, symbol, decimals);
  const mockGas = await provider.estimateGas({ ...mockTx, from: deployer.address });
  // Estimate the wrapper against an existing ERC-20 (gas is ~independent of which).
  const estUnderlying = process.env.EST_UNDERLYING ?? "0x4b60d4729e3E56B220375ce2e4FF6B311d0A8c95";
  const wrapTx = await Wrapper.getDeployTransaction(estUnderlying, `Confidential ${name}`, `c${symbol}`, "");
  const wrapGas = await provider.estimateGas({ ...wrapTx, from: deployer.address });

  const totalGas = ((mockGas + wrapGas) * 102n) / 100n;
  const reserve = totalGas * maxFeePerGas;
  console.log("est gas · mock:", mockGas.toString(), "wrapper:", wrapGas.toString());
  console.log("upfront reserve (both):", ethers.formatEther(reserve), "ETH");
  if (balance < reserve) {
    const short = reserve - balance;
    console.error(`\n⚠ Insufficient funds. Top up ${deployer.address} with ~${ethers.formatEther(short)} more Sepolia ETH and retry.`);
    process.exit(1);
  }

  // 1) underlying ERC-20
  const mock = await Mock.deploy(name, symbol, decimals, { gasLimit: (mockGas * 102n) / 100n, maxFeePerGas, maxPriorityFeePerGas });
  await mock.waitForDeployment();
  const mockAddr = await mock.getAddress();
  console.log(`\nERC-20   ${symbol} : ${mockAddr}`);

  // 2) the wrapper — deployed directly, so it is NOT registered anywhere
  const wrapper = await Wrapper.deploy(mockAddr, `Confidential ${name}`, `c${symbol}`, "", { gasLimit: (wrapGas * 102n) / 100n, maxFeePerGas, maxPriorityFeePerGas });
  await wrapper.waitForDeployment();
  const wrapperAddr = await wrapper.getAddress();

  console.log(`ERC-7984 c${symbol}: ${wrapperAddr}`);
  console.log(`\n✓ Wrapper deployed but NOT registered.`);
  console.log(`Demo: ＋ Add a pair → Register existing → paste ${wrapperAddr}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
