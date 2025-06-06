// Initialization of data from localStorage or setting default values
let mainBalance = parseFloat(localStorage.getItem('mainBalance')) || 0;
let totalCoins = parseFloat(localStorage.getItem('totalCoins')) || 0;
let priceHistory = JSON.parse(localStorage.getItem('priceHistory')) || [];
let coinPrice = parseFloat(localStorage.getItem('coinPrice')) || 15.00;

// More complete price history for different time ranges
let extendedPriceHistory = JSON.parse(localStorage.getItem('extendedPriceHistory')) || [];
let selectedTimeRange = 7; // Default 7 days

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Appearance animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Auto-close after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function $(id) {
  return document.getElementById(id);
}

// Function to update balance
function updateBalance(amount) {
    const formattedAmount = parseFloat(amount);
    mainBalance += formattedAmount;
    localStorage.setItem('mainBalance', mainBalance);
    displayBalance();
    
    // Balance change animation
    animateBalanceChange(formattedAmount);
    
    showNotification(`Balance topped up by €${formattedAmount.toFixed(2)}`, 'success');
}

// Balance change animation
function animateBalanceChange(amount) {
    const balanceEl = $('currentBalance');
    balanceEl.classList.add('balance-change');
    
    // Create and animate element with amount
    const changeEl = document.createElement('span');
    changeEl.className = 'balance-change-amount';
    changeEl.textContent = `+€${amount.toFixed(2)}`;
    balanceEl.parentNode.appendChild(changeEl);
    
    // Remove animation and element after 1.5 seconds
    setTimeout(() => {
        balanceEl.classList.remove('balance-change');
        changeEl.classList.add('fade-out');
        setTimeout(() => {
            balanceEl.parentNode.removeChild(changeEl);
        }, 300);
    }, 1500);
}

// Function to display balance
function displayBalance() {
    const currentBalance = $('currentBalance');
    const totalCoinsDisplay = $('totalCoinsDisplay');
    const totalCoinValueDisplay = $('totalCoinValueDisplay');
    const liveCoinPrice = $('liveCoinPrice');
    const liveCoinPriceSell = $('liveCoinPriceSell');
    
    if (currentBalance) {
        currentBalance.textContent = `€${mainBalance.toFixed(2)}`;
        
        // Update classes for displaying positive/negative balance
        if (mainBalance > 0) {
            currentBalance.classList.add('positive-balance');
            currentBalance.classList.remove('negative-balance');
        } else if (mainBalance < 0) {
            currentBalance.classList.add('negative-balance');
            currentBalance.classList.remove('positive-balance');
        }
    }
    
    if (totalCoinsDisplay) {
        totalCoinsDisplay.textContent = totalCoins.toFixed(2);
    }
    
    if (totalCoinValueDisplay) {
        totalCoinValueDisplay.textContent = `€${(totalCoins * coinPrice).toFixed(2)}`;
    }
    
    if (liveCoinPrice) {
        liveCoinPrice.textContent = `€${coinPrice.toFixed(2)}`;
    }
    
    if (liveCoinPriceSell) {
        liveCoinPriceSell.textContent = `€${coinPrice.toFixed(2)}`;
    }
}

// Function to calculate number of coins
function calculateCoins() {
    const amount = parseFloat($('amount').value) || 0;
    const coinsToReceive = amount / coinPrice;
    $('coins').value = coinsToReceive.toFixed(2);
    
    // Calculation animation
    $('coins').classList.add('calculation-pulse');
    setTimeout(() => {
        $('coins').classList.remove('calculation-pulse');
    }, 500);
}

// Add function to calculate selling value
function calculateSellValue() {
    const coinsToSell = parseFloat($('sellCoins').value) || 0;
    const valueToReceive = coinsToSell * coinPrice;
    $('sellValue').value = valueToReceive.toFixed(2);
    
    // Calculation animation
    $('sellValue').classList.add('calculation-pulse');
    setTimeout(() => {
        $('sellValue').classList.remove('calculation-pulse');
    }, 500);
}

