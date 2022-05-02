import { Signer } from "@ethersproject/abstract-signer";
import { ethers } from "ethers";

import { task } from "hardhat/config";

// npx hardhat p2pTransmit --network kovan --contract 0x29EC2B23280A6203E0ff2bb276A6Ea006e8bA94A --pricepair "ETH/USD" --decimal "6" --answer "3000" --roundid "0" --signatures "0x0253ac311a3c55539c51d6864eb680ded549344e4fc0894cdcf5cfe44bf882c22e22adbd399620c01cc32f9055ef3aa62bd82fa5d7dc4e115744d765197bd7c71b 0x1ab634fcf3b48b231b8c3f77f24bd602a1571adbcd3a38305a59bc72c112cb1633a55f3248fdd98411cd97ff17dfd9c0c01c1560d51f60fc1231f467d3bdec4a1c"

task("p2pTransmit", "Submits an answer to p2pFactory")
  .addParam("contract", "The price feed contract to post to")
  .addParam("signatures", "Answers signatures")
  .addParam("pricepair", "The prices posted")
  .addParam("decimal", "Price pairs decimals")
  .addParam("roundid", "The target aggregator round")
  .addParam("answer", "The median price posted")
  .addOptionalParam("provider", "answers provider")
  .setAction(async (_taskArgs, hre) => {
    const accounts: Signer[] = await hre.ethers.getSigners();
    const admin = accounts[0];
    console.log("Validator address: ", await admin.getAddress());
    const FluxP2PFactory = await hre.ethers.getContractFactory("FluxP2PFactory");
    const contract = await FluxP2PFactory.attach(_taskArgs.contract);
    // const received_answers = _taskArgs.answers.split(" ");
    const received_sigs = _taskArgs.signatures.split(" ");
    const tx = await contract
      .connect(admin)
      .transmit(received_sigs, _taskArgs.pricepair, _taskArgs.decimal, _taskArgs.roundid, _taskArgs.answer);
    console.log("Transaction hash:", tx.hash);
    const str = "Price-" + _taskArgs.pricepair + "-" + _taskArgs.decimal;
    const id = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(str));
    const [price, ,] = await contract.connect(admin).valueFor(id);
    console.log("retrieved price = ", price);
  });
