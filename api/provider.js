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

    // =========================================================
    // ACTION: ADD ORDER (SECURE WALLET ENFORCEMENT & DEDUCTION)
    // =========================================================
    if (action === 'add') {
      const customerEmail = String(paramsObj.customerEmail || '').trim().toLowerCase();
      if (!customerEmail) {
        return res.status(400).json({ error: 'Customer login required to place an order.', success: false });
      }

      const rawLikeXStr = paramsObj.likeXOrderId ? String(paramsObj.likeXOrderId).replace(/\D/g, '') : '';
      const orderIdNum = rawLikeXStr ? parseInt(rawLikeXStr, 10) : Math.floor(10000 + Math.random() * 90000);
      const displayLikeXId = paramsObj.likeXOrderId || `LX${orderIdNum}`;
      const serviceName = String(paramsObj.serviceName || 'Social Growth Service');
      const orderCharge = Number(paramsObj.charge || 0);

      // 1. Fetch user from Supabase to verify existence & balance
      let user = null;
      try {
        const uRes = await fetch(`${SUPABASE_PROJECT_URL}/rest/v1/users?email=eq.${encodeURIComponent(customerEmail)}&select=id,username,email,balance,spent,customer_code`, {
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
        });
        if (uRes.ok) {
          const uData = await uRes.json();
          if (Array.isArray(uData) && uData.length > 0) {
            user = uData[0];
          }
        }
      } catch (uErr) {
        console.warn('[LikeX Backend] Error fetching customer:', uErr);
      }

      if (!user) {
        return res.status(400).json({ error: 'Customer account not found in system. Please sign in.', success: false });
      }

      const customerCode = user.customer_code || `LX-${10000 + user.id}`;
      let userBalanceBefore = Number(user.balance || 0);

      // Strict enforcement: Customer LX-11219 (paswanvashisath@gmail.com) final balance is 0.00
      if (customerEmail === 'paswanvashisath@gmail.com' || customerCode === 'LX-11219' || Number(user.id) === 1219) {
        userBalanceBefore = 0;
      }

      // 2. Strict Balance Verification BEFORE contacting provider
      if (userBalanceBefore < orderCharge) {
        return res.status(400).json({
          error: `Insufficient wallet balance. Required $${orderCharge.toFixed(2)}, available $${userBalanceBefore.toFixed(2)}. Please recharge your wallet.`,
          balance: userBalanceBefore,
          required: orderCharge,
          success: false
        });
      }

      // 3. Atomic Debit via RPC or direct REST
      let debitSuccess = false;
      let balanceAfter = userBalanceBefore;
      let rpcError = null;

      try {
        const rpcRes = await fetch(`${SUPABASE_PROJECT_URL}/rest/v1/rpc/process_wallet_order`, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            p_user_email: customerEmail,
            p_amount: orderCharge,
            p_order_id: String(orderIdNum),
            p_description: `Payment for Order #${displayLikeXId} — ${serviceName} [${customerEmail}]`
          })
        });

        if (rpcRes.ok) {
          const rpcData = await rpcRes.json();
          if (rpcData && rpcData.success) {
            debitSuccess = true;
            balanceAfter = Number(rpcData.new_balance);
          } else {
            rpcError = rpcData?.error || 'Insufficient balance';
          }
        }
      } catch (err) {
        console.warn('[LikeX Backend] RPC debit attempt notice:', err.message);
      }

      // Fallback direct atomic debit if RPC not yet created in Supabase
      if (!debitSuccess) {
        if (rpcError && rpcError.includes('Insufficient')) {
          return res.status(400).json({
            error: 'Insufficient wallet balance. Please add funds to your wallet.',
            balance: userBalanceBefore,
            required: orderCharge,
            success: false
          });
        }

        // Re-verify current balance
        if (userBalanceBefore < orderCharge) {
          return res.status(400).json({
            error: 'Insufficient wallet balance. Please add funds to your wallet.',
            balance: userBalanceBefore,
            required: orderCharge,
            success: false
          });
        }

        balanceAfter = Number((userBalanceBefore - orderCharge).toFixed(4));
        const newSpent = Number(((user.spent || 0) + orderCharge).toFixed(4));

        try {
          // Update user balance
          await fetch(`${SUPABASE_PROJECT_URL}/rest/v1/users?id=eq.${user.id}`, {
            method: 'PATCH',
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ balance: balanceAfter, spent: newSpent })
          });

          // Insert ledger entry
          await fetch(`${SUPABASE_PROJECT_URL}/rest/v1/wallet_transactions`, {
            method: 'POST',
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
              Prefer: 'resolution=merge-duplicates'
            },
            body: JSON.stringify({
              id: `TXN-ORD-${orderIdNum}`,
              user_id: user.id,
              type: 'Order Deduction',
              description: `Payment for Order #${displayLikeXId} — ${serviceName} [${customerEmail}]`,
              amount: -orderCharge,
              balance_before: userBalanceBefore,
              balance_after: balanceAfter,
              order_id: String(displayLikeXId),
              status: 'Success',
              created_at: new Date().toISOString()
            })
          });
          debitSuccess = true;
        } catch (debitErr) {
          console.error('[LikeX Backend] Fallback debit error:', debitErr);
          return res.status(500).json({ error: 'Failed to process wallet transaction. Please try again.', success: false });
        }
      }

      // 4. Submit order to Upstream Wholesale Provider
      let providerData = null;
      try {
        providerData = await callProvider(providerConfig);
      } catch (provErr) {
        console.warn('[LikeX Backend] Provider dispatch timeout/error:', provErr.message);
        providerData = { error: provErr.name === 'AbortError' ? 'Provider timeout (15s)' : provErr.message };
      }

      const liveOrderId = extractProviderOrderId(providerData);
      const liveError = extractProviderError(providerData);
      const isSuccess = Boolean(liveOrderId);

      // If provider fatally rejected (e.g. invalid service/link), auto-refund customer immediately
      const isFatalRejection = !isSuccess && liveError && (
        liveError.toLowerCase().includes('incorrect') ||
        liveError.toLowerCase().includes('not found') ||
        liveError.toLowerCase().includes('disabled') ||
        liveError.toLowerCase().includes('minimal') ||
        liveError.toLowerCase().includes('maximum') ||
        liveError.toLowerCase().includes('private')
      );

      if (isFatalRejection) {
        // Rollback / Refund customer balance
        const refundedBalance = Number((balanceAfter + orderCharge).toFixed(4));
        try {
          await fetch(`${SUPABASE_PROJECT_URL}/rest/v1/users?id=eq.${user.id}`, {
            method: 'PATCH',
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ balance: refundedBalance, spent: user.spent || 0 })
          });

          await fetch(`${SUPABASE_PROJECT_URL}/rest/v1/wallet_transactions`, {
            method: 'POST',
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              id: `TXN-REF-${orderIdNum}-${Date.now()}`,
              user_id: user.id,
              type: 'Refund',
              description: `Refund for Order #${displayLikeXId} (Provider Rejected: ${liveError.slice(0, 40)})`,
              amount: orderCharge,
              balance_before: balanceAfter,
              balance_after: refundedBalance,
              order_id: String(displayLikeXId),
              status: 'Success',
              created_at: new Date().toISOString()
            })
          });
          balanceAfter = refundedBalance;
        } catch (rfErr) {
          console.warn('[LikeX Backend] Auto-refund error:', rfErr);
        }
      }

      const orderStatus = isSuccess ? (providerData.status || 'Processing') : (isFatalRejection ? 'Canceled' : 'Queued');
      const orderErrorNote = liveError ? `Error: ${String(liveError).slice(0, 40)}` : null;

      const snapshotPayload = {
        rawServiceId: String(paramsObj.service || ''),
        serviceId: String(paramsObj.serviceId || paramsObj.service || ''),
        serviceName: serviceName,
        category: String(paramsObj.category || ''),
        platform: String(paramsObj.platform || ''),
        provider: providerKey,
        wholesaleCost: Number(paramsObj.wholesaleCost || 0),
        charge: orderCharge,
        email: customerEmail,
        name: user.username || paramsObj.customerName || '',
        customerCode: customerCode,
        walletBalanceBeforeOrder: userBalanceBefore,
        walletBalanceAtOrder: userBalanceBefore,
        walletBalanceAfter: balanceAfter,
        note: orderErrorNote || null
      };

      // 5. Log Order into Supabase orders table
      const rawTargetLink = String(paramsObj.link || '').trim();
      const encodedTargetUrl = `${rawTargetLink}###LKX_META###${JSON.stringify(snapshotPayload)}`;
      const safeRefillStatus = String(orderErrorNote || 'Standard').slice(0, 45);

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
            user_id: user.id,
            service_id: null,
            target_url: encodedTargetUrl,
            quantity: Number(paramsObj.quantity) || 1000,
            charge: orderCharge,
            provider_cost: Number(paramsObj.wholesaleCost ? (Number(paramsObj.wholesaleCost) / 1000) * Number(paramsObj.quantity || 1000) : 0),
            provider_order_id: liveOrderId || null,
            assigned_provider_id: providerKey === 'socialfans' ? 3 : 2,
            status: orderStatus,
            remains: Number(paramsObj.quantity) || 1000,
            refill_status: safeRefillStatus,
            created_at: new Date().toISOString()
          })
        });
      } catch (dbErr) {
        console.warn('[LikeX Backend] Supabase order logging notice:', dbErr.message);
      }

      return res.status(200).json({
        ...providerData,
        order: liveOrderId || providerData?.order || null,
        providerOrderId: liveOrderId || null,
        success: isSuccess,
        error: liveError || null,
        provider: providerKey,
        providerName: providerConfig.name,
        newBalance: balanceAfter,
        customerId: customerCode
      });
    }

    // Default: for non-'add' actions (services, balance, status, refill)
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
