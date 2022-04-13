import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "hardhat-gas-reporter";
import "@nomiclabs/buidler/config";
import "@nomiclabs/hardhat-etherscan";

import "./tasks/accounts";
import "./tasks/deploy/";
import "./tasks/derivePrivateKey";
import "./tasks/latestAnswer";
import "./tasks/transmit";
import "./tasks/updatePrices";
import "./tasks/multiPriceFeedTransmit";
import "./tasks/multiPriceFeedValueFor";
import "./tasks/typeAndVersion";
import "./tasks/factoryTransmit";
import "./tasks/fetchFactoryPricePairAddress";
import "./tasks/factoryGetId";
import "./tasks/factoryAddressOfPricePair";
import "./tasks/factoryAddressOfPricePairId";
import "./tasks/factoryValueFor";
import "./tasks/priceFeedGrantRole";
import "./tasks/priceFeedRevokeRole";

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

const mnemonic = process.env.MNEMONIC || "test test test test test test test test test test test junk";
const infuraApiKey = process.env.INFURA_API_KEY || "";

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
    "arbitrum-rinkeby-testnet": {
      accounts: { mnemonic },
      url: "https://rinkeby.arbitrum.io/rpc",
      chainId: 421611,
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
      // url: "https://data-seed-prebsc-2-s3.binance.org:8545",
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      gasPrice: 20000000000,
    },
    celo: {
      accounts: { mnemonic },
      url: "https://forno.celo.org",
      chainId: 42220,
    },
    "celo-testnet": {
      accounts: { mnemonic },
      url: "https://alfajores-forno.celo-testnet.org",
      chainId: 44787,
    },
    chronos: {
      accounts: { mnemonic },
      url: "https://evm.cronos.org",
      chainId: 25,
    },
    "chronos-testnet": {
      accounts: { mnemonic },
      url: "https://cronos-testnet-3.crypto.org:8545",
      chainId: 338,
    },
    "evmos-testnet": {
      accounts: { mnemonic },
      url: "https://eth.bd.evmos.dev:8545",
      chainId: 9000,
    },
    fantom: {
      accounts: { mnemonic },
      url: "https://rpcapi.fantom.network",
      chainId: 250,
    },
    "fantom-testnet": {
      accounts: { mnemonic },
      url: "https://rpc.testnet.fantom.network",
      chainId: 4002,
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
    kucoin: {
      accounts: { mnemonic },
      url: "https://rpc-mainnet.kcc.network",
      chainId: 321,
    },
    "kucoin-testnet": {
      accounts: { mnemonic },
      url: "https://rpc-testnet.kcc.network",
      chainId: 322,
    },
    "matic-testnet": {
      accounts: { mnemonic },
      url: "https://stardust.metis.io/?owner=588",
      chainId: 588,
    },
    metis: {
      accounts: { mnemonic },
      url: "https://andromeda.metis.io/?owner=1088",
      chainId: 1088,
    },
    "metis-testnet": {
      accounts: { mnemonic },
      url: "https://proxy.devnet.neonlabs.org/solana",
      chainId: 245022926,
    },
    neon: {
      accounts: { mnemonic },
      url: "https://proxy.mainnet.neonlabs.org/solana",
      chainId: 245022934,
    },
    "neon-testnet": {
      accounts: { mnemonic },
      url: "https://proxy.devnet.neonlabs.org/solana",
      chainId: 245022926,
    },
    oasis: {
      accounts: { mnemonic },
      url: "https://emerald.oasis.dev",
      chainId: 42262,
    },
    "oasis-testnet": {
      accounts: { mnemonic },
      url: "https://testnet.emerald.oasis.dev",
      chainId: 42261,
    },
    polygon: {
      accounts: { mnemonic },
      url: `https://rpc-mainnet.maticvigil.com/`,
      chainId: 137,
    },
    "polygon-mumbai-matic": {
      accounts: { mnemonic },
      url: `https://rpc-mumbai.matic.today`,
      chainId: 80001,
    },
    gnosis: {
      accounts: { mnemonic },
      url: "https://rpc.gnosischain.com",
      chainId: 100,
    },
    syscoin: {
      accounts: { mnemonic },
      url: "https://rpc.syscoin.org",
      chainId: 57,
      blockGasLimit: 8000000,
    },
    "syscoin-testnet": {
      accounts: { mnemonic },
      url: "https://rpc.tanenbaum.io",
      chainId: 5700,
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

  etherscan: {
    apiKey: {
      kovan: process.env.ETHERSCAN_API_KEY,
      mainnet: process.env.ETHERSCAN_API_KEY,
      ropsten: process.env.ETHERSCAN_API_KEY,
      rinkeby: process.env.ETHERSCAN_API_KEY,
      goerli: process.env.ETHERSCAN_API_KEY,
      auroraTestnet: process.env.AURORASCAN_API_KEY,
    },
  },
};

export default config;
