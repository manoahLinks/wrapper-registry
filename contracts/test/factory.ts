import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("ConfidentialWrapperFactory + WrapperRegistry", function () {
  async function deployFixture() {
    const [deployer, alice] = await ethers.getSigners();

    const Registry = await ethers.getContractFactory("WrapperRegistry");
    const registry = await Registry.deploy();
    await registry.waitForDeployment();

    const Factory = await ethers.getContractFactory("ConfidentialWrapperFactory");
    const factory = await Factory.deploy(await registry.getAddress());
    await factory.waitForDeployment();

    const Mock = await ethers.getContractFactory("MockERC20");
    const mock = await Mock.deploy("Mock USD", "mUSD", 6);
    await mock.waitForDeployment();

    return { registry, factory, mock, deployer, alice };
  }

  it("deploys a wrapper, registers the pair, and links the underlying", async function () {
    const { registry, factory, mock } = await loadFixture(deployFixture);

    const tx = await factory.createWrapper(await mock.getAddress(), "Confidential mUSD", "cmUSD", "");
    const receipt = await tx.wait();

    // WrapperCreated event carries the new wrapper address.
    const ev = receipt!.logs
      .map((l) => {
        try {
          return factory.interface.parseLog(l);
        } catch {
          return null;
        }
      })
      .find((p) => p?.name === "WrapperCreated");
    expect(ev, "WrapperCreated emitted").to.not.equal(undefined);
    const wrapperAddr = ev!.args.confidentialToken as string;

    // Registry recorded exactly one valid pair, Zama-compatible shape.
    const pairs = await registry.getTokenConfidentialTokenPairs();
    expect(pairs.length).to.equal(1);
    expect(pairs[0].tokenAddress).to.equal(await mock.getAddress());
    expect(pairs[0].confidentialTokenAddress).to.equal(wrapperAddr);
    expect(pairs[0].isValid).to.equal(true);

    // The wrapper actually wraps the mock.
    const wrapper = await ethers.getContractAt("ConfidentialERC20Wrapper", wrapperAddr);
    expect(await wrapper.underlying()).to.equal(await mock.getAddress());
  });

  it("rejects a duplicate registration", async function () {
    const { registry, factory, mock } = await loadFixture(deployFixture);
    await factory.createWrapper(await mock.getAddress(), "Confidential mUSD", "cmUSD", "");
    // Registering a *second* wrapper for the same underlying is fine (different
    // confidential address); re-registering the same confidential token reverts.
    const pairs = await registry.getTokenConfidentialTokenPairs();
    await expect(
      registry.register(await mock.getAddress(), pairs[0].confidentialTokenAddress),
    ).to.be.revertedWithCustomError(registry, "AlreadyRegistered");
  });

  it("wraps the underlying into an encrypted balance", async function () {
    const { factory, mock, alice } = await loadFixture(deployFixture);
    const tx = await factory.createWrapper(await mock.getAddress(), "Confidential mUSD", "cmUSD", "");
    const receipt = await tx.wait();
    const ev = receipt!.logs
      .map((l) => {
        try {
          return factory.interface.parseLog(l);
        } catch {
          return null;
        }
      })
      .find((p) => p?.name === "WrapperCreated");
    const wrapperAddr = ev!.args.confidentialToken as string;
    const wrapper = await ethers.getContractAt("ConfidentialERC20Wrapper", wrapperAddr);

    await (await mock.mint(alice.address, 1_000n)).wait();
    await (await mock.connect(alice).approve(wrapperAddr, 1_000n)).wait();
    await (await wrapper.connect(alice).wrap(alice.address, 1_000n)).wait();

    const handle = await wrapper.confidentialBalanceOf(alice.address);
    const bal = await fhevm.userDecryptEuint(FhevmType.euint64, handle, wrapperAddr, alice);
    expect(bal).to.equal(1_000n);
  });
});
