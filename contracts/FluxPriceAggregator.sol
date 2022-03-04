// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./interface/CLV2V3Interface.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title Flux first-party price feed oracle aggregator
 * @author fluxprotocol.org
 * @notice Aggregates from multiple first-party price oracles (FluxPriceFeed.sol), compatible with
 *     Chainlink V2 and V3 aggregator interface
 */
contract FluxPriceAggregator is AccessControl, CLV2V3Interface, Pausable {
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
    address[] public oracles;

    /**
     * @dev Initialize oracles and fetch initial prices
     * @param _admin the initial admin that can aggregate data from and set the oracles
     * @param _oracles the oracles to aggregate data from
     * @param _decimals answers are stored in fixed-point format, with this many digits of precision
     * @param __description short human-readable description of observable this contract's answers pertain to
     */

    constructor(
        address _admin,
        address[] memory _oracles,
        uint8 _decimals,
        string memory __description
    ) {
        _setupRole(ADMIN_ROLE, _admin);
        oracles = _oracles;
        decimals = _decimals;
        _description = __description;
    }

    /*
     * Versioning
     */
    function typeAndVersion() external pure virtual returns (string memory) {
        return "FluxPriceAggregator 1.0.0";
    }

    /*
     * Publicly-callable mutative functions
     */

    /// @notice Update prices, callable by anyone, slower but less gas
    function updatePricesUsingQuickSort() public whenNotPaused {
        // require min delay since lastUpdate
        require(block.timestamp > transmissions[latestAggregatorRoundId].timestamp + minDelay, "Delay required");

        int192[] memory oraclesLatestAnswers = new int192[](oracles.length);

        // Aggregate prices from oracles
        for (uint256 i = 0; i < oracles.length; i++) {
            oraclesLatestAnswers[i] = int192(CLV2V3Interface(oracles[i]).latestAnswer());
        }
        int192 _answer = findMedianUsingQuickSort(oraclesLatestAnswers, 0, (oraclesLatestAnswers.length - 1));

        // update round
        latestAggregatorRoundId++;
        transmissions[latestAggregatorRoundId] = Transmission(_answer, uint64(block.timestamp));

        emit AnswerUpdated(_answer, latestAggregatorRoundId, block.timestamp);
    }

    /// @notice Update prices, callable by anyone, faster but more gas
    function updatePricesUsingMedianOfMedians() public whenNotPaused {
        // require min delay since lastUpdate
        require(block.timestamp > transmissions[latestAggregatorRoundId].timestamp + minDelay, "Delay required");

        int192[] memory oraclesLatestAnswers = new int192[](oracles.length);
        for (uint256 i = 0; i < oracles.length; i++) {
            oraclesLatestAnswers[i] = int192(CLV2V3Interface(oracles[i]).latestAnswer());
        }
        int192 _answer = findMedianUsingMedianOfMedians(
            oraclesLatestAnswers,
            0,
            oraclesLatestAnswers.length - 1,
            ((oraclesLatestAnswers.length / 2) + 1)
        );

        // update round
        latestAggregatorRoundId++;
        transmissions[latestAggregatorRoundId] = Transmission(_answer, uint64(block.timestamp));

        emit AnswerUpdated(_answer, latestAggregatorRoundId, block.timestamp);
    }

    /// @notice Returns k'th smallest element in arr[left..right] in worst case linear time.
    /// ASSUMPTION: ALL ELEMENTS IN ARR[] ARE DISTINCT
    /// @param k = ((arr.length/2) - 1 )
    function findMedianUsingMedianOfMedians(
        int192[] memory arr,
        uint256 left,
        uint256 right,
        uint256 k
    ) public view returns (int192) {
        // If k is smaller than the number of elements in array
        if (k > 0 && k <= right - left + 1) {
            uint256 n = right - left + 1; // Number of elements in arr[left..right]
            // Divide arr[] in groups of size 5,
            // calculate median of every group
            // and store it in median[] array.
            uint256 i;

            // There will be floor((n+4)/5) groups;
            int192[] memory median = new int192[](((n + 4) / 5));
            for (i = 0; i < n / 5; i++) {
                median[i] = findMedianUsingQuickSort(arr, (left + i * 5), 5);
            }

            // For last group with less than 5 elements
            if (i * 5 < n) {
                median[i] = findMedianUsingQuickSort(arr, (left + i * 5), ((left + i * 5) + (n % 5) - 1));
                i++;
            }

            // Find median of all medians using recursive call.
            // If median[] has only one element, then no need
            // of recursive call
            int192 medOfMed = (i == 1) ? median[i - 1] : findMedianUsingMedianOfMedians(median, 0, i - 1, (i / 2));

            // Partition the array around a random element and
            // get position of pivot element in sorted array
            uint256 pos = partition(arr, left, right, medOfMed);

            // If position is same as k
            if (pos - left == k - 1) return arr[pos];
            if (pos - left > k - 1)
                // If position is more, recur for left
                return findMedianUsingMedianOfMedians(arr, left, pos - 1, k);

            // Else recurse for right subarray
            return findMedianUsingMedianOfMedians(arr, pos + 1, right, k - pos + left - 1);
        } else {
            revert("Wrong k value");
        }
    }

    /// @notice Swaps arrays vars
    function swap(
        int192[] memory array,
        uint256 i,
        uint256 j
    ) internal pure {
        (array[i], array[j]) = (array[j], array[i]);
    }

    /// @notice It searches for x in arr[left..right], and partitions the array around x.
    function partition(
        int192[] memory arr,
        uint256 left,
        uint256 right,
        int192 x
    ) internal pure returns (uint256) {
        // Search for x in arr[left..right] and move it to end
        uint256 i;
        for (i = left; i < right; i++) {
            if (arr[i] == x) {
                break;
            }
        }

        swap(arr, i, right);

        // Standard partition algorithm
        i = left;
        for (uint256 j = left; j <= right - 1; j++) {
            if (arr[j] <= x) {
                swap(arr, i, j);
                i++;
            }
        }
        swap(arr, i, right);
        return i;
    }

    /// @notice Quick sort then returns middles element
    function findMedianUsingQuickSort(
        int192[] memory arr,
        uint256 i,
        uint256 n
    ) internal view returns (int192) {
        if (i <= n) {
            uint256 length = (n - i) + 1;

            int192 median;
            quickSort(arr, i, n);

            if (length % 2 == 0) {
                median = ((arr[(length / 2) - 1] + arr[length / 2]) / 2);
            } else {
                median = arr[length / 2];
            }
            return median;
        } else {
            revert("Error in findMedianUsingQuickSort");
        }
    }

    function quickSort(
        int192[] memory arr,
        uint256 left,
        uint256 right
    ) internal view {
        uint256 i = left;
        uint256 j = right;
        if (i == j) return;
        int192 pivot = arr[uint256(left + (right - left) / 2)];
        while (i <= j) {
            while (arr[uint256(i)] < pivot) i++;

            while (pivot < arr[uint256(j)]) j--;
            if (i <= j) {
                (arr[uint256(i)], arr[uint256(j)]) = (arr[uint256(j)], arr[uint256(i)]);
                i++;
                j--;
            }
        }

        if (left < j) quickSort(arr, left, j);
        if (i < right) quickSort(arr, i, right);
    }

    /*
     * Admin-only functions
     */

    /// @notice Changes min delay, only callable by admin
    function setDelay(uint256 _minDelay) public {
        require(hasRole(ADMIN_ROLE, msg.sender), "Caller is not a admin");
        minDelay = _minDelay;
    }

    /// @notice Changes oracles, only callable by admin
    function setOracles(address[] memory _oracles) public {
        require(hasRole(ADMIN_ROLE, msg.sender), "Caller is not a admin");
        oracles = _oracles;
    }

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
        return transmissions[latestAggregatorRoundId].answer;
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
