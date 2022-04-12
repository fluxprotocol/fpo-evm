// import { Signer } from "@ethersproject/abstract-signer";
import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";
import { NewFluxPriceFeedFactory } from "../../src/types/NewFluxPriceFeedFactory";
import { NewFluxPriceFeedFactory__factory } from "../../src/types/factories/NewFluxPriceFeedFactory__factory";

import sleep from "../../utils/sleep";
const VERIFY_DELAY = 100000;

// npx hardhat deploy:NewFluxPriceFeedFactory --network aurora-testnet
// npx hardhat verify 0xb4eeDAfccb9C403f12D66D2795b61703f13939EB --network aurora-testnet
task("deploy:NewFluxPriceFeedFactory")
  .addOptionalParam("validator", "The validator allowed to post data to the contract")
  .addFlag("verify")
  .setAction(async function (taskArgs: TaskArguments, { run, ethers }) {
    const pricefeedFactory: NewFluxPriceFeedFactory__factory = <NewFluxPriceFeedFactory__factory>(
      await ethers.getContractFactory("NewFluxPriceFeedFactory")
    );
    const factory: NewFluxPriceFeedFactory = <NewFluxPriceFeedFactory>await pricefeedFactory.deploy();
    await factory.deployed();
    console.log("NewFluxPriceFeedFactory deployed to: ", factory.address);

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
