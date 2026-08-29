document.addEventListener('DOMContentLoaded', () => {
  const store = window.store;

  const deviceWrapper = document.getElementById('device-wrapper');
  const screenContainer = document.getElementById('screen-container');

  // Top Bar Controls
  const btnPersonaCustomer = document.getElementById('btn-persona-customer');
  const btnPersonaAdmin = document.getElementById('btn-persona-admin');
  
  const btnModeMobile = document.getElementById('btn-mode-mobile');
  const btnModeTablet = document.getElementById('btn-mode-tablet');
  const btnModeDesktop = document.getElementById('btn-mode-desktop');

  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const btnCurrencyToggle = document.getElementById('btn-currency-toggle');
  const quickFlowSelect = document.getElementById('quick-flow-select');
  const btnResetData = document.getElementById('btn-reset-data');

  // Main Render Loop
  const renderApp = () => {
    // 1. Update Persona UI Controls
    if (store.persona === 'customer') {
      btnPersonaCustomer.classList.add('active');
      btnPersonaAdmin.classList.remove('active');
    } else {
      btnPersonaAdmin.classList.add('active');
      btnPersonaCustomer.classList.remove('active');
    }

    // 2. Update Device Frame Classes
    deviceWrapper.className = `device-wrapper mode-${store.deviceMode}`;
    
    [btnModeMobile, btnModeTablet, btnModeDesktop].forEach(btn => btn.classList.remove('active'));
    if (store.deviceMode === 'mobile') btnModeMobile.classList.add('active');
    if (store.deviceMode === 'tablet') btnModeTablet.classList.add('active');
    if (store.deviceMode === 'desktop') btnModeDesktop.classList.add('active');

    // 3. Update Theme Button Label
    btnThemeToggle.innerHTML = store.theme === 'light' ? '<span>🌙 Dark Mode</span>' : '<span>☀️ Light Mode</span>';

    // 4. Update Currency Button Label
    btnCurrencyToggle.innerHTML = store.currency === 'USD' ? '<span>💵 USD ($)</span>' : '<span>₹ INR (₹)</span>';

    // 5. Render Active Persona View
    if (store.persona === 'customer') {
      CustomerApp.render(screenContainer);
    } else {
      AdminApp.render(screenContainer);
    }
  };

  // Subscribe to state updates
  store.subscribe(renderApp);

  // Persona Click Handlers
  btnPersonaCustomer.addEventListener('click', () => {
    store.setPersona('customer');
  });

  btnPersonaAdmin.addEventListener('click', () => {
    store.setPersona('admin');
    if (store.deviceMode === 'mobile') {
      // Auto upgrade to desktop or tablet for best admin experience
      store.setDeviceMode('desktop');
    }
  });

  // Device Mode Handlers
  btnModeMobile.addEventListener('click', () => store.setDeviceMode('mobile'));
  btnModeTablet.addEventListener('click', () => store.setDeviceMode('tablet'));
  btnModeDesktop.addEventListener('click', () => store.setDeviceMode('desktop'));

  // Theme Toggle Handler
  btnThemeToggle.addEventListener('click', () => {
    const nextTheme = store.theme === 'light' ? 'dark' : 'light';
    store.setTheme(nextTheme);
  });

  // Currency Toggle Handler
  btnCurrencyToggle.addEventListener('click', () => {
    const nextCurrency = store.currency === 'USD' ? 'INR' : 'USD';
    store.setCurrency(nextCurrency);
    store.showToast(`Currency switched to ${nextCurrency} (${nextCurrency === 'INR' ? '₹' : '$'})`, 'info');
  });

  // Quick Flows Selector
  quickFlowSelect.addEventListener('change', (e) => {
    const flow = e.target.value;
    if (flow === 'customer_home') {
      store.setPersona('customer');
      store.setDeviceMode('mobile');
      store.setCustomerTab('home');
    } else if (flow === 'new_order') {
      store.setPersona('customer');
      store.setDeviceMode('mobile');
      store.setCustomerTab('new_order');
      store.showToast('New Order Flow: Category -> Service -> Target -> Real-time Calc -> Place Order', 'info');
    } else if (flow === 'refill_flow') {
      store.setPersona('customer');
      store.setDeviceMode('mobile');
      store.setCustomerTab('orders');
      store.showToast('Refill Flow: Inspect Order #48285 with active 30-Day Refill Guarantee!', 'refill');
    } else if (flow === 'wallet_funds') {
      store.setPersona('customer');
      store.setDeviceMode('mobile');
      store.setCustomerTab('wallet');
      store.showToast('Wallet & Add Funds: Select preset amount and instant deposit simulation', 'info');
    } else if (flow === 'admin_dashboard') {
      store.setPersona('admin');
      store.setDeviceMode('desktop');
      store.setAdminTab('dashboard');
    } else if (flow === 'provider_sync') {
      store.setPersona('admin');
      store.setDeviceMode('desktop');
      store.setAdminTab('sync_services');
      store.showToast('Provider Services Sync: Filter raw services & test "Ready to Import" markup calculator', 'info');
    } else if (flow === 'multi_provider_mapping') {
      store.setPersona('admin');
      store.setDeviceMode('desktop');
      store.setAdminTab('services');
      setTimeout(() => {
        AdminApp.openMultiProviderMappingDrawer('cs-1');
      }, 200);
      store.showToast('Multi-Provider Mapping: 1 Customer Service connected to 3 upstream providers', 'info');
    } else if (flow === 'refills_queue') {
      store.setPersona('admin');
      store.setDeviceMode('desktop');
      store.setAdminTab('refills');
    }
  });

  // Reset Data Handler
  btnResetData.addEventListener('click', () => {
    if (confirm('Reset prototype mock data to original defaults?')) {
      store.data = JSON.parse(JSON.stringify(window.SMM_MOCK));
      store.showToast('Mock state reset to factory defaults', 'info');
      store.notify();
    }
  });

  // Close generic modal on backdrop click
  const modalBackdrop = document.getElementById('generic-modal-backdrop');
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) {
      CustomerApp.closeModal();
    }
  });

  // Initial render
  renderApp();
});
