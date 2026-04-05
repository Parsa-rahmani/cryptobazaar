import React, { useMemo, useRef, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

/* ─── Tier thresholds ─── */
function getTier(totalUsdValue) {
  if (totalUsdValue >= 10_000) return 'whale';
  if (totalUsdValue >= 1_000)  return 'large';
  if (totalUsdValue >= 100)    return 'medium';
  if (totalUsdValue >= 1)      return 'small';
  return 'dust';
}

const TIER_CONFIG = {
  dust:   { count: 1,  color: '#888888', emissive: '#000000', emissiveIntensity: 0,   spread: 0,    light: null },
  small:  { count: 4,  color: '#F0B90B', emissive: '#F0B90B', emissiveIntensity: 0.1, spread: 0,    light: null },
  medium: { count: 9,  color: '#F0B90B', emissive: '#F0B90B', emissiveIntensity: 0.2, spread: 0.05, light: null },
  large:  { count: 16, color: '#FFD000', emissive: '#FFD000', emissiveIntensity: 0.4, spread: 0.05, light: { intensity: 0.5, color: '#FFD700' } },
  whale:  { count: 25, color: '#FFD000', emissive: '#FFD000', emissiveIntensity: 0.8, spread: 0.12, light: { intensity: 1.2, color: '#FFD700' } },
};

const COIN_RADIUS = 0.18;
const COIN_HEIGHT = 0.04;
const COIN_SEGMENTS = 16;

/* ─── Tier ordering for bob/animation checks ─── */
const TIER_ORDER = { dust: 0, small: 1, medium: 2, large: 3, whale: 4 };
const isMediumPlus = (tier) => TIER_ORDER[tier] >= TIER_ORDER.medium;

/* ─── Seeded pseudo-random for deterministic layouts ─── */
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* ─── Animated sparkle sphere (orbits the pile) ─── */
function AnimatedSparkle({ basePos, phaseOffset }) {
  const ref = useRef();
  const orbitRadius = 0.35;

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + phaseOffset;
    ref.current.position.x = basePos[0] + Math.sin(t * 0.8) * orbitRadius;
    ref.current.position.y = basePos[1] + Math.sin(t * 1.2) * 0.15;
    ref.current.position.z = basePos[2] + Math.cos(t * 0.8) * orbitRadius;
  });

  return (
    <mesh ref={ref} position={basePos}>
      <sphereGeometry args={[0.03, 8, 8]} />
      <meshStandardMaterial
        color="#FFFACD"
        emissive="#FFD700"
        emissiveIntensity={1.5}
        toneMapped={false}
      />
    </mesh>
  );
}

/* ─── Sparkle group for whale tier ─── */
function Sparkles({ count = 8, seed = 42 }) {
  const sparkleData = useMemo(() => {
    const rand = seededRandom(seed);
    return Array.from({ length: count }, (_, i) => ({
      basePos: [
        (rand() - 0.5) * 0.8,
        rand() * 0.6 + 0.3,
        (rand() - 0.5) * 0.8,
      ],
      phaseOffset: (i / count) * Math.PI * 2,
    }));
  }, [count, seed]);

  return (
    <>
      {sparkleData.map((s, i) => (
        <AnimatedSparkle key={i} basePos={s.basePos} phaseOffset={s.phaseOffset} />
      ))}
    </>
  );
}

/* ─── Top coin with slow rotation ─── */
function SpinningCoin({ position, materialProps }) {
  const ref = useRef();

  useFrame(() => {
    ref.current.rotation.y += 0.005;
  });

  return (
    <mesh ref={ref} position={position}>
      <cylinderGeometry args={[COIN_RADIUS, COIN_RADIUS, COIN_HEIGHT, COIN_SEGMENTS]} />
      <meshStandardMaterial {...materialProps} />
    </mesh>
  );
}

/* ─── Error boundary to catch texture load failures ─── */
class TextureErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

/* ─── Single coin with optional logo texture on top face ─── */
function LogoCoin({ position, materialProps, logoUrl, spinning }) {
  const fallback = spinning
    ? <SpinningCoin position={position} materialProps={materialProps} />
    : <PlainCoin position={position} materialProps={materialProps} />;

  return (
    <TextureErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <LogoCoinInner position={position} materialProps={materialProps} logoUrl={logoUrl} spinning={spinning} />
      </Suspense>
    </TextureErrorBoundary>
  );
}

