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
    const exchangeRate = 95.385; // 1 USD = 95.385 INR (Matched to LikeX Storefront)
    const usdCredit = amount / exchangeRate;
    const pendingTxnId = `ORD-${orderId}`;

    // 1. First check if already successfully credited
    const checkRes = await fetch(
      `${SUPABASE_PROJECT_URL}/rest/v1/wallet_transactions?or=(id.eq.${encodeURIComponent(pendingTxnId)},description.ilike.*${encodeURIComponent(orderId)}*)&select=id,status,user_id,balance_after`,
      {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
      }
    );
    const existingTxns = await checkRes.json();

    if (Array.isArray(existingTxns) && existingTxns.length > 0) {
      const existing = existingTxns[0];
      if (existing.status === 'Success') {
        console.log(`[ZapUPI Webhook] Order ${orderId} was already credited. Skipping duplicate.`);
        return res.status(200).json({ status: 'ok', message: 'Already processed', order_id: orderId, balance: existing.balance_after });
      }
    }

    // Resolve user email and ID from pending transaction or payload
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

    let creditApplied = false;
    let newBalance = 0;

    // 2. Try Atomic Supabase RPC (Row-Level Locking FOR UPDATE)
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
          p_utr: utr || txnId,
          p_description: `Paytm Dynamic UPI (UTR: ${utr || txnId}) [Order: ${orderId}] [${userEmail}]`,
          p_email: userEmail
        })
      });

      if (rpcRes.ok) {
        const rpcData = await rpcRes.json();
        if (rpcData && rpcData.success) {
          creditApplied = true;
          newBalance = Number(rpcData.balance);
          if (rpcData.already_processed) {
            console.log(`[ZapUPI Webhook] Order ${orderId} already processed per atomic RPC.`);
            return res.status(200).json({ status: 'ok', message: 'Already processed', order_id: orderId, balance: newBalance });
          }
        }
      }
    } catch (rpcErr) {
      console.warn('[ZapUPI Webhook] RPC attempt notice:', rpcErr.message);
    }

    // 3. Fallback conditional atomic update if RPC unavailable
    if (!creditApplied) {
      // Re-verify if another thread or worker already marked this order as Success
      const doubleCheck = await fetch(`${SUPABASE_PROJECT_URL}/rest/v1/wallet_transactions?or=(id.eq.${encodeURIComponent(pendingTxnId)},description.ilike.*${encodeURIComponent(orderId)}*)&select=id,status,balance_after`, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
      });
      const dcRows = await doubleCheck.json().catch(() => []);
      if (Array.isArray(dcRows) && dcRows.length > 0 && dcRows[0].status === 'Success') {
        console.log(`[ZapUPI Webhook] Order ${orderId} already marked Success in fallback double-check.`);
        return res.status(200).json({ status: 'ok', message: 'Already processed by concurrent worker', order_id: orderId, balance: dcRows[0].balance_after });
      }

      // Attempt conditional claim from Pending -> Processing
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
        // Re-check if another thread already finished or is currently processing
        const doubleCheck = await fetch(`${SUPABASE_PROJECT_URL}/rest/v1/wallet_transactions?or=(id.eq.${encodeURIComponent(pendingTxnId)},description.ilike.*${encodeURIComponent(orderId)}*)&select=id,status,balance_after`, {
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
        });
        const dcRows = await doubleCheck.json().catch(() => []);
        if (Array.isArray(dcRows) && dcRows.length > 0) {
          if (dcRows[0].status === 'Success') {
            return res.status(200).json({ status: 'ok', message: 'Already processed by concurrent worker', order_id: orderId, balance: dcRows[0].balance_after });
          }
        }
        // STRICT RACE-CONDITION GUARD: If status was not Pending (e.g. concurrent worker claimed it), ABORT IMMEDIATELY!
        console.log(`[ZapUPI Webhook] Order ${orderId} claim taken by concurrent worker. Aborting duplicate credit.`);
        return res.status(200).json({ status: 'ok', message: 'Currently being processed by concurrent worker', order_id: orderId });
      }

      // Fetch user balance
      const userRes = await fetch(`${SUPABASE_PROJECT_URL}/rest/v1/users?id=eq.${targetUserId}&select=id,email,balance`, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
      });
      const userData = await userRes.json();
      let currentBalance = 0;

      if (Array.isArray(userData) && userData.length > 0) {
        currentBalance = Number(userData[0].balance || 0);
        userEmail = userData[0].email || userEmail;
      }

      newBalance = Number((currentBalance + usdCredit).toFixed(4));

      // Update user balance
      await fetch(`${SUPABASE_PROJECT_URL}/rest/v1/users?id=eq.${targetUserId}`, {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ balance: newBalance })
      });

      // Upsert wallet_transaction as Success
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
    }

    // 3b. PROMOTIONAL DEPOSIT BONUS (5% for top-ups of ₹500 or more)
    const inrAmount = Math.round(Number(amount || 0));
    if (inrAmount >= 500) {
      try {
        const bonusTxnId = `BONUS-DEP-${orderId}`;
        const bCheck = await fetch(`${SUPABASE_PROJECT_URL}/rest/v1/wallet_transactions?id=eq.${encodeURIComponent(bonusTxnId)}&select=id`, {
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
        });
        const bRows = await bCheck.json().catch(() => []);
        if (Array.isArray(bRows) && bRows.length === 0) {
          const bonusInr = inrAmount * 0.05;
          const bonusUsd = Number((bonusInr / exchangeRate).toFixed(4));
          newBalance = Number((newBalance + bonusUsd).toFixed(4));

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
              id: bonusTxnId,
              user_id: targetUserId,
              type: 'Deposit Bonus',
              description: `5% Deposit Bonus on ₹${inrAmount} Top-up [Order: ${orderId}]`,
              amount: bonusUsd,
              balance_after: newBalance,
              status: 'Success'
            })
          });
          console.log(`[ZapUPI Webhook] 5% Deposit Bonus credited: ₹${bonusInr} ($${bonusUsd}) to user ${targetUserId}.`);
        }
      } catch (bErr) {
        console.warn('[ZapUPI Webhook] Deposit bonus error:', bErr);
      }
    }

    // 3c. REFERRAL BONUS (₹5 Referrer + ₹5 Customer on First Successful Top-Up of EXACTLY ₹100)
    try {
      const depCheck = await fetch(`${SUPABASE_PROJECT_URL}/rest/v1/wallet_transactions?user_id=eq.${targetUserId}&type=eq.Deposit&status=eq.Success&select=id`, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
      });
      const depRows = await depCheck.json().catch(() => []);
      const isFirstSuccessfulDeposit = Array.isArray(depRows) && depRows.length <= 1;

      if (isFirstSuccessfulDeposit) {
        // Referral bonus applies ONLY if top-up amount is EXACTLY ₹100
        if (inrAmount === 100) {
          const uRefRes = await fetch(`${SUPABASE_PROJECT_URL}/rest/v1/users?id=eq.${targetUserId}&select=id,email,password_hash`, {
            headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
          });
          const uRefData = await uRefRes.json().catch(() => []);
          if (Array.isArray(uRefData) && uRefData.length > 0) {
            let meta = {};
            try { meta = JSON.parse(uRefData[0].password_hash || '{}'); } catch(e){}
            const referrerCode = meta.referred_by || meta.referrer_code || null;

            if (referrerCode && !meta.referral_bonus_processed) {
              const refUserRes = await fetch(`${SUPABASE_PROJECT_URL}/rest/v1/users?or=(id.eq.${encodeURIComponent(referrerCode)},username.eq.${encodeURIComponent(referrerCode)},customer_code.eq.${encodeURIComponent(referrerCode)})&select=id,email,balance`, {
                headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
              });
              const refUserData = await refUserRes.json().catch(() => []);
              
              if (Array.isArray(refUserData) && refUserData.length > 0) {
                const referrerObj = refUserData[0];

                // PREVENT SELF-REFERRAL (Referrer cannot be the same user)
                if (String(referrerObj.id) !== String(targetUserId) && String(referrerObj.email).toLowerCase() !== String(userEmail).toLowerCase()) {
                  const refBonusInr = 5;
                  const refBonusUsd = Number((refBonusInr / exchangeRate).toFixed(4));

                  const refTxnCustomer = `REF-BONUS-CUST-${orderId}`;
                  const refTxnReferrer = `REF-BONUS-REF-${orderId}`;

                  // Credit Referred New Customer (₹5)
                  newBalance = Number((newBalance + refBonusUsd).toFixed(4));
                  await fetch(`${SUPABASE_PROJECT_URL}/rest/v1/users?id=eq.${targetUserId}`, {
                    method: 'PATCH',
                    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ balance: newBalance })
                  });
                  await fetch(`${SUPABASE_PROJECT_URL}/rest/v1/wallet_transactions`, {
                    method: 'POST',
                    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
                    body: JSON.stringify({
                      id: refTxnCustomer,
                      user_id: targetUserId,
                      type: 'Referral Bonus',
                      description: `Welcome Referral Bonus: ₹5 reward for first ₹100 top-up`,
                      amount: refBonusUsd,
                      balance_after: newBalance,
                      status: 'Success'
                    })
                  });

                  // Credit Referrer (₹5)
                  const currentRefBal = Number(referrerObj.balance || 0);
                  const newRefBal = Number((currentRefBal + refBonusUsd).toFixed(4));
                  await fetch(`${SUPABASE_PROJECT_URL}/rest/v1/users?id=eq.${referrerObj.id}`, {
                    method: 'PATCH',
                    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ balance: newRefBal })
                  });
                  await fetch(`${SUPABASE_PROJECT_URL}/rest/v1/wallet_transactions`, {
                    method: 'POST',
                    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
                    body: JSON.stringify({
                      id: refTxnReferrer,
                      user_id: referrerObj.id,
                      type: 'Referral Bonus',
                      description: `Referral Bonus: ₹5 reward for referred customer first ₹100 top-up`,
                      amount: refBonusUsd,
                      balance_after: newRefBal,
                      status: 'Success'
                    })
                  });

                  meta.referral_bonus_processed = true;
                  await fetch(`${SUPABASE_PROJECT_URL}/rest/v1/users?id=eq.${targetUserId}`, {
                    method: 'PATCH',
                    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password_hash: JSON.stringify(meta) })
                  });

                  console.log(`[ZapUPI Webhook] Referral Bonus ₹5 credited to both Referrer (${referrerObj.id}) and Customer (${targetUserId}).`);
                }
              }
            }
          }
        }
      }
    } catch (refErr) {
      console.warn('[ZapUPI Webhook] Referral bonus processing note:', refErr);
    }

    // 4. Also record claimed UTR to secondary ledger in users config row 999
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
    return res.status(200).json({ status: 'ok', message: 'Deposit credited successfully', order_id: orderId, balance: newBalance });

  } catch (err) {
    console.error('[ZapUPI Webhook Error]', err);
    return res.status(200).json({ status: 'error', error: err.message });
  }
}
