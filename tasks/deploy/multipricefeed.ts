import { Signer } from "@ethersproject/abstract-signer";
import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { FluxMultiPriceFeed } from "../../src/types/FluxMultiPriceFeed";
import { FluxMultiPriceFeed__factory } from "../../src/types/factories/FluxMultiPriceFeed__factory";

import sleep from "../../utils/sleep";
const VERIFY_DELAY = 100000;
// npx hardhat deploy:FluxMultiPriceFeed --network kovan --verify
// deployed and verified: 0x41c09D71874490AC5800998598be7623493Ce529
task("deploy:FluxMultiPriceFeed")
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

    const multiPricefeedFactory: FluxMultiPriceFeed__factory = <FluxMultiPriceFeed__factory>(
      await ethers.getContractFactory("FluxMultiPriceFeed")
    );
    console.log("Validator address: ", validator);
    const multiPriceFeed: FluxMultiPriceFeed = <FluxMultiPriceFeed>await multiPricefeedFactory.deploy(validator);
    await multiPriceFeed.deployed();
    console.log("FluxMultiPriceFeed deployed to: ", multiPriceFeed.address);

    if (taskArgs.verify) {
      console.log("Verifying contract, can take some time");
      await sleep(VERIFY_DELAY);
      await run("verify:verify", {
        address: multiPriceFeed.address,
        constructorArguments: [validator],
      });
      console.log("Etherscan Verification Done");
    }
  });
