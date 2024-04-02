// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract OKFaucet is Ownable, ReentrancyGuard {
    IERC20 public token;

    uint256 public minWithdrawalAmount = 10 * (10**18); // Example minimum
    uint256 public maxWithdrawalAmount = 50 * (10**18); // Example maximum
    uint256 public lockTime = 1 minutes; // Cooldown period in minutes
    uint256 public dailyLimit = 100 * (10**18); // Daily withdrawal limit
    uint256 public totalClaims = 0; // Total number of claims made

    struct UserClaim {
        uint256 timestamp;
        uint256 claimedQuantity;
        address userAddress;
    }

    UserClaim[10] public lastTenClaims; // Last 10 user claims

    mapping(address => uint256) public nextAccessTime;
    mapping(address => uint256) public userDailyWithdrawal;

    event Withdrawal(address indexed to, uint256 amount);
    event Deposit(address indexed from, uint256 amount);

    constructor(address _owner, address _tokenAddress) Ownable(_owner) {
        token = IERC20(_tokenAddress);
    }

    modifier nonContract() {
        require(!isContract(msg.sender), "Contracts cannot participate in the faucet");
        _;
    }

    function requestTokens() public nonReentrant nonContract {
        require(block.timestamp >= nextAccessTime[msg.sender], "Cooldown period has not elapsed");
        require(msg.sender != address(0), "Cannot request tokens for the zero address");

        uint256 withdrawalAmount = randomWithdrawalAmount();
        require(token.balanceOf(address(this)) >= withdrawalAmount, "Insufficient faucet balance");
        require(userDailyWithdrawal[msg.sender] + withdrawalAmount <= dailyLimit, "Daily limit exceeded");

        userDailyWithdrawal[msg.sender] += withdrawalAmount;
        nextAccessTime[msg.sender] = block.timestamp + lockTime;
        totalClaims += 1;

        // Update lastTenClaims
        updateLastTenClaims(msg.sender, withdrawalAmount);

        token.transfer(msg.sender, withdrawalAmount);
        emit Withdrawal(msg.sender, withdrawalAmount);
    }

    function updateLastTenClaims(address userAddress, uint256 claimedQuantity) internal {
        // Shift the array elements to the right
        for (uint256 i = lastTenClaims.length - 1; i > 0; i--) {
            lastTenClaims[i] = lastTenClaims[i - 1];
        }
        // Add the new claim at the beginning
        lastTenClaims[0] = UserClaim(block.timestamp, claimedQuantity, userAddress);
    }

    function randomWithdrawalAmount() internal view returns (uint256) {
        uint256 random = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender))) % (maxWithdrawalAmount - minWithdrawalAmount);
        return minWithdrawalAmount + random;
    }

    function isContract(address account) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(account)
        }
        return size > 0;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    function setWithdrawalLimits(uint256 _minWithdrawalAmount, uint256 _maxWithdrawalAmount) external onlyOwner {
        require(_minWithdrawalAmount < _maxWithdrawalAmount, "Minimum must be less than maximum");
        minWithdrawalAmount = _minWithdrawalAmount * (10**18);
        maxWithdrawalAmount = _maxWithdrawalAmount * (10**18);
    }

    function setLockTime(uint256 _minutes) external onlyOwner {
        lockTime = _minutes * 1 minutes;
    }

    function setDailyLimit(uint256 _dailyLimit) external onlyOwner {
        dailyLimit = _dailyLimit * (10**18);
    }

    function withdrawERC20(address _tokenAddress) external onlyOwner {
        IERC20 _token = IERC20(_tokenAddress);
        uint256 _amount = _token.balanceOf(address(this));
        require(_amount > 0, "No tokens to withdraw");
        _token.transfer(msg.sender, _amount);
    }
}