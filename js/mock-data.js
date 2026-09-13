window.SMM_CARTOON_AVATARS = [
  {
    id: 'cyber-hero',
    name: 'Cyber Ninja',
    badge: '⚡ VIP',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Klaus&backgroundColor=6366f1'
  },
  {
    id: 'neon-girl',
    name: 'Neon Diva',
    badge: '🌸 Popular',
    url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Sophie&backgroundColor=ec4899'
  },
  {
    id: 'astro-boy',
    name: 'Space Astro',
    badge: '🚀 Cosmic',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Cosmo&backgroundColor=3b82f6'
  },
  {
    id: 'street-pro',
    name: 'Cool Hustler',
    badge: '🕶️ Street',
    url: 'https://api.dicebear.com/7.x/micah/svg?seed=Jack&backgroundColor=10b981'
  },
  {
    id: 'gold-king',
    name: 'Golden King',
    badge: '👑 Elite',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Alexander&backgroundColor=f59e0b'
  },
  {
    id: 'robo-bot',
    name: 'AI CyberBot',
    badge: '🤖 Mech',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Sparky&backgroundColor=8b5cf6'
  }
];

window.SMM_DEFAULT_REELS = [
  {
    id: 'reel-1',
    title: '10K Instagram Followers in 60 Secs — Live Proof! ⚡',
    videoUrl: 'https://youtube.com/shorts/5v4pP277K-k',
    badge: '🔥 Live Proof',
    views: '48.5K views',
    duration: '0:45',
    active: true,
    createdAt: '2026-03-01'
  },
  {
    id: 'reel-2',
    title: 'How LikeX Wholesale SMM Works (Step-by-Step) 👑',
    videoUrl: 'https://youtube.com/shorts/3i_b7B2l8Y0',
    badge: '👑 Official Guide',
    views: '92.1K views',
    duration: '0:58',
    active: true,
    createdAt: '2026-03-02'
  },
  {
    id: 'reel-3',
    title: 'Instant ₹100 UPI Add Funds & QR Verification 💰',
    videoUrl: 'https://youtube.com/shorts/kJQP7kiw5Fk',
    badge: '⚡ Instant Add Funds',
    views: '35.4K views',
    duration: '0:30',
    active: true,
    createdAt: '2026-03-03'
  },
  {
    id: 'reel-4',
    title: 'Real Creator Results & 365-Day Refill Guarantee 🛡️',
    videoUrl: 'https://youtube.com/shorts/fJ9rUzIMcZQ',
    badge: '✨ Client Review',
    views: '64.8K views',
    duration: '0:50',
    active: true,
    createdAt: '2026-03-04'
  }
];

