echo "whitelisting rinkeby"
npx hardhat addLayerZero  --network rinkeby  --layerzero 0x3363DEB8366A4302349EB26809F9971A1e33921a  --contract 0x36afa71e35f27ED36dEbeFde89DdEc6346f8a61d
echo "bsc"
npx hardhat addLayerZero  --network bsc-testnet  --layerzero 0x0322f521A328475f954F16933a386748f9942ec7  --contract 0x0cE4dc9f402d3de4812f93E2173b54bAfA98A494
echo "fuji"
npx hardhat addLayerZero  --network fuji  --layerzero 0x0848B8AD17D4003dDe1f1B7eF1FdBA4B629Da97e  --contract 0x8D14D0c31AF9fe9DD582eE6b998D9D67f6b096fF
echo "mumbai"
npx hardhat addLayerZero  --network mumbai  --layerzero 0x447214f17a31a76A6b32cD2243Ac4C551e7FB1E7  --contract 0xf19CdEAcad4aD46599b38273f61A03466c78E04a
echo "rinkeby arbitrum"
npx hardhat addLayerZero  --network arbitrum-rinkeby  --layerzero 0x19fEe87F426Dcf5446d6e259A1eCED85DF2f2849  --contract 0x06fa9fc96aC43d4699E4d1250D2D71f81Ea93Cde
echo "optimistic kovan"
npx hardhat addLayerZero  --network optimism-kovan  --layerzero 0x5fa09a6E7c86F4c92f925A4e470a7B97759975d1  --contract 0xc760C43D3e1CF50527170d0170679C3e318cc361