import { Signer } from "@ethersproject/abstract-signer";
import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { FeedsRegistry } from "../../src/types/FeedsRegistry";
import { FeedsRegistry__factory } from "../../src/types/factories/FeedsRegistry__factory";

task("deploy:FeedsRegistry")
  .addOptionalParam("admin", "The admin allowed to modify the oracles and minimum update time")
  .setAction(async function (taskArgs: TaskArguments, { ethers }) {
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
  });
