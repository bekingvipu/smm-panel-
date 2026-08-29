window.SMM_MOCK = {
  currency: 'USD', // 'USD' ($) or 'INR' (₹)
  exchangeRate: 83.0, // 1 USD = 83 INR
  
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
    providerBalance: 1100,
    providerBalanceStatus: 'Low'
  },

  providers: [
    {
      id: 'p1',
      name: 'API1_GlobalSMM',
      displayName: 'Main Provider API',
      status: 'active',
      balance: 450.00,
      activeServices: 1200,
      lastSync: '2 mins ago',
      apiUrl: 'https://api1.globalsmm.io/v2',
      apiKeyMasked: 'sk_live_948f••••••••8492'
    },
    {
      id: 'p2',
      name: 'SpeedSMM_Backup',
      displayName: 'Backup Provider',
      status: 'active',
      balance: 125.50,
      activeServices: 450,
      lastSync: '15 mins ago',
      apiUrl: 'https://api.speedsmm.net/api/v2',
      apiKeyMasked: 'sk_live_210a••••••••9310'
    },
    {
      id: 'p3',
      name: 'Legacy_V1_Node',
      displayName: 'Legacy Provider V1',
      status: 'sync_failed',
      balance: null,
      activeServices: 12,
      lastSync: '2 days ago',
      apiUrl: 'https://v1.legacysmm.com/api',
      apiKeyMasked: 'sk_live_884b••••••••1103'
    },
    {
      id: 'p4',
      name: 'Demo_Wholesale_SMM',
      displayName: 'Demo Wholesale Provider',
      status: 'active',
      balance: 890.00,
      activeServices: 680,
      lastSync: '1 hour ago',
      apiUrl: 'https://demo.smm-provider.com/v2',
      apiKeyMasked: 'sk_demo_771c••••••••0042'
    }
  ],

  rawProviderServices: [
    {
      id: '4092',
      providerId: 'p1',
      providerName: 'API1_GlobalSMM',
      rawName: 'Instagram Followers [HQ] - Fast [50K]',
      category: 'Instagram Followers',
      platform: 'instagram',
      cost: 0.42,
      oldCost: null,
      min: 100,
      max: 50000,
      refillSupport: true,
      refillPeriod: '30 Days',
      cancelSupport: true,
      status: 'Ready to Import'
    },
    {
      id: '4093',
      providerId: 'p1',
      providerName: 'API1_GlobalSMM',
      rawName: 'TikTok Views [Fast]',
      category: 'TikTok Views',
      platform: 'tiktok',
      cost: 0.02,
      oldCost: null,
      min: 1000,
      max: 1000000,
      refillSupport: false,
      refillPeriod: 'None',
      cancelSupport: false,
      status: 'Unavailable Upstream'
    },
    {
      id: '5102',
      providerId: 'p1',
      providerName: 'API1_GlobalSMM',
      rawName: 'YouTube Subscribers [Non-Drop Real HQ]',
      category: 'YouTube Subscribers',
      platform: 'youtube',
      cost: 3.10,
      oldCost: 2.50,
      min: 50,
      max: 5000,
      refillSupport: true,
      refillPeriod: '60 Days',
      cancelSupport: true,
      status: 'Review Pricing'
    },
    {
      id: '102',
      providerId: 'p1',
      providerName: 'API1_GlobalSMM',
      rawName: 'Twitter Likes [Real Users]',
      category: 'Twitter Engagement',
      platform: 'twitter',
      cost: 0.85,
      oldCost: null,
      min: 10,
      max: 10000,
      refillSupport: true,
      refillPeriod: '30 Days',
      cancelSupport: true,
      status: 'Synced'
    },
    {
      id: '6011',
      providerId: 'p4',
      providerName: 'Demo_Wholesale_SMM',
      rawName: 'Instagram Likes [Instant HQ High Speed]',
      category: 'Instagram Likes',
      platform: 'instagram',
      cost: 0.25,
      oldCost: null,
      min: 50,
      max: 100000,
      refillSupport: true,
      refillPeriod: '30 Days',
      cancelSupport: true,
      status: 'Ready to Import'
    },
    {
      id: '7701',
      providerId: 'p1',
      providerName: 'API1_GlobalSMM',
      rawName: 'YouTube Views [High Retention 4K Lifetime]',
      category: 'YouTube Views',
      platform: 'youtube',
      cost: 1.80,
      oldCost: null,
      min: 500,
      max: 500000,
      refillSupport: true,
      refillPeriod: '30 Days',
      cancelSupport: true,
      status: 'Synced'
    }
  ],

  customerServices: [
    {
      id: 'cs-1',
      customerName: 'Instagram Followers [Real & Active HQ]',
      category: 'Instagram',
      platform: 'instagram',
      pricePer1k: 0.95, // selling price ($0.95 / ₹79.00)
      min: 100,
      max: 50000,
      deliverySpeed: '10K - 20K / Day',
      startTime: '0 - 15 Minutes',
      refillSupported: true,
      refillPeriod: '30 Days',
      description: 'Guaranteed high-quality real profiles with active posts and profile pictures. Drop rate below 2%. Protected with 30-Day Refill Guarantee.',
      active: true,
      // Multi-Provider Mappings for 1 Customer Service!
      providerMappings: [
        {
          providerId: 'p1',
          providerName: 'API1_GlobalSMM',
          serviceId: '4092',
          providerCost: 0.42,
          markupPercent: 126,
          isPrimary: true,
          status: 'Active'
        },
        {
          providerId: 'p2',
          providerName: 'Backup Provider',
          serviceId: '1902',
          providerCost: 0.46,
          markupPercent: 106,
          isPrimary: false,
          status: 'Standby Failover 1'
        },
        {
          providerId: 'p4',
          providerName: 'Demo Provider',
          serviceId: '8110',
          providerCost: 0.50,
          markupPercent: 90,
          isPrimary: false,
          status: 'Standby Failover 2'
        }
      ]
    },
    {
      id: 'cs-2',
      customerName: 'YouTube Views [High Retention 4K Speed]',
      category: 'YouTube',
      platform: 'youtube',
      pricePer1k: 2.50,
      min: 500,
      max: 500000,
      deliverySpeed: '5K - 10K / Day',
      startTime: '10 - 45 Minutes',
      refillSupported: true,
      refillPeriod: '30 Days',
      description: 'Monetization-safe worldwide retention views. Real audience recommendation traffic with average 3-5 min watch time.',
      active: true,
      providerMappings: [
        {
          providerId: 'p1',
          providerName: 'API1_GlobalSMM',
          serviceId: '7701',
          providerCost: 1.80,
          markupPercent: 39,
          isPrimary: true,
          status: 'Active'
        },
        {
          providerId: 'p2',
          providerName: 'Backup Provider',
          serviceId: '3104',
          providerCost: 1.95,
          markupPercent: 28,
          isPrimary: false,
          status: 'Standby Failover 1'
        }
      ]
    },
    {
      id: 'cs-3',
      customerName: 'TikTok Likes [Fast Delivery & Non-Drop]',
      category: 'TikTok',
      platform: 'tiktok',
      pricePer1k: 2.20,
      min: 100,
      max: 100000,
      deliverySpeed: '50K / Day',
      startTime: 'Instant (0 - 5 mins)',
      refillSupported: true,
      refillPeriod: '15 Days',
      description: 'High quality instant likes for TikTok videos. Fast algorithm boost for ForYou page ranking.',
      active: true,
      providerMappings: [
        {
          providerId: 'p1',
          providerName: 'API1_GlobalSMM',
          serviceId: '9102',
          providerCost: 1.10,
          markupPercent: 100,
          isPrimary: true,
          status: 'Active'
        }
      ]
    },
    {
      id: 'cs-4',
      customerName: 'Instagram Likes [Instant & High Quality]',
      category: 'Instagram',
      platform: 'instagram',
      pricePer1k: 0.55,
      min: 50,
      max: 100000,
      deliverySpeed: '30K / Day',
      startTime: 'Instant',
      refillSupported: false,
      refillPeriod: 'None',
      description: 'Super fast delivery likes. Real looking profiles. High stability.',
      active: true,
      providerMappings: [
        {
          providerId: 'p4',
          providerName: 'Demo Provider',
          serviceId: '6011',
          providerCost: 0.25,
          markupPercent: 120,
          isPrimary: true,
          status: 'Active'
        }
      ]
    },
    {
      id: 'cs-5',
      customerName: 'Twitter/X Likes [Real Global Accounts]',
      category: 'Twitter',
      platform: 'twitter',
      pricePer1k: 1.80,
      min: 50,
      max: 10000,
      deliverySpeed: '5K / Day',
      startTime: '15 - 30 Minutes',
      refillSupported: true,
      refillPeriod: '30 Days',
      description: 'Real accounts with profile photos and bio. Good for engagement verification.',
      active: true,
      providerMappings: [
        {
          providerId: 'p1',
          providerName: 'API1_GlobalSMM',
          serviceId: '102',
          providerCost: 0.85,
          markupPercent: 112,
          isPrimary: true,
          status: 'Active'
        }
      ]
    }
  ],

  orders: [
    {
      id: '48291',
      serviceId: 'cs-1',
      serviceName: 'Instagram Followers [Real & Active HQ]',
      platform: 'instagram',
      target: 'https://instagram.com/fashion_trendz',
      quantity: 1000,
      amount: 5.00,
      status: 'Processing',
      statusType: 'processing',
      date: 'Today, 20:50',
      startCount: 12400,
      currentCount: 12400,
      remains: 1000,
      refillEligible: false,
      refillReason: 'Order is still processing'
    },
    {
      id: '48290',
      serviceId: 'cs-2',
      serviceName: 'YouTube Views [High Retention 4K Speed]',
      platform: 'youtube',
      target: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
      quantity: 5000,
      amount: 12.50,
      status: 'In Progress',
      statusType: 'in_progress',
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
      serviceName: 'Instagram Followers [Real & Active HQ]',
      platform: 'instagram',
      target: 'https://instagram.com/fitness_dan',
      quantity: 1000,
      amount: 5.00,
      status: 'Completed',
      statusType: 'completed',
      date: '27 Aug 2026',
      startCount: 1020,
      currentCount: 1850,
      remains: 0,
      refillEligible: true, // Eligible for Refill!
      refillDaysLeft: 28,
      refillStatus: 'Available',
      refillHistory: []
    },
    {
      id: '48270',
      serviceId: 'cs-3',
      serviceName: 'TikTok Likes [Fast Delivery & Non-Drop]',
      platform: 'tiktok',
      target: 'https://tiktok.com/@creative_art/video/719',
      quantity: 1000,
      amount: 2.20,
      status: 'Completed',
      statusType: 'completed',
      date: '22 Aug 2026',
      startCount: 340,
      currentCount: 1340,
      remains: 0,
      refillEligible: true,
      refillDaysLeft: 8,
      refillStatus: 'Available',
      refillHistory: []
    },
    {
      id: '48255',
      serviceId: 'cs-4',
      serviceName: 'Instagram Likes [Instant & High Quality]',
      platform: 'instagram',
      target: 'https://instagram.com/p/C-xyz910',
      quantity: 2000,
      amount: 1.10,
      status: 'Completed',
      statusType: 'completed',
      date: '20 Aug 2026',
      startCount: 20,
      currentCount: 2020,
      remains: 0,
      refillEligible: false, // Refill NOT supported for this service
      refillReason: 'Service does not have refill guarantee'
    }
  ],

  refillQueue: [
    {
      id: 'ref-901',
      orderId: '48285',
      serviceName: 'Instagram Followers [Real & Active HQ]',
      customerName: 'Alex Vance (alex@growthagency.io)',
      startCount: 1020,
      targetCount: 2020,
      currentCount: 1850,
      dropCount: 170,
      requestedAt: '10 mins ago',
      status: 'Pending',
      provider: 'API1_GlobalSMM'
    }
  ],

  transactions: [
    {
      id: 'TXN-901',
      type: 'Deposit',
      description: 'Funds Added via UPI / Instant Pay',
      amount: 100.00,
      balanceAfter: 240.50,
      status: 'Success',
      date: '28 Aug 2026, 11:20'
    },
    {
      id: 'TXN-902',
      type: 'Order Deduction',
      description: 'Payment for Order #48291',
      amount: -5.00,
      balanceAfter: 140.50,
      status: 'Success',
      date: '29 Aug 2026, 20:50'
    },
    {
      id: 'TXN-903',
      type: 'Order Deduction',
      description: 'Payment for Order #48290',
      amount: -12.50,
      balanceAfter: 145.50,
      status: 'Success',
      date: '29 Aug 2026, 18:30'
    },
    {
      id: 'TXN-904',
      type: 'Refund',
      description: 'Refund for Order #44975 (Canceled Upstream)',
      amount: 45.00,
      balanceAfter: 158.00,
      status: 'Success',
      date: '29 Aug 2026, 17:15'
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
          text: 'Hello Alex! We see your refill request in our queue. The upstream provider is currently dispatching the top-up. You will be back to 2,020+ within a few hours.',
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
      sub: 'IG Followers [Max: 50K] - user_b',
      amount: '$12.50',
      time: '2m ago',
      icon: '🛒'
    },
    {
      id: 'act-2',
      type: 'refill',
      title: 'Refill Request #44980',
      sub: 'TikTok Views - user_b',
      badge: 'Pending',
      time: '15m ago',
      icon: '🔄'
    },
    {
      id: 'act-3',
      type: 'failed',
      title: 'Order Failed #44975',
      sub: 'YT Subs - Provider API Error',
      amount: '$45.00',
      time: '1h ago',
      icon: '⏱️'
    },
    {
      id: 'act-4',
      type: 'signup',
      title: 'New User Signup',
      sub: 'agency_pro@example.com',
      time: '2h ago',
      icon: '👤'
    }
  ]
};
