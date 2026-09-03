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
    else if (tab === 'alerts') contentHtml = this.renderAlertsManager(store);
    else if (tab === 'providers') contentHtml = this.renderProviders(store);
    else if (tab === 'provider_services') contentHtml = this.renderProviderServicesManager(store);
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
            <li class="admin-nav-item ${tab === 'alerts' ? 'active' : ''}" onclick="store.setAdminTab('alerts')">
              <span class="nav-icon">🔔</span>
              <span>Low Balance & Alerts</span>
            </li>
            <li class="admin-nav-item ${tab === 'orders' ? 'active' : ''}" onclick="store.setAdminTab('orders')">
              <span class="nav-icon">🛒</span>
              <span>Orders</span>
            </li>
            <li class="admin-nav-item ${tab === 'provider_services' ? 'active' : ''}" onclick="store.setAdminTab('provider_services')">
              <span class="nav-icon">⚡</span>
              <span>Provider Services</span>
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
    if (tab === 'alerts') return 'Low Balance Alerts & Multi-Channel Gateway';
    if (tab === 'providers') return 'Provider Management';
    if (tab === 'provider_services') return 'Provider Services & Live Catalog Importer';
    if (tab === 'services') return 'Customer Services & Profit Markup';
    if (tab === 'refills') return 'Refill Requests Management';
    if (tab === 'orders') return 'All Orders Master Table';
    if (tab === 'support') return 'Support Ticket Queue';
    return 'Admin Console';
  },

  // DEDICATED LOW BALANCE & QUEUED ORDER ALERTS MANAGER TAB
  renderAlertsManager(store) {
    const allOrders = (store.getAllAdminOrders ? store.getAllAdminOrders() : store.data.orders) || [];
    const queuedOrders = allOrders.filter(o => o && (o.isQueued || o.needsTopup));
    const alertConfig = store.getAlertConfig();
    const japProv = (store.data.providers || []).find(p => p.id === 'p1');
    const wosProv = (store.data.providers || []).find(p => p.id === 'p2');
    const japBal = Number(japProv?.balance || 0);
    const wosBal = Number(wosProv?.balance || 0);

    return `
      <div style="display: flex; flex-direction: column; gap: 24px; max-width: 1000px;">
        
        <!-- Live Alert Status Header Card -->
        <div class="card" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(99, 102, 241, 0.08)); border: 2px solid #10B981; padding: 24px; border-radius: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
            <div>
              <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(16, 185, 129, 0.15); color: #047857; font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 999px; text-transform: uppercase;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: #10B981; display: inline-block;"></span>
                <span>Active Notification System</span>
              </div>
              <h2 style="font-size: 24px; font-weight: 900; color: var(--text-main); margin-top: 8px; margin-bottom: 4px;">
                Low Balance & Queued Order Alert Gateway
              </h2>
              <p style="font-size: 14px; color: var(--text-secondary); margin: 0;">
                Whenever JAP or WorldOfSMM balance drops below ₹${alertConfig.threshold || 100}, or a customer places an order requiring top-up, you receive instant alerts on WhatsApp & Gmail.
              </p>
            </div>

            <button class="btn" style="background: #10B981; color: white; font-weight: 800; font-size: 14px; padding: 12px 24px; border-radius: 999px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);" onclick="store.sendTestAlert()">
              🧪 Send Live Test Alert Now
            </button>
          </div>
        </div>

        <!-- Live Provider Balances Overview -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
          <div class="card" style="padding: 20px; border: 1.5px solid var(--border-color); border-radius: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <span style="font-weight: 800; font-size: 15px; color: var(--text-main);">🏛️ JustAnotherPanel (JAP)</span>
              <span class="badge ${japBal > 1.2 ? 'badge-success' : 'badge-danger'}">
                ${japBal > 1.2 ? '✓ Funded' : '⚠️ Low Balance'}
              </span>
            </div>
            <div style="font-size: 28px; font-weight: 900; color: var(--primary); font-family: monospace;">
              $${japBal.toFixed(2)} USD
            </div>
            <div style="font-size: 12.5px; color: var(--text-secondary); margin-top: 4px;">
              Approx: <strong>₹${(japBal * 85).toFixed(2)} INR</strong> • Threshold: ₹${alertConfig.threshold || 100}
            </div>
          </div>

          <div class="card" style="padding: 20px; border: 1.5px solid var(--border-color); border-radius: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <span style="font-weight: 800; font-size: 15px; color: var(--text-main);">🇮🇳 WorldOfSMM (India)</span>
              <span class="badge ${wosBal > Number(alertConfig.threshold || 100) ? 'badge-success' : 'badge-danger'}">
                ${wosBal > Number(alertConfig.threshold || 100) ? '✓ Funded' : '⚠️ Low Balance'}
              </span>
            </div>
            <div style="font-size: 28px; font-weight: 900; color: #10B981; font-family: monospace;">
              ₹${wosBal.toFixed(2)} INR
            </div>
            <div style="font-size: 12.5px; color: var(--text-secondary); margin-top: 4px;">
              Direct Indian Gateway • Threshold: ₹${alertConfig.threshold || 100}
            </div>
          </div>
        </div>

        <!-- Alert Notification Settings Form -->
        <div class="card" style="padding: 24px; border: 1px solid var(--border-color); border-radius: 18px;">
          <h3 style="font-size: 18px; font-weight: 800; margin-bottom: 16px; color: var(--text-main);">
            ⚙️ Alert Channels & Threshold Configuration
          </h3>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 18px;">
            <div>
              <label style="font-size: 13px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 6px;">
                📱 WhatsApp Alert Phone Number:
              </label>
              <input type="text" id="admin-alert-whatsapp" class="form-input" value="${alertConfig.whatsappNumber || '7055515757'}" placeholder="e.g. 7055515757" style="font-weight: 700; font-size: 15px;" />
              <p style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                Direct alerts for <strong>7055515757</strong>.
              </p>
            </div>

            <div>
              <label style="font-size: 13px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 6px;">
                📧 Gmail Alert Email:
              </label>
              <input type="email" id="admin-alert-email" class="form-input" value="${alertConfig.adminEmail || 'viplavkumar50@gmail.com'}" placeholder="e.g. viplavkumar50@gmail.com" style="font-weight: 700; font-size: 15px;" />
              <p style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                Instant push email delivered to <strong>viplavkumar50@gmail.com</strong>.
              </p>
            </div>

            <div>
              <label style="font-size: 13px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 6px;">
                📉 Warning Threshold Amount (₹ INR):
              </label>
              <input type="number" id="admin-alert-threshold" class="form-input" value="${alertConfig.threshold || 100}" placeholder="100" style="font-weight: 700; font-size: 15px;" />
              <p style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                Triggers when provider balance drops below this amount.
              </p>
            </div>

            <div>
              <label style="font-size: 13px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 6px;">
                🔑 WhatsApp Gateway API Key:
              </label>
              <input type="text" id="admin-alert-apikey" class="form-input" value="${alertConfig.callmebotApiKey || ''}" placeholder="e.g. 123456" style="font-weight: 700; font-size: 15px;" />
              <div style="font-size: 11.5px; color: var(--text-secondary); margin-top: 5px; line-height: 1.4;">
                👉 <a href="https://wa.me/34941860826?text=I%20allow%20callmebot%20to%20send%20me%20messages" target="_blank" style="color: #10B981; font-weight: 800; text-decoration: underline;">Click here to get Free WhatsApp Key in 5 secs</a> (Send <em>"I allow callmebot to send me messages"</em> to bot & paste key).
              </div>
            </div>
          </div>

          <div style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px;">
            <button class="btn btn-primary" onclick="AdminApp.saveAlertSettings()" style="font-weight: 800; padding: 10px 26px; border-radius: 12px;">
              💾 Save Alert Settings
            </button>
          </div>
        </div>

        <!-- Queued Orders Awaiting Top-Up Table -->
        <div class="card" style="padding: 24px; border: 1px solid var(--border-color); border-radius: 18px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
            <div>
              <h3 style="font-size: 18px; font-weight: 800; color: var(--text-main); margin: 0;">
                ⏳ Orders Queued for Dispatch (${queuedOrders.length})
              </h3>
              <p style="font-size: 13px; color: var(--text-secondary); margin: 4px 0 0;">
                Customer payment is received in LikeX wallet. Once you top-up provider funds, click "1-Click Dispatch".
              </p>
            </div>

            ${queuedOrders.length > 0 ? `
              <button class="btn btn-sm" style="background: #10B981; color: white; font-weight: 800; border-radius: 999px; padding: 8px 18px;" onclick="AdminApp.dispatchAllQueuedOrders()">
                ⚡ Dispatch All Queued (${queuedOrders.length})
              </button>
            ` : ''}
          </div>

          ${queuedOrders.length === 0 ? `
            <div style="text-align: center; padding: 36px 20px; color: var(--text-muted);">
              <div style="font-size: 36px; margin-bottom: 8px;">✨</div>
              <strong>Zero Queued Orders</strong>
              <p style="font-size: 13px; margin-top: 4px;">All customer orders have been successfully dispatched to upstream provider servers.</p>
            </div>
          ` : `
            <div style="overflow-x: auto;">
              <table class="sync-data-table" style="font-size: 13px;">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Target Provider</th>
                    <th>Service Name</th>
                    <th>Target Link</th>
                    <th>Quantity</th>
                    <th>Customer Paid</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${queuedOrders.map(qo => `
                    <tr>
                      <td style="font-family: var(--font-mono); font-weight: 800; color: #6C5CE7;">#${qo.id}</td>
                      <td>
                        <span class="badge" style="background: rgba(239, 68, 68, 0.12); color: #DC2626; font-weight: 800; padding: 3px 8px; border-radius: 6px;">
                          ${qo.providerDisplayName || qo.provider}
                        </span>
                      </td>
                      <td><strong>${qo.serviceName}</strong></td>
                      <td><a href="${qo.target}" target="_blank" style="color: #0284c7;">${qo.target}</a></td>
                      <td>${Number(qo.quantity).toLocaleString()}</td>
                      <td><strong style="color: #10B981;">${store.formatMoney(qo.amount)}</strong></td>
                      <td>
                        <button class="btn btn-sm btn-primary" style="font-size: 12px; padding: 5px 12px; font-weight: 800; border-radius: 6px;" onclick="store.dispatchQueuedOrder('${qo.id}')">
                          ⚡ 1-Click Dispatch
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>

      </div>
    `;
  },

  renderDashboard(store) {
    const stats = store.recalculateAdminStats ? store.recalculateAdminStats() : store.data.adminStats;
    if (store.syncSupabaseDataForAdmin) {
      store.syncSupabaseDataForAdmin();
    }
    const allOrders = (store.getAllAdminOrders ? store.getAllAdminOrders() : store.data.orders) || [];
    const recentOrders = allOrders.slice(0, 5);
    const queuedOrders = allOrders.filter(o => o && (o.isQueued || o.needsTopup));
    const alertConfig = store.getAlertConfig();

    return `
      ${queuedOrders.length > 0 ? `
        <!-- HIGH-PRIORITY QUEUED ORDERS WAITING FOR PROVIDER TOP-UP -->
        <div class="card" style="margin-bottom: 24px; padding: 22px; border: 2px solid #EF4444; background: linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(245, 158, 11, 0.08)); border-radius: 18px; box-shadow: 0 8px 24px rgba(239, 68, 68, 0.12);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 26px;">🚨</span>
              <div>
                <h3 style="font-size: 19px; font-weight: 800; color: #DC2626; margin: 0;">
                  ${queuedOrders.length} Order(s) Queued — Waiting for Provider Top-Up
                </h3>
                <p style="font-size: 13px; color: #B45309; margin: 4px 0 0;">
                  Customer has paid on LikeX. Recharge the target provider server and click "1-Click Dispatch" to execute!
                </p>
              </div>
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-sm" style="background: #10B981; color: white; font-weight: 800; border-radius: 999px; padding: 8px 18px;" onclick="AdminApp.dispatchAllQueuedOrders()">
                ⚡ 1-Click Dispatch All Queued (${queuedOrders.length})
              </button>
            </div>
          </div>

          <div style="overflow-x: auto;">
            <table class="sync-data-table" style="font-size: 13px; background: white; border-radius: 12px; overflow: hidden;">
              <thead>
                <tr style="background: #FEF2F2;">
                  <th>Order ID</th>
                  <th>Target Provider</th>
                  <th>Service Details</th>
                  <th>Target Link</th>
                  <th>Quantity</th>
                  <th>Customer Paid</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${queuedOrders.map(qo => {
                  const provName = qo.providerDisplayName || (qo.provider === 'worldofsmm' ? 'WorldOfSMM' : 'JustAnotherPanel (JAP)');
                  return `
                    <tr>
                      <td style="font-family: var(--font-mono); font-weight: 800; color: #6C5CE7;">#${qo.id}</td>
                      <td>
                        <span class="badge" style="background: rgba(239, 68, 68, 0.14); color: #DC2626; font-weight: 800; padding: 4px 10px; border-radius: 8px;">
                          ${provName}
                        </span>
                      </td>
                      <td style="max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        <strong>${qo.serviceName}</strong>
                      </td>
                      <td style="max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        <a href="${qo.target}" target="_blank" style="color: #0284c7; text-decoration: underline;">${qo.target}</a>
                      </td>
                      <td><strong>${Number(qo.quantity).toLocaleString()}</strong></td>
                      <td><strong style="color: #10B981; font-size: 14px;">${store.formatMoney(qo.amount)}</strong></td>
                      <td>
                        <button class="btn btn-sm btn-primary" style="font-size: 12px; padding: 6px 14px; font-weight: 800; border-radius: 8px;" onclick="store.dispatchQueuedOrder('${qo.id}')">
                          ⚡ 1-Click Dispatch
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}

      <div class="kpi-grid">
        <div class="kpi-card" onclick="store.setAdminTab('orders')" style="cursor: pointer;" title="View Customers & Orders">
          <div class="kpi-card-top">
            <div class="kpi-icon-box" style="background: var(--primary-light); color: var(--primary);">👥</div>
            <span class="badge badge-success">Active</span>
          </div>
          <div class="kpi-label">Total Customers</div>
          <div class="kpi-value">${stats.totalCustomers.toLocaleString()}</div>
        </div>

        <div class="kpi-card" onclick="store.setAdminTab('orders')" style="cursor: pointer;" title="View All Orders">
          <div class="kpi-card-top">
            <div class="kpi-icon-box" style="background: var(--primary-light); color: var(--primary);">🛍️</div>
            <span class="badge badge-primary">Live</span>
          </div>
          <div class="kpi-label">Total Orders</div>
          <div class="kpi-value">${stats.totalOrders.toLocaleString()}</div>
        </div>

        <div class="kpi-card" onclick="store.setAdminTab('orders')" style="cursor: pointer;" title="Total Panel Revenue">
          <div class="kpi-card-top">
            <div class="kpi-icon-box" style="background: var(--success-light); color: var(--success);">$</div>
            <span class="badge badge-success">Real-Time</span>
          </div>
          <div class="kpi-label">Revenue</div>
          <div class="kpi-value">${store.formatMoney(stats.revenue, 2)}</div>
        </div>

        <div class="kpi-card" onclick="store.setAdminTab('services')" style="cursor: pointer;" title="Adjust Markup %">
          <div class="kpi-card-top">
            <div class="kpi-icon-box" style="background: var(--primary-light); color: var(--primary);">📈</div>
            <span class="badge badge-success">Active</span>
          </div>
          <div class="kpi-label">Profit Markup Setting</div>
          <div class="kpi-value">+${stats.globalMarkupPercent}%</div>
        </div>

        <div class="kpi-card" onclick="store.setAdminTab('providers')" style="cursor: pointer;" title="Provider Balance">
          <div class="kpi-card-top">
            <div class="kpi-icon-box" style="background: var(--warning-light); color: var(--warning);">🏛️</div>
            <span class="badge badge-success">${stats.providerBalanceStatus}</span>
          </div>
          <div class="kpi-label">JAP Wholesale Balance</div>
          <div class="kpi-value">$${(Number(stats.providerBalance) || 0).toFixed(2)} USD</div>
        </div>

        <div class="kpi-card" onclick="store.setAdminTab('alerts')" style="cursor: pointer;" title="Manage WhatsApp & Gmail Low Balance Alerts">
          <div class="kpi-card-top">
            <div class="kpi-icon-box" style="background: rgba(16, 185, 129, 0.15); color: #10B981;">🔔</div>
            <span class="badge badge-success">Live Ready</span>
          </div>
          <div class="kpi-label">Auto Alerts Gateway</div>
          <div class="kpi-value" style="font-size: 16.5px; color: #10B981;">WhatsApp & Mail 📲</div>
        </div>
      </div>

      <!-- LIVE RECENT ORDERS OVERVIEW ON DASHBOARD -->
      <div class="card" style="margin-top: 24px; padding: 24px; border: 1px solid var(--border-color); background: var(--bg-surface); border-radius: 18px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
          <div>
            <div style="display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 800; color: var(--primary); text-transform: uppercase; letter-spacing: 0.5px;">
              <span>🛒</span> <span>LIVE TRANSACTION STREAM</span>
            </div>
            <h3 style="font-size: 19px; font-weight: 800; color: var(--text-main); margin-top: 2px;">
              Recent Orders Overview (${allOrders.length} Total Placed)
            </h3>
          </div>
          <button class="btn btn-sm btn-primary" onclick="store.setAdminTab('orders')" style="font-weight: 700; border-radius: 999px; padding: 6px 16px;">
            Open All Orders Master Table ➔
          </button>
        </div>

        ${recentOrders.length === 0 ? `
          <div style="text-align: center; padding: 32px; color: var(--text-muted);">
            <div style="font-size: 32px; margin-bottom: 6px;">📦</div>
            <strong>No orders placed yet</strong>
            <p style="font-size: 12.5px; margin-top: 4px;">Orders placed on storefront will appear here instantly with full live status.</p>
          </div>
        ` : `
          <div style="overflow-x: auto;">
            <table class="sync-data-table" style="font-size: 13px;">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Service ID</th>
                  <th>Customer Service</th>
                  <th>Charge</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${recentOrders.map(ro => {
                  const sId = this.getOrderServiceId(ro);
                  return `
                    <tr>
                      <td style="font-family: var(--font-mono); font-weight: 800;">#${ro.id}</td>
                      <td>
                        <span class="badge" style="background: rgba(99, 102, 241, 0.12); color: #4F46E5; font-weight: 800; font-family: var(--font-mono); padding: 2px 7px; border-radius: 6px;">#${sId}</span>
                      </td>
                      <td style="max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"><strong>${ro.serviceName}</strong></td>
                      <td><strong style="color: var(--primary);">${store.formatMoney(ro.amount)}</strong></td>
                      <td><span class="badge badge-primary">${ro.status || 'Processing'}</span></td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>

      <!-- LIVE ANNOUNCEMENT TICKER MANAGER -->
      <div class="card" style="margin-top: 24px; padding: 24px; border: 1.5px solid var(--primary); background: var(--bg-surface); border-radius: 18px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
          <div>
            <div style="display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 800; color: var(--primary); text-transform: uppercase; letter-spacing: 0.5px;">
              <span>📢</span> <span>STOREFRONT ANNOUNCEMENT TICKER</span>
            </div>
            <h3 style="font-size: 20px; font-weight: 800; color: var(--text-main); margin-top: 2px;">
              Live Announcement Bar Editor
            </h3>
            <p style="font-size: 13px; color: var(--text-secondary);">
              This text runs continuously in a smooth animated marquee across the top of the customer website.
            </p>
          </div>

          <label style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 700; font-size: 13.5px;">
            <input type="checkbox" id="admin-announcement-toggle" ${(store.data.announcement && store.data.announcement.enabled !== false) ? 'checked' : ''} style="width: 18px; height: 18px;" />
            <span>Enable Running Ticker</span>
          </label>
        </div>

        <!-- Live Preview -->
        <div style="background: rgba(99, 102, 241, 0.08); border: 1px dashed var(--primary); border-radius: 12px; padding: 10px 14px; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; overflow: hidden;">
          <span style="background: var(--primary); color: #fff; font-size: 10px; font-weight: 900; padding: 2px 8px; border-radius: 999px; flex-shrink: 0;">PREVIEW</span>
          <div style="font-size: 12.5px; font-weight: 600; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" id="admin-announcement-preview">
            ${(store.data.announcement && store.data.announcement.text) || ''}
          </div>
        </div>

        <!-- Input Area -->
        <div class="form-group" style="margin-bottom: 14px;">
          <label class="form-label" style="font-weight: 700; font-size: 13px;">Announcement Message Text</label>
          <textarea 
            id="admin-announcement-text" 
            class="form-input" 
            rows="3" 
            style="width: 100%; border-radius: 12px; font-size: 13.5px; line-height: 1.5; padding: 12px; resize: vertical;"
            placeholder="Enter announcement text..."
            oninput="document.getElementById('admin-announcement-preview').innerText = this.value"
          >${(store.data.announcement && store.data.announcement.text) || ''}</textarea>
        </div>

        <!-- Preset Insertion Chips -->
        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;">
          <span style="font-size: 12px; font-weight: 700; color: var(--text-secondary); align-self: center;">Quick Add:</span>
          <button type="button" class="btn btn-sm btn-secondary" style="font-size: 11px; padding: 4px 10px;" onclick="AdminApp.appendAnnouncementSnippet(' • 💬 24/7 WhatsApp VIP Support: +91 9837371137')">+ WhatsApp VIP</button>
          <button type="button" class="btn btn-sm btn-secondary" style="font-size: 11px; padding: 4px 10px;" onclick="AdminApp.appendAnnouncementSnippet(' • 🛡️ 365-Day Refill & Drop Protection Guarantee')">+ 365D Refill</button>
          <button type="button" class="btn btn-sm btn-secondary" style="font-size: 11px; padding: 4px 10px;" onclick="AdminApp.appendAnnouncementSnippet(' • 💰 Guaranteed Lowest Wholesale Prices in India')">+ Lowest Rates</button>
          <button type="button" class="btn btn-sm btn-secondary" style="font-size: 11px; padding: 4px 10px;" onclick="AdminApp.appendAnnouncementSnippet(' • 🚀 Instant 0-Min Delivery Active')">+ Instant Delivery</button>
        </div>

        <button class="btn btn-primary" onclick="AdminApp.saveAnnouncement()" style="font-weight: 800; padding: 10px 24px; border-radius: 12px;">
          💾 Save Announcement (Live Update)
        </button>
      </div>

      <!-- MULTI-CHANNEL ALERT GATEWAY (WHATSAPP & GMAIL) -->
      <div class="card" style="margin-top: 24px; padding: 24px; border: 1.5px solid #10B981; background: var(--bg-surface); border-radius: 18px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
          <div>
            <div style="display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 800; color: #10B981; text-transform: uppercase; letter-spacing: 0.5px;">
              <span>📲</span> <span>AUTOMATED ALERT NOTIFICATIONS</span>
            </div>
            <h3 style="font-size: 20px; font-weight: 800; color: var(--text-main); margin-top: 2px;">
              WhatsApp & Gmail Low Balance / Queued Order Alerts
            </h3>
            <p style="font-size: 13px; color: var(--text-secondary);">
              Receive instant alerts on WhatsApp & Gmail when provider balance drops or any customer order is queued.
            </p>
          </div>

          <button class="btn btn-sm" style="background: #10B981; color: white; font-weight: 800; padding: 8px 18px; border-radius: 999px;" onclick="store.sendTestAlert()">
            🧪 Send Test Alert (WhatsApp & Gmail)
          </button>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-top: 16px;">
          <div style="background: var(--bg-subtle); padding: 16px; border-radius: 14px; border: 1px solid var(--border-color);">
            <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 6px;">
              📱 WhatsApp Alert Number:
            </label>
            <input type="text" id="admin-alert-whatsapp" class="form-input" value="${alertConfig.whatsappNumber || '7055515757'}" placeholder="e.g. 7055515757" style="font-weight: 700;" />
            <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 4px;">
              Alerts delivered directly to your personal phone number.
            </div>
          </div>

          <div style="background: var(--bg-subtle); padding: 16px; border-radius: 14px; border: 1px solid var(--border-color);">
            <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 6px;">
              📧 Gmail Notification Address:
            </label>
            <input type="email" id="admin-alert-email" class="form-input" value="${alertConfig.adminEmail || 'viplavkumar50@gmail.com'}" placeholder="e.g. viplavkumar50@gmail.com" style="font-weight: 700;" />
            <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 4px;">
              Instant push email delivered whenever top-up is needed.
            </div>
          </div>

          <div style="background: var(--bg-subtle); padding: 16px; border-radius: 14px; border: 1px solid var(--border-color);">
            <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 6px;">
              📉 Warning Threshold (INR ₹):
            </label>
            <input type="number" id="admin-alert-threshold" class="form-input" value="${alertConfig.threshold || 100}" placeholder="100" style="font-weight: 700;" />
            <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 4px;">
              Alerts trigger when balance falls below this amount.
            </div>
          </div>
        </div>

        <div style="margin-top: 18px; display: flex; justify-content: flex-end;">
          <button class="btn btn-primary" onclick="AdminApp.saveAlertSettings()" style="font-weight: 800; padding: 10px 24px; border-radius: 12px;">
            💾 Save Alert Configuration
          </button>
        </div>
      </div>
    `;
  },

  appendAnnouncementSnippet(snippet) {
    const textarea = document.getElementById('admin-announcement-text');
    if (textarea) {
      textarea.value += snippet;
      document.getElementById('admin-announcement-preview').innerText = textarea.value;
    }
  },

  saveAnnouncement() {
    const textEl = document.getElementById('admin-announcement-text');
    const toggleEl = document.getElementById('admin-announcement-toggle');
    if (!textEl || !toggleEl) return;
    const text = textEl.value.trim();
    const enabled = toggleEl.checked;
    window.store.updateAnnouncement(text, enabled);
  },

  saveAlertSettings() {
    const waEl = document.getElementById('admin-alert-whatsapp');
    const emailEl = document.getElementById('admin-alert-email');
    const threshEl = document.getElementById('admin-alert-threshold');
    const keyEl = document.getElementById('admin-alert-apikey');

    const config = {
      whatsappNumber: waEl ? waEl.value.trim() : '7055515757',
      adminEmail: emailEl ? emailEl.value.trim() : 'viplavkumar50@gmail.com',
      threshold: threshEl ? Number(threshEl.value) || 100 : 100,
      callmebotApiKey: keyEl ? keyEl.value.trim() : ''
    };

    window.store.saveAlertConfig(config);
  },

  async dispatchAllQueuedOrders() {
    const allOrders = window.store.getAllAdminOrders ? window.store.getAllAdminOrders() : window.store.data.orders;
    const queuedOrders = allOrders.filter(o => o && (o.isQueued || o.needsTopup));
    if (queuedOrders.length === 0) {
      window.store.showToast('No queued orders waiting for dispatch.', 'info');
      return;
    }

    window.store.showToast(`⚡ Dispatching ${queuedOrders.length} queued orders to providers...`, 'info');
    let successCount = 0;
    for (const qo of queuedOrders) {
      const res = await window.store.dispatchQueuedOrder(qo.id);
      if (res && res.success) {
        successCount++;
      }
    }

    window.store.showToast(`🏁 Finished dispatching: ${successCount}/${queuedOrders.length} orders successfully sent to live servers!`, 'success');
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

  // --- PROVIDER SERVICES MANAGER & BATCH ACTIONS ---
  selectedProvider: 'worldofsmm',
  selectedCategory: 'all',
  serviceSearchQuery: '',
  statusFilter: 'all',
  selectedServiceIds: new Set(),
  providerServicesCache: {},
  isLoadingProviderServices: false,
  _currentRenderedServices: [],

  async fetchProviderServices(provider = 'worldofsmm', force = false) {
    if (!force && this.providerServicesCache[provider] && this.providerServicesCache[provider].length > 0) {
      return this.providerServicesCache[provider];
    }
    this.isLoadingProviderServices = true;
    const container = document.getElementById('screen-container');
    if (container && window.store.adminTab === 'provider_services') {
      this.render(container);
    }
    try {
      const res = await fetch(`/api/provider?action=services&provider=${provider}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          this.providerServicesCache[provider] = data;
          window.store.showToast(`Fetched ${data.length} live services from ${provider === 'worldofsmm' ? 'WorldOfSMM' : 'JustAnotherPanel'}!`, 'success');
        }
      }
    } catch (e) {
      window.store.showToast('Could not reach provider API. Showing local catalog services.', 'warning');
    } finally {
      this.isLoadingProviderServices = false;
      if (container && window.store.adminTab === 'provider_services') {
        this.render(container);
      }
    }
  },

  handleSelectProvider(prov) {
    this.selectedProvider = prov;
    this.selectedCategory = 'all';
    this.selectedServiceIds.clear();
    if (!this.providerServicesCache[prov]) {
      this.fetchProviderServices(prov);
    }
    this.render(document.getElementById('screen-container'));
  },

  handleCategoryFilter(cat) {
    this.selectedCategory = cat;
    this.selectedServiceIds.clear();
    this.render(document.getElementById('screen-container'));
  },

  handleServiceSearch(query) {
    this.serviceSearchQuery = query;
    this.render(document.getElementById('screen-container'));
  },

  handleStatusFilter(status) {
    this.statusFilter = status;
    this.selectedServiceIds.clear();
    this.render(document.getElementById('screen-container'));
  },

  handleToggleServiceSelect(serviceId) {
    const sId = String(serviceId);
    if (this.selectedServiceIds.has(sId)) {
      this.selectedServiceIds.delete(sId);
    } else {
      this.selectedServiceIds.add(sId);
    }
    this.render(document.getElementById('screen-container'));
  },

  handleSelectAllVisible(isChecked) {
    if (isChecked) {
      (this._currentRenderedServices || []).forEach(s => {
        this.selectedServiceIds.add(String(s.rawId || s.id));
      });
    } else {
      this.selectedServiceIds.clear();
    }
    this.render(document.getElementById('screen-container'));
  },

  handleAddSelectedToCatalog() {
    if (this.selectedServiceIds.size === 0) return;
    const toAdd = (this._currentRenderedServices || []).filter(s => {
      const id = String(s.id);
      const rawId = String(s.rawId || '');
      return this.selectedServiceIds.has(id) || (rawId && this.selectedServiceIds.has(rawId));
    });
    if (toAdd.length === 0) return;
    window.store.addServicesToCatalog(toAdd);
    this.selectedServiceIds.clear();
    this.render(document.getElementById('screen-container'));
  },

  handleRemoveSelectedFromCatalog() {
    if (this.selectedServiceIds.size === 0) return;
    window.store.removeServicesFromCatalog(Array.from(this.selectedServiceIds));
    this.selectedServiceIds.clear();
    this.render(document.getElementById('screen-container'));
  },

  handleToggleSingleServiceById(serviceId) {
    const sId = String(serviceId);
    const serviceObj = (this._currentRenderedServices || []).find(s => String(s.rawId || s.id) === sId);
    if (!serviceObj) return;

    const isActive = window.store.isServiceActiveInCatalog(serviceObj.id, serviceObj.rawId);
    if (isActive) {
      window.store.removeServicesFromCatalog([serviceObj.id, serviceObj.rawId]);
    } else {
      window.store.addServicesToCatalog([serviceObj]);
    }
    this.render(document.getElementById('screen-container'));
  },

  renderProviderServicesManager(store) {
    const prov = this.selectedProvider || 'worldofsmm';
    const isWos = prov === 'worldofsmm';

    if (!this.providerServicesCache[prov] && !this.isLoadingProviderServices) {
      setTimeout(() => this.fetchProviderServices(prov), 10);
    }

    let allServices = this.providerServicesCache[prov] || [];
    if (allServices.length === 0) {
      const catalog = window.JAP_SERVICES || [];
      if (isWos) {
        allServices = catalog.filter(s => s.provider === 'worldofsmm' || String(s.id).startsWith('wos-'));
      } else {
        allServices = catalog.filter(s => s.provider !== 'worldofsmm' && !String(s.id).startsWith('wos-'));
      }
    }

    const normalized = allServices.map(s => {
      const sId = String(s.service || s.id);
      const rawId = String(s.rawId || s.service || sId.replace('wos-', ''));
      const costUsd = parseFloat(s.rate || s.cost || 0.1);
      return {
        ...s,
        id: sId,
        rawId: rawId,
        provider: prov,
        cost: costUsd,
        rate: costUsd,
        name: s.name || '',
        category: s.category || 'General Services',
        min: s.min || 10,
        max: s.max || 1000000
      };
    });

    const rawCategories = [...new Set(normalized.map(s => s.category).filter(Boolean))].sort();
    const selectedCat = this.selectedCategory || 'all';
    const query = (this.serviceSearchQuery || '').trim().toLowerCase();
    const statusF = this.statusFilter || 'all';

    let filtered = normalized;
    if (selectedCat !== 'all') {
      filtered = filtered.filter(s => s.category === selectedCat);
    }
    if (query) {
      filtered = filtered.filter(s => 
        s.id.toLowerCase().includes(query) || 
        s.rawId.toLowerCase().includes(query) || 
        s.name.toLowerCase().includes(query)
      );
    }
    if (statusF === 'active') {
      filtered = filtered.filter(s => store.isServiceActiveInCatalog(s.id, s.rawId));
    } else if (statusF === 'inactive') {
      filtered = filtered.filter(s => !store.isServiceActiveInCatalog(s.id, s.rawId));
    }

    this._currentRenderedServices = filtered;

    const visibleIds = filtered.map(s => String(s.rawId || s.id));
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => this.selectedServiceIds.has(id));
    const selectedCount = this.selectedServiceIds.size;

    return `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <!-- Top Info Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 24px; font-weight: 800; color: var(--text-main);">⚡ Provider Service Importer & Manager</h2>
            <p style="font-size: 13.5px; color: var(--text-secondary); margin-top: 2px;">
              Browse all raw provider services, filter by category, and add or remove services to LikeX Customer Catalog in bulk.
            </p>
          </div>
          <button class="btn btn-primary btn-sm" style="display: inline-flex; align-items: center; gap: 6px;" onclick="AdminApp.fetchProviderServices('${prov}', true)">
            <span>${this.isLoadingProviderServices ? '⏳ Fetching...' : '🔄 Refresh Live API'}</span>
          </button>
        </div>

        <!-- Provider Switcher Tabs -->
        <div class="provider-selector-tabs">
          <button class="provider-tab-btn ${isWos ? 'active' : ''}" onclick="AdminApp.handleSelectProvider('worldofsmm')">
            <span>🇮🇳 WorldOfSMM (Funded $0.10)</span>
            <span class="badge ${isWos ? 'badge-neutral' : 'badge-primary'}" style="font-size: 11px;">1,685 Live Services</span>
          </button>
          <button class="provider-tab-btn ${!isWos ? 'active' : ''}" onclick="AdminApp.handleSelectProvider('jap')">
            <span>❖ JustAnotherPanel (JAP)</span>
            <span class="badge ${!isWos ? 'badge-neutral' : 'badge-primary'}" style="font-size: 11px;">5,803 Services</span>
          </button>
        </div>

        <!-- Filter and Search Bar -->
        <div class="service-filter-card">
          <div class="service-filter-row">
            <div style="flex: 1; min-width: 240px;">
              <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary); margin-bottom: 4px; display: block;">
                Filter by Category (${rawCategories.length} Categories)
              </label>
              <select class="form-input" style="height: 40px; font-size: 13px;" onchange="AdminApp.handleCategoryFilter(this.value)">
                <option value="all" ${selectedCat === 'all' ? 'selected' : ''}>📂 All Categories (${normalized.length} total)</option>
                ${rawCategories.map(cat => {
                  const count = normalized.filter(s => s.category === cat).length;
                  return `<option value="${cat.replace(/"/g, '&quot;')}" ${selectedCat === cat ? 'selected' : ''}>${cat} (${count})</option>`;
                }).join('')}
              </select>
            </div>

            <div style="flex: 1; min-width: 220px;">
              <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary); margin-bottom: 4px; display: block;">
                Search by Service Name or ID
              </label>
              <input 
                type="text" 
                class="form-input" 
                style="height: 40px; font-size: 13px;" 
                placeholder="Search e.g. Followers, Views, Likes, 1407..." 
                value="${this.serviceSearchQuery || ''}"
                oninput="AdminApp.handleServiceSearch(this.value)" 
              />
            </div>

            <div style="width: 180px;">
              <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary); margin-bottom: 4px; display: block;">
                Catalog Status
              </label>
              <select class="form-input" style="height: 40px; font-size: 13px;" onchange="AdminApp.handleStatusFilter(this.value)">
                <option value="all" ${statusF === 'all' ? 'selected' : ''}>All Services</option>
                <option value="active" ${statusF === 'active' ? 'selected' : ''}>🟢 Active in LikeX</option>
                <option value="inactive" ${statusF === 'inactive' ? 'selected' : ''}>⚪ Not in Catalog</option>
              </select>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12.5px; color: var(--text-secondary); padding-top: 4px; border-top: 1px solid var(--border-color); flex-wrap: wrap; gap: 8px;">
            <span>Showing <strong>${filtered.length}</strong> of ${normalized.length} services</span>
            <div style="display: flex; align-items: center; gap: 12px;">
              <label style="display: inline-flex; align-items: center; gap: 6px; cursor: pointer; font-weight: 700;">
                <input type="checkbox" ${allVisibleSelected ? 'checked' : ''} onchange="AdminApp.handleSelectAllVisible(this.checked)" />
                <span>Select All Visible (${filtered.length})</span>
              </label>
              ${selectedCount > 0 ? `<button class="btn btn-sm btn-secondary" onclick="AdminApp.selectedServiceIds.clear(); AdminApp.render(document.getElementById('screen-container'))">Clear Selection (${selectedCount})</button>` : ''}
            </div>
          </div>
        </div>

        <!-- Services Table -->
        <div class="sync-table-container">
          <table class="sync-data-table">
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">
                  <input type="checkbox" ${allVisibleSelected ? 'checked' : ''} onchange="AdminApp.handleSelectAllVisible(this.checked)" title="Select All Visible" />
                </th>
                <th style="width: 90px;">Service ID</th>
                <th>Package Name & Category</th>
                <th>Wholesale Cost</th>
                <th>Selling Price (+${store.data.adminStats.globalMarkupPercent}%)</th>
                <th>Min / Max</th>
                <th>Status in LikeX</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.length === 0 ? `
                <tr>
                  <td colspan="8" style="text-align: center; padding: 40px; color: var(--text-muted);">
                    No services match the selected category or search query.
                  </td>
                </tr>
              ` : filtered.slice(0, 100).map(s => {
                const sKey = String(s.rawId || s.id);
                const isSelected = this.selectedServiceIds.has(sKey);
                const isActive = store.isServiceActiveInCatalog(s.id, s.rawId);
                const wholesaleInr = store.formatMoney(s.cost);
                const sellingPriceUsd = store.getSellingPrice(s.cost);
                const sellingPriceInr = store.formatMoney(sellingPriceUsd);

                return `
                  <tr style="${isSelected ? 'background: rgba(99, 102, 241, 0.08);' : ''}">
                    <td style="text-align: center;">
                      <input 
                        type="checkbox" 
                        ${isSelected ? 'checked' : ''} 
                        onchange="AdminApp.handleToggleServiceSelect('${sKey}')" 
                      />
                    </td>
                    <td>
                      <span class="badge badge-neutral" style="font-family: var(--font-mono); font-weight: 700;">
                        #${sKey}
                      </span>
                      <div style="font-size: 10.5px; color: var(--text-muted); margin-top: 2px;">${isWos ? 'WorldOfSMM' : 'JAP'}</div>
                    </td>
                    <td>
                      <div style="font-weight: 700; font-size: 13.5px; color: var(--text-main); line-height: 1.3;">
                        ${s.name}
                      </div>
                      <div style="font-size: 11.5px; color: var(--text-secondary); margin-top: 3px;">
                        📂 <em>${s.category}</em>
                      </div>
                    </td>
                    <td>
                      <div style="font-weight: 700; font-size: 13px; color: var(--text-muted);">$${s.cost.toFixed(4)}</div>
                      <div style="font-size: 11px; color: var(--text-secondary);">${wholesaleInr} / 1K</div>
                    </td>
                    <td>
                      <div style="font-weight: 800; font-size: 14px; color: var(--primary);">${sellingPriceInr} / 1K</div>
                      <div style="font-size: 11px; color: #10B981; font-weight: 600;">+$${(sellingPriceUsd - s.cost).toFixed(4)} profit</div>
                    </td>
                    <td>
                      <div style="font-size: 12px; font-weight: 600;">${Number(s.min).toLocaleString()} - ${Number(s.max).toLocaleString()}</div>
                      <div style="font-size: 11px; color: var(--text-muted);">${s.refill ? '🛡️ Refill' : 'No Refill'}</div>
                    </td>
                    <td>
                      ${isActive ? `
                        <span class="badge-active-likex">
                          <span>●</span> Active in LikeX
                        </span>
                      ` : `
                        <span class="badge-inactive-likex">
                          <span>○</span> Not in Catalog
                        </span>
                      `}
                    </td>
                    <td style="text-align: right;">
                      <button 
                        class="btn btn-sm ${isActive ? 'btn-outline' : 'btn-primary'}" 
                        style="${isActive ? 'color: #EF4444; border-color: #EF4444; font-size: 12px; padding: 5px 12px;' : 'font-size: 12px; padding: 5px 12px;'}"
                        onclick="AdminApp.handleToggleSingleServiceById('${sKey}')"
                      >
                        ${isActive ? '🗑️ Remove' : '➕ Add to LikeX'}
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          ${filtered.length > 100 ? `
            <div style="text-align: center; padding: 14px; background: var(--bg-subtle); font-size: 12.5px; color: var(--text-secondary);">
              Showing first 100 of ${filtered.length} services. Use category or search to narrow down.
            </div>
          ` : ''}
        </div>

        <!-- Sticky Floating Multi-Select Batch Action Bar -->
        ${selectedCount > 0 ? `
          <div class="floating-batch-bar">
            <div class="batch-info">
              <span style="font-size: 20px;">📌</span>
              <span><strong>${selectedCount}</strong> services selected from ${isWos ? 'WorldOfSMM' : 'JAP'}</span>
            </div>
            <div class="batch-actions">
              <button class="btn btn-success btn-md" style="background: #10B981; border: none; font-weight: 700; color: #FFFFFF;" onclick="AdminApp.handleAddSelectedToCatalog()">
                ➕ Add Selected (${selectedCount}) to Customer Catalog
              </button>
              <button class="btn btn-sm" style="background: #EF4444; border: none; font-weight: 700; color: #FFFFFF;" onclick="AdminApp.handleRemoveSelectedFromCatalog()">
                🗑️ Remove Selected (${selectedCount})
              </button>
              <button class="btn btn-secondary btn-sm" style="background: rgba(255,255,255,0.15); color: #FFFFFF; border: none;" onclick="AdminApp.selectedServiceIds.clear(); AdminApp.render(document.getElementById('screen-container'))">
                ✕ Cancel
              </button>
            </div>
          </div>
        ` : ''}
      </div>
    `;
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

  adminOrdersSearch: '',
  adminOrdersFilter: 'all',

  getOrderServiceId(order) {
    if (order.rawServiceId && String(order.rawServiceId) !== 'undefined' && String(order.rawServiceId).trim() !== '') {
      return String(order.rawServiceId);
    }
    // Check in customerServices catalog
    const custSvc = (window.mockData?.customerServices || []).find(s => String(s.id) === String(order.serviceId));
    if (custSvc && custSvc.japId) {
      return String(custSvc.japId);
    }
    // Check in window.JAP_SERVICES
    const japSvc = (window.JAP_SERVICES || []).find(s => String(s.id) === String(order.serviceId) || String(s.rawId) === String(order.serviceId));
    if (japSvc) {
      return String(japSvc.rawId || japSvc.id);
    }
    if (order.serviceId) {
      return String(order.serviceId).replace(/^wos-/, '');
    }
    return 'N/A';
  },

  handleAdminOrdersSearch(val) {
    this.adminOrdersSearch = val;
    this.updateAdminOrdersTableView();
  },

  setAdminOrdersFilter(filter) {
    this.adminOrdersFilter = filter;
    this.updateAdminOrdersTableView();
  },

  getFilteredOrders(store) {
    const s = store || window.store;
    const allOrders = (s && s.getAllAdminOrders ? s.getAllAdminOrders() : s?.data?.orders) || [];
    const query = (this.adminOrdersSearch || '').trim().toLowerCase();
    const cleanQuery = query.replace(/^#/, '');
    const filter = this.adminOrdersFilter || 'all';

    let filtered = allOrders;
    if (filter !== 'all') {
      filtered = filtered.filter(o => (o.status || '').toLowerCase().replace(/\s+/g, '_') === filter.toLowerCase());
    }

    if (query) {
      filtered = filtered.filter(o => {
        const idStr = String(o.id || '').toLowerCase();
        const svcId = this.getOrderServiceId(o).toLowerCase();
        const rawIdStr = String(o.serviceId || '').toLowerCase();
        const provIdStr = String(o.providerOrderId || '').toLowerCase();
        const nameStr = String(o.serviceName || '').toLowerCase();
        const targetStr = String(o.target || '').toLowerCase();
        const statusStr = String(o.status || '').toLowerCase();
        const provStr = String(o.provider || '').toLowerCase();

        return idStr.includes(query) ||
               idStr.includes(cleanQuery) ||
               svcId.includes(query) ||
               svcId.includes(cleanQuery) ||
               rawIdStr.includes(query) ||
               rawIdStr.includes(cleanQuery) ||
               provIdStr.includes(query) ||
               provIdStr.includes(cleanQuery) ||
               nameStr.includes(query) ||
               targetStr.includes(query) ||
               statusStr.includes(query) ||
               provStr.includes(query);
      });
    }

    return filtered;
  },

  renderAdminOrderRows(filteredOrders, store) {
    if (!filteredOrders || filteredOrders.length === 0) {
      const q = (this.adminOrdersSearch || '').trim();
      const f = this.adminOrdersFilter || 'all';
      return `
        <tr>
          <td colspan="8" style="text-align: center; padding: 48px 20px; color: var(--text-muted);">
            <div style="font-size: 38px; margin-bottom: 10px;">🔍</div>
            <strong style="font-size: 15px; color: var(--text-main);">No orders found matching "${q || f}"</strong>
            <p style="font-size: 13px; margin-top: 6px; color: var(--text-secondary);">Directly search by Order ID (#42078) or Service ID (#10131), or reset search filters.</p>
            ${(q || f !== 'all') ? `
              <button type="button" class="btn btn-sm btn-secondary" onclick="AdminApp.handleAdminOrdersSearch(''); AdminApp.setAdminOrdersFilter('all');" style="margin-top: 14px; border-radius: 999px; font-weight: 700; padding: 6px 16px;">
                Reset Search Filters
              </button>
            ` : ''}
          </td>
        </tr>
      `;
    }

    return filteredOrders.map(o => {
      const svcId = this.getOrderServiceId(o);
      const isWos = o.provider === 'worldofsmm' || (o.serviceId && String(o.serviceId).startsWith('wos-'));
      const isLow = o.isLowBalance || (o.status && o.status.includes('Low Provider Balance'));

      return `
        <tr>
          <!-- ORDER ID -->
          <td>
            <div style="display: inline-flex; align-items: center; gap: 6px;">
              <span style="font-family: var(--font-mono); font-weight: 800; font-size: 13.5px; color: var(--text-main); cursor: pointer;" title="Click to copy Order ID" onclick="navigator.clipboard.writeText('${o.id}'); window.store.showToast('Order ID #${o.id} copied!', 'success');">
                #${o.id}
              </span>
              <button type="button" class="btn-copy-id" title="Copy Order ID" onclick="navigator.clipboard.writeText('${o.id}'); window.store.showToast('Order ID #${o.id} copied!', 'success');" style="background: none; border: none; cursor: pointer; padding: 2px 4px; font-size: 12px;">📋</button>
            </div>
          </td>

          <!-- SERVICE ID -->
          <td>
            <div style="display: inline-flex; align-items: center; gap: 6px;">
              <span class="badge" style="background: rgba(99, 102, 241, 0.12); color: #4338CA; font-weight: 800; font-family: var(--font-mono); font-size: 12.5px; padding: 4px 9px; border-radius: 7px; border: 1px solid rgba(99, 102, 241, 0.28); letter-spacing: 0.3px; cursor: pointer;" title="Click to copy Service ID" onclick="navigator.clipboard.writeText('${svcId}'); window.store.showToast('Service ID #${svcId} copied!', 'success');">
                #${svcId}
              </span>
              ${svcId !== 'N/A' ? `
                <button type="button" class="btn-copy-id" title="Copy Service ID" onclick="navigator.clipboard.writeText('${svcId}'); window.store.showToast('Service ID #${svcId} copied!', 'success');" style="background: none; border: none; cursor: pointer; padding: 2px 4px; font-size: 11px;">📋</button>
              ` : ''}
            </div>
          </td>

          <!-- CUSTOMER SERVICE -->
          <td>
            <div style="font-weight: 700; color: var(--text-main); font-size: 13.5px; line-height: 1.4;">
              ${o.serviceName}
            </div>
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 3px; font-size: 11px; color: var(--text-muted);">
              <span style="font-family: var(--font-mono); font-weight: 600; color: #4F46E5;">SVC #${svcId}</span>
              ${o.comments ? `<span style="color: var(--primary); font-weight: 600;">💬 Custom Comments Included</span>` : ''}
            </div>
          </td>

          <!-- PROVIDER ORIGIN -->
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
            <div style="font-size: 11px; font-family: var(--font-mono); color: var(--text-muted); margin-top: 3px; display: flex; align-items: center; gap: 4px;">
              <span>${o.providerOrderId || 'Prov Order #'+o.id}</span>
              ${o.providerOrderId ? `
                <button type="button" title="Copy Provider Order ID" onclick="navigator.clipboard.writeText('${o.providerOrderId}'); window.store.showToast('Provider Order ID copied!', 'success');" style="background: none; border: none; cursor: pointer; padding: 0 2px; font-size: 10px; opacity: 0.6;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.6">📋</button>
              ` : ''}
            </div>
          </td>

          <!-- TARGET URL -->
          <td style="font-family: var(--font-mono); font-size: 12px; max-width: 190px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            <a href="${o.target}" target="_blank" rel="noopener noreferrer" style="color: var(--primary); text-decoration: underline; font-weight: 500;" title="${o.target}">
              ${o.target}
            </a>
          </td>

          <!-- QUANTITY -->
          <td style="font-weight: 700; font-size: 13px;">${Number(o.quantity).toLocaleString()}</td>

          <!-- CHARGE -->
          <td><strong style="color: var(--primary); font-size: 13.5px;">${store.formatMoney(o.amount)}</strong></td>

          <!-- STATUS -->
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
      `;
    }).join('');
  },

  updateAdminOrdersTableView() {
    const store = window.store;
    const tbody = document.getElementById('admin-orders-table-body');
    const countEl = document.getElementById('admin-orders-count-label');
    const clearBtn = document.getElementById('admin-orders-clear-btn');
    const searchInput = document.getElementById('admin-orders-search-input');

    if (!tbody) {
      const screenContainer = document.getElementById('screen-container');
      this.render(screenContainer);
      return;
    }

    const allOrders = (store.getAllAdminOrders ? store.getAllAdminOrders() : store.data.orders) || [];
    const filtered = this.getFilteredOrders(store);

    tbody.innerHTML = this.renderAdminOrderRows(filtered, store);

    if (countEl) {
      countEl.innerText = `Showing ${filtered.length} of ${allOrders.length} Orders`;
    }

    if (clearBtn) {
      clearBtn.style.display = (this.adminOrdersSearch && this.adminOrdersSearch.trim()) ? 'block' : 'none';
    }

    if (searchInput && searchInput.value !== (this.adminOrdersSearch || '')) {
      searchInput.value = this.adminOrdersSearch || '';
    }

    // Update filter pills active state
    document.querySelectorAll('.orders-filter-pill').forEach(btn => {
      const filterAttr = btn.getAttribute('data-filter');
      if (filterAttr === this.adminOrdersFilter) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  },

  renderAdminOrders(store) {
    const allOrders = (store.getAllAdminOrders ? store.getAllAdminOrders() : store.data.orders) || [];
    const filtered = this.getFilteredOrders(store);
    const filter = this.adminOrdersFilter || 'all';

    return `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <!-- Top Toolbar with Direct Live Search and Status Filter Chips -->
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 14px; flex-wrap: wrap;">
          <div style="position: relative; flex: 1; min-width: 280px; max-width: 520px;">
            <span style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 16px; opacity: 0.6; pointer-events: none;">🔍</span>
            <input 
              id="admin-orders-search-input"
              type="text" 
              class="form-control" 
              placeholder="Search directly by Order ID (#42078), Service ID (#10131), Link, or Status..." 
              value="${this.adminOrdersSearch || ''}" 
              oninput="AdminApp.handleAdminOrdersSearch(this.value)"
              style="padding-left: 42px; padding-right: 36px; border-radius: 999px; height: 42px; font-size: 13.5px; width: 100%; border: 1.5px solid var(--border-color); background: var(--bg-surface); color: var(--text-main);"
            />
            <button 
              id="admin-orders-clear-btn"
              type="button"
              onclick="AdminApp.handleAdminOrdersSearch(''); const inp = document.getElementById('admin-orders-search-input'); if(inp){ inp.value=''; inp.focus(); }" 
              style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; font-size: 18px; line-height: 1; cursor: pointer; color: var(--text-muted); display: ${this.adminOrdersSearch ? 'block' : 'none'};"
              title="Clear Search"
            >&times;</button>
          </div>

          <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
            <span id="admin-orders-count-label" style="font-size: 13px; font-weight: 700; color: var(--text-secondary);">
              Showing ${filtered.length} of ${allOrders.length} Orders
            </span>
            <button class="btn btn-outline btn-sm" style="display: inline-flex; align-items: center; gap: 6px; border-radius: 999px; font-weight: 700;" onclick="store.syncOrdersStatus()">
              <span>🔄</span>
              <span>Sync Live Status</span>
            </button>
          </div>
        </div>

        <!-- Filter Chips -->
        <div class="orders-filter-chips">
          <button class="orders-filter-pill ${filter === 'all' ? 'active' : ''}" data-filter="all" onclick="AdminApp.setAdminOrdersFilter('all')">All (${allOrders.length})</button>
          <button class="orders-filter-pill ${filter === 'in_progress' ? 'active' : ''}" data-filter="in_progress" onclick="AdminApp.setAdminOrdersFilter('in_progress')">In Progress</button>
          <button class="orders-filter-pill ${filter === 'processing' ? 'active' : ''}" data-filter="processing" onclick="AdminApp.setAdminOrdersFilter('processing')">Processing</button>
          <button class="orders-filter-pill ${filter === 'completed' ? 'active' : ''}" data-filter="completed" onclick="AdminApp.setAdminOrdersFilter('completed')">Completed</button>
          <button class="orders-filter-pill ${filter === 'refunded' ? 'active' : ''}" data-filter="refunded" onclick="AdminApp.setAdminOrdersFilter('refunded')">Refunded / Canceled</button>
        </div>

        <!-- Table Container -->
        <div class="sync-table-container">
          <div style="overflow-x: auto;">
            <table class="sync-data-table">
              <thead>
                <tr>
                  <th style="min-width: 120px;">ORDER ID</th>
                  <th style="min-width: 120px;">SERVICE ID</th>
                  <th style="min-width: 250px;">CUSTOMER SERVICE</th>
                  <th style="min-width: 150px;">PROVIDER ORIGIN</th>
                  <th style="min-width: 180px;">TARGET URL</th>
                  <th style="min-width: 90px;">QUANTITY</th>
                  <th style="min-width: 100px;">CHARGE</th>
                  <th style="min-width: 130px;">STATUS</th>
                </tr>
              </thead>
              <tbody id="admin-orders-table-body">
                ${this.renderAdminOrderRows(filtered, store)}
              </tbody>
            </table>
          </div>
        </div>
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
