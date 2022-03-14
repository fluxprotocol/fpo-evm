import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployFunction: DeployFunction = async function ({
  deployments,
  getNamedAccounts,
  run,
}: HardhatRuntimeEnvironment) {
  console.log(`Deploying FluxPriceFeedFactory`);

  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log(`Initial validator address: ${deployer}`);
  const factory = await deploy("FluxPriceFeedFactory", {
    contract: "FluxPriceFeedFactoryFlat",
    from: deployer,
    args: [
      deployer, // validator
    ],
    deterministicDeployment: false,
  });
  console.log(`FluxPriceFeedFactory deployed at ${factory.address}`);
};

export default deployFunction;

deployFunction.tags = ["FluxPriceFeedFactory"];
