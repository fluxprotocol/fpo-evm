import { Signer } from "@ethersproject/abstract-signer";
import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { ExamplePriceFeedConsumer } from "../../src/types/ExamplePriceFeedConsumer";
import { ExamplePriceFeedConsumer__factory } from "../../src/types/factories/ExamplePriceFeedConsumer__factory";

task("deploy:ExamplePriceFeedConsumer")
  .addParam("priceFeed", "The first-party price feed contract to read from (FluxPriceFeed.sol)")
  .addOptionalParam("validator", "The validator allowed to post data to the contract")
  .setAction(async function (taskArgs: TaskArguments, { ethers }) {
    const accounts: Signer[] = await ethers.getSigners();

    let validator;
    if (taskArgs.validator) {
      validator = taskArgs.validator;
    } else {
      validator = await accounts[0].getAddress();
    }
    console.log("Validator: ", validator);

    const pricefeedFactory: ExamplePriceFeedConsumer__factory = <ExamplePriceFeedConsumer__factory>(
      await ethers.getContractFactory("ExamplePriceFeedConsumer")
    );
    const pricefeed: ExamplePriceFeedConsumer = <ExamplePriceFeedConsumer>(
      await pricefeedFactory.deploy(taskArgs.priceFeed)
    );
    await pricefeed.deployed();
    console.log("ExamplePriceFeedConsumer deployed to: ", pricefeed.address);
  });
