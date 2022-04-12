import { Signer } from "@ethersproject/abstract-signer";

import { task } from "hardhat/config";

// npx hardhat factoryGetId --network aurora-testnet --contract 0xb4eeDAfccb9C403f12D66D2795b61703f13939EB --pricepair "ETH/USD" --decimal "6" --provider 0xE19E8d5346Ade8294ec07c5431E5f6A1bb7F8ab2
// npx hardhat factoryGetId --network kovan --contract 0x96E5cd3BA267Db9AabdE02DEfcB17263Fd5d94cb --pricepair "ETH/USD" --decimal "6" --provider 0xE19E8d5346Ade8294ec07c5431E5f6A1bb7F8ab2

task("factoryGetId", "Get pricepair Id")
  .addParam("contract", "The price feed contract to post to")
  .addParam("pricepair", "The prices posted")
  .addParam("decimal", "Price pairs decimals")
  .addParam("provider", "provider address")
  .setAction(async (_taskArgs, hre) => {
    const accounts: Signer[] = await hre.ethers.getSigners();
    const validator = accounts[0];
    console.log("Validator address: ", await validator.getAddress());
    const FluxPriceFeedFactory = await hre.ethers.getContractFactory(
      "contracts/FluxPriceFeedFactory.sol:FluxPriceFeedFactory",
    );
    const contract = await FluxPriceFeedFactory.attach(_taskArgs.contract);

    const id = await contract.connect(validator).getId(_taskArgs.pricepair, _taskArgs.decimal, _taskArgs.provider);
    console.log("retrieved id:", id);
  });
