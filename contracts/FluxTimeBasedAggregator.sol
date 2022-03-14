// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./interface/CLV2V3Interface.sol";

/**
 * @title Flux first-party price feed oracle time-based aggregator
 * @author fluxprotocol.org
 * @notice Aggregates from multiple first-party price oracles (FluxPriceFeed.sol), compatible with
 *     Chainlink V2 and V3 aggregator interface
 */
contract FluxTimeBasedAggregator is CLV2V3Interface {
    uint256 public constant DEFAULT_TIMEOUT = 10 minutes;

    address public immutable PRIMARY_PRICE_FEED;
    address public immutable SECONDARY_PRICE_FEED;

    uint8 public immutable override decimals;
    uint256 public constant override version = 1;
    string internal _description;

    /**
     * @dev Initialize oracles and fetch initial prices
     * @param _primaryPriceFeed Primary price feed oracle address
     * @param _secondaryPriceFeed Secondary price feed oracle address if primary is out of date
     * @param _decimals answers are stored in fixed-point format, with this many digits of precision
     * @param __description short human-readable description of observable this contract's answers pertain to
     */

    constructor(
        address _primaryPriceFeed,
        address _secondaryPriceFeed,
        uint8 _decimals,
        string memory __description
    ) {
        SECONDARY_PRICE_FEED = _secondaryPriceFeed;
        PRIMARY_PRICE_FEED = _primaryPriceFeed;
        decimals = _decimals;
        _description = __description;
    }

    function _getPriceFeed(uint256 timeout) internal view returns (CLV2V3Interface) {
        uint256 primaryLatestTimestamp = uint256(CLV2V3Interface(PRIMARY_PRICE_FEED).latestTimestamp());
        if (block.timestamp < primaryLatestTimestamp + timeout) {
            return CLV2V3Interface(PRIMARY_PRICE_FEED);
        } else {
            return CLV2V3Interface(SECONDARY_PRICE_FEED);
        }
    }

    /// @notice answer from the most recent report
    /// @dev CL v2 Aggregator interface
    function latestAnswer() public view virtual override returns (int256) {
        CLV2V3Interface priceFeed = _getPriceFeed(DEFAULT_TIMEOUT);
        return priceFeed.latestAnswer();
    }

    /// @notice non-standard function to specify a timeout other than DEFAULT_TIMEOUT
    function latestAnswer(uint256 _timeout) public view returns (int256) {
        CLV2V3Interface priceFeed = _getPriceFeed(_timeout);
        return priceFeed.latestAnswer();
    }

    /**
     * @notice details for the given aggregator round
     * @param _roundId target aggregator round. Must fit in uint32
     * @return roundId _roundId
     * @return answer answer of report from given _roundId
     * @return startedAt timestamp of block in which report from given _roundId was transmitted
     * @return updatedAt timestamp of block in which report from given _roundId was transmitted
     * @return answeredInRound _roundId
     */
    function getRoundData(uint80 _roundId)
        public
        view
        virtual
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        CLV2V3Interface priceFeed = _getPriceFeed(DEFAULT_TIMEOUT);
        return priceFeed.getRoundData(_roundId);
    }

    /**
     * @notice timestamp of block in which report from given aggregator round was transmitted
     * @param _roundId aggregator round of target report
     */
    function getTimestamp(uint256 _roundId) public view virtual override returns (uint256) {
        CLV2V3Interface priceFeed = _getPriceFeed(DEFAULT_TIMEOUT);
        return priceFeed.getTimestamp(_roundId);
    }

    /**
     * @notice Aggregator round in which last report was transmitted
     */
    function latestRound() public view virtual override returns (uint256) {
        CLV2V3Interface priceFeed = _getPriceFeed(DEFAULT_TIMEOUT);
        return priceFeed.latestRound();
    }

    /**
     * @notice aggregator details for the most recently transmitted report
     * @return roundId aggregator round of latest report
     * @return answer answer of latest report
     * @return startedAt timestamp of block containing latest report
     * @return updatedAt timestamp of block containing latest report
     * @return answeredInRound aggregator round of latest report
     */
    function latestRoundData()
        public
        view
        virtual
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        CLV2V3Interface priceFeed = _getPriceFeed(DEFAULT_TIMEOUT);
        return priceFeed.latestRoundData();
    }

    /**
     * @notice answer of report from given aggregator round
     * @param _roundId the aggregator round of the target report
     */
    function getAnswer(uint256 _roundId) public view virtual override returns (int256) {
        CLV2V3Interface priceFeed = _getPriceFeed(DEFAULT_TIMEOUT);
        return priceFeed.getAnswer(_roundId);
    }

    /**
     * @notice timestamp of block in which last report was transmitted
     */
    function latestTimestamp() public view virtual override returns (uint256) {
        CLV2V3Interface priceFeed = _getPriceFeed(DEFAULT_TIMEOUT);
        return priceFeed.latestTimestamp();
    }

    /**
     * @notice human-readable description of observable this contract is reporting on
     */
    function description() public view virtual override returns (string memory) {
        return _description;
    }

    /*
     * Versioning
     */
    function typeAndVersion() external pure virtual returns (string memory) {
        return "FluxTimeBasedAggregator 1.0.0";
    }
}
