import { Signer } from "@ethersproject/abstract-signer";
import { task } from "hardhat/config";

task("updatePrices", "Fetches latest answers on oracles")
  .addParam("contract", "The price aggregator contract to update")
  .setAction(async (_taskArgs, hre) => {
    const accounts: Signer[] = await hre.ethers.getSigners();
    const FluxPriceAggregator = await hre.ethers.getContractFactory("FluxPriceAggregator");
    const contract = await FluxPriceAggregator.attach(_taskArgs.contract);

    const tx = await contract.updatePrices();
    console.log(tx.toString());
  });
