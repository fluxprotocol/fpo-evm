// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "./interface/IERC2362.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./FluxMultiPriceFeed.sol";
import "./FluxPriceFeed.sol";
/**
 * @title Flux first-party price feed factory
 * @author fluxprotocol.org
 */
contract FluxPriceFeedFactory is AccessControl {
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");

    FluxPriceFeed[] public FluxPriceFeedsArray;
    FluxMultiPriceFeed[] public FluxMultiPriceFeedsArray;
    

    mapping(bytes32 => FluxPriceFeed) public FluxPriceFeedsMapping;
    // mapping(bytes32 => FluxMultiPriceFeed) public FluxMultiPriceFeedsMapping;
    

    constructor(address _validator) {
        _setupRole(VALIDATOR_ROLE, _validator);
    }


    
   

    /// @notice create new priceFeed
    ///@param _description Price-ETH/USD-3
    function CreateNewPriceFeed(address _validator, uint8 _decimals, string memory _description) 
        public returns (address)
    {
        FluxPriceFeed priceFeed = new FluxPriceFeed(_validator, _decimals, _description);
        FluxPriceFeedsArray.push(priceFeed);
        bytes32 _id = keccak256(abi.encodePacked(_description));
        FluxPriceFeedsMapping[_id] = priceFeed;
        return address(priceFeed);

    }

    /**
     * @notice answer from the most recent report
     */
    function priceFeedLatestAnswer(string memory _description) public returns (int256) {
        return FluxPriceFeed(address(FluxPriceFeedsMapping[keccak256(abi.encodePacked(_description))])).latestAnswer();

    }

     /**
     * @notice transmit is called to post a new report to the contract
     * @param _answer latest answer
     */
    function priceFeedTransmit(string memory _description, int192 _answer) public onlyRole(VALIDATOR_ROLE){
        FluxPriceFeed(address(FluxPriceFeedsMapping[keccak256(abi.encodePacked(_description))])).transmit(_answer);

    }






    /// @notice create new multiPriceFeed
    function CreateNewMultiPriceFeed(address _validator) public returns (address){
        FluxMultiPriceFeed multiPricFeed = new FluxMultiPriceFeed(_validator);
        FluxMultiPriceFeedsArray.push(multiPricFeed);
        return address(multiPricFeed);
    }

    /**
     * @notice answer from the most recent report of a certain price pair
     * @param _id Keccak256 hash of the price pair string we wanna query
     */
    function multiPriceFeedValueFor(uint256 _FluxMultiPriceFeedIndex, bytes32 _id) public
        returns (
            int256,
            uint256,
            uint256
        )
    {
        return FluxMultiPriceFeed(address(FluxMultiPriceFeedsArray[_FluxMultiPriceFeedIndex])).valueFor(_id);
      
    }
 


    function multiPriceFeedTransmit(uint256 _FluxMultiPriceFeedIndex, 
        bytes32[] calldata _pricePairs, int256[] calldata _answers) public onlyRole(VALIDATOR_ROLE)
    {
        FluxMultiPriceFeed(address(FluxMultiPriceFeedsArray[_FluxMultiPriceFeedIndex])).transmit(_pricePairs, _answers);

    }





























    

}
