import React, { useState, useCallback } from 'react';
import { useSpring, animated } from '@react-spring/three';
import { Html } from '@react-three/drei';
import CoinPile from './CoinPile';
import Merchant from './Merchant';
import StallLabel from './StallLabel';

const DARK_WOOD = '#3D1F0A';
const LIGHT_WOOD = '#5C3010';

const USD_FMT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/* ─── Hover tooltip (rendered inside <Html>) ─── */
function HoverTooltip({ chain }) {
  const top5 = (chain.tokens || [])
    .filter((t) => t.usd_value > 0)
    .slice(0, 5);

  return (
    <div
      style={{
        background: '#1A1A1A',
        border: '1px solid #F0B90B',
        borderRadius: 6,
        padding: '8px 12px',
        color: '#FFFFFF',
        fontFamily: 'sans-serif',
        fontSize: 12,
        minWidth: 160,
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      <div style={{ fontWeight: 'bold', fontSize: 14, marginBottom: 2 }}>
        {chain.name}
      </div>
      <div style={{ color: '#CCCCCC', fontSize: 11, marginBottom: 6 }}>
        {chain.founder}
      </div>
      {top5.map((t, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 3,
          }}
        >
          {t.logo_url ? (
            <img
              src={t.logo_url}
              alt=""
              width={16}
              height={16}
              style={{ borderRadius: '50%', flexShrink: 0 }}
            />
          ) : (
            <span
              style={{
                display: 'inline-block',
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: '#333',
                flexShrink: 0,
              }}
            />
          )}
          <span style={{ color: '#DDD' }}>{t.symbol}</span>
          <span style={{ marginLeft: 'auto', color: '#F0B90B' }}>
            {USD_FMT.format(t.usd_value)}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Stall — 3D merchant booth with hover tooltip + click callback.
 *
 * Props:
 *   position     – [x, y, z] world position
 *   rotation     – [rx, ry, rz] euler rotation
 *   color        – hex string for canopy color
 *   chain        – chain data object
 *   onStallClick – callback(chain) when stall is clicked
 */
export default function Stall({ position, rotation, color, chain, onStallClick }) {
  const [hovered, setHovered] = useState(false);

  const { canopyY } = useSpring({
    canopyY: hovered ? 2.4 : 2.3,
    config: { tension: 200, friction: 20 },
  });

  const handleOver = useCallback((e) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  }, []);

  const handleOut = useCallback((e) => {
    e.stopPropagation();
    setHovered(false);
    document.body.style.cursor = 'auto';
  }, []);

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();
      if (onStallClick) onStallClick(chain);
    },
    [chain, onStallClick]
  );

  return (
    <group
      position={position}
      rotation={rotation}
      onPointerOver={handleOver}
      onPointerOut={handleOut}
      onClick={handleClick}
    >
      {/* ── Booth base ── */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[2.2, 1.2, 1]} />
        <meshStandardMaterial color={DARK_WOOD} roughness={0.85} />
      </mesh>

      {/* ── Counter ── */}
      <mesh position={[0, 1.275, -0.35]}>
        <boxGeometry args={[2.2, 0.15, 0.3]} />
        <meshStandardMaterial color={LIGHT_WOOD} roughness={0.75} />
      </mesh>

      {/* ── Back wall ── */}
      <mesh position={[0, 0.9, 0.45]}>
        <boxGeometry args={[2.2, 1.8, 0.1]} />
        <meshStandardMaterial color={DARK_WOOD} roughness={0.85} />
      </mesh>

      {/* ── Left front pole ── */}
      <mesh position={[-1.05, 1.2, -0.45]}>
        <cylinderGeometry args={[0.05, 0.05, 2, 8]} />
        <meshStandardMaterial color={DARK_WOOD} roughness={0.8} />
      </mesh>

      {/* ── Right front pole ── */}
      <mesh position={[1.05, 1.2, -0.45]}>
        <cylinderGeometry args={[0.05, 0.05, 2, 8]} />
        <meshStandardMaterial color={DARK_WOOD} roughness={0.8} />
      </mesh>

      {/* ── Canopy (animated y on hover) ── */}
      <animated.mesh
        position-x={0}
        position-y={canopyY}
        position-z={-0.1}
        rotation={[-0.15, 0, 0]}
      >
        <boxGeometry args={[2.6, 0.1, 1.4]} />
        <meshStandardMaterial color={color} roughness={0.6} metalness={0.1} />
      </animated.mesh>

      {/* ── Back pole / canopy support ── */}
      <mesh position={[0, 2.15, 0.45]}>
        <boxGeometry args={[2.2, 0.06, 0.1]} />
        <meshStandardMaterial color={DARK_WOOD} roughness={0.8} />
      </mesh>

      {/* ── Coin pile on counter surface ── */}
      <CoinPile chain={chain} position={[0, 1.35, -0.15]} />

      {/* ── Merchant standing behind the counter ── */}
      <Merchant position={[0, 1.45, 0.2]} chainColor={color} />

      {/* ── Floating label in front of / below the stall ── */}
      <StallLabel chain={chain} position={[0, 0.5, -0.8]} />

      {/* ── Hover tooltip ── */}
      {hovered && (
        <Html
          position={[0, 2.8, -0.3]}
          center
          style={{ pointerEvents: 'none' }}
          zIndexRange={[100, 0]}
        >
          <HoverTooltip chain={chain} />
        </Html>
      )}
    </group>
  );
}
