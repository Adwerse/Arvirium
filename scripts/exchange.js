// Currency exchange functionality
document.addEventListener('DOMContentLoaded', async () => {
  // Инициализация переменных
  let coinPrice = 15.00;
  let totalCoins = 0;
  let mainBalance = 0;
  let bitcoinBalance = 0;
  let ethereumBalance = 0;
  let auth = null; // Для хранения модуля auth
  
  // Инициализация авторизации
  try {
    // Динамический импорт модуля auth
    const authModule = await import('/scripts/auth.js');
    auth = authModule.default;
    console.log('Модуль аутентификации успешно загружен в exchange.js');
    
    // Загружаем данные авторизованного пользователя
    loadUserData();
  } catch (err) {
    console.warn('Не удалось импортировать модуль аутентификации:', err);
    // Загружаем данные из localStorage
    loadUserData();
  }
  
  // Функция для загрузки данных пользователя
  function loadUserData() {
    // Проверяем, авторизован ли пользователь
    if (auth && auth.currentUser) {
      // Пользователь авторизован, используем его данные
      totalCoins = parseFloat(auth.currentUser.coins || 0);
      mainBalance = parseFloat(auth.currentUser.balance || 0);
      bitcoinBalance = parseFloat(auth.currentUser.btcBalance || 0);
      ethereumBalance = parseFloat(auth.currentUser.ethBalance || 0);
      
      console.log('Данные пользователя загружены в exchange.js:', {
        coins: totalCoins,
        balance: mainBalance,
        btcBalance: bitcoinBalance,
        ethBalance: ethereumBalance
      });
    } else {
      // Пользователь не авторизован, используем данные из localStorage
      totalCoins = parseFloat(localStorage.getItem('totalCoins')) || 0;
      mainBalance = parseFloat(localStorage.getItem('mainBalance')) || 0;
      bitcoinBalance = parseFloat(localStorage.getItem('btcBalance')) || 0;
      ethereumBalance = parseFloat(localStorage.getItem('ethBalance')) || 0;
      
      console.log('Данные загружены из localStorage в exchange.js');
    }
    
    // Загружаем текущую цену монеты
    coinPrice = parseFloat(localStorage.getItem('coinPrice')) || 15.00;
    
    // Обновляем отображение курсов обмена
    updateRateDisplays();
    calculateExchange();
    updateExchangeRateDisplay();
  }
  
  // Функция для сохранения данных пользователя
  function saveUserData() {
    // Проверяем, авторизован ли пользователь
    if (auth && auth.currentUser) {
      // Пользователь авторизован, сохраняем в его данные
      auth.updateUserData({
        coins: totalCoins,
        balance: mainBalance,
        btcBalance: bitcoinBalance,
        ethBalance: ethereumBalance
      });
      
      console.log('Данные пользователя обновлены через auth в exchange.js');
    } else {
      // Пользователь не авторизован, сохраняем в localStorage
      localStorage.setItem('totalCoins', totalCoins);
      localStorage.setItem('mainBalance', mainBalance);
      localStorage.setItem('btcBalance', bitcoinBalance);
      localStorage.setItem('ethBalance', ethereumBalance);
      
      console.log('Данные обновлены в localStorage из exchange.js');
    }
  }
  
  // Функция получения текущих курсов обмена
  function getCurrentExchangeRates() {
    return {
      arvirium: 1,
      bitcoin: 0.0000012,
      ethereum: 0.000018,
      euro: coinPrice // Динамическое значение на основе текущей цены монеты
    };
  }
  
  // Вспомогательная функция для безопасного получения DOM элементов
  function $(id) {
    return document.getElementById(id);
  }
  
  // DOM элементы - используем безопасный геттер
  const fromAmount = $('fromAmount');
  const fromCurrency = $('fromCurrency');
  const toAmount = $('toAmount');
  const toCurrency = $('toCurrency');
  const exchangeRate = $('exchangeRate');
  const switchCurrenciesBtn = $('switchCurrencies');
  const exchangeForm = $('exchange-form');
  
  // Проверяем существование всех необходимых элементов
  if (!fromAmount || !fromCurrency || !toAmount || !toCurrency || !exchangeRate || !switchCurrenciesBtn) {
    console.error('Отсутствуют некоторые необходимые элементы формы обмена');
    return; // Преждевременный выход, если элементы отсутствуют
  }
  
  // Особая проверка для формы обмена
  if (!exchangeForm) {
    console.error('Форма обмена не найдена. Привязываем кнопку обмена напрямую.');
    
    // Находим кнопку обмена по классу
    const exchangeButton = document.querySelector('.btn-exchange');
    if (exchangeButton) {
      exchangeButton.addEventListener('click', function(e) {
        e.preventDefault();
        processExchangeHandler(e);
      });
    } else {
      console.error('Кнопка обмена не найдена');
      return;
    }
  } else {
    // Форма найдена, привязываем событие submit
    exchangeForm.addEventListener('submit', processExchangeHandler);
  }
  
  // Получить минимально допустимое значение в зависимости от валюты
  function getMinimumValue(currency) {
    switch(currency) {
      case 'bitcoin':
        return 0.00000001; // 1 сатоши
      case 'ethereum':
        return 0.000001;   // Минимальное значение для ETH
      case 'arvirium':
        return 0.01;       // Обычное значение для ARV
      case 'euro':
        return 0.01;       // Обычное значение для EUR
      default:
        return 0.01;
    }
  }
  
  // Получить соответствующее количество десятичных знаков в зависимости от валюты
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
  
  // Получить символ валюты
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
  
  // Форматирует значение валюты с учетом специфики валюты
  function formatCurrencyValue(value, currency) {
    // Если значение слишком мало, используем научную нотацию
    const decimalPlaces = getDecimalPlaces(currency);
    
    if (currency === 'bitcoin') {
      // Для Bitcoin: если значение слишком мало, используем научную нотацию
      return value < 0.00001 ? value.toExponential(8) : value.toFixed(8);
    } else if (currency === 'ethereum') {
      // Для Ethereum: если значение слишком мало, используем научную нотацию
      return value < 0.0001 ? value.toExponential(6) : value.toFixed(6);
    } else {
      // Для других валют: фиксированное количество десятичных знаков
      return value.toFixed(2);
    }
  }
  
  // Обновление отображения курсов обмена в карточках курсов
  function updateRateDisplays() {
    const rates = getCurrentExchangeRates();
    const rateCards = document.querySelectorAll('.rate-card');
    
    if (rateCards.length >= 3) {
      // Курс Bitcoin
      const btcValueEl = rateCards[0].querySelector('.rate-value');
      if (btcValueEl) {
        btcValueEl.textContent = `1 ARV = ${formatCurrencyValue(rates.bitcoin, 'bitcoin')} BTC`;
      }
      
      // Курс Ethereum
      const ethValueEl = rateCards[1].querySelector('.rate-value');
      if (ethValueEl) {
        ethValueEl.textContent = `1 ARV = ${formatCurrencyValue(rates.ethereum, 'ethereum')} ETH`;
      }
      
      // Курс Euro
      const euroValueEl = rateCards[2].querySelector('.rate-value');
      if (euroValueEl) {
        euroValueEl.textContent = `1 ARV = ${formatCurrencyValue(rates.euro, 'euro')} EUR`;
      }
    }
  }
  
  // Инициализация отображения обмена
  calculateExchange();
  updateExchangeRateDisplay();
  updateRateDisplays();
  
  // Подписка на обновления цены монеты
  document.addEventListener('coinPriceUpdated', (e) => {
    // Обновление coinPrice, если detail предоставлен
    if (e.detail && e.detail.price) {
      coinPrice = e.detail.price;
    }
    calculateExchange();
    updateExchangeRateDisplay();
    updateRateDisplays();
  });
  
  // Обработчики событий
  fromAmount.addEventListener('input', calculateExchange);
  fromCurrency.addEventListener('change', () => {
    calculateExchange();
    updateExchangeRateDisplay();
  });
  toCurrency.addEventListener('change', () => {
    calculateExchange();
    updateExchangeRateDisplay();
  });
  
  // Кнопка переключения валют
  switchCurrenciesBtn.addEventListener('click', () => {
    const tempCurrency = fromCurrency.value;
    fromCurrency.value = toCurrency.value;
    toCurrency.value = tempCurrency;
    
    calculateExchange();
    updateExchangeRateDisplay();
    
    // Анимация для кнопки
    switchCurrenciesBtn.style.transform = 'rotate(180deg)';
    setTimeout(() => {
      switchCurrenciesBtn.style.transform = 'rotate(0deg)';
    }, 300);
  });
  
  // Убедимся, что функция встряхивания элемента существует
  function shakeElement(element) {
    if (!element) return;
    element.classList.add('shake-element');
    setTimeout(() => {
      element.classList.remove('shake-element');
    }, 600);
  }
  
  // Убедимся, что функция showNotification существует
  if (typeof showNotification !== 'function') {
    window.showNotification = function(message, type = 'info') {
      const notification = document.createElement('div');
      notification.className = `notification ${type}`;
      notification.textContent = message;
      document.body.appendChild(notification);
      
      // Анимация появления
      setTimeout(() => {
        notification.classList.add('show');
      }, 10);
      
      // Автоматическое закрытие через 3 секунды
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 300);
      }, 3000);
    };
  }
  
  // Обработка отправки формы обмена
  function processExchangeHandler(e) {
    e.preventDefault();
    
    const fromCurrencyValue = fromCurrency.value;
    const toCurrencyValue = toCurrency.value;
    let fromAmountValue = parseFloat(fromAmount.value);
    let toAmountValue = parseFloat(toAmount.value || '0');
    
    // Проверка введенного значения
    if (!fromAmountValue || isNaN(fromAmountValue) || fromAmountValue <= 0) {
      showNotification('Please enter an amount greater than 0', 'error');
      shakeElement(fromAmount);
      return;
    }
    
    if (fromCurrencyValue === toCurrencyValue) {
      showNotification('Cannot exchange to the same currency', 'error');
      return;
    }
    
    // Проверка минимального значения
    const minValue = getMinimumValue(fromCurrencyValue);
    if (fromAmountValue < minValue) {
      showNotification(`Minimum amount for ${getCurrencySymbol(fromCurrencyValue)} is ${formatCurrencyValue(minValue, fromCurrencyValue)}`, 'error');
      shakeElement(fromAmount);
      return;
    }
    
    // Проверка достаточности средств
    let sufficientFunds = true;
    switch(fromCurrencyValue) {
      case 'arvirium':
        sufficientFunds = fromAmountValue <= totalCoins;
        break;
      case 'bitcoin':
        sufficientFunds = fromAmountValue <= bitcoinBalance;
        break;
      case 'ethereum':
        sufficientFunds = fromAmountValue <= ethereumBalance;
        break;
      case 'euro':
        sufficientFunds = fromAmountValue <= mainBalance;
        break;
    }
    
    if (!sufficientFunds) {
      showNotification(`Insufficient ${getCurrencySymbol(fromCurrencyValue)} balance`, 'error');
      shakeElement(fromAmount);
      return;
    }
    
    // Получаем актуальное значение обмена
    calculateExchange();
    
    // Обновляем toAmountValue после calculateExchange
    toAmountValue = parseFloat(toAmount.value || '0');
    
    // Обработка обмена
    processExchange(fromCurrencyValue, toCurrencyValue, fromAmountValue, toAmountValue);
    
    // Сброс формы
    fromAmount.value = '';
    toAmount.value = '';
    
    // Анимация для кнопки
    const exchangeButton = document.querySelector('.btn-exchange');
    if (exchangeButton) {
      exchangeButton.classList.add('transaction-success');
      setTimeout(() => {
        exchangeButton.classList.remove('transaction-success');
      }, 1000);
    }
  }
  
  // Функция расчета обмена
  function calculateExchange() {
    if (!fromAmount || !toAmount || !fromCurrency || !toCurrency) return;
    
    const amount = parseFloat(fromAmount.value) || 0;
    const fromCurrencyValue = fromCurrency.value;
    const toCurrencyValue = toCurrency.value;
    
    if (amount <= 0 || fromCurrencyValue === toCurrencyValue) {
      toAmount.value = '0';
      return;
    }
    
    const rates = getCurrentExchangeRates();
    
    // Расчет обмена через относительные курсы к евро
    const fromRate = rates[fromCurrencyValue];
    const toRate = rates[toCurrencyValue];
    
    // Количество евро, эквивалентное входящей сумме
    const euroEquivalent = fromCurrencyValue === 'euro' ? amount : amount * fromRate;
    
    // Количество целевой валюты, которое получится из евроэквивалента
    let result;
    if (toCurrencyValue === 'euro') {
      result = euroEquivalent;
    } else {
      result = euroEquivalent / toRate;
    }
    
    // Округление в зависимости от валюты
    const decimalPlaces = getDecimalPlaces(toCurrencyValue);
    toAmount.value = result.toFixed(decimalPlaces);
    
    // Обновление отображения курса обмена
    updateExchangeRateDisplay();
  }
  
  // Обновление отображения курса обмена
  function updateExchangeRateDisplay() {
    if (!exchangeRate || !fromCurrency || !toCurrency) return;
    
    const fromCurrencyValue = fromCurrency.value;
    const toCurrencyValue = toCurrency.value;
    
    if (fromCurrencyValue === toCurrencyValue) {
      exchangeRate.textContent = '1 = 1';
      return;
    }
    
    const rates = getCurrentExchangeRates();
    
    // Расчет актуального курса обмена
    const fromRate = rates[fromCurrencyValue];
    const toRate = rates[toCurrencyValue];
    
    // Курс: сколько единиц toCurrency за 1 единицу fromCurrency
    const rate = fromRate / toRate;
    
    // Форматируем отображение курса
    const fromSymbol = getCurrencySymbol(fromCurrencyValue);
    const toSymbol = getCurrencySymbol(toCurrencyValue);
    
    exchangeRate.textContent = `1 ${fromSymbol} = ${formatCurrencyValue(rate, toCurrencyValue)} ${toSymbol}`;
  }
  
  // Функция обработки обмена
  function processExchange(fromCurrency, toCurrency, fromAmount, toAmount) {
    // Отслеживание исходных значений для истории транзакций
    const transaction = {
      date: new Date().toLocaleString(),
      fromCurrency: fromCurrency,
      fromAmount: fromAmount,
      toCurrency: toCurrency,
      toAmount: toAmount,
      type: 'exchange'
    };
    
    // Обновление балансов
    updateBalances(fromCurrency, -fromAmount);
    updateBalances(toCurrency, toAmount);
    
    // Добавление в историю транзакций
    addExchangeToHistory(transaction);
    
    // Показать уведомление
    const fromSymbol = getCurrencySymbol(fromCurrency);
    const toSymbol = getCurrencySymbol(toCurrency);
    showNotification(`Successfully exchanged ${formatCurrencyValue(fromAmount, fromCurrency)} ${fromSymbol} to ${formatCurrencyValue(toAmount, toCurrency)} ${toSymbol}`, 'success');
    
    // Генерация события для обновления кошелька
    document.dispatchEvent(new CustomEvent('exchangeCompleted', { 
      detail: {
        fromCurrency,
        toCurrency,
        fromAmount,
        toAmount
      }
    }));
  }
  
  // Обновление балансов в зависимости от валюты
  function updateBalances(currency, amount) {
    switch(currency) {
      case 'arvirium':
        totalCoins += amount;
        break;
        
      case 'euro':
        mainBalance += amount;
        break;
        
      case 'bitcoin':
        bitcoinBalance += amount;
        break;
        
      case 'ethereum':
        ethereumBalance += amount;
        break;
    }
    
    // Сохраняем обновленные данные пользователя
    saveUserData();
    
    // Обновление отображения баланса, если функция существует
    if (typeof displayBalance === 'function') {
      displayBalance();
    }
  }
  
  // Добавление обмена в историю транзакций
  function addExchangeToHistory(transaction) {
    const historyDiv = document.getElementById('transaction-history');
    if (!historyDiv) return;
    
    const transactionElement = document.createElement('div');
    transactionElement.className = 'transaction-item';
    
    const fromSymbol = getCurrencySymbol(transaction.fromCurrency);
    const toSymbol = getCurrencySymbol(transaction.toCurrency);
    
    // Расчет курса обмена с правильным количеством десятичных знаков
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
    
    // Анимация появления
    transactionElement.style.opacity = '0';
    transactionElement.style.transform = 'translateX(-20px)';
    historyDiv.insertBefore(transactionElement, historyDiv.firstChild);
    
    setTimeout(() => {
      transactionElement.style.opacity = '1';
      transactionElement.style.transform = 'translateX(0)';
    }, 10);
    
    // Сохранение в localStorage или данных пользователя
    saveTransactionToHistory(transaction);
  }
  
  // Сохранение транзакции в историю
  function saveTransactionToHistory(transaction) {
    if (auth && auth.currentUser) {
      // Пользователь авторизован, сохраняем в его данные
      const currentUser = auth.currentUser;
      if (!currentUser.transactions) {
        currentUser.transactions = [];
      }
      currentUser.transactions.unshift(transaction);
      auth.updateUserData({ transactions: currentUser.transactions });
    } else {
      // Пользователь не авторизован, сохраняем в localStorage
      const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
      transactions.unshift(transaction);
      localStorage.setItem('transactions', JSON.stringify(transactions));
    }
  }
  
  // Слушаем события входа и выхода пользователя
  window.addEventListener('userLoggedIn', () => {
    console.log('Событие входа пользователя получено в exchange.js');
    loadUserData();
  });
  
  window.addEventListener('userLoggedOut', () => {
    console.log('Событие выхода пользователя получено в exchange.js');
    loadUserData();
  });
  
  // Делаем функции глобально доступными
  window.calculateExchange = calculateExchange;
  window.getDecimalPlaces = getDecimalPlaces;
  window.getCurrencySymbol = getCurrencySymbol;
  window.getMinimumValue = getMinimumValue;
  window.formatCurrencyValue = formatCurrencyValue;
  window.processExchange = processExchange;
}); 