const SUPABASE_PROJECT_URL = 'https://gxbrchcfpjbewnyeijnp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Sx-TMQ94jDZpfXB8lR-FXw_3l6cIWnE';

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
  const requestedProvider = (paramsObj.provider || 'worldofsmm').toLowerCase();

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

    // 4.5-second timeout for ultra-fast, snappy execution
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    let response;
    try {
      response = await fetch(providerConfig.url, {
        method: 'POST',
        body: formData.toString(),
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        }
      });
    } finally {
      clearTimeout(timeoutId);
    }
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

    const providerKey = requestedProvider in PROVIDERS ? requestedProvider : 'worldofsmm';
    const providerConfig = PROVIDERS[providerKey];

    const data = await callProvider(providerConfig);

    // If order was placed, log to Supabase PostgreSQL orders table (both successful 8-digit and queued 5-digit orders)
    if (action === 'add') {
      const isSuccess = Boolean(data && data.order);
      const orderIdNum = isSuccess 
        ? parseInt(data.order, 10) 
        : (paramsObj.likeXOrderId ? parseInt(paramsObj.likeXOrderId, 10) : Math.floor(10000 + Math.random() * 90000));

      const rawSvcIdStr = paramsObj.service ? String(paramsObj.service).trim() : '';
      const orderErrorNote = data && data.error 
        ? `Error: ${String(data.error).slice(0, 25)} | svc:${rawSvcIdStr}`.slice(0, 48)
        : (rawSvcIdStr ? `svc:${rawSvcIdStr}` : null);

      fetch(`${SUPABASE_PROJECT_URL}/rest/v1/orders`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        },
        body: JSON.stringify({
          id: orderIdNum,
          service_id: null, // Null to prevent Foreign Key constraint errors with customer_services table
          target_url: paramsObj.link || '',
          quantity: Number(paramsObj.quantity) || 1000,
          charge: Number(paramsObj.charge) || 0,
          provider_order_id: isSuccess ? String(data.order) : String(orderIdNum),
          assigned_provider_id: providerKey === 'worldofsmm' ? 2 : 1,
          status: orderStatus,
          remains: Number(paramsObj.quantity) || 1000,
          refill_status: orderErrorNote,
          created_at: new Date().toISOString()
        })
      }).catch(dbErr => {
        console.warn('[LikeX Backend] Supabase order logging notice:', dbErr.message);
      });
    }

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
    if (action === 'add' && paramsObj.likeXOrderId) {
      const orderIdNum = parseInt(paramsObj.likeXOrderId, 10) || Math.floor(10000 + Math.random() * 90000);
      fetch(`${SUPABASE_PROJECT_URL}/rest/v1/orders`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        },
        body: JSON.stringify({
          id: orderIdNum,
          service_id: null,
          target_url: paramsObj.link || '',
          quantity: Number(paramsObj.quantity) || 1000,
          charge: Number(paramsObj.charge) || 0,
          provider_order_id: String(orderIdNum),
          assigned_provider_id: requestedProvider === 'jap' ? 1 : 2,
          status: 'Queued',
          remains: Number(paramsObj.quantity) || 1000,
          refill_status: `Timeout: ${error.message.slice(0, 25)} | svc:${paramsObj.service ? String(paramsObj.service).trim() : ''}`.slice(0, 48),
          created_at: new Date().toISOString()
        })
      }).catch(() => {});
    }

    return res.status(500).json({ 
      error: 'Upstream provider connection error: ' + (error.name === 'AbortError' ? 'Provider timeout (4.5s)' : error.message),
      provider: requestedProvider 
    });
  }
}
