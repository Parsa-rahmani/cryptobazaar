import React, { useMemo, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import Stall from '../scene/Stall';
import './TokenPanel.css';

/* ─── Formatters ─── */
const USD_FMT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const AMT_FMT = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4,
});

/* ─── Torch positions (4 corners of the market square) ─── */
const TORCH_POSITIONS = [
  [-6, 3, -6],
  [6, 3, -6],
  [-6, 3, 6],
  [6, 3, 6],
];

/* ─── Ground plane with cobblestone-style grid lines ─── */
function Ground() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#2C1F15" roughness={0.9} metalness={0.1} />
      </mesh>
      <gridHelper
        args={[30, 20, '#1A1209', '#1A1209']}
        position={[0, 0.005, 0]}
      />
    </group>
  );
}

/* ─── Torch point lights ─── */
function Torches() {
  return (
    <>
      {TORCH_POSITIONS.map((pos, i) => (
        <pointLight
          key={i}
          position={pos}
          color="#FF8C00"
          intensity={1.5}
          distance={12}
          decay={2}
        />
      ))}
    </>
  );
}

/* ─── Dark sky dome ─── */
function SkyDome() {
  const gradientMap = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, '#0B0520');
    gradient.addColorStop(0.5, '#131035');
    gradient.addColorStop(1, '#1A0F07');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1, 256);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  return (
    <mesh>
      <sphereGeometry args={[50, 32, 16]} />
      <meshBasicMaterial map={gradientMap} side={THREE.BackSide} />
    </mesh>
  );
}

/* ─── Stall ring ─── */
const RING_RADIUS = 7;
const MAX_STALLS = 8;

function StallRing({ chains, onStallClick }) {
  const stalls = chains.slice(0, MAX_STALLS);
  return (
    <>
      {stalls.map((chain, i) => {
        const angle = (i / MAX_STALLS) * Math.PI * 2;
        const x = Math.sin(angle) * RING_RADIUS;
        const z = Math.cos(angle) * RING_RADIUS;
        return (
          <Stall
            key={chain.id}
            position={[x, 0, z]}
            rotation={[0, angle + Math.PI, 0]}
            color={chain.color}
            chain={chain}
            onStallClick={onStallClick}
          />
        );
      })}
    </>
  );
}

/* ─── Scene contents ─── */
function SceneContents({ chains, onStallClick }) {
  return (
    <>
      <fog attach="fog" args={['#1A0F07', 10, 25]} />

      <ambientLight intensity={0.3} color="#FFF3DC" />
      <directionalLight position={[0, 10, 0]} intensity={0.4} color="#FFFFFF" />
      <Torches />

      <SkyDome />
      <Ground />

      <StallRing chains={chains} onStallClick={onStallClick} />

      <OrbitControls
        target={[0, 1, 0]}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={4}
        maxDistance={14}
        enablePan={false}
      />
    </>
  );
}

/* ─── Token detail panel (rendered outside Canvas) ─── */
function TokenPanel({ chain, onClose }) {
  if (!chain) return null;

  return (
    <div className="token-panel-overlay">
      <div className="token-panel-header">
        <div className="token-panel-title">
          <span className="token-panel-chain-name">{chain.name}</span>
          <span className="token-panel-total">
            {USD_FMT.format(chain.totalUsdValue)}
          </span>
        </div>
        <button className="token-panel-close" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="token-panel-list">
        {(chain.tokens || []).map((t, i) => (
          <div className="token-row" key={i}>
            {t.logo_url ? (
              <img className="token-logo" src={t.logo_url} alt="" />
            ) : (
              <span className="token-logo-placeholder" />
            )}
            <div className="token-info">
              <span className="token-name">{t.name || t.symbol}</span>
              <span className="token-symbol">{t.symbol}</span>
            </div>
            <div className="token-amounts">
              <div className="token-amount">{AMT_FMT.format(t.amount || 0)}</div>
              <div className="token-usd">{USD_FMT.format(t.usd_value || 0)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── BazaarScene ─── */
export default function BazaarScene({ chains = [] }) {
  const [selectedChain, setSelectedChain] = useState(null);

  const handleStallClick = useCallback((chain) => {
    setSelectedChain(chain);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedChain(null);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0A0605' }}>
      <Canvas
        camera={{ position: [0, 3, 8], fov: 60 }}
        gl={{ antialias: true }}
      >
        <SceneContents chains={chains} onStallClick={handleStallClick} />
      </Canvas>

      <TokenPanel chain={selectedChain} onClose={handleClose} />
    </div>
  );
}
