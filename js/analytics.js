/**
 * LikeX Analytics & Meta Pixel Tracker
 * Handles Meta (Facebook) Pixel standard and custom conversion events with resilient error handling.
 */

const PixelTracker = {
  defaultPixelId: '1107755188608830',
  initialized: false,

  /**
   * Initialize Pixel tracker
   */
  init(customPixelId) {
    const pixelId = customPixelId || this.getStoredPixelId() || this.defaultPixelId;
    this.pixelId = pixelId;

    if (typeof window !== 'undefined' && window.fbq) {
      this.initialized = true;
      console.log(`[PixelTracker] Meta Pixel active with ID: ${pixelId}`);
    }
  },

  /**
   * Get active Pixel ID from local storage or fallback
   */
  getStoredPixelId() {
    try {
      const stored = localStorage.getItem('likex_meta_pixel_id');
      if (stored && stored.trim().length > 5) return stored.trim();
    } catch (e) {}
    return this.defaultPixelId;
  },

  /**
   * Safe wrapper around window.fbq
   */
  fbqSafe(...args) {
    try {
      if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
        window.fbq(...args);
      } else {
        console.debug('[PixelTracker] fbq not available:', ...args);
      }
    } catch (err) {
      console.warn('[PixelTracker] Error calling fbq:', err);
    }
  },

  /**
   * Set user properties for Advanced Matching (improves Event Match Quality from 6/10 to 8+/10)
   */
  setUser(userData = {}) {
    if (!userData) return;
    const cleanEmail = (userData.email || '').trim().toLowerCase();
    const cleanPhone = (userData.phone || '').trim().replace(/[^0-9]/g, '');
    const cleanName = (userData.name || '').trim();

    const advancedMatching = {};
    if (cleanEmail && cleanEmail.includes('@') && !cleanEmail.includes('customer@likex.in') && !cleanEmail.includes('alex@')) {
      advancedMatching.em = cleanEmail;
    }
    if (cleanPhone && cleanPhone.length >= 10) {
      advancedMatching.ph = cleanPhone;
    }
    if (cleanName && cleanName !== 'Guest Visitor') {
      const parts = cleanName.split(' ');
      advancedMatching.fn = parts[0] ? parts[0].toLowerCase() : '';
      if (parts.length > 1) {
        advancedMatching.ln = parts.slice(1).join(' ').toLowerCase();
      }
    }

    if (Object.keys(advancedMatching).length > 0) {
      try {
        if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
          window.fbq('init', this.pixelId || this.defaultPixelId, advancedMatching);
          console.log('[PixelTracker] Advanced matching updated with user data');
        }
      } catch (e) {
        console.warn('[PixelTracker] Could not set advanced matching:', e);
      }
    }
  },

  /**
   * Track PageView / Screen Navigation
   * @param {string} pageName 
   * @param {string} url 
   */
  trackPageView(pageName = 'Home', url = '') {
    const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
    this.fbqSafe('track', 'PageView', {
      page_name: pageName,
      page_url: currentUrl
    });

    this.fbqSafe('trackCustom', 'ScreenView', {
      screen: pageName,
      url: currentUrl,
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Track ViewContent (When viewing a Category or Service)
   */
  trackViewContent({ contentName, contentCategory, serviceId, price } = {}) {
    this.fbqSafe('track', 'ViewContent', {
      content_name: contentName || 'SMM Service',
      content_category: contentCategory || 'Wholesale SMM Services',
      content_ids: serviceId ? [String(serviceId)] : ['likex_service'],
      content_type: 'product',
      value: typeof price === 'number' ? Number(price.toFixed(2)) : undefined,
      currency: 'INR'
    });
  },

  /**
   * Track InitiateCheckout (When customer starts placing an order or opens deposit)
   */
  trackInitiateCheckout({ serviceName, categoryName, amount, quantity, serviceId, targetLink } = {}) {
    const val = Number(amount) || 0;
    this.fbqSafe('track', 'InitiateCheckout', {
      content_name: serviceName || 'LikeX Order',
      content_category: categoryName || 'SMM Service',
      content_ids: serviceId ? [String(serviceId)] : ['likex_order'],
      content_type: 'product',
      value: Number(val.toFixed(2)),
      currency: 'INR',
      num_items: Number(quantity) || 1
    });
  },

  /**
   * Track AddPaymentInfo (When customer opens QR / UPI / Add Funds modal)
   */
  trackAddPaymentInfo({ amount, method = 'UPI_QR' } = {}) {
    const val = Number(amount) || 0;
    this.fbqSafe('track', 'AddPaymentInfo', {
      value: val > 0 ? Number(val.toFixed(2)) : undefined,
      currency: 'INR',
      payment_type: method
    });
  },

  /**
   * Check if a purchase / order ID was already tracked (prevents duplicate fires on refresh)
   */
  isPurchaseTracked(orderId) {
    if (!orderId) return false;
    try {
      const stored = localStorage.getItem('likex_tracked_purchases');
      const list = stored ? JSON.parse(stored) : [];
      return list.includes(String(orderId));
    } catch (e) {
      return false;
    }
  },

  /**
   * Mark purchase / order ID as tracked in storage
   */
  markPurchaseTracked(orderId) {
    if (!orderId) return;
    try {
      const stored = localStorage.getItem('likex_tracked_purchases');
      const list = stored ? JSON.parse(stored) : [];
      if (!list.includes(String(orderId))) {
        list.push(String(orderId));
        // Keep last 100 orders only
        if (list.length > 100) list.shift();
        localStorage.setItem('likex_tracked_purchases', JSON.stringify(list));
      }
    } catch (e) {}
  },

  /**
   * Track Real Purchase (Fired ONLY on verified payment / wallet deposit confirmation)
   * Includes deduplication key { eventID: orderId } to prevent duplicate pixel fires.
   */
  trackPurchase({ orderId, amount, serviceName = 'LikeX Wallet Deposit', quantity = 1, currency = 'INR', email, phone } = {}) {
    const val = Number(amount) || 0;
    if (val <= 0) return;

    const dedupeId = orderId ? String(orderId).trim() : `lkx_${Date.now()}`;

    // Deduplication check: prevent multiple fires on page reload or re-render
    if (orderId && this.isPurchaseTracked(dedupeId)) {
      console.log(`[PixelTracker] Duplicate purchase event prevented for ID: ${dedupeId}`);
      return;
    }

    // Set advanced matching if email/phone provided
    if (email || phone) {
      this.setUser({ email, phone });
    }

    const eventParams = {
      content_name: serviceName,
      content_ids: [dedupeId],
      content_type: 'product',
      value: Number(val.toFixed(2)),
      currency: currency,
      num_items: Number(quantity) || 1,
      order_id: dedupeId
    };

    // Pass eventID as 4th parameter for Meta CAPI & browser pixel deduplication
    this.fbqSafe('track', 'Purchase', eventParams, { eventID: dedupeId });
    this.markPurchaseTracked(dedupeId);

    console.log(`[PixelTracker] Verified Purchase Tracked: ₹${val} (EventID: ${dedupeId})`);
  },

  /**
   * Track SMM Order Placed from wallet (Custom event so it doesn't inflate Meta Sales conversion numbers)
   */
  trackOrderPlaced({ orderId, amount, serviceName, quantity } = {}) {
    const val = Number(amount) || 0;
    this.fbqSafe('trackCustom', 'OrderPlaced', {
      content_name: serviceName || 'LikeX Service Order',
      content_ids: orderId ? [String(orderId)] : ['likex_order_' + Date.now()],
      value: Number(val.toFixed(2)),
      currency: 'INR',
      quantity: Number(quantity) || 1
    });
  },

  /**
   * Track Lead / CompleteRegistration (Customer Sign-In / Registration)
   */
  trackLead({ method = 'web', userId = '', email = '', phone = '' } = {}) {
    if (email || phone) {
      this.setUser({ email, phone });
    }

    this.fbqSafe('track', 'CompleteRegistration', {
      registration_method: method,
      status: 'success',
      user_id: userId ? String(userId) : undefined
    });

    this.fbqSafe('track', 'Lead', {
      lead_type: 'customer_account',
      method: method
    });
  },

  /**
   * Track Contact (WhatsApp / Telegram VIP support clicks)
   */
  trackContact(channel = 'whatsapp') {
    this.fbqSafe('track', 'Contact', {
      contact_channel: channel,
      platform: 'LikeX VIP Support Desk'
    });
  },

  /**
   * Track Custom Custom Event
   */
  trackCustom(eventName, data = {}) {
    this.fbqSafe('trackCustom', eventName, data);
  }
};

// Auto-initialize when window loads
if (typeof window !== 'undefined') {
  window.PixelTracker = PixelTracker;
}
