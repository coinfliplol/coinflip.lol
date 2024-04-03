import { OKCOINFLIP_CONTRACT_ABI } from './LOLappAbi.js';
import { ERC20_ABI } from './LOLtokenAbi.js';
import { CHAIN_NAME, CHAIN_INDEX, CHAIN_RPC, CHAIN_EXPLORER, CHAIN_TOKEN, CHAIN_SYMBOL } from 
'/config/chain/arb.js'; // Change Chain
import { TOKEN_NAME, TOKEN_SYMBOL, TOKEN_CONTRACT, TOKEN_COINFLIP } from 
'/config/token/ok/ok_arb.js'; // Change Token / Chain / Contract


document.addEventListener('DOMContentLoaded', function() {
    loadconfig();
    initializeWeb3();
    setupWalletConnection();
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
const LOLappAddress = TOKEN_COINFLIP; // contract
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
    const contractAddressSpan = document.getElementById("Token-Coinflip");
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
    const LOLappAbi = OKCOINFLIP_CONTRACT_ABI;

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

async function updateFlipStats() {
    const flipCounter = await LOLappContract.methods.flipCounter().call();
    const lastWinner = await LOLappContract.methods.lastWinner().call();
    const lastPrizeAmount = await LOLappContract.methods.lastPrizeAmount().call();

    // Assuming you have these HTML elements
    document.getElementById('flipNumber').innerText = flipCounter;
    document.getElementById('lastWinner').innerText = lastWinner;
    document.getElementById('lastWinnerPrize').innerText = web3.utils.fromWei(lastPrizeAmount, 'ether') + ' [Your Token Symbol]';
}

async function updateOKUSD() {
    try {
        const prizePool = await LOLappContract.methods.contractBalance().call();
        const lastprizePool = await LOLappContract.methods.lastPrizeAmount().call();
        const okPriceInUSD = await getOKTokenPriceInUSD();
        const prizePoolInOK = web3.utils.fromWei(prizePool, 'ether');
        const lastprizePoolOK = web3.utils.fromWei(lastprizePool, 'ether');
        const lastprizePoolUSD = (lastprizePoolOK * okPriceInUSD).toFixed(2);
        const prizePoolInUSD = (prizePoolInOK * okPriceInUSD).toFixed(2);
        const formattedWinprize = formatter.format(prizePoolInOK);
        const formattedWinprizeUSD = formatter.format(prizePoolInUSD);
        const formattedlastWinprizeUSD = formatter.format(lastprizePoolUSD);

        document.getElementById('rewardpool').textContent = `${formattedWinprize}`;
        document.getElementById('rewardpoolUSD').textContent = `(${formattedWinprizeUSD} USD)`;
        document.getElementById('lastprizeUSD').textContent = `(${formattedlastWinprizeUSD} USD)`;
    } catch (error) {
        console.error("Failed to fetch coinflip state or convert prize pool:", error);
    }
}

function delay(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function placeBet(headsTails, amount) {
    if (!window.ethereum || !window.ethereum.selectedAddress) {
        alert('Please connect your wallet first.');
        return;
    }

    const accounts = await web3.eth.getAccounts();
    const account = accounts[0];
    const amountInWei = web3.utils.toWei(amount.toString(), 'ether');
    const coin = document.getElementById("coin");

    let initialBalance = await LOLappContract.methods.getWinningsBalance().call({ from: account });
    initialBalance = web3.utils.fromWei(initialBalance, 'ether');

    await checkAndApproveAllowance(LOLtokenContract, LOLappAddress, account, amountInWei);

    coin.style.animation = "flip 3.5s infinite linear";

    const encodedABI = LOLappContract.methods.flip(headsTails.toString(), amountInWei).encodeABI();

    const transactionParameters = {
        to: LOLappAddress,
        from: account,
        data: encodedABI,
    };

    try {
        const txHash = await ethereum.request({
            method: 'eth_sendTransaction',
            params: [transactionParameters],
        });
        console.log('Transaction Hash:', txHash);

        // Wait for the transaction to be confirmed
        await waitForTransactionReceipt(txHash);

        let finalBalance = await LOLappContract.methods.getWinningsBalance().call({ from: account });
        finalBalance = web3.utils.fromWei(finalBalance, 'ether');

        // Stop the flip animation
        coin.style.animation = "none";

        // Determine win or loss based on balance change
        if (parseFloat(finalBalance) > parseFloat(initialBalance)) {
            coin.style.transform = headsTails === 1 ? "rotateY(180deg)" : "rotateY(0deg)";
            await delay(1000);
            alert("Congratulations, you won!");
            window.location.reload();
        } else {
            coin.style.transform = headsTails === 1 ? "rotateY(0deg)" : "rotateY(180deg)";
            await delay(1000);
            alert("Sorry, you lost this time.");
            window.location.reload();
        }

        displayUserBalance();
        updateOKUSD();

    } catch (error) {
        console.error("Error placing bet:", error);
        alert("Error placing bet. See console for details.");
        coin.style.animation = "none";
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

async function displayUserBalance() {
    const accounts = await web3.eth.getAccounts();
    const account = accounts[0];
    const okPriceUSD = await getOKTokenPriceInUSD();
    
    LOLappContract.methods.getWinningsBalance().call({ from: account })
    .then((balance) => {
        const balanceInOK = web3.utils.fromWei(balance, 'ether');
        const winwon = (balanceInOK * okPriceUSD).toFixed(2);
        const formattedWinOK = formatter.format(balanceInOK);
        const formattedWinUSD = formatter.format(winwon);
        document.getElementById('userBalance').textContent = `${formattedWinOK}`;
        document.getElementById('winningsUSD').textContent = `( ${formattedWinUSD} USD )`;
    })
    .catch((error) => {
        console.error("Error fetching user balance:", error);
    });
}

async function withdrawWinnings() {
    if (!window.ethereum || !window.ethereum.selectedAddress) {
        alert('Please connect your wallet first.');
        return;
    }

    const accounts = await web3.eth.getAccounts();
    const account = accounts[0];

    // Encode the contract function call
    const encodedABI = LOLappContract.methods.withdrawUserWinnings().encodeABI();

    // Transaction parameters
    const transactionParameters = {
        to: LOLappAddress, // Contract address to execute the method on
        from: account, // User's account
        data: encodedABI, // Encoded data for the contract call
    };

    try {
        // Using MetaMask's API directly to send transaction
        const txHash = await ethereum.request({
            method: 'eth_sendTransaction',
            params: [transactionParameters],
        });
        console.log('Transaction Hash:', txHash);
        alert("Withdrawal initiated. Please wait for confirmation.");

        // Wait for the transaction to be confirmed (optional)
        await waitForTransactionReceipt2(txHash);
        console.log("Winnings withdrawn successfully.");
        alert("Winnings withdrawn! Check your wallet.");
        window.location.reload();

        // Refresh user's balance here, if necessary
        // displayUserBalance();
    } catch (error) {
        console.error("Error withdrawing winnings:", error);
        alert("Error withdrawing winnings. See console for details.");
    }
}

async function waitForTransactionReceipt2(txHash) {
    let receipt = null;
    while (receipt === null) {
        // Pause for a moment before checking again
        await new Promise(resolve => setTimeout(resolve, 2000));
        receipt = await web3.eth.getTransactionReceipt(txHash);
    }
    console.log('Transaction Receipt:', receipt);
    return receipt;
}

async function checkAndApproveAllowance(LOLtokenContract, spenderAddress, account, amountInWei) {
    // Convert maxUint256 to a BigInt for comparison
    const maxUint256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
    // Fetch the current allowance
    const currentAllowance = BigInt(await LOLtokenContract.methods.allowance(account, spenderAddress).call());
    
    // Only proceed if the current allowance is less than the amount needed
    if (currentAllowance < BigInt(amountInWei)) {
        // Your logic to handle the case when the current allowance isn't enough
        console.log("Current allowance is less than the amount needed. Approving now...");
        await approveMaxAllowance(LOLtokenContract, spenderAddress, account);
    } else {
        console.log("Sufficient allowance exists. No need to approve.");
    }
}

async function approveMaxAllowance(LOLtokenContract, spenderAddress, account) {
    // Maximum uint256 value for ERC20 token allowance
    const maxUint256 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    // Encode the approve function call
    const encodedABI = LOLtokenContract.methods.approve(spenderAddress, maxUint256).encodeABI();

    // Transaction parameters
    const transactionParameters = {
        to: LOLtokenContract.options.address, // ERC20 Token Contract Address
        from: account, // User's account
        data: encodedABI, // Encoded ABI for the approve function call
    };

    try {
        // Sending transaction directly through MetaMask
        const txHash = await ethereum.request({
            method: 'eth_sendTransaction',
            params: [transactionParameters],
        });
        console.log('Approval Transaction Hash:', txHash);
        alert('Approval transaction successful');
    } catch (error) {
        console.error('Approval transaction error:', error);
        alert('Approval transaction failed. See console for details.');
    }
}

function initApp() {
    console.log('App initialized');
    updateOKUSD();
    document.getElementById('betHeads').addEventListener('click', () => placeBet(1, document.getElementById('betAmount').value));
    document.getElementById('betTails').addEventListener('click', () => placeBet(0, document.getElementById('betAmount').value));
    document.getElementById('checkBalance').addEventListener('click', displayUserBalance);
    document.getElementById('withdraw').addEventListener('click', withdrawWinnings);
    displayUserBalance();
    updateFlipStats();
    switchToMyChain();
    document.getElementById('donateButton').addEventListener('click', async () => {
        const donateAmount = document.getElementById('donateAmount').value;
        const donateAmountInTokens = web3.utils.toWei(donateAmount, 'ether'); // Assuming your token has 18 decimals
        const accounts = await web3.eth.getAccounts();
    
        if (accounts.length === 0) {
            alert("Please connect your wallet first.");
            return;
        }
    
        const account = accounts[0];
    
        // Approve the coinflip contract to spend tokens on behalf of the user
        LOLtokenContract.methods.approve(LOLappAddress, donateAmountInTokens).send({ from: account })
        .then((approvalTx) => {
            console.log('Approval successful', approvalTx);
    
            // Now that the token spending is approved, call the fundContract function
            LOLappContract.methods.fundContract(donateAmountInTokens).send({ from: account })
            .then((tx) => {
                console.log('Funding successful', tx);
                alert('Thank you for funding the Faucet!');
                window.location.reload();
            })
            .catch((error) => {
                console.error('Funding failed', error);
                alert('Funding failed. See console for details.');
            });
        })
        .catch((error) => {
            console.error('Approval failed', error);
            alert('Approval failed. See console for details.');
        });
    });
}