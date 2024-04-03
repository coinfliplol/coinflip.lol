// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract OKLottery is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    IERC20 public okToken;
    uint256 public ticketPrice = 1 ether; // 1 OK Token (18 decimal places)
    uint256 public cooldownDuration = 15 minutes;
    uint256 public lotteryDuration = 5 minutes;
    uint256 public nextLotteryStartTime = block.timestamp + cooldownDuration;
    uint256 public lotteryEndTime;
    uint256 public ticketLimitPerUser = type(uint256).max; // Initially set to type(uint256).max to allow unlimited tickets
    // State variables for the last winner
    address public lastWinner;
    uint256 public lastWinnerPrize;
    bool public lotteryActive = false;

    // Prize distribution percentages for multiple winners mode
    uint256 public firstPlacePercentage = 60; // Default to 60%
    uint256 public secondPlacePercentage = 25; // Default to 25%
    uint256 public thirdPlacePercentage = 15; // Default to 15%

    address[] public participants;
    uint256 public totalTicketsSold;

    // New variables
    uint256 public enderRewardPercentage = 1; // Default to 1%
    uint256 public nextLotteryReservePercentage = 5; // Default to 5%
    uint256 public feeTakerFeePercentage = 0; // Default to 0%
    uint256 public feeTaker2FeePercentage = 0; // Initially 0%
    uint256 public lotteryCount;
    address public feeTaker;
    address public feeTaker2;
    enum LotteryMode { SingleWinner, MultipleWinners }

    mapping(address => uint256) public userTicketsCount;
    mapping(address => uint256) public userPaidAmount; // Total paid amount per user
    address[] public participantsForRefund; // Separate array for refunds to allow batch processing
    bool public emergencyRefundIsActive = false; // Emergency refund flag
    mapping(address => bool) private addedToRefundList; // Keep track of whether a participant has been added to the refund list
    mapping(address => bool) private isParticipant; // participants
    mapping(address => bool) public allowedContracts; // allowed contracts to interact list

    event LotteryStarted(uint256 startTime, uint256 endTime);
    event LotteryEnded(address indexed winner, uint256 prizeAmount, uint256 enderReward);
    event TicketsBought(address indexed buyer, uint256 numberOfTickets);
    event LotteryCooldownStarted(uint256 startTime);
    event FeeTakerUpdated(address feeTaker, address feeTaker2);
    event FeePercentageUpdated(uint256 feeTakerFeePercentage, uint256 feeTaker2FeePercentage, uint256 enderRewardPercentage, uint256 nextLotteryReservePercentage);
    event LotteryParametersUpdated(uint256 cooldownDuration, uint256 lotteryDuration);
    event TokenChanged(address indexed newTokenAddress);
    event LotteryEndedByUser(address user, string message);
    event LotteryCheckFailed(address user, string message);
    event LotteryEndedMultiple(
    address indexed firstWinner,
    address indexed secondWinner,
    address indexed thirdWinner,
    uint256 firstPrize,
    uint256 secondPrize,
    uint256 thirdPrize,
    uint256 enderReward
    );

    constructor(address _okTokenAddress) Ownable(msg.sender) {
        require(_okTokenAddress != address(0), "Token address cannot be zero.");
        okToken = IERC20(_okTokenAddress);
    }

    /**
     * Prevents call from contracts to mitigate potential manipulation.
     */
    modifier onlyEOAOrAllowedContracts() {
        require(
            msg.sender == tx.origin || allowedContracts[msg.sender],
            "Caller must be EOA or allowed contract"
        );
        _;
    }

    function allowContract(address _contract, bool _status) external onlyOwner {
        allowedContracts[_contract] = _status;
    }

    LotteryMode public currentLotteryMode = LotteryMode.SingleWinner;

    function buyTickets(uint256 _numberOfTickets) public nonReentrant onlyEOAOrAllowedContracts {
        // Check if the lottery is not active and if the current time is beyond the cooldown period
        if (!lotteryActive && block.timestamp >= nextLotteryStartTime) {
            startLottery(); // Start the lottery if conditions are met
        }

        require(lotteryActive, "Lottery not active."); // Ensure the lottery is now active
        require(block.timestamp < lotteryEndTime, "Lottery has ended.");
        require(_numberOfTickets > 0, "Cannot buy zero tickets.");
        require(userTicketsCount[msg.sender] + _numberOfTickets <= ticketLimitPerUser, "Exceeds ticket limit per user.");

        uint256 totalCost = ticketPrice * _numberOfTickets;
        userPaidAmount[msg.sender] += totalCost; // Update the total amount paid

        // Ensure tokens are transferred from the user to the contract
        okToken.safeTransferFrom(msg.sender, address(this), totalCost);

        // Add user to participants list only if they haven't been added before
        if (!isParticipant[msg.sender]) {
            participants.push(msg.sender);
            isParticipant[msg.sender] = true;
        }

        userTicketsCount[msg.sender] += _numberOfTickets; // Update the number of tickets
        totalTicketsSold += _numberOfTickets;

        // Add to participantsForRefund if not already added
        if (!addedToRefundList[msg.sender]) {
            participantsForRefund.push(msg.sender);
            addedToRefundList[msg.sender] = true;
        }

        // Emit an event for the ticket purchase
        emit TicketsBought(msg.sender, _numberOfTickets);
    }

    function startLottery() internal {
        require(!lotteryActive, "Lottery already active.");
        lotteryActive = true;
        lotteryEndTime = block.timestamp + lotteryDuration; // Set end time based on current time + duration
        nextLotteryStartTime = lotteryEndTime + cooldownDuration; // Schedule next lottery start time after this lottery ends plus the cooldown duration
        emit LotteryStarted(block.timestamp, lotteryEndTime);
    }

    function automatedLotteryCheck() public nonReentrant {
        if (lotteryActive && block.timestamp >= lotteryEndTime) {
            endLottery(); // This ends the lottery and handles reward distribution
        
            // Emit an event indicating the lottery was ended by the user.
            emit LotteryEndedByUser(msg.sender, "Congratulations! You ended the Lottery, you earn 1% of the winner's prize! Thanks!");
        } else {
            // Emit an event indicating it's too early to end the lottery.
            emit LotteryCheckFailed(msg.sender, "It's not time yet to finish the Lottery, check back later, watch the timer.");
        }
    }

    function endLottery() internal {
        require(lotteryActive, "Lottery not active.");
        require(block.timestamp >= lotteryEndTime, "Lottery period not over.");
        
        uint256 prizePool = okToken.balanceOf(address(this));
        uint256 reservedForNextLottery = (prizePool * nextLotteryReservePercentage) / 100;
        uint256 adjustedPrizePool = prizePool - reservedForNextLottery;
        uint256 enderReward = (adjustedPrizePool * enderRewardPercentage) / 100;
        uint256 feeTakerFee = (adjustedPrizePool * feeTakerFeePercentage) / 100;
        uint256 feeTaker2Fee = (adjustedPrizePool * feeTaker2FeePercentage) / 100;
        // Adjust other calculations to deduct the reserved amount
        uint256 winnerPrize = adjustedPrizePool - enderReward - feeTakerFee - feeTaker2Fee;


        // Transfer fees and rewards using SafeERC20
        if(feeTaker != address(0) && feeTakerFee > 0) {
            okToken.safeTransfer(feeTaker, feeTakerFee);
        }
        if(feeTaker2 != address(0) && feeTaker2Fee > 0) {
            okToken.safeTransfer(feeTaker2, feeTaker2Fee);
        }
        // Reward the ender of the lottery
        okToken.safeTransfer(msg.sender, enderReward);

        if (currentLotteryMode == LotteryMode.SingleWinner) {
            // Select and reward the winner
            address winner = selectWinner(winnerPrize, enderReward);
            // Emit event with all details
            emit LotteryEnded(winner, winnerPrize, enderReward);
            // Update the last winner details
            lastWinner = winner; // address of the winner
            lastWinnerPrize = winnerPrize; // 'winnerPrize' is the amount won
        } else if (currentLotteryMode == LotteryMode.MultipleWinners) {
            // Select and reward multiple winners
            address[] memory winners = selectMultipleWinners();
            uint256 firstPrize = (winnerPrize * firstPlacePercentage) / 100;
            uint256 secondPrize = (winnerPrize * secondPlacePercentage) / 100;
            uint256 thirdPrize = (winnerPrize * thirdPlacePercentage) / 100;
            
            okToken.safeTransfer(winners[0], firstPrize);
            okToken.safeTransfer(winners[1], secondPrize);
            okToken.safeTransfer(winners[2], thirdPrize);
            
            emit LotteryEndedMultiple(winners[0], winners[1], winners[2], firstPrize, secondPrize, thirdPrize, enderReward);
        }        
        // Reset lottery state
        resetLotteryState();
        lotteryCount++;
    }

    function selectWinner(uint256 winnerPrize, uint256 enderReward) internal returns (address) {
        require(participants.length > 0, "No participants in the lottery");

        // Combining various unpredictable elements to improve on-chain randomness.
        uint256 randomHash = uint256(keccak256(abi.encodePacked(
            block.prevrandao,
            blockhash(block.number - 1), // The hash of the previous block
            participants,
            totalTicketsSold,
            address(this).balance,
            block.timestamp // Block's timestamp as an additional factor
        )));

        uint256 winnerIndex = randomHash % participants.length;
        address winner = participants[winnerIndex];

        okToken.safeTransfer(winner, winnerPrize); // Use safeTransfer
        emit LotteryEnded(winner, winnerPrize, enderReward);

        return winner;
    }

    function selectMultipleWinners() internal view returns (address[] memory winners) {
        require(participants.length >= 3, "Not enough participants");
        winners = new address[](3); 
    
        uint256 randIndex;
        for (uint256 i = 0; i < 3; ) {
            randIndex = random(block.timestamp, 0, participants.length);
        
            // Ensure uniqueness
            bool alreadySelected = false;
            for (uint256 j = 0; j < i; j++) {
                if (winners[j] == participants[randIndex]) {
                    alreadySelected = true;
                    break;
                }
            }
        
            if (!alreadySelected) {
                winners[i] = participants[randIndex];
                i++;
            }
        }
    
        return winners;
    }

    // Function to get the real-time winner prize pool
    function getWinnerPrizePool() public view returns (uint256) {
        uint256 currentBalance = okToken.balanceOf(address(this));
        uint256 reservedForNextLottery = (currentBalance * nextLotteryReservePercentage) / 100;
        uint256 enderReward = (currentBalance * enderRewardPercentage) / 100;
        uint256 feeTakerFee = (currentBalance * feeTakerFeePercentage) / 100;
        uint256 feeTaker2Fee = (currentBalance * feeTaker2FeePercentage) / 100;
        // Adjust prize pool by subtracting fees
        uint256 winnerPrizePool = currentBalance - reservedForNextLottery - enderReward - feeTakerFee - feeTaker2Fee;
        return winnerPrizePool;
    }

    // Helper function to generate a pseudo-random number
    function random(uint256 seed, uint256 min, uint256 max) private pure returns (uint256) {
        return (uint256(keccak256(abi.encodePacked(seed))) % (max - min)) + min;
    }

    // Function to get the last winner and the prize they won
    function getLastWinnerDetails() public view returns (address, uint256) {
        return (lastWinner, lastWinnerPrize);
    }

    // Reset for the next lottery
    function resetLotteryState() internal {
    lotteryActive = false;
    for (uint256 i = 0; i < participants.length; i++) {
        delete userTicketsCount[participants[i]];
        delete isParticipant[participants[i]]; // Reset participation status
    }
    delete participants;
    totalTicketsSold = 0;
    lotteryEndTime = 0;
    nextLotteryStartTime = block.timestamp + cooldownDuration;
    emit LotteryCooldownStarted(nextLotteryStartTime);
    }

    function getNumberOfParticipants() public view returns (uint256) {
        return participants.length;
    }

    // Retrieve the current list of participants
    function getParticipants() public view returns (address[] memory) {
        return participants;
    }

    // Public view function to return the current state of the lottery
    function getLotteryState() public view returns (bool isActive, uint256 startTime, uint256 endTime, uint256 totalSold, uint256 currentTicketPrice) {
        return (lotteryActive, nextLotteryStartTime, lotteryEndTime, totalTicketsSold, ticketPrice);
    }

    function isCooldownPeriod() public view returns (bool, uint256) {
        bool isCooldown = block.timestamp < nextLotteryStartTime && !lotteryActive;
        return (isCooldown, nextLotteryStartTime);
    }

    function getLotteryCount() public view returns (uint256) {
    return lotteryCount;
    }

    // Additional admin functions

    // Event declarations
    event TicketPriceChanged(uint256 newTicketPrice);
    event EmergencyWithdraw(address to, uint256 amount);

    // Function to set the lottery mode
    function setLotteryMode(LotteryMode _mode) external onlyOwner {
        require(!lotteryActive, "Lottery mode cannot be changed during an active lottery.");
        currentLotteryMode = _mode;
    }

    // Allows the owner to set a new ticket price for the next lottery (only allowed on cooldown duration)
    function setTicketPrice(uint256 _newTicketPrice) external onlyOwner {
        require(_newTicketPrice > 0, "Ticket price must be greater than 0");
        require(!lotteryActive, "Can only change ticket price during cooldown period");
        ticketPrice = _newTicketPrice;
        emit TicketPriceChanged(_newTicketPrice);
    }

    // Function to set the tickets limit per user
    function setTicketLimitPerUser(uint256 _newLimit) external onlyOwner {
        require(!lotteryActive, "Cannot change ticket limit during an active lottery");
        ticketLimitPerUser = _newLimit;
    }

    // Function to set the prize distribution percentages for multiple winners mode
    function setPrizeDistributionPercentages(uint256 _first, uint256 _second, uint256 _third) external onlyOwner {
        uint256 totalPercentage = _first + _second + _third;
        require(totalPercentage == 100, "Total must equal 100%");
        firstPlacePercentage = _first;
        secondPlacePercentage = _second;
        thirdPlacePercentage = _third;
    }

    // Allows the owner to change the fee takers addresses
    function setFeeTaker(address _feeTaker, address _feeTaker2) external onlyOwner {
        require(_feeTaker != address(0), "FeeTaker address cannot be zero.");
        require(_feeTaker2 != address(0) || feeTaker2FeePercentage == 0, "FeeTaker2 address cannot be zero unless its fee percentage is 0.");
        feeTaker = _feeTaker;
        feeTaker2 = _feeTaker2;
        emit FeeTakerUpdated(_feeTaker, _feeTaker2);
    }

    // Allows the owner to change the fee takers and next lottery reserve percentages, applied to the next lottery (only allowed during cooldown duration)
    function setFeeAndReservePercentages(uint256 _feeTakerFeePercentage, uint256 _feeTaker2FeePercentage, uint256 _enderRewardPercentage, uint256 _nextLotteryReservePercentage) external onlyOwner {
        uint256 totalPercentage = _feeTakerFeePercentage + _feeTaker2FeePercentage + _enderRewardPercentage + _nextLotteryReservePercentage;
        require(totalPercentage <= 100, "Total percentage cannot exceed 100%.");
        require(!lotteryActive, "Can only set during cooldown");
    
        feeTakerFeePercentage = _feeTakerFeePercentage;
        feeTaker2FeePercentage = _feeTaker2FeePercentage;
        enderRewardPercentage = _enderRewardPercentage;
        nextLotteryReservePercentage = _nextLotteryReservePercentage;
    
        emit FeePercentageUpdated(_feeTakerFeePercentage, _feeTaker2FeePercentage, _enderRewardPercentage, _nextLotteryReservePercentage);
    }

    // set token for game (only allowed on cooldown duration)
    function setOkToken(address _newOkTokenAddress) external onlyOwner {
        require(_newOkTokenAddress != address(0), "New token address cannot be zero.");
        require(!lotteryActive && block.timestamp >= nextLotteryStartTime, "Can only change the gaming token during the cooldown period.");
        okToken = IERC20(_newOkTokenAddress);
        emit TokenChanged(_newOkTokenAddress); // Emitting the event
    }

    // Allows the owner to change the next cooldown duration and lottery duration (only allowed on cooldown duration)
    function setLotteryParameters(uint256 _cooldownDuration, uint256 _lotteryDuration) external onlyOwner {
        require(!lotteryActive, "Cannot change parameters during an active lottery.");
        cooldownDuration = _cooldownDuration;
        lotteryDuration = _lotteryDuration;
        emit LotteryParametersUpdated(_cooldownDuration, _lotteryDuration);
    }

    // Allows the owner to emergency withdraw OK Tokens from the contract after last prize was paid (only allowed on cooldown duration)
    function emergencyWithdraw(address _to, uint256 _amount) external onlyOwner nonReentrant {
        require(!lotteryActive, "Cannot withdraw during an active lottery");
        require(_amount <= okToken.balanceOf(address(this)), "Insufficient balance");
        okToken.safeTransfer(_to, _amount); // Use safeTransfer 
        emit EmergencyWithdraw(_to, _amount);
    }

    // New function to emergency finish the lottery and select a winner
    function emergencyFinish() external onlyOwner {
        require(lotteryActive, "There is no active lottery to finish.");
        // Directly call endLottery which already handles winner selection and reward distribution
        endLottery();
    }

    // Owner can enable emergency refunds
    function enableEmergencyRefund() external onlyOwner {
        require(!emergencyRefundIsActive, "Emergency refund is already active.");
        emergencyRefundIsActive = true;
        // Initialize the participantsForRefund array with existing participants if needed
    }

    // Function for batch processing refunds
    function refundParticipantsInBatch(uint start, uint end) external onlyOwner {
        require(emergencyRefundIsActive, "Emergency refunds are not enabled.");
        for (uint i = start; i < end && i < participantsForRefund.length; i++) {
            address participant = participantsForRefund[i];
            uint256 amount = userPaidAmount[participant];
            if (amount > 0) {
                userPaidAmount[participant] = 0; // Prevent re-entrancy
                okToken.safeTransfer(participant, amount); // Use SafeERC20
            }
        }
    }

    // Optional: Function to disable emergency refunds (after completion)
    function disableEmergencyRefund() external onlyOwner {
        require(emergencyRefundIsActive, "Emergency refund is not active.");
        emergencyRefundIsActive = false;
    }
}