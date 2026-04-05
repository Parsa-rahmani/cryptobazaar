require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());

app.get('/api/tokens', async (req, res) => {
  const { address } = req.query;

  if (!address) {
    return res.status(400).json({ error: 'Missing "address" query parameter' });
  }

  const apiKey = process.env.DEBANK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'DEBANK_API_KEY not configured' });
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
});
