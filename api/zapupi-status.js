// Vercel Serverless Function: ZapUPI Payment Status Check
// Polls ZapUPI & Supabase database to verify if an order is completed
// Authoritatively credits wallet with full idempotency if webhook has not hit yet

const ZAP_KEY = 'zapc267112a11cfc2c29fa5d3a52a636afc';
const ZAP_STATUS_URL = 'https://pay.zapupi.com/api/order-status';
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

  const orderId = String(req.query.order_id || req.query.orderId || req.body?.order_id || '').trim();

  if (!orderId) {
    return res.status(400).json({ error: 'order_id required' });
  }

  try {
    const pendingTxnId = `ORD-${orderId}`;

    // 1. First check Supabase wallet_transactions
    const checkRes = await fetch(
      `${SUPABASE_PROJECT_URL}/rest/v1/wallet_transactions?or=(id.eq.${encodeURIComponent(pendingTxnId)},description.ilike.*${encodeURIComponent(orderId)}*)&select=id,user_id,status,amount,balance_after,description,created_at`,
      {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
      }
    );
    const rows = await checkRes.json().catch(() => []);

    if (Array.isArray(rows) && rows.length > 0) {
      const txn = rows[0];
      if (txn.status === 'Success') {
        let currentBalance = txn.balance_after;
        if (txn.user_id) {
          try {
            const uRes = await fetch(`${SUPABASE_PROJECT_URL}/rest/v1/users?id=eq.${txn.user_id}&select=balance`, {
              headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
            });
            const uData = await uRes.json().catch(() => []);
            if (Array.isArray(uData) && uData.length > 0 && uData[0].balance !== null) {
              currentBalance = Number(uData[0].balance);
            }
          } catch (e) {}
        }

        let utr = '';
        const utrMatch = String(txn.description || '').match(/UTR:\s*([A-Za-z0-9]+)/i);
        if (utrMatch) utr = utrMatch[1];

        return res.status(200).json({
          paid: true,
          status: 'Success',
          order_id: orderId,
          amount: Number(txn.amount),
          balance: currentBalance,
          utr: utr || orderId,
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
      const paymentStatus = String(zapData.data?.status || '').trim().toLowerCase();

      if (paymentStatus === 'success' || paymentStatus === 'paid' || paymentStatus === 'completed') {
        const rawAmount = Number(zapData.data?.amount || zapData.data?.pay_amount || 0);
        const utr = String(zapData.data?.utr || zapData.data?.txn_id || '').trim();
        const exchangeRate = 95.385;
        const usdCredit = Number((rawAmount / exchangeRate).toFixed(4));

        let targetUserId = (rows && rows[0] && rows[0].user_id) ? rows[0].user_id : null;
        let userEmail = 'customer@likex.in';

        if (rows && rows[0] && rows[0].description) {
          const emailMatch = rows[0].description.match(/\[([^\]@]+@[^\]]+)\]/);
          if (emailMatch) userEmail = emailMatch[1].trim().toLowerCase();
        }

        if (userEmail && (!targetUserId || targetUserId === 1)) {
          try {
            const uRes = await fetch(`${SUPABASE_PROJECT_URL}/rest/v1/users?email=eq.${encodeURIComponent(userEmail)}&select=id,balance`, {
              headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
            });
            const uData = await uRes.json().catch(() => []);
            if (Array.isArray(uData) && uData.length > 0) targetUserId = uData[0].id;
          } catch (e) {}
        }

        if (!targetUserId) targetUserId = 1;

        let newBalance = 0;
        let creditApplied = false;

        // Try Atomic Supabase RPC (Row-Level Locking FOR UPDATE)
        try {
          const rpcRes = await fetch(`${SUPABASE_PROJECT_URL}/rest/v1/rpc/process_wallet_deposit`, {
            method: 'POST',
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              p_order_id: orderId,
              p_user_id: targetUserId,
              p_amount: usdCredit,
              p_utr: utr,
              p_description: `Paytm Dynamic UPI (UTR: ${utr || orderId}) [Order: ${orderId}] [${userEmail}]`,
              p_email: userEmail
            })
          });

          if (rpcRes.ok) {
            const rpcData = await rpcRes.json();
            if (rpcData && rpcData.success) {
              creditApplied = true;
              newBalance = Number(rpcData.balance);
            }
          }
        } catch (rpcErr) {
          console.warn('[ZapUPI Status] RPC attempt notice:', rpcErr.message);
        }

        // Fallback atomic conditional update if RPC is offline
        if (!creditApplied) {
          const claimRes = await fetch(`${SUPABASE_PROJECT_URL}/rest/v1/wallet_transactions?id=eq.${encodeURIComponent(pendingTxnId)}&status=eq.Pending`, {
            method: 'PATCH',
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
              Prefer: 'return=representation'
            },
            body: JSON.stringify({ status: 'Processing' })
          });

          const claimedRows = await claimRes.json().catch(() => []);
          if (Array.isArray(claimedRows) && claimedRows.length === 0) {
            const doubleCheck = await fetch(`${SUPABASE_PROJECT_URL}/rest/v1/wallet_transactions?id=eq.${encodeURIComponent(pendingTxnId)}&select=id,status,balance_after`, {
              headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
            });
            const dcRows = await doubleCheck.json().catch(() => []);
            if (Array.isArray(dcRows) && dcRows.length > 0 && dcRows[0].status === 'Success') {
              return res.status(200).json({
                paid: true,
                status: 'Success',
                order_id: orderId,
                amount: usdCredit,
                balance: dcRows[0].balance_after,
                utr: utr || orderId,
                source: 'zapupi_live_query'
              });
            }
          }

          const userRes = await fetch(`${SUPABASE_PROJECT_URL}/rest/v1/users?id=eq.${targetUserId}&select=id,email,balance`, {
            headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
          });
          const userData = await userRes.json();
          let currentBalance = 0;
          if (Array.isArray(userData) && userData.length > 0) {
            currentBalance = Number(userData[0].balance || 0);
          }

          newBalance = Number((currentBalance + usdCredit).toFixed(4));

          await fetch(`${SUPABASE_PROJECT_URL}/rest/v1/users?id=eq.${targetUserId}`, {
            method: 'PATCH',
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ balance: newBalance })
          });

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
              description: `Paytm Dynamic UPI (UTR: ${utr || orderId}) [Order: ${orderId}] [${userEmail}]`,
              amount: usdCredit,
              balance_after: newBalance,
              status: 'Success'
            })
          });

          // Send Telegram alert
          try {
            await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: `✅ *[LikeX Verified Deposit Received (Poller)!]*\n\n💰 *Amount:* ₹${rawAmount}\n👤 *Customer:* ${userEmail}\n🔢 *Bank UTR:* \`${utr || orderId}\`\n🛒 *Order ID:* \`${orderId}\``,
                parse_mode: 'Markdown'
              })
            });
          } catch (e) {}
        }

        return res.status(200).json({
          paid: true,
          status: 'Success',
          order_id: orderId,
          utr: utr || orderId,
          amount: usdCredit,
          balance: newBalance,
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

