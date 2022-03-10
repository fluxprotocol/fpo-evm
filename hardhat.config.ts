import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "hardhat-gas-reporter";
import "@nomiclabs/buidler/config";
// import "buidler-gas-reporter";

import "./tasks/accounts";
import "./tasks/deploy/";
import "./tasks/derivePrivateKey";
import "./tasks/latestAnswer";
import "./tasks/transmit";
import "./tasks/updatePrices";
import "./tasks/multiPriceFeedTransmit";
import "./tasks/multiPriceFeedValueFor";
import "./tasks/typeAndVersion";

import { resolve } from "path";

import { config as dotenvConfig } from "dotenv";
import { HardhatUserConfig } from "hardhat/config";

dotenvConfig({ path: resolve(__dirname, "./.env") });

const mnemonic = process.env.MNEMONIC;
// const mnemonic = process.env.MNEMONIC || "test test test test test test test test test test test junk";
const privateKey = process.env.PRIVATE_KEY || "0x" + "0".repeat(64);
const infuraApiKey = process.env.INFURA_API_KEY || "";

const accounts = process.env.PRIVATE_KEY ? [privateKey] : { mnemonic };

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
        count: 10,
        mnemonic,
        path: "m/44'/60'/0'/0",
      },
      chainId: 31337,
    },
    arbitrum: {
      accounts,
      url: "https://arb1.arbitrum.io/rpc",
      chainId: 42161,
      blockGasLimit: 700000,
    },
    "arbitrum-testnet": {
      accounts,
      url: "https://kovan3.arbitrum.io/rpc",
      chainId: 79377087078960,
    },
    aurora: {
      accounts,
      chainId: 1313161554,
      url: "https://mainnet.aurora.dev",
    },
    "aurora-testnet": {
      accounts,
      chainId: 1313161555,
      url: "https://testnet.aurora.dev",
    },
    avalanche: {
      accounts,
      url: "https://api.avax.network/ext/bc/C/rpc",
      chainId: 43114,
      gasPrice: 470000000000,
    },
    "avalanche-testnet": {
      accounts,
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
    },
    bsc: {
      accounts,
      url: "https://bsc-dataseed.binance.org",
      chainId: 56,
    },
    "bsc-testnet": {
      accounts,
      url: "https://data-seed-prebsc-2-s3.binance.org:8545",
      chainId: 97,
    },
    celo: {
      accounts,
      url: "https://forno.celo.org",
      chainId: 42220,
    },
    "celo-testnet": {
      accounts,
      url: "https://alfajores-forno.celo-testnet.org",
      chainId: 44787,
    },
    chronos: {
      accounts,
      url: "https://evm.cronos.org",
      chainId: 25,
    },
    "chronos-testnet": {
      accounts,
      url: "https://cronos-testnet-3.crypto.org:8545",
      chainId: 338,
    },
    fantom: {
      accounts,
      url: "https://rpcapi.fantom.network",
      chainId: 250,
    },
    "fantom-testnet": {
      accounts,
      url: "https://rpc.testnet.fantom.network",
      chainId: 4002,
    },
    harmony: {
      accounts,
      url: "https://api.s0.t.hmny.io",
      chainId: 1666600000,
    },
    "harmony-testnet": {
      accounts,
      url: "https://api.s0.b.hmny.io",
      chainId: 1666700000,
    },
    kucoin: {
      accounts,
      url: "https://rpc-mainnet.kcc.network",
      chainId: 321,
    },
    "kucoin-testnet": {
      accounts,
      url: "https://rpc-testnet.kcc.network",
      chainId: 322,
    },
    "matic-testnet": {
      accounts,
      url: "https://stardust.metis.io/?owner=588",
      chainId: 588,
    },
    metis: {
      accounts,
      url: "https://andromeda.metis.io/?owner=1088",
      chainId: 1088,
    },
    "metis-testnet": {
      accounts,
      url: "https://proxy.devnet.neonlabs.org/solana",
      chainId: 245022926,
    },
    neon: {
      accounts,
      url: "https://proxy.mainnet.neonlabs.org/solana",
      chainId: 245022934,
    },
    "neon-testnet": {
      accounts,
      url: "https://proxy.devnet.neonlabs.org/solana",
      chainId: 245022926,
    },
    polygon: {
      accounts,
      url: `https://rpc-mainnet.maticvigil.com/`,
      chainId: 137,
    },
    gnosis: {
      accounts,
      url: "https://rpc.gnosischain.com",
      chainId: 100,
    },
    syscoin: {
      accounts,
      url: "https://rpc.syscoin.org",
      chainId: 57,
      blockGasLimit: 8000000,
    },
    "syscoin-testnet": {
      accounts,
      url: "https://rpc.tanenbaum.io",
      chainId: 5700,
      blockGasLimit: 8000000,
    },
    goerli: {
      accounts,
      url: "https://goerli.infura.io/v3/" + infuraApiKey,
      chainId: 5,
    },
    kovan: {
      accounts,
      url: "https://kovan.infura.io/v3/" + infuraApiKey,
      chainId: 42,
    },
    rinkeby: {
      accounts,
      url: "https://rinkeby.infura.io/v3/" + infuraApiKey,
      chainId: 4,
    },
    ropsten: {
      accounts,
      url: "https://ropsten.infura.io/v3/" + infuraApiKey,
      chainId: 3,
    },
    mainnet: {
      accounts,
      url: "https://mainnet.infura.io/v3/" + infuraApiKey,
      chainId: 1,
    },
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },
  solidity: {
    version: "0.8.12",
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
