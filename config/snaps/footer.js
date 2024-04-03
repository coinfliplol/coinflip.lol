function createFooter() {
    const footerContainer = document.getElementById('footer-container');

    const footerHTML = `
    <footer class="footer-section">
        <div class="container">
            <div class="footer-area pt-120">
                <div class="row">
                    <div class="col-xl-12">
                        <div class="footer-top d-flex align-items-center justify-content-between">
                            <a href="index.html">
                                <img src="/assets/images/logo.png" class="logo" alt="logo">
                            </a>
                            <div class="footer-box">
                                <ul class="footer-link d-flex align-items-center gap-4">
                                    <li><a href="https://github.com/coinfliplol/coinflip.lol" target="_blank">Add your Token</a></li>
                                    <li><a href="/privacy-policy.html">Privacy Policy</a></li>
                                    <li><a href="/terms-conditions.html">Terms of Service</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="footer-bottom">
                    <div class="row justify-content-between align-items-center">
                        <div class="col-lg-7 d-flex justify-content-center justify-content-lg-start order-lg-0 order-1">
                            <div class="copyright text-center">
                                <p>© Coinflip.LOL 2024</p>
                            </div>
                        </div>
                        <div class="col-xl-3 col-lg-5 d-flex justify-content-center justify-content-lg-end">
                            <div class="social">
                                <ul class="footer-link gap-2 d-flex align-items-center">
                                    <li><a href="https://twitter.com/coinflipdotLOL" target="_blank"><i class="tw fab fa-twitter"></i></a></li>
                                    <li><a href="https://discord.gg/grvpc8c" target="_blank"><i class="in fab fa-discord"></i></a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </footer>
    `;
    footerContainer.innerHTML = footerHTML;
}

// Call the createFooter function to generate the header
createFooter();