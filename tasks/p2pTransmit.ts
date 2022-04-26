import { Signer } from "@ethersproject/abstract-signer";
import { ethers } from "ethers";

import { task } from "hardhat/config";

// npx hardhat p2pTransmit --network kovan --contract 0x6a9a4A000ab331879B986D7AB673feeAA5f67b53 --pricepair "ETH/USD" --decimal "6" --answers "3000 4000" --signatures "0xdffa155edaf5c8f0e54474272b01542d4ea8234a1d5e876dcf96766661dca4c328f8e5dc2ef607d88000682cc57191473b17d7601136b8edab76715a02ed97e31c 0x0d89caab12a415c0ff5551dcba1cc8e3e6d687a0c8bd29f5a048aeadbd09ee91090f957a378e8a9e01d902caee4107ffa28ebf9514250111e6640837e2b89d9b1b"

task("p2pTransmit", "Submits an answer to p2pFactory")
  .addParam("contract", "The price feed contract to post to")
  .addParam("signatures", "Answers signatures")
  .addParam("pricepair", "The prices posted")
  .addParam("decimal", "Price pairs decimals")
  .addParam("answers", "The prices posted")
  .addOptionalParam("provider", "answers provider")
  .setAction(async (_taskArgs, hre) => {
    const accounts: Signer[] = await hre.ethers.getSigners();
    const admin = accounts[0];
    console.log("Validator address: ", await admin.getAddress());
    const FluxP2PFactory = await hre.ethers.getContractFactory("contracts/FluxP2PPriceFeedFactory.sol:FluxP2PFactory");
    const contract = await FluxP2PFactory.attach(_taskArgs.contract);
    const received_answers = _taskArgs.answers.split(" ");
    const received_sigs = _taskArgs.signatures.split(" ");
    const tx = await contract
      .connect(admin)
      .transmit(received_sigs, _taskArgs.pricepair, _taskArgs.decimal, received_answers);
    console.log("Transaction hash:", tx.hash);
    const str = "Price-" + _taskArgs.pricepair + "-" + _taskArgs.decimal;
    const id = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(str));
    const [price, ,] = await contract.connect(admin).valueFor(id);
    console.log("retrieved price = ", price);
  });
