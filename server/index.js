require('dotenv').config();
const express = require('express');
const cors = require('cors');
const MOCK_TOKENS = require('./mockData');

const app = express();
const PORT = 3001;

app.use(cors());

app.get('/api/tokens', async (req, res) => {
  const { address } = req.query;

  if (!address) {
    return res.status(400).json({ error: 'Missing "address" query parameter' });
  }

  const apiKey = process.env.DEBANK_API_KEY;

  // If no API key or key is placeholder, return mock data
  if (!apiKey || apiKey === 'your_key_here') {
    console.log(`[mock] Returning demo data for ${address}`);
    return res.json(MOCK_TOKENS);
  }

  try {
    const url = `https://pro-openapi.debank.com/v1/user/all_token_list?id=${encodeURIComponent(address)}&is_all=false`;
    const response = await fetch(url, {
      headers: { AccessKey: apiKey },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `DeBank API returned ${response.status}` });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('DeBank API error:', err);
    res.status(502).json({ error: 'Failed to fetch from DeBank API' });
  }
});

app.listen(PORT, () => {
  console.log(`Crypto Bazaar proxy server running on http://localhost:${PORT}`);
  if (!process.env.DEBANK_API_KEY || process.env.DEBANK_API_KEY === 'your_key_here') {
    console.log('⚡ Running in DEMO MODE (mock data). Set DEBANK_API_KEY in .env for real data.');
  }
});
