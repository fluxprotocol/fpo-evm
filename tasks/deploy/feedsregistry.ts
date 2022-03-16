import { Signer } from "@ethersproject/abstract-signer";
import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { FeedsRegistry } from "../../src/types/FeedsRegistry";
import { FeedsRegistry__factory } from "../../src/types/factories/FeedsRegistry__factory";

import sleep from "../../utils/sleep";
const VERIFY_DELAY = 100000;
// npx hardhat deploy:FeedsRegistry --network kovan --verify
//deployed and verified: 0x01be1fCd83D8468B34c79e0d08B9f81A4749baD4
task("deploy:FeedsRegistry")
  .addOptionalParam("admin", "The admin allowed to modify the oracles and minimum update time")
  .addFlag("verify")
  .setAction(async function (taskArgs: TaskArguments, { run, ethers }) {
    const accounts: Signer[] = await ethers.getSigners();

    let admin;
    if (taskArgs.admin) {
      admin = taskArgs.admin;
    } else {
      admin = await accounts[0].getAddress();
    }

    const frFactory: FeedsRegistry__factory = <FeedsRegistry__factory>await ethers.getContractFactory("FeedsRegistry");
    const feedsregistry: FeedsRegistry = <FeedsRegistry>await frFactory.deploy(admin);
    await feedsregistry.deployed();
    console.log("FeedsRegistry deployed to: ", feedsregistry.address);

    if (taskArgs.verify) {
      console.log("Verifying contract, can take some time");
      await sleep(VERIFY_DELAY);
      await run("verify:verify", {
        address: feedsregistry.address,
        constructorArguments: [admin],
      });
      console.log("Etherscan Verification Done");
    }
  });
