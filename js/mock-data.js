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

window.INSTAGRAM_CATEGORIES = [
  'LikeX Special',
  'Instagram 👑 Non-Drop Followers — Refill Guaranteed',
  'Instagram 👑 Low-Drop Followers — No Refill',
  'Instagram 👑 🇮🇳 Indian Followers — Low Drop — No Refill',
  'Instagram 👑 🇮🇳 Indian Followers — No Guarantee',
  'Instagram 👑 High-Drop Followers — No Refill',
  'Instagram 👑 Views — Non-Drop',
  'Instagram 👑 Likes — Non-Drop',
  'Instagram 👑 Comment / Custom Comment — No Drop',
  '👑Instagram❤️Likes (The Best)✅',
  '👑Instagram Reel Views [Best👁️]',
  '✅Instagram Best Services👑',
  'Instagram Services❤️ (No Refill)',
  '👑Instagram Likes❤️[ Non-Drop ]',
  'Instagram Services ( UAE, USA, Brazil )',
  '👑Instagram Reel Views👁️',
  '👑Instagram Reel Likes',
  '👑Instagram 🇮🇳Indian Likes Services',
  '👑INSTAGRAM BLUETICK VERIFICATION🎉💯',
  '👑Instagram Saves, Story Views & Poll Votes',
  '👑Instagram Comments, Comment likes & Shares'
];

