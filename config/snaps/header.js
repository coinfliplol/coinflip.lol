function createHeader() {
    const headerContainer = document.getElementById('header-container');

    const headerHTML = `
    <header class="header-section">
        <div class="overlay">
            <div class="container">
                <div class="row d-flex header-area">
                    <nav class="navbar navbar-expand-lg navbar-light"> 
                        <a class="navbar-brand" href="/index.html">
                            <img src="/assets/images/fav.png" class="fav d-none d-lg-block d-xl-none" alt="fav">
                            <img src="/assets/images/logo.png" class="logo d-block d-lg-none d-xl-block" alt="logo">
                        </a>
                        <button class="navbar-toggler collapsed" type="button" data-bs-toggle="collapse"
                            data-bs-target="#navbar-content">
                            <i class="fas fa-bars"></i>
                        </button>
                        <div class="collapse navbar-collapse justify-content-between" id="navbar-content">
                            <ul class="navbar-nav mr-auto mb-2 mb-lg-0">
                                <li class="nav-item">
                                    <a class="nav-link active" href="/index.html">Home</a>
                                </li>
                                <li class="nav-item dropdown main-navbar">
                                    <a class="nav-link dropdown-toggle" href="javascript:void(0)"
                                        data-bs-toggle="dropdown" data-bs-auto-close="outside">PowerSend</a>
                                    <ul class="dropdown-menu main-menu shadow">
                                        <li><a class="nav-link" href="/powersend/eth/">Ethereum</a></li>
                                        <li><a class="nav-link" href="/powersend/bsc/">BSC</a></li>
                                        <li><a class="nav-link" href="/powersend/polygon/">Polygon</a></li>
                                        <li><a class="nav-link" href="/powersend/avax/">Avalanche</a></li>
                                        <li><a class="nav-link" href="/powersend/arb/">Arbitrum</a></li>
                                        <li><a class="nav-link" href="/powersend/op/">Optimism</a></li>
                                        <li><a class="nav-link" href="/powersend/ftm/">Fantom</a></li>
                                    </ul>
                                </li>
                                <li class="nav-item dropdown main-navbar">
                                <a class="nav-link dropdown-toggle" href="javascript:void(0)"
                                    data-bs-toggle="dropdown" data-bs-auto-close="outside">Faucet</a>
                                <ul class="dropdown-menu main-menu shadow">
                                    <li class="dropend sub-navbar">
                                        <a href="javascript:void(0)" class="dropdown-item dropdown-toggle"
                                            data-bs-toggle="dropdown" data-bs-auto-close="outside">Okcash [OK]</a>
                                        <ul class="dropdown-menu sub-menu shadow">
                                            <li><a class="nav-link" href="/faucet/ok/bsc/">BSC</a></li>
                                            <li><a class="nav-link" href="/faucet/ok/polygon/">Polygon</a></li>
                                            <li><a class="nav-link" href="/faucet/ok/avax/">Avalanche</a></li>
                                            <li><a class="nav-link" href="/faucet/ok/arb/">Arbitrum</a></li>
                                            <li><a class="nav-link" href="/faucet/ok/op/">Optimism</a></li>
                                            <li><a class="nav-link" href="/faucet/ok/ftm/">Fantom</a></li>
                                        </ul>
                                    </li>
                                </ul>
                                </li>
                                <li class="nav-item dropdown main-navbar">
                                    <a class="nav-link dropdown-toggle" href="javascript:void(0)"
                                        data-bs-toggle="dropdown" data-bs-auto-close="outside">Lottery</a>
                                    <ul class="dropdown-menu main-menu shadow">
                                        <li class="dropend sub-navbar">
                                            <a href="javascript:void(0)" class="dropdown-item dropdown-toggle"
                                                data-bs-toggle="dropdown" data-bs-auto-close="outside">Okcash [OK]</a>
                                            <ul class="dropdown-menu sub-menu shadow">
                                                <li><a class="nav-link" href="/lottery/ok/bsc/">BSC</a></li>
                                                <li><a class="nav-link" href="/lottery/ok/polygon/">Polygon</a></li>
                                                <li><a class="nav-link" href="/lottery/ok/avax/">Avalanche</a></li>
                                                <li><a class="nav-link" href="/lottery/ok/arb/">Arbitrum</a></li>
                                                <li><a class="nav-link" href="/lottery/ok/op/">Optimism</a></li>
                                                <li><a class="nav-link" href="/lottery/ok/ftm/">Fantom</a></li>
                                            </ul>
                                        </li>
                                    </ul>
                                </li>
                                <li class="nav-item dropdown main-navbar">
                                    <a class="nav-link dropdown-toggle" href="javascript:void(0)"
                                        data-bs-toggle="dropdown" data-bs-auto-close="outside">Coinflip</a>
                                    <ul class="dropdown-menu main-menu shadow">
                                        <li class="dropend sub-navbar">
                                            <a href="javascript:void(0)" class="dropdown-item dropdown-toggle"
                                                data-bs-toggle="dropdown" data-bs-auto-close="outside">Okcash [OK]</a>
                                            <ul class="dropdown-menu sub-menu shadow">
                                                <li><a class="nav-link" href="/coinflip/ok/bsc/">BSC</a></li>
                                                <li><a class="nav-link" href="/coinflip/ok/polygon/">Polygon</a></li>
                                                <li><a class="nav-link" href="/coinflip/ok/avax/">Avalanche</a></li>
                                                <li><a class="nav-link" href="/coinflip/ok/arb/">Arbitrum</a></li>
                                                <li><a class="nav-link" href="/coinflip/ok/op/">Optimism</a></li>
                                                <li><a class="nav-link" href="/coinflip/ok/ftm/">Fantom</a></li>
                                            </ul>
                                        </li>
                                    </ul>
                                </li>
                            </ul>
                            <div class="right-area header-action d-flex align-items-center max-un">
                                <div id="connectSection">
                                    <button id="connectWallet" type="button" class="cmn-btn reg" data-bs-toggle="modal">
                                    Connect Wallet
                                    </button>
                                    <button id="disconnectWallet" style="display: none;">Disconnect</button>
                                </div> 
                                <div id="walletInfo" style="display: none;">
                                    <p>
                                        <span id="okTokenBalance"></span> • 
                                        <span id="walletAddress"></span> </p>
                                </div>
                            </div>
                        </div>
                    </nav>
                </div>
            </div>
        </div>
    </header>
    `;

    headerContainer.innerHTML = headerHTML;
    // Hide the Connect Wallet button based on a condition
    const connectWalletButton = document.getElementById('connectWallet');
    if (window.location.pathname === '/index.html' || window.location.pathname === '/about-us.html' || window.location.pathname === '/privacy-policy.html' || window.location.pathname === '/terms-conditions.html' || window.location.pathname === '/') {
        connectWalletButton.style.display = 'none';
    }
}

// Call the createHeader function to generate the header
createHeader();