// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./interface/CLV2V3Interface.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title Flux first-party price feed oracle time-based aggregator
 * @author fluxprotocol.org
 * @notice Aggregates from multiple first-party price oracles (FluxPriceFeed.sol), compatible with
 *     Chainlink V2 and V3 aggregator interface
 */
contract FluxTimeBasedAggregator is AccessControl, CLV2V3Interface, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    uint32 public latestAggregatorRoundId;

    // Transmission records the answer from the transmit transaction at
    // time timestamp
    struct Transmission {
        int192 answer; // 192 bits ought to be enough for anyone
        uint64 timestamp;
    }
    mapping(uint32 => Transmission) /* aggregator round ID */
        internal transmissions;

    uint256 public minDelay = 1 minutes;
    uint256 public constant DEFAULT_TIMEOUT = 10 minutes;
    address public immutable FLUX_PRICE_FEED;
    address public immutable AMBERDATA_PRICE_FEED;

    /**
     * @dev Initialize oracles and fetch initial prices
     * @param _admin the initial admin that can aggregate data from and set the oracles
     * @param _amberdataPriceFeed AMBERDATA price feed oracle address
     * @param _fluxPriceFeed FLUX price feed oracle address
     * @param _decimals answers are stored in fixed-point format, with this many digits of precision
     * @param __description short human-readable description of observable this contract's answers pertain to
     */

    constructor(
        address _admin,
        address _amberdataPriceFeed,
        address _fluxPriceFeed,
        uint8 _decimals,
        string memory __description
    ) {
        _setupRole(ADMIN_ROLE, _admin);
        FLUX_PRICE_FEED = _fluxPriceFeed;
        AMBERDATA_PRICE_FEED = _amberdataPriceFeed;
        decimals = _decimals;
        _description = __description;
    }

    /*
     * Versioning
     */
    function typeAndVersion() external pure virtual returns (string memory) {
        return "FluxTimeBasedAggregator 1.0.0";
    }

    function updatePrices() public whenNotPaused {
        // require min delay since lastUpdate
        require(block.timestamp > transmissions[latestAggregatorRoundId].timestamp + minDelay, "Delay required");

        int256 flux_answer = int256(CLV2V3Interface(FLUX_PRICE_FEED).latestAnswer());
        int256 amberdata_answer = int256(CLV2V3Interface(AMBERDATA_PRICE_FEED).latestAnswer());
        int192 _answer = int192((flux_answer + amberdata_answer) / 2);

        // update round
        latestAggregatorRoundId++;
        transmissions[latestAggregatorRoundId] = Transmission(_answer, uint64(block.timestamp));

        emit AnswerUpdated(_answer, latestAggregatorRoundId, block.timestamp);
    }

    function latestAnswer(uint256 _timeout) public view returns (int256) {
        uint256 amberdata_latest_timestamp = uint256(CLV2V3Interface(AMBERDATA_PRICE_FEED).latestTimestamp());
        if (block.timestamp < amberdata_latest_timestamp + _timeout) {
            return int256(CLV2V3Interface(AMBERDATA_PRICE_FEED).latestAnswer());
        } else {
            return int256(CLV2V3Interface(FLUX_PRICE_FEED).latestAnswer());
        }
    }

    /*
     * Admin-only functions
     */

    /// @notice Pauses or unpauses updating the price, only callable by admin
    function pause(bool __pause) public {
        require(hasRole(ADMIN_ROLE, msg.sender), "Caller is not a admin");
        if (__pause) {
            _pause();
        } else {
            _unpause();
        }
    }

    /// @notice Overrides the price, only callable by admin
    function setManualAnswer(int192 _answer) public {
        require(hasRole(ADMIN_ROLE, msg.sender), "Caller is not a admin");
        latestAggregatorRoundId++;
        transmissions[latestAggregatorRoundId] = Transmission(_answer, uint64(block.timestamp));
        emit AnswerUpdated(_answer, latestAggregatorRoundId, block.timestamp);
    }

    /*
     * v2 Aggregator interface
     */

    /**
     * @notice answer from the most recent report
     */
    function latestAnswer() public view virtual override returns (int256) {
        // return transmissions[latestAggregatorRoundId].answer;
        uint256 amberdata_latest_timestamp = uint256(CLV2V3Interface(AMBERDATA_PRICE_FEED).latestTimestamp());
        if (block.timestamp < amberdata_latest_timestamp + DEFAULT_TIMEOUT) {
            return int256(CLV2V3Interface(AMBERDATA_PRICE_FEED).latestAnswer());
        } else {
            return int256(CLV2V3Interface(FLUX_PRICE_FEED).latestAnswer());
        }
    }

    /**
     * @notice timestamp of block in which last report was transmitted
     */
    function latestTimestamp() public view virtual override returns (uint256) {
        return transmissions[latestAggregatorRoundId].timestamp;
    }

    /**
     * @notice Aggregator round in which last report was transmitted
     */
    function latestRound() public view virtual override returns (uint256) {
        return latestAggregatorRoundId;
    }

    /**
     * @notice answer of report from given aggregator round
     * @param _roundId the aggregator round of the target report
     */
    function getAnswer(uint256 _roundId) public view virtual override returns (int256) {
        if (_roundId > 0xFFFFFFFF) {
            return 0;
        }
        return transmissions[uint32(_roundId)].answer;
    }

    /**
     * @notice timestamp of block in which report from given aggregator round was transmitted
     * @param _roundId aggregator round of target report
     */
    function getTimestamp(uint256 _roundId) public view virtual override returns (uint256) {
        if (_roundId > 0xFFFFFFFF) {
            return 0;
        }
        return transmissions[uint32(_roundId)].timestamp;
    }

    /*
     * v3 Aggregator interface
     */

    string private constant V3_NO_DATA_ERROR = "No data present";

    /**
     * @return answers are stored in fixed-point format, with this many digits of precision
     */
    uint8 public immutable override decimals;

    /**
     * @notice aggregator contract version
     */
    uint256 public constant override version = 1;

    string internal _description;

    /**
     * @notice human-readable description of observable this contract is reporting on
     */
    function description() public view virtual override returns (string memory) {
        return _description;
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
        require(_roundId <= 0xFFFFFFFF, V3_NO_DATA_ERROR);
        Transmission memory transmission = transmissions[uint32(_roundId)];
        return (_roundId, transmission.answer, transmission.timestamp, transmission.timestamp, _roundId);
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
        roundId = latestAggregatorRoundId;

        // Skipped for compatability with existing FluxAggregator in which latestRoundData never reverts.
        // require(roundId != 0, V3_NO_DATA_ERROR);

        Transmission memory transmission = transmissions[uint32(roundId)];
        return (roundId, transmission.answer, transmission.timestamp, transmission.timestamp, roundId);
    }
}