window.SMM_MOCK = {
  currency: 'INR',
  exchangeRate: 95.385,
  isLoggedIn: false, // Default: Guest Mode (Browse without signup)
  
  customer: {
    name: 'Guest Visitor',
    email: '',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Klaus&backgroundColor=6366f1',
    balance: 0.00,
    spent: 0.00,
    ordersCount: 0
  },

  adminStats: {
    totalCustomers: 1,
    customersTrend: 0.0,
    totalOrders: 0,
    ordersTrend: 0.0,
    revenue: 0.00,
    revenueTrend: 0.0,
    profit: 0.00,
    profitTrend: 0.0,
    providerBalance: 0.00,
    providerBalanceStatus: 'Live Connected',
    globalMarkupPercent: 50
  },

  providers: [
    {
      id: 'p1',
      name: 'JustAnotherPanel',
      displayName: 'JustAnotherPanel (JAP Wholesale)',
      status: 'active',
      balance: 0.00,
      currency: 'USD',
      activeServices: 5803,
      lastSync: 'Live Connected',
      apiUrl: 'https://justanotherpanel.com/api/v2',
      apiKeyMasked: '30265a••••••••4a63'
    },
    {
      id: 'p2',
      name: 'WorldOfSMM',
      displayName: 'WorldOfSMM (India Local Provider 🇮🇳)',
      status: 'active',
      balance: 0.00,
      currency: 'USD',
      activeServices: 67,
      lastSync: 'Live Connected',
      apiUrl: 'https://worldofsmm.com/api/v2',
      apiKeyMasked: '46b91d••••••••3a1a'
    },
    {
      id: 'p3',
      name: 'SocialFans',
      displayName: 'SocialFans (Direct API)',
      status: 'active',
      balance: 0.00,
      currency: 'INR',
      activeServices: 460,
      lastSync: 'Live Connected',
      apiUrl: 'https://socialfanss.com/api/v2',
      apiKeyMasked: '05c0eb••••••••4cce'
    }
  ],

  // 2-Level Structured Services (Sub-Category -> Packages with tiered rates)
  customerServices: [
    // -------------------------------------------------------------
    // LIKEX SPECIAL VERY GOOD - INSTAGRAM (WOS 2868, JAP 5994 & WOS 6149)
    // -------------------------------------------------------------
    {
      id: 'wos-2868-likex',
      rawId: '2868',
      platform: 'instagram',
      subcategory: '🌟 LikeX Special Very Good [Followers, Likes, Views & Comments]',
      customerName: '🔔 ⭐ Instagram HQ Followers R365 | 100k/Day [Best Seller Since 2021] Low Drop',
      pricePer1k: 1.7228,
      min: 10,
      max: 100000,
      deliverySpeed: '⚡ 100K/Day [Low Drop]',
      startTime: '0 - 1 Hour',
      refillSupported: true,
      refillPeriod: '365 Days',
      description: '🌟 LikeX Special VIP High-Quality Non-Drop Followers with 365-Day Refill Guarantee via WorldOfSMM (2868).',
      wholesaleCost: 1.7228,
      markupPercent: 50,
      provider: 'worldofsmm'
    },
    {
      id: 'jap-5994',
      rawId: '5994',
      platform: 'instagram',
      subcategory: '🌟 LikeX Special Very Good [Followers, Likes, Views & Comments]',
      customerName: '5994 - LikeX Special Instagram Views [Max: 10M] [Start Time: 0-1 Hour] [Speed: 200K/D]',
      pricePer1k: 0.0014856,
      min: 100,
      max: 10000000,
      deliverySpeed: '⚡ Instant (0 - 15m)',
      startTime: '0 - 1 Hour',
      refillSupported: false,
      refillPeriod: 'None',
      description: '🌟 LikeX Special Ultra-Fast Instagram Views connected directly via JustAnotherPanel (JAP). High speed up to 200K/Day.',
      japId: '5994',
      wholesaleCost: 0.0014856,
      markupPercent: 50,
      provider: 'jap'
    },
    {
      id: 'wos-6149',
      rawId: '6149',
      platform: 'instagram',
      subcategory: '🌟 LikeX Special Very Good [Followers, Likes, Views & Comments]',
      customerName: '6149 - 🇮🇳LikeX Special Instagram Custom comments [Indian] 2k/day [Non drop]',
      pricePer1k: 0.45431,
      min: 10,
      max: 10000,
      deliverySpeed: '⚡ Instant - 2K/Day [Non drop]',
      startTime: '0 - 1 Hour',
      refillSupported: false,
      refillPeriod: 'None',
      description: '🌟 LikeX Special Real Indian Custom Comments connected directly via WorldOfSMM. 2K/Day Non drop.',
      wholesaleCost: 0.45431,
      markupPercent: 50,
      provider: 'worldofsmm'
    },

    // -------------------------------------------------------------
    // INSTAGRAM - GUARANTEED FOLLOWERS (WITH REFILL)
    // -------------------------------------------------------------
    {
      id: 'ig-fol-1',
      platform: 'instagram',
      subcategory: 'Instagram Followers [Guaranteed / Refill 30D - 365D]',
      customerName: 'Instagram Followers [Refill: 30D] - Basic Fast (₹79 me 1000)',
      pricePer1k: 0.83, // ₹79.16
      min: 50,
      max: 200000,
      deliverySpeed: '10K - 20K / Day',
      startTime: '0 - 1 Hour',
      refillSupported: true,
      refillPeriod: '30 Days',
      description: 'Budget real followers with 30-Day auto-refill guarantee. Safe delivery for personal and business pages.',
      japId: '10131',
      wholesaleCost: 0.585, // ₹55.80 wholesale
      markupPercent: 42
    },
    {
      id: 'ig-fol-2',
      platform: 'instagram',
      subcategory: 'Instagram Followers [Guaranteed / Refill 30D - 365D]',
      customerName: 'Instagram Followers [Refill: 30D] - High Quality Real (₹50 me 1000)',
      pricePer1k: 0.60, // ₹50.00
      min: 100,
      max: 500000,
      deliverySpeed: '30K - 50K / Day',
      startTime: '0 - 30 Minutes',
      refillSupported: true,
      refillPeriod: '30 Days',
      description: 'High quality profiles with posts, active stories, and profile pictures. Drop rate below 2%.',
      japId: '10216',
      wholesaleCost: 0.28, // ₹23.00 wholesale
      markupPercent: 117
    },
    {
      id: 'ig-fol-3',
      platform: 'instagram',
      subcategory: 'Instagram Followers [Guaranteed / Refill 30D - 365D]',
      customerName: 'Instagram Followers [Refill: 365D VIP Lifetime Guarantee] (₹90 me 1000)',
      pricePer1k: 1.08, // ₹90.00
      min: 100,
      max: 5000000,
      deliverySpeed: 'Up to 200K / Day',
      startTime: 'Instant (0 - 15 mins)',
      refillSupported: true,
      refillPeriod: '365 Days',
      description: 'VIP non-drop followers with 1 Full Year (365 Days) refill warranty. Ideal for influencers, creators, and brands.',
      japId: '10349',
      wholesaleCost: 0.50, // ₹41.50 wholesale
      markupPercent: 116
    },

    // -------------------------------------------------------------
    // INSTAGRAM - NON-GUARANTEED / BUDGET FOLLOWERS
    // -------------------------------------------------------------
    {
      id: 'ig-fol-budget-1',
      platform: 'instagram',
      subcategory: 'Instagram Followers [Budget / No Refill]',
      customerName: 'Instagram Followers [Ultra Cheap / No Refill] (₹18 me 1000)',
      pricePer1k: 0.22, // ₹18.00
      min: 100,
      max: 100000,
      deliverySpeed: '50K / Day',
      startTime: 'Instant',
      refillSupported: false,
      refillPeriod: 'None',
      description: 'Super low cost instant followers. No refill warranty (drop may happen). Good for quick numbers.',
      japId: '10140',
      wholesaleCost: 0.09, // ₹7.50 wholesale
      markupPercent: 140
    },

    // -------------------------------------------------------------
    // INSTAGRAM - LIKES
    // -------------------------------------------------------------
    {
      id: 'ig-like-1',
      platform: 'instagram',
      subcategory: 'Instagram Likes [Instant & High Quality]',
      customerName: 'Instagram Likes [Instant Speed / Real Looking] (₹10 me 1000)',
      pricePer1k: 0.12, // ₹10.00
      min: 50,
      max: 100000,
      deliverySpeed: '50K / Day',
      startTime: 'Instant (0 - 5 mins)',
      refillSupported: true,
      refillPeriod: '30 Days',
      description: 'Instant delivery likes for posts, reels, and carousels. Real-looking profiles.',
      japId: '10115',
      wholesaleCost: 0.05, // ₹4.00 wholesale
      markupPercent: 150
    },
    {
      id: 'ig-like-2',
      platform: 'instagram',
      subcategory: 'Instagram Likes [Instant & High Quality]',
      customerName: 'Instagram Likes [Indian / Active Targeted] (₹25 me 1000)',
      pricePer1k: 0.30, // ₹25.00
      min: 50,
      max: 50000,
      deliverySpeed: '10K / Day',
      startTime: '10 - 30 Minutes',
      refillSupported: true,
      refillPeriod: '30 Days',
      description: 'Active profiles with Indian usernames and bios. Best for local businesses and creators.',
      japId: '10119',
      wholesaleCost: 0.12, // ₹10.00 wholesale
      markupPercent: 150
    },

    // -------------------------------------------------------------
    // INSTAGRAM - REELS VIEWS
    // -------------------------------------------------------------
    {
      id: 'ig-reel-1',
      platform: 'instagram',
      subcategory: 'Instagram Reels Views [Viral Algorithm Boost]',
      customerName: 'Instagram Reels Views [Super Fast Speed] (₹3 me 1000)',
      pricePer1k: 0.036, // ₹3.00
      min: 100,
      max: 10000000,
      deliverySpeed: '1M / Day',
      startTime: 'Instant',
      refillSupported: false,
      refillPeriod: 'None',
      description: 'Super fast reel views. Helps boost reels onto the Instagram Explore & Audio page.',
      japId: '10150',
      wholesaleCost: 0.012, // ₹1.00 wholesale
      markupPercent: 200
    },

    // -------------------------------------------------------------
    // FACEBOOK
    // -------------------------------------------------------------
    // -------------------------------------------------------------
    // FACEBOOK
    // -------------------------------------------------------------
    {
      id: 'sf-4085',
      rawId: '4085',
      platform: 'facebook',
      subcategory: '💎Facebook Profile / Page followers',
      customerName: 'Facebook Page Followers [Real Worldwide Profiles] (₹79 me 1000)',
      pricePer1k: 0.83, // ₹79.18
      min: 100,
      max: 100000,
      deliverySpeed: '5K - 10K / Day',
      startTime: '1 - 3 Hours',
      refillSupported: true,
      refillPeriod: '30 Days',
      description: 'Authentic Facebook page followers and likes connected via SocialFans API.',
      provider: 'socialfans',
      wholesaleCost: 0.5534,
      markupPercent: 50
    },
    {
      id: 'sf-2833',
      rawId: '2833',
      platform: 'facebook',
      subcategory: '💎Facebook Post Likes [s1]',
      customerName: 'Facebook Post Likes [Instant Worldwide] (₹35 me 1000)',
      pricePer1k: 0.42, // ₹35.00
      min: 50,
      max: 50000,
      deliverySpeed: '20K / Day',
      startTime: '0 - 15 Mins',
      refillSupported: true,
      refillPeriod: '30 Days',
      description: 'High quality post likes for Facebook status, images, and posts via SocialFans API.',
      provider: 'socialfans',
      wholesaleCost: 0.24,
      markupPercent: 50
    },

    // -------------------------------------------------------------
    // YOUTUBE
    // -------------------------------------------------------------
    {
      id: 'sf-6452',
      rawId: '6452',
      platform: 'youtube',
      subcategory: '📸YouTube Views [ Working After Update ]',
      customerName: 'YouTube Views [High Retention 4K Monetizable] (₹95 me 1000)',
      pricePer1k: 1.14, // ₹95.00
      min: 100,
      max: 500000,
      deliverySpeed: '5K - 10K / Day',
      startTime: '10 - 45 Minutes',
      refillSupported: true,
      refillPeriod: '30 Days',
      description: 'Monetization-safe views from worldwide recommendations via SocialFans API.',
      provider: 'socialfans',
      wholesaleCost: 0.66,
      markupPercent: 50
    },
    {
      id: 'sf-7427',
      rawId: '7427',
      platform: 'youtube',
      subcategory: '▶️Youtube Best Services👑',
      customerName: 'YouTube Subscribers [Non-Drop Real Accounts] (₹290 me 1000)',
      pricePer1k: 3.50,
      min: 50,
      max: 10000,
      deliverySpeed: '100 - 300 / Day',
      startTime: '1 - 6 Hours',
      refillSupported: true,
      refillPeriod: '30 Days',
      description: 'Safe organic-style subscribers for YouTube monetization via SocialFans API.',
      provider: 'socialfans',
      wholesaleCost: 2.20,
      markupPercent: 50
    },

    // -------------------------------------------------------------
    // TIKTOK
    // -------------------------------------------------------------
    {
      id: 'sf-7469',
      rawId: '7469',
      platform: 'tiktok',
      subcategory: '🎵Tiktok Best Services👑',
      customerName: 'TikTok Views [Fast Non-Drop Algorithm Boost] (₹3 me 1000)',
      pricePer1k: 0.036,
      min: 100,
      max: 500000,
      deliverySpeed: '500K / Day',
      startTime: '0 - 15 Mins',
      refillSupported: false,
      refillPeriod: 'None',
      description: 'Top tier views for TikTok creator profiles via SocialFans API.',
      provider: 'socialfans',
      wholesaleCost: 0.0182,
      markupPercent: 50
    },
    {
      id: 'sf-3519',
      rawId: '3519',
      platform: 'tiktok',
      subcategory: '🎵Tiktok Likes',
      customerName: 'TikTok Likes [Instant ForYou Algorithm Boost] (₹45 me 1000)',
      pricePer1k: 0.54,
      min: 100,
      max: 100000,
      deliverySpeed: '50K / Day',
      startTime: 'Instant',
      refillSupported: true,
      refillPeriod: '15 Days',
      description: 'Fast algorithm likes to push videos onto the TikTok FYP via SocialFans API.',
      provider: 'socialfans',
      wholesaleCost: 0.32,
      markupPercent: 50
    },

    // -------------------------------------------------------------
    // TELEGRAM
    // -------------------------------------------------------------
    {
      id: 'sf-7346',
      rawId: '7346',
      platform: 'telegram',
      subcategory: '🎯Telegram Best Services👑',
      customerName: 'Telegram Channel Members [Real Non-Drop] (₹85 me 1000)',
      pricePer1k: 1.02,
      min: 100,
      max: 100000,
      deliverySpeed: '20K / Day',
      startTime: '0 - 30 Mins',
      refillSupported: true,
      refillPeriod: '30 Days',
      description: 'High retention channel members for Telegram channels via SocialFans API.',
      provider: 'socialfans',
      wholesaleCost: 0.5597,
      markupPercent: 50
    },
    {
      id: 'sf-2478',
      rawId: '2478',
      platform: 'telegram',
      subcategory: '🎯Telegram Views',
      customerName: 'Telegram Post Views [Instant Delivery] (₹10 me 1000)',
      pricePer1k: 0.12,
      min: 100,
      max: 500000,
      deliverySpeed: 'Instant',
      startTime: 'Instant',
      refillSupported: false,
      refillPeriod: 'None',
      description: 'Instant views on Telegram channel posts via SocialFans API.',
      provider: 'socialfans',
      wholesaleCost: 0.024,
      markupPercent: 50
    },

    // -------------------------------------------------------------
    // TWITTER / X
    // -------------------------------------------------------------
    {
      id: 'sf-7467',
      rawId: '7467',
      platform: 'twitter',
      subcategory: '🎊Twitter Best Services👑',
      customerName: 'Twitter / X Real Followers [Global HQ Accounts] (₹626 me 1000)',
      pricePer1k: 7.50,
      min: 50,
      max: 20000,
      deliverySpeed: '5K / Day',
      startTime: '1 - 2 Hours',
      refillSupported: true,
      refillPeriod: '30 Days',
      description: 'Real profiles with bio, profile pictures, and active tweets via SocialFans API.',
      provider: 'socialfans',
      wholesaleCost: 4.3776,
      markupPercent: 50
    }
  ],

  orders: [],
  refillQueue: [],
  transactions: [],
  supportTickets: [],
  recentActivity: []
};
