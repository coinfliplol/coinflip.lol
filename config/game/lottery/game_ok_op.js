import { OKLOTTERY_CONTRACT_ABI } from './LOLappAbi.js';
import { ERC20_ABI } from './LOLtokenAbi.js';
import { CHAIN_NAME, CHAIN_INDEX, CHAIN_RPC, CHAIN_EXPLORER, CHAIN_TOKEN, CHAIN_SYMBOL } from 
'/config/chain/op.js'; // Change Chain
import { TOKEN_NAME, TOKEN_SYMBOL, TOKEN_CONTRACT, TOKEN_LOTTERY } from 
'/config/token/ok/ok_op.js'; // Change Token / Chain / Contract


document.addEventListener('DOMContentLoaded', function() {
    loadconfig();
    initializeWeb3();
    setupWalletConnection();
    initApp(); // Initialize the app
    updateCooldownInfo(); // Now safe to call this
    updateLastWinnerDetails();

    // Listen for account changes.
    ethereum.on('accountsChanged', function (accounts) {
    // The accounts array is empty if the user has disconnected all accounts.
    // Otherwise, it contains the user's accounts that your app has permission to access.
    console.log('Accounts changed, reloading the page for the new account.');
    window.location.reload();
    });
});

let LOLappContract; // Declare it globally
let LOLtokenContract;
const cryptoName = TOKEN_NAME.toLowerCase();
// Generals
const MAX_UINT256 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
const LOLtokenAddress = TOKEN_CONTRACT; // token
const LOLappAddress = TOKEN_LOTTERY; // contract
// switchToMyChain | Arb 0xa4b1 | AVAX 0xa86a | BSC 0x38 | FTM 0xfa | OP 0xa | MATIC 0x89 |
const chainIdHex = CHAIN_INDEX; // Chain ID
const rpcU = CHAIN_RPC; // rpc for Network
const bexU = CHAIN_EXPLORER; // Network Explorer
const ChainU = CHAIN_NAME; // Network Name
const nameU = CHAIN_TOKEN; // Network Base Coin/Token Name
const symbolU = CHAIN_SYMBOL; // Network Base Coin/Token Symbol

async function initializeWeb3() {
    if (window.ethereum) {
        window.web3 = new Web3(window.ethereum);
        try {
            // Request account access
            await window.ethereum.request({ method: 'eth_requestAccounts' });
        } catch (error) {
            // User denied account access...
            console.error("User denied account access");
        }
    } else if (window.web3) {
        // Legacy dapp browsers...
        window.web3 = new Web3(window.web3.currentProvider);
    } else {
        // Fallback to Infura or any other provider
        window.web3 = new Web3(new Web3.providers.HttpProvider(rpcU));
    }
}

async function switchToMyChain() {  
    // Check if already connected to the desired network
    
    const currentChainId = await ethereum.request({ method: 'eth_chainId' });
    if (currentChainId === chainIdHex) {
      console.log("Already connected to the Desired network");
      return; // Stop execution if already on the desired network
    }
  
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
      window.location.reload(); // Only reload if the network switch was successful
    } catch (switchError) {
      // Handle case where the desired network is not added to the user's wallet
      if (switchError.code === 4902) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: chainIdHex,
              chainName: ChainU,
              nativeCurrency: {
                name: nameU,
                symbol: symbolU,
                decimals: 18,
              },
              rpcUrls: rpcU,
              blockExplorerUrls: bexU,
            }],
          });
          window.location.reload(); // Reload after adding and switching to the new network
        } catch (addError) {
          console.error('Failed to add the Needed Network:', addError);
        }
      } else {
        console.error('Failed to switch to the Desired Network:', switchError);
      }
    }
  }

function loadconfig() {
    document.getElementById('Chain-Name').textContent = CHAIN_NAME;
    document.getElementById('Token-Name').textContent = TOKEN_NAME;
    document.getElementById('Token-Symbol').textContent = TOKEN_SYMBOL;
    // Construct the URL
    const url = `${CHAIN_EXPLORER}address/${LOLappAddress}`;

    // Set the href attribute of the link
    const contractLink = document.getElementById("contract-link");
    contractLink.href = url;

    // Set the contract address
    const contractAddressSpan = document.getElementById("Token-Lottery");
    contractAddressSpan.textContent = LOLappAddress;
}

