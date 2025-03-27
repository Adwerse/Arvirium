// Инициализация переменных для работы с криптовалютой
let mainBalance = 0;
let totalCoins = 0;
let priceHistory = JSON.parse(localStorage.getItem('priceHistory')) || [];
let coinPrice = parseFloat(localStorage.getItem('coinPrice')) || 15.00;
let auth = null; // Для хранения модуля авторизации

// Более полная история цен для разных временных диапазонов
let extendedPriceHistory = JSON.parse(localStorage.getItem('extendedPriceHistory')) || [];
let selectedTimeRange = 7; // По умолчанию 7 дней / Default 7 days

// Система уведомлений
// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Анимация появления
    // Appearance animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Автоматическое закрытие через 3 секунды
    // Automatic closing after 3 seconds
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

// Инициализация модуля авторизации
async function initAuth() {
    try {
        // Динамический импорт модуля auth
        const authModule = await import('/scripts/auth.js');
        auth = authModule.default;
        console.log('Модуль аутентификации успешно загружен в crypto.js');
        
        // Загружаем данные пользователя после инициализации auth
        initUserData();
    } catch (error) {
        console.warn('Не удалось импортировать модуль аутентификации:', error);
        // Все равно загружаем данные, но из localStorage
        initUserData();
    }
}

// Функция инициализации/загрузки пользовательских данных 
function initUserData() {
    // Проверяем, есть ли активная авторизация
    if (auth && auth.currentUser) {
        // Пользователь авторизован, используем данные из пользовательского объекта
        mainBalance = parseFloat(auth.currentUser.balance || 0);
        totalCoins = parseFloat(auth.currentUser.coins || 0);
        // Отображаем данные пользователя
        displayBalance();
        loadTransactions();
    } else {
        // Пользователь не авторизован, используем временные данные из localStorage
        mainBalance = parseFloat(localStorage.getItem('mainBalance')) || 0;
        totalCoins = parseFloat(localStorage.getItem('totalCoins')) || 0;
        displayBalance();
        loadTransactions();
    }
}

// Функция для обновления данных в localStorage или user объекте
function updateUserData() {
    if (auth && auth.currentUser) {
        // Пользователь авторизован, обновляем данные пользователя
        auth.updateUserData({
            balance: mainBalance,
            coins: totalCoins
        });
        console.log('Данные пользователя обновлены через auth');
    } else {
        // Пользователь не авторизован, обновляем временные данные
        localStorage.setItem('mainBalance', mainBalance);
        localStorage.setItem('totalCoins', totalCoins);
        console.log('Данные обновлены в localStorage');
    }
}

// Функция для обновления баланса
function updateBalance(amount) {
    const formattedAmount = parseFloat(amount);
    mainBalance += formattedAmount;
    updateUserData();
    displayBalance();
    
    // Анимация изменения баланса
    animateBalanceChange(formattedAmount);
    
    showNotification(`Balance topped up by €${formattedAmount.toFixed(2)}`, 'success');
}

// Анимация изменения баланса
// Balance change animation
function animateBalanceChange(amount) {
    const balanceEl = $('currentBalance');
    balanceEl.classList.add('balance-change');
    
    // Создаем и анимируем элемент с суммой
    // Create and animate amount element
    const changeEl = document.createElement('span');
    changeEl.className = 'balance-change-amount';
    changeEl.textContent = `+€${amount.toFixed(2)}`;
    balanceEl.parentNode.appendChild(changeEl);
    
    // Удаляем анимацию и элемент через 1.5 секунды
    // Remove animation and element after 1.5 seconds
    setTimeout(() => {
        balanceEl.classList.remove('balance-change');
        changeEl.classList.add('fade-out');
        setTimeout(() => {
            balanceEl.parentNode.removeChild(changeEl);
        }, 300);
    }, 1500);
}

