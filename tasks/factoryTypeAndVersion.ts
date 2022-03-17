import { task } from "hardhat/config";

// npx hardhat factoryTypeAndVersion --network aurora-testnet --contract 0x2daC68eCF40a076f328FCA98298A9a18949e8922
task("factoryTypeAndVersion", "Fetches the type and version of the contract")
  .addParam("contract")
  .setAction(async (_taskArgs, hre) => {
    const FluxPriceFeedFactory = await hre.ethers.getContractFactory(
      "contracts/FluxPriceFeedFactory.sol:FluxPriceFeedFactory",
    );
    const contract = await FluxPriceFeedFactory.attach(_taskArgs.contract);

    const tx = await contract.typeAndVersion();
    console.log(tx.toString());
  });
