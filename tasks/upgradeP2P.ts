import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";
import sleep from "../utils/sleep";
const VERIFY_DELAY = 100000;

// npx hardhat upgradeP2P --network kovan --proxy 0xf4f6E2aD080CDC61F5AefE513cC6fbf932C84C45 --verify
task("upgradeP2P")
  .addParam("proxy", "The proxy address")
  .addFlag("verify")
  .setAction(async function (taskArgs: TaskArguments, { run, ethers, upgrades }) {
    const p2pFactory_v2 = await ethers.getContractFactory("FluxP2PFactory_v2");
    const upgraded = await upgrades.upgradeProxy(taskArgs.proxy, p2pFactory_v2);
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(upgraded.address);
    console.log("new implementationAddress: ", implementationAddress); // p2pFactory address

    if (taskArgs.verify) {
      console.log("Verifying contract, can take some time");
      await sleep(VERIFY_DELAY);
      await run("verify:verify", {
        address: implementationAddress,
        constructorArguments: [],
      });
      console.log("Etherscan Verification Done");
    }
  });
