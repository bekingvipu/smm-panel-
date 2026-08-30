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
          <div class="header-balance-pill" onclick="store.setCustomerTab('wallet')" title="Click to Add Funds">
            <span class="header-balance-val">${isLoggedIn ? store.formatMoney(store.data.customer.balance) : '₹0'}</span>
            <span class="add-plus-badge">＋</span>
          </div>

          <button class="drawer-hamburger-btn" onclick="CustomerApp.openSideDrawer()" title="Menu & Settings">
            <span>☰</span>
          </button>

          ${isLoggedIn ? `
            <img src="${store.data.customer.avatar}" alt="Avatar" class="customer-avatar" onclick="CustomerApp.openProfileModal()" title="Account Profile" />
          ` : `
            <button class="btn btn-primary btn-sm" onclick="CustomerApp.openAuthModal('login')">
              Sign In
            </button>
          `}
        </div>
      </nav>

      <!-- Streamlined Mobile Header (Zero Clutter) -->
      <header class="customer-header">
        <div class="customer-header-left">
          <button class="drawer-hamburger-btn" onclick="CustomerApp.openSideDrawer()" title="Menu">
            ☰
          </button>
          <div class="customer-brand-name" onclick="store.setCustomerTab('new_order')" style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
            <span style="color: var(--primary);">⚡</span>
            <span>SMM Pro</span>
          </div>
        </div>

        <div class="customer-header-actions">
          ${isLoggedIn ? `
            <div class="header-balance-pill" onclick="store.setCustomerTab('wallet')" title="Click to Add Funds">
              <span class="header-balance-val">${store.formatMoney(store.data.customer.balance)}</span>
              <span class="add-plus-badge">＋</span>
            </div>
          ` : `
            <button class="btn btn-primary btn-sm" style="padding: 6px 14px; font-size: 13px; font-weight: 700; border-radius: 9999px;" onclick="CustomerApp.openAuthModal('login')">
              Sign In
            </button>
          `}
        </div>
      </header>

      <!-- Content Container -->
      <div class="customer-desktop-container">
        ${contentHtml}
      </div>

      <!-- Slide-Out Side Menu Drawer -->
      <div id="side-drawer-backdrop" class="side-drawer-backdrop" onclick="CustomerApp.handleBackdropClick(event)">
        <aside class="side-drawer-panel">
          <!-- Drawer Header with Avatar Customizer -->
          <div class="drawer-header">
            <div class="drawer-user-info">
              <div class="drawer-avatar-wrap" onclick="CustomerApp.openAvatarPickerModal()" title="Click to Change Cartoon Avatar">
                <img src="${store.data.customer.avatar}" class="drawer-avatar" alt="Avatar" />
                <span class="drawer-avatar-edit-badge" title="Change Avatar">✏️</span>
              </div>
              <div onclick="CustomerApp.openAvatarPickerModal()" style="cursor: pointer;">
                <div style="font-weight: 800; font-size: 15.5px; color: var(--text-main); display: flex; align-items: center; gap: 6px;">
                  <span>${isLoggedIn ? store.data.customer.name : 'Guest Visitor'}</span>
                </div>
                <div style="font-size: 12px; color: var(--text-secondary);">${isLoggedIn ? store.data.customer.email : 'Public Catalog Browsing'}</div>
                <div style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; color: var(--primary); margin-top: 2px; background: var(--primary-light); padding: 2px 8px; border-radius: 999px;">
                  <span>🎨 Change Avatar</span>
                </div>
              </div>
            </div>
            <button class="drawer-close-btn" onclick="CustomerApp.closeSideDrawer()">&times;</button>
          </div>

          <!-- Section 1: Reseller & Growth Hub -->
          <div class="drawer-section">
            <div class="drawer-section-title">Grow & Earn</div>
            <ul class="drawer-menu-list">
              <li class="drawer-menu-item" style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(168, 85, 247, 0.12)); border: 1px solid rgba(99, 102, 241, 0.25);" onclick="CustomerApp.closeSideDrawer(); CustomerApp.openResellerGuideModal();">
                <div class="drawer-item-left">
                  <span class="drawer-item-icon">💰</span>
                  <div>
                    <div style="color: var(--primary); font-weight: 800;">How to Earn Money</div>
                    <div style="font-size: 11.5px; color: var(--text-secondary);">Start your reselling business</div>
                  </div>
                </div>
                <span class="badge badge-success" style="font-size: 10px;">HOT</span>
              </li>

              <li class="drawer-menu-item" onclick="CustomerApp.closeSideDrawer(); CustomerApp.openApiDocsModal();">
                <div class="drawer-item-left">
                  <span class="drawer-item-icon">🔌</span>
                  <span>Reseller API Docs</span>
                </div>
                <span style="font-size: 11px; color: var(--text-muted);">V2 API</span>
              </li>
            </ul>
          </div>

          <!-- Section 2: Preferences (Currency & Theme) -->
          <div class="drawer-section">
            <div class="drawer-section-title">Preferences</div>
            
            <div style="margin-bottom: 12px;">
              <div style="font-size: 12.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Currency</div>
              <div class="segmented-currency-toggle">
                <button class="segmented-toggle-btn ${store.currency === 'INR' ? 'active' : ''}" onclick="store.setCurrency('INR')">
                  ₹ INR (Rupees)
                </button>
                <button class="segmented-toggle-btn ${store.currency === 'USD' ? 'active' : ''}" onclick="store.setCurrency('USD')">
                  $ USD (Dollars)
                </button>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 6px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span>${store.theme === 'light' ? '☀️' : '🌙'}</span>
                <span style="font-size: 13.5px; font-weight: 600;">Dark Theme</span>
              </div>
              <button class="btn btn-sm btn-secondary" onclick="store.setTheme(store.theme === 'light' ? 'dark' : 'light')">
                ${store.theme === 'light' ? 'Enable' : 'Disable'}
              </button>
            </div>
          </div>

          <!-- Section 3: Navigation Links -->
          <div class="drawer-section">
            <div class="drawer-section-title">Navigation</div>
            <ul class="drawer-menu-list">
              <li class="drawer-menu-item" onclick="CustomerApp.closeSideDrawer(); store.setCustomerTab('new_order');">
                <div class="drawer-item-left"><span class="drawer-item-icon">🛒</span> <span>Services & New Order</span></div>
              </li>
              <li class="drawer-menu-item" onclick="CustomerApp.closeSideDrawer(); store.setCustomerTab('orders');">
                <div class="drawer-item-left"><span class="drawer-item-icon">⏱️</span> <span>Orders History</span></div>
              </li>
              <li class="drawer-menu-item" onclick="CustomerApp.closeSideDrawer(); store.setCustomerTab('wallet');">
                <div class="drawer-item-left"><span class="drawer-item-icon">💳</span> <span>Add Funds / Wallet</span></div>
              </li>
              <li class="drawer-menu-item" onclick="CustomerApp.closeSideDrawer(); store.setCustomerTab('support');">
                <div class="drawer-item-left"><span class="drawer-item-icon">💬</span> <span>24/7 Support Desk</span></div>
              </li>
              <li class="drawer-menu-item" onclick="CustomerApp.closeSideDrawer(); CustomerApp.openNotifications();">
                <div class="drawer-item-left"><span class="drawer-item-icon">🔔</span> <span>Notifications</span></div>
                <span class="badge badge-primary" style="font-size: 10px;">New</span>
              </li>
              <li class="drawer-menu-item" onclick="CustomerApp.closeSideDrawer(); window.location.hash='#admin';">
                <div class="drawer-item-left"><span class="drawer-item-icon">🛡️</span> <span>Admin Console</span></div>
                <span style="font-size: 11px; color: var(--text-muted);">Admin</span>
              </li>
            </ul>
          </div>

          <!-- Section 4: Account Actions -->
          <div class="drawer-section" style="border-bottom: none; margin-top: auto;">
            ${isLoggedIn ? `
              <button class="btn btn-outline btn-block btn-sm" style="color: var(--error); border-color: var(--error);" onclick="CustomerApp.closeSideDrawer(); store.logout();">
                Sign Out
              </button>
            ` : `
              <button class="btn btn-primary btn-block" onclick="CustomerApp.closeSideDrawer(); CustomerApp.openAuthModal('login');">
                🔑 Sign In / Create Account
              </button>
            `}
          </div>
        </aside>
      </div>

      <!-- Mobile Bottom Navigation Bar -->
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

  openSideDrawer() {
    const drawer = document.getElementById('side-drawer-backdrop');
    if (drawer) drawer.classList.add('active');
  },

  closeSideDrawer() {
    const drawer = document.getElementById('side-drawer-backdrop');
    if (drawer) drawer.classList.remove('active');
  },

  handleBackdropClick(e) {
    if (e.target.id === 'side-drawer-backdrop') {
      this.closeSideDrawer();
    }
  },

  // "HOW TO EARN MONEY (RESELLER GUIDE)" MODAL
  openResellerGuideModal() {
    const modal = document.getElementById('generic-modal-backdrop');
    const sheet = document.getElementById('generic-modal-sheet');

    sheet.innerHTML = `
      <div class="modal-header">
        <div>
          <h3 class="modal-title">💰 How to Earn Money Reselling</h3>
          <p style="font-size: 12.5px; color: var(--text-secondary);">Start your own social media growth agency with zero investment!</p>
        </div>
        <button class="modal-close" onclick="CustomerApp.closeModal()">&times;</button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 16px;">
        <!-- Step 1 to 4 Cards -->
        <div class="card" style="padding: 14px; background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(168, 85, 247, 0.08)); border-left: 4px solid var(--primary);">
          <div style="font-weight: 800; font-size: 15px; color: var(--primary);">Step 1: Pick a Cheap Wholesale Service</div>
          <p style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">
            On SMM Pro, you get <strong>1,000 Instagram Followers for just ₹25</strong>, or <strong>1,000 Likes for ₹10</strong>.
          </p>
        </div>

        <div class="card" style="padding: 14px; background: var(--bg-surface); border-left: 4px solid #10B981;">
          <div style="font-weight: 800; font-size: 15px; color: #10B981;">Step 2: Share with Clients & Friends</div>
          <p style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">
            Post on your WhatsApp Status, Instagram, or message local shops & creators offering Followers for <strong>₹99 per 1,000</strong>.
          </p>
        </div>

        <div class="card" style="padding: 14px; background: var(--bg-surface); border-left: 4px solid #F59E0B;">
          <div style="font-weight: 800; font-size: 15px; color: #F59E0B;">Step 3: Collect ₹99 via UPI to Your Account</div>
          <p style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">
            The customer pays you <strong>₹99 directly</strong> via GPay/PhonePe.
          </p>
        </div>

        <div class="card" style="padding: 14px; background: var(--bg-surface); border-left: 4px solid #6366F1;">
          <div style="font-weight: 800; font-size: 15px; color: #6366F1;">Step 4: Place Order on SMM Pro & Keep Profit!</div>
          <p style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">
            You place the order on SMM Pro for ₹25 using their link. <br/>
            <strong>You pocket ₹74 instant pure profit per order!</strong>
          </p>
        </div>

        <!-- Profit Calculator Example -->
        <div style="background: var(--bg-subtle); padding: 14px; border-radius: var(--radius-md); text-align: center;">
          <div style="font-size: 12px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Estimated Monthly Income</div>
          <div style="font-size: 26px; font-weight: 900; color: var(--primary); margin: 6px 0;">₹22,200 / month</div>
          <p style="font-size: 12px; color: var(--text-secondary);">(Based on just 10 orders per day at ₹74 profit each)</p>
        </div>

        <button class="btn btn-primary btn-block btn-lg" onclick="CustomerApp.closeModal(); store.setCustomerTab('new_order');">
          Browse Wholesale Services Now
        </button>
      </div>
    `;

    modal.classList.add('active');
  },

  // "RESELLER API V2" MODAL
  openApiDocsModal() {
    const modal = document.getElementById('generic-modal-backdrop');
    const sheet = document.getElementById('generic-modal-sheet');

    sheet.innerHTML = `
      <div class="modal-header">
        <div>
          <h3 class="modal-title">🔌 Reseller API Documentation (V2)</h3>
          <p style="font-size: 12.5px; color: var(--text-secondary);">Standard SMM Provider API protocol for external panels & bots.</p>
        </div>
        <button class="modal-close" onclick="CustomerApp.closeModal()">&times;</button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 14px;">
        <div style="background: var(--bg-subtle); padding: 12px; border-radius: var(--radius-md); font-family: var(--font-mono); font-size: 12.5px;">
          <div style="color: var(--text-muted); font-size: 11px; text-transform: uppercase;">HTTP POST Endpoint</div>
          <strong style="color: var(--primary);">https://smm-panel-azure.vercel.app/api/provider</strong>
        </div>

        <div style="font-size: 13px; color: var(--text-secondary);">
          Connect your custom scripts or external reseller panels to automatically fetch services, place orders, and check statuses.
        </div>

        <div class="card" style="padding: 12px; font-family: var(--font-mono); font-size: 12px; background: var(--bg-surface);">
          <div><strong>1. Add Order:</strong> action=add&service=10349&link=URL&quantity=1000</div>
          <div style="margin-top: 6px;"><strong>2. Check Status:</strong> action=status&order=48291</div>
          <div style="margin-top: 6px;"><strong>3. Balance:</strong> action=balance</div>
          <div style="margin-top: 6px;"><strong>4. Refill:</strong> action=refill&order=48291</div>
        </div>

        <button class="btn btn-secondary btn-block" onclick="window.store.showToast('API Key copied to clipboard: sk_live_reseller_9901', 'success')">
          📋 Copy Secret API Key
        </button>
      </div>
    `;

    modal.classList.add('active');
  },

  getPlatformIconSvg(platId) {
    switch (platId) {
      case 'instagram':
        return '<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="#E1306C"/></svg>';
      case 'tiktok':
        return '<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.86 4.43c.03-.03.07-.05.1-.08V11.2a8.16 8.16 0 0 0 5.63 2.26v-3.5a4.85 4.85 0 0 1-3.77-3.27h3.77V6.69z" fill="#25F4EE"/></svg>';
      case 'youtube':
        return '<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#FF0000"/></svg>';
      case 'facebook':
        return '<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/></svg>';
      case 'telegram':
        return '<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.943z" fill="#229ED9"/></svg>';
      case 'twitter':
        return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="currentColor"/></svg>';
      case 'spotify':
        return '<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm5.508 17.308c-.22.359-.684.475-1.043.255-2.859-1.747-6.457-2.143-10.697-1.173-.41.094-.82-.162-.913-.572-.094-.41.162-.82.572-.913 4.636-1.06 8.608-.611 11.827 1.36.359.22.475.684.254 1.043zm1.47-3.268c-.276.449-.865.592-1.314.316-3.272-2.011-8.26-2.594-12.13-1.419-.505.153-1.04-.135-1.193-.64-.153-.505.135-1.04.64-1.193 4.417-1.34 9.914-.687 13.681 1.622.449.276.592.865.316 1.314zm.126-3.411c-3.924-2.33-10.395-2.545-14.15-1.405-.602.183-1.24-.162-1.423-.764-.183-.602.162-1.24.764-1.423 4.316-1.31 11.455-1.06 15.98 1.626.54.321.716 1.02.395 1.56-.321.54-1.02.716-1.56.395z" fill="#1DB954"/></svg>';
      case 'other':
        return '🌐';
      default:
        return '⚡';
    }
  },

  // 2. NEW ORDER TAB WITH CLEANED SEARCH BOX & CASCADING DROPDOWNS
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

    const platforms = [
      { id: 'all', label: 'All (5,803)', icon: '⚡' },
      { id: 'instagram', label: 'Instagram', icon: this.getPlatformIconSvg('instagram') },
      { id: 'tiktok', label: 'TikTok', icon: this.getPlatformIconSvg('tiktok') },
      { id: 'youtube', label: 'YouTube', icon: this.getPlatformIconSvg('youtube') },
      { id: 'facebook', label: 'Facebook', icon: this.getPlatformIconSvg('facebook') },
      { id: 'telegram', label: 'Telegram', icon: this.getPlatformIconSvg('telegram') },
      { id: 'twitter', label: 'Twitter / X', icon: this.getPlatformIconSvg('twitter') },
      { id: 'spotify', label: 'Spotify', icon: this.getPlatformIconSvg('spotify') },
      { id: 'other', label: 'Other', icon: '🌐' }
    ];

    return `
      <div class="order-premium-card" style="max-width: 840px; margin: 0 auto; width: 100%;">
        <!-- Header Banner with Live Services Pulse -->
        <div class="order-hero-banner">
          <div class="order-title-group">
            <h2><span>✨</span> <span>Place New Order</span></h2>
            <p class="order-title-sub">Instant automated delivery across wholesale global servers.</p>
          </div>
          <div class="live-services-pill">
            <span class="live-pulse-dot"></span>
            <span>5,803 Services Active</span>
          </div>
        </div>

        <!-- Frosted Instant Search Box with Clear Button -->
        <div class="form-group" style="margin-bottom: 0;">
          <div style="position: relative;">
            <input 
              type="text" 
              class="form-input" 
              id="service-search-input" 
              placeholder="Search service name, ID (e.g. 10349), or keyword..." 
              value="${this.searchQuery}" 
              style="padding-left: 42px; padding-right: 36px; min-height: 48px; font-size: 14.5px; border-radius: 14px;" 
              oninput="CustomerApp.handleSearch(this.value)" 
            />
            <span style="position: absolute; left: 14px; top: 14px; font-size: 16px; color: var(--text-muted); pointer-events: none;">🔍</span>
            ${this.searchQuery ? `
              <button type="button" onclick="CustomerApp.clearSearch()" style="position: absolute; right: 12px; top: 12px; border: none; background: var(--bg-hover); color: var(--text-secondary); width: 24px; height: 24px; border-radius: 50%; cursor: pointer; font-size: 13px; font-weight: 800;">✕</button>
            ` : ''}
          </div>
        </div>

        <!-- Platform Filter Tabs with Branded SVGs -->
        <div class="form-group" style="margin-bottom: 4px;">
          <label class="form-label" style="font-weight: 800; font-size: 12.5px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary);">
            Select Platform
          </label>
          <div class="platform-chips-scroll-pro" id="new-order-platform-chips">
            ${platforms.map(p => `
              <button class="platform-chip-pro ${plat === p.id ? 'active' : ''}" onclick="CustomerApp.selectPlatform('${p.id}')">
                <span class="chip-icon-svg" style="display: flex; align-items: center;">${p.icon}</span>
                <span>${p.label}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- 1st Box: Category Dropdown -->
        <div class="form-group">
          <label class="form-label">
            <span style="font-weight: 800;">1. Select Category</span>
            <span class="form-label-hint" style="background: rgba(108, 92, 231, 0.1); color: var(--primary); padding: 2px 8px; border-radius: 999px; font-weight: 700;">${categories.length} Categories</span>
          </label>
          <select class="form-select" id="new-order-category-select" onchange="CustomerApp.handleCategoryChange(this.value)" style="min-height: 48px; border-radius: 12px; font-weight: 600;">
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
            <span style="font-weight: 800;">2. Select Service Package (with Selling Rates)</span>
            <span class="form-label-hint" style="background: rgba(108, 92, 231, 0.1); color: var(--primary); padding: 2px 8px; border-radius: 999px; font-weight: 700;">${activePackages.length} Packages</span>
          </label>
          <select class="form-select" id="new-order-service-select" style="min-height: 48px; border-radius: 12px; font-weight: 600;">
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

        <!-- High-Tech VIP Service Details Terminal -->
        <div class="vip-spec-card" id="service-details-box">
          <div class="vip-spec-header">
            <div class="vip-spec-title">
              <span>⚡</span>
              <span>Service Guarantee & Live Specs</span>
            </div>
            <span class="badge ${activeService.refill ? 'badge-success' : 'badge-neutral'}" id="service-detail-refill-badge" style="font-size: 12px; padding: 5px 12px; border-radius: 999px;">
              ${activeService.refill ? '🛡️ Refill Guarantee Active (365D)' : 'No Refill Warranty'}
            </span>
          </div>
          <div id="service-detail-name" style="font-size: 14px; font-weight: 800; color: var(--text-main); line-height: 1.4;">
            ${activeService.name || ''}
          </div>
          <div class="vip-spec-grid">
            <div class="spec-tile">
              <span class="spec-tile-label">Wholesale Rate</span>
              <span class="spec-tile-val" id="service-detail-rate" style="color: var(--primary); font-size: 16px;">${store.formatMoney(sellingPrice)}/1K</span>
            </div>
            <div class="spec-tile">
              <span class="spec-tile-label">Min Limit</span>
              <span class="spec-tile-val" id="service-detail-min">${(activeService.min || 10).toLocaleString()}</span>
            </div>
            <div class="spec-tile">
              <span class="spec-tile-label">Max Limit</span>
              <span class="spec-tile-val" id="service-detail-max">${(activeService.max || 100000).toLocaleString()}</span>
            </div>
            <div class="spec-tile">
              <span class="spec-tile-label">Service ID</span>
              <span class="spec-tile-val" id="service-detail-id">#${activeService.id || '—'}</span>
            </div>
          </div>
          <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap; font-size: 12px; color: var(--text-secondary); border-top: 1px dashed rgba(108, 92, 231, 0.2); padding-top: 10px;">
            <span style="display: inline-flex; align-items: center; gap: 4px; font-weight: 700; color: #059669;">🚀 Speed: ~50,000 - 200,000 / Day</span>
            <span>•</span>
            <span style="display: inline-flex; align-items: center; gap: 4px; font-weight: 600;">⚡ Start: Instant (0 - 15 mins)</span>
            <span>•</span>
            <span style="display: inline-flex; align-items: center; gap: 4px; font-weight: 600;">⭐ High Retention Drop Protection</span>
          </div>
        </div>

        <!-- Target Link / Username -->
        <div class="form-group">
          <label class="form-label">
            <span style="font-weight: 800;">Target Link / Profile Username</span>
            <span class="form-label-hint">Public profiles or links only</span>
          </label>
          <div style="position: relative;">
            <input type="url" class="form-input" id="new-order-target" placeholder="https://instagram.com/your_profile" value="https://instagram.com/creator_daily" style="min-height: 48px; border-radius: 12px; padding-right: 80px;" />
            <button type="button" class="btn btn-sm btn-secondary" style="position: absolute; right: 6px; top: 7px; height: 34px; padding: 0 14px; border-radius: 8px; font-weight: 700;" onclick="CustomerApp.pasteSampleLink()">
              Paste
            </button>
          </div>
        </div>

        <!-- Quantity with Interactive Steppers -->
        <div class="form-group">
          <label class="form-label">
            <span style="font-weight: 800;">Order Quantity</span>
            <span class="form-label-hint" id="qty-limits-hint" style="font-family: var(--font-mono); font-weight: 600;">Min: ${(activeService.min || 10).toLocaleString()} | Max: ${(activeService.max || 100000).toLocaleString()}</span>
          </label>
          <input type="number" class="form-input" id="new-order-quantity" value="1000" min="${activeService.min || 10}" max="${activeService.max || 100000}" step="100" style="min-height: 48px; border-radius: 12px; font-weight: 700; font-size: 16px;" />
          <div class="qty-steppers-bar">
            <button type="button" class="qty-pill-btn" onclick="CustomerApp.setQty(500)">+500</button>
            <button type="button" class="qty-pill-btn" onclick="CustomerApp.setQty(1000)">+1,000</button>
            <button type="button" class="qty-pill-btn" onclick="CustomerApp.setQty(2500)">+2,500</button>
            <button type="button" class="qty-pill-btn" onclick="CustomerApp.setQty(5000)">+5,000</button>
            <button type="button" class="qty-pill-btn" onclick="CustomerApp.setQty(10000)">+10,000</button>
            <button type="button" class="qty-pill-btn" onclick="CustomerApp.setQty(${activeService.max || 100000})" style="color: var(--primary); font-weight: 800;">MAX</button>
          </div>
        </div>

        <!-- Luxury Receipt & Price Calculation Summary -->
        <div class="receipt-calc-card">
          <div class="receipt-row">
            <span>Service Unit Rate:</span>
            <strong id="calc-rate-label" style="color: var(--text-main); font-family: var(--font-mono);">${store.formatMoney(sellingPrice)} / 1,000</strong>
          </div>
          <div class="receipt-row">
            <span>Current Wallet Balance:</span>
            <strong style="color: var(--text-main);">${store.data.isLoggedIn ? store.formatMoney(store.data.customer.balance) : 'Guest Mode (Sign in to view)'}</strong>
          </div>
          <div class="receipt-row total-charge-row">
            <span style="font-weight: 800; font-size: 15px; color: var(--text-main);">Total Charge:</span>
            <span class="receipt-total-amount" id="calc-total-label">${store.formatMoney((sellingPrice / 1000) * 1000)}</span>
          </div>
          <div id="balance-check-status" style="margin-top: 2px;">
            ${store.data.isLoggedIn ? `
              <span class="balance-status-pill badge-success" style="padding: 6px 14px; font-size: 12.5px;">✓ Sufficient Wallet Balance</span>
            ` : `
              <span class="balance-status-pill" style="background: var(--bg-subtle); color: var(--text-secondary); padding: 6px 14px; font-size: 12.5px;">ℹ️ Sign in required to place order</span>
            `}
          </div>
        </div>

        <!-- Submit Button with Refraction Glare Animation -->
        <button class="btn btn-primary btn-lg btn-block btn-refraction" id="btn-submit-order" onclick="CustomerApp.handlePlaceOrder()" style="height: 52px; border-radius: 14px; font-size: 16px;">
          <span>${store.data.isLoggedIn ? '⚡ Confirm & Place Order' : '🔑 Sign In to Place Order'}</span>
        </button>
      </div>
    `;
  },

  clearSearch() {
    this.searchQuery = '';
    const screenContainer = document.getElementById('screen-container');
    this.render(screenContainer);
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

  async handlePlaceOrder() {
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
    const target = document.getElementById('new-order-target').value.trim();
    const quantity = Number(document.getElementById('new-order-quantity').value);

    if (!target) {
      store.showToast('Please enter a target link or username', 'error');
      return;
    }

    if (!quantity || quantity <= 0) {
      store.showToast('Please specify a valid quantity', 'error');
      return;
    }

    const unitSellingPrice = store.getSellingPrice(wholesaleCost);
    const totalCost = (unitSellingPrice / 1000) * quantity;
    if (store.data.customer.balance < totalCost) {
      store.showToast('Insufficient wallet balance. Please add funds first!', 'error');
      store.setCustomerTab('wallet');
      return;
    }

    const submitBtn = document.getElementById('btn-submit-order');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>⚡ Processing Order Refraction...</span>';
    }

    const res = await store.placeOrder({ serviceId, serviceName, wholesaleCost, target, quantity }, { silent: true });

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>⚡ Confirm & Place Order</span>';
    }

    if (res && res.success) {
      CustomerApp.showOrderCelebrationModal({
        orderId: res.orderId,
        serviceName,
        target,
        quantity,
        totalCost: res.totalCost || totalCost
      });
    }
  },

  showOrderCelebrationModal({ orderId, serviceName, target, quantity, totalCost }) {
    const store = window.store;
    const modal = document.getElementById('generic-modal-backdrop');
    const sheet = document.getElementById('generic-modal-sheet');

    sheet.innerHTML = `
      <div class="order-success-overlay">
        <div class="success-check-refraction">
          <span>✓</span>
        </div>

        <div>
          <h3 style="font-size: 22px; font-weight: 900; letter-spacing: -0.02em; color: var(--text-main);">Order Confirmed & Placed! ✨</h3>
          <p style="font-size: 13.5px; color: var(--text-secondary); margin-top: 4px;">Live automated delivery has initiated</p>
        </div>

        <div style="background: var(--bg-subtle); border: 1.5px solid rgba(16, 185, 129, 0.25); border-radius: 16px; padding: 16px 18px; width: 100%; text-align: left; display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Order Number</span>
            <span style="font-family: var(--font-mono); font-weight: 900; color: var(--primary); font-size: 16px;">#${orderId}</span>
          </div>
          <div style="font-size: 13.5px; font-weight: 700; color: var(--text-main); line-height: 1.3;">
            ${serviceName}
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 12.5px; color: var(--text-secondary); border-top: 1px dashed var(--border-color); padding-top: 8px;">
            <span>Quantity: <strong style="color: var(--text-main);">${Number(quantity).toLocaleString()}</strong></span>
            <span>Total Paid: <strong style="color: #059669;">${store.formatMoney(totalCost)}</strong></span>
          </div>
          <div style="font-size: 11.5px; color: var(--text-muted); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
            🔗 Target: ${target}
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px; width: 100%; margin-top: 6px;">
          <button class="btn btn-primary btn-block btn-refraction" onclick="CustomerApp.closeModal(); store.setCustomerTab('orders')">
            📊 Track in Orders History
          </button>
          <button class="btn btn-secondary btn-block" onclick="CustomerApp.closeModal();">
            ➕ Place Another Order
          </button>
        </div>
      </div>
    `;

    modal.classList.add('active');
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

  // 1. DASHBOARD WITH CRISP ICONS
  renderHomeTab(store) {
    const recentOrders = store.data.orders.slice(0, 4);

    return `
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

      <div class="section-header-row" style="margin-top: 24px;">
        <div class="section-title">Recent Orders</div>
        <a class="section-link" onclick="store.setCustomerTab('orders')">View All Orders</a>
      </div>

      <div class="mobile-orders-list">
        ${recentOrders.map(order => this.renderHistoryCard(order, store)).join('')}
      </div>
    `;
  },

  // 3. ORDERS HISTORY TAB
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
        <div class="orders-history-header">
          <h1 class="orders-history-title">Orders History</h1>
          <span class="badge badge-primary" style="font-size: 13px; padding: 6px 14px; border-radius: 9999px;">
            ${allOrders.length} Total Orders
          </span>
        </div>

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

        <div class="orders-filter-chips">
          <button class="orders-filter-pill ${filter === 'all' ? 'active' : ''}" onclick="CustomerApp.setOrdersFilter('all')">All</button>
          <button class="orders-filter-pill ${filter === 'completed' ? 'active' : ''}" onclick="CustomerApp.setOrdersFilter('completed')">Completed</button>
          <button class="orders-filter-pill ${filter === 'processing' ? 'active' : ''}" onclick="CustomerApp.setOrdersFilter('processing')">Processing</button>
          <button class="orders-filter-pill ${filter === 'in_progress' ? 'active' : ''}" onclick="CustomerApp.setOrdersFilter('in_progress')">In Progress</button>
        </div>

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

        <div class="order-history-title-text">${order.serviceName}</div>

        <div class="order-history-pricing-row">
          <span class="order-history-qty">Qty: <strong>${Number(order.quantity).toLocaleString()}</strong></span>
          <span class="order-history-price">${store.formatMoney(order.amount)}</span>
        </div>

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
        <div class="drawer-avatar-wrap" onclick="CustomerApp.openAvatarPickerModal()" title="Click to Change Cartoon Avatar" style="display: inline-block;">
          <img src="${store.data.customer.avatar}" style="width: 76px; height: 76px; border-radius: 50%; border: 3px solid var(--primary); object-fit: cover;" />
          <span class="drawer-avatar-edit-badge" style="width: 26px; height: 26px; font-size: 13px;">✏️</span>
        </div>
        <div>
          <h4 style="font-size: 17px; font-weight: 800;">${store.data.customer.name}</h4>
          <p style="font-size: 13px; color: var(--text-secondary);">${store.data.customer.email}</p>
          <button class="btn btn-sm btn-outline" style="margin-top: 6px; font-size: 11.5px; border-radius: 999px; padding: 4px 14px; font-weight: 700;" onclick="CustomerApp.openAvatarPickerModal()">
            🎨 Choose Cartoon Avatar
          </button>
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

  openAvatarPickerModal() {
    this.closeSideDrawer();
    const store = window.store;
    const modal = document.getElementById('generic-modal-backdrop');
    const sheet = document.getElementById('generic-modal-sheet');
    const avatars = window.SMM_CARTOON_AVATARS || [];

    sheet.innerHTML = `
      <div class="modal-header">
        <div>
          <h3 class="modal-title">🎨 Choose Cartoon Avatar</h3>
          <p style="font-size: 12.5px; color: var(--text-secondary); margin-top: 2px;">Pick your custom 3D character profile</p>
        </div>
        <button class="modal-close" onclick="CustomerApp.closeModal()">&times;</button>
      </div>

      <div style="display: flex; flex-direction: column; align-items: center; text-align: center;">
        <div class="avatar-picker-grid">
          ${avatars.map(a => {
            const isSelected = store.data.customer.avatar === a.url;
            return `
              <div class="avatar-pick-card ${isSelected ? 'active' : ''}" onclick="CustomerApp.selectAvatar('${a.url}')">
                <img src="${a.url}" class="avatar-pick-img" alt="${a.name}" />
                <div class="avatar-pick-title">${a.name}</div>
                <span class="badge ${isSelected ? 'badge-primary' : 'badge-neutral'}" style="font-size: 10px; padding: 2px 6px;">${a.badge}</span>
                ${isSelected ? '<span class="avatar-active-badge">✓</span>' : ''}
              </div>
            `;
          }).join('')}
        </div>

        <button class="btn btn-primary btn-block btn-refraction" style="margin-top: 8px;" onclick="CustomerApp.closeModal()">
          ✓ Done (Save Avatar)
        </button>
      </div>
    `;

    modal.classList.add('active');
  },

  selectAvatar(url) {
    window.store.setCustomerAvatar(url);
    this.openAvatarPickerModal(); // refresh to show active selection checkmark
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
