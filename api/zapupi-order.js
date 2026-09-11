// Vercel Serverless Function: ZapUPI Dynamic UPI Order Creation
// Connects LikeX Storefront to ZapUPI Gateway (Paytm Dynamic - All UPI Apps)

const ZAP_KEY = 'zapc267112a11cfc2c29fa5d3a52a636afc';
const ZAP_CREATE_ORDER_URL = 'https://pay.zapupi.com/api/create-order';
const SUPABASE_PROJECT_URL = 'https://gxbrchcfpjbewnyeijnp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Sx-TMQ94jDZpfXB8lR-FXw_3l6cIWnE';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let body = {};
  if (req.method === 'POST') {
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    } catch (e) {
      body = req.body || {};
    }
  } else {
    body = req.query || {};
  }

  const amountNum = Math.round(Number(body.amount || 0));
  const userEmail = String(body.email || 'customer@likex.in').trim().toLowerCase();
  const userId = Number(body.userId || 1);

  if (!amountNum || amountNum < 10) {
    return res.status(400).json({ error: 'Minimum deposit amount is ₹10.' });
  }

  if (amountNum > 100000) {
    return res.status(400).json({ error: 'Maximum deposit amount is ₹1,00,000 per transaction.' });
  }

  // Unique, traceable Order ID for this deposit
  const uniqueOrderId = `LKX${Date.now()}${Math.floor(100 + Math.random() * 900)}`;

  try {
    // 1. Call ZapUPI create-order API
    const zapPayload = {
      zap_key: ZAP_KEY,
      order_id: uniqueOrderId,
      amount: String(amountNum),
      remark: `LikeX Wallet Deposit [${userEmail}]`,
      webhook_url: 'https://likex.in/api/zapupi-webhook'
    };

    const zapRes = await fetch(ZAP_CREATE_ORDER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(zapPayload)
    });

    const zapData = await zapRes.json().catch(() => ({}));

    if (!zapRes.ok || zapData.status === false || zapData.error) {
      const errorMsg = zapData.message || zapData.error || 'Failed to create order on ZapUPI gateway';
      console.error('[ZapUPI Order Error]', zapData);
      return res.status(500).json({ 
        error: errorMsg,
        details: zapData
      });
    }

    const paymentUrl = zapData.payment_url || zapData.data?.payment_url || zapData.url || '';

    // 2. Log pending transaction to Supabase wallet_transactions
    try {
      const exchangeRate = 83; // 1 USD = 83 INR
      const usdAmount = Number((amountNum / exchangeRate).toFixed(4));

      await fetch(`${SUPABASE_PROJECT_URL}/rest/v1/wallet_transactions`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        },
        body: JSON.stringify({
          id: `ORD-${uniqueOrderId}`,
          user_id: userId,
          type: 'Deposit',
          description: `Paytm Dynamic UPI Deposit [Pending] (Order: ${uniqueOrderId}) [${userEmail}]`,
          amount: usdAmount,
          balance_after: 0,
          status: 'Pending'
        })
      });
    } catch (dbErr) {
      console.warn('[Supabase Pending Log Warning]', dbErr);
    }

    return res.status(200).json({
      success: true,
      order_id: uniqueOrderId,
      amount: amountNum,
      payment_url: paymentUrl,
      raw: zapData
    });

  } catch (err) {
    console.error('[ZapUPI Order Exception]', err);
    return res.status(500).json({ error: 'Internal gateway error: ' + err.message });
  }
}
