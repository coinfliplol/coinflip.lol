document.addEventListener('DOMContentLoaded', function () {
    const connectButton = document.getElementById('connectWallet');

    connectButton.addEventListener('click', async () => {
        try {
            const { solana } = window;

            if (solana && solana.isPhantom) {
                console.log("Phantom wallet found!");

                // Prompt user to connect their wallet
                const response = await solana.connect({ onlyIfTrusted: false });
                console.log('Connected with public key:', response.publicKey.toString());

                // Update UI to show wallet is connected
                connectButton.innerText = 'Wallet Connected';
                connectButton.disabled = true;

                // You can now use the response.publicKey to interact with Solana
            } else {
                alert('Phantom wallet not found! Please install it.');
            }
        } catch (error) {
            console.error('Wallet connection failed:', error);
            alert('Failed to connect the wallet!');
        }
    });
});

async function connectWallet() {
    try {
        const { solana } = window;
        if (solana && solana.isPhantom) {
            console.log('Phantom wallet found!');
            await solana.connect({ onlyIfTrusted: true });
            console.log('Wallet connected:', solana.publicKey.toString());
            document.getElementById('wallet-connect').textContent = 'Wallet connected. Ready to send tokens.';
        } else {
            alert('Phantom wallet not found. Please install it.');
        }
    } catch (error) {
        console.error('Wallet connection error:', error);
    }
}

async function sendBatch() {
    const tokenAddress = document.getElementById('tokenAddress').value;
    const recipients = document.getElementById('addresses').value.split(',');
    const amounts = document.getElementById('amounts').value.split(',');

    if (recipients.length !== amounts.length) {
        alert('The number of recipients and amounts must match.');
        return;
    }

    try {
        const provider = window.solana;
        const connection = new sol.Web3.Connection(sol.Web3.clusterApiUrl('mainnet-beta'));
        const sender = provider.publicKey;
        const transaction = new sol.Web3.Transaction();

        for (let i = 0; i < recipients.length; i++) {
            const instruction = new solanaWeb3.TokenInstruction.transfer(
                tokenAddress,
                sender,
                recipients[i],
                amounts[i]
            );
            transaction.add(instruction);
        }

        const { blockhash } = await connection.getRecentBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = sender;

        const signed = await provider.signTransaction(transaction);
        const txid = await connection.sendRawTransaction(signed.serialize());
        console.log('Transaction sent:', txid);
        alert(`Batch transaction sent. TXID: ${txid}`);
    } catch (error) {
        console.error('Error sending tokens:', error);
        alert('Error sending tokens: ' + error.message);
    }
}

// Initialize wallet connection on page load
connectWallet();