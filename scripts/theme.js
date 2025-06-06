// Theme toggle functionality
document.addEventListener('DOMContentLoaded', () => {
  const themeToggleBtn = document.getElementById('themeToggle');
  const body = document.body;
  
  // Check for saved theme preference
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    body.className = savedTheme;
    // Update icons visibility based on current theme
    updateThemeIcons(savedTheme === 'theme-dark');
  } else {
    // Default to dark theme if no preference is saved
    body.className = 'theme-dark';
    localStorage.setItem('theme', 'theme-dark');
    updateThemeIcons(true);
  }
  
  // Function to update theme icons
  function updateThemeIcons(isDarkTheme) {
    const moonIcon = themeToggleBtn.querySelector('.fa-moon');
    const sunIcon = themeToggleBtn.querySelector('.fa-sun');
    
    if (isDarkTheme) {
      moonIcon.style.display = 'none';
      sunIcon.style.display = 'inline-block';
    } else {
      moonIcon.style.display = 'inline-block';
      sunIcon.style.display = 'none';
    }
  }
  
  // Toggle theme on button click
  themeToggleBtn.addEventListener('click', () => {
    const isDarkTheme = body.classList.contains('theme-dark');
    
    if (isDarkTheme) {
      body.classList.remove('theme-dark');
      body.classList.add('theme-light');
      localStorage.setItem('theme', 'theme-light');
      updateThemeIcons(false);
    } else {
      body.classList.remove('theme-light');
      body.classList.add('theme-dark');
      localStorage.setItem('theme', 'theme-dark');
      updateThemeIcons(true);
    }
    
    // Update all charts to match theme
    setTimeout(() => {
      updateChartsForTheme();
      updateElementColors();
    }, 50); // Small delay to ensure DOM updates before chart refresh
  });
  
  // Function to update text colors for all elements
  function updateElementColors() {
    // Force repaint of elements with transitions
    document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, .card-content, .premium-input, .nav-links a, .logo-text, .premium-card, .rate-card, .coin-balance-item, .transaction-item')
      .forEach(el => {
        el.style.transition = 'none';
        el.offsetHeight; // Trigger reflow
        el.style.transition = '';
      });
  }
  
  // Function to update chart themes
  function updateChartsForTheme() {
    const isDarkTheme = body.classList.contains('theme-dark');
    const textColor = isDarkTheme ? '#f8f9fa' : '#212121';
    const gridColor = isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    
    // General chart update function
    function updateChartTheme(chart) {
      if (!chart) return;
      
      // Update scales if they exist
      if (chart.options.scales) {
        if (chart.options.scales.y) {
          chart.options.scales.y.grid.color = gridColor;
          chart.options.scales.y.ticks.color = textColor;
        }
        if (chart.options.scales.x) {
          chart.options.scales.x.grid.color = gridColor;
          chart.options.scales.x.ticks.color = textColor;
        }
      }
      
      // Update legend if it exists
      if (chart.options.plugins && chart.options.plugins.legend) {
        chart.options.plugins.legend.labels.color = textColor;
      }
      
      chart.update();
    }
    
    // Update all charts
    if (window.priceChartInstance) {
      updateChartTheme(window.priceChartInstance);
    }
    
    if (window.portfolioChartInstance) {
      // For doughnut/pie charts
      if (window.portfolioChartInstance.options.plugins && 
          window.portfolioChartInstance.options.plugins.legend) {
        window.portfolioChartInstance.options.plugins.legend.labels.color = textColor;
        window.portfolioChartInstance.update();
      }
    }
    
    // Update other charts
    ['volumeChartInstance', 'performanceChartInstance'].forEach(chartName => {
      if (window[chartName]) {
        updateChartTheme(window[chartName]);
      }
    });
    
    // Dispatch event for other components to update their charts
    document.dispatchEvent(new CustomEvent('themeChanged', {
      detail: { isDarkTheme }
    }));
  }
  
  // Initialize tab navigation
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked button and related content
      button.classList.add('active');
      const tabId = button.getAttribute('data-tab');
      document.getElementById(`${tabId}-tab`).classList.add('active');
    });
  });
  
  // Call updateChartsForTheme on initial load
  // Add a short delay to ensure charts are initialized
  setTimeout(() => {
    updateChartsForTheme();
  }, 500);
});