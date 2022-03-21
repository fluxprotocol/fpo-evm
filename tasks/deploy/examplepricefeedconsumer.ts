import { Signer } from "@ethersproject/abstract-signer";
import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { ExamplePriceFeedConsumer } from "../../src/types/ExamplePriceFeedConsumer";
import { ExamplePriceFeedConsumer__factory } from "../../src/types/factories/ExamplePriceFeedConsumer__factory";
import sleep from "../../utils/sleep";
const VERIFY_DELAY = 100000;

//npx hardhat deploy:ExamplePriceFeedConsumer --network kovan --pricefeed 0x44AAaD7Ab25eA77692586c6227d6Df67b7E7d85e --verify
// deployed and verified: 0xE63eAF82ff13D0e8cf0fe6aaA8F8316380EB2097
task("deploy:ExamplePriceFeedConsumer")
  .addParam("pricefeed", "The first-party price feed contract to read from (FluxPriceFeed.sol)")
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
    console.log("Validator: ", validator);

    const pricefeedFactory: ExamplePriceFeedConsumer__factory = <ExamplePriceFeedConsumer__factory>(
      await ethers.getContractFactory("ExamplePriceFeedConsumer")
    );
    const pricefeed: ExamplePriceFeedConsumer = <ExamplePriceFeedConsumer>(
      await pricefeedFactory.deploy(taskArgs.pricefeed)
    );
    await pricefeed.deployed();
    console.log("ExamplePriceFeedConsumer deployed to: ", pricefeed.address);

    if (taskArgs.verify) {
      console.log("Verifying contract, can take some time");
      await sleep(VERIFY_DELAY);
      await run("verify:verify", {
        address: pricefeed.address,
        constructorArguments: [taskArgs.pricefeed],
      });
      console.log("Etherscan Verification Done");
    }
  });
