import { Signer } from "@ethersproject/abstract-signer";
import { task } from "hardhat/config";

// npx hardhat p2pValueFor --network kovan --contract 0x45dB673378C39d76a295519217817C17EF8c8276 --id "0x07a05bb26f9432e6705a02a5df0751e3390bd9ebb4d9300c3d466f3160fc9923"

task("p2pValueFor", "Get price of pricepair id")
  .addParam("contract", "The price feed contract to post to")
  .addParam("id", "Pricepair id")
  .setAction(async (_taskArgs, hre) => {
    const accounts: Signer[] = await hre.ethers.getSigners();
    const admin = accounts[0];
    const FluxP2PFactory = await hre.ethers.getContractFactory("FluxP2PFactory");
    const contract = await FluxP2PFactory.attach(_taskArgs.contract);
    const [price, ,] = await contract.connect(admin).valueFor(_taskArgs.id);
    console.log("retrieved price = ", price);
  });
