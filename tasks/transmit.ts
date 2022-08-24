import { task } from "hardhat/config";
// npx hardhat transmit --network aurora-testnet --contract 0x5d5d3493172Edec1748810287258c2eD09ad74A1 --answer 1600
task("transmit", "Submits an answer to a price feed")
  .addParam("contract", "The price feed contract to post to")
  .addParam("answer", "The answer to post")
  .setAction(async (_taskArgs, hre) => {
    const FluxPriceFeed = await hre.ethers.getContractFactory("contracts/FluxPriceFeed.sol:FluxPriceFeed");
    const contract = await FluxPriceFeed.attach(_taskArgs.contract);

    const tx = await contract.transmit(_taskArgs.answer);
    console.log("Transaction hash:", tx.hash);
  });
