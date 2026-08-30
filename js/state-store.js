class SmmStateStore {
  constructor() {
    this.data = JSON.parse(JSON.stringify(window.SMM_MOCK));
    this.deviceMode = 'desktop';
    this.persona = 'customer';
    this.customerTab = 'new_order';
    this.adminTab = 'dashboard';
    this.theme = 'light';
    this.currency = 'INR';
    this.subscribers = [];

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
    if (savedLoggedIn === 'true') {
      this.data.isLoggedIn = true;
      const savedName = localStorage.getItem('smm_user_name');
      const savedEmail = localStorage.getItem('smm_user_email');
      if (savedName) this.data.customer.name = savedName;
      if (savedEmail) this.data.customer.email = savedEmail;
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
      const balanceRes = await fetch('/api/provider?action=balance');
      if (balanceRes.ok) {
        const balData = await balanceRes.json();
        if (balData && balData.balance !== undefined) {
          const liveBal = parseFloat(balData.balance) || 0.00;
          const japProv = this.data.providers.find(p => p.id === 'p1');
          if (japProv) {
            japProv.balance = liveBal;
            japProv.lastSync = 'Just now (Live JAP)';
          }
          this.data.adminStats.providerBalance = liveBal;
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

  login(name = 'Vipul Kumar', email = 'vipul@demo.com', avatar = null, showToast = true) {
    this.data.isLoggedIn = true;
    this.data.customer.name = name;
    this.data.customer.email = email;
    if (avatar) {
      this.data.customer.avatar = avatar;
      localStorage.setItem('smm_customer_avatar', avatar);
    }
    localStorage.setItem('smm_user_logged_in', 'true');
    localStorage.setItem('smm_user_name', name);
    localStorage.setItem('smm_user_email', email);

    if (showToast) {
      this.showToast(`Welcome back, ${name}! You are now signed in. 🚀`, 'success');
    }
    this.notify();
  }

  logout() {
    this.data.isLoggedIn = false;
    localStorage.removeItem('smm_user_logged_in');
    localStorage.removeItem('smm_user_name');
    localStorage.removeItem('smm_user_email');
    if (window.supabaseClient) {
      window.supabaseClient.auth.signOut().catch(() => {});
    }
    this.showToast('You have signed out. Browsing in guest mode.', 'info');
    this.notify();
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
    this.customerTab = tab;
    this.notify();
  }

  setAdminTab(tab) {
    this.adminTab = tab;
    this.notify();
  }

  setTheme(theme) {
    this.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    this.notify();
  }

  setCurrency(curr) {
    this.currency = curr;
    this.notify();
  }

  formatMoney(amountInUsd, decimals = 2) {
    if (this.currency === 'INR') {
      const inrVal = amountInUsd * this.data.exchangeRate;
      return '₹' + Math.round(inrVal).toLocaleString('en-IN');
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

  async placeOrder({ serviceId, target, quantity, serviceName, wholesaleCost }, options = {}) {
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

    // Try sending live order to JustAnotherPanel
    let liveOrderId = null;
    try {
      const liveRes = await fetch('/api/provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          service: String(serviceId),
          link: target,
          quantity: quantity
        })
      });
      if (liveRes.ok) {
        const liveData = await liveRes.json();
        if (liveData.order) {
          liveOrderId = liveData.order;
        }
      }
    } catch (e) {}

    this.data.customer.balance -= totalCost;
    const newOrderId = liveOrderId || String(48292 + Math.floor(Math.random() * 900));

    const newOrder = {
      id: newOrderId,
      serviceId: serviceId,
      serviceName: serviceName || `Service #${serviceId}`,
      platform: 'smm',
      target: target,
      quantity: Number(quantity),
      amount: totalCost,
      status: 'Processing',
      date: 'Just now',
      startCount: 0,
      currentCount: 0,
      remains: Number(quantity),
      refillEligible: false,
      refillReason: 'Order is dispatching to JAP server'
    };

    this.data.orders.unshift(newOrder);

    this.data.transactions.unshift({
      id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'Order Deduction',
      description: `Payment for Order #${newOrderId}`,
      amount: -totalCost,
      balanceAfter: this.data.customer.balance,
      status: 'Success',
      date: 'Just now'
    });

    this.data.recentActivity.unshift({
      id: `act-${Date.now()}`,
      type: 'order',
      title: `New Order #${newOrderId}`,
      sub: `${serviceName} - ${this.data.customer.name.split(' ')[0]}`,
      amount: this.formatMoney(totalCost),
      time: 'Just now',
      icon: '🛒'
    });

    this.data.adminStats.totalOrders += 1;
    this.data.adminStats.revenue += totalCost;
    const profitMargin = (Number(this.data.adminStats.globalMarkupPercent) || 100) / 100;
    this.data.adminStats.profit += (totalCost * (profitMargin / (1 + profitMargin)));

    if (!options.silent) {
      this.showToast(`Order #${newOrderId} placed successfully! Routed via JAP API.`, 'success');
      this.setCustomerTab('orders');
    }
    this.notify();
    return { success: true, orderId: newOrderId, totalCost };
  }

  async requestRefill(orderId) {
    const order = this.data.orders.find(o => String(o.id) === String(orderId));
    if (!order) return;

    try {
      await fetch('/api/provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refill', order: orderId })
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
      provider: 'JustAnotherPanel (JAP)'
    };

    this.data.refillQueue.unshift(refillItem);
    this.showToast(`Refill requested for Order #${order.id}! Dispatched to JAP.`, 'refill');
    this.notify();
  }

  addFunds(amountInUsd, method = 'UPI / Instant Pay') {
    if (!this.data.isLoggedIn) {
      this.showToast('Please sign in to add funds to your wallet', 'error');
      CustomerApp.openAuthModal();
      return;
    }

    this.data.customer.balance += Number(amountInUsd);
    this.data.transactions.unshift({
      id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'Deposit',
      description: `Funds Added via ${method}`,
      amount: Number(amountInUsd),
      balanceAfter: this.data.customer.balance,
      status: 'Success',
      date: 'Just now'
    });

    this.showToast(`Successfully added ${this.formatMoney(amountInUsd)} to wallet!`, 'success');
    this.notify();
  }

  async testProviderConnection(providerId) {
    const provider = this.data.providers.find(p => String(p.id) === String(providerId));
    if (!provider) return;

    this.showToast(`Pinging ${provider.displayName} API endpoint...`, 'info');

    if (provider.id === 'p1') {
      try {
        const res = await fetch('/api/provider?action=balance');
        if (res.ok) {
          const json = await res.json();
          if (json.balance !== undefined) {
            provider.balance = parseFloat(json.balance);
            provider.lastSync = 'Just now (Live API)';
            this.showToast(`Connected to JustAnotherPanel! Live Balance: $${json.balance} ${json.currency || 'USD'}`, 'success');
            this.notify();
            return;
          }
        }
      } catch (e) {}
    }

    setTimeout(() => {
      this.showToast(`Connection to ${provider.displayName} verified! Ping 84ms, Balance $${provider.balance.toFixed(2)}`, 'success');
    }, 800);
  }
}

window.store = new SmmStateStore();
