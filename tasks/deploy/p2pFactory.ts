import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";
import { FluxP2PFactory } from "../../src/types/FluxP2PFactory";
import { FluxP2PFactory__factory } from "../../src/types/factories/FluxP2PFactory__factory";
import sleep from "../../utils/sleep";
const VERIFY_DELAY = 100000;

// npx hardhat deploy:p2pFactory --network kovan --verify
task("deploy:p2pFactory")
  .addFlag("verify")
  .setAction(async function (taskArgs: TaskArguments, { run, ethers }) {
    const p2pFactory: FluxP2PFactory__factory = <FluxP2PFactory__factory>(
      await ethers.getContractFactory("FluxP2PFactory")
    );

    const p2p: FluxP2PFactory = <FluxP2PFactory>await p2pFactory.deploy();
    await p2p.deployed();
    console.log("FluxP2PFactory deployed to: ", p2p.address);

    if (taskArgs.verify) {
      console.log("Verifying contract, can take some time");
      await sleep(VERIFY_DELAY);
      await run("verify:verify", {
        address: p2p.address,
        constructorArguments: [],
      });
      console.log("Etherscan Verification Done");
    }
  });
