echo "deploying rinkeby"
npx hardhat deploy:FluxLayerZeroOracle  --network rinkeby --layerzero 0xC243d1216dE99aF3372395153f1b1Ed65Bd0c2CB
echo "bsc"
npx hardhat deploy:FluxLayerZeroOracle  --network bsc-testnet --layerzero 0x7333D9a183ef484f0343135e029EfAA3eb7271a8
echo "fuji"
npx hardhat deploy:FluxLayerZeroOracle  --network fuji --layerzero 0xc528020Cee8Dd7d736466987b4d8f9901a6A5A3e
echo "mumbai"
npx hardhat deploy:FluxLayerZeroOracle  --network mumbai --layerzero 0x17A329A42E7587E43128Ee8Afd059B8c2209A6E3
echo "rinkeby arbitrum"
npx hardhat deploy:FluxLayerZeroOracle  --network arbitrum-rinkeby --layerzero 0xf2fEa0253ce6263eBDaE4d3E92c5162D15A8BF5F
echo "optimistic kovan"
npx hardhat deploy:FluxLayerZeroOracle  --network optimism-kovan --layerzero 0x4EE70c13F24aAd9EE0F9995ab25C5a0BF99433Ae