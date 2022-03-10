import { Signer } from "@ethersproject/abstract-signer";
import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { FluxLayerZeroOracle } from "../../src/types/FluxLayerZeroOracle";
import { FluxLayerZeroOracle__factory } from "../../src/types/factories/FluxLayerZeroOracle__factory";
import { LayerZeroNetwork } from "../../src/types/LayerZeroNetwork";
import { LayerZeroNetwork__factory } from "../../src/types/factories/LayerZeroNetwork__factory";

task("deploy:FluxLayerZeroOracle")
  .addOptionalParam("admin")
  .addOptionalParam("layerzero")
  .addOptionalParam("layerzeroTwo")
  .addOptionalParam("deployNetwork")
  .setAction(async function (taskArgs: TaskArguments, { ethers }) {
    const accounts: Signer[] = await ethers.getSigners();

    let admin;
    if (taskArgs.admin) {
      admin = taskArgs.admin;
    } else {
      admin = await accounts[0].getAddress();
    }

    let layerzero;
    if (taskArgs.layerzero) {
      layerzero = taskArgs.layerzero;
    } else {
      layerzero = await accounts[0].getAddress();
    }

    if (taskArgs.deployNetwork === "true") {
      const lznFactory: LayerZeroNetwork__factory = <LayerZeroNetwork__factory>(
        await ethers.getContractFactory("LayerZeroNetwork")
      );
      const lzn: LayerZeroNetwork = <LayerZeroNetwork>await lznFactory.deploy();
      console.log(`Deployed LayerZeroNetwork at ${lzn.address}`);
    }

    const lzFactory: FluxLayerZeroOracle__factory = <FluxLayerZeroOracle__factory>(
      await ethers.getContractFactory("FluxLayerZeroOracle")
    );
    const lz: FluxLayerZeroOracle = <FluxLayerZeroOracle>await lzFactory.deploy(admin, layerzero);
    await lz.deployed();
    console.log(`Deployed FluxLayerZeroOracle at ${lz.address}`);

    if (taskArgs.layerzeroTwo) {
      const FluxLayerZeroOracle = await ethers.getContractFactory("FluxLayerZeroOracle");
      const contract = await FluxLayerZeroOracle.attach(lz.address);

      const tx = await contract.addLayerZero(taskArgs.layerzeroTwo);
      console.log(`Added permissions for lz2 with tx hash: ${tx.hash}`);
    }
  });
