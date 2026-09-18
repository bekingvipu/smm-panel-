document.addEventListener('DOMContentLoaded', () => {
  const store = window.store;
  const screenContainer = document.getElementById('screen-container');

  // URL Path & Hash Router: supports /admin or legacy #admin
  const syncRoute = () => {
    const path = window.location.pathname;
    const hash = window.location.hash;

    if (window.FORCE_ADMIN_PERSONA || path.startsWith('/admin') || hash === '#admin') {
      store.persona = 'admin';
      // Clean up hash if present while preserving query params
      if (hash) {
        window.history.replaceState(null, '', '/admin' + window.location.search);
      }
    } else {
      store.persona = 'customer';
      // Clean up hash if present while preserving query params
      if (hash) {
        window.history.replaceState(null, '', '/' + window.location.search);
      }
    }

    // Synchronize active tab from URL parameter if present
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam) {
        if (store.persona === 'customer' && store.customerTab !== tabParam) {
          store.customerTab = tabParam;
        } else if (store.persona === 'admin' && store.adminTab !== tabParam) {
          store.adminTab = tabParam;
        }
      }
    } catch (e) {}
  };

  // Clean Navigation Helper
  window.navigateToRoute = (route) => {
    if (route === '/admin') {
      if (!window.location.pathname.startsWith('/admin') && !window.location.pathname.includes('admin.html')) {
        window.location.href = '/admin';
        return;
      }
    } else if (route === '/') {
      if (window.location.pathname.startsWith('/admin') || window.location.pathname.includes('admin.html')) {
        window.location.href = '/';
        return;
      }
    }

    if (window.location.pathname !== route) {
      window.history.pushState(null, '', route);
    }
    renderApp(true);
    window.scrollTo(0, 0);
  };

  // Main Render Loop with Frame-Batching
  let _renderRaf = null;
  let _lastPersona = null;
  let _lastAdminTab = null;

  const renderApp = (immediate = false) => {
    const doRender = () => {
      _renderRaf = null;
      syncRoute();
      if (store.persona === 'admin') {
        document.title = 'Admin Console — LikeX System Management';
        const adminShell = document.querySelector('.admin-shell');
        // If background poller or state notification occurs while already on admin orders view, update in-place
        if (!immediate && adminShell && _lastPersona === 'admin' && store.adminTab === 'orders' && _lastAdminTab === 'orders') {
          if (window.AdminApp && typeof window.AdminApp.updateAdminOrdersTableView === 'function') {
            window.AdminApp.updateAdminOrdersTableView();
            return;
          }
        }
        // If already on admin services view and state notification occurs, update in-place
        if (!immediate && adminShell && _lastPersona === 'admin' && store.adminTab === 'services' && _lastAdminTab === 'services') {
          if (window.AdminApp && typeof window.AdminApp.updateAdminServicesTableView === 'function') {
            window.AdminApp.updateAdminServicesTableView();
            return;
          }
        }
        _lastPersona = 'admin';
        _lastAdminTab = store.adminTab;
        AdminApp.render(screenContainer);
      } else {
        document.title = 'LikeX — India\'s Wholesale SMM & Creator Panel | likex.in';
        const customerShell = document.querySelector('.customer-shell') || document.querySelector('.app-shell') || document.querySelector('.bottom-nav');
        // If background state notification occurs while already on customer view, update wallet badges in-place without blinking
        if (!immediate && customerShell && _lastPersona === 'customer') {
          store.updateCustomerHeader();
          return;
        }
        _lastPersona = 'customer';
        _lastAdminTab = null;
        CustomerApp.render(screenContainer);
      }
    };

    if (immediate) {
      if (_renderRaf) cancelAnimationFrame(_renderRaf);
      doRender();
      return;
    }

    if (_renderRaf) return;
    _renderRaf = requestAnimationFrame(doRender);
  };

  // Listen to popstate (browser back/forward) & legacy hashchange
  window.addEventListener('popstate', () => {
    renderApp(true);
    window.scrollTo(0, 0);
  });
  window.addEventListener('hashchange', () => {
    renderApp(true);
    window.scrollTo(0, 0);
  });

  // Subscribe to state updates (batched)
  store.subscribe(() => renderApp(false));

  // Close generic modal on backdrop click
  const modalBackdrop = document.getElementById('generic-modal-backdrop');
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) {
        CustomerApp.closeModal();
      }
    });
  }

  // Floating VIP Support Hub Interactivity (WhatsApp + Telegram Speed-Dial)
  const supportHub = document.getElementById('floating-support-hub');
  const supportTrigger = document.getElementById('support-main-trigger');
  const supportCloseBtn = document.getElementById('support-popup-close-btn');

  if (supportHub && supportTrigger) {
    const toggleSupportHub = (e) => {
      e.stopPropagation();
      const isOpen = supportHub.classList.toggle('open');
      supportTrigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    };

    const closeSupportHub = () => {
      supportHub.classList.remove('open');
      supportTrigger.setAttribute('aria-expanded', 'false');
    };

    supportTrigger.addEventListener('click', toggleSupportHub);

    if (supportCloseBtn) {
      supportCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeSupportHub();
      });
    }

    // Auto-close when clicking any support channel link
    supportHub.querySelectorAll('.support-channel-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        setTimeout(closeSupportHub, 200);
      });
    });

    // Close when clicking anywhere outside the hub
    document.addEventListener('click', (e) => {
      if (!supportHub.contains(e.target)) {
        closeSupportHub();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeSupportHub();
      }
    });
  }

  // Single Clean Initial Render
  renderApp(true);
});
