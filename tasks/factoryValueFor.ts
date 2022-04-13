import { utils } from "ethers";

import { task } from "hardhat/config";

// npx hardhat factoryValueFor --network kovan --contract 0xe9D3Fe180604e38eec08F8179Be82c3fCd1219a2 --pricepairs "Price-ETH/USD-6" --provider 0xE19E8d5346Ade8294ec07c5431E5f6A1bb7F8ab2
task("factoryValueFor", "fetches oracle address")
  .addParam("contract", "The factory contract address")
  .addParam("pricepairs", "Price pair to query")
  .addParam("provider", "Price pair provider")
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
    let str;
    for (const key in received_pairs) {
      str = received_pairs[key] + "-";
      pairId = utils.solidityKeccak256(["string", "address"], [str, _taskArgs.provider]);

      pairsIds.push(pairId);
      fetchedValue = await contract.valueFor(pairId);
      fetchedValues.push(fetchedValue);
    }
    // console.log(pairsIds);
    console.log("Oracles fetched values (price, timestamp, status): ", fetchedValues);
  });
