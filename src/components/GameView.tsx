/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Float, Html } from '@react-three/drei';
import * as THREE from 'three';
import { GameEngine } from '../game/engine';
import { Team, ShipType } from '../types';
import { ShipModel } from './ShipModel';

interface GameViewProps {
  playerType: ShipType;
  onExit: () => void;
}

// Separate component for the camera logic
const ChaseCamera: React.FC<{ playerRef: React.MutableRefObject<THREE.Group | null> }> = ({ playerRef }) => {
  const { camera } = useThree();
  const offset = new THREE.Vector3(0, 12, -25); // Behind and above
  const lookAtOffset = new THREE.Vector3(0, 3, 20); // Look way in front

  useFrame(() => {
    if (playerRef.current) {
      const playerPos = playerRef.current.position;
      const playerRotation = playerRef.current.rotation;
      
      const desiredPosition = offset.clone().applyEuler(playerRotation).add(playerPos);
      camera.position.lerp(desiredPosition, 0.08); // Smooth chase
      
      const lookAtPos = lookAtOffset.clone().applyEuler(playerRotation).add(playerPos);
      camera.lookAt(lookAtPos);
    }
  });

  return null;
};

const Bullet3D: React.FC<{ bullet: any }> = ({ bullet }) => {
  const color = bullet.isMissile ? "#ffffff" : (bullet.team === Team.PLAYER ? "#60a5fa" : "#ef4444");
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.set(bullet.x, bullet.z, bullet.y);
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[bullet.isMissile ? 0.35 : 0.15]} />
      <meshBasicMaterial color={color} />
      {bullet.isMissile && <pointLight color="white" intensity={0.5} distance={10} />}
    </mesh>
  );
};

const Ship3D: React.FC<{ ship: any, isPlayer?: boolean, playerRef?: any }> = ({ ship, isPlayer, playerRef }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.set(ship.x, ship.z, ship.y);
      // Coordinate mapping: engine X,Y -> 3D X,Z. Angle -> rotation around Y.
      groupRef.current.rotation.set(ship.pitch, -ship.angle + Math.PI/2, ship.roll);
      
      if (isPlayer && playerRef) {
        playerRef.current = groupRef.current;
      }
    }
  });

  return (
    <group ref={groupRef}>
      <ShipModel type={ship.type} teamColor={ship.team === Team.PLAYER ? "#3b82f6" : "#ef4444"} isPlayer={isPlayer} />
      {ship.abilityActive && ship.type === ShipType.TANK && (
        <mesh>
          <sphereGeometry args={[ship.config.size * 0.1, 16, 16]} />
          <meshBasicMaterial color="#93c5fd" transparent opacity={0.2} wireframe />
        </mesh>
      )}
      {/* Ship HUD in world (optional, but engine trails look better) */}
      <Float floatIntensity={2} speed={5}>
          <pointLight color={ship.team === Team.PLAYER ? "#3b82f6" : "#ef4444"} intensity={0.5} distance={10} position={[0,0,-2]} />
      </Float>
    </group>
  );
};

