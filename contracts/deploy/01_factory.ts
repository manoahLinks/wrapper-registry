import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type { DeployFunction } from "hardhat-deploy/types";

/**
 * Deploys the community WrapperRegistry, then the ConfidentialWrapperFactory
 * pointed at it. Print the two addresses and paste them into the frontend's
 * src/config/chain.ts (customRegistryAddress + factoryAddress) for this chain.
 */
const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const registry = await deploy("WrapperRegistry", { from: deployer, log: true });
  const factory = await deploy("ConfidentialWrapperFactory", {
    from: deployer,
    args: [registry.address],
    log: true,
  });

  log("");
  log("=== Deployed (paste into src/config/chain.ts) ===");
  log(`  chainId:               ${await hre.getChainId()}`);
  log(`  customRegistryAddress: ${registry.address}`);
  log(`  factoryAddress:        ${factory.address}`);
};

export default func;
func.tags = ["factory"];
