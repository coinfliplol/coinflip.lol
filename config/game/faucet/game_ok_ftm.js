import { OKFAUCET_CONTRACT_ABI } from './LOLappAbi.js';
import { ERC20_ABI } from './LOLtokenAbi.js';
import { CHAIN_NAME, CHAIN_INDEX, CHAIN_RPC, CHAIN_EXPLORER, CHAIN_TOKEN, CHAIN_SYMBOL } from 
'/config/chain/ftm.js'; // Change Chain
import { TOKEN_NAME, TOKEN_SYMBOL, TOKEN_CONTRACT, TOKEN_FAUCET } from 
'/config/token/ok/ok_ftm.js'; // Change Token / Chain / Contract


document.addEventListener('DOMContentLoaded', function() {
    initializeWeb3();
    setupWalletConnection();
    loadconfig();
    initApp(); // Initialize the app
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
const LOLtokenAddress = TOKEN_CONTRACT; // token
const LOLappAddress = TOKEN_FAUCET; // contract
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
    const contractAddressSpan = document.getElementById("Token-Faucet");
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

    const LOLtokenAbi = ERC20_ABI;
    const LOLappAbi = OKFAUCET_CONTRACT_ABI;

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
        document.getElementById('okTokenBalance').textContent = `${fwallet} ${TOKEN_SYMBOL}`;
    });

    // extras
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

async function updateOKUSD() {
    try {
        const prizePool = await LOLappContract.methods.getFaucetBalance().call();
        const okPriceInUSD = await getOKTokenPriceInUSD();
        const prizePoolInOK = web3.utils.fromWei(prizePool, 'ether');
        const prizePoolInUSD = (prizePoolInOK * okPriceInUSD).toFixed(2);
        const formattedWinprize = formatter.format(prizePoolInOK);
        const formattedWinprizeUSD = formatter.format(prizePoolInUSD);

        document.getElementById('rewardpool').textContent = `${formattedWinprize}`;
        document.getElementById('rewardpoolUSD').textContent = `(${formattedWinprizeUSD} USD)`;
    } catch (error) {
        console.error("Failed to fetch faucet state or convert prize pool:", error);
    }
}

async function RequestTokens() {
    if (!window.ethereum || !window.ethereum.selectedAddress) {
        alert('Please connect your wallet first.');
        return;
    }

    const userAccount = (await web3.eth.getAccounts())[0];
    const contractMethod = LOLappContract.methods.requestTokens().encodeABI(); // Encodes the ABI for the contract method

    try {
        const transactionParameters = {
            to: LOLappAddress, // The address of the contract
            from: userAccount, // The user's account address
            data: contractMethod, // Encoded contract method ABI with parameters
        };

        // Send transaction via MetaMask
        const txHash = await ethereum.request({
            method: 'eth_sendTransaction',
            params: [transactionParameters],
        });

        console.log('Transaction Hash:', txHash);

        // Wait for the transaction to be confirmed
        const receipt = await waitForTransactionReceipt(txHash);

        if (receipt.status) {
            alert('Claimed Tokens success! Check your wallet.');
            window.location.reload();
        } else {
            alert('Transaction failed. Please try again.');
        }
    } catch (error) {
        console.error('RequestTokens error:', error);
        alert('Failed to claim tokens. See console for details.');
    }
}

async function waitForTransactionReceipt(txHash) {
    let receipt = null;
    while (receipt === null) {
        receipt = await web3.eth.getTransactionReceipt(txHash);
        if (receipt === null) {
            // Wait for a second before trying again.
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    return receipt;
}

function startCountdown(timeRemaining) {
    const timerElement = document.getElementById('timer');
    const countdown = () => {
        if (timeRemaining <= 0) {
            clearInterval(interval); // Stop the countdown
            timerElement.textContent = 'You can claim now!';
            return;
        }
        
        // Update the timer display
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        timerElement.textContent = `${minutes}m ${seconds}s remaining`;
        
        timeRemaining--; // Decrease the remaining time
    };

    countdown(); // Run once immediately
    const interval = setInterval(countdown, 1000); // Update every second
}

async function fetchFaucetDetails(userAddress) {
    try {
        const minClaim = await LOLappContract.methods.minWithdrawalAmount().call();
        const maxClaim = await LOLappContract.methods.maxWithdrawalAmount().call();
        const totalClaims = await LOLappContract.methods.totalClaims().call();
        const dailyLimit = await LOLappContract.methods.dailyLimit().call();
        const timeLock = await LOLappContract.methods.lockTime().call();
        const nextAccessTime = await LOLappContract.methods.nextAccessTime(userAddress).call();

        const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
        const timeRemaining = nextAccessTime - currentTime;

        // Updating the UI
        updateFaucetDetailsUI(minClaim, maxClaim, totalClaims, dailyLimit, timeLock, timeRemaining);
    } catch (error) {
        console.error('Failed to fetch faucet details:', error);
    }
}

function updateFaucetDetailsUI(minClaim, maxClaim, totalClaims, dailyLimit, timeLock, timeRemaining) {
    const timeLockConv = timeLock.toString();
    document.getElementById('minclaim').textContent = web3.utils.fromWei(minClaim, 'ether');
    document.getElementById('maxclaim').textContent = web3.utils.fromWei(maxClaim, 'ether');
    document.getElementById('totalclaims').textContent = totalClaims;
    document.getElementById('timelock').textContent = timeLockConv / 60 / 60;
    document.getElementById('dailylimit').textContent = web3.utils.fromWei(dailyLimit, 'ether');


    timeRemaining = timeRemaining.toString();
    
    if (timeRemaining > 0) {
        // User needs to wait to claim again. Show a countdown.
        startCountdown(timeRemaining);
    } else {
        // User can claim immediately.
        document.getElementById('timer').textContent = 'You can claim now!';
    }
}

function initApp() {
    console.log('App initialized');
    switchToMyChain();
    updateOKUSD();
    const userAddress = ethereum.selectedAddress; // Make sure the user is connected
    fetchFaucetDetails(userAddress);
    document.getElementById('requesttokens').addEventListener('click', RequestTokens);
}