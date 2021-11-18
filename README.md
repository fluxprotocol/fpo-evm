# Flux - First-Party Price Feeds for EVM

This repository contains contracts for first-party price feeds for EVM chains, using [OpenZeppelin](https://docs.openzeppelin.com/contracts/4.x/api/access#AccessControl) for access control. Those with a validator role can post numeric data to deployed contracts at any interval. Contracts are compatible with Chainlink's V2 and V3 aggregator interface.

## Usage

### Pre Requisites

Before running any command, you need to create a `.env` file and set a BIP-39 compatible mnemonic as an environment
variable. Follow the example in `.env.example`. If you don't already have a mnemonic, use this [website](https://iancoleman.io/bip39/) to generate one.

Then, proceed with installing dependencies:

```sh
yarn install
```

### Compile

Compile the smart contracts with Hardhat:

```sh
$ yarn compile
```

### Deploy

Deploy a price feed contract to Aurora:

```sh
$ yarn deploy --validator "0xMyAddress" --decimals 6 --description "ETH/USD" --network aurora
```

Save the address of the deployed contract for later use.

### Update answer

Using the mnemonic of the validator in the `.env` file, update the value on a deployed contract:

```sh
$ npx hardhat transmit --contract "0xContractAddress" --answer 4200000000 --network aurora
```

### Fetch latest answer

```sh
$ npx hardhat latestAnswer --contract "0xContractAddress" --network aurora

4200000000
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
