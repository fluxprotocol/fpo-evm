## Feeds registry

`FeedsRegistry.sol` mimicks the [Chainlink Feed Registry](https://blog.chain.link/introducing-the-chainlink-feed-registry/) interface to query the latest value from price feeds by only providing a pair of asset and denomination addresses, without needing to know each feed’s contract address.

### Deploy

Deploy a feed registry (e.g. to Aurora):

```bash
$ yarn deployFeedsRegistry --network aurora
```

Save the deployed contract address outputted by the command above.

Optionally include `--admin "0xMyAddress"` to grant a specific address the initial validator role rather than the deployer.
