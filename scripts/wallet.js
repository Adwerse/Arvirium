// Wallet functionality
document.addEventListener('DOMContentLoaded', () => {
    // Check if global variables are available, if not - get them from localStorage
    if (typeof totalCoins === 'undefined') {
        window.totalCoins = parseFloat(localStorage.getItem('totalCoins')) || 0;
    }
    
    if (typeof coinPrice === 'undefined') {
        window.coinPrice = parseFloat(localStorage.getItem('coinPrice')) || 15.00;
    }
    
    // Initialize crypto balances from localStorage or set default values
    let btcBalance = parseFloat(localStorage.getItem('btcBalance')) || 0;
    let ethBalance = parseFloat(localStorage.getItem('ethBalance')) || 0;

    // Get current exchange rates used in exchange.js
    function getExchangeRates() {
        // Base rates from exchange.js
        const btcRate = 0.0000012; // 1 ARV = 0.0000012 BTC
        const ethRate = 0.000018;  // 1 ARV = 0.000018 ETH
        
        // Inverse rates for getting value in ARV
        const btcToArvRate = 1 / btcRate; // 1 BTC = X ARV
        const ethToArvRate = 1 / ethRate; // 1 ETH = X ARV
        
        // Value in euros through ARV
        const btcEurRate = btcToArvRate * coinPrice; // 1 BTC = X EUR
        const ethEurRate = ethToArvRate * coinPrice; // 1 ETH = X EUR
        
        return {
            btcRate,
            ethRate,
            btcEurRate,
            ethEurRate
        };
    }

    // Function to update wallet display
    function updateWalletDisplay() {
        // Update ARV display
        const totalCoinsDisplay = document.getElementById('totalCoinsDisplay');
        const totalCoinValueDisplay = document.getElementById('totalCoinValueDisplay');
        
        if (totalCoinsDisplay) {
            totalCoinsDisplay.textContent = totalCoins.toFixed(2);
        }
        
        if (totalCoinValueDisplay) {
            totalCoinValueDisplay.textContent = `€${(totalCoins * coinPrice).toFixed(2)}`;
        }

        // Get current exchange rates
        const rates = getExchangeRates();

        // Update BTC display
        const btcBalanceEl = document.getElementById('btcBalance');
        const btcValueEl = document.getElementById('btcValue');
        
        if (btcBalanceEl && btcValueEl) {
            const btcValue = btcBalance * rates.btcEurRate;
            
            btcBalanceEl.textContent = btcBalance.toFixed(8);
            btcValueEl.textContent = `€${btcValue.toFixed(2)}`;
        }

        // Update ETH display
        const ethBalanceEl = document.getElementById('ethBalance');
        const ethValueEl = document.getElementById('ethValue');
        
        if (ethBalanceEl && ethValueEl) {
            const ethValue = ethBalance * rates.ethEurRate;
            
            ethBalanceEl.textContent = ethBalance.toFixed(6);
            ethValueEl.textContent = `€${ethValue.toFixed(2)}`;
        }

        // Update total portfolio value
        updatePortfolioValue();
        
        // Update portfolio chart
        updatePortfolioChart();
    }

    // Function to calculate and update total portfolio value
    function updatePortfolioValue() {
        const totalPortfolioValueEl = document.getElementById('totalPortfolioValue');
        if (!totalPortfolioValueEl) return;
        
        // Get current exchange rates
        const rates = getExchangeRates();
        
        // Calculate values for each currency
        const arvValue = totalCoins * coinPrice;
        const btcValue = btcBalance * rates.btcEurRate;
        const ethValue = ethBalance * rates.ethEurRate;
        
        // Calculate total
        const totalValue = arvValue + btcValue + ethValue;
        
        totalPortfolioValueEl.textContent = `€${totalValue.toFixed(2)}`;
    }

    // Function to update the portfolio distribution chart
    function updatePortfolioChart() {
        const canvas = document.getElementById('portfolioChart');
        if (!canvas) return;
        
        // Check drawing context
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Could not get canvas context');
            return;
        }
        
        // Check if Chart.js library is available
        if (typeof Chart === 'undefined') {
            console.error('Chart.js is not loaded');
            return;
        }
        
        // Set fixed sizes for canvas
        canvas.height = 300;
        canvas.width = canvas.parentElement.clientWidth || 400;
        
        // Get current exchange rates
        const rates = getExchangeRates();
        
        // Calculate values for each currency
        const arvValue = totalCoins * coinPrice;
        const btcValue = btcBalance * rates.btcEurRate;
        const ethValue = ethBalance * rates.ethEurRate;
        
        // Debug message for calculation verification
        console.log(`Portfolio values - ARV: €${arvValue.toFixed(2)}, BTC: €${btcValue.toFixed(2)}, ETH: €${ethValue.toFixed(2)}`);
        console.log(`ETH calculation: ${ethBalance} ETH * ${rates.ethEurRate} EUR/ETH = €${ethValue.toFixed(2)}`);
        
        // Calculate total
        const totalValue = arvValue + btcValue + ethValue;
        
        // If no assets, show placeholder
        if (totalValue === 0) {
            // Clear the canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Display placeholder text
            ctx.font = '16px Montserrat';
            ctx.fillStyle = '#f8f9fa';
            ctx.textAlign = 'center';
            ctx.fillText('No assets yet', canvas.width / 2, canvas.height / 2);
            return;
        }
        
        // Prepare data for chart
        const data = {
            labels: ['Arvirium', 'Bitcoin', 'Ethereum'],
            datasets: [{
                data: [
                    arvValue > 0 ? arvValue : 0,
                    btcValue > 0 ? btcValue : 0,
                    ethValue > 0 ? ethValue : 0
                ],
                backgroundColor: [
                    '#daa520', // Gold for Arvirium
                    '#f2a900', // Bitcoin orange
                    '#62688f'  // Ethereum blue-gray
                ],
                borderColor: 'rgba(26, 26, 46, 0.8)',
                borderWidth: 2
            }]
        };
        
        // Destroy previous chart if it exists
        if (window.portfolioChartInstance) {
            window.portfolioChartInstance.destroy();
        }
        
        // Create new chart with fixed dimensions
        window.portfolioChartInstance = new Chart(ctx, {
            type: 'doughnut', // Change to doughnut for better display
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false, // Important to prevent flattening
                cutout: '60%', // For doughnut chart
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#f8f9fa',
                            font: {
                                family: "'Montserrat', sans-serif",
                                size: 12
                            },
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(26, 26, 46, 0.9)',
                        titleColor: '#f8f9fa',
                        bodyColor: '#f8f9fa',
                        borderColor: '#daa520',
                        borderWidth: 1,
                        padding: 10,
                        titleFont: {
                            family: "'Montserrat', sans-serif",
                            size: 14,
                            weight: 'bold'
                        },
                        bodyFont: {
                            family: "'Montserrat', sans-serif",
                            size: 12
                        },
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw ? `€${context.raw.toFixed(2)}` : '';
                                const percentage = context.raw && totalValue ? 
                                    ` (${((context.raw / totalValue) * 100).toFixed(1)}%)` : '';
                                return `${label}: ${value}${percentage}`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
    }

    // Listen for exchange events to update crypto balances
    document.addEventListener('exchangeCompleted', (e) => {
        const transaction = e.detail;
        
        // Update BTC balance if BTC was exchanged
        if (transaction.fromCurrency === 'bitcoin') {
            btcBalance -= transaction.fromAmount;
            localStorage.setItem('btcBalance', btcBalance);
        } else if (transaction.toCurrency === 'bitcoin') {
            btcBalance += transaction.toAmount;
            localStorage.setItem('btcBalance', btcBalance);
        }
        
        // Update ETH balance if ETH was exchanged
        if (transaction.fromCurrency === 'ethereum') {
            ethBalance -= transaction.fromAmount;
            localStorage.setItem('ethBalance', ethBalance);
        } else if (transaction.toCurrency === 'ethereum') {
            ethBalance += transaction.toAmount;
            localStorage.setItem('ethBalance', ethBalance);
        }
        
        // Update ARV if needed
        if (transaction.fromCurrency === 'arvirium' || transaction.toCurrency === 'arvirium') {
            // Update totalCoins from localStorage as it might have been changed in exchange.js
            totalCoins = parseFloat(localStorage.getItem('totalCoins')) || 0;
        }
        
        // Update wallet display
        updateWalletDisplay();
    });

    // Listen for coin price updates
    document.addEventListener('coinPriceUpdated', (e) => {
        // Update local coinPrice variable
        if (e.detail && e.detail.price) {
            coinPrice = e.detail.price;
        } else {
            // If detail.price is not provided, take it from localStorage
            coinPrice = parseFloat(localStorage.getItem('coinPrice')) || coinPrice;
        }
        updateWalletDisplay();
    });

    // Initial update
    updateWalletDisplay();

    // Add CSS for wallet section
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .wallet-summary {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }
        
        .coin-balance-item {
            display: flex;
            align-items: center;
            padding: 1rem;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 10px;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .coin-balance-item:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }
        
        .main-coin {
            background: linear-gradient(135deg, rgba(218, 165, 32, 0.2), rgba(0, 0, 0, 0.3));
            border: 1px solid rgba(218, 165, 32, 0.3);
        }
        
        .coin-icon {
            width: 50px;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 50%;
            margin-right: 1rem;
            font-size: 1.5rem;
            color: var(--color-primary);
        }
        
        .coin-details {
            flex: 1;
        }
        
        .coin-details h4 {
            margin: 0 0 0.5rem 0;
            font-size: 1.1rem;
        }
        
        .coin-amount {
            font-size: 1.5rem;
            font-weight: 700;
            margin: 0;
            color: #f8f9fa;
        }
        
        .coin-value {
            font-size: 1rem;
            color: var(--color-gray-400);
            margin: 0.25rem 0 0 0;
        }
        
        .portfolio-stats {
            display: flex;
            flex-direction: column;
            height: 100%;
        }
        
        .portfolio-total {
            text-align: center;
            margin-bottom: 1.5rem;
        }
        
        .portfolio-total h4 {
            margin: 0 0 0.5rem 0;
            font-size: 1rem;
            color: var(--color-gray-400);
        }
        
        .portfolio-value {
            font-size: 2rem;
            font-weight: 700;
            margin: 0;
            color: var(--color-primary);
        }
        
        .portfolio-chart-container {
            flex: 1;
            position: relative;
            height: 300px;
            min-height: 300px;
            max-height: 300px;
        }
    `;
    document.head.appendChild(styleElement);
});

// Update exchange.js to dispatch events when exchanges are completed
// This can be integrated later directly in exchange.js
// For now, we'll patch the functionality in this file
const originalExchangeJS = document.querySelector('script[src="/scripts/exchange.js"]');
if (originalExchangeJS) {
    originalExchangeJS.addEventListener('load', () => {
        // Check if the processExchange function exists
        if (typeof processExchange === 'function') {
            // Store the original function
            const originalProcessExchange = processExchange;
            
            // Override with our patched version
            window.processExchange = function(fromCurrency, toCurrency, fromAmount, toAmount) {
                // Call the original function
                originalProcessExchange(fromCurrency, toCurrency, fromAmount, toAmount);
                
                // Dispatch our custom event
                document.dispatchEvent(new CustomEvent('exchangeCompleted', { 
                    detail: {
                        fromCurrency,
                        toCurrency,
                        fromAmount,
                        toAmount
                    }
                }));
            };
        }
    });
} 