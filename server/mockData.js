/**
 * Mock token data for demo/testing without a DeBank API key.
 * Mirrors the shape returned by DeBank's /v1/user/all_token_list endpoint.
 * Uses CoinGecko CDN for logos (publicly accessible, no CORS issues).
 */
const MOCK_TOKENS = [
  // ── Ethereum ──
  { chain: 'eth', name: 'Ethereum',       symbol: 'ETH',   logo_url: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',   amount: 2.4531,    usd_value: 8143.28,  price: 3320.12 },
  { chain: 'eth', name: 'USD Coin',       symbol: 'USDC',  logo_url: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',      amount: 3200.00,   usd_value: 3200.00,  price: 1.00 },
  { chain: 'eth', name: 'Uniswap',        symbol: 'UNI',   logo_url: 'https://assets.coingecko.com/coins/images/12504/small/uni.jpg',      amount: 150.0,     usd_value: 1125.00,  price: 7.50 },
  { chain: 'eth', name: 'Chainlink',      symbol: 'LINK',  logo_url: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png', amount: 85.5, usd_value: 1282.50, price: 15.00 },
  { chain: 'eth', name: 'Aave',           symbol: 'AAVE',  logo_url: 'https://assets.coingecko.com/coins/images/12645/small/aave-token-round.png', amount: 5.2, usd_value: 520.00, price: 100.00 },

  // ── Polygon ──
  { chain: 'matic', name: 'Polygon',      symbol: 'MATIC', logo_url: 'https://assets.coingecko.com/coins/images/4713/small/polygon.png',  amount: 5200.0,    usd_value: 3640.00,  price: 0.70 },
  { chain: 'matic', name: 'QuickSwap',    symbol: 'QUICK', logo_url: null,   amount: 12.0,    usd_value: 480.00,   price: 40.00 },
  { chain: 'matic', name: 'Aavegotchi',   symbol: 'GHST',  logo_url: null,   amount: 300.0,   usd_value: 330.00,   price: 1.10 },

  // ── Arbitrum ──
  { chain: 'arb', name: 'Arbitrum',       symbol: 'ARB',   logo_url: 'https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg', amount: 4500.0, usd_value: 4950.00, price: 1.10 },
  { chain: 'arb', name: 'GMX',            symbol: 'GMX',   logo_url: 'https://assets.coingecko.com/coins/images/18323/small/arbit.png',   amount: 22.5,      usd_value: 787.50,   price: 35.00 },
  { chain: 'arb', name: 'Radiant Capital',symbol: 'RDNT',  logo_url: null,   amount: 8000.0,  usd_value: 320.00,   price: 0.04 },

  // ── BSC ──
  { chain: 'bsc', name: 'BNB',            symbol: 'BNB',   logo_url: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png', amount: 3.1, usd_value: 1860.00, price: 600.00 },
  { chain: 'bsc', name: 'PancakeSwap',    symbol: 'CAKE',  logo_url: 'https://assets.coingecko.com/coins/images/12632/small/pancakeswap-cake-logo.png', amount: 200.0, usd_value: 340.00, price: 1.70 },

  // ── Optimism ──
  { chain: 'op', name: 'Optimism',        symbol: 'OP',    logo_url: 'https://assets.coingecko.com/coins/images/25244/small/Optimism.png', amount: 600.0, usd_value: 1320.00, price: 2.20 },
  { chain: 'op', name: 'Velodrome',       symbol: 'VELO',  logo_url: null,   amount: 15000.0, usd_value: 225.00,   price: 0.015 },

  // ── Base ──
  { chain: 'base', name: 'Ethereum',      symbol: 'ETH',   logo_url: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',  amount: 0.15,      usd_value: 498.00,   price: 3320.00 },
  { chain: 'base', name: 'Degen',         symbol: 'DEGEN', logo_url: null,   amount: 500000,  usd_value: 75.00,    price: 0.00015 },

  // ── Avalanche ──
  { chain: 'avax', name: 'Avalanche',     symbol: 'AVAX',  logo_url: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png', amount: 18.0, usd_value: 612.00, price: 34.00 },
  { chain: 'avax', name: 'Joe',           symbol: 'JOE',   logo_url: null,   amount: 1200.0,  usd_value: 48.00,    price: 0.04 },

  // ── Fantom (dust) ──
  { chain: 'ftm', name: 'Fantom',         symbol: 'FTM',   logo_url: null,   amount: 1.2,     usd_value: 0.48,     price: 0.40 },
];

module.exports = MOCK_TOKENS;
