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
  const renderApp = (immediate = false) => {
    const doRender = () => {
      _renderRaf = null;
      syncRoute();
      if (store.persona === 'admin') {
        document.title = 'Admin Console — LikeX System Management';
        AdminApp.render(screenContainer);
      } else {
        document.title = 'LikeX — India\'s Wholesale SMM & Creator Panel | likex.in';
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

  // Single Clean Initial Render
  renderApp(true);
});
