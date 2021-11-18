import { Signer } from "@ethersproject/abstract-signer";
import { task } from "hardhat/config";

task("derivePrivateKey", "Prints the account information from the mnemonic", async (_taskArgs, hre) => {
  if (!process.env.MNEMONIC) return;
  const accounts: Signer[] = await hre.ethers.getSigners();
  const key = hre.ethers.Wallet.fromMnemonic(process.env.MNEMONIC);
  const pub = await accounts[0].getAddress();
  console.log(`Public key: ${pub}`);
  console.log(`Private key: ${key.privateKey}`);
});
