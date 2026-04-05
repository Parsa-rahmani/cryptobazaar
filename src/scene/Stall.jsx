import React, { useState, useCallback, useMemo } from 'react';
import { useSpring, animated } from '@react-spring/three';
import { Html, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import CoinPile from './CoinPile';
import Merchant from './Merchant';
import StallLabel from './StallLabel';

const WOOD_COLOR = 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/wood_planks_dirt/wood_planks_dirt_diff_1k.jpg';
const WOOD_NORMAL = 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/wood_planks_dirt/wood_planks_dirt_nor_gl_1k.jpg';
const WOOD_ROUGH = 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/wood_planks_dirt/wood_planks_dirt_rough_1k.jpg';

const ROOF_COLOR = 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/roof_tiles_14/roof_tiles_14_diff_1k.jpg';
const ROOF_NORMAL = 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/roof_tiles_14/roof_tiles_14_nor_gl_1k.jpg';
const ROOF_ROUGH = 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/roof_tiles_14/roof_tiles_14_rough_1k.jpg';

function useWoodTextures() {
  const [colorMap, normalMap, roughnessMap] = useTexture([WOOD_COLOR, WOOD_NORMAL, WOOD_ROUGH]);
  useMemo(() => {
    [colorMap, normalMap, roughnessMap].forEach((t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(2, 2);
    });
  }, [colorMap, normalMap, roughnessMap]);
  return { colorMap, normalMap, roughnessMap };
}

function useRoofTextures() {
  const [colorMap, normalMap, roughnessMap] = useTexture([ROOF_COLOR, ROOF_NORMAL, ROOF_ROUGH]);
  useMemo(() => {
    [colorMap, normalMap, roughnessMap].forEach((t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(2, 1);
    });
  }, [colorMap, normalMap, roughnessMap]);
  return { colorMap, normalMap, roughnessMap };
}

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
    <StallInner
      position={position}
      rotation={rotation}
      color={color}
      chain={chain}
      onStallClick={onStallClick}
      hovered={hovered}
      canopyY={canopyY}
      handleOver={handleOver}
      handleOut={handleOut}
      handleClick={handleClick}
    />
  );
}

function StallInner({ position, rotation, color, chain, hovered, canopyY, handleOver, handleOut, handleClick }) {
  const wood = useWoodTextures();
  const roof = useRoofTextures();

  return (
    <group
      position={position}
      rotation={rotation}
      onPointerOver={handleOver}
      onPointerOut={handleOut}
      onClick={handleClick}
    >
      {/* ── Booth base ── */}
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 1.2, 1]} />
        <meshStandardMaterial map={wood.colorMap} normalMap={wood.normalMap} roughnessMap={wood.roughnessMap} roughness={1} metalness={0} />
      </mesh>

      {/* ── Counter ── */}
      <mesh position={[0, 1.275, -0.35]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.15, 0.3]} />
        <meshStandardMaterial map={wood.colorMap} normalMap={wood.normalMap} roughnessMap={wood.roughnessMap} roughness={1} metalness={0} />
      </mesh>

      {/* ── Back wall ── */}
      <mesh position={[0, 0.9, 0.45]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 1.8, 0.1]} />
        <meshStandardMaterial map={wood.colorMap} normalMap={wood.normalMap} roughnessMap={wood.roughnessMap} roughness={1} metalness={0} />
      </mesh>

      {/* ── Left front pole ── */}
      <mesh position={[-1.05, 1.2, -0.45]} castShadow receiveShadow>
        <cylinderGeometry args={[0.05, 0.05, 2, 8]} />
        <meshStandardMaterial map={wood.colorMap} normalMap={wood.normalMap} roughnessMap={wood.roughnessMap} roughness={1} metalness={0} />
      </mesh>

      {/* ── Right front pole ── */}
      <mesh position={[1.05, 1.2, -0.45]} castShadow receiveShadow>
        <cylinderGeometry args={[0.05, 0.05, 2, 8]} />
        <meshStandardMaterial map={wood.colorMap} normalMap={wood.normalMap} roughnessMap={wood.roughnessMap} roughness={1} metalness={0} />
      </mesh>

      {/* ── Canopy (animated y on hover) — roof tiles tinted with chain color ── */}
      <animated.mesh
        position-x={0}
        position-y={canopyY}
        position-z={-0.1}
        rotation={[-0.15, 0, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[2.6, 0.1, 1.4]} />
        <meshStandardMaterial
          map={roof.colorMap}
          normalMap={roof.normalMap}
          roughnessMap={roof.roughnessMap}
          roughness={1}
          metalness={0}
          color={color}
        />
      </animated.mesh>

      {/* ── Back pole / canopy support ── */}
      <mesh position={[0, 2.15, 0.45]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.06, 0.1]} />
        <meshStandardMaterial map={wood.colorMap} normalMap={wood.normalMap} roughnessMap={wood.roughnessMap} roughness={1} metalness={0} />
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
