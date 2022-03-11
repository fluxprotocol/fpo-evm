echo "whitelisting rinkeby"
npx hardhat addLayerZero  --network rinkeby  --layerzero 0x3363DEB8366A4302349EB26809F9971A1e33921a  --contract 0x89be93c2B58E5133287058B2CA05a0852bED6A20
echo "bsc"
npx hardhat addLayerZero  --network bsc-testnet  --layerzero 0x0322f521A328475f954F16933a386748f9942ec7  --contract 0xc6C3b1427a94071566a9e6d030c3E6c8d5343482
echo "fuji"
npx hardhat addLayerZero  --network fuji  --layerzero 0x0848B8AD17D4003dDe1f1B7eF1FdBA4B629Da97e  --contract 0xD3Fc1Fe073ec1d3Cd05a7112F2D7D51Af2F04e34
echo "mumbai"
npx hardhat addLayerZero  --network mumbai  --layerzero 0x447214f17a31a76A6b32cD2243Ac4C551e7FB1E7  --contract 0x9C90FDBf428282Db7DDeCF12598905Ce55A06A16
echo "rinkeby arbitrum"
npx hardhat addLayerZero  --network arbitrum-rinkeby  --layerzero 0x19fEe87F426Dcf5446d6e259A1eCED85DF2f2849  --contract 0xb8f797fd165d47b12e2E15A01BD5B8d30f787d1D
echo "optimistic kovan"
npx hardhat addLayerZero  --network optimism-kovan  --layerzero 0x5fa09a6E7c86F4c92f925A4e470a7B97759975d1  --contract 0xffeF31199D8DdC1dc71ad4266fa2fa502e91F215