// Функция отображения баланса
function displayBalance() {
    const currentBalance = $('currentBalance');
    const totalCoinsDisplay = $('totalCoinsDisplay');
    const totalCoinValueDisplay = $('totalCoinValueDisplay');
    const liveCoinPrice = $('liveCoinPrice');
    const liveCoinPriceSell = $('liveCoinPriceSell');
    
    if (currentBalance) {
        currentBalance.textContent = `€${mainBalance.toFixed(2)}`;
        
        // Обновляем классы для отображения положительного/отрицательного баланса
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

// Функция расчета количества монет
// Function to calculate number of coins
function calculateCoins() {
    const amount = parseFloat($('amount').value) || 0;
    const coinsToReceive = amount / coinPrice;
    $('coins').value = coinsToReceive.toFixed(2);
    
    // Анимация расчета
    // Calculation animation
    $('coins').classList.add('calculation-pulse');
    setTimeout(() => {
        $('coins').classList.remove('calculation-pulse');
    }, 500);
}

// Добавляем функцию расчета стоимости продажи
function calculateSellValue() {
    const coinsToSell = parseFloat($('sellCoins').value) || 0;
    const valueToReceive = coinsToSell * coinPrice;
    $('sellValue').value = valueToReceive.toFixed(2);
    
    // Анимация расчета
    // Calculation animation
    $('sellValue').classList.add('calculation-pulse');
    setTimeout(() => {
        $('sellValue').classList.remove('calculation-pulse');
    }, 500);
}

// Функция обработки покупки монет
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
    
    // Снимаем деньги с баланса
    // Deduct money from balance
    mainBalance -= amount;
    totalCoins += coinsReceived;

    // Сохранение данных
    // Save data
    updateUserData();

    // Добавление транзакции в историю
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

    // Очистка формы
    // Clear form
    $('amount').value = '';
    $('coins').value = '';
    
    // Анимация успешной покупки
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

// Функция обработки продажи монет
// Function to process coin sale
function processSellTransaction(e) {
    e.preventDefault();
    const coinsToSell = parseFloat($('sellCoins').value);
    
    // Проверка введенного значения
    if (!coinsToSell || isNaN(coinsToSell) || coinsToSell <= 0) {
        showNotification('Введите положительное число монет', 'error');
        shakeElement($('sellCoins'));
        return;
    }
    
    // Получаем минимальное допустимое значение из exchange.js, если функция доступна
    let minValue = 0.01; // Значение по умолчанию
    if (typeof window.getMinimumValue === 'function') {
        minValue = window.getMinimumValue('arvirium');
    }
    
    if (coinsToSell < minValue) {
        // Используем formatCurrencyValue если доступно
        let formattedMinValue = minValue.toFixed(2);
        if (typeof window.formatCurrencyValue === 'function') {
            formattedMinValue = window.formatCurrencyValue(minValue, 'arvirium');
        }
        showNotification(`Минимальная сумма продажи ${formattedMinValue} ARV`, 'error');
        shakeElement($('sellCoins'));
        return;
    }
    
    if (coinsToSell > totalCoins) {
        showNotification('У вас недостаточно монет для продажи', 'error');
        shakeElement($('sellCoins'));
        return;
    }

    const valueReceived = coinsToSell * coinPrice;
    
    // Обновляем балансы
    // Update balances
    totalCoins -= coinsToSell;
    mainBalance += valueReceived;

    // Сохранение данных
    // Save data
    updateUserData();

    // Добавление транзакции в историю
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
    showNotification(`Продано ${coinsToSell.toFixed(2)} монет за €${valueReceived.toFixed(2)}`, 'success');

    // Очистка формы
    // Clear form
    $('sellCoins').value = '';
    $('sellValue').value = '';
    
    // Анимация успешной продажи
    // Successful sale animation
    const sellButton = document.querySelector('.btn-sell');
    sellButton.classList.add('transaction-success');
    setTimeout(() => {
        sellButton.classList.remove('transaction-success');
    }, 1000);
}

// Функция для анимации "тряски" элемента при ошибке
// Function for "shake" animation of element on error
function shakeElement(element) {
    element.classList.add('shake-element');
    setTimeout(() => {
        element.classList.remove('shake-element');
    }, 600);
}

// Функция добавления транзакции в историю
// Function to add transaction to history
function addToTransactionHistory(transaction) {
    const historyDiv = $('transaction-history');
    if (!historyDiv) return;
    
    const transactionElement = document.createElement('div');
    transactionElement.className = 'transaction-item';
    
    // Формируем HTML в зависимости от типа транзакции
    if (transaction.type === 'buy') {
        transactionElement.innerHTML = `
            <p><i class="fas fa-clock"></i> ${transaction.date}</p>
            <p><i class="fas fa-money-bill-wave"></i> Spent: €${transaction.amount.toFixed(2)}</p>
            <p><i class="fas fa-coins"></i> Coins received: ${transaction.coins.toFixed(2)}</p>
            <p><i class="fas fa-tag"></i> Coin price: €${transaction.price.toFixed(2)}</p>
        `;
    } else if (transaction.type === 'sell') {
        transactionElement.innerHTML = `
            <p><i class="fas fa-clock"></i> ${transaction.date}</p>
            <p><i class="fas fa-hand-holding-usd"></i> Sold: ${transaction.coins.toFixed(2)} coins</p>
            <p><i class="fas fa-money-bill-wave"></i> Received: €${transaction.amount.toFixed(2)}</p>
            <p><i class="fas fa-tag"></i> Coin price: €${transaction.price.toFixed(2)}</p>
        `;
    }
    
    // Анимируем появление новой транзакции
    transactionElement.style.opacity = '0';
    transactionElement.style.transform = 'translateX(-20px)';
    historyDiv.insertBefore(transactionElement, historyDiv.firstChild);
    
    setTimeout(() => {
        transactionElement.style.opacity = '1';
        transactionElement.style.transform = 'translateX(0)';
    }, 10);
    
    // Сохранение истории транзакций
    saveTransaction(transaction);
}

// Функция сохранения транзакции
function saveTransaction(transaction) {
    if (auth && auth.currentUser) {
        // Пользователь авторизован, сохраняем в данных пользователя
        const currentUser = auth.currentUser;
        if (!currentUser.transactions) {
            currentUser.transactions = [];
        }
        currentUser.transactions.unshift(transaction);
        auth.updateUserData({ transactions: currentUser.transactions });
    } else {
        // Пользователь не авторизован, сохраняем в временном хранилище
        const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        transactions.unshift(transaction);
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }
}

// Функция обновления истории цен
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

// Функция обновления графика цен
// Function to update price chart
function updatePriceChart() {
    const priceChartEl = $('priceChart');
    if (!priceChartEl) return;
    
    const ctx = priceChartEl.getContext('2d');
    
    // Устанавливаем фиксированную высоту для canvas, чтобы избежать проблем с размером
    priceChartEl.height = 300;
    
    // Get data based on selected time range
    const filteredData = getFilteredPriceHistory(selectedTimeRange);
    
    // Если график уже существует, уничтожим его
    // If chart already exists, destroy it
    if (window.priceChartInstance) {
        window.priceChartInstance.destroy();
    }
    
    // Если данных нет, отобразим заглушку
    // If there's no data, display a placeholder
    if (filteredData.length === 0) {
        ctx.font = '16px Montserrat';
        ctx.fillStyle = '#f8f9fa';
        ctx.textAlign = 'center';
        ctx.fillText('No price data available for this time period', ctx.canvas.width / 2, ctx.canvas.height / 2);
        return;
    }
    
    // Градиент для графика
    // Gradient for chart
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(218, 165, 32, 0.6)');
    gradient.addColorStop(1, 'rgba(218, 165, 32, 0)');
    
    // Форматируем данные для отображения на графике
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
            aspectRatio: 2,  // соотношение ширины и высоты 2:1
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

// Функция случайного обновления цены
// Function for random price update
function updateCoinPrice() {
    // Сохраняем старую цену для сравнения
    // Save old price for comparison
    const oldPrice = coinPrice;
    
    // Генерируем случайное изменение от -0.5 до 0.5
    // Generate random change from -0.5 to 0.5
    const change = (Math.random() - 0.5) * 1;
    coinPrice = parseFloat((coinPrice + change).toFixed(2));
    
    // Защита от слишком низкой цены
    // Protection from too low price
    if (coinPrice < 5) coinPrice = 5;
    // Защита от слишком высокой цены
    // Protection from too high price
    if (coinPrice > 25) coinPrice = 25;
    
    // Сохраняем новую цену
    // Save new price
    localStorage.setItem('coinPrice', coinPrice);
    
    // Обновляем отображение
    // Update display
    displayBalance();
    updatePriceHistory();
    
    // Анимация изменения цены
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
    
    // Уведомление об изменении цены
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

// Загрузка сохраненных транзакций
// Load saved transactions
function loadTransactions() {
    let transactions = [];
    
    // Получаем транзакции в зависимости от статуса авторизации
    if (auth && auth.currentUser) {
        // Пользователь авторизован, загружаем его транзакции
        transactions = auth.currentUser.transactions || [];
    } else {
        // Пользователь не авторизован, загружаем из временного хранилища
        transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    }
    
    const historyDiv = $('transaction-history');
    
    if (!historyDiv) {
        console.error('Transaction history container not found');
        return;
    }
    
    historyDiv.innerHTML = ''; // Очищаем историю / Clear history
    
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
        if (!transaction) return; // Проверка на null или undefined
        
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
            // Exchange transaction - используем formatCurrencyValue если доступна
            const fromSymbol = getCurrencySymbol(transaction.fromCurrency);
            const toSymbol = getCurrencySymbol(transaction.toCurrency);
            
            let fromAmountFormatted, toAmountFormatted, rateFormatted;
            
            // Используем глобальную функцию formatCurrencyValue если доступна
            if (typeof window.formatCurrencyValue === 'function') {
                fromAmountFormatted = window.formatCurrencyValue(transaction.fromAmount, transaction.fromCurrency);
                toAmountFormatted = window.formatCurrencyValue(transaction.toAmount, transaction.toCurrency);
                
                // Расчет обменного курса
                const rate = transaction.fromAmount === 0 ? 0 : transaction.toAmount / transaction.fromAmount;
                rateFormatted = window.formatCurrencyValue(rate, transaction.toCurrency);
            } else {
                // Запасной вариант если функция недоступна
                fromAmountFormatted = transaction.fromAmount.toFixed(getDecimalPlaces(transaction.fromCurrency));
                toAmountFormatted = transaction.toAmount.toFixed(getDecimalPlaces(transaction.toCurrency));
                
                const rate = transaction.fromAmount === 0 ? 0 : transaction.toAmount / transaction.fromAmount;
                rateFormatted = rate.toFixed(getDecimalPlaces(transaction.toCurrency));
            }
            
            transactionElement.innerHTML = `
                <p><i class="fas fa-clock"></i> ${transaction.date}</p>
                <p><i class="fas fa-exchange-alt"></i> Обмен: ${fromAmountFormatted} ${fromSymbol}</p>
                <p><i class="fas fa-arrow-right"></i> На: ${toAmountFormatted} ${toSymbol}</p>
                <p><i class="fas fa-tag"></i> Курс: 1 ${fromSymbol} = ${rateFormatted} ${toSymbol}</p>
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

// Инициализация обработчиков событий
document.addEventListener('DOMContentLoaded', async () => {
    // Инициализируем модуль авторизации
    await initAuth();
    
    // Добавляем обработчики событий для форм
    const walletForm = $('wallet-form');
    if (walletForm) {
        walletForm.addEventListener('submit', processTransaction);
    }
    
    const sellForm = $('sell-form');
    if (sellForm) {
        sellForm.addEventListener('submit', processSellTransaction);
    }
    
    const balanceForm = $('balance-form');
    if (balanceForm) {
        balanceForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const amount = parseFloat($('balanceAmount').value);
            if (amount && amount > 0) {
                updateBalance(amount);
                $('balanceAmount').value = '';
            } else {
                showNotification('Please enter a valid amount', 'error');
            }
        });
    }
    
    // Загружаем цену монеты
    coinPrice = parseFloat(localStorage.getItem('coinPrice')) || 15.00;
    
    // Загружаем данные истории цен
    loadPriceHistory();
    
    // Добавляем обработчик изменения временного диапазона
    handleTimeRangeChange();
    
    // Обновляем отображение
    displayBalance();
    updatePriceChart();
    
    // Слушаем события логина/логаута
    window.addEventListener('userLoggedIn', function(e) {
        console.log('Событие входа пользователя получено в crypto.js');
        initUserData();
    });
    
    window.addEventListener('userLoggedOut', function() {
        console.log('Событие выхода пользователя получено в crypto.js');
        initUserData();
    });
});