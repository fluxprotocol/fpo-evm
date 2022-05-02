import { Signer } from "@ethersproject/abstract-signer";
import { ethers } from "ethers";

import { task } from "hardhat/config";

// npx hardhat p2pLatestRoundOfPricePair --network kovan --contract 0x29EC2B23280A6203E0ff2bb276A6Ea006e8bA94A --pricepair "ETH/USD" --decimal "6"

task("p2pLatestRoundOfPricePair", "Submits an answer to factoryPriceFeed")
  .addParam("contract", "The price feed contract to post to")
  .addParam("pricepair", "The pricepair you wanna query")
  .addParam("decimal", "Price pair decimals")
  .setAction(async (_taskArgs, hre) => {
    const accounts: Signer[] = await hre.ethers.getSigners();
    const admin = accounts[0];
    const NewFluxPriceFeedFactory = await hre.ethers.getContractFactory("FluxP2PFactory");
    const contract = await NewFluxPriceFeedFactory.attach(_taskArgs.contract);
    const str = "Price-" + _taskArgs.pricepair + "-" + _taskArgs.decimal;
    const id = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(str));
    const retrieved_id = await contract.connect(admin).latestRoundOfPricePair(id);
    console.log("Lastest RoundId:", retrieved_id);
  });
