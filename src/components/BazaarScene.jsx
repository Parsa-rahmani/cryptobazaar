import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sky, Stars } from '@react-three/drei';
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

/* ─── Mobile detection ─── */
const IS_MOBILE =
  typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0;

/* ─── Constants ─── */
const EYE_HEIGHT = 1.7;
const MOVE_SPEED = 0.08;
const MOUSE_SENSITIVITY = 0.002;
const PITCH_MIN = -0.4;
const PITCH_MAX = 0.4;
const BOUNDARY_RADIUS = 10;

/* ═══════════════════════════════════════════════════════════════════
   1. GROUND — procedural cobblestone texture
   ═══════════════════════════════════════════════════════════════════ */
function makeCobblestoneTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Base mortar color
  ctx.fillStyle = '#3A332A';
  ctx.fillRect(0, 0, size, size);

  // Draw irregular stones in a grid with jitter
  const cols = 8;
  const rows = 8;
  const cellW = size / cols;
  const cellH = size / rows;
  const stoneColors = ['#6B6357', '#7A7060', '#5C5549', '#847B6E', '#6E665A', '#79705F', '#635C50', '#8A8070'];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const jx = (Math.random() - 0.5) * 6;
      const jy = (Math.random() - 0.5) * 6;
      const pad = 3 + Math.random() * 2;
      const x = c * cellW + pad + jx;
      const y = r * cellH + pad + jy;
      const w = cellW - pad * 2 + (Math.random() - 0.5) * 8;
      const h = cellH - pad * 2 + (Math.random() - 0.5) * 8;

      const color = stoneColors[(r * cols + c) % stoneColors.length];
      ctx.fillStyle = color;

      // Rounded rect for each stone
      const radius = 4 + Math.random() * 4;
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + w - radius, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
      ctx.lineTo(x + w, y + h - radius);
      ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
      ctx.lineTo(x + radius, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();

      // Subtle highlight on top edge
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + radius, y + 1);
      ctx.lineTo(x + w - radius, y + 1);
      ctx.stroke();

      // Shadow on bottom edge
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.moveTo(x + radius, y + h - 1);
      ctx.lineTo(x + w - radius, y + h - 1);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(10, 10);
  tex.needsUpdate = true;
  return tex;
}

