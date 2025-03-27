// Wallet functionality
document.addEventListener('DOMContentLoaded', async () => {
    // Значения по умолчанию
    let totalCoins = 0;
    let coinPrice = 15.00;
    let btcBalance = 0;
    let ethBalance = 0;
    let mainBalance = 0; // Баланс в евро
    
    // Импорт модуля аутентификации (если он доступен)
    let auth = null;
    try {
        // Динамический импорт модуля auth
        const authModule = await import('/scripts/auth.js');
        auth = authModule.default;
        console.log('Модуль аутентификации успешно загружен');
    } catch (err) {
        console.warn('Не удалось импортировать модуль аутентификации:', err);
    }
    
    // Загрузка данных пользователя
    loadUserData();
    
    // Функция загрузки данных пользователя
    function loadUserData() {
        try {
            // Проверяем, есть ли авторизованный пользователь
            if (auth && auth.currentUser) {
                console.log('Загружаем данные авторизованного пользователя');
                
                // Получаем данные из объекта пользователя
                totalCoins = parseFloat(auth.currentUser.coins || 0);
                mainBalance = parseFloat(auth.currentUser.balance || 0);
                btcBalance = parseFloat(auth.currentUser.btcBalance || 0);
                ethBalance = parseFloat(auth.currentUser.ethBalance || 0);
                
                // Выводим отладочную информацию
                console.log('Данные пользователя загружены:', {
                    coins: totalCoins,
                    balance: mainBalance,
                    btcBalance: btcBalance,
                    ethBalance: ethBalance
                });
            } else {
                console.log('Пользователь не авторизован, используем данные из localStorage');
                loadFromLocalStorage();
            }
            
            // Загружаем цену монеты
            coinPrice = parseFloat(localStorage.getItem('coinPrice')) || 15.00;
            
            // Обновляем отображение кошелька
            updateWalletDisplay();
        } catch (error) {
            console.error('Ошибка при загрузке данных пользователя:', error);
            loadFromLocalStorage();
        }
    }
    
    // Функция загрузки из localStorage
    function loadFromLocalStorage() {
        totalCoins = parseFloat(localStorage.getItem('totalCoins')) || 0;
        coinPrice = parseFloat(localStorage.getItem('coinPrice')) || 15.00;
        btcBalance = parseFloat(localStorage.getItem('btcBalance')) || 0;
        ethBalance = parseFloat(localStorage.getItem('ethBalance')) || 0;
        mainBalance = parseFloat(localStorage.getItem('mainBalance')) || 0;
        updateWalletDisplay();
    }

    // Функция обновления данных пользователя
    function updateUserData() {
        try {
            if (auth && auth.currentUser) {
                // Обновляем данные через модуль auth
                auth.updateUserData({
                    coins: totalCoins,
                    balance: mainBalance,
                    btcBalance: btcBalance,
                    ethBalance: ethBalance
                });
                
                console.log('Данные пользователя обновлены через модуль auth');
            } else {
                // Обновляем данные в localStorage
                localStorage.setItem('totalCoins', totalCoins);
                localStorage.setItem('btcBalance', btcBalance);
                localStorage.setItem('ethBalance', ethBalance);
                localStorage.setItem('mainBalance', mainBalance);
                
                console.log('Данные обновлены в localStorage');
            }
        } catch (error) {
            console.error('Ошибка при обновлении данных пользователя:', error);
            
            // Резервный вариант: всегда обновляем localStorage
            localStorage.setItem('totalCoins', totalCoins);
            localStorage.setItem('btcBalance', btcBalance);
            localStorage.setItem('ethBalance', ethBalance);
            localStorage.setItem('mainBalance', mainBalance);
        }
    }

    // Получаем актуальные курсы обмена, используемые в exchange.js
    function getExchangeRates() {
        // Исходные курсы из exchange.js
        const btcRate = 0.0000012; // 1 ARV = 0.0000012 BTC
        const ethRate = 0.000018;  // 1 ARV = 0.000018 ETH
        
        // Обратные курсы для получения стоимости в ARV
        const btcToArvRate = 1 / btcRate; // 1 BTC = X ARV
        const ethToArvRate = 1 / ethRate; // 1 ETH = X ARV
        
        // Стоимость в евро через ARV
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

        // Обновляем баланс на странице - это должно отображать только EUR баланс
        const currentBalance = document.getElementById('currentBalance');
        if (currentBalance) {
            currentBalance.textContent = `€${mainBalance.toFixed(2)}`;
        }

        // Обновляем имя пользователя, если он авторизован
        updateUserNameDisplay();

        // Получаем актуальные курсы обмена
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
    
    // Функция обновления отображения имени пользователя
    function updateUserNameDisplay() {
        // Находим элемент для отображения имени пользователя в презентационном баннере
        const userNameDisplay = document.getElementById('userName');
        const heroSection = document.querySelector('.hero-content');
        
        if (auth && auth.currentUser && auth.currentUser.username) {
            // Если пользователь авторизован и у него есть имя
            const username = auth.currentUser.username;
            
            // Обновляем существующий элемент, если он есть
            if (userNameDisplay) {
                userNameDisplay.textContent = username;
            } 
            // Создаем новый элемент в баннере, если его нет
            else if (heroSection && !document.getElementById('userName')) {
                const userNameElement = document.createElement('div');
                userNameElement.id = 'userName';
                userNameElement.className = 'user-name-display';
                userNameElement.innerHTML = `<span class="welcome-text">Добро пожаловать,</span> <span class="username">${username}</span>!`;
                
                // Добавляем элемент после заголовка h1
                const h1Element = heroSection.querySelector('h1');
                if (h1Element) {
                    h1Element.insertAdjacentElement('afterend', userNameElement);
                } else {
                    // Если h1 не найден, добавляем в начало hero-content
                    heroSection.prepend(userNameElement);
                }
                
                // Добавляем стили для нового элемента
                addUserNameStyles();
            }
        } else {
            // Если пользователь не авторизован, удаляем элемент
            if (userNameDisplay) {
                userNameDisplay.remove();
            }
        }
    }
    
    // Функция добавления стилей для отображения имени пользователя
    function addUserNameStyles() {
        // Проверяем, существует ли уже стиль
        if (!document.getElementById('userName-styles')) {
            const styleElement = document.createElement('style');
            styleElement.id = 'userName-styles';
            styleElement.textContent = `
                .user-name-display {
                    margin: 10px 0 20px;
                    font-size: 1.2rem;
                    color: #f8f9fa;
                    opacity: 0;
                    transform: translateY(20px);
                    animation: fadeInUp 0.6s forwards;
                }
                
                .welcome-text {
                    font-weight: 300;
                }
                
                .username {
                    font-weight: 700;
                    color: #daa520;
                }
                
                @keyframes fadeInUp {
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `;
            document.head.appendChild(styleElement);
        }
    }

    // Function to calculate and update total portfolio value
    function updatePortfolioValue() {
        const totalPortfolioValueEl = document.getElementById('totalPortfolioValue');
        if (!totalPortfolioValueEl) return;
        
        // Получаем актуальные курсы обмена
        const rates = getExchangeRates();
        
        // Calculate values for each currency
        const arvValue = totalCoins * coinPrice;
        const btcValue = btcBalance * rates.btcEurRate;
        const ethValue = ethBalance * rates.ethEurRate;
        
        // Calculate total - включаем фиатный баланс в общую стоимость портфеля
        const totalValue = arvValue + btcValue + ethValue + mainBalance;
        
        totalPortfolioValueEl.textContent = `€${totalValue.toFixed(2)}`;
    }

    // Function to update the portfolio distribution chart
    function updatePortfolioChart() {
        const canvas = document.getElementById('portfolioChart');
        if (!canvas) return;
        
        // Проверка контекста рисования
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Could not get canvas context');
            return;
        }
        
        // Проверка, доступна ли библиотека Chart.js
        if (typeof Chart === 'undefined') {
            console.error('Chart.js is not loaded');
            return;
        }
        
        // Устанавливаем фиксированные размеры для canvas
        canvas.height = 300;
        canvas.width = canvas.parentElement.clientWidth || 400;
        
        // Получаем актуальные курсы обмена
        const rates = getExchangeRates();
        
        // Calculate values for each currency
        const arvValue = totalCoins * coinPrice;
        const btcValue = btcBalance * rates.btcEurRate;
        const ethValue = ethBalance * rates.ethEurRate;
        
        // Отладочное сообщение для проверки расчетов
        console.log(`Portfolio values - ARV: €${arvValue.toFixed(2)}, BTC: €${btcValue.toFixed(2)}, ETH: €${ethValue.toFixed(2)}, EUR: €${mainBalance.toFixed(2)}`);
        
        // Calculate total - включаем фиатный баланс в общую стоимость
        const totalValue = arvValue + btcValue + ethValue + mainBalance;
        
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
            labels: ['Arvirium', 'Bitcoin', 'Ethereum', 'Euro'],
            datasets: [{
                data: [
                    arvValue > 0 ? arvValue : 0,
                    btcValue > 0 ? btcValue : 0,
                    ethValue > 0 ? ethValue : 0,
                    mainBalance > 0 ? mainBalance : 0
                ],
                backgroundColor: [
                    '#daa520', // Gold for Arvirium
                    '#f2a900', // Bitcoin orange
                    '#62688f', // Ethereum blue-gray
                    '#2b8a3e'  // Green for Euro
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
            type: 'doughnut', // Изменяем на doughnut для лучшего отображения
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false, // Важно для предотвращения поплющивания
                cutout: '60%', // Для doughnut-диаграммы
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
        } else if (transaction.toCurrency === 'bitcoin') {
            btcBalance += transaction.toAmount;
        }
        
        // Update ETH balance if ETH was exchanged
        if (transaction.fromCurrency === 'ethereum') {
            ethBalance -= transaction.fromAmount;
        } else if (transaction.toCurrency === 'ethereum') {
            ethBalance += transaction.toAmount;
        }
        
        // Update ARV if ARV was exchanged
        if (transaction.fromCurrency === 'arvirium') {
            totalCoins -= transaction.fromAmount;
        } else if (transaction.toCurrency === 'arvirium') {
            totalCoins += transaction.toAmount;
        }
        
        // Update EUR if EUR was exchanged
        if (transaction.fromCurrency === 'euro') {
            mainBalance -= transaction.fromAmount;
        } else if (transaction.toCurrency === 'euro') {
            mainBalance += transaction.toAmount;
        }
        
        // Сохраняем обновленные данные
        updateUserData();
        
        // Update wallet display
        updateWalletDisplay();
    });

    // Listen for coin price updates
    document.addEventListener('coinPriceUpdated', (e) => {
        // Обновляем локальную переменную coinPrice
        if (e.detail && e.detail.price) {
            coinPrice = e.detail.price;
        } else {
            // Если detail.price не передан, берем из localStorage
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

    // Функция отправки изменений на сервер
    async function updateUserCoins(newAmount) {
        try {
            // Обновляем данные локально
            mainBalance += parseFloat(newAmount);
            
            // Сохраняем обновленные данные
            updateUserData();
            
            // Обновляем отображение
            updateWalletDisplay();
            
            // Отправляем на сервер если пользователь авторизован
            if (auth && auth.currentUser) {
                const token = localStorage.getItem('token');
                if (token) {
                    try {
                        const response = await fetch('/api/user/balance', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                type: 'add',
                                amount: newAmount
                            })
                        }).catch(err => {
                            console.log('Ошибка сети при отправке на сервер:', err);
                            return null;
                        });
                        
                        if (response && response.ok) {
                            console.log('Баланс успешно обновлен на сервере');
                        }
                    } catch (error) {
                        console.error('Ошибка при отправке данных на сервер:', error);
                    }
                }
            }
            
            return true; // Возвращаем true, так как данные обновлены локально
        } catch (error) {
            console.error('Ошибка при обновлении баланса:', error);
            return false;
        }
    }
    
    // Обработчик формы пополнения баланса
    const balanceForm = document.getElementById('balance-form');
    if (balanceForm) {
        balanceForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const amountInput = document.getElementById('balanceAmount');
            const amount = parseFloat(amountInput.value);
            
            if (isNaN(amount) || amount <= 0) {
                alert('Пожалуйста, введите корректную сумму');
                return;
            }
            
            // Отправляем изменения
            const success = await updateUserCoins(amount);
            
            if (success) {
                alert(`На ваш счет успешно добавлено €${amount.toFixed(2)}`);
                amountInput.value = '';
            } else {
                alert('Ошибка при пополнении баланса');
            }
        });
    }
    
    // Прослушивание события авторизации для обновления данных
    window.addEventListener('userLoggedIn', function(e) {
        console.log('Событие входа пользователя получено');
        loadUserData();
    });
    
    // Прослушивание события выхода пользователя
    window.addEventListener('userLoggedOut', function() {
        console.log('Событие выхода пользователя получено');
        loadUserData();
    });
}); 