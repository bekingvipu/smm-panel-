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
    globalMarkupPercent: 100
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
    }
  ],

  // 2-Level Structured Services (Sub-Category -> Packages with tiered rates)
  customerServices: [
    // -------------------------------------------------------------
    // LIKEX SPECIAL VERY GOOD - INSTAGRAM GUARANTEED FOLLOWERS (JAP 10323)
    // -------------------------------------------------------------
    {
      id: 'jap-10323',
      rawId: '10323',
      platform: 'instagram',
      subcategory: '🌟 LikeX Special Very Good [Guaranteed 30D Refill]',
      customerName: '10323 - LikeX Special Very Good Instagram Followers [Max 50K] [Refill: 30D] [Speed: 6-8 Hours]',
      pricePer1k: 0.705, // ₹67.28
      min: 10,
      max: 50000,
      deliverySpeed: '⏱️ 6 - 8 Hours (Up to 100K/D)',
      startTime: '0 - 1 Hour',
      refillSupported: true,
      refillPeriod: '30 Days',
      description: '🌟 LikeX Special Very Good Quality Followers connected directly via JustAnotherPanel (JAP). 30-Day auto-refill guarantee.',
      japId: '10323',
      wholesaleCost: 0.705, // ₹67.28 wholesale
      markupPercent: 0,
      provider: 'jap'
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
    {
      id: 'fb-1',
      platform: 'facebook',
      subcategory: 'Facebook Page Followers & Likes',
      customerName: 'Facebook Page Followers [Real Worldwide Profiles] (₹140 me 1000)',
      pricePer1k: 1.68, // ₹140.00
      min: 100,
      max: 100000,
      deliverySpeed: '5K - 10K / Day',
      startTime: '1 - 3 Hours',
      refillSupported: true,
      refillPeriod: '30 Days',
      description: 'Authentic Facebook page followers and likes. Strengthens business page trust.',
      japId: '20101',
      wholesaleCost: 0.72, // ₹60.00 wholesale
      markupPercent: 133
    },
    {
      id: 'fb-2',
      platform: 'facebook',
      subcategory: 'Facebook Post Likes',
      customerName: 'Facebook Post Likes [Instant Worldwide] (₹35 me 1000)',
      pricePer1k: 0.42, // ₹35.00
      min: 50,
      max: 50000,
      deliverySpeed: '20K / Day',
      startTime: '0 - 15 Mins',
      refillSupported: true,
      refillPeriod: '30 Days',
      description: 'High quality post likes for Facebook status, images, and posts.',
      japId: '20105',
      wholesaleCost: 0.18, // ₹15.00 wholesale
      markupPercent: 133
    },

    // -------------------------------------------------------------
    // YOUTUBE
    // -------------------------------------------------------------
    {
      id: 'yt-1',
      platform: 'youtube',
      subcategory: 'YouTube Views [High Retention 4K]',
      customerName: 'YouTube Views [High Retention 4K Monetizable] (₹199 me 1000)',
      pricePer1k: 2.40, // ₹199.00
      min: 500,
      max: 500000,
      deliverySpeed: '5K - 10K / Day',
      startTime: '10 - 45 Minutes',
      refillSupported: true,
      refillPeriod: '30 Days',
      description: 'Monetization-safe views from worldwide recommendations with 3-5 min average watch time.',
      japId: '30110',
      wholesaleCost: 1.08, // ₹90.00 wholesale
      markupPercent: 122
    },
    {
      id: 'yt-2',
      platform: 'youtube',
      subcategory: 'YouTube Subscribers [Monetization Ready]',
      customerName: 'YouTube Subscribers [Non-Drop Real Accounts] (₹450 me 1000)',
      pricePer1k: 5.42, // ₹450.00
      min: 50,
      max: 10000,
      deliverySpeed: '100 - 300 / Day',
      startTime: '1 - 6 Hours',
      refillSupported: true,
      refillPeriod: '60 Days',
      description: 'Safe organic-style subscribers for YouTube monetization. 60-Day refill warranty.',
      japId: '30120',
      wholesaleCost: 2.50, // ₹207 wholesale
      markupPercent: 117
    },

    // -------------------------------------------------------------
    // TIKTOK
    // -------------------------------------------------------------
    {
      id: 'tt-1',
      platform: 'tiktok',
      subcategory: 'TikTok Followers [Fast Non-Drop]',
      customerName: 'TikTok Followers [Fast Delivery Non-Drop] (₹175 me 1000)',
      pricePer1k: 2.10, // ₹175.00
      min: 100,
      max: 100000,
      deliverySpeed: '20K / Day',
      startTime: '0 - 1 Hour',
      refillSupported: true,
      refillPeriod: '30 Days',
      description: 'Top tier followers for TikTok creator profiles. Enables live streaming qualification.',
      japId: '40101',
      wholesaleCost: 0.95, // ₹78.85 wholesale
      markupPercent: 122
    },
    {
      id: 'tt-2',
      platform: 'tiktok',
      subcategory: 'TikTok Likes [ForYou Algorithm]',
      customerName: 'TikTok Likes [Instant ForYou Algorithm Boost] (₹55 me 1000)',
      pricePer1k: 0.66, // ₹55.00
      min: 100,
      max: 100000,
      deliverySpeed: '50K / Day',
      startTime: 'Instant',
      refillSupported: true,
      refillPeriod: '15 Days',
      description: 'Fast algorithm likes to push videos onto the TikTok For You Page (FYP).',
      japId: '40105',
      wholesaleCost: 0.28, // ₹23.00 wholesale
      markupPercent: 139
    },

    // -------------------------------------------------------------
    // TELEGRAM
    // -------------------------------------------------------------
    {
      id: 'tg-1',
      platform: 'telegram',
      subcategory: 'Telegram Channel Members [Non-Drop]',
      customerName: 'Telegram Channel Members [Real Non-Drop] (₹95 me 1000)',
      pricePer1k: 1.14, // ₹95.00
      min: 100,
      max: 100000,
      deliverySpeed: '20K / Day',
      startTime: '0 - 30 Mins',
      refillSupported: true,
      refillPeriod: '30 Days',
      description: 'High retention channel members for Telegram channels and public groups.',
      japId: '50101',
      wholesaleCost: 0.48, // ₹40.00 wholesale
      markupPercent: 137
    },
    {
      id: 'tg-2',
      platform: 'telegram',
      subcategory: 'Telegram Post Views [Instant]',
      customerName: 'Telegram Post Views [Instant Delivery] (₹10 me 1000)',
      pricePer1k: 0.12, // ₹10.00
      min: 100,
      max: 500000,
      deliverySpeed: 'Instant',
      startTime: 'Instant',
      refillSupported: false,
      refillPeriod: 'None',
      description: 'Instant eye views on Telegram channel posts.',
      japId: '50105',
      wholesaleCost: 0.024, // ₹2.00 wholesale
      markupPercent: 400
    },

    // -------------------------------------------------------------
    // TWITTER / X
    // -------------------------------------------------------------
    {
      id: 'tw-1',
      platform: 'twitter',
      subcategory: 'Twitter / X Followers [Real Accounts]',
      customerName: 'Twitter / X Followers [Real Global Accounts] (₹199 me 1000)',
      pricePer1k: 2.40, // ₹199.00
      min: 50,
      max: 20000,
      deliverySpeed: '5K / Day',
      startTime: '1 - 2 Hours',
      refillSupported: true,
      refillPeriod: '30 Days',
      description: 'Real profiles with bio, profile pictures, and active tweets.',
      japId: '60101',
      wholesaleCost: 1.10, // ₹91.30 wholesale
      markupPercent: 118
    }
  ],

  orders: [],
  refillQueue: [],
  transactions: [],
  supportTickets: [],
  recentActivity: []
};
