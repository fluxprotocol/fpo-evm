import { Signer } from "@ethersproject/abstract-signer";
import { task } from "hardhat/config";

task("notifyOracleOfBlock")
  .addParam("contract")
  .addParam("dstChainId")
  .addParam("dstNetworkAddress")
  .addParam("blockConfirmation")
  .setAction(async (_taskArgs, hre) => {
    const accounts: Signer[] = await hre.ethers.getSigners();
    const FluxLayerZeroOracle = await hre.ethers.getContractFactory("FluxLayerZeroOracle");
    const contract = await FluxLayerZeroOracle.attach(_taskArgs.contract);

    const tx = await contract.notifyOracleOfBlock(
      _taskArgs.dstChainId,
      _taskArgs.dstNetworkAddress,
      _taskArgs.blockConfirmation,
    );
    console.log(tx.toString());
  });