// Separate HUD component to prevent Canvas re-renders
const HUD: React.FC<{ engine: GameEngine }> = ({ engine }) => {
  const [hudState, setHudState] = useState({
    playerHealth: 0,
    playerMaxHealth: 1,
    playerAbilityCooldown: 0,
    teamCount: 0,
    enemyCount: 0,
    playerMSHealth: 0,
    enemyMSHealth: 0,
    gameOver: false,
    winner: null as Team | null,
    playerType: ShipType.FIGHTER,
    respawnTimer: 0
  });

  useFrame(() => {
    const player = engine.player;
    const playerMS = engine.motherships.find(m => m.team === Team.PLAYER);
    const enemyMS = engine.motherships.find(m => m.team === Team.ENEMY);
    
    setHudState({
      playerHealth: player?.health || 0,
      playerMaxHealth: player?.maxHealth || 1,
      playerAbilityCooldown: Math.max(0, (player?.config.abilityCooldown || 0) - (Date.now() - (player?.lastAbilityUsed || 0))),
      teamCount: engine.ships.filter(s => s.team === Team.PLAYER).length,
      enemyCount: engine.ships.filter(s => s.team === Team.ENEMY).length,
      playerMSHealth: playerMS?.health || 0,
      enemyMSHealth: enemyMS?.health || 0,
      gameOver: engine.gameOver,
      winner: engine.winner,
      playerType: player?.type || ShipType.FIGHTER,
      respawnTimer: engine.playerRespawnTimer
    });
  });

  return (
    <Html fullscreen pointerEvents="none">
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8">
        <div className="flex justify-between items-start">
          <div className="bg-blue-950/30 backdrop-blur-md p-5 rounded-2xl border border-blue-500/30 shadow-2xl">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-1">Status da Aliança</h3>
            <div className="text-4xl font-black mb-3">{hudState.teamCount} <span className="text-sm font-medium text-slate-400">ATIVOS</span></div>
            <div className="w-56 h-1.5 bg-slate-900 rounded-full overflow-hidden">
               <div className="h-full bg-blue-500 shadow-[0_0_10px_#3b82f6] transition-all duration-700" style={{ width: `${(hudState.playerMSHealth / 2000) * 100}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-[9px] font-bold text-blue-300/60 uppercase">
               <span>Nave Mãe</span>
               <span>{Math.ceil(hudState.playerMSHealth)} HP</span>
            </div>
          </div>

          <div className="bg-red-950/30 backdrop-blur-md p-5 rounded-2xl border border-red-500/30 shadow-2xl text-right">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400 mb-1">Assinaturas Inimigas</h3>
            <div className="text-4xl font-black mb-3">{hudState.enemyCount} <span className="text-sm font-medium text-slate-400">DETECTADAS</span></div>
            <div className="w-56 h-1.5 bg-slate-900 rounded-full overflow-hidden ml-auto">
               <div className="h-full bg-red-500 shadow-[0_0_10px_#ef4444] transition-all duration-700" style={{ width: `${(hudState.enemyMSHealth / 2000) * 100}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-[9px] font-bold text-red-300/60 uppercase">
               <span>{Math.ceil(hudState.enemyMSHealth)} HP</span>
               <span>Fortaleza Alvo</span>
            </div>
          </div>
        </div>

        <div className="flex justify-center items-end gap-12 pb-6">
           <div className="bg-slate-950/40 backdrop-blur-2xl p-8 rounded-[40px] border border-white/5 w-[500px] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
              
              <div className="flex justify-between items-center mb-4">
                 <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Sistemas de Combate</div>
                    <div className="text-xs font-bold text-blue-400 uppercase tracking-tighter">
                       {hudState.respawnTimer > 0 
                         ? `REENTRADA EM ${(hudState.respawnTimer / 1000).toFixed(1)}S` 
                         : `${hudState.playerType} - ESTÁVEL`}
                    </div>
                 </div>
                 <div className="text-3xl font-black tracking-tighter text-white">
                    {Math.ceil(hudState.playerHealth)} <span className="text-[10px] font-bold text-slate-500">HP</span>
                 </div>
              </div>

              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden mb-8">
                 <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 transition-all duration-300" style={{ width: `${(hudState.playerHealth / hudState.playerMaxHealth) * 100}%` }} />
              </div>

              <div className="flex justify-around items-center gap-6">
                 <div className="flex-1 space-y-2">
                    <div className="flex justify-between text-[8px] font-black uppercase text-slate-500 tracking-widest">
                       <span>Primário</span>
                       <span className="text-blue-400 italic">Pronto</span>
                    </div>
                    <div className="h-1 bg-blue-500 rounded-full opacity-30" />
                 </div>
                 
                 <div className="w-24 h-24 rounded-full border-4 border-slate-900 flex items-center justify-center relative">
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                       <circle cx="48" cy="48" r="44" fill="transparent" stroke="#1e293b" strokeWidth="4" />
                       <circle 
                         cx="48" cy="48" r="44" fill="transparent" stroke="#3b82f6" strokeWidth="4" 
                         strokeDasharray={276} 
                         strokeDashoffset={276 - (276 * Math.min(1, 1 - hudState.playerAbilityCooldown / 4000))} 
                         className="transition-all duration-300"
                       />
                    </svg>
                    <div className="text-center">
                       <div className="text-[8px] font-black text-slate-500 uppercase">Especial</div>
                       <div className={`text-[10px] font-black ${hudState.playerAbilityCooldown > 0 ? 'text-slate-600' : 'text-blue-400 animate-pulse'}`}>
                          {hudState.playerAbilityCooldown > 0 ? `${(hudState.playerAbilityCooldown/1000).toFixed(1)}s` : 'READY'}
                       </div>
                    </div>
                 </div>

                 <div className="flex-1 space-y-2">
                    <div className="flex justify-between text-[8px] font-black uppercase text-slate-500 tracking-widest">
                       <span>Homing</span>
                       <span className="text-cyan-400 italic">Auto</span>
                    </div>
                    <div className="h-1 bg-cyan-500 rounded-full opacity-30" />
                 </div>
              </div>
           </div>
        </div>

        {hudState.gameOver && (
          <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl flex items-center justify-center z-50 p-6 pointer-events-auto">
             <div className="text-center p-16 bg-slate-950 border border-white/5 rounded-[60px] shadow-2xl max-w-2xl">
                <h1 className={`text-8xl font-black mb-6 tracking-tighter uppercase ${hudState.winner === Team.PLAYER ? 'text-blue-500 drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]' : 'text-red-600'}`}>
                   {hudState.winner === Team.PLAYER ? 'Vitória' : 'Derrota'}
                </h1>
                <p className="text-slate-400 text-lg font-medium mb-12 tracking-tight opacity-70">
                   {hudState.winner === Team.PLAYER 
                     ? 'A hegemonia inimiga foi destruída. O quadrante está seguro.' 
                     : 'A frota foi dizimada. A resistência terminou.'}
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                   <button 
                     onClick={() => window.location.reload()} 
                     className="bg-white text-black px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all text-sm pointer-events-auto"
                   >
                      Reiniciar Missão
                   </button>
                   <button 
                     onClick={() => window.location.reload()} 
                     className="bg-slate-900 text-white px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-slate-800 active:scale-95 transition-all text-sm pointer-events-auto"
                   >
                      Menu Principal
                   </button>
                </div>
             </div>
          </div>
        )}
      </div>
    </Html>
  );
};

const GameScene: React.FC<{ engine: GameEngine }> = ({ engine }) => {
  const playerRef = useRef<THREE.Group>(null);
  const keys = useRef<Set<string>>(new Set());
  const mouse = useRef({ left: false, right: false });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => keys.current.add(e.key.toLowerCase());
    const handleKeyUp = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) mouse.current.left = true;
      if (e.button === 2) mouse.current.right = true;
    };
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) mouse.current.left = false;
      if (e.button === 2) mouse.current.right = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useFrame((state, delta) => {
    const player = engine.player;
    if (player && player.health > 0) {
      if (keys.current.has('w')) {
        player.vx += Math.cos(player.angle) * player.config.speed * 0.15;
        player.vy += Math.sin(player.angle) * player.config.speed * 0.15;
      }
      if (keys.current.has('s')) {
        player.vx -= Math.cos(player.angle) * player.config.speed * 0.1;
        player.vy -= Math.sin(player.angle) * player.config.speed * 0.1;
      }
      if (keys.current.has('a')) player.angle += player.config.rotationSpeed;
      if (keys.current.has('d')) player.angle -= player.config.rotationSpeed;

      if (mouse.current.left) player.fire(engine, false);
      if (mouse.current.right) player.fire(engine, true);
      if (keys.current.has(' ')) player.useAbility(engine);
    }

    engine.update();
  });

  return (
    <>
      <HUD engine={engine} />
      <ChaseCamera playerRef={playerRef} />
      <ambientLight intensity={0.5} />
      <pointLight position={[100, 100, 100]} intensity={1.5} />
      <Stars radius={500} depth={50} count={15000} factor={4} saturation={0} fade speed={1} />
      
      {/* Rest of scene as before */}
      {engine.ships.map((ship) => (
        <Ship3D key={ship.id} ship={ship} isPlayer={ship.isPlayer} playerRef={ship.isPlayer ? playerRef : undefined} />
      ))}

      {engine.bullets.map((b, idx) => (
        <Bullet3D key={`b-${idx}-${b.life}-${b.x.toFixed(0)}`} bullet={b} />
      ))}

      {engine.motherships.map((ms, idx) => (
        <group key={`ms-${idx}`} position={[ms.x, ms.z, ms.y]}>
          {/* Main Core */}
          <mesh>
            <octahedronGeometry args={[ms.size / 2, 0]} />
            <meshStandardMaterial 
              color={ms.team === Team.PLAYER ? "#1e40af" : "#991b1b"} 
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
          {/* Outer Rotating Shield Rings */}
          <group>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[ms.size * 0.8, ms.size * 0.05, 16, 64]} />
              <meshStandardMaterial color={ms.team === Team.PLAYER ? "#60a5fa" : "#ef4444"} emissive={ms.team === Team.PLAYER ? "#3b82f6" : "#ef4444"} emissiveIntensity={2} transparent opacity={0.3} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[ms.size * 1.0, ms.size * 0.03, 16, 64]} />
              <meshStandardMaterial color={ms.team === Team.PLAYER ? "#60a5fa" : "#ef4444"} emissive={ms.team === Team.PLAYER ? "#3b82f6" : "#ef4444"} emissiveIntensity={1} transparent opacity={0.2} />
            </mesh>
          </group>
          {/* Internal Glow Pod */}
          <mesh>
            <octahedronGeometry args={[ms.size / 4, 0]} />
            <meshStandardMaterial color="white" emissive={ms.team === Team.PLAYER ? "#3b82f6" : "#ef4444"} emissiveIntensity={10} />
          </mesh>
          <pointLight color={ms.team === Team.PLAYER ? "#3b82f6" : "#ef4444"} intensity={20} distance={1500} />
          {/* Defensive Turret Turrets (small points) */}
          {[0, 1, 2, 3].map(i => (
             <mesh key={i} position={[Math.cos(i * Math.PI/2) * 50, 20, Math.sin(i * Math.PI/2) * 50]}>
                <boxGeometry args={[10, 10, 20]} />
                <meshStandardMaterial color="#333" />
             </mesh>
          ))}
        </group>
      ))}

      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <ringGeometry args={[engine.worldSize / 2, engine.worldSize / 2 + 10, 64]} />
        <meshBasicMaterial color="#1e293b" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
    </>
  );
};

export const GameView: React.FC<GameViewProps> = ({ playerType, onExit }) => {
  const [engine] = useState(() => new GameEngine());

  useEffect(() => {
    engine.init(playerType);
  }, [playerType, engine]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-white font-sans select-none">
      <Canvas shadows camera={{ fov: 60 }}>
        <GameScene engine={engine} />
      </Canvas>
    </div>
  );
};
