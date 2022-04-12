import { Signer } from "@ethersproject/abstract-signer";
import { ethers } from "ethers";

import { task } from "hardhat/config";

// npx hardhat p2pAddressOfPricePair --network kovan --contract 0x486e84a4a7A0865D65d39470165EfDD980DA0700 --pricepair "ETH/USD" --decimal "6"

task("p2pAddressOfPricePair", "Submits an answer to factoryPriceFeed")
  .addParam("contract", "The price feed contract to post to")
  .addParam("pricepair", "The pricepair you wanna query")
  .addParam("decimal", "Price pair decimals")
  .setAction(async (_taskArgs, hre) => {
    const accounts: Signer[] = await hre.ethers.getSigners();
    const admin = accounts[0];
    const NewFluxPriceFeedFactory = await hre.ethers.getContractFactory(
      "contracts/FluxP2PPriceFeedFactory.sol:FluxP2PFactory",
    );
    const contract = await NewFluxPriceFeedFactory.attach(_taskArgs.contract);
    const str = "Price-" + _taskArgs.pricepair + "-" + _taskArgs.decimal;
    const id = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(str));
    const retrieved_addr = await contract.connect(admin).addressOfPricePair(id);
    console.log("Retrieved Pricepair address:", retrieved_addr);
  });
