import { task } from "hardhat/config";

task("typeAndVersion", "Fetches the type and version of the contract")
  .addParam("contract")
  .setAction(async (_taskArgs, hre) => {
    const FluxPriceFeed = await hre.ethers.getContractFactory("contracts/FluxPriceFeed.sol:FluxPriceFeed");
    const contract = await FluxPriceFeed.attach(_taskArgs.contract);

    const tx = await contract.typeAndVersion();
    console.log(tx.toString());
  });
