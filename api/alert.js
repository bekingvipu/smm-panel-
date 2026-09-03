// Vercel Serverless Function: Multi-Channel Alert Gateway (Telegram Bot & Gmail)
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
    adminEmail = 'supporthubindia@gmail.com',
    telegramBotToken = '8874080054:AAFazn2iknlJMDppQuXlTM0UwQsYFP9Dwik',
    telegramChatId = '2057136429'
  } = body;

  const results = {
    telegram: null,
    email: null,
    timestamp: new Date().toISOString()
  };

  // Build clean message text
  let alertTitle = '🚨 LikeX SMM System Alert';
  let messageText = '';

  if (type === 'queued_order') {
    alertTitle = `🚨 [LikeX Urgent] Order #${orderId} Queued — Top-Up ${providerName}`;
    messageText = `🚨 *LikeX Queued Order Alert!*\n\n` +
      `🛒 *Order ID:* #${orderId}\n` +
      `🔌 *Target Provider:* ${providerName}\n` +
      `📦 *Service:* ${serviceName}\n` +
      `🔗 *Target Link:* ${target}\n` +
      `👥 *Quantity:* ${Number(quantity || 0).toLocaleString()}\n` +
      `💰 *Customer Paid:* ₹${customerPaid} (Wallet Deducted)\n` +
      `⚠️ *Status:* Queued (Provider balance low / pending top-up)\n\n` +
      `⚡ *Action Required:* Recharge ${providerName} and dispatch from LikeX Admin Console!`;
  } else if (type === 'test') {
    alertTitle = `🧪 [LikeX Test Alert] Live Notifications Active`;
    messageText = `🧪 *LikeX Alert System Test*\n\n` +
      `✅ *Telegram Bot:* Connected & Active\n` +
      `📧 *Gmail Address:* ${adminEmail}\n` +
      `📉 *Alert Threshold:* ₹${threshold}\n` +
      `🔌 *Monitored Providers:* JustAnotherPanel (JAP) & WorldOfSMM\n\n` +
      `⚡ You will receive instant sound alerts whenever top-up is needed!`;
  } else {
    alertTitle = `⚠️ [LikeX Alert] Low Provider Balance: ${providerName}`;
    messageText = `⚠️ *LikeX Low Balance Warning!*\n\n` +
      `🔌 *Provider:* ${providerName}\n` +
      `💰 *Current Balance:* ₹${balance}\n` +
      `📉 *Warning Limit:* ₹${threshold}\n\n` +
      `⚡ *Action:* Please refill your ${providerName} server balance to ensure zero order delays!`;
  }

  // 1. Dispatch Telegram Bot Notification
  try {
    const token = (telegramBotToken || '8874080054:AAFazn2iknlJMDppQuXlTM0UwQsYFP9Dwik').trim();
    const cleanChatId = String(telegramChatId || '2057136429').replace(/^0+/, '').trim();

    if (token && cleanChatId) {
      const tgUrl = `https://api.telegram.org/bot${token}/sendMessage`;
      const tgRes = await fetch(tgUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: cleanChatId,
          text: messageText,
          parse_mode: 'Markdown'
        })
      });
      const tgJson = await tgRes.json().catch(() => ({}));
      results.telegram = { sent: tgRes.ok, status: tgRes.status, response: tgJson };
    } else {
      results.telegram = { sent: false, error: 'Telegram Bot Token or Chat ID missing' };
    }
  } catch (err) {
    results.telegram = { sent: false, error: err.message };
  }

  // 2. Dispatch Real Email Notification (FormSubmit Gateway)
  try {
    const emailRes = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(adminEmail || 'supporthubindia@gmail.com')}`, {
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
        name: 'LikeX Automated Notification Server',
        order_id: orderId ? `#${orderId}` : 'N/A',
        provider_name: providerName,
        service_name: serviceName || 'N/A',
        customer_paid: customerPaid ? `₹${customerPaid}` : 'N/A',
        current_balance: balance ? `₹${balance}` : 'N/A',
        status: type === 'queued_order' ? 'Queued (Needs Top-Up)' : (type === 'test' ? 'Test Alert' : 'Low Balance Warning'),
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
