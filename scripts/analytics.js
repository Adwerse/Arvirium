// Advanced analytics functionality
document.addEventListener('DOMContentLoaded', () => {
  // Initialize global variables for chart instances
  window.volumeChartInstance = null;
  window.performanceChartInstance = null;

  // Create initial demo data
  const today = new Date();
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Create labels for last 7 days
  const dateLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return daysOfWeek[d.getDay()];
  });
  
  // Create sample volume data
  const volumeData = [125000, 142000, 168500, 152300, 190000, 210500, 180000];
  
  // Create sample performance data (ROI percentage)
  const performanceData = [-1.2, 0.3, 1.5, 2.7, 2.1, 4.5, 5.8];
  
  // Profit/Loss calculation
  const initialInvestment = JSON.parse(localStorage.getItem('transactions')) || [];
  let totalInvested = 0;
  let totalCoinsAtPurchase = 0;
  
  initialInvestment.forEach(tx => {
    if (!tx.type || tx.type === 'buy') { // Legacy support for older transaction format
      totalInvested += tx.amount || 0;
      totalCoinsAtPurchase += tx.coins || 0;
    }
  });
  
  // Get current values
  let currentValue = totalCoins * coinPrice;
  let profitLoss = currentValue - totalInvested;
  
  // Update profit/loss display
  const profitLossDisplay = document.getElementById('profitLossDisplay');
  if (profitLossDisplay) {
    profitLossDisplay.textContent = `€${profitLoss.toFixed(2)}`;
    if (profitLoss > 0) {
      profitLossDisplay.classList.add('positive-balance');
      profitLossDisplay.classList.remove('negative-balance');
    } else if (profitLoss < 0) {
      profitLossDisplay.classList.add('negative-balance');
      profitLossDisplay.classList.remove('positive-balance');
    }
  }
  
  // Initialize volume chart
  initVolumeChart();
  
  // Initialize performance chart
  initPerformanceChart();
  
  // Update sentiment gauge animation
  const gauge = document.getElementById('sentimentGauge');
  if (gauge) {
    const sentiment = 70; // 70% bullish sentiment (demo value)
    gauge.style.background = `conic-gradient(
      var(--color-primary) 0% ${sentiment}%,
      rgba(0, 0, 0, 0.1) ${sentiment}% 100%
    )`;
    
    // Add sentiment value inside gauge
    const gaugeAfter = document.createElement('style');
    gaugeAfter.textContent = `
      #sentimentGauge::after {
        content: '${sentiment}%';
        position: absolute;
        bottom: 10px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 1.2rem;
        font-weight: 700;
        color: var(--color-primary);
      }
    `;
    document.head.appendChild(gaugeAfter);
  }
  
  // Function to sell coins
  function calculateSellValue() {
    const coinsToSell = parseFloat(document.getElementById('sellCoins').value) || 0;
    const valueToReceive = coinsToSell * coinPrice;
    document.getElementById('sellValue').value = valueToReceive.toFixed(2);
  }
  
  // Initialize sell form
  const sellForm = document.getElementById('sell-form');
  const sellCoinsInput = document.getElementById('sellCoins');
  
  if (sellCoinsInput) {
    sellCoinsInput.addEventListener('input', calculateSellValue);
  }
  
  if (sellForm) {
    sellForm.addEventListener('submit', processSellTransaction);
  }
  
  function processSellTransaction(e) {
    e.preventDefault();
    const coinsToSell = parseFloat(document.getElementById('sellCoins').value);
    
    if (!coinsToSell || coinsToSell <= 0) {
      showNotification('Please enter a number of coins greater than 0', 'error');
      shakeElement(document.getElementById('sellCoins'));
      return;
    }
    
    if (coinsToSell > totalCoins) {
      showNotification('You don\'t have enough coins to sell', 'error');
      shakeElement(document.getElementById('sellCoins'));
      return;
    }
    
    const valueReceived = coinsToSell * coinPrice;
    
    // Update balances
    totalCoins -= coinsToSell;
    mainBalance += valueReceived;
    
    // Save to localStorage
    localStorage.setItem('totalCoins', totalCoins);
    localStorage.setItem('mainBalance', mainBalance);
    
    // Add sell transaction to history
    const transaction = {
      date: new Date().toLocaleString(),
      type: 'sell',
      coins: coinsToSell,
      amount: valueReceived,
      price: coinPrice
    };
    
    // Add to transaction history
    addSellToHistory(transaction);
    
    // Update displays
    displayBalance();
    
    // Clear form
    document.getElementById('sellCoins').value = '';
    document.getElementById('sellValue').value = '';
    
    // Show notification
    showNotification(`Sold ${coinsToSell.toFixed(2)} coins for €${valueReceived.toFixed(2)}`, 'success');
    
    // Animate button
    const sellButton = document.querySelector('.btn-sell');
    sellButton.classList.add('transaction-success');
    setTimeout(() => {
      sellButton.classList.remove('transaction-success');
    }, 1000);
    
    // Update profit/loss 
    updateProfitLoss();
  }
  
  function addSellToHistory(transaction) {
    const historyDiv = document.getElementById('transaction-history');
    const transactionElement = document.createElement('div');
    transactionElement.className = 'transaction-item';
    transactionElement.innerHTML = `
      <p><i class="fas fa-clock"></i> ${transaction.date}</p>
      <p><i class="fas fa-hand-holding-usd"></i> Sold: ${transaction.coins.toFixed(2)} coins</p>
      <p><i class="fas fa-money-bill-wave"></i> Received: €${transaction.amount.toFixed(2)}</p>
      <p><i class="fas fa-tag"></i> Coin price: €${transaction.price.toFixed(2)}</p>
    `;
    
    // Animation for new transaction
    transactionElement.style.opacity = '0';
    transactionElement.style.transform = 'translateX(-20px)';
    historyDiv.insertBefore(transactionElement, historyDiv.firstChild);
    
    setTimeout(() => {
      transactionElement.style.opacity = '1';
      transactionElement.style.transform = 'translateX(0)';
    }, 10);
    
    // Save to localStorage
    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    transactions.unshift(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }
  
  function updateProfitLoss() {
    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    let totalInvested = 0;
    let totalSold = 0;
    
    transactions.forEach(tx => {
      if (!tx.type || tx.type === 'buy') {
        totalInvested += tx.amount || 0;
      } else if (tx.type === 'sell') {
        totalSold += tx.amount || 0;
      }
    });
    
    // Calculate current value of holdings
    const currentValue = totalCoins * coinPrice;
    
    // Calculate total profit/loss
    const profitLoss = currentValue + totalSold - totalInvested;
    
    // Update display
    const profitLossDisplay = document.getElementById('profitLossDisplay');
    if (profitLossDisplay) {
      profitLossDisplay.textContent = `€${profitLoss.toFixed(2)}`;
      if (profitLoss > 0) {
        profitLossDisplay.classList.add('positive-balance');
        profitLossDisplay.classList.remove('negative-balance');
      } else if (profitLoss < 0) {
        profitLossDisplay.classList.add('negative-balance');
        profitLossDisplay.classList.remove('positive-balance');
      }
    }
  }
  
  // Initialize the volume chart
  function initVolumeChart() {
    const ctx = document.getElementById('volumeChart');
    if (!ctx) return;
    
    const ctx2d = ctx.getContext('2d');
    
    // Create gradient for bars
    const gradient = ctx2d.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(84, 179, 214, 0.8)');
    gradient.addColorStop(1, 'rgba(84, 179, 214, 0.1)');
    
    window.volumeChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: dateLabels,
        datasets: [{
          label: 'Trading Volume (€)',
          data: volumeData,
          backgroundColor: gradient,
          borderColor: 'rgba(84, 179, 214, 0.8)',
          borderWidth: 1,
          borderRadius: 5,
          hoverBackgroundColor: 'rgba(84, 179, 214, 1)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
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
            titleColor: '#54b3d6',
            bodyColor: '#f8f9fa',
            borderColor: '#54b3d6',
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
                return `Volume: €${context.raw.toLocaleString()}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.05)'
            },
            ticks: {
              color: '#bdbdbd',
              font: {
                family: "'Montserrat', sans-serif"
              },
              callback: function(value) {
                if (value >= 1000) {
                  return `€${value / 1000}k`;
                }
                return `€${value}`;
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
  
  // Initialize the performance chart
  function initPerformanceChart() {
    const ctx = document.getElementById('performanceChart');
    if (!ctx) return;
    
    window.performanceChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: dateLabels,
        datasets: [{
          label: 'ROI (%)',
          data: performanceData,
          borderColor: '#8bc34a',
          backgroundColor: 'rgba(139, 195, 74, 0.1)',
          pointBackgroundColor: '#8bc34a',
          pointBorderColor: '#fff',
          pointRadius: 5,
          pointHoverRadius: 7,
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
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
            titleColor: '#8bc34a',
            bodyColor: '#f8f9fa',
            borderColor: '#8bc34a',
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
                const value = context.raw;
                const prefix = value >= 0 ? '+' : '';
                return `ROI: ${prefix}${value}%`;
              }
            }
          }
        },
        scales: {
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)'
            },
            ticks: {
              color: '#bdbdbd',
              font: {
                family: "'Montserrat', sans-serif"
              },
              callback: function(value) {
                return value + '%';
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
  
  // Make the calculateSellValue function available globally
  window.calculateSellValue = calculateSellValue;
}); 