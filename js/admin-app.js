async function sha256Hex(message) {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const AdminApp = {
  isAdminAuthenticated() {
    return sessionStorage.getItem('likex_super_admin_auth') === 'true';
  },

  logoutAdmin() {
    sessionStorage.removeItem('likex_super_admin_auth');
    sessionStorage.removeItem('likex_super_admin_user');
    window.store.showToast('Super Admin session locked.', 'info');
    window.navigateToRoute('/');
  },

  async handleAdminLogin(e) {
    e.preventDefault();
    const passwordInput = document.getElementById('admin-master-password');
    const password = passwordInput ? passwordInput.value : '';
    const errBox = document.getElementById('admin-auth-error');
    const submitBtn = document.getElementById('btn-admin-submit');

    if (!password) {
      if (errBox) {
        errBox.textContent = 'Please enter the Master Admin Password.';
        errBox.style.display = 'block';
      }
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Verifying with Supabase... ⏳</span>';
    if (errBox) errBox.style.display = 'none';

    try {
      if (!window.supabaseClient) {
        throw new Error('Supabase client connection error. Please refresh the page.');
      }

      const inputHash = await sha256Hex(password);

      // Verify directly against the Admin record in Supabase
      const { data, error } = await window.supabaseClient
        .from('users')
        .select('id, username, email, role, password_hash')
        .eq('role', 'admin')
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('No Admin account found in Supabase database.');
      }

      const adminRow = data[0];

      if (adminRow.password_hash !== inputHash) {
        throw new Error('Access Denied: Incorrect Master Admin Password.');
      }

      // Success! Unlocking Super Admin Console
      sessionStorage.setItem('likex_super_admin_auth', 'true');
      sessionStorage.setItem('likex_super_admin_user', adminRow.username || 'super_admin');
      window.store.showToast('Super Admin Console Unlocked! 🛡️', 'success');
      this.render(document.getElementById('screen-container'));
    } catch (err) {
      if (errBox) {
        errBox.textContent = err.message || 'Authentication failed. Access Denied.';
        errBox.style.display = 'block';
      }
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Unlock Admin Console 🔐</span>';
    }
  },

  openChangePasswordModal() {
    const modal = document.getElementById('generic-modal-backdrop');
    const sheet = document.getElementById('generic-modal-sheet');

    sheet.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">🔑 Change Master Admin Password</h3>
        <button class="modal-close" onclick="CustomerApp.closeModal()">&times;</button>
      </div>
      <div id="change-pass-error" style="display: none; background: var(--error-light); border: 1px solid var(--error); color: var(--error); padding: 10px 14px; border-radius: 10px; font-size: 13px; margin-bottom: 14px;"></div>
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label" style="font-weight: 700; font-size: 12.5px;">Current Master Password</label>
          <input type="password" class="form-input" id="curr-admin-pass" placeholder="Enter current password" style="height: 46px;" />
        </div>
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label" style="font-weight: 700; font-size: 12.5px;">New Master Password</label>
          <input type="password" class="form-input" id="new-admin-pass" placeholder="Enter new strong password" minlength="6" style="height: 46px;" />
        </div>
        <button class="btn btn-primary btn-block btn-lg" id="btn-save-admin-pass" onclick="AdminApp.saveNewAdminPassword()" style="margin-top: 6px;">
          Update Password in Supabase 💾
        </button>
      </div>
    `;
    modal.classList.add('active');
  },

  async saveNewAdminPassword() {
    const currPass = document.getElementById('curr-admin-pass')?.value;
    const newPass = document.getElementById('new-admin-pass')?.value;
    const errBox = document.getElementById('change-pass-error');
    const btn = document.getElementById('btn-save-admin-pass');

    if (!currPass || !newPass) {
      if (errBox) { errBox.textContent = 'Please fill in both password fields.'; errBox.style.display = 'block'; }
      return;
    }
    if (newPass.length < 6) {
      if (errBox) { errBox.textContent = 'New password must be at least 6 characters.'; errBox.style.display = 'block'; }
      return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span>Updating Supabase... ⏳</span>';

    try {
      const currHash = await sha256Hex(currPass);
      const newHash = await sha256Hex(newPass);

      const { data, error: selectErr } = await window.supabaseClient
        .from('users')
        .select('password_hash')
        .eq('role', 'admin')
        .limit(1);

      if (selectErr || !data || data.length === 0 || data[0].password_hash !== currHash) {
        throw new Error('Current master password is incorrect.');
      }

      const { error: updateErr } = await window.supabaseClient
        .from('users')
        .update({ password_hash: newHash })
        .eq('role', 'admin');

      if (updateErr) throw updateErr;

      CustomerApp.closeModal();
      window.store.showToast('Master Admin Password successfully updated in Supabase! 🔒', 'success');
    } catch (err) {
      if (errBox) {
        errBox.textContent = err.message || 'Failed to update password.';
        errBox.style.display = 'block';
      }
      btn.disabled = false;
      btn.innerHTML = '<span>Update Password in Supabase 💾</span>';
    }
  },

  renderAdminLogin(container) {
    container.innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg-body); padding: 24px 16px;">
        <div class="card" style="width: 100%; max-width: 420px; padding: 38px 28px; box-shadow: 0 20px 45px rgba(0,0,0,0.12); border: 1.5px solid var(--border-color); border-radius: var(--radius-xl);">
          <div style="text-align: center; margin-bottom: 26px;">
            <div style="width: 60px; height: 60px; margin: 0 auto 16px; background: linear-gradient(135deg, #4F46E5, #9333EA); border-radius: 18px; display: flex; align-items: center; justify-content: center; font-size: 30px; box-shadow: 0 8px 24px rgba(79, 70, 229, 0.35);">
              🛡️
            </div>
            <h2 style="font-size: 22px; font-weight: 900; color: var(--text-main); margin: 0;">
              LikeX Super Admin Console
            </h2>
            <p style="font-size: 13px; color: var(--text-secondary); margin-top: 6px;">
              Master Security Verification
            </p>
          </div>

          <div id="admin-auth-error" style="display: none; background: var(--error-light); border: 1px solid var(--error); color: var(--error); padding: 10px 14px; border-radius: 10px; font-size: 13px; margin-bottom: 16px;"></div>

          <form onsubmit="AdminApp.handleAdminLogin(event)" style="display: flex; flex-direction: column; gap: 16px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-size: 12.5px; font-weight: 700;">Master Admin Password</label>
              <input type="password" id="admin-master-password" class="form-input" placeholder="Enter Master Admin Password" required style="height: 48px; font-size: 15px;" autofocus />
            </div>

            <button type="submit" id="btn-admin-submit" class="btn btn-primary btn-block btn-lg" style="margin-top: 4px; height: 50px; font-weight: 800; font-size: 15px;">
              <span>Unlock Admin Console 🔐</span>
            </button>

            <button type="button" class="btn btn-outline btn-block btn-sm" onclick="window.navigateToRoute('/')" style="margin-top: 4px;">
              ← Return to Customer Storefront
            </button>

            <div style="font-size: 11.5px; color: var(--text-muted); text-align: center; margin-top: 8px; line-height: 1.5;">
              🔒 Encrypted via SHA-256 cryptographic verification against Supabase PostgreSQL database.
            </div>
          </form>
        </div>
      </div>
    `;
  },

  render(container) {
    if (!this.isAdminAuthenticated()) {
      this.renderAdminLogin(container);
      return;
    }

    const store = window.store;
    const tab = store.adminTab;
    const adminEmail = sessionStorage.getItem('likex_admin_email') || 'Super Admin';

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
              <span>WhatsApp Support</span>
            </li>
          </ul>

          <div class="admin-sidebar-footer" style="display: flex; flex-direction: column; gap: 8px;">
            <button class="btn btn-secondary btn-sm btn-block" onclick="window.navigateToRoute('/')">
              ← Customer View
            </button>
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
              <button class="btn btn-sm btn-secondary" onclick="window.navigateToRoute('/')">
                Exit to Storefront
              </button>
              <button class="btn btn-sm btn-outline" style="border-color: var(--primary); color: var(--primary);" onclick="AdminApp.openChangePasswordModal()" title="Change Master Admin Password">
                🔑 Password
              </button>
              <button class="btn btn-sm btn-outline" style="color: var(--error); border-color: var(--error);" onclick="AdminApp.logoutAdmin()" title="Lock Admin Console">
                🔒 Lock
              </button>
              <div class="admin-user-pill">
                <span class="admin-user-name">Super Admin 🛡️</span>
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
            <span class="badge badge-success">Active</span>
          </div>
          <div class="kpi-label">Total Customers</div>
          <div class="kpi-value">${stats.totalCustomers.toLocaleString()}</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-icon-box" style="background: var(--primary-light); color: var(--primary);">🛍️</div>
            <span class="badge badge-primary">Live</span>
          </div>
          <div class="kpi-label">Total Orders</div>
          <div class="kpi-value">${stats.totalOrders.toLocaleString()}</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-icon-box" style="background: var(--success-light); color: var(--success);">$</div>
            <span class="badge badge-success">Real-Time</span>
          </div>
          <div class="kpi-label">Revenue</div>
          <div class="kpi-value">${store.formatMoney(stats.revenue, 0)}</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-icon-box" style="background: var(--primary-light); color: var(--primary);">📈</div>
            <span class="badge badge-success">Active</span>
          </div>
          <div class="kpi-label">Profit Markup Setting</div>
          <div class="kpi-value">+${stats.globalMarkupPercent}%</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-top">
            <div class="kpi-icon-box" style="background: var(--warning-light); color: var(--warning);">🏛️</div>
            <span class="badge badge-success">${stats.providerBalanceStatus}</span>
          </div>
          <div class="kpi-label">JAP Wholesale Balance</div>
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
          <p style="font-size: 13.5px;">Manage and monitor your dual upstream SMM API connections (JAP + WorldOfSMM).</p>
        </div>
      </div>

      <div class="provider-cards-grid">
        ${providers.map(p => {
          const isZeroBalance = !p.balance || p.balance <= 0.001;
          const inrApprox = ((p.balance || 0) * 87).toFixed(0);

          return `
          <div class="provider-card status-active" style="${isZeroBalance ? 'border-color: rgba(245, 158, 11, 0.4);' : ''}">
            <div class="provider-card-header">
              <div class="provider-identity">
                <div class="provider-avatar-box">${p.id === 'p2' ? '🇮🇳' : '❖'}</div>
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
              <span class="badge badge-neutral">${p.lastSync || 'Live API'}</span>
            </div>

            <div class="provider-stats-row">
              <div class="provider-stat-col">
                <span class="provider-stat-label">Account Balance</span>
                <span class="provider-stat-val" style="color: ${isZeroBalance ? '#DC2626' : 'var(--success)'}; font-weight: 800;">
                  $${p.balance !== null ? p.balance.toFixed(2) : '0.00'} USD
                </span>
                <span style="font-size: 11px; color: var(--text-muted);">≈ ₹${inrApprox} INR</span>
              </div>
              <div class="provider-stat-col">
                <span class="provider-stat-label">Curated Services</span>
                <span class="provider-stat-val">${p.activeServices}</span>
                <span style="font-size: 11px; color: var(--text-muted);">${p.id === 'p2' ? 'Zero Duplicates (Indian)' : 'Global Wholesale'}</span>
              </div>
            </div>

            ${isZeroBalance ? `
              <div style="margin: 10px 0; padding: 8px 12px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; font-size: 12px; color: #B45309; display: flex; align-items: center; gap: 6px;">
                <span>⚠️</span>
                <span><strong>Zero Balance:</strong> Top up on ${p.name} ${p.id === 'p2' ? 'via UPI/Paytm' : 'via Crypto'} to fulfill live orders.</span>
              </div>
            ` : ''}

            <div class="provider-card-actions">
              <span style="font-size: 12px; color: var(--text-muted); font-family: var(--font-mono); overflow: hidden; text-overflow: ellipsis; max-width: 190px;">${p.apiUrl}</span>
              <button class="btn btn-sm btn-secondary" onclick="store.testProviderConnection('${p.id}')">
                Test Connection
              </button>
            </div>
          </div>
        `}).join('')}
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
              <th>Provider Origin</th>
              <th>Target URL</th>
              <th>Quantity</th>
              <th>Charge</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map(o => {
              const isWos = o.provider === 'worldofsmm' || (o.serviceId && String(o.serviceId).startsWith('wos-'));
              const isLow = o.isLowBalance || (o.status && o.status.includes('Low Provider Balance'));

              return `
              <tr>
                <td style="font-family: var(--font-mono); font-weight: 700;">#${o.id}</td>
                <td>
                  <strong>${o.serviceName}</strong>
                  ${o.comments ? `<div style="font-size: 11px; color: var(--primary); font-weight: 600;">💬 Custom Comments Included</div>` : ''}
                </td>
                <td>
                  ${isWos ? `
                    <span class="badge" style="background: rgba(37, 211, 102, 0.15); color: #075E54; font-weight: 800; border: 1px solid rgba(37, 211, 102, 0.3); display: inline-flex; align-items: center; gap: 4px;">
                      🇮🇳 WorldOfSMM
                    </span>
                  ` : `
                    <span class="badge" style="background: rgba(59, 130, 246, 0.15); color: #1D4ED8; font-weight: 800; border: 1px solid rgba(59, 130, 246, 0.3); display: inline-flex; align-items: center; gap: 4px;">
                      🌐 JAP
                    </span>
                  `}
                  <div style="font-size: 11px; font-family: var(--font-mono); color: var(--text-muted); margin-top: 3px;">
                    ${o.providerOrderId || 'Prov Order #'+o.id}
                  </div>
                </td>
                <td style="font-family: var(--font-mono); font-size: 11.5px; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  ${o.target}
                </td>
                <td>${Number(o.quantity).toLocaleString()}</td>
                <td><strong style="color: var(--primary);">${store.formatMoney(o.amount)}</strong></td>
                <td>
                  ${isLow ? `
                    <span class="badge" style="background: rgba(239, 68, 68, 0.15); color: #DC2626; border: 1px solid rgba(239, 68, 68, 0.3); font-weight: 800;">
                      ⚠️ Low Balance (Needs Fund)
                    </span>
                  ` : `
                    <span class="badge badge-primary">${o.status}</span>
                  `}
                </td>
              </tr>
            `}).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  renderAdminSupport(store) {
    return `
      <div style="display: flex; flex-direction: column; gap: 18px;">
        <div class="card" style="background: linear-gradient(135deg, rgba(37, 211, 102, 0.1), rgba(18, 140, 126, 0.15)); border: 1.5px solid #25D366; border-radius: var(--radius-xl); padding: 28px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
            <div>
              <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(37, 211, 102, 0.2); color: #075E54; font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 999px; margin-bottom: 8px;">
                <span>🟢</span> <span>WHATSAPP SUPPORT CENTER</span>
              </div>
              <h2 style="font-size: 22px; font-weight: 900; margin: 0; color: var(--text-main);">24/7 WhatsApp Customer Helpline</h2>
              <p style="font-size: 13.5px; color: var(--text-secondary); margin-top: 6px; line-height: 1.5;">
                Helpline: <strong>+91 9837371137</strong> • Zero server storage overhead, real-time messaging & instant screenshot verification.
              </p>
            </div>
            <a 
              href="https://wa.me/919837371137" 
              target="_blank" 
              rel="noopener noreferrer" 
              class="btn" 
              style="background: #25D366; color: #fff; font-weight: 800; font-size: 15px; padding: 12px 24px; border-radius: 9999px; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 6px 18px rgba(37, 211, 102, 0.4);"
            >
              <span>💬</span> <span>Open WhatsApp Web</span>
            </a>
          </div>
        </div>

        <div class="card" style="padding: 24px;">
          <h3 style="font-size: 16px; font-weight: 800; margin-bottom: 10px; color: var(--text-main);">Support Protocol</h3>
          <p style="font-size: 13.5px; color: var(--text-secondary); line-height: 1.6;">
            Customer inquiries regarding <strong>Order Refills</strong>, <strong>UPI Payment Manual Top-ups</strong>, and <strong>Service Inquiries</strong> are routed directly to your official WhatsApp number (<strong>+91 9837371137</strong>). Customers receive automatic pre-formatted templates with their Order IDs and Transaction IDs.
          </p>
        </div>
      </div>
    `;
  }
};

window.AdminApp = AdminApp;
