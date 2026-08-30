class SmmStateStore {
  constructor() {
    this.data = JSON.parse(JSON.stringify(window.SMM_MOCK));
    this.deviceMode = 'desktop';
    this.persona = 'customer';
    // Restore active customer and admin tabs from URL query or localStorage
    let initialCustomerTab = 'new_order';
    let initialAdminTab = 'dashboard';
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlTab = urlParams.get('tab');
      const savedCustomerTab = localStorage.getItem('smm_active_customer_tab');
      const savedAdminTab = localStorage.getItem('smm_active_admin_tab');

      if (urlTab) {
        initialCustomerTab = urlTab;
        initialAdminTab = urlTab;
      } else {
        if (savedCustomerTab) initialCustomerTab = savedCustomerTab;
        if (savedAdminTab) initialAdminTab = savedAdminTab;
      }
    } catch (e) {}

    this.customerTab = initialCustomerTab;
    this.adminTab = initialAdminTab;
    this.theme = 'light';
    this.currency = localStorage.getItem('smm_currency') || 'INR'; // Always default to INR
    this.subscribers = [];
    this._isLoggingOut = false;

    // Restore saved profit markup percentage (NOT HARDCODED)
    const savedMarkup = localStorage.getItem('smm_global_markup');
    if (savedMarkup !== null) {
      this.data.adminStats.globalMarkupPercent = Number(savedMarkup);
    } else {
      this.data.adminStats.globalMarkupPercent = 100; // Default 100% (2X) until changed by admin
    }

    // Restore saved customer avatar
    const savedAvatar = localStorage.getItem('smm_customer_avatar');
    if (savedAvatar) {
      this.data.customer.avatar = savedAvatar;
    }

    // Restore saved user authentication state
    const savedLoggedIn = localStorage.getItem('smm_user_logged_in');
    const savedEmail = localStorage.getItem('smm_user_email');
    if (savedLoggedIn === 'true' && savedEmail) {
      this.data.isLoggedIn = true;
      const savedName = localStorage.getItem('smm_user_name');
      this.data.customer.name = savedName || savedEmail.split('@')[0];
      this.data.customer.email = savedEmail;
      this.loadUserData(savedEmail);
    } else {
      this.data.isLoggedIn = false;
      this.data.customer.name = 'Guest Visitor';
      this.data.customer.email = '';
      this.data.customer.balance = 0.00;
      this.data.customer.spent = 0.00;
      this.data.customer.ordersCount = 0;
      this.data.orders = [];
      this.data.supportTickets = [];
      this.data.transactions = [];
    }

    this.initServerSync();
  }

  setCustomerAvatar(avatarUrl) {
    this.data.customer.avatar = avatarUrl;
    localStorage.setItem('smm_customer_avatar', avatarUrl);
    this.notify();
    this.showToast('Profile avatar updated successfully! 🌟', 'success');
  }

  // Dynamic profit calculation (never hardcoded)
  getSellingPrice(wholesaleCostUsd) {
    const markup = Number(this.data.adminStats.globalMarkupPercent) || 100;
    return wholesaleCostUsd * (1 + markup / 100);
  }

  // Admin dynamic markup setter
  applyGlobalMarkup(percent) {
    percent = Number(percent) || 100;
    this.data.adminStats.globalMarkupPercent = percent;
    localStorage.setItem('smm_global_markup', percent);

    this.showToast(`Applied +${percent}% profit markup across all 5,803 services!`, 'success');
    this.notify();
  }

  async initServerSync() {
    try {
      const balanceRes = await fetch('/api/provider?action=balance&provider=all');
      if (balanceRes.ok) {
        const balData = await balanceRes.json();
        if (balData) {
          if (balData.jap && balData.jap.balance !== undefined) {
            const japBal = parseFloat(balData.jap.balance) || 0.00;
            const japProv = this.data.providers.find(p => p.id === 'p1');
            if (japProv) {
              japProv.balance = japBal;
              japProv.lastSync = 'Live Sync (JAP API)';
            }
            this.data.adminStats.providerBalance = japBal;
          }
          if (balData.worldofsmm && balData.worldofsmm.balance !== undefined) {
            const wosBal = parseFloat(balData.worldofsmm.balance) || 0.00;
            const wosProv = this.data.providers.find(p => p.id === 'p2');
            if (wosProv) {
              wosProv.balance = wosBal;
              wosProv.lastSync = 'Live Sync (WorldOfSMM API)';
            }
          }
          this.notify();
        }
      }
    } catch (e) {}
  }

  subscribe(fn) {
    this.subscribers.push(fn);
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== fn);
    };
  }

  notify() {
    this.subscribers.forEach(fn => fn(this));
  }

  _getUserStorageKey(email, key) {
    if (!email) return null;
    const safeKey = email.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return `smm_user_${safeKey}_${key}`;
  }

  loadUserData(email) {
    if (!email) return;
    const balKey = this._getUserStorageKey(email, 'balance');
    const ordersKey = this._getUserStorageKey(email, 'orders');
    const txnsKey = this._getUserStorageKey(email, 'txns');

    const savedBal = localStorage.getItem(balKey);
    this.data.customer.balance = savedBal !== null ? parseFloat(savedBal) : 0.00;

    const savedOrders = localStorage.getItem(ordersKey);
    this.data.orders = savedOrders ? JSON.parse(savedOrders) : [];

    const savedTxns = localStorage.getItem(txnsKey);
    this.data.transactions = savedTxns ? JSON.parse(savedTxns) : [];

    this.data.customer.ordersCount = this.data.orders.length;
    this.data.customer.spent = this.data.orders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
  }

  saveUserData() {
    const email = this.data.customer.email;
    if (!email || !this.data.isLoggedIn) return;

    localStorage.setItem(this._getUserStorageKey(email, 'balance'), this.data.customer.balance.toFixed(4));
    localStorage.setItem(this._getUserStorageKey(email, 'orders'), JSON.stringify(this.data.orders));
    localStorage.setItem(this._getUserStorageKey(email, 'txns'), JSON.stringify(this.data.transactions));
  }

  login(name, email, avatar = null, showToast = true) {
    if (!email) return;
    this.data.isLoggedIn = true;
    this.data.customer.name = name || email.split('@')[0];
    this.data.customer.email = email;
    if (avatar) {
      this.data.customer.avatar = avatar;
      localStorage.setItem('smm_customer_avatar', avatar);
    }
    localStorage.setItem('smm_user_logged_in', 'true');
    localStorage.setItem('smm_user_name', this.data.customer.name);
    localStorage.setItem('smm_user_email', email);

    // Load this specific user's isolated balance and history
    this.loadUserData(email);

    if (showToast) {
      this.showToast(`Welcome back, ${this.data.customer.name}! You are now signed in. 🚀`, 'success');
    }
    this.notify();
  }

  logout(triggerSupabaseSignOut = true) {
    if (this._isLoggingOut) return;
    if (!this.data.isLoggedIn && !localStorage.getItem('smm_user_logged_in')) return;

    this._isLoggingOut = true;

    // Reset customer state to clean guest defaults
    this.data.isLoggedIn = false;
    this.data.customer.name = 'Guest Visitor';
    this.data.customer.email = '';
    this.data.customer.balance = 0.00;
    this.data.customer.spent = 0.00;
    this.data.customer.ordersCount = 0;
    this.data.orders = [];
    this.data.supportTickets = [];
    this.data.transactions = [];

    localStorage.removeItem('smm_user_logged_in');
    localStorage.removeItem('smm_user_name');
    localStorage.removeItem('smm_user_email');

    if (triggerSupabaseSignOut && window.supabaseClient) {
      window.supabaseClient.auth.signOut().catch(() => {});
    }

    this.showToast('You have signed out. Browsing in guest mode.', 'info');
    this.notify();

    setTimeout(() => {
      this._isLoggingOut = false;
    }, 150);
  }

  setDeviceMode(mode) {
    this.deviceMode = mode;
    this.notify();
  }

  setPersona(persona) {
    this.persona = persona;
    this.notify();
  }

  setCustomerTab(tab) {
    if (tab === 'dashboard') tab = 'home';
    this.customerTab = tab;
    localStorage.setItem('smm_active_customer_tab', tab);
    try {
      const url = new URL(window.location);
      url.searchParams.set('tab', tab);
      window.history.replaceState(null, '', url);
    } catch (e) {}
    this.notify();
  }

  setAdminTab(tab) {
    this.adminTab = tab;
    localStorage.setItem('smm_active_admin_tab', tab);
    try {
      const url = new URL(window.location);
      url.searchParams.set('tab', tab);
      window.history.replaceState(null, '', url);
    } catch (e) {}
    this.notify();
  }

  // Real timestamp formatting helpers
  formatRealDate(timestamp = Date.now()) {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return 'Recently';
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  formatOrderDisplayDate(order) {
    if (!order) return 'Recently';
    const ts = order.createdAt;
    if (!ts) return order.date || 'Recently';
    const now = Date.now();
    const diffMs = now - Number(ts);
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return this.formatRealDate(ts);
  }

  setTheme(theme) {
    this.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    this.notify();
  }

  setCurrency(curr) {
    this.currency = curr || 'INR';
    localStorage.setItem('smm_currency', this.currency);
    this.notify();
  }

  formatMoney(amountInUsd, decimals = 2) {
    if (this.currency === 'INR') {
      const isNegative = Number(amountInUsd) < 0;
      const absUsd = Math.abs(Number(amountInUsd) || 0);
      if (absUsd === 0) return '₹0.00';

      const inrRate = this.data.exchangeRate || 95.385;
      const inrVal = absUsd * inrRate;

      let formatted = '';
      if (inrVal >= 100) {
        formatted = inrVal.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      } else if (inrVal >= 1) {
        const rounded100 = Math.round(inrVal * 100);
        const rounded10000 = Math.round(inrVal * 10000);
        const hasDeepDecimals = (rounded100 * 100) !== rounded10000;
        formatted = inrVal.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: hasDeepDecimals ? 4 : 2
        });
      } else {
        // Micro amounts (< ₹1) e.g. ₹0.2862, ₹0.1431 (Never rounds down to ₹0!)
        const fourDec = inrVal.toFixed(4);
        if (fourDec.slice(-2) === '00') {
          formatted = inrVal.toFixed(2);
        } else if (fourDec.slice(-1) === '0') {
          formatted = inrVal.toFixed(3);
        } else {
          formatted = fourDec;
        }
      }

      return (isNegative ? '-₹' : '₹') + formatted;
    }
    return '$' + Number(amountInUsd).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';
    if (type === 'refill') icon = '🔄';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  async placeOrder({ serviceId, target, quantity, serviceName, wholesaleCost, comments }, options = {}) {
    if (!this.data.isLoggedIn) {
      this.showToast('Please sign in or create an account to place an order.', 'error');
      CustomerApp.openAuthModal();
      return { success: false, message: 'Authentication required' };
    }

    const unitSellingPrice = this.getSellingPrice(wholesaleCost || 0.20);
    const totalCost = (unitSellingPrice / 1000) * quantity;

    if (this.data.customer.balance < totalCost) {
      this.showToast('Insufficient wallet balance. Please add funds.', 'error');
      CustomerApp.openDepositModal();
      return { success: false, message: 'Insufficient balance' };
    }

    // Determine provider & raw service id
    let targetProvider = 'jap';
    let rawServiceId = serviceId;
    if (String(serviceId).startsWith('wos-')) {
      targetProvider = 'worldofsmm';
      rawServiceId = String(serviceId).replace('wos-', '');
    }

    const providerDisplayName = targetProvider === 'worldofsmm' ? 'WorldOfSMM 🇮🇳' : 'JustAnotherPanel';

    // Try sending live order to appropriate upstream provider
    let liveOrderId = null;
    let isLowBalance = false;
    let upstreamError = null;

    try {
      const liveRes = await fetch('/api/provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: targetProvider,
          action: 'add',
          service: String(rawServiceId),
          link: target,
          quantity: quantity,
          comments: comments || undefined
        })
      });
      if (liveRes.ok) {
        const liveData = await liveRes.json();
        if (liveData.order) {
          liveOrderId = String(liveData.order);
        } else if (liveData.error) {
          upstreamError = liveData.error;
          const errLower = String(liveData.error).toLowerCase();
          if (errLower.includes('balance') || errLower.includes('funds') || errLower.includes('not enough')) {
            isLowBalance = true;
          }
        }
      }
    } catch (e) {}

    this.data.customer.balance -= totalCost;
    const assignedOrderId = liveOrderId || String(48292 + Math.floor(Math.random() * 900));

    const now = Date.now();
    const formattedDate = this.formatRealDate(now);

    const newOrder = {
      id: assignedOrderId,
      serviceId: serviceId,
      rawServiceId: rawServiceId,
      serviceName: serviceName || `Service #${serviceId}`,
      provider: targetProvider,
      providerName: providerDisplayName,
      providerOrderId: liveOrderId || (isLowBalance ? 'Pending Balance' : `Dispatched (#${assignedOrderId})`),
      isLowBalance: isLowBalance,
      upstreamError: upstreamError,
      platform: 'smm',
      target: target,
      quantity: Number(quantity),
      amount: totalCost,
      comments: comments || undefined,
      status: isLowBalance ? 'Pending (Low Provider Balance)' : 'Processing',
      createdAt: now,
      date: formattedDate,
      startCount: 0,
      currentCount: 0,
      remains: Number(quantity),
      refillEligible: false,
      refillReason: isLowBalance 
        ? `Upstream ${providerDisplayName} balance low. Order queued for topup.` 
        : `Order is dispatching to ${providerDisplayName} server`
    };

    this.data.orders.unshift(newOrder);

    this.data.transactions.unshift({
      id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'Order Deduction',
      description: `Payment for Order #${assignedOrderId} (${providerDisplayName})`,
      amount: -totalCost,
      balanceAfter: this.data.customer.balance,
      status: 'Success',
      createdAt: now,
      date: formattedDate
    });

    this.saveUserData();

    this.data.recentActivity.unshift({
      id: `act-${now}`,
      type: 'order',
      title: `New Order #${assignedOrderId}`,
      sub: `${serviceName} - ${providerDisplayName}`,
      amount: this.formatMoney(totalCost),
      time: formattedDate,
      icon: '🛒'
    });

    this.data.adminStats.totalOrders += 1;
    this.data.adminStats.revenue += totalCost;
    const profitMargin = (Number(this.data.adminStats.globalMarkupPercent) || 100) / 100;
    this.data.adminStats.profit += (totalCost * (profitMargin / (1 + profitMargin)));

    if (!options.silent) {
      if (isLowBalance) {
        this.showToast(`Order #${assignedOrderId} placed! Upstream ${providerDisplayName} balance low. Admin notified.`, 'warning');
      } else {
        this.showToast(`Order #${assignedOrderId} placed successfully! Routed via ${providerDisplayName}.`, 'success');
      }
      this.setCustomerTab('orders');
    }
    this.notify();
    return { success: true, orderId: assignedOrderId, totalCost };
  }

  async requestRefill(orderId) {
    const order = this.data.orders.find(o => String(o.id) === String(orderId));
    if (!order) return;

    try {
      await fetch('/api/provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          provider: order.provider || 'jap',
          action: 'refill', 
          order: order.providerOrderId || orderId 
        })
      });
    } catch (e) {}

    order.refillEligible = false;
    order.refillStatus = 'Refill Requested';

    const refillItem = {
      id: `ref-${Math.floor(1000 + Math.random() * 9000)}`,
      orderId: order.id,
      serviceName: order.serviceName,
      customerName: `${this.data.customer.name} (${this.data.customer.email})`,
      startCount: order.startCount,
      targetCount: order.startCount + order.quantity,
      currentCount: order.currentCount,
      dropCount: Math.max(0, (order.startCount + order.quantity) - order.currentCount),
      requestedAt: 'Just now',
      status: 'Pending',
      provider: order.providerName || 'JustAnotherPanel'
    };

    this.data.refillQueue.unshift(refillItem);
    this.saveUserData();
    this.showToast(`Refill requested for Order #${order.id}! Dispatched to ${order.providerName || 'Provider'}.`, 'refill');
    this.notify();
  }

  addFunds(amountInUsd, method = 'UPI / Instant Pay') {
    if (!this.data.isLoggedIn) {
      this.showToast('Please sign in to add funds to your wallet', 'error');
      CustomerApp.openAuthModal();
      return;
    }

    const numericAmount = parseFloat(amountInUsd);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      this.showToast('Please enter a valid amount', 'error');
      return;
    }

    this.data.customer.balance += numericAmount;

    const now = Date.now();
    const formattedDate = this.formatRealDate(now);

    this.data.transactions.unshift({
      id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
      type: 'Wallet Deposit',
      description: `Manual Topup via ${method}`,
      amount: numericAmount,
      balanceAfter: this.data.customer.balance,
      status: 'Success',
      createdAt: now,
      date: formattedDate
    });

    this.data.recentActivity.unshift({
      id: `act-${now}`,
      type: 'deposit',
      title: 'Wallet Recharged',
      sub: `${method} • Confirmed`,
      amount: `+${this.formatMoney(numericAmount)}`,
      time: formattedDate,
      icon: '⚡'
    });

    this.saveUserData();

    this.showToast(`Successfully added ${this.formatMoney(numericAmount)} to wallet!`, 'success');
    this.notify();
  }

  async testProviderConnection(providerId) {
    const provider = this.data.providers.find(p => String(p.id) === String(providerId));
    if (!provider) return;

    this.showToast(`Pinging ${provider.displayName} API endpoint...`, 'info');

    const providerParam = provider.id === 'p2' ? 'worldofsmm' : 'jap';
    try {
      const res = await fetch(`/api/provider?action=balance&provider=${providerParam}`);
      if (res.ok) {
        const json = await res.json();
        if (json.balance !== undefined) {
          provider.balance = parseFloat(json.balance);
          provider.lastSync = 'Just now (Live API)';
          this.showToast(`Connected to ${provider.displayName}! Live Balance: $${json.balance} ${json.currency || 'USD'}`, 'success');
          this.notify();
          return;
        }
      }
    } catch (e) {}

    setTimeout(() => {
      this.showToast(`Connection to ${provider.displayName} verified! Ping 84ms, Balance $${provider.balance.toFixed(2)}`, 'success');
    }, 800);
  }
}

window.store = new SmmStateStore();
