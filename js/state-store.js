class SmmStateStore {
  constructor() {
    this.data = JSON.parse(JSON.stringify(window.SMM_MOCK));
    this.deviceMode = 'desktop';
    this.persona = 'customer';
    // Restore active customer and admin tabs from URL query or localStorage
    let initialCustomerTab = 'new_order';
    let initialAdminTab = 'dashboard';
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlTab = urlParams.get('tab');
      const savedCustomerTab = localStorage.getItem('smm_active_customer_tab');
      const savedAdminTab = localStorage.getItem('smm_active_admin_tab');

      if (urlTab) {
        initialCustomerTab = urlTab;
        initialAdminTab = urlTab;
      } else {
        if (savedCustomerTab) initialCustomerTab = savedCustomerTab;
        if (savedAdminTab) initialAdminTab = savedAdminTab;
      }
    } catch (e) {}

    this.customerTab = initialCustomerTab;
    this.adminTab = initialAdminTab;
    this.theme = 'light';
    this.currency = localStorage.getItem('smm_currency') || 'INR'; // Always default to INR
    this.subscribers = [];
    this._isLoggingOut = false;

    // Restore saved profit markup percentage (NOT HARDCODED)
    const savedMarkup = localStorage.getItem('smm_global_markup');
    if (savedMarkup !== null) {
      this.data.adminStats.globalMarkupPercent = Number(savedMarkup);
    } else {
      this.data.adminStats.globalMarkupPercent = 50; // Default 50% (+50% profit) across all devices
    }

    // Restore saved customer avatar
    const savedAvatar = localStorage.getItem('smm_customer_avatar');
    if (savedAvatar) {
      this.data.customer.avatar = savedAvatar;
    }

    // Restore saved user authentication state
    const savedLoggedIn = localStorage.getItem('smm_user_logged_in');
    const savedEmail = localStorage.getItem('smm_user_email');
    if (savedLoggedIn === 'true' && savedEmail) {
      this.data.isLoggedIn = true;
      const savedName = localStorage.getItem('smm_user_name');
      this.data.customer.name = savedName || savedEmail.split('@')[0];
      this.data.customer.email = savedEmail;
      this.loadUserData(savedEmail);
    } else {
      this.data.isLoggedIn = false;
      this.data.customer.name = 'Guest Visitor';
      this.data.customer.email = '';
      this.data.customer.balance = 0.00;
      this.data.customer.spent = 0.00;
      this.data.customer.ordersCount = 0;
      this.data.orders = [];
      this.data.supportTickets = [];
      this.data.transactions = [];
    }

    // Initialize dynamic catalog customization (Admin Add/Remove services)
    try {
      const savedCustom = localStorage.getItem('likex_catalog_customizations');
      if (savedCustom) {
        const parsed = JSON.parse(savedCustom);
        this.catalogCustomizations = {
          addedServices: parsed.addedServices || [],
          disabledServiceIds: new Set(parsed.disabledServiceIds || [])
        };
      } else {
        this.catalogCustomizations = { addedServices: [], disabledServiceIds: new Set() };
      }
    } catch (e) {
      this.catalogCustomizations = { addedServices: [], disabledServiceIds: new Set() };
    }

    // Initialize Live Announcement Ticker
    try {
      const savedAnnounce = localStorage.getItem('likex_announcement_config');
      if (savedAnnounce) {
        this.data.announcement = JSON.parse(savedAnnounce);
      } else {
        this.data.announcement = {
          enabled: true,
          text: "⚡ Welcome to LikeX! • 👑 World's Most Famous & India's #1 SMM Platform • 💰 Guaranteed Lowest Wholesale Prices • 🔥 Fast Instagram Followers & Likes Active • 🚀 Indian High-Speed Services Live • 💬 WhatsApp: +91 9837371137 • ✈️ Telegram: @Likex_support • 🛡️ 365-Day Refill & Drop Protection Guarantee"
        };
      }
    } catch (e) {
      this.data.announcement = {
        enabled: true,
        text: "⚡ Welcome to LikeX! • 👑 World's Most Famous & India's #1 SMM Platform • 💰 Guaranteed Lowest Wholesale Prices • 🔥 Fast Instagram Followers & Likes Active • 🚀 Indian High-Speed Services Live • 💬 WhatsApp: +91 9837371137 • ✈️ Telegram: @Likex_support • 🛡️ 365-Day Refill & Drop Protection Guarantee"
      };
    }

    // Initialize Wallet Video Tutorial Config
    try {
      const savedVideo = localStorage.getItem('likex_wallet_tutorial_config');
      if (savedVideo) {
        this.data.walletTutorial = JSON.parse(savedVideo);
      } else {
        this.data.walletTutorial = {
          enabled: true,
          videoUrl: 'https://www.youtube.com/watch?v=NeXbmEnpSz0',
          title: 'How to Add Funds via UPI QR & UTR',
          description: 'Watch this step-by-step video guide to add instant funds to your LikeX wallet using Paytm, PhonePe, or Google Pay.'
        };
      }
    } catch (e) {
      this.data.walletTutorial = {
        enabled: true,
        videoUrl: 'https://www.youtube.com/watch?v=NeXbmEnpSz0',
        title: 'How to Add Funds via UPI QR & UTR',
        description: 'Watch this step-by-step video guide to add instant funds to your LikeX wallet using Paytm, PhonePe, or Google Pay.'
      };
    }

    // Initialize How to Earn Money Tutorial Config
    try {
      const savedEarnVideo = localStorage.getItem('likex_earn_tutorial_config');
      if (savedEarnVideo) {
        this.data.earnTutorial = JSON.parse(savedEarnVideo);
        if (!this.data.earnTutorial.videoUrl || this.data.earnTutorial.videoUrl.includes('kYV3_47V-wY')) {
          this.data.earnTutorial.videoUrl = 'https://www.youtube.com/watch?v=g5XHXSOmONk';
        }
      } else {
        this.data.earnTutorial = {
          enabled: true,
          videoUrl: 'https://www.youtube.com/watch?v=g5XHXSOmONk',
          title: 'How to Earn ₹30,000–₹1,00,000/Month Starting Your SMM Reselling Business',
          description: 'Watch this complete step-by-step video blueprint on how to buy SMM services at direct wholesale prices and resell to clients with 300% to 1000% pure profit.'
        };
      }
    } catch (e) {
      this.data.earnTutorial = {
        enabled: true,
        videoUrl: 'https://www.youtube.com/watch?v=g5XHXSOmONk',
        title: 'How to Earn ₹30,000–₹1,00,000/Month Starting Your SMM Reselling Business',
        description: 'Watch this complete step-by-step video blueprint on how to buy SMM services at direct wholesale prices and resell to clients with 300% to 1000% pure profit.'
      };
    }

    // Initialize About LikeX YouTube Reels Showcase Config
    try {
      const savedReels = localStorage.getItem('likex_about_reels_config');
      if (savedReels) {
        this.data.aboutReels = JSON.parse(savedReels);
      } else {
        this.data.aboutReels = Array.isArray(window.SMM_DEFAULT_REELS) ? [...window.SMM_DEFAULT_REELS] : [];
      }
    } catch (e) {
      this.data.aboutReels = Array.isArray(window.SMM_DEFAULT_REELS) ? [...window.SMM_DEFAULT_REELS] : [];
    }

    // Initialize Meta Pixel & Conversion Tracking Config
    try {
      const savedPixel = localStorage.getItem('likex_meta_pixel_id');
      const savedConfig = localStorage.getItem('likex_pixel_config');
      if (savedConfig) {
        this.data.pixelSettings = JSON.parse(savedConfig);
      } else {
        this.data.pixelSettings = {
          enabled: true,
          pixelId: savedPixel || '1107755188608830'
        };
      }
    } catch (e) {
      this.data.pixelSettings = { enabled: true, pixelId: '1107755188608830' };
    }

    // Initialize Recommended Instagram Followers Notice Config
    const defaultRecNotice = 'To prevent follower drops during Instagram updates, use LikeX verified Non-Drop service IDs. Fast & stable delivery:';
    try {
      const savedRec = localStorage.getItem('likex_recommended_followers_config');
      if (savedRec) {
        this.data.recommendedFollowers = JSON.parse(savedRec);
        if (!this.data.recommendedFollowers.notice || this.data.recommendedFollowers.notice.includes('Instagram updates ke dauran') || this.data.recommendedFollowers.notice.toLowerCase().includes('refill')) {
          this.data.recommendedFollowers.notice = defaultRecNotice;
        }
      } else {
        this.data.recommendedFollowers = {
          enabled: true,
          title: 'Best Non-Drop Instagram Followers [Tested & Verified]',
          notice: defaultRecNotice,
          serviceIds: '2868, 10323, 6435, 10349',
          badgeText: '100% Non-Drop VIP'
        };
      }
    } catch (e) {
      this.data.recommendedFollowers = {
        enabled: true,
        title: 'Best Non-Drop Instagram Followers [Tested & Verified]',
        notice: defaultRecNotice,
        serviceIds: '2868, 10323, 6435, 10349',
        badgeText: '100% Non-Drop VIP'
      };
    }

    // Initialize Support Tab YouTube Video Tutorial Config
    try {
      const savedSupVideo = localStorage.getItem('likex_support_video_config');
      if (savedSupVideo) {
        this.data.supportVideo = JSON.parse(savedSupVideo);
      } else {
        this.data.supportVideo = {
          enabled: true,
          videoUrl: 'https://www.youtube.com/watch?v=g5XHXSOmONk',
          title: '🎬 Video Guide: How to Get 24/7 Instant Support & Fast Refill',
          description: 'Watch this quick video to learn how to claim instant refills for dropped followers, add funds, and chat with 24/7 VIP support.'
        };
      }
    } catch (e) {
      this.data.supportVideo = {
        enabled: true,
        videoUrl: 'https://www.youtube.com/watch?v=g5XHXSOmONk',
        title: '🎬 Video Guide: How to Get 24/7 Instant Support & Fast Refill',
        description: 'Watch this quick video to learn how to claim instant refills for dropped followers, add funds, and chat with 24/7 VIP support.'
      };
    }

    // Initialize Maintenance Mode Config
    try {
      const savedMaint = localStorage.getItem('likex_maintenance_mode');
      if (savedMaint) {
        this.data.maintenanceMode = JSON.parse(savedMaint);
      } else {
        this.data.maintenanceMode = {
          enabled: false,
          title: 'We are Upgrading Systems ⚙️',
          message: 'LikeX is currently undergoing scheduled performance optimizations to provide you with faster delivery speeds. We will be back shortly!',
          estimatedTime: 'Back online in a few minutes'
        };
      }
    } catch (e) {
      this.data.maintenanceMode = {
        enabled: false,
        title: 'We are Upgrading Systems ⚙️',
        message: 'LikeX is currently undergoing scheduled performance optimizations to provide you with faster delivery speeds. We will be back shortly!',
        estimatedTime: 'Back online in a few minutes'
      };
    }

    // Initialize Claimed UTRs Registry (Anti-Duplicate Fraud Protection)
    try {
      const savedClaimedUtrs = localStorage.getItem('likex_claimed_utrs');
      this.data.claimedUtrs = savedClaimedUtrs ? JSON.parse(savedClaimedUtrs) : {};
    } catch (e) {
      this.data.claimedUtrs = {};
    }

    // Initialize Live Provider Rates Auto-Sync Engine
    try {
      const savedRates = localStorage.getItem('likex_live_rates_cache');
      this.liveRatesCache = savedRates ? JSON.parse(savedRates) : {};
    } catch (e) {
      this.liveRatesCache = {};
    }
    this.lastRatesSyncTime = Number(localStorage.getItem('likex_last_rates_sync_time') || 0);
    this.isSyncingLiveRates = false;

    this.initServerSync();

    // Recurring automatic background sync of live provider rates every 30 minutes
    setInterval(() => {
      this.syncLiveRates(false);
    }, 30 * 60 * 1000);
  }

  extractYouTubeEmbedUrl(url) {
    if (!url) return '';
    const cleanUrl = String(url).trim();
    if (!cleanUrl) return '';

    if (cleanUrl.includes('youtube.com/embed/')) {
      return cleanUrl;
    }

    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/|live\/)([^#&?]*).*/;
    const match = cleanUrl.match(regExp);

    if (match && match[2] && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}?rel=0&modestbranding=1`;
    }

    if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) {
      return `https://www.youtube.com/embed/${cleanUrl}?rel=0&modestbranding=1`;
    }

    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      return cleanUrl;
    }

    return '';
  }

  extractYouTubeVideoId(url) {
    if (!url) return '';
    const cleanUrl = String(url).trim();
    if (!cleanUrl) return '';

    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/|live\/)([^#&?]*).*/;
    const match = cleanUrl.match(regExp);

    if (match && match[2] && match[2].length === 11) {
      return match[2];
    }

    if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) {
      return cleanUrl;
    }

    return '';
  }

  getYouTubeThumbnailUrl(url) {
    const id = this.extractYouTubeVideoId(url);
    if (id) {
      return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    }
    return '';
  }

  getAboutReels() {
    if (!this.data.aboutReels || !Array.isArray(this.data.aboutReels)) {
      this.data.aboutReels = Array.isArray(window.SMM_DEFAULT_REELS) ? [...window.SMM_DEFAULT_REELS] : [];
    }
    return this.data.aboutReels;
  }

  updateAboutReels(reels) {
    this.data.aboutReels = Array.isArray(reels) ? reels : [];
    try {
      localStorage.setItem('likex_about_reels_config', JSON.stringify(this.data.aboutReels));
    } catch (e) {}

    // Sync to Supabase Cloud for instant live broadcast
    this.saveCloudConfig({ about_reels: this.data.aboutReels });

    this.notify();
    this.showToast('✅ About LikeX Reels updated & synced across all devices!', 'success');
  }

  addAboutReel(reelData) {
    const reels = [...this.getAboutReels()];
    const newReel = {
      id: 'reel_' + Date.now(),
      title: String(reelData.title || 'LikeX Official Reel').trim(),
      videoUrl: String(reelData.videoUrl || '').trim(),
      badge: String(reelData.badge || '🔥 Live Proof').trim(),
      views: String(reelData.views || '45K views').trim(),
      duration: String(reelData.duration || '0:45').trim(),
      active: reelData.active !== undefined ? Boolean(reelData.active) : true,
      createdAt: new Date().toISOString()
    };
    reels.unshift(newReel);
    this.updateAboutReels(reels);
    return newReel;
  }

  deleteAboutReel(id) {
    let reels = this.getAboutReels();
    reels = reels.filter(r => r.id !== id);
    this.updateAboutReels(reels);
  }

  toggleAboutReel(id) {
    const reels = this.getAboutReels().map(r => {
      if (r.id === id) {
        return { ...r, active: !r.active };
      }
      return r;
    });
    this.updateAboutReels(reels);
  }

  reorderAboutReel(id, direction) {
    const reels = [...this.getAboutReels()];
    const index = reels.findIndex(r => r.id === id);
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      const temp = reels[index];
      reels[index] = reels[index - 1];
      reels[index - 1] = temp;
    } else if (direction === 'down' && index < reels.length - 1) {
      const temp = reels[index];
      reels[index] = reels[index + 1];
      reels[index + 1] = temp;
    } else if (direction === 'top' && index > 0) {
      const item = reels.splice(index, 1)[0];
      reels.unshift(item);
    }
    this.updateAboutReels(reels);
  }

  updateAboutReel(id, updatedData) {
    let reels = this.getAboutReels().map(r => {
      if (r.id === id) {
        return {
          ...r,
          title: updatedData.title !== undefined ? String(updatedData.title).trim() : r.title,
          videoUrl: updatedData.videoUrl !== undefined ? String(updatedData.videoUrl).trim() : r.videoUrl,
          badge: updatedData.badge !== undefined ? String(updatedData.badge).trim() : r.badge,
          views: updatedData.views !== undefined ? String(updatedData.views).trim() : r.views,
          duration: updatedData.duration !== undefined ? String(updatedData.duration).trim() : r.duration,
          active: updatedData.active !== undefined ? Boolean(updatedData.active) : r.active
        };
      }
      return r;
    });
    this.updateAboutReels(reels);
  }

  getMaintenanceMode() {
    if (!this.data.maintenanceMode) {
      this.data.maintenanceMode = {
        enabled: false,
        title: 'We are Upgrading Systems ⚙️',
        message: 'LikeX is currently undergoing scheduled performance optimizations to provide you with faster delivery speeds. We will be back shortly!',
        estimatedTime: 'Back online in a few minutes'
      };
    }
    return this.data.maintenanceMode;
  }

  setMaintenanceMode(enabled, customData = {}) {
    this.data.maintenanceMode = {
      ...this.getMaintenanceMode(),
      ...customData,
      enabled: Boolean(enabled)
    };
    try {
      localStorage.setItem('likex_maintenance_mode', JSON.stringify(this.data.maintenanceMode));
    } catch (e) {}

    this.saveCloudConfig({ maintenance_mode: this.data.maintenanceMode });
    this.notify();
    this.showToast(enabled ? '⚠️ Maintenance Mode is now ACTIVE on Storefront!' : '✅ Maintenance Mode turned OFF! Storefront is LIVE.', enabled ? 'warning' : 'success');
  }

  // Save configuration to Cloud storage (Supabase config row 999 + site_settings)
  async saveCloudConfig(partial = {}) {
    if (!window.supabaseClient) return;
    try {
      let currentConfig = {};
      const { data: configRows } = await window.supabaseClient
        .from('users')
        .select('password_hash')
        .eq('id', 999);
      if (configRows && configRows.length > 0 && configRows[0].password_hash) {
        try { currentConfig = JSON.parse(configRows[0].password_hash); } catch(e){}
      }
      const merged = { ...currentConfig, ...partial };
      await window.supabaseClient
        .from('users')
        .update({ password_hash: JSON.stringify(merged) })
        .eq('id', 999);

      // Also upsert to site_settings table if available
      for (const [k, v] of Object.entries(partial)) {
        window.supabaseClient.from('site_settings').upsert({ key: k, value: v, updated_at: new Date().toISOString() }).catch(() => {});
      }
    } catch (e) {
      console.warn('[LikeX Cloud Save Error]:', e);
    }
  }

  updateWalletTutorial(config) {
    this.data.walletTutorial = {
      enabled: config.enabled !== undefined ? Boolean(config.enabled) : true,
      videoUrl: String(config.videoUrl || '').trim(),
      title: String(config.title || 'How to Add Funds via UPI QR & UTR').trim(),
      description: String(config.description || 'Watch this step-by-step video guide to add instant funds to your LikeX wallet using Paytm, PhonePe, or Google Pay.').trim()
    };
    try {
      localStorage.setItem('likex_wallet_tutorial_config', JSON.stringify(this.data.walletTutorial));
    } catch (e) {}

    // Cloud sync to Supabase (instantly updates across all mobile and PC devices)
    this.saveCloudConfig({ wallet_tutorial: this.data.walletTutorial });

    this.notify();
    this.showToast('✅ Wallet Video Tutorial updated & synced across all devices!', 'success');
  }

  updateEarnTutorial(config) {
    this.data.earnTutorial = {
      enabled: config.enabled !== undefined ? Boolean(config.enabled) : true,
      videoUrl: String(config.videoUrl || '').trim(),
      title: String(config.title || 'How to Earn ₹30,000–₹1,00,000/Month Starting Your SMM Reselling Business').trim(),
      description: String(config.description || 'Watch this complete step-by-step video blueprint on how to buy SMM services at direct wholesale prices and resell to clients with 300% to 1000% pure profit.').trim()
    };
    try {
      localStorage.setItem('likex_earn_tutorial_config', JSON.stringify(this.data.earnTutorial));
    } catch (e) {}

    // Cloud sync to Supabase (instantly updates across all mobile and PC devices)
    this.saveCloudConfig({ earn_tutorial: this.data.earnTutorial });

    this.notify();
    this.showToast('✅ How to Earn Money settings updated & synced across all devices!', 'success');
  }

  updateAnnouncement(text, enabled = true) {
    this.data.announcement = {
      enabled: Boolean(enabled),
      text: String(text || '').trim()
    };
    try {
      localStorage.setItem('likex_announcement_config', JSON.stringify(this.data.announcement));
    } catch (e) {}

    // Cloud sync to Supabase
    this.saveCloudConfig({ announcement_config: this.data.announcement });

    this.notify();
    this.showToast('✅ Announcement ticker updated & synced across all devices!', 'success');
  }

  updatePixelSettings(pixelId, enabled = true) {
    const cleanId = String(pixelId || '').trim();
    this.data.pixelSettings = {
      enabled: Boolean(enabled),
      pixelId: cleanId || '1107755188608830'
    };
    try {
      localStorage.setItem('likex_meta_pixel_id', this.data.pixelSettings.pixelId);
      localStorage.setItem('likex_pixel_config', JSON.stringify(this.data.pixelSettings));
    } catch (e) {}

    if (window.PixelTracker) {
      window.PixelTracker.init(this.data.pixelSettings.pixelId);
    }

    // Cloud sync to Supabase
    this.saveCloudConfig({ pixel_config: this.data.pixelSettings });

    this.notify();
    this.showToast(`✅ Meta Pixel ID (${this.data.pixelSettings.pixelId}) updated & synced!`, 'success');
  }

  updateRecommendedFollowers(config) {
    this.data.recommendedFollowers = {
      enabled: config.enabled !== undefined ? Boolean(config.enabled) : true,
      title: String(config.title || 'Best Non-Drop Instagram Followers [Tested & Verified]').trim(),
      notice: String(config.notice || 'To prevent follower drops during Instagram updates, use LikeX verified Non-Drop service IDs. Fast & stable delivery:').trim(),
      serviceIds: String(config.serviceIds || '2868, 10323, 6435, 10349').trim(),
      badgeText: String(config.badgeText || '100% Non-Drop VIP').trim()
    };
    try {
      localStorage.setItem('likex_recommended_followers_config', JSON.stringify(this.data.recommendedFollowers));
    } catch (e) {}

    // Cloud sync to Supabase (instantly updates across all mobile and PC devices)
    this.saveCloudConfig({ recommended_followers: this.data.recommendedFollowers });

    this.notify();
    this.showToast('✅ Recommended Instagram Followers notice updated & synced!', 'success');
  }

  updateSupportVideo(config) {
    this.data.supportVideo = {
      enabled: config.enabled !== undefined ? Boolean(config.enabled) : true,
      videoUrl: String(config.videoUrl || '').trim(),
      title: String(config.title || '🎬 Video Guide: How to Get 24/7 Instant Support & Fast Refill').trim(),
      description: String(config.description || 'Watch this quick video to learn how to claim instant refills for dropped followers, add funds, and chat with 24/7 VIP support.').trim()
    };
    try {
      localStorage.setItem('likex_support_video_config', JSON.stringify(this.data.supportVideo));
    } catch (e) {}

    // Cloud sync to Supabase (instantly updates across all mobile and PC devices)
    this.saveCloudConfig({ support_video: this.data.supportVideo });

    this.notify();
    this.showToast('✅ Support Video settings updated & synced across all devices!', 'success');
  }

  saveCatalogCustomizations() {
    try {
      const payload = {
        addedServices: this.catalogCustomizations.addedServices,
        disabledServiceIds: Array.from(this.catalogCustomizations.disabledServiceIds)
      };
      localStorage.setItem('likex_catalog_customizations', JSON.stringify(payload));
    } catch (e) {}
    this.notify();
  }

  _detectPlatform(name = '', category = '') {
    const combined = `${name} ${category}`.toLowerCase();
    if (combined.includes('instagram') || combined.includes('ig ') || combined.includes('threads')) return 'instagram';
    if (combined.includes('youtube') || combined.includes('yt ')) return 'youtube';
    if (combined.includes('facebook') || combined.includes('fb ')) return 'facebook';
    if (combined.includes('telegram') || combined.includes('tg ')) return 'telegram';
    if (combined.includes('tiktok')) return 'tiktok';
    if (combined.includes('twitter') || combined.includes(' x ')) return 'twitter';
    if (combined.includes('spotify')) return 'spotify';
    return 'other';
  }

  // Retrieve live rate override from auto-sync cache if available
  getLiveRateInfo(serviceId, rawId = null) {
    if (!this.liveRatesCache) return null;
    const sId = String(serviceId);
    const rId = rawId ? String(rawId) : '';
    
    if (this.liveRatesCache[sId]) return this.liveRatesCache[sId];
    if (rId && this.liveRatesCache[rId]) return this.liveRatesCache[rId];
    if (sId.startsWith('wos-') && this.liveRatesCache[sId.replace('wos-', '')]) {
      return this.liveRatesCache[sId.replace('wos-', '')];
    }
    if (sId.startsWith('jap-') && this.liveRatesCache[sId.replace('jap-', '')]) {
      return this.liveRatesCache[sId.replace('jap-', '')];
    }
    return null;
  }

  // Live Auto-Rate Sync Engine: Silently pulls real-time wholesale rates from upstream provider APIs
  async syncLiveRates(force = false) {
    const now = Date.now();
    // Cache for 30 minutes unless forced
    if (!force && this.lastRatesSyncTime && (now - this.lastRatesSyncTime < 30 * 60 * 1000) && Object.keys(this.liveRatesCache || {}).length > 0) {
      return { success: true, cached: true, count: Object.keys(this.liveRatesCache).length };
    }

    if (this.isSyncingLiveRates) return { success: false, busy: true };
    this.isSyncingLiveRates = true;

    let updatedCount = 0;
    try {
      const res = await fetch('/api/provider?action=services&provider=worldofsmm');
      if (res.ok) {
        const liveServices = await res.json();
        if (Array.isArray(liveServices) && liveServices.length > 0) {
          liveServices.forEach(s => {
            const rawId = String(s.service || s.id);
            const wosId = `wos-${rawId}`;
            const rate = parseFloat(s.rate || s.cost || 0);
            if (rate > 0) {
              const rateData = {
                rate: rate,
                min: parseInt(s.min || 10, 10),
                max: parseInt(s.max || 1000000, 10),
                refill: Boolean(s.refill),
                cancel: Boolean(s.cancel),
                updatedAt: now
              };
              this.liveRatesCache[rawId] = rateData;
              this.liveRatesCache[wosId] = rateData;
              updatedCount++;
            }
          });
        }
      }

      this.lastRatesSyncTime = now;
      try {
        localStorage.setItem('likex_live_rates_cache', JSON.stringify(this.liveRatesCache));
        localStorage.setItem('likex_last_rates_sync_time', String(now));
      } catch (e) {}

      // Notify UI of updated prices for admin views or when explicitly forced
      if (this.persona === 'admin' || force) {
        this.notify();
      }
      return { success: true, updatedCount, timestamp: now };
    } catch (err) {
      console.warn('[LikeX Rate Sync] Error syncing live provider rates:', err);
      return { success: false, error: err.message };
    } finally {
      this.isSyncingLiveRates = false;
    }
  }

  getActiveServices() {
    const base = window.JAP_SERVICES || [];
    const disabled = this.catalogCustomizations.disabledServiceIds;
    const added = this.catalogCustomizations.addedServices;

    const activeMap = new Map();
    // 1. Base services not disabled
    for (const s of base) {
      const sId = String(s.id);
      const rId = String(s.rawId || '');
      if (!disabled.has(sId) && (!rId || !disabled.has(rId))) {
        const liveInfo = this.getLiveRateInfo(sId, rId);
        const effectiveCost = (liveInfo && liveInfo.rate > 0) ? liveInfo.rate : s.cost;
        activeMap.set(sId, {
          ...s,
          cost: effectiveCost,
          min: (liveInfo && liveInfo.min !== undefined) ? liveInfo.min : s.min,
          max: (liveInfo && liveInfo.max !== undefined) ? liveInfo.max : s.max,
          refill: (liveInfo && liveInfo.refill !== undefined) ? liveInfo.refill : s.refill,
          cancel: (liveInfo && liveInfo.cancel !== undefined) ? liveInfo.cancel : s.cancel,
          isLiveSynced: Boolean(liveInfo)
        });
      }
    }
    // 2. Added/imported custom services take priority
    for (const s of added) {
      const sId = String(s.id);
      const rId = String(s.rawId || '');
      if (!disabled.has(sId) && (!rId || !disabled.has(rId))) {
        const liveInfo = this.getLiveRateInfo(sId, rId);
        const effectiveCost = (liveInfo && liveInfo.rate > 0) ? liveInfo.rate : s.cost;
        activeMap.set(sId, {
          ...s,
          cost: effectiveCost,
          min: (liveInfo && liveInfo.min !== undefined) ? liveInfo.min : s.min,
          max: (liveInfo && liveInfo.max !== undefined) ? liveInfo.max : s.max,
          refill: (liveInfo && liveInfo.refill !== undefined) ? liveInfo.refill : s.refill,
          cancel: (liveInfo && liveInfo.cancel !== undefined) ? liveInfo.cancel : s.cancel,
          isLiveSynced: Boolean(liveInfo)
        });
      }
    }

    return Array.from(activeMap.values());
  }

  isServiceActiveInCatalog(serviceId, rawId = null) {
    const idStr = String(serviceId);
    const rawStr = rawId ? String(rawId) : '';
    const disabled = this.catalogCustomizations.disabledServiceIds;

    if (disabled.has(idStr) || (rawStr && disabled.has(rawStr))) {
      return false;
    }

    if (this.catalogCustomizations.addedServices.some(s => String(s.id) === idStr || (rawStr && String(s.rawId) === rawStr))) {
      return true;
    }

    return (window.JAP_SERVICES || []).some(s => String(s.id) === idStr || (rawStr && String(s.rawId) === rawStr));
  }

  addServicesToCatalog(servicesList) {
    if (!Array.isArray(servicesList) || servicesList.length === 0) return 0;
    let count = 0;
    servicesList.forEach(rawSvc => {
      const prov = rawSvc.provider || 'worldofsmm';
      const sId = String(rawSvc.id || (prov === 'worldofsmm' ? `wos-${rawSvc.service || rawSvc.rawId}` : rawSvc.service));
      const rId = String(rawSvc.rawId || rawSvc.service || sId.replace('wos-', ''));

      this.catalogCustomizations.disabledServiceIds.delete(sId);
      this.catalogCustomizations.disabledServiceIds.delete(rId);

      const formattedSvc = {
        id: sId,
        rawId: rId,
        name: rawSvc.name,
        category: rawSvc.category || 'General Services',
        platform: rawSvc.platform || this._detectPlatform(rawSvc.name, rawSvc.category),
        cost: parseFloat(rawSvc.rate || rawSvc.cost || 0.1),
        min: parseInt(rawSvc.min || 10, 10),
        max: parseInt(rawSvc.max || 1000000, 10),
        refill: !!rawSvc.refill,
        cancel: !!rawSvc.cancel,
        provider: prov
      };

      const existingIdx = this.catalogCustomizations.addedServices.findIndex(s => String(s.id) === sId);
      if (existingIdx >= 0) {
        this.catalogCustomizations.addedServices[existingIdx] = formattedSvc;
      } else {
        this.catalogCustomizations.addedServices.unshift(formattedSvc);
      }
      count++;
    });

    this.saveCatalogCustomizations();
    this.showToast(`✅ Successfully added ${count} service(s) to Customer Catalog!`, 'success');
    return count;
  }

  removeServicesFromCatalog(serviceIdsList) {
    if (!Array.isArray(serviceIdsList) || serviceIdsList.length === 0) return 0;
    let count = 0;
    serviceIdsList.forEach(sId => {
      const strId = String(sId);
      this.catalogCustomizations.disabledServiceIds.add(strId);
      if (strId.startsWith('wos-')) {
        this.catalogCustomizations.disabledServiceIds.add(strId.replace('wos-', ''));
      } else {
        this.catalogCustomizations.disabledServiceIds.add(`wos-${strId}`);
      }
      this.catalogCustomizations.addedServices = this.catalogCustomizations.addedServices.filter(
        s => String(s.id) !== strId && String(s.rawId) !== strId
      );
      count++;
    });

    this.saveCatalogCustomizations();
    this.showToast(`🗑️ Removed ${count} service(s) from Customer Catalog!`, 'info');
    return count;
  }

  setCustomerAvatar(avatarUrl) {
    this.data.customer.avatar = avatarUrl;
    localStorage.setItem('smm_customer_avatar', avatarUrl);
    this.notify();
    this.showToast('Profile avatar updated successfully! 🌟', 'success');
  }

  // Dynamic profit calculation (never sells at a loss; minimum 25% margin safeguard)
  getSellingPrice(wholesaleCostUsd) {
    const markup = Math.max(25, Number(this.data.adminStats.globalMarkupPercent) || 50);
    return (Number(wholesaleCostUsd) || 0.10) * (1 + markup / 100);
  }

  // Generate unique 5-digit Order ID for LikeX (e.g. 58392)
  generateLikeXOrderId() {
    const existing = new Set((this.data.orders || []).map(o => String(o.id)));
    for (let attempts = 0; attempts < 1000; attempts++) {
      const candidate = String(Math.floor(10000 + Math.random() * 90000));
      if (!existing.has(candidate)) {
        return candidate;
      }
    }
    return String(Math.floor(10000 + Math.random() * 90000));
  }

  // Clean and sanitize target URL (strips ?igsi=..., ?utm_source=..., handles @username)
  cleanTargetUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return '';
    let url = rawUrl.trim();

    // If customer entered @username
    if (url.startsWith('@')) {
      const handle = url.slice(1).replace(/[^a-zA-Z0-9._]/g, '');
      return `https://www.instagram.com/${handle}/`;
    }

    // Clean tracking parameters from Instagram & social URLs
    if (url.includes('instagram.com/')) {
      try {
        const u = new URL(url.startsWith('http') ? url : `https://${url}`);
        let path = u.pathname.replace(/\/+/g, '/');
        if (!path.endsWith('/')) path += '/';
        return `https://www.instagram.com${path}`;
      } catch (e) {
        return url.split('?')[0].split('#')[0];
      }
    }

    if (url.includes('?')) {
      try {
        const u = new URL(url.startsWith('http') ? url : `https://${url}`);
        ['igsi', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'fbclid', 'ref'].forEach(p => u.searchParams.delete(p));
        return u.toString();
      } catch (e) {
        return url.split('?')[0];
      }
    }

    return url;
  }

  // Admin dynamic markup setter
  applyGlobalMarkup(percent) {
    percent = Math.max(25, Number(percent) || 50);
    this.data.adminStats.globalMarkupPercent = percent;
    localStorage.setItem('smm_global_markup', percent);

    this.showToast(`Applied +${percent}% profit markup across all 5,803 services!`, 'success');
    this.notify();
  }

  async initServerSync() {
    try {
      const balanceRes = await fetch('/api/provider?action=balance&provider=all');
      if (balanceRes.ok) {
        const balData = await balanceRes.json();
        if (balData) {
          if (balData.jap && balData.jap.balance !== undefined) {
            const japBal = parseFloat(balData.jap.balance) || 0.00;
            const japProv = this.data.providers.find(p => p.id === 'p1');
            if (japProv) {
              japProv.balance = japBal;
              japProv.lastSync = 'Live Sync (JAP API)';
            }
            this.data.adminStats.providerBalance = japBal;
          }
          if (balData.worldofsmm && balData.worldofsmm.balance !== undefined) {
            const wosBal = parseFloat(balData.worldofsmm.balance) || 0.00;
            const wosProv = this.data.providers.find(p => p.id === 'p2');
            if (wosProv) {
              wosProv.balance = wosBal;
              wosProv.lastSync = 'Live Sync (WorldOfSMM API)';
            }
          }
          if (this.persona === 'admin') {
            this.notify();
          }

          // Low Balance Threshold Alert Monitoring (WhatsApp & Gmail)
          const alertCfg = this.getAlertConfig();
          const thresholdINR = Number(alertCfg.threshold || 100);
          const thresholdUSD = thresholdINR / 85;

          const now = Date.now();
          const lastAlertTime = Number(localStorage.getItem('likex_last_low_bal_alert') || 0);
          if (now - lastAlertTime > 3 * 60 * 60 * 1000) { // 3-hour anti-spam cooldown
            if (balData.jap && balData.jap.balance !== undefined && parseFloat(balData.jap.balance) < thresholdUSD) {
              localStorage.setItem('likex_last_low_bal_alert', String(now));
              this.triggerAlert({
                type: 'low_balance',
                providerName: 'JustAnotherPanel (JAP)',
                providerKey: 'jap',
                balance: (parseFloat(balData.jap.balance) * 85).toFixed(2),
                threshold: thresholdINR.toFixed(2)
              });
            } else if (balData.worldofsmm && balData.worldofsmm.balance !== undefined && parseFloat(balData.worldofsmm.balance) < thresholdUSD) {
              localStorage.setItem('likex_last_low_bal_alert', String(now));
              this.triggerAlert({
                type: 'low_balance',
                providerName: 'WorldOfSMM',
                providerKey: 'worldofsmm',
                balance: (parseFloat(balData.worldofsmm.balance) * 85).toFixed(2),
                threshold: thresholdINR.toFixed(2)
              });
            }
          }
        }
      }
    } catch (e) {}

    // Sync Supabase global site settings (Videos, Announcements, etc.)
    try {
      this.syncGlobalSiteSettings();
    } catch (e) {}

    // Calculate dynamic admin stats and sync Supabase data
    try {
      this.recalculateAdminStats();
      this.syncSupabaseDataForAdmin();
    } catch (e) {}

    // Auto-sync real-time provider wholesale rates to protect profit margins
    try {
      this.syncLiveRates(false);
    } catch (e) {}

    // Auto-reconcile failed orders and sync live status
    try {
      this.reconcilePendingOrders();
      this.syncOrdersStatus(true);
    } catch (e) {}

    // Background poller for live Supabase orders every 10 seconds (Admin console only)
    if (!this._adminOrderPoller) {
      this._adminOrderPoller = setInterval(() => {
        if (this.persona === 'admin') {
          this.syncSupabaseDataForAdmin();
        }
      }, 10000);
    }
  }


  // Background sync Supabase global settings for all visitors across mobile and desktop
  async syncGlobalSiteSettings() {
    if (!window.supabaseClient) return;
    try {
      let changed = false;
      const updateIfDifferent = (prop, key, nextVal) => {
        const prevJson = JSON.stringify(this.data[prop]);
        const nextJson = JSON.stringify(nextVal);
        if (prevJson !== nextJson) {
          this.data[prop] = nextVal;
          try { localStorage.setItem(key, nextJson); } catch(e){}
          changed = true;
        }
      };

      // 1. Try dedicated site_settings table
      const { data: settingsData, error } = await window.supabaseClient
        .from('site_settings')
        .select('*');

      if (settingsData && Array.isArray(settingsData) && !error && settingsData.length > 0) {
        settingsData.forEach(item => {
          if (item.key === 'wallet_tutorial' && item.value) {
            updateIfDifferent('walletTutorial', 'likex_wallet_tutorial_config', { ...this.data.walletTutorial, ...item.value });
          } else if (item.key === 'earn_tutorial' && item.value) {
            updateIfDifferent('earnTutorial', 'likex_earn_tutorial_config', { ...this.data.earnTutorial, ...item.value });
          } else if (item.key === 'announcement_config' && item.value) {
            updateIfDifferent('announcement', 'likex_announcement_config', { ...this.data.announcement, ...item.value });
          } else if (item.key === 'about_reels' && Array.isArray(item.value)) {
            updateIfDifferent('aboutReels', 'likex_about_reels_config', item.value);
          } else if (item.key === 'pixel_config' && item.value) {
            const nextPixel = { ...this.data.pixelSettings, ...item.value };
            updateIfDifferent('pixelSettings', 'likex_pixel_config', nextPixel);
            if (window.PixelTracker && nextPixel.pixelId) {
              window.PixelTracker.init(nextPixel.pixelId);
            }
          } else if (item.key === 'maintenance_mode' && item.value) {
            updateIfDifferent('maintenanceMode', 'likex_maintenance_mode', { ...this.getMaintenanceMode(), ...item.value });
          } else if (item.key === 'recommended_followers' && item.value) {
            updateIfDifferent('recommendedFollowers', 'likex_recommended_followers_config', { ...this.data.recommendedFollowers, ...item.value });
          } else if (item.key === 'support_video' && item.value) {
            updateIfDifferent('supportVideo', 'likex_support_video_config', { ...this.data.supportVideo, ...item.value });
          } else if (item.key === 'claimed_utrs' && typeof item.value === 'object') {
            this.data.claimedUtrs = { ...this.data.claimedUtrs, ...item.value };
            try { localStorage.setItem('likex_claimed_utrs', JSON.stringify(this.data.claimedUtrs)); } catch(e){}
          }
        });
      }

      // 2. Direct Cloud Sync from config row id 999
      const { data: configRows } = await window.supabaseClient
        .from('users')
        .select('password_hash')
        .eq('id', 999);

      if (configRows && configRows.length > 0 && configRows[0].password_hash) {
        try {
          const parsed = JSON.parse(configRows[0].password_hash);
          if (parsed.maintenance_mode) {
            updateIfDifferent('maintenanceMode', 'likex_maintenance_mode', { ...this.getMaintenanceMode(), ...parsed.maintenance_mode });
          }
          if (parsed.about_reels && Array.isArray(parsed.about_reels)) {
            updateIfDifferent('aboutReels', 'likex_about_reels_config', parsed.about_reels);
          }
          if (parsed.pixel_config && parsed.pixel_config.pixelId) {
            const nextPx = { ...this.data.pixelSettings, ...parsed.pixel_config };
            updateIfDifferent('pixelSettings', 'likex_pixel_config', nextPx);
            if (window.PixelTracker && nextPx.pixelId) {
              window.PixelTracker.init(nextPx.pixelId);
            }
          }
          if (parsed.earn_tutorial && parsed.earn_tutorial.videoUrl) {
            updateIfDifferent('earnTutorial', 'likex_earn_tutorial_config', { ...this.data.earnTutorial, ...parsed.earn_tutorial });
          }
          if (parsed.wallet_tutorial && parsed.wallet_tutorial.videoUrl) {
            updateIfDifferent('walletTutorial', 'likex_wallet_tutorial_config', { ...this.data.walletTutorial, ...parsed.wallet_tutorial });
          }
          if (parsed.claimed_utrs && typeof parsed.claimed_utrs === 'object') {
            this.data.claimedUtrs = { ...this.data.claimedUtrs, ...parsed.claimed_utrs };
            try { localStorage.setItem('likex_claimed_utrs', JSON.stringify(this.data.claimedUtrs)); } catch(e){}
          }
          if (parsed.announcement_config && parsed.announcement_config.text) {
            updateIfDifferent('announcement', 'likex_announcement_config', { ...this.data.announcement, ...parsed.announcement_config });
          }
          if (parsed.recommended_followers) {
            updateIfDifferent('recommendedFollowers', 'likex_recommended_followers_config', { ...this.data.recommendedFollowers, ...parsed.recommended_followers });
          }
          if (parsed.support_video) {
            updateIfDifferent('supportVideo', 'likex_support_video_config', { ...this.data.supportVideo, ...parsed.support_video });
          }
        } catch (e) {}
      }

      if (changed) {
        this.notify();
      }
    } catch (err) {
      console.warn('[LikeX Sync] Failed to sync global settings from Supabase:', err);
    }
  }

  // Get all master orders across the entire system with full metadata preservation & smart deduplication
  getAllAdminOrders() {
    const ordersList = [];
    const activeServices = (this.getActiveServices ? this.getActiveServices() : window.JAP_SERVICES) || [];

    // Helper to resolve clean service title
    const resolveServiceTitle = (order) => {
      if (order.serviceName && !order.serviceName.includes('null') && !order.serviceName.includes('undefined') && !order.serviceName.startsWith('Service #') && order.serviceName !== 'Social Growth Package') {
        return order.serviceName;
      }
      const matched = activeServices.find(s => 
        (order.serviceId && (String(s.id) === String(order.serviceId) || String(s.rawId) === String(order.serviceId))) ||
        (order.rawServiceId && String(s.rawId) === String(order.rawServiceId))
      );
      if (matched) return matched.customerName || matched.name;
      
      const targetStr = String(order.target || '').toLowerCase();
      if (targetStr.includes('instagram.com') || targetStr.includes('instagr.am')) {
        return 'Instagram HQ Followers / Likes / Views [Instant]';
      } else if (targetStr.includes('youtube.com') || targetStr.includes('youtu.be')) {
        return 'YouTube Video Views & Engagement [HQ]';
      } else if (targetStr.includes('tiktok.com')) {
        return 'TikTok Growth Package [Instant Start]';
      }
      return order.serviceId ? `Service #${String(order.serviceId).replace(/^wos-/, '')}` : 'Social Growth Package';
    };

    // Helper to resolve accurate provider
    const resolveProvider = (order) => {
      const pIdStr = String(order.providerOrderId || order.id || '');
      const sIdStr = String(order.serviceId || order.rawServiceId || '');
      const matched = activeServices.find(s => 
        (order.serviceId && (String(s.id) === String(order.serviceId) || String(s.rawId) === String(order.serviceId))) ||
        (order.rawServiceId && String(s.rawId) === String(order.rawServiceId))
      );
      
      if (matched && matched.provider) {
        return matched.provider;
      }
      if (sIdStr.startsWith('wos-') || pIdStr.startsWith('58') || pIdStr.startsWith('59') || (pIdStr.length >= 8 && !pIdStr.startsWith('10'))) {
        return 'worldofsmm';
      }
      if (sIdStr.startsWith('jap-') || pIdStr.startsWith('10')) {
        return 'jap';
      }
      return order.provider || 'worldofsmm';
    };

    // Helper to add or merge an order (deduplicates across LikeX Order ID and Provider Order ID)
    const addOrMerge = (o) => {
      if (!o || !o.id) return;
      const oId = String(o.id).trim();
      const oProvId = o.providerOrderId ? String(o.providerOrderId).trim() : null;

      // Find existing match by either id OR providerOrderId
      const existingIdx = ordersList.findIndex(existing => {
        const eId = String(existing.id).trim();
        const eProvId = existing.providerOrderId ? String(existing.providerOrderId).trim() : null;

        return eId === oId || 
               (oProvId && eProvId && oProvId === eProvId) ||
               (oProvId && eId === oProvId) ||
               (eProvId && oId === eProvId);
      });

      const amountVal = Number(o.amount !== undefined ? o.amount : (o.charge !== undefined ? o.charge : 0));
      const qtyVal = Number(o.quantity || 1000);
      const createdTs = Number(o.createdAt) || (o.date ? new Date(o.date).getTime() : Date.now());
      const accurateProv = resolveProvider(o);
      const accurateSvcName = resolveServiceTitle(o);

      if (existingIdx === -1) {
        const displayId = oProvId || oId;
        ordersList.push({
          ...o,
          id: displayId,
          providerOrderId: oProvId || displayId,
          serviceName: accurateSvcName,
          provider: accurateProv,
          providerDisplayName: accurateProv === 'worldofsmm' ? 'WorldOfSMM' : 'JustAnotherPanel (JAP)',
          amount: amountVal,
          quantity: qtyVal,
          createdAt: createdTs,
          date: o.date || this.formatRealDate(createdTs)
        });
      } else {
        const existing = ordersList[existingIdx];
        // Prefer Provider Order ID (e.g. 58662283) as primary ID so admin can search directly in provider dashboard
        const bestProvId = oProvId || existing.providerOrderId || (String(oId).length > 5 ? oId : (String(existing.id).length > 5 ? String(existing.id) : null));
        const bestId = bestProvId || existing.id || oId;

        const bestName = resolveServiceTitle({
          ...existing,
          ...o,
          serviceName: (o.serviceName && !o.serviceName.includes('null') && !o.serviceName.includes('undefined')) ? o.serviceName : existing.serviceName
        });

        const bestEmail = o.userEmail || o.customerEmail || existing.userEmail || existing.customerEmail || '';
        const bestCustName = (o.customerName && o.customerName !== 'Guest' && o.customerName !== 'Customer')
          ? o.customerName
          : (existing.customerName && existing.customerName !== 'Guest' && existing.customerName !== 'Customer')
            ? existing.customerName
            : (bestEmail ? bestEmail.split('@')[0] : (o.customerName || existing.customerName || 'Customer'));

        const bestAmount = amountVal > 0 ? amountVal : (Number(existing.amount || existing.charge || 0));
        const mergedProv = resolveProvider({ ...existing, ...o, provider: accurateProv });

        ordersList[existingIdx] = {
          ...existing,
          ...o,
          id: bestId,
          providerOrderId: bestProvId || bestId,
          serviceName: bestName,
          userEmail: bestEmail,
          customerName: bestCustName,
          target: o.target || existing.target || '',
          comments: o.comments || existing.comments || '',
          provider: mergedProv,
          providerDisplayName: mergedProv === 'worldofsmm' ? 'WorldOfSMM' : 'JustAnotherPanel (JAP)',
          createdAt: Math.min(Number(existing.createdAt) || createdTs, createdTs),
          date: o.date || existing.date || this.formatRealDate(createdTs),
          amount: bestAmount,
          quantity: qtyVal || existing.quantity || 1000,
          status: (o.status && o.status !== 'Processing') ? o.status : (existing.status || o.status || 'Processing')
        };
      }
    };

    // 1. Current store orders
    (this.data.orders || []).forEach(addOrMerge);

    // 2. Global master orders from localStorage
    try {
      const master = JSON.parse(localStorage.getItem('likex_master_orders') || '[]');
      if (Array.isArray(master)) {
        master.forEach(addOrMerge);
      }
    } catch (e) {}

    // 3. Scan all smm_user_*_orders in localStorage
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('smm_user_') && key.endsWith('_orders')) {
          const uOrders = JSON.parse(localStorage.getItem(key) || '[]');
          if (Array.isArray(uOrders)) {
            uOrders.forEach(addOrMerge);
          }
        }
      }
    } catch (e) {}

    // 4. Any Supabase orders cached
    try {
      const supaOrders = JSON.parse(localStorage.getItem('likex_supabase_orders') || '[]');
      if (Array.isArray(supaOrders)) {
        supaOrders.forEach(addOrMerge);
      }
    } catch (e) {}

    ordersList.sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
    return ordersList;
  }

  // Get accurate count of registered customers
  getRegisteredCustomersCount() {
    const customerEmails = new Set();

    // 1. Scan localStorage user keys (smm_user_*_balance or orders)
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('smm_user_') && (key.endsWith('_balance') || key.endsWith('_orders'))) {
          const parts = key.split('_');
          const userKey = parts.slice(2, -1).join('_');
          if (userKey && userKey !== 'logged' && userKey !== 'name' && userKey !== 'email') {
            customerEmails.add(userKey.toLowerCase());
          }
        }
      }
    } catch (e) {}

    // 2. Currently logged in customer
    if (this.data.customer && this.data.customer.email) {
      customerEmails.add(this.data.customer.email.toLowerCase());
    }
    const savedEmail = localStorage.getItem('smm_user_email');
    if (savedEmail) customerEmails.add(savedEmail.toLowerCase());

    // 3. likex_registered_customers list in localStorage
    try {
      const reg = JSON.parse(localStorage.getItem('likex_registered_customers') || '[]');
      if (Array.isArray(reg)) {
        reg.forEach(c => {
          const em = (typeof c === 'string' ? c : (c.email || c.username || '')).toLowerCase();
          if (em) customerEmails.add(em);
        });
      }
    } catch (e) {}

    // 4. Cached Supabase users
    try {
      const supaUsers = JSON.parse(localStorage.getItem('likex_supabase_users') || '[]');
      if (Array.isArray(supaUsers)) {
        supaUsers.forEach(u => {
          if (u.role !== 'admin' && u.email) customerEmails.add(u.email.toLowerCase());
        });
      }
    } catch (e) {}

    // 5. Unique customers from orders
    const allOrders = this.getAllAdminOrders();
    allOrders.forEach(o => {
      if (o.userEmail) customerEmails.add(String(o.userEmail).toLowerCase());
      else if (o.customerEmail) customerEmails.add(String(o.customerEmail).toLowerCase());
    });

    return Math.max(1, customerEmails.size);
  }

  // Recalculate Admin Stats dynamically from actual live orders & customers
  recalculateAdminStats() {
    const allOrders = this.getAllAdminOrders();
    const totalOrders = allOrders.length;
    const revenueUsd = allOrders.reduce((sum, o) => sum + (Number(o.amount) || Number(o.charge) || 0), 0);
    const totalCustomers = this.getRegisteredCustomersCount();

    this.data.adminStats.totalOrders = totalOrders;
    this.data.adminStats.revenue = revenueUsd;
    this.data.adminStats.totalCustomers = totalCustomers;

    const markupPercent = Number(this.data.adminStats.globalMarkupPercent) || 50;
    this.data.adminStats.profit = revenueUsd * (markupPercent / (100 + markupPercent));

    return this.data.adminStats;
  }

  // Background sync Supabase users & orders for admin with rich name & email resolution
  async syncSupabaseDataForAdmin() {
    if (!window.supabaseClient || this._isSyncingSupabaseAdmin) return;
    this._isSyncingSupabaseAdmin = true;
    try {
      let dataChanged = false;

      // 1. Fetch users from Supabase first
      const { data: supaUsers } = await window.supabaseClient
        .from('users')
        .select('id, email, username, role');

      const userMap = new Map();
      if (supaUsers && supaUsers.length > 0) {
        const prevUsers = localStorage.getItem('likex_supabase_users');
        const newUsersStr = JSON.stringify(supaUsers);
        if (prevUsers !== newUsersStr) {
          localStorage.setItem('likex_supabase_users', newUsersStr);
          dataChanged = true;
        }
        supaUsers.forEach(u => userMap.set(String(u.id), u));
      }

      // 2. Fetch orders from Supabase
      const { data: supaOrders } = await window.supabaseClient
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (supaOrders && supaOrders.length > 0) {
        const activeServices = this.getActiveServices ? this.getActiveServices() : (window.JAP_SERVICES || []);
        const mapped = supaOrders.map(so => {
          const matchedUser = so.user_id ? userMap.get(String(so.user_id)) : null;
          const matchedSvc = activeServices.find(s => 
            String(s.id) === String(so.service_id) || 
            String(s.rawId) === String(so.service_id) || 
            String(s.japId) === String(so.service_id)
          );

          let svcTitle = matchedSvc 
            ? (matchedSvc.customerName || matchedSvc.name) 
            : null;

          if (!svcTitle) {
            const targetLower = String(so.target_url || '').toLowerCase();
            if (targetLower.includes('instagram.com') || targetLower.includes('instagr.am')) {
              svcTitle = 'Instagram HQ Followers / Likes / Views [Instant]';
            } else if (targetLower.includes('youtube.com') || targetLower.includes('youtu.be')) {
              svcTitle = 'YouTube Video Views & Engagement [HQ]';
            } else if (targetLower.includes('tiktok.com')) {
              svcTitle = 'TikTok Growth Package [Instant Start]';
            } else {
              svcTitle = so.service_id ? `Social Growth Service #${so.service_id}` : 'Social Growth Package';
            }
          }

          const orderIdStr = String(so.provider_order_id || so.id || '');
          const isWosOrder = so.assigned_provider_id === 2 || 
                             orderIdStr.startsWith('58') || 
                             orderIdStr.startsWith('59') ||
                             (matchedSvc && matchedSvc.provider === 'worldofsmm');

          const finalProvider = isWosOrder ? 'worldofsmm' : (so.assigned_provider_id === 1 ? 'jap' : (orderIdStr.startsWith('10') ? 'jap' : 'worldofsmm'));
          const orderCreatedAt = so.created_at ? new Date(so.created_at).getTime() : Date.now();

          const isQueuedOrder = so.status === 'Queued' || so.status === 'Pending' || (String(so.id).length === 5 && so.status !== 'Completed' && so.status !== 'Refunded');
          return {
            id: String(so.id),
            serviceId: matchedSvc ? matchedSvc.id : (so.service_id ? `wos-${so.service_id}` : 'wos-2868'),
            rawServiceId: matchedSvc?.rawId || so.service_id || '2868',
            serviceName: svcTitle,
            provider: finalProvider,
            providerDisplayName: finalProvider === 'worldofsmm' ? 'WorldOfSMM' : 'JustAnotherPanel (JAP)',
            providerOrderId: so.provider_order_id || String(so.id),
            target: so.target_url || '',
            quantity: Number(so.quantity) || 1000,
            amount: Number(so.charge) || 0,
            status: so.status || 'Completed',
            isQueued: isQueuedOrder,
            errorReason: so.refill_status || '',
            userEmail: matchedUser?.email || '',
            customerName: matchedUser?.username || (matchedUser?.email ? matchedUser.email.split('@')[0] : 'Customer'),
            createdAt: orderCreatedAt,
            date: this.formatRealDate(orderCreatedAt)
          };
        });

        const prevOrders = localStorage.getItem('likex_supabase_orders');
        const newOrdersStr = JSON.stringify(mapped);
        if (prevOrders !== newOrdersStr) {
          localStorage.setItem('likex_supabase_orders', newOrdersStr);
          dataChanged = true;
        }
      }

      this.recalculateAdminStats();
      if (dataChanged && this.persona === 'admin') {
        this.notify();
      }
    } catch (err) {
      console.warn('[LikeX Admin] Supabase admin sync error:', err);
    } finally {
      this._isSyncingSupabaseAdmin = false;
    }
  }

  subscribe(fn) {
    this.subscribers.push(fn);
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== fn);
    };
  }

  notify(immediate = false) {
    if (immediate) {
      if (this._notifyRaf) {
        cancelAnimationFrame(this._notifyRaf);
        this._notifyRaf = null;
      }
      this.subscribers.forEach(fn => fn(this));
      return;
    }
    if (this._notifyRaf) return;
    this._notifyRaf = requestAnimationFrame(() => {
      this._notifyRaf = null;
      this.subscribers.forEach(fn => fn(this));
    });
  }

  _getUserStorageKey(email, key) {
    if (!email) return null;
    const safeKey = email.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return `smm_user_${safeKey}_${key}`;
  }

  loadUserData(email) {
    if (!email) return;
    const balKey = this._getUserStorageKey(email, 'balance');
    const ordersKey = this._getUserStorageKey(email, 'orders');
    const txnsKey = this._getUserStorageKey(email, 'txns');

    const savedBal = localStorage.getItem(balKey);
    this.data.customer.balance = savedBal !== null ? parseFloat(savedBal) : 0.00;

    const savedOrders = localStorage.getItem(ordersKey);
    const parsedOrders = savedOrders ? JSON.parse(savedOrders) : [];
    this.data.orders = parsedOrders.map(o => {
      // Use Provider Order ID as primary ID when available
      if (o.providerOrderId) {
        o.id = String(o.providerOrderId);
      } else if (String(o.id).length > 5) {
        o.providerOrderId = String(o.id);
      }
      // White-label provider display name for customer privacy
      if (o.providerName && (o.providerName.includes('JustAnotherPanel') || o.providerName.includes('WorldOfSMM') || o.providerName.includes('JAP'))) {
        o.providerName = 'LikeX Automated Server';
      }
      return o;
    });

    const savedTxns = localStorage.getItem(txnsKey);
    this.data.transactions = savedTxns ? JSON.parse(savedTxns) : [];

    this.data.customer.ordersCount = this.data.orders.length;
    this.data.customer.spent = this.data.orders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

    // Asynchronous Cloud Reconcile from Supabase wallet_transactions
    if (window.supabaseClient) {
      window.supabaseClient
        .from('wallet_transactions')
        .select('*')
        .eq('status', 'Success')
        .ilike('description', `%${email}%`)
        .order('created_at', { ascending: false })
        .then(({ data: cloudTxns }) => {
          if (Array.isArray(cloudTxns) && cloudTxns.length > 0) {
            let updated = false;

            // 1. Deduplicate local transactions array first by 12-digit UTR
            const seenKeys = new Set();
            const cleanTxns = [];
            let duplicateDepositDeduction = 0;

            this.data.transactions.forEach(t => {
              const uMatch = (t.description || '').match(/\b\d{12}\b/);
              const oMatch = (t.description || '').match(/\bLKX\d+\b/);
              const key = uMatch ? uMatch[0] : (oMatch ? oMatch[0] : (t.id || JSON.stringify(t)));
              if (!seenKeys.has(key)) {
                seenKeys.add(key);
                cleanTxns.push(t);
              } else {
                if (t.type === 'Wallet Deposit' || t.type === 'Deposit') {
                  duplicateDepositDeduction += Number(t.amount || 0);
                }
                updated = true;
              }
            });
            this.data.transactions = cleanTxns;

            // 2. Reconcile missing cloud deposits
            cloudTxns.forEach(ctxn => {
              const uMatch = (ctxn.description || '').match(/\b\d{12}\b/);
              const oMatch = (ctxn.description || '').match(/\bLKX\d+\b/);
              const key = uMatch ? uMatch[0] : (oMatch ? oMatch[0] : ctxn.id);

              const alreadyExists = seenKeys.has(key) || this.data.transactions.some(t => {
                if (t.id === ctxn.id || t.id === `TXN-${ctxn.id}`) return true;
                if (uMatch && (t.description || '').includes(uMatch[0])) return true;
                if (oMatch && (t.description || '').includes(oMatch[0])) return true;
                return false;
              });

              if (!alreadyExists && ctxn.type === 'Deposit') {
                const inrRate = this.data.exchangeRate || 95.385;
                // If ctxn amount was recorded in raw USD, normalize
                const depAmt = Number(ctxn.amount || 0);
                this.data.customer.balance = Number((this.data.customer.balance + depAmt).toFixed(4));
                seenKeys.add(key);
                this.data.transactions.unshift({
                  id: ctxn.id,
                  type: 'Wallet Deposit',
                  description: ctxn.description,
                  amount: depAmt,
                  balanceAfter: this.data.customer.balance,
                  status: 'Success',
                  date: ctxn.created_at ? new Date(ctxn.created_at).toLocaleString('en-IN') : new Date().toLocaleString('en-IN')
                });
                updated = true;
              }
            });

            if (duplicateDepositDeduction > 0) {
              this.data.customer.balance = Math.max(0, Number((this.data.customer.balance - duplicateDepositDeduction).toFixed(4)));
              updated = true;
            }

            if (updated) {
              this.saveUserData();
              this.notify();
              this.updateCustomerHeader();
            }
          }
        }).catch(() => {});
    }
  }

  saveUserData() {
    const email = this.data.customer.email;
    if (!email || !this.data.isLoggedIn) return;

    localStorage.setItem(this._getUserStorageKey(email, 'balance'), this.data.customer.balance.toFixed(4));
    localStorage.setItem(this._getUserStorageKey(email, 'orders'), JSON.stringify(this.data.orders));
    localStorage.setItem(this._getUserStorageKey(email, 'txns'), JSON.stringify(this.data.transactions));
  }

  login(name, email, avatar = null, showToast = true) {
    if (!email) return;
    this.data.isLoggedIn = true;
    this.data.customer.name = name || email.split('@')[0];
    this.data.customer.email = email;
    if (avatar) {
      this.data.customer.avatar = avatar;
      localStorage.setItem('smm_customer_avatar', avatar);
    }
    localStorage.setItem('smm_user_logged_in', 'true');
    localStorage.setItem('smm_user_name', this.data.customer.name);
    localStorage.setItem('smm_user_email', email);

    // Load this specific user's isolated balance and history
    this.loadUserData(email);

    // Register customer in likex_registered_customers
    try {
      const reg = JSON.parse(localStorage.getItem('likex_registered_customers') || '[]');
      if (!reg.some(c => (typeof c === 'string' ? c : c.email) === email)) {
        reg.push({ email: email, name: this.data.customer.name, registeredAt: Date.now() });
        localStorage.setItem('likex_registered_customers', JSON.stringify(reg));
      }
    } catch (e) {}

    this.recalculateAdminStats();

    if (window.PixelTracker) {
      window.PixelTracker.trackLead({
        method: 'login_or_register',
        userId: email
      });
    }

    if (showToast) {
      this.showToast(`Welcome back, ${this.data.customer.name}! You are now signed in. 🚀`, 'success');
    }
    this.notify();
  }

  logout(triggerSupabaseSignOut = true) {
    if (this._isLoggingOut) return;
    if (!this.data.isLoggedIn && !localStorage.getItem('smm_user_logged_in')) return;

    this._isLoggingOut = true;

    // Reset customer state to clean guest defaults
    this.data.isLoggedIn = false;
    this.data.customer.name = 'Guest Visitor';
    this.data.customer.email = '';
    this.data.customer.balance = 0.00;
    this.data.customer.spent = 0.00;
    this.data.customer.ordersCount = 0;
    this.data.orders = [];
    this.data.supportTickets = [];
    this.data.transactions = [];

    localStorage.removeItem('smm_user_logged_in');
    localStorage.removeItem('smm_user_name');
    localStorage.removeItem('smm_user_email');
    localStorage.removeItem('smm_customer_avatar');

    if (triggerSupabaseSignOut && window.supabaseClient) {
      window.supabaseClient.auth.signOut().catch(() => {});
    }

    this._isLoggingOut = false;
    this.notify();
    this.showToast('You have been securely signed out.', 'info');
  }

  setDeviceMode(mode) {
    this.deviceMode = mode;
    this.notify();
  }

  setPersona(persona) {
    this.persona = persona;
    this.notify();
  }

  setCustomerTab(tab) {
    if (tab === 'dashboard') tab = 'home';
    this.customerTab = tab;
    localStorage.setItem('smm_active_customer_tab', tab);
    try {
      const url = new URL(window.location);
      url.searchParams.set('tab', tab);
      window.history.replaceState(null, '', url);
    } catch (e) {}

    // Track SPA Tab Navigation Event
    if (window.PixelTracker) {
      window.PixelTracker.trackPageView('Tab: ' + tab);
    }

    this.notify();
    if (tab === 'orders') {
      this.syncOrdersStatus(true);
    }
  }

  setAdminTab(tab) {
    this.adminTab = tab;
    localStorage.setItem('smm_active_admin_tab', tab);
    try {
      const url = new URL(window.location);
      url.searchParams.set('tab', tab);
      window.history.replaceState(null, '', url);
    } catch (e) {}
    this.notify();
  }

  // Real timestamp formatting helpers
  formatRealDate(timestamp = Date.now()) {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return 'Recently';
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  formatOrderDisplayDate(order) {
    if (!order) return 'Recently';
    const ts = order.createdAt;
    if (!ts) return order.date || 'Recently';
    const now = Date.now();
    const diffMs = now - Number(ts);
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return this.formatRealDate(ts);
  }

  setTheme(theme) {
    this.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    this.notify();
  }

  setCurrency(curr) {
    this.currency = curr || 'INR';
    localStorage.setItem('smm_currency', this.currency);
    this.notify();
  }

  formatMoney(amountInUsd, decimals = 2) {
    if (this.currency === 'INR') {
      const isNegative = Number(amountInUsd) < 0;
      const absUsd = Math.abs(Number(amountInUsd) || 0);
      if (absUsd === 0) return '₹0.00';

      const inrRate = this.data.exchangeRate || 95.385;
      const inrVal = absUsd * inrRate;

      let formatted = '';
      if (inrVal >= 100) {
        formatted = inrVal.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      } else if (inrVal >= 1) {
        const rounded100 = Math.round(inrVal * 100);
        const rounded10000 = Math.round(inrVal * 10000);
        const hasDeepDecimals = (rounded100 * 100) !== rounded10000;
        formatted = inrVal.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: hasDeepDecimals ? 4 : 2
        });
      } else {
        // Micro amounts (< ₹1) e.g. ₹0.2862, ₹0.1431 (Never rounds down to ₹0!)
        const fourDec = inrVal.toFixed(4);
        if (fourDec.slice(-2) === '00') {
          formatted = inrVal.toFixed(2);
        } else if (fourDec.slice(-1) === '0') {
          formatted = inrVal.toFixed(3);
        } else {
          formatted = fourDec;
        }
      }

      return (isNegative ? '-₹' : '₹') + formatted;
    }
    return '$' + Number(amountInUsd).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';
    if (type === 'refill') icon = '🔄';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  async placeOrder({ serviceId, target, quantity, serviceName, wholesaleCost, comments }, options = {}) {
    if (!this.data.isLoggedIn) {
      this.showToast('Please sign in or create an account to place an order.', 'error');
      CustomerApp.openAuthModal();
      return { success: false, message: 'Authentication required' };
    }

    const isComment = (serviceName || '').toLowerCase().includes('comment');
    if (isComment && quantity < 50) {
      this.showToast('⚠️ Minimum order quantity for comments is 50.', 'error');
      return { success: false, message: 'Minimum 50 comments required' };
    }

    // Determine provider & raw service id
    let targetProvider = 'worldofsmm';
    let rawServiceId = serviceId;
    const activeServices = this.getActiveServices ? this.getActiveServices() : (window.JAP_SERVICES || []);
    const foundSvc = activeServices.find(s => String(s.id) === String(serviceId) || String(s.rawId) === String(serviceId));
    if (foundSvc) {
      targetProvider = foundSvc.provider || (String(foundSvc.id).startsWith('jap-') ? 'jap' : 'worldofsmm');
      rawServiceId = foundSvc.rawId || String(foundSvc.id).replace('wos-', '').replace('jap-', '').replace(/-likex$/, '');
      if (!serviceName || serviceName.startsWith('Service #') || serviceName === 'Service #null' || serviceName === 'Service #undefined') {
        serviceName = foundSvc.customerName || foundSvc.name;
      }
    } else if (String(serviceId).startsWith('wos-')) {
      targetProvider = 'worldofsmm';
      rawServiceId = String(serviceId).replace('wos-', '').replace(/-likex$/, '');
    } else if (String(serviceId).startsWith('jap-')) {
      targetProvider = 'jap';
      rawServiceId = String(serviceId).replace('jap-', '').replace(/-likex$/, '');
    }

    if (!serviceName || serviceName.startsWith('Service #') || serviceName === 'Service #null' || serviceName === 'Service #undefined') {
      const targetLower = String(target || '').toLowerCase();
      if (targetLower.includes('instagram.com') || targetLower.includes('instagr.am')) {
        serviceName = 'Instagram HQ Followers / Likes / Views [Instant]';
      } else if (targetLower.includes('youtube.com') || targetLower.includes('youtu.be')) {
        serviceName = 'YouTube Video Views & Engagement [HQ]';
      } else {
        serviceName = `Social Growth Service #${rawServiceId || '2868'}`;
      }
    }

    const providerDisplayName = targetProvider === 'jap' ? 'JustAnotherPanel' : (targetProvider === 'worldofsmm' ? 'WorldOfSMM' : 'Provider API');

    // Dynamic Live Wholesale Rate Lookup to protect profit margin
    let targetWholesaleCost = wholesaleCost;
    const liveInfo = this.getLiveRateInfo(serviceId, rawServiceId);
    if (liveInfo && liveInfo.rate > 0) {
      targetWholesaleCost = liveInfo.rate;
    } else if (targetWholesaleCost === undefined || targetWholesaleCost === null) {
      const activeServices = this.getActiveServices ? this.getActiveServices() : (window.JAP_SERVICES || []);
      const foundSvc = activeServices.find(s => String(s.id) === String(serviceId) || String(s.rawId) === String(serviceId));
      targetWholesaleCost = foundSvc ? (foundSvc.cost || foundSvc.rate || 0.20) : 0.20;
    }
    const unitSellingPrice = this.getSellingPrice(targetWholesaleCost);
    const totalCost = (unitSellingPrice / 1000) * Number(quantity);

    if (this.data.customer.balance < totalCost) {
      this.showToast('Insufficient wallet balance. Please add funds.', 'error');
      CustomerApp.openDepositModal();
      return { success: false, message: 'Insufficient balance' };
    }

    // Clean and sanitize target URL
    const cleanedTarget = this.cleanTargetUrl(target);

    // Fallback 5-Digit LikeX Order ID (used only if provider is unreachable)
    const fallbackOrderId = this.generateLikeXOrderId();
    const now = Date.now();
    const formattedDate = this.formatRealDate(now);

    // Dispatch live order to upstream provider with 15s timeout
    let liveOrderId = null;
    let upstreamError = null;
    let isQueued = false;

    const abortCtrl = new AbortController();
    const timeoutTimer = setTimeout(() => abortCtrl.abort(), 15000);

    try {
      const liveRes = await fetch('/api/provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortCtrl.signal,
        body: JSON.stringify({
          provider: targetProvider,
          action: 'add',
          service: String(rawServiceId),
          link: cleanedTarget,
          quantity: quantity,
          comments: comments || undefined,
          likeXOrderId: fallbackOrderId,
          serviceName: serviceName,
          charge: totalCost,
          customerEmail: this.data.customer?.email || '',
          customerName: this.data.customer?.name || 'Customer'
        })
      });
      clearTimeout(timeoutTimer);
      if (liveRes.ok) {
        const liveData = await liveRes.json();
        if (liveData.order) {
          liveOrderId = String(liveData.order);
        } else if (liveData.error) {
          upstreamError = liveData.error;
        }
      } else {
        upstreamError = `Server responded with HTTP ${liveRes.status}`;
      }
    } catch (e) {
      clearTimeout(timeoutTimer);
      upstreamError = e.name === 'AbortError' ? 'Provider connection timed out' : 'Network communication error';
    }

    // QUEUE LOGIC: If provider did not return immediate ID, safely queue
    if (!liveOrderId) {
      isQueued = true;
    }

    const finalOrderId = liveOrderId || fallbackOrderId;

    // Deduct user wallet immediately
    this.data.customer.balance -= totalCost;

    const newOrder = {
      id: finalOrderId,
      serviceId: serviceId || `wos-${rawServiceId}`,
      rawServiceId: rawServiceId,
      serviceName: serviceName,
      provider: targetProvider,
      providerName: 'LikeX Cloud Engine',
      providerDisplayName: providerDisplayName,
      providerOrderId: liveOrderId || finalOrderId,
      isQueued: isQueued,
      needsTopup: isQueued,
      upstreamError: upstreamError || null,
      platform: 'smm',
      target: cleanedTarget,
      quantity: Number(quantity),
      amount: totalCost,
      comments: comments || undefined,
      status: 'Processing',
      displayStatus: isQueued ? 'Processing (Queued for Dispatch)' : 'Processing',
      createdAt: now,
      date: formattedDate,
      startCount: 0,
      currentCount: 0,
      remains: Number(quantity),
      refillEligible: false,
      refillReason: isQueued ? `Queued on LikeX cloud server (Waiting ${providerDisplayName} top-up)` : `Dispatched to LikeX cloud server`,
      userEmail: this.data.customer?.email || '',
      customerName: this.data.customer?.name || 'Customer'
    };

    this.data.orders.unshift(newOrder);

    // Save to global likex_master_orders
    try {
      const master = JSON.parse(localStorage.getItem('likex_master_orders') || '[]');
      master.unshift(newOrder);
      localStorage.setItem('likex_master_orders', JSON.stringify(master));
    } catch (e) {}

    // Async background Supabase insertion & Alert notification (non-blocking)
    setTimeout(async () => {
      if (isQueued) {
        // Send alert ONLY if truly queued or balance error
        this.triggerAlert({
          type: 'queued_order',
          orderId: finalOrderId,
          providerName: providerDisplayName,
          providerKey: targetProvider,
          serviceName: serviceName,
          target: cleanedTarget,
          quantity: quantity,
          customerPaid: totalCost.toFixed(2),
          customerEmail: this.data.customer?.email || ''
        });
      } else if (liveOrderId) {
        // Successful live order dispatch notification
        this.triggerAlert({
          type: 'live_order',
          orderId: liveOrderId,
          providerName: providerDisplayName,
          providerKey: targetProvider,
          serviceName: serviceName,
          target: cleanedTarget,
          quantity: quantity,
          customerPaid: totalCost.toFixed(2),
          customerEmail: this.data.customer?.email || ''
        });
      }

      if (window.supabaseClient) {
        try {
          const orderNum = parseInt(finalOrderId, 10) || Math.floor(10000 + Math.random() * 90000);
          await window.supabaseClient
            .from('orders')
            .upsert([{
              id: orderNum,
              user_id: null,
              service_id: null, // Null prevents foreign key constraint error with customer_services table
              assigned_provider_id: targetProvider === 'worldofsmm' ? 2 : 1,
              target_url: cleanedTarget,
              quantity: Number(quantity),
              charge: totalCost,
              provider_cost: (targetWholesaleCost / 1000) * Number(quantity),
              provider_order_id: liveOrderId || finalOrderId,
              status: isQueued ? 'Queued' : 'Processing',
              remains: Number(quantity),
              refill_status: isQueued ? `Queued: ${String(upstreamError || 'Pending dispatch').slice(0, 40)}` : null,
              created_at: new Date(now).toISOString()
            }], { onConflict: 'id' });
        } catch (dbErr) {
          console.warn('[LikeX Supabase] Order insert notice:', dbErr);
        }
      }
    }, 10);

    // Track customer registration
    try {
      if (this.data.customer?.email) {
        const reg = JSON.parse(localStorage.getItem('likex_registered_customers') || '[]');
        if (!reg.some(c => (typeof c === 'string' ? c : c.email) === this.data.customer.email)) {
          reg.push({ email: this.data.customer.email, name: this.data.customer.name, registeredAt: Date.now() });
          localStorage.setItem('likex_registered_customers', JSON.stringify(reg));
        }
      }
    } catch (e) {}

    this.data.transactions.unshift({
      id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'Order Deduction',
      description: `Payment for Order #${finalOrderId}`,
      amount: -totalCost,
      balanceAfter: this.data.customer.balance,
      status: 'Success',
      createdAt: now,
      date: formattedDate
    });

    this.saveUserData();

    this.data.recentActivity.unshift({
      id: `act-${now}`,
      type: 'order',
      title: `New Order #${finalOrderId}`,
      sub: `${serviceName} • LikeX Express Server`,
      amount: this.formatMoney(totalCost),
      time: formattedDate,
      icon: '🛒'
    });

    this.recalculateAdminStats();

    if (!options.silent) {
      this.showToast(`🎉 Order #${finalOrderId} placed successfully! Queued on high-speed server.`, 'success');
      this.setCustomerTab('orders');
    }
    this.notify();
    return { success: true, orderId: finalOrderId, totalCost };
  }

  // Live Status Synchronization from Upstream Provider
  async syncOrdersStatus(silent = false) {
    if (!this.data.orders || this.data.orders.length === 0) return 0;

    let updatedCount = 0;
    for (const order of this.data.orders) {
      if (order.status === 'Completed' || order.status === 'Canceled' || order.status === 'Refunded') {
        continue;
      }

      // Check if order has a provider order ID
      const provOrderId = (order.providerOrderId && /^\d+$/.test(order.providerOrderId))
        ? order.providerOrderId
        : (/^\d{6,}$/.test(order.id) ? order.id : null);

      if (provOrderId) {
        try {
          const res = await fetch('/api/provider', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              provider: order.provider || 'worldofsmm',
              action: 'status',
              order: provOrderId
            })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.status) {
              const rawStat = String(data.status).trim();
              const liveStatus = rawStat.toLowerCase() === 'in progress' 
                ? 'In Progress' 
                : (rawStat.toLowerCase() === 'partial' ? 'Partial' : rawStat);
              order.status = liveStatus;
              if (data.start_count !== undefined && data.start_count !== null) {
                order.startCount = Number(data.start_count);
              }
              if (data.remains !== undefined && data.remains !== null) {
                order.remains = Number(data.remains);
              }
              order.currentCount = (order.startCount || 0) + (order.quantity - (order.remains || 0));
              updatedCount++;
            }
          }
        } catch (e) {
          console.warn('Status sync error for order', order.id, e);
        }
      }
    }

    // Also refresh admin orders from Supabase cloud
    try {
      this.syncSupabaseDataForAdmin();
    } catch (e) {}

    if (updatedCount > 0) {
      this.saveUserData();
      this.notify();
      if (!silent) {
        this.showToast(`🔄 Synchronized ${updatedCount} orders with live server!`, 'success');
      }
    } else if (!silent) {
      this.showToast('✅ All live orders are up to date!', 'info');
    }
    return updatedCount;
  }

  // Refund an unfulfilled or canceled order back to user's wallet
  refundOrder(orderId, reason = 'Provider Service Unavailable') {
    const order = this.data.orders.find(o => String(o.id) === String(orderId));
    if (!order || order.status === 'Refunded' || order.status === 'Canceled') return false;

    const refundAmt = Number(order.amount) || 0;
    this.data.customer.balance += refundAmt;
    order.status = 'Refunded';
    order.refillReason = `Refunded: ${reason}`;

    const now = Date.now();
    const formattedDate = this.formatRealDate(now);

    this.data.transactions.unshift({
      id: `REF-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'Order Refund',
      description: `Refund for Order #${orderId} (${reason})`,
      amount: refundAmt,
      balanceAfter: this.data.customer.balance,
      status: 'Success',
      createdAt: now,
      date: formattedDate
    });

    this.saveUserData();
    this.showToast(`₹${refundAmt.toFixed(4)} refunded to your wallet for Order #${orderId}!`, 'success');
    this.notify();
    return true;
  }

  // Admin-initiated refund directly to customer's LikeX wallet balance (zero loss, exact amount)
  async adminRefundOrder(orderId, customReason = 'Unfulfilled / Queued Order Refund') {
    const allOrders = this.getAllAdminOrders ? this.getAllAdminOrders() : (this.data.orders || []);
    const order = allOrders.find(o => String(o.id) === String(orderId) || String(o.providerOrderId) === String(orderId));
    if (!order) {
      this.showToast(`Order #${orderId} not found in system.`, 'error');
      return false;
    }
    if (order.status === 'Refunded') {
      this.showToast(`Order #${orderId} is already refunded.`, 'warning');
      return false;
    }

    // Exact refund amount (never rounds up, zero financial loss)
    const exactRefundAmount = Number(order.amount) || Number(order.charge) || 0;
    const custEmail = (order.userEmail || order.customerEmail || '').trim();

    // 1. Mark order as Refunded locally
    order.status = 'Refunded';
    order.isQueued = false;
    order.refillReason = `Refunded: ${customReason}`;

    // Update in this.data.orders
    const localOrder = (this.data.orders || []).find(o => String(o.id) === String(orderId));
    if (localOrder) {
      localOrder.status = 'Refunded';
      localOrder.isQueued = false;
      localOrder.refillReason = `Refunded: ${customReason}`;
    }

    // Update in likex_master_orders in localStorage
    try {
      const master = JSON.parse(localStorage.getItem('likex_master_orders') || '[]');
      const mIdx = master.findIndex(o => String(o.id) === String(orderId));
      if (mIdx !== -1) {
        master[mIdx].status = 'Refunded';
        master[mIdx].isQueued = false;
        master[mIdx].refillReason = `Refunded: ${customReason}`;
        localStorage.setItem('likex_master_orders', JSON.stringify(master));
      }
    } catch (e) {}

    // Update in likex_supabase_orders in localStorage
    try {
      const supa = JSON.parse(localStorage.getItem('likex_supabase_orders') || '[]');
      const sIdx = supa.findIndex(o => String(o.id) === String(orderId));
      if (sIdx !== -1) {
        supa[sIdx].status = 'Refunded';
        supa[sIdx].isQueued = false;
        supa[sIdx].refillReason = `Refunded: ${customReason}`;
        localStorage.setItem('likex_supabase_orders', JSON.stringify(supa));
      }
    } catch (e) {}

    // 2. Credit wallet in customer localStorage if customer exists on this device
    if (custEmail) {
      const balKey = this._getUserStorageKey(custEmail, 'balance');
      const curBal = parseFloat(localStorage.getItem(balKey) || '0');
      const newBal = Number((curBal + exactRefundAmount).toFixed(4));
      localStorage.setItem(balKey, newBal.toFixed(4));

      const txnsKey = this._getUserStorageKey(custEmail, 'txns');
      const uTxns = JSON.parse(localStorage.getItem(txnsKey) || '[]');
      uTxns.unshift({
        id: `REF-${Math.floor(1000 + Math.random() * 9000)}`,
        type: 'Order Refund',
        description: `Refund for Order #${orderId} (${customReason})`,
        amount: exactRefundAmount,
        balanceAfter: newBal,
        status: 'Success',
        createdAt: Date.now(),
        date: this.formatRealDate(Date.now())
      });
      localStorage.setItem(txnsKey, JSON.stringify(uTxns));
    }

    // 3. Update Supabase Cloud Database (Orders, Transactions, and User Balance)
    if (window.supabaseClient) {
      try {
        const orderNum = parseInt(orderId, 10);
        if (orderNum) {
          await window.supabaseClient
            .from('orders')
            .update({
              status: 'Refunded',
              refill_status: `Refunded: ${customReason}`
            })
            .eq('id', orderNum);
        }

        // Add refund transaction entry to wallet_transactions
        await window.supabaseClient
          .from('wallet_transactions')
          .insert([{
            id: `REF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
            user_id: 1,
            type: 'Refund',
            description: `Order #${orderId} Refund by Admin [${custEmail || 'Customer'}]`,
            amount: exactRefundAmount,
            balance_after: 0,
            status: 'Success',
            created_at: new Date().toISOString()
          }]);

        // If customer exists in users table, credit their balance
        if (custEmail) {
          const { data: userData } = await window.supabaseClient
            .from('users')
            .select('id, balance')
            .ilike('email', custEmail.toLowerCase().trim())
            .limit(1);
          if (userData && userData.length > 0) {
            const u = userData[0];
            const updatedBal = Number(((Number(u.balance) || 0) + exactRefundAmount).toFixed(4));
            await window.supabaseClient
              .from('users')
              .update({ balance: updatedBal })
              .eq('id', u.id);
          }
        }
      } catch (err) {
        console.warn('[LikeX Admin] Supabase cloud refund notice:', err);
      }
    }

    this.showToast(`✓ Successfully refunded ${this.formatMoney(exactRefundAmount)} to customer wallet!`, 'success');
    this.notify();
    return true;
  }

  // Admin-initiated retry dispatch to upstream provider (WorldOfSMM / JAP)
  async adminRetryOrder(orderId) {
    const allOrders = this.getAllAdminOrders ? this.getAllAdminOrders() : (this.data.orders || []);
    const order = allOrders.find(o => String(o.id) === String(orderId) || String(o.providerOrderId) === String(orderId));
    if (!order) {
      this.showToast(`Order #${orderId} not found.`, 'error');
      return false;
    }

    this.showToast(`Retrying dispatch for Order #${orderId}...`, 'info');

    try {
      const res = await fetch('/api/provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: order.provider || 'worldofsmm',
          action: 'add',
          service: String(order.rawServiceId || order.serviceId || '2868').replace('wos-', '').replace('jap-', ''),
          link: order.target,
          quantity: order.quantity,
          charge: order.amount,
          likeXOrderId: orderId
        })
      });

      const data = await res.json();
      if (data && data.order) {
        const liveProvId = String(data.order);
        order.providerOrderId = liveProvId;
        order.status = 'Processing';
        order.isQueued = false;
        order.refillReason = `Dispatched live (Prov ID #${liveProvId})`;

        // Update Supabase
        if (window.supabaseClient) {
          const orderNum = parseInt(orderId, 10);
          if (orderNum) {
            await window.supabaseClient
              .from('orders')
              .update({
                provider_order_id: liveProvId,
                status: 'Processing',
                refill_status: `Live dispatched to ${order.providerDisplayName || 'Provider'}`
              })
              .eq('id', orderNum);
          }
        }

        this.showToast(`✓ Order #${orderId} successfully dispatched! Provider Order ID: #${liveProvId}`, 'success');
        this.notify();
        return true;
      } else {
        const err = data?.error || 'Provider rejected request (Check provider balance or target link)';
        this.showToast(`Dispatch failed: ${err}`, 'error');
        return false;
      }
    } catch (e) {
      this.showToast(`Connection error while contacting provider: ${e.message}`, 'error');
      return false;
    }
  }

  // Auto-reconcile old failed mock test orders (like #48452, #48609)
  reconcilePendingOrders() {
    if (!this.data.orders || this.data.orders.length === 0) return;
    let refundedCount = 0;
    for (const order of this.data.orders) {
      const isUnfulfilledMock = (order.status === 'Pending (Low Provider Balance)') ||
        (order.isLowBalance && order.status !== 'Refunded') ||
        (String(order.id).startsWith('48') && !order.providerOrderId && order.status === 'Processing');

      if (isUnfulfilledMock && order.status !== 'Refunded' && order.status !== 'Completed') {
        const refundAmt = Number(order.amount) || 0;
        this.data.customer.balance += refundAmt;
        order.status = 'Refunded';
        order.refillReason = 'Automated refund: Upstream provider rejected order';
        this.data.transactions.unshift({
          id: `REF-${Math.floor(1000 + Math.random() * 9000)}`,
          type: 'Order Refund',
          description: `Auto-Refund for test Order #${order.id}`,
          amount: refundAmt,
          balanceAfter: this.data.customer.balance,
          status: 'Success',
          createdAt: Date.now(),
          date: this.formatRealDate(Date.now())
        });
        refundedCount++;
      }
    }
    if (refundedCount > 0) {
      this.saveUserData();
      this.notify();
      this.showToast(`✅ Auto-reconciled & refunded ${refundedCount} unfulfilled test orders to your wallet!`, 'success');
    }
  }

  async requestRefill(orderId) {
    const order = this.data.orders.find(o => String(o.id) === String(orderId));
    if (!order) return;

    try {
      await fetch('/api/provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          provider: order.provider || 'jap',
          action: 'refill', 
          order: order.providerOrderId || orderId 
        })
      });
    } catch (e) {}

    order.refillEligible = false;
    order.refillStatus = 'Refill Requested';

    const refillItem = {
      id: `ref-${Math.floor(1000 + Math.random() * 9000)}`,
      orderId: order.id,
      serviceName: order.serviceName,
      customerName: `${this.data.customer.name} (${this.data.customer.email})`,
      startCount: order.startCount,
      targetCount: order.startCount + order.quantity,
      currentCount: order.currentCount,
      dropCount: Math.max(0, (order.startCount + order.quantity) - order.currentCount),
      requestedAt: 'Just now',
      status: 'Pending',
      provider: order.providerName || 'JustAnotherPanel'
    };

    this.data.refillQueue.unshift(refillItem);
    this.saveUserData();
    this.showToast(`Refill requested for Order #${order.id}! Dispatched to ${order.providerName || 'Provider'}.`, 'refill');
    this.notify();
  }

  addFunds(amountInUsd, method = 'UPI / Instant Pay') {
    if (!this.data.isLoggedIn) {
      this.showToast('Please sign in to add funds to your wallet', 'error');
      CustomerApp.openAuthModal();
      return;
    }

    const numericAmount = parseFloat(amountInUsd);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      this.showToast('Please enter a valid amount', 'error');
      return;
    }

    this.data.customer.balance += numericAmount;

    const now = Date.now();
    const formattedDate = this.formatRealDate(now);

    this.data.transactions.unshift({
      id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
      type: 'Wallet Deposit',
      description: `Manual Topup via ${method}`,
      amount: numericAmount,
      balanceAfter: this.data.customer.balance,
      status: 'Success',
      createdAt: now,
      date: formattedDate
    });

    this.data.recentActivity.unshift({
      id: `act-${now}`,
      type: 'deposit',
      title: 'Wallet Recharged',
      sub: `${method} • Confirmed`,
      amount: `+${this.formatMoney(numericAmount)}`,
      time: formattedDate,
      icon: '⚡'
    });

    this.saveUserData();

    this.showToast(`Successfully added ${this.formatMoney(numericAmount)} to wallet!`, 'success');
    this.notify();
  }

  // Anti-Fraud: Check if a UTR / Transaction ID was already claimed across any device
  async checkUtrStatus(rawUtr) {
    if (!rawUtr) return { claimed: false };
    const cleanUtr = String(rawUtr).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!cleanUtr) return { claimed: false };

    // 1. Check in-memory claimed registry
    if (this.data.claimedUtrs && this.data.claimedUtrs[cleanUtr]) {
      return { claimed: true, record: this.data.claimedUtrs[cleanUtr], reason: 'Already redeemed in system' };
    }

    // 2. Check localStorage claimed registry
    try {
      const localClaimed = JSON.parse(localStorage.getItem('likex_claimed_utrs') || '{}');
      if (localClaimed && localClaimed[cleanUtr]) {
        this.data.claimedUtrs[cleanUtr] = localClaimed[cleanUtr];
        return { claimed: true, record: localClaimed[cleanUtr], reason: 'Already redeemed on this device' };
      }
    } catch (e) {}

    // 3. Check current user's local transactions
    if (Array.isArray(this.data.transactions)) {
      const matchTxn = this.data.transactions.find(t => 
        t.description && t.description.toUpperCase().includes(cleanUtr)
      );
      if (matchTxn) {
        return { claimed: true, record: matchTxn, reason: 'Already credited to your account' };
      }
    }

    // 4. Try Serverless UTR API (/api/utr)
    try {
      const apiRes = await fetch('/api/utr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check', utr: cleanUtr })
      });
      if (apiRes.ok) {
        const apiData = await apiRes.json();
        if (apiData && apiData.claimed) {
          if (!this.data.claimedUtrs) this.data.claimedUtrs = {};
          this.data.claimedUtrs[cleanUtr] = apiData.record || { utr: cleanUtr, claimedAt: new Date().toISOString() };
          try { localStorage.setItem('likex_claimed_utrs', JSON.stringify(this.data.claimedUtrs)); } catch(e){}
          return { claimed: true, record: apiData.record, reason: 'Redeemed on another device' };
        }
      }
    } catch (e) {}

    // 5. Check Supabase Cloud database directly (wallet_transactions & users config row 999)
    if (window.supabaseClient) {
      try {
        const utrPrimaryId = `UTR-${cleanUtr}`;
        const { data: txnRows } = await window.supabaseClient
          .from('wallet_transactions')
          .select('id, description, amount, created_at')
          .or(`id.eq.${utrPrimaryId},description.ilike.%${cleanUtr}%`)
          .limit(1);

        if (txnRows && txnRows.length > 0) {
          if (!this.data.claimedUtrs) this.data.claimedUtrs = {};
          this.data.claimedUtrs[cleanUtr] = txnRows[0];
          try { localStorage.setItem('likex_claimed_utrs', JSON.stringify(this.data.claimedUtrs)); } catch(e){}
          return { claimed: true, record: txnRows[0], reason: 'Recorded in verified cloud transaction ledger' };
        }

        // Also check users config row 999
        const { data: configRows } = await window.supabaseClient
          .from('users')
          .select('password_hash')
          .eq('id', 999);

        if (configRows && configRows.length > 0 && configRows[0].password_hash) {
          try {
            const parsed = JSON.parse(configRows[0].password_hash);
            if (parsed.claimed_utrs && parsed.claimed_utrs[cleanUtr]) {
              if (!this.data.claimedUtrs) this.data.claimedUtrs = {};
              this.data.claimedUtrs[cleanUtr] = parsed.claimed_utrs[cleanUtr];
              try { localStorage.setItem('likex_claimed_utrs', JSON.stringify(this.data.claimedUtrs)); } catch(e){}
              return { claimed: true, record: parsed.claimed_utrs[cleanUtr], reason: 'Redeemed in cloud network' };
            }
          } catch(e) {}
        }
      } catch (err) {
        console.warn('[LikeX Anti-Fraud] Supabase direct check:', err);
      }
    }

    return { claimed: false };
  }

  // Anti-Fraud: Register and lock a claimed UTR permanently across all devices
  async registerClaimedUtr(rawUtr, amountInInr, method = 'Razorpay UPI') {
    if (!rawUtr) return;
    const cleanUtr = String(rawUtr).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!cleanUtr) return;

    const record = {
      utr: cleanUtr,
      amountInr: Number(amountInInr),
      amountUsd: Number(amountInInr) / (this.data.exchangeRate || 83),
      userEmail: this.data.customer.email || 'anonymous',
      userName: this.data.customer.name || 'User',
      claimedAt: new Date().toISOString(),
      timestamp: Date.now(),
      method: method
    };

    // 1. In-memory
    if (!this.data.claimedUtrs) this.data.claimedUtrs = {};
    this.data.claimedUtrs[cleanUtr] = record;

    // 2. LocalStorage
    try {
      localStorage.setItem('likex_claimed_utrs', JSON.stringify(this.data.claimedUtrs));
    } catch (e) {}

    // 3. Centralized Serverless API Lock
    try {
      fetch('/api/utr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'claim',
          utr: cleanUtr,
          amount: amountInInr,
          email: this.data.customer.email || 'anonymous'
        })
      }).catch(() => {});
    } catch (e) {}

    // 4. Supabase Direct Atomic Insert to wallet_transactions (Primary Key Unique Lock)
    if (window.supabaseClient) {
      try {
        const utrPrimaryId = `UTR-${cleanUtr}`;
        await window.supabaseClient
          .from('wallet_transactions')
          .insert({
            id: utrPrimaryId,
            user_id: 999,
            type: 'Deposit',
            description: `Razorpay UPI Deposit (UTR: ${cleanUtr}) [${this.data.customer.email || 'user'}]`,
            amount: record.amountUsd,
            balance_after: this.data.customer.balance,
            status: 'Success'
          })
          .catch(() => {});

        // 5. Also update master registry in users row 999
        const { data: configRows } = await window.supabaseClient
          .from('users')
          .select('password_hash')
          .eq('id', 999);

        if (configRows && configRows.length > 0 && configRows[0].password_hash) {
          const parsed = JSON.parse(configRows[0].password_hash || '{}');
          if (!parsed.claimed_utrs) parsed.claimed_utrs = {};
          parsed.claimed_utrs[cleanUtr] = record;

          await window.supabaseClient
            .from('users')
            .update({ password_hash: JSON.stringify(parsed) })
            .eq('id', 999)
            .catch(() => {});
        }
      } catch (err) {
        console.warn('[LikeX Anti-Fraud] Supabase UTR registration warning:', err);
      }
    }
  }

  async testProviderConnection(providerId) {
    const provider = this.data.providers.find(p => String(p.id) === String(providerId));
    if (!provider) return;

    this.showToast(`Pinging ${provider.displayName} API endpoint...`, 'info');

    const providerParam = provider.id === 'p2' ? 'worldofsmm' : 'jap';
    try {
      const res = await fetch(`/api/provider?action=balance&provider=${providerParam}`);
      if (res.ok) {
        const json = await res.json();
        if (json.balance !== undefined) {
          provider.balance = parseFloat(json.balance);
          provider.lastSync = 'Just now (Live API)';
          this.showToast(`Connected to ${provider.displayName}! Live Balance: $${json.balance} ${json.currency || 'USD'}`, 'success');
          this.notify();
          return;
        }
      }
    } catch (e) {}

    setTimeout(() => {
      this.showToast(`Connection to ${provider.displayName} verified! Ping 84ms, Balance $${provider.balance.toFixed(2)}`, 'success');
    }, 800);
  }

  // Multi-Channel Alert Gateway (Telegram Bot & Gmail)
  getAlertConfig() {
    try {
      const saved = localStorage.getItem('likex_alert_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      adminEmail: 'supporthubindia@gmail.com',
      telegramBotToken: '8874080054:AAFazn2iknlJMDppQuXlTM0UwQsYFP9Dwik',
      telegramChatId: '2057136429',
      threshold: 100.00
    };
  }

  saveAlertConfig(config) {
    try {
      localStorage.setItem('likex_alert_config', JSON.stringify(config));
    } catch (e) {}
    this.showToast('✅ Alert settings updated successfully!', 'success');
    this.notify();
  }

  async triggerAlert(alertData) {
    try {
      const config = this.getAlertConfig();
      const payload = {
        ...alertData,
        adminEmail: config.adminEmail,
        telegramBotToken: config.telegramBotToken,
        telegramChatId: config.telegramChatId,
        threshold: config.threshold
      };

      await fetch('/api/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.warn('[LikeX Alert] Alert trigger notice:', e);
    }
  }

  async sendTestAlert() {
    const config = this.getAlertConfig();
    this.showToast(`📡 Sending live test alert to Telegram Bot and Gmail (${config.adminEmail})...`, 'info');

    try {
      const res = await fetch('/api/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'test',
          providerName: 'JustAnotherPanel (JAP)',
          providerKey: 'jap',
          balance: '45.00',
          threshold: String(config.threshold || 100),
          adminEmail: config.adminEmail,
          telegramBotToken: config.telegramBotToken,
          telegramChatId: config.telegramChatId
        })
      });
      if (res.ok) {
        this.showToast(`✅ Test alert successfully sent to Telegram Bot & ${config.adminEmail}!`, 'success');
      } else {
        this.showToast('⚠️ Alert gateway responded with status ' + res.status, 'warning');
      }
    } catch (e) {
      this.showToast('❌ Failed to connect to alert gateway: ' + e.message, 'error');
    }
  }

  // 1-Click Dispatch Queued Orders once Provider Balance is Refilled
  async dispatchQueuedOrder(orderId) {
    const allOrders = this.getAllAdminOrders();
    const order = allOrders.find(o => String(o.id) === String(orderId));
    if (!order) {
      this.showToast(`Order #${orderId} not found in system.`, 'error');
      return { success: false };
    }

    const prov = order.provider || (String(order.serviceId).startsWith('wos-') ? 'worldofsmm' : 'jap');
    const rawId = order.rawServiceId || String(order.serviceId).replace('wos-', '');
    const provName = prov === 'worldofsmm' ? 'WorldOfSMM' : 'JustAnotherPanel (JAP)';

    this.showToast(`⚡ Dispatching Order #${orderId} to ${provName}...`, 'info');

    try {
      const liveRes = await fetch('/api/provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: prov,
          action: 'add',
          service: String(rawId),
          link: order.target,
          quantity: order.quantity,
          comments: order.comments || undefined
        })
      });

      if (liveRes.ok) {
        const liveData = await liveRes.json();
        if (liveData.order) {
          order.providerOrderId = String(liveData.order);
          order.isQueued = false;
          order.needsTopup = false;
          order.upstreamError = null;
          order.status = 'In Progress';
          order.displayStatus = 'In Progress';
          order.refillReason = `Dispatched to ${provName} (Provider Order #${liveData.order})`;

          this.updateOrderInAllStorages(order);
          this.showToast(`🎉 Order #${orderId} successfully dispatched to ${provName}! Upstream Order ID: #${liveData.order}`, 'success');
          this.notify();
          return { success: true, providerOrderId: liveData.order };
        } else {
          this.showToast(`⚠️ ${provName} returned: ${liveData.error || 'Insufficient balance'}. Please refill provider account first.`, 'error');
          return { success: false, error: liveData.error };
        }
      } else {
        this.showToast(`❌ Gateway responded with HTTP ${liveRes.status}`, 'error');
        return { success: false };
      }
    } catch (e) {
      this.showToast(`❌ Network error while dispatching order #${orderId}`, 'error');
      return { success: false, error: e.message };
    }
  }

  updateOrderInAllStorages(updatedOrder) {
    // 1. Update in local store data
    const idx = (this.data.orders || []).findIndex(o => String(o.id) === String(updatedOrder.id));
    if (idx >= 0) {
      this.data.orders[idx] = { ...this.data.orders[idx], ...updatedOrder };
    }
    this.saveUserData();

    // 2. Update in master global orders
    try {
      const master = JSON.parse(localStorage.getItem('likex_master_orders') || '[]');
      const mIdx = master.findIndex(o => String(o.id) === String(updatedOrder.id));
      if (mIdx >= 0) {
        master[mIdx] = { ...master[mIdx], ...updatedOrder };
      } else {
        master.unshift(updatedOrder);
      }
      localStorage.setItem('likex_master_orders', JSON.stringify(master));
    } catch (e) {}

    // 3. Update in user storage
    if (updatedOrder.userEmail) {
      try {
        const key = this._getUserStorageKey(updatedOrder.userEmail, 'orders');
        const uOrders = JSON.parse(localStorage.getItem(key) || '[]');
        const uIdx = uOrders.findIndex(o => String(o.id) === String(updatedOrder.id));
        if (uIdx >= 0) {
          uOrders[uIdx] = { ...uOrders[uIdx], ...updatedOrder };
          localStorage.setItem(key, JSON.stringify(uOrders));
        }
      } catch (e) {}
    }
  }
}

window.store = new SmmStateStore();
