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
   * Track InitiateCheckout (When customer starts placing an order)
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
   * Track Purchase (When order is successfully placed or funds added)
   */
  trackPurchase({ orderId, amount, serviceName, quantity, currency = 'INR' } = {}) {
    const val = Number(amount) || 0;
    this.fbqSafe('track', 'Purchase', {
      content_name: serviceName || 'LikeX Order Placement',
      content_ids: orderId ? [String(orderId)] : ['likex_order_' + Date.now()],
      content_type: 'product',
      value: Number(val.toFixed(2)),
      currency: currency,
      num_items: Number(quantity) || 1,
      order_id: orderId ? String(orderId) : undefined
    });
  },

  /**
   * Track Lead / CompleteRegistration (Customer Sign-In / Registration)
   */
  trackLead({ method = 'web', userId = '' } = {}) {
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
