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

    // array of price pairs in bytes ex: 0xdfaa6f747f0f012e8f2069d6ecacff25f5cdf0258702051747439949737fc0b5
    bytes32[] public PricePairsIds; 

    // array of price pairs in strings ex: Price-ETH/USD-3
    string[] public PricePairsStrings; 

    // array of created oracles addresses
    address[] public PriceFeedsAddresses; 

    // id -> oracle
    mapping(bytes32 => FluxPriceFeed) public FluxPriceFeedsMapping;

    // id -> price details
    mapping(bytes32 => PricePair) public PricePairsMapping; 

    
    struct PricePair {
        int256 price;
        uint256 timestamp;
    }
    
    constructor(address _validator) {
        _setupRole(VALIDATOR_ROLE, _validator);
    }

     

   
    
   

    /// @notice create new priceFeed
    ///@param _description Price-ETH/USD-3
    function CreateNewPriceFeed(address _validator, uint8 _decimals, string memory _description) 
        public returns (address)
    {
        FluxPriceFeed priceFeed = new FluxPriceFeed(_validator, _decimals, _description);
        // FluxPriceFeedsArray.push(priceFeed);
        bytes32 _id = keccak256(abi.encodePacked(_description));
        PricePairsIds.push(_id);
        FluxPriceFeedsMapping[_id] = priceFeed;
        PriceFeedsAddresses.push(address(priceFeed));
        return address(priceFeed);

    }

     /**
     * @notice transmit is called to post a new report to the contract
     * @param _answer latest answer
     */
    function priceFeedTransmit(string memory _description, int192 _answer) public onlyRole(VALIDATOR_ROLE){
        FluxPriceFeed(address(FluxPriceFeedsMapping[keccak256(abi.encodePacked(_description))])).transmit(_answer);

    }

    /**
     * @notice answer from the most recent report
     */
    function priceFeedLatestAnswer(string memory _description) public view returns (int256) {
        return FluxPriceFeed(address(FluxPriceFeedsMapping[keccak256(abi.encodePacked(_description))])).latestAnswer();

    }

    

     /**
     * @notice transmit is called to post a new value to the contract price pairs and to the created oracles(price feeds)
     * @param _pricePairs array of price pairs strings we wanna post values for
     * @param _answers array of prices we wanna post

     */
    function transmit(string[] calldata _pricePairs, int192[] calldata _answers) external onlyRole(VALIDATOR_ROLE) {
        require(_answers.length == _pricePairs.length, "The transmitted arrays must be equal");
        
        
        for (uint256 i = 0; i < _pricePairs.length; i++) {
            bool exists = false;

            bytes32 id = keccak256(abi.encodePacked(_pricePairs[i]));


            // Check if that id already exists
            for(uint256 j = 0; j < PricePairsIds.length; j++){
                if(PricePairsIds[i] == id){
                    exists = true;
                    break;
                }
            }
            // If it doesn't, create a new oracle (aka a new price feed) 
            if(!exists){
                PricePairsStrings.push(_pricePairs[i]);
                PricePairsIds.push(id);
                bytes memory strBytes = bytes(_pricePairs[i]);

                // Price-ETH/USD-3 (last byte is the decimal used)
                bytes1 decimals = strBytes[strBytes.length - 1]; 
                CreateNewPriceFeed(msg.sender,  uint8(decimals), _pricePairs[i]);

            }
            
            // Then update this contract's price pairs
            FluxPriceFeed(address(FluxPriceFeedsMapping[id])).transmit(_answers[i]);
            PricePairsMapping[id].price = _answers[i];
            PricePairsMapping[id].timestamp = block.timestamp;
        }
    }

    /**
     * @notice answer from the most recent report of a certain price pair from factory
     * @param _id hash of the price pair string we wanna query
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
        if (PricePairsMapping[_id].timestamp <= 0) return (0, 0, 404);

        return (PricePairsMapping[_id].price, PricePairsMapping[_id].timestamp, 200);
    }


     /**
     * @notice answer from the most recent report of a certain price pair from depoyed oracle
     * @param _description the price pair string we wanna query
     */
    function fetchValueFromPriceFeedOracle(string memory _description) public view returns (int256){
       return FluxPriceFeed(address(FluxPriceFeedsMapping[keccak256(abi.encodePacked(_description))])).latestAnswer();
    }




    function listPricePairsIds() public view returns(bytes32[] memory){
        return PricePairsIds;
        
    }
    function listPricePairsStrings() public view returns(string[] memory){
        return PricePairsStrings;
        
    }

    function listPriceFeedsAddresses() public view returns(address[] memory){
        return PriceFeedsAddresses;
    }

  


}
