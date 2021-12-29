# Flux - First-Party Price Feeds for EVM

This repository contains contracts for first-party price feeds for EVM chains, using [OpenZeppelin](https://docs.openzeppelin.com/contracts/4.x/api/access#AccessControl) for access control. Those with a validator role can post numeric data to deployed contracts at any interval. Contracts are compatible with Chainlink's V2 and V3 aggregator interface.

Supported networks: `arbitrum`, `arbitrum-testnet`, `aurora`, `aurora-testnet`, `avalanche`, `avalanche-testnet`, `bsc`, `bsc-testnet`, `celo`, `fantom`, `goerli`, `harmony`, `harmony-testnet`, `kovan`, `mainnet`, `matic-testnet`, `polygon`, `rinkeby`, `ropsten`, `xdai`

## Usage

### Pre-Requisites

Before running any command, you need to create a `.env` file and set a BIP-39 compatible mnemonic as an environment
variable. Follow the example in `.env.example`. If you don't already have a mnemonic, use this [website](https://iancoleman.io/bip39/) to generate one.

Then, proceed with installing dependencies:

```sh
yarn install
```

Next, compile the smart contracts with Hardhat:

```sh
$ yarn compile
```

## First-party price feed

### Deploy

Deploy a price feed contract (e.g. to Aurora):

```sh
$ yarn deploy --decimals 8 --description "ETH / USD" --network aurora
```

Save the deployed contract address outputted by the command above.

Optionally include `--validator "0xMyAddress"` to grant a specific address the initial validator role rather than the deployer.

_Note: We deployed a price feed contract on Aurora at address `0xb5c82C7F2a5a90b040f411fe7D80C154Cc082160` with all role-based permissions removed. Feel free to try posting and fetching data on this contract without deploying your own!_

### Update answer

Using the mnemonic of the validator in the `.env` file, update the value on a deployed contract:

```sh
$ yarn transmit --contract "0xContractAddress" --answer 4200000000 --network aurora
```

### Fetch latest answer

```sh
$ yarn latestAnswer --contract "0xContractAddress" --network aurora

4200000000
```

## Price aggregator

The price aggregator contract pulls from multiple first-party price feeds to return an averaged price. A minimum delay time is set, and anyone is allowed to update the latest price on the aggregator by calling `updatePrices()`. Similar to the first-party feed, the latest price is fetched using `latestAnswer()`.

### Deploy

Deploy an aggregator contract (e.g. to Aurora):

```bash
$ yarn deployAggregator --oracles 0x201FA7D0838726f16e93fED5E456d50B93CA79b0,0x19f622DFCb93a52e06e45202534EDf6f81A71063,0x77Aa1441D9BBf2102824CD73e6C3E4a765161b82 --network aurora
```

Save the deployed contract address outputted by the command above.

Separate oracles with a single comma. Optionally include `--admin "0xMyAddress"` to grant a specific address the initial validator role rather than the deployer.

### Update averaged price

To loop through all oracles and average their price on the aggregator contract:

```sh
$ yarn updatePrices --contract "0xContractAddress" --network aurora

4200000000
```

### Fetch latest answer

```sh
$ yarn latestAnswer --contract "0xContractAddress" --network aurora

4200000000
```

---

### TypeChain

Compile the smart contracts and generate TypeChain artifacts:

```sh
$ yarn typechain
```

### Lint Solidity

Lint the Solidity code:

```sh
$ yarn lint:sol
```

### Lint TypeScript

Lint the TypeScript code:

```sh
$ yarn lint:ts
```

### Test

Run the Mocha tests:

```sh
$ yarn test
```

### Coverage

Generate the code coverage report:

```sh
$ yarn coverage
```

### Report Gas

See the gas usage per unit test and average gas per method call:

```sh
$ REPORT_GAS=true yarn test
```

### Clean

Delete the smart contract artifacts, the coverage reports and the Hardhat cache:

```sh
$ yarn clean
```

## Syntax Highlighting

If you use VSCode, you can enjoy syntax highlighting for your Solidity code via the
[vscode-solidity](https://github.com/juanfranblanco/vscode-solidity) extension. The recommended approach to set the
compiler version is to add the following fields to your VSCode user settings:

```json
{
  "solidity.compileUsingRemoteVersion": "v0.8.4+commit.c7e474f2",
  "solidity.defaultCompiler": "remote"
}
```

Where of course `v0.8.4+commit.c7e474f2` can be replaced with any other version.
