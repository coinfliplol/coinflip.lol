//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

library SafeMath {
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");
        return c;
    }

    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a, "SafeMath: subtraction overflow");
        return a - b;
    }

    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0) return 0;
        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");
        return c;
    }

    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b > 0, "SafeMath: division by zero");
        return a / b;
    }

    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b != 0, "SafeMath: modulo by zero");
        return a % b;
    }
}

contract Context {
    function _msgSender() internal view returns (address) {
        return msg.sender;
    }

    function _msgData() internal view returns (bytes memory) {
        this;
        return msg.data;
    }
}

contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() {
        _owner = _msgSender();
        emit OwnershipTransferred(address(0), _owner);
    }

    function owner() public view returns (address) {
        return _owner;
    }

    modifier onlyOwner() {
        require(_owner == _msgSender(), "Ownable: caller is not the owner");
        _;
    }

    function renounceOwnership() public onlyOwner {
        emit OwnershipTransferred(_owner, address(0));
        _owner = address(0);
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }
}

library Address {
    function isContract(address account) internal view returns (bool) {
        return account.code.length > 0;
    }

    function sendValue(address payable recipient, uint256 amount) internal {
        require(address(this).balance >= amount, "Address: insufficient balance");
        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Address: unable to send value, recipient may have reverted");
    }

    function functionCall(address target, bytes memory data) internal returns (bytes memory) {
        return functionCall(target, data, "Address: low-level call failed");
    }

    function functionCall(address target, bytes memory data, string memory errorMessage) internal returns (bytes memory) {
        return functionCallWithValue(target, data, 0, errorMessage);
    }

    function functionCallWithValue(address target, bytes memory data, uint256 value) internal returns (bytes memory) {
        return functionCallWithValue(target, data, value, "Address: low-level call with value failed");
    }

    function functionCallWithValue(address target, bytes memory data, uint256 value, string memory errorMessage) internal returns (bytes memory) {
        require(address(this).balance >= value, "Address: insufficient balance for call");
        require(isContract(target), "Address: call to non-contract");
        (bool success, bytes memory returndata) = target.call{value: value}(data);
        return verifyCallResult(success, returndata, errorMessage);
    }

    function functionStaticCall(address target, bytes memory data) internal view returns (bytes memory) {
        return functionStaticCall(target, data, "Address: low-level static call failed");
    }

    function functionStaticCall(address target, bytes memory data, string memory errorMessage) internal view returns (bytes memory) {
        require(isContract(target), "Address: static call to non-contract");
        (bool success, bytes memory returndata) = target.staticcall(data);
        return verifyCallResult(success, returndata, errorMessage);
    }

    function functionDelegateCall(address target, bytes memory data) internal returns (bytes memory) {
        return functionDelegateCall(target, data, "Address: low-level delegate call failed");
    }

    function functionDelegateCall(address target, bytes memory data, string memory errorMessage) internal returns (bytes memory) {
        require(isContract(target), "Address: delegate call to non-contract");
        (bool success, bytes memory returndata) = target.delegatecall(data);
        return verifyCallResult(success, returndata, errorMessage);
    }

    function verifyCallResult(bool success, bytes memory returndata, string memory errorMessage) internal pure returns (bytes memory) {
        if (success) {
            return returndata;
        } else {
            if (returndata.length > 0) {
                assembly {
                    let returndata_size := mload(returndata)
                    revert(add(32, returndata), returndata_size)
                }
            } else {
                revert(errorMessage);
            }
        }
    }
}

interface IERC20 {
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Transfer(address indexed from, address indexed to, uint256 value);

    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
    function totalSupply() external view returns (uint256);
    function balanceOf(address owner) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 value) external returns (bool);
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

library SafeERC20 {
    using Address for address;

    function safeTransfer(IERC20 token, address to, uint256 value) internal {
        _callOptionalReturn(token, abi.encodeWithSelector(token.transfer.selector, to, value));
    }

    function safeTransferFrom(IERC20 token, address from, address to, uint256 value) internal {
        _callOptionalReturn(token, abi.encodeWithSelector(token.transferFrom.selector, from, to, value));
    }

    function safeApprove(IERC20 token, address spender, uint256 value) internal {
        require((value == 0) || (token.allowance(address(this), spender) == 0), "SafeERC20: approve from non-zero to non-zero allowance");
        _callOptionalReturn(token, abi.encodeWithSelector(token.approve.selector, spender, value));
    }

    function safeIncreaseAllowance(IERC20 token, address spender, uint256 value) internal {
        uint256 newAllowance = token.allowance(address(this), spender) + value;
        _callOptionalReturn(token, abi.encodeWithSelector(token.approve.selector, spender, newAllowance));
    }

    function safeDecreaseAllowance(IERC20 token, address spender, uint256 value) internal {
        unchecked {
            uint256 oldAllowance = token.allowance(address(this), spender);
            require(oldAllowance >= value, "SafeERC20: decreased allowance below zero");
            uint256 newAllowance = oldAllowance - value;
            _callOptionalReturn(token, abi.encodeWithSelector(token.approve.selector, spender, newAllowance));
        }
    }

    function _callOptionalReturn(IERC20 token, bytes memory data) private {
        bytes memory returndata = address(token).functionCall(data, "SafeERC20: low-level call failed");
        if (returndata.length > 0) {
            require(abi.decode(returndata, (bool)), "SafeERC20: ERC20 operation did not succeed");
        }
    }
}

contract ReentrancyGuard {
    bool private _locked;

    modifier nonReentrant() {
        require(!_locked, "ReentrancyGuard: reentrant call");
        _locked = true;
        _;
        _locked = false;
    }
}

