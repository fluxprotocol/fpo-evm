## FluxPriceFeed

### Deploy

Deploy an individual price feed contract (e.g. to Aurora):

```sh
$ yarn deploy --decimals 8 --description "ETH / USD" --network aurora
```

Save the deployed contract address outputted by the command above.

Optionally include `--validator "0xMyAddress"` to grant a specific address the initial validator role rather than the deployer.

_Note: We deployed a price feed contract on Aurora at address `0x8BAac7F07c86895cd017C8a2c7d3C72cF9f1051F` with all role-based permissions removed. Feel free to try posting and fetching data on this contract without deploying your own!_

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

## Feeds registry

`FeedsRegistry.sol` mimicks the [Chainlink Feed Registry](https://blog.chain.link/introducing-the-chainlink-feed-registry/) interface to query the latest value from price feeds by only providing a pair of asset and denomination addresses, without needing to know each feed’s contract address.

### Deploy

Deploy a feed registry (e.g. to Aurora):

```bash
$ yarn deployFeedsRegistry --network aurora
```

Save the deployed contract address outputted by the command above.

Optionally include `--admin "0xMyAddress"` to grant a specific address the initial validator role rather than the deployer.
