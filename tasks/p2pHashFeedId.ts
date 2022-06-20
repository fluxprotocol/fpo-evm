import { ethers } from "ethers";
import { task } from "hardhat/config";

// npx hardhat p2pHashFeedId --network kovan  --pricepair "ETH/USD" --decimal "6" --creator "0xE19E8d5346Ade8294ec07c5431E5f6A1bb7F8ab2"
task("p2pHashFeedId", "Gets deployed pricepair id hash")
  .addParam("pricepair", "Pricepair string")
  .addParam("decimal", "Pricepair decimal")
  .addParam("creator", "Pricefeed creator address")
  .setAction(async _taskArgs => {
    const pair_str = "Price-" + _taskArgs.pricepair + "-" + _taskArgs.decimal + "-";
    const id = ethers.utils.solidityKeccak256(["string", "address"], [pair_str, _taskArgs.creator]);
    console.log("Pricefeed id: ", id);
  });
