import { task } from "hardhat/config";
// npx hardhat typeAndVersion --network kovan --contract 0x130F04300Ba7c4BF02e6bC73F25eDe4EB24CF4B2
task("typeAndVersion", "Fetches the type and version of the contract")
  .addParam("contract")
  .setAction(async (_taskArgs, hre) => {
    const FluxPriceFeed = await hre.ethers.getContractFactory("contracts/FluxPriceFeed.sol:FluxPriceFeed");
    const contract = await FluxPriceFeed.attach(_taskArgs.contract);

    const tx = await contract.typeAndVersion();
    console.log(tx.toString());
  });
