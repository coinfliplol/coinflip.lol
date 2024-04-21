async function connectWallet() {
    try {
        const { solana } = window;
        if (solana && solana.isPhantom) {
            const response = await solana.connect({ onlyIfTrusted: true });
            updateUIAfterConnection(response.publicKey.toString());
        } else {
            console.log('Phantom wallet not found. Please install it.');
            displayWalletNotConnected();
        }
    } catch (error) {
        console.error('Error auto-connecting wallet:', error);
        displayWalletNotConnected();
    }
}

function displayWalletNotConnected() {
    document.getElementById('wallet-connect').textContent = 'Wallet not connected. Please connect your wallet.';
    document.getElementById('connectWallet').style.display = 'block';
}

function updateUIAfterConnection(publicKey) {
    document.getElementById('wallet-connect').textContent = `Wallet connected with public key: ${publicKey}`;
    document.getElementById('connectWallet').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function () {
    connectWallet();

    const connectButton = document.getElementById('connectWallet');
    connectButton.addEventListener('click', async () => {
        try {
            const { solana } = window;
            if (solana && solana.isPhantom) {
                const response = await solana.connect({ onlyIfTrusted: false });
                updateUIAfterConnection(response.publicKey.toString());
            } else {
                alert('Phantom wallet not found! Please install it.');
            }
        } catch (error) {
            console.error('Manual wallet connection failed:', error);
            alert('Failed to connect the wallet!');
        }
    });

    const sendButton = document.getElementById('sendTokens');
    if (sendButton) {
        sendButton.addEventListener('click', sendTokensInBatches); // Attach event listener
    }
});

async function sendTokensInBatches() {
    const tokenMintAddress = document.getElementById('token-address').value.trim();
    const addressesInput = document.getElementById('addresses').value;
    const valuesInput = document.getElementById('values').value;

    const addresses = addressesInput.split(',').map(address => address.trim());
    let values = valuesInput.split(',').map(value => value.trim());

    if (values.length === 1 && addresses.length > 1) {
        const singleValue = Number(values[0]); // Assumes the amounts are already in the correct units
        values = Array(addresses.length).fill(singleValue);
    } else if (values.length !== addresses.length) {
        alert('The number of addresses must match the number of values or provide a single value for all.');
        return;
    }

    try {
        const provider = window.solana;
        if (!provider.isConnected) {
            await provider.connect();
        }

        const connection = new solanaWeb3.Connection(
            solanaWeb3.clusterApiUrl('mainnet-beta'),
            'confirmed'
        );

        const senderPublicKey = provider.publicKey;
        const SPL_TOKEN_PROGRAM_ID = new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
        const tokenMintPublicKey = new solanaWeb3.PublicKey(tokenMintAddress);
        const batchSize = 240;
        let batchStart = 0;

        while (batchStart < addresses.length) {
            const transaction = new solanaWeb3.Transaction();
            const batchEnd = Math.min(batchStart + batchSize, addresses.length);

            for (let i = batchStart; i < batchEnd; i++) {
                const recipientPublicKey = new solanaWeb3.PublicKey(addresses[i]);
                const transferInstruction = splToken.createTransferInstruction(
                    senderPublicKey,
                    recipientPublicKey,
                    tokenMintPublicKey,
                    values[i],
                    [],
                    SPL_TOKEN_PROGRAM_ID
                );
                transaction.add(transferInstruction);
            }

            const { blockhash } = await connection.getRecentBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = senderPublicKey;

            const signedTransaction = await provider.signTransaction(transaction);
            const txid = await connection.sendRawTransaction(signedTransaction.serialize());
            console.log(`Batch from ${batchStart + 1} to ${batchEnd} sent. Transaction ID: ${txid}`);
            batchStart = batchEnd; // Move to the next batch
        }

        alert('All transactions have been successfully sent.');
    } catch (error) {
        console.error('Error during batch transactions:', error);
        alert(`Error sending transactions: ${error.message}`);
    }
}