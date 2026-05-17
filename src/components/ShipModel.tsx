import React, { useMemo, useRef } from 'react';
import { ShipType } from '../types';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Procedural texture generator for ultra-detailed surfaces
const getSharedTextures = (() => {
  let textures: { map: THREE.Texture, rough: THREE.Texture, bump: THREE.Texture } | null = null;
  
  return () => {
    if (textures) return textures;
    
    const size = 1024;
    const makeCanvas = () => {
      const c = document.createElement('canvas');
      c.width = size;
      c.height = size;
      return { canvas: c, ctx: c.getContext('2d')! };
    };

    const { canvas: cMap, ctx: ctxMap } = makeCanvas();
    const { canvas: cRough, ctx: ctxRough } = makeCanvas();
    const { canvas: cBump, ctx: ctxBump } = makeCanvas();

    // Base colors
    ctxMap.fillStyle = '#666666'; ctxMap.fillRect(0, 0, size, size);
    ctxRough.fillStyle = '#777777'; ctxRough.fillRect(0, 0, size, size);
    ctxBump.fillStyle = '#888888'; ctxBump.fillRect(0, 0, size, size); // Mid gray for neutral height

    // Micro noise / Scratches
    for (let i = 0; i < 60000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const w = Math.random() * 4 + 1;
      const h = Math.random() * 2 + 1;
      
      const v = Math.random() * 40 - 20;
      ctxMap.fillStyle = `rgb(${102+v},${102+v},${102+v})`;
      ctxMap.fillRect(x, y, w, h);
      
      const r = Math.random() * 100 + 50;
      ctxRough.fillStyle = `rgb(${r},${r},${r})`;
      ctxRough.fillRect(x, y, w, h);
    }

    // Panels
    ctxMap.strokeStyle = '#222222';
    ctxMap.lineWidth = 2;
    ctxBump.strokeStyle = '#000000'; // Panel gaps are deep (black)
    ctxBump.lineWidth = 3;

    for (let i = 0; i < 40; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const w = Math.random() * 200 + 50;
        const h = Math.random() * 200 + 50;
        
        ctxMap.strokeRect(x, y, w, h);
        ctxBump.strokeRect(x, y, w, h);
        
        // Random panel coloration
        if (Math.random() > 0.5) {
            ctxMap.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.05)';
            ctxMap.fillRect(x, y, w, h);
            ctxBump.fillStyle = Math.random() > 0.5 ? '#959595' : '#7D7D7D'; // slight height variation
            ctxBump.fillRect(x, y, w, h);
        }
    }

    // Screws / Rivets
    for (let i = 0; i < 800; i++) {
        const rx = Math.random() * size;
        const ry = Math.random() * size;
        ctxBump.beginPath(); ctxBump.arc(rx, ry, 2, 0, Math.PI*2); 
        ctxBump.fillStyle = '#ffffff'; // Rivets pop out
        ctxBump.fill();
        ctxMap.beginPath(); ctxMap.arc(rx, ry, 2, 0, Math.PI*2);
        ctxMap.fillStyle = '#444444';
        ctxMap.fill();
    }

    const map = new THREE.CanvasTexture(cMap);
    const rough = new THREE.CanvasTexture(cRough);
    const bump = new THREE.CanvasTexture(cBump);

    [map, rough, bump].forEach(t => {
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(2, 2);
    });

    textures = { map, rough, bump };
    return textures;
  };
})();

const CockpitLight = ({ position, scale = 1, glowColor, ship }: any) => {
  const lightRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(() => {
    let intensity = 1;
    if (ship) {
      const hpRatio = ship.health / ship.maxHealth;
      if (hpRatio < 0.3) {
        // Danger flashing
        intensity = Math.sin(Date.now() / 100) > 0 ? 5 : 0.5;
      } else {
        // Idle breathing
        intensity = 2 + Math.sin(Date.now() / 500) * 0.5;
      }
    }
    if (lightRef.current) {
      lightRef.current.emissiveIntensity = intensity;
    }
  });

  return (
    <mesh position={position} scale={scale}>
      <boxGeometry args={[0.4, 0.1, 0.1]} />
      <meshStandardMaterial ref={lightRef} color={glowColor} emissive={glowColor} emissiveIntensity={2} toneMapped={false} />
    </mesh>
  );
};
const Thruster = ({ position, rotation, scale = 1, glowColor, ship }: any) => {
  const glowMatRef = useRef<THREE.MeshStandardMaterial>(null);
  
  useFrame(() => {
    let intensity = 8;
    if (ship) {
      const speed = Math.sqrt((ship.vx || 0) ** 2 + (ship.vy || 0) ** 2);
      const throttle = Math.min(1, speed / (ship.config?.speed || 1));
      intensity = 4 + throttle * 15 + Math.random() * 2; // base 4, max 21, slight flicker
    } else {
      intensity = 8 + Math.sin(Date.now() / 200) * 2;
    }
    if (glowMatRef.current) {
      glowMatRef.current.emissiveIntensity = intensity;
    }
  });

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
         <cylinderGeometry args={[0.3, 0.45, 0.6, 16]} />
         <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
         <cylinderGeometry args={[0.25, 0.35, 0.4, 16]} />
         <meshStandardMaterial color="#050505" />
      </mesh>
      {/* Inner engine core glow */}
      <mesh position={[0, 0, -0.3]}>
         <sphereGeometry args={[0.2, 16, 16]} />
         <meshStandardMaterial ref={glowMatRef} color="#fff" emissive={glowColor} emissiveIntensity={8} toneMapped={false} />
      </mesh>
      {/* Vectoring flaps */}
      {[0, Math.PI/2, Math.PI, Math.PI*1.5].map((ang, i) => (
        <mesh key={i} position={[Math.cos(ang)*0.35, Math.sin(ang)*0.35, -0.4]} rotation={[0, 0, ang]}>
           <boxGeometry args={[0.08, 0.3, 0.5]} />
           <meshStandardMaterial color="#222" metalness={0.8} />
        </mesh>
      ))}
    </group>
  );
};

