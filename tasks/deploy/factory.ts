// import { Signer } from "@ethersproject/abstract-signer";
import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";
import { FluxPriceFeedFactory } from "../../src/types/FluxPriceFeedFactory";
import { FluxPriceFeedFactory__factory } from "../../src/types/factories/FluxPriceFeedFactory__factory";

import sleep from "../../utils/sleep";
const VERIFY_DELAY = 100000;

// npx hardhat deploy:FluxPriceFeedFactory --network aurora-testnet
// npx hardhat verify 0xb4eeDAfccb9C403f12D66D2795b61703f13939EB --network aurora-testnet
task("deploy:FluxPriceFeedFactory")
  .addOptionalParam("validator", "The validator allowed to post data to the contract")
  .addFlag("verify")
  .setAction(async function (taskArgs: TaskArguments, { run, ethers }) {
    const pricefeedFactory: FluxPriceFeedFactory__factory = <FluxPriceFeedFactory__factory>(
      await ethers.getContractFactory("FluxPriceFeedFactory")
    );
    const factory: FluxPriceFeedFactory = <FluxPriceFeedFactory>await pricefeedFactory.deploy();
    await factory.deployed();
    console.log("FluxPriceFeedFactory deployed to: ", factory.address);

    if (taskArgs.verify) {
      console.log("Verifying contract, can take some time");
      await sleep(VERIFY_DELAY);
      await run("verify:verify", {
        address: factory.address,
        constructorArguments: [],
      });
      console.log("Etherscan Verification Done");
    }
  });
