import { Signer } from "@ethersproject/abstract-signer";
import { ethers } from "ethers";
import { task } from "hardhat/config";

// Make sure to specify a network
task("multiPriceFeedValueFor", "Fetches the latest answer")
  .addParam("contract", "The price feed contract to post to")
  .addParam("pricepair", "pair to be queried")
  .setAction(async (_taskArgs, hre) => {
    const accounts: Signer[] = await hre.ethers.getSigners();
    const validator = accounts[0];
    console.log("Validator address = ", await validator.getAddress());

    const FluxMultiPriceFeed = await hre.ethers.getContractFactory(
      "contracts/FluxMultiPriceFeed.sol:FluxMultiPriceFeed",
    );
    const contract = await FluxMultiPriceFeed.attach(_taskArgs.contract);
    const id = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(_taskArgs.pricepair));
    console.log("price pair id = ", id);
    const [price, ,] = await contract.connect(validator).valueFor(id);
    console.log("Fetched price = ", BigInt(price));
  });
