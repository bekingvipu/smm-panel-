class SmmStateStore {
  constructor() {
    this.data = JSON.parse(JSON.stringify(window.SMM_MOCK));
    this.deviceMode = 'mobile'; // 'mobile', 'tablet', 'desktop'
    this.persona = 'customer';  // 'customer', 'admin'
    this.customerTab = 'home';  // 'home', 'new_order', 'orders', 'wallet', 'support'
    this.adminTab = 'dashboard'; // 'dashboard', 'providers', 'sync_services', 'services', 'refills', 'orders', 'support'
    this.theme = 'light';       // 'light', 'dark'
    this.currency = 'USD';      // 'USD' or 'INR'
    this.subscribers = [];
    this.apiBase = window.location.origin.startsWith('http') ? window.location.origin : 'http://localhost:5050';
    this.initServerSync();
  }

  async initServerSync() {
    try {
      const profileRes = await fetch(`${this.apiBase}/api/customer/profile`);
      if (profileRes.ok) {
        const profile = await profileRes.json();
        this.data.customer.balance = profile.balance;
        this.data.customer.spent = profile.spent;
        this.data.customer.ordersCount = profile.ordersCount;
      }

      const servicesRes = await fetch(`${this.apiBase}/api/customer/services`);
      if (servicesRes.ok) {
        this.data.customerServices = await servicesRes.json();
      }

      const ordersRes = await fetch(`${this.apiBase}/api/customer/orders`);
      if (ordersRes.ok) {
        this.data.orders = await ordersRes.json();
      }

      const txnsRes = await fetch(`${this.apiBase}/api/customer/wallet/transactions`);
      if (txnsRes.ok) {
        this.data.transactions = await txnsRes.json();
      }

      this.notify();
    } catch (e) {
      // Running standalone / file protocol, stays on robust mock state
    }
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
      return '₹' + inrVal.toLocaleString('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
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
    const service = this.data.customerServices.find(s => String(s.id) === String(serviceId));
    if (!service) return { success: false, message: 'Service not found' };

    const totalCost = (service.pricePer1k / 1000) * quantity;
    if (this.data.customer.balance < totalCost) {
      this.showToast('Insufficient wallet balance. Please add funds.', 'error');
      return { success: false, message: 'Insufficient balance' };
    }

    try {
      const res = await fetch(`${this.apiBase}/api/customer/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId, target, quantity })
      });
      if (res.ok) {
        const json = await res.json();
        this.data.customer.balance = json.balance;
        this.showToast(`Order #${json.orderId} successfully dispatched via ${json.provider}!`, 'success');
        await this.initServerSync();
        this.setCustomerTab('orders');
        return { success: true, orderId: json.orderId };
      }
    } catch (e) {
      // Fallback
    }

    // Client-side fallback simulation
    this.data.customer.balance -= totalCost;
    const newOrderId = String(48292 + Math.floor(Math.random() * 900));

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
      sub: `${service.customerName} - alex`,
      amount: `$${totalCost.toFixed(2)}`,
      time: 'Just now',
      icon: '🛒'
    });

    this.data.adminStats.totalOrders += 1;
    this.data.adminStats.revenue += totalCost;
    this.data.adminStats.profit += (totalCost * 0.45);

    this.showToast(`Order #${newOrderId} placed successfully!`, 'success');
    this.setCustomerTab('orders');
    return { success: true, orderId: newOrderId };
  }

  async requestRefill(orderId) {
    const order = this.data.orders.find(o => String(o.id) === String(orderId));
    if (!order) return;

    try {
      const res = await fetch(`${this.apiBase}/api/customer/orders/${orderId}/refill`, {
        method: 'POST'
      });
      if (res.ok) {
        const json = await res.json();
        this.showToast(`Refill #${json.refill_id} requested for Order #${order.id}!`, 'refill');
        await this.initServerSync();
        return;
      }
    } catch (e) {}

    // Fallback simulation
    order.refillEligible = false;
    order.refillStatus = 'Refill Requested';
    order.refillReason = 'Refill cooldown active (24h)';

    const refillItem = {
      id: `ref-${Math.floor(1000 + Math.random() * 9000)}`,
      orderId: order.id,
      serviceName: order.serviceName,
      customerName: 'Alex Vance (alex@growthagency.io)',
      startCount: order.startCount,
      targetCount: order.startCount + order.quantity,
      currentCount: order.currentCount,
      dropCount: Math.max(0, (order.startCount + order.quantity) - order.currentCount),
      requestedAt: 'Just now',
      status: 'Pending',
      provider: 'API1_GlobalSMM'
    };

    this.data.refillQueue.unshift(refillItem);
    this.showToast(`Refill requested for Order #${order.id}! Upstream verification dispatched.`, 'refill');
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

  async addFunds(amountInUsd, method = 'UPI / Instant Pay') {
    try {
      const res = await fetch(`${this.apiBase}/api/customer/wallet/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountInUsd, method })
      });
      if (res.ok) {
        const json = await res.json();
        this.data.customer.balance = json.balance;
        this.showToast(`Successfully credited ${this.formatMoney(amountInUsd)} to wallet!`, 'success');
        await this.initServerSync();
        return;
      }
    } catch (e) {}

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

    try {
      const res = await fetch(`${this.apiBase}/api/admin/providers/${providerId}/test-connection`, {
        method: 'POST'
      });
      const json = await res.json();
      if (json.success) {
        this.showToast(`Connection to ${provider.displayName} verified! Balance: $${json.balance}`, 'success');
        return;
      } else {
        this.showToast(`Connection failed: ${json.error}`, 'error');
        return;
      }
    } catch (e) {}

    setTimeout(() => {
      if (provider.status === 'sync_failed') {
        this.showToast(`Connection failed to ${provider.displayName}: Invalid Auth Token / HTTP 401`, 'error');
      } else {
        this.showToast(`Connection to ${provider.displayName} verified! Ping 84ms, Balance $${provider.balance.toFixed(2)}`, 'success');
      }
    }, 800);
  }

  async importService({ rawServiceId, customerName, category, sellingPrice, refillPeriod, description }) {
    try {
      const res = await fetch(`${this.apiBase}/api/admin/services/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawServiceId, customerName, category, sellingPrice, refillPeriod, description })
      });
      if (res.ok) {
        this.showToast(`Imported "${customerName}" at ${this.formatMoney(sellingPrice)}/1K!`, 'success');
        await this.initServerSync();
        this.setAdminTab('services');
        return;
      }
    } catch (e) {}

    const raw = this.data.rawProviderServices.find(s => String(s.id) === String(rawServiceId));
    if (!raw) return;
    raw.status = 'Synced';
    const markup = Math.round(((sellingPrice - raw.cost) / raw.cost) * 100);

    const newCustomerService = {
      id: `cs-${Date.now()}`,
      customerName: customerName || raw.rawName,
      category: category || raw.category,
      platform: raw.platform,
      pricePer1k: Number(sellingPrice),
      min: raw.min,
      max: raw.max,
      deliverySpeed: '10K - 30K / Day',
      startTime: '0 - 15 Mins',
      refillSupported: raw.refillSupport,
      refillPeriod: refillPeriod || raw.refillPeriod,
      description: description || `High quality ${raw.category} service with high retention.`,
      active: true,
      providerMappings: [
        {
          providerId: raw.providerId,
          providerName: raw.providerName,
          serviceId: raw.id,
          providerCost: raw.cost,
          markupPercent: markup,
          isPrimary: true,
          status: 'Active'
        }
      ]
    };

    this.data.customerServices.unshift(newCustomerService);
    this.showToast(`Imported "${newCustomerService.customerName}" at ${this.formatMoney(sellingPrice)}/1K (${markup}% markup)!`, 'success');
    this.setAdminTab('services');
  }

  async switchPrimaryProvider(customerServiceId, targetProviderId) {
    try {
      await fetch(`${this.apiBase}/api/admin/services/${customerServiceId}/mappings/primary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId: targetProviderId })
      });
    } catch (e) {}

    const service = this.data.customerServices.find(s => String(s.id) === String(customerServiceId));
    if (!service) return;

    service.providerMappings.forEach(mapping => {
      if (String(mapping.providerId) === String(targetProviderId)) {
        mapping.isPrimary = true;
        mapping.status = 'Active';
      } else {
        mapping.isPrimary = false;
        mapping.status = 'Standby Failover';
      }
    });

    const active = service.providerMappings.find(m => m.isPrimary);
    this.showToast(`Active upstream provider for "${service.customerName}" switched to ${active.providerName}`, 'success');
    this.notify();
  }

  sendTicketMessage(ticketId, text) {
    const ticket = this.data.supportTickets.find(t => String(t.id) === String(ticketId));
    if (!ticket || !text.trim()) return;

    fetch(`${this.apiBase}/api/customer/tickets/${ticketId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    }).catch(() => {});

    ticket.messages.push({
      id: `m-${Date.now()}`,
      sender: 'customer',
      text: text.trim(),
      time: 'Just now'
    });
    ticket.status = 'Waiting on Staff';
    ticket.updatedAt = 'Just now';
    this.notify();

    setTimeout(() => {
      ticket.messages.push({
        id: `m-${Date.now() + 1}`,
        sender: 'admin',
        text: 'Thank you for reaching out! Our team has checked the order delivery queue. Everything is progressing normally.',
        time: 'Just now'
      });
      ticket.status = 'Answered';
      ticket.updatedAt = 'Just now';
      this.showToast('Support staff replied to your ticket!', 'info');
      this.notify();
    }, 2500);
  }

  createTicket({ subject, orderId, message }) {
    fetch(`${this.apiBase}/api/customer/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, orderId, message })
    }).catch(() => {});

    const newTicket = {
      id: `TCK-${Math.floor(100 + Math.random() * 900)}`,
      subject: subject || 'General Inquiry',
      linkedOrderId: orderId || null,
      status: 'Open',
      updatedAt: 'Just now',
      messages: [
        {
          id: `m-${Date.now()}`,
          sender: 'customer',
          text: message,
          time: 'Just now'
        }
      ]
    };

    this.data.supportTickets.unshift(newTicket);
    this.showToast(`Ticket #${newTicket.id} submitted! Support will respond shortly.`, 'success');
    this.notify();
  }
}

window.store = new SmmStateStore();