window.SMM_MOCK = {
  currency: 'INR',
  exchangeRate: 95.385,
  isLoggedIn: false, // Default: Guest Mode (Browse without signup)
  instagramCategories: window.INSTAGRAM_CATEGORIES,
  
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
    // INSTAGRAM - LIKEX SPECIAL
    // -------------------------------------------------------------
    {
      id: 'wos-3100',
      rawId: '3100',
      platform: 'instagram',
      subcategory: 'LikeX Special',
      customerName: 'Instagram Reel/Post Likes [HQ Accs] [Instant-Start] [Cancel Enable] [200k/day] 🚀',
      pricePer1k: 0.057,
      min: 10,
      max: 3000000,
      deliverySpeed: '⚡ 200K/Day [Instant Start]',
      startTime: 'Instant',
      refillSupported: false,
      refillPeriod: 'None',
      description: 'Top quality Instagram likes for reels & posts via WorldOfSMM (3100). Cancel enabled.',
      provider: 'worldofsmm',
      wholesaleCost: 0.038,
      markupPercent: 50
    },

    // -------------------------------------------------------------
    // INSTAGRAM - NON-DROP FOLLOWERS (REFILL GUARANTEED)
    // -------------------------------------------------------------
    {
      id: 'sf-4137',
      rawId: '4137',
      platform: 'instagram',
      subcategory: 'Instagram 👑 Non-Drop Followers — Refill Guaranteed',
      customerName: '👑👑Instagram Followers [ Premium Top Quality & 100% Non-Drop] 365days RG - 80k/d Speed',
      pricePer1k: 3.06996,
      min: 100,
      max: 100000,
      deliverySpeed: '⚡ 80K/Day Speed',
      startTime: '0 - 15 Mins',
      refillSupported: true,
      refillPeriod: '365 Days',
      description: 'Top tier Instagram followers with 365 days Refill Guarantee via SocialFans (4137).',
      provider: 'socialfans',
      wholesaleCost: 2.04664,
      markupPercent: 50
    },
    {
      id: 'sf-7244',
      rawId: '7244',
      platform: 'instagram',
      subcategory: 'Instagram 👑 Non-Drop Followers — Refill Guaranteed',
      customerName: 'Insta Followers [Good & No-Drop] [All Flag] 365days RG - 50k/D',
      pricePer1k: 2.625,
      min: 10,
      max: 10000000,
      deliverySpeed: '⚡ 50K/Day',
      startTime: 'Instant',
      refillSupported: true,
      refillPeriod: '365 Days',
      description: 'Good quality non-drop Instagram followers with 365 days refill guarantee via SocialFans (7244).',
      provider: 'socialfans',
      wholesaleCost: 1.749982,
      markupPercent: 50
    },
    {
      id: 'wos-7551',
      rawId: '7551',
      platform: 'instagram',
      subcategory: 'Instagram 👑 Non-Drop Followers — Refill Guaranteed',
      customerName: 'Instagram Followers [ Max 50k ] | HQ | Low Drop | Instant Start | 365 Days ♻️ | 100K/day 🔥 Suggested',
      pricePer1k: 2.7714,
      min: 100,
      max: 100000,
      deliverySpeed: '⚡ 100K/Day',
      startTime: 'Instant Start',
      refillSupported: true,
      refillPeriod: '365 Days',
      description: 'High quality low drop Instagram followers with 365 days refill via WorldOfSMM (7551).',
      provider: 'worldofsmm',
      wholesaleCost: 1.8476,
      markupPercent: 50
    },
    {
      id: 'sf-7365',
      rawId: '7365',
      platform: 'instagram',
      subcategory: 'Instagram 👑 Non-Drop Followers — Refill Guaranteed',
      customerName: '👑Instagram Followers [ High Quality & 100% Non-Drop] 365days RG - 80k/d Speed',
      pricePer1k: 3.634783,
      min: 100,
      max: 100000,
      deliverySpeed: '⚡ 80K/Day Speed',
      startTime: 'Instant',
      refillSupported: true,
      refillPeriod: '365 Days',
      description: 'High quality non-drop Instagram followers with 365 days refill via SocialFans (7365).',
      provider: 'socialfans',
      wholesaleCost: 2.423189,
      markupPercent: 50
    },
    {
      id: 'sf-7419',
      rawId: '7419',
      platform: 'instagram',
      subcategory: 'Instagram 👑 Non-Drop Followers — Refill Guaranteed',
      customerName: '👑👑Instagram 🇮🇳Mixed Indian Followers [ Non-Drop] [ 365 Days RG ] 80k/day',
      pricePer1k: 4.629505,
      min: 100,
      max: 100000,
      deliverySpeed: '⚡ 80K/Day Speed',
      startTime: 'Instant',
      refillSupported: true,
      refillPeriod: '365 Days',
      description: 'Mixed Indian non-drop followers with 365 days refill guarantee via SocialFans (7419).',
      provider: 'socialfans',
      wholesaleCost: 3.086337,
      markupPercent: 50
    },
    {
      id: 'wos-7484',
      rawId: '7484',
      platform: 'instagram',
      subcategory: 'Instagram 👑 Non-Drop Followers — Refill Guaranteed',
      customerName: 'Instagram Followers [R365][Cancel Enable] [Old Real Accounts] HQ Service [Premium Quality]',
      pricePer1k: 3.825,
      min: 50,
      max: 100000,
      deliverySpeed: '⚡ 100K/Day',
      startTime: '0 - 15 Mins',
      refillSupported: true,
      refillPeriod: '365 Days',
      description: 'High quality old real accounts Instagram followers with 365 days refill guarantee via WorldOfSMM (7484).',
      provider: 'worldofsmm',
      wholesaleCost: 2.55,
      markupPercent: 50
    },

    // -------------------------------------------------------------
    // INSTAGRAM - LOW-DROP FOLLOWERS (NO REFILL)
    // -------------------------------------------------------------
    {
      id: 'wos-2868',
      rawId: '2868',
      platform: 'instagram',
      subcategory: 'Instagram 👑 Low-Drop Followers — No Refill',
      customerName: '🔔 ⭐ Instagram HQ Followers R365 | 100k/Day [Best Seller Since 2021] Low Drop',
      pricePer1k: 2.8842,
      min: 100,
      max: 100000,
      deliverySpeed: '⚡ 100K/Day',
      startTime: '0 - 1 Hour',
      refillSupported: false,
      refillPeriod: 'None',
      description: 'Flagship best seller Instagram followers via WorldOfSMM (2868).',
      provider: 'worldofsmm',
      wholesaleCost: 1.9228,
      markupPercent: 50
    },

    // -------------------------------------------------------------
    // INSTAGRAM - INDIAN FOLLOWERS — LOW DROP — NO REFILL
    // -------------------------------------------------------------
    {
      id: 'wos-1838',
      rawId: '1838',
      platform: 'instagram',
      subcategory: 'Instagram 👑 🇮🇳 Indian Followers — Low Drop — No Refill',
      customerName: '🇮🇳Instagram Indian Followers 365 Days Refill 100k/day [Over Delivery]',
      pricePer1k: 4.005,
      min: 100,
      max: 100000,
      deliverySpeed: '⚡ 100K/Day',
      startTime: '0 - 1 Hour',
      refillSupported: false,
      refillPeriod: 'None',
      description: 'Indian followers with high speed delivery via WorldOfSMM (1838).',
      provider: 'worldofsmm',
      wholesaleCost: 2.67,
      markupPercent: 50
    },
    {
      id: 'wos-6947',
      rawId: '6947',
      platform: 'instagram',
      subcategory: 'Instagram 👑 🇮🇳 Indian Followers — Low Drop — No Refill',
      customerName: '👑🇮🇳Instagram Followers [Premium Indian] [R365] [10k-20k/day]',
      pricePer1k: 5.1,
      min: 50,
      max: 50000,
      deliverySpeed: '⚡ 10K-20K/Day',
      startTime: '0 - 1 Hour',
      refillSupported: false,
      refillPeriod: 'None',
      description: 'Premium active Indian followers via WorldOfSMM (6947).',
      provider: 'worldofsmm',
      wholesaleCost: 3.4,
      markupPercent: 50
    },
    {
      id: 'wos-7369',
      rawId: '7369',
      platform: 'instagram',
      subcategory: 'Instagram 👑 🇮🇳 Indian Followers — Low Drop — No Refill',
      customerName: '👑Instagram Followers [Real Active Indian] [R60] [50k/day]',
      pricePer1k: 5.19,
      min: 10,
      max: 100000,
      deliverySpeed: '⚡ 50K/Day',
      startTime: '0 - 30 Mins',
      refillSupported: false,
      refillPeriod: 'None',
      description: 'Real active Indian profile followers via WorldOfSMM (7369).',
      provider: 'worldofsmm',
      wholesaleCost: 3.46,
      markupPercent: 50
    },

    // -------------------------------------------------------------
    // INSTAGRAM - INDIAN FOLLOWERS — NO GUARANTEE
    // -------------------------------------------------------------
    {
      id: 'wos-6939',
      rawId: '6939',
      platform: 'instagram',
      subcategory: 'Instagram 👑 🇮🇳 Indian Followers — No Guarantee',
      customerName: '🇮🇳Instagram Indian Followers [HQ Accounts][10k/day]🚀',
      pricePer1k: 1.1181,
      min: 100,
      max: 300000,
      deliverySpeed: '⚡ 10K/Day',
      startTime: 'Instant',
      refillSupported: false,
      refillPeriod: 'None',
      description: 'Budget-friendly Indian HQ accounts followers via WorldOfSMM (6939).',
      provider: 'worldofsmm',
      wholesaleCost: 0.7454,
      markupPercent: 50
    },
    {
      id: 'wos-7259',
      rawId: '7259',
      platform: 'instagram',
      subcategory: 'Instagram 👑 🇮🇳 Indian Followers — No Guarantee',
      customerName: '🇮🇳Instagram Indian HQ Mix Followers [All Flag][10k/day] Story Acc + Post [NR]20k/day🚀',
      pricePer1k: 1.5354,
      min: 10,
      max: 50000,
      deliverySpeed: '⚡ 20K/Day',
      startTime: '0 - 30 Mins',
      refillSupported: false,
      refillPeriod: 'None',
      description: 'Indian HQ mix followers with story accounts via WorldOfSMM (7259).',
      provider: 'worldofsmm',
      wholesaleCost: 1.0236,
      markupPercent: 50
    },

    // -------------------------------------------------------------
    // INSTAGRAM - VIEWS (NON-DROP)
    // -------------------------------------------------------------
    {
      id: 'sf-5011',
      rawId: '5011',
      platform: 'instagram',
      subcategory: 'Instagram 👑 Views — Non-Drop',
      customerName: '👑👑🎯👁️Instagram Cheap Reel Views [Working Server] 2M/day',
      pricePer1k: 0.007898,
      min: 100,
      max: 2147483647,
      deliverySpeed: '⚡ 2M/Day',
      startTime: 'Instant',
      refillSupported: false,
      refillPeriod: 'None',
      description: 'Cheap and fast Instagram Reel Views server via SocialFans (5011).',
      provider: 'socialfans',
      wholesaleCost: 0.005265,
      markupPercent: 50
    },
    {
      id: 'sf-7294',
      rawId: '7294',
      platform: 'instagram',
      subcategory: 'Instagram 👑 Views — Non-Drop',
      customerName: '👁️Instagram Video Views [ Good Speed ] [Instant Start] - 5M/Day',
      pricePer1k: 0.003258,
      min: 100,
      max: 2147483647,
      deliverySpeed: '⚡ 5M/Day',
      startTime: 'Instant Start',
      refillSupported: false,
      refillPeriod: 'None',
      description: 'High throughput Instagram video views via SocialFans (7294).',
      provider: 'socialfans',
      wholesaleCost: 0.002172,
      markupPercent: 50
    },
    {
      id: 'wos-7637',
      rawId: '7637',
      platform: 'instagram',
      subcategory: 'Instagram 👑 Views — Non-Drop',
      customerName: '🎞️Instagram Video Views with Viewers [Instant] [10M/day] [IGTV+Post] Premium',
      pricePer1k: 0.0288,
      min: 100,
      max: 2147483647,
      deliverySpeed: '⚡ 10M/Day',
      startTime: 'Instant',
      refillSupported: false,
      refillPeriod: 'None',
      description: 'Ultra fast video views with impression viewers via WorldOfSMM (7637).',
      provider: 'worldofsmm',
      wholesaleCost: 0.0192,
      markupPercent: 50
    },

    // -------------------------------------------------------------
    // INSTAGRAM - LIKES (NON-DROP)
    // -------------------------------------------------------------
    {
      id: 'sf-4997',
      rawId: '4997',
      platform: 'instagram',
      subcategory: 'Instagram 👑 Likes — Non-Drop',
      customerName: '👑❣️Instagram Likes [High Quality & Non-drop ] - 50k/day',
      pricePer1k: 0.111153,
      min: 10,
      max: 10000000,
      deliverySpeed: '⚡ 50K/Day',
      startTime: 'Instant',
      refillSupported: false,
      refillPeriod: 'None',
      description: 'High quality non-drop Instagram likes via SocialFans (4997).',
      provider: 'socialfans',
      wholesaleCost: 0.074102,
      markupPercent: 50
    },

    // -------------------------------------------------------------
    // INSTAGRAM - COMMENT / CUSTOM COMMENT (NO DROP)
    // -------------------------------------------------------------
    {
      id: 'wos-6085',
      rawId: '6085',
      platform: 'instagram',
      subcategory: 'Instagram 👑 Comment / Custom Comment — No Drop',
      customerName: 'Instagram Random Comments [Non Drop] 10k/day [Eng]',
      pricePer1k: 0.64125,
      min: 10,
      max: 100000,
      deliverySpeed: '⚡ 10K/Day',
      startTime: '0 - 1 Hour',
      refillSupported: false,
      refillPeriod: 'None',
      description: 'English random natural comments via WorldOfSMM (6085).',
      provider: 'worldofsmm',
      wholesaleCost: 0.4275,
      markupPercent: 50
    },
    {
      id: 'wos-6433',
      rawId: '6433',
      platform: 'instagram',
      subcategory: 'Instagram 👑 Comment / Custom Comment — No Drop',
      customerName: '🇮🇳Instagram Indian Mix Random Comments [10k/day] Non Drop',
      pricePer1k: 0.8712,
      min: 1,
      max: 100000,
      deliverySpeed: '⚡ 10K/Day',
      startTime: '0 - 1 Hour',
      refillSupported: false,
      refillPeriod: 'None',
      description: 'Indian mix non-drop random comments via WorldOfSMM (6433).',
      provider: 'worldofsmm',
      wholesaleCost: 0.5808,
      markupPercent: 50
    },

    // -------------------------------------------------------------
    // FACEBOOK (SocialFans Direct API)
    // -------------------------------------------------------------
    {
      id: 'sf-4085',
      rawId: '4085',
      platform: 'facebook',
      subcategory: '💎Facebook Profile / Page followers',
      customerName: 'Facebook Page Followers [Real Worldwide Profiles] (₹79 me 1000)',
      pricePer1k: 0.405079, // ₹79.18
      min: 100,
      max: 100000,
      deliverySpeed: '5K - 10K / Day',
      startTime: '1 - 3 Hours',
      refillSupported: true,
      refillPeriod: '30 Days',
      description: 'Authentic Facebook page followers and likes connected via SocialFans API.',
      provider: 'socialfans',
      wholesaleCost: 0.270053,
      markupPercent: 50
    },
    {
      id: 'sf-2833',
      rawId: '2833',
      platform: 'facebook',
      subcategory: '💎Facebook Post Likes [s1]',
      customerName: 'Facebook Post Likes [Instant Worldwide] (₹35 me 1000)',
      pricePer1k: 0.377049, // ₹35.00
      min: 50,
      max: 50000,
      deliverySpeed: '20K / Day',
      startTime: '0 - 15 Mins',
      refillSupported: true,
      refillPeriod: '30 Days',
      description: 'High quality post likes for Facebook status, images, and posts via SocialFans API.',
      provider: 'socialfans',
      wholesaleCost: 0.251366,
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
      pricePer1k: 1.878499, // ₹95.00
      min: 100,
      max: 500000,
      deliverySpeed: '5K - 10K / Day',
      startTime: '10 - 45 Minutes',
      refillSupported: true,
      refillPeriod: '30 Days',
      description: 'Monetization-safe views from worldwide recommendations via SocialFans API.',
      provider: 'socialfans',
      wholesaleCost: 1.252333,
      markupPercent: 50
    },
    {
      id: 'sf-7427',
      rawId: '7427',
      platform: 'youtube',
      subcategory: '▶️Youtube Best Services👑',
      customerName: 'YouTube Subscribers [Non-Drop Real Accounts] (₹290 me 1000)',
      pricePer1k: 29.610234,
      min: 50,
      max: 10000,
      deliverySpeed: '100 - 300 / Day',
      startTime: '1 - 6 Hours',
      refillSupported: true,
      refillPeriod: '30 Days',
      description: 'Safe organic-style subscribers for YouTube monetization via SocialFans API.',
      provider: 'socialfans',
      wholesaleCost: 19.740156,
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
      pricePer1k: 0.02739,
      min: 100,
      max: 500000,
      deliverySpeed: '500K / Day',
      startTime: '0 - 15 Mins',
      refillSupported: false,
      refillPeriod: 'None',
      description: 'Top tier views for TikTok creator profiles via SocialFans API.',
      provider: 'socialfans',
      wholesaleCost: 0.01826,
      markupPercent: 50
    },
    {
      id: 'sf-3519',
      rawId: '3519',
      platform: 'tiktok',
      subcategory: '🎵Tiktok Likes',
      customerName: 'TikTok Likes [Instant ForYou Algorithm Boost] (₹45 me 1000)',
      pricePer1k: 0.66243,
      min: 100,
      max: 100000,
      deliverySpeed: '50K / Day',
      startTime: 'Instant',
      refillSupported: true,
      refillPeriod: '15 Days',
      description: 'Fast algorithm likes to push videos onto the TikTok FYP via SocialFans API.',
      provider: 'socialfans',
      wholesaleCost: 0.44162,
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
      pricePer1k: 0.841612,
      min: 100,
      max: 100000,
      deliverySpeed: '20K / Day',
      startTime: '0 - 30 Mins',
      refillSupported: true,
      refillPeriod: '30 Days',
      description: 'High retention channel members for Telegram channels via SocialFans API.',
      provider: 'socialfans',
      wholesaleCost: 0.561075,
      markupPercent: 50
    },
    {
      id: 'sf-2478',
      rawId: '2478',
      platform: 'telegram',
      subcategory: '🎯Telegram Views',
      customerName: 'Telegram Post Views [Instant Delivery] (₹10 me 1000)',
      pricePer1k: 0.122362,
      min: 100,
      max: 500000,
      deliverySpeed: 'Instant',
      startTime: 'Instant',
      refillSupported: false,
      refillPeriod: 'None',
      description: 'Instant views on Telegram channel posts via SocialFans API.',
      provider: 'socialfans',
      wholesaleCost: 0.081575,
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
      pricePer1k: 6.582777,
      min: 50,
      max: 20000,
      deliverySpeed: '5K / Day',
      startTime: '1 - 2 Hours',
      refillSupported: true,
      refillPeriod: '30 Days',
      description: 'Real profiles with bio, profile pictures, and active tweets via SocialFans API.',
      provider: 'socialfans',
      wholesaleCost: 4.388518,
      markupPercent: 50
    }
  ],

  orders: [],
  refillQueue: [],
  transactions: [],
  supportTickets: [],
  recentActivity: []
};
