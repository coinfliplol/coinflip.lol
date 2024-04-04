import { POWERSEND_CONTRACT_ABI } from './LOLappAbi.js';
import { ERC20_ABI } from './LOLtokenAbi.js';
import { CHAIN_NAME, CHAIN_INDEX, CHAIN_RPC, CHAIN_EXPLORER, CHAIN_TOKEN, CHAIN_SYMBOL } from 
'/config/chain/arb.js'; // Change Chain
import { CONTRACT_ARB } from 
'./contract.js'; // Change Contract

document.addEventListener('DOMContentLoaded', function() {
    initializeWeb3();
    setupWalletConnection();
    loadconfig();
    initApp(); // Initialize the app
    updatePowerstats();
    document.getElementById('token-address').addEventListener('change', displayTokenName);
    displayTokenName();
    
    // Listen for account changes.
    ethereum.on('accountsChanged', function (accounts) {
        // The accounts array is empty if the user has disconnected all accounts.
        // Otherwise, it contains the user's accounts that your app has permission to access.
        console.log('Accounts changed, reloading the page for the new account.');
        window.location.reload();
    });
});

let LOLappContract; // Declare it globally
let SelectedTokenContract;
const MAX_UINT256 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

// Generals 

const LOLappAddress = CONTRACT_ARB; // power send contract
// switchToMyChain | Arb 0xa4b1 | AVAX 0xa86a | BSC 0x38 | FTM 0xfa | OP 0xa | MATIC 0x89 |
const chainIdHex = CHAIN_INDEX; // Chain ID
const rpcU = CHAIN_RPC; // rpc for Network
const bexU = CHAIN_EXPLORER; // Network Explorer
const ChainU = CHAIN_NAME; // Network Name
const nameU = CHAIN_TOKEN; // Network Base Coin/Token Name
const symbolU = CHAIN_SYMBOL; // Network Base Coin/Token Symbol
// const okTokenPriceGecko = 'https://api.coingecko.com/api/v3/simple/price?ids=okcash&vs_currencies=usd'; // Token coingecko link

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
    // Construct the URL
    const url = `${CHAIN_EXPLORER}address/${LOLappAddress}`;

    // Set the href attribute of the link
    const contractLink = document.getElementById("contract-link");
    contractLink.href = url;

    // Set the contract address
    const contractAddressSpan = document.getElementById("Token-Powersend");
    contractAddressSpan.textContent = LOLappAddress;
}

