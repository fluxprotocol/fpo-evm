import { Signer } from "@ethersproject/abstract-signer";
import { arrayify } from "@ethersproject/bytes";
import { ethers } from "ethers";
import { task } from "hardhat/config";

//npx hardhat p2pSignModifySignersMsg --network kovan --contract "0x45dB673378C39d76a295519217817C17EF8c8276" --id "0x07a05bb26f9432e6705a02a5df0751e3390bd9ebb4d9300c3d466f3160fc9923" --signer "0xC4003CBC00c9279cA18F66acFD951768B69fEB32" --add true
task("p2pSignModifySignersMsg", "Sign message to add/rm signer")
  .addParam("contract", "Factory contract address")
  .addParam("id", "Deployed pricepair id")
  .addParam("signer", "Signer address to be modified")
  .addParam("add", "Add or remove signer")
  .setAction(async (_taskArgs, hre) => {
    const accounts: Signer[] = await hre.ethers.getSigners();
    const provider = accounts[0];
    const fluxPriceFeedFactory = await hre.ethers.getContractFactory("FluxP2PFactory");
    const contract = await fluxPriceFeedFactory.attach(_taskArgs.contract);

    const round = await contract.latestSignerModificationRound(_taskArgs.id);
    console.log("signer address: ", await provider.getAddress());
    console.log("signed round: ", round);

    const msgHash = ethers.utils.solidityKeccak256(
      ["bytes32", "uint256", "address", "bool"],
      [_taskArgs.id, Number(round) + 1, _taskArgs.signer, Boolean(_taskArgs.add)],
    );

    const sig = await provider.signMessage(arrayify(msgHash));
    console.log("signature: ", sig);
  });
["bytes32", "uint256", "int192", "uint64"];