function Ground() {
  const cobblestone = useMemo(() => makeCobblestoneTexture(), []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[60, 60]} />
      <meshStandardMaterial
        map={cobblestone}
        roughness={0.95}
        metalness={0.0}
      />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   2. SKY — drei Sky (dusk sun) + Stars
   ═══════════════════════════════════════════════════════════════════ */
function DuskSky() {
  return (
    <>
      <Sky
        distance={450000}
        sunPosition={[100, 5, -100]}
        inclination={0.05}
        azimuth={0.25}
        turbidity={10}
        rayleigh={2}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />
      <Stars
        radius={80}
        depth={50}
        count={2000}
        factor={4}
        saturation={0}
        fade
        speed={0.5}
      />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   3. TORCHES — 8 flickering torches around the stall ring
   ═══════════════════════════════════════════════════════════════════ */
const TORCH_COUNT = 8;
const TORCH_RADIUS = 7;

function Torch({ index }) {
  const lightRef = useRef();
  const angle = (index / TORCH_COUNT) * Math.PI * 2;
  const x = Math.sin(angle) * TORCH_RADIUS;
  const z = Math.cos(angle) * TORCH_RADIUS;

  useFrame(({ clock }) => {
    if (lightRef.current) {
      lightRef.current.intensity =
        2 + Math.sin(clock.elapsedTime * 8 + index) * 0.3;
    }
  });

  return (
    <group position={[x, 0, z]}>
      {/* Wooden pole */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 0.8, 8]} />
        <meshStandardMaterial color="#3B2716" roughness={0.9} />
      </mesh>

      {/* Flame sphere */}
      <mesh position={[0, 0.84, 0]}>
        <sphereGeometry args={[0.08, 12, 8]} />
        <meshStandardMaterial
          color="#FF6600"
          emissive="#FF6600"
          emissiveIntensity={1.5}
        />
      </mesh>

      {/* Flickering point light */}
      <pointLight
        ref={lightRef}
        position={[0, 0.84, 0]}
        color="#FF8C00"
        intensity={2}
        distance={8}
        decay={2}
      />
    </group>
  );
}

function Torches() {
  return (
    <>
      {Array.from({ length: TORCH_COUNT }, (_, i) => (
        <Torch key={i} index={i} />
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   5. BUILDING FACADES — medieval timber-frame houses around perimeter
   ═══════════════════════════════════════════════════════════════════ */
const FACADE_COUNT = 12;
const FACADE_RADIUS = 18;

/* Single medieval building: plaster wall + dark timber beams + roof */
function MedievalBuilding({ height, width }) {
  const roofHeight = 1.2;
  const wallColor = useMemo(() => {
    const colors = ['#C4A86B', '#B89B5E', '#D4B87A', '#A8905A', '#CFAD6A'];
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  return (
    <group>
      {/* Main wall — plaster / stucco */}
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, 0.6]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>

      {/* Horizontal timber beam — bottom */}
      <mesh position={[0, 0.15, 0.31]}>
        <boxGeometry args={[width + 0.1, 0.12, 0.08]} />
        <meshStandardMaterial color="#2A1A0C" roughness={0.85} />
      </mesh>

      {/* Horizontal timber beam — middle */}
      <mesh position={[0, height * 0.5, 0.31]}>
        <boxGeometry args={[width + 0.1, 0.12, 0.08]} />
        <meshStandardMaterial color="#2A1A0C" roughness={0.85} />
      </mesh>

      {/* Horizontal timber beam — top */}
      <mesh position={[0, height - 0.1, 0.31]}>
        <boxGeometry args={[width + 0.1, 0.12, 0.08]} />
        <meshStandardMaterial color="#2A1A0C" roughness={0.85} />
      </mesh>

      {/* Vertical timber beam — left */}
      <mesh position={[-width / 2 + 0.06, height / 2, 0.31]}>
        <boxGeometry args={[0.1, height, 0.08]} />
        <meshStandardMaterial color="#2A1A0C" roughness={0.85} />
      </mesh>

      {/* Vertical timber beam — right */}
      <mesh position={[width / 2 - 0.06, height / 2, 0.31]}>
        <boxGeometry args={[0.1, height, 0.08]} />
        <meshStandardMaterial color="#2A1A0C" roughness={0.85} />
      </mesh>

      {/* Vertical timber beam — center */}
      <mesh position={[0, height / 2, 0.31]}>
        <boxGeometry args={[0.1, height, 0.08]} />
        <meshStandardMaterial color="#2A1A0C" roughness={0.85} />
      </mesh>

      {/* Window — dark opening (left) */}
      <mesh position={[-width * 0.25, height * 0.55, 0.35]}>
        <boxGeometry args={[0.5, 0.6, 0.05]} />
        <meshStandardMaterial color="#0A0805" roughness={1} />
      </mesh>

      {/* Window — dark opening (right) */}
      <mesh position={[width * 0.25, height * 0.55, 0.35]}>
        <boxGeometry args={[0.5, 0.6, 0.05]} />
        <meshStandardMaterial color="#0A0805" roughness={1} />
      </mesh>

      {/* Pitched roof */}
      <mesh position={[0, height + roofHeight / 2 - 0.1, 0]} rotation={[0, 0, 0]}>
        <coneGeometry args={[width / 1.4, roofHeight, 4]} />
        <meshStandardMaterial color="#5C2E0E" roughness={0.85} />
      </mesh>
    </group>
  );
}

function BuildingFacades() {
  const facades = useMemo(() => {
    const out = [];
    for (let i = 0; i < FACADE_COUNT; i++) {
      const angle = (i / FACADE_COUNT) * Math.PI * 2;
      const height = 4 + Math.random() * 2;
      const width = 2.5 + Math.random() * 1.5;
      out.push({ angle, height, width });
    }
    return out;
  }, []);

  return (
    <>
      {facades.map(({ angle, height, width }, i) => {
        const x = Math.sin(angle) * FACADE_RADIUS;
        const z = Math.cos(angle) * FACADE_RADIUS;
        return (
          <group
            key={i}
            position={[x, 0, z]}
            rotation={[0, angle + Math.PI, 0]}
          >
            <MedievalBuilding height={height} width={width} />
          </group>
        );
      })}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Stall ring (UNTOUCHED — stall + coin pile logic preserved)
   ═══════════════════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════════════════
   FIRST-PERSON CONTROLS — pointer lock + WASD + mouse look
   ═══════════════════════════════════════════════════════════════════ */
function FirstPersonControls({ isLocked }) {
  const { camera, gl } = useThree();
  const yaw = useRef(Math.PI);   // start facing inward (toward center)
  const pitch = useRef(0);
  const keys = useRef({ w: false, a: false, s: false, d: false });

  // Set initial camera position
  useEffect(() => {
    camera.position.set(0, EYE_HEIGHT, 8);
  }, [camera]);

  // Mouse look (pointer lock mousemove)
  useEffect(() => {
    const onMouseMove = (e) => {
      if (!document.pointerLockElement) return;

      yaw.current -= e.movementX * MOUSE_SENSITIVITY;
      pitch.current -= e.movementY * MOUSE_SENSITIVITY;
      pitch.current = Math.max(PITCH_MIN, Math.min(PITCH_MAX, pitch.current));
    };

    document.addEventListener('mousemove', onMouseMove);
    return () => document.removeEventListener('mousemove', onMouseMove);
  }, []);

  // Keyboard tracking
  useEffect(() => {
    const mapKey = (code) => {
      switch (code) {
        case 'KeyW': case 'ArrowUp':    return 'w';
        case 'KeyA': case 'ArrowLeft':  return 'a';
        case 'KeyS': case 'ArrowDown':  return 's';
        case 'KeyD': case 'ArrowRight': return 'd';
        default: return null;
      }
    };

    const onKeyDown = (e) => {
      const k = mapKey(e.code);
      if (k) keys.current[k] = true;
    };
    const onKeyUp = (e) => {
      const k = mapKey(e.code);
      if (k) keys.current[k] = false;
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Per-frame: apply rotation + movement
  useFrame(() => {
    if (!isLocked) return;

    // Camera rotation from yaw + pitch
    const euler = new THREE.Euler(pitch.current, yaw.current, 0, 'YXZ');
    camera.quaternion.setFromEuler(euler);

    // Movement direction (yaw only, ignore pitch for walking)
    const forward = new THREE.Vector3(
      -Math.sin(yaw.current),
      0,
      -Math.cos(yaw.current)
    );
    const right = new THREE.Vector3(
      Math.cos(yaw.current),
      0,
      -Math.sin(yaw.current)
    );

    const k = keys.current;
    if (k.w) camera.position.addScaledVector(forward, MOVE_SPEED);
    if (k.s) camera.position.addScaledVector(forward, -MOVE_SPEED);
    if (k.a) camera.position.addScaledVector(right, -MOVE_SPEED);
    if (k.d) camera.position.addScaledVector(right, MOVE_SPEED);

    // Lock Y to eye height
    camera.position.y = EYE_HEIGHT;

    // Boundary collision — keep inside radius 10
    const dist = Math.sqrt(
      camera.position.x * camera.position.x +
      camera.position.z * camera.position.z
    );
    if (dist > BOUNDARY_RADIUS) {
      const scale = BOUNDARY_RADIUS / dist;
      camera.position.x *= scale;
      camera.position.z *= scale;
    }
  });

  return null;
}

/* ═══════════════════════════════════════════════════════════════════
   Scene contents — assembled with environment + controls
   ═══════════════════════════════════════════════════════════════════ */
function SceneContents({ chains, onStallClick, isLocked, isMobile }) {
  return (
    <>
      {/* AMBIENT MOOD — fog, dim ambient, moonlight */}
      <fog attach="fog" args={['#1A0A07', 12, 35]} />

      <ambientLight intensity={0.15} color="#FFF3DC" />
      <directionalLight
        position={[-5, 10, -3]}
        intensity={0.3}
        color="#4466AA"
      />

      {/* Environment */}
      <DuskSky />
      <Ground />
      <Torches />
      <BuildingFacades />

      {/* Stalls (untouched) */}
      <StallRing chains={chains} onStallClick={onStallClick} />

      {/* Controls: mobile → OrbitControls, desktop → first person */}
      {isMobile ? (
        <OrbitControls
          target={[0, 1, 0]}
          maxPolarAngle={Math.PI / 2.2}
          minDistance={4}
          maxDistance={14}
          enablePan={false}
        />
      ) : (
        <FirstPersonControls isLocked={isLocked} />
      )}
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

/* ═══════════════════════════════════════════════════════════════════
   "Click to enter the bazaar" overlay
   ═══════════════════════════════════════════════════════════════════ */
const overlayStyle = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(10, 6, 5, 0.7)',
  zIndex: 10,
  cursor: 'pointer',
};

const overlayTextStyle = {
  color: '#D4A843',
  fontSize: '2rem',
  fontFamily: 'Georgia, serif',
  fontWeight: 'bold',
  textShadow: '0 0 20px rgba(212, 168, 67, 0.5)',
  pointerEvents: 'none',
  userSelect: 'none',
};

/* ─── BazaarScene ─── */
export default function BazaarScene({ chains = [] }) {
  const [selectedChain, setSelectedChain] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const canvasContainerRef = useRef(null);

  const handleStallClick = useCallback((chain) => {
    setSelectedChain(chain);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedChain(null);
  }, []);

  // Pointer lock change listener
  useEffect(() => {
    const onChange = () => {
      setIsLocked(!!document.pointerLockElement);
    };
    document.addEventListener('pointerlockchange', onChange);
    return () => document.removeEventListener('pointerlockchange', onChange);
  }, []);

  // Request pointer lock on overlay click
  const handleOverlayClick = useCallback(() => {
    const canvas = canvasContainerRef.current?.querySelector('canvas');
    if (canvas) {
      canvas.requestPointerLock();
    }
  }, []);

  return (
    <div
      ref={canvasContainerRef}
      style={{ width: '100vw', height: '100vh', background: '#0A0605', position: 'relative' }}
    >
      <Canvas
        camera={{ position: [0, EYE_HEIGHT, 8], fov: 60 }}
        gl={{ antialias: true }}
      >
        <SceneContents
          chains={chains}
          onStallClick={handleStallClick}
          isLocked={isLocked}
          isMobile={IS_MOBILE}
        />
      </Canvas>

      {/* "Click to enter" overlay — desktop only, shown when not locked */}
      {!IS_MOBILE && !isLocked && (
        <div style={overlayStyle} onClick={handleOverlayClick}>
          <span style={overlayTextStyle}>Click to enter the bazaar</span>
        </div>
      )}

      <TokenPanel chain={selectedChain} onClose={handleClose} />
    </div>
  );
}
