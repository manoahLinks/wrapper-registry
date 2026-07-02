import { ethers } from "hardhat";

async function main() {
  const [d] = await ethers.getSigners();
  const bal = await ethers.provider.getBalance(d.address);
  const fee = await ethers.provider.getFeeData();
  const Mock = await ethers.getContractFactory("MockERC20");
  const tx = await Mock.getDeployTransaction("Test Token 21", "T21", 6);
  const gas = await ethers.provider.estimateGas({ ...tx, from: d.address });

  const g = (w: bigint | null) => (w == null ? "n/a" : `${ethers.formatUnits(w, "gwei")} gwei`);
  console.log("balance:        ", ethers.formatEther(bal), "ETH");
  console.log("estimated gas:  ", gas.toString());
  console.log("baseFee/gasPrice:", g(fee.gasPrice));
  console.log("maxFeePerGas:   ", g(fee.maxFeePerGas));
  const worstCase = fee.maxFeePerGas ? gas * fee.maxFeePerGas : 0n;
  const likely = fee.gasPrice ? gas * fee.gasPrice : 0n;
  console.log("upfront reserve (gas*maxFee):", ethers.formatEther(worstCase), "ETH");
  console.log("likely actual  (gas*gasPrice):", ethers.formatEther(likely), "ETH");
  console.log(bal >= worstCase ? "✅ fits at default fees" : "⚠ short at default fees — top up or use a tighter maxFee");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
