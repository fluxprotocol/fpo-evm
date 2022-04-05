import { Signer } from "@ethersproject/abstract-signer";
import { task } from "hardhat/config";
import { ethers } from "ethers";

task("notifyOracle")
  .addParam("contract")
  .addParam("dstChainId")
  .addParam("dstNetworkAddress")
  .addParam("blockConfirmations")
  .setAction(async (_taskArgs, hre) => {
    const accounts: Signer[] = await hre.ethers.getSigners();
    const FluxLayerZeroOracle = await hre.ethers.getContractFactory("FluxLayerZeroOracle");
    const contract = await FluxLayerZeroOracle.attach(_taskArgs.contract);

    const tx = await contract.notifyOracle(
      1,
      ethers.utils.hexZeroPad(_taskArgs.dstNetworkAddress, 32),
      _taskArgs.blockConfirmations,
    );
    console.log(`Tx hash: ${tx.hash}`);
  });
