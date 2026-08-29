const CustomerApp = {
  render(container) {
    const store = window.store;
    const tab = store.customerTab;

    let contentHtml = '';
    if (tab === 'home') contentHtml = this.renderHomeTab(store);
    else if (tab === 'new_order') contentHtml = this.renderNewOrderTab(store);
    else if (tab === 'orders') contentHtml = this.renderOrdersTab(store);
    else if (tab === 'wallet') contentHtml = this.renderWalletTab(store);
    else if (tab === 'support') contentHtml = this.renderSupportTab(store);

    container.innerHTML = `
      <div class="customer-container">
        <!-- Header -->
        <header class="customer-header">
          <div class="customer-brand-group">
            <img src="${store.data.customer.avatar}" alt="Avatar" class="customer-avatar" onclick="CustomerApp.openProfileModal()" title="View Profile" />
            <div class="customer-brand-name">SMM Pro</div>
          </div>
          <div class="customer-header-actions">
            <button class="header-icon-btn" onclick="CustomerApp.openNotifications()" aria-label="Notifications">
              <span>🔔</span>
              <span class="notification-dot"></span>
            </button>
          </div>
        </header>

        <!-- View Body -->
        <main class="customer-view-content">
          ${contentHtml}
        </main>

        <!-- Fixed Mobile Bottom Navigation Bar -->
        <nav class="customer-bottom-nav">
          <div class="bottom-nav-item ${tab === 'home' ? 'active' : ''}" onclick="store.setCustomerTab('home')">
            <div class="nav-icon ${tab === 'home' ? 'nav-icon-bg' : ''}">
              <span>⊞</span>
            </div>
            <span>Home</span>
          </div>

          <div class="bottom-nav-item ${tab === 'new_order' ? 'active' : ''}" onclick="store.setCustomerTab('new_order')">
            <div class="nav-icon ${tab === 'new_order' ? 'nav-icon-bg' : ''}">
              <span>🛒</span>
            </div>
            <span>New Order</span>
          </div>

          <div class="bottom-nav-item ${tab === 'orders' ? 'active' : ''}" onclick="store.setCustomerTab('orders')">
            <div class="nav-icon ${tab === 'orders' ? 'nav-icon-bg' : ''}">
              <span>⏱️</span>
            </div>
            <span>Orders</span>
          </div>

          <div class="bottom-nav-item ${tab === 'wallet' ? 'active' : ''}" onclick="store.setCustomerTab('wallet')">
            <div class="nav-icon ${tab === 'wallet' ? 'nav-icon-bg' : ''}">
              <span>💳</span>
            </div>
            <span>Wallet</span>
          </div>

          <div class="bottom-nav-item ${tab === 'support' ? 'active' : ''}" onclick="store.setCustomerTab('support')">
            <div class="nav-icon ${tab === 'support' ? 'nav-icon-bg' : ''}">
              <span>💬</span>
            </div>
            <span>Support</span>
          </div>
        </nav>
      </div>
    `;

    // Attach dynamic listeners
    this.bindEvents();
  },

  // 1. HOME TAB (Directly matches Screenshot 4)
  renderHomeTab(store) {
    const recentOrders = store.data.orders.slice(0, 4);

    return `
      <!-- Balance Hero Card (Screenshot 4) -->
      <div class="balance-hero-card">
        <div class="balance-hero-header">
          <div>
            <div class="balance-label">Current Balance</div>
            <div class="balance-amount">${store.formatMoney(store.data.customer.balance)}</div>
          </div>
          <div class="balance-icon-pill">
            <span>💳</span>
          </div>
        </div>
        <button class="btn btn-primary btn-block" onclick="store.setCustomerTab('wallet')">
          <span>＋ Add Funds</span>
        </button>
      </div>

      <!-- Quick Actions 2-Column Grid (Screenshot 4) -->
      <div class="quick-actions-grid">
        <div class="quick-action-card" onclick="store.setCustomerTab('new_order')">
          <div class="action-icon-circle">
            <span>🛒</span>
          </div>
          <div class="action-card-title">New Order</div>
        </div>

        <div class="quick-action-card" onclick="CustomerApp.quickRefillFilter()">
          <div class="action-icon-circle">
            <span>🔄</span>
          </div>
          <div class="action-card-title">Refill Request</div>
        </div>
      </div>

      <!-- Recent Orders Header -->
      <div class="section-header-row">
        <div class="section-title">Recent Orders</div>
        <a class="section-link" onclick="store.setCustomerTab('orders')">View All</a>
      </div>

      <!-- Recent Orders List Cards (Screenshot 4) -->
      <div class="mobile-orders-list">
        ${recentOrders.map(order => this.renderOrderCard(order, store)).join('')}
      </div>
    `;
  },

  // Helper for Order Card
  renderOrderCard(order, store) {
    let icon = '👍';
    if (order.platform === 'youtube') icon = '👁️';
    if (order.platform === 'tiktok') icon = '❤️';
    if (order.platform === 'twitter') icon = '𝕏';

    let badgeClass = 'badge-primary';
    if (order.status === 'Processing') badgeClass = 'badge-success';
    if (order.status === 'In Progress') badgeClass = 'badge-info';
    if (order.status === 'Completed') badgeClass = 'badge-neutral';

    let refillBadge = '';
    if (order.refillStatus && order.refillStatus.includes('Refill')) {
      refillBadge = `<span class="badge badge-warning" style="margin-left: 6px;"><span class="badge-dot"></span>${order.refillStatus}</span>`;
    }

    return `
      <div class="mobile-order-card" onclick="CustomerApp.openOrderDetails('${order.id}')">
        <div class="order-card-top">
          <div class="order-platform-icon">${icon}</div>
          <div class="order-card-info">
            <div class="order-service-title">${order.serviceName}</div>
            <div class="order-id-sub">ID: #${order.id} ${refillBadge}</div>
          </div>
          <div class="order-card-price">${store.formatMoney(order.amount)}</div>
        </div>

        <div class="order-card-bottom">
          <span class="badge ${badgeClass}">
            <span class="badge-dot"></span>
            ${order.status}
          </span>
          <span class="order-qty-label">Qty: ${Number(order.quantity).toLocaleString()}</span>
        </div>
      </div>
    `;
  },

  // 2. NEW ORDER TAB (Linear, tap-friendly, real-time calculation)
  renderNewOrderTab(store) {
    const services = store.data.customerServices;
    const initialService = services[0];

    return `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div>
          <h2 style="font-size: 20px; font-weight: 800;">Place New Order</h2>
          <p style="font-size: 13px;">Select a service and enter your target link.</p>
        </div>

        <!-- Step 1: Category Filter Chips -->
        <div class="form-group" style="margin-bottom: 4px;">
          <label class="form-label">Category</label>
          <div class="platform-chips-scroll" id="new-order-category-chips">
            <button class="platform-chip active" data-cat="all">All Services</button>
            <button class="platform-chip" data-cat="instagram">Instagram</button>
            <button class="platform-chip" data-cat="youtube">YouTube</button>
            <button class="platform-chip" data-cat="tiktok">TikTok</button>
            <button class="platform-chip" data-cat="twitter">Twitter / X</button>
          </div>
        </div>

        <!-- Step 2: Service Selector -->
        <div class="form-group">
          <label class="form-label">Service</label>
          <select class="form-select" id="new-order-service-select">
            ${services.map(s => `
              <option value="${s.id}" data-price="${s.pricePer1k}" data-min="${s.min}" data-max="${s.max}">
                ${s.customerName} — ${store.formatMoney(s.pricePer1k)}/1K
              </option>
            `).join('')}
          </select>
        </div>

        <!-- Step 3: Service Details Card -->
        <div class="service-details-card" id="service-details-box">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: var(--primary);">Service Specification</strong>
            <span class="badge ${initialService.refillSupported ? 'badge-success' : 'badge-neutral'}">
              ${initialService.refillSupported ? `🛡️ ${initialService.refillPeriod} Refill` : 'No Refill'}
            </span>
          </div>
          <p id="service-detail-desc" style="font-size: 12.5px; color: var(--text-secondary);">
            ${initialService.description}
          </p>
          <div class="service-meta-grid" style="margin-top: 6px;">
            <div class="meta-item">
              <span class="meta-item-label">Min / Max Limit</span>
              <span class="meta-item-val" id="service-detail-limits">${initialService.min.toLocaleString()} / ${initialService.max.toLocaleString()}</span>
            </div>
            <div class="meta-item">
              <span class="meta-item-label">Avg Speed</span>
              <span class="meta-item-val" id="service-detail-speed">${initialService.deliverySpeed}</span>
            </div>
            <div class="meta-item">
              <span class="meta-item-label">Start Time</span>
              <span class="meta-item-val" id="service-detail-start">${initialService.startTime}</span>
            </div>
            <div class="meta-item">
              <span class="meta-item-label">Refill Guarantee</span>
              <span class="meta-item-val" id="service-detail-refill">${initialService.refillSupported ? initialService.refillPeriod : 'None'}</span>
            </div>
          </div>
        </div>

        <!-- Step 4: Target Link / Username -->
        <div class="form-group">
          <label class="form-label">
            <span>Target Link / Profile</span>
            <span class="form-label-hint">Public accounts only</span>
          </label>
          <div style="position: relative;">
            <input type="url" class="form-input" id="new-order-target" placeholder="https://instagram.com/yourprofile" value="https://instagram.com/creator_daily" />
            <button type="button" class="btn btn-sm btn-secondary" style="position: absolute; right: 6px; top: 6px; height: 34px; padding: 0 10px;" onclick="CustomerApp.pasteSampleLink()">
              Paste
            </button>
          </div>
        </div>

        <!-- Step 5: Quantity -->
        <div class="form-group">
          <label class="form-label">
            <span>Quantity</span>
            <span class="form-label-hint" id="qty-limits-hint">Min: 100 | Max: 50,000</span>
          </label>
          <input type="number" class="form-input" id="new-order-quantity" value="1000" min="100" max="50000" step="100" />
          <div class="qty-preset-chips">
            <button type="button" class="qty-preset-btn" onclick="CustomerApp.setQty(500)">+500</button>
            <button type="button" class="qty-preset-btn" onclick="CustomerApp.setQty(1000)">+1,000</button>
            <button type="button" class="qty-preset-btn" onclick="CustomerApp.setQty(2500)">+2,500</button>
            <button type="button" class="qty-preset-btn" onclick="CustomerApp.setQty(5000)">+5,000</button>
          </div>
        </div>

        <!-- Step 6: Live Price Calculation Box -->
        <div class="calculation-summary-card">
          <div class="calc-row">
            <span>Unit Rate (per 1,000):</span>
            <strong id="calc-rate-label">${store.formatMoney(initialService.pricePer1k)}</strong>
          </div>
          <div class="calc-row">
            <span>Current Wallet Balance:</span>
            <span>${store.formatMoney(store.data.customer.balance)}</span>
          </div>
          <div class="calc-row total-row">
            <span>Total Charge:</span>
            <span id="calc-total-label">${store.formatMoney((initialService.pricePer1k / 1000) * 1000)}</span>
          </div>
          <div id="balance-check-status" style="margin-top: 4px;">
            <span class="balance-status-pill badge-success">✓ Sufficient Wallet Balance</span>
          </div>
        </div>

        <!-- Step 7: Submit Button -->
        <button class="btn btn-primary btn-lg btn-block" id="btn-submit-order" onclick="CustomerApp.handlePlaceOrder()">
          <span>Confirm & Place Order</span>
        </button>
      </div>
    `;
  },

  // 3. ORDERS TAB (Mobile Cards, Filter Tabs, Smart Refill Action)
  renderOrdersTab(store) {
    const orders = store.data.orders;

    return `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h2 style="font-size: 20px; font-weight: 800;">My Orders</h2>
          <span class="badge badge-primary">${orders.length} Total</span>
        </div>

        <!-- Filter Tabs -->
        <div class="platform-chips-scroll" id="orders-filter-chips">
          <button class="platform-chip active" data-filter="all">All (${orders.length})</button>
          <button class="platform-chip" data-filter="in_progress">In Progress</button>
          <button class="platform-chip" data-filter="completed">Completed</button>
          <button class="platform-chip" data-filter="processing">Processing</button>
          <button class="platform-chip" data-filter="refillable">Refill Eligible 🛡️</button>
        </div>

        <!-- Orders List -->
        <div class="mobile-orders-list" id="customer-orders-container">
          ${orders.map(order => this.renderDetailedOrderCard(order, store)).join('')}
        </div>
      </div>
    `;
  },

  renderDetailedOrderCard(order, store) {
    let badgeClass = 'badge-primary';
    if (order.status === 'Processing') badgeClass = 'badge-success';
    if (order.status === 'In Progress') badgeClass = 'badge-info';
    if (order.status === 'Completed') badgeClass = 'badge-neutral';

    const canRefill = order.refillEligible && order.status === 'Completed';

    return `
      <div class="card" style="display: flex; flex-direction: column; gap: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <div style="font-size: 14.5px; font-weight: 700; color: var(--text-main);">${order.serviceName}</div>
            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
              Order #${order.id} • ${order.date}
            </div>
          </div>
          <span class="badge ${badgeClass}"><span class="badge-dot"></span>${order.status}</span>
        </div>

        <div style="background: var(--bg-subtle); padding: 10px 12px; border-radius: var(--radius-sm); font-size: 12.5px;">
          <div style="color: var(--text-muted); font-size: 11px; text-transform: uppercase; font-weight: 600;">Target</div>
          <div style="font-family: var(--font-mono); color: var(--text-main); word-break: break-all; margin-top: 2px;">
            ${order.target}
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; font-size: 12px; text-align: center; background: var(--bg-surface); padding: 8px 0;">
          <div>
            <div style="color: var(--text-muted); font-size: 11px;">Quantity</div>
            <strong style="color: var(--text-main);">${order.quantity.toLocaleString()}</strong>
          </div>
          <div>
            <div style="color: var(--text-muted); font-size: 11px;">Current</div>
            <strong style="color: var(--text-main);">${order.currentCount.toLocaleString()}</strong>
          </div>
          <div>
            <div style="color: var(--text-muted); font-size: 11px;">Charge</div>
            <strong style="color: var(--primary);">${store.formatMoney(order.amount)}</strong>
          </div>
        </div>

        <!-- Refill Area (Only shown if eligible or in refill state) -->
        ${order.refillStatus && order.refillStatus.includes('Refill') ? `
          <div style="display: flex; align-items: center; justify-content: space-between; background: var(--warning-light); padding: 8px 12px; border-radius: var(--radius-sm);">
            <span style="font-size: 12px; font-weight: 700; color: var(--warning);">
              🔄 ${order.refillStatus}
            </span>
            <span style="font-size: 11px; color: var(--text-secondary);">Provider Sync Active</span>
          </div>
        ` : ''}

        <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 8px; border-top: 1px dashed var(--border-color);">
          <button class="btn btn-sm btn-secondary" onclick="CustomerApp.openOrderDetails('${order.id}')">
            View Details
          </button>

          ${canRefill ? `
            <button class="btn-refill" onclick="CustomerApp.promptRefill('${order.id}')">
              <span>🔄 Request Refill</span>
            </button>
          ` : (order.status === 'Completed' && !order.refillEligible && !order.refillStatus ? `
            <span style="font-size: 11px; color: var(--text-muted);">Refill Guarantee Expired / N/A</span>
          ` : '')}
        </div>
      </div>
    `;
  },

  // 4. WALLET TAB (Add Funds & Transactions)
  renderWalletTab(store) {
    const transactions = store.data.transactions;

    return `
      <div style="display: flex; flex-direction: column; gap: 18px;">
        <!-- Wallet Hero Card -->
        <div class="balance-hero-card">
          <div class="balance-hero-header">
            <div>
              <div class="balance-label">Wallet Balance</div>
              <div class="balance-amount">${store.formatMoney(store.data.customer.balance)}</div>
            </div>
            <div class="balance-icon-pill"><span>💰</span></div>
          </div>
          <p style="font-size: 12.5px; color: var(--text-secondary);">
            Instant auto-deposit. Funds are credited within seconds.
          </p>
        </div>

        <!-- Add Funds Section -->
        <div class="card" style="display: flex; flex-direction: column; gap: 14px;">
          <h3 style="font-size: 16px; font-weight: 700;">Add Funds to Wallet</h3>

          <!-- Preset Amounts -->
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
            <button class="btn btn-sm btn-secondary" onclick="CustomerApp.setDepositAmount(10)">$10</button>
            <button class="btn btn-sm btn-secondary" onclick="CustomerApp.setDepositAmount(25)">$25</button>
            <button class="btn btn-sm btn-secondary" onclick="CustomerApp.setDepositAmount(50)">$50</button>
            <button class="btn btn-sm btn-secondary" onclick="CustomerApp.setDepositAmount(100)">$100</button>
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Custom Deposit Amount (USD)</label>
            <input type="number" class="form-input" id="add-funds-amount-input" value="25" min="5" max="5000" />
          </div>

          <!-- Payment Method Selector -->
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Payment Method</label>
            <select class="form-select" id="add-funds-method-select">
              <option value="UPI / Instant QR (0% Fee)">UPI / Instant QR (Google Pay, PhonePe, Paytm)</option>
              <option value="Credit / Debit Card (Stripe)">Credit / Debit Card (Visa, Mastercard)</option>
              <option value="Cryptocurrency (USDT TRC20 / BTC)">Crypto (USDT TRC20 / BTC / ETH)</option>
              <option value="Net Banking / IMPS">Net Banking / IMPS Bank Transfer</option>
            </select>
          </div>

          <button class="btn btn-primary btn-block" onclick="CustomerApp.handleDeposit()">
            <span>Proceed to Deposit</span>
          </button>
        </div>

        <!-- Transaction History -->
        <div>
          <div class="section-header-row" style="margin-bottom: 12px;">
            <div class="section-title">Transaction History</div>
            <span class="badge badge-neutral">${transactions.length} Records</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${transactions.map(txn => `
              <div class="card" style="padding: 14px; display: flex; align-items: center; justify-content: space-between;">
                <div>
                  <div style="font-size: 13.5px; font-weight: 700; color: var(--text-main);">${txn.description}</div>
                  <div style="font-size: 11.5px; color: var(--text-secondary); margin-top: 2px;">
                    ${txn.id} • ${txn.date}
                  </div>
                </div>
                <div style="text-align: right;">
                  <strong style="font-size: 14.5px; color: ${txn.amount >= 0 ? 'var(--success)' : 'var(--text-main)'};">
                    ${txn.amount >= 0 ? '+' : ''}${store.formatMoney(txn.amount)}
                  </strong>
                  <div style="font-size: 11px; color: var(--text-muted);">Bal: ${store.formatMoney(txn.balanceAfter)}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  // 5. SUPPORT TAB (Tickets & Interactive Chat)
  renderSupportTab(store) {
    const tickets = store.data.supportTickets;

    return `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h2 style="font-size: 20px; font-weight: 800;">Support Desk</h2>
            <p style="font-size: 13px;">We typically respond in under 15 minutes.</p>
          </div>
          <button class="btn btn-primary btn-sm" onclick="CustomerApp.openNewTicketModal()">
            ＋ New Ticket
          </button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${tickets.map(ticket => `
            <div class="card" style="display: flex; flex-direction: column; gap: 10px; cursor: pointer;" onclick="CustomerApp.openTicketChat('${ticket.id}')">
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="font-size: 14px; font-weight: 700; color: var(--text-main);">${ticket.subject}</div>
                <span class="badge ${ticket.status === 'Answered' ? 'badge-success' : 'badge-warning'}">
                  ${ticket.status}
                </span>
              </div>
              <div style="font-size: 12px; color: var(--text-secondary);">
                Ticket #${ticket.id} ${ticket.linkedOrderId ? `• Linked to Order #${ticket.linkedOrderId}` : ''}
              </div>
              <div style="font-size: 11.5px; color: var(--text-muted); border-top: 1px dashed var(--border-color); padding-top: 6px;">
                Last message ${ticket.updatedAt} • Tap to view chat thread
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  // Dynamic Event Handlers
  bindEvents() {
    const serviceSelect = document.getElementById('new-order-service-select');
    const qtyInput = document.getElementById('new-order-quantity');

    if (serviceSelect && qtyInput) {
      const updateCalc = () => {
        const store = window.store;
        const selectedId = serviceSelect.value;
        const service = store.data.customerServices.find(s => s.id === selectedId);
        if (!service) return;

        // Update details card
        document.getElementById('service-detail-desc').textContent = service.description;
        document.getElementById('service-detail-limits').textContent = `${service.min.toLocaleString()} / ${service.max.toLocaleString()}`;
        document.getElementById('service-detail-speed').textContent = service.deliverySpeed;
        document.getElementById('service-detail-start').textContent = service.startTime;
        document.getElementById('service-detail-refill').textContent = service.refillSupported ? service.refillPeriod : 'None';
        document.getElementById('calc-rate-label').textContent = store.formatMoney(service.pricePer1k);

        const qty = Number(qtyInput.value) || 0;
        const total = (service.pricePer1k / 1000) * qty;
        document.getElementById('calc-total-label').textContent = store.formatMoney(total);

        const statusBox = document.getElementById('balance-check-status');
        if (store.data.customer.balance >= total) {
          statusBox.innerHTML = '<span class="balance-status-pill badge-success">✓ Sufficient Wallet Balance</span>';
        } else {
          statusBox.innerHTML = '<span class="balance-status-pill badge-error">⚠️ Insufficient Balance - Add funds before placing order</span>';
        }
      };

      serviceSelect.addEventListener('change', updateCalc);
      qtyInput.addEventListener('input', updateCalc);
    }
  },

  setQty(val) {
    const input = document.getElementById('new-order-quantity');
    if (input) {
      input.value = val;
      input.dispatchEvent(new Event('input'));
    }
  },

  setDepositAmount(val) {
    const input = document.getElementById('add-funds-amount-input');
    if (input) input.value = val;
  },

  pasteSampleLink() {
    const target = document.getElementById('new-order-target');
    if (target) {
      target.value = 'https://instagram.com/viral_media_hub';
      window.store.showToast('Sample target link pasted!', 'info');
    }
  },

  handlePlaceOrder() {
    const store = window.store;
    const serviceId = document.getElementById('new-order-service-select').value;
    const target = document.getElementById('new-order-target').value;
    const quantity = Number(document.getElementById('new-order-quantity').value);

    if (!target) {
      store.showToast('Please enter a target link or username', 'error');
      return;
    }

    if (!quantity || quantity <= 0) {
      store.showToast('Please specify a valid quantity', 'error');
      return;
    }

    // Confirmation Modal simulation
    store.placeOrder({ serviceId, target, quantity });
  },

  handleDeposit() {
    const amount = Number(document.getElementById('add-funds-amount-input').value);
    const method = document.getElementById('add-funds-method-select').value;
    if (amount <= 0) {
      window.store.showToast('Please enter a valid amount', 'error');
      return;
    }
    window.store.addFunds(amount, method);
  },

  promptRefill(orderId) {
    const order = window.store.data.orders.find(o => o.id === orderId);
    if (!order) return;

    if (confirm(`Request automatic refill for Order #${order.id} (${order.serviceName})?\n\nCurrent count: ${order.currentCount} / Target: ${order.startCount + order.quantity}`)) {
      window.store.requestRefill(orderId);
    }
  },

  quickRefillFilter() {
    window.store.setCustomerTab('orders');
    window.store.showToast('Showing completed orders eligible for refill guarantee', 'info');
  },

  openOrderDetails(orderId) {
    const order = window.store.data.orders.find(o => o.id === orderId);
    if (!order) return;

    const modal = document.getElementById('generic-modal-backdrop');
    const sheet = document.getElementById('generic-modal-sheet');

    sheet.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">Order #${order.id} Details</h3>
        <button class="modal-close" onclick="CustomerApp.closeModal()">&times;</button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 14px;">
        <div style="background: var(--bg-subtle); padding: 12px; border-radius: var(--radius-md);">
          <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Service</div>
          <div style="font-size: 14px; font-weight: 700; color: var(--text-main); margin-top: 2px;">${order.serviceName}</div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div class="calc-row">
            <span>Target Link:</span>
            <span style="font-family: var(--font-mono); font-size: 12px; word-break: break-all;">${order.target}</span>
          </div>
          <div class="calc-row">
            <span>Quantity Ordered:</span>
            <strong>${order.quantity.toLocaleString()}</strong>
          </div>
          <div class="calc-row">
            <span>Start Count:</span>
            <span>${order.startCount.toLocaleString()}</span>
          </div>
          <div class="calc-row">
            <span>Current Count:</span>
            <span>${order.currentCount.toLocaleString()}</span>
          </div>
          <div class="calc-row">
            <span>Remains to deliver:</span>
            <span>${order.remains.toLocaleString()}</span>
          </div>
          <div class="calc-row">
            <span>Total Paid:</span>
            <strong style="color: var(--primary);">${window.store.formatMoney(order.amount)}</strong>
          </div>
          <div class="calc-row">
            <span>Status:</span>
            <span class="badge badge-success">${order.status}</span>
          </div>
        </div>

        <div style="border-top: 1px dashed var(--border-color); padding-top: 12px;">
          <h4 style="font-size: 13.5px; font-weight: 700; margin-bottom: 6px;">Refill Guarantee Info</h4>
          ${order.refillEligible ? `
            <p style="font-size: 12px; color: var(--success); font-weight: 600;">
              🛡️ Refill is Available! (${order.refillDaysLeft} days remaining on warranty)
            </p>
            <button class="btn btn-primary btn-block" style="margin-top: 10px;" onclick="CustomerApp.closeModal(); CustomerApp.promptRefill('${order.id}')">
              🔄 Request Refill Now
            </button>
          ` : `
            <p style="font-size: 12px; color: var(--text-secondary);">
              ${order.refillReason || 'Refill is currently not active for this order.'}
            </p>
          `}
        </div>
      </div>
    `;

    modal.classList.add('active');
  },

  openTicketChat(ticketId) {
    const ticket = window.store.data.supportTickets.find(t => t.id === ticketId);
    if (!ticket) return;

    const modal = document.getElementById('generic-modal-backdrop');
    const sheet = document.getElementById('generic-modal-sheet');

    sheet.innerHTML = `
      <div class="modal-header">
        <div>
          <h3 class="modal-title">${ticket.subject}</h3>
          <div style="font-size: 12px; color: var(--text-secondary);">Ticket #${ticket.id}</div>
        </div>
        <button class="modal-close" onclick="CustomerApp.closeModal()">&times;</button>
      </div>

      <div class="ticket-chat-container" id="ticket-chat-thread">
        ${ticket.messages.map(m => `
          <div class="chat-bubble ${m.sender === 'customer' ? 'customer-bubble' : 'admin-bubble'}">
            <div>${m.text}</div>
            <div class="chat-bubble-time">${m.time}</div>
          </div>
        `).join('')}
      </div>

      <div style="display: flex; gap: 8px; margin-top: 14px;">
        <input type="text" class="form-input" id="ticket-reply-input" placeholder="Type your reply to staff..." style="flex: 1;" />
        <button class="btn btn-primary" onclick="CustomerApp.handleSendReply('${ticket.id}')">Send</button>
      </div>
    `;

    modal.classList.add('active');
  },

  handleSendReply(ticketId) {
    const input = document.getElementById('ticket-reply-input');
    if (!input || !input.value.trim()) return;
    const text = input.value.trim();
    window.store.sendTicketMessage(ticketId, text);
    this.openTicketChat(ticketId); // Refresh modal view
  },

  openNewTicketModal() {
    const modal = document.getElementById('generic-modal-backdrop');
    const sheet = document.getElementById('generic-modal-sheet');
    const orders = window.store.data.orders;

    sheet.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">Create Support Ticket</h3>
        <button class="modal-close" onclick="CustomerApp.closeModal()">&times;</button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 14px;">
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Subject</label>
          <input type="text" class="form-input" id="new-ticket-subject" placeholder="e.g., Question about delivery speed" value="Order status inquiry" />
        </div>

        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Related Order (Optional)</label>
          <select class="form-select" id="new-ticket-order-id">
            <option value="">None / General Inquiry</option>
            ${orders.map(o => `<option value="${o.id}">Order #${o.id} - ${o.serviceName}</option>`).join('')}
          </select>
        </div>

        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Your Message</label>
          <textarea class="form-textarea" id="new-ticket-msg" rows="4" placeholder="Describe your issue or question in detail..."></textarea>
        </div>

        <button class="btn btn-primary btn-block" onclick="CustomerApp.handleCreateTicket()">
          Submit Support Ticket
        </button>
      </div>
    `;

    modal.classList.add('active');
  },

  handleCreateTicket() {
    const subject = document.getElementById('new-ticket-subject').value;
    const orderId = document.getElementById('new-ticket-order-id').value;
    const message = document.getElementById('new-ticket-msg').value;

    if (!message.trim()) {
      window.store.showToast('Please type a message for support', 'error');
      return;
    }

    window.store.createTicket({ subject, orderId, message });
    this.closeModal();
  },

  openNotifications() {
    const modal = document.getElementById('generic-modal-backdrop');
    const sheet = document.getElementById('generic-modal-sheet');

    sheet.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">Notifications</h3>
        <button class="modal-close" onclick="CustomerApp.closeModal()">&times;</button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 10px;">
        <div class="card" style="padding: 12px; border-left: 4px solid var(--primary);">
          <div style="font-weight: 700; font-size: 13.5px;">Order #48291 is now Processing</div>
          <p style="font-size: 12px; margin-top: 2px;">Your Instagram Followers order has been sent to upstream delivery network.</p>
          <div style="font-size: 10.5px; color: var(--text-muted); margin-top: 4px;">5 mins ago</div>
        </div>

        <div class="card" style="padding: 12px; border-left: 4px solid var(--success);">
          <div style="font-weight: 700; font-size: 13.5px;">Deposit Credited (+$100.00)</div>
          <p style="font-size: 12px; margin-top: 2px;">UPI payment successfully confirmed and added to your wallet balance.</p>
          <div style="font-size: 10.5px; color: var(--text-muted); margin-top: 4px;">Yesterday</div>
        </div>

        <div class="card" style="padding: 12px; border-left: 4px solid var(--warning);">
          <div style="font-weight: 700; font-size: 13.5px;">Scheduled Maintenance Notice</div>
          <p style="font-size: 12px; margin-top: 2px;">Payment gateway maintenance tonight 02:00 - 02:30 UTC. Card payments may experience brief pauses.</p>
          <div style="font-size: 10.5px; color: var(--text-muted); margin-top: 4px;">2 days ago</div>
        </div>
      </div>
    `;

    modal.classList.add('active');
  },

  openProfileModal() {
    const store = window.store;
    const modal = document.getElementById('generic-modal-backdrop');
    const sheet = document.getElementById('generic-modal-sheet');

    sheet.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">My Profile & Settings</h3>
        <button class="modal-close" onclick="CustomerApp.closeModal()">&times;</button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 16px; align-items: center; text-align: center;">
        <img src="${store.data.customer.avatar}" style="width: 72px; height: 72px; border-radius: 50%; border: 3px solid var(--primary);" />
        <div>
          <h4 style="font-size: 16px; font-weight: 800;">${store.data.customer.name}</h4>
          <p style="font-size: 12.5px;">${store.data.customer.email}</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; width: 100%;">
          <div class="card" style="padding: 12px;">
            <div style="font-size: 11px; color: var(--text-muted);">Total Spent</div>
            <div style="font-size: 16px; font-weight: 800; color: var(--primary);">${store.formatMoney(store.data.customer.spent)}</div>
          </div>
          <div class="card" style="padding: 12px;">
            <div style="font-size: 11px; color: var(--text-muted);">Total Orders</div>
            <div style="font-size: 16px; font-weight: 800;">${store.data.customer.ordersCount}</div>
          </div>
        </div>

        <div style="width: 100%; border-top: 1px dashed var(--border-color); padding-top: 14px; display: flex; flex-direction: column; gap: 8px;">
          <button class="btn btn-secondary btn-block" onclick="CustomerApp.closeModal(); store.setCustomerTab('wallet')">
            Manage Payment & Invoices
          </button>
          <button class="btn btn-outline btn-block" onclick="CustomerApp.closeModal(); store.setPersona('admin')">
            Switch to Admin Console
          </button>
        </div>
      </div>
    `;

    modal.classList.add('active');
  },

  closeModal() {
    const modal = document.getElementById('generic-modal-backdrop');
    if (modal) modal.classList.remove('active');
  }
};

window.CustomerApp = CustomerApp;
