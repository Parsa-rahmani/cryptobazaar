import React, { useState, useCallback, useMemo } from 'react';
import useWalletData from './hooks/useWalletData';
import BazaarScene from './components/BazaarScene';
import './App.css';

/* ─── Validate EVM address: 42 chars, starts with 0x, hex ─── */
function isValidAddress(addr) {
  return /^0x[0-9a-fA-F]{40}$/.test(addr);
}

/* ─── Ember particles (12 floating embers) ─── */
function Embers() {
  return (
    <div className="ember-container">
      {Array.from({ length: 12 }, (_, i) => (
        <div key={i} className="ember" />
      ))}
    </div>
  );
}

/* ─── Input screen ─── */
function InputScreen({ onSubmit }) {
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const trimmed = address.trim();
      if (!isValidAddress(trimmed)) {
        setError('Enter a valid 0x… EVM address (42 hex characters)');
        return;
      }
      setError('');
      onSubmit(trimmed);
    },
    [address, onSubmit]
  );

  return (
    <div className="input-screen">
      <h1 className="input-title">The Crypto Bazaar</h1>
      <p className="input-subtitle">
        Every chain has a merchant. What do they hold for you?
      </p>
      <form className="input-form" onSubmit={handleSubmit}>
        <input
          className={`input-field${error ? ' error' : ''}`}
          type="text"
          placeholder="Paste your EVM wallet address"
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            if (error) setError('');
          }}
          spellCheck={false}
          autoComplete="off"
        />
        <div className="input-error">{error}</div>
        <button className="input-button" type="submit">
          Enter the Bazaar
        </button>
      </form>
    </div>
  );
}

/* ─── Loading screen ─── */
function LoadingScreen() {
  return (
    <div className="loading-screen">
      <Embers />
      <div className="loading-torch" />
      <div className="loading-text">
        The merchants are counting your gold…
      </div>
    </div>
  );
}

/* ─── Scene screen ─── */
function SceneScreen({ chains, onReset }) {
  const isEmpty = useMemo(
    () => chains.every((c) => c.totalUsdValue < 0.01),
    [chains]
  );

  return (
    <div className="scene-wrapper">
      <button className="back-button" onClick={onReset}>
        ← New Address
      </button>

      <BazaarScene chains={chains} />

      {isEmpty && (
        <div className="empty-overlay">
          <div className="empty-text">
            Your coinpurse appears empty, traveler.
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── App ─── */
export default function App() {
  const [walletAddress, setWalletAddress] = useState('');
  const { chains, loading, error } = useWalletData(walletAddress);

  // Derive app state
  const appState = useMemo(() => {
    if (!walletAddress) return 'input';
    if (loading) return 'loading';
    return 'scene';
  }, [walletAddress, loading]);

  const handleSubmit = useCallback((addr) => {
    setWalletAddress(addr);
  }, []);

  const handleReset = useCallback(() => {
    setWalletAddress('');
  }, []);

  if (appState === 'input') {
    return <InputScreen onSubmit={handleSubmit} />;
  }

  if (appState === 'loading') {
    return <LoadingScreen />;
  }

  // Scene state — show error as overlay if fetch failed
  return (
    <>
      <SceneScreen chains={chains} onReset={handleReset} />
      {error && (
        <div className="empty-overlay" style={{ zIndex: 200 }}>
          <div className="empty-text" style={{ color: '#CC3333' }}>
            {error}
          </div>
        </div>
      )}
    </>
  );
}