function connectWallet(LOLtokenContract, walletInfoDiv, disconnectWalletButton) {
    if (window.ethereum) {
        window.ethereum.request({ method: 'eth_requestAccounts' })
            .then(function(accounts) {
                const account = accounts[0];
                showWalletInfo(account, LOLtokenContract, walletInfoDiv, disconnectWalletButton);
            })
            .catch(function(error) {
                if (error.code === 4001) {
                    // User rejected the request
                    console.error('User rejected the request');
                } else {
                    console.error('Connection error:', error);
                }
            });
    } else {
        alert('Ethereum wallet not detected. Please install MetaMask or another Ethereum-compatible wallet.');
    }
}

function setupWalletConnection() {
    const connectWalletButton = document.getElementById('connectWallet');
    const disconnectWalletButton = document.getElementById('disconnectWallet');
    const walletInfoDiv = document.getElementById('walletInfo');

    const amountToApprove = "AMOUNT_OF_TOKENS_FOR_TICKETS";
    const LOLtokenAbi = ERC20_ABI;
    const LOLappAbi = OKLOTTERY_CONTRACT_ABI;

    LOLtokenContract = new web3.eth.Contract(LOLtokenAbi, LOLtokenAddress);
    LOLappContract = new web3.eth.Contract(LOLappAbi, LOLappAddress);

    if (window.ethereum && window.ethereum.selectedAddress) {
        const account = window.ethereum.selectedAddress;
        showWalletInfo(account, LOLtokenContract, walletInfoDiv, disconnectWalletButton);
    }

    connectWalletButton.addEventListener('click', () => {
        connectWallet(LOLtokenContract, walletInfoDiv, disconnectWalletButton);
    });

    disconnectWalletButton.addEventListener('click', function() {
        disconnectWallet(connectWalletButton, this, walletInfoDiv);
    });

    setTimeout(() => {
        if (window.ethereum && window.ethereum.selectedAddress) {
            const account = window.ethereum.selectedAddress;
            showWalletInfo(account, LOLtokenContract, walletInfoDiv, disconnectWalletButton);
        }
    }, 1000);
}

function showWalletInfo(account, LOLtokenContract, walletInfoDiv, disconnectWalletButton) {
    const connectWalletButton = document.getElementById('connectWallet');
    connectWalletButton.style.display = 'none';
    // disconnectWalletButton.style.display = 'block';
    walletInfoDiv.style.display = 'block';

    document.getElementById('walletAddress').textContent = account.substring(0, 6) + '...' + account.substring(account.length - 4);

    LOLtokenContract.methods.balanceOf(account).call()
    
    
    .then(balance => {
        const formatwallet = web3.utils.fromWei(balance, 'ether');
        const fwallet = formatter.format(formatwallet);
        
        console.log();
        document.getElementById('okTokenBalance').textContent = `${fwallet} OK`;
    });

    // Add any other OKLottery contract interactions here, for example, to show lottery status or let users buy tickets
}

function disconnectWallet(connectWalletButton, disconnectWalletButton, walletInfoDiv) {
    connectWalletButton.style.display = 'block';
    disconnectWalletButton.style.display = 'none';
    walletInfoDiv.style.display = 'none';

    document.getElementById('walletAddress').textContent = '';
    document.getElementById('okTokenBalance').textContent = '';

    alert('Wallet disconnected. Refresh the page or click "Connect Wallet" to connect again.');
}

// Rest of app

// cache for getoktokenpriceinusd
const cacheDuration = 5 * 60 * 1000; // 5 minutes

