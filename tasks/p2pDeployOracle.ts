import { Signer } from "@ethersproject/abstract-signer";
import { ethers } from "ethers";

import { task } from "hardhat/config";

// npx hardhat p2pDeployOracle --network kovan --contract 0x45dB673378C39d76a295519217817C17EF8c8276 --pricepair "ETH/USD" --decimal "6" --signers "0xE19E8d5346Ade8294ec07c5431E5f6A1bb7F8ab2 0xD8FC00c7fe6e9a12d701192595abF425A6546E9A"
task("p2pDeployOracle", "Deploy oracle")
  .addParam("contract", "The factory contract address")
  .addParam("pricepair", "The pricepair to be deployed")
  .addParam("decimal", "Price pair decimals")
  .addParam("signers", "Signers addresses")
  .setAction(async (_taskArgs, hre) => {
    const accounts: Signer[] = await hre.ethers.getSigners();
    const admin = accounts[0];
    const NewFluxPriceFeedFactory = await hre.ethers.getContractFactory("FluxP2PFactory");
    const contract = await NewFluxPriceFeedFactory.attach(_taskArgs.contract);
    const signers = _taskArgs.signers.split(" ");

    const tx = await contract.connect(admin).deployOracle(_taskArgs.pricepair, Number(_taskArgs.decimal), signers);
    console.log("Tx hash:", tx.hash);

    const pair_str = "Price-" + _taskArgs.pricepair + "-" + _taskArgs.decimal + "-";
    const id = ethers.utils.solidityKeccak256(["string", "address"], [pair_str, await admin.getAddress()]);
    const retrieved_addr = await contract.connect(admin).addressOfPricePair(id);
    console.log("Deployed oracle address:", retrieved_addr);
    console.log("Deployed oracle id: ", id);
  });
