import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sky, Stars, useTexture } from '@react-three/drei';
import { EffectComposer, SSAO, Bloom, Vignette, HueSaturation, BrightnessContrast } from '@react-three/postprocessing';
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
   1. GROUND — PBR cobblestone texture from polyhaven
   ═══════════════════════════════════════════════════════════════════ */
const COBBLE_COLOR = 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/cobblestone_floor_04/cobblestone_floor_04_diff_1k.jpg';
const COBBLE_NORMAL = 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/cobblestone_floor_04/cobblestone_floor_04_nor_gl_1k.jpg';
const COBBLE_ROUGH = 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/cobblestone_floor_04/cobblestone_floor_04_rough_1k.jpg';

function Ground() {
  const [colorMap, normalMap, roughnessMap] = useTexture([COBBLE_COLOR, COBBLE_NORMAL, COBBLE_ROUGH]);

  useMemo(() => {
    [colorMap, normalMap, roughnessMap].forEach((t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(12, 12);
    });
  }, [colorMap, normalMap, roughnessMap]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[60, 60]} />
      <meshStandardMaterial
        map={colorMap}
        normalMap={normalMap}
        roughnessMap={roughnessMap}
        roughness={1}
        metalness={0}
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
        sunPosition={[150, 30, -100]}
        inclination={0.49}
        azimuth={0.25}
        turbidity={4}
        rayleigh={1}
        mieCoefficient={0.003}
        mieDirectionalG={0.7}
      />
      <Stars
        radius={80}
        depth={50}
        count={1500}
        factor={3}
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
        castShadow
        shadow-mapSize={[1024, 1024]}
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

const STONE_COLOR = 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/castle_brick_07/castle_brick_07_diff_1k.jpg';
const STONE_NORMAL = 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/castle_brick_07/castle_brick_07_nor_gl_1k.jpg';
const STONE_ROUGH = 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/castle_brick_07/castle_brick_07_rough_1k.jpg';

const ROOF_COLOR = 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/roof_tiles_14/roof_tiles_14_diff_1k.jpg';
const ROOF_NORMAL = 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/roof_tiles_14/roof_tiles_14_nor_gl_1k.jpg';
const ROOF_ROUGH = 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/roof_tiles_14/roof_tiles_14_rough_1k.jpg';

/* Single medieval building: stone wall + dark timber beams + roof tiles */
function MedievalBuilding({ height, width }) {
  const roofHeight = 1.2;
  const [stoneColor, stoneNormal, stoneRoughness] = useTexture([STONE_COLOR, STONE_NORMAL, STONE_ROUGH]);
  const [roofColor, roofNormal, roofRoughness] = useTexture([ROOF_COLOR, ROOF_NORMAL, ROOF_ROUGH]);

  useMemo(() => {
    [stoneColor, stoneNormal, stoneRoughness].forEach((t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(2, 3);
    });
    [roofColor, roofNormal, roofRoughness].forEach((t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(2, 1);
    });
  }, [stoneColor, stoneNormal, stoneRoughness, roofColor, roofNormal, roofRoughness]);

  return (
    <group>
      {/* Main wall — stone */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, 0.6]} />
        <meshStandardMaterial map={stoneColor} normalMap={stoneNormal} roughnessMap={stoneRoughness} roughness={1} metalness={0} />
      </mesh>

      {/* Horizontal timber beam — bottom */}
      <mesh position={[0, 0.15, 0.31]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.1, 0.12, 0.08]} />
        <meshStandardMaterial color="#2A1A0C" roughness={0.85} />
      </mesh>

      {/* Horizontal timber beam — middle */}
      <mesh position={[0, height * 0.5, 0.31]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.1, 0.12, 0.08]} />
        <meshStandardMaterial color="#2A1A0C" roughness={0.85} />
      </mesh>

      {/* Horizontal timber beam — top */}
      <mesh position={[0, height - 0.1, 0.31]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.1, 0.12, 0.08]} />
        <meshStandardMaterial color="#2A1A0C" roughness={0.85} />
      </mesh>

      {/* Vertical timber beam — left */}
      <mesh position={[-width / 2 + 0.06, height / 2, 0.31]} castShadow receiveShadow>
        <boxGeometry args={[0.1, height, 0.08]} />
        <meshStandardMaterial color="#2A1A0C" roughness={0.85} />
      </mesh>

      {/* Vertical timber beam — right */}
      <mesh position={[width / 2 - 0.06, height / 2, 0.31]} castShadow receiveShadow>
        <boxGeometry args={[0.1, height, 0.08]} />
        <meshStandardMaterial color="#2A1A0C" roughness={0.85} />
      </mesh>

      {/* Vertical timber beam — center */}
      <mesh position={[0, height / 2, 0.31]} castShadow receiveShadow>
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

      {/* Pitched roof — roof tiles */}
      <mesh position={[0, height + roofHeight / 2 - 0.1, 0]} castShadow receiveShadow>
        <coneGeometry args={[width / 1.4, roofHeight, 4]} />
        <meshStandardMaterial map={roofColor} normalMap={roofNormal} roughnessMap={roofRoughness} roughness={1} metalness={0} />
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
            rotation={[0, angle, 0]}
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
      <fog attach="fog" args={['#8B7355', 15, 50]} />

      <ambientLight intensity={0.6} color="#FFF8F0" />
      <directionalLight
        position={[150, 30, -100]}
        intensity={1.2}
        color="#FFD4A0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={200}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
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

      {/* Post-processing */}
      <EffectComposer>
        <SSAO radius={0.05} intensity={20} luminanceInfluence={0.6} color="black" />
        <Bloom intensity={0.4} luminanceThreshold={0.6} luminanceSmoothing={0.9} mipmapBlur />
        <Vignette eskil={false} offset={0.2} darkness={0.8} />
        <HueSaturation saturation={0.15} />
        <BrightnessContrast brightness={-0.05} contrast={0.1} />
      </EffectComposer>
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
        shadows="soft"
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