async function getOKTokenPriceInUSD() {
    const cache = localStorage.getItem('okTokenPriceCache');
    if (cache) {
        const { timestamp, data } = JSON.parse(cache);
        const now = new Date().getTime();

        if (now - timestamp < cacheDuration) {
            console.log("Using cached " + TOKEN_SYMBOL + " token price.");
            return data;
        }
    }

    try {
        // Construct the URL with the variable
        const apiUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoName}&vs_currencies=usd`;

        // Make the fetch call with the constructed URL
        const response = await fetch(apiUrl);
        const data = await response.json();
        const price = data[cryptoName].usd;
        const now = new Date().getTime();

        localStorage.setItem('okTokenPriceCache', JSON.stringify({ timestamp: now, data: price }));
        console.log("Fetched new " + TOKEN_SYMBOL + " token price from API.");
        return price;
    } catch (error) {
        console.error('Failed to fetch the Token price:', error);
        return cache ? cache.data : null; // Return cached data if available, else null
    }
}

const formatter = new Intl.NumberFormat('en-US', {
    style: 'decimal', // Use "decimal" style.
    minimumFractionDigits: 2, // Ensure two digits after the decimal point.
    maximumFractionDigits: 2, // Ensure no more than two digits after the decimal point.
});

const formatterzero = new Intl.NumberFormat('en-US', {
    style: 'decimal', // Use "decimal" style.
    minimumFractionDigits: 0, // Ensure two digits after the decimal point.
    maximumFractionDigits: 0, // Ensure no more than two digits after the decimal point.
});

async function updateOKUSD() {
    try {
        const prizePool = await LOLappContract.methods.getWinnerPrizePool().call();
        const ticketinOK = await LOLappContract.methods.ticketPrice().call();
        // Use getCachedData to apply caching const okPriceInUSD = await getOKTokenPriceInUSD();
        const okPriceInUSD = await getOKTokenPriceInUSD();
        const lwinnerPrize = await LOLappContract.methods.lastWinnerPrize().call();
        const lwinnerPrizeWei = web3.utils.fromWei(lwinnerPrize, "ether");
        const ticketinOKwei = web3.utils.fromWei(ticketinOK, "ether");
        const prizePoolInOK = web3.utils.fromWei(prizePool, 'ether');
        const prizePoolInUSD = (prizePoolInOK * okPriceInUSD).toFixed(2);
        const ticketinUSD = (ticketinOKwei * okPriceInUSD).toFixed(2);
        const lwinnerPrizeUSD = (lwinnerPrizeWei * okPriceInUSD).toFixed(2);
        const formattedWinprizeUSD = formatter.format(prizePoolInUSD);
        const fwinnerprizeUSD = formatter.format(lwinnerPrizeUSD);
        const fticketprizeUSD = formatter.format(ticketinUSD);
        

        document.getElementById('rewardpoolUSD').textContent = `( ${formattedWinprizeUSD} USD )`;
        document.getElementById('ticketUSD').textContent = `( ${fticketprizeUSD} USD )`;
        document.getElementById('lastprizeUSD').textContent = `( ${fwinnerprizeUSD} USD )`;
    } catch (error) {
        console.error("Failed to fetch lottery state or convert prize pool:", error);
    }
}

// Function to check allowance and request approval if necessary
async function checkAllowanceAndBuyTickets(LOLtokenAddress, LOLappAddress, numberOfTickets) {
    const tokenContract = new web3.eth.Contract(ERC20_ABI, LOLtokenAddress);
    const accounts = await web3.eth.getAccounts();
    const userAddress = accounts[0];
    const ticketPrice = await LOLappContract.methods.ticketPrice().call();
    const totalCost = web3.utils.toBN(ticketPrice).mul(web3.utils.toBN(numberOfTickets));

    let allowance = await tokenContract.methods.allowance(userAddress, LOLappAddress).call();

    if (web3.utils.toBN(allowance).lt(totalCost)) {
        // Allowance is insufficient, request approval for the max amount
        await approveTokenSpending(LOLtokenAddress, LOLappAddress, MAX_UINT256);
        // Wait for the allowance to reflect the approval
        await waitForAllowanceUpdate(tokenContract, userAddress, LOLappAddress, totalCost);
    }

    // Allowance should now be sufficient, proceed to buy tickets
    await buyTickets(numberOfTickets);
}

// Function to wait for the allowance to update on the blockchain
async function waitForAllowanceUpdate(tokenContract, userAddress, spenderAddress, expectedAmount) {
    const delay = (duration) => new Promise(resolve => setTimeout(resolve, duration));
    let currentAllowance = web3.utils.toBN(await tokenContract.methods.allowance(userAddress, spenderAddress).call());

    // Wait for the allowance to update, checking every few seconds
    while (currentAllowance.lt(expectedAmount)) {
        await delay(3000); // Wait for 3 seconds before checking again
        currentAllowance = web3.utils.toBN(await tokenContract.methods.allowance(userAddress, spenderAddress).call());
    }
}

// Function to approve token spending
async function approveTokenSpending(LOLtokenAddress, spenderAddress, amount) {
    const tokenContract = new web3.eth.Contract(ERC20_ABI, LOLtokenAddress);
    const accounts = await web3.eth.getAccounts();
    const account = accounts[0];

    // Encode the approve function call
    const encodedABI = tokenContract.methods.approve(spenderAddress, amount).encodeABI();

    // Transaction parameters
    const transactionParameters = {
        to: LOLtokenAddress, // Token Contract Address
        from: account, // User's account
        data: encodedABI,
    };

    // Sending transaction directly through MetaMask
    const txHash = await ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
    });

    console.log('Approval Transaction Hash:', txHash);
    // Optionally, wait for transaction confirmation here or handle it accordingly in your UI
}

async function buyTickets(numberOfTickets) {
    if (!window.ethereum || !window.ethereum.selectedAddress) {
        alert('Please connect your wallet first.');
        return;
    }

    const account = ethereum.selectedAddress;
    const encodedABI = LOLappContract.methods.buyTickets(numberOfTickets.toString()).encodeABI();

    const transactionParameters = {
        to: LOLappContract.options.address, // Lottery Contract Address
        from: account, // User's account
        data: encodedABI,
    };

    try {
        // Using MetaMask's API directly to send the transaction
        const txHash = await ethereum.request({
            method: 'eth_sendTransaction',
            params: [transactionParameters],
        });

        console.log('Transaction Hash:', txHash);

        // Wait for the transaction to be confirmed
        await waitForTransactionReceipt(txHash);

        alert(`Successfully purchased ${numberOfTickets} ticket(s)!`);
        window.location.reload();
    } catch (error) {
        console.error('Ticket purchase failed:', error);
        alert('Failed to purchase tickets. See console for details.');
    }
}

async function waitForTransactionReceipt(txHash) {
    let receipt = null;
    while (receipt === null) {
        // Pause for a moment before checking again
        await new Promise(resolve => setTimeout(resolve, 2000));
        receipt = await web3.eth.getTransactionReceipt(txHash);
    }
    console.log('Transaction Receipt:', receipt);
    return receipt;
}

function updateLotteryInfo() {
    LOLappContract.methods.getLotteryState().call()
    .then((result) => {
        const isActive = result[0];
        const startTime = result[1];
        const endTime = result[2];
        const totalSold = result[3];
        const currentTicketPrice = result[4];
        const now = Date.now() / 1000; // JavaScript timestamp in seconds
        let timeLeft;

        if (isActive && endTime > now) {
            timeLeft = endTime - now;
        } else {
            timeLeft = 0;
        }

        // Convert timestamps to readable format
        const startDate = new Date(startTime * 1000).toLocaleString();
        const endDate = new Date(endTime * 1000).toLocaleString();
        function formatTimeLeft(timeInSeconds) {
            if (!timeInSeconds || timeInSeconds <= 0) return 'Lottery not active';
        
            const days = Math.floor(timeInSeconds / (3600 * 24));
            const hoursLeft = Math.floor((timeInSeconds - (days * 3600 * 24)) / 3600);
            const minutesLeft = Math.floor((timeInSeconds - (days * 3600 * 24) - (hoursLeft * 3600)) / 60);
        
            let timeLeftStr = "";
            if (days > 0) timeLeftStr += `${days} day${days > 1 ? 's' : ''} `;
            if (hoursLeft > 0) timeLeftStr += `${hoursLeft} hr${hoursLeft > 1 ? 's' : ''} `;
            if (minutesLeft > 0) timeLeftStr += `${minutesLeft} min${minutesLeft > 1 ? 's' : ''} `;
        
            return timeLeftStr.trim();
        }
        
        // Usage
        const timeLeftStr = formatTimeLeft(timeLeft);

        // Assuming ticketPrice comes from the contract and is "10000000000000000" for example
        const ticketPriceWei = currentTicketPrice; // This would be fetched from the contract
        const ticketPriceOK = web3.utils.fromWei(ticketPriceWei, 'ether');
        const fticketOK = formatter.format(ticketPriceOK);
        const ftotalsolds = formatterzero.format(totalSold);

        // Update HTML elements
        document.getElementById('pool-size').textContent = `${ftotalsolds}`;
        document.getElementById('time-left').textContent = `${timeLeftStr}`;
        document.getElementById('ticket-info').textContent = `${fticketOK} OK`;
    })
    .catch(error => console.error("Failed to fetch lottery state:", error)); 
}

async function updateCooldownInfo() {
    if (!LOLappContract) {
        console.error('LOLappContract is not defined.');
        return;
    }
    try {
        const prizePool = await LOLappContract.methods.getWinnerPrizePool().call();
        const winprize = web3.utils.fromWei(prizePool, 'ether');
        const cooldownInfo = await LOLappContract.methods.isCooldownPeriod().call();
        const isCooldown = cooldownInfo[0];
        const nextLotteryStartTime = cooldownInfo[1];
        const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
        const timeLeft = nextLotteryStartTime - currentTime; // Time left in seconds
        const fprizeinOK = formatter.format(winprize);

        // Update your UI here
        document.getElementById('rewardpool').textContent = `${fprizeinOK}`;
        document.getElementById('cooldownStatus').textContent = isCooldown ? "Yes" : "No";
        if(isCooldown && timeLeft > 0) {
            document.getElementById('timeLeft').textContent = `${timeLeft} seconds`;
        } else {
            document.getElementById('timeLeft').textContent = "Done! Start a new Lottery game by buying a ticket.";
        }
    } catch (error) {
        console.error('Failed to fetch cooldown info:', error);
    }
}

async function updateLastWinnerDetails() {
    const winner = await LOLappContract.methods.lastWinner().call();
    const winnerPrize = await LOLappContract.methods.lastWinnerPrize().call();
    const fwinnerprizewei = web3.utils.fromWei(winnerPrize, 'ether');
    document.getElementById('lastWinner').textContent = winner;
    const fwinnerprizeOK = formatter.format(fwinnerprizewei);
    document.getElementById('lastWinnerPrize').textContent = `${fwinnerprizeOK} OK`;
}

// async function updateNumberOfParticipants() {
//    const participants = await LOLappContract.methods.getNumberOfParticipants().call();
//    document.getElementById('numberOfParticipants').textContent = participants.toString();
//}

function initApp() {
    console.log('App initialized');
    switchToMyChain();
    updateLotteryInfo();
    updateOKUSD();
    document.getElementById('buyTicket').addEventListener('click', async function() {
        const numberOfTicketsInput = document.getElementById('ticketQuantity'); // Make sure this ID matches your input field
        const numberOfTickets = web3.utils.toBN(numberOfTicketsInput.value);
    
        // Assuming you have these addresses set correctly elsewhere
        const LOLtokenAddress = LOLtokenContract.options.address;; // ERC-20 Token Contract Address
        const LOLappAddress = LOLappContract.options.address; // Lottery Contract Address
    
        checkAllowanceAndBuyTickets(LOLtokenAddress, LOLappAddress, numberOfTickets);
    });
    document.getElementById('endLottery').addEventListener('click', async function() {
    const accounts = await ethereum.request({ method: 'eth_accounts' });
    if (accounts.length === 0) {
        console.error('No accessible accounts. Please connect to MetaMask.');
        alert('Please connect to MetaMask.');
        return;
    }

    const fromAddress = accounts[0];
    const encodedABI = LOLappContract.methods.automatedLotteryCheck().encodeABI();

    const transactionParameters = {
        to: LOLappContract.options.address, // The address of the lottery contract
        from: fromAddress, // The user's account address
        data: encodedABI, // The encodedABI of the function call
    };

    try {
        // Sending transaction directly through MetaMask
        const txHash = await ethereum.request({
            method: 'eth_sendTransaction',
            params: [transactionParameters],
        });

        console.log('Transaction hash:', txHash);
        alert('Lottery check and end attempt sent. Please wait for transaction confirmation.');

        // Optional: Wait for transaction to be confirmed
        const receipt = await waitForTransactionReceipt2(txHash);
        console.log('Lottery check and end attempt:', receipt);
        alert('Lottery check and end attempt successful. You got 1% of the Prize Pool!');
        window.location.reload();

        // Update UI based on changes here...
    } catch (error) {
        console.error('Failed to check/end lottery:', error);
        alert('Failed to check/end the lottery. See console for details.');
    }
});

async function waitForTransactionReceipt2(txHash) {
    let receipt = null;
    while (receipt === null) {
        // Polling for transaction receipt...
        receipt = await ethereum.request({
            method: 'eth_getTransactionReceipt',
            params: [txHash],
        });
        if (receipt === null) {
            // Wait before polling again
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    return receipt;
}
}