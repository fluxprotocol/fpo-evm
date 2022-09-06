## FluxPriceFeed

### Deploy

Deploy an individual price feed contract (e.g. to Aurora):

```sh
$ yarn deploy --decimals 8 --description "ETH / USD" --network aurora
```

Save the deployed contract address outputted by the command above.

Optionally include `--validator "0xMyAddress"` to grant a specific address the initial validator role rather than the deployer.

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