const WeaponMuzzle = ({ position, rotation, scale = 1, glowColor, ship }: any) => {
  const flashRef = useRef<THREE.MeshStandardMaterial>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const barrelGlowRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(() => {
    let flash = 0;
    let ringScale = 0.01;
    let ringOpacity = 0;
    let heat = 0;

    if (ship) {
      const timeSincePrimary = Date.now() - (ship.lastFiredPrimary || 0);
      const timeSinceSecondary = Date.now() - (ship.lastFiredSecondary || 0);
      const minTime = Math.min(timeSincePrimary, timeSinceSecondary);

      // Brief bright flash right after firing
      if (minTime < 50) {
        flash = Math.random() * 8 + 6; // Very high intensity flash
        ringScale = 0.5 + (minTime / 50) * 3;
        ringOpacity = 1 - (minTime / 50);
      } else if (minTime < 150) {
        flash = 2 - ((minTime - 50) / 100) * 2; // Fast falloff
      }

      if (minTime < 1000) {
        // Barrel retains heat longer
        heat = 1 - (minTime / 1000); // 1 to 0 over 1 second
      }
    }
    
    if (flashRef.current) flashRef.current.emissiveIntensity = flash;
    if (barrelGlowRef.current) barrelGlowRef.current.emissiveIntensity = heat * 4;
    
    if (ringRef.current) {
        ringRef.current.scale.set(ringScale, ringScale, ringScale);
        (ringRef.current.material as THREE.MeshBasicMaterial).opacity = ringOpacity;
    }
  });

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Central Flash Core */}
      <mesh>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial ref={flashRef} color="#fff" emissive={glowColor} emissiveIntensity={0} toneMapped={false} transparent opacity={0.9} />
      </mesh>
      
      {/* Expanding Shockwave Ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.08, 0.15, 16]} />
        <meshBasicMaterial color={glowColor} transparent opacity={0} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>

      {/* Heated Barrel Glow */}
      <mesh position={[0, 0, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.5, 8]} />
        <meshStandardMaterial ref={barrelGlowRef} color={glowColor} emissive={glowColor} emissiveIntensity={0} toneMapped={false} transparent opacity={0.5} />
      </mesh>
    </group>
  );
};

const GreebleBox = ({ args, position, rotation, materials }: any) => (
  <mesh position={position} rotation={rotation} geometry={new THREE.BoxGeometry(...args)} material={materials} />
);

interface ShipModelProps {
  type: ShipType;
  teamColor: string;
  isPlayer?: boolean;
  ship?: any; // The game ship instance
}

