import { useState, useEffect } from 'react';

/**
 * Hardcoded chain metadata map.
 * Keys match the `chain` field returned by DeBank's all_token_list endpoint.
 */
const CHAIN_META = {
  eth:   { name: 'Ethereum',  founder: 'Vitalik Buterin',  color: '#627EEA' },
  matic: { name: 'Polygon',   founder: 'Sandeep Nailwal',  color: '#8247E5' },
  arb:   { name: 'Arbitrum',  founder: 'Ed Felten',        color: '#28A0F0' },
  op:    { name: 'Optimism',  founder: 'Jing Wang',        color: '#FF0420' },
  base:  { name: 'Base',      founder: 'Jesse Pollak',     color: '#0052FF' },
  bsc:   { name: 'BSC',       founder: 'CZ',               color: '#F0B90B' },
  avax:  { name: 'Avalanche', founder: 'Emin Gün Sirer',   color: '#E84142' },
  ftm:   { name: 'Fantom',    founder: 'Andre Cronje',     color: '#1969FF' },
};

/**
 * Look up chain metadata, falling back to defaults for unknown chains.
 */
function getChainMeta(chainId) {
  if (CHAIN_META[chainId]) {
    return CHAIN_META[chainId];
  }
  return {
    name: chainId.toUpperCase(),
    founder: 'Unknown',
    color: '#888888',
  };
}

/**
 * useWalletData – fetches token balances for an EVM wallet address,
 * groups them by chain, and returns sorted chain data.
 *
 * @param {string} walletAddress - EVM address (0x...)
 * @returns {{ chains: Array, loading: boolean, error: string|null }}
 */
export default function useWalletData(walletAddress) {
  const [chains, setChains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!walletAddress) {
      setChains([]);
      setError(null);
      return;
    }

    let cancelled = false;

    async function fetchTokens() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/tokens?address=${encodeURIComponent(walletAddress)}`
        );

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Server returned ${res.status}`);
        }

        const tokens = await res.json();

        if (cancelled) return;

        // Group tokens by chain
        const grouped = {};
        for (const token of tokens) {
          const chainId = token.chain;
          if (!grouped[chainId]) {
            grouped[chainId] = [];
          }
          grouped[chainId].push(token);
        }

        // Build chain objects with metadata and totals
        const chainList = Object.entries(grouped).map(([chainId, chainTokens]) => {
          const meta = getChainMeta(chainId);
          const totalUsdValue = chainTokens.reduce(
            (sum, t) => sum + (t.usd_value || 0),
            0
          );

          // Sort tokens within each chain descending by usd_value
          chainTokens.sort((a, b) => (b.usd_value || 0) - (a.usd_value || 0));

          return {
            id: chainId,
            name: meta.name,
            founder: meta.founder,
            color: meta.color,
            totalUsdValue,
            tokens: chainTokens,
          };
        });

        // Sort chains descending by total USD value
        chainList.sort((a, b) => b.totalUsdValue - a.totalUsdValue);

        setChains(chainList);
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setChains([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchTokens();

    return () => {
      cancelled = true;
    };
  }, [walletAddress]);

  return { chains, loading, error };
}