function LogoCoinInner({ position, materialProps, logoUrl, spinning }) {
  const ref = useRef();
  const texture = useTexture(logoUrl);

  useFrame(() => {
    if (spinning && ref.current) {
      ref.current.rotation.y += 0.005;
    }
  });

  return (
    <mesh ref={ref} position={position}>
      <cylinderGeometry args={[COIN_RADIUS, COIN_RADIUS, COIN_HEIGHT, COIN_SEGMENTS]} />
      <meshStandardMaterial attach="material-0" {...materialProps} />
      <meshStandardMaterial
        attach="material-1"
        map={texture}
        roughness={0.4}
        metalness={0.6}
      />
      <meshStandardMaterial attach="material-2" {...materialProps} />
    </mesh>
  );
}

function PlainCoin({ position, materialProps }) {
  return (
    <mesh position={position}>
      <cylinderGeometry args={[COIN_RADIUS, COIN_RADIUS, COIN_HEIGHT, COIN_SEGMENTS]} />
      <meshStandardMaterial {...materialProps} />
    </mesh>
  );
}

/* ─── CoinPile ─── */
export default function CoinPile({ chain, position = [0, 0, 0] }) {
  const { totalUsdValue = 0, tokens = [] } = chain || {};
  const tier = getTier(totalUsdValue);
  const config = TIER_CONFIG[tier];
  const groupRef = useRef();
  const baseY = position[1] || 0;
  const shouldBob = isMediumPlus(tier);

  // Gentle bob for medium+ tiers
  useFrame(({ clock }) => {
    if (shouldBob && groupRef.current) {
      groupRef.current.position.y =
        baseY + Math.sin(clock.elapsedTime) * 0.02;
    }
  });

  const top3Logos = useMemo(() => {
    return tokens
      .filter((t) => t.logo_url && t.usd_value > 0)
      .sort((a, b) => (b.usd_value || 0) - (a.usd_value || 0))
      .slice(0, 3)
      .map((t) => t.logo_url);
  }, [tokens]);

  const coins = useMemo(() => {
    const rand = seededRandom(7919);
    const result = [];
    for (let i = 0; i < config.count; i++) {
      const offsetX = config.spread > 0 ? (rand() - 0.5) * 2 * config.spread : 0;
      const offsetZ = config.spread > 0 ? (rand() - 0.5) * 2 * config.spread : 0;
      const y = COIN_HEIGHT / 2 + i * COIN_HEIGHT;
      result.push({ position: [offsetX, y, offsetZ], index: i });
    }
    return result;
  }, [config.count, config.spread]);

  const materialProps = useMemo(
    () => ({
      color: config.color,
      emissive: config.emissive,
      emissiveIntensity: config.emissiveIntensity,
      roughness: 0.35,
      metalness: 0.8,
    }),
    [config]
  );

  const topCoinIndices = useMemo(() => {
    const total = config.count;
    const logoCount = Math.min(top3Logos.length, 3);
    const indices = new Map();
    for (let l = 0; l < logoCount; l++) {
      indices.set(total - 1 - l, top3Logos[l]);
    }
    return indices;
  }, [config.count, top3Logos]);

  const topCoinIndex = config.count - 1;

  return (
    <group ref={groupRef} position={position}>
      {coins.map((coin) => {
        const logoUrl = topCoinIndices.get(coin.index);
        const isTopCoin = coin.index === topCoinIndex;

        if (logoUrl) {
          return (
            <LogoCoin
              key={coin.index}
              position={coin.position}
              materialProps={materialProps}
              logoUrl={logoUrl}
              spinning={isTopCoin}
            />
          );
        }

        if (isTopCoin) {
          return (
            <SpinningCoin
              key={coin.index}
              position={coin.position}
              materialProps={materialProps}
            />
          );
        }

        return (
          <PlainCoin
            key={coin.index}
            position={coin.position}
            materialProps={materialProps}
          />
        );
      })}

      {config.light && (
        <pointLight
          position={[0, config.count * COIN_HEIGHT + 0.3, 0]}
          color={config.light.color}
          intensity={config.light.intensity}
          distance={3}
          decay={2}
        />
      )}

      {tier === 'whale' && <Sparkles count={8} seed={1337} />}
    </group>
  );
}
