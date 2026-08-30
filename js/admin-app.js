const AdminApp = {
  render(container) {
    const store = window.store;
    const tab = store.adminTab;

    let contentHtml = '';
    if (tab === 'dashboard') contentHtml = this.renderDashboard(store);
    else if (tab === 'providers') contentHtml = this.renderProviders(store);
    else if (tab === 'sync_services') contentHtml = this.renderSyncServices(store);
    else if (tab === 'services') contentHtml = this.renderCustomerServices(store);
    else if (tab === 'refills') contentHtml = this.renderRefillsQueue(store);
    else if (tab === 'orders') contentHtml = this.renderAdminOrders(store);
    else if (tab === 'support') contentHtml = this.renderAdminSupport(store);

    container.innerHTML = `
      <div class="admin-shell">
        <!-- Sidebar Navigation -->
        <aside class="admin-sidebar">
          <div class="admin-brand">
            <div class="admin-brand-icon">🛡️</div>
            <div class="admin-brand-text">
              <h2>Admin Console</h2>
              <p>System Management</p>
            </div>
          </div>

          <ul class="admin-nav-list">
            <li class="admin-nav-item ${tab === 'dashboard' ? 'active' : ''}" onclick="store.setAdminTab('dashboard')">
              <span class="nav-icon">📊</span>
              <span>Dashboard</span>
            </li>
            <li class="admin-nav-item ${tab === 'orders' ? 'active' : ''}" onclick="store.setAdminTab('orders')">
              <span class="nav-icon">🛒</span>
              <span>Orders</span>
            </li>
            <li class="admin-nav-item ${tab === 'services' ? 'active' : ''}" onclick="store.setAdminTab('services')">
              <span class="nav-icon">📑</span>
              <span>Services & Profit %</span>
            </li>
            <li class="admin-nav-item ${tab === 'providers' ? 'active' : ''}" onclick="store.setAdminTab('providers')">
              <span class="nav-icon">❖</span>
              <span>Providers</span>
            </li>
            <li class="admin-nav-item ${tab === 'refills' ? 'active' : ''}" onclick="store.setAdminTab('refills')">
              <span class="nav-icon">🛡️</span>
              <span>Refills Queue</span>
            </li>
            <li class="admin-nav-item ${tab === 'support' ? 'active' : ''}" onclick="store.setAdminTab('support')">
              <span class="nav-icon">💬</span>
              <span>Support</span>
            </li>
          </ul>

          <div class="admin-sidebar-footer" style="display: flex; flex-direction: column; gap: 8px;">
            <a href="#customer" class="btn btn-secondary btn-sm btn-block" style="text-decoration: none;">
              ← Customer View
            </a>
            <span>v2.4.0 • System Management</span>
          </div>
        </aside>

        <!-- Main Content Pane -->
        <div class="admin-main">
          <header class="admin-header">
            <div style="display: flex; align-items: center; gap: 14px;">
              <h1 class="admin-header-title">${this.getTabTitle(tab)}</h1>
            </div>
            <div class="admin-header-actions">
              <button class="btn btn-sm btn-secondary" onclick="store.setCurrency(store.currency === 'USD' ? 'INR' : 'USD')">
                ${store.currency === 'USD' ? '💵 USD' : '₹ INR'}
              </button>
              <button class="header-icon-btn" onclick="store.setTheme(store.theme === 'light' ? 'dark' : 'light')" title="Toggle Theme">
                <span>${store.theme === 'light' ? '🌙' : '☀️'}</span>
              </button>
              <button class="header-icon-btn" onclick="store.showToast('Upstream JAP API responding normally', 'info')">
                <span>🔔</span>
              </button>
              <a href="#customer" class="btn btn-sm btn-secondary" style="text-decoration: none;">
                Exit to Storefront
              </a>
              <div class="admin-user-pill">
                <span class="admin-user-name">Vipul (Super Admin)</span>
              </div>
            </div>
          </header>

          <div class="admin-content">
            ${contentHtml}
          </div>
        </div>
      </div>
    `;
  },

  getTabTitle(tab) {
    if (tab === 'dashboard') return 'Dashboard';
    if (tab === 'providers') return 'Provider Management';
    if (tab === 'services') return 'Customer Services & Profit Markup';
    if (tab === 'refills') return 'Refill Requests Management';
    if (tab === 'orders') return 'All Orders Master Table';
    if (tab === 'support') return 'Support Ticket Queue';
    return 'Admin Console';
  },

  renderDashboard(store) {
    const stats = store.data.adminStats;

    return `
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-icon-box" style="background: var(--primary-light); color: var(--primary);">👥</div>
            <span class="badge badge-success">+14%</span>
          </div>
          <div class="kpi-label">Total Customers</div>
          <div class="kpi-value">${stats.totalCustomers.toLocaleString()}</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-icon-box" style="background: var(--primary-light); color: var(--primary);">🛍️</div>
            <span class="badge badge-success">+${stats.ordersTrend}%</span>
          </div>
          <div class="kpi-label">Total Orders</div>
          <div class="kpi-value">${stats.totalOrders.toLocaleString()}</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-icon-box" style="background: var(--success-light); color: var(--success);">$</div>
            <span class="badge badge-success">+${stats.revenueTrend}%</span>
          </div>
          <div class="kpi-label">Revenue</div>
          <div class="kpi-value">${store.formatMoney(stats.revenue, 0)}</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-icon-box" style="background: var(--primary-light); color: var(--primary);">📈</div>
            <span class="badge badge-success">+${stats.profitTrend}%</span>
          </div>
          <div class="kpi-label">Profit Markup Setting</div>
          <div class="kpi-value">+${stats.globalMarkupPercent}%</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-icon-box" style="background: var(--warning-light); color: var(--warning);">🏛️</div>
            <span class="badge badge-success">${stats.providerBalanceStatus}</span>
          </div>
          <div class="kpi-label">JAP Balance</div>
          <div class="kpi-value">$${stats.providerBalance.toFixed(2)} USD</div>
        </div>
      </div>
    `;
  },

  // CUSTOMER SERVICES & PROFIT % TOOL
  renderCustomerServices(store) {
    const services = store.data.customerServices;
    const currentMarkup = store.data.adminStats.globalMarkupPercent || 120;

    return `
      <!-- GLOBAL PROFIT PERCENTAGE TOOL -->
      <div class="card" style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(168, 85, 247, 0.08)); border: 2px solid var(--primary); display: flex; flex-direction: column; gap: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div>
            <h3 style="font-size: 18px; font-weight: 800; color: var(--primary);">⚡ Global Profit Percentage Tool</h3>
            <p style="font-size: 13px; color: var(--text-secondary); margin-top: 2px;">
              Automatically calculate customer selling prices from JustAnotherPanel wholesale costs:
              <strong>Selling Price = Provider Cost + Your Profit %</strong>
            </p>
          </div>
          <span class="badge badge-primary" style="font-size: 14px; padding: 6px 14px;">
            Current Active Markup: <strong>+${currentMarkup}%</strong>
          </span>
        </div>

        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <button class="btn btn-sm btn-secondary" onclick="store.applyGlobalMarkup(50)">+50% Profit</button>
          <button class="btn btn-sm btn-secondary" onclick="store.applyGlobalMarkup(100)">+100% Profit (2X)</button>
          <button class="btn btn-sm btn-secondary" onclick="store.applyGlobalMarkup(150)">+150% Profit (2.5X)</button>
          <button class="btn btn-sm btn-secondary" onclick="store.applyGlobalMarkup(200)">+200% Profit (3X)</button>
          
          <div style="display: flex; align-items: center; gap: 6px; margin-left: auto;">
            <input type="number" id="custom-markup-input" class="form-input" style="width: 100px; height: 36px; text-align: center;" placeholder="e.g. 120" value="${currentMarkup}" />
            <span style="font-weight: 700;">%</span>
            <button class="btn btn-sm btn-primary" onclick="AdminApp.handleCustomMarkup()">
              Apply Markup to All
            </button>
          </div>
        </div>
      </div>

      <!-- Services Table -->
      <div class="sync-table-container" style="margin-top: 20px;">
        <table class="sync-data-table">
          <thead>
            <tr>
              <th>Sub-Category & Package Name</th>
              <th>Platform</th>
              <th>JAP Wholesale Cost</th>
              <th>Customer Selling Price</th>
              <th>Profit Margin</th>
              <th>Refill Guarantee</th>
            </tr>
          </thead>
          <tbody>
            ${services.map(s => `
              <tr>
                <td>
                  <strong style="font-size: 14px;">${s.customerName}</strong>
                  <div style="font-size: 11.5px; color: var(--text-secondary); margin-top: 2px;">
                    Subcategory: <em>${s.subcategory}</em> • JAP #${s.japId || '10131'}
                  </div>
                </td>
                <td>
                  <span class="badge badge-neutral" style="text-transform: uppercase;">${s.platform}</span>
                </td>
                <td>
                  <strong style="color: var(--text-muted); font-size: 13.5px;">
                    ${store.formatMoney(s.wholesaleCost || 0.12)}
                  </strong>
                </td>
                <td>
                  <strong style="font-size: 15px; color: var(--primary);">
                    ${store.formatMoney(s.pricePer1k)} / 1K
                  </strong>
                </td>
                <td>
                  <span class="badge badge-success">+${s.markupPercent}% Profit</span>
                </td>
                <td>
                  <span class="badge ${s.refillSupported ? 'badge-primary' : 'badge-neutral'}">
                    ${s.refillSupported ? `🛡️ ${s.refillPeriod}` : 'No Refill'}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  handleCustomMarkup() {
    const input = document.getElementById('custom-markup-input');
    if (!input) return;
    const val = Number(input.value);
    if (!val || val <= 0) {
      window.store.showToast('Please enter a valid profit percentage', 'error');
      return;
    }
    window.store.applyGlobalMarkup(val);
  },

  renderProviders(store) {
    const providers = store.data.providers;

    return `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">Provider Management</h2>
          <p style="font-size: 13.5px;">Manage and monitor your external SMM API connections.</p>
        </div>
      </div>

      <div class="provider-cards-grid">
        ${providers.map(p => `
          <div class="provider-card status-active">
            <div class="provider-card-header">
              <div class="provider-identity">
                <div class="provider-avatar-box">❖</div>
                <div class="provider-title-box">
                  <h3>${p.displayName}</h3>
                  <div style="display: flex; align-items: center; gap: 6px; margin-top: 2px;">
                    <span class="badge-dot" style="background: var(--success);"></span>
                    <span style="font-size: 12px; font-weight: 600; color: var(--success);">
                      Active (Live Connected)
                    </span>
                  </div>
                </div>
              </div>
              <span class="badge badge-neutral">${p.lastSync}</span>
            </div>

            <div class="provider-stats-row">
              <div class="provider-stat-col">
                <span class="provider-stat-label">Account Balance</span>
                <span class="provider-stat-val">
                  $${p.balance !== null ? p.balance.toFixed(2) : '0.00'} USD
                </span>
              </div>
              <div class="provider-stat-col">
                <span class="provider-stat-label">Active Services</span>
                <span class="provider-stat-val">${p.activeServices}</span>
              </div>
            </div>

            <div class="provider-card-actions">
              <span style="font-size: 12px; color: var(--text-muted); font-family: var(--font-mono);">${p.apiUrl}</span>
              <button class="btn btn-sm btn-secondary" onclick="store.testProviderConnection('${p.id}')">
                Test Connection
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  renderRefillsQueue(store) {
    const queue = store.data.refillQueue;

    return `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">Refill Requests Queue</h2>
          <p style="font-size: 13.5px;">Monitor customer-initiated refills routed to JustAnotherPanel.</p>
        </div>
      </div>

      <div class="sync-table-container">
        <table class="sync-data-table">
          <thead>
            <tr>
              <th>Refill ID</th>
              <th>Order ID & Service</th>
              <th>Customer</th>
              <th>Start / Target</th>
              <th>Drop Count</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${queue.map(ref => `
              <tr>
                <td style="font-family: var(--font-mono); font-weight: 700;">#${ref.id}</td>
                <td>
                  <strong>Order #${ref.orderId}</strong>
                  <div style="font-size: 12px; color: var(--text-secondary);">${ref.serviceName}</div>
                </td>
                <td style="font-size: 12.5px;">${ref.customerName}</td>
                <td style="font-family: var(--font-mono); font-size: 12px;">
                  Start: ${ref.startCount} | Goal: ${ref.targetCount}
                </td>
                <td><strong style="color: var(--error);">${ref.dropCount} dropped</strong></td>
                <td><span class="badge badge-warning">${ref.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  renderAdminOrders(store) {
    const orders = store.data.orders;

    return `
      <div class="sync-table-container">
        <table class="sync-data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer Service</th>
              <th>Target URL</th>
              <th>Quantity</th>
              <th>Charge</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map(o => `
              <tr>
                <td style="font-family: var(--font-mono); font-weight: 700;">#${o.id}</td>
                <td>${o.serviceName}</td>
                <td style="font-family: var(--font-mono); font-size: 11.5px; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  ${o.target}
                </td>
                <td>${Number(o.quantity).toLocaleString()}</td>
                <td><strong style="color: var(--primary);">${store.formatMoney(o.amount)}</strong></td>
                <td><span class="badge badge-primary">${o.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  renderAdminSupport(store) {
    const tickets = store.data.supportTickets;

    return `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        ${tickets.length === 0 ? `
          <div class="card" style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
            No open support tickets. All customer queries resolved!
          </div>
        ` : tickets.map(t => `
          <div class="card" style="display: flex; justify-content: space-between; align-items: center; cursor: pointer;" onclick="CustomerApp.openTicketChat('${t.id}')">
            <div>
              <div style="font-size: 15px; font-weight: 700;">${t.subject}</div>
              <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                Ticket #${t.id} • Customer: ${store.data.customer.name || 'User'}
              </div>
            </div>
            <span class="badge badge-success">${t.status}</span>
          </div>
        `).join('')}
      </div>
    `;
  }
};

window.AdminApp = AdminApp;
