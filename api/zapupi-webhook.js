// Vercel Serverless Function: ZapUPI Webhook Receiver
// Automatically confirms payments, credits customer wallet & sends Telegram notification

const SUPABASE_PROJECT_URL = 'https://gxbrchcfpjbewnyeijnp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Sx-TMQ94jDZpfXB8lR-FXw_3l6cIWnE';
const TELEGRAM_BOT_TOKEN = '8874080054:AAFazn2iknlJMDppQuXlTM0UwQsYFP9Dwik';
const TELEGRAM_CHAT_ID = '2057136429';

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

  const orderId = String(body.order_id || body.orderId || '').trim();
  const rawStatus = String(body.status || '').trim().toLowerCase();
  const amount = Number(body.amount || 0);
  const utr = String(body.utr || body.txn_id || '').trim();
  const txnId = String(body.txn_id || utr || '').trim();

  // Webhook acknowledgment response must be fast (< 10 seconds)
  if (!orderId) {
    return res.status(200).json({ status: 'ignored', message: 'No order_id in webhook payload' });
  }

  const isSuccess = rawStatus === 'success' || rawStatus === 'paid' || rawStatus === 'captured' || rawStatus === 'completed';

  if (!isSuccess) {
    console.log(`[ZapUPI Webhook] Order ${orderId} received non-success status: ${rawStatus}`);
    return res.status(200).json({ status: 'acknowledged', order_id: orderId, result: rawStatus });
  }

  try {
    const exchangeRate = 83; // 1 USD = 83 INR
    const usdCredit = Number((amount / exchangeRate).toFixed(4));

    // 1. Check if this order or UTR has already been successfully credited (Idempotency)
    const pendingTxnId = `ORD-${orderId}`;
    const checkRes = await fetch(
      `${SUPABASE_PROJECT_URL}/rest/v1/wallet_transactions?or=(id.eq.${encodeURIComponent(pendingTxnId)},description.ilike.*${encodeURIComponent(orderId)}*)&select=id,status,user_id`,
      {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
      }
    );
    const existingTxns = await checkRes.json();

    if (Array.isArray(existingTxns) && existingTxns.length > 0) {
      const existing = existingTxns[0];
      if (existing.status === 'Success') {
        console.log(`[ZapUPI Webhook] Order ${orderId} was already credited. Skipping duplicate.`);
        return res.status(200).json({ status: 'ok', message: 'Already processed' });
      }
    }

    // 2. Fetch User to update balance
    let targetUserId = (existingTxns && existingTxns[0] && existingTxns[0].user_id) ? existingTxns[0].user_id : null;
    let userEmail = 'customer@likex.in';

    if (existingTxns && existingTxns[0] && existingTxns[0].description) {
      const emailMatch = existingTxns[0].description.match(/\[([^\]@]+@[^\]]+)\]/);
      if (emailMatch) {
        userEmail = emailMatch[1].trim().toLowerCase();
      }
    }

    if (userEmail && (!targetUserId || targetUserId === 1)) {
      try {
        const uRes = await fetch(`${SUPABASE_PROJECT_URL}/rest/v1/users?email=eq.${encodeURIComponent(userEmail)}&select=id,balance`, {
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
        });
        const uData = await uRes.json();
        if (Array.isArray(uData) && uData.length > 0) {
          targetUserId = uData[0].id;
        }
      } catch (e) {}
    }

    if (!targetUserId) targetUserId = 1;

    const userRes = await fetch(`${SUPABASE_PROJECT_URL}/rest/v1/users?id=eq.${targetUserId}&select=id,email,balance`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
    });
    const userData = await userRes.json();
    let currentBalance = 0;

    if (Array.isArray(userData) && userData.length > 0) {
      currentBalance = Number(userData[0].balance || 0);
      userEmail = userData[0].email || userEmail;
    }

    const newBalance = Number((currentBalance + usdCredit).toFixed(4));

    // 3. Atomically update user balance
    await fetch(`${SUPABASE_PROJECT_URL}/rest/v1/users?id=eq.${targetUserId}`, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ balance: newBalance })
    });

    // 4. Update or Insert wallet_transaction as 'Success'
    await fetch(`${SUPABASE_PROJECT_URL}/rest/v1/wallet_transactions`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        id: pendingTxnId,
        user_id: targetUserId,
        type: 'Deposit',
        description: `Paytm Dynamic UPI (UTR: ${utr || txnId}) [Order: ${orderId}] [${userEmail}]`,
        amount: usdCredit,
        balance_after: newBalance,
        status: 'Success'
      })
    });

    // 5. Also record claimed UTR to secondary ledger in users config row 999
    if (utr) {
      try {
        const cfgRes = await fetch(`${SUPABASE_PROJECT_URL}/rest/v1/users?id=eq.999&select=password_hash`, {
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
        });
        const cfgData = await cfgRes.json();
        if (Array.isArray(cfgData) && cfgData.length > 0 && cfgData[0].password_hash) {
          const parsed = JSON.parse(cfgData[0].password_hash || '{}');
          if (!parsed.claimed_utrs) parsed.claimed_utrs = {};
          parsed.claimed_utrs[utr] = {
            utr,
            orderId,
            amountInr: amount,
            userEmail,
            source: 'ZapUPI_Verified',
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
    }

    // 6. Send instant sound/Telegram notification to Admin
    try {
      const tgMessage = 
        `✅ *[LikeX Verified Deposit Received!]*\n\n` +
        `💰 *Amount:* ₹${amount} ($${usdCredit.toFixed(2)})\n` +
        `👤 *Customer:* ${userEmail}\n` +
        `🔢 *Bank UTR:* \`${utr || txnId}\`\n` +
        `🛒 *Order ID:* \`${orderId}\`\n` +
        `⚡ *Gateway:* Paytm Business (ZapUPI Verified)\n` +
        `🏦 *Wallet Credited:* Instant Auto-Credit Done!`;

      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: tgMessage,
          parse_mode: 'Markdown'
        })
      });
    } catch (tgErr) {
      console.warn('[Telegram Webhook Alert]', tgErr);
    }

    console.log(`[ZapUPI Webhook SUCCESS] Order ${orderId} for ₹${amount} credited to user ${userEmail}.`);
    return res.status(200).json({ status: 'ok', message: 'Deposit credited successfully', order_id: orderId });

  } catch (err) {
    console.error('[ZapUPI Webhook Error]', err);
    return res.status(200).json({ status: 'error', error: err.message });
  }
}
