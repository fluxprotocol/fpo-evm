import { Signer } from "@ethersproject/abstract-signer";
import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { FluxPriceFeedFactory } from "../src/types/FluxPriceFeedFactory";
import { FluxPriceFeedFactory__factory } from "../src/types/factories/FluxPriceFeedFactory__factory";
import { utils } from "ethers";

task("fetchFactoryPricePairAddress")
  .addParam("contract", "The price feed factory contract to be queried")
  .addParam("pricePair", "The price pair you wanna fetch its address")
  .setAction(async (_taskArgs, hre) => {
    const accounts: Signer[] = await hre.ethers.getSigners();
    const validator = accounts[0];
    console.log("Validator address: ", await validator.getAddress());
    const FluxPriceFeedFactory = await hre.ethers.getContractFactory(
      "contracts/FluxPriceFeedFactory.sol:FluxPriceFeedFactory",
    );
    const contract = await FluxPriceFeedFactory.attach(_taskArgs.contract);

    let pair = utils.keccak256(utils.toUtf8Bytes(_taskArgs.pricePair));

    let pricePairAddress = await contract.connect(validator).addressOfPricePair(pair);
    console.log("pricePairAddress = ", pricePairAddress);
  });