function connectWallet(SelectTokenAddress, walletInfoDiv, disconnectWalletButton) {
    if (window.ethereum) {
        window.ethereum.request({ method: 'eth_requestAccounts' })
            .then(function(accounts) {
                const account = accounts[0];
                showWalletInfo(account, SelectTokenAddress, walletInfoDiv, disconnectWalletButton);
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

async function setupWalletConnection() {
    const connectWalletButton = document.getElementById('connectWallet');
    const disconnectWalletButton = document.getElementById('disconnectWallet');
    const walletInfoDiv = document.getElementById('walletInfo');
    const LOLtokenAbi = ERC20_ABI;
    const LOLappAbi = POWERSEND_CONTRACT_ABI;

    // Get the current selected token address directly inside the function
    const currentSelectedTokenAddress = document.getElementById('token-address').value;

    try {
        const accounts = await ethereum.request({ method: 'eth_accounts' });
        const currentTokenAddress = document.getElementById('token-address').value;

        if (currentTokenAddress) {
            SelectedTokenContract = new web3.eth.Contract(LOLtokenAbi, currentTokenAddress);
        }

        if (accounts.length > 0) {
            LOLappContract = new web3.eth.Contract(LOLappAbi, LOLappAddress);
            showWalletInfo(accounts[0], currentTokenAddress, walletInfoDiv, disconnectWalletButton);
        }

        connectWalletButton.addEventListener('click', () => {
            const currentTokenAddress = document.getElementById('token-address').value;
            const SelectedTokenContract = new web3.eth.Contract(LOLtokenAbi, currentTokenAddress);
            connectWallet(SelectedTokenContract, walletInfoDiv, disconnectWalletButton);
        });

        disconnectWalletButton.addEventListener('click', function() {
            disconnectWallet(connectWalletButton, this, walletInfoDiv);
        });

    } catch (error) {
        console.error('Failed to set up wallet connection:', error);
    }
}

function showWalletInfo(account, walletInfoDiv, disconnectWalletButton) {
    const connectWalletButton = document.getElementById('connectWallet');
    const SelectTokenAddress = document.getElementById('token-address').value; // Get the current value
    if (!SelectTokenAddress) {
        console.error('Token address not specified.');
        return; // Exit if no address is provided
    }
    const SelectedTokenContract = new web3.eth.Contract(ERC20_ABI, SelectTokenAddress); // Create the contract instance with the current address
    console.log(walletInfoDiv); // Check if this is null/undefined
    connectWalletButton.style.display = 'none';
    disconnectWalletButton.style.display = 'block';
    // walletInfoDiv.style.display = 'block';

    document.getElementById('walletAddress').textContent = account.substring(0, 6) + '...' + account.substring(account.length - 4);

    SelectedTokenContract.methods.balanceOf(account).call()
    .then(balance => {
        const formatwallet = web3.utils.fromWei(balance, 'ether');
        const fwallet = formatter.format(formatwallet);
        document.getElementById('okTokenBalance').textContent = `${fwallet} OK`;
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

const formatter = new Intl.NumberFormat('en-US', {
    style: 'decimal', // Use "decimal" style.
    minimumFractionDigits: 2, // Ensure two digits after the decimal point.
    maximumFractionDigits: 2, // Ensure no more than two digits after the decimal point.
});

async function displayTokenName() {
    const tokenAddress = document.getElementById('token-address').value.trim();

    if (!web3.utils.isAddress(tokenAddress)) {
        console.log("Invalid address.");
        document.getElementById('token-name').textContent = "Invalid token address";
        return;
    }

    const tokenContract = new web3.eth.Contract(ERC20_ABI, tokenAddress);

    try {
        const tokenName = await tokenContract.methods.name().call();
        const tokenSymbol = await tokenContract.methods.symbol().call();
        document.getElementById('token-name').textContent = `${tokenName} [ ${tokenSymbol} ]`;
    } catch (error) {
        console.error("Error fetching token details:", error);
        document.getElementById('token-name').textContent = "Error fetching token details";
    }
}


async function checkAndApproveAllowance(SelectedTokenContract, fromAddress, LOLappAddress, totalValueBatch) {
    const currentAllowance = await SelectedTokenContract.methods.allowance(fromAddress, LOLappAddress).call();

    if (BigInt(currentAllowance) < BigInt(totalValueBatch)) {
        try {
            // Request approval
            const approveTx = await SelectedTokenContract.methods.approve(LOLappAddress, MAX_UINT256).send({ from: fromAddress });

            console.log('1st Approval transaction successful:', approveTx.transactionHash);

            // Polling mechanism to wait for the transaction to be mined
            const receipt = await pollForTransactionReceipt(web3, approveTx.transactionHash);

            // Double-check allowance
            const newAllowance = await SelectedTokenContract.methods.allowance(fromAddress, LOLappAddress).call();
            if (BigInt(newAllowance) >= BigInt(totalValueBatch)) {
                return true; // Allowance is set
            } else {
                throw new Error('Allowance set failed.');
            }
        } catch (error) {
            throw error;
        }
    } else {
        return true; // Allowance already sufficient
    }
}

// Function to poll for transaction receipt
async function pollForTransactionReceipt(web3, transactionHash) {
    while (true) {
        try {
            const receipt = await web3.eth.getTransactionReceipt(transactionHash);
            if (receipt) {
                return receipt; // Transaction mined, return receipt
            }
            // Wait for some time before polling again
            await sleep(3000); // Adjust the polling interval as needed
        } catch (error) {
            throw error;
        }
    }
}

// Function to introduce a delay
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/// Start here

function showTransactions() {
    const data = JSON.parse(localStorage.getItem("transactions")) || [];
    let rows = document.createDocumentFragment();

    if (data.length !== 0) {
        const tableBody = document.getElementById("txTable").querySelector("tbody");
        tableBody.innerHTML = ""; // Clear existing rows

        data.forEach((txData, i) => {
            const row = document.createElement("tr");

            ["index", "hash", "status", "users", "amount"].forEach((key) => {
                const cell = document.createElement("td");
                if (key === "hash") {
                    const hyperlink = document.createElement("a");
                    hyperlink.href = `${CHAIN_EXPLORER}tx/${txData[key]}`;
                    hyperlink.textContent = "TX ID";
                    hyperlink.target = "_blank";
                    cell.appendChild(hyperlink);
                } else if (key === "users") {
                    cell.textContent = txData[key] + " users"; // Specific formatting for "users"
                } else if (key === "index") {
                    cell.textContent = i + 1; // Adjusted to show the correct index
                } else {
                    cell.textContent = txData[key]; // Default text content assignment for other keys
                }
                row.appendChild(cell);
            });

            rows.appendChild(row);
        });

        tableBody.appendChild(rows);
    }
}

async function updatePowerstats() {
    const LOLappAbi = POWERSEND_CONTRACT_ABI;
    LOLappContract = new web3.eth.Contract(LOLappAbi, LOLappAddress);
    const powerCounter = await LOLappContract.methods.getPowerSendCount().call();

    // HTML elements
    document.getElementById('PowerNumber').innerText = powerCounter; 
}

// Set up event listeners for your HTML elements
async function setupEventListeners() {
    document.getElementById('sendTokens').addEventListener('click', async () => {
        const currentTokenAddress = document.getElementById('token-address').value;
        const addressesInput = document.getElementById('addresses').value;
        const singleValueInput = document.getElementById('values').value;

        if (!currentTokenAddress || !addressesInput || !singleValueInput) {
            alert('Please fill in all the required fields.');
            return;
        }

        const SelectedTokenContract = new web3.eth.Contract(ERC20_ABI, currentTokenAddress);
        const addresses = addressesInput.split(',').map(address => address.trim());
        let values = singleValueInput.split(',').map(value => value.trim());

        if (values.length === 1 && addresses.length > 1) {
            const singleValue = web3.utils.toWei(values[0], 'ether');
            values = Array(addresses.length).fill(singleValue);
        } else {
            values = values.map(value => web3.utils.toWei(value, 'ether'));
        }

        const ADDRESSES_PER_TX = 240;
        const batchesCount = Math.ceil(addresses.length / ADDRESSES_PER_TX);
        const transactionsDetails = [];

        try {
            const fromAddress = ethereum.selectedAddress;

            for (let i = 0; i < batchesCount; i++) {
                const startIndex = i * ADDRESSES_PER_TX;
                const endIndex = Math.min(startIndex + ADDRESSES_PER_TX, addresses.length);
                const addressBatch = addresses.slice(startIndex, endIndex);
                const valueBatch = values.slice(startIndex, endIndex);

                const totalValueBatch = valueBatch.reduce((total, value) => BigInt(total) + BigInt(value), BigInt(0)).toString();
                const isApproved = await checkAndApproveAllowance(SelectedTokenContract, fromAddress, LOLappAddress, totalValueBatch);

                if (!isApproved) {
                    alert('Approval failed. Transaction not sent.');
                    return;
                }

                // Encode the transaction for the batch
                const encodedABI = LOLappContract.methods.doOKPowerSend(currentTokenAddress, addressBatch, valueBatch).encodeABI();

                const transactionParameters = {
                    to: LOLappContract.options.address,
                    from: fromAddress,
                    data: encodedABI,
                };

                const txHash = await ethereum.request({
                    method: 'eth_sendTransaction',
                    params: [transactionParameters],
                });
                console.log(`Batch ${i + 1} transaction hash:`, txHash);

                const receipt = await waitForTransactionReceipt(txHash);
                console.log(`Batch ${i + 1} transaction receipt:`, receipt);

                transactionsDetails.push({
                    hash: receipt.transactionHash,
                    status: receipt.status ? "Success" : "Failed",
                    users: addressBatch.length,
                    amount: valueBatch.reduce((acc, val) => acc + parseFloat(web3.utils.fromWei(val, 'ether')), 0).toFixed(2)
                });
            }

            localStorage.setItem("transactions", JSON.stringify(transactionsDetails));
            showTransactions();
            document.getElementById('transactionStatus').innerText = 'Transactions processed. Check below for details.';
            alert("All transactions have been successfully processed by PowerSend.");
        } catch (error) {
            console.error('Transaction processing failed:', error);
            document.getElementById('transactionStatus').innerText = 'Transaction processing failed. See console for more details.';
            alert("There was an error processing the transactions, please check the console for more details.");
        }
    });
}

async function waitForTransactionReceipt(txHash) {
    let receipt = null;
    while (receipt === null) {
        receipt = await web3.eth.getTransactionReceipt(txHash);
        if (receipt === null) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // wait for 2 seconds before retrying
        }
    }
    return receipt;
}

function initApp() {
    console.log('App initialized');
    switchToMyChain();
    setupEventListeners();
}