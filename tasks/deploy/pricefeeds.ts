import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { FluxPriceFeed } from "../../src/types/FluxPriceFeed";
import { FluxPriceFeed__factory } from "../../src/types/factories/FluxPriceFeed__factory";

task("deploy:FluxPriceFeed").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  const pricefeedFactory: FluxPriceFeed__factory = <FluxPriceFeed__factory>(
    await ethers.getContractFactory("FluxPriceFeed")
  );
  const pricefeed: FluxPriceFeed = <FluxPriceFeed>(
    await pricefeedFactory.deploy("0xf7f840a17a04711e2e1fCebDe0Ab03E401eEbce0", 6, "ETH/USD Price Feed")
  );
  await pricefeed.deployed();
  console.log("FluxPriceFeed deployed to: ", pricefeed.address);
});
