document.addEventListener('DOMContentLoaded', () => {
  const store = window.store;
  const screenContainer = document.getElementById('screen-container');

  // URL Hash Router: #admin or default customer storefront
  const syncRouteFromHash = () => {
    const hash = window.location.hash;
    if (hash === '#admin') {
      store.persona = 'admin';
    } else {
      store.persona = 'customer';
    }
  };

  // Main Render Loop
  const renderApp = () => {
    // 1. Sync Route
    syncRouteFromHash();

    // 2. Set Page Title dynamically
    if (store.persona === 'admin') {
      document.title = 'Admin Console — SMM Pro System Management';
      AdminApp.render(screenContainer);
    } else {
      document.title = 'LikeX — #1 Social Media Marketing Growth Panel | likex.in';
      CustomerApp.render(screenContainer);
    }
  };

  // Listen to hash changes (e.g. clicking #admin or #customer)
  window.addEventListener('hashchange', () => {
    syncRouteFromHash();
    renderApp();
    window.scrollTo(0, 0);
  });

  // Subscribe to state updates
  store.subscribe(renderApp);

  // Close generic modal on backdrop click
  const modalBackdrop = document.getElementById('generic-modal-backdrop');
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) {
        CustomerApp.closeModal();
      }
    });
  }

  // Initial render
  syncRouteFromHash();
  renderApp();
});
