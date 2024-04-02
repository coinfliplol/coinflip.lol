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
    uint256 public maxWithdrawalAmount = 20 * (10**18); // Example maximum
    uint256 public lockTime = 120 minutes; // Cooldown period in minutes
    uint256 public dailyLimit = 80 * (10**18); // Daily withdrawal limit
    uint256 public totalClaims = 0; // Total number of claims made

    mapping(address => uint256) public nextAccessTime;
    mapping(address => uint256) public userDailyWithdrawal;

    event Withdrawal(address indexed to, uint256 amount);
    event Deposit(address indexed from, uint256 amount);

    constructor(address _tokenAddress) Ownable(msg.sender) {
        token = IERC20(_tokenAddress);
    }

    modifier nonContract() {
        require(!isContract(msg.sender), "Contracts cannot participate in the faucet");
        _;
    }

    function requestTokens() public nonReentrant nonContract {
        require(block.timestamp >= nextAccessTime[msg.sender], "Cooldown period has not elapsed");
        require(msg.sender != address(0), "Cannot request tokens for the zero address");
        require(userDailyWithdrawal[msg.sender] + randomWithdrawalAmount() <= dailyLimit, "Daily limit exceeded");

        uint256 withdrawalAmount = randomWithdrawalAmount();
        require(token.balanceOf(address(this)) >= withdrawalAmount, "Insufficient faucet balance");

        userDailyWithdrawal[msg.sender] += withdrawalAmount;
        nextAccessTime[msg.sender] = block.timestamp + lockTime;
        totalClaims += 1;

        token.transfer(msg.sender, withdrawalAmount);
        emit Withdrawal(msg.sender, withdrawalAmount);
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

    function getFaucetBalance() public view returns (uint256) {
        return token.balanceOf(address(this));
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

    function withdrawAll() external onlyOwner {
        uint256 amount = token.balanceOf(address(this));
        require(amount > 0, "No tokens to withdraw");
        require(token.transfer(msg.sender, amount), "Transfer failed");
    }
}