// Function to process coin purchase
function processTransaction(e) {
    e.preventDefault();
    const amount = parseFloat($('amount').value);
    
    if (!amount || amount <= 0) {
        showNotification('Please enter an amount greater than 0', 'error');
        shakeElement($('amount'));
        return;
    }
    
    if (amount > mainBalance) {
        showNotification('Insufficient funds in your balance', 'error');
        shakeElement($('amount'));
        return;
    }

    const coinsReceived = amount / coinPrice;
    
    // Deduct money from balance
    mainBalance -= amount;
    totalCoins += coinsReceived;

    // Save data
    localStorage.setItem('mainBalance', mainBalance);
    localStorage.setItem('totalCoins', totalCoins);

    // Add transaction to history
    const transaction = {
        date: new Date().toLocaleString(),
        type: 'buy', // Add transaction type for filtering
        amount: amount,
        coins: coinsReceived,
        price: coinPrice
    };
    
    addToTransactionHistory(transaction);
    updatePriceHistory();
    displayBalance();
    showNotification(`Bought ${coinsReceived.toFixed(2)} coins for €${amount.toFixed(2)}`, 'success');

    // Clear form
    $('amount').value = '';
    $('coins').value = '';
    
    // Successful purchase animation
    const buyButton = document.querySelector('.btn-buy');
    buyButton.classList.add('transaction-success');
    setTimeout(() => {
        buyButton.classList.remove('transaction-success');
    }, 1000);
    
    // Update profit/loss if analytics is available
    if (typeof updateProfitLoss === 'function') {
        updateProfitLoss();
    }
}

// Function to process coin selling
function processSellTransaction(e) {
    e.preventDefault();
    const coinsToSell = parseFloat($('sellCoins').value);
    
    // Check entered value
    if (!coinsToSell || isNaN(coinsToSell) || coinsToSell <= 0) {
        showNotification('Enter a positive number of coins', 'error');
        shakeElement($('sellCoins'));
        return;
    }
    
    // Get minimum allowed value from exchange.js if function is available
    let minValue = 0.01; // Default value
    if (typeof window.getMinimumValue === 'function') {
        minValue = window.getMinimumValue('arvirium');
    }
    
    if (coinsToSell < minValue) {
        // Use formatCurrencyValue if available
        let formattedMinValue = minValue.toFixed(2);
        if (typeof window.formatCurrencyValue === 'function') {
            formattedMinValue = window.formatCurrencyValue(minValue, 'arvirium');
        }
        showNotification(`Minimum selling amount ${formattedMinValue} ARV`, 'error');
        shakeElement($('sellCoins'));
        return;
    }
    
    if (coinsToSell > totalCoins) {
        showNotification('You don\'t have enough coins to sell', 'error');
        shakeElement($('sellCoins'));
        return;
    }

    const valueReceived = coinsToSell * coinPrice;
    
    // Update balances
    totalCoins -= coinsToSell;
    mainBalance += valueReceived;

    // Save data
    localStorage.setItem('totalCoins', totalCoins);
    localStorage.setItem('mainBalance', mainBalance);

    // Add transaction to history
    const transaction = {
        date: new Date().toLocaleString(),
        type: 'sell',
        amount: valueReceived,
        coins: coinsToSell,
        price: coinPrice
    };
    
    addToTransactionHistory(transaction);
    updatePriceHistory();
    displayBalance();
    showNotification(`Sold ${coinsToSell.toFixed(2)} coins for €${valueReceived.toFixed(2)}`, 'success');

    // Clear form
    $('sellCoins').value = '';
    $('sellValue').value = '';
    
    // Successful sale animation
    const sellButton = document.querySelector('.btn-sell');
    sellButton.classList.add('transaction-success');
    setTimeout(() => {
        sellButton.classList.remove('transaction-success');
    }, 1000);
}

// Function for "shake" animation of element on error
function shakeElement(element) {
    element.classList.add('shake-element');
    setTimeout(() => {
        element.classList.remove('shake-element');
    }, 600);
}

