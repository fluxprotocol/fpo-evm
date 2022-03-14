import { Signer } from "@ethersproject/abstract-signer";
import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { FluxPriceFeed } from "../../src/types/FluxPriceFeed";
import { FluxPriceFeed__factory } from "../../src/types/factories/FluxPriceFeed__factory";
// npx hardhat deploy:FluxPriceFeed --network aurora-testnet --decimals 8 --description "ETH/USD"
// npx hardhat verify --network aurora-testnet 0x25C213D9b785416EA0244f4e4814a2600F147143 "0xE19E8d5346Ade8294ec07c5431E5f6A1bb7F8ab2" "8" "ETH/USD"
task("deploy:FluxPriceFeed")
  .addParam("decimals", "The number of decimals in the value posted")
  .addParam("description", "The description of the contract")
  .addOptionalParam("validator", "The validator allowed to post data to the contract")
  .setAction(async function (taskArgs: TaskArguments, { ethers }) {
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
  });
