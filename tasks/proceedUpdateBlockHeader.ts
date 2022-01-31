import { Signer } from "@ethersproject/abstract-signer";
import { task } from "hardhat/config";

task("proceedUpdateBlockHeader")
  .addParam("contract")
  .addParam("dstChainId")
  .addParam("dstNetworkAddress")
  .addParam("confirmations")
  .addParam("blockHash")
  .addParam("data")
  .setAction(async (_taskArgs, hre) => {
    const accounts: Signer[] = await hre.ethers.getSigners();
    const FluxLayerZeroOracle = await hre.ethers.getContractFactory("FluxLayerZeroOracle");
    const contract = await FluxLayerZeroOracle.attach(_taskArgs.contract);

    const tx = await contract.proceedUpdateBlockHeader(
      _taskArgs.dstNetworkAddress,
      _taskArgs.dstChainId,
      _taskArgs.blockHash,
      _taskArgs.confirmations,
      _taskArgs.data,
    );
    console.log(`Tx hash: ${tx.hash}`);
  });
