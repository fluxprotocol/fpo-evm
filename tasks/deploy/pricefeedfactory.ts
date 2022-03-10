import { Signer } from "@ethersproject/abstract-signer";
import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { FluxPriceFeedFactory } from "../../src/types/FluxPriceFeedFactory";
import { FluxPriceFeedFactory__factory } from "../../src/types/factories/FluxPriceFeedFactory__factory";

// npx hardhat deploy:FluxPriceFeedFactory --network kovan
task("deploy:FluxPriceFeedFactory")
  .addOptionalParam("validator", "The validator allowed to post data to the contract")
  .setAction(async function (taskArgs: TaskArguments, { ethers }) {
    const accounts: Signer[] = await ethers.getSigners();

    let validator;
    if (taskArgs.validator) {
      validator = taskArgs.validator;
    } else {
      validator = await accounts[0].getAddress();
    }
    console.log("validator = ", validator);
    const pricefeedFactory: FluxPriceFeedFactory__factory = <FluxPriceFeedFactory__factory>(
      await ethers.getContractFactory("FluxPriceFeedFactory")
    );
    const factory: FluxPriceFeedFactory = <FluxPriceFeedFactory>await pricefeedFactory.deploy(validator);
    await factory.deployed();
    console.log("FluxPriceFeedFactory deployed to: ", factory.address);
  });
