import { Signer } from "@ethersproject/abstract-signer";
import { ethers } from "ethers";

import { task } from "hardhat/config";

// npx hardhat p2pAddProvider --network kovan --contract 0x486e84a4a7A0865D65d39470165EfDD980DA0700 --provider 0xD8FC00c7fe6e9a12d701192595abF425A6546E9A

task("p2pAddProvider", "Submits an answer to factoryPriceFeed")
  .addParam("contract", "The price feed contract to post to")
  .addParam("provider", "The pricepair you wanna query")
  .setAction(async (_taskArgs, hre) => {
    const accounts: Signer[] = await hre.ethers.getSigners();
    const admin = accounts[0];
    const NewFluxPriceFeedFactory = await hre.ethers.getContractFactory(
      "contracts/FluxP2PPriceFeedFactory.sol:FluxP2PFactory",
    );
    const contract = await NewFluxPriceFeedFactory.attach(_taskArgs.contract);
    const validatorRole = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("VALIDATOR_ROLE"));
    const tx = await contract.connect(admin).grantRole(validatorRole, _taskArgs.provider);
    console.log("tx hash", tx.hash);
  });
