# Flux - First-Party Price Feeds for EVM

This repository contains contracts for first-party price feeds for EVM chains, using [OpenZeppelin](https://docs.openzeppelin.com/contracts/4.x/api/access#AccessControl) for access control. Those with a validator role can post numeric data to deployed contracts at any interval. `FluxPriceFeed` contracts are compatible with Chainlink's V2 and V3 aggregator interface, and the `FluxPriceFeedFactory` contract is EIP-2362 compatible.

If you are a smart contract developer looking to utilize Flux price feeds, check out the [live pairs](https://docs.fluxprotocol.org/docs/live-data-feeds/fpo-live-networks-and-pairs) on the documentation and copy the interface file `contracts/interface/CLV2V3Interface.sol` to use within your contracts. The contracts `ExamplePriceFeedConsumer` and `RelayerOracleConsumer` demonstrate how to use a price feed within a smart contract.

If you are interested in becoming a first-party data provider, deploy a price feed factory or individual price feed using the instructions in this repository and post data to it using the [fpo-node](https://github.com/fluxprotocol/fpo-node).

See the `docs/` directory for more information on using the contracts.

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
