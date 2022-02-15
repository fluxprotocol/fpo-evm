import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "hardhat-gas-reporter";
// import "buidler-gas-reporter";

import "./tasks/accounts";
import "./tasks/deploy";
import "./tasks/derivePrivateKey";
import "./tasks/latestAnswer";
import "./tasks/transmit";
import "./tasks/updatePrices";

import { resolve } from "path";

import { config as dotenvConfig } from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import { NetworkUserConfig } from "hardhat/types";

dotenvConfig({ path: resolve(__dirname, "./.env") });

const ethChainIds = {
  goerli: 5,
  hardhat: 31337,
  kovan: 42,
  mainnet: 1,
  rinkeby: 4,
  ropsten: 3,
};

// Ensure that we have all the environment variables we need.
const mnemonic: string | undefined = process.env.MNEMONIC;
if (!mnemonic) {
  throw new Error("Please set your MNEMONIC in a .env file");
}

const infuraApiKey: string | undefined = process.env.INFURA_API_KEY;
if (!infuraApiKey) {
  throw new Error("Please set your INFURA_API_KEY in a .env file");
}

function getChainConfig(network: keyof typeof ethChainIds): NetworkUserConfig {
  const url: string = "https://" + network + ".infura.io/v3/" + infuraApiKey;
  return {
    accounts: {
      count: 10,
      mnemonic,
      path: "m/44'/60'/0'/0",
    },
    chainId: ethChainIds[network],
    url,
  };
}

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  gasReporter: {
    currency: "USD",
    token: "ETH",
    gasPriceApi: "https://api.etherscan.io/api?module=proxy&action=eth_gasPrice",
    enabled: process.env.REPORT_GAS ? true : false,
    coinmarketcap: process.env.COINMARKETCAP_API,
    excludeContracts: [],
    src: "./contracts",
  },
  networks: {
    hardhat: {
      accounts: {
        mnemonic,
      },
      chainId: ethChainIds.hardhat,
    },
    arbitrum: {
      accounts: { mnemonic },
      url: "https://arb1.arbitrum.io/rpc",
      chainId: 42161,
      blockGasLimit: 700000,
    },
    "arbitrum-testnet": {
      accounts: { mnemonic },
      url: "https://kovan3.arbitrum.io/rpc",
      chainId: 79377087078960,
    },
    aurora: {
      accounts: {
        mnemonic,
      },
      chainId: 1313161554,
      url: "https://mainnet.aurora.dev",
    },
    "aurora-testnet": {
      accounts: {
        mnemonic,
      },
      chainId: 1313161555,
      url: "https://testnet.aurora.dev",
    },
    avalanche: {
      accounts: { mnemonic },
      url: "https://api.avax.network/ext/bc/C/rpc",
      chainId: 43114,
      gasPrice: 470000000000,
    },
    "avalanche-testnet": {
      accounts: { mnemonic },
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
    },
    bsc: {
      accounts: { mnemonic },
      url: "https://bsc-dataseed.binance.org",
      chainId: 56,
    },
    "bsc-testnet": {
      accounts: { mnemonic },
      url: "https://data-seed-prebsc-2-s3.binance.org:8545",
      chainId: 97,
    },
    celo: {
      accounts: { mnemonic },
      url: "https://forno.celo.org",
      chainId: 42220,
    },
    fantom: {
      accounts: { mnemonic },
      url: "https://rpcapi.fantom.network",
      chainId: 250,
    },
    harmony: {
      accounts: { mnemonic },
      url: "https://api.s0.t.hmny.io",
      chainId: 1666600000,
    },
    "harmony-testnet": {
      accounts: { mnemonic },
      url: "https://api.s0.b.hmny.io",
      chainId: 1666700000,
    },
    "matic-testnet": {
      accounts: { mnemonic },
      url: "https://rpc-mumbai.maticvigil.com/",
      chainId: 80001,
    },
    polygon: {
      accounts: { mnemonic },
      url: `https://rpc-mainnet.maticvigil.com/`,
      chainId: 137,
    },
    xdai: {
      accounts: { mnemonic },
      url: "https://rpc.xdaichain.com",
      chainId: 100,
    },
    tanenbaum: {
      accounts: { mnemonic },
      url: "https://rpc.tanenbaum.io",
      chainId: 5700,
      blockGasLimit: 8000000,
    },
    syscoin: {
      accounts: { mnemonic },
      url: "https://rpc.syscoin.org",
      chainId: 57,
      blockGasLimit: 8000000,
    },
    goerli: getChainConfig("goerli"),
    kovan: getChainConfig("kovan"),
    rinkeby: getChainConfig("rinkeby"),
    ropsten: getChainConfig("ropsten"),
    mainnet: getChainConfig("mainnet"),
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },
  solidity: {
    version: "0.8.10",
    settings: {
      metadata: {
        // Not including the metadata hash
        // https://github.com/paulrberg/solidity-template/issues/31
        bytecodeHash: "none",
      },
      // Disable the optimizer when debugging
      // https://hardhat.org/hardhat-network/#solidity-optimizer-support
      optimizer: {
        enabled: true,
        runs: 800,
      },
    },
  },
  typechain: {
    outDir: "src/types",
    target: "ethers-v5",
  },
};

export default config;
