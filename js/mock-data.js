window.SMM_MOCK = {
  currency: 'USD',
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
    }
  ],

  rawProviderServices: [
    {
      id: '10110',
      providerId: 'p1',
      providerName: 'JustAnotherPanel (JAP)',
      rawName: 'Instagram Followers [HQ] - Fast Delivery [50K]',
      category: 'Instagram Followers',
      platform: 'instagram',
      cost: 0.42,
      oldCost: null,
      min: 100,
      max: 50000,
      refillSupport: true,
      refillPeriod: '30 Days',
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
      cost: 0.12,
      oldCost: null,
      min: 50,
      max: 100000,
      refillSupport: true,
      refillPeriod: '30 Days',
      cancelSupport: true,
      status: 'Ready to Import'
    },
    {
      id: '10220',
      providerId: 'p1',
      providerName: 'JustAnotherPanel (JAP)',
      rawName: 'YouTube Views [High Retention 4K Speed]',
      category: 'YouTube Views',
      platform: 'youtube',
      cost: 1.40,
      oldCost: null,
      min: 500,
      max: 500000,
      refillSupport: true,
      refillPeriod: '30 Days',
      cancelSupport: true,
      status: 'Synced'
    },
    {
      id: '10330',
      providerId: 'p1',
      providerName: 'JustAnotherPanel (JAP)',
      rawName: 'TikTok Views [Fast Instant Algorithm Boost]',
      category: 'TikTok Views',
      platform: 'tiktok',
      cost: 0.02,
      oldCost: null,
      min: 1000,
      max: 1000000,
      refillSupport: false,
      refillPeriod: 'None',
      cancelSupport: false,
      status: 'Ready to Import'
    },
    {
      id: '5102',
      providerId: 'p1',
      providerName: 'JustAnotherPanel (JAP)',
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
    }
  ],

  customerServices: [
    {
      id: 'cs-1',
      customerName: 'Instagram Followers [Real & Active HQ]',
      category: 'Instagram',
      platform: 'instagram',
      pricePer1k: 0.95,
      min: 100,
      max: 50000,
      deliverySpeed: '10K - 20K / Day',
      startTime: '0 - 15 Minutes',
      refillSupported: true,
      refillPeriod: '30 Days',
      description: 'Guaranteed high-quality real profiles with active posts and profile pictures. Drop rate below 2%. Protected with 30-Day Refill Guarantee.',
      active: true,
      providerMappings: [
        {
          providerId: 'p1',
          providerName: 'JustAnotherPanel (JAP)',
          serviceId: '10110',
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
          providerName: 'JustAnotherPanel (JAP)',
          serviceId: '10220',
          providerCost: 1.40,
          markupPercent: 78,
          isPrimary: true,
          status: 'Active'
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
          providerName: 'JustAnotherPanel (JAP)',
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
      pricePer1k: 0.45,
      min: 50,
      max: 100000,
      deliverySpeed: '30K / Day',
      startTime: 'Instant',
      refillSupported: true,
      refillPeriod: '30 Days',
      description: 'Super fast delivery likes. Real looking profiles. High stability.',
      active: true,
      providerMappings: [
        {
          providerId: 'p1',
          providerName: 'JustAnotherPanel (JAP)',
          serviceId: '10115',
          providerCost: 0.12,
          markupPercent: 275,
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
      serviceName: 'Instagram Followers [Real & Active HQ]',
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
    }
  ]
};