export const ShipModel: React.FC<ShipModelProps> = ({ type, teamColor, isPlayer, ship }) => {
  const color = new THREE.Color(teamColor);
  if (!isPlayer) {
     color.multiplyScalar(1.5); // Brighten enemy team color
  }

  const darkMetal = new THREE.Color(isPlayer ? "#121418" : "#333d4d");
  const armorColor = new THREE.Color(isPlayer ? "#1f242d" : "#4b5563");
  const glowColor = teamColor === "#3b82f6" ? new THREE.Color("#00eeff") : new THREE.Color("#ff6b81");
  
  const textures = getSharedTextures();

  // Create highly detailed materials
  const paintedMaterial = new THREE.MeshStandardMaterial({
    color: color,
    metalness: 0.6,
    roughness: 0.4,
    map: textures.map,
    roughnessMap: textures.rough,
    bumpMap: textures.bump,
    bumpScale: 0.05
  });

  const armorMaterial = new THREE.MeshStandardMaterial({
    color: armorColor,
    metalness: 0.8,
    roughness: 0.5,
    map: textures.map,
    roughnessMap: textures.rough,
    bumpMap: textures.bump,
    bumpScale: 0.08
  });

  const darkMaterial = new THREE.MeshStandardMaterial({
    color: darkMetal,
    metalness: 0.9,
    roughness: 0.3,
    map: textures.map,
    bumpMap: textures.bump,
    bumpScale: 0.04
  });

  // Common detailed parts
  const Antenna = ({ pos, rot }: any) => (
    <group position={pos} rotation={rot}>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.01, 0.02, 0.4, 8]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={2} />
      </mesh>
    </group>
  );

  const Vent = ({ pos, rot, scale=1 }: any) => (
    <group position={pos} rotation={rot} scale={scale}>
      <mesh>
        <boxGeometry args={[0.4, 0.05, 0.6]} />
        <meshStandardMaterial color="#050505" />
      </mesh>
      {[-0.2, -0.1, 0, 0.1, 0.2].map((z, i) => (
        <mesh key={i} position={[0, 0.02, z]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[0.38, 0.02, 0.05]} />
          <meshStandardMaterial color={darkMetal} />
        </mesh>
      ))}
    </group>
  );

  // 1. FAST ATTACK: Sleek, extremely aerodynamic, aggressive forward-swept bits
  if (type === ShipType.FAST_ATTACK) {
    return (
      <group>
        {/* Core fuselage */}
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.4, 4.5, 8]} />
          <primitive object={darkMaterial} attach="material" />
        </mesh>

        {/* Aggressive Nose Assembly */}
        <mesh position={[0, 0.1, 2.5]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.4, 1.8, 8]} />
          <primitive object={armorMaterial} attach="material" />
        </mesh>

        {/* Detailed Cockpit */}
        <group position={[0, 0.4, 1.2]}>
          <mesh>
            <boxGeometry args={[0.4, 0.5, 1.5]} />
            <meshStandardMaterial color="#000" metalness={1} roughness={0} />
          </mesh>
          <mesh position={[0, 0, 0]} scale={[1.05, 1.05, 1.05]}>
             <boxGeometry args={[0.4, 0.5, 1.5]} />
             <meshStandardMaterial color={glowColor} wireframe transparent opacity={0.15} />
          </mesh>
          <CockpitLight position={[0, 0, 0.5]} glowColor={glowColor} ship={ship} />
        </group>

        {/* Multi-layered Swept Wings */}
        <group position={[0, 0, -0.5]}>
          {/* Main forward swept wings */}
          <mesh position={[1.8, 0, 0]} rotation={[0, -0.5, 0]}>
            <boxGeometry args={[3.8, 0.06, 1.2]} />
            <primitive object={paintedMaterial} attach="material" />
          </mesh>
          <mesh position={[-1.8, 0, 0]} rotation={[0, 0.5, 0]}>
            <boxGeometry args={[3.8, 0.06, 1.2]} />
            <primitive object={paintedMaterial} attach="material" />
          </mesh>
          
          {/* Secondary rear wings */}
          <mesh position={[1.2, 0.1, -1.2]} rotation={[0, -0.3, 0]}>
            <boxGeometry args={[2.0, 0.04, 0.8]} />
            <primitive object={armorMaterial} attach="material" />
          </mesh>
          <mesh position={[-1.2, 0.1, -1.2]} rotation={[0, 0.3, 0]}>
            <boxGeometry args={[2.0, 0.04, 0.8]} />
            <primitive object={armorMaterial} attach="material" />
          </mesh>

          {/* Wing Tip Weapons */}
          <group position={[3.6, 0, 0.8]}>
            <mesh>
              <boxGeometry args={[0.15, 0.15, 1.8]} />
              <primitive object={darkMaterial} attach="material" />
            </mesh>
            <mesh position={[0, 0, 0.9]} rotation={[Math.PI/2, 0, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 0.8, 8]} />
              <meshStandardMaterial color="#111" />
            </mesh>
            <WeaponMuzzle position={[0, 0, 1.3]} glowColor={glowColor} ship={ship} />
          </group>
          <group position={[-3.6, 0, 0.8]}>
            <mesh>
              <boxGeometry args={[0.15, 0.15, 1.8]} />
              <primitive object={darkMaterial} attach="material" />
            </mesh>
            <mesh position={[0, 0, 0.9]} rotation={[Math.PI/2, 0, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 0.8, 8]} />
              <meshStandardMaterial color="#111" />
            </mesh>
            <WeaponMuzzle position={[0, 0, 1.3]} glowColor={glowColor} ship={ship} />
          </group>
        </group>

        {/* Exhaust Systems */}
        <Thruster position={[0, 0, -2.5]} glowColor={glowColor} scale={1.2} ship={ship} />
        
        {/* Surface Greebles */}
        {[0, 0.4, 0.8].map((z, i) => (
          <GreebleBox key={i} position={[0, 0.45, z]} args={[0.3, 0.1, 0.2]} materials={darkMaterial} />
        ))}
        <Vent pos={[0, 0.38, -0.8]} />
      </group>
    );
  }

  // 2. TANK: Heavy, brutalist, massive armor plates, numerous turrets, thick geometry
  if (type === ShipType.TANK) {
    return (
      <group>
        {/* Central Core Chassis */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2.8, 1.2, 6.5]} />
          <primitive object={darkMaterial} attach="material" />
        </mesh>

        {/* Heavy Layered Deck Armor */}
        <group position={[0, 0.65, 0]}>
          {[-2.2, -0.8, 0.6, 2.0].map((z, i) => (
            <group key={i} position={[0, 0, z]}>
              <mesh>
                <boxGeometry args={[2.6, 0.3, 1.2]} />
                <primitive object={armorMaterial} attach="material" />
              </mesh>
              {/* Extra Top Plates */}
              <mesh position={[0, 0.18, 0]}>
                <boxGeometry args={[1.8, 0.06, 0.8]} />
                <primitive object={paintedMaterial} attach="material" />
              </mesh>
            </group>
          ))}
          {/* Energy Trench */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.6, 0.35, 6]} />
            <meshStandardMaterial color="#000" emissive={glowColor} emissiveIntensity={2} />
          </mesh>
        </group>

        {/* Command Bridge Complex */}
        <group position={[0, 1.5, 1.5]}>
          <mesh>
            <boxGeometry args={[1.2, 1.6, 1.4]} />
            <primitive object={armorMaterial} attach="material" />
          </mesh>
          <mesh position={[0, 0.6, 0.5]}>
            <boxGeometry args={[1.4, 0.4, 0.6]} />
            <primitive object={darkMaterial} attach="material" />
          </mesh>
          {/* Bridge Windows */}
          <mesh position={[0, 0.6, 0.85]}>
            <boxGeometry args={[1.2, 0.2, 0.1]} />
            <meshStandardMaterial color="#000" emissive={glowColor} emissiveIntensity={5} />
          </mesh>
          <CockpitLight position={[0, 0.65, 0.9]} glowColor={glowColor} ship={ship} scale={[2.5, 1, 1]} />
          <Antenna pos={[0.4, 0.8, -0.4]} />
          <Antenna pos={[-0.4, 0.8, -0.4]} rot={[0.2, 0, 0]} />
        </group>

        {/* Massive Side Sponsons */}
        {[2.2, -2.2].map((x, i) => (
          <group key={i} position={[x, 0, -0.5]}>
            <mesh>
              <boxGeometry args={[1.4, 1.2, 5]} />
              <primitive object={paintedMaterial} attach="material" />
            </mesh>
            {/* Multiple Turrets on Sponson */}
            {[1.2, -1.2].map((z, j) => (
              <group key={j} position={[x > 0 ? 0.8 : -0.8, 0.2, z]}>
                <mesh>
                  <sphereGeometry args={[0.5, 16, 16]} />
                  <primitive object={darkMaterial} attach="material" />
                </mesh>
                <mesh position={[x > 0 ? 0.6 : -0.6, 0, 0]} rotation={[0, 0, Math.PI/2]}>
                  <cylinderGeometry args={[0.1, 0.1, 1.5, 8]} />
                  <meshStandardMaterial color="#111" />
                </mesh>
                <WeaponMuzzle position={[x > 0 ? 1.4 : -1.4, 0, 0]} glowColor={glowColor} ship={ship} scale={2} />
              </group>
            ))}
          </group>
        ))}

        {/* Engine Modules */}
        <group position={[0, 0, -3.5]}>
          {[[-1.2, 0.5], [1.2, 0.5], [-1.2, -0.5], [1.2, -0.5], [0, 0]].map((pos, i) => (
             <Thruster key={i} position={[pos[0], pos[1], 0]} glowColor={glowColor} scale={pos[0]===0 ? 1.4 : 1} ship={ship} />
          ))}
        </group>

        {/* Industrial Scaffolding */}
        {[-2.5, 0, 2.5].map((z, i) => (
          <mesh key={i} position={[0, -0.7, z]} rotation={[0, 0, Math.PI/2]}>
            <cylinderGeometry args={[0.05, 0.05, 4.5, 16]} />
            <meshStandardMaterial color="#222" metalness={0.9} />
          </mesh>
        ))}
      </group>
    );
  }

  // 3. BOMBER: Wide silhouette, heavily reinforced, visible payload sections
  if (type === ShipType.BOMBER) {
    return (
      <group>
        {/* Core Structure */}
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[2.5, 1.4, 6]} />
          <primitive object={darkMaterial} attach="material" />
        </mesh>
        
        {/* Top Armor Carapace */}
        <mesh position={[0, 0.95, 0]}>
          <boxGeometry args={[2.0, 0.4, 5.5]} />
          <primitive object={armorMaterial} attach="material" />
        </mesh>

        {/* Enormous Delta Wings */}
        <group position={[0, 0, -0.5]}>
          <mesh>
             <boxGeometry args={[14, 0.4, 4.5]} />
             <primitive object={paintedMaterial} attach="material" />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
             <boxGeometry args={[12, 0.2, 3]} />
             <primitive object={armorMaterial} attach="material" />
          </mesh>
        </group>

          {/* Cockpit / Nose Node */}
        <group position={[0, 0.4, 3]}>
          <mesh>
            <boxGeometry args={[1.5, 1, 2]} />
            <primitive object={darkMaterial} attach="material" />
          </mesh>
          <mesh position={[0, 0.3, 1]}>
            <boxGeometry args={[1.2, 0.3, 0.2]} />
            <meshStandardMaterial color="#000" emissive={glowColor} emissiveIntensity={3} />
          </mesh>
          <CockpitLight position={[0, 0.3, 1.05]} glowColor={glowColor} ship={ship} scale={2} />
        </group>

        {/* Heavy Underslung Payload Pods */}
        {[3, -3, 5, -5].map((x, i) => (
           <group key={i} position={[x, -0.6, 0]}>
             <mesh>
               <boxGeometry args={[1.2, 1.2, 3.5]} />
               <primitive object={darkMaterial} attach="material" />
             </mesh>
             {/* Ordnance Visible */}
             <mesh position={[0, -0.6, 0]} rotation={[Math.PI/2, 0, 0]}>
               <cylinderGeometry args={[0.3, 0.3, 3, 16]} />
               <meshStandardMaterial color="#333" metalness={0.8} />
             </mesh>
             <WeaponMuzzle position={[0, -0.6, 1.6]} glowColor={glowColor} ship={ship} scale={3} />
             {/* Indicator lights */}
             <mesh position={[0, -0.9, 1]}>
                <sphereGeometry args={[0.1]} />
                <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={5} />
             </mesh>
           </group>
        ))}

        {/* Quad Heavy Engines */}
        {[2, -2, 4.5, -4.5].map((x, i) => (
           <Thruster key={i} position={[x, 0.2, -3.2]} scale={1.5} glowColor={glowColor} ship={ship} />
        ))}
        
        {/* Tail Assembly */}
        <group position={[0, 1.5, -2.5]}>
           <mesh position={[2, 0, 0]} rotation={[0, 0, 0.2]}>
              <boxGeometry args={[0.2, 3, 2.5]} />
              <primitive object={color} attach="material" />
              <primitive object={paintedMaterial} attach="material" />
           </mesh>
           <mesh position={[-2, 0, 0]} rotation={[0, 0, -0.2]}>
              <boxGeometry args={[0.2, 3, 2.5]} />
              <primitive object={paintedMaterial} attach="material" />
           </mesh>
        </group>

        {/* Extensive Top Greebling */}
        <Vent pos={[0, 1.2, 0]} scale={2} />
        <Vent pos={[0.8, 1.2, -1]} scale={1.5} />
        <Vent pos={[-0.8, 1.2, -1]} scale={1.5} />
        <Antenna pos={[0, 1.2, 1.5]} />
      </group>
    );
  }

  // 4. CRUISER: Long, majestic, heavily armed, multiple decks
  if (type === ShipType.CRUISER) {
    return (
      <group>
        {/* Main Hull Spine */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.5, 1.8, 12]} />
          <primitive object={darkMaterial} attach="material" />
        </mesh>
        
        {/* Forward Hammerhead */}
        <group position={[0, 0, 6]}>
           <mesh>
             <boxGeometry args={[4, 1.5, 2.5]} />
             <primitive object={armorMaterial} attach="material" />
           </mesh>
           <mesh position={[0, 0.8, -0.5]}>
             <boxGeometry args={[2, 0.8, 1.5]} />
             <primitive object={paintedMaterial} attach="material" />
           </mesh>
           <CockpitLight position={[0, 1.2, 0.3]} glowColor={glowColor} ship={ship} scale={2} />
        </group>

        {/* Side Armor Pontoons */}
        {[2.5, -2.5].map((x, i) => (
           <group key={i} position={[x, -0.2, 0]}>
             <mesh>
               <boxGeometry args={[1.2, 1.2, 8]} />
               <primitive object={paintedMaterial} attach="material" />
             </mesh>
             {/* Broadside Turrets */}
             {[-2, 0, 2].map((z, j) => (
                <group key={j} position={[x > 0 ? 0.8 : -0.8, 0.4, z]}>
                   <mesh>
                     <boxGeometry args={[0.6, 0.6, 0.8]} />
                     <primitive object={darkMaterial} attach="material" />
                   </mesh>
                   <mesh position={[x > 0 ? 0.5 : -0.5, 0, 0]} rotation={[0, 0, Math.PI/2]}>
                     <cylinderGeometry args={[0.08, 0.08, 1, 8]} />
                     <meshStandardMaterial color="#111" />
                   </mesh>
                   <WeaponMuzzle position={[x > 0 ? 1 : -1, 0, 0]} glowColor={glowColor} ship={ship} />
                </group>
             ))}
             <Thruster position={[0, 0, -4]} scale={1.5} glowColor={glowColor} ship={ship} />
           </group>
        ))}

        {/* Main Engines */}
        <group position={[0, 0, -6]}>
           <Thruster position={[0, 0.4, 0]} scale={2} glowColor={glowColor} ship={ship} />
           <Thruster position={[0, -0.6, 0]} scale={1.8} glowColor={glowColor} ship={ship} />
        </group>
        
        {/* Dorsal Superstructure / Command Tower */}
        <group position={[0, 1.5, -2]}>
           <mesh>
             <boxGeometry args={[1.2, 2, 3]} />
             <primitive object={armorMaterial} attach="material" />
           </mesh>
           <mesh position={[0, 1.2, 0.5]}>
             <boxGeometry args={[1.8, 0.8, 1.5]} />
             <primitive object={darkMaterial} attach="material" />
           </mesh>
           {/* Bridge Windows */}
           <mesh position={[0, 1.4, 1.3]}>
             <boxGeometry args={[1.4, 0.3, 0.1]} />
             <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={3} />
           </mesh>
           <Antenna pos={[0, 1.8, -0.5]} scale={2} />
        </group>
      </group>
    );
  }

  // 5. DESTROYER: Massive, fat, wide, incredibly heavily armored
  if (type === ShipType.DESTROYER) {
    return (
      <group>
        {/* Massive Central Bulk */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[7, 3, 16]} />
          <primitive object={darkMaterial} attach="material" />
        </mesh>
        
        {/* Layered Front Armor Plates */}
        <group position={[0, 0, 8]}>
           <mesh position={[0, 0, 0.5]}>
             <boxGeometry args={[5, 2.5, 1]} />
             <primitive object={armorMaterial} attach="material" />
           </mesh>
           <mesh position={[0, -0.5, 1.2]}>
             <boxGeometry args={[3, 1, 1]} />
             <primitive object={paintedMaterial} attach="material" />
           </mesh>
           <mesh position={[0, -0.5, 1.8]}>
             <boxGeometry args={[1, 0.6, 1]} />
             <meshStandardMaterial color="#222" />
           </mesh>
        </group>
        
        {/* Deep Trenches / Greebles */}
        <mesh position={[0, 1.6, 0]}>
           <boxGeometry args={[2, 0.5, 14]} />
           <meshStandardMaterial color="#050505" />
        </mesh>

        {/* Port & Starboard Engine Nacelles */}
        {[4.5, -4.5].map((x, i) => (
           <group key={i} position={[x, 0, -4]}>
             <mesh>
               <boxGeometry args={[2.5, 2.5, 8]} />
               <primitive object={armorMaterial} attach="material" />
             </mesh>
             <mesh position={[0, 0, 4]}>
               <boxGeometry args={[2, 2, 2]} />
               <primitive object={paintedMaterial} attach="material" />
             </mesh>
             <Thruster position={[0, 0, -4]} scale={3} glowColor={glowColor} ship={ship} />
             
             {/* Massive Side Cannons */}
             <group position={[x > 0 ? 1.5 : -1.5, 0, 0]}>
                <mesh>
                   <boxGeometry args={[1.5, 1.5, 2]} />
                   <primitive object={darkMaterial} attach="material" />
                </mesh>
                <mesh position={[x > 0 ? 1 : -1, 0, 0]} rotation={[0, 0, Math.PI/2]}>
                   <cylinderGeometry args={[0.3, 0.3, 2, 12]} />
                   <meshStandardMaterial color="#111" />
                </mesh>
                <WeaponMuzzle position={[x > 0 ? 2 : -2, 0, 0]} glowColor={glowColor} ship={ship} scale={4} />
             </group>
           </group>
        ))}

        {/* Central Behemoth Engines */}
        <group position={[0, 0, -8]}>
           {[-1.5, 1.5].map((x, i) => (
              <Thruster key={i} position={[x, 0.5, 0]} scale={2.5} glowColor={glowColor} ship={ship} />
           ))}
           {[-1.5, 1.5].map((x, i) => (
              <Thruster key={i} position={[x, -0.5, 0]} scale={2.5} glowColor={glowColor} ship={ship} />
           ))}
        </group>

        {/* Command Citadel */}
        <group position={[0, 2.5, -3]}>
           <mesh>
             <boxGeometry args={[3, 2.5, 4]} />
             <primitive object={armorMaterial} attach="material" />
           </mesh>
           <mesh position={[0, 1.5, 1]}>
             <boxGeometry args={[2, 1.5, 2]} />
             <primitive object={paintedMaterial} attach="material" />
           </mesh>
           <mesh position={[0, 1.8, 2.1]}>
             <boxGeometry args={[1.8, 0.5, 0.2]} />
             <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={4} />
           </mesh>
           <CockpitLight position={[0, 2, 2.3]} glowColor={glowColor} ship={ship} scale={4} />
           <Antenna pos={[1, 2.5, -0.5]} scale={3} />
           <Antenna pos={[-1, 2.5, -0.5]} scale={3} />
        </group>
        
        {/* Central Spine Weapons */}
        {[-2, 2, 6].map((z, i) => (
           <group key={i} position={[0, 1.8, z]}>
              <mesh>
                 <boxGeometry args={[1.5, 1, 1.5]} />
                 <primitive object={paintedMaterial} attach="material" />
              </mesh>
              <mesh position={[0, 0.6, 0]}>
                 <sphereGeometry args={[0.6, 16, 16]} />
                 <primitive object={darkMaterial} attach="material" />
              </mesh>
              <mesh position={[0, 0.6, 0.8]} rotation={[Math.PI/2, 0, 0]}>
                 <cylinderGeometry args={[0.15, 0.15, 1.6, 12]} />
                 <meshStandardMaterial color="#111" />
              </mesh>
              <WeaponMuzzle position={[0, 0.6, 1.8]} glowColor={glowColor} ship={ship} scale={2} />
           </group>
        ))}
      </group>
    );
  }

  // 6. FIGHTER: Ultra-advanced Air-Superiority stealth aircraft, extreme detail
  return (
    <group>
      {/* Hyper-detailed Core Fuselage */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.2, 0.8, 5]} />
        <primitive object={darkMaterial} attach="material" />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.5, 0.7, 4.8, 8]} rotation={[Math.PI/2, 0, 0]} />
        <primitive object={armorMaterial} attach="material" />
      </mesh>
      <mesh position={[0, -0.3, 0]}>
        <boxGeometry args={[1.4, 0.3, 4]} />
        <primitive object={darkMaterial} attach="material" />
      </mesh>

      {/* Splayed Stealth Nose Assembly */}
      <group position={[0, 0, 2.5]}>
        <mesh position={[0.3, 0.1, 0.5]} rotation={[0, -0.15, 0]}>
          <boxGeometry args={[0.15, 0.2, 1.8]} />
          <primitive object={paintedMaterial} attach="material" />
        </mesh>
        <mesh position={[-0.3, 0.1, 0.5]} rotation={[0, 0.15, 0]}>
          <boxGeometry args={[0.15, 0.2, 1.8]} />
          <primitive object={paintedMaterial} attach="material" />
        </mesh>
        {/* Forward sensor array */}
        <mesh position={[0, 0, 1.2]}>
           <boxGeometry args={[0.2, 0.15, 0.3]} />
           <meshStandardMaterial color="#000" emissive={glowColor} emissiveIntensity={2} />
        </mesh>
        {/* Pitot / Scanner Spike */}
        <mesh position={[0, 0, 1.5]} rotation={[Math.PI/2, 0, 0]}>
           <cylinderGeometry args={[0.02, 0.02, 0.8, 8]} />
           <meshStandardMaterial color="#555" />
        </mesh>
      </group>

      {/* Armored Cockpit and Canopy */}
      <group position={[0, 0.6, 1.2]}>
        <mesh>
           <boxGeometry args={[0.8, 0.6, 1.5]} />
           <primitive object={darkMaterial} attach="material" />
        </mesh>
        {/* Faceted stealth glass components */}
        <mesh position={[0, 0.3, 0.2]} rotation={[0.2, 0, 0]}>
           <boxGeometry args={[0.6, 0.2, 1.2]} />
           <meshStandardMaterial color="#050510" metalness={1} roughness={0} />
        </mesh>
        {/* HUD Glow from inside */}
        <mesh position={[0, 0.2, 0.5]}>
           <boxGeometry args={[0.4, 0.1, 0.1]} />
           <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={5} />
        </mesh>
        <CockpitLight position={[0, 0.25, 0.55]} glowColor={glowColor} ship={ship} />
      </group>

      {/* Layered Advanced Wings */}
      <group position={[0, 0, -0.6]}>
        {/* Primary swept combat wings */}
        <mesh position={[2.2, 0.1, 0]} rotation={[0, -0.2, 0]}>
           <boxGeometry args={[4, 0.08, 2]} />
           <primitive object={paintedMaterial} attach="material" />
        </mesh>
        <mesh position={[-2.2, 0.1, 0]} rotation={[0, 0.2, 0]}>
           <boxGeometry args={[4, 0.08, 2]} />
           <primitive object={paintedMaterial} attach="material" />
        </mesh>
        
        {/* Underwing layered plates */}
        <mesh position={[1.8, 0.05, -0.2]} rotation={[0, -0.1, 0]}>
           <boxGeometry args={[3, 0.04, 1.8]} />
           <primitive object={armorMaterial} attach="material" />
        </mesh>
        <mesh position={[-1.8, 0.05, -0.2]} rotation={[0, 0.1, 0]}>
           <boxGeometry args={[3, 0.04, 1.8]} />
           <primitive object={armorMaterial} attach="material" />
        </mesh>

        {/* Secondary forward canards */}
        <mesh position={[1.4, 0.2, 2.2]} rotation={[0, -0.4, 0]}>
           <boxGeometry args={[2, 0.05, 0.8]} />
           <primitive object={armorMaterial} attach="material" />
        </mesh>
        <mesh position={[-1.4, 0.2, 2.2]} rotation={[0, 0.4, 0]}>
           <boxGeometry args={[2, 0.05, 0.8]} />
           <primitive object={armorMaterial} attach="material" />
        </mesh>

        {/* Wing-integrated weapon cores */}
        <group position={[3.8, 0.1, 1.2]}>
           <mesh>
             <boxGeometry args={[0.4, 0.3, 2.5]} />
             <primitive object={darkMaterial} attach="material" />
           </mesh>
           <mesh position={[0, 0, 1.4]} rotation={[Math.PI/2, 0, 0]}>
             <cylinderGeometry args={[0.06, 0.06, 1.5, 8]} />
             <meshStandardMaterial color="#222" />
           </mesh>
           <mesh position={[0, 0, 2.2]} rotation={[Math.PI/2, 0, 0]}>
             <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
             <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={8} />
           </mesh>
           <WeaponMuzzle position={[0, 0, 2.5]} glowColor={glowColor} ship={ship} scale={1.5} />
        </group>
        <group position={[-3.8, 0.1, 1.2]}>
           <mesh>
             <boxGeometry args={[0.4, 0.3, 2.5]} />
             <primitive object={darkMaterial} attach="material" />
           </mesh>
           <mesh position={[0, 0, 1.4]} rotation={[Math.PI/2, 0, 0]}>
             <cylinderGeometry args={[0.06, 0.06, 1.5, 8]} />
             <meshStandardMaterial color="#222" />
           </mesh>
           <mesh position={[0, 0, 2.2]} rotation={[Math.PI/2, 0, 0]}>
             <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
             <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={8} />
           </mesh>
           <WeaponMuzzle position={[0, 0, 2.5]} glowColor={glowColor} ship={ship} scale={1.5} />
        </group>
      </group>

      {/* Dorsal cooling vents and paneling */}
      <group position={[0, 0.7, -0.5]}>
         <Vent pos={[0, 0, 0]} scale={1.5} />
         <Vent pos={[0, 0, -0.8]} scale={1.5} />
      </group>
      
      {/* Central power spine */}
      <mesh position={[0, 0.6, -1]}>
         <boxGeometry args={[0.3, 0.1, 2]} />
         <meshStandardMaterial color="#000" emissive={glowColor} emissiveIntensity={1} />
      </mesh>

      {/* Canted Stealth Vertical Stabilizers */}
      <group position={[0, 0.8, -1.8]}>
         <mesh position={[1.2, 0.5, 0]} rotation={[0, 0, 0.4]}>
            <boxGeometry args={[0.08, 2.2, 1.8]} />
            <primitive object={armorMaterial} attach="material" />
         </mesh>
         <mesh position={[-1.2, 0.5, 0]} rotation={[0, 0, -0.4]}>
            <boxGeometry args={[0.08, 2.2, 1.8]} />
            <primitive object={armorMaterial} attach="material" />
         </mesh>
      </group>

      {/* High-Performance Twin Engines */}
      <Thruster position={[0.6, 0, -2.5]} glowColor={glowColor} scale={1.2} ship={ship} />
      <Thruster position={[-0.6, 0, -2.5]} glowColor={glowColor} scale={1.2} ship={ship} />

      {/* Undercarriage Details */}
      <mesh position={[0.4, -0.5, 0]}>
        <boxGeometry args={[0.4, 0.2, 1]} />
        <primitive object={armorMaterial} attach="material" />
      </mesh>
      <mesh position={[-0.4, -0.5, 0]}>
        <boxGeometry args={[0.4, 0.2, 1]} />
        <primitive object={armorMaterial} attach="material" />
      </mesh>
      <Antenna pos={[0, -0.5, 1]} rot={[0, 0, Math.PI]} />
    </group>
  );
};
