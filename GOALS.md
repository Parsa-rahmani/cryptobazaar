# Crypto Bazaar — Three.js Edition
Immersive 3D medieval bazaar (Shrek-style). User pastes EVM wallet →
DeBank API fetches balances → renders a 3D market square where you
stand in the center surrounded by merchant stalls in a ring.

## Stack
- Frontend: React + Three.js (via @react-three/fiber + @react-three/drei)
- Backend: Node/Express proxy for DeBank API key
- Camera: eye-level, looking inward at stall ring, slight orbit allowed
- No wallet connect — manual address paste only

## Sessions Completed
- [ ] Session 1: Project scaffold + Express backend proxy
- [ ] Session 2: DeBank data hook (fetch, group by chain, sort)
- [ ] Session 3: Three.js scene base (ground, lighting, camera, fog)
- [ ] Session 4: Stall ring geometry (8 stalls in a circle, canopies)
- [ ] Session 5: Coin pile meshes per value tier
- [ ] Session 6: NPC merchants + stall labels (floating text)
- [ ] Session 7: Hover + click interactivity (raycasting)
- [ ] Session 8: Animations + loading state + polish
