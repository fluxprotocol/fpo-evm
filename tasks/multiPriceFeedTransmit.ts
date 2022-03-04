import { Signer } from "@ethersproject/abstract-signer";
import { ethers } from "ethers";

import { task } from "hardhat/config";
// import { task } from "@nomiclabs/buidler/config";

// npx hardhat multiPriceFeedTransmit --contract 0xf72c30D7c945f7Fbc659631D775D9a3402d61dC9 --network kovan --pricepairs "Price-ETH/USD-3 Price-BTC/USD-3" --answers "3000 37000"

task("multiPriceFeedTransmit", "Submits an answer to multiPriceFeed")
  .addParam("contract", "The price feed contract to post to")
  .addParam("pricepairs", "The prices posted")
  .addParam("answers", "The prices posted")
  .setAction(async (_taskArgs, hre) => {
    const accounts: Signer[] = await hre.ethers.getSigners();
    const validator = accounts[0];
    console.log("Validator address: ", await validator.getAddress());
    const FluxMultiPriceFeed = await hre.ethers.getContractFactory(
      "contracts/FluxMultiPriceFeed.sol:FluxMultiPriceFeed",
    );
    const contract = await FluxMultiPriceFeed.attach(_taskArgs.contract);

    const received_pairs = _taskArgs.pricepairs.split(" ");
    const received_answers = _taskArgs.answers.split(" ");

    const pairs = [];
    // let answers = [];
    for (const pair of received_pairs) {
      pairs.push(ethers.utils.keccak256(ethers.utils.toUtf8Bytes(pair)));
    }
    console.log(pairs);
    console.log(received_answers);

    const tx = await contract.connect(validator).transmit(pairs, received_answers);

    console.log("Transaction hash:", tx.hash);

    // tx = await contract.valueFor(pairs[0]);
    // console.log(tx);
  });
