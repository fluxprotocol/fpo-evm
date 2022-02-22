import { Signer } from "@ethersproject/abstract-signer";
import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { FluxMultiPriceFeed } from "../../src/types/FluxMultiPriceFeed";
import { FluxMultiPriceFeed__factory } from "../../src/types/factories/FluxMultiPriceFeed__factory";

task("deploy:FluxMultiPriceFeed")
  .addOptionalParam("validator", "The validator allowed to post data to the contract")
  .setAction(async function (taskArgs: TaskArguments, { ethers }) {
    const accounts: Signer[] = await ethers.getSigners();

    let validator;
    if (taskArgs.validator) {
      validator = taskArgs.validator;
    } else {
      validator = await accounts[0].getAddress();
    }

    const pricefeedFactory: FluxMultiPriceFeed__factory = <FluxMultiPriceFeed__factory>(
      await ethers.getContractFactory("FluxMultiPriceFeed")
    );
    const multiPriceFeed: FluxMultiPriceFeed = <FluxMultiPriceFeed>(
      await pricefeedFactory.deploy(validator)
    );
    await multiPriceFeed.deployed();
    console.log("FluxMultiPriceFeed deployed to: ", multiPriceFeed.address);
  });
