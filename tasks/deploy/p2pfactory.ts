import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";
import { FluxP2PFactory } from "../../src/types/FluxP2PFactory";
import { FluxP2PFactory__factory } from "../../src/types/factories/FluxP2PFactory__factory";
import sleep from "../../utils/sleep";
const VERIFY_DELAY = 100000;

// npx hardhat deploy:FluxP2PFactory --network kovan --verify
task("deploy:FluxP2PFactory")
  .addOptionalParam("validators", "The validator allowed to post data to the contract")
  .addFlag("verify")
  .setAction(async function (taskArgs: TaskArguments, { run, ethers }) {
    const pricefeedFactory: FluxP2PFactory__factory = <FluxP2PFactory__factory>(
      await ethers.getContractFactory("FluxP2PFactory")
    );
    const factory: FluxP2PFactory = <FluxP2PFactory>await pricefeedFactory.deploy();
    await factory.deployed();
    console.log("FluxP2PFactory deployed to: ", factory.address);

    if (taskArgs.verify) {
      console.log("Verifying contract, can take some time");
      await sleep(VERIFY_DELAY);
      await run("verify:verify", {
        address: factory.address,
        constructorArguments: [],
      });
      console.log("Etherscan Verification Done");
    }
  });
