echo "deploying rinkeby"
npx hardhat deploy:FluxLayerZeroOracle  --network rinkeby --admin 0xfde03d932d6c0e9aac9f239a17738afdf504226d --layerzero-two 0x28921b09dB1C7add63265e5ec79B008F0851D5DC
echo "bsc"
npx hardhat deploy:FluxLayerZeroOracle  --network bsc-testnet --admin 0xfde03d932d6c0e9aac9f239a17738afdf504226d --layerzero-two 0x28921b09dB1C7add63265e5ec79B008F0851D5DC
echo "fuji"
npx hardhat deploy:FluxLayerZeroOracle  --network fuji --admin 0xfde03d932d6c0e9aac9f239a17738afdf504226d --layerzero-two 0x28921b09dB1C7add63265e5ec79B008F0851D5DC
echo "mumbai"
npx hardhat deploy:FluxLayerZeroOracle  --network mumbai --admin 0xfde03d932d6c0e9aac9f239a17738afdf504226d --layerzero-two 0x28921b09dB1C7add63265e5ec79B008F0851D5DC
echo "rinkeby arbitrum"
npx hardhat deploy:FluxLayerZeroOracle  --network arbitrum-rinkeby --admin 0xfde03d932d6c0e9aac9f239a17738afdf504226d --layerzero-two 0x28921b09dB1C7add63265e5ec79B008F0851D5DC
echo "optimistic kovan"
npx hardhat deploy:FluxLayerZeroOracle  --network optimism-kovan --admin 0xfde03d932d6c0e9aac9f239a17738afdf504226d --layerzero-two 0x28921b09dB1C7add63265e5ec79B008F0851D5DC