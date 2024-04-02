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

    uint256 public minWithdrawalAmount = 3 * (10**18);
    uint256 public maxWithdrawalAmount = 14 * (10**18);
    uint256 public lockTime = 120 minutes;
    uint256 public baseDailyLimit = 25 * (10**18);
    uint256 public referralBonusLimit = 1 * (10**18);
    uint256 public totalClaims = 0;

    struct UserClaim {
        uint256 timestamp;
        uint256 claimedQuantity;
        address userAddress;
        uint256 numberOfReferrals;
        uint256 numberOfActiveReferrals;
    }

    UserClaim[10] public lastTenClaims;
    mapping(address => uint256) public nextAccessTime;
    mapping(address => uint256) public userDailyWithdrawal;
    mapping(address => address[]) public referrals;
    mapping(address => uint256) public lastActiveTime;
    mapping(address => bool) public hasClaimedThroughReferral;

    event Withdrawal(address indexed to, uint256 amount);
    event Deposit(address indexed from, uint256 amount);
    event ReferralAdded(address indexed referrer, address indexed referee);

    constructor(address _owner, address _tokenAddress) Ownable(_owner) {
        token = IERC20(_tokenAddress);
    }

    modifier nonContract() {
        require(!isContract(msg.sender), "Contracts cannot participate in the faucet");
        _;
    }

    function requestTokens(address referrer) public nonReentrant nonContract {
        require(block.timestamp >= nextAccessTime[msg.sender], "Cooldown period has not elapsed");
        require(msg.sender != address(0), "Cannot request tokens for the zero address");
        require(referrer != msg.sender, "Referrer cannot be the claimer");

        lastActiveTime[msg.sender] = block.timestamp;

        if(referrer != address(0) && !hasClaimedThroughReferral[msg.sender]){
            require(lastActiveTime[referrer] > 0, "Referrer must be an existing user");
            addReferral(referrer, msg.sender);
            hasClaimedThroughReferral[msg.sender] = true;
        }

        uint256 withdrawalAmount = randomWithdrawalAmount();
        uint256 dynamicDailyLimit = calculateDynamicDailyLimit(msg.sender);

        require(token.balanceOf(address(this)) >= withdrawalAmount, "Insufficient faucet balance");
        require(userDailyWithdrawal[msg.sender] + withdrawalAmount <= dynamicDailyLimit, "Daily limit exceeded");

        userDailyWithdrawal[msg.sender] += withdrawalAmount;
        nextAccessTime[msg.sender] = block.timestamp + lockTime;
        totalClaims += 1;

        updateLastTenClaims(msg.sender, withdrawalAmount);

        token.transfer(msg.sender, withdrawalAmount);
        emit Withdrawal(msg.sender, withdrawalAmount);
    }

    function addReferral(address referrer, address referee) internal {
        referrals[referrer].push(referee);
        lastActiveTime[referee] = block.timestamp;
        emit ReferralAdded(referrer, referee);
    }

    function setReferralBonusLimit(uint256 _newLimit) external onlyOwner {
        referralBonusLimit = _newLimit * (10**18);
    }

    function resetReferrals(address userAddress) external onlyOwner {
        delete referrals[userAddress];
        lastActiveTime[userAddress] = 0;
        hasClaimedThroughReferral[userAddress] = false;
    }

    // Function to update the minimum withdrawal amount
    function setMinWithdrawalAmount(uint256 _minWithdrawalAmount) external onlyOwner {
        minWithdrawalAmount = _minWithdrawalAmount * (10**18);
    }

    // Function to update the maximum withdrawal amount
    function setMaxWithdrawalAmount(uint256 _maxWithdrawalAmount) external onlyOwner {
        maxWithdrawalAmount = _maxWithdrawalAmount * (10**18);
    }

    // Function to update the lock time
    function setLockTime(uint256 _lockTime) external onlyOwner {
        lockTime = _lockTime * 1 minutes;
    }

    // Function to update the base daily limit
    function setBaseDailyLimit(uint256 _baseDailyLimit) external onlyOwner {
        baseDailyLimit = _baseDailyLimit * (10**18);
    }

    // Function for the contract owner to withdraw all tokens of the contract's associated token
    function withdrawAllTokens() external onlyOwner {
        uint256 contractBalance = token.balanceOf(address(this));
        require(contractBalance > 0, "Contract has no token balance to withdraw");

        bool sent = token.transfer(msg.sender, contractBalance);
        require(sent, "Token transfer failed");

        emit Withdrawal(msg.sender, contractBalance);
    }

    function updateLastTenClaims(address userAddress, uint256 claimedQuantity) internal {
        uint256 numReferrals = referrals[userAddress].length;
        uint256 numActiveReferrals = getActiveReferralsCount(userAddress);
        
        for (uint256 i = lastTenClaims.length - 1; i > 0; i--) {
            lastTenClaims[i] = lastTenClaims[i - 1];
        }
        lastTenClaims[0] = UserClaim(
            block.timestamp, 
            claimedQuantity, 
            userAddress,
            numReferrals,
            numActiveReferrals
        );
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

    function calculateDynamicDailyLimit(address user) public view returns (uint256) {
        uint256 activeReferrals = getActiveReferralsCount(user);
        return baseDailyLimit + (activeReferrals * referralBonusLimit);
    }

    function getFaucetBalance() public view returns (uint256) {
        return token.balanceOf(address(this));
    }

    function getActiveReferralsCount(address referrer) public view returns (uint256) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < referrals[referrer].length; i++) {
            if (block.timestamp - lastActiveTime[referrals[referrer][i]] <= 15 days) {
                activeCount += 1;
            }
        }
        return activeCount;
    }
}