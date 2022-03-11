echo "deploying rinkeby"
npx hardhat deploy:FluxLayerZeroOracle  --network rinkeby --ultralightnode 0x3363DEB8366A4302349EB26809F9971A1e33921a --admin 0xfde03d932d6c0e9aac9f239a17738afdf504226d --layerzero 0x28921b09dB1C7add63265e5ec79B008F0851D5DC  --layerzero-two 0xc13b65f7c53Cd6db2EA205a4b574b4a0858720A6
echo "bsc"
npx hardhat deploy:FluxLayerZeroOracle  --network bsc-testnet --ultralightnode 0x0322f521A328475f954F16933a386748f9942ec7 --admin 0xfde03d932d6c0e9aac9f239a17738afdf504226d --layerzero 0x28921b09dB1C7add63265e5ec79B008F0851D5DC  --layerzero-two 0xc13b65f7c53Cd6db2EA205a4b574b4a0858720A6
echo "fuji"
npx hardhat deploy:FluxLayerZeroOracle  --network fuji --ultralightnode 0x0848B8AD17D4003dDe1f1B7eF1FdBA4B629Da97e --admin 0xfde03d932d6c0e9aac9f239a17738afdf504226d --layerzero 0x28921b09dB1C7add63265e5ec79B008F0851D5DC  --layerzero-two 0xc13b65f7c53Cd6db2EA205a4b574b4a0858720A6
echo "mumbai"
npx hardhat deploy:FluxLayerZeroOracle  --network mumbai --ultralightnode 0x447214f17a31a76A6b32cD2243Ac4C551e7FB1E7 --admin 0xfde03d932d6c0e9aac9f239a17738afdf504226d --layerzero 0x28921b09dB1C7add63265e5ec79B008F0851D5DC  --layerzero-two 0xc13b65f7c53Cd6db2EA205a4b574b4a0858720A6
echo "rinkeby arbitrum"
npx hardhat deploy:FluxLayerZeroOracle  --network arbitrum-rinkeby --ultralightnode 0x19fEe87F426Dcf5446d6e259A1eCED85DF2f2849 --admin 0xfde03d932d6c0e9aac9f239a17738afdf504226d --layerzero 0x28921b09dB1C7add63265e5ec79B008F0851D5DC  --layerzero-two 0xc13b65f7c53Cd6db2EA205a4b574b4a0858720A6
echo "optimistic kovan"
npx hardhat deploy:FluxLayerZeroOracle  --network optimism-kovan --ultralightnode 0x5fa09a6E7c86F4c92f925A4e470a7B97759975d1 --admin 0xfde03d932d6c0e9aac9f239a17738afdf504226d --layerzero 0x28921b09dB1C7add63265e5ec79B008F0851D5DC  --layerzero-two 0xc13b65f7c53Cd6db2EA205a4b574b4a0858720A6