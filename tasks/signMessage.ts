import { Signer } from "@ethersproject/abstract-signer";
import { arrayify } from "@ethersproject/bytes";
import { ethers } from "ethers";

import { task } from "hardhat/config";

//npx hardhat signMessage --pricepair "ETH/USD" --decimal "6" --answer "3000" --roundid "0"
task("signMessage", "Submits an answer to factoryPriceFeed")
  .addParam("pricepair", "The prices posted")
  .addParam("decimal", "Price pairs decimals")
  .addParam("roundid", "The target aggregator round")
  .addParam("answer", "The prices posted")
  .setAction(async (_taskArgs, hre) => {
    const accounts: Signer[] = await hre.ethers.getSigners();
    const provider = accounts[1];
    console.log("provider address: ", await provider.getAddress());
    const msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint32", "int192"],
      [_taskArgs.pricepair, _taskArgs.decimal, _taskArgs.roundid, _taskArgs.answer],
    );
    const sig = await provider.signMessage(arrayify(msgHash));
    console.log("signature = ", sig);
  });
