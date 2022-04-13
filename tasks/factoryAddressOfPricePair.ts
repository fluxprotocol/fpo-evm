import { Signer } from "@ethersproject/abstract-signer";

import { task } from "hardhat/config";

// npx hardhat factoryAddressOfPricePair --network kovan --contract 0x96E5cd3BA267Db9AabdE02DEfcB17263Fd5d94cb --pricepair "ETH/USD" --decimal "6" --provider 0xE19E8d5346Ade8294ec07c5431E5f6A1bb7F8ab2

task("factoryAddressOfPricePair", "Submits an answer to factoryPriceFeed")
  .addParam("contract", "The price feed contract to post to")
  .addParam("pricepair", "The pricepair you wanna query")
  .addParam("decimal", "Price pair decimals")
  .addParam("provider", "answers provider")
  .setAction(async (_taskArgs, hre) => {
    const accounts: Signer[] = await hre.ethers.getSigners();
    const validator = accounts[0];
    console.log("Validator address: ", await validator.getAddress());
    const FluxPriceFeedFactory = await hre.ethers.getContractFactory(
      "contracts/FluxPriceFeedFactory.sol:FluxPriceFeedFactory",
    );
    const contract = await FluxPriceFeedFactory.attach(_taskArgs.contract);

    // const received_pair = _taskArgs.pricepair;
    // const received_decimal = _taskArgs.decimal;
    // const provider = _taskArgs.provider;

    // const pair = "Price-" + received_pair + "-" + received_decimal + "-";

    // const pairId = ethers.utils.solidityKeccak256(["string", "address"], [pair, provider]);

    // // const retrieved_addr = await contract.connect(validator).addressOfPricePairId(pairId);
    // // console.log("Pricepair address:", retrieved_addr);

    const retrieved_addr = await contract
      .connect(validator)
      .addressOfPricePair(_taskArgs.pricepair, _taskArgs.decimal, _taskArgs.provider);
    console.log("Pricepair address:", retrieved_addr);
  });
