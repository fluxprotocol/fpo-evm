import { task } from "hardhat/config";

// npx hardhat tbAggregatorLatestAnswer --network aurora-testnet --contract 0x18dA63Bf288Ac9D693aB63E0b320b5E17ca59D61
task("tbAggregatorLatestAnswer", "Fetches the latest answer")
  .addParam("contract", "The price feed contract to post to")
  .setAction(async (_taskArgs, hre) => {
    const FluxTimeBasedAggregator = await hre.ethers.getContractFactory(
      "contracts/FluxTimeBasedAggregator.sol:FluxTimeBasedAggregator",
    );
    const contract = await FluxTimeBasedAggregator.attach(_taskArgs.contract);

    const tx = await contract["latestAnswer()"]();
    console.log(tx);
  });
