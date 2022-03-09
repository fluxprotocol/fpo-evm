echo "depoloying rinkeby"
npx hardhat deploy:FluxLayerZeroOracle  --network rinkeby --layerzero 0x40d385859663c82763E5287774C8a6e3823f9DD5
echo "bsc"
npx hardhat deploy:FluxLayerZeroOracle  --network bsc-testnet --layerzero 0x1F3fd8f7e722B8bEC8f43a70A583DFc0DbaCAC17
echo "fuji"
npx hardhat deploy:FluxLayerZeroOracle  --network fuji --layerzero 0x4B2FdCA1C3D7fd7075B669Aaa925C58eA6293b11
echo "mumbai"
npx hardhat deploy:FluxLayerZeroOracle  --network mumbai --layerzero 0x51b9b86498afaD36F3500bc2989dEEF2b5B0ea05
echo "rinkeby arbitrum"
npx hardhat deploy:FluxLayerZeroOracle  --network arbitrum-rinkeby --layerzero 0x75ECE223242810528f76EE266E0119081227156f
echo "optimistic kovan"
npx hardhat deploy:FluxLayerZeroOracle  --network optimism-kovan --layerzero 0x3B70EFBa8d608cf6992E15D6513106E7Fa58a4fb