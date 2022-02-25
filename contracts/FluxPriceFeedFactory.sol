// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "./interface/IERC2362.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
// import "./FluxMultiPriceFeed.sol";
import "./FluxPriceFeed.sol";
/**
 * @title Flux first-party price feed factory
 * @author fluxprotocol.org
 */
contract FluxPriceFeedFactory is AccessControl, IERC2362 {
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");

    bytes32[] public FluxPriceFeedsArray;
    mapping(bytes32 => FluxPriceFeed) public FluxPriceFeedsMapping;


    
    struct PricePair {
        int256 price;
        uint256 timestamp;
    }
    mapping(bytes32 => PricePair) public FluxMultiPriceFeedsMapping;
    bytes32[] public FluxMultiPriceFeedsArray;

    constructor(address _validator) {
        _setupRole(VALIDATOR_ROLE, _validator);
    }

     /**
     * @notice answer from the most recent report of a certain price pair
     * @param _id Keccak256 hash of the price pair string we wanna query
     */
    function valueFor(bytes32 _id)
        external
        view
        override
        returns (
            int256,
            uint256,
            uint256
        )
    {
        // if not found, return 404
        if (FluxMultiPriceFeedsMapping[_id].timestamp <= 0) return (0, 0, 404);

        return (FluxMultiPriceFeedsMapping[_id].price, FluxMultiPriceFeedsMapping[_id].timestamp, 200);
    }

    /**
     * @notice transmit is called to post a new value to the contract price pairs
     * @param _pricePairs array of price pairs ids we wanna post values for
     * @param _answers array of prices we wanna post

     */
    function transmit(bytes32[] calldata _pricePairs, int256[] calldata _answers) external onlyRole(VALIDATOR_ROLE) {
        require(_answers.length == _pricePairs.length, "The transmitted arrays must be equal");
        for (uint256 i = 0; i < _pricePairs.length; i++) {
            FluxMultiPriceFeedsArray.push(_pricePairs[i]);
            FluxMultiPriceFeedsMapping[_pricePairs[i]].price = _answers[i];
            FluxMultiPriceFeedsMapping[_pricePairs[i]].timestamp = block.timestamp;
        }
    }
    
   

    /// @notice create new priceFeed
    ///@param _description Price-ETH/USD-3
    function CreateNewPriceFeed(address _validator, uint8 _decimals, string memory _description) 
        public returns (address)
    {
        FluxPriceFeed priceFeed = new FluxPriceFeed(_validator, _decimals, _description);
        // FluxPriceFeedsArray.push(priceFeed);
        bytes32 _id = keccak256(abi.encodePacked(_description));
        FluxPriceFeedsArray.push(_id);
        FluxPriceFeedsMapping[_id] = priceFeed;
        return address(priceFeed);

    }

    /**
     * @notice answer from the most recent report
     */
    function priceFeedLatestAnswer(string memory _description) public view returns (int256) {
        return FluxPriceFeed(address(FluxPriceFeedsMapping[keccak256(abi.encodePacked(_description))])).latestAnswer();

    }

     /**
     * @notice transmit is called to post a new report to the contract
     * @param _answer latest answer
     */
    function priceFeedTransmit(string memory _description, int192 _answer) public onlyRole(VALIDATOR_ROLE){
        FluxPriceFeed(address(FluxPriceFeedsMapping[keccak256(abi.encodePacked(_description))])).transmit(_answer);

    }

    function listPriceFeeds() public view returns(bytes32[] memory){
        return FluxPriceFeedsArray;
        
    }

    function listMutiPricePairs() public view returns(bytes32[] memory){
        return FluxMultiPriceFeedsArray;
        
    }



}
