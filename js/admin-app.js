async function sha256Hex(message) {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
window.sha256Hex = sha256Hex;


const AdminApp = {
  isAdminAuthenticated() {
    return sessionStorage.getItem('likex_super_admin_auth') === 'true' || localStorage.getItem('likex_super_admin_auth') === 'true';
  },

  logoutAdmin() {
    sessionStorage.removeItem('likex_super_admin_auth');
    sessionStorage.removeItem('likex_super_admin_user');
    localStorage.removeItem('likex_super_admin_auth');
    localStorage.removeItem('likex_super_admin_user');
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
      localStorage.setItem('likex_super_admin_auth', 'true');
      localStorage.setItem('likex_super_admin_user', adminRow.username || 'super_admin');
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
    else if (tab === 'about_reels') contentHtml = this.renderAboutReelsManager(store);
    else if (tab === 'wallet_settings') contentHtml = this.renderWalletSettings(store);
    else if (tab === 'alerts') contentHtml = this.renderAlertsManager(store);
    else if (tab === 'providers') contentHtml = this.renderProviders(store);
    else if (tab === 'provider_services') contentHtml = this.renderProviderServicesManager(store);
    else if (tab === 'sync_services') contentHtml = this.renderSyncServices(store);
    else if (tab === 'services') contentHtml = this.renderCustomerServices(store);
    else if (tab === 'refills') contentHtml = this.renderRefillsQueue(store);
    else if (tab === 'orders') contentHtml = this.renderAdminOrders(store);
    else if (tab === 'customers') contentHtml = this.renderCustomers(store);
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
            <li class="admin-nav-item ${tab === 'about_reels' ? 'active' : ''}" onclick="store.setAdminTab('about_reels')">
              <span class="nav-icon">🎬</span>
              <span>About LikeX Reels</span>
            </li>
            <li class="admin-nav-item ${tab === 'wallet_settings' ? 'active' : ''}" onclick="store.setAdminTab('wallet_settings')">
              <span class="nav-icon">🎥</span>
              <span>Wallet Video & Guide</span>
            </li>
            <li class="admin-nav-item ${tab === 'alerts' ? 'active' : ''}" onclick="store.setAdminTab('alerts')">
              <span class="nav-icon">🔔</span>
              <span>Low Balance & Alerts</span>
            </li>
            <li class="admin-nav-item ${tab === 'orders' ? 'active' : ''}" onclick="store.setAdminTab('orders')">
              <span class="nav-icon">🛒</span>
              <span>Orders</span>
            </li>
            <li class="admin-nav-item ${tab === 'customers' ? 'active' : ''}" onclick="store.setAdminTab('customers')">
              <span class="nav-icon">👥</span>
              <span>Customers</span>
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
              ${store.data.maintenanceMode?.enabled ? `
                <span class="badge" style="background: #F59E0B; color: #000; font-weight: 900; padding: 6px 14px; border-radius: 999px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 10px rgba(245, 158, 11, 0.4); animation: pulse 1.8s infinite;" onclick="store.setAdminTab('dashboard')" title="Maintenance Mode is ACTIVE for regular customers. Click to manage.">
                  <span>🚧</span> <span>MAINTENANCE ON</span>
                </span>
              ` : ''}
              <button class="btn btn-sm btn-secondary" onclick="store.setCurrency(store.currency === 'USD' ? 'INR' : 'USD')">
                ${store.currency === 'USD' ? '💵 USD' : '₹ INR'}
              </button>
              <button class="header-icon-btn" onclick="store.setTheme(store.theme === 'light' ? 'dark' : 'light')" title="Toggle Theme">
                <span>${store.theme === 'light' ? '🌙' : '☀️'}</span>
              </button>
              <button class="header-icon-btn" onclick="store.showToast('Upstream APIs responding normally', 'info')">
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
    if (tab === 'about_reels') return 'About LikeX YouTube Reels & Proofs Manager';
    if (tab === 'wallet_settings') return 'Wallet Video Tutorial & Payment Settings';
    if (tab === 'alerts') return 'Low Balance Alerts & Multi-Channel Gateway';
    if (tab === 'providers') return 'Provider Management';
    if (tab === 'provider_services') return 'Provider Services & Live Catalog Importer';
    if (tab === 'services') return 'Customer Services & Profit Markup';
    if (tab === 'refills') return 'Refill Requests Management';
    if (tab === 'orders') return 'All Orders Master Table';
    if (tab === 'customers') return 'Customer Management & Ledger Directory';
    if (tab === 'support') return 'Support Ticket Queue';
    return 'Admin Console';
  },

  // ABOUT LIKEX YOUTUBE REELS & SHORTS SHOWCASE MANAGER
  renderAboutReelsManager(store) {
    const reels = store.getAboutReels ? store.getAboutReels() : (store.data.aboutReels || []);
    const activeCount = reels.filter(r => r && r.active !== false).length;

    return `
      <div style="display: flex; flex-direction: column; gap: 24px; max-width: 1050px;">
        
        <!-- Header Banner -->
        <div class="card" style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(99, 102, 241, 0.08)); border: 1.5px solid rgba(139, 92, 246, 0.3); padding: 24px; border-radius: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
            <div>
              <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(139, 92, 246, 0.15); color: #7C3AED; font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 999px; text-transform: uppercase;">
                <span>🎬</span>
                <span>Customer Storefront Media</span>
              </div>
              <h2 style="font-size: 24px; font-weight: 900; color: var(--text-main); margin-top: 8px; margin-bottom: 4px;">
                About LikeX YouTube Reels & Proofs Manager
              </h2>
              <p style="font-size: 14px; color: var(--text-secondary); margin: 0;">
                Add, manage, and reorder YouTube Shorts & Video links. These will instantly appear in the <strong>About LikeX</strong> tab between <em>24/7 WhatsApp VIP Support</em> and <em>10+ Years Trust Metrics</em>.
              </p>
            </div>

            <div style="display: flex; gap: 10px; align-items: center;">
              <span class="badge" style="background: #7C3AED; color: white; font-size: 13px; font-weight: 800; padding: 6px 14px; border-radius: 999px;">
                ${activeCount} Active Live Reels
              </span>
              <button class="btn btn-secondary btn-sm" onclick="AdminApp.resetDefaultReels()" title="Reset to official LikeX demo reels">
                🔄 Restore Defaults
              </button>
            </div>
          </div>
        </div>

        <!-- Two Column Content Grid: Add Form (Left) & Active Catalog (Right) -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 20px;">
          
          <!-- 1. Add New Reel Card -->
          <div class="card" style="padding: 24px; border-radius: 20px; border: 1.5px solid var(--border-color); display: flex; flex-direction: column; gap: 16px;">
            <div style="display: flex; align-items: center; gap: 10px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
              <span style="font-size: 22px;">➕</span>
              <div>
                <h3 style="font-size: 17px; font-weight: 800; margin: 0; color: var(--text-main);">Add New Reel / Short</h3>
                <p style="font-size: 12px; color: var(--text-secondary); margin: 0;">Supports YouTube Shorts, youtu.be, and regular URLs</p>
              </div>
            </div>

            <form onsubmit="AdminApp.addNewReel(event)" style="display: flex; flex-direction: column; gap: 14px;">
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" style="font-weight: 700; font-size: 12.5px;">YouTube Video / Shorts Link: *</label>
                <input 
                  type="url" 
                  id="admin-new-reel-url" 
                  class="form-input" 
                  placeholder="https://youtube.com/shorts/... or youtu.be/..." 
                  required 
                  style="min-height: 44px; border-radius: 12px; font-size: 13px;"
                  oninput="AdminApp.handleReelUrlPreview(this.value)"
                />
              </div>

              <!-- Live Instant Preview Box -->
              <div id="admin-new-reel-preview-box" style="border-radius: 12px; overflow: hidden; border: 1.5px solid var(--border-color); background: #0F172A; min-height: 140px; display: flex; align-items: center; justify-content: center; position: relative;">
                <div style="text-align: center; color: #94A3B8; padding: 16px;">
                  <div style="font-size: 26px; margin-bottom: 4px;">🎬</div>
                  <div style="font-size: 12.5px; font-weight: 700;">Live Preview Container</div>
                  <div style="font-size: 11px; margin-top: 2px;">Paste YouTube link above to preview thumbnail</div>
                </div>
              </div>

              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" style="font-weight: 700; font-size: 12.5px;">Reel Title / Caption: *</label>
                <input 
                  type="text" 
                  id="admin-new-reel-title" 
                  class="form-input" 
                  placeholder="e.g. 10K Followers in 60s Live Proof! ⚡" 
                  required 
                  style="min-height: 44px; border-radius: 12px; font-size: 13px;"
                />
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label" style="font-weight: 700; font-size: 12.5px;">Badge / Tag:</label>
                  <select id="admin-new-reel-badge" class="form-select" style="min-height: 44px; border-radius: 12px; font-size: 12.5px; font-weight: 700;">
                    <option value="🔥 Live Proof">🔥 Live Proof</option>
                    <option value="👑 Official Guide">👑 Official Guide</option>
                    <option value="⚡ Instant Speed">⚡ Instant Speed</option>
                    <option value="✨ Client Review">✨ Client Review</option>
                    <option value="🚀 Viral Boost">🚀 Viral Boost</option>
                    <option value="💰 Lowest Rate">💰 Lowest Rate</option>
                    <option value="🛡️ 365D Refill">🛡️ 365D Refill</option>
                  </select>
                </div>

                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label" style="font-weight: 700; font-size: 12.5px;">Views Tag:</label>
                  <input 
                    type="text" 
                    id="admin-new-reel-views" 
                    class="form-input" 
                    placeholder="e.g. 52.4K views" 
                    value="48.5K views"
                    style="min-height: 44px; border-radius: 12px; font-size: 13px;"
                  />
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label" style="font-weight: 700; font-size: 12.5px;">Duration:</label>
                  <input 
                    type="text" 
                    id="admin-new-reel-duration" 
                    class="form-input" 
                    placeholder="e.g. 0:45" 
                    value="0:45"
                    style="min-height: 44px; border-radius: 12px; font-size: 13px;"
                  />
                </div>

                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label" style="font-weight: 700; font-size: 12.5px;">Status:</label>
                  <select id="admin-new-reel-active" class="form-select" style="min-height: 44px; border-radius: 12px; font-size: 12.5px; font-weight: 700;">
                    <option value="true">✅ Visible (Active)</option>
                    <option value="false">❌ Hidden (Draft)</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                class="btn btn-primary btn-block btn-lg" 
                style="margin-top: 6px; font-weight: 800; border-radius: 12px; height: 48px; background: linear-gradient(135deg, #7C3AED, #4F46E5);"
              >
                <span>Publish Reel to Storefront 🚀</span>
              </button>
            </form>
          </div>

          <!-- 2. Existing Reels Showcase Management -->
          <div class="card" style="padding: 24px; border-radius: 20px; border: 1.5px solid var(--border-color); display: flex; flex-direction: column; gap: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 22px;">📱</span>
                <div>
                  <h3 style="font-size: 17px; font-weight: 800; margin: 0; color: var(--text-main);">Current Reels Catalog</h3>
                  <p style="font-size: 12px; color: var(--text-secondary); margin: 0;">Total ${reels.length} Reels configured</p>
                </div>
              </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 12px; max-height: 600px; overflow-y: auto; padding-right: 4px;">
              ${reels.length === 0 ? `
                <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
                  <div style="font-size: 36px; margin-bottom: 8px;">🎬</div>
                  <p style="font-weight: 700;">No Reels in Showcase</p>
                  <p style="font-size: 12px;">Add a YouTube reel above to display it on the customer storefront.</p>
                </div>
              ` : reels.map((r, idx) => {
                const thumb = (store.getYouTubeThumbnailUrl ? store.getYouTubeThumbnailUrl(r.videoUrl) : '') || 
                  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80';
                return `
                  <div style="display: flex; align-items: center; gap: 10px; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 14px; padding: 10px 12px; transition: border-color 0.2s;">
                    <!-- Reorder Up/Down Column -->
                    <div style="display: flex; flex-direction: column; gap: 3px; align-items: center; flex-shrink: 0;">
                      <button 
                        type="button" 
                        class="btn btn-sm btn-secondary" 
                        style="padding: 2px 5px; font-size: 10px; line-height: 1; border-radius: 4px; ${idx === 0 ? 'opacity: 0.3; cursor: not-allowed;' : ''}" 
                        onclick="AdminApp.moveReel('${r.id}', 'up')" 
                        title="Move Up (Appear Earlier)"
                        ${idx === 0 ? 'disabled' : ''}
                      >⬆️</button>
                      <button 
                        type="button" 
                        class="btn btn-sm btn-secondary" 
                        style="padding: 2px 5px; font-size: 10px; line-height: 1; border-radius: 4px; ${idx === reels.length - 1 ? 'opacity: 0.3; cursor: not-allowed;' : ''}" 
                        onclick="AdminApp.moveReel('${r.id}', 'down')" 
                        title="Move Down (Appear Later)"
                        ${idx === reels.length - 1 ? 'disabled' : ''}
                      >⬇️</button>
                    </div>

                    <!-- Thumbnail -->
                    <div style="position: relative; width: 56px; height: 76px; border-radius: 8px; overflow: hidden; flex-shrink: 0; background: #000;">
                      <img src="${thumb}" alt="${r.title}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80'" />
                      <div style="position: absolute; bottom: 2px; right: 2px; background: rgba(0,0,0,0.7); color: #fff; font-size: 8.5px; font-weight: 700; padding: 1px 4px; border-radius: 3px;">
                        ${r.duration || '0:45'}
                      </div>
                    </div>

                    <!-- Details -->
                    <div style="flex: 1; min-width: 0;">
                      <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                        <span style="font-size: 11px; font-weight: 900; color: var(--primary);">#${idx + 1}</span>
                        <span style="background: rgba(124, 58, 237, 0.12); color: #7C3AED; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 999px;">
                          ${r.badge || '🔥 Live Proof'}
                        </span>
                        <span style="font-size: 10.5px; color: var(--text-muted);">
                          ${r.views || ''}
                        </span>
                        <span style="font-size: 10px; font-weight: 800; padding: 1px 6px; border-radius: 5px; ${r.active !== false ? 'background: #DCFCE7; color: #166534;' : 'background: #FEE2E2; color: #991B1B;'}">
                          ${r.active !== false ? '✅ Active' : '❌ Hidden'}
                        </span>
                      </div>

                      <h4 style="font-size: 13px; font-weight: 700; color: var(--text-main); margin: 3px 0 2px; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${r.title}">
                        ${r.title}
                      </h4>

                      <a href="${r.videoUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 10.5px; color: var(--primary); text-decoration: underline; overflow: hidden; text-overflow: ellipsis; display: block; white-space: nowrap;">
                        ${r.videoUrl} ↗
                      </a>
                    </div>

                    <!-- Actions -->
                    <div style="display: flex; flex-direction: column; gap: 3px; flex-shrink: 0;">
                      <div style="display: flex; gap: 4px;">
                        <button 
                          type="button" 
                          class="btn btn-sm btn-outline" 
                          style="padding: 3px 7px; font-size: 10.5px; font-weight: 700;" 
                          onclick="AdminApp.testPlayReel('${r.videoUrl}', '${r.title.replace(/'/g, "\\'")}')" 
                          title="Test Play Video"
                        >
                          ▶ Play
                        </button>
                        <button 
                          type="button" 
                          class="btn btn-sm btn-secondary" 
                          style="padding: 3px 7px; font-size: 10.5px; font-weight: 700; color: #4F46E5;" 
                          onclick="AdminApp.openEditReelModal('${r.id}')" 
                          title="Edit Reel Title, URL & Details"
                        >
                          ✏️ Edit
                        </button>
                      </div>
                      <div style="display: flex; gap: 4px;">
                        <button 
                          type="button" 
                          class="btn btn-sm btn-secondary" 
                          style="padding: 3px 7px; font-size: 10.5px; flex: 1;" 
                          onclick="AdminApp.toggleReel('${r.id}')" 
                          title="${r.active !== false ? 'Hide Reel' : 'Show Reel'}"
                        >
                          ${r.active !== false ? '👁️ Hide' : '👁️ Show'}
                        </button>
                        <button 
                          type="button" 
                          class="btn btn-sm btn-outline" 
                          style="padding: 3px 7px; font-size: 10.5px; color: var(--error); border-color: var(--error);" 
                          onclick="AdminApp.deleteReel('${r.id}')" 
                          title="Delete Reel"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // WALLET & EARN MONEY VIDEO TUTORIALS SETTINGS MANAGER
  renderWalletSettings(store) {
    const earnTutorial = (store.data && store.data.earnTutorial) || {
      enabled: true,
      videoUrl: '',
      title: 'How to Earn ₹30,00,000/Month Starting Your SMM Reselling Business',
      description: 'Watch this complete step-by-step video blueprint on how to buy SMM services at direct wholesale prices and resell to clients with 300% to 1000% pure profit.'
    };
    const earnEmbedUrl = store.extractYouTubeEmbedUrl ? store.extractYouTubeEmbedUrl(earnTutorial.videoUrl) : '';

    const walletTutorial = (store.data && store.data.walletTutorial) || {
      enabled: true,
      videoUrl: '',
      title: 'How to Add Funds via UPI QR & UTR',
      description: 'Watch this step-by-step video guide to add instant funds to your LikeX wallet using Paytm, PhonePe, or Google Pay.'
    };
    const walletEmbedUrl = store.extractYouTubeEmbedUrl ? store.extractYouTubeEmbedUrl(walletTutorial.videoUrl) : '';

    return `
      <div style="display: flex; flex-direction: column; gap: 24px; max-width: 1000px;">
        <!-- Header Banner -->
        <div class="card" style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(168, 85, 247, 0.08)); border: 1.5px solid rgba(99, 102, 241, 0.3); padding: 24px; border-radius: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
            <div>
              <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(99, 102, 241, 0.15); color: #4F46E5; font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 999px;">
                <span>🎥 VIDEO TUTORIALS & GUIDES</span>
              </div>
              <h2 style="font-size: 24px; font-weight: 900; color: var(--text-main); margin-top: 8px; margin-bottom: 4px;">
                YouTube Video Guides Configuration
              </h2>
              <p style="font-size: 14px; color: var(--text-secondary); margin: 0;">
                Configure YouTube unlisted or public videos for <strong>"How to Earn Money"</strong> and <strong>"Add Funds Wallet"</strong> pages.
              </p>
            </div>
            <div style="display: flex; gap: 8px;">
              <button type="button" onclick="window.navigateToRoute('/')" class="btn btn-secondary" style="font-weight: 700; border-radius: 12px;">
                👁️ View Customer App
              </button>
            </div>
          </div>
        </div>

        <!-- 1. HOW TO EARN MONEY VIDEO CONFIGURATION CARD -->
        <div class="card" style="padding: 26px; border: 1.5px solid rgba(16, 185, 129, 0.3); border-radius: 20px; background: linear-gradient(145deg, rgba(16, 185, 129, 0.02), var(--bg-surface));">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; flex-wrap: wrap; gap: 8px;">
            <h3 style="font-size: 18px; font-weight: 900; color: var(--text-main); margin: 0; display: flex; align-items: center; gap: 8px;">
              <span>💰</span>
              <span>1. 'How to Earn Money' Video Tutorial (Reseller Page)</span>
            </h3>
            <span class="badge badge-success" style="font-size: 11px; font-weight: 800;">GROW & EARN TAB</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 16px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-weight: 800; font-size: 13.5px;">
                <span>YouTube Unlisted / Public Video URL:</span>
                <span class="form-label-hint">Paste unlisted link, watch URL, or shorts</span>
              </label>
              <input 
                type="text" 
                id="admin-earn-video-url" 
                class="form-input" 
                value="${earnTutorial.videoUrl || ''}" 
                placeholder="e.g. https://youtu.be/xxxxxx or https://www.youtube.com/watch?v=xxxxxx" 
                style="font-size: 14px; font-weight: 600; min-height: 48px; border-radius: 12px;" 
                oninput="AdminApp.previewEarnVideoUrl(this.value)"
              />
              <div style="font-size: 12px; color: var(--text-muted); margin-top: 5px;">
                💡 <strong>Supports all YouTube formats:</strong> Unlisted link (<code>https://youtu.be/xxxx</code>), standard link, shorts, or direct 11-digit video ID.
              </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" style="font-weight: 700; font-size: 13px;">Tutorial Heading / Title:</label>
                <input 
                  type="text" 
                  id="admin-earn-video-title" 
                  class="form-input" 
                  value="${earnTutorial.title || 'How to Earn ₹30,000–₹1,00,000/Month Starting Your SMM Reselling Business'}" 
                  style="min-height: 46px; border-radius: 12px;" 
                />
              </div>

              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" style="font-weight: 700; font-size: 13px;">Visibility in 'How to Earn' Page:</label>
                <select id="admin-earn-video-enabled" class="form-select" style="min-height: 46px; border-radius: 12px; font-weight: 700;">
                  <option value="true" ${earnTutorial.enabled ? 'selected' : ''}>✅ Visible to Customers</option>
                  <option value="false" ${!earnTutorial.enabled ? 'selected' : ''}>❌ Hidden / Disabled</option>
                </select>
              </div>
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-weight: 700; font-size: 13px;">Description / Instructions:</label>
              <textarea 
                id="admin-earn-video-desc" 
                class="form-textarea" 
                rows="2" 
                style="border-radius: 12px; font-size: 13.5px;"
              >${earnTutorial.description || ''}</textarea>
            </div>

            <div style="border-top: 1px dashed var(--border-color); padding-top: 14px;">
              <label style="font-weight: 800; font-size: 13px; color: var(--text-main); display: block; margin-bottom: 8px;">
                📺 Live Preview ('How to Earn Money' Video):
              </label>
              <div id="admin-earn-preview-box" style="max-width: 500px; border-radius: 16px; overflow: hidden; border: 1.5px solid var(--border-color); background: #000;">
                ${earnEmbedUrl ? `
                  <div style="position: relative; padding-bottom: 56.25%; height: 0;">
                    <iframe 
                      src="${earnEmbedUrl}" 
                      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" 
                      allowfullscreen
                    ></iframe>
                  </div>
                ` : `
                  <div style="padding: 32px 20px; text-align: center; color: #94A3B8;">
                    <div style="font-size: 30px; margin-bottom: 4px;">🎥</div>
                    <div style="font-weight: 700;">No Video URL set yet</div>
                    <div style="font-size: 12px;">Paste a YouTube link above to see live preview.</div>
                  </div>
                `}
              </div>
            </div>

            <div style="display: flex; justify-content: flex-end; margin-top: 6px;">
              <button 
                type="button" 
                class="btn btn-primary" 
                onclick="AdminApp.saveEarnTutorialSettings()" 
                style="font-weight: 800; padding: 10px 28px; border-radius: 12px;"
              >
                💾 Save 'How to Earn' Video Settings
              </button>
            </div>
          </div>
        </div>

        <!-- 2. WALLET ADD FUNDS VIDEO CONFIGURATION CARD -->
        <div class="card" style="padding: 26px; border: 1.5px solid rgba(99, 102, 241, 0.3); border-radius: 20px; background: linear-gradient(145deg, rgba(99, 102, 241, 0.02), var(--bg-surface));">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; flex-wrap: wrap; gap: 8px;">
            <h3 style="font-size: 18px; font-weight: 900; color: var(--text-main); margin: 0; display: flex; align-items: center; gap: 8px;">
              <span>💳</span>
              <span>2. 'How to Add Funds' Video Tutorial (Wallet Page)</span>
            </h3>
            <span class="badge badge-primary" style="font-size: 11px; font-weight: 800;">WALLET TAB</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 16px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-weight: 800; font-size: 13.5px;">
                <span>YouTube Unlisted / Public Video URL:</span>
                <span class="form-label-hint">Paste unlisted link, watch URL, or shorts</span>
              </label>
              <input 
                type="text" 
                id="admin-wallet-video-url" 
                class="form-input" 
                value="${walletTutorial.videoUrl || ''}" 
                placeholder="e.g. https://youtu.be/xxxxxx or https://www.youtube.com/watch?v=xxxxxx" 
                style="font-size: 14px; font-weight: 600; min-height: 48px; border-radius: 12px;" 
                oninput="AdminApp.previewWalletVideoUrl(this.value)"
              />
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" style="font-weight: 700; font-size: 13px;">Tutorial Heading / Title:</label>
                <input 
                  type="text" 
                  id="admin-wallet-video-title" 
                  class="form-input" 
                  value="${walletTutorial.title || 'How to Add Funds via UPI QR & UTR'}" 
                  style="min-height: 46px; border-radius: 12px;" 
                />
              </div>

              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" style="font-weight: 700; font-size: 13px;">Visibility in Wallet Screen:</label>
                <select id="admin-wallet-video-enabled" class="form-select" style="min-height: 46px; border-radius: 12px; font-weight: 700;">
                  <option value="true" ${walletTutorial.enabled ? 'selected' : ''}>✅ Visible in Customer Wallet</option>
                  <option value="false" ${!walletTutorial.enabled ? 'selected' : ''}>❌ Hidden / Disabled</option>
                </select>
              </div>
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-weight: 700; font-size: 13px;">Description / Instructions Note:</label>
              <textarea 
                id="admin-wallet-video-desc" 
                class="form-textarea" 
                rows="2" 
                style="border-radius: 12px; font-size: 13.5px;"
              >${walletTutorial.description || ''}</textarea>
            </div>

            <div style="border-top: 1px dashed var(--border-color); padding-top: 14px;">
              <label style="font-weight: 800; font-size: 13px; color: var(--text-main); display: block; margin-bottom: 8px;">
                📺 Live Preview ('Add Funds' Video):
              </label>
              <div id="admin-video-preview-box" style="max-width: 500px; border-radius: 16px; overflow: hidden; border: 1.5px solid var(--border-color); background: #000;">
                ${walletEmbedUrl ? `
                  <div style="position: relative; padding-bottom: 56.25%; height: 0;">
                    <iframe 
                      src="${walletEmbedUrl}" 
                      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" 
                      allowfullscreen
                    ></iframe>
                  </div>
                ` : `
                  <div style="padding: 32px 20px; text-align: center; color: #94A3B8;">
                    <div style="font-size: 30px; margin-bottom: 4px;">🎥</div>
                    <div style="font-weight: 700;">No Video URL set yet</div>
                    <div style="font-size: 12px;">Paste a YouTube link above to see live preview.</div>
                  </div>
                `}
              </div>
            </div>

            <div style="display: flex; justify-content: flex-end; margin-top: 6px;">
              <button 
                type="button" 
                class="btn btn-primary" 
                onclick="AdminApp.saveWalletTutorialSettings()" 
                style="font-weight: 800; padding: 10px 28px; border-radius: 12px;"
              >
                💾 Save Wallet Video Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // DEDICATED LOW BALANCE & QUEUED ORDER ALERTS MANAGER TAB
  renderAlertsManager(store) {
    const allOrders = (store.getAllAdminOrders ? store.getAllAdminOrders() : store.data.orders) || [];
    const queuedOrders = allOrders.filter(o => o && (o.isQueued || o.needsTopup));
    const alertConfig = store.getAlertConfig();
    const wosProv = (store.data.providers || []).find(p => p.id === 'p2');
    const sfProv = (store.data.providers || []).find(p => p.id === 'p3');
    const wosBal = Number(wosProv?.balance || 0);
    const sfBal = Number(sfProv?.balance || 0);

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
                Whenever WorldOfSMM or SocialFans balance drops below ₹${alertConfig.threshold || 100}, or a customer places an order requiring top-up, you receive instant alerts on WhatsApp & Gmail.
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
              <span style="font-weight: 800; font-size: 15px; color: var(--text-main);">🇮🇳 WorldOfSMM (India)</span>
              <span class="badge ${wosBal > (Number(alertConfig.threshold || 100) / 85) ? 'badge-success' : 'badge-danger'}">
                ${wosBal > (Number(alertConfig.threshold || 100) / 85) ? '✓ Funded' : '⚠️ Low Balance'}
              </span>
            </div>
            <div style="font-size: 28px; font-weight: 900; color: #10B981; font-family: monospace;">
              $${wosBal.toFixed(2)} USD
            </div>
            <div style="font-size: 12.5px; color: var(--text-secondary); margin-top: 4px;">
              Approx: <strong>₹${(wosBal * 85).toFixed(2)} INR</strong> • Threshold: ₹${alertConfig.threshold || 100}
            </div>
          </div>

          <div class="card" style="padding: 20px; border: 1.5px solid var(--border-color); border-radius: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <span style="font-weight: 800; font-size: 15px; color: var(--text-main);">🔥 SocialFans (Direct API)</span>
              <span class="badge ${sfBal > Number(alertConfig.threshold || 100) ? 'badge-success' : 'badge-danger'}">
                ${sfBal > Number(alertConfig.threshold || 100) ? '✓ Funded' : '⚠️ Low Balance'}
              </span>
            </div>
            <div style="font-size: 28px; font-weight: 900; color: #F59E0B; font-family: monospace;">
              ₹${sfBal.toFixed(2)} INR
            </div>
            <div style="font-size: 12.5px; color: var(--text-secondary); margin-top: 4px;">
              Direct INR Balance • Threshold: ₹${alertConfig.threshold || 100}
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
                🤖 Telegram Bot Token:
              </label>
              <input type="text" id="admin-alert-tg-token" class="form-input" value="${alertConfig.telegramBotToken || '8874080054:AAFazn2iknlJMDppQuXlTM0UwQsYFP9Dwik'}" placeholder="e.g. 8874080054:AAFazn2iknl..." style="font-weight: 700; font-size: 13px; font-family: monospace;" />
              <p style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                Your LikeX Alert Telegram Bot token.
              </p>
            </div>

            <div>
              <label style="font-size: 13px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 6px;">
                💬 Telegram Chat ID:
              </label>
              <input type="text" id="admin-alert-tg-chatid" class="form-input" value="${alertConfig.telegramChatId || '2057136429'}" placeholder="e.g. 2057136429" style="font-weight: 700; font-size: 14px; font-family: monospace;" />
              <p style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                Your personal Telegram Chat ID.
              </p>
            </div>

            <div>
              <label style="font-size: 13px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 6px;">
                📧 Gmail Notification Email:
              </label>
              <input type="email" id="admin-alert-email" class="form-input" value="${alertConfig.adminEmail || 'support@likex.in'}" placeholder="e.g. support@likex.in" style="font-weight: 700; font-size: 14px;" />
              <p style="font-size: 12px; color: #10B981; margin-top: 4px; font-weight: 700;">
                ✓ Active & Verified (support@likex.in)
              </p>
            </div>

            <div>
              <label style="font-size: 13px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 6px;">
                📉 Warning Threshold Amount (₹ INR):
              </label>
              <input type="number" id="admin-alert-threshold" class="form-input" value="${alertConfig.threshold || 100}" placeholder="100" style="font-weight: 700; font-size: 14px;" />
              <p style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                Triggers when provider balance drops below this amount.
              </p>
            </div>
          </div>

          <div style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px;">
            <button class="btn btn-primary" onclick="AdminApp.saveAlertSettings()" style="font-weight: 800; padding: 10px 26px; border-radius: 12px;">
              💾 Save Alert Settings
            </button>
          </div>
        </div>

        <!-- 4. META (FACEBOOK) PIXEL & ADS CONVERSION TRACKING CARD -->
        <div class="card" style="padding: 26px; border: 1.5px solid rgba(59, 130, 246, 0.4); border-radius: 20px; background: linear-gradient(145deg, rgba(59, 130, 246, 0.04), var(--bg-surface));">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; flex-wrap: wrap; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 38px; height: 38px; border-radius: 12px; background: #1877F2; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 22px;">
                f
              </div>
              <div>
                <h3 style="font-size: 18px; font-weight: 900; color: var(--text-main); margin: 0;">
                  Meta (Facebook) Pixel & Ads Conversion Tracking
                </h3>
                <p style="font-size: 13px; color: var(--text-secondary); margin: 2px 0 0;">
                  Track PageViews, ViewContent, InitiateCheckout, UPI QR payments, and Purchase conversions.
                </p>
              </div>
            </div>
            <span class="badge badge-success" style="font-size: 12px; font-weight: 800; padding: 6px 14px;">
              🟢 ACTIVE & TRACKING
            </span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-weight: 800; font-size: 13.5px;">
                <span>Meta Pixel ID:</span>
                <span class="form-label-hint">15-16 digit Meta Dataset / Pixel ID</span>
              </label>
              <input 
                type="text" 
                id="admin-meta-pixel-id" 
                class="form-input" 
                value="${(store.data.pixelSettings && store.data.pixelSettings.pixelId) || '1107755188608830'}" 
                placeholder="1107755188608830" 
                style="font-size: 15px; font-weight: 800; min-height: 48px; border-radius: 12px; letter-spacing: 0.5px;" 
              />
            </div>

            <div style="display: flex; flex-direction: column; justify-content: flex-end; gap: 8px;">
              <label class="form-label" style="font-weight: 800; font-size: 13.5px;">
                <span>Tracking Status & Controls:</span>
              </label>
              <div style="display: flex; gap: 10px;">
                <button type="button" class="btn btn-primary" onclick="AdminApp.savePixelSettings()" style="flex: 1; font-weight: 800; min-height: 48px; border-radius: 12px;">
                  💾 Save & Sync Pixel ID
                </button>
                <button type="button" class="btn btn-secondary" onclick="AdminApp.testMetaPixel()" style="font-weight: 700; min-height: 48px; border-radius: 12px; padding: 0 16px;" title="Send test event">
                  ⚡ Test Event
                </button>
              </div>
            </div>
          </div>

          <!-- Active Events Grid -->
          <div style="margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--border-color);">
            <div style="font-size: 12.5px; font-weight: 800; color: var(--text-secondary); margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">
              ⚡ Configured Live Standard Events:
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              <span class="badge" style="background: rgba(59, 130, 246, 0.12); color: #2563EB; font-weight: 700; font-size: 12px; padding: 5px 12px; border-radius: 8px;">
                ✓ PageView (All SPA Tabs)
              </span>
              <span class="badge" style="background: rgba(16, 185, 129, 0.12); color: #059669; font-weight: 700; font-size: 12px; padding: 5px 12px; border-radius: 8px;">
                ✓ ViewContent (Services & Categories)
              </span>
              <span class="badge" style="background: rgba(245, 158, 11, 0.12); color: #D97706; font-weight: 700; font-size: 12px; padding: 5px 12px; border-radius: 8px;">
                ✓ InitiateCheckout (Order Placement)
              </span>
              <span class="badge" style="background: rgba(139, 92, 246, 0.12); color: #7C3AED; font-weight: 700; font-size: 12px; padding: 5px 12px; border-radius: 8px;">
                ✓ AddPaymentInfo (UPI QR Deposit)
              </span>
              <span class="badge" style="background: rgba(236, 72, 153, 0.12); color: #DB2777; font-weight: 700; font-size: 12px; padding: 5px 12px; border-radius: 8px;">
                ✓ Purchase (Completed Orders & Topups)
              </span>
              <span class="badge" style="background: rgba(6, 182, 212, 0.12); color: #0891B2; font-weight: 700; font-size: 12px; padding: 5px 12px; border-radius: 8px;">
                ✓ CompleteRegistration / Lead
              </span>
              <span class="badge" style="background: rgba(34, 197, 94, 0.12); color: #16A34A; font-weight: 700; font-size: 12px; padding: 5px 12px; border-radius: 8px;">
                ✓ Contact (WhatsApp & Telegram)
              </span>
            </div>
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
    const allOrders = (store.getAllAdminOrders ? store.getAllAdminOrders() : store.data.orders) || [];
    const recentOrders = allOrders.slice(0, 5);
    const alertConfig = store.getAlertConfig();

    return `
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
          <div class="kpi-label">WorldOfSMM Balance</div>
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
                  <th style="min-width: 140px;">ORDER ID & TIME</th>
                  <th style="min-width: 150px;">CUSTOMER</th>
                  <th style="min-width: 200px;">CUSTOMER SERVICE</th>
                  <th style="min-width: 160px;">TARGET URL</th>
                  <th style="min-width: 80px;">QTY</th>
                  <th style="min-width: 90px;">CHARGE</th>
                  <th style="min-width: 110px;">STATUS</th>
                </tr>
              </thead>
              <tbody>
                ${recentOrders.map(ro => {
                  const sId = this.getOrderServiceId(ro);
                  const custEmail = ro.userEmail || ro.customerEmail || '';
                  const custName = ro.customerName || (custEmail ? custEmail.split('@')[0] : 'Guest Customer');
                  const avatarLetter = (custName || 'U').charAt(0).toUpperCase();
                  const dateStr = ro.date || (ro.createdAt ? store.formatRealDate(ro.createdAt) : 'Recently');
                  const relativeBadge = store.formatOrderDisplayDate ? store.formatOrderDisplayDate(ro) : '';

                  let platformIcon = '⚡';
                  const lowSvc = (ro.serviceName || '').toLowerCase();
                  if (lowSvc.includes('instagram') || ro.platform === 'instagram') platformIcon = '📸';
                  else if (lowSvc.includes('youtube') || ro.platform === 'youtube') platformIcon = '▶️';
                  else if (lowSvc.includes('tiktok') || ro.platform === 'tiktok') platformIcon = '🎵';
                  else if (lowSvc.includes('twitter') || lowSvc.includes(' x ') || ro.platform === 'twitter') platformIcon = '🐦';
                  else if (lowSvc.includes('telegram') || ro.platform === 'telegram') platformIcon = '✈️';
                  else if (lowSvc.includes('facebook') || ro.platform === 'facebook') platformIcon = '📘';
                  else if (lowSvc.includes('spotify') || ro.platform === 'spotify') platformIcon = '🎧';

                  return `
                    <tr>
                      <td>
                        <div style="display: flex; flex-direction: column; gap: 2px;">
                          <div style="display: inline-flex; align-items: center; gap: 4px;">
                            <span style="font-family: var(--font-mono); font-weight: 800; color: var(--primary);">#${ro.id}</span>
                            <button type="button" title="Copy Order ID" onclick="navigator.clipboard.writeText('${ro.id}'); window.store.showToast('Order ID #${ro.id} copied!', 'success');" style="background: none; border: none; cursor: pointer; padding: 0; font-size: 11px; opacity: 0.6;">📋</button>
                          </div>
                          <span style="font-size: 10.5px; color: var(--text-muted);">${dateStr}</span>
                          ${relativeBadge && relativeBadge !== dateStr ? `<span style="font-size: 9.5px; font-weight: 700; color: #10B981;">• ${relativeBadge}</span>` : ''}
                        </div>
                      </td>
                      <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                          <div style="width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #6366F1, #8B5CF6); color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 12px; flex-shrink: 0;">
                            ${avatarLetter}
                          </div>
                          <div style="min-width: 0;">
                            <div style="font-weight: 700; font-size: 12.5px; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px;">
                              ${custName}
                            </div>
                            <div style="font-size: 11px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px;" title="${custEmail || 'Guest'}">
                              ${custEmail || 'Guest'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style="max-width: 220px;">
                        <div style="display: flex; align-items: center; gap: 6px;">
                          <span style="font-size: 14px;">${platformIcon}</span>
                          <span style="font-weight: 700; font-size: 12.5px; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${ro.serviceName}
                          </span>
                        </div>
                        <div style="font-size: 10.5px; font-family: var(--font-mono); color: var(--primary); margin-top: 2px;">
                          SVC #${sId}
                        </div>
                      </td>
                      <td style="max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; font-family: var(--font-mono);">
                        <a href="${ro.target}" target="_blank" rel="noopener noreferrer" style="color: var(--primary); text-decoration: underline;" title="${ro.target}">
                          ${ro.target || '—'}
                        </a>
                      </td>
                      <td><strong>${Number(ro.quantity || 1000).toLocaleString()}</strong></td>
                      <td><strong style="color: var(--primary); font-size: 13.5px;">${store.formatMoney(ro.amount)}</strong></td>
                      <td>
                        <span class="badge ${String(ro.status).toLowerCase() === 'completed' ? 'badge-success' : (String(ro.status).toLowerCase() === 'partial' ? 'badge-warning' : 'badge-primary')}" style="font-size: 11px; padding: 3px 8px;">
                          ${ro.status || 'Processing'}
                        </span>
                      </td>
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

      <!-- HEADER NOTIFICATION & NOTICE BOARD MANAGER (MULTI-LINE WITH EXACT GAPS) -->
      <div class="card" style="margin-top: 24px; padding: 24px; border: 1.5px solid #8B5CF6; background: var(--bg-surface); border-radius: 18px; box-shadow: 0 4px 20px rgba(139, 92, 246, 0.08);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
          <div>
            <div style="display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 800; color: #8B5CF6; text-transform: uppercase; letter-spacing: 0.5px;">
              <span>🔔</span> <span>STOREFRONT HEADER NOTIFICATION & NOTICE BOARD</span>
            </div>
            <h3 style="font-size: 20px; font-weight: 800; color: var(--text-main); margin-top: 2px;">
              Header Notice & Note Editor (Multi-Line & Gaps Preserved)
            </h3>
            <p style="font-size: 13px; color: var(--text-secondary);">
              This note opens when customers click the Bell (🔔) in the header. Enter, spaces, and line breaks are 100% preserved (no cramped text).
            </p>
          </div>

          <label style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 700; font-size: 13.5px;">
            <input type="checkbox" id="admin-notice-toggle" ${(store.data.headerNotification && store.data.headerNotification.enabled !== false) ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: #8B5CF6;" />
            <span>Enable Header Notice</span>
          </label>
        </div>

        <!-- Notice Title Input -->
        <div class="form-group" style="margin-bottom: 14px;">
          <label class="form-label" style="font-weight: 700; font-size: 13px;">Notice Title</label>
          <input 
            type="text" 
            id="admin-notice-title" 
            class="form-input" 
            style="font-weight: 700; border-radius: 12px; padding: 10px 14px;" 
            value="${(store.data.headerNotification && store.data.headerNotification.title) || '📢 Official Notice & Updates'}" 
            placeholder="e.g. 📢 Important Notice & Server Updates"
            oninput="AdminApp.updateNoticePreview()"
          />
        </div>

        <!-- Input Area (Preserves Enters & Gaps) -->
        <div class="form-group" style="margin-bottom: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <label class="form-label" style="font-weight: 700; font-size: 13px; margin: 0;">Notice Message Text / Note</label>
            <span style="font-size: 11px; font-weight: 600; color: #10B981; background: rgba(16, 185, 129, 0.1); padding: 2px 8px; border-radius: 6px;">
              ✓ Exact Enters & Gaps Preserved (No Cramping)
            </span>
          </div>
          <textarea 
            id="admin-notice-message" 
            class="form-input" 
            rows="6" 
            style="width: 100%; border-radius: 12px; font-size: 13.5px; line-height: 1.6; padding: 14px; resize: vertical; font-family: inherit;"
            placeholder="Yahan aap jo bhi likhenge (enter, gap, bullet points) customer ko exact waisa hi khula-khula dikhega..."
            oninput="AdminApp.updateNoticePreview()"
          >${(store.data.headerNotification && store.data.headerNotification.message) || ''}</textarea>
        </div>

        <!-- Live Accurate Preview with white-space: pre-wrap -->
        <div style="margin-bottom: 16px;">
          <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary); margin-bottom: 6px; display: block;">
            Live Customer Preview (Exact Spacing & Gaps):
          </label>
          <div style="background: var(--bg-subtle); border: 1.5px dashed #8B5CF6; border-radius: 14px; padding: 16px;">
            <div style="font-weight: 800; font-size: 15px; color: var(--text-main); margin-bottom: 8px;" id="admin-notice-preview-title">
              ${(store.data.headerNotification && store.data.headerNotification.title) || '📢 Official Notice & Updates'}
            </div>
            <div style="font-size: 13.5px; line-height: 1.65; color: var(--text-main); white-space: pre-wrap; word-break: break-word;" id="admin-notice-preview-body">
              ${(store.data.headerNotification && store.data.headerNotification.message) || 'No notice content set yet.'}
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
          <button class="btn btn-primary" onclick="AdminApp.saveHeaderNotification()" style="font-weight: 800; padding: 11px 26px; border-radius: 12px; background: linear-gradient(135deg, #6366F1, #8B5CF6); box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);">
            💾 Save Notification Note (Live Cloud Sync)
          </button>
          <button type="button" class="btn btn-secondary" onclick="AdminApp.insertNoticeTemplate()" style="font-size: 12.5px; font-weight: 700; padding: 11px 18px; border-radius: 12px;">
            📝 Insert Sample Template
          </button>
        </div>
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
            <input type="text" id="admin-alert-whatsapp" class="form-input" value="${alertConfig.whatsappNumber || '9837371137'}" placeholder="e.g. 9837371137" style="font-weight: 700;" />
            <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 4px;">
              Alerts delivered directly to your personal phone number (+91 9837371137).
            </div>
          </div>

          <div style="background: var(--bg-subtle); padding: 16px; border-radius: 14px; border: 1px solid var(--border-color);">
            <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 6px;">
              📧 Gmail Notification Address:
            </label>
            <input type="email" id="admin-alert-email" class="form-input" value="${alertConfig.adminEmail || 'support@likex.in'}" placeholder="e.g. support@likex.in" style="font-weight: 700;" />
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

      <!-- STOREFRONT MAINTENANCE MODE MANAGER -->
      <div class="card" style="margin-top: 24px; padding: 24px; border: 2px solid ${store.data.maintenanceMode?.enabled ? '#F59E0B' : 'var(--border-color)'}; background: ${store.data.maintenanceMode?.enabled ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.09), rgba(239, 68, 68, 0.05))' : 'var(--bg-surface)'}; border-radius: 18px; box-shadow: ${store.data.maintenanceMode?.enabled ? '0 8px 24px rgba(245, 158, 11, 0.15)' : 'none'};">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; margin-bottom: 16px;">
          <div>
            <div style="display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 800; color: #F59E0B; text-transform: uppercase; letter-spacing: 0.5px;">
              <span>🚧</span> <span>STOREFRONT ACCESS LOCK</span>
            </div>
            <h3 style="font-size: 20px; font-weight: 800; color: var(--text-main); margin-top: 3px;">
              Website Maintenance Mode
            </h3>
            <p style="font-size: 13px; color: var(--text-secondary); margin-top: 3px; max-width: 680px;">
              When turned ON, regular customers see a modern maintenance screen with your direct WhatsApp VIP link. You (Admin) can still preview and access the website using your Admin password.
            </p>
          </div>

          <label style="display: inline-flex; align-items: center; gap: 10px; cursor: pointer; font-weight: 800; font-size: 14px; background: ${store.data.maintenanceMode?.enabled ? '#FEF3C7' : 'var(--bg-subtle)'}; padding: 10px 18px; border-radius: 12px; border: 1.5px solid ${store.data.maintenanceMode?.enabled ? '#F59E0B' : 'var(--border-color)'}; transition: all 0.2s;">
            <input type="checkbox" id="admin-maintenance-toggle" ${store.data.maintenanceMode?.enabled ? 'checked' : ''} onchange="AdminApp.toggleMaintenanceMode(this.checked)" style="width: 20px; height: 20px; cursor: pointer;" />
            <span style="color: ${store.data.maintenanceMode?.enabled ? '#B45309' : 'var(--text-main)'};">
              ${store.data.maintenanceMode?.enabled ? '⚠️ Maintenance Mode is ACTIVE (Storefront Locked)' : '✅ Storefront is LIVE (Normal Access)'}
            </span>
          </label>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; margin-top: 14px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-weight: 700; font-size: 12.5px;">Maintenance Heading / Title</label>
            <input type="text" id="admin-maint-title" class="form-input" value="${(store.data.maintenanceMode?.title || 'We are Upgrading Systems ⚙️').replace(/"/g, '&quot;')}" style="height: 44px; border-radius: 10px; font-weight: 700;" />
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-weight: 700; font-size: 12.5px;">Estimated Time / Return Badge</label>
            <input type="text" id="admin-maint-eta" class="form-input" value="${(store.data.maintenanceMode?.estimatedTime || 'Back online in a few minutes').replace(/"/g, '&quot;')}" style="height: 44px; border-radius: 10px;" />
          </div>
        </div>

        <div class="form-group" style="margin-top: 14px; margin-bottom: 16px;">
          <label class="form-label" style="font-weight: 700; font-size: 12.5px;">Notice Message to Customers</label>
          <textarea id="admin-maint-msg" class="form-input" rows="2" style="width: 100%; border-radius: 10px; padding: 10px; font-size: 13px;">${store.data.maintenanceMode?.message || 'LikeX is currently undergoing scheduled performance optimizations to provide you with faster delivery speeds. We will be back shortly!'}</textarea>
        </div>

        <button class="btn btn-primary" onclick="AdminApp.saveMaintenanceSettings()" style="font-weight: 800; padding: 10px 24px; border-radius: 12px;">
          💾 Save Maintenance Settings
        </button>
      </div>

      <!-- 💎 RECOMMENDED INSTAGRAM FOLLOWERS NOTICE MANAGER -->
      <div class="card" style="margin-top: 24px; padding: 24px; border: 2px solid ${store.data.recommendedFollowers?.enabled !== false ? '#8B5CF6' : 'var(--border-color)'}; background: ${store.data.recommendedFollowers?.enabled !== false ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.06), rgba(99, 102, 241, 0.04))' : 'var(--bg-surface)'}; border-radius: 18px; box-shadow: ${store.data.recommendedFollowers?.enabled !== false ? '0 8px 24px rgba(139, 92, 246, 0.12)' : 'none'};">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; margin-bottom: 16px;">
          <div>
            <div style="display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 800; color: #8B5CF6; text-transform: uppercase; letter-spacing: 0.5px;">
              <span>💎</span> <span>STOREFRONT CONVERSION & TRUST BOOSTER</span>
            </div>
            <h3 style="font-size: 20px; font-weight: 800; color: var(--text-main); margin-top: 3px;">
              Best Instagram Followers Notice Banner
            </h3>
            <p style="font-size: 13px; color: var(--text-secondary); margin-top: 3px; max-width: 680px;">
              Displays a high-trust recommendation notice card on the Storefront (between "Place New Order" and trust badges). Customers can click any recommended service ID to instantly select it.
            </p>
          </div>

          <label style="display: inline-flex; align-items: center; gap: 10px; cursor: pointer; font-weight: 800; font-size: 14px; background: ${store.data.recommendedFollowers?.enabled !== false ? '#F3E8FF' : 'var(--bg-subtle)'}; padding: 10px 18px; border-radius: 12px; border: 1.5px solid ${store.data.recommendedFollowers?.enabled !== false ? '#8B5CF6' : 'var(--border-color)'}; transition: all 0.2s;">
            <input type="checkbox" id="admin-rec-followers-toggle" ${store.data.recommendedFollowers?.enabled !== false ? 'checked' : ''} style="width: 20px; height: 20px; cursor: pointer;" />
            <span style="color: ${store.data.recommendedFollowers?.enabled !== false ? '#6B21A8' : 'var(--text-main)'};">
              ${store.data.recommendedFollowers?.enabled !== false ? '✅ Notice is ACTIVE on Storefront' : '⏸️ Notice is HIDDEN'}
            </span>
          </label>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-weight: 700; font-size: 12.5px;">Banner Headline / Title</label>
            <input type="text" id="admin-rec-followers-title" class="form-input" value="${(store.data.recommendedFollowers?.title || 'Best Non-Drop Instagram Followers [Tested & Verified]').replace(/"/g, '&quot;')}" style="height: 44px; border-radius: 10px; font-weight: 700;" />
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-weight: 700; font-size: 12.5px;">Top Badge Label</label>
            <input type="text" id="admin-rec-followers-badge" class="form-input" value="${(store.data.recommendedFollowers?.badgeText || '100% Non-Drop VIP').replace(/"/g, '&quot;')}" style="height: 44px; border-radius: 10px; font-weight: 700;" />
          </div>
        </div>

        <div class="form-group" style="margin-top: 14px; margin-bottom: 0;">
          <label class="form-label" style="font-weight: 700; font-size: 12.5px;">Recommended Service IDs (Comma-separated, e.g. 2868, 10323, 6435, 10349)</label>
          <input type="text" id="admin-rec-followers-ids" class="form-input" value="${(store.data.recommendedFollowers?.serviceIds || '2868, 10323, 6435, 10349').replace(/"/g, '&quot;')}" placeholder="e.g. 2868, 10323, 6435, 10349" style="height: 44px; border-radius: 10px; font-weight: 800; color: #6D28D9;" />
          <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 4px;">
            Tip: These service IDs appear as clickable quick-chips on the Storefront. Clicking an ID automatically selects it for the customer!
          </div>
        </div>

        <div class="form-group" style="margin-top: 14px; margin-bottom: 16px;">
          <label class="form-label" style="font-weight: 700; font-size: 12.5px;">Notice Message / Trust Guarantee</label>
          <textarea id="admin-rec-followers-notice" class="form-input" rows="2" style="width: 100%; border-radius: 10px; padding: 10px; font-size: 13px;">${store.data.recommendedFollowers?.notice || 'To prevent follower drops during Instagram updates, use LikeX verified Non-Drop service IDs. Fast & stable delivery:'}</textarea>
        </div>

        <button class="btn btn-primary" onclick="AdminApp.saveRecommendedFollowersSettings()" style="font-weight: 800; padding: 10px 24px; border-radius: 12px; background: linear-gradient(135deg, #8B5CF6, #6366F1);">
          💾 Save Recommended Followers Notice
        </button>
      </div>

      <!-- 🎥 SUPPORT TAB YOUTUBE VIDEO TUTORIAL MANAGER -->
      <div class="card" style="margin-top: 24px; padding: 24px; border: 2px solid ${store.data.supportVideo?.enabled ? '#10B981' : 'var(--border-color)'}; background: ${store.data.supportVideo?.enabled ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.06), rgba(6, 182, 212, 0.04))' : 'var(--bg-surface)'}; border-radius: 18px; box-shadow: ${store.data.supportVideo?.enabled ? '0 8px 24px rgba(16, 185, 129, 0.12)' : 'none'};">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; margin-bottom: 16px;">
          <div>
            <div style="display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 800; color: #059669; text-transform: uppercase; letter-spacing: 0.5px;">
              <span>🎬</span> <span>CUSTOMER EDUCATION & GUIDE</span>
            </div>
            <h3 style="font-size: 20px; font-weight: 800; color: var(--text-main); margin-top: 3px;">
              Support Tab YouTube Video Tutorial
            </h3>
            <p style="font-size: 13px; color: var(--text-secondary); margin-top: 3px; max-width: 680px;">
              Manage the video guide embedded on the customer Support tab. You can update the YouTube URL anytime or toggle it OFF to completely hide the section from customers.
            </p>
          </div>

          <label style="display: inline-flex; align-items: center; gap: 10px; cursor: pointer; font-weight: 800; font-size: 14px; background: ${store.data.supportVideo?.enabled ? '#D1FAE5' : 'var(--bg-subtle)'}; padding: 10px 18px; border-radius: 12px; border: 1.5px solid ${store.data.supportVideo?.enabled ? '#10B981' : 'var(--border-color)'}; transition: all 0.2s;">
            <input type="checkbox" id="admin-support-video-toggle" ${store.data.supportVideo?.enabled ? 'checked' : ''} style="width: 20px; height: 20px; cursor: pointer;" />
            <span style="color: ${store.data.supportVideo?.enabled ? '#047857' : 'var(--text-main)'};">
              ${store.data.supportVideo?.enabled ? '✅ Video Section is VISIBLE' : '⏸️ Video Section is HIDDEN'}
            </span>
          </label>
        </div>

        <div class="form-group" style="margin-bottom: 14px;">
          <label class="form-label" style="font-weight: 700; font-size: 12.5px;">YouTube Video URL or Video ID</label>
          <input type="text" id="admin-support-video-url" class="form-input" value="${(store.data.supportVideo?.videoUrl || '').replace(/"/g, '&quot;')}" placeholder="e.g. https://www.youtube.com/watch?v=... or https://youtu.be/..." oninput="AdminApp.previewSupportVideoUrl(this.value)" style="height: 44px; border-radius: 10px; font-weight: 600;" />
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-weight: 700; font-size: 12.5px;">Video Heading / Title</label>
            <input type="text" id="admin-support-video-title" class="form-input" value="${(store.data.supportVideo?.title || '🎬 Video Guide: How to Get 24/7 Instant Support & Fast Refill').replace(/"/g, '&quot;')}" style="height: 44px; border-radius: 10px; font-weight: 700;" />
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-weight: 700; font-size: 12.5px;">Video Description / Subtitle</label>
            <input type="text" id="admin-support-video-desc" class="form-input" value="${(store.data.supportVideo?.description || 'Watch this quick video to learn how to claim instant refills for dropped followers, add funds, and chat with 24/7 VIP support.').replace(/"/g, '&quot;')}" style="height: 44px; border-radius: 10px;" />
          </div>
        </div>

        <!-- Live Video Preview Player Container -->
        <div style="margin-top: 16px; border-radius: 14px; overflow: hidden; background: #0F172A; border: 1px solid var(--border-color); max-width: 480px;">
          <div style="padding: 8px 14px; background: rgba(255,255,255,0.06); font-size: 11.5px; font-weight: 700; color: #94A3B8; display: flex; align-items: center; gap: 6px;">
            <span>📺 Live Player Preview:</span>
          </div>
          <div id="admin-support-video-preview-box">
            ${(() => {
              const embed = store.extractYouTubeEmbedUrl ? store.extractYouTubeEmbedUrl(store.data.supportVideo?.videoUrl || '') : '';
              if (embed) {
                return `
                  <div style="position: relative; padding-bottom: 56.25%; height: 0;">
                    <iframe src="${embed}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" allowfullscreen></iframe>
                  </div>
                `;
              }
              return `
                <div style="padding: 32px 20px; text-align: center; color: #94A3B8;">
                  <div style="font-size: 32px; margin-bottom: 4px;">🎥</div>
                  <div style="font-weight: 700;">No Video URL set yet</div>
                  <div style="font-size: 12px; margin-top: 2px;">Paste a YouTube link above to see the live preview.</div>
                </div>
              `;
            })()}
          </div>
        </div>

        <button class="btn btn-primary" onclick="AdminApp.saveSupportVideoSettings()" style="margin-top: 16px; font-weight: 800; padding: 10px 24px; border-radius: 12px; background: linear-gradient(135deg, #10B981, #059669);">
          💾 Save Support Video Settings
        </button>
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

  updateNoticePreview() {
    const titleEl = document.getElementById('admin-notice-title');
    const msgEl = document.getElementById('admin-notice-message');
    const prevTitle = document.getElementById('admin-notice-preview-title');
    const prevBody = document.getElementById('admin-notice-preview-body');

    if (prevTitle && titleEl) prevTitle.innerText = titleEl.value || '📢 Official Notice & Updates';
    if (prevBody && msgEl) prevBody.innerText = msgEl.value || 'No notice content set yet.';
  },

  saveHeaderNotification() {
    const titleEl = document.getElementById('admin-notice-title');
    const msgEl = document.getElementById('admin-notice-message');
    const toggleEl = document.getElementById('admin-notice-toggle');

    const title = titleEl ? titleEl.value.trim() : '📢 Official Notice & Updates';
    const message = msgEl ? msgEl.value : '';
    const enabled = toggleEl ? toggleEl.checked : true;

    window.store.updateHeaderNotification({ title, message, enabled });
  },

  insertNoticeTemplate() {
    const titleEl = document.getElementById('admin-notice-title');
    const msgEl = document.getElementById('admin-notice-message');
    if (titleEl) titleEl.value = '⚡ LikeX Live Server & Speed Updates';
    if (msgEl) {
      msgEl.value = `👑 Welcome to LikeX Wholesale Platform!\n\n🔥 Live Services Status:\n• Instagram Followers: 100% Active (Instant Start)\n• YouTube Views & Subs: Non-Drop & Stable\n• Telegram Members: 0-5 Mins Fast Delivery\n\n💬 Need help? Our VIP Desk is available 24/7:\n• WhatsApp: +91 9837371137\n• Telegram: @Likex_support\n\n🛡️ 365-Day Refill & Drop Protection Guarantee Active!\nThank you for choosing LikeX!`;
    }
    this.updateNoticePreview();
  },

  previewEarnVideoUrl(val) {
    const store = window.store;
    const box = document.getElementById('admin-earn-preview-box');
    if (!box) return;
    const embed = store.extractYouTubeEmbedUrl ? store.extractYouTubeEmbedUrl(val) : '';
    if (embed) {
      box.innerHTML = `
        <div style="position: relative; padding-bottom: 56.25%; height: 0;">
          <iframe 
            src="${embed}" 
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" 
            allowfullscreen
          ></iframe>
        </div>
      `;
    } else {
      box.innerHTML = `
        <div style="padding: 32px 20px; text-align: center; color: #94A3B8;">
          <div style="font-size: 30px; margin-bottom: 4px;">🎥</div>
          <div style="font-weight: 700;">No Video URL set yet</div>
          <div style="font-size: 12px;">Paste a YouTube link above to see live preview.</div>
        </div>
      `;
    }
  },

  saveEarnTutorialSettings() {
    const urlInput = document.getElementById('admin-earn-video-url');
    const titleInput = document.getElementById('admin-earn-video-title');
    const descInput = document.getElementById('admin-earn-video-desc');
    const enabledSelect = document.getElementById('admin-earn-video-enabled');

    const config = {
      videoUrl: urlInput ? urlInput.value.trim() : '',
      title: titleInput ? titleInput.value.trim() : '',
      description: descInput ? descInput.value.trim() : '',
      enabled: enabledSelect ? enabledSelect.value === 'true' : true
    };

    window.store.updateEarnTutorial(config);
  },

  previewWalletVideoUrl(val) {
    const store = window.store;
    const box = document.getElementById('admin-video-preview-box');
    if (!box) return;
    const embed = store.extractYouTubeEmbedUrl ? store.extractYouTubeEmbedUrl(val) : '';
    if (embed) {
      box.innerHTML = `
        <div style="position: relative; padding-bottom: 56.25%; height: 0;">
          <iframe 
            src="${embed}" 
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" 
            allowfullscreen
          ></iframe>
        </div>
      `;
    } else {
      box.innerHTML = `
        <div style="padding: 36px 20px; text-align: center; color: #94A3B8;">
          <div style="font-size: 32px; margin-bottom: 6px;">🎥</div>
          <div style="font-weight: 700;">No Video URL set yet</div>
          <div style="font-size: 12px; margin-top: 2px;">Paste a YouTube video link above to see the live preview.</div>
        </div>
      `;
    }
  },

  saveWalletTutorialSettings() {
    const urlInput = document.getElementById('admin-wallet-video-url');
    const titleInput = document.getElementById('admin-wallet-video-title');
    const descInput = document.getElementById('admin-wallet-video-desc');
    const enabledSelect = document.getElementById('admin-wallet-video-enabled');

    const config = {
      videoUrl: urlInput ? urlInput.value.trim() : '',
      title: titleInput ? titleInput.value.trim() : '',
      description: descInput ? descInput.value.trim() : '',
      enabled: enabledSelect ? enabledSelect.value === 'true' : true
    };

    window.store.updateWalletTutorial(config);
  },

  saveAlertSettings() {
    const tgTokenEl = document.getElementById('admin-alert-tg-token');
    const tgChatIdEl = document.getElementById('admin-alert-tg-chatid');
    const emailEl = document.getElementById('admin-alert-email');
    const threshEl = document.getElementById('admin-alert-threshold');

    const config = {
      telegramBotToken: tgTokenEl ? tgTokenEl.value.trim() : '8874080054:AAFazn2iknlJMDppQuXlTM0UwQsYFP9Dwik',
      telegramChatId: tgChatIdEl ? tgChatIdEl.value.trim() : '2057136429',
      adminEmail: emailEl ? emailEl.value.trim() : 'support@likex.in',
      threshold: threshEl ? Number(threshEl.value) || 100 : 100
    };

    window.store.saveAlertConfig(config);
  },

  saveRecommendedFollowersSettings() {
    const toggleEl = document.getElementById('admin-rec-followers-toggle');
    const titleEl = document.getElementById('admin-rec-followers-title');
    const noticeEl = document.getElementById('admin-rec-followers-notice');
    const idsEl = document.getElementById('admin-rec-followers-ids');
    const badgeEl = document.getElementById('admin-rec-followers-badge');

    const config = {
      enabled: toggleEl ? toggleEl.checked : true,
      title: titleEl ? titleEl.value.trim() : 'Best Non-Drop Instagram Followers [Tested & Verified]',
      notice: noticeEl ? noticeEl.value.trim() : '',
      serviceIds: idsEl ? idsEl.value.trim() : '2868, 10323, 6435, 10349',
      badgeText: badgeEl ? badgeEl.value.trim() : '100% Non-Drop VIP'
    };

    window.store.updateRecommendedFollowers(config);
  },

  previewSupportVideoUrl(val) {
    const store = window.store;
    const box = document.getElementById('admin-support-video-preview-box');
    if (!box) return;
    const embed = store.extractYouTubeEmbedUrl ? store.extractYouTubeEmbedUrl(val) : '';
    if (embed) {
      box.innerHTML = `
        <div style="position: relative; padding-bottom: 56.25%; height: 0;">
          <iframe 
            src="${embed}" 
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" 
            allowfullscreen
          ></iframe>
        </div>
      `;
    } else {
      box.innerHTML = `
        <div style="padding: 32px 20px; text-align: center; color: #94A3B8;">
          <div style="font-size: 32px; margin-bottom: 4px;">🎥</div>
          <div style="font-weight: 700;">No Video URL set yet</div>
          <div style="font-size: 12px; margin-top: 2px;">Paste a YouTube link above to see the live preview.</div>
        </div>
      `;
    }
  },

  saveSupportVideoSettings() {
    const urlInput = document.getElementById('admin-support-video-url');
    const titleInput = document.getElementById('admin-support-video-title');
    const descInput = document.getElementById('admin-support-video-desc');
    const toggleEl = document.getElementById('admin-support-video-toggle');

    const config = {
      videoUrl: urlInput ? urlInput.value.trim() : '',
      title: titleInput ? titleInput.value.trim() : '🎬 Video Guide: How to Get 24/7 Instant Support & Fast Refill',
      description: descInput ? descInput.value.trim() : '',
      enabled: toggleEl ? toggleEl.checked : true
    };

    window.store.updateSupportVideo(config);
  },

  savePixelSettings() {
    const input = document.getElementById('admin-meta-pixel-id');
    const pixelId = input ? input.value.trim() : '1107755188608830';
    if (!pixelId) {
      window.store.showToast('Please enter a valid Meta Pixel ID', 'error');
      return;
    }
    window.store.updatePixelSettings(pixelId, true);
  },

  testMetaPixel() {
    if (window.PixelTracker) {
      window.PixelTracker.trackCustom('AdminTestEvent', {
        test_source: 'Admin Console',
        time: new Date().toLocaleTimeString(),
        pixel_id: (window.store.data.pixelSettings && window.store.data.pixelSettings.pixelId) || '1107755188608830'
      });
      window.store.showToast('🎯 Test event sent to Meta Pixel! Check Meta Events Manager Test Events tab.', 'success');
    } else {
      window.store.showToast('PixelTracker not active in current window', 'info');
    }
  },

  async dispatchAllQueuedOrders() {
    const allOrders = window.store.getAllAdminOrders ? window.store.getAllAdminOrders() : window.store.data.orders;
    const queuedOrders = allOrders.filter(o => {
      if (!o) return false;
      const st = (o.status || '').toLowerCase();
      return o.isQueued || o.needsTopup || o.isLowBalance || st === 'queued' || st.includes('topup') || st.includes('top-up') || st.includes('low balance');
    });
    if (queuedOrders.length === 0) {
      window.store.showToast('No queued orders waiting for dispatch.', 'info');
      return;
    }

    window.store.showToast(`⚡ Dispatching ${queuedOrders.length} queued orders to providers...`, 'info');
    let successCount = 0;
    for (const qo of queuedOrders) {
      const res = window.store.dispatchQueuedOrder ? await window.store.dispatchQueuedOrder(qo.id) : await window.store.retrySingleOrder(qo.id);
      if (res && res.success) {
        successCount++;
      }
    }

    window.store.showToast(`🏁 Finished dispatching: ${successCount}/${queuedOrders.length} orders successfully sent to live servers!`, 'success');
    if (this.updateAdminOrdersTableView) {
      this.updateAdminOrdersTableView();
    }
  },

  // CUSTOMER TRACKING & WALLET MANAGEMENT
  getAllCustomersList(store) {
    if (!store) store = window.store;
    const allUsers = (store.data && store.data.users) || [];
    const allOrders = (store.getAllAdminOrders ? store.getAllAdminOrders() : store.data.orders) || [];
    const allTransactions = (store.data && (store.data.allTransactions || store.data.transactions)) || [];

    const customerMap = new Map();

    // 1. Process users from Supabase
    allUsers.forEach(u => {
      const emailKey = (u.email || '').trim().toLowerCase();
      const code = u.customer_code || store.getCustomerId(u);
      const key = emailKey || code || String(u.id);
      if (!key) return;

      customerMap.set(key, {
        id: code,
        userId: u.id,
        name: u.username || u.name || (emailKey ? emailKey.split('@')[0] : 'Customer'),
        email: u.email || '',
        balance: store.getCustomerWalletBalance ? store.getCustomerWalletBalance(u.email || u.id || code) : Number(u.balance || 0),
        spent: Number(u.spent || 0),
        role: u.role || 'user',
        createdAt: u.created_at || u.createdAt || null,
        orders: [],
        transactions: []
      });
    });

    // 2. Process currently logged in customer if exists
    if (store.data && store.data.customer && store.data.customer.email) {
      const c = store.data.customer;
      const emailKey = c.email.trim().toLowerCase();
      const code = store.getCustomerId(c);
      if (!customerMap.has(emailKey)) {
        customerMap.set(emailKey, {
          id: code,
          userId: c.id,
          name: c.name || c.username || emailKey.split('@')[0],
          email: c.email,
          balance: Number(c.balance || 0),
          spent: Number(c.spent || 0),
          role: 'user',
          createdAt: c.createdAt || null,
          orders: [],
          transactions: []
        });
      }
    }

    // 3. Map orders to customers
    allOrders.forEach(o => {
      if (!o) return;
      const orderEmail = (o.userEmail || o.customerEmail || '').trim().toLowerCase();
      const orderCustCode = o.customerId || o.customerCode || (orderEmail ? store.getCustomerId(orderEmail) : null);
      let matchedCust = null;
      if (orderEmail && customerMap.has(orderEmail)) {
        matchedCust = customerMap.get(orderEmail);
      } else if (orderCustCode && customerMap.has(orderCustCode)) {
        matchedCust = customerMap.get(orderCustCode);
      } else if (orderEmail && orderEmail !== 'guest customer' && !orderEmail.includes('guest@')) {
        const newCode = orderCustCode || store.getCustomerId(orderEmail);
        matchedCust = {
          id: newCode,
          userId: o.user_id || o.customerUserId || null,
          name: o.customerName || orderEmail.split('@')[0],
          email: orderEmail,
          balance: store.getCustomerWalletBalance ? store.getCustomerWalletBalance(orderEmail) : 0,
          spent: 0,
          role: 'user',
          createdAt: o.createdAt || o.date || null,
          orders: [],
          transactions: []
        };
        customerMap.set(orderEmail, matchedCust);
      }

      if (matchedCust) {
        matchedCust.orders.push(o);
      }
    });

    // 4. Map transactions to customers
    allTransactions.forEach(tx => {
      if (!tx) return;
      const txEmail = (tx.user_email || tx.userEmail || '').trim().toLowerCase();
      const txCode = tx.customer_code || (txEmail ? store.getCustomerId(txEmail) : null);
      let matchedCust = null;
      if (txEmail && customerMap.has(txEmail)) {
        matchedCust = customerMap.get(txEmail);
      } else if (txCode && customerMap.has(txCode)) {
        matchedCust = customerMap.get(txCode);
      }

      if (matchedCust) {
        matchedCust.transactions.push(tx);
      }
    });

    // Finalize stats
    const customers = Array.from(customerMap.values()).map(c => {
      c.orders.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.date || 0).getTime();
        const timeB = new Date(b.createdAt || b.date || 0).getTime();
        return timeB - timeA;
      });

      c.transactions.sort((a, b) => {
        const timeA = new Date(a.created_at || a.createdAt || a.date || 0).getTime();
        const timeB = new Date(b.created_at || b.createdAt || b.date || 0).getTime();
        return timeB - timeA;
      });

      const totalDeposited = c.transactions
        .filter(t => {
          const type = (t.type || '').toLowerCase();
          const status = (t.status || '').toLowerCase();
          return (type.includes('deposit') || type.includes('credit') || type.includes('topup')) && 
                 (status === 'success' || status === 'completed' || status === 'paid');
        })
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      const totalSpentFromOrders = c.orders.reduce((sum, o) => sum + Number(o.amount || o.charge || 0), 0);
      const totalSpent = totalSpentFromOrders > 0 ? totalSpentFromOrders : c.spent;

      return {
        ...c,
        ordersCount: c.orders.length,
        totalDeposited: totalDeposited,
        totalSpent: totalSpent
      };
    });

    customers.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    return customers;
  },

  renderCustomers(store) {
    const customers = this.getAllCustomersList(store);
    const totalCustomers = customers.length;
    const totalBalance = customers.reduce((sum, c) => sum + Number(c.balance || 0), 0);
    const totalOrdersCount = customers.reduce((sum, c) => sum + c.ordersCount, 0);
    const totalDepositedAll = customers.reduce((sum, c) => sum + c.totalDeposited, 0);

    return `
      <!-- CUSTOMERS HEADER & ACTIONS -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; margin-bottom: 24px;">
        <div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <h2 style="font-size: 22px; font-weight: 800; color: var(--text-main); margin: 0;">👥 Customer Tracking & Wallet Directory</h2>
            <span class="badge badge-primary" style="font-size: 13px; padding: 4px 10px;">${totalCustomers} Total Customers</span>
          </div>
          <p style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">
            Unique permanent Customer IDs, live wallet balances, financial summaries, and complete order histories.
          </p>
        </div>

        <div style="display: flex; align-items: center; gap: 10px;">
          <button class="btn btn-sm btn-outline" style="border-radius: 999px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;" onclick="AdminApp.refreshCustomersData(this)">
            <span>🔄 Sync Live Data</span>
          </button>
        </div>
      </div>

      <!-- 4 STATS OVERVIEW CARDS -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px;">
        <div class="card" style="padding: 18px; border-left: 4px solid var(--primary); display: flex; align-items: center; gap: 14px;">
          <div style="width: 46px; height: 46px; border-radius: 12px; background: rgba(99, 102, 241, 0.12); display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0;">
            👥
          </div>
          <div>
            <div style="font-size: 12px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">Total Customers</div>
            <div style="font-size: 22px; font-weight: 900; color: var(--text-main); margin-top: 2px;">${totalCustomers}</div>
          </div>
        </div>

        <div class="card" style="padding: 18px; border-left: 4px solid #10B981; display: flex; align-items: center; gap: 14px;">
          <div style="width: 46px; height: 46px; border-radius: 12px; background: rgba(16, 185, 129, 0.12); display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0;">
            💰
          </div>
          <div>
            <div style="font-size: 12px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">Outstanding Balances</div>
            <div style="font-size: 20px; font-weight: 900; color: #10B981; margin-top: 2px;">${store.formatMoney(totalBalance)}</div>
          </div>
        </div>

        <div class="card" style="padding: 18px; border-left: 4px solid #F59E0B; display: flex; align-items: center; gap: 14px;">
          <div style="width: 46px; height: 46px; border-radius: 12px; background: rgba(245, 158, 11, 0.12); display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0;">
            📦
          </div>
          <div>
            <div style="font-size: 12px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">Total Customer Orders</div>
            <div style="font-size: 22px; font-weight: 900; color: var(--text-main); margin-top: 2px;">${totalOrdersCount}</div>
          </div>
        </div>

        <div class="card" style="padding: 18px; border-left: 4px solid #8B5CF6; display: flex; align-items: center; gap: 14px;">
          <div style="width: 46px; height: 46px; border-radius: 12px; background: rgba(139, 92, 246, 0.12); display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0;">
            📥
          </div>
          <div>
            <div style="font-size: 12px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">Total Ever Topped Up</div>
            <div style="font-size: 20px; font-weight: 900; color: #8B5CF6; margin-top: 2px;">${store.formatMoney(totalDepositedAll)}</div>
          </div>
        </div>
      </div>

      <!-- SEARCH & FILTER TOOLBAR -->
      <div class="card" style="padding: 16px 20px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
        <div style="position: relative; flex: 1; min-width: 280px; max-width: 480px;">
          <span style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 14px; color: var(--text-muted);">🔍</span>
          <input 
            type="text" 
            id="admin-customers-search-input" 
            class="form-input" 
            style="padding-left: 38px; height: 42px; border-radius: 999px; font-size: 13.5px;" 
            placeholder="Search Customer ID (e.g. LX-10245), name, or email..." 
            oninput="AdminApp.handleAdminCustomersSearch(this.value)"
          />
        </div>

        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <button class="btn btn-sm btn-primary customer-filter-btn active" data-filter="all" onclick="AdminApp.filterCustomersTable('all', this)" style="border-radius: 999px;">
            All (${totalCustomers})
          </button>
          <button class="btn btn-sm btn-outline customer-filter-btn" data-filter="has_balance" onclick="AdminApp.filterCustomersTable('has_balance', this)" style="border-radius: 999px;">
            With Balance
          </button>
          <button class="btn btn-sm btn-outline customer-filter-btn" data-filter="has_orders" onclick="AdminApp.filterCustomersTable('has_orders', this)" style="border-radius: 999px;">
            Active Buyers
          </button>
        </div>
      </div>

      <!-- CUSTOMERS TABLE CONTAINER -->
      <div id="admin-customers-table-container">
        ${this.renderCustomersTableContent(store)}
      </div>
    `;
  },

  renderCustomersTableContent(store, searchTerm = '', filterType = 'all') {
    if (!store) store = window.store;
    let customers = this.getAllCustomersList(store);

    const cleanSearch = String(searchTerm || '').trim().toLowerCase();
    if (cleanSearch) {
      customers = customers.filter(c => {
        const idMatch = String(c.id || '').toLowerCase().includes(cleanSearch);
        const nameMatch = String(c.name || '').toLowerCase().includes(cleanSearch);
        const emailMatch = String(c.email || '').toLowerCase().includes(cleanSearch);
        return idMatch || nameMatch || emailMatch;
      });
    }

    if (filterType === 'has_balance') {
      customers = customers.filter(c => Number(c.balance || 0) > 0.001);
    } else if (filterType === 'has_orders') {
      customers = customers.filter(c => c.ordersCount > 0);
    }

    if (customers.length === 0) {
      return `
        <div class="card" style="padding: 48px 20px; text-align: center; color: var(--text-muted);">
          <div style="font-size: 36px; margin-bottom: 8px;">👥</div>
          <div style="font-weight: 800; font-size: 16px; color: var(--text-main);">No Customers Found</div>
          <div style="font-size: 13px; margin-top: 4px;">No customer records matched your query or filter criteria.</div>
        </div>
      `;
    }

    return `
      <div class="table-responsive" style="background: var(--bg-card); border-radius: 16px; border: 1px solid var(--border-color); overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
        <table class="admin-table" style="width: 100%; border-collapse: collapse; text-align: left;">
          <thead>
            <tr style="background: var(--bg-surface); border-bottom: 1.5px solid var(--border-color);">
              <th style="padding: 14px 16px; font-weight: 800; font-size: 12px; text-transform: uppercase; color: var(--text-secondary);">Customer ID</th>
              <th style="padding: 14px 16px; font-weight: 800; font-size: 12px; text-transform: uppercase; color: var(--text-secondary);">Customer Profile</th>
              <th style="padding: 14px 16px; font-weight: 800; font-size: 12px; text-transform: uppercase; color: var(--text-secondary);">Wallet Balance</th>
              <th style="padding: 14px 16px; font-weight: 800; font-size: 12px; text-transform: uppercase; color: var(--text-secondary); text-align: center;">Orders</th>
              <th style="padding: 14px 16px; font-weight: 800; font-size: 12px; text-transform: uppercase; color: var(--text-secondary);">Total Spent</th>
              <th style="padding: 14px 16px; font-weight: 800; font-size: 12px; text-transform: uppercase; color: var(--text-secondary);">Total Deposited</th>
              <th style="padding: 14px 16px; font-weight: 800; font-size: 12px; text-transform: uppercase; color: var(--text-secondary);">Joined</th>
              <th style="padding: 14px 16px; font-weight: 800; font-size: 12px; text-transform: uppercase; color: var(--text-secondary); text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${customers.map(c => {
              const avatarLetter = (c.name || 'C').charAt(0).toUpperCase();
              const dateStr = c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Registered';
              const balanceUsd = Number(c.balance || 0);

              return `
                <tr style="border-bottom: 1px solid var(--border-color); transition: background 0.15s ease;" onmouseover="this.style.background='rgba(99, 102, 241, 0.04)'" onmouseout="this.style.background='transparent'">
                  <!-- 1. CUSTOMER ID -->
                  <td style="padding: 14px 16px;">
                    <div style="display: inline-flex; align-items: center; gap: 6px;">
                      <span class="badge" style="background: rgba(99, 102, 241, 0.12); color: var(--primary); font-family: var(--font-mono); font-weight: 800; font-size: 12.5px; padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(99, 102, 241, 0.25); cursor: pointer;" onclick="navigator.clipboard.writeText('${c.id}'); window.store.showToast('Copied Customer ID: ${c.id}', 'success');" title="Click to copy Customer ID">
                        ${c.id}
                      </span>
                      <button type="button" onclick="navigator.clipboard.writeText('${c.id}'); window.store.showToast('Copied Customer ID: ${c.id}', 'success');" title="Copy Customer ID" style="background: none; border: none; cursor: pointer; padding: 2px 4px; font-size: 11px; opacity: 0.7;">📋</button>
                    </div>
                  </td>

                  <!-- 2. CUSTOMER PROFILE -->
                  <td style="padding: 14px 16px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #6366F1, #9333EA); color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; flex-shrink: 0; box-shadow: 0 2px 6px rgba(99, 102, 241, 0.25); cursor: pointer;" onclick="AdminApp.openCustomerDetailsModal('${c.email || c.id}')">
                        ${avatarLetter}
                      </div>
                      <div style="min-width: 0;">
                        <div style="font-weight: 800; font-size: 13.5px; color: var(--text-main); cursor: pointer;" onclick="AdminApp.openCustomerDetailsModal('${c.email || c.id}')" title="Click to view Customer Details">
                          ${c.name}
                        </div>
                        <div style="font-size: 11.5px; color: var(--text-muted); display: flex; align-items: center; gap: 4px; margin-top: 1px;">
                          <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px;" title="${c.email}">
                            ${c.email || 'No email'}
                          </span>
                          ${c.email ? `
                            <button type="button" title="Copy Email" onclick="navigator.clipboard.writeText('${c.email}'); window.store.showToast('Customer email copied!', 'success');" style="background: none; border: none; cursor: pointer; padding: 0; font-size: 10px; opacity: 0.7;">📋</button>
                          ` : ''}
                        </div>
                      </div>
                    </div>
                  </td>

                  <!-- 3. WALLET BALANCE -->
                  <td style="padding: 14px 16px;">
                    <div>
                      <span class="badge" style="background: rgba(16, 185, 129, 0.12); color: #059669; font-weight: 800; font-size: 13.5px; padding: 4px 10px; border-radius: 8px;">
                        ${store.formatMoney(balanceUsd)}
                      </span>
                      <div style="font-size: 10.5px; color: var(--text-muted); margin-top: 3px; font-family: var(--font-mono); font-weight: 600;">
                        $${balanceUsd.toFixed(2)} USD
                      </div>
                    </div>
                  </td>

                  <!-- 4. ORDERS COUNT -->
                  <td style="padding: 14px 16px; text-align: center;">
                    <span class="badge" style="background: rgba(99, 102, 241, 0.08); color: var(--primary); font-weight: 800; font-size: 12px; padding: 3px 9px; border-radius: 999px;">
                      ${c.ordersCount} orders
                    </span>
                  </td>

                  <!-- 5. TOTAL SPENT -->
                  <td style="padding: 14px 16px;">
                    <div style="font-weight: 700; font-size: 13px; color: var(--text-main);">
                      ${store.formatMoney(c.totalSpent)}
                    </div>
                  </td>

                  <!-- 6. TOTAL DEPOSITED -->
                  <td style="padding: 14px 16px;">
                    <div style="font-weight: 700; font-size: 13px; color: #8B5CF6;">
                      ${store.formatMoney(c.totalDeposited)}
                    </div>
                  </td>

                  <!-- 7. JOINED DATE -->
                  <td style="padding: 14px 16px;">
                    <div style="font-size: 12px; color: var(--text-secondary);">
                      📅 ${dateStr}
                    </div>
                  </td>

                  <!-- 8. ACTION -->
                  <td style="padding: 14px 16px; text-align: right;">
                    <button class="btn btn-sm btn-primary" style="border-radius: 999px; font-weight: 700; font-size: 12px; padding: 6px 14px; display: inline-flex; align-items: center; gap: 5px;" onclick="AdminApp.openCustomerDetailsModal('${c.email || c.id}')">
                      <span>🔍 Details & Ledger</span>
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

  currentCustomerSearchTerm: '',
  currentCustomerFilter: 'all',

  handleAdminCustomersSearch(val) {
    this.currentCustomerSearchTerm = val;
    const container = document.getElementById('admin-customers-table-container');
    if (container) {
      container.innerHTML = this.renderCustomersTableContent(window.store, this.currentCustomerSearchTerm, this.currentCustomerFilter);
    }
  },

  filterCustomersTable(filterType, btnEl) {
    this.currentCustomerFilter = filterType;
    document.querySelectorAll('.customer-filter-btn').forEach(b => {
      b.classList.remove('active', 'btn-primary');
      b.classList.add('btn-outline');
    });
    if (btnEl) {
      btnEl.classList.remove('btn-outline');
      btnEl.classList.add('active', 'btn-primary');
    }
    const container = document.getElementById('admin-customers-table-container');
    if (container) {
      container.innerHTML = this.renderCustomersTableContent(window.store, this.currentCustomerSearchTerm, this.currentCustomerFilter);
    }
  },

  async refreshCustomersData(btnEl) {
    const store = window.store;
    if (btnEl) {
      btnEl.disabled = true;
      btnEl.innerHTML = '<span>⏳ Syncing...</span>';
    }
    if (store.syncSupabaseDataForAdmin) {
      await store.syncSupabaseDataForAdmin();
    }
    store.showToast('Synced customer directory and wallet transactions with live database!', 'success');
    if (btnEl) {
      btnEl.disabled = false;
      btnEl.innerHTML = '<span>🔄 Sync Live Data</span>';
    }
    const container = document.getElementById('admin-customers-table-container');
    if (container) {
      container.innerHTML = this.renderCustomersTableContent(store, this.currentCustomerSearchTerm, this.currentCustomerFilter);
    }
  },

  openCustomerDetailsModal(customerIdentifier, activeTab = 'ledger') {
    const store = window.store;
    if (!store) return;

    const customers = this.getAllCustomersList(store);
    const cleanId = String(customerIdentifier || '').trim().toLowerCase();

    let customer = customers.find(c => 
      (c.email && c.email.toLowerCase() === cleanId) ||
      (c.id && c.id.toLowerCase() === cleanId) ||
      (String(c.userId) === cleanId)
    );

    if (!customer) {
      // Fallback: construct minimum customer profile
      const custCode = store.getCustomerId(cleanId);
      customer = {
        id: custCode,
        userId: null,
        name: cleanId.includes('@') ? cleanId.split('@')[0] : 'Customer',
        email: cleanId.includes('@') ? cleanId : '',
        balance: store.getCustomerWalletBalance(cleanId) || 0,
        spent: 0,
        totalDeposited: 0,
        createdAt: null,
        orders: (store.getAllAdminOrders ? store.getAllAdminOrders() : store.data.orders).filter(o => 
          (o.userEmail && o.userEmail.toLowerCase() === cleanId) || (o.customerCode === custCode)
        ),
        transactions: (store.data.allTransactions || store.data.transactions || []).filter(tx => 
          (tx.user_email && tx.user_email.toLowerCase() === cleanId) || (tx.customer_code === custCode)
        )
      };
      customer.ordersCount = customer.orders.length;
    }

    const sheet = document.getElementById('generic-modal-sheet');
    if (!sheet) return;

    sheet.className = 'modal-sheet order-details-sheet';

    const avatarLetter = (customer.name || 'C').charAt(0).toUpperCase();
    const joinedStr = customer.createdAt 
      ? new Date(customer.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) 
      : 'Registered';

    const liveBalanceUsd = Number(customer.balance || 0);
    const totalDepositedUsd = Number(customer.totalDeposited || 0);
    const totalSpentUsd = Number(customer.totalSpent || 0);
    const ordersCount = customer.ordersCount || customer.orders.length;

    sheet.innerHTML = `
      <!-- MODAL HEADER -->
      <div class="modal-header" style="padding-bottom: 16px; border-bottom: 1.5px solid var(--border-color); display: flex; justify-content: space-between; align-items: flex-start;">
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #6366F1, #9333EA); color: white; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 20px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);">
            ${avatarLetter}
          </div>
          <div>
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <h3 class="modal-title" style="margin: 0; font-size: 19px; font-weight: 800; color: var(--text-main);">
                ${customer.name}
              </h3>
              <span class="badge" style="background: rgba(99, 102, 241, 0.12); color: var(--primary); font-family: var(--font-mono); font-weight: 800; font-size: 12px; padding: 3px 8px; border-radius: 6px; cursor: pointer;" onclick="navigator.clipboard.writeText('${customer.id}'); window.store.showToast('Copied Customer ID: ${customer.id}', 'success');" title="Click to copy Customer ID">
                ID: ${customer.id} 📋
              </span>
            </div>
            <div style="font-size: 12.5px; color: var(--text-secondary); margin-top: 3px; display: flex; align-items: center; gap: 8px;">
              <span>✉️ ${customer.email || 'No email provided'}</span>
              <span>•</span>
              <span>📅 Joined: ${joinedStr}</span>
            </div>
          </div>
        </div>

        <button class="modal-close" onclick="CustomerApp.closeModal()" style="font-size: 24px; line-height: 1; border: none; background: none; cursor: pointer; color: var(--text-muted);">&times;</button>
      </div>

      <!-- 4 FINANCIAL SUMMARY CARDS -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; margin: 18px 0 22px;">
        <div style="background: rgba(16, 185, 129, 0.08); border: 1.5px solid rgba(16, 185, 129, 0.3); border-radius: 14px; padding: 14px 16px;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #059669;">Current Live Balance</div>
          <div style="font-size: 20px; font-weight: 900; color: #059669; margin-top: 4px;">
            ${store.formatMoney(liveBalanceUsd)}
          </div>
          <div style="font-size: 11px; font-family: var(--font-mono); color: var(--text-muted); margin-top: 2px;">
            $${liveBalanceUsd.toFixed(2)} USD
          </div>
        </div>

        <div style="background: rgba(139, 92, 246, 0.08); border: 1.5px solid rgba(139, 92, 246, 0.3); border-radius: 14px; padding: 14px 16px;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #7C3AED;">Total Ever Deposited</div>
          <div style="font-size: 20px; font-weight: 900; color: #7C3AED; margin-top: 4px;">
            ${store.formatMoney(totalDepositedUsd)}
          </div>
          <div style="font-size: 11px; font-family: var(--font-mono); color: var(--text-muted); margin-top: 2px;">
            All-Time Top-ups
          </div>
        </div>

        <div style="background: rgba(239, 68, 68, 0.08); border: 1.5px solid rgba(239, 68, 68, 0.3); border-radius: 14px; padding: 14px 16px;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #DC2626;">Total Amount Spent</div>
          <div style="font-size: 20px; font-weight: 900; color: #DC2626; margin-top: 4px;">
            ${store.formatMoney(totalSpentUsd)}
          </div>
          <div style="font-size: 11px; font-family: var(--font-mono); color: var(--text-muted); margin-top: 2px;">
            On Growth Orders
          </div>
        </div>

        <div style="background: rgba(99, 102, 241, 0.08); border: 1.5px solid rgba(99, 102, 241, 0.3); border-radius: 14px; padding: 14px 16px;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--primary);">Total Orders Placed</div>
          <div style="font-size: 20px; font-weight: 900; color: var(--primary); margin-top: 4px;">
            ${ordersCount}
          </div>
          <div style="font-size: 11px; font-family: var(--font-mono); color: var(--text-muted); margin-top: 2px;">
            Orders History
          </div>
        </div>
      </div>

      <!-- TABS NAVIGATION -->
      <div style="display: flex; gap: 8px; border-bottom: 2px solid var(--border-color); margin-bottom: 18px;">
        <button 
          id="cust-tab-btn-ledger" 
          class="btn btn-sm ${activeTab === 'ledger' ? 'btn-primary' : 'btn-outline'}" 
          style="border-radius: 10px 10px 0 0; font-weight: 800; border-bottom: none; padding: 8px 18px;" 
          onclick="AdminApp.switchCustomerDetailsTab('ledger')"
        >
          💳 Wallet & Top-up History (${customer.transactions.length})
        </button>
        <button 
          id="cust-tab-btn-orders" 
          class="btn btn-sm ${activeTab === 'orders' ? 'btn-primary' : 'btn-outline'}" 
          style="border-radius: 10px 10px 0 0; font-weight: 800; border-bottom: none; padding: 8px 18px;" 
          onclick="AdminApp.switchCustomerDetailsTab('orders')"
        >
          📦 Order History (${customer.orders.length})
        </button>
      </div>

      <!-- TAB PANE 1: WALLET / TOP-UP HISTORY & LEDGER -->
      <div id="cust-pane-ledger" style="display: ${activeTab === 'ledger' ? 'block' : 'none'};">
        ${customer.transactions.length === 0 ? `
          <div style="padding: 40px 20px; text-align: center; color: var(--text-muted); background: var(--bg-surface); border-radius: 14px; border: 1px dashed var(--border-color);">
            <div style="font-size: 32px; margin-bottom: 6px;">💳</div>
            <div style="font-weight: 700; color: var(--text-main);">No Wallet Transactions Recorded</div>
            <div style="font-size: 12px; margin-top: 2px;">This customer has not performed any top-ups or wallet deductions yet.</div>
          </div>
        ` : `
          <div class="table-responsive" style="max-height: 380px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 12px;">
            <table class="admin-table" style="width: 100%; border-collapse: collapse; font-size: 12.5px;">
              <thead>
                <tr style="background: var(--bg-surface); position: sticky; top: 0; z-index: 1; border-bottom: 1.5px solid var(--border-color);">
                  <th style="padding: 10px 12px; text-transform: uppercase;">Txn / Payment ID</th>
                  <th style="padding: 10px 12px; text-transform: uppercase;">Date & Time</th>
                  <th style="padding: 10px 12px; text-transform: uppercase;">Type</th>
                  <th style="padding: 10px 12px; text-transform: uppercase;">Amount</th>
                  <th style="padding: 10px 12px; text-transform: uppercase;">Balance Transition</th>
                  <th style="padding: 10px 12px; text-transform: uppercase;">Related Order</th>
                  <th style="padding: 10px 12px; text-transform: uppercase;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${customer.transactions.map(t => {
                  const type = (t.type || 'deposit').toLowerCase();
                  const isCredit = type.includes('deposit') || type.includes('credit') || type.includes('topup') || type.includes('refund');
                  const amtNum = Number(t.amount || 0);
                  const dtStr = t.created_at || t.createdAt || t.date || '';
                  const formattedDt = dtStr ? new Date(dtStr).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent';
                  const txnId = t.payment_id || t.paymentId || t.id || 'TXN-';
                  const orderIdLinked = t.order_id || t.orderId || null;

                  let typeLabel = 'Top-up Deposit';
                  let typeBadgeBg = 'rgba(16, 185, 129, 0.12)';
                  let typeColor = '#059669';

                  if (type.includes('order') || type.includes('debit')) {
                    typeLabel = 'Order Deduction';
                    typeBadgeBg = 'rgba(239, 68, 68, 0.12)';
                    typeColor = '#DC2626';
                  } else if (type.includes('refund')) {
                    typeLabel = 'Order Refund';
                    typeBadgeBg = 'rgba(245, 158, 11, 0.12)';
                    typeColor = '#D97706';
                  } else if (type.includes('adjustment')) {
                    typeLabel = 'Admin Adjustment';
                    typeBadgeBg = 'rgba(99, 102, 241, 0.12)';
                    typeColor = '#4F46E5';
                  }

                  const beforeVal = (t.balance_before !== undefined && t.balance_before !== null) ? Number(t.balance_before) : (t.balanceBefore !== undefined ? Number(t.balanceBefore) : null);
                  const afterVal = (t.balance_after !== undefined && t.balance_after !== null) ? Number(t.balance_after) : (t.balanceAfter !== undefined ? Number(t.balanceAfter) : null);

                  return `
                    <tr style="border-bottom: 1px solid var(--border-color);">
                      <td style="padding: 10px 12px;">
                        <span style="font-family: var(--font-mono); font-weight: 700; font-size: 11.5px; color: var(--text-main);" title="${txnId}">
                          ${String(txnId).slice(0, 18)}
                        </span>
                      </td>
                      <td style="padding: 10px 12px; color: var(--text-secondary); white-space: nowrap;">
                        ${formattedDt}
                      </td>
                      <td style="padding: 10px 12px;">
                        <span class="badge" style="background: ${typeBadgeBg}; color: ${typeColor}; font-weight: 800; font-size: 11px; padding: 2px 7px; border-radius: 6px;">
                          ${typeLabel}
                        </span>
                      </td>
                      <td style="padding: 10px 12px; font-weight: 800; color: ${isCredit ? '#059669' : '#DC2626'};">
                        ${isCredit ? '+' : '-'}${store.formatMoney(amtNum)}
                      </td>
                      <td style="padding: 10px 12px; font-family: var(--font-mono); font-size: 11px; color: var(--text-muted);">
                        ${beforeVal !== null && afterVal !== null ? `
                          <span>${store.formatMoney(beforeVal)} &rarr; <strong style="color: var(--text-main);">${store.formatMoney(afterVal)}</strong></span>
                        ` : (afterVal !== null ? `End: ${store.formatMoney(afterVal)}` : 'Logged')}
                      </td>
                      <td style="padding: 10px 12px;">
                        ${orderIdLinked ? `
                          <span style="font-family: var(--font-mono); font-weight: 800; color: var(--primary); cursor: pointer; text-decoration: underline;" onclick="AdminApp.openOrderDetailsModal('${orderIdLinked}')" title="Click to view linked order">
                            #${orderIdLinked}
                          </span>
                        ` : '<span style="color: var(--text-muted);">&mdash;</span>'}
                      </td>
                      <td style="padding: 10px 12px;">
                        <span class="badge badge-success" style="font-size: 10.5px; padding: 2px 6px;">
                          ${t.status || 'Success'}
                        </span>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>

      <!-- TAB PANE 2: ORDER HISTORY -->
      <div id="cust-pane-orders" style="display: ${activeTab === 'orders' ? 'block' : 'none'};">
        ${customer.orders.length === 0 ? `
          <div style="padding: 40px 20px; text-align: center; color: var(--text-muted); background: var(--bg-surface); border-radius: 14px; border: 1px dashed var(--border-color);">
            <div style="font-size: 32px; margin-bottom: 6px;">📦</div>
            <div style="font-weight: 700; color: var(--text-main);">No Orders Placed Yet</div>
            <div style="font-size: 12px; margin-top: 2px;">This customer has not placed any orders yet.</div>
          </div>
        ` : `
          <div class="table-responsive" style="max-height: 380px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 12px;">
            <table class="admin-table" style="width: 100%; border-collapse: collapse; font-size: 12.5px;">
              <thead>
                <tr style="background: var(--bg-surface); position: sticky; top: 0; z-index: 1; border-bottom: 1.5px solid var(--border-color);">
                  <th style="padding: 10px 12px; text-transform: uppercase;">LikeX Order ID</th>
                  <th style="padding: 10px 12px; text-transform: uppercase;">Date & Time</th>
                  <th style="padding: 10px 12px; text-transform: uppercase;">Service</th>
                  <th style="padding: 10px 12px; text-transform: uppercase; text-align: right;">Qty</th>
                  <th style="padding: 10px 12px; text-transform: uppercase; text-align: right;">User Price</th>
                  <th style="padding: 10px 12px; text-transform: uppercase;">Status</th>
                  <th style="padding: 10px 12px; text-transform: uppercase;">Provider</th>
                  <th style="padding: 10px 12px; text-transform: uppercase;">Real Provider Order ID</th>
                  <th style="padding: 10px 12px; text-transform: uppercase; text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody>
                ${customer.orders.map(o => {
                  const rawIdVal = o.likeXOrderId || o.id;
                  const displayLxId = store.formatLikeXOrderId ? store.formatLikeXOrderId(rawIdVal) : (String(rawIdVal).startsWith('LX') ? rawIdVal : 'LX' + rawIdVal);
                  const dtStr = o.createdAt || o.date || '';
                  const formattedDt = dtStr ? new Date(dtStr).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent';
                  const svcId = this.getOrderServiceId ? this.getOrderServiceId(o) : (o.serviceId || 'N/A');
                  const svcName = o.serviceSnapshot?.serviceName || o.serviceName || 'Social Growth Service';
                  const chargeAmt = Number(o.amount || o.charge || 0);

                  const provKey = String(o.serviceSnapshot?.provider || o.provider || '').toLowerCase();
                  const sIdStr = String(o.serviceSnapshot?.rawServiceId || o.serviceSnapshot?.serviceId || o.serviceId || o.rawServiceId || '');
                  const isSf = provKey === 'socialfans' || sIdStr.startsWith('sf-');
                  const providerName = isSf ? 'SocialFans' : 'World of SMM';
                  const realProvOrderId = o.providerOrderId || 'Pending';

                  let statusBadgeClass = 'badge-primary';
                  const statLow = (o.status || '').toLowerCase();
                  if (statLow.includes('completed')) statusBadgeClass = 'badge-success';
                  else if (statLow.includes('progress') || statLow.includes('processing')) statusBadgeClass = 'badge-warning';
                  else if (statLow.includes('cancel') || statLow.includes('fail')) statusBadgeClass = 'badge-danger';

                  return `
                    <tr style="border-bottom: 1px solid var(--border-color); cursor: pointer;" onclick="AdminApp.openOrderDetailsModal('${o.id}')">
                      <td style="padding: 10px 12px;">
                        <span style="font-family: var(--font-mono); font-weight: 800; color: var(--primary);">
                          #${displayLxId}
                        </span>
                      </td>
                      <td style="padding: 10px 12px; color: var(--text-secondary); white-space: nowrap;">
                        ${formattedDt}
                      </td>
                      <td style="padding: 10px 12px; max-width: 200px;">
                        <div style="font-weight: 700; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${svcName}">
                          ${svcName}
                        </div>
                        <div style="font-size: 10.5px; color: var(--text-muted); font-family: var(--font-mono);">
                          ID #${svcId}
                        </div>
                      </td>
                      <td style="padding: 10px 12px; font-weight: 700; text-align: right; font-family: var(--font-mono);">
                        ${Number(o.quantity || 1000).toLocaleString('en-IN')}
                      </td>
                      <td style="padding: 10px 12px; font-weight: 800; color: var(--text-main); text-align: right;">
                        ${store.formatMoney(chargeAmt)}
                      </td>
                      <td style="padding: 10px 12px;">
                        <span class="badge ${statusBadgeClass}" style="font-size: 11px; padding: 2px 7px; border-radius: 6px;">
                          ${o.status || 'Processing'}
                        </span>
                      </td>
                      <td style="padding: 10px 12px;">
                        <span class="badge" style="background: rgba(99, 102, 241, 0.08); color: var(--primary); font-size: 11px; font-weight: 700;">
                          ${providerName}
                        </span>
                      </td>
                      <td style="padding: 10px 12px;" onclick="event.stopPropagation()">
                        ${realProvOrderId && realProvOrderId !== 'Pending' ? `
                          <div style="display: inline-flex; align-items: center; gap: 4px;">
                            <span class="badge" style="background: rgba(16, 185, 129, 0.12); color: #059669; font-family: var(--font-mono); font-weight: 800; font-size: 11px; padding: 2px 6px; border-radius: 4px; cursor: pointer;" onclick="navigator.clipboard.writeText('${realProvOrderId}'); window.store.showToast('Copied Provider Order ID: ${realProvOrderId}', 'success');" title="Click to copy Provider Order ID">
                              ${realProvOrderId}
                            </span>
                            <button type="button" onclick="navigator.clipboard.writeText('${realProvOrderId}'); window.store.showToast('Copied Provider Order ID: ${realProvOrderId}', 'success');" style="background: none; border: none; cursor: pointer; padding: 0; font-size: 10px; opacity: 0.7;" title="Copy Provider Order ID">📋</button>
                          </div>
                        ` : `
                          <span style="color: var(--text-muted); font-size: 11px; font-style: italic;">Pending Dispatch</span>
                        `}
                      </td>
                      <td style="padding: 10px 12px; text-align: right;" onclick="event.stopPropagation()">
                        <button class="btn btn-sm btn-outline" style="border-radius: 999px; font-size: 11px; padding: 4px 10px; font-weight: 700;" onclick="AdminApp.openOrderDetailsModal('${o.id}')">
                          View Order
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>

      <!-- MODAL FOOTER -->
      <div style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px; padding-top: 14px; border-top: 1.5px solid var(--border-color);">
        <button type="button" class="btn btn-secondary" style="border-radius: 10px; font-weight: 700; padding: 8px 20px;" onclick="CustomerApp.closeModal()">
          Close
        </button>
      </div>
    `;

    CustomerApp.openModal();
  },

  switchCustomerDetailsTab(tabId) {
    const paneLedger = document.getElementById('cust-pane-ledger');
    const paneOrders = document.getElementById('cust-pane-orders');
    const btnLedger = document.getElementById('cust-tab-btn-ledger');
    const btnOrders = document.getElementById('cust-tab-btn-orders');

    if (paneLedger) paneLedger.style.display = tabId === 'ledger' ? 'block' : 'none';
    if (paneOrders) paneOrders.style.display = tabId === 'orders' ? 'block' : 'none';

    if (btnLedger) {
      if (tabId === 'ledger') {
        btnLedger.className = 'btn btn-sm btn-primary';
      } else {
        btnLedger.className = 'btn btn-sm btn-outline';
      }
    }
    if (btnOrders) {
      if (tabId === 'orders') {
        btnOrders.className = 'btn btn-sm btn-primary';
      } else {
        btnOrders.className = 'btn btn-sm btn-outline';
      }
    }
  },

  // CUSTOMER SERVICES & PROFIT % TOOL
  renderCustomerServices(store) {
    const services = store.data.customerServices;
    const currentMarkup = store.data.adminStats.globalMarkupPercent || 50;

    return `
      <!-- GLOBAL PROFIT PERCENTAGE TOOL -->
      <div class="card" style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(168, 85, 247, 0.08)); border: 2px solid var(--primary); display: flex; flex-direction: column; gap: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div>
            <h3 style="font-size: 18px; font-weight: 800; color: var(--primary);">⚡ Global Profit Percentage & Dynamic No-Loss Tool</h3>
            <p style="font-size: 13px; color: var(--text-secondary); margin-top: 2px;">
              Automatically calculate customer selling prices from <strong>WorldOfSMM</strong> wholesale costs:
              <strong>Selling Price = Provider Cost × (1 + Markup %)</strong> (Never Sell at a Loss!)
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

      <!-- LIVE PROVIDER RATE AUTO-SYNC & PROFIT PROTECTION -->
      <div class="card" style="background: var(--card-bg); border: 1.5px solid rgba(16, 185, 129, 0.3); border-radius: 16px; padding: 18px 20px; display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(16, 185, 129, 0.12); color: #059669; display: flex; align-items: center; justify-content: center; font-size: 18px;">
              🔄
            </div>
            <div>
              <h4 style="font-size: 15.5px; font-weight: 800; color: var(--text-main); margin: 0;">
                Live Provider Rate Auto-Sync & Profit Shield
              </h4>
              <p style="font-size: 12.5px; color: var(--text-secondary); margin: 2px 0 0;">
                Real-time API sync protects against provider price hikes. Automatically adjusts customer selling prices so you never sell at a loss.
              </p>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <span class="badge badge-success" style="font-size: 12px; padding: 6px 12px; display: inline-flex; align-items: center; gap: 6px;">
              <span style="width: 7px; height: 7px; border-radius: 50%; background: #10B981; display: inline-block;"></span>
              Auto-Sync Active (30m)
            </span>
            <button class="btn btn-sm btn-primary" onclick="AdminApp.handleForceSyncLiveRates(this)" style="display: inline-flex; align-items: center; gap: 6px;">
              <span>🔄 Sync Live Rates Now</span>
            </button>
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--text-muted); border-top: 1px dashed var(--border-color); padding-top: 8px;">
          <span>Last Synced: <strong>${store.lastRatesSyncTime ? new Date(store.lastRatesSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending Initial Sync'}</strong></span>
          <span>Live Synced Rates in Cache: <strong>${Object.keys(store.liveRatesCache || {}).length}</strong></span>
        </div>
      </div>

      <!-- Services Table -->
      <div class="sync-table-container" style="margin-top: 20px;">
        <table class="sync-data-table">
          <thead>
            <tr>
              <th>Sub-Category & Package Name</th>
              <th>Platform</th>
              <th>WorldOfSMM Cost</th>
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
                    Subcategory: <em>${s.subcategory}</em> • ID #${s.rawId || s.id || 'N/A'}
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
                    ${store.formatMoney(store.getSellingPrice(s.wholesaleCost || 0.12))} / 1K
                  </strong>
                </td>
                <td>
                  <span class="badge badge-success">+${currentMarkup}% Profit</span>
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

  async handleForceSyncLiveRates(btn) {
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>⏳ Syncing API Rates...</span>';
    }
    const res = await window.store.syncLiveRates(true);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>🔄 Sync Live Rates Now</span>';
    }
    if (res && res.success) {
      const count = res.updatedCount || Object.keys(window.store.liveRatesCache || {}).length;
      window.store.showToast(`✅ Successfully synced ${count} live service rates from providers!`, 'success');
      this.render(document.getElementById('screen-container'));
    } else {
      window.store.showToast('⚠️ Could not sync live provider rates. Check network/API connection.', 'error');
    }
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
          const provLabel = provider === 'worldofsmm' ? 'WorldOfSMM' : (provider === 'socialfans' ? 'SocialFans' : 'Provider');
          window.store.showToast(`Fetched ${data.length} live services from ${provLabel}!`, 'success');
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
      if (prov === 'worldofsmm') {
        allServices = catalog.filter(s => s.provider === 'worldofsmm' || String(s.id).startsWith('wos-'));
      } else if (prov === 'socialfans') {
        allServices = catalog.filter(s => s.provider === 'socialfans' || String(s.id).startsWith('sf-'));
      } else {
        allServices = catalog;
      }
    }

    const normalized = allServices.map(s => {
      const sId = String(s.service || s.id);
      const rawId = String(s.rawId || s.service || sId.replace('wos-', '').replace('sf-', ''));
      const costUsd = prov === 'socialfans'
        ? (parseFloat(s.rate || s.cost || 0) / (store.data.exchangeRate || 95.385))
        : parseFloat(s.rate || s.cost || 0.1);
      return {
        ...s,
        id: prov === 'socialfans' ? (sId.startsWith('sf-') ? sId : `sf-${sId}`) : sId,
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
          <button class="provider-tab-btn ${prov === 'worldofsmm' ? 'active' : ''}" onclick="AdminApp.handleSelectProvider('worldofsmm')">
            <span>🇮🇳 WorldOfSMM (Funded $0.10)</span>
            <span class="badge ${prov === 'worldofsmm' ? 'badge-neutral' : 'badge-primary'}" style="font-size: 11px;">1,685 Live Services</span>
          </button>
          <button class="provider-tab-btn ${prov === 'socialfans' ? 'active' : ''}" onclick="AdminApp.handleSelectProvider('socialfans')">
            <span>🔥 SocialFans (Direct API)</span>
            <span class="badge ${prov === 'socialfans' ? 'badge-neutral' : 'badge-primary'}" style="font-size: 11px;">460 Live Services</span>
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
                      <div style="font-size: 10.5px; color: var(--text-muted); margin-top: 2px;">${isWos ? 'WorldOfSMM' : (prov === 'socialfans' ? 'SocialFans' : prov)}</div>
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
              <span><strong>${selectedCount}</strong> services selected from ${isWos ? 'WorldOfSMM' : (prov === 'socialfans' ? 'SocialFans' : prov)}</span>
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
          <p style="font-size: 13.5px;">Manage and monitor your upstream SMM API connections (WorldOfSMM + SocialFans).</p>
        </div>
      </div>

      <div class="provider-cards-grid">
        ${providers.map(p => {
          const isZeroBalance = !p.balance || p.balance <= 0.001;
          const isINR = p.currency === 'INR';
          const inrApprox = isINR ? ((p.balance || 0)).toFixed(0) : ((p.balance || 0) * 87).toFixed(0);
          const avatarIcon = p.id === 'p3' ? '🔥' : '🇮🇳';
          const balanceFormatted = isINR 
            ? `₹${p.balance !== null ? p.balance.toFixed(2) : '0.00'} INR`
            : `$${p.balance !== null ? p.balance.toFixed(2) : '0.00'} USD`;
          const subText = p.id === 'p3' ? 'Direct API (India/Global)' : 'Zero Duplicates (Indian)';

          return `
          <div class="provider-card status-active" style="${isZeroBalance ? 'border-color: rgba(245, 158, 11, 0.4);' : ''}">
            <div class="provider-card-header">
              <div class="provider-identity">
                <div class="provider-avatar-box">${avatarIcon}</div>
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
                  ${balanceFormatted}
                </span>
                ${!isINR ? `<span style="font-size: 11px; color: var(--text-muted);">≈ ₹${inrApprox} INR</span>` : ''}
              </div>
              <div class="provider-stat-col">
                <span class="provider-stat-label">Curated Services</span>
                <span class="provider-stat-val">${p.activeServices}</span>
                <span style="font-size: 11px; color: var(--text-muted);">${subText}</span>
              </div>
            </div>

            ${isZeroBalance ? `
              <div style="margin: 10px 0; padding: 8px 12px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; font-size: 12px; color: #B45309; display: flex; align-items: center; gap: 6px;">
                <span>⚠️</span>
                <span><strong>Zero Balance:</strong> Top up on ${p.name} ${p.id === 'p1' ? 'via Crypto' : 'via UPI/Paytm'} to fulfill live orders.</span>
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
          <p style="font-size: 13.5px;">Monitor customer-initiated refills routed to upstream providers.</p>
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
    if (!order) return 'N/A';
    if (order.serviceSnapshot?.rawServiceId && String(order.serviceSnapshot.rawServiceId) !== 'N/A') {
      return String(order.serviceSnapshot.rawServiceId).replace(/^wos-/, '').replace(/^sf-/, '').replace(/^jap-/, '');
    }
    if (order.serviceSnapshot?.providerServiceId && String(order.serviceSnapshot.providerServiceId) !== 'N/A') {
      return String(order.serviceSnapshot.providerServiceId).replace(/^wos-/, '').replace(/^sf-/, '').replace(/^jap-/, '');
    }
    if (order.providerServiceId && String(order.providerServiceId) !== 'N/A' && String(order.providerServiceId) !== 'undefined' && String(order.providerServiceId) !== 'null') {
      return String(order.providerServiceId).replace(/^wos-/, '').replace(/^sf-/, '').replace(/^jap-/, '');
    }
    if (order.rawServiceId && String(order.rawServiceId) !== 'N/A' && String(order.rawServiceId) !== 'undefined' && String(order.rawServiceId) !== 'null' && String(order.rawServiceId).trim() !== '') {
      return String(order.rawServiceId).replace(/^wos-/, '').replace(/^sf-/, '').replace(/^jap-/, '');
    }
    // Check in customerServices catalog
    const custSvc = (window.mockData?.customerServices || []).find(s => String(s.id) === String(order.serviceId));
    if (custSvc && (custSvc.sfId || custSvc.wosId || custSvc.rawId)) {
      return String(custSvc.sfId || custSvc.wosId || custSvc.rawId);
    }
    // Check in window.JAP_SERVICES
    const matchedSvc = (window.JAP_SERVICES || []).find(s => String(s.id) === String(order.serviceId) || String(s.rawId) === String(order.serviceId));
    if (matchedSvc) {
      return String(matchedSvc.rawId || matchedSvc.id).replace(/^wos-/, '').replace(/^sf-/, '').replace(/^jap-/, '');
    }
    if (order.serviceId && String(order.serviceId) !== 'null' && String(order.serviceId) !== 'undefined' && String(order.serviceId) !== 'N/A') {
      return String(order.serviceId).replace(/^wos-/, '').replace(/^sf-/, '').replace(/^jap-/, '');
    }
    return 'N/A';
  },

  handleAdminOrdersSearch(val) {
    this.adminOrdersSearch = val;
    this.updateAdminOrdersTableView();
  },

  selectedOrderIds: new Set(),

  renderAdminOrdersBulkBar() {
    const count = this.selectedOrderIds ? this.selectedOrderIds.size : 0;
    if (count === 0) return '';
    return `
      <div class="admin-bulk-action-bar" style="display: flex; align-items: center; justify-content: space-between; background: linear-gradient(135deg, #1E1B4B, #312E81); color: white; padding: 12px 18px; border-radius: 14px; box-shadow: 0 6px 20px rgba(49, 46, 129, 0.28); margin-bottom: 8px; flex-wrap: wrap; gap: 10px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 20px;">☑️</span>
          <span style="font-weight: 800; font-size: 14px; letter-spacing: 0.2px;">
            ${count} ${count === 1 ? 'Order' : 'Orders'} Selected
          </span>
        </div>
        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <button 
            type="button" 
            class="btn btn-sm" 
            onclick="AdminApp.deleteSelectedOrders()" 
            style="background: #EF4444; color: white; font-weight: 800; border-radius: 999px; padding: 8px 18px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 10px rgba(239, 68, 68, 0.35); font-size: 13px;"
          >
            <span>🗑️</span>
            <span>Delete Selected (${count})</span>
          </button>
          <button 
            type="button" 
            class="btn btn-sm btn-outline" 
            onclick="AdminApp.clearSelectedOrders()" 
            style="color: white; border-color: rgba(255, 255, 255, 0.4); border-radius: 999px; font-weight: 700; padding: 7px 16px; font-size: 12.5px; background: rgba(255,255,255,0.08);"
          >
            ✕ Deselect All
          </button>
        </div>
      </div>
    `;
  },

  toggleSelectAllOrders(event) {
    const checked = event.target.checked;
    const store = window.store;
    const filtered = this.getFilteredOrders(store);

    if (!this.selectedOrderIds) this.selectedOrderIds = new Set();

    if (checked) {
      filtered.forEach(o => this.selectedOrderIds.add(String(o.id)));
    } else {
      this.selectedOrderIds.clear();
    }
    this.updateAdminOrdersTableView();
  },

  toggleSelectOrder(orderId, event) {
    if (event) event.stopPropagation();
    if (!this.selectedOrderIds) this.selectedOrderIds = new Set();
    const sId = String(orderId);
    if (this.selectedOrderIds.has(sId)) {
      this.selectedOrderIds.delete(sId);
    } else {
      this.selectedOrderIds.add(sId);
    }
    this.updateAdminOrdersTableView();
  },

  clearSelectedOrders() {
    if (this.selectedOrderIds) this.selectedOrderIds.clear();
    this.updateAdminOrdersTableView();
  },

  deleteSelectedOrders() {
    const ids = Array.from(this.selectedOrderIds || []);
    if (ids.length === 0) {
      window.store.showToast('No orders selected for deletion.', 'info');
      return;
    }

    const modal = document.getElementById('generic-modal-backdrop');
    const sheet = document.getElementById('generic-modal-sheet');
    if (!modal || !sheet) return;

    sheet.className = 'modal-sheet';
    sheet.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title" style="color: #DC2626; display: flex; align-items: center; gap: 8px;">
          <span>🗑️</span>
          <span>Delete ${ids.length} Selected Order(s)?</span>
        </h3>
        <button class="modal-close" onclick="CustomerApp.closeModal()">&times;</button>
      </div>
      <div style="padding: 10px 0;">
        <p style="font-size: 14px; color: var(--text-main); margin-bottom: 12px; line-height: 1.5;">
          Are you sure you want to remove <strong>${ids.length} order(s)</strong> from the Admin Console view?
        </p>
        <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 10px; padding: 12px; font-size: 12.5px; color: #065F46; margin-bottom: 16px;">
          🛡️ <strong>Safety Guarantee:</strong> Customer accounts, active order delivery, provider processing, and wallet history are 100% protected and unaffected. This action only cleans your admin panel view.
        </div>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button type="button" class="btn btn-outline" onclick="CustomerApp.closeModal()" style="border-radius: 10px; font-weight: 700;">
            Cancel
          </button>
          <button type="button" class="btn btn-danger" onclick="AdminApp.confirmDeleteOrders(${JSON.stringify(ids).replace(/"/g, '&quot;')})" style="background: #DC2626; color: white; border-radius: 10px; font-weight: 800; padding: 8px 20px; border: none; cursor: pointer;">
            Yes, Delete from Admin 🗑️
          </button>
        </div>
      </div>
    `;
    modal.classList.add('active');
  },

  deleteSingleOrder(orderId, event) {
    if (event) event.stopPropagation();
    this.selectedOrderIds = new Set([String(orderId)]);
    this.deleteSelectedOrders();
  },

  confirmDeleteOrders(ids) {
    const store = window.store;
    if (!store) return;
    const res = store.adminDeleteOrders(ids);
    if (this.selectedOrderIds) this.selectedOrderIds.clear();
    CustomerApp.closeModal();
    store.showToast(`${res.count || ids.length} order(s) removed from Admin Console. 🧹`, 'success');
    this.updateAdminOrdersTableView();
  },

  handleAdminRefund(orderId) {
    const store = window.store;
    if (!store) return;
    const allOrders = store.getAllAdminOrders ? store.getAllAdminOrders() : store.data.orders;
    const order = allOrders.find(o => String(o.id) === String(orderId) || String(o.providerOrderId) === String(orderId));
    if (!order) {
      alert(`Order #${orderId} not found.`);
      return;
    }

    const exactAmount = Number(order.amount) || Number(order.charge) || 0;
    const formattedAmount = store.formatMoney(exactAmount);
    const custEmail = order.userEmail || order.customerEmail || 'Customer';

    const confirmed = confirm(`Are you sure you want to refund ${formattedAmount} to customer (${custEmail}) for Order #${order.id}?\n\nThis will add exactly ${formattedAmount} back to the customer's LikeX wallet balance.`);
    if (confirmed) {
      store.adminRefundOrder(orderId, 'Refunded by Admin from Master Orders Table');
      this.updateAdminOrdersTableView();
    }
  },

  async handleRetryOrder(orderId) {
    const store = window.store;
    if (!store) return;
    const allOrders = store.getAllAdminOrders ? store.getAllAdminOrders() : store.data.orders;
    const order = allOrders.find(o => String(o.id) === String(orderId) || String(o.providerOrderId) === String(orderId));
    if (!order) {
      alert(`Order #${orderId} not found.`);
      return;
    }

    const confirmed = confirm(`Retry dispatching Order #${order.id} (${order.serviceName || 'Service'}) to ${order.providerDisplayName || 'Provider'}?`);
    if (confirmed) {
      await store.adminRetryOrder(orderId);
      this.updateAdminOrdersTableView();
    }
  },

  getFilteredOrders(store) {
    const s = store || window.store;
    const allOrders = (s && s.getAllAdminOrders ? s.getAllAdminOrders() : s?.data?.orders) || [];
    const query = (this.adminOrdersSearch || '').trim().toLowerCase();
    const cleanQuery = query.replace(/^[#lx\-]+/i, '');
    const filter = this.adminOrdersFilter || 'all';

    let filtered = allOrders;
    if (filter !== 'all') {
      if (filter === 'queued') {
        filtered = filtered.filter(o => {
          const st = (o.status || '').toLowerCase();
          return st === 'queued' || o.isQueued || o.needsTopup || o.isLowBalance || st.includes('topup') || st.includes('top-up') || st.includes('low balance');
        });
      } else if (filter === 'partial') {
        filtered = filtered.filter(o => {
          const st = (o.status || '').toLowerCase();
          return st === 'partial';
        });
      } else if (filter === 'refunded') {
        filtered = filtered.filter(o => {
          const st = (o.status || '').toLowerCase();
          return st === 'refunded' || st === 'canceled';
        });
      } else if (filter === 'in_progress') {
        filtered = filtered.filter(o => {
          const st = (o.status || '').toLowerCase();
          return st === 'in_progress' || st === 'in progress';
        });
      } else if (filter === 'processing') {
        filtered = filtered.filter(o => {
          const st = (o.status || '').toLowerCase();
          return st === 'processing';
        });
      } else if (filter === 'completed') {
        filtered = filtered.filter(o => {
          const st = (o.status || '').toLowerCase();
          return st === 'completed';
        });
      } else {
        filtered = filtered.filter(o => (o.status || '').toLowerCase().replace(/\s+/g, '_') === filter.toLowerCase());
      }
    }

    if (query) {
      filtered = filtered.filter(o => {
        const idStr = String(o.id || '').toLowerCase();
        const lxStr = String(o.likeXOrderId || '').toLowerCase();
        const svcId = this.getOrderServiceId(o).toLowerCase();
        const rawIdStr = String(o.serviceId || '').toLowerCase();
        const provIdStr = String(o.providerOrderId || '').toLowerCase();
        const nameStr = String(o.serviceName || '').toLowerCase();
        const targetStr = String(o.target || '').toLowerCase();
        const statusStr = String(o.status || '').toLowerCase();
        const provStr = String(o.provider || '').toLowerCase();
        const provDisplayStr = String(o.providerDisplayName || '').toLowerCase();
        const emailStr = String(o.userEmail || o.customerEmail || '').toLowerCase();
        const custNameStr = String(o.customerName || '').toLowerCase();
        const commentsStr = String(o.comments || '').toLowerCase();
        const dateStr = String(o.date || '').toLowerCase();
        const errStr = String(o.errorReason || o.refillReason || '').toLowerCase();

        return idStr.includes(query) ||
               (cleanQuery && idStr.includes(cleanQuery)) ||
               lxStr.includes(query) ||
               (cleanQuery && lxStr.includes(cleanQuery)) ||
               svcId.includes(query) ||
               (cleanQuery && svcId.includes(cleanQuery)) ||
               rawIdStr.includes(query) ||
               (cleanQuery && rawIdStr.includes(cleanQuery)) ||
               provIdStr.includes(query) ||
               (cleanQuery && provIdStr.includes(cleanQuery)) ||
               nameStr.includes(query) ||
               targetStr.includes(query) ||
               statusStr.includes(query) ||
               provStr.includes(query) ||
               provDisplayStr.includes(query) ||
               emailStr.includes(query) ||
               custNameStr.includes(query) ||
               commentsStr.includes(query) ||
               dateStr.includes(query) ||
               errStr.includes(query);
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
            <p style="font-size: 13px; margin-top: 6px; color: var(--text-secondary);">Directly search by LikeX Order ID (#LX12345), Upstream Provider Order ID (#987654), Customer Email, or Service ID, or reset search filters.</p>
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
      const sIdStr = String(o.serviceSnapshot?.rawServiceId || o.serviceSnapshot?.serviceId || o.serviceId || o.rawServiceId || '');
      const provKey = String(o.serviceSnapshot?.provider || o.provider || '').toLowerCase();
      const provIdStr = String(o.providerOrderId || '');

      // Strictly distinguish Provider Origin
      const isSf = provKey === 'socialfans' ||
                   sIdStr.startsWith('sf-') ||
                   (o.serviceSnapshot?.providerDisplayName && o.serviceSnapshot.providerDisplayName.includes('SocialFans')) ||
                   (o.providerDisplayName && o.providerDisplayName.includes('SocialFans'));

      const isWos = provKey === 'worldofsmm' || 
                    sIdStr.startsWith('wos-') || 
                    provKey.includes('wos') ||
                    (!isSf && (provIdStr.startsWith('58') || provIdStr.startsWith('59') || String(o.id).startsWith('58')));

      const isLow = o.isLowBalance || (o.status && o.status.includes('Low Provider Balance'));

      const custEmail = o.userEmail || o.customerEmail || '';
      const custName = o.customerName || (custEmail ? custEmail.split('@')[0] : 'Customer');
      const avatarLetter = (custName || 'C').charAt(0).toUpperCase();
      const custCode = o.customerId || o.customerCode || (custEmail ? store.getCustomerId(custEmail) : null);

      // Formatted IDs
      const rawIdVal = o.likeXOrderId || o.id;
      const displayLikeXId = store.formatLikeXOrderId ? store.formatLikeXOrderId(rawIdVal) : (String(rawIdVal).startsWith('LX') ? rawIdVal : 'LX' + rawIdVal);
      const dateOnly = store.formatDateOnly ? store.formatDateOnly(o.createdAt || o.date) : (o.date || 'Recently');
      const timeOnly = store.formatTimeOnly ? store.formatTimeOnly(o.createdAt || o.date) : '';

      let svcDisplayName = o.serviceSnapshot?.serviceName || ((o.serviceName && !o.serviceName.includes('null') && !o.serviceName.includes('undefined')) ? o.serviceName : '');
      if (!svcDisplayName || svcDisplayName.startsWith('Service #')) {
        const activeServices = (store.getActiveServices ? store.getActiveServices() : window.JAP_SERVICES) || [];
        const matched = activeServices.find(s => String(s.id) === String(o.serviceId) || String(s.rawId) === String(o.serviceId) || String(s.rawId) === String(svcId));
        if (matched) {
          svcDisplayName = matched.customerName || matched.name;
        } else {
          svcDisplayName = (svcId && svcId !== 'N/A') ? `Social Growth Service #${svcId}` : 'Social Growth Service';
        }
      }

      let platformIcon = '⚡';
      const lowSvc = (svcDisplayName || '').toLowerCase();
      if (lowSvc.includes('instagram') || o.platform === 'instagram') platformIcon = '📸';
      else if (lowSvc.includes('youtube') || o.platform === 'youtube') platformIcon = '▶️';
      else if (lowSvc.includes('tiktok') || o.platform === 'tiktok') platformIcon = '🎵';
      else if (lowSvc.includes('twitter') || lowSvc.includes(' x ') || o.platform === 'twitter') platformIcon = '🐦';
      else if (lowSvc.includes('telegram') || o.platform === 'telegram') platformIcon = '✈️';
      else if (lowSvc.includes('facebook') || o.platform === 'facebook') platformIcon = '📘';
      else if (lowSvc.includes('spotify') || o.platform === 'spotify') platformIcon = '🎧';

      // Financials
      const charge = Number(o.amount || 0);
      const cost = Number(o.cost || o.providerCost || 0);
      const profit = charge - cost;
      const margin = o.marginPercent !== undefined ? o.marginPercent : (charge > 0 ? Math.round((profit / charge) * 100) : 0);

      // Progress & counts
      const hasCounts = o.start_count !== undefined && o.start_count !== null && o.remains !== undefined && o.remains !== null;
      const qty = Number(o.quantity || 1000);
      const remains = Number(o.remains || 0);
      const delivered = Math.max(0, qty - remains);
      const progressPct = qty > 0 ? Math.min(100, Math.max(0, Math.round((delivered / qty) * 100))) : 0;

      const isSelected = this.selectedOrderIds && this.selectedOrderIds.has(String(o.id));
      return `
        <tr style="cursor: pointer; ${isSelected ? 'background: rgba(99, 102, 241, 0.08);' : ''}" onclick="AdminApp.openOrderDetailsModal('${o.id}', event)">
          <!-- 0. SELECT CHECKBOX -->
          <td style="text-align: center; padding-left: 12px; padding-right: 6px; width: 42px;" onclick="event.stopPropagation()">
            <input 
              type="checkbox" 
              class="admin-order-row-checkbox" 
              data-order-id="${o.id}" 
              ${isSelected ? 'checked' : ''} 
              onchange="AdminApp.toggleSelectOrder('${o.id}', event)" 
              style="width: 16px; height: 16px; cursor: pointer; accent-color: var(--primary);" 
              title="Select order #${displayLikeXId}"
            />
          </td>

          <!-- 1. LIKEX ORDER ID & CREATION TIME -->
          <td>
            <div style="display: flex; flex-direction: column; gap: 3px;" onclick="event.stopPropagation()">
              <div style="display: inline-flex; align-items: center; gap: 6px;">
                <span style="font-family: var(--font-mono); font-weight: 800; font-size: 13.5px; color: var(--primary); cursor: pointer;" title="Click to copy LikeX Order ID" onclick="navigator.clipboard.writeText('${displayLikeXId}'); window.store.showToast('LikeX Order ID ${displayLikeXId} copied!', 'success');">
                  #${displayLikeXId}
                </span>
                <button type="button" class="btn-copy-id" title="Copy LikeX Order ID" onclick="navigator.clipboard.writeText('${displayLikeXId}'); window.store.showToast('LikeX Order ID ${displayLikeXId} copied!', 'success');" style="background: none; border: none; cursor: pointer; padding: 2px 4px; font-size: 11px;">📋</button>
              </div>
              <div style="font-size: 11px; color: var(--text-secondary); display: flex; align-items: center; gap: 4px;">
                <span>📅 ${dateOnly}</span>
                ${timeOnly ? `<span style="opacity: 0.7;">• ${timeOnly}</span>` : ''}
              </div>
            </div>
          </td>

          <!-- 2. CUSTOMER -->
          <td>
            <div style="display: flex; align-items: center; gap: 9px;" onclick="event.stopPropagation()">
              <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #6366F1, #9333EA); color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; flex-shrink: 0; box-shadow: 0 2px 6px rgba(99, 102, 241, 0.25); cursor: pointer;" title="View Customer Details" onclick="AdminApp.openCustomerDetailsModal('${custEmail || custCode}')">
                ${avatarLetter}
              </div>
              <div style="min-width: 0;">
                <div style="display: flex; align-items: center; gap: 5px;">
                  <div style="font-weight: 800; font-size: 13px; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 130px; cursor: pointer;" title="View Customer Details" onclick="AdminApp.openCustomerDetailsModal('${custEmail || custCode}')">
                    ${custName}
                  </div>
                  ${custCode ? `
                    <span style="font-size: 10px; font-weight: 800; font-family: var(--font-mono); color: var(--primary); background: rgba(99, 102, 241, 0.12); padding: 1px 5px; border-radius: 4px; cursor: pointer;" title="Click to view Customer Details for ${custCode}" onclick="AdminApp.openCustomerDetailsModal('${custEmail || custCode}')">
                      ${custCode}
                    </span>
                  ` : ''}
                </div>
                <div style="font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 4px; margin-top: 2px;">
                  <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 115px;" title="${custEmail || 'Guest Customer'}">
                    ${custEmail || 'Guest Customer'}
                  </span>
                  ${custEmail ? `
                    <button type="button" title="Copy Email" onclick="navigator.clipboard.writeText('${custEmail}'); window.store.showToast('Customer email copied!', 'success');" style="background: none; border: none; cursor: pointer; padding: 0; font-size: 10px; opacity: 0.7;">📋</button>
                  ` : ''}
                </div>
              </div>
            </div>
          </td>

          <!-- 3. SERVICE & SERVICE ID -->
          <td>
            <div style="display: flex; align-items: flex-start; gap: 7px;">
              <span style="font-size: 16px; line-height: 1.2; flex-shrink: 0; margin-top: 1px;">${platformIcon}</span>
              <div style="min-width: 0;">
                <div style="font-weight: 700; color: var(--text-main); font-size: 13.5px; line-height: 1.4;">
                  ${svcDisplayName}
                </div>
                <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px; font-size: 11px; flex-wrap: wrap;" onclick="event.stopPropagation()">
                  <span class="badge" style="background: rgba(99, 102, 241, 0.12); color: #4338CA; font-weight: 800; font-family: var(--font-mono); font-size: 11px; padding: 2px 7px; border-radius: 6px; border: 1px solid rgba(99, 102, 241, 0.25); cursor: pointer;" title="Click to copy Service ID" onclick="navigator.clipboard.writeText('${svcId}'); window.store.showToast('Service ID #${svcId} copied!', 'success');">
                    SVC #${svcId}
                  </span>
                  ${o.comments ? `
                    <span style="color: #7C3AED; font-weight: 700; background: rgba(124, 58, 237, 0.1); padding: 2px 7px; border-radius: 6px;" title="${o.comments}">
                      💬 Comments
                    </span>
                  ` : ''}
                </div>
              </div>
            </div>
          </td>

          <!-- 4. PROVIDER & UPSTREAM ORDER ID -->
          <td>
            <div style="display: flex; flex-direction: column; gap: 4px;" onclick="event.stopPropagation()">
              <div>
                ${isSf ? `
                  <span class="badge" style="background: rgba(245, 158, 11, 0.15); color: #D97706; font-weight: 800; border: 1px solid rgba(245, 158, 11, 0.3); display: inline-flex; align-items: center; gap: 4px; font-size: 11.5px;">
                    🔥 SocialFans
                  </span>
                ` : (isWos ? `
                  <span class="badge" style="background: rgba(37, 211, 102, 0.15); color: #075E54; font-weight: 800; border: 1px solid rgba(37, 211, 102, 0.3); display: inline-flex; align-items: center; gap: 4px; font-size: 11.5px;">
                    🇮🇳 WorldOfSMM
                  </span>
                ` : `
                  <span class="badge" style="background: rgba(99, 102, 241, 0.15); color: #4338CA; font-weight: 800; border: 1px solid rgba(99, 102, 241, 0.3); display: inline-flex; align-items: center; gap: 4px; font-size: 11.5px;">
                    ⚡ Upstream API
                  </span>
                `)}
              </div>
              <div style="font-size: 11px; font-family: var(--font-mono); color: var(--text-secondary); display: flex; align-items: center; gap: 6px;">
                ${o.providerOrderId ? `
                  <span style="font-weight: 700; color: var(--text-main); cursor: pointer;" title="Click to copy Provider Order ID" onclick="navigator.clipboard.writeText('${o.providerOrderId}'); window.store.showToast('Provider Order ID #${o.providerOrderId} copied!', 'success');">
                    #${o.providerOrderId}
                  </span>
                  <button type="button" title="Search on Provider Panel" onclick="AdminApp.openProviderSearch('${isSf ? 'socialfans' : 'worldofsmm'}', '${o.providerOrderId}', event)" style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.25); color: var(--primary); border-radius: 4px; cursor: pointer; padding: 1px 5px; font-size: 10px; font-weight: 700;" title="Open orders list on provider panel">Panel ↗</button>
                ` : `
                  <span style="color: var(--text-muted); font-size: 11px; font-style: italic;">N/A</span>
                `}
              </div>
            </div>
          </td>

          <!-- 5. TARGET URL & QUANTITY -->
          <td>
            <div style="display: flex; flex-direction: column; gap: 3px;" onclick="event.stopPropagation()">
              <div style="display: flex; align-items: center; gap: 4px; max-width: 170px;">
                <a href="${o.target}" target="_blank" rel="noopener noreferrer" style="color: var(--primary); text-decoration: underline; font-weight: 600; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${o.target}">
                  ${o.target || '—'}
                </a>
                ${o.target ? `
                  <button type="button" title="Copy Link" onclick="navigator.clipboard.writeText('${o.target}'); window.store.showToast('Target URL copied!', 'success');" style="background: none; border: none; cursor: pointer; padding: 0 2px; font-size: 11px; opacity: 0.7; flex-shrink: 0;">📋</button>
                ` : ''}
              </div>
              <div style="font-size: 11.5px; font-weight: 700; color: var(--text-secondary);">
                Qty: <span style="color: var(--text-main); font-weight: 800;">${qty.toLocaleString()}</span>
              </div>
            </div>
          </td>

          <!-- 6. FINANCIALS (CHARGE / COST / PROFIT) -->
          <td>
            <div style="display: flex; flex-direction: column; gap: 2px;">
              <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 8px;">
                <span style="font-size: 11px; color: var(--text-muted);">Charge:</span>
                <strong style="color: var(--text-main); font-size: 13.5px;">${store.formatMoney(charge)}</strong>
              </div>
              ${cost > 0 ? `
                <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 8px; font-size: 11px;">
                  <span style="color: var(--text-muted);">Cost:</span>
                  <span style="color: var(--text-secondary);">${store.formatMoney(cost)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 8px; font-size: 11px; margin-top: 1px;">
                  <span style="color: var(--text-muted);">Profit:</span>
                  <span style="font-weight: 800; color: ${profit >= 0 ? '#10B981' : '#EF4444'};">
                    +₹${profit.toFixed(2)} (${margin}%)
                  </span>
                </div>
              ` : `
                <div style="font-size: 10.5px; color: var(--text-muted);">Cost: N/A</div>
              `}
            </div>
          </td>

          <!-- 7. STATUS & LIVE PROGRESS -->
          <td>
            <div style="display: flex; flex-direction: column; gap: 4px;">
              ${(isLow || o.isQueued || o.needsTopup || String(o.status).toLowerCase() === 'queued' || (String(o.id).length <= 5 && String(o.status).toLowerCase() !== 'completed' && String(o.status).toLowerCase() !== 'refunded' && !String(o.status).toLowerCase().includes('progress'))) ? `
                <span class="badge" style="background: rgba(239, 68, 68, 0.15); color: #DC2626; border: 1px solid rgba(239, 68, 68, 0.3); font-weight: 800; display: inline-flex; align-items: center; gap: 4px; font-size: 11px;">
                  ⚠️ Queued Top-Up
                </span>
                <div style="display: flex; gap: 4px; margin-top: 2px;" onclick="event.stopPropagation()">
                  <button type="button" class="btn btn-xs" style="background: #10B981; color: white; border: none; font-weight: 800; border-radius: 6px; padding: 2px 7px; font-size: 10.5px; cursor: pointer;" onclick="window.store.dispatchQueuedOrder ? window.store.dispatchQueuedOrder('${o.id}') : AdminApp.handleRetryOrder('${o.id}')" title="1-Click Dispatch order to provider">
                    ⚡ Dispatch
                  </button>
                  <button type="button" class="btn btn-xs" style="background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA; font-weight: 800; border-radius: 6px; padding: 2px 7px; font-size: 10.5px; cursor: pointer;" onclick="AdminApp.handleAdminRefund('${o.id}')" title="Refund exact amount to customer wallet">
                    💸 Refund
                  </button>
                </div>
              ` : (String(o.status).toLowerCase() === 'partial') ? `
                <span class="badge" style="background: rgba(245, 158, 11, 0.15); color: #B45309; border: 1px solid rgba(245, 158, 11, 0.3); font-weight: 800;">
                  ⚡ Partial (${o.remains !== undefined ? o.remains : '0'} Remains)
                </span>
              ` : (String(o.status).toLowerCase() === 'completed') ? `
                <span class="badge badge-success" style="font-weight: 800;">Completed</span>
              ` : (String(o.status).toLowerCase() === 'in_progress' || String(o.status).toLowerCase() === 'in progress') ? `
                <span class="badge" style="background: rgba(139, 92, 246, 0.15); color: #7C3AED; font-weight: 800; border: 1px solid rgba(139, 92, 246, 0.3);">
                  In Progress
                </span>
              ` : (String(o.status).toLowerCase() === 'refunded' || String(o.status).toLowerCase() === 'canceled') ? `
                <span class="badge" style="background: rgba(100, 116, 139, 0.15); color: #475569; font-weight: 800; border: 1px solid rgba(100, 116, 139, 0.3);">
                  ✓ Refunded
                </span>
              ` : `
                <span class="badge badge-primary" style="font-weight: 800;">${o.status || 'Processing'}</span>
              `}

              ${hasCounts ? `
                <div style="margin-top: 3px;">
                  <div style="display: flex; justify-content: space-between; font-size: 10px; color: var(--text-secondary); margin-bottom: 2px;">
                    <span>${delivered.toLocaleString()} / ${qty.toLocaleString()}</span>
                    <span style="font-weight: 700;">${progressPct}%</span>
                  </div>
                  <div style="height: 4px; background: rgba(0, 0, 0, 0.08); border-radius: 999px; overflow: hidden;">
                    <div style="height: 100%; width: ${progressPct}%; background: ${progressPct >= 100 ? '#10B981' : '#6366F1'}; border-radius: 999px; transition: width 0.3s ease;"></div>
                  </div>
                </div>
              ` : ''}
            </div>
          </td>

          <!-- 8. ACTIONS -->
          <td>
            <div style="display: flex; align-items: center; gap: 6px;" onclick="event.stopPropagation()">
              <button 
                type="button" 
                class="btn btn-xs btn-outline" 
                onclick="AdminApp.openOrderDetailsModal('${o.id}', event)" 
                style="border-radius: 8px; font-weight: 700; padding: 4px 9px; font-size: 11px; white-space: nowrap;" 
                title="View complete 9-section order details"
              >
                👁️ Details
              </button>
              <button 
                type="button" 
                class="btn btn-xs btn-secondary" 
                onclick="AdminApp.handleSyncSingleOrder('${o.id}', this, event)" 
                style="border-radius: 8px; font-weight: 700; padding: 4px 7px; font-size: 11px;" 
                title="Query live provider status now"
              >
                🔄
              </button>
              <button 
                type="button" 
                class="btn btn-xs" 
                onclick="AdminApp.deleteSingleOrder('${o.id}', event)" 
                style="border-radius: 8px; font-weight: 700; padding: 4px 7px; font-size: 11px; background: rgba(239, 68, 68, 0.1); color: #DC2626; border: 1px solid rgba(239, 68, 68, 0.25); cursor: pointer;" 
                title="Delete this order from Admin Console"
              >
                🗑️
              </button>
            </div>
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
    const bulkContainer = document.getElementById('admin-orders-bulk-bar-container');
    const masterCb = document.getElementById('admin-orders-master-checkbox');

    if (!tbody) {
      const screenContainer = document.getElementById('screen-container');
      this.render(screenContainer);
      return;
    }

    const allOrders = (store.getAllAdminOrders ? store.getAllAdminOrders() : store.data.orders) || [];
    const filtered = this.getFilteredOrders(store);

    tbody.innerHTML = this.renderAdminOrderRows(filtered, store);

    if (bulkContainer) {
      bulkContainer.innerHTML = this.renderAdminOrdersBulkBar();
    }

    if (masterCb) {
      const hasSelected = this.selectedOrderIds && this.selectedOrderIds.size > 0;
      const allSelected = filtered.length > 0 && filtered.every(o => this.selectedOrderIds && this.selectedOrderIds.has(String(o.id)));
      masterCb.checked = allSelected;
      masterCb.indeterminate = hasSelected && !allSelected;
    }

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
    const queuedOrders = allOrders.filter(o => {
      if (!o) return false;
      const st = (o.status || '').toLowerCase();
      return o.isQueued || o.needsTopup || o.isLowBalance || st === 'queued' || st.includes('topup') || st.includes('top-up') || st.includes('low balance');
    });

    const hasSelected = this.selectedOrderIds && this.selectedOrderIds.size > 0;
    const allSelected = filtered.length > 0 && filtered.every(o => this.selectedOrderIds && this.selectedOrderIds.has(String(o.id)));

    return `
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <!-- Dynamic Bulk Action Bar for Selected Orders -->
        <div id="admin-orders-bulk-bar-container">
          ${this.renderAdminOrdersBulkBar()}
        </div>

        ${queuedOrders.length > 0 ? `
          <!-- HIGH-PRIORITY QUEUED ORDERS WAITING FOR PROVIDER TOP-UP -->
          <div class="card" style="margin-bottom: 2px; padding: 18px 20px; border: 1.5px solid #EF4444; background: linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(245, 158, 11, 0.08)); border-radius: 16px; box-shadow: 0 4px 16px rgba(239, 68, 68, 0.08);">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 26px;">🚨</span>
                <div>
                  <h4 style="font-size: 16.5px; font-weight: 800; color: #DC2626; margin: 0;">
                    ${queuedOrders.length} Order(s) Queued — Waiting for Provider Top-Up
                  </h4>
                  <p style="font-size: 13px; color: #B45309; margin: 3px 0 0;">
                    Customer payment received. Recharge provider account and click <strong>"1-Click Dispatch All"</strong> or dispatch individual orders below.
                  </p>
                </div>
              </div>
              <div style="display: flex; gap: 8px;">
                <button class="btn btn-sm" style="background: #10B981; color: white; font-weight: 800; border-radius: 999px; padding: 7px 18px; font-size: 13px; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);" onclick="AdminApp.dispatchAllQueuedOrders()">
                  ⚡ 1-Click Dispatch All Queued (${queuedOrders.length})
                </button>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Top Toolbar with Live Search, Manual Order Creation & Live Sync -->
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 14px; flex-wrap: wrap;">
          <div style="position: relative; flex: 1; min-width: 280px; max-width: 520px;">
            <span style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 16px; opacity: 0.6; pointer-events: none;">🔍</span>
            <input 
              id="admin-orders-search-input"
              type="text" 
              class="form-control" 
              placeholder="Search LikeX Order ID (#LX12345), Provider Order ID, Customer, Link..." 
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

          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <span id="admin-orders-count-label" style="font-size: 13px; font-weight: 700; color: var(--text-secondary); margin-right: 4px;">
              Showing ${filtered.length} of ${allOrders.length} Orders
            </span>
            <button class="btn btn-primary btn-sm" style="display: inline-flex; align-items: center; gap: 6px; border-radius: 999px; font-weight: 800; background: linear-gradient(135deg, #10B981, #059669); box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);" onclick="AdminApp.openCreateManualOrderModal()">
              <span>➕</span>
              <span>Create Manual Order</span>
            </button>
            <button class="btn btn-outline btn-sm" style="display: inline-flex; align-items: center; gap: 6px; border-radius: 999px; font-weight: 700; border-color: var(--primary); color: var(--primary);" onclick="store.syncSupabaseDataForAdmin(); store.showToast('🔄 Synchronizing latest orders from cloud database...', 'info');" title="Refresh all orders directly from Supabase Cloud Database">
              <span>☁️</span>
              <span>Sync Cloud Orders</span>
            </button>
            <button class="btn btn-outline btn-sm" style="display: inline-flex; align-items: center; gap: 6px; border-radius: 999px; font-weight: 700;" onclick="store.syncOrdersStatus()" title="Query upstream providers for live progress and delivery status">
              <span>🔄</span>
              <span>Sync Live Status</span>
            </button>
          </div>
        </div>

        <!-- Filter Chips -->
        <div class="orders-filter-chips">
          <button class="orders-filter-pill ${filter === 'all' ? 'active' : ''}" data-filter="all" onclick="AdminApp.setAdminOrdersFilter('all')">All (${allOrders.length})</button>
          <button class="orders-filter-pill ${filter === 'queued' ? 'active' : ''}" data-filter="queued" onclick="AdminApp.setAdminOrdersFilter('queued')" style="${queuedOrders.length > 0 ? 'border-color: #EF4444; color: #DC2626; font-weight: 800;' : ''}">🚨 Queued / Top-Up (${queuedOrders.length})</button>
          <button class="orders-filter-pill ${filter === 'in_progress' ? 'active' : ''}" data-filter="in_progress" onclick="AdminApp.setAdminOrdersFilter('in_progress')">In Progress</button>
          <button class="orders-filter-pill ${filter === 'processing' ? 'active' : ''}" data-filter="processing" onclick="AdminApp.setAdminOrdersFilter('processing')">Processing</button>
          <button class="orders-filter-pill ${filter === 'completed' ? 'active' : ''}" data-filter="completed" onclick="AdminApp.setAdminOrdersFilter('completed')">Completed</button>
          <button class="orders-filter-pill ${filter === 'partial' ? 'active' : ''}" data-filter="partial" onclick="AdminApp.setAdminOrdersFilter('partial')">⚡ Partial</button>
          <button class="orders-filter-pill ${filter === 'refunded' ? 'active' : ''}" data-filter="refunded" onclick="AdminApp.setAdminOrdersFilter('refunded')">Refunded / Canceled</button>
        </div>

        <!-- Table Container -->
        <div class="sync-table-container">
          <div style="overflow-x: auto;">
            <table class="sync-data-table">
              <thead>
                <tr>
                  <th style="width: 42px; text-align: center; padding-left: 12px; padding-right: 6px;">
                    <input 
                      type="checkbox" 
                      id="admin-orders-master-checkbox" 
                      ${allSelected ? 'checked' : ''} 
                      onchange="AdminApp.toggleSelectAllOrders(event)" 
                      style="width: 16px; height: 16px; cursor: pointer; accent-color: var(--primary);" 
                      title="Select / Deselect all visible orders"
                    />
                  </th>
                  <th style="min-width: 150px;">LIKEX ORDER & DATE</th>
                  <th style="min-width: 160px;">CUSTOMER</th>
                  <th style="min-width: 230px;">SERVICE</th>
                  <th style="min-width: 150px;">PROVIDER & UPSTREAM ID</th>
                  <th style="min-width: 170px;">TARGET & QTY</th>
                  <th style="min-width: 140px;">CHARGE / COST / PROFIT</th>
                  <th style="min-width: 140px;">STATUS & PROGRESS</th>
                  <th style="min-width: 110px;">ACTIONS</th>
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

  /* ==========================================================
     ORDER DETAILS MODAL (9 Comprehensive Sections)
     ========================================================== */
  openOrderDetailsModal(orderId, event) {
    if (event) event.stopPropagation();
    const store = window.store;
    if (!store) return;

    const allOrders = (store.getAllAdminOrders ? store.getAllAdminOrders() : store.data.orders) || [];
    const cleanId = String(orderId || '').trim();
    const order = allOrders.find(o => {
      if (!o) return false;
      const oId = String(o.id || '').trim();
      const oLx = String(o.likeXOrderId || '').trim();
      const oProv = String(o.providerOrderId || '').trim();
      return oId === cleanId || oLx === cleanId || oProv === cleanId ||
             oId.replace(/^LX/i, '') === cleanId.replace(/^LX/i, '');
    });

    if (!order) {
      store.showToast(`Order #${orderId} not found.`, 'error');
      return;
    }

    const sheet = document.getElementById('generic-modal-sheet');
    if (!sheet) return;

    // Financial & Profit Calculations
    const charge = Number(order.amount || 0);
    const cost = Number(order.cost || order.providerCost || 0);
    const profit = charge - cost;
    const margin = order.marginPercent !== undefined ? order.marginPercent : (charge > 0 ? Math.round((profit / charge) * 100) : 0);

    // Provider Identification
    const provKey = String(order.serviceSnapshot?.provider || order.provider || '').toLowerCase();
    const sIdStr = String(order.serviceSnapshot?.rawServiceId || order.serviceSnapshot?.serviceId || order.serviceId || order.rawServiceId || '');
    const isSf = provKey === 'socialfans' || sIdStr.startsWith('sf-') || 
                 (order.serviceSnapshot?.providerDisplayName && order.serviceSnapshot.providerDisplayName.includes('SocialFans')) ||
                 (order.providerDisplayName && order.providerDisplayName.includes('SocialFans'));
    const isWos = provKey === 'worldofsmm' || sIdStr.startsWith('wos-') || provKey.includes('wos') || 
                  (!isSf && (String(order.providerOrderId).startsWith('58') || String(order.providerOrderId).startsWith('59')));
    const providerName = isSf ? 'SocialFans' : (isWos ? 'World of SMM' : (order.providerDisplayName || 'Upstream Provider'));
    const providerPanelKey = isSf ? 'socialfans' : 'worldofsmm';

    // Formatted IDs
    const rawIdVal = order.likeXOrderId || order.id;
    const displayLikeXId = store.formatLikeXOrderId ? store.formatLikeXOrderId(rawIdVal) : (String(rawIdVal).startsWith('LX') ? rawIdVal : 'LX' + rawIdVal);
    const dateOnly = store.formatDateOnly ? store.formatDateOnly(order.createdAt || order.date) : (order.date || 'Recently');
    const timeOnly = store.formatTimeOnly ? store.formatTimeOnly(order.createdAt || order.date) : '';

    // Customer & Wallet
    const custEmail = order.userEmail || order.customerEmail || '';
    const custName = order.customerName || (custEmail ? custEmail.split('@')[0] : 'Customer');
    const isGuest = !custEmail || custEmail.toLowerCase() === 'guest customer' || custEmail.toLowerCase() === 'guest@likex.com';

    // User ID & Customer Code
    const customerUserId = order.customerUserId || order.user_id || null;
    const displayCustCode = order.customerId || order.customerCode || store.getCustomerId(custEmail || customerUserId);

    // Live Current Wallet Balance
    let balanceVal = null;
    if (!isGuest && store.getCustomerWalletBalance) {
      balanceVal = store.getCustomerWalletBalance(custEmail || customerUserId || displayCustCode);
    }
    const currentWalletBalStr = (balanceVal !== null && balanceVal !== undefined)
      ? store.formatMoney(balanceVal)
      : (isGuest ? 'N/A (Guest Order)' : '₹0.00');

    // Balance at Order Time (Captured at the moment the order was placed)
    const balAtOrderNum = order.walletBalanceAtOrder !== undefined && order.walletBalanceAtOrder !== null
      ? order.walletBalanceAtOrder 
      : (order.walletBalanceBeforeOrder !== undefined && order.walletBalanceBeforeOrder !== null
          ? order.walletBalanceBeforeOrder
          : (order.balanceAfter !== undefined ? order.balanceAfter : null));
    const balAtOrderStr = (balAtOrderNum !== null && balAtOrderNum !== undefined) 
      ? store.formatMoney(balAtOrderNum) 
      : null;

    // Service & Platform
    const svcId = this.getOrderServiceId(order);
    const accurateServiceName = order.serviceSnapshot?.serviceName || order.serviceName || 'Social Growth Service';
    const accuratePlatform = order.serviceSnapshot?.platform || order.platform || (String(order.target || '').includes('instagram') ? 'Instagram' : 'Social Media');
    const accurateCategory = order.serviceSnapshot?.category || order.category || 'Social Growth';

    const qty = Number(order.quantity || 1000);
    const remains = (order.remains !== undefined && order.remains !== null) ? Number(order.remains) : null;
    const startCount = (order.start_count !== undefined && order.start_count !== null) ? Number(order.start_count) : null;
    const delivered = (remains !== null) ? Math.max(0, qty - remains) : null;
    const progressPct = (delivered !== null && qty > 0) ? Math.min(100, Math.max(0, Math.round((delivered / qty) * 100))) : 0;
    const currentEstCount = (startCount !== null && delivered !== null) ? (startCount + delivered) : (order.currentCount || 'N/A');

    // Raw API Response formatted
    const rawResponseObj = order.providerApiResponse || order.rawStatusResponse || order.providerResponse || {
      provider: providerName,
      status: order.status,
      providerOrderId: order.providerOrderId || null,
      start_count: order.start_count !== undefined ? order.start_count : null,
      remains: order.remains !== undefined ? order.remains : null
    };
    const rawResponseJson = typeof rawResponseObj === 'string' ? rawResponseObj : JSON.stringify(rawResponseObj, null, 2);

    sheet.className = 'modal-sheet order-details-sheet';
    sheet.innerHTML = `
      <div class="modal-header" style="padding-bottom: 14px; border-bottom: 1.5px solid var(--border-color); display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <h3 style="font-size: 20px; font-weight: 800; color: var(--text-main); margin: 0; display: flex; align-items: center; gap: 6px;">
              <span>Order Details</span>
              <span style="font-family: var(--font-mono); color: var(--primary); cursor: pointer;" title="Copy LikeX Order ID" onclick="navigator.clipboard.writeText('${displayLikeXId}'); window.store.showToast('LikeX ID copied!', 'success');">#${displayLikeXId}</span>
              <button type="button" class="btn-copy-id" title="Copy LikeX Order ID" onclick="navigator.clipboard.writeText('${displayLikeXId}'); window.store.showToast('LikeX ID copied!', 'success');" style="background: none; border: none; cursor: pointer; font-size: 13px;">📋</button>
            </h3>
            ${order.providerOrderId ? `
              <span class="badge" style="font-family: var(--font-mono); font-weight: 800; font-size: 12px; padding: 3px 10px; background: rgba(99, 102, 241, 0.12); color: #4338CA; border: 1px solid rgba(99, 102, 241, 0.25);" title="Provider Order ID">
                Prov ID: #${order.providerOrderId}
              </span>
            ` : ''}
            <span class="badge ${order.status === 'Completed' ? 'badge-success' : (order.status === 'Queued' ? 'badge-warning' : 'badge-primary')}" style="font-weight: 800; font-size: 12px; padding: 3px 10px;">
              ${order.status || 'Processing'}
            </span>
          </div>
          <div style="font-size: 12.5px; color: var(--text-secondary); margin-top: 5px; display: flex; align-items: center; gap: 6px;">
            <span>📅 Placed: ${dateOnly} ${timeOnly ? 'at ' + timeOnly : ''}</span>
          </div>
        </div>
        <button class="modal-close" onclick="CustomerApp.closeModal()" style="font-size: 24px; line-height: 1; border: none; background: none; cursor: pointer; color: var(--text-muted);">&times;</button>
      </div>

      <div class="order-details-grid" style="margin-top: 18px;">
        <!-- 1. CUSTOMER INFORMATION -->
        <div class="order-details-card">
          <div class="order-details-card-title">
            <span>👤</span>
            <span>Customer Information</span>
          </div>
          <div class="order-data-row">
            <span class="order-data-label">Customer ID:</span>
            <span class="order-data-val" style="display: inline-flex; align-items: center; gap: 6px;">
              <span class="badge" style="font-family: var(--font-mono); font-weight: 800; font-size: 12.5px; background: rgba(99, 102, 241, 0.12); color: #4338CA; border: 1px solid rgba(99, 102, 241, 0.25);">${displayCustCode}</span>
              ${(!isGuest && custEmail) ? `<button type="button" class="btn-copy-id" title="Copy Customer ID" onclick="navigator.clipboard.writeText('${displayCustCode}'); window.store.showToast('Customer ID copied!', 'success');" style="background: none; border: none; cursor: pointer; font-size: 12px;">📋</button>` : ''}
            </span>
          </div>
          <div class="order-data-row">
            <span class="order-data-label">Customer Name:</span>
            <span class="order-data-val">${custName}</span>
          </div>
          <div class="order-data-row">
            <span class="order-data-label">Customer Email:</span>
            <span class="order-data-val" style="display: inline-flex; align-items: center; gap: 5px;">
              <span>${custEmail || 'Guest Customer'}</span>
              ${(custEmail && !isGuest) ? `<button type="button" title="Copy Email" onclick="navigator.clipboard.writeText('${custEmail}'); window.store.showToast('Email copied!', 'success');" style="background: none; border: none; cursor: pointer; font-size: 11px;">📋</button>` : ''}
            </span>
          </div>
          <div class="order-data-row">
            <span class="order-data-label">Current Wallet Balance (Now):</span>
            <span class="order-data-val" id="order-detail-user-wallet-balance" style="color: #10B981; font-weight: 800;">${currentWalletBalStr}</span>
          </div>
          <div class="order-data-row">
            <span class="order-data-label">Wallet Balance at Order Time:</span>
            <span class="order-data-val" style="color: var(--primary); font-weight: 800;">${balAtOrderStr || (balAtOrderNum !== null ? store.formatMoney(balAtOrderNum) : '₹0.00')}</span>
          </div>
        </div>

        <!-- 2. SERVICE DETAILS -->
        <div class="order-details-card">
          <div class="order-details-card-title">
            <span>⚡</span>
            <span>Service Details</span>
          </div>
          <div class="order-data-row">
            <span class="order-data-label">Service Name:</span>
            <span class="order-data-val" style="text-align: right; max-width: 220px; font-weight: 700;">${accurateServiceName}</span>
          </div>
          <div class="order-data-row">
            <span class="order-data-label">Service ID:</span>
            <span class="order-data-val" style="font-family: var(--font-mono); color: #4338CA; font-weight: 800;">SVC #${svcId}</span>
          </div>
          <div class="order-data-row">
            <span class="order-data-label">Category:</span>
            <span class="order-data-val">${accurateCategory}</span>
          </div>
          <div class="order-data-row">
            <span class="order-data-label">Platform:</span>
            <span class="order-data-val" style="text-transform: capitalize;">${accuratePlatform}</span>
          </div>
          ${order.comments ? `
            <div class="order-data-row">
              <span class="order-data-label">Custom Comments:</span>
              <span class="order-data-val" style="font-size: 11.5px; color: #7C3AED;">${order.comments}</span>
            </div>
          ` : ''}
        </div>

        <!-- 3. TARGET LINK & QUANTITY -->
        <div class="order-details-card">
          <div class="order-details-card-title">
            <span>🎯</span>
            <span>Target Link & Quantity</span>
          </div>
          <div class="order-data-row">
            <span class="order-data-label">Target URL:</span>
            <span class="order-data-val" style="display: inline-flex; align-items: center; gap: 4px; max-width: 220px; overflow: hidden; text-overflow: ellipsis;">
              <a href="${order.target}" target="_blank" rel="noopener noreferrer" style="color: var(--primary); text-decoration: underline; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${order.target || '—'}
              </a>
              ${order.target ? `<button type="button" title="Copy URL" onclick="navigator.clipboard.writeText('${order.target}'); window.store.showToast('Target URL copied!', 'success');" style="background: none; border: none; cursor: pointer; font-size: 11px;">📋</button>` : ''}
            </span>
          </div>
          <div class="order-data-row">
            <span class="order-data-label">Ordered Quantity:</span>
            <span class="order-data-val" style="font-size: 15px; color: var(--primary);">${qty.toLocaleString()}</span>
          </div>
        </div>

        <!-- 4. PROVIDER INFORMATION & DIRECT ACCESS -->
        <div class="order-details-card">
          <div class="order-details-card-title">
            <span>🌐</span>
            <span>Provider Information</span>
          </div>
          <div class="order-data-row">
            <span class="order-data-label">Provider Name:</span>
            <span class="order-data-val">
              <span class="badge" style="font-weight: 800; font-size: 12px; ${isSf ? 'background: rgba(245, 158, 11, 0.15); color: #D97706;' : 'background: rgba(37, 211, 102, 0.15); color: #075E54;'}">
                ${isSf ? '🔥 SocialFans' : '🇮🇳 World of SMM'}
              </span>
            </span>
          </div>
          <div class="order-data-row">
            <span class="order-data-label">Provider Service ID:</span>
            <span class="order-data-val" style="font-family: var(--font-mono); font-weight: 800;">${svcId}</span>
          </div>
          <div class="order-data-row">
            <span class="order-data-label">Provider Order ID:</span>
            <span class="order-data-val" style="font-family: var(--font-mono); font-weight: 800; display: inline-flex; align-items: center; gap: 5px;">
              ${order.providerOrderId ? `
                <span style="color: var(--text-main); font-size: 14px;">#${order.providerOrderId}</span>
                <button type="button" class="btn-copy-id" title="Copy Provider Order ID" onclick="navigator.clipboard.writeText('${order.providerOrderId}'); window.store.showToast('Provider Order ID copied!', 'success');" style="background: none; border: none; cursor: pointer; font-size: 11px;">📋</button>
              ` : `
                <span style="color: var(--text-muted); font-size: 12px; font-style: italic;">N/A (Not returned by API)</span>
              `}
            </span>
          </div>
          <div class="order-data-row">
            <span class="order-data-label">LikeX Order ID:</span>
            <span class="order-data-val" style="font-family: var(--font-mono); font-weight: 700; color: var(--text-secondary);">
              #${displayLikeXId}
            </span>
          </div>
          ${(!order.providerOrderId && (order.upstreamError || order.errorReason)) ? `
            <div style="margin-top: 8px; padding: 8px 10px; background: rgba(239, 68, 68, 0.08); border: 1.5px solid rgba(239, 68, 68, 0.25); border-radius: 10px; font-size: 11.5px; color: #DC2626; line-height: 1.4;">
              <strong style="display: flex; align-items: center; gap: 4px; margin-bottom: 2px;">
                <span>⚠️</span>
                <span>Provider Notice / Reason:</span>
              </strong>
              <span>${order.upstreamError || order.errorReason}</span>
            </div>
            <button 
              type="button" 
              class="btn btn-sm" 
              style="margin-top: 8px; width: 100%; border-radius: 999px; font-weight: 800; font-size: 12px; background: #10B981; color: white; border: none; padding: 7px 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;"
              onclick="AdminApp.handleRetryOrder('${order.id}')"
            >
              <span>⚡</span>
              <span>1-Click Retry Dispatch to ${providerName}</span>
            </button>
          ` : ''}
          <div style="margin-top: 6px;">
            <button 
              type="button" 
              class="btn btn-sm btn-outline" 
              style="width: 100%; border-radius: 999px; font-weight: 700; font-size: 12px; display: flex; align-items: center; justify-content: center; gap: 6px;"
              onclick="AdminApp.openProviderSearch('${providerPanelKey}', '${order.providerOrderId || ''}', event)"
            >
              <span>🔗 Search on ${providerName} Orders Panel ↗</span>
            </button>
          </div>
        </div>

        <!-- 5. PRICING & PROFIT BREAKDOWN -->
        <div class="order-details-card">
          <div class="order-details-card-title">
            <span>💰</span>
            <span>Financials & Margin</span>
          </div>
          <div class="order-data-row">
            <span class="order-data-label">Customer Charge:</span>
            <span class="order-data-val" style="color: var(--text-main); font-size: 14px;">${store.formatMoney(charge)}</span>
          </div>
          <div class="order-data-row">
            <span class="order-data-label">Provider Cost:</span>
            <span class="order-data-val" style="color: var(--text-secondary);">${cost > 0 ? store.formatMoney(cost) : 'N/A'}</span>
          </div>
          <div class="order-data-row">
            <span class="order-data-label">Net Profit:</span>
            <span class="order-data-val" style="font-weight: 800; font-size: 14px; color: ${profit >= 0 ? '#10B981' : '#EF4444'};">
              ${cost > 0 ? `+₹${profit.toFixed(2)} (${margin}%)` : '₹' + charge.toFixed(2) + ' (Direct)'}
            </span>
          </div>
          <div class="order-data-row">
            <span class="order-data-label">Payment Method:</span>
            <span class="order-data-val" style="color: var(--text-muted); font-size: 12px;">Wallet Balance (Instant)</span>
          </div>
        </div>

        <!-- 6. LIVE PROVIDER PROGRESS & COUNTS -->
        <div class="order-details-card">
          <div class="order-details-card-title">
            <span>📊</span>
            <span>Live Provider Progress</span>
          </div>
          <div class="order-data-row">
            <span class="order-data-label">Start Count:</span>
            <span class="order-data-val">${startCount !== null ? startCount.toLocaleString() : 'N/A'}</span>
          </div>
          <div class="order-data-row">
            <span class="order-data-label">Remains:</span>
            <span class="order-data-val" style="color: ${remains > 0 ? '#F59E0B' : 'var(--text-main)'};">${remains !== null ? remains.toLocaleString() : 'N/A'}</span>
          </div>
          <div class="order-data-row">
            <span class="order-data-label">Delivered:</span>
            <span class="order-data-val" style="color: #10B981;">${delivered !== null ? delivered.toLocaleString() : 'N/A'}</span>
          </div>
          <div class="order-data-row">
            <span class="order-data-label">Current Estimated Count:</span>
            <span class="order-data-val" style="font-weight: 800;">${typeof currentEstCount === 'number' ? currentEstCount.toLocaleString() : currentEstCount}</span>
          </div>
          ${delivered !== null ? `
            <div style="margin-top: 6px;">
              <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-secondary); margin-bottom: 4px;">
                <span>Delivery Completion</span>
                <span style="font-weight: 800; color: var(--text-main);">${progressPct}%</span>
              </div>
              <div style="height: 6px; background: rgba(0, 0, 0, 0.08); border-radius: 999px; overflow: hidden;">
                <div style="height: 100%; width: ${progressPct}%; background: ${progressPct >= 100 ? '#10B981' : '#6366F1'}; border-radius: 999px;"></div>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- 7. RAW PROVIDER API RESPONSE (DEBUG AUDIT) -->
        <div class="order-details-card order-details-fullcard">
          <div class="order-details-card-title">
            <span>🤖</span>
            <span>Raw Provider API Response (Audit Trail)</span>
          </div>
          <pre class="json-debug-box">${rawResponseJson}</pre>
        </div>
      </div>

      <!-- 8. ACTIONS TOOLBAR -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-top: 14px; padding-top: 16px; border-top: 1.5px solid var(--border-color);">
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <select id="modal-order-status-select" class="form-select" style="min-width: 140px; height: 38px; border-radius: 999px; font-size: 12.5px; font-weight: 700;">
            <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
            <option value="In Progress" ${(order.status === 'In Progress' || order.status === 'in_progress') ? 'selected' : ''}>In Progress</option>
            <option value="Completed" ${order.status === 'Completed' ? 'selected' : ''}>Completed</option>
            <option value="Partial" ${order.status === 'Partial' ? 'selected' : ''}>Partial</option>
            <option value="Queued" ${order.status === 'Queued' ? 'selected' : ''}>Queued</option>
            <option value="Canceled" ${order.status === 'Canceled' ? 'selected' : ''}>Canceled</option>
            <option value="Refunded" ${order.status === 'Refunded' ? 'selected' : ''}>Refunded</option>
          </select>
          <button 
            type="button" 
            class="btn btn-sm btn-secondary" 
            style="border-radius: 999px; font-weight: 700; height: 38px;"
            onclick="AdminApp.handleManualStatusUpdate('${order.id}')"
          >
            Update Status
          </button>
        </div>

        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <button 
            type="button" 
            class="btn btn-sm btn-outline" 
            style="border-radius: 999px; font-weight: 700; height: 38px; display: inline-flex; align-items: center; gap: 6px;"
            onclick="AdminApp.handleSyncSingleOrder('${order.id}', this, event, true)"
          >
            <span>🔄</span>
            <span>Query Live Status Now</span>
          </button>
          ${(order.isQueued || order.needsTopup || String(order.status).toLowerCase() === 'queued') ? `
            <button 
              type="button" 
              class="btn btn-sm" 
              style="background: #10B981; color: white; border-radius: 999px; font-weight: 800; height: 38px; padding: 0 16px;"
              onclick="window.store.dispatchQueuedOrder ? window.store.dispatchQueuedOrder('${order.id}') : AdminApp.handleRetryOrder('${order.id}')"
            >
              ⚡ Dispatch to Provider
            </button>
          ` : ''}
          ${order.status !== 'Refunded' ? `
            <button 
              type="button" 
              class="btn btn-sm" 
              style="background: #FEF2F2; color: #DC2626; border: 1.5px solid #FECACA; border-radius: 999px; font-weight: 800; height: 38px; padding: 0 16px;"
              onclick="AdminApp.handleAdminRefund('${order.id}')"
            >
              💸 Refund Order
            </button>
          ` : ''}
          <button 
            type="button" 
            class="btn btn-sm btn-secondary" 
            style="border-radius: 999px; height: 38px; padding: 0 16px;"
            onclick="CustomerApp.closeModal()"
          >
            Close
          </button>
        </div>
      </div>
    `;

    CustomerApp.openModal();

    // Dynamically fetch live customer wallet balance from Supabase users table / local store
    if (!isGuest && custEmail && window.supabaseClient) {
      window.supabaseClient
        .from('users')
        .select('balance')
        .eq('email', custEmail.toLowerCase())
        .limit(1)
        .then(({ data, error }) => {
          if (!error && data && data.length > 0 && data[0].balance !== null && data[0].balance !== undefined) {
            const liveBal = Number(data[0].balance);
            const el = document.getElementById('order-detail-user-wallet-balance');
            if (el && store && store.formatMoney) {
              el.textContent = store.formatMoney(liveBal);
            }
          }
        })
        .catch(() => {});
    }
  },

  /* ==========================================================
     LIVE PROVIDER SYNC HANDLER (Single Order)
     ========================================================== */
  async handleSyncSingleOrder(orderId, btnEl, event, refreshModal) {
    if (event) event.stopPropagation();
    const store = window.store;
    if (!store) return;

    if (btnEl) {
      btnEl.style.opacity = '0.6';
      btnEl.style.pointerEvents = 'none';
      btnEl.innerText = '⏳';
    }

    try {
      const res = await store.checkSingleOrderStatus(orderId);
      if (res && res.success) {
        store.showToast(`Order #${orderId} status: ${res.status}${res.remains !== undefined ? ' (' + res.remains + ' remains)' : ''}`, 'success');
      } else {
        store.showToast(`Sync completed: ${res?.status || 'Active'}`, 'info');
      }
    } catch (err) {
      console.warn('Sync order error:', err);
      store.showToast(`Could not query provider: ${err.message}`, 'error');
    } finally {
      this.updateAdminOrdersTableView();
      if (refreshModal) {
        this.openOrderDetailsModal(orderId);
      }
    }
  },

  /* ==========================================================
     PROVIDER PANEL DIRECT DEEP LINK
     ========================================================== */
  openProviderSearch(providerKey, providerOrderId, event) {
    if (event) event.stopPropagation();
    const store = window.store;

    if (!providerOrderId || String(providerOrderId).trim() === '' || String(providerOrderId) === 'null' || String(providerOrderId) === 'undefined') {
      if (store) store.showToast('No Provider Order ID recorded for this order yet.', 'info');
      return;
    }

    const cleanId = String(providerOrderId).trim();
    const isSf = String(providerKey).toLowerCase().includes('socialfans') || String(providerKey).toLowerCase().includes('sf');
    const panelUrl = isSf ? 'https://socialfanss.com/orders' : 'https://worldofsmm.com/orders';
    const panelName = isSf ? 'SocialFans' : 'World of SMM';

    // Copy to clipboard
    try {
      navigator.clipboard.writeText(cleanId);
    } catch (e) {
      console.warn('Clipboard write failed:', e);
    }

    if (store) {
      store.showToast(`Copied Provider Order #${cleanId}! Opening ${panelName} Orders...`, 'success');
    }

    window.open(panelUrl, '_blank', 'noopener,noreferrer');
  },

  /* ==========================================================
     MANUAL STATUS OVERRIDE
     ========================================================== */
  handleManualStatusUpdate(orderId) {
    const store = window.store;
    if (!store) return;

    const selectEl = document.getElementById('modal-order-status-select');
    if (!selectEl) return;

    const newStatus = selectEl.value;
    const allOrders = (store.getAllAdminOrders ? store.getAllAdminOrders() : store.data.orders) || [];
    const order = allOrders.find(o => String(o.id) === String(orderId) || String(o.likeXOrderId) === String(orderId) || String(o.providerOrderId) === String(orderId));

    if (!order) {
      store.showToast(`Order #${orderId} not found.`, 'error');
      return;
    }

    const updated = {
      ...order,
      status: newStatus
    };

    store.updateOrderInAllStorages(updated);
    store.showToast(`Order #${orderId} status updated to "${newStatus}"`, 'success');
    this.updateAdminOrdersTableView();
    this.openOrderDetailsModal(orderId);
  },

  /* ==========================================================
     CREATE MANUAL ORDER MODAL & CONTROLLER
     ========================================================== */
  openCreateManualOrderModal() {
    const store = window.store;
    if (!store) return;

    const sheet = document.getElementById('generic-modal-sheet');
    if (!sheet) return;

    const activeServices = (store.getActiveServices ? store.getActiveServices() : window.JAP_SERVICES) || [];

    sheet.className = 'modal-sheet order-details-sheet';
    sheet.innerHTML = `
      <div class="modal-header" style="padding-bottom: 14px; border-bottom: 1.5px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h3 style="font-size: 20px; font-weight: 800; color: var(--text-main); margin: 0; display: flex; align-items: center; gap: 8px;">
            <span>➕</span>
            <span>Create Manual / Offline Order</span>
          </h3>
          <p style="font-size: 13px; color: var(--text-secondary); margin: 4px 0 0;">
            Place orders directly as Admin with full margin calculations and optional instant provider dispatch.
          </p>
        </div>
        <button class="modal-close" onclick="CustomerApp.closeModal()" style="font-size: 24px; line-height: 1; border: none; background: none; cursor: pointer; color: var(--text-muted);">&times;</button>
      </div>

      <form onsubmit="AdminApp.handleCreateManualOrder(event)" style="display: flex; flex-direction: column; gap: 16px; margin-top: 18px;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 14px;">
          <!-- Customer Email -->
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-weight: 700; font-size: 12.5px;">Customer Email: *</label>
            <input 
              type="email" 
              id="manual-order-email" 
              class="form-control" 
              placeholder="e.g. customer@example.com" 
              required 
              style="height: 42px; border-radius: 12px; font-size: 13px; border: 1.5px solid var(--border-color);"
            />
          </div>

          <!-- Customer Name -->
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-weight: 700; font-size: 12.5px;">Customer Name (Optional):</label>
            <input 
              type="text" 
              id="manual-order-name" 
              class="form-control" 
              placeholder="e.g. Rahul Sharma" 
              style="height: 42px; border-radius: 12px; font-size: 13px; border: 1.5px solid var(--border-color);"
            />
          </div>
        </div>

        <!-- Service Selector -->
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label" style="font-weight: 700; font-size: 12.5px;">Select Service: *</label>
          <select 
            id="manual-order-service" 
            class="form-select" 
            required 
            onchange="AdminApp.handleManualServiceSelect(this.value)"
            style="height: 44px; border-radius: 12px; font-size: 13px; border: 1.5px solid var(--border-color); font-weight: 600;"
          >
            <option value="">-- Choose a Catalog Service --</option>
            ${activeServices.map(s => {
              const provTag = (s.provider === 'socialfans' || String(s.id).startsWith('sf-')) ? 'SocialFans' : 'WorldOfSMM';
              return `<option value="${s.id}" data-rate="${s.rate || 0}" data-cost="${s.cost || s.providerCost || 0}" data-provider="${s.provider || 'worldofsmm'}" data-name="${(s.customerName || s.name || '').replace(/"/g, '&quot;')}">
                [${provTag}] SVC #${s.rawId || s.id} — ${s.customerName || s.name} (₹${s.rate}/1k)
              </option>`;
            }).join('')}
          </select>
        </div>

        <!-- Target Link -->
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label" style="font-weight: 700; font-size: 12.5px;">Target Link / Profile / Post URL: *</label>
          <input 
            type="url" 
            id="manual-order-target" 
            class="form-control" 
            placeholder="https://instagram.com/p/... or https://youtube.com/watch?v=..." 
            required 
            style="height: 42px; border-radius: 12px; font-size: 13px; border: 1.5px solid var(--border-color);"
          />
        </div>

        <!-- Quantity, Charge, Provider Cost -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-weight: 700; font-size: 12.5px;">Quantity: *</label>
            <input 
              type="number" 
              id="manual-order-qty" 
              class="form-control" 
              value="1000" 
              min="10" 
              step="1" 
              required 
              oninput="AdminApp.recalculateManualOrderProfit()"
              style="height: 42px; border-radius: 12px; font-size: 13.5px; font-weight: 700; border: 1.5px solid var(--border-color);"
            />
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-weight: 700; font-size: 12.5px;">Customer Charge (₹): *</label>
            <input 
              type="number" 
              id="manual-order-charge" 
              class="form-control" 
              value="0" 
              min="0" 
              step="0.01" 
              required 
              oninput="AdminApp.recalculateManualOrderProfit()"
              style="height: 42px; border-radius: 12px; font-size: 13.5px; font-weight: 700; border: 1.5px solid var(--border-color);"
            />
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-weight: 700; font-size: 12.5px;">Provider Cost (₹): *</label>
            <input 
              type="number" 
              id="manual-order-cost" 
              class="form-control" 
              value="0" 
              min="0" 
              step="0.01" 
              required 
              oninput="AdminApp.recalculateManualOrderProfit()"
              style="height: 42px; border-radius: 12px; font-size: 13.5px; font-weight: 700; border: 1.5px solid var(--border-color);"
            />
          </div>
        </div>

        <!-- Profit & Margin Preview Bar -->
        <div id="manual-order-profit-preview" style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 13px; font-weight: 600; color: #065F46;">
            Estimated Profit: <strong id="manual-order-profit-text" style="font-size: 15px; color: #10B981;">₹0.00 (0%)</strong>
          </div>
          <div style="font-size: 12px; color: var(--text-secondary);" id="manual-order-provider-tag">
            Provider: World of SMM
          </div>
        </div>

        <!-- Instant Dispatch Checkbox -->
        <div style="display: flex; align-items: center; gap: 10px; background: var(--bg-surface); padding: 12px 14px; border-radius: 12px; border: 1px solid var(--border-color);">
          <input type="checkbox" id="manual-order-dispatch-toggle" checked style="width: 18px; height: 18px; accent-color: var(--primary); cursor: pointer;" />
          <label for="manual-order-dispatch-toggle" style="font-size: 13px; font-weight: 600; color: var(--text-main); cursor: pointer; margin: 0;">
            ⚡ Dispatch to upstream provider API immediately
          </label>
        </div>

        <!-- Buttons -->
        <div style="display: flex; gap: 10px; margin-top: 6px;">
          <button type="button" class="btn btn-secondary" style="flex: 1; height: 44px; border-radius: 12px;" onclick="CustomerApp.closeModal()">
            Cancel
          </button>
          <button type="submit" id="manual-order-submit-btn" class="btn btn-primary" style="flex: 2; height: 44px; border-radius: 12px; font-weight: 800; background: linear-gradient(135deg, #10B981, #059669);">
            Create Order Now 🚀
          </button>
        </div>
      </form>
    `;

    CustomerApp.openModal();
  },

  handleManualServiceSelect(serviceId) {
    const store = window.store;
    if (!store || !serviceId) return;

    const selectEl = document.getElementById('manual-order-service');
    const selectedOpt = selectEl ? selectEl.selectedOptions[0] : null;
    if (!selectedOpt) return;

    const rate = Number(selectedOpt.getAttribute('data-rate') || 0);
    const cost = Number(selectedOpt.getAttribute('data-cost') || 0);
    const provider = selectedOpt.getAttribute('data-provider') || 'worldofsmm';

    const qty = Number(document.getElementById('manual-order-qty')?.value || 1000);
    const chargeVal = ((rate * qty) / 1000).toFixed(2);
    const costVal = ((cost * qty) / 1000).toFixed(2);

    const chargeInp = document.getElementById('manual-order-charge');
    const costInp = document.getElementById('manual-order-cost');
    if (chargeInp) chargeInp.value = chargeVal;
    if (costInp) costInp.value = costVal;

    const provTag = document.getElementById('manual-order-provider-tag');
    if (provTag) {
      provTag.innerText = `Provider: ${provider === 'socialfans' ? 'SocialFans' : 'World of SMM'}`;
    }

    this.recalculateManualOrderProfit();
  },

  recalculateManualOrderProfit() {
    const chargeInp = document.getElementById('manual-order-charge');
    const costInp = document.getElementById('manual-order-cost');
    const profitText = document.getElementById('manual-order-profit-text');
    if (!chargeInp || !costInp || !profitText) return;

    const charge = Number(chargeInp.value || 0);
    const cost = Number(costInp.value || 0);
    const profit = charge - cost;
    const margin = charge > 0 ? Math.round((profit / charge) * 100) : 0;

    profitText.innerText = `+₹${profit.toFixed(2)} (${margin}%)`;
    profitText.style.color = profit >= 0 ? '#10B981' : '#EF4444';
  },

  async handleCreateManualOrder(event) {
    event.preventDefault();
    const store = window.store;
    if (!store) return;

    const email = document.getElementById('manual-order-email')?.value.trim();
    const name = document.getElementById('manual-order-name')?.value.trim() || (email ? email.split('@')[0] : 'Customer');
    const serviceSelect = document.getElementById('manual-order-service');
    const serviceId = serviceSelect?.value;
    const selectedOpt = serviceSelect ? serviceSelect.selectedOptions[0] : null;
    const serviceName = selectedOpt ? selectedOpt.getAttribute('data-name') : 'Custom Service';
    const provider = selectedOpt ? selectedOpt.getAttribute('data-provider') : 'worldofsmm';
    const target = document.getElementById('manual-order-target')?.value.trim();
    const qty = Number(document.getElementById('manual-order-qty')?.value || 1000);
    const charge = Number(document.getElementById('manual-order-charge')?.value || 0);
    const cost = Number(document.getElementById('manual-order-cost')?.value || 0);
    const dispatchImmediately = document.getElementById('manual-order-dispatch-toggle')?.checked !== false;

    if (!email || !serviceId || !target || qty <= 0) {
      store.showToast('Please fill in all required fields.', 'error');
      return;
    }

    const submitBtn = document.getElementById('manual-order-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = 'Creating Order... ⏳';
    }

    try {
      const res = await store.createManualOrder({
        userEmail: email,
        customerName: name,
        serviceId: serviceId,
        serviceName: serviceName,
        provider: provider,
        target: target,
        quantity: qty,
        amount: charge,
        cost: cost,
        dispatchImmediately: dispatchImmediately
      });

      if (res && res.success) {
        CustomerApp.closeModal();
        store.showToast(`Manual Order ${res.order.id} created successfully!`, 'success');
        this.updateAdminOrdersTableView();
      } else {
        store.showToast(res?.message || 'Failed to create manual order.', 'error');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = 'Create Order Now 🚀';
        }
      }
    } catch (err) {
      console.error('Manual order creation error:', err);
      store.showToast(`Error: ${err.message}`, 'error');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Create Order Now 🚀';
      }
    }
  },

  renderAdminSupport(store) {
    return `
      <div style="display: flex; flex-direction: column; gap: 18px;">
        <!-- Telegram VIP Support Card -->
        <div class="card" style="background: linear-gradient(135deg, rgba(42, 171, 238, 0.1), rgba(34, 158, 217, 0.15)); border: 1.5px solid #2AABEE; border-radius: var(--radius-xl); padding: 28px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
            <div>
              <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(42, 171, 238, 0.2); color: #0284C7; font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 999px; margin-bottom: 8px;">
                <span>✈️</span> <span>TELEGRAM VIP SUPPORT CENTER</span>
              </div>
              <h2 style="font-size: 22px; font-weight: 900; margin: 0; color: var(--text-main);">Telegram 1-on-1 Helpdesk</h2>
              <p style="font-size: 13.5px; color: var(--text-secondary); margin-top: 6px; line-height: 1.5;">
                Handle: <strong>@Likex_support</strong> • Ultra-fast communication, zero phone number exposure & full privacy.
              </p>
            </div>
            <a 
              href="https://t.me/Likex_support" 
              target="_blank" 
              rel="noopener noreferrer" 
              class="btn" 
              style="background: #2AABEE; color: #fff; font-weight: 800; font-size: 15px; padding: 12px 24px; border-radius: 9999px; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 6px 18px rgba(42, 171, 238, 0.4);"
            >
              <span>✈️</span> <span>Open Telegram Support</span>
            </a>
          </div>
        </div>

        <!-- WhatsApp Support Card -->
        <div class="card" style="background: linear-gradient(135deg, rgba(37, 211, 102, 0.1), rgba(18, 140, 126, 0.15)); border: 1.5px solid #25D366; border-radius: var(--radius-xl); padding: 28px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
            <div>
              <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(37, 211, 102, 0.2); color: #075E54; font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 999px; margin-bottom: 8px;">
                <span>🟢</span> <span>WHATSAPP SUPPORT CENTER</span>
              </div>
              <h2 style="font-size: 22px; font-weight: 900; margin: 0; color: var(--text-main);">24/7 WhatsApp Customer Helpline</h2>
              <p style="font-size: 13.5px; color: var(--text-secondary); margin-top: 6px; line-height: 1.5;">
                Helpline: <strong>+91 9837371137</strong> • Real-time messaging & instant screenshot verification.
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
            Customer inquiries regarding <strong>Order Refills</strong>, <strong>UPI Payment Manual Top-ups</strong>, and <strong>Service Inquiries</strong> are routed directly to your official Telegram desk (<strong>@Likex_support</strong>) and WhatsApp helpline (<strong>+91 9837371137</strong>).
          </p>
        </div>
      </div>
    `;
  },

  handleReelUrlPreview(url) {
    const box = document.getElementById('admin-new-reel-preview-box');
    if (!box) return;
    const store = window.store;
    const thumb = store.getYouTubeThumbnailUrl ? store.getYouTubeThumbnailUrl(url) : '';
    if (thumb) {
      box.innerHTML = `
        <div style="position: relative; width: 100%; height: 160px; background: #000;">
          <img src="${thumb}" alt="Preview" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'" />
          <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); display: flex; align-items: flex-end; padding: 10px;">
            <span style="color: #fff; font-size: 11px; font-weight: 700; background: rgba(0,0,0,0.6); padding: 2px 8px; border-radius: 4px;">
              ✅ Valid YouTube Link Detected
            </span>
          </div>
        </div>
      `;
    } else {
      box.innerHTML = `
        <div style="text-align: center; color: #94A3B8; padding: 16px;">
          <div style="font-size: 26px; margin-bottom: 4px;">🎬</div>
          <div style="font-size: 12.5px; font-weight: 700;">Live Preview Container</div>
          <div style="font-size: 11px; margin-top: 2px;">Paste YouTube link above to preview thumbnail</div>
        </div>
      `;
    }
  },

  addNewReel(e) {
    e.preventDefault();
    const urlInput = document.getElementById('admin-new-reel-url');
    const titleInput = document.getElementById('admin-new-reel-title');
    const badgeInput = document.getElementById('admin-new-reel-badge');
    const viewsInput = document.getElementById('admin-new-reel-views');
    const durationInput = document.getElementById('admin-new-reel-duration');
    const activeInput = document.getElementById('admin-new-reel-active');

    const videoUrl = urlInput ? urlInput.value.trim() : '';
    const title = titleInput ? titleInput.value.trim() : '';
    const badge = badgeInput ? badgeInput.value.trim() : '🔥 Live Proof';
    const views = viewsInput ? viewsInput.value.trim() : '45K views';
    const duration = durationInput ? durationInput.value.trim() : '0:45';
    const active = activeInput ? activeInput.value === 'true' : true;

    if (!videoUrl || !title) {
      window.store.showToast('Please enter both Video Link and Title.', 'error');
      return;
    }

    window.store.addAboutReel({
      videoUrl,
      title,
      badge,
      views,
      duration,
      active
    });

    // Re-render admin view
    this.render(document.getElementById('screen-container'));
  },

  deleteReel(id) {
    if (confirm('Are you sure you want to remove this reel from About LikeX?')) {
      window.store.deleteAboutReel(id);
      this.render(document.getElementById('screen-container'));
    }
  },

  toggleReel(id) {
    window.store.toggleAboutReel(id);
    this.render(document.getElementById('screen-container'));
  },

  testPlayReel(url, title) {
    const store = window.store;
    const embedUrl = store.extractYouTubeEmbedUrl ? store.extractYouTubeEmbedUrl(url) : '';
    if (!embedUrl) {
      window.open(url, '_blank');
      return;
    }

    const modal = document.getElementById('generic-modal-backdrop');
    const sheet = document.getElementById('generic-modal-sheet');
    sheet.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">▶ ${title || 'Reel Preview'}</h3>
        <button class="modal-close" onclick="CustomerApp.closeModal()">&times;</button>
      </div>
      <div style="position: relative; padding-bottom: 140%; height: 0; max-width: 340px; margin: 0 auto; border-radius: 14px; overflow: hidden; background: #000; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
        <iframe 
          src="${embedUrl}${embedUrl.includes('?') ? '&' : '?'}autoplay=1&mute=0&rel=0" 
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowfullscreen
        ></iframe>
      </div>
      <div style="text-align: center; margin-top: 14px;">
        <a href="${url}" target="_blank" class="btn btn-outline btn-sm">Open on YouTube ↗</a>
      </div>
    `;
    modal.classList.add('active');
  },

  resetDefaultReels() {
    if (confirm('Restore default official LikeX YouTube reels in showcase?')) {
      window.store.updateAboutReels(Array.isArray(window.SMM_DEFAULT_REELS) ? [...window.SMM_DEFAULT_REELS] : []);
      this.render(document.getElementById('screen-container'));
    }
  },

  moveReel(reelId, direction) {
    window.store.reorderAboutReel(reelId, direction);
    this.render(document.getElementById('screen-container'));
  },

  openEditReelModal(reelId) {
    const store = window.store;
    const reels = store.getAboutReels ? store.getAboutReels() : (store.data.aboutReels || []);
    const reel = reels.find(r => r.id === reelId);
    if (!reel) {
      store.showToast('Reel not found.', 'error');
      return;
    }

    const modal = document.getElementById('generic-modal-backdrop');
    const sheet = document.getElementById('generic-modal-sheet');

    sheet.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">✏️ Edit Reel Details</h3>
        <button class="modal-close" onclick="CustomerApp.closeModal()">&times;</button>
      </div>
      <form onsubmit="AdminApp.saveEditedReel(event, '${reel.id}')" style="display: flex; flex-direction: column; gap: 14px; padding: 4px 0;">
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label" style="font-weight: 700; font-size: 12.5px;">YouTube Video / Shorts Link: *</label>
          <input 
            type="url" 
            id="edit-reel-url" 
            class="form-input" 
            value="${reel.videoUrl || ''}"
            required 
            style="min-height: 44px; border-radius: 12px; font-size: 13px;"
            oninput="AdminApp.handleEditReelPreview(this.value)"
          />
        </div>

        <div id="edit-reel-preview-box" style="border-radius: 12px; overflow: hidden; border: 1.5px solid var(--border-color); background: #0F172A; min-height: 120px; display: flex; align-items: center; justify-content: center;">
          <img src="${store.getYouTubeThumbnailUrl(reel.videoUrl)}" style="max-height: 120px; border-radius: 8px;" onerror="this.style.display='none'" />
        </div>

        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label" style="font-weight: 700; font-size: 12.5px;">Reel Title / Caption: *</label>
          <input 
            type="text" 
            id="edit-reel-title" 
            class="form-input" 
            value="${(reel.title || '').replace(/"/g, '&quot;')}"
            required 
            style="min-height: 44px; border-radius: 12px; font-size: 13px;"
          />
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-weight: 700; font-size: 12.5px;">Badge / Tag:</label>
            <select id="edit-reel-badge" class="form-select" style="min-height: 44px; border-radius: 12px; font-size: 12.5px; font-weight: 700;">
              <option value="🔥 Live Proof" ${reel.badge === '🔥 Live Proof' ? 'selected' : ''}>🔥 Live Proof</option>
              <option value="👑 Official Guide" ${reel.badge === '👑 Official Guide' ? 'selected' : ''}>👑 Official Guide</option>
              <option value="⚡ Instant Speed" ${reel.badge === '⚡ Instant Speed' ? 'selected' : ''}>⚡ Instant Speed</option>
              <option value="✨ Client Review" ${reel.badge === '✨ Client Review' ? 'selected' : ''}>✨ Client Review</option>
              <option value="🚀 Viral Boost" ${reel.badge === '🚀 Viral Boost' ? 'selected' : ''}>🚀 Viral Boost</option>
              <option value="💰 Lowest Rate" ${reel.badge === '💰 Lowest Rate' ? 'selected' : ''}>💰 Lowest Rate</option>
              <option value="🛡️ 365D Refill" ${reel.badge === '🛡️ 365D Refill' ? 'selected' : ''}>🛡️ 365D Refill</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-weight: 700; font-size: 12.5px;">Views Tag:</label>
            <input 
              type="text" 
              id="edit-reel-views" 
              class="form-input" 
              value="${reel.views || '48.5K views'}"
              style="min-height: 44px; border-radius: 12px; font-size: 13px;"
            />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-weight: 700; font-size: 12.5px;">Duration:</label>
            <input 
              type="text" 
              id="edit-reel-duration" 
              class="form-input" 
              value="${reel.duration || '0:45'}"
              style="min-height: 44px; border-radius: 12px; font-size: 13px;"
            />
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-weight: 700; font-size: 12.5px;">Status:</label>
            <select id="edit-reel-active" class="form-select" style="min-height: 44px; border-radius: 12px; font-size: 12.5px; font-weight: 700;">
              <option value="true" ${reel.active !== false ? 'selected' : ''}>✅ Visible (Active)</option>
              <option value="false" ${reel.active === false ? 'selected' : ''}>❌ Hidden (Draft)</option>
            </select>
          </div>
        </div>

        <div style="display: flex; gap: 10px; margin-top: 8px;">
          <button type="button" class="btn btn-secondary" style="flex: 1; height: 46px; border-radius: 12px;" onclick="CustomerApp.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary" style="flex: 2; height: 46px; border-radius: 12px; font-weight: 800; background: linear-gradient(135deg, #7C3AED, #4F46E5);">Save Changes 💾</button>
        </div>
      </form>
    `;

    CustomerApp.openModal();
  },

  handleEditReelPreview(val) {
    const box = document.getElementById('edit-reel-preview-box');
    if (!box) return;
    const thumb = window.store.getYouTubeThumbnailUrl(val);
    if (thumb) {
      box.innerHTML = `<img src="${thumb}" style="max-height: 120px; border-radius: 8px;" onerror="this.parentElement.innerHTML='<div style=\\'color:#94A3B8;font-size:12px;\\'>Invalid thumbnail</div>'" />`;
    } else {
      box.innerHTML = `<div style="color:#94A3B8;font-size:12px;">Paste valid YouTube link to preview</div>`;
    }
  },

  saveEditedReel(e, reelId) {
    e.preventDefault();
    const url = document.getElementById('edit-reel-url').value.trim();
    const title = document.getElementById('edit-reel-title').value.trim();
    const badge = document.getElementById('edit-reel-badge').value;
    const views = document.getElementById('edit-reel-views').value.trim();
    const duration = document.getElementById('edit-reel-duration').value.trim();
    const active = document.getElementById('edit-reel-active').value === 'true';

    if (!url || !title) {
      window.store.showToast('Please provide both YouTube URL and Title.', 'error');
      return;
    }

    window.store.updateAboutReel(reelId, {
      videoUrl: url,
      title: title,
      badge: badge,
      views: views,
      duration: duration,
      active: active
    });

    CustomerApp.closeModal();
    this.render(document.getElementById('screen-container'));
  },

  toggleMaintenanceMode(enabled) {
    const title = document.getElementById('admin-maint-title') ? document.getElementById('admin-maint-title').value.trim() : '';
    const eta = document.getElementById('admin-maint-eta') ? document.getElementById('admin-maint-eta').value.trim() : '';
    const msg = document.getElementById('admin-maint-msg') ? document.getElementById('admin-maint-msg').value.trim() : '';

    window.store.setMaintenanceMode(enabled, {
      title: title || undefined,
      estimatedTime: eta || undefined,
      message: msg || undefined
    });
    this.render(document.getElementById('screen-container'));
  },

  saveMaintenanceSettings() {
    const titleEl = document.getElementById('admin-maint-title');
    const etaEl = document.getElementById('admin-maint-eta');
    const msgEl = document.getElementById('admin-maint-msg');
    const toggleEl = document.getElementById('admin-maintenance-toggle');

    const enabled = toggleEl ? toggleEl.checked : (window.store.data.maintenanceMode?.enabled || false);
    const title = titleEl ? titleEl.value.trim() : 'We are Upgrading Systems ⚙️';
    const eta = etaEl ? etaEl.value.trim() : 'Back online in a few minutes';
    const msg = msgEl ? msgEl.value.trim() : '';

    window.store.setMaintenanceMode(enabled, {
      title: title,
      estimatedTime: eta,
      message: msg
    });
    this.render(document.getElementById('screen-container'));
  }
};

window.AdminApp = AdminApp;
