import { Signer } from "@ethersproject/abstract-signer";
import { ethers } from "ethers";

import { task } from "hardhat/config";
// import { task } from "@nomiclabs/buidler/config";

task("multiPriceFeedTransmit", "Submits an answer to multiPriceFeed")
  .addParam("contract", "The price feed contract to post to")
  .addParam("pricepair", "The prices posted")
  .addParam("answer", "The prices posted")
  .setAction(async (_taskArgs, hre) => {
    const accounts: Signer[] = await hre.ethers.getSigners();
    const validator = accounts[0];
    console.log("Validator address: ", await validator.getAddress());
    const FluxMultiPriceFeed = await hre.ethers.getContractFactory("contracts/FluxMultiPriceFeed.sol:FluxMultiPriceFeed");
    const contract = await FluxMultiPriceFeed.attach(_taskArgs.contract);

    let pairs = [];
    let answers = [];

    let pair = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(_taskArgs.pricepair));
    pairs.push(pair)
    console.log(pairs);

    answers.push(_taskArgs.answer);
    
    // console.log(_taskArgs.prices);

    // ethers.utils.keccak256(ethers.utils.toUtf8Bytes(_taskArgs.answers[0]));
    
    
    let tx = await contract.connect(validator).transmit(pairs, answers);

    console.log("Transaction hash:", tx.hash);

    // tx = await contract.valueFor(ethers.utils.formatBytes32String(pair));
    // console.log(tx);

  })
