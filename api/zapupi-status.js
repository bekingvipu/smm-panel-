// Vercel Serverless Function: ZapUPI Payment Status Check
// Polls ZapUPI & Supabase database to verify if an order is completed

const ZAP_KEY = 'zapc267112a11cfc2c29fa5d3a52a636afc';
const ZAP_STATUS_URL = 'https://pay.zapupi.com/api/order-status';
const SUPABASE_PROJECT_URL = 'https://gxbrchcfpjbewnyeijnp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Sx-TMQ94jDZpfXB8lR-FXw_3l6cIWnE';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const orderId = String(req.query.order_id || req.query.orderId || req.body?.order_id || '').trim();

  if (!orderId) {
    return res.status(400).json({ error: 'order_id required' });
  }

  try {
    // 1. First check Supabase wallet_transactions
    const checkRes = await fetch(
      `${SUPABASE_PROJECT_URL}/rest/v1/wallet_transactions?or=(id.eq.ORD-${encodeURIComponent(orderId)},description.ilike.*${encodeURIComponent(orderId)}*)&select=id,status,amount,description,created_at`,
      {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
      }
    );
    const rows = await checkRes.json();

    if (Array.isArray(rows) && rows.length > 0) {
      const txn = rows[0];
      if (txn.status === 'Success') {
        return res.status(200).json({
          paid: true,
          status: 'Success',
          order_id: orderId,
          amount: txn.amount,
          message: 'Payment completed and wallet credited.'
        });
      }
    }

    // 2. Query ZapUPI order-status API directly as backup
    try {
      const zapStatusRes = await fetch(ZAP_STATUS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zap_key: ZAP_KEY,
          order_id: orderId
        })
      });

      const zapData = await zapStatusRes.json().catch(() => ({}));
      const zapStatus = String(zapData.status || zapData.data?.status || '').toLowerCase();

      if (zapStatus === 'success' || zapStatus === 'paid' || zapStatus === 'completed') {
        // Trigger credit via webhook handler logic or return paid
        return res.status(200).json({
          paid: true,
          status: 'Success',
          order_id: orderId,
          utr: zapData.utr || zapData.data?.utr || '',
          amount: zapData.amount || zapData.data?.amount || 0,
          source: 'zapupi_live_query'
        });
      }
    } catch (e) {
      console.warn('[ZapUPI Poll Check Error]', e);
    }

    return res.status(200).json({
      paid: false,
      status: 'Pending',
      order_id: orderId,
      message: 'Payment not completed yet.'
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
