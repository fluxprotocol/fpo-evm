import { Signer } from "@ethersproject/abstract-signer";
import { arrayify } from "@ethersproject/bytes";
import { ethers } from "ethers";
import { task } from "hardhat/config";

//npx hardhat p2pSignTransmitMsg --network kovan --contract "0x45dB673378C39d76a295519217817C17EF8c8276" --id "0x07a05bb26f9432e6705a02a5df0751e3390bd9ebb4d9300c3d466f3160fc9923" --answer "3000"
task("p2pSignTransmitMsg", "Sign answers to be transmitted")
  .addParam("contract", "Factory contract address")
  .addParam("id", "Deployed pricepair id")
  .addParam("answer", "The price to be signed")
  .setAction(async (_taskArgs, hre) => {
    const accounts: Signer[] = await hre.ethers.getSigners();
    const provider = accounts[1];
    const fluxPriceFeedFactory = await hre.ethers.getContractFactory("FluxP2PFactory");
    const contract = await fluxPriceFeedFactory.attach(_taskArgs.contract);
    const timestamp = Math.round(new Date().getTime() / 1000);

    const round = await contract.connect(provider).latestRoundOfPricePair(_taskArgs.id);
    console.log("signer address: ", await provider.getAddress());
    console.log("signed timestamp: ", timestamp);
    console.log("signed round: ", round);
    console.log("signed answer: ", _taskArgs.answer);

    const msgHash = ethers.utils.solidityKeccak256(
      ["bytes32", "uint256", "int192", "uint64"],
      [_taskArgs.id, Number(round) + 1, Number(_taskArgs.answer), Number(timestamp)],
    );

    const sig = await provider.signMessage(arrayify(msgHash));
    console.log("signature: ", sig);
  });
["bytes32", "uint256", "int192", "uint64"];
