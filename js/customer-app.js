const CustomerApp = {
  currentPlatform: 'instagram',
  currentCategory: 'Instagram Followers [Guaranteed]',
  searchQuery: '',
  ordersFilter: 'all',
  ordersSearch: '',

  render(container) {
    const store = window.store;
    const tab = store.customerTab;
    const isLoggedIn = store.data.isLoggedIn;

    let contentHtml = '';
    if (tab === 'new_order') contentHtml = this.renderNewOrderTab(store);
    else if (tab === 'home') contentHtml = this.renderHomeTab(store);
    else if (tab === 'orders') contentHtml = this.renderOrdersTab(store);
    else if (tab === 'wallet') contentHtml = this.renderWalletTab(store);
    else if (tab === 'support') contentHtml = this.renderSupportTab(store);

    container.innerHTML = `
      <!-- Desktop Header (Screens >= 768px) -->
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
            <span>Orders History</span>
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

      <!-- Mobile Header (Screens < 768px) -->
      <header class="customer-header">
        <div class="customer-brand-group" onclick="store.setCustomerTab('new_order')">
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

      <!-- Content Container -->
      <div class="customer-desktop-container">
        ${contentHtml}
      </div>

      <!-- Clean Centered Mobile Bottom Navigation Bar (Screens < 768px) -->
      <nav class="customer-bottom-nav">
        <div class="bottom-nav-item ${tab === 'new_order' ? 'active' : ''}" onclick="store.setCustomerTab('new_order')">
          <div class="nav-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
          </div>
          <span>New Order</span>
        </div>

        <div class="bottom-nav-item ${tab === 'home' ? 'active' : ''}" onclick="store.setCustomerTab('home')">
          <div class="nav-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
          </div>
          <span>Dashboard</span>
        </div>

        <div class="bottom-nav-item ${tab === 'orders' ? 'active' : ''}" onclick="store.setCustomerTab('orders')">
          <div class="nav-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <span>Orders</span>
        </div>

        <div class="bottom-nav-item ${tab === 'wallet' ? 'active' : ''}" onclick="store.setCustomerTab('wallet')">
          <div class="nav-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2"></rect>
              <line x1="2" y1="10" x2="22" y2="10"></line>
            </svg>
          </div>
          <span>Wallet</span>
        </div>

        <div class="bottom-nav-item ${tab === 'support' ? 'active' : ''}" onclick="store.setCustomerTab('support')">
          <div class="nav-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <span>Support</span>
        </div>
      </nav>
    `;

    this.bindEvents();
  },

  // 1. DASHBOARD WITH CRISP, HIGH-CONTRAST ICONS
  renderHomeTab(store) {
    const recentOrders = store.data.orders.slice(0, 4);

    return `
      <!-- Balance Hero Card -->
      <div class="balance-hero-card">
        <div class="balance-hero-header">
          <div>
            <div class="balance-label">CURRENT WALLET BALANCE</div>
            <div class="balance-amount" style="font-size: 36px; font-weight: 800; letter-spacing: -0.02em;">
              ${store.data.isLoggedIn ? store.formatMoney(store.data.customer.balance) : '₹0'}
            </div>
          </div>
          <div style="background: rgba(99, 102, 241, 0.12); width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2">
              <rect x="2" y="5" width="20" height="14" rx="2"></rect>
              <line x1="2" y1="10" x2="22" y2="10"></line>
            </svg>
          </div>
        </div>
        ${store.data.isLoggedIn ? `
          <button class="btn btn-primary btn-block btn-lg" onclick="store.setCustomerTab('wallet')">
            <span>+ Add Funds</span>
          </button>
        ` : `
          <button class="btn btn-primary btn-block btn-lg" onclick="CustomerApp.openAuthModal('login')">
            <span>🔑 Sign In / Register Account</span>
          </button>
        `}
      </div>

      <!-- Quick Actions Grid with High Contrast Crisp Icons -->
      <div class="quick-actions-grid" style="margin-top: 18px;">
        <div class="quick-action-card" onclick="store.setCustomerTab('new_order')">
          <div class="action-icon-circle" style="background: #5B48EE; box-shadow: 0 4px 12px rgba(91, 72, 238, 0.35);">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
          </div>
          <div class="action-card-title" style="font-weight: 700;">New Order</div>
        </div>

        <div class="quick-action-card" onclick="store.setCustomerTab('orders')">
          <div class="action-icon-circle" style="background: #3B82F6; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35);">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
            </svg>
          </div>
          <div class="action-card-title" style="font-weight: 700;">Refill Request</div>
        </div>

        <div class="quick-action-card" onclick="store.setCustomerTab('wallet')">
          <div class="action-icon-circle" style="background: #10B981; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div class="action-card-title" style="font-weight: 700;">Add Funds</div>
        </div>

        <div class="quick-action-card" onclick="store.setCustomerTab('support')">
          <div class="action-icon-circle" style="background: #8B5CF6; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.35);">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div class="action-card-title" style="font-weight: 700;">Support Desk</div>
        </div>
      </div>

      <!-- Recent Orders Section -->
      <div class="section-header-row" style="margin-top: 24px;">
        <div class="section-title">Recent Orders</div>
        <a class="section-link" onclick="store.setCustomerTab('orders')">View All Orders</a>
      </div>

      <div class="mobile-orders-list">
        ${recentOrders.map(order => this.renderHistoryCard(order, store)).join('')}
      </div>
    `;
  },

  // 3. ORDERS HISTORY TAB (MATCHING USER SCREENSHOT EXACTLY)
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

    const allOrders = store.data.orders;
    const filter = this.ordersFilter || 'all';
    const query = (this.ordersSearch || '').trim().toLowerCase();

    let filtered = allOrders;
    if (filter !== 'all') {
      filtered = filtered.filter(o => o.status.toLowerCase().replace(' ', '_') === filter.toLowerCase());
    }
    if (query) {
      filtered = filtered.filter(o => 
        String(o.id).includes(query) || 
        o.serviceName.toLowerCase().includes(query) ||
        o.status.toLowerCase().includes(query)
      );
    }

    return `
      <div style="display: flex; flex-direction: column; max-width: 800px; margin: 0 auto; width: 100%;">
        <!-- Header Row -->
        <div class="orders-history-header">
          <h1 class="orders-history-title">Orders History</h1>
          <span class="badge badge-primary" style="font-size: 13px; padding: 6px 14px; border-radius: 9999px;">
            ${allOrders.length} Total Orders
          </span>
        </div>

        <!-- Search Bar -->
        <div class="orders-search-bar">
          <span class="orders-search-icon">🔍</span>
          <input 
            type="text" 
            class="orders-search-input" 
            placeholder="Search by ID, Service, or Status" 
            value="${this.ordersSearch}" 
            oninput="CustomerApp.handleOrdersSearch(this.value)" 
          />
        </div>

        <!-- Status Filter Chips -->
        <div class="orders-filter-chips">
          <button class="orders-filter-pill ${filter === 'all' ? 'active' : ''}" onclick="CustomerApp.setOrdersFilter('all')">
            All
          </button>
          <button class="orders-filter-pill ${filter === 'completed' ? 'active' : ''}" onclick="CustomerApp.setOrdersFilter('completed')">
            Completed
          </button>
          <button class="orders-filter-pill ${filter === 'processing' ? 'active' : ''}" onclick="CustomerApp.setOrdersFilter('processing')">
            Processing
          </button>
          <button class="orders-filter-pill ${filter === 'in_progress' ? 'active' : ''}" onclick="CustomerApp.setOrdersFilter('in_progress')">
            In Progress
          </button>
        </div>

        <!-- Order Cards Stream -->
        <div style="display: flex; flex-direction: column; gap: 4px;">
          ${filtered.length === 0 ? `
            <div class="card" style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
              No orders found matching your search.
            </div>
          ` : filtered.map(order => this.renderHistoryCard(order, store)).join('')}
        </div>
      </div>
    `;
  },

  renderHistoryCard(order, store) {
    let badgeBg = '#E0F2FE';
    let badgeColor = '#0369A1';
    let badgeText = order.status;

    if (order.status === 'Completed') {
      badgeBg = '#DCFCE7';
      badgeColor = '#15803D';
    } else if (order.status === 'Processing') {
      badgeBg = '#D1FAE5';
      badgeColor = '#047857';
    }

    const startCount = Number(order.startCount || 0).toLocaleString();
    const currentCount = Number(order.currentCount || 0).toLocaleString();
    const remains = Number(order.remains || 0).toLocaleString();
    const canRefill = order.status === 'Completed';

    return `
      <div class="order-history-card">
        <!-- Top Row: #ID + Status Badge + Date -->
        <div class="order-history-top">
          <div class="order-history-id-group">
            <span class="order-history-id">#${order.id}</span>
            <span style="background: ${badgeBg}; color: ${badgeColor}; font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 9999px; display: inline-flex; align-items: center; gap: 5px;">
              <span style="width: 6px; height: 6px; border-radius: 50%; background: ${badgeColor};"></span>
              ${badgeText}
            </span>
          </div>
          <span class="order-history-date">${order.date || 'Today'}</span>
        </div>

        <!-- Title -->
        <div class="order-history-title-text">${order.serviceName}</div>

        <!-- Qty & Charge Row -->
        <div class="order-history-pricing-row">
          <span class="order-history-qty">Qty: <strong>${Number(order.quantity).toLocaleString()}</strong></span>
          <span class="order-history-price">${store.formatMoney(order.amount)}</span>
        </div>

        <!-- 3-Column Metrics Box -->
        <div class="order-stats-trio">
          <div class="stat-trio-col">
            <span class="stat-trio-label">Start Count</span>
            <span class="stat-trio-val">${startCount}</span>
          </div>
          <div class="stat-trio-col">
            <span class="stat-trio-label">Current Count</span>
            <span class="stat-trio-val">${currentCount}</span>
          </div>
          <div class="stat-trio-col">
            <span class="stat-trio-label">Remains</span>
            <span class="stat-trio-val">${remains}</span>
          </div>
        </div>

        <!-- Full-Width Vibrant Purple Button -->
        ${canRefill ? `
          <button class="btn-refill-full" onclick="CustomerApp.promptRefill('${order.id}')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
            </svg>
            <span>Request Refill</span>
          </button>
        ` : `
          <div style="text-align: center; padding: 6px 0; font-size: 12.5px; color: var(--text-secondary);">
            Order in progress • Refill warranty activates upon completion
          </div>
        `}
      </div>
    `;
  },

  setOrdersFilter(filter) {
    this.ordersFilter = filter;
    const screenContainer = document.getElementById('screen-container');
    this.render(screenContainer);
  },

  handleOrdersSearch(val) {
    this.ordersSearch = val;
    clearTimeout(this._orderSearchDebounce);
    this._orderSearchDebounce = setTimeout(() => {
      const screenContainer = document.getElementById('screen-container');
      this.render(screenContainer);
    }, 200);
  },

  // 2. NEW ORDER TAB WITH CASCADING DROPDOWNS OVER 5,803 SERVICES
  renderNewOrderTab(store) {
    const rawServices = window.JAP_SERVICES || [];
    const plat = this.currentPlatform || 'instagram';
    const query = (this.searchQuery || '').trim().toLowerCase();

    let filteredServices = rawServices;
    if (query) {
      filteredServices = rawServices.filter(s => 
        String(s.id).includes(query) || 
        s.name.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query)
      );
    } else if (plat !== 'all') {
      filteredServices = rawServices.filter(s => s.platform === plat);
    }

    const categories = [...new Set(filteredServices.map(s => s.category))];
    if (!categories.includes(this.currentCategory) && categories.length > 0) {
      this.currentCategory = categories[0];
    }

    let activePackages = filteredServices.filter(s => s.category === this.currentCategory);
    if (activePackages.length === 0 && filteredServices.length > 0) {
      activePackages = filteredServices;
    }

    const activeService = activePackages[0] || {};
    const sellingPrice = store.getSellingPrice(activeService.cost || 0.20);

    return `
      <div style="display: flex; flex-direction: column; gap: 20px; max-width: 800px; margin: 0 auto; width: 100%;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
          <div>
            <h2 style="font-size: 24px; font-weight: 800;">Place New Order</h2>
            <p style="font-size: 14px;">Instant automated delivery across 5,803 live wholesale services.</p>
          </div>
          <span class="badge badge-primary" style="font-size: 13px; padding: 6px 12px;">
            5,803 Services Active
          </span>
        </div>

        <!-- Live Instant Search Box -->
        <div class="form-group" style="margin-bottom: 0;">
          <div style="position: relative;">
            <input type="text" class="form-input" id="service-search-input" placeholder="🔍 Search service name, ID (e.g. 10349), or keyword..." value="${this.searchQuery}" style="padding-left: 38px; min-height: 42px;" oninput="CustomerApp.handleSearch(this.value)" />
            <span style="position: absolute; left: 12px; top: 11px; font-size: 16px; color: var(--text-muted);">⚡</span>
          </div>
        </div>

        <!-- Platform Filter Tabs -->
        <div class="form-group" style="margin-bottom: 4px;">
          <label class="form-label">Platform</label>
          <div class="platform-chips-scroll" id="new-order-platform-chips">
            <button class="platform-chip ${plat === 'all' ? 'active' : ''}" onclick="CustomerApp.selectPlatform('all')">All (5,803)</button>
            <button class="platform-chip ${plat === 'instagram' ? 'active' : ''}" onclick="CustomerApp.selectPlatform('instagram')">Instagram</button>
            <button class="platform-chip ${plat === 'tiktok' ? 'active' : ''}" onclick="CustomerApp.selectPlatform('tiktok')">TikTok</button>
            <button class="platform-chip ${plat === 'youtube' ? 'active' : ''}" onclick="CustomerApp.selectPlatform('youtube')">YouTube</button>
            <button class="platform-chip ${plat === 'facebook' ? 'active' : ''}" onclick="CustomerApp.selectPlatform('facebook')">Facebook</button>
            <button class="platform-chip ${plat === 'telegram' ? 'active' : ''}" onclick="CustomerApp.selectPlatform('telegram')">Telegram</button>
            <button class="platform-chip ${plat === 'twitter' ? 'active' : ''}" onclick="CustomerApp.selectPlatform('twitter')">Twitter / X</button>
            <button class="platform-chip ${plat === 'spotify' ? 'active' : ''}" onclick="CustomerApp.selectPlatform('spotify')">Spotify</button>
            <button class="platform-chip ${plat === 'other' ? 'active' : ''}" onclick="CustomerApp.selectPlatform('other')">Other Platforms</button>
          </div>
        </div>

        <!-- 1st Box: Category Dropdown (JAP 242 Categories) -->
        <div class="form-group">
          <label class="form-label">
            <span>1. Select Category</span>
            <span class="form-label-hint">${categories.length} Categories available</span>
          </label>
          <select class="form-select" id="new-order-category-select" onchange="CustomerApp.handleCategoryChange(this.value)">
            ${categories.map(c => `
              <option value="${c}" ${c === this.currentCategory ? 'selected' : ''}>
                ${c}
              </option>
            `).join('')}
          </select>
        </div>

        <!-- 2nd Box: Service Package & Rates Dropdown -->
        <div class="form-group">
          <label class="form-label">
            <span>2. Select Service Package (with Selling Rates)</span>
            <span class="form-label-hint">${activePackages.length} Packages</span>
          </label>
          <select class="form-select" id="new-order-service-select">
            ${activePackages.map(s => {
              const sp = store.getSellingPrice(s.cost);
              return `
                <option value="${s.id}" data-cost="${s.cost}" data-min="${s.min}" data-max="${s.max}" data-refill="${s.refill ? '1' : '0'}" data-name="${s.name}">
                  #${s.id} - ${s.name} — ${store.formatMoney(sp)}/1K
                </option>
              `;
            }).join('')}
          </select>
        </div>

        <!-- Service Specification Card -->
        <div class="service-details-card" id="service-details-box">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: var(--primary); font-size: 14px;">Service Details</strong>
            <span class="badge ${activeService.refill ? 'badge-success' : 'badge-neutral'}" id="service-detail-refill-badge">
              ${activeService.refill ? '🛡️ Refill Guarantee Active' : 'No Refill Warranty'}
            </span>
          </div>
          <div id="service-detail-name" style="font-size: 13.5px; font-weight: 700; color: var(--text-main); margin-top: 6px;">
            ${activeService.name || ''}
          </div>
          <div class="service-meta-grid" style="margin-top: 10px;">
            <div class="meta-item">
              <span class="meta-item-label">Min Limit</span>
              <span class="meta-item-val" id="service-detail-min">${(activeService.min || 10).toLocaleString()}</span>
            </div>
            <div class="meta-item">
              <span class="meta-item-label">Max Limit</span>
              <span class="meta-item-val" id="service-detail-max">${(activeService.max || 100000).toLocaleString()}</span>
            </div>
            <div class="meta-item">
              <span class="meta-item-label">Rate / 1K</span>
              <span class="meta-item-val" id="service-detail-rate" style="color: var(--primary); font-weight: 800;">${store.formatMoney(sellingPrice)}</span>
            </div>
            <div class="meta-item">
              <span class="meta-item-label">Service ID</span>
              <span class="meta-item-val" id="service-detail-id" style="font-family: var(--font-mono);">#${activeService.id || '—'}</span>
            </div>
          </div>
        </div>

        <!-- Target Link / Username -->
        <div class="form-group">
          <label class="form-label">
            <span>Target Link / Profile</span>
            <span class="form-label-hint">Public profiles or links only</span>
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
            <span class="form-label-hint" id="qty-limits-hint">Min: ${(activeService.min || 10).toLocaleString()} | Max: ${(activeService.max || 100000).toLocaleString()}</span>
          </label>
          <input type="number" class="form-input" id="new-order-quantity" value="1000" min="${activeService.min || 10}" max="${activeService.max || 100000}" step="100" />
          <div class="qty-preset-chips">
            <button type="button" class="qty-preset-btn" onclick="CustomerApp.setQty(500)">+500</button>
            <button type="button" class="qty-preset-btn" onclick="CustomerApp.setQty(1000)">+1,000</button>
            <button type="button" class="qty-preset-btn" onclick="CustomerApp.setQty(2500)">+2,500</button>
            <button type="button" class="qty-preset-btn" onclick="CustomerApp.setQty(5000)">+5,000</button>
          </div>
        </div>

        <!-- Price Calculation Summary Box -->
        <div class="calculation-summary-card">
          <div class="calc-row">
            <span>Unit Rate (per 1,000):</span>
            <strong id="calc-rate-label">${store.formatMoney(sellingPrice)}</strong>
          </div>
          <div class="calc-row">
            <span>Current Wallet Balance:</span>
            <span>${store.data.isLoggedIn ? store.formatMoney(store.data.customer.balance) : 'Guest Mode (Sign in to view balance)'}</span>
          </div>
          <div class="calc-row total-row">
            <span>Total Charge:</span>
            <span id="calc-total-label">${store.formatMoney((sellingPrice / 1000) * 1000)}</span>
          </div>
          <div id="balance-check-status" style="margin-top: 4px;">
            ${store.data.isLoggedIn ? `
              <span class="balance-status-pill badge-success">✓ Sufficient Wallet Balance</span>
            ` : `
              <span class="balance-status-pill" style="background: var(--bg-subtle); color: var(--text-secondary);">ℹ️ Sign in required to place order</span>
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
    this.searchQuery = '';
    const screenContainer = document.getElementById('screen-container');
    this.render(screenContainer);
  },

  handleCategoryChange(cat) {
    this.currentCategory = cat;
    const screenContainer = document.getElementById('screen-container');
    this.render(screenContainer);
  },

  handleSearch(val) {
    this.searchQuery = val;
    clearTimeout(this._searchDebounce);
    this._searchDebounce = setTimeout(() => {
      const screenContainer = document.getElementById('screen-container');
      this.render(screenContainer);
      const input = document.getElementById('service-search-input');
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }, 250);
  },

  bindEvents() {
    const serviceSelect = document.getElementById('new-order-service-select');
    const qtyInput = document.getElementById('new-order-quantity');

    if (serviceSelect && qtyInput) {
      const updateCalc = () => {
        const store = window.store;
        const selectedOpt = serviceSelect.options[serviceSelect.selectedIndex];
        if (!selectedOpt) return;

        const cost = parseFloat(selectedOpt.getAttribute('data-cost')) || 0.20;
        const min = parseInt(selectedOpt.getAttribute('data-min')) || 10;
        const max = parseInt(selectedOpt.getAttribute('data-max')) || 100000;
        const refill = selectedOpt.getAttribute('data-refill') === '1';
        const name = selectedOpt.getAttribute('data-name') || '';
        const id = selectedOpt.value;

        const sellingPrice = store.getSellingPrice(cost);

        document.getElementById('service-detail-name').textContent = name;
        document.getElementById('service-detail-min').textContent = min.toLocaleString();
        document.getElementById('service-detail-max').textContent = max.toLocaleString();
        document.getElementById('service-detail-rate').textContent = store.formatMoney(sellingPrice);
        document.getElementById('service-detail-id').textContent = '#' + id;
        document.getElementById('qty-limits-hint').textContent = `Min: ${min.toLocaleString()} | Max: ${max.toLocaleString()}`;

        const badge = document.getElementById('service-detail-refill-badge');
        if (badge) {
          badge.className = `badge ${refill ? 'badge-success' : 'badge-neutral'}`;
          badge.textContent = refill ? '🛡️ Refill Guarantee Active' : 'No Refill Warranty';
        }

        document.getElementById('calc-rate-label').textContent = store.formatMoney(sellingPrice);

        const qty = Number(qtyInput.value) || 0;
        const total = (sellingPrice / 1000) * qty;
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

  handlePlaceOrder() {
    const store = window.store;
    if (!store.data.isLoggedIn) {
      this.openAuthModal('login');
      return;
    }

    const serviceSelect = document.getElementById('new-order-service-select');
    if (!serviceSelect) return;
    const selectedOpt = serviceSelect.options[serviceSelect.selectedIndex];
    const serviceId = serviceSelect.value;
    const serviceName = selectedOpt.getAttribute('data-name') || `Service #${serviceId}`;
    const wholesaleCost = parseFloat(selectedOpt.getAttribute('data-cost')) || 0.20;
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

    store.placeOrder({ serviceId, serviceName, wholesaleCost, target, quantity });
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

  promptRefill(orderId) {
    const order = window.store.data.orders.find(o => String(o.id) === String(orderId));
    if (!order) return;

    if (confirm(`Request automatic refill for Order #${order.id} (${order.serviceName})?\n\nCurrent count: ${order.currentCount || 0} / Target: ${(order.startCount || 0) + order.quantity}`)) {
      window.store.requestRefill(orderId);
    }
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
              <div class="balance-label">WALLET BALANCE</div>
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
          <div style="font-size: 14px; font-weight: 700; color: var(--text-main); margin-top: 2px;">${order.serviceName}</div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div class="calc-row">
            <span>Target Link:</span>
            <span style="font-family: var(--font-mono); font-size: 12px; word-break: break-all;">${order.target}</span>
          </div>
          <div class="calc-row">
            <span>Quantity:</span>
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
