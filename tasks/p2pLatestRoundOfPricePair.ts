import { Signer } from "@ethersproject/abstract-signer";
import { task } from "hardhat/config";

// npx hardhat p2pLatestRoundOfPricePair --network kovan --contract 0x45dB673378C39d76a295519217817C17EF8c8276 --id "0x07a05bb26f9432e6705a02a5df0751e3390bd9ebb4d9300c3d466f3160fc9923"
task("p2pLatestRoundOfPricePair", "Get latestRoundOfPricePair")
  .addParam("contract", "The factory contract address")
  .addParam("id", "The pricepair id")
  .setAction(async (_taskArgs, hre) => {
    const accounts: Signer[] = await hre.ethers.getSigners();
    const admin = accounts[0];
    const NewFluxPriceFeedFactory = await hre.ethers.getContractFactory("FluxP2PFactory");
    const contract = await NewFluxPriceFeedFactory.attach(_taskArgs.contract);

    const retrieved_id = await contract.connect(admin).latestRoundOfPricePair(_taskArgs.id);
    console.log("Lastest RoundId:", retrieved_id);
  });
