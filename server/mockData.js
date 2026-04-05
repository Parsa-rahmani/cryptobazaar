/**
 * Mock token data for demo/testing without a DeBank API key.
 * Mirrors the shape returned by DeBank's /v1/user/all_token_list endpoint.
 */
const MOCK_TOKENS = [
  // ── Ethereum ──
  { chain: 'eth', name: 'Ethereum',       symbol: 'ETH',   logo_url: 'https://static.debank.com/image/eth_token/logo_url/eth/935ae4725d9024126e4b02672d668532.png',   amount: 2.4531,    usd_value: 8143.28,  price: 3320.12 },
  { chain: 'eth', name: 'USD Coin',       symbol: 'USDC',  logo_url: 'https://static.debank.com/image/eth_token/logo_url/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48/fffcd27b9efff5a86ab942084c05924d.png', amount: 3200.00, usd_value: 3200.00, price: 1.00 },
  { chain: 'eth', name: 'Uniswap',        symbol: 'UNI',   logo_url: 'https://static.debank.com/image/eth_token/logo_url/0x1f9840a85d5af5bf1d1762f925bdaddc4201f984/fcee0c46fc9864f4a5dc2de33d15d7a9.png', amount: 150.0, usd_value: 1125.00, price: 7.50 },
  { chain: 'eth', name: 'Chainlink',      symbol: 'LINK',  logo_url: 'https://static.debank.com/image/eth_token/logo_url/0x514910771af9ca656af840dff83e8264ecf986ca/69425617db0ef93a7c21c4f9b81c7ca5.png', amount: 85.5,  usd_value: 1282.50, price: 15.00 },
  { chain: 'eth', name: 'Aave',           symbol: 'AAVE',  logo_url: 'https://static.debank.com/image/eth_token/logo_url/0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9/7baf403c819f679dc1f18b5dae3e0360.png', amount: 5.2,   usd_value: 520.00,  price: 100.00 },

  // ── Polygon ──
  { chain: 'matic', name: 'Polygon',      symbol: 'MATIC', logo_url: 'https://static.debank.com/image/matic_token/logo_url/matic/6f5a6b6f0732a7a235131bd7804d357c.png',   amount: 5200.0,  usd_value: 3640.00,  price: 0.70 },
  { chain: 'matic', name: 'QuickSwap',    symbol: 'QUICK', logo_url: null,   amount: 12.0,    usd_value: 480.00,   price: 40.00 },
  { chain: 'matic', name: 'Aavegotchi',   symbol: 'GHST',  logo_url: null,   amount: 300.0,   usd_value: 330.00,   price: 1.10 },

  // ── Arbitrum ──
  { chain: 'arb', name: 'Arbitrum',       symbol: 'ARB',   logo_url: 'https://static.debank.com/image/arb_token/logo_url/0x912ce59144191c1204e64559fe8253a0e49e6548/f4a1ec8656e3fce1abeb783922b9b7e5.png', amount: 4500.0, usd_value: 4950.00, price: 1.10 },
  { chain: 'arb', name: 'GMX',            symbol: 'GMX',   logo_url: null,   amount: 22.5,    usd_value: 787.50,   price: 35.00 },
  { chain: 'arb', name: 'Radiant Capital',symbol: 'RDNT',  logo_url: null,   amount: 8000.0,  usd_value: 320.00,   price: 0.04 },

  // ── BSC ──
  { chain: 'bsc', name: 'BNB',            symbol: 'BNB',   logo_url: 'https://static.debank.com/image/bsc_token/logo_url/bsc/8bfdeadcca1d20fa85d5e5f0e1a5e20a.png',   amount: 3.1,     usd_value: 1860.00,  price: 600.00 },
  { chain: 'bsc', name: 'PancakeSwap',    symbol: 'CAKE',  logo_url: null,   amount: 200.0,   usd_value: 340.00,   price: 1.70 },

  // ── Optimism ──
  { chain: 'op', name: 'Optimism',        symbol: 'OP',    logo_url: 'https://static.debank.com/image/op_token/logo_url/0x4200000000000000000000000000000000000042/95832bb6e8e98c8a2260e72f2e72bbb7.png', amount: 600.0, usd_value: 1320.00, price: 2.20 },
  { chain: 'op', name: 'Velodrome',       symbol: 'VELO',  logo_url: null,   amount: 15000.0, usd_value: 225.00,   price: 0.015 },

  // ── Base ──
  { chain: 'base', name: 'Ethereum',      symbol: 'ETH',   logo_url: 'https://static.debank.com/image/eth_token/logo_url/eth/935ae4725d9024126e4b02672d668532.png',   amount: 0.15,    usd_value: 498.00,   price: 3320.00 },
  { chain: 'base', name: 'Degen',         symbol: 'DEGEN', logo_url: null,   amount: 500000,  usd_value: 75.00,    price: 0.00015 },

  // ── Avalanche ──
  { chain: 'avax', name: 'Avalanche',     symbol: 'AVAX',  logo_url: 'https://static.debank.com/image/avax_token/logo_url/avax/0b9c84359c84d6bdd5bfda9c2d4c4a82.png', amount: 18.0, usd_value: 612.00, price: 34.00 },
  { chain: 'avax', name: 'Joe',           symbol: 'JOE',   logo_url: null,   amount: 1200.0,  usd_value: 48.00,    price: 0.04 },

  // ── Fantom (dust) ──
  { chain: 'ftm', name: 'Fantom',         symbol: 'FTM',   logo_url: null,   amount: 1.2,     usd_value: 0.48,     price: 0.40 },
];

module.exports = MOCK_TOKENS;
