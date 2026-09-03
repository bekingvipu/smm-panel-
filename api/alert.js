// Vercel Serverless Function: Multi-Channel Alert Gateway (Email & WhatsApp)
// Handles: Low Provider Balance Alerts, Queued Orders Alerts & Admin Notifications

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Parse request params
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

  const {
    type = 'low_balance', // 'low_balance' | 'queued_order' | 'test'
    providerName = 'JustAnotherPanel', // 'JustAnotherPanel (JAP)' | 'WorldOfSMM'
    providerKey = 'jap',
    balance = '0.00',
    threshold = '100.00',
    orderId = '',
    serviceName = '',
    target = '',
    quantity = '',
    customerPaid = '',
    customerEmail = '',
    adminEmail = 'viplavkumar50@gmail.com',
    whatsappNumber = '7055515757',
    callmebotApiKey = ''
  } = body;

  const results = {
    email: null,
    whatsapp: null,
    timestamp: new Date().toISOString()
  };

  // Build clean message text
  let alertTitle = '🚨 LikeX SMM System Alert';
  let messageText = '';
  let emailHtml = '';

  if (type === 'queued_order') {
    alertTitle = `🚨 [LikeX Urgent] Order #${orderId} Queued — Top-Up ${providerName}`;
    messageText = `🚨 *LikeX Queued Order Alert!*\n\n` +
      `🛒 *Order ID:* #${orderId}\n` +
      `🔌 *Target Provider:* ${providerName}\n` +
      `📦 *Service:* ${serviceName}\n` +
      `🔗 *Target:* ${target}\n` +
      `👥 *Quantity:* ${Number(quantity || 0).toLocaleString()}\n` +
      `💰 *Customer Paid:* ₹${customerPaid} (Wallet Deducted)\n` +
      `⚠️ *Status:* Queued (Provider balance low / pending top-up)\n\n` +
      `⚡ *Action Required:* Please recharge ${providerName} and dispatch from LikeX Admin Console!`;

    emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.06);">
        <div style="background: linear-gradient(135deg, #6C5CE7, #4F46E5); padding: 24px 20px; color: #ffffff; text-align: center;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 800;">🚨 Order Queued for Top-Up</h1>
          <p style="margin: 6px 0 0; opacity: 0.9; font-size: 14px;">LikeX SMM Panel Automated Dispatch System</p>
        </div>
        <div style="padding: 24px 20px;">
          <div style="background: #FEF3C7; border: 1.5px solid #F59E0B; border-radius: 12px; padding: 14px 16px; margin-bottom: 20px;">
            <strong style="color: #92400E; font-size: 14px;">⚠️ Provider Balance Insufficient:</strong>
            <p style="margin: 4px 0 0; color: #B45309; font-size: 13.5px;">Customer has placed an order on LikeX and paid <strong>₹${customerPaid}</strong>. Order is queued waiting for <strong>${providerName}</strong> top-up.</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Order ID:</td>
              <td style="padding: 10px 0; font-weight: 800; color: #6C5CE7; font-family: monospace; font-size: 15px;">#${orderId}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Provider:</td>
              <td style="padding: 10px 0; font-weight: 700; color: #1e293b;">${providerName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Service:</td>
              <td style="padding: 10px 0; font-weight: 600; color: #1e293b;">${serviceName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Target Link:</td>
              <td style="padding: 10px 0; color: #0284c7; word-break: break-all;">${target}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Quantity:</td>
              <td style="padding: 10px 0; font-weight: 700; color: #1e293b;">${Number(quantity || 0).toLocaleString()}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Customer Paid:</td>
              <td style="padding: 10px 0; font-weight: 800; color: #10B981; font-size: 15px;">₹${customerPaid}</td>
            </tr>
          </table>
          <div style="margin-top: 24px; text-align: center;">
            <a href="https://likex.in/admin" style="background: #6C5CE7; color: #ffffff; padding: 12px 28px; border-radius: 10px; font-weight: 700; text-decoration: none; display: inline-block; font-size: 14px;">Open Admin Panel & Dispatch →</a>
          </div>
        </div>
      </div>
    `;
  } else {
    alertTitle = `⚠️ [LikeX Alert] Low Provider Balance: ${providerName}`;
    messageText = `⚠️ *LikeX Low Balance Alert!*\n\n` +
      `🔌 *Provider:* ${providerName}\n` +
      `💰 *Current Balance:* ₹${balance}\n` +
      `📉 *Warning Limit:* ₹${threshold}\n\n` +
      `⚡ *Action:* Please top up your ${providerName} server balance to avoid order processing delays!`;

    emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
        <div style="background: #EF4444; padding: 20px; color: #ffffff; text-align: center;">
          <h1 style="margin: 0; font-size: 20px; font-weight: 800;">⚠️ Low Provider Balance Warning</h1>
        </div>
        <div style="padding: 24px 20px;">
          <p style="font-size: 14px; color: #334155; line-height: 1.5;">
            Your provider <strong>${providerName}</strong> balance has dropped below your threshold of <strong>₹${threshold}</strong>.
          </p>
          <div style="background: #FEF2F2; border: 1px solid #FCA5A5; border-radius: 10px; padding: 14px 16px; margin: 16px 0;">
            <span style="font-size: 12px; color: #991B1B; font-weight: 700; text-transform: uppercase;">Current Live Balance:</span>
            <div style="font-size: 24px; font-weight: 900; color: #DC2626; font-family: monospace;">₹${balance}</div>
          </div>
          <p style="font-size: 13px; color: #64748b;">Please refill funds on ${providerName} to ensure uninterrupted automated order completions.</p>
        </div>
      </div>
    `;
  }

  // 1. Dispatch WhatsApp Notification (CallMeBot Gateway)
  try {
    const cleanPhone = String(whatsappNumber).replace(/[^0-9]/g, '');
    const phoneToUse = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    if (callmebotApiKey) {
      const waUrl = `https://api.callmebot.com/whatsapp.php?phone=${phoneToUse}&text=${encodeURIComponent(messageText)}&apikey=${callmebotApiKey}`;
      const waRes = await fetch(waUrl, { method: 'GET' });
      const waText = await waRes.text();
      results.whatsapp = { sent: waRes.ok, status: waRes.status, response: waText };
    } else {
      results.whatsapp = {
        sent: false,
        reason: 'CallMeBot API Key is required. Send "I allow callmebot to send me messages" to +34 941 86 08 26 on WhatsApp to get your free key.'
      };
    }
  } catch (err) {
    results.whatsapp = { sent: false, error: err.message };
  }

  // 2. Dispatch Real Email Notification (FormSubmit & Resend Fallback)
  try {
    const emailRes = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(adminEmail)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Referer': 'https://likex.in',
        'Origin': 'https://likex.in'
      },
      body: JSON.stringify({
        _subject: alertTitle,
        _template: 'table',
        name: 'LikeX Alert System',
        order_id: orderId ? `#${orderId}` : 'N/A',
        provider_name: providerName,
        service_name: serviceName || 'N/A',
        customer_paid: customerPaid ? `₹${customerPaid}` : 'N/A',
        current_balance: balance ? `₹${balance}` : 'N/A',
        status: type === 'queued_order' ? 'Queued (Needs Top-Up)' : 'Low Balance Warning',
        message: messageText
      })
    });

    const emailJson = await emailRes.json().catch(() => ({}));
    results.email = { sent: emailRes.ok, status: emailRes.status, response: emailJson };
  } catch (err) {
    results.email = { sent: false, error: err.message };
  }

  return res.status(200).json({
    success: true,
    type,
    providerName,
    results
  });
}
