import { ethers } from "ethers";

import { task } from "hardhat/config";

// npx hardhat factoryValueFor --network kovan --contract 0x508086f87681A0724cA1a1C7a50ABFB79E7d2F64 --pricepairs "Price-ETH/USD-3 Price-BTC/USD-3"

task("factoryValueFor", "fetches oracle address")
  .addParam("contract", "The factory contract address")
  .addParam("pricepairs", "Price pair to query")
  .setAction(async (_taskArgs, hre) => {
    const FluxPriceFeedFactory = await hre.ethers.getContractFactory(
      "contracts/FluxPriceFeedFactory.sol:FluxPriceFeedFactory",
    );
    const contract = await FluxPriceFeedFactory.attach(_taskArgs.contract);

    const received_pairs = _taskArgs.pricepairs.split(" ");

    const pairsIds = [];
    const fetchedValues = [];
    let fetchedValue;
    let pairId;
    for (const key in received_pairs) {
      pairId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(received_pairs[key]));
      pairsIds.push(pairId);
      fetchedValue = await contract.valueFor(pairId);
      fetchedValues.push(fetchedValue);
    }
    // console.log(pairsIds);
    console.log("Oracles fetched values (price, timestamp, status): ", fetchedValues);
  });
