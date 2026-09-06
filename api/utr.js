// Vercel Serverless Function for Centralized Anti-Fraud UPI UTR Verification
const SUPABASE_PROJECT_URL = 'https://gxbrchcfpjbewnyeijnp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Sx-TMQ94jDZpfXB8lR-FXw_3l6cIWnE';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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

  const action = body.action || 'check';
  const rawUtr = body.utr || '';
  const amount = Number(body.amount || 0);
  const email = String(body.email || 'guest@likex.in').trim().toLowerCase();

  const cleanUtr = String(rawUtr).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

  if (!cleanUtr || cleanUtr.length < 8) {
    return res.status(400).json({ error: 'Invalid UTR format. Minimum 8 characters required.' });
  }

  const utrPrimaryId = `UTR-${cleanUtr}`;

  try {
    // 1. Check if UTR is already in wallet_transactions
    const checkRes = await fetch(
      `${SUPABASE_PROJECT_URL}/rest/v1/wallet_transactions?or=(id.eq.${encodeURIComponent(utrPrimaryId)},description.ilike.*${encodeURIComponent(cleanUtr)}*)&select=id,type,description,amount,created_at`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    const existingTxns = await checkRes.json();
    if (Array.isArray(existingTxns) && existingTxns.length > 0) {
      return res.status(200).json({
        claimed: true,
        record: existingTxns[0],
        message: 'This UTR has already been claimed.'
      });
    }

    // If only checking status, return not claimed
    if (action === 'check') {
      return res.status(200).json({ claimed: false });
    }

    // 2. Action is 'claim': Atomic database insertion using primary key
    const insertRes = await fetch(`${SUPABASE_PROJECT_URL}/rest/v1/wallet_transactions`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({
        id: utrPrimaryId,
        user_id: 999,
        type: 'Deposit',
        description: `Razorpay UPI Deposit (UTR: ${cleanUtr}) [${email}]`,
        amount: amount > 0 ? (amount / 83) : 0.12,
        balance_after: 0,
        status: 'Success'
      })
    });

    const insertData = await insertRes.json();

    // Check for PostgreSQL 23505 duplicate key violation
    if (insertData && (insertData.code === '23505' || insertRes.status === 409)) {
      return res.status(200).json({
        claimed: true,
        error: 'Duplicate UTR detected. This transaction was already redeemed on another device.'
      });
    }

    // 3. Also update config row 999 in users table as secondary ledger
    try {
      const cfgRes = await fetch(`${SUPABASE_PROJECT_URL}/rest/v1/users?id=eq.999&select=password_hash`, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
      });
      const cfgData = await cfgRes.json();
      if (Array.isArray(cfgData) && cfgData.length > 0 && cfgData[0].password_hash) {
        const parsed = JSON.parse(cfgData[0].password_hash || '{}');
        if (!parsed.claimed_utrs) parsed.claimed_utrs = {};
        parsed.claimed_utrs[cleanUtr] = {
          utr: cleanUtr,
          amountInr: amount,
          email: email,
          claimedAt: new Date().toISOString()
        };
        await fetch(`${SUPABASE_PROJECT_URL}/rest/v1/users?id=eq.999`, {
          method: 'PATCH',
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ password_hash: JSON.stringify(parsed) })
        });
      }
    } catch (e) {}

    return res.status(200).json({
      success: true,
      claimed: false,
      utr: cleanUtr,
      message: 'UTR verified and locked successfully.'
    });

  } catch (error) {
    return res.status(500).json({ error: 'Server error during UTR verification: ' + error.message });
  }
}
