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
        <!-- Sidebar Navigation (Matching Screenshot 1) -->
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
              <span>Services (Customer)</span>
            </li>
            <li class="admin-nav-item ${tab === 'providers' ? 'active' : ''}" onclick="store.setAdminTab('providers')">
              <span class="nav-icon">❖</span>
              <span>Providers</span>
            </li>
            <li class="admin-nav-item ${tab === 'sync_services' ? 'active' : ''}" onclick="store.setAdminTab('sync_services')">
              <span class="nav-icon">🔄</span>
              <span>Provider Services</span>
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

          <div class="admin-sidebar-footer">
            <span>v2.4.0 • System Management</span>
          </div>
        </aside>

        <!-- Main Content Pane -->
        <div class="admin-main">
          <header class="admin-header">
            <h1 class="admin-header-title">${this.getTabTitle(tab)}</h1>
            <div class="admin-header-actions">
              <button class="header-icon-btn" onclick="store.showToast('All upstream provider APIs responding normally', 'info')">
                <span>🔔</span>
              </button>
              <button class="header-icon-btn" onclick="store.setAdminTab('support')">
                <span>✉️</span>
                <span class="notification-dot"></span>
              </button>
              <div class="admin-user-pill">
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" alt="Admin" />
                <span class="admin-user-name">James Miller (Super Admin)</span>
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
    if (tab === 'sync_services') return 'Sync Services (Raw Provider Catalog)';
    if (tab === 'services') return 'Customer-Facing Services';
    if (tab === 'refills') return 'Refill Requests Management';
    if (tab === 'orders') return 'All Orders Master Table';
    if (tab === 'support') return 'Support Ticket Queue';
    return 'Admin Console';
  },

  // 1. ADMIN DASHBOARD (Matches Screenshot 1)
  renderDashboard(store) {
    const stats = store.data.adminStats;
    const activities = store.data.recentActivity;

    return `
      <!-- KPI Stats Row (Screenshot 1) -->
      <div class="kpi-grid">
        <!-- Total Customers -->
        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-icon-box" style="background: var(--primary-light); color: var(--primary);">👥</div>
            <span class="badge badge-error">${stats.customersTrend}%</span>
          </div>
          <div class="kpi-label">Total Customers</div>
          <div class="kpi-value">${stats.totalCustomers.toLocaleString()}</div>
        </div>

        <!-- Total Orders -->
        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-icon-box" style="background: var(--primary-light); color: var(--primary);">🛍️</div>
            <span class="badge badge-success">+${stats.ordersTrend}%</span>
          </div>
          <div class="kpi-label">Total Orders</div>
          <div class="kpi-value">${stats.totalOrders.toLocaleString()}</div>
        </div>

        <!-- Revenue -->
        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-icon-box" style="background: var(--success-light); color: var(--success);">$</div>
            <span class="badge badge-success">+${stats.revenueTrend}%</span>
          </div>
          <div class="kpi-label">Revenue</div>
          <div class="kpi-value">${store.formatMoney(stats.revenue, 0)}</div>
        </div>

        <!-- Profit -->
        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-icon-box" style="background: var(--primary-light); color: var(--primary);">📈</div>
            <span class="badge badge-success">+${stats.profitTrend}%</span>
          </div>
          <div class="kpi-label">Profit</div>
          <div class="kpi-value">${store.formatMoney(stats.profit, 0)}</div>
        </div>

        <!-- Provider Balance -->
        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-icon-box" style="background: var(--warning-light); color: var(--warning);">🏛️</div>
            <span class="badge badge-warning">${stats.providerBalanceStatus}</span>
          </div>
          <div class="kpi-label">Provider Balance</div>
          <div class="kpi-value">${store.formatMoney(stats.providerBalance, 0)}</div>
        </div>
      </div>

      <!-- 2-Column Analytics & Activity (Screenshot 1) -->
      <div class="admin-analytics-grid">
        <!-- Order Volume 7 Days Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <div>
              <h3 style="font-size: 17px; font-weight: 800;">Order Volume (7 Days)</h3>
              <p style="font-size: 12.5px;">Aggregated order dispatch throughput</p>
            </div>
            <span style="font-size: 20px; cursor: pointer; color: var(--text-muted);">⋮</span>
          </div>

          <div class="chart-bars-container">
            <div class="chart-bar-col">
              <div class="chart-bar" style="height: 48%;"></div>
              <span class="chart-day-label">Mon</span>
            </div>
            <div class="chart-bar-col">
              <div class="chart-bar" style="height: 65%;"></div>
              <span class="chart-day-label">Tue</span>
            </div>
            <div class="chart-bar-col">
              <div class="chart-bar highlight" style="height: 90%;"></div>
              <span class="chart-day-label">Wed</span>
            </div>
            <div class="chart-bar-col">
              <div class="chart-bar" style="height: 52%;"></div>
              <span class="chart-day-label">Thu</span>
            </div>
            <div class="chart-bar-col">
              <div class="chart-bar" style="height: 75%;"></div>
              <span class="chart-day-label">Fri</span>
            </div>
            <div class="chart-bar-col">
              <div class="chart-bar highlight" style="height: 96%;"></div>
              <span class="chart-day-label">Sat</span>
            </div>
            <div class="chart-bar-col">
              <div class="chart-bar" style="height: 38%;"></div>
              <span class="chart-day-label">Sun</span>
            </div>
          </div>
        </div>

        <!-- Recent Activity Feed (Screenshot 1) -->
        <div class="activity-card">
          <div class="chart-header">
            <h3 style="font-size: 17px; font-weight: 800;">Recent Activity</h3>
            <a class="section-link" onclick="store.setAdminTab('orders')">View All</a>
          </div>

          <div class="activity-list">
            ${activities.map(act => `
              <div class="activity-item">
                <div class="activity-icon-badge" style="background: var(--bg-subtle);">
                  ${act.icon}
                </div>
                <div class="activity-details">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div class="activity-title">${act.title}</div>
                    ${act.amount ? `<strong style="font-size: 12.5px; color: var(--text-main);">${act.amount}</strong>` : ''}
                    ${act.badge ? `<span class="badge badge-warning" style="font-size: 10px;">${act.badge}</span>` : ''}
                  </div>
                  <div class="activity-sub">${act.sub}</div>
                </div>
                <div class="activity-time">${act.time}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  // 2. PROVIDER MANAGEMENT (Matches Screenshot 2)
  renderProviders(store) {
    const providers = store.data.providers;

    return `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">Provider Management</h2>
          <p style="font-size: 13.5px;">Manage and monitor your external SMM API connections.</p>
        </div>
        <button class="btn btn-primary" onclick="AdminApp.openAddProviderModal()">
          <span>＋ Add New Provider</span>
        </button>
      </div>

      <!-- Provider Grid Cards (Screenshot 2) -->
      <div class="provider-cards-grid">
        ${providers.map(p => `
          <div class="provider-card ${p.status === 'active' ? 'status-active' : 'status-error'}">
            <div class="provider-card-header">
              <div class="provider-identity">
                <div class="provider-avatar-box">❖</div>
                <div class="provider-title-box">
                  <h3>${p.displayName}</h3>
                  <div style="display: flex; align-items: center; gap: 6px; margin-top: 2px;">
                    <span class="badge-dot" style="background: ${p.status === 'active' ? 'var(--success)' : 'var(--error)'};"></span>
                    <span style="font-size: 12px; font-weight: 600; color: ${p.status === 'active' ? 'var(--success)' : 'var(--error)'};">
                      ${p.status === 'active' ? 'Active' : 'Sync Failed'}
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
                  ${p.balance !== null ? store.formatMoney(p.balance) : '— —'}
                </span>
              </div>
              <div class="provider-stat-col">
                <span class="provider-stat-label">Active Services</span>
                <span class="provider-stat-val">${p.activeServices}</span>
              </div>
            </div>

            <div class="provider-card-actions">
              <a class="section-link" onclick="AdminApp.openProviderConfig('${p.id}')">Configure &gt;</a>
              <button class="btn btn-sm btn-secondary" onclick="store.testProviderConnection('${p.id}')">
                ${p.status === 'active' ? 'Test Connection' : 'Reconnect'}
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  // 3. PROVIDER SERVICE SYNC (Matches Screenshot 3)
  renderSyncServices(store) {
    const rawServices = store.data.rawProviderServices;

    return `
      <!-- Breadcrumb (Screenshot 3) -->
      <div style="font-size: 12.5px; color: var(--text-secondary); display: flex; align-items: center; gap: 6px;">
        <span onclick="store.setAdminTab('providers')" style="cursor: pointer; text-decoration: underline;">Providers</span>
        <span>&gt;</span>
        <strong style="color: var(--primary);">API1_GlobalSMM</strong>
        <span>&gt;</span>
        <span>Service Sync</span>
      </div>

      <!-- Header Row (Screenshot 3) -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h2 style="font-size: 26px; font-weight: 800;">Sync Services</h2>
          <p style="font-size: 13.5px; max-width: 650px;">
            Review and import raw services from <strong>API1_GlobalSMM</strong>. Services marked with warnings may have structural changes or are currently unavailable upstream.
          </p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-secondary" onclick="store.showToast('Provider API catalog refreshed: 1,204 services fetched', 'success')">
            <span>🔄 Refresh API</span>
          </button>
          <button class="btn btn-primary" onclick="AdminApp.promptBulkImport()">
            <span>📥 Bulk Import</span>
          </button>
        </div>
      </div>

      <!-- Sync Table Container (Screenshot 3) -->
      <div class="sync-table-container">
        <!-- Filter Bar -->
        <div class="table-filter-bar">
          <div style="position: relative; flex: 1; max-width: 380px;">
            <input type="text" class="form-input" placeholder="Search raw service name or ID..." style="min-height: 40px; padding-left: 36px;" />
            <span style="position: absolute; left: 12px; top: 10px; color: var(--text-muted);">🔍</span>
          </div>

          <div class="table-filter-tabs">
            <span class="filter-tab-pill active">All Services <strong>1,204</strong></span>
            <span class="filter-tab-pill">New <strong>45</strong></span>
            <span class="filter-tab-pill" style="color: var(--warning);">Warnings <strong>12</strong></span>
            <button class="btn btn-sm btn-secondary">More Filters</button>
          </div>
        </div>

        <!-- Table Data (Screenshot 3) -->
        <table class="sync-data-table">
          <thead>
            <tr>
              <th style="width: 40px;"><input type="checkbox" /></th>
              <th>ID</th>
              <th>Raw Service Name & Category</th>
              <th>Provider Cost</th>
              <th>Min / Max</th>
              <th>Status / Action</th>
            </tr>
          </thead>
          <tbody>
            ${rawServices.map(raw => {
              let statusPill = '';
              if (raw.status === 'Ready to Import') {
                statusPill = `<button class="btn btn-sm btn-outline" onclick="AdminApp.openImportModal('${raw.id}')">Ready to Import</button>`;
              } else if (raw.status === 'Unavailable Upstream') {
                statusPill = `<span class="badge badge-error">⚠️ Unavailable Upstream</span>`;
              } else if (raw.status === 'Review Pricing') {
                statusPill = `<button class="btn btn-sm btn-outline" style="color: var(--warning); border-color: var(--warning);" onclick="AdminApp.openReviewPricingModal('${raw.id}')">⚠️ Review Pricing</button>`;
              } else if (raw.status === 'Synced') {
                statusPill = `<span class="badge badge-primary">Synced ↗</span>`;
              }

              return `
                <tr>
                  <td><input type="checkbox" /></td>
                  <td style="font-family: var(--font-mono); font-weight: 700; color: var(--text-muted);">#${raw.id}</td>
                  <td>
                    <div style="font-weight: 700; font-size: 14px;">${raw.rawName}</div>
                    <div style="display: flex; align-items: center; gap: 6px; margin-top: 4px;">
                      <span class="badge badge-neutral" style="font-size: 10px; text-transform: uppercase;">${raw.platform}</span>
                      <span style="font-size: 11.5px; color: var(--text-secondary);">${raw.category}</span>
                    </div>
                  </td>
                  <td>
                    ${raw.oldCost ? `
                      <span style="text-decoration: line-through; color: var(--text-muted); font-size: 12px;">$${raw.oldCost.toFixed(2)}</span>
                      <strong style="color: var(--warning); font-size: 14px;">$${raw.cost.toFixed(2)}</strong>
                      <div style="font-size: 10px; color: var(--warning); font-weight: 700;">↗ Cost Increased</div>
                    ` : `
                      <strong style="font-size: 14.5px;">${store.formatMoney(raw.cost)}</strong>
                    `}
                  </td>
                  <td style="font-family: var(--font-mono); font-size: 12.5px;">
                    ${raw.min.toLocaleString()} / ${raw.max.toLocaleString()}
                  </td>
                  <td>
                    ${statusPill}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <!-- Table Footer Pagination -->
        <div style="padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; background: var(--bg-subtle); font-size: 12.5px; color: var(--text-secondary);">
          <span>Showing 1-6 of 1,204 services</span>
          <div style="display: flex; gap: 4px;">
            <button class="btn btn-sm btn-secondary" style="min-width: 32px;">&lt;</button>
            <button class="btn btn-sm btn-primary" style="min-width: 32px;">1</button>
            <button class="btn btn-sm btn-secondary" style="min-width: 32px;">2</button>
            <button class="btn btn-sm btn-secondary" style="min-width: 32px;">3</button>
            <button class="btn btn-sm btn-secondary" style="min-width: 32px;">&gt;</button>
          </div>
        </div>
      </div>
    `;
  },

  // 4. CUSTOMER SERVICES & MULTI-PROVIDER MAPPING (Core Distinction Requirement)
  renderCustomerServices(store) {
    const services = store.data.customerServices;

    return `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">Customer-Facing Services</h2>
          <p style="font-size: 13.5px;">
            Services visible on the customer storefront. Raw provider services are imported and mapped with custom selling prices and refill policies.
          </p>
        </div>
        <button class="btn btn-primary" onclick="store.setAdminTab('sync_services')">
          <span>＋ Import From Provider</span>
        </button>
      </div>

      <div class="sync-table-container">
        <table class="sync-data-table">
          <thead>
            <tr>
              <th>Customer Service Name</th>
              <th>Category</th>
              <th>Selling Price</th>
              <th>Active Provider & Cost</th>
              <th>Markup Margin</th>
              <th>Refill Policy</th>
              <th>Provider Mappings</th>
            </tr>
          </thead>
          <tbody>
            ${services.map(service => {
              const activeMapping = service.providerMappings.find(m => m.isPrimary) || service.providerMappings[0];
              const markup = Math.round(((service.pricePer1k - activeMapping.providerCost) / activeMapping.providerCost) * 100);

              return `
                <tr>
                  <td>
                    <strong style="font-size: 14px;">${service.customerName}</strong>
                    <div style="font-size: 11.5px; color: var(--text-secondary); margin-top: 2px;">
                      Speed: ${service.deliverySpeed} • Start: ${service.startTime}
                    </div>
                  </td>
                  <td>
                    <span class="badge badge-neutral">${service.category}</span>
                  </td>
                  <td>
                    <strong style="font-size: 15px; color: var(--primary);">${store.formatMoney(service.pricePer1k)}/1K</strong>
                  </td>
                  <td>
                    <div style="font-weight: 700;">${activeMapping.providerName}</div>
                    <div style="font-size: 11.5px; color: var(--text-secondary);">Cost: ${store.formatMoney(activeMapping.providerCost)}/1K</div>
                  </td>
                  <td>
                    <span class="badge badge-success">+${markup}% Profit</span>
                  </td>
                  <td>
                    <span class="badge ${service.refillSupported ? 'badge-primary' : 'badge-neutral'}">
                      ${service.refillSupported ? `🛡️ ${service.refillPeriod}` : 'No Refill'}
                    </span>
                  </td>
                  <td>
                    <button class="btn btn-sm btn-secondary" onclick="AdminApp.openMultiProviderMappingDrawer('${service.id}')">
                      <span>❖ ${service.providerMappings.length} Providers</span>
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  // Multi-Provider Mapping Drawer (Requirement 6)
  openMultiProviderMappingDrawer(serviceId) {
    const store = window.store;
    const service = store.data.customerServices.find(s => s.id === serviceId);
    if (!service) return;

    const modal = document.getElementById('generic-modal-backdrop');
    const sheet = document.getElementById('generic-modal-sheet');

    sheet.innerHTML = `
      <div class="modal-header">
        <div>
          <h3 class="modal-title">Multi-Provider Mappings</h3>
          <div style="font-size: 12.5px; color: var(--text-secondary);">${service.customerName}</div>
        </div>
        <button class="modal-close" onclick="CustomerApp.closeModal()">&times;</button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div style="background: var(--bg-subtle); padding: 14px; border-radius: var(--radius-md); font-size: 13px;">
          <div style="display: flex; justify-content: space-between;">
            <span>Customer Selling Price:</span>
            <strong style="color: var(--primary); font-size: 15px;">${store.formatMoney(service.pricePer1k)} / 1K</strong>
          </div>
          <p style="font-size: 11.5px; color: var(--text-secondary); margin-top: 4px;">
            One customer service can connect to multiple upstream providers for instant failover or pricing optimization.
          </p>
        </div>

        <div class="mapping-providers-list">
          ${service.providerMappings.map(mapping => `
            <div class="mapping-provider-card ${mapping.isPrimary ? 'active-mapping' : ''}">
              <div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <strong style="font-size: 14px;">${mapping.providerName}</strong>
                  ${mapping.isPrimary ? '<span class="badge badge-success">Active Provider</span>' : `<span class="badge badge-neutral">${mapping.status}</span>`}
                </div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                  Provider Service ID: #${mapping.serviceId} • Cost: <strong>${store.formatMoney(mapping.providerCost)}/1K</strong>
                  • Margin: <span style="color: var(--success); font-weight: 700;">+${mapping.markupPercent}%</span>
                </div>
              </div>

              <div>
                ${mapping.isPrimary ? `
                  <button class="btn btn-sm btn-success" disabled>✓ Active</button>
                ` : `
                  <button class="btn btn-sm btn-outline" onclick="AdminApp.handleSwitchProvider('${service.id}', '${mapping.providerId}')">
                    Set Active
                  </button>
                `}
              </div>
            </div>
          `).join('')}
        </div>

        <div style="border-top: 1px dashed var(--border-color); padding-top: 12px;">
          <button class="btn btn-secondary btn-block" onclick="store.showToast('Provider failover engine configuration saved', 'info'); CustomerApp.closeModal();">
            Save Provider Failover Rules
          </button>
        </div>
      </div>
    `;

    modal.classList.add('active');
  },

  handleSwitchProvider(serviceId, providerId) {
    window.store.switchPrimaryProvider(serviceId, providerId);
    this.openMultiProviderMappingDrawer(serviceId); // re-render drawer
  },

  // 5. REFILLS QUEUE (Requirement 7)
  renderRefillsQueue(store) {
    const queue = store.data.refillQueue;

    return `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">Refill Requests Queue</h2>
          <p style="font-size: 13.5px;">Monitor and manage customer-initiated refills sent to upstream providers.</p>
        </div>
        <span class="badge badge-warning" style="font-size: 13px; padding: 6px 14px;">
          ${queue.filter(r => r.status === 'Pending').length} Pending Requests
        </span>
      </div>

      <div class="sync-table-container">
        <table class="sync-data-table">
          <thead>
            <tr>
              <th>Refill ID</th>
              <th>Order ID & Service</th>
              <th>Customer</th>
              <th>Start / Current / Target</th>
              <th>Drop Count</th>
              <th>Provider</th>
              <th>Status</th>
              <th>Admin Action</th>
            </tr>
          </thead>
          <tbody>
            ${queue.length === 0 ? `
              <tr><td colspan="8" style="text-align: center; padding: 30px; color: var(--text-muted);">No refill requests in queue</td></tr>
            ` : queue.map(ref => `
              <tr>
                <td style="font-family: var(--font-mono); font-weight: 700;">#${ref.id}</td>
                <td>
                  <strong>Order #${ref.orderId}</strong>
                  <div style="font-size: 12px; color: var(--text-secondary);">${ref.serviceName}</div>
                </td>
                <td style="font-size: 12.5px;">${ref.customerName}</td>
                <td style="font-family: var(--font-mono); font-size: 12px;">
                  Start: ${ref.startCount} | Curr: ${ref.currentCount} | Goal: ${ref.targetCount}
                </td>
                <td>
                  <strong style="color: var(--error);">${ref.dropCount} dropped</strong>
                </td>
                <td>${ref.provider}</td>
                <td>
                  <span class="badge ${ref.status === 'Completed' ? 'badge-success' : 'badge-warning'}">
                    ${ref.status}
                  </span>
                </td>
                <td>
                  ${ref.status === 'Pending' ? `
                    <div style="display: flex; gap: 6px;">
                      <button class="btn btn-sm btn-primary" onclick="store.showToast('Pushed refill #${ref.id} to ${ref.provider} API', 'success')">
                        Push Upstream
                      </button>
                      <button class="btn btn-sm btn-secondary" onclick="store.showToast('Refill #${ref.id} marked verified', 'info')">
                        Complete
                      </button>
                    </div>
                  ` : `
                    <span style="font-size: 12px; color: var(--text-muted);">Processed</span>
                  `}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  // 6. ADMIN ORDERS MASTER TABLE
  renderAdminOrders(store) {
    const orders = store.data.orders;

    return `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">Order Management</h2>
          <p style="font-size: 13.5px;">Admin view of customer orders with upstream provider tracking.</p>
        </div>
      </div>

      <div class="sync-table-container">
        <table class="sync-data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer Service</th>
              <th>Target URL</th>
              <th>Quantity</th>
              <th>Selling Price</th>
              <th>Provider Assigned</th>
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
                <td>${o.quantity.toLocaleString()}</td>
                <td><strong style="color: var(--primary);">${store.formatMoney(o.amount)}</strong></td>
                <td>
                  <span class="badge badge-neutral">API1_GlobalSMM (#4092)</span>
                </td>
                <td>
                  <span class="badge badge-primary">${o.status}</span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  // 7. ADMIN SUPPORT DESK
  renderAdminSupport(store) {
    const tickets = store.data.supportTickets;

    return `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">Support Desk Management</h2>
          <p style="font-size: 13.5px;">Customer tickets and conversation threads.</p>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 12px;">
        ${tickets.map(t => `
          <div class="card" style="display: flex; justify-content: space-between; align-items: center; cursor: pointer;" onclick="CustomerApp.openTicketChat('${t.id}')">
            <div>
              <div style="font-size: 15px; font-weight: 700;">${t.subject}</div>
              <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                Ticket #${t.id} • Customer: Alex Vance • ${t.linkedOrderId ? `Linked Order #${t.linkedOrderId}` : ''}
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span class="badge ${t.status === 'Answered' ? 'badge-success' : 'badge-warning'}">${t.status}</span>
              <button class="btn btn-sm btn-secondary">Open Chat Thread</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  // Import Service Modal (Step 4 & 5 Requirement)
  openImportModal(rawId) {
    const store = window.store;
    const raw = store.data.rawProviderServices.find(s => s.id === rawId);
    if (!raw) return;

    const modal = document.getElementById('generic-modal-backdrop');
    const sheet = document.getElementById('generic-modal-sheet');

    // Default markup: 100%
    const defaultSellingPrice = (raw.cost * 2.0).toFixed(2);

    sheet.innerHTML = `
      <div class="modal-header">
        <div>
          <h3 class="modal-title">Import Raw Service to Storefront</h3>
          <div style="font-size: 12px; color: var(--text-secondary);">Provider: ${raw.providerName} (ID: #${raw.id})</div>
        </div>
        <button class="modal-close" onclick="CustomerApp.closeModal()">&times;</button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 14px;">
        <div style="background: var(--bg-subtle); padding: 12px; border-radius: var(--radius-md); font-size: 12.5px;">
          <div>Raw Upstream Service: <strong>${raw.rawName}</strong></div>
          <div style="margin-top: 4px;">Provider Wholesale Cost: <strong style="color: var(--text-main);">${store.formatMoney(raw.cost)} / 1K</strong></div>
        </div>

        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Customer-Facing Service Title</label>
          <input type="text" class="form-input" id="import-customer-title" value="${raw.rawName.replace('[HQ] - Fast', '[Real & Active HQ]')}" />
        </div>

        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Storefront Category</label>
          <select class="form-select" id="import-customer-category">
            <option value="Instagram" ${raw.platform === 'instagram' ? 'selected' : ''}>Instagram</option>
            <option value="YouTube" ${raw.platform === 'youtube' ? 'selected' : ''}>YouTube</option>
            <option value="TikTok" ${raw.platform === 'tiktok' ? 'selected' : ''}>TikTok</option>
            <option value="Twitter" ${raw.platform === 'twitter' ? 'selected' : ''}>Twitter / X</option>
            <option value="Facebook" ${raw.platform === 'facebook' ? 'selected' : ''}>Facebook</option>
          </select>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Customer Selling Price ($)</label>
            <input type="number" step="0.05" class="form-input" id="import-selling-price" value="${defaultSellingPrice}" />
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Calculated Profit Markup</label>
            <input type="text" class="form-input" id="import-markup-label" value="+100%" disabled style="background: var(--bg-subtle);" />
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Refill Guarantee Period</label>
          <select class="form-select" id="import-refill-period">
            <option value="30 Days">30 Days Auto-Refill Guarantee</option>
            <option value="60 Days">60 Days Auto-Refill Guarantee</option>
            <option value="15 Days">15 Days Auto-Refill Guarantee</option>
            <option value="None">No Refill (Drop Warning)</option>
          </select>
        </div>

        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Customer Description & Instructions</label>
          <textarea class="form-textarea" id="import-description" rows="3">High retention delivery from verified worldwide accounts. Drop protected with refill guarantee.</textarea>
        </div>

        <button class="btn btn-primary btn-block" onclick="AdminApp.handleConfirmImport('${raw.id}')">
          Import & Publish Customer Service
        </button>
      </div>
    `;

    // Dynamic markup calculation
    const priceInput = document.getElementById('import-selling-price');
    const markupLabel = document.getElementById('import-markup-label');
    priceInput.addEventListener('input', () => {
      const sp = Number(priceInput.value) || 0;
      const mk = Math.round(((sp - raw.cost) / raw.cost) * 100);
      markupLabel.value = `+${mk}% Margin`;
    });

    modal.classList.add('active');
  },

  handleConfirmImport(rawId) {
    const customerName = document.getElementById('import-customer-title').value;
    const category = document.getElementById('import-customer-category').value;
    const sellingPrice = Number(document.getElementById('import-selling-price').value);
    const refillPeriod = document.getElementById('import-refill-period').value;
    const description = document.getElementById('import-description').value;

    window.store.importService({
      rawServiceId: rawId,
      customerName,
      category,
      sellingPrice,
      refillPeriod,
      description
    });

    CustomerApp.closeModal();
  },

  openProviderConfig(providerId) {
    const p = window.store.data.providers.find(prov => prov.id === providerId);
    if (!p) return;

    const modal = document.getElementById('generic-modal-backdrop');
    const sheet = document.getElementById('generic-modal-sheet');

    sheet.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">Configure ${p.displayName}</h3>
        <button class="modal-close" onclick="CustomerApp.closeModal()">&times;</button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 14px;">
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">API Endpoint URL</label>
          <input type="text" class="form-input" value="${p.apiUrl}" />
        </div>

        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">API Key (Masked for Security)</label>
          <input type="password" class="form-input" value="${p.apiKeyMasked}" />
        </div>

        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Auto-Sync Catalog Interval</label>
          <select class="form-select">
            <option>Every 15 minutes</option>
            <option>Every 1 hour</option>
            <option>Every 6 hours</option>
            <option>Manual Sync Only</option>
          </select>
        </div>

        <button class="btn btn-primary btn-block" onclick="window.store.showToast('Provider API configuration saved', 'success'); CustomerApp.closeModal();">
          Save Configuration
        </button>
      </div>
    `;

    modal.classList.add('active');
  },

  openAddProviderModal() {
    const modal = document.getElementById('generic-modal-backdrop');
    const sheet = document.getElementById('generic-modal-sheet');

    sheet.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">Connect New SMM Provider API</h3>
        <button class="modal-close" onclick="CustomerApp.closeModal()">&times;</button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 14px;">
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Provider Name / Alias</label>
          <input type="text" class="form-input" placeholder="e.g. SMM_Kings_Wholesale" />
        </div>

        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">API V2 Base URL</label>
          <input type="text" class="form-input" placeholder="https://api.smmkings.com/api/v2" />
        </div>

        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Secret API Key</label>
          <input type="password" class="form-input" placeholder="Paste your API key here..." />
        </div>

        <button class="btn btn-primary btn-block" onclick="window.store.showToast('Provider added! Verifying API ping & fetching services...', 'success'); CustomerApp.closeModal();">
          Connect & Sync Services
        </button>
      </div>
    `;

    modal.classList.add('active');
  },

  promptBulkImport() {
    window.store.showToast('Bulk import modal ready — select markup preset and import all new services in 1 click.', 'info');
  },

  openReviewPricingModal(rawId) {
    const raw = window.store.data.rawProviderServices.find(s => s.id === rawId);
    if (!raw) return;

    alert(`Upstream Price Increase Alert for #${raw.id} (${raw.rawName})\n\nOld Provider Cost: $${raw.oldCost.toFixed(2)}\nNew Provider Cost: $${raw.cost.toFixed(2)}\n\nRecommended Action: Adjust customer selling price to maintain profit margin.`);
  }
};

window.AdminApp = AdminApp;
