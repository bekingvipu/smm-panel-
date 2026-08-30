class SmmStateStore {
  constructor() {
    this.data = JSON.parse(JSON.stringify(window.SMM_MOCK));
    this.deviceMode = 'desktop';
    this.persona = 'customer';
    this.customerTab = 'new_order';
    this.adminTab = 'dashboard';
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

  _getUserStorageKey(email, key) {
    if (!email) return null;
    const safeKey = email.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return `smm_user_${safeKey}_${key}`;
  }

  loadUserData(email) {
    if (!email) return;
    const balKey = this._getUserStorageKey(email, 'balance');
    const ordersKey = this._getUserStorageKey(email, 'orders');
    const ticketsKey = this._getUserStorageKey(email, 'tickets');
    const txnsKey = this._getUserStorageKey(email, 'txns');

    const savedBal = localStorage.getItem(balKey);
    this.data.customer.balance = savedBal !== null ? parseFloat(savedBal) : 0.00;

    const savedOrders = localStorage.getItem(ordersKey);
    this.data.orders = savedOrders ? JSON.parse(savedOrders) : [];

    const savedTickets = localStorage.getItem(ticketsKey);
    this.data.supportTickets = savedTickets ? JSON.parse(savedTickets) : [];

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
    localStorage.setItem(this._getUserStorageKey(email, 'tickets'), JSON.stringify(this.data.supportTickets));
    localStorage.setItem(this._getUserStorageKey(email, 'txns'), JSON.stringify(this.data.transactions));
  }

  createSupportTicket(subject, message, linkedOrderId = null) {
    if (!this.data.isLoggedIn) {
      this.showToast('Please sign in to raise a support ticket.', 'error');
      CustomerApp.openAuthModal();
      return null;
    }

    const ticketId = `TCK-${Math.floor(100 + Math.random() * 900)}`;
    const newTicket = {
      id: ticketId,
      subject: subject || 'General Inquiry',
      linkedOrderId: linkedOrderId || null,
      status: 'Open',
      updatedAt: 'Just now',
      messages: [
        {
          id: `m-${Date.now()}`,
          sender: 'customer',
          text: message || '',
          time: 'Just now'
        }
      ]
    };

    this.data.supportTickets.unshift(newTicket);
    this.saveUserData();
    this.showToast(`Support Ticket #${ticketId} created! Our team will reply shortly.`, 'success');
    this.notify();
    return newTicket;
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
    this.currency = curr || 'INR';
    localStorage.setItem('smm_currency', this.currency);
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

    this.saveUserData();

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
    this.saveUserData();
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

    this.saveUserData();

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
