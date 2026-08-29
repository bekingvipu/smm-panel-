const CustomerApp = {
  currentPlatform: 'instagram',
  currentSubcategory: 'Instagram Followers [Guaranteed / Refill 30D - 365D]',

  render(container) {
    const store = window.store;
    const tab = store.customerTab;
    const isLoggedIn = store.data.isLoggedIn;

    let contentHtml = '';
    if (tab === 'home') contentHtml = this.renderHomeTab(store);
    else if (tab === 'new_order') contentHtml = this.renderNewOrderTab(store);
    else if (tab === 'orders') contentHtml = this.renderOrdersTab(store);
    else if (tab === 'wallet') contentHtml = this.renderWalletTab(store);
    else if (tab === 'support') contentHtml = this.renderSupportTab(store);

    container.innerHTML = `
      <!-- Desktop Production Header (Screens >= 768px) -->
      <nav class="desktop-navbar">
        <div class="desktop-nav-brand" onclick="store.setCustomerTab('new_order')">
          <span style="background: var(--primary); color: white; width: 32px; height: 32px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 16px;">⚡</span>
          <span>SMM Pro</span>
        </div>

        <div class="desktop-nav-links">
          <a class="desktop-nav-link ${tab === 'new_order' ? 'active' : ''}" onclick="store.setCustomerTab('new_order')">
            <span>🛒</span>
            <span>Services & Order</span>
          </a>
          <a class="desktop-nav-link ${tab === 'home' ? 'active' : ''}" onclick="store.setCustomerTab('home')">
            <span>⊞</span>
            <span>Dashboard</span>
          </a>
          <a class="desktop-nav-link ${tab === 'orders' ? 'active' : ''}" onclick="store.setCustomerTab('orders')">
            <span>⏱️</span>
            <span>Orders</span>
          </a>
          <a class="desktop-nav-link ${tab === 'wallet' ? 'active' : ''}" onclick="store.setCustomerTab('wallet')">
            <span>💳</span>
            <span>Add Funds</span>
          </a>
          <a class="desktop-nav-link ${tab === 'support' ? 'active' : ''}" onclick="store.setCustomerTab('support')">
            <span>💬</span>
            <span>Support</span>
          </a>
        </div>

        <div class="desktop-nav-actions">
          <button class="btn btn-sm btn-secondary" onclick="store.setCurrency(store.currency === 'USD' ? 'INR' : 'USD')">
            ${store.currency === 'USD' ? '💵 USD' : '₹ INR'}
          </button>

          <button class="header-icon-btn" onclick="store.setTheme(store.theme === 'light' ? 'dark' : 'light')" title="Toggle Theme">
            <span>${store.theme === 'light' ? '🌙' : '☀️'}</span>
          </button>

          ${isLoggedIn ? `
            <div class="nav-balance-pill">
              <span style="font-size: 12px; color: var(--text-secondary); font-weight: 600;">Balance:</span>
              <span class="nav-balance-amount">${store.formatMoney(store.data.customer.balance)}</span>
            </div>
            <button class="btn btn-primary btn-sm" onclick="store.setCustomerTab('wallet')">
              ＋ Add Funds
            </button>
            <button class="header-icon-btn" onclick="CustomerApp.openNotifications()" title="Notifications">
              <span>🔔</span>
              <span class="notification-dot"></span>
            </button>
            <img src="${store.data.customer.avatar}" alt="Avatar" class="customer-avatar" onclick="CustomerApp.openProfileModal()" title="Account Profile" />
          ` : `
            <button class="btn btn-primary btn-sm" onclick="CustomerApp.openAuthModal('login')">
              🔑 Sign In / Register
            </button>
          `}
        </div>
      </nav>

      <!-- Mobile Production Header (Screens < 768px) -->
      <header class="customer-header">
        <div class="customer-brand-group">
          ${isLoggedIn ? `
            <img src="${store.data.customer.avatar}" alt="Avatar" class="customer-avatar" onclick="CustomerApp.openProfileModal()" title="View Profile" />
          ` : `
            <span style="background: var(--primary); color: white; width: 34px; height: 34px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 16px;">⚡</span>
          `}
          <div class="customer-brand-name">SMM Pro</div>
        </div>
        <div class="customer-header-actions">
          <button class="btn btn-sm btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="store.setCurrency(store.currency === 'USD' ? 'INR' : 'USD')">
            ${store.currency === 'USD' ? '$' : '₹'}
          </button>
          <button class="header-icon-btn" onclick="store.setTheme(store.theme === 'light' ? 'dark' : 'light')">
            <span>${store.theme === 'light' ? '🌙' : '☀️'}</span>
          </button>
          ${isLoggedIn ? `
            <button class="header-icon-btn" onclick="CustomerApp.openNotifications()">
              <span>🔔</span>
              <span class="notification-dot"></span>
            </button>
          ` : `
            <button class="btn btn-primary btn-sm" style="padding: 4px 10px; font-size: 12px;" onclick="CustomerApp.openAuthModal('login')">
              Sign In
            </button>
          `}
        </div>
      </header>

      <!-- Public Catalog Banner for Guests -->
      ${!isLoggedIn ? `
        <div style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1)); border-bottom: 1px solid var(--border-color); padding: 10px 16px; text-align: center; font-size: 13px; color: var(--text-main);">
          <span>👀 <strong>Public Catalog Active:</strong> Browse all live packages and prices freely. Login required only when placing an order.</span>
        </div>
      ` : ''}

      <!-- Content Container -->
      <div class="customer-desktop-container">
        ${contentHtml}
      </div>

      <!-- Permanently Fixed Mobile Bottom Navigation Bar (Screens < 768px) -->
      <nav class="customer-bottom-nav">
        <div class="bottom-nav-item ${tab === 'new_order' ? 'active' : ''}" onclick="store.setCustomerTab('new_order')">
          <div class="nav-icon ${tab === 'new_order' ? 'nav-icon-bg' : ''}">
            <span>🛒</span>
          </div>
          <span>New Order</span>
        </div>

        <div class="bottom-nav-item ${tab === 'home' ? 'active' : ''}" onclick="store.setCustomerTab('home')">
          <div class="nav-icon ${tab === 'home' ? 'nav-icon-bg' : ''}">
            <span>⊞</span>
          </div>
          <span>Dashboard</span>
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
    `;

    this.bindEvents();
  },

  // 1. HOME TAB
  renderHomeTab(store) {
    const recentOrders = store.data.orders.slice(0, 5);

    return `
      <!-- Balance Hero Card -->
      <div class="balance-hero-card">
        <div class="balance-hero-header">
          <div>
            <div class="balance-label">${store.data.isLoggedIn ? 'Current Wallet Balance' : 'Guest Visitor'}</div>
            <div class="balance-amount">${store.data.isLoggedIn ? store.formatMoney(store.data.customer.balance) : 'Browse Mode'}</div>
          </div>
          <div class="balance-icon-pill">
            <span>💳</span>
          </div>
        </div>
        ${store.data.isLoggedIn ? `
          <button class="btn btn-primary" onclick="store.setCustomerTab('wallet')">
            <span>＋ Add Funds</span>
          </button>
        ` : `
          <button class="btn btn-primary" onclick="CustomerApp.openAuthModal('login')">
            <span>🔑 Sign In / Register Account</span>
          </button>
        `}
      </div>

      <!-- Quick Actions Grid -->
      <div class="quick-actions-grid">
        <div class="quick-action-card" onclick="store.setCustomerTab('new_order')">
          <div class="action-icon-circle"><span>🛒</span></div>
          <div class="action-card-title">New Order</div>
        </div>

        <div class="quick-action-card" onclick="CustomerApp.quickRefillFilter()">
          <div class="action-icon-circle"><span>🔄</span></div>
          <div class="action-card-title">Refill Request</div>
        </div>

        <div class="quick-action-card" onclick="store.setCustomerTab('wallet')">
          <div class="action-icon-circle" style="background: #10B981;"><span>💰</span></div>
          <div class="action-card-title">Add Funds</div>
        </div>

        <div class="quick-action-card" onclick="store.setCustomerTab('support')">
          <div class="action-icon-circle" style="background: #3B82F6;"><span>💬</span></div>
          <div class="action-card-title">Support Desk</div>
        </div>
      </div>

      <!-- Recent Orders Section -->
      <div class="section-header-row">
        <div class="section-title">Recent Orders</div>
        <a class="section-link" onclick="store.setCustomerTab('orders')">View All Orders</a>
      </div>

      <div class="mobile-orders-list">
        ${recentOrders.map(order => this.renderOrderCard(order, store)).join('')}
      </div>
    `;
  },

  renderOrderCard(order, store) {
    let icon = '👍';
    if (order.platform === 'youtube') icon = '👁️';
    if (order.platform === 'tiktok') icon = '❤️';
    if (order.platform === 'twitter') icon = '𝕏';
    if (order.platform === 'facebook') icon = '👥';
    if (order.platform === 'telegram') icon = '✈️';

    let badgeClass = 'badge-primary';
    if (order.status === 'Processing') badgeClass = 'badge-success';
    if (order.status === 'In Progress') badgeClass = 'badge-info';
    if (order.status === 'Completed') badgeClass = 'badge-neutral';

    return `
      <div class="mobile-order-card" onclick="CustomerApp.openOrderDetails('${order.id}')">
        <div class="order-card-top">
          <div class="order-platform-icon">${icon}</div>
          <div class="order-card-info">
            <div class="order-service-title">${order.serviceName}</div>
            <div class="order-id-sub">ID: #${order.id}</div>
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

  // 2. NEW ORDER TAB WITH 2-LEVEL CASCADING DROPDOWNS (JAP STYLE)
  renderNewOrderTab(store) {
    const allServices = store.data.customerServices;
    const plat = this.currentPlatform || 'instagram';

    // Step A: Filter by Platform
    const platformServices = plat === 'all' 
      ? allServices 
      : allServices.filter(s => s.platform.toLowerCase() === plat.toLowerCase());

    // Step B: Get unique subcategories under this platform
    const subcategories = [...new Set(platformServices.map(s => s.subcategory))];
    
    if (!subcategories.includes(this.currentSubcategory) && subcategories.length > 0) {
      this.currentSubcategory = subcategories[0];
    }

    // Step C: Filter packages under the active subcategory
    const activePackages = platformServices.filter(s => s.subcategory === this.currentSubcategory);
    const activeService = activePackages[0] || platformServices[0] || allServices[0] || {};

    return `
      <div style="display: flex; flex-direction: column; gap: 20px; max-width: 800px; margin: 0 auto; width: 100%;">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">Place New Order</h2>
          <p style="font-size: 14px;">Select platform category, package tier, and enter your target link.</p>
        </div>

        <!-- Platform Tabs -->
        <div class="form-group" style="margin-bottom: 4px;">
          <label class="form-label">Platform</label>
          <div class="platform-chips-scroll" id="new-order-platform-chips">
            <button class="platform-chip ${plat === 'all' ? 'active' : ''}" onclick="CustomerApp.selectPlatform('all')">All</button>
            <button class="platform-chip ${plat === 'instagram' ? 'active' : ''}" onclick="CustomerApp.selectPlatform('instagram')">Instagram</button>
            <button class="platform-chip ${plat === 'facebook' ? 'active' : ''}" onclick="CustomerApp.selectPlatform('facebook')">Facebook</button>
            <button class="platform-chip ${plat === 'youtube' ? 'active' : ''}" onclick="CustomerApp.selectPlatform('youtube')">YouTube</button>
            <button class="platform-chip ${plat === 'tiktok' ? 'active' : ''}" onclick="CustomerApp.selectPlatform('tiktok')">TikTok</button>
            <button class="platform-chip ${plat === 'telegram' ? 'active' : ''}" onclick="CustomerApp.selectPlatform('telegram')">Telegram</button>
            <button class="platform-chip ${plat === 'twitter' ? 'active' : ''}" onclick="CustomerApp.selectPlatform('twitter')">Twitter / X</button>
          </div>
        </div>

        <!-- 1st Box: Sub-Category Dropdown (e.g. Guaranteed Followers, Likes, Reels) -->
        <div class="form-group">
          <label class="form-label">
            <span>1. Sub-Category</span>
            <span class="form-label-hint">${subcategories.length} Categories available</span>
          </label>
          <select class="form-select" id="new-order-category-select" onchange="CustomerApp.handleSubcategoryChange(this.value)">
            ${subcategories.map(sub => `
              <option value="${sub}" ${sub === this.currentSubcategory ? 'selected' : ''}>
                ${sub}
              </option>
            `).join('')}
          </select>
        </div>

        <!-- 2nd Box: Specific Service Package (Tiered Rates e.g. ₹25, ₹50, ₹90 VIP) -->
        <div class="form-group">
          <label class="form-label">
            <span>2. Service Package & Rates</span>
            <span class="form-label-hint">${activePackages.length} Packages</span>
          </label>
          <select class="form-select" id="new-order-service-select">
            ${activePackages.map(s => `
              <option value="${s.id}" data-price="${s.pricePer1k}" data-min="${s.min}" data-max="${s.max}">
                ${s.customerName} — ${store.formatMoney(s.pricePer1k)}/1K
              </option>
            `).join('')}
          </select>
        </div>

        <!-- Service Specification Details Box -->
        <div class="service-details-card" id="service-details-box">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: var(--primary); font-size: 14px;">Package Specification</strong>
            <span class="badge ${activeService.refillSupported ? 'badge-success' : 'badge-neutral'}" id="service-detail-refill-badge">
              ${activeService.refillSupported ? `🛡️ ${activeService.refillPeriod} Refill Guarantee` : 'No Refill Warranty'}
            </span>
          </div>
          <p id="service-detail-desc" style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">
            ${activeService.description || ''}
          </p>
          <div class="service-meta-grid" style="margin-top: 8px;">
            <div class="meta-item">
              <span class="meta-item-label">Min / Max Limit</span>
              <span class="meta-item-val" id="service-detail-limits">${activeService.min ? activeService.min.toLocaleString() : 50} / ${activeService.max ? activeService.max.toLocaleString() : 200000}</span>
            </div>
            <div class="meta-item">
              <span class="meta-item-label">Avg Speed</span>
              <span class="meta-item-val" id="service-detail-speed">${activeService.deliverySpeed || 'Instant'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-item-label">Start Time</span>
              <span class="meta-item-val" id="service-detail-start">${activeService.startTime || '0 - 15 Mins'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-item-label">Refill Guarantee</span>
              <span class="meta-item-val" id="service-detail-refill">${activeService.refillSupported ? activeService.refillPeriod : 'None'}</span>
            </div>
          </div>
        </div>

        <!-- Target Link / Username -->
        <div class="form-group">
          <label class="form-label">
            <span>Target Link / Username</span>
            <span class="form-label-hint">Public accounts only</span>
          </label>
          <div style="position: relative;">
            <input type="url" class="form-input" id="new-order-target" placeholder="https://instagram.com/yourprofile" value="https://instagram.com/creator_daily" />
            <button type="button" class="btn btn-sm btn-secondary" style="position: absolute; right: 6px; top: 6px; height: 34px; padding: 0 12px;" onclick="CustomerApp.pasteSampleLink()">
              Paste
            </button>
          </div>
        </div>

        <!-- Quantity -->
        <div class="form-group">
          <label class="form-label">
            <span>Quantity</span>
            <span class="form-label-hint" id="qty-limits-hint">Min: ${activeService.min || 50} | Max: ${(activeService.max || 200000).toLocaleString()}</span>
          </label>
          <input type="number" class="form-input" id="new-order-quantity" value="1000" min="${activeService.min || 50}" max="${activeService.max || 200000}" step="100" />
          <div class="qty-preset-chips">
            <button type="button" class="qty-preset-btn" onclick="CustomerApp.setQty(500)">+500</button>
            <button type="button" class="qty-preset-btn" onclick="CustomerApp.setQty(1000)">+1,000</button>
            <button type="button" class="qty-preset-btn" onclick="CustomerApp.setQty(2500)">+2,500</button>
            <button type="button" class="qty-preset-btn" onclick="CustomerApp.setQty(5000)">+5,000</button>
          </div>
        </div>

        <!-- Live Price Calculation Box -->
        <div class="calculation-summary-card">
          <div class="calc-row">
            <span>Unit Rate (per 1,000):</span>
            <strong id="calc-rate-label">${store.formatMoney(activeService.pricePer1k || 0.30)}</strong>
          </div>
          <div class="calc-row">
            <span>Current Wallet Balance:</span>
            <span>${store.data.isLoggedIn ? store.formatMoney(store.data.customer.balance) : 'Guest Mode (Sign in to view balance)'}</span>
          </div>
          <div class="calc-row total-row">
            <span>Total Charge:</span>
            <span id="calc-total-label">${store.formatMoney(((activeService.pricePer1k || 0.30) / 1000) * 1000)}</span>
          </div>
          <div id="balance-check-status" style="margin-top: 4px;">
            ${store.data.isLoggedIn ? `
              <span class="balance-status-pill badge-success">✓ Sufficient Wallet Balance</span>
            ` : `
              <span class="balance-status-pill" style="background: var(--bg-subtle); color: var(--text-secondary);">ℹ️ Sign in required to complete order</span>
            `}
          </div>
        </div>

        <!-- Submit Button -->
        <button class="btn btn-primary btn-lg btn-block" id="btn-submit-order" onclick="CustomerApp.handlePlaceOrder()">
          <span>${store.data.isLoggedIn ? 'Confirm & Place Order' : '🔑 Sign In to Place Order'}</span>
        </button>
      </div>
    `;
  },

  selectPlatform(plat) {
    this.currentPlatform = plat;
    const screenContainer = document.getElementById('screen-container');
    this.render(screenContainer);
  },

  handleSubcategoryChange(sub) {
    this.currentSubcategory = sub;
    const screenContainer = document.getElementById('screen-container');
    this.render(screenContainer);
  },

  // 3. ORDERS TAB
  renderOrdersTab(store) {
    if (!store.data.isLoggedIn) {
      return `
        <div class="card" style="text-align: center; padding: 40px 20px; max-width: 500px; margin: 40px auto;">
          <span style="font-size: 48px;">🔒</span>
          <h3 style="font-size: 20px; font-weight: 800; margin-top: 14px;">Sign In to View Orders</h3>
          <p style="font-size: 13.5px; color: var(--text-secondary); margin-top: 6px;">
            Your past order history and refill warranties are secured with your account.
          </p>
          <button class="btn btn-primary btn-block" style="margin-top: 20px;" onclick="CustomerApp.openAuthModal('login')">
            🔑 Sign In / Create Account
          </button>
        </div>
      `;
    }

    const orders = store.data.orders;
    return `
      <div style="display: flex; flex-direction: column; gap: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h2 style="font-size: 24px; font-weight: 800;">My Orders</h2>
            <p style="font-size: 13.5px;">Track delivery progress and refill warranties.</p>
          </div>
          <span class="badge badge-primary" style="font-size: 13px; padding: 6px 14px;">${orders.length} Total Orders</span>
        </div>

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
      <div class="card" style="display: flex; flex-direction: column; gap: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <div style="font-size: 15.5px; font-weight: 700; color: var(--text-main);">${order.serviceName}</div>
            <div style="font-size: 12.5px; color: var(--text-secondary); margin-top: 2px;">
              Order #${order.id} • ${order.date}
            </div>
          </div>
          <span class="badge ${badgeClass}"><span class="badge-dot"></span>${order.status}</span>
        </div>

        <div style="background: var(--bg-subtle); padding: 12px 14px; border-radius: var(--radius-md); font-size: 13px;">
          <div style="color: var(--text-muted); font-size: 11px; text-transform: uppercase; font-weight: 700;">Target Link / Handle</div>
          <div style="font-family: var(--font-mono); color: var(--text-main); word-break: break-all; margin-top: 2px;">
            ${order.target}
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; font-size: 13px; text-align: center; background: var(--bg-surface); padding: 8px 0;">
          <div>
            <div style="color: var(--text-muted); font-size: 11.5px;">Quantity</div>
            <strong style="color: var(--text-main); font-size: 15px;">${Number(order.quantity).toLocaleString()}</strong>
          </div>
          <div>
            <div style="color: var(--text-muted); font-size: 11.5px;">Current</div>
            <strong style="color: var(--text-main); font-size: 15px;">${Number(order.currentCount).toLocaleString()}</strong>
          </div>
          <div>
            <div style="color: var(--text-muted); font-size: 11.5px;">Charge</div>
            <strong style="color: var(--primary); font-size: 15px;">${store.formatMoney(order.amount)}</strong>
          </div>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 10px; border-top: 1px dashed var(--border-color);">
          <button class="btn btn-sm btn-secondary" onclick="CustomerApp.openOrderDetails('${order.id}')">
            View Details
          </button>

          ${canRefill ? `
            <button class="btn-refill" onclick="CustomerApp.promptRefill('${order.id}')">
              <span>🔄 Request Refill</span>
            </button>
          ` : ''}
        </div>
      </div>
    `;
  },

  // 4. WALLET TAB
  renderWalletTab(store) {
    if (!store.data.isLoggedIn) {
      return `
        <div class="card" style="text-align: center; padding: 40px 20px; max-width: 500px; margin: 40px auto;">
          <span style="font-size: 48px;">💳</span>
          <h3 style="font-size: 20px; font-weight: 800; margin-top: 14px;">Sign In to Manage Wallet</h3>
          <p style="font-size: 13.5px; color: var(--text-secondary); margin-top: 6px;">
            Add funds via UPI, Card, or Crypto and get instant credits to place orders.
          </p>
          <button class="btn btn-primary btn-block" style="margin-top: 20px;" onclick="CustomerApp.openAuthModal('login')">
            🔑 Sign In / Register Account
          </button>
        </div>
      `;
    }

    const transactions = store.data.transactions;
    return `
      <div style="display: flex; flex-direction: column; gap: 24px; max-width: 800px; margin: 0 auto; width: 100%;">
        <div class="balance-hero-card">
          <div class="balance-hero-header">
            <div>
              <div class="balance-label">Wallet Balance</div>
              <div class="balance-amount">${store.formatMoney(store.data.customer.balance)}</div>
            </div>
            <div class="balance-icon-pill"><span>💰</span></div>
          </div>
          <p style="font-size: 13px; color: var(--text-secondary); max-width: 320px;">
            Instant auto-deposit via UPI / QR. Funds are credited immediately upon confirmation.
          </p>
        </div>

        <div class="card" style="display: flex; flex-direction: column; gap: 16px;">
          <h3 style="font-size: 18px; font-weight: 800;">Add Funds to Wallet</h3>

          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
            <button class="btn btn-sm btn-secondary" onclick="CustomerApp.setDepositAmount(100)">₹100</button>
            <button class="btn btn-sm btn-secondary" onclick="CustomerApp.setDepositAmount(250)">₹250</button>
            <button class="btn btn-sm btn-secondary" onclick="CustomerApp.setDepositAmount(500)">₹500</button>
            <button class="btn btn-sm btn-secondary" onclick="CustomerApp.setDepositAmount(1000)">₹1,000</button>
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Deposit Amount (₹ INR)</label>
            <input type="number" class="form-input" id="add-funds-amount-input" value="250" min="50" max="50000" />
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Payment Method</label>
            <select class="form-select" id="add-funds-method-select">
              <option value="UPI / Instant QR (0% Fee)">UPI / Instant QR (Google Pay, PhonePe, Paytm)</option>
              <option value="Credit / Debit Card (Stripe)">Credit / Debit Card (Visa, Mastercard)</option>
              <option value="Cryptocurrency (USDT TRC20 / BTC)">Crypto (USDT TRC20 / BTC / ETH)</option>
            </select>
          </div>

          <button class="btn btn-primary btn-block btn-lg" onclick="CustomerApp.handleDeposit()">
            <span>Proceed to Deposit</span>
          </button>
        </div>

        <div>
          <div class="section-header-row" style="margin-bottom: 14px;">
            <div class="section-title">Transaction History</div>
            <span class="badge badge-neutral">${transactions.length} Records</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${transactions.map(txn => `
              <div class="card" style="padding: 14px 18px; display: flex; align-items: center; justify-content: space-between;">
                <div>
                  <div style="font-size: 14px; font-weight: 700; color: var(--text-main);">${txn.description}</div>
                  <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
                    ${txn.id} • ${txn.date}
                  </div>
                </div>
                <div style="text-align: right;">
                  <strong style="font-size: 15px; color: ${txn.amount >= 0 ? 'var(--success)' : 'var(--text-main)'};">
                    ${txn.amount >= 0 ? '+' : ''}${store.formatMoney(txn.amount)}
                  </strong>
                  <div style="font-size: 11.5px; color: var(--text-muted);">Bal: ${store.formatMoney(txn.balanceAfter)}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  // 5. SUPPORT TAB
  renderSupportTab(store) {
    if (!store.data.isLoggedIn) {
      return `
        <div class="card" style="text-align: center; padding: 40px 20px; max-width: 500px; margin: 40px auto;">
          <span style="font-size: 48px;">💬</span>
          <h3 style="font-size: 20px; font-weight: 800; margin-top: 14px;">Sign In for Support</h3>
          <p style="font-size: 13.5px; color: var(--text-secondary); margin-top: 6px;">
            Submit support tickets and chat with our 24/7 team.
          </p>
          <button class="btn btn-primary btn-block" style="margin-top: 20px;" onclick="CustomerApp.openAuthModal('login')">
            🔑 Sign In / Create Account
          </button>
        </div>
      `;
    }

    const tickets = store.data.supportTickets;
    return `
      <div style="display: flex; flex-direction: column; gap: 20px; max-width: 800px; margin: 0 auto; width: 100%;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h2 style="font-size: 24px; font-weight: 800;">Support Desk</h2>
            <p style="font-size: 13.5px;">Have questions about an order or delivery speed? We respond in minutes.</p>
          </div>
          <button class="btn btn-primary btn-sm" onclick="CustomerApp.openNewTicketModal()">
            ＋ New Ticket
          </button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${tickets.map(ticket => `
            <div class="card" style="display: flex; flex-direction: column; gap: 12px; cursor: pointer;" onclick="CustomerApp.openTicketChat('${ticket.id}')">
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="font-size: 15px; font-weight: 700; color: var(--text-main);">${ticket.subject}</div>
                <span class="badge ${ticket.status === 'Answered' ? 'badge-success' : 'badge-warning'}">
                  ${ticket.status}
                </span>
              </div>
              <div style="font-size: 12.5px; color: var(--text-secondary);">
                Ticket #${ticket.id} ${ticket.linkedOrderId ? `• Linked to Order #${ticket.linkedOrderId}` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  bindEvents() {
    const serviceSelect = document.getElementById('new-order-service-select');
    const qtyInput = document.getElementById('new-order-quantity');

    if (serviceSelect && qtyInput) {
      const updateCalc = () => {
        const store = window.store;
        const selectedId = serviceSelect.value;
        const service = store.data.customerServices.find(s => String(s.id) === String(selectedId));
        if (!service) return;

        document.getElementById('service-detail-desc').textContent = service.description;
        document.getElementById('service-detail-limits').textContent = `${service.min.toLocaleString()} / ${service.max.toLocaleString()}`;
        document.getElementById('service-detail-speed').textContent = service.deliverySpeed;
        document.getElementById('service-detail-start').textContent = service.startTime;
        document.getElementById('service-detail-refill').textContent = service.refillSupported ? service.refillPeriod : 'None';
        
        const badge = document.getElementById('service-detail-refill-badge');
        if (badge) {
          badge.className = `badge ${service.refillSupported ? 'badge-success' : 'badge-neutral'}`;
          badge.textContent = service.refillSupported ? `🛡️ ${service.refillPeriod} Refill Guarantee` : 'No Refill Warranty';
        }

        document.getElementById('calc-rate-label').textContent = store.formatMoney(service.pricePer1k);

        const qty = Number(qtyInput.value) || 0;
        const total = (service.pricePer1k / 1000) * qty;
        document.getElementById('calc-total-label').textContent = store.formatMoney(total);

        const statusBox = document.getElementById('balance-check-status');
        if (store.data.isLoggedIn) {
          if (store.data.customer.balance >= total) {
            statusBox.innerHTML = '<span class="balance-status-pill badge-success">✓ Sufficient Wallet Balance</span>';
          } else {
            statusBox.innerHTML = '<span class="balance-status-pill badge-error">⚠️ Insufficient Balance - Add funds before placing order</span>';
          }
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
    if (!store.data.isLoggedIn) {
      this.openAuthModal('login');
      return;
    }

    const serviceSelect = document.getElementById('new-order-service-select');
    if (!serviceSelect) return;
    const serviceId = serviceSelect.value;
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

    store.placeOrder({ serviceId, target, quantity });
  },

  handleDeposit() {
    const amount = Number(document.getElementById('add-funds-amount-input').value);
    const method = document.getElementById('add-funds-method-select').value;
    if (amount <= 0) {
      window.store.showToast('Please enter a valid amount', 'error');
      return;
    }
    const usdAmount = amount / window.store.data.exchangeRate;
    window.store.addFunds(usdAmount, method);
  },

  openDepositModal() {
    window.store.setCustomerTab('wallet');
  },

  // AUTH MODAL (LOGIN / REGISTER WITH PUBLIC ACCESS)
  openAuthModal(defaultTab = 'login') {
    const modal = document.getElementById('generic-modal-backdrop');
    const sheet = document.getElementById('generic-modal-sheet');

    sheet.innerHTML = `
      <div class="modal-header">
        <div>
          <h3 class="modal-title">${defaultTab === 'login' ? 'Customer Sign In' : 'Create Free Account'}</h3>
          <p style="font-size: 12.5px; color: var(--text-secondary);">Access orders, deposit funds & activate delivery.</p>
        </div>
        <button class="modal-close" onclick="CustomerApp.closeModal()">&times;</button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div style="display: flex; border-bottom: 2px solid var(--border-color); gap: 16px;">
          <button class="btn btn-sm ${defaultTab === 'login' ? 'btn-primary' : 'btn-secondary'}" onclick="CustomerApp.openAuthModal('login')">
            Sign In
          </button>
          <button class="btn btn-sm ${defaultTab === 'register' ? 'btn-primary' : 'btn-secondary'}" onclick="CustomerApp.openAuthModal('register')">
            Register New Account
          </button>
        </div>

        ${defaultTab === 'register' ? `
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Full Name</label>
            <input type="text" class="form-input" id="auth-name-input" placeholder="e.g. Vipul Kumar" value="Vipul Kumar" />
          </div>
        ` : ''}

        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Email Address</label>
          <input type="email" class="form-input" id="auth-email-input" placeholder="name@example.com" value="vipul@demo.com" />
        </div>

        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Password</label>
          <input type="password" class="form-input" id="auth-password-input" placeholder="••••••••" value="password123" />
        </div>

        <button class="btn btn-primary btn-block btn-lg" onclick="CustomerApp.handleAuthSubmit('${defaultTab}')">
          <span>${defaultTab === 'login' ? 'Sign In' : 'Create Account'}</span>
        </button>

        <div style="text-align: center; border-top: 1px dashed var(--border-color); padding-top: 12px;">
          <button class="btn btn-outline btn-block" onclick="CustomerApp.quickDemoLogin()">
            ⚡ 1-Click Fast Login (Vipul Kumar)
          </button>
          <p style="font-size: 11.5px; color: var(--text-muted); margin-top: 6px;">
            (Google 1-Tap Sign-In will connect here via Supabase)
          </p>
        </div>
      </div>
    `;

    modal.classList.add('active');
  },

  handleAuthSubmit(mode) {
    const email = document.getElementById('auth-email-input').value || 'vipul@demo.com';
    const name = document.getElementById('auth-name-input') ? document.getElementById('auth-name-input').value : 'Vipul Kumar';
    window.store.login(name, email);
    this.closeModal();
  },

  quickDemoLogin() {
    window.store.login('Vipul Kumar', 'vipul@demo.com');
    this.closeModal();
  },

  openProfileModal() {
    const store = window.store;
    const modal = document.getElementById('generic-modal-backdrop');
    const sheet = document.getElementById('generic-modal-sheet');

    sheet.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">My Account Profile</h3>
        <button class="modal-close" onclick="CustomerApp.closeModal()">&times;</button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 16px; align-items: center; text-align: center;">
        <img src="${store.data.customer.avatar}" style="width: 72px; height: 72px; border-radius: 50%; border: 3px solid var(--primary);" />
        <div>
          <h4 style="font-size: 17px; font-weight: 800;">${store.data.customer.name}</h4>
          <p style="font-size: 13px;">${store.data.customer.email}</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; width: 100%;">
          <div class="card" style="padding: 14px;">
            <div style="font-size: 11.5px; color: var(--text-muted);">Current Balance</div>
            <div style="font-size: 18px; font-weight: 800; color: var(--primary);">${store.formatMoney(store.data.customer.balance)}</div>
          </div>
          <div class="card" style="padding: 14px;">
            <div style="font-size: 11.5px; color: var(--text-muted);">Total Orders</div>
            <div style="font-size: 18px; font-weight: 800;">${store.data.customer.ordersCount}</div>
          </div>
        </div>

        <div style="width: 100%; border-top: 1px dashed var(--border-color); padding-top: 14px; display: flex; flex-direction: column; gap: 8px;">
          <button class="btn btn-secondary btn-block" onclick="CustomerApp.closeModal(); store.setCustomerTab('wallet')">
            Manage Wallet & Funds
          </button>
          <a href="#admin" class="btn btn-outline btn-block" onclick="CustomerApp.closeModal();" style="text-decoration: none;">
            🛡️ Open Admin Console
          </a>
          <button class="btn btn-sm btn-outline" style="color: var(--error); border-color: var(--error); margin-top: 4px;" onclick="CustomerApp.closeModal(); store.logout();">
            Sign Out (Switch to Guest Mode)
          </button>
        </div>
      </div>
    `;

    modal.classList.add('active');
  },

  promptRefill(orderId) {
    const order = window.store.data.orders.find(o => String(o.id) === String(orderId));
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
    const order = window.store.data.orders.find(o => String(o.id) === String(orderId));
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
          <div style="font-size: 14.5px; font-weight: 700; color: var(--text-main); margin-top: 2px;">${order.serviceName}</div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div class="calc-row">
            <span>Target Link:</span>
            <span style="font-family: var(--font-mono); font-size: 12px; word-break: break-all;">${order.target}</span>
          </div>
          <div class="calc-row">
            <span>Quantity Ordered:</span>
            <strong>${Number(order.quantity).toLocaleString()}</strong>
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
      </div>
    `;

    modal.classList.add('active');
  },

  openTicketChat(ticketId) {
    const ticket = window.store.data.supportTickets.find(t => String(t.id) === String(ticketId));
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
    `;

    modal.classList.add('active');
  },

  openNewTicketModal() {
    const modal = document.getElementById('generic-modal-backdrop');
    const sheet = document.getElementById('generic-modal-sheet');

    sheet.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">Create Support Ticket</h3>
        <button class="modal-close" onclick="CustomerApp.closeModal()">&times;</button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 14px;">
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Subject</label>
          <input type="text" class="form-input" id="new-ticket-subject" value="Order inquiry" />
        </div>
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Message</label>
          <textarea class="form-textarea" id="new-ticket-msg" rows="4" placeholder="How can we help?"></textarea>
        </div>
        <button class="btn btn-primary btn-block" onclick="CustomerApp.closeModal(); window.store.showToast('Ticket submitted!', 'success');">
          Submit Ticket
        </button>
      </div>
    `;

    modal.classList.add('active');
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
        <div class="card" style="padding: 14px; border-left: 4px solid var(--primary);">
          <div style="font-weight: 700;">Order #48291 is now Processing</div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">5 mins ago</div>
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
