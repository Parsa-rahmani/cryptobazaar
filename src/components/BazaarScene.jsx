import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
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
   1. GROUND — cobblestone textured plane
   ═══════════════════════════════════════════════════════════════════ */
function Ground() {
  const texture = useLoader(
    THREE.TextureLoader,
    'https://threejs.org/examples/textures/hardwood2_diffuse.jpg'
  );

  const cobblestone = useMemo(() => {
    const tex = texture.clone();
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(20, 20);
    tex.needsUpdate = true;
    return tex;
  }, [texture]);

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
   2. SKY DOME — warm dusk gradient via ShaderMaterial
   ═══════════════════════════════════════════════════════════════════ */
const skyVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const skyFragmentShader = `
  uniform vec3 skyColor;
  uniform vec3 horizonColor;
  varying vec2 vUv;
  void main() {
    vec3 col = mix(horizonColor, skyColor, vUv.y);
    gl_FragColor = vec4(col, 1.0);
  }
`;

function SkyDome() {
  const uniforms = useMemo(
    () => ({
      skyColor: { value: new THREE.Color('#1a0a2e') },
      horizonColor: { value: new THREE.Color('#8B3A0F') },
    }),
    []
  );

  return (
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[80, 64, 32]} />
      <shaderMaterial
        vertexShader={skyVertexShader}
        fragmentShader={skyFragmentShader}
        uniforms={uniforms}
        side={THREE.BackSide}
      />
    </mesh>
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
   5. BUILDING FACADES — 12 silhouettes around the perimeter
   ═══════════════════════════════════════════════════════════════════ */
const FACADE_COUNT = 12;
const FACADE_RADIUS = 18;

function BuildingFacades() {
  const facades = useMemo(() => {
    const out = [];
    for (let i = 0; i < FACADE_COUNT; i++) {
      const angle = (i / FACADE_COUNT) * Math.PI * 2;
      const height = 4 + Math.random() * 2;
      out.push({ angle, height });
    }
    return out;
  }, []);

  return (
    <>
      {facades.map(({ angle, height }, i) => {
        const x = Math.sin(angle) * FACADE_RADIUS;
        const z = Math.cos(angle) * FACADE_RADIUS;
        return (
          <mesh
            key={i}
            position={[x, height / 2, z]}
            rotation={[0, angle + Math.PI, 0]}
          >
            <boxGeometry args={[3, height, 0.5]} />
            <meshStandardMaterial color="#2A1F14" roughness={0.95} />
          </mesh>
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
      <fog attach="fog" args={['#1A0A07', 8, 20]} />

      <ambientLight intensity={0.15} color="#FFF3DC" />
      <directionalLight
        position={[-5, 10, -3]}
        intensity={0.3}
        color="#4466AA"
      />

      {/* Environment */}
      <SkyDome />
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
