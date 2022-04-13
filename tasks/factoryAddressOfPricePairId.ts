import { Signer } from "@ethersproject/abstract-signer";

import { task } from "hardhat/config";

// npx hardhat factoryAddressOfPricePairId --network kovan --contract 0xe9D3Fe180604e38eec08F8179Be82c3fCd1219a2 --id "0x07a05bb26f9432e6705a02a5df0751e3390bd9ebb4d9300c3d466f3160fc9923"

task("factoryAddressOfPricePairId", "Submits an answer to factoryPriceFeed")
  .addParam("contract", "The price feed contract to post to")
  .addParam("id", "The pricepair id you wanna query")
  .setAction(async (_taskArgs, hre) => {
    const accounts: Signer[] = await hre.ethers.getSigners();
    const validator = accounts[0];
    console.log("Validator address: ", await validator.getAddress());
    const FluxPriceFeedFactory = await hre.ethers.getContractFactory(
      "contracts/FluxPriceFeedFactory.sol:FluxPriceFeedFactory",
    );
    const contract = await FluxPriceFeedFactory.attach(_taskArgs.contract);

    const retrieved_addr = await contract.connect(validator).addressOfPricePairId(_taskArgs.id);
    console.log("Pricepair address:", retrieved_addr);
  });
