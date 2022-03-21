import { Signer } from "@ethersproject/abstract-signer";
import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { FluxPriceAggregator } from "../../src/types/FluxPriceAggregator";
import { FluxPriceAggregator__factory } from "../../src/types/factories/FluxPriceAggregator__factory";

import sleep from "../../utils/sleep";
const VERIFY_DELAY = 100000;
// npx hardhat deploy:FluxPriceAggregator --network kovan --oracles 0x44AAaD7Ab25eA77692586c6227d6Df67b7E7d85e --decimals 18 --description "test price aggregator" --verify
// deployed and verified: 0x114d56B9202089A88bB35fB21a304e51632671b4s
task("deploy:FluxPriceAggregator")
  .addParam("oracles", "Initial oracle addresses, separated by a single comma")
  .addParam("decimals", "The number of decimals in the value posted")
  .addParam("description", "The description of the contract")
  .addOptionalParam("admin", "The admin allowed to modify the oracles and minimum update time")
  .addFlag("verify")
  .setAction(async function (taskArgs: TaskArguments, { run, ethers }) {
    const accounts: Signer[] = await ethers.getSigners();

    let admin;
    if (taskArgs.admin) {
      admin = taskArgs.admin;
    } else {
      admin = await accounts[0].getAddress();
    }

    // convert oracle addresses to array
    const oracles: string[] = taskArgs.oracles.split(",");

    const priceaggregatorFactory: FluxPriceAggregator__factory = <FluxPriceAggregator__factory>(
      await ethers.getContractFactory("FluxPriceAggregator")
    );
    const priceaggregator: FluxPriceAggregator = <FluxPriceAggregator>(
      await priceaggregatorFactory.deploy(admin, oracles, taskArgs.decimals, taskArgs.description)
    );
    await priceaggregator.deployed();
    console.log("FluxPriceAggregator deployed to: ", priceaggregator.address);

    if (taskArgs.verify) {
      console.log("Verifying contract, can take some time");
      await sleep(VERIFY_DELAY);
      await run("verify:verify", {
        address: priceaggregator.address,
        constructorArguments: [admin, oracles, taskArgs.decimals, taskArgs.description],
      });
      console.log("Etherscan Verification Done");
    }
  });
