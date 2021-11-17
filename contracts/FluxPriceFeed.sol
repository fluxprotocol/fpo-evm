// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
  * @notice Onchain verification of reports from the offchain reporting protocol

  * @dev For details on its operation, see the offchain reporting protocol design
  * @dev doc, which refers to this contract as simply the "contract".
*/
contract FluxPriceFeed is AccessControl {
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");
    uint256 private constant maxUint32 = (1 << 32) - 1;

    // Storing these fields used on the hot path in a HotVars variable reduces the
    // retrieval of all of them to a single SLOAD. If any further fields are
    // added, make sure that storage of the struct still takes at most 32 bytes.
    struct HotVars {
        // Provides 128 bits of security against 2nd pre-image attacks, but only
        // 64 bits against collisions. This is acceptable, since a malicious owner has
        // easier way of messing up the protocol than to find hash collisions.
        bytes16 latestConfigDigest;
        uint40 latestEpochAndRound; // 32 most sig bits for epoch, 8 least sig bits for round
        // Current bound assumed on number of faulty/dishonest oracles participating
        // in the protocol, this value is referred to as f in the design
        uint8 threshold;
        // Chainlink Aggregators expose a roundId to consumers. The offchain reporting
        // protocol does not use this id anywhere. We increment it whenever a new
        // transmission is made to provide callers with contiguous ids for successive
        // reports.
        uint32 latestAggregatorRoundId;
    }
    HotVars internal s_hotVars;

    // Transmission records the median answer from the transmit transaction at
    // time timestamp
    struct Transmission {
        int192 answer; // 192 bits ought to be enough for anyone
        uint64 timestamp;
    }
    mapping(uint32 => Transmission) /* aggregator round ID */
        internal s_transmissions;

    /*
     * @param _decimals answers are stored in fixed-point format, with this many digits of precision
     * @param _description short human-readable description of observable this contract's answers pertain to
     */
    constructor(
        address _validator,
        uint8 _decimals,
        string memory _description
    ) {
        _setupRole(VALIDATOR_ROLE, _validator);
        decimals = _decimals;
        s_description = _description;
    }

    /*
     * Versioning
     */
    function typeAndVersion() external pure virtual returns (string memory) {
        return "FluxPriceFeed 1.0.0";
    }

    /*
     * Transmission logic
     */

    /**
     * @notice indicates that a new report was transmitted
     * @param aggregatorRoundId the round to which this report was assigned
     * @param answer median of the observations attached this report
     * @param transmitter address from which the report was transmitted
     */
    event NewTransmission(uint32 indexed aggregatorRoundId, int192 answer, address transmitter);

    // Used to relieve stack pressure in transmit
    struct ReportData {
        HotVars hotVars; // Only read from storage once
        bytes observers; // ith element is the index of the ith observer
        int192[] observations; // ith element is the ith observation
        bytes vs; // jth element is the v component of the jth signature
        bytes32 rawReportContext;
    }

    /*
   * @notice details about the most recent report

   * @return configDigest domain separation tag for the latest report
   * @return epoch epoch in which the latest report was generated
   * @return round OCR round in which the latest report was generated
   * @return latestAnswer median value from latest report
   * @return latestTimestamp when the latest report was transmitted
   */
    function latestTransmissionDetails()
        external
        view
        returns (
            bytes16 configDigest,
            uint32 epoch,
            uint8 round,
            int192 _latestAnswer,
            uint64 _latestTimestamp
        )
    {
        require(msg.sender == tx.origin, "Only callable by EOA");
        return (
            s_hotVars.latestConfigDigest,
            uint32(s_hotVars.latestEpochAndRound >> 8),
            uint8(s_hotVars.latestEpochAndRound),
            s_transmissions[s_hotVars.latestAggregatorRoundId].answer,
            s_transmissions[s_hotVars.latestAggregatorRoundId].timestamp
        );
    }

    /**
     * @notice transmit is called to post a new report to the contract
     * @param _answer latest answer
     */
    function transmit(int192 _answer) external {
        require(hasRole(VALIDATOR_ROLE, msg.sender), "Caller is not a validator");

        ReportData memory r;
        r.hotVars = s_hotVars;
        {
            // Check the report contents, and record the result
            r.hotVars.latestAggregatorRoundId++;
            s_transmissions[r.hotVars.latestAggregatorRoundId] = Transmission(_answer, uint64(block.timestamp));

            emit NewTransmission(r.hotVars.latestAggregatorRoundId, _answer, msg.sender);
        }
        s_hotVars = r.hotVars;
    }

    /*
     * v2 Aggregator interface
     */

    /**
     * @notice median from the most recent report
     */
    function latestAnswer() public view virtual returns (int256) {
        return s_transmissions[s_hotVars.latestAggregatorRoundId].answer;
    }

    /**
     * @notice timestamp of block in which last report was transmitted
     */
    function latestTimestamp() public view virtual returns (uint256) {
        return s_transmissions[s_hotVars.latestAggregatorRoundId].timestamp;
    }

    /**
     * @notice Aggregator round (NOT OCR round) in which last report was transmitted
     */
    function latestRound() public view virtual returns (uint256) {
        return s_hotVars.latestAggregatorRoundId;
    }

    /**
     * @notice median of report from given aggregator round (NOT OCR round)
     * @param _roundId the aggregator round of the target report
     */
    function getAnswer(uint256 _roundId) public view virtual returns (int256) {
        if (_roundId > 0xFFFFFFFF) {
            return 0;
        }
        return s_transmissions[uint32(_roundId)].answer;
    }

    /**
     * @notice timestamp of block in which report from given aggregator round was transmitted
     * @param _roundId aggregator round (NOT OCR round) of target report
     */
    function getTimestamp(uint256 _roundId) public view virtual returns (uint256) {
        if (_roundId > 0xFFFFFFFF) {
            return 0;
        }
        return s_transmissions[uint32(_roundId)].timestamp;
    }

    /*
     * v3 Aggregator interface
     */

    string private constant V3_NO_DATA_ERROR = "No data present";

    /**
     * @return answers are stored in fixed-point format, with this many digits of precision
     */
    uint8 public immutable decimals;

    /**
     * @notice aggregator contract version
     */
    uint256 public constant version = 1;

    string internal s_description;

    /**
     * @notice human-readable description of observable this contract is reporting on
     */
    function description() public view virtual returns (string memory) {
        return s_description;
    }

    /**
     * @notice details for the given aggregator round
     * @param _roundId target aggregator round (NOT OCR round). Must fit in uint32
     * @return roundId _roundId
     * @return answer median of report from given _roundId
     * @return startedAt timestamp of block in which report from given _roundId was transmitted
     * @return updatedAt timestamp of block in which report from given _roundId was transmitted
     * @return answeredInRound _roundId
     */
    function getRoundData(uint80 _roundId)
        public
        view
        virtual
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        require(_roundId <= 0xFFFFFFFF, V3_NO_DATA_ERROR);
        Transmission memory transmission = s_transmissions[uint32(_roundId)];
        return (_roundId, transmission.answer, transmission.timestamp, transmission.timestamp, _roundId);
    }

    /**
     * @notice aggregator details for the most recently transmitted report
     * @return roundId aggregator round of latest report (NOT OCR round)
     * @return answer median of latest report
     * @return startedAt timestamp of block containing latest report
     * @return updatedAt timestamp of block containing latest report
     * @return answeredInRound aggregator round of latest report
     */
    function latestRoundData()
        public
        view
        virtual
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        roundId = s_hotVars.latestAggregatorRoundId;

        // Skipped for compatability with existing FluxAggregator in which latestRoundData never reverts.
        // require(roundId != 0, V3_NO_DATA_ERROR);

        Transmission memory transmission = s_transmissions[uint32(roundId)];
        return (roundId, transmission.answer, transmission.timestamp, transmission.timestamp, roundId);
    }
}
