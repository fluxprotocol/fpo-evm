import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { FluxTimeBasedAggregator } from "../../src/types/FluxTimeBasedAggregator";
import { FluxTimeBasedAggregator__factory } from "../../src/types/factories/FluxTimeBasedAggregator__factory";

import sleep from "../../utils/sleep";
const VERIFY_DELAY = 100000;
// AmberData aurora-testnet ETH/USD oracle: 0x842AF8074Fa41583E3720821cF1435049cf93565
// FLUX aurora-testnet ETH/USD oracle: 0xdA7b6087B678e4bdFf0ee8e53C4ad33b11508BAa
// ANOTHER FLUX aurora-testnet ETH/USD oracle: 0x25C213D9b785416EA0244f4e4814a2600F147143
// npx hardhat deploy:FluxTimeBasedAggregator --network aurora-testnet --oracles "0x842AF8074Fa41583E3720821cF1435049cf93565,0xdA7b6087B678e4bdFf0ee8e53C4ad33b11508BAa"  --decimals 8 --description "ETH/USD" --verify
// deployed and verified: 0x18dA63Bf288Ac9D693aB63E0b320b5E17ca59D61 (aurora-testnet)
// deployed and verified: 0x114d56B9202089A88bB35fB21a304e51632671b4s (kovan)
task("deploy:FluxTimeBasedAggregator")
  .addParam("oracles", "Primary and Secondary oracle addresses, separated by a single comma")
  .addParam("decimals", "The number of decimals in the value posted")
  .addParam("description", "The description of the contract")
  .addFlag("verify")
  .setAction(async function (taskArgs: TaskArguments, { run, ethers }) {
    // convert oracle addresses to array
    const oracles: string[] = taskArgs.oracles.split(",");

    const timeBasedAggregatorFactory: FluxTimeBasedAggregator__factory = <FluxTimeBasedAggregator__factory>(
      await ethers.getContractFactory("FluxTimeBasedAggregator")
    );
    const timeBasedAggregator: FluxTimeBasedAggregator = <FluxTimeBasedAggregator>(
      await timeBasedAggregatorFactory.deploy(oracles[0], oracles[1], taskArgs.decimals, taskArgs.description)
    );
    await timeBasedAggregator.deployed();
    console.log("FluxTimeBasedAggregator deployed to: ", timeBasedAggregator.address);

    if (taskArgs.verify) {
      console.log("Verifying contract, can take some time");
      await sleep(VERIFY_DELAY);
      await run("verify:verify", {
        address: timeBasedAggregator.address,
        constructorArguments: [oracles[0], oracles[1], taskArgs.decimals, taskArgs.description],
      });
      console.log("Etherscan Verification Done");
    }
  });