// Function to add transaction to history
function addToTransactionHistory(transaction) {
    const historyDiv = $('transaction-history');
    const transactionElement = document.createElement('div');
    transactionElement.className = 'transaction-item';
    transactionElement.innerHTML = `
        <p><i class="fas fa-clock"></i> ${transaction.date}</p>
        <p><i class="fas fa-money-bill-wave"></i> Spent: €${transaction.amount.toFixed(2)}</p>
        <p><i class="fas fa-coins"></i> Coins received: ${transaction.coins.toFixed(2)}</p>
        <p><i class="fas fa-tag"></i> Coin price: €${transaction.price.toFixed(2)}</p>
    `;
    
    // Animate appearance of new transaction
    transactionElement.style.opacity = '0';
    transactionElement.style.transform = 'translateX(-20px)';
    historyDiv.insertBefore(transactionElement, historyDiv.firstChild);
    
    setTimeout(() => {
        transactionElement.style.opacity = '1';
        transactionElement.style.transform = 'translateX(0)';
    }, 10);
    
    // Save transaction history to localStorage
    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    transactions.unshift(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Function to update price history
function updatePriceHistory() {
    const now = new Date();
    
    // Add to extended price history (used for different time ranges)
    extendedPriceHistory.push({
        timestamp: now.getTime(),
        date: now.toLocaleDateString(),
        price: parseFloat(coinPrice.toFixed(2))
    });
    
    // Limit extendedPriceHistory to 90 days (or whatever your max range is)
    const maxDays = 90;
    const oneDayMs = 24 * 60 * 60 * 1000;
    const cutoffTime = now.getTime() - (maxDays * oneDayMs);
    
    extendedPriceHistory = extendedPriceHistory.filter(entry => entry.timestamp >= cutoffTime);
    localStorage.setItem('extendedPriceHistory', JSON.stringify(extendedPriceHistory));
    
    // Also maintain the original 7-day priceHistory for backward compatibility
    priceHistory = getFilteredPriceHistory(7);
    localStorage.setItem('priceHistory', JSON.stringify(priceHistory));
    
    updatePriceChart();
}

// Get filtered price history based on selected time range
function getFilteredPriceHistory(days) {
    const now = new Date();
    const cutoffTime = now.getTime() - (days * 24 * 60 * 60 * 1000);
    
    // Filter history to get entries newer than cutoff time
    return extendedPriceHistory
        .filter(entry => entry.timestamp >= cutoffTime)
        .map(entry => ({
            date: entry.date,
            price: entry.price
        }));
}

// Handle time range change
function handleTimeRangeChange() {
    const timeRangeSelect = document.getElementById('timeRange');
    if (timeRangeSelect) {
        timeRangeSelect.addEventListener('change', () => {
            selectedTimeRange = parseInt(timeRangeSelect.value);
            updatePriceChart();
        });
    }
}

// Function to update price chart
function updatePriceChart() {
    const priceChartEl = $('priceChart');
    if (!priceChartEl) return;
    
    const ctx = priceChartEl.getContext('2d');
    
    // Set fixed height for canvas to avoid size problems
    priceChartEl.height = 300;
    
    // Get data based on selected time range
    const filteredData = getFilteredPriceHistory(selectedTimeRange);
    
    // If chart already exists, destroy it
    if (window.priceChartInstance) {
        window.priceChartInstance.destroy();
    }
    
    // If no data, display placeholder
    if (filteredData.length === 0) {
        ctx.font = '16px Montserrat';
        ctx.fillStyle = '#f8f9fa';
        ctx.textAlign = 'center';
        ctx.fillText('No price data available for this time period', ctx.canvas.width / 2, ctx.canvas.height / 2);
        return;
    }
    
    // Gradient for chart
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(218, 165, 32, 0.6)');
    gradient.addColorStop(1, 'rgba(218, 165, 32, 0)');
    
    // Format data for display on chart
    const chartData = filteredData.map(item => ({
        date: item.date,
        price: parseFloat(item.price.toFixed(2))
    }));
    
    window.priceChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.map(item => item.date),
            datasets: [{
                label: 'Coin price (€)',
                data: chartData.map(item => item.price),
                borderColor: '#daa520',
                borderWidth: 3,
                pointBackgroundColor: '#daa520',
                pointBorderColor: '#fff',
                pointRadius: 5,
                pointHoverRadius: 7,
                tension: 0.3,
                backgroundColor: gradient,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,  // width to height ratio 2:1
            plugins: {
                legend: {
                    labels: {
                        color: '#f8f9fa',
                        font: {
                            family: "'Montserrat', sans-serif",
                            size: 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(26, 26, 46, 0.9)',
                    titleColor: '#daa520',
                    bodyColor: '#f8f9fa',
                    borderColor: '#daa520',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false,
                    titleFont: {
                        family: "'Playfair Display', serif",
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        family: "'Montserrat', sans-serif",
                        size: 12
                    },
                    callbacks: {
                        label: function(context) {
                            return `Price: €${parseFloat(context.raw).toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#bdbdbd',
                        font: {
                            family: "'Montserrat', sans-serif"
                        },
                        callback: function(value) {
                            return '€' + parseFloat(value).toFixed(2);
                        }
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#bdbdbd',
                        font: {
                            family: "'Montserrat', sans-serif"
                        }
                    }
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeOutQuart'
            }
        }
    });
}

// Function for random price update
function updateCoinPrice() {
    // Save old price for comparison
    const oldPrice = coinPrice;
    
    // Generate random change from -0.5 to 0.5
    const change = (Math.random() - 0.5) * 1;
    coinPrice = parseFloat((coinPrice + change).toFixed(2));
    
    // Protection against too low price
    if (coinPrice < 5) coinPrice = 5;
    // Protection against too high price
    if (coinPrice > 25) coinPrice = 25;
    
    // Save new price
    localStorage.setItem('coinPrice', coinPrice);
    
    // Update display
    displayBalance();
    updatePriceHistory();
    
    // Price change animation
    const priceElement = $('liveCoinPrice');
    if (coinPrice > oldPrice) {
        priceElement.classList.add('price-up');
        setTimeout(() => {
            priceElement.classList.remove('price-up');
        }, 1000);
    } else if (coinPrice < oldPrice) {
        priceElement.classList.add('price-down');
        setTimeout(() => {
            priceElement.classList.remove('price-down');
        }, 1000);
    }
    
    // Price change notification
    const changeDirection = change >= 0 ? 'increased' : 'decreased';
    showNotification(`Coin price ${changeDirection} to €${coinPrice.toFixed(2)}`, 'info');
    
    // Dispatch event for other components to react to price change
    document.dispatchEvent(new CustomEvent('coinPriceUpdated', { detail: { price: coinPrice } }));
    
    // Also update sell price display if it exists
    const sellPriceDisplay = $('liveCoinPriceSell');
    if (sellPriceDisplay) {
        sellPriceDisplay.textContent = `€${coinPrice.toFixed(2)}`;
        
        // Apply the same animation to sell price display
        if (coinPrice > oldPrice) {
            sellPriceDisplay.classList.add('price-up');
            setTimeout(() => {
                sellPriceDisplay.classList.remove('price-up');
            }, 1000);
        } else if (coinPrice < oldPrice) {
            sellPriceDisplay.classList.add('price-down');
            setTimeout(() => {
                sellPriceDisplay.classList.remove('price-down');
            }, 1000);
        }
    }
}

// Load saved transactions
function loadTransactions() {
    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    const historyDiv = $('transaction-history');
    
    if (!historyDiv) {
        console.error('Transaction history container not found');
        return;
    }
    
    historyDiv.innerHTML = ''; // Clear history
    
    if (transactions.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <i class="fas fa-history fa-2x"></i>
            <p>Transaction history is empty</p>
            <p class="empty-state-subtitle">Buy coins to see history</p>
        `;
        historyDiv.appendChild(emptyState);
        return;
    }
    
    transactions.forEach((transaction, index) => {
        if (!transaction) return; // Check for null or undefined
        
        const transactionElement = document.createElement('div');
        transactionElement.className = 'transaction-item';
        transactionElement.style.animationDelay = `${index * 0.1}s`;
        
        // Determine transaction type and display appropriate content
        if (!transaction.type || transaction.type === 'buy') {
            // Buy transaction
            transactionElement.innerHTML = `
                <p><i class="fas fa-clock"></i> ${transaction.date}</p>
                <p><i class="fas fa-money-bill-wave"></i> Spent: €${transaction.amount.toFixed(2)}</p>
                <p><i class="fas fa-coins"></i> Coins received: ${transaction.coins.toFixed(2)}</p>
                <p><i class="fas fa-tag"></i> Coin price: €${transaction.price.toFixed(2)}</p>
            `;
        } else if (transaction.type === 'sell') {
            // Sell transaction
            transactionElement.innerHTML = `
                <p><i class="fas fa-clock"></i> ${transaction.date}</p>
                <p><i class="fas fa-hand-holding-usd"></i> Sold: ${transaction.coins.toFixed(2)} coins</p>
                <p><i class="fas fa-money-bill-wave"></i> Received: €${transaction.amount.toFixed(2)}</p>
                <p><i class="fas fa-tag"></i> Coin price: €${transaction.price.toFixed(2)}</p>
            `;
        } else if (transaction.type === 'exchange') {
            // Exchange transaction - use formatCurrencyValue if available
            const fromSymbol = getCurrencySymbol(transaction.fromCurrency);
            const toSymbol = getCurrencySymbol(transaction.toCurrency);
            
            let fromAmountFormatted, toAmountFormatted, rateFormatted;
            
            // Use global formatCurrencyValue function if available
            if (typeof window.formatCurrencyValue === 'function') {
                fromAmountFormatted = window.formatCurrencyValue(transaction.fromAmount, transaction.fromCurrency);
                toAmountFormatted = window.formatCurrencyValue(transaction.toAmount, transaction.toCurrency);
                
                // Calculate exchange rate
                const rate = transaction.fromAmount === 0 ? 0 : transaction.toAmount / transaction.fromAmount;
                rateFormatted = window.formatCurrencyValue(rate, transaction.toCurrency);
            } else {
                // Fallback if function is unavailable
                fromAmountFormatted = transaction.fromAmount.toFixed(getDecimalPlaces(transaction.fromCurrency));
                toAmountFormatted = transaction.toAmount.toFixed(getDecimalPlaces(transaction.toCurrency));
                
                const rate = transaction.fromAmount === 0 ? 0 : transaction.toAmount / transaction.fromAmount;
                rateFormatted = rate.toFixed(getDecimalPlaces(transaction.toCurrency));
            }
            
            transactionElement.innerHTML = `
                <p><i class="fas fa-clock"></i> ${transaction.date}</p>
                <p><i class="fas fa-exchange-alt"></i> Exchange: ${fromAmountFormatted} ${fromSymbol}</p>
                <p><i class="fas fa-arrow-right"></i> To: ${toAmountFormatted} ${toSymbol}</p>
                <p><i class="fas fa-tag"></i> Rate: 1 ${fromSymbol} = ${rateFormatted} ${toSymbol}</p>
            `;
        }
        
        historyDiv.appendChild(transactionElement);
    });
}

// Functions for currency formatting (used with exchange transactions)
function getDecimalPlaces(currency) {
    if (!currency) return 2;
    switch(currency) {
        case 'bitcoin': return 8;
        case 'ethereum': return 6;
        case 'arvirium': return 2;
        case 'euro': return 2;
        default: return 2;
    }
}

function getCurrencySymbol(currency) {
    if (!currency) return '';
    switch(currency) {
        case 'bitcoin': return 'BTC';
        case 'ethereum': return 'ETH';
        case 'arvirium': return 'ARV';
        case 'euro': return 'EUR';
        default: return currency.toUpperCase();
    }
}

// Initialize event handlers
document.addEventListener('DOMContentLoaded', () => {
    // Add CSS animations programmatically
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .balance-change {
            animation: pulse 1.5s ease;
        }
        
        .balance-change-amount {
            position: absolute;
            color: #10b981;
            font-weight: 700;
            right: 10px;
            top: 0;
            animation: float-up 1.5s ease forwards;
            opacity: 0;
        }
        
        .fade-out {
            opacity: 0;
            transition: opacity 0.3s;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        
        @keyframes float-up {
            0% { transform: translateY(0); opacity: 0; }
            20% { opacity: 1; }
            80% { opacity: 1; }
            100% { transform: translateY(-20px); opacity: 0; }
        }
        
        .calculation-pulse {
            animation: calculation-flash 0.5s ease;
        }
        
        @keyframes calculation-flash {
            0% { background-color: rgba(0, 0, 0, 0.2); }
            50% { background-color: rgba(218, 165, 32, 0.2); }
            100% { background-color: rgba(0, 0, 0, 0.2); }
        }
        
        .transaction-success {
            animation: success-pulse 1s ease;
        }
        
        @keyframes success-pulse {
            0% { transform: translateY(0); }
            50% { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(16, 185, 129, 0.4); }
            100% { transform: translateY(0); }
        }
        
        .shake-element {
            animation: shake 0.6s ease-in-out;
        }
        
        .price-up {
            color: #10b981 !important;
            animation: price-change 1s ease;
        }
        
        .price-down {
            color: #ef4444 !important;
            animation: price-change 1s ease;
        }
        
        @keyframes price-change {
            0% { transform: scale(1); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
        }
        
        .positive-balance {
            color: #10b981;
        }
        
        .negative-balance {
            color: #ef4444;
        }
        
        .empty-state {
            text-align: center;
            padding: 2rem;
            color: var(--color-gray-500);
        }
        
        .empty-state i {
            margin-bottom: 1rem;
            opacity: 0.5;
        }
        
        .empty-state-subtitle {
            font-size: 0.875rem;
            color: var(--color-gray-600);
        }
    `;
    document.head.appendChild(styleElement);

    // Initialize time range selector handler
    handleTimeRangeChange();

    // Check and fix price history on load
    if (priceHistory.length > 0) {
        priceHistory = priceHistory.map(item => ({
            date: item.date,
            price: parseFloat(parseFloat(item.price).toFixed(2))
        }));
        localStorage.setItem('priceHistory', JSON.stringify(priceHistory));
    }
    
    // Migrate old price history to extended format if needed
    if (extendedPriceHistory.length === 0 && priceHistory.length > 0) {
        // Create timestamps for existing entries (approximate)
        const now = new Date();
        const oneDayMs = 24 * 60 * 60 * 1000;
        
        extendedPriceHistory = priceHistory.map((item, index) => {
            const daysAgo = priceHistory.length - 1 - index;
            return {
                timestamp: now.getTime() - (daysAgo * oneDayMs),
                date: item.date,
                price: item.price
            };
        });
        
        localStorage.setItem('extendedPriceHistory', JSON.stringify(extendedPriceHistory));
    }

    displayBalance();
    updatePriceChart();
    loadTransactions();

    // Check element existence before adding handlers
    const balanceForm = $('balance-form');
    if (balanceForm) {
        balanceForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const balanceAmount = $('balanceAmount');
            if (!balanceAmount) return;
            
            const amount = parseFloat(balanceAmount.value);
            if (amount > 0) {
                updateBalance(amount);
                balanceAmount.value = '';
            } else {
                showNotification('Enter an amount greater than 0', 'error');
                shakeElement(balanceAmount);
            }
        });
    }

    // Buy form handler
    const walletForm = $('wallet-form');
    if (walletForm) {
        walletForm.addEventListener('submit', processTransaction);
    }
    
    // Sell form handler
    const sellForm = $('sell-form');
    if (sellForm) {
        sellForm.addEventListener('submit', processSellTransaction);
    }
    
    // Initialize calculation function for selling if element exists
    const sellCoinsEl = $('sellCoins');
    if (sellCoinsEl) {
        sellCoinsEl.addEventListener('input', calculateSellValue);
    }
    
    // Make sure all necessary HTML elements exist before updating their content
    displayBalance();
    
    // Start price update every 30 seconds only if not in test mode
    let intervalId = null;
    
    function startPriceUpdates() {
        if (intervalId !== null) return; // Prevent multiple intervals
        
        updateCoinPrice(); // Update price immediately
        intervalId = setInterval(updateCoinPrice, 30000);
    }
    
    function stopPriceUpdates() {
        if (intervalId !== null) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }
    
    // Start price updates
    startPriceUpdates();
    
    // If page becomes inactive, stop updates
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopPriceUpdates();
        } else {
            startPriceUpdates();
        }
    });
    
    // Smooth appearance animation for all elements
    document.querySelectorAll('.premium-card').forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100 + index * 200);
    });
});