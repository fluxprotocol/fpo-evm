import { Signer } from "@ethersproject/abstract-signer";
import { ethers } from "ethers";

import { task } from "hardhat/config";

// npx hardhat factoryTransmit --network aurora-testnet --contract 0xb4eeDAfccb9C403f12D66D2795b61703f13939EB --pricepairs "ETH/USD BTC/USD" --decimals "6 6" --answers "3000 37000"

task("factoryTransmit", "Submits an answer to factoryPriceFeed")
  .addParam("contract", "The price feed contract to post to")
  .addParam("pricepairs", "The prices posted")
  .addParam("decimals", "Price pairs decimals")
  .addParam("answers", "The prices posted")
  .addOptionalParam("provider", "answers provider")
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

    const provider = _taskArgs.provider ? _taskArgs.provider : ethers.constants.AddressZero;

    const pairsIds = [];
    let pair;
    let pairId;
    let retrievedId;
    for (const key in received_pairs) {
      pair = "Price-" + received_pairs[key] + "-" + received_decimals[key] + "-";
      console.log("pair = ", pair);
      console.log("receivedpair = ", received_pairs[key]);
      console.log("received_decimal = ", received_decimals[key]);

      if (provider == ethers.constants.AddressZero) {
        pairId = ethers.utils.solidityKeccak256(["string", "address"], [pair, await validator.getAddress()]);
      } else {
        pairId = ethers.utils.solidityKeccak256(["string", "address"], [pair, provider]);
      }
      console.log("pairId = ", pairId);
      retrievedId = await contract.connect(validator).getId(received_pairs[key], received_decimals[key], provider);
      console.log("retrievedId = ", retrievedId);
      pairsIds.push(pairId);
    }
    console.log("pairIds = ", pairsIds);
    console.log("provider = ", provider);
    let tx = await contract.connect(validator).transmit(received_pairs, received_decimals, received_answers, provider);
    console.log("Transaction hash:", tx.hash);

    tx = await contract.valueFor(pairsIds[0]);
    console.log(tx);
  });
