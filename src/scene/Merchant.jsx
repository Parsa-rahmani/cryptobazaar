import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

const SKIN = '#C68642';
const HAT_COLOR = '#2A1506';

/**
 * Darken a hex color by a factor (0–1, where 0 = black).
 */
function darken(hex, factor = 0.6) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.floor(((n >> 16) & 0xff) * factor);
  const g = Math.floor(((n >> 8) & 0xff) * factor);
  const b = Math.floor((n & 0xff) * factor);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * Merchant — low-poly humanoid NPC standing behind the stall counter.
 * Gently bobs up and down via useFrame.
 *
 * Props:
 *   position   – [x, y, z] within the stall group
 *   chainColor – hex string for tunic color (will be darkened)
 */
export default function Merchant({ position = [0, 0, 0], chainColor = '#888888' }) {
  const tunicColor = darken(chainColor, 0.6);
  const groupRef = useRef();
  const baseY = position[1] || 0;

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.position.y =
        baseY + Math.sin(clock.elapsedTime * 1.5) * 0.005;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* ── Conical hat ── */}
      <mesh position={[0, 0.68, 0]}>
        <coneGeometry args={[0.2, 0.35, 8]} />
        <meshStandardMaterial color={HAT_COLOR} roughness={0.85} />
      </mesh>

      {/* ── Head ── */}
      <mesh position={[0, 0.42, 0]}>
        <sphereGeometry args={[0.18, 12, 10]} />
        <meshStandardMaterial color={SKIN} roughness={0.7} />
      </mesh>

      {/* ── Body / tunic ── */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.3, 0.5, 0.2]} />
        <meshStandardMaterial color={tunicColor} roughness={0.75} />
      </mesh>

      {/* ── Left arm ── */}
      <mesh position={[-0.25, 0.02, 0]} rotation={[0, 0, 0.15]}>
        <boxGeometry args={[0.1, 0.35, 0.1]} />
        <meshStandardMaterial color={tunicColor} roughness={0.75} />
      </mesh>

      {/* ── Right arm ── */}
      <mesh position={[0.25, 0.02, 0]} rotation={[0, 0, -0.15]}>
        <boxGeometry args={[0.1, 0.35, 0.1]} />
        <meshStandardMaterial color={tunicColor} roughness={0.75} />
      </mesh>
    </group>
  );
}
