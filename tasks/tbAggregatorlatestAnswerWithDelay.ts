import { task } from "hardhat/config";

// npx hardhat tbAggregatorlatestAnswerWithDelay --network aurora-testnet --contract 0x18dA63Bf288Ac9D693aB63E0b320b5E17ca59D61 --delay 2
task("tbAggregatorlatestAnswerWithDelay", "Fetches the latest answer")
  .addParam("contract", "The price feed contract to post to")
  .addParam("delay", "The timeout in mins")

  .setAction(async (_taskArgs, hre) => {
    const FluxTimeBasedAggregator = await hre.ethers.getContractFactory(
      "contracts/FluxTimeBasedAggregator.sol:FluxTimeBasedAggregator",
    );
    const contract = await FluxTimeBasedAggregator.attach(_taskArgs.contract);

    const tx = await contract["latestAnswer(uint256)"](_taskArgs.delay);
    console.log(tx);
  });
