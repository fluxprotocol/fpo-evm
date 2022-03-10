import { Signer } from "@ethersproject/abstract-signer";
import { ethers } from "ethers";

import { task } from "hardhat/config";

// npx hardhat factoryTransmit --network kovan --contract 0x508086f87681A0724cA1a1C7a50ABFB79E7d2F64 --pricepairs "ETH/USD BTC/USD" --decimals "3 3" --answers "3000 37000"

task("factoryTransmit", "Submits an answer to factoryPriceFeed")
  .addParam("contract", "The price feed contract to post to")
  .addParam("pricepairs", "The prices posted")
  .addParam("decimals", "Price pairs decimals")
  .addParam("answers", "The prices posted")
  .setAction(async (_taskArgs, hre) => {
    const accounts: Signer[] = await hre.ethers.getSigners();
    const validator = accounts[0];
    console.log("Validator address: ", await validator.getAddress());
    const FluxPriceFeedFactory = await hre.ethers.getContractFactory(
      "contracts/FluxPriceFeedFactory.sol:FluxPriceFeedFactory",
    );
    const contract = await FluxPriceFeedFactory.attach(_taskArgs.contract);

    const received_pairs = _taskArgs.pricepairs.split(" ");
    const received_decimals = _taskArgs.decimals.split(" ");

    const received_answers = _taskArgs.answers.split(" ");
    console.log(received_pairs);
    console.log(received_answers);
    console.log(received_decimals);

    const pairsIds = [];
    let pair;
    for (const key in received_pairs) {
      pair = "Price-" + received_pairs[key] + "-" + received_decimals[key];
      console.log(pair);
      pairsIds.push(ethers.utils.keccak256(ethers.utils.toUtf8Bytes(pair)));
    }
    console.log(pairsIds);

    let tx = await contract.connect(validator).transmit(received_pairs, received_decimals, received_answers);
    console.log("Transaction hash:", tx.hash);

    tx = await contract.valueFor(pairsIds[0]);
    console.log(tx);
  });
