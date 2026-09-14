const SUPABASE_PROJECT_URL = 'https://gxbrchcfpjbewnyeijnp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Sx-TMQ94jDZpfXB8lR-FXw_3l6cIWnE';

// Vercel Serverless Function to proxy WorldOfSMM and SocialFans APIs with CORS
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const PROVIDERS = {
    worldofsmm: {
      name: 'WorldOfSMM',
      url: 'https://worldofsmm.com/api/v2',
      key: '46b91da29d8e95bad51d3aa3eb8c3a1a'
    },
    socialfans: {
      name: 'SocialFans',
      url: 'https://socialfanss.com/api/v2',
      key: '05c0ebb98cacaa582a71636d72efc2f75cef4cce'
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

    // 15-second timeout to allow upstream SMM nodes (WorldOfSMM / SocialFans) to process and return live order ID
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    let response;
    try {
      response = await fetch(providerConfig.url, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (compatible; LikeX-SMM/2.0)'
        }
      });
    } finally {
      clearTimeout(timeoutId);
    }
    return await response.json();
  };

  // Universal Provider Response Parsers
  function extractProviderOrderId(data) {
    if (!data || typeof data !== 'object') return null;
    if (data.error && typeof data.error === 'string' && data.error.trim().length > 0) return null;
    if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) return null;

    const candidate = data.order ?? data.order_id ?? data.orderId ?? data.id;
    if (candidate !== undefined && candidate !== null) {
      const s = String(candidate).trim();
      if (s !== '' && s !== '0' && s.toLowerCase() !== 'null' && s.toLowerCase() !== 'undefined' && s.toLowerCase() !== 'n/a') {
        return s;
      }
    }
    return null;
  }

  function extractProviderError(data) {
    if (!data || typeof data !== 'object') return null;
    if (data.error) {
      return typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
    }
    if (data.errors) {
      return Array.isArray(data.errors) ? data.errors.join(', ') : JSON.stringify(data.errors);
    }
    if (data.message && (String(data.message).toLowerCase().includes('fail') || String(data.message).toLowerCase().includes('error'))) {
      return String(data.message);
    }
    return null;
  }

  // Multi-balance check
  try {
    if (action === 'balance' && (requestedProvider === 'all' || requestedProvider === 'both')) {
      const [wosRes, sfRes] = await Promise.allSettled([
        callProvider(PROVIDERS.worldofsmm, { action: 'balance' }),
        callProvider(PROVIDERS.socialfans, { action: 'balance' })
      ]);

      return res.status(200).json({
        worldofsmm: wosRes.status === 'fulfilled' ? wosRes.value : { error: 'Failed to reach WorldOfSMM' },
        socialfans: sfRes.status === 'fulfilled' ? sfRes.value : { error: 'Failed to reach SocialFans' }
      });
    }

    const providerKey = requestedProvider in PROVIDERS ? requestedProvider : 'worldofsmm';
    const providerConfig = PROVIDERS[providerKey];

    const data = await callProvider(providerConfig);

    // If order was placed, log to Supabase PostgreSQL orders table (keeps LikeX ID & Provider Order ID separate)
    if (action === 'add') {
      const liveOrderId = extractProviderOrderId(data);
      const liveError = extractProviderError(data);
      const isSuccess = Boolean(liveOrderId);
      const rawLikeXStr = paramsObj.likeXOrderId ? String(paramsObj.likeXOrderId).replace(/\D/g, '') : '';
      const orderIdNum = rawLikeXStr ? parseInt(rawLikeXStr, 10) : Math.floor(10000 + Math.random() * 90000);

      const orderStatus = isSuccess ? (data.status || 'Processing') : 'Queued';
      const orderErrorNote = liveError ? `Error: ${String(liveError).slice(0, 40)}` : null;

      const snapshotPayload = {
        rawServiceId: String(paramsObj.service || ''),
        serviceId: String(paramsObj.serviceId || paramsObj.service || ''),
        serviceName: String(paramsObj.serviceName || ''),
        category: String(paramsObj.category || ''),
        platform: String(paramsObj.platform || ''),
        provider: providerKey,
        wholesaleCost: Number(paramsObj.wholesaleCost || 0),
        charge: Number(paramsObj.charge || 0),
        email: paramsObj.customerEmail || '',
        name: paramsObj.customerName || '',
        note: orderErrorNote || null
      };

      // 1. Resolve or create user_id in public.users
      let resolvedUserId = null;
      if (paramsObj.customerEmail) {
        try {
          const cleanEmail = String(paramsObj.customerEmail).trim().toLowerCase();
          const uRes = await fetch(`${SUPABASE_PROJECT_URL}/rest/v1/users?email=eq.${encodeURIComponent(cleanEmail)}&select=id`, {
            headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
          });
          if (uRes.ok) {
            const uData = await uRes.json();
            if (Array.isArray(uData) && uData.length > 0) {
              resolvedUserId = uData[0].id;
            } else {
              const cleanName = paramsObj.customerName || cleanEmail.split('@')[0];
              const createRes = await fetch(`${SUPABASE_PROJECT_URL}/rest/v1/users`, {
                method: 'POST',
                headers: {
                  apikey: SUPABASE_ANON_KEY,
                  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                  'Content-Type': 'application/json',
                  Prefer: 'return=representation'
                },
                body: JSON.stringify({
                  email: cleanEmail,
                  username: cleanName,
                  password_hash: 'auth_order_autogen',
                  role: 'customer'
                })
              });
              if (createRes.ok) {
                const newU = await createRes.json();
                if (Array.isArray(newU) && newU.length > 0) {
                  resolvedUserId = newU[0].id;
                }
              }
            }
          }
        } catch (e) {
          console.warn('[LikeX Backend] User ID resolution error:', e);
        }
      }

      // 2. target_url is TEXT with no length limit; store clean URL + snapshot delimiter
      const rawTargetLink = String(paramsObj.link || '').trim();
      const encodedTargetUrl = `${rawTargetLink}###LKX_META###${JSON.stringify(snapshotPayload)}`;
      const safeRefillStatus = String(orderErrorNote || 'Standard').slice(0, 45);

      try {
        const dbRes = await fetch(`${SUPABASE_PROJECT_URL}/rest/v1/orders`, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates'
          },
          body: JSON.stringify({
            id: orderIdNum,
            user_id: resolvedUserId,
            service_id: null, // Null to prevent Foreign Key constraint errors with customer_services table
            target_url: encodedTargetUrl,
            quantity: Number(paramsObj.quantity) || 1000,
            charge: Number(paramsObj.charge) || 0,
            provider_cost: Number(paramsObj.wholesaleCost ? (Number(paramsObj.wholesaleCost) / 1000) * Number(paramsObj.quantity || 1000) : 0),
            provider_order_id: liveOrderId || null,
            assigned_provider_id: providerKey === 'socialfans' ? 3 : 2,
            status: orderStatus,
            remains: Number(paramsObj.quantity) || 1000,
            refill_status: safeRefillStatus,
            created_at: new Date().toISOString()
          })
        });
        if (!dbRes.ok) {
          const errTxt = await dbRes.text();
          console.warn('[LikeX Backend] Supabase order logging notice:', dbRes.status, errTxt);
        } else {
          console.log(`[LikeX Backend] Order #${orderIdNum} successfully logged to Supabase.`);
        }
      } catch (dbErr) {
        console.warn('[LikeX Backend] Supabase order logging notice:', dbErr.message);
      }

      return res.status(200).json({
        ...data,
        order: liveOrderId || data?.order || null,
        providerOrderId: liveOrderId || null,
        success: isSuccess,
        error: liveError || data?.error || null,
        provider: providerKey,
        providerName: providerConfig.name
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
      const rawLikeXStr = String(paramsObj.likeXOrderId).replace(/\D/g, '');
      const orderIdNum = rawLikeXStr ? parseInt(rawLikeXStr, 10) : Math.floor(10000 + Math.random() * 90000);
      const snapshotPayload = {
        rawServiceId: String(paramsObj.service || ''),
        serviceId: String(paramsObj.serviceId || paramsObj.service || ''),
        serviceName: String(paramsObj.serviceName || ''),
        category: String(paramsObj.category || ''),
        platform: String(paramsObj.platform || ''),
        provider: requestedProvider === 'socialfans' ? 'socialfans' : 'worldofsmm',
        wholesaleCost: Number(paramsObj.wholesaleCost || 0),
        charge: Number(paramsObj.charge || 0),
        email: paramsObj.customerEmail || '',
        name: paramsObj.customerName || '',
        note: `Timeout: ${error.message.slice(0, 35)}`
      };
      const rawTargetLink = String(paramsObj.link || '').trim();
      const encodedTargetUrl = `${rawTargetLink}###LKX_META###${JSON.stringify(snapshotPayload)}`;
      const safeRefillStatus = `Timeout: ${error.message.slice(0, 35)}`;

      try {
        await fetch(`${SUPABASE_PROJECT_URL}/rest/v1/orders`, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates'
          },
          body: JSON.stringify({
            id: orderIdNum,
            user_id: null,
            service_id: null,
            target_url: encodedTargetUrl,
            quantity: Number(paramsObj.quantity) || 1000,
            charge: Number(paramsObj.charge) || 0,
            provider_cost: Number(paramsObj.wholesaleCost ? (Number(paramsObj.wholesaleCost) / 1000) * Number(paramsObj.quantity || 1000) : 0),
            provider_order_id: null,
            assigned_provider_id: requestedProvider === 'socialfans' ? 3 : 2,
            status: 'Queued',
            remains: Number(paramsObj.quantity) || 1000,
            refill_status: safeRefillStatus,
            created_at: new Date().toISOString()
          })
        });
      } catch (_) {}
    }

    return res.status(500).json({ 
      error: 'Upstream provider connection error: ' + (error.name === 'AbortError' ? 'Provider timeout (15s)' : error.message),
      provider: requestedProvider 
    });
  }
}
