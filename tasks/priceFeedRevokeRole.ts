import { ethers, Signer } from "ethers";
import { keccak256 } from "ethers/lib/utils";
import { task } from "hardhat/config";
// npx hardhat priceFeedRevokeRole --network kovan --contract 0x1B56eBC595411662c781c2EE69854341d95cf814 --provider 0xD8FC00c7fe6e9a12d701192595abF425A6546E9A
task("priceFeedRevokeRole", "Revokes validator role")
  .addParam("contract", "The price feed contract to add role to")
  .addParam("provider", "The provider to be revoked")
  .setAction(async (_taskArgs, hre) => {
    const accounts: Signer[] = await hre.ethers.getSigners();
    const provider = accounts[0];
    const FluxPriceFeed = await hre.ethers.getContractFactory("contracts/FluxPriceFeed.sol:FluxPriceFeed");
    const contract = await FluxPriceFeed.attach(_taskArgs.contract);
    const VALIDATOR_ROLE = keccak256(ethers.utils.toUtf8Bytes("VALIDATOR_ROLE"));
    const tx = await contract.connect(provider).revokeRole(VALIDATOR_ROLE, _taskArgs.provider);
    console.log("Transaction hash:", tx.hash);
  });
