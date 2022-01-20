import { Signer } from "@ethersproject/abstract-signer";
import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { FluxPriceAggregator } from "../../src/types/FluxPriceAggregator";
import { FluxPriceAggregator__factory } from "../../src/types/factories/FluxPriceAggregator__factory";

task("deploy:FluxPriceAggregator")
  .addParam("oracles", "Initial oracle addresses, separated by a single comma")
  .addParam("decimals", "The number of decimals in the value posted")
  .addParam("description", "The description of the contract")
  .addOptionalParam("admin", "The admin allowed to modify the oracles and minimum update time")
  .setAction(async function (taskArgs: TaskArguments, { ethers }) {
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
  });
