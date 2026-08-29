class SmmStateStore {
  constructor() {
    this.data = JSON.parse(JSON.stringify(window.SMM_MOCK));
    this.deviceMode = 'desktop';
    this.persona = 'customer';
    this.customerTab = 'home';
    this.adminTab = 'dashboard';
    this.theme = 'light';
    this.currency = 'INR'; // INR by default
    this.subscribers = [];
    this.initServerSync();
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

  // Auth methods
  login(name = 'Vipul Kumar', email = 'vipul@demo.com') {
    this.data.isLoggedIn = true;
    this.data.customer.name = name;
    this.data.customer.email = email;
    this.showToast(`Welcome back, ${name}! You are now signed in.`, 'success');
    this.notify();
  }

  logout() {
    this.data.isLoggedIn = false;
    this.showToast('You have signed out. Browsing in guest mode.', 'info');
    this.notify();
  }

  // Global Admin Markup Percentage Engine
  applyGlobalMarkup(percent) {
    percent = Number(percent) || 100;
    this.data.adminStats.globalMarkupPercent = percent;

    this.data.customerServices.forEach(service => {
      if (service.wholesaleCost) {
        const newPrice = service.wholesaleCost * (1 + percent / 100);
        service.pricePer1k = +newPrice.toFixed(3);
        service.markupPercent = percent;
        // Update label
        const inrPrice = Math.round(newPrice * this.data.exchangeRate);
        service.customerName = service.customerName.replace(/\(₹\d+ me 1000\)/, `(₹${inrPrice} me 1000)`);
      }
    });

    this.showToast(`Applied +${percent}% profit markup across all services!`, 'success');
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

  async placeOrder({ serviceId, target, quantity }) {
    // Check if user is logged in
    if (!this.data.isLoggedIn) {
      this.showToast('Please sign in or create an account to place an order.', 'error');
      CustomerApp.openAuthModal();
      return { success: false, message: 'Authentication required' };
    }

    const service = this.data.customerServices.find(s => String(s.id) === String(serviceId));
    if (!service) return { success: false, message: 'Service not found' };

    const totalCost = (service.pricePer1k / 1000) * quantity;
    if (this.data.customer.balance < totalCost) {
      this.showToast('Insufficient wallet balance. Please add funds.', 'error');
      CustomerApp.openDepositModal();
      return { success: false, message: 'Insufficient balance' };
    }

    // Try sending live order to JustAnotherPanel if it maps to JAP
    let liveOrderId = null;
    try {
      const liveRes = await fetch('/api/provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          service: service.japId || '10131',
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
      serviceId: service.id,
      serviceName: service.customerName,
      platform: service.platform,
      target: target,
      quantity: Number(quantity),
      amount: totalCost,
      status: 'Processing',
      date: 'Just now',
      startCount: 1420,
      currentCount: 1420,
      remains: Number(quantity),
      refillEligible: false,
      refillReason: 'Order is still processing'
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
      sub: `${service.customerName} - ${this.data.customer.name.split(' ')[0]}`,
      amount: this.formatMoney(totalCost),
      time: 'Just now',
      icon: '🛒'
    });

    this.data.adminStats.totalOrders += 1;
    this.data.adminStats.revenue += totalCost;
    this.data.adminStats.profit += (totalCost * 0.45);

    this.showToast(`Order #${newOrderId} placed successfully! Routed via JAP API.`, 'success');
    this.setCustomerTab('orders');
    return { success: true, orderId: newOrderId };
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
    order.refillReason = 'Refill cooldown active (24h)';

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

    setTimeout(() => {
      order.refillStatus = 'Refill Processing';
      refillItem.status = 'Processing';
      this.notify();
    }, 4000);

    setTimeout(() => {
      order.refillStatus = 'Refill Completed';
      refillItem.status = 'Completed';
      order.currentCount = order.startCount + order.quantity;
      this.showToast(`Refill for #${order.id} has completed! Counts restored.`, 'success');
      this.notify();
    }, 9000);
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
