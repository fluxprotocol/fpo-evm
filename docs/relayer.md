## Relayer model

For increased redundancy, we encourage protocols to implement a relayer price feed to verify against a main price feed. The contract `RelayerPriceFeedConsumer` demonstrates an example of how a relayer oracle might be used:

```solidity
(, int256 price, , uint256 timestamp, ) = priceFeed.latestRoundData();
(, int256 relayerPrice, , uint256 relayerTimestamp, ) = relayerFeed.latestRoundData();

require((timestamp != 0) && (block.timestamp - timestamp < maxDelay), "No/old data from price feed");
require(
    (relayerTimestamp != 0) && (block.timestamp - relayerTimestamp < maxDelay),
    "No/old data from relayer feed"
);

uint256 calculatedDeviation = uint256((abs(relayerPrice - price) * 10000) / relayerPrice);
require(calculatedDeviation < deviationPercent, "Relayer/price feed deviation too large");
return price;
```

In this example, if the relayer oracle reports too large of a deviation from the main oracle or the maximum delay is exceeded, the transaction will be reverted.

The maximum delay and maximum deviation percentage depend on the price feeds being used. It is recommended to test with different values before deploying to production.
