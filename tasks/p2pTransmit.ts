import { Signer } from "@ethersproject/abstract-signer";
import { task } from "hardhat/config";

// npx hardhat p2pTransmit --network kovan --contract 0x45dB673378C39d76a295519217817C17EF8c8276 --timestamps "1655756755 1655756788" --answers "3000 4000" --id "0x07a05bb26f9432e6705a02a5df0751e3390bd9ebb4d9300c3d466f3160fc9923" --signatures "0xeafdd4a9ab8a54e8b15d674c76e122afcc30af3eff51cac0b0190ec6f64e87997ed5836bdf7b81dc9985a7d660c9cecd309b817e701bfb413070313cb232e4481c 0xb93652507844dc2697d58e5a6cb0ed8b72713bba39cc6619cadc27b426438db6775004119ad9ea7e045458a6154ce2934f238c1c9eae27d9492dac2cbdecc9d11c"

task("p2pTransmit", "Submits an answer to p2pFactory")
  .addParam("contract", "The factory contract to post to")
  .addParam("signatures", "Answers signatures")
  .addParam("id", "Pricepair id")
  .addParam("answers", "Signed answers")
  .addParam("timestamps", "Signed timestamps")
  .setAction(async (_taskArgs, hre) => {
    const accounts: Signer[] = await hre.ethers.getSigners();
    const admin = accounts[0];
    console.log("Sending signer address: ", await admin.getAddress());
    const FluxP2PFactory = await hre.ethers.getContractFactory("FluxP2PFactory");
    const contract = await FluxP2PFactory.attach(_taskArgs.contract);
    const received_answers = _taskArgs.answers.split(" ");
    const received_timestamps = _taskArgs.timestamps.split(" ");
    const received_sigs = _taskArgs.signatures.split(" ");
    const tx = await contract
      .connect(admin)
      .transmit(received_sigs, _taskArgs.id, received_answers, received_timestamps);
    console.log("Transaction hash:", tx.hash);

    const [price, ,] = await contract.connect(admin).valueFor(_taskArgs.id);
    console.log("retrieved price = ", price);
  });