contract Coinflip is Ownable, ReentrancyGuard {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    struct Bet {
        address playerAddress;
        uint256 betValue;
        uint256 headsTails;
    }

    mapping(address => uint256) public playerWinnings;
    mapping(address => Bet) public waiting;

    event logNewProvableQuery(string description);
    event userWithdrawal(address indexed caller, uint256 amount);
    event filpFinshed(uint result);
    event Funded(address indexed funder, uint256 amount);
    event FlipOccurred(address indexed player, uint256 flipNumber, bool win, uint256 prizeAmount); // Event to emit details of each flip
    event LastWinnerUpdated(address indexed winner, uint256 prizeAmount); // Optional: Specific event for the last winner update

    uint256 public flipCounter = 0; // Counter for the total number of flips
    address public lastWinner; // Address of the last winner
    uint256 public lastPrizeAmount; // Amount won by the last winner

    uint256 lastHash;
    uint256 FACTOR = 57896044618658097711785492504343953926634992332820282019728792003956564819968;

    uint public contractBalance;
    address flipTokenAddress;
    uint256 public feePercentage = 10; // Initial fee set to 10%
    address public feeDestinationAddress;

    bool public freeCallback = true;

    constructor(address _tokenAddress, address _feeDestinationAddress) {
        flipTokenAddress = _tokenAddress;
        feeDestinationAddress = _feeDestinationAddress;
    }

    // Setter for the fee percentage
    function setFeePercentage(uint256 _newFeePercentage) external onlyOwner {
        feePercentage = _newFeePercentage;
    }

    // Setter for the fee destination address
    function setFeeDestinationAddress(address _newFeeDestinationAddress) external onlyOwner {
        require(_newFeeDestinationAddress != address(0), "Invalid address");
        feeDestinationAddress = _newFeeDestinationAddress;
    }

    function getResult() private returns (uint) {
        uint256 blockValue = uint256(blockhash(block.number.sub(1)));
        if (lastHash == blockValue) revert();
        lastHash = blockValue;
        uint256 coinFlip = blockValue % 2;
        return coinFlip == 1 ? 1 : 0;
    }

    function flip(uint256 oneZero, uint256 amount) public {
        require(!isContract(msg.sender), "Msg.sender should be address. Not allowed contract");
        require(amount > 0, "Bet amount must be greater than 0");

        // Calculate the fee from the bet amount
        uint256 fee = amount.mul(feePercentage).div(100);
        uint256 betAmountAfterFee = amount.sub(fee);
        uint256 winAmount = 0; // Initialize winAmount

        // Transfer the fee to the fee destination address immediately
        IERC20(flipTokenAddress).safeTransferFrom(msg.sender, feeDestinationAddress, fee);

        // The remainder of the bet amount is used for the bet
        IERC20(flipTokenAddress).safeTransferFrom(msg.sender, address(this), betAmountAfterFee);

        // Increase contract balance by the bet amount after the fee is deducted
        contractBalance = contractBalance.add(betAmountAfterFee);

        uint flipResult = getResult();
        if (flipResult == oneZero) {
            emit filpFinshed(1);
            winAmount = betAmountAfterFee.mul(2);
            require(contractBalance >= winAmount, "Contract does not have enough funds");
            contractBalance = contractBalance.sub(winAmount); // Update contract balance
            playerWinnings[msg.sender] = playerWinnings[msg.sender].add(winAmount);
            // Update the last winner and prize amount
            lastWinner = msg.sender;
            lastPrizeAmount = winAmount;

            emit LastWinnerUpdated(msg.sender, winAmount); // Emit event for the last winner update
        } else {
            emit filpFinshed(0);
            // No need to adjust contractBalance here as it's already increased above
        }
        // Increase flip counter
        flipCounter++;

        // Emit an event with details of the flip
        emit FlipOccurred(msg.sender, flipCounter, flipResult == oneZero, winAmount);
    }

    function withdrawUserWinnings() public nonReentrant {
        require(playerWinnings[msg.sender] > 0, "No funds to withdraw");
        uint256 amount = playerWinnings[msg.sender];
        playerWinnings[msg.sender] = 0;
        IERC20(flipTokenAddress).safeTransfer(msg.sender, amount);
        emit userWithdrawal(msg.sender, amount);
    }

    function getWinningsBalance() public view returns (uint256) {
        return playerWinnings[msg.sender];
    }

function fundContract(uint256 amount) public {
    // Ensure the sender has approved the contract to handle the specified amount of tokens
    IERC20(flipTokenAddress).safeTransferFrom(msg.sender, address(this), amount);
    // Optionally, update the contract balance 
    contractBalance = contractBalance.add(amount);
    // Emit an event to log funding actions (transparency)
    emit Funded(msg.sender, amount);
}

    function setToken(address _tokenAddress) public onlyOwner {
        flipTokenAddress = _tokenAddress;
    }

    function withdrawAll() public onlyOwner {
        uint toTransfer = contractBalance;
        contractBalance = 0;
        IERC20(flipTokenAddress).safeTransfer(msg.sender, toTransfer);
    }

        // Add this function to your contract
    function withdrawTotalBalance() external onlyOwner {
        uint256 totalBalance = IERC20(flipTokenAddress).balanceOf(address(this));
        require(totalBalance > 0, "No funds available");

        IERC20(flipTokenAddress).transfer(msg.sender, totalBalance);
    }

    function claimETH(uint256 amount) external onlyOwner {
        (bool sent, ) = owner().call{value: amount}("");
        require(sent, "Failed to send OK");
    }

    function isContract(address _address) private view returns (bool) {
        uint32 size;
        assembly { size := extcodesize(_address) }
        return size > 0;
    }
}