window.SMM_MOCK = {
  currency: 'INR', // Default to INR so Indian rates show clearly, togglable to USD
  exchangeRate: 83.0,
  
  customer: {
    name: 'Alex Vance',
    email: 'alex@growthagency.io',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    balance: 240.50,
    spent: 3840.00,
    ordersCount: 42
  },

  adminStats: {
    totalCustomers: 1240,
    customersTrend: -2.4,
    totalOrders: 45000,
    ordersTrend: 12.5,
    revenue: 12500,
    revenueTrend: 8.1,
    profit: 4200,
    profitTrend: 4.2,
    providerBalance: 0.00,
    providerBalanceStatus: 'Live Connected'
  },

  providers: [
    {
      id: 'p1',
      name: 'JustAnotherPanel',
      displayName: 'JustAnotherPanel (JAP Wholesale)',
      status: 'active',
      balance: 0.00,
      activeServices: 5803,
      lastSync: 'Live Connected',
      apiUrl: 'https://justanotherpanel.com/api/v2',
      apiKeyMasked: '30265a••••••••4a63'
    }
  ],

  rawProviderServices: [
    {
      id: '10131',
      providerId: 'p1',
      providerName: 'JustAnotherPanel (JAP)',
      rawName: 'Instagram Followers [Refill: 30D] [Max: 200K] [Speed: Up to 20K/D]',
      category: 'Instagram Followers',
      platform: 'instagram',
      cost: 0.28, // ₹23.57
      oldCost: null,
      min: 50,
      max: 200000,
      refillSupport: true,
      refillPeriod: '30 Days',
      cancelSupport: true,
      status: 'Synced'
    },
    {
      id: '10349',
      providerId: 'p1',
      providerName: 'JustAnotherPanel (JAP)',
      rawName: 'Instagram Followers [Refill: 365D] [Max: 5M] [Speed: Up to 200K/D]',
      category: 'Instagram Followers',
      platform: 'instagram',
      cost: 0.82, // ₹67.99
      oldCost: null,
      min: 100,
      max: 5000000,
      refillSupport: true,
      refillPeriod: '365 Days',
      cancelSupport: true,
      status: 'Synced'
    },
    {
      id: '10115',
      providerId: 'p1',
      providerName: 'JustAnotherPanel (JAP)',
      rawName: 'Instagram Likes [Instant & Real HQ Profiles]',
      category: 'Instagram Likes',
      platform: 'instagram',
      cost: 0.12, // ₹10.00
      oldCost: null,
      min: 50,
      max: 100000,
      refillSupport: true,
      refillPeriod: '30 Days',
      cancelSupport: true,
      status: 'Synced'
    },
    {
      id: '20101',
      providerId: 'p1',
      providerName: 'JustAnotherPanel (JAP)',
      rawName: 'Facebook Page Followers & Likes [Real Profiles]',
      category: 'Facebook Page',
      platform: 'facebook',
      cost: 1.02, // ₹85.00
      oldCost: null,
      min: 100,
      max: 100000,
      refillSupport: true,
      refillPeriod: '30 Days',
      cancelSupport: true,
      status: 'Synced'
    },
    {
      id: '30110',
      providerId: 'p1',
      providerName: 'JustAnotherPanel (JAP)',
      rawName: 'YouTube Views [High Retention 4K Speed]',
      category: 'YouTube Views',
      platform: 'youtube',
      cost: 1.38, // ₹115.00
      oldCost: null,
      min: 500,
      max: 500000,
      refillSupport: true,
      refillPeriod: '30 Days',
      cancelSupport: true,
      status: 'Synced'
    }
  ],

  // Real Customer-Facing Services Categorized by Platform
  customerServices: [
    // --- INSTAGRAM SERVICES ---
    {
      id: 'cs-1',
      customerName: 'Instagram Followers [Refill: 30D] [Speed: 20K/D]',
      category: 'Instagram',
      platform: 'instagram',
      pricePer1k: 0.71, // ₹59.00 / 1K (wholesale ₹23.57)
      min: 50,
      max: 200000,
      deliverySpeed: '10K - 20K / Day',
      startTime: '0 - 1 Hour',
      refillSupported: true,
      refillPeriod: '30 Days',
      description: 'High quality real-looking profiles with active posts. Safe delivery for personal or brand pages. 30-Day auto-refill button active.',
      active: true,
      providerMappings: [{ providerId: 'p1', providerName: 'JustAnotherPanel', serviceId: '10131', providerCost: 0.28, markupPercent: 150, isPrimary: true, status: 'Active' }]
    },
    {
      id: 'cs-2',
      customerName: 'Instagram Followers [Refill: 365D Lifetime Guarantee] [Max: 5M]',
      category: 'Instagram',
      platform: 'instagram',
      pricePer1k: 1.55, // ₹129.00 / 1K (wholesale ₹67.99)
      min: 100,
      max: 5000000,
      deliverySpeed: 'Up to 200K / Day',
      startTime: '0 - 2 Hours',
      refillSupported: true,
      refillPeriod: '365 Days',
      description: 'Premium non-drop followers with 1 Full Year (365 Days) refill warranty. Ideal for influencers, celebrities, and high-volume accounts.',
      active: true,
      providerMappings: [{ providerId: 'p1', providerName: 'JustAnotherPanel', serviceId: '10349', providerCost: 0.82, markupPercent: 90, isPrimary: true, status: 'Active' }]
    },
    {
      id: 'cs-3',
      customerName: 'Instagram Likes [Instant & Real HQ Profiles]',
      category: 'Instagram',
      platform: 'instagram',
      pricePer1k: 0.35, // ₹29.00 / 1K (wholesale ₹10.00)
      min: 50,
      max: 100000,
      deliverySpeed: '50K / Day',
      startTime: 'Instant (0 - 5 mins)',
      refillSupported: true,
      refillPeriod: '30 Days',
      description: 'Super fast delivery likes from high quality accounts. Boosts post explore page ranking.',
      active: true,
      providerMappings: [{ providerId: 'p1', providerName: 'JustAnotherPanel', serviceId: '10115', providerCost: 0.12, markupPercent: 190, isPrimary: true, status: 'Active' }]
    },
    {
      id: 'cs-4',
      customerName: 'Instagram Reels Views [Instant Algorithm Boost]',
      category: 'Instagram',
      platform: 'instagram',
      pricePer1k: 0.14, // ₹12.00 / 1K (wholesale ₹2.00)
      min: 100,
      max: 10000000,
      deliverySpeed: '1M / Day',
      startTime: 'Instant',
      refillSupported: false,
      refillPeriod: 'None',
      description: 'Instant speed views for Instagram Reels. Helps reel go viral on explore tab.',
      active: true,
      providerMappings: [{ providerId: 'p1', providerName: 'JustAnotherPanel', serviceId: '10150', providerCost: 0.024, markupPercent: 480, isPrimary: true, status: 'Active' }]
    },

    // --- FACEBOOK SERVICES ---
    {
      id: 'cs-5',
      customerName: 'Facebook Page Followers & Likes [Real Worldwide Profiles]',
      category: 'Facebook',
      platform: 'facebook',
      pricePer1k: 2.15, // ₹179.00 / 1K (wholesale ₹85.00)
      min: 100,
      max: 100000,
      deliverySpeed: '5K - 10K / Day',
      startTime: '1 - 3 Hours',
      refillSupported: true,
      refillPeriod: '30 Days',
      description: 'Genuine Facebook fan page followers and likes. Strengthens business page trust and organic reach.',
      active: true,
      providerMappings: [{ providerId: 'p1', providerName: 'JustAnotherPanel', serviceId: '20101', providerCost: 1.02, markupPercent: 110, isPrimary: true, status: 'Active' }]
    },
    {
      id: 'cs-6',
      customerName: 'Facebook Post Likes [Instant Delivery]',
      category: 'Facebook',
      platform: 'facebook',
      pricePer1k: 0.59, // ₹49.00 / 1K (wholesale ₹20.00)
      min: 50,
      max: 50000,
      deliverySpeed: '20K / Day',
      startTime: '0 - 15 Mins',
      refillSupported: true,
      refillPeriod: '30 Days',
      description: 'High quality post likes for Facebook status, images, and posts.',
      active: true,
      providerMappings: [{ providerId: 'p1', providerName: 'JustAnotherPanel', serviceId: '20105', providerCost: 0.24, markupPercent: 145, isPrimary: true, status: 'Active' }]
    },

    // --- YOUTUBE SERVICES ---
    {
      id: 'cs-7',
      customerName: 'YouTube Views [High Retention 4K Monetizable Speed]',
      category: 'YouTube',
      platform: 'youtube',
      pricePer1k: 3.00, // ₹249.00 / 1K (wholesale ₹115.00)
      min: 500,
      max: 500000,
      deliverySpeed: '5K - 10K / Day',
      startTime: '10 - 45 Minutes',
      refillSupported: true,
      refillPeriod: '30 Days',
      description: 'Monetization-safe retention views from worldwide recommendations. High watch time percentage.',
      active: true,
      providerMappings: [{ providerId: 'p1', providerName: 'JustAnotherPanel', serviceId: '30110', providerCost: 1.38, markupPercent: 117, isPrimary: true, status: 'Active' }]
    },
    {
      id: 'cs-8',
      customerName: 'YouTube Subscribers [Non-Drop Real Accounts]',
      category: 'YouTube',
      platform: 'youtube',
      pricePer1k: 6.01, // ₹499.00 / 1K (wholesale ₹250.00)
      min: 50,
      max: 10000,
      deliverySpeed: '100 - 300 / Day',
      startTime: '1 - 6 Hours',
      refillSupported: true,
      refillPeriod: '60 Days',
      description: 'Safe organic-style subscribers for YouTube monetization. 60-Day refill warranty protection.',
      active: true,
      providerMappings: [{ providerId: 'p1', providerName: 'JustAnotherPanel', serviceId: '30120', providerCost: 3.01, markupPercent: 100, isPrimary: true, status: 'Active' }]
    },

    // --- TIKTOK SERVICES ---
    {
      id: 'cs-9',
      customerName: 'TikTok Followers [Fast Delivery Non-Drop]',
      category: 'TikTok',
      platform: 'tiktok',
      pricePer1k: 2.40, // ₹199.00 / 1K (wholesale ₹95.00)
      min: 100,
      max: 100000,
      deliverySpeed: '20K / Day',
      startTime: '0 - 1 Hour',
      refillSupported: true,
      refillPeriod: '30 Days',
      description: 'Top tier followers for TikTok creator profiles. Enables live streaming qualification.',
      active: true,
      providerMappings: [{ providerId: 'p1', providerName: 'JustAnotherPanel', serviceId: '40101', providerCost: 1.14, markupPercent: 110, isPrimary: true, status: 'Active' }]
    },
    {
      id: 'cs-10',
      customerName: 'TikTok Likes [Instant ForYou Algorithm Boost]',
      category: 'TikTok',
      platform: 'tiktok',
      pricePer1k: 0.83, // ₹69.00 / 1K (wholesale ₹30.00)
      min: 100,
      max: 100000,
      deliverySpeed: '50K / Day',
      startTime: 'Instant',
      refillSupported: true,
      refillPeriod: '15 Days',
      description: 'Fast algorithm likes to push videos onto the TikTok For You Page (FYP).',
      active: true,
      providerMappings: [{ providerId: 'p1', providerName: 'JustAnotherPanel', serviceId: '40105', providerCost: 0.36, markupPercent: 130, isPrimary: true, status: 'Active' }]
    },

    // --- TELEGRAM SERVICES ---
    {
      id: 'cs-11',
      customerName: 'Telegram Channel Members [Real Non-Drop]',
      category: 'Telegram',
      platform: 'telegram',
      pricePer1k: 1.32, // ₹110.00 / 1K (wholesale ₹45.00)
      min: 100,
      max: 100000,
      deliverySpeed: '20K / Day',
      startTime: '0 - 30 Mins',
      refillSupported: true,
      refillPeriod: '30 Days',
      description: 'High retention channel members for Telegram channels and public groups.',
      active: true,
      providerMappings: [{ providerId: 'p1', providerName: 'JustAnotherPanel', serviceId: '50101', providerCost: 0.54, markupPercent: 144, isPrimary: true, status: 'Active' }]
    },
    {
      id: 'cs-12',
      customerName: 'Telegram Post Views [Instant Delivery]',
      category: 'Telegram',
      platform: 'telegram',
      pricePer1k: 0.18, // ₹15.00 / 1K (wholesale ₹2.00)
      min: 100,
      max: 500000,
      deliverySpeed: 'Instant',
      startTime: 'Instant',
      refillSupported: false,
      refillPeriod: 'None',
      description: 'Instant eye views on Telegram channel posts. Boosts channel engagement metrics.',
      active: true,
      providerMappings: [{ providerId: 'p1', providerName: 'JustAnotherPanel', serviceId: '50105', providerCost: 0.024, markupPercent: 650, isPrimary: true, status: 'Active' }]
    },

    // --- TWITTER / X SERVICES ---
    {
      id: 'cs-13',
      customerName: 'Twitter / X Followers [Real Global Accounts]',
      category: 'Twitter',
      platform: 'twitter',
      pricePer1k: 3.00, // ₹249.00 / 1K (wholesale ₹120.00)
      min: 50,
      max: 20000,
      deliverySpeed: '5K / Day',
      startTime: '1 - 2 Hours',
      refillSupported: true,
      refillPeriod: '30 Days',
      description: 'Real profiles with bio, profile pictures, and active tweets. Safe delivery.',
      active: true,
      providerMappings: [{ providerId: 'p1', providerName: 'JustAnotherPanel', serviceId: '60101', providerCost: 1.45, markupPercent: 107, isPrimary: true, status: 'Active' }]
    }
  ],

  orders: [
    {
      id: '48291',
      serviceId: 'cs-1',
      serviceName: 'Instagram Followers [Refill: 30D] [Speed: 20K/D]',
      platform: 'instagram',
      target: 'https://instagram.com/fashion_trendz',
      quantity: 1000,
      amount: 0.71,
      status: 'Processing',
      date: 'Today, 20:50',
      startCount: 12400,
      currentCount: 12400,
      remains: 1000,
      refillEligible: false,
      refillReason: 'Order is still processing'
    },
    {
      id: '48290',
      serviceId: 'cs-7',
      serviceName: 'YouTube Views [High Retention 4K Monetizable Speed]',
      platform: 'youtube',
      target: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
      quantity: 5000,
      amount: 15.00,
      status: 'In Progress',
      date: 'Today, 18:30',
      startCount: 850,
      currentCount: 3200,
      remains: 2650,
      refillEligible: false,
      refillReason: 'Order is actively delivering'
    },
    {
      id: '48285',
      serviceId: 'cs-1',
      serviceName: 'Instagram Followers [Refill: 30D] [Speed: 20K/D]',
      platform: 'instagram',
      target: 'https://instagram.com/fitness_dan',
      quantity: 1000,
      amount: 0.71,
      status: 'Completed',
      date: '27 Aug 2026',
      startCount: 1020,
      currentCount: 1850,
      remains: 0,
      refillEligible: true,
      refillDaysLeft: 28,
      refillStatus: 'Available',
      refillHistory: []
    }
  ],

  refillQueue: [
    {
      id: 'ref-901',
      orderId: '48285',
      serviceName: 'Instagram Followers [Refill: 30D] [Speed: 20K/D]',
      customerName: 'Alex Vance (alex@growthagency.io)',
      startCount: 1020,
      targetCount: 2020,
      currentCount: 1850,
      dropCount: 170,
      requestedAt: '10 mins ago',
      status: 'Pending',
      provider: 'JustAnotherPanel (JAP)'
    }
  ],

  transactions: [
    {
      id: 'TXN-901',
      type: 'Deposit',
      description: 'Funds Added via UPI / Instant Pay',
      amount: 500.00,
      balanceAfter: 740.50,
      status: 'Success',
      date: '28 Aug 2026, 11:20'
    }
  ],

  supportTickets: [
    {
      id: 'TCK-104',
      subject: 'Refill inquiry for order #48285',
      linkedOrderId: '48285',
      status: 'Answered',
      updatedAt: '15m ago',
      messages: [
        {
          id: 'm1',
          sender: 'customer',
          text: 'Hi, I saw a slight drop on #48285 from 2,020 to 1,850. I clicked request refill, can you confirm?',
          time: '29 Aug, 20:30'
        },
        {
          id: 'm2',
          sender: 'admin',
          text: 'Hello Alex! We see your refill request in our queue. The upstream JAP provider is currently dispatching the top-up.',
          time: '29 Aug, 20:45'
        }
      ]
    }
  ],

  recentActivity: [
    {
      id: 'act-1',
      type: 'order',
      title: 'New Order #45001',
      sub: 'IG Followers [Refill: 30D] - alex',
      amount: '₹59.00',
      time: '2m ago',
      icon: '🛒'
    }
  ]
};
