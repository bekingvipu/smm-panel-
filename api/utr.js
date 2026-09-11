// Vercel Serverless Function: Legacy UTR Status Checker & Anti-Fraud Protection
// Manual direct claiming disabled - All payments are verified via ZapUPI Gateway

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

  const rawUtr = body.utr || '';
  const cleanUtr = String(rawUtr).trim().replace(/[^0-9]/g, '');

  if (!/^\d{12}$/.test(cleanUtr)) {
    return res.status(400).json({ error: 'Invalid UTR format. Exactly 12 numeric digits required.' });
  }

  const utrPrimaryId = `UTR-${cleanUtr}`;

  try {
    // Check if UTR has already been claimed/credited
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

    // Direct manual claiming without ZapUPI / Paytm verification is strictly blocked
    return res.status(200).json({
      claimed: false,
      message: 'Unverified manual UTR claiming is disabled. Please deposit using Paytm Dynamic UPI.'
    });

  } catch (error) {
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}
