import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { FluxPriceFeed } from "../../src/types/FluxPriceFeed";
import { FluxPriceFeed__factory } from "../../src/types/factories/FluxPriceFeed__factory";

task("deploy:FluxPriceFeed")
  .addParam("validator", "The validator allowed to post data to the contract")
  .addParam("decimals", "The number of decimals in the value posted")
  .addParam("description", "The description of the contract")
  .setAction(async function (taskArgs: TaskArguments, { ethers }) {
    const pricefeedFactory: FluxPriceFeed__factory = <FluxPriceFeed__factory>(
      await ethers.getContractFactory("FluxPriceFeed")
    );
    const pricefeed: FluxPriceFeed = <FluxPriceFeed>(
      await pricefeedFactory.deploy(taskArgs.validator, taskArgs.decimals, taskArgs.description)
    );
    await pricefeed.deployed();
    console.log("FluxPriceFeed deployed to: ", pricefeed.address);
  });
