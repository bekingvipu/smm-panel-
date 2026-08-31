// Vercel Serverless Function to proxy JustAnotherPanel (JAP) and WorldOfSMM APIs with CORS
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const PROVIDERS = {
    jap: {
      name: 'JustAnotherPanel',
      url: 'https://justanotherpanel.com/api/v2',
      key: '30265a24da9de364919a246b151c4a63'
    },
    worldofsmm: {
      name: 'WorldOfSMM',
      url: 'https://worldofsmm.com/api/v2',
      key: '46b91da29d8e95bad51d3aa3eb8c3a1a'
    }
  };

  // Parse request params
  let paramsObj = {};
  if (req.method === 'POST') {
    try {
      paramsObj = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    } catch (e) {
      paramsObj = req.body || {};
    }
  } else {
    paramsObj = req.query || {};
  }

  const action = paramsObj.action || 'balance';
  const requestedProvider = (paramsObj.provider || 'jap').toLowerCase();

  // Helper to query an upstream provider
  const callProvider = async (providerConfig, customParams = {}) => {
    const formData = new URLSearchParams();
    formData.append('key', providerConfig.key);
    formData.append('action', customParams.action || action);

    if (customParams.service || paramsObj.service) formData.append('service', String(customParams.service || paramsObj.service));
    if (customParams.link || paramsObj.link) formData.append('link', String(customParams.link || paramsObj.link));
    if (customParams.quantity || paramsObj.quantity) formData.append('quantity', String(customParams.quantity || paramsObj.quantity));
    if (customParams.comments || paramsObj.comments) formData.append('comments', String(customParams.comments || paramsObj.comments));
    if (customParams.order || paramsObj.order) formData.append('order', String(customParams.order || paramsObj.order));
    if (customParams.orders || paramsObj.orders) formData.append('orders', String(customParams.orders || paramsObj.orders));
    if (customParams.refill || paramsObj.refill) formData.append('refill', String(customParams.refill || paramsObj.refill));

    const response = await fetch(providerConfig.url, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (compatible; LikeX-SMM/2.0)'
      }
    });
    return await response.json();
  };

  try {
    // Multi-balance check
    if (action === 'balance' && (requestedProvider === 'all' || requestedProvider === 'both')) {
      const [japRes, wosRes] = await Promise.allSettled([
        callProvider(PROVIDERS.jap, { action: 'balance' }),
        callProvider(PROVIDERS.worldofsmm, { action: 'balance' })
      ]);

      return res.status(200).json({
        jap: japRes.status === 'fulfilled' ? japRes.value : { error: 'Failed to reach JAP' },
        worldofsmm: wosRes.status === 'fulfilled' ? wosRes.value : { error: 'Failed to reach WorldOfSMM' }
      });
    }

    const providerKey = requestedProvider in PROVIDERS ? requestedProvider : 'jap';
    const providerConfig = PROVIDERS[providerKey];

    const data = await callProvider(providerConfig);

    // If upstream returns an array (e.g. action: 'services'), return array directly
    if (Array.isArray(data)) {
      return res.status(200).json(data);
    }

    // Attach provider key to response for clear origin tracking
    return res.status(200).json({
      ...data,
      provider: providerKey,
      providerName: providerConfig.name
    });
  } catch (error) {
    return res.status(500).json({ 
      error: 'Upstream provider connection error: ' + error.message,
      provider: requestedProvider 
    });
  }
}
