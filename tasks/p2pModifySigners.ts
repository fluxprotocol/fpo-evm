import { Signer } from "@ethersproject/abstract-signer";
import { task } from "hardhat/config";

// npx hardhat p2pModifySigners --network kovan --contract 0x45dB673378C39d76a295519217817C17EF8c8276 --add true --signer "0xC4003CBC00c9279cA18F66acFD951768B69fEB32" --id "0x07a05bb26f9432e6705a02a5df0751e3390bd9ebb4d9300c3d466f3160fc9923" --signatures "0xdeb325206123cf2dc40d34df48abf186c80baa98bb2ba223b5d16ea5171c6f131d854aa6bb12608482643745a3bf8a23bd6cf42e03b7feaf41c6a7ae22a91e8a1c 0x21ab7e5a9276bba7b2923c00a21a311f0d4cd20530d03bad2c727a78571909ce0c0b465ca06ae4bb8a94c3cdff2b95bd9efeb3e3f568f386edf93dbc25b742151c"

task("p2pModifySigners", "Add or remove signer")
  .addParam("contract", "The factory contract address")
  .addParam("signatures", "Answers signatures")
  .addParam("id", "Deployed pricepair id")
  .addParam("signer", "Signer address to be modified")
  .addParam("add", "Add (true) or remove (false) signer")
  .setAction(async (_taskArgs, hre) => {
    const accounts: Signer[] = await hre.ethers.getSigners();
    const admin = accounts[0];
    console.log("Sending signer address: ", await admin.getAddress());
    const FluxP2PFactory = await hre.ethers.getContractFactory("FluxP2PFactory");
    const contract = await FluxP2PFactory.attach(_taskArgs.contract);
    const received_sigs = _taskArgs.signatures.split(" ");
    const tx = await contract
      .connect(admin)
      .modifySigners(received_sigs, _taskArgs.id, _taskArgs.signer, Boolean(_taskArgs.add));
    console.log("Transaction hash:", tx.hash);
  });
