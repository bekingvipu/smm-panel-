// Vercel Serverless Function to proxy JustAnotherPanel (JAP) API with CORS
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const JAP_API_URL = 'https://justanotherpanel.com/api/v2';
  const JAP_API_KEY = '30265a24da9de364919a246b151c4a63';

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

  const formData = new URLSearchParams();
  formData.append('key', JAP_API_KEY);
  formData.append('action', action);

  if (paramsObj.service) formData.append('service', String(paramsObj.service));
  if (paramsObj.link) formData.append('link', String(paramsObj.link));
  if (paramsObj.quantity) formData.append('quantity', String(paramsObj.quantity));
  if (paramsObj.order) formData.append('order', String(paramsObj.order));
  if (paramsObj.refill) formData.append('refill', String(paramsObj.refill));

  try {
    const upstreamResponse = await fetch(JAP_API_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (compatible; SMMPro/2.0)'
      }
    });

    const data = await upstreamResponse.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to communicate with JustAnotherPanel API: ' + error.message });
  }
}
