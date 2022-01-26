import { Signer } from "@ethersproject/abstract-signer";
import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { FluxLayerZeroOracle } from "../../src/types/FluxLayerZeroOracle";
import { FluxLayerZeroOracle__factory } from "../../src/types/factories/FluxLayerZeroOracle__factory";

task("deploy:FluxLayerZeroOracle")
  .addOptionalParam("admin")
  .addOptionalParam("layerzero")
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

    const lzFactory: FluxLayerZeroOracle__factory = <FluxLayerZeroOracle__factory>(
      await ethers.getContractFactory("FluxLayerZeroOracle")
    );
    const lz: FluxLayerZeroOracle = <FluxLayerZeroOracle>await lzFactory.deploy(admin, layerzero);
    await lz.deployed();
    console.log("FluxLayerZeroOracle deployed to: ", lz.address);
  });
