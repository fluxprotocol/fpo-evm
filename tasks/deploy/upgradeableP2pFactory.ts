import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";
import { FluxP2PFactory__factory } from "../../src/types/factories/FluxP2PFactory__factory";
import sleep from "../../utils/sleep";
const VERIFY_DELAY = 100000;

// npx hardhat deploy:UpgradeableP2P --network kovan --verify
task("deploy:UpgradeableP2P")
  .addFlag("verify")
  .setAction(async function (taskArgs: TaskArguments, { run, ethers, upgrades }) {
    const p2pFactory: FluxP2PFactory__factory = <FluxP2PFactory__factory>(
      await ethers.getContractFactory("FluxP2PFactory")
    );

    const proxy = await upgrades.deployProxy(p2pFactory);
    await proxy.deployed();
    console.log("proxy deployed to:", proxy.address);

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxy.address);
    console.log("implementationAddress: ", implementationAddress); // p2pFactory address

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
