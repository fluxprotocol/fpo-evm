import { Signer } from "@ethersproject/abstract-signer";
import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { FluxPriceFeed } from "../../src/types/FluxPriceFeed";
import { FluxPriceFeed__factory } from "../../src/types/factories/FluxPriceFeed__factory";

import sleep from "../../utils/sleep";
const VERIFY_DELAY = 100000;
// npx hardhat deploy:FluxPriceFeed --network kovan --decimals 18 --description "test price feed" --verify
//deployed to: 0x44AAaD7Ab25eA77692586c6227d6Df67b7E7d85e
task("deploy:FluxPriceFeed")
  .addParam("decimals", "The number of decimals in the value posted")
  .addParam("description", "The description of the contract")
  .addOptionalParam("validator", "The validator allowed to post data to the contract")
  .addFlag("verify")
  .setAction(async function (taskArgs: TaskArguments, { run, ethers }) {
    const accounts: Signer[] = await ethers.getSigners();

    let validator;
    if (taskArgs.validator) {
      validator = taskArgs.validator;
    } else {
      validator = await accounts[0].getAddress();
    }

    const pricefeedFactory: FluxPriceFeed__factory = <FluxPriceFeed__factory>(
      await ethers.getContractFactory("FluxPriceFeed")
    );
    const pricefeed: FluxPriceFeed = <FluxPriceFeed>(
      await pricefeedFactory.deploy(validator, taskArgs.decimals, taskArgs.description)
    );
    await pricefeed.deployed();
    console.log("FluxPriceFeed deployed to: ", pricefeed.address);

    if (taskArgs.verify) {
      console.log("Verifying contract, can take some time");
      await sleep(VERIFY_DELAY);
      await run("verify:verify", {
        address: pricefeed.address,
        constructorArguments: [validator, taskArgs.decimals, taskArgs.description],
      });
      console.log("Etherscan Verification Done");
    }
  });
