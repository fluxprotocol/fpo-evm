import { Signer } from "@ethersproject/abstract-signer";
import { ethers } from "ethers";

import { task } from "hardhat/config";

// npx hardhat p2pDeployOracle --network kovan --contract 0x6a9a4A000ab331879B986D7AB673feeAA5f67b53 --pricepair "ETH/USD" --decimal "6" --validators "0xE19E8d5346Ade8294ec07c5431E5f6A1bb7F8ab2 0xD8FC00c7fe6e9a12d701192595abF425A6546E9A"

task("p2pDeployOracle", "Submits an answer to factoryPriceFeed")
  .addParam("contract", "The price feed contract to post to")
  .addParam("pricepair", "The pricepair you wanna query")
  .addParam("decimal", "Price pair decimals")
  .addParam("validators", "Validators addresses")
  .setAction(async (_taskArgs, hre) => {
    const accounts: Signer[] = await hre.ethers.getSigners();
    const admin = accounts[0];
    const NewFluxPriceFeedFactory = await hre.ethers.getContractFactory(
      "contracts/FluxP2PPriceFeedFactory.sol:FluxP2PFactory",
    );
    const contract = await NewFluxPriceFeedFactory.attach(_taskArgs.contract);
    const validators = _taskArgs.validators.split(" ");

    const tx = await contract.connect(admin).deployOracle(_taskArgs.pricepair, _taskArgs.decimal, validators);
    console.log("Tx hash:", tx.hash);

    const str = "Price-" + _taskArgs.pricepair + "-" + _taskArgs.decimal;
    const id = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(str));
    const retrieved_addr = await contract.connect(admin).addressOfPricePair(id);
    console.log("Deployed oracle address:", retrieved_addr);
  });
