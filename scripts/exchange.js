// Currency exchange functionality
document.addEventListener('DOMContentLoaded', () => {
  // Check global variables and load from localStorage if necessary
  if (typeof coinPrice === 'undefined') {
    window.coinPrice = parseFloat(localStorage.getItem('coinPrice')) || 15.00;
  }
  
  if (typeof totalCoins === 'undefined') {
    window.totalCoins = parseFloat(localStorage.getItem('totalCoins')) || 0;
  }
  
  if (typeof mainBalance === 'undefined') {
    window.mainBalance = parseFloat(localStorage.getItem('mainBalance')) || 0;
  }
  
  // Cryptocurrency balance initialization
  if (typeof bitcoinBalance === 'undefined') {
    window.bitcoinBalance = parseFloat(localStorage.getItem('btcBalance')) || 0;
  }
  
  if (typeof ethereumBalance === 'undefined') {
    window.ethereumBalance = parseFloat(localStorage.getItem('ethBalance')) || 0;
  }

  // Function to get current exchange rates
  function getCurrentExchangeRates() {
    return {
      arvirium: 1,
      bitcoin: 0.0000012,
      ethereum: 0.000018,
      euro: coinPrice // Dynamic value based on current coin price
    };
  }
  
  // Helper function for safely getting DOM elements
  function $(id) {
    return document.getElementById(id);
  }
  
  // DOM elements - using safe getter
  const fromAmount = $('fromAmount');
  const fromCurrency = $('fromCurrency');
  const toAmount = $('toAmount');
  const toCurrency = $('toCurrency');
  const exchangeRate = $('exchangeRate');
  const switchCurrenciesBtn = $('switchCurrencies');
  const exchangeForm = $('exchange-form');
  
  // Check existence of all necessary elements
  if (!fromAmount || !fromCurrency || !toAmount || !toCurrency || !exchangeRate || !switchCurrenciesBtn) {
    console.error('Some necessary elements are missing from the exchange form');
    return; // Early exit if elements are missing
  }
  
  // Special check for exchange form
  if (!exchangeForm) {
    console.error('Exchange form not found. Binding exchange button directly.');
    
    // Find exchange button by class
    const exchangeButton = document.querySelector('.btn-exchange');
    if (exchangeButton) {
      exchangeButton.addEventListener('click', function(e) {
        e.preventDefault();
        processExchangeHandler(e);
      });
    } else {
      console.error('Exchange button not found');
      return;
    }
  } else {
    // Form found, bind submit event
    exchangeForm.addEventListener('submit', processExchangeHandler);
  }
  
  // Get minimum allowed value depending on currency
  function getMinimumValue(currency) {
    switch(currency) {
      case 'bitcoin':
        return 0.00000001; // 1 satoshi
      case 'ethereum':
        return 0.000001;   // Minimum value for ETH
      case 'arvirium':
        return 0.01;       // Regular value for ARV
      case 'euro':
        return 0.01;       // Regular value for EUR
      default:
        return 0.01;
    }
  }
  
  // Get appropriate number of decimal places depending on currency
  function getDecimalPlaces(currency) {
    switch(currency) {
      case 'bitcoin':
        return 8;
      case 'ethereum':
        return 6;
      case 'arvirium':
        return 2;
      case 'euro':
        return 2;
      default:
        return 2;
    }
  }
  
  // Get currency symbol
  function getCurrencySymbol(currency) {
    switch(currency) {
      case 'bitcoin':
        return 'BTC';
      case 'ethereum':
        return 'ETH';
      case 'arvirium':
        return 'ARV';
      case 'euro':
        return 'EUR';
      default:
        return currency.toUpperCase();
    }
  }
  
  // Formats currency value considering currency specifics
  function formatCurrencyValue(value, currency) {
    // If value is too small, use scientific notation
    const decimalPlaces = getDecimalPlaces(currency);
    
    if (currency === 'bitcoin') {
      // For Bitcoin: if value is too small, use scientific notation
      return value < 0.00001 ? value.toExponential(8) : value.toFixed(8);
    } else if (currency === 'ethereum') {
      // For Ethereum: if value is too small, use scientific notation
      return value < 0.0001 ? value.toExponential(6) : value.toFixed(6);
    } else {
      // For other currencies: fixed number of decimal places
      return value.toFixed(2);
    }
  }
  
  // Update exchange rates display in rate cards
  function updateRateDisplays() {
    const rates = getCurrentExchangeRates();
    const rateCards = document.querySelectorAll('.rate-card');
    
    if (rateCards.length >= 3) {
      // Bitcoin rate
      const btcValueEl = rateCards[0].querySelector('.rate-value');
      if (btcValueEl) {
        btcValueEl.textContent = `1 ARV = ${formatCurrencyValue(rates.bitcoin, 'bitcoin')} BTC`;
      }
      
      // Ethereum rate
      const ethValueEl = rateCards[1].querySelector('.rate-value');
      if (ethValueEl) {
        ethValueEl.textContent = `1 ARV = ${formatCurrencyValue(rates.ethereum, 'ethereum')} ETH`;
      }
      
      // Euro rate
      const euroValueEl = rateCards[2].querySelector('.rate-value');
      if (euroValueEl) {
        euroValueEl.textContent = `1 ARV = ${formatCurrencyValue(rates.euro, 'euro')} EUR`;
      }
    }
  }
  
  // Initialize exchange display
  calculateExchange();
  updateExchangeRateDisplay();
  updateRateDisplays();
  
  // Subscribe to coin price updates
  document.addEventListener('coinPriceUpdated', (e) => {
    // Update coinPrice if detail is provided
    if (e.detail && e.detail.price) {
      coinPrice = e.detail.price;
    }
    calculateExchange();
    updateExchangeRateDisplay();
    updateRateDisplays();
  });
  
  // Event handlers
  fromAmount.addEventListener('input', calculateExchange);
  fromCurrency.addEventListener('change', () => {
    calculateExchange();
    updateExchangeRateDisplay();
  });
  toCurrency.addEventListener('change', () => {
    calculateExchange();
    updateExchangeRateDisplay();
  });
  
  // Currency switch button
  switchCurrenciesBtn.addEventListener('click', () => {
    const tempCurrency = fromCurrency.value;
    fromCurrency.value = toCurrency.value;
    toCurrency.value = tempCurrency;
    
    calculateExchange();
    updateExchangeRateDisplay();
    
    // Animation for button
    switchCurrenciesBtn.style.transform = 'rotate(180deg)';
    setTimeout(() => {
      switchCurrenciesBtn.style.transform = 'rotate(0deg)';
    }, 300);
  });
  
  // Make sure element shake function exists
  function shakeElement(element) {
    if (!element) return;
    element.classList.add('shake-element');
    setTimeout(() => {
      element.classList.remove('shake-element');
    }, 600);
  }
  
  // Make sure showNotification function exists
  if (typeof showNotification !== 'function') {
    window.showNotification = function(message, type = 'info') {
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
    };
  }
  
  // Handle exchange form submission
  function processExchangeHandler(e) {
    e.preventDefault();
    
    const fromCurrencyValue = fromCurrency.value;
    const toCurrencyValue = toCurrency.value;
    let fromAmountValue = parseFloat(fromAmount.value);
    let toAmountValue = parseFloat(toAmount.value || '0');
    
    // Check entered value
    if (!fromAmountValue || isNaN(fromAmountValue) || fromAmountValue <= 0) {
      showNotification(`Enter a positive number`, 'error');
      shakeElement(fromAmount);
      return;
    }
    
    // Check minimum value for source currency
    const minValue = getMinimumValue(fromCurrencyValue);
    if (fromAmountValue < minValue) {
      showNotification(`Minimum amount for ${getCurrencySymbol(fromCurrencyValue)} - ${formatCurrencyValue(minValue, fromCurrencyValue)}`, 'error');
      shakeElement(fromAmount);
      return;
    }
    
    // Check minimum value for target currency
    const minTargetValue = getMinimumValue(toCurrencyValue);
    if (toAmountValue < minTargetValue) {
      showNotification(`Result amount (${formatCurrencyValue(toAmountValue, toCurrencyValue)} ${getCurrencySymbol(toCurrencyValue)}) is too small. Try exchanging more.`, 'error');
      shakeElement(fromAmount);
      return;
    }
    
    // Check if user has enough currency for exchange
    let insufficientFunds = false;
    let availableBalance = 0;
    
    // Determine balance for source currency
    switch(fromCurrencyValue) {
      case 'arvirium':
        availableBalance = totalCoins;
        insufficientFunds = fromAmountValue > totalCoins;
        break;
      case 'euro':
        availableBalance = mainBalance;
        insufficientFunds = fromAmountValue > mainBalance;
        break;
      case 'bitcoin':
        availableBalance = bitcoinBalance;
        insufficientFunds = fromAmountValue > bitcoinBalance;
        break;
      case 'ethereum':
        availableBalance = ethereumBalance;
        insufficientFunds = fromAmountValue > ethereumBalance;
        break;
    }
    
    if (insufficientFunds) {
      showNotification(`Insufficient funds. Available: ${formatCurrencyValue(availableBalance, fromCurrencyValue)} ${getCurrencySymbol(fromCurrencyValue)}`, 'error');
      shakeElement(fromAmount);
      return;
    }
    
    // Process exchange
    processExchange(fromCurrencyValue, toCurrencyValue, fromAmountValue, toAmountValue);
    
    // Clear form
    fromAmount.value = '';
    toAmount.value = '';
    
    // Button animation
    const exchangeButton = document.querySelector('.btn-exchange');
    if (exchangeButton) {
      exchangeButton.classList.add('transaction-success');
      setTimeout(() => {
        exchangeButton.classList.remove('transaction-success');
      }, 1000);
    }
  }
  
  // Calculate exchange amounts
  function calculateExchange() {
    if (!fromAmount || !toAmount) return;
    
    const amount = parseFloat(fromAmount.value) || 0;
    const from = fromCurrency.value;
    const to = toCurrency.value;
    
    // Get current rates
    const rates = getCurrentExchangeRates();
    
    // Handle potential division by zero
    if (rates[from] === 0) {
      toAmount.value = '0';
      return;
    }
    
    // Convert to base currency (Arvirium), then to target currency
    const amountInArvirium = amount / rates[from];
    const convertedAmount = amountInArvirium * rates[to];
    
    // Use formatCurrencyValue for value display
    if (convertedAmount === 0 || isNaN(convertedAmount)) {
      toAmount.value = '0';
    } else {
      toAmount.value = formatCurrencyValue(convertedAmount, to);
    }
  }
  
  // Update exchange rate display
  function updateExchangeRateDisplay() {
    const from = fromCurrency.value;
    const to = toCurrency.value;
    
    // Get current rates
    const rates = getCurrentExchangeRates();
    
    // Handle potential division by zero
    if (rates[from] === 0) {
      exchangeRate.textContent = 'Rate unavailable';
      return;
    }
    
    let rateValue;
    
    if (from === to) {
      rateValue = 1;
    } else if (from === 'arvirium') {
      rateValue = rates[to];
    } else if (to === 'arvirium') {
      rateValue = 1 / rates[from];
    } else {
      rateValue = rates[to] / rates[from];
    }
    
    const fromSymbol = getCurrencySymbol(from);
    const toSymbol = getCurrencySymbol(to);
    
    exchangeRate.textContent = `1 ${fromSymbol} = ${formatCurrencyValue(rateValue, to)} ${toSymbol}`;
  }
  
  // Exchange processing function
  function processExchange(fromCurrency, toCurrency, fromAmount, toAmount) {
    // Track source values for transaction history
    const transaction = {
      date: new Date().toLocaleString(),
      fromCurrency: fromCurrency,
      fromAmount: fromAmount,
      toCurrency: toCurrency,
      toAmount: toAmount
    };
    
    // Update balances
    updateBalances(fromCurrency, -fromAmount);
    updateBalances(toCurrency, toAmount);
    
    // Add to transaction history
    addExchangeToHistory(transaction);
    
    // Show notification
    const fromSymbol = getCurrencySymbol(fromCurrency);
    const toSymbol = getCurrencySymbol(toCurrency);
    showNotification(`Successfully exchanged ${formatCurrencyValue(fromAmount, fromCurrency)} ${fromSymbol} to ${formatCurrencyValue(toAmount, toCurrency)} ${toSymbol}`, 'success');
    
    // Generate event for wallet update
    document.dispatchEvent(new CustomEvent('exchangeCompleted', { 
      detail: {
        fromCurrency,
        toCurrency,
        fromAmount,
        toAmount
      }
    }));
  }
  
  // Update balances depending on currency
  function updateBalances(currency, amount) {
    switch(currency) {
      case 'arvirium':
        totalCoins += amount;
        localStorage.setItem('totalCoins', totalCoins);
        break;
        
      case 'euro':
        mainBalance += amount;
        localStorage.setItem('mainBalance', mainBalance);
        break;
        
      case 'bitcoin':
        bitcoinBalance += amount;
        localStorage.setItem('btcBalance', bitcoinBalance);
        break;
        
      case 'ethereum':
        ethereumBalance += amount;
        localStorage.setItem('ethBalance', ethereumBalance);
        break;
    }
    
    // Update balance display if function exists
    if (typeof displayBalance === 'function') {
      displayBalance();
    }
  }
  
  // Add exchange to transaction history
  function addExchangeToHistory(transaction) {
    const historyDiv = document.getElementById('transaction-history');
    if (!historyDiv) return;
    
    const transactionElement = document.createElement('div');
    transactionElement.className = 'transaction-item';
    
    const fromSymbol = getCurrencySymbol(transaction.fromCurrency);
    const toSymbol = getCurrencySymbol(transaction.toCurrency);
    
    // Calculate exchange rate with correct number of decimal places
    let displayRate;
    if (transaction.fromAmount === 0) {
      displayRate = '0';
    } else {
      const rate = transaction.toAmount / transaction.fromAmount;
      displayRate = formatCurrencyValue(rate, transaction.toCurrency);
    }
    
    transactionElement.innerHTML = `
      <p><i class="fas fa-clock"></i> ${transaction.date}</p>
      <p><i class="fas fa-exchange-alt"></i> Exchange: ${formatCurrencyValue(transaction.fromAmount, transaction.fromCurrency)} ${fromSymbol}</p>
      <p><i class="fas fa-arrow-right"></i> To: ${formatCurrencyValue(transaction.toAmount, transaction.toCurrency)} ${toSymbol}</p>
      <p><i class="fas fa-tag"></i> Rate: 1 ${fromSymbol} = ${displayRate} ${toSymbol}</p>
    `;
    
    // Appearance animation
    transactionElement.style.opacity = '0';
    transactionElement.style.transform = 'translateX(-20px)';
    historyDiv.insertBefore(transactionElement, historyDiv.firstChild);
    
    setTimeout(() => {
      transactionElement.style.opacity = '1';
      transactionElement.style.transform = 'translateX(0)';
    }, 10);
    
    // Save to localStorage
    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    transactions.unshift({
      date: transaction.date,
      type: 'exchange',
      fromCurrency: transaction.fromCurrency,
      fromAmount: transaction.fromAmount,
      toCurrency: transaction.toCurrency,
      toAmount: transaction.toAmount
    });
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }
  
  // Make functions globally available
  window.calculateExchange = calculateExchange;
  window.getDecimalPlaces = getDecimalPlaces;
  window.getCurrencySymbol = getCurrencySymbol;
  window.getMinimumValue = getMinimumValue;
  window.formatCurrencyValue = formatCurrencyValue;
}); 