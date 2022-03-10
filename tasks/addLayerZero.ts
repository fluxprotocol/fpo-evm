import { Signer } from "@ethersproject/abstract-signer";
import { task } from "hardhat/config";
import { ethers } from "ethers";

task("addLayerZero")
  .addParam("contract")
  .addParam("layerZero")
  .setAction(async (_taskArgs, hre) => {
    const accounts: Signer[] = await hre.ethers.getSigners();
    const FluxLayerZeroOracle = await hre.ethers.getContractFactory("FluxLayerZeroOracle");
    const contract = await FluxLayerZeroOracle.attach(_taskArgs.contract);

    const tx = await contract.addLayerZero(_taskArgs.layerZero);
    console.log(`Tx hash: ${tx.hash}`);
  });
