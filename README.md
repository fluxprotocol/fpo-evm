# Audit notes

## Contracts

- `FluxPriceFeed.sol` - a Chainlink-compatible price feed with OpenZeppelin AccessControl. Those granted `VALDIATOR_ROLE` can post a new answer to it via `transmit()` at any interval, and protocols typically call `latestAnswer()` to fetch its' latest price.
- `ExamplePriceFeedConsumer.sol` - a basic example to show how a FluxPriceFeed would be utilized by another protocol.
- `FluxP2PFactory.sol` - An upgradeable IERC2362-compatible price feed factory that creates new `FluxPriceFeed` contracts, with itself being the only `VALIDATOR_ROLE`. The contract owner can create and set the signers on a `FluxPriceFeed`, and a leader submits signed messages of the same answer and associated price pair via `transmit()` to update a feed.

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

Test the contracts with:

```sh
$ yarn test
```
