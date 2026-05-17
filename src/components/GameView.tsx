/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Float, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Joystick } from 'react-joystick-component';
import { GameEngine } from '../game/engine';
import { Team, ShipType } from '../types';
import { ShipModel } from './ShipModel';
import { Radar } from './Radar';
import { Move, Crosshair, Target, Zap, Rocket, Shield, Maximize, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Cpu } from "lucide-react";

export const inputState = {
  up: false,
  down: false,
  left: false,
  right: false,
  firePrimary: false,
  fireSecondary: false,
  ability: false,
  target: false,
  joystick: { x: 0, y: 0 }
};

interface GameViewProps {
  playerType: ShipType;
  upgrades: any;
  onExit: (earned: number, restart?: boolean) => void;
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

const BulletSystem: React.FC<{ engine: GameEngine }> = ({ engine }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const [geometry] = useState(() => new THREE.SphereGeometry(1, 8, 8)); // Base radius 1, scaled down
  const [material] = useState(() => new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1.0, toneMapped: false }));

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(1000 * 3), 3);
    }
  }, []);

  useFrame(() => {
    if (!meshRef.current) return;
    const bullets = engine.bullets;
    const count = Math.min(bullets.length, 1000);
    meshRef.current.count = count;

    for (let i = 0; i < count; i++) {
      const b = bullets[i];
      tempObject.position.set(b.x, b.z, b.y);
      const s = b.isMissile ? 3 : 1.5; // Bigger
      tempObject.scale.set(s, s, s);
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);

      let colorHex = 0xffffff;
      if (b.team === Team.PLAYER) {
         colorHex = b.colorVariant ? 0x60a5fa : 0x1e3a8a; // Light blue / Dark blue
      } else {
         colorHex = b.colorVariant ? 0xef4444 : 0x7f1d1d; // Light red / Dark red
      }
      if (b.isMissile) {
         colorHex = 0xff9900; // Orange for missiles to distinguish
      }
      tempColor.setHex(colorHex);
      tempColor.multiplyScalar(2.0); // Make it glow / very bright
      meshRef.current.setColorAt(i, tempColor);
    }
    
    if (count > 0) {
      meshRef.current.instanceMatrix.needsUpdate = true;
      if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, 1000]} />
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
      <ShipModel type={ship.type} teamColor={ship.team === Team.PLAYER ? "#3b82f6" : "#ef4444"} isPlayer={isPlayer} ship={ship} />
      {ship.abilityActive && ship.type === ShipType.TANK && (
        <mesh>
          <sphereGeometry args={[ship.config.size * 0.1, 16, 16]} />
          <meshBasicMaterial color="#93c5fd" transparent opacity={0.2} wireframe />
        </mesh>
      )}
      {ship.shield > 0 && (
        <mesh>
          <sphereGeometry args={[ship.config.size * 0.12, 32, 32]} />
          <meshBasicMaterial color={ship.team === Team.PLAYER ? "#3b82f6" : "#ef4444"} transparent opacity={0.15 * (ship.shield / ship.maxShield)} wireframe={false} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      )}
    </group>
  );
};

// Separate HUD component to prevent Canvas re-renders
const MobileControls = () => {
  return (
    <div 
      className="fixed inset-0 pointer-events-none flex justify-between items-end p-4 md:p-8 z-30 bottom-8 select-none touch-callout-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Directional Controls */}
      <div className="relative pointer-events-auto opacity-70 touch-none ml-4 mb-4">
        <Joystick 
          size={120} 
          stickSize={50} 
          baseColor="rgba(255,255,255,0.1)" 
          stickColor="rgba(255,255,255,0.4)" 
          move={(e: any) => {
            inputState.joystick.x = e.x || 0;
            inputState.joystick.y = e.y || 0;
          }} 
          stop={() => {
            inputState.joystick.x = 0;
            inputState.joystick.y = 0;
          }}
        />
      </div>

      {/* Action Controls */}
      <div className="flex gap-2 pointer-events-auto opacity-80 flex-col items-end touch-none">
        <div className="flex gap-4 mb-2 mr-4">
          <button 
            onPointerDown={() => inputState.target = true}
            onPointerUp={() => inputState.target = false}
            onPointerLeave={() => inputState.target = false}
            onTouchStart={(e) => { e.preventDefault(); inputState.target = true; }}
            onTouchEnd={(e) => { e.preventDefault(); inputState.target = false; }}
            className="w-12 h-12 bg-green-500/20 rounded-full flex justify-center items-center backdrop-blur border border-green-500/30 active:bg-green-500/40 text-green-500"
          ><Target className="w-6 h-6" /></button>
          <button 
            onPointerDown={() => inputState.ability = true}
            onPointerUp={() => inputState.ability = false}
            onPointerLeave={() => inputState.ability = false}
            onTouchStart={(e) => { e.preventDefault(); inputState.ability = true; }}
            onTouchEnd={(e) => { e.preventDefault(); inputState.ability = false; }}
            className="w-12 h-12 bg-yellow-500/20 rounded-full flex justify-center items-center backdrop-blur border border-yellow-500/30 active:bg-yellow-500/40 text-yellow-500"
          ><Cpu className="w-6 h-6" /></button>
        </div>
        <div className="flex gap-4">
           <button 
             onPointerDown={() => inputState.fireSecondary = true}
             onPointerUp={() => inputState.fireSecondary = false}
             onPointerLeave={() => inputState.fireSecondary = false}
             onTouchStart={(e) => { e.preventDefault(); inputState.fireSecondary = true; }}
             onTouchEnd={(e) => { e.preventDefault(); inputState.fireSecondary = false; }}
             className="w-16 h-16 bg-red-500/20 rounded-full flex justify-center items-center backdrop-blur border border-red-500/30 active:bg-red-500/40 text-[10px] font-black uppercase text-red-500"
           ><Rocket className="w-8 h-8" /></button>
           <button 
             onPointerDown={() => inputState.firePrimary = true}
             onPointerUp={() => inputState.firePrimary = false}
             onPointerLeave={() => inputState.firePrimary = false}
             onTouchStart={(e) => { e.preventDefault(); inputState.firePrimary = true; }}
             onTouchEnd={(e) => { e.preventDefault(); inputState.firePrimary = false; }}
             className="w-20 h-20 bg-blue-500/20 rounded-full flex justify-center items-center backdrop-blur border border-blue-500/30 active:bg-blue-500/40 text-[12px] font-black uppercase text-blue-500"
           ><Crosshair className="w-10 h-10" /></button>
        </div>
      </div>
    </div>
  );
};

const HUD: React.FC<{ engine: GameEngine, onExit: (restart?: boolean) => void }> = ({ engine, onExit }) => {
  const [hudState, setHudState] = useState({
    playerHealth: 0,
    playerMaxHealth: 1,
    playerShield: 0,
    playerMaxShield: 1,
    playerAbilityCooldown: 0,
    playerKills: 0,
    playerSpeed: 0,
    teamCount: 0,
    enemyCount: 0,
    playerMSHealth: 0,
    enemyMSHealth: 0,
    gameOver: false,
    winner: null as Team | null,
    playerType: ShipType.FIGHTER,
    respawnTimer: 0,
    earnedCredits: 0
  });

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        console.warn("Fullscreen API is not supported or was blocked");
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = 0;

    const updateHud = (time: number) => {
      animationFrameId = requestAnimationFrame(updateHud);
      if (time - lastTime < 50) return;
      lastTime = time;

      const player = engine.player;
      const playerMS = engine.motherships.find(m => m.team === Team.PLAYER);
      const enemyMS = engine.motherships.find(m => m.team === Team.ENEMY);
      
      let speed = 0;
      if (player && player.health > 0) {
        speed = Math.floor(Math.sqrt(player.vx**2 + player.vy**2) * 10);
      }

      setHudState({
        playerHealth: player?.health || 0,
        playerMaxHealth: player?.maxHealth || 1,
        playerShield: player?.shield || 0,
        playerMaxShield: player?.maxShield || 1,
        playerAbilityCooldown: Math.max(0, (player?.config.abilityCooldown || 0) - (Date.now() - (player?.lastAbilityUsed || 0))),
        playerKills: engine.playerKills,
        playerSpeed: speed,
        teamCount: engine.ships.filter(s => s.team === Team.PLAYER).length,
        enemyCount: engine.ships.filter(s => s.team === Team.ENEMY).length,
        playerMSHealth: playerMS?.health || 0,
        enemyMSHealth: enemyMS?.health || 0,
        gameOver: engine.gameOver,
        winner: engine.winner,
        playerType: player?.type || ShipType.FIGHTER,
        respawnTimer: engine.playerRespawnTimer,
        earnedCredits: engine.earnedCredits
      });
    };

    animationFrameId = requestAnimationFrame(updateHud);
    return () => cancelAnimationFrame(animationFrameId);
  }, [engine]);

  return (
    <div className="fixed inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-6 z-40">
      <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1 items-start bg-slate-950/20 backdrop-blur pb-2 px-3 pt-1 rounded border border-blue-500/10">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-400 drop-shadow-md">Aliança</h3>
            <div className="text-xl font-black text-white drop-shadow-md leading-none">{hudState.teamCount} <span className="text-[10px] text-blue-200">ATIVOS</span></div>
            <div className="w-24 h-1 bg-slate-900 rounded-full overflow-hidden mt-1 shadow-[0_0_5px_rgba(0,0,0,0.5)]">
               <div className="h-full bg-blue-500 shadow-[0_0_8px_#3b82f6] transition-all" style={{ width: `${(hudState.playerMSHealth / 2000) * 100}%` }} />
            </div>
            <div className="flex gap-3 mt-1">
              <div className="text-[10px] font-black tracking-wider text-green-400">KILLS: {hudState.playerKills}</div>
              <div className="text-[10px] font-black tracking-wider text-yellow-400">VELOC: {hudState.playerSpeed} U/s</div>
            </div>
          </div>
          
          <div className="pointer-events-auto hidden sm:block">
            <button onClick={toggleFullScreen} className="p-2 text-white/50 hover:text-white transition-colors bg-black/20 rounded border border-white/10">
               <Maximize className="w-4 h-4 shadow-sm" />
            </button>
          </div>

          <div className="flex flex-col gap-1 items-end text-right bg-slate-950/20 backdrop-blur pb-2 px-3 pt-1 rounded border border-red-500/10">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-red-500 drop-shadow-md">Inimigos</h3>
            <div className="text-xl font-black text-white drop-shadow-md leading-none">{hudState.enemyCount} <span className="text-[10px] text-red-200">ALVOS</span></div>
            <div className="w-24 h-1 bg-slate-900 rounded-full overflow-hidden mt-1 shadow-[0_0_5px_rgba(0,0,0,0.5)]">
               <div className="h-full bg-red-500 shadow-[0_0_8px_#ef4444] transition-all" style={{ width: `${(hudState.enemyMSHealth / 2000) * 100}%` }} />
            </div>
          </div>
        </div>

        <div className="flex justify-center items-end pb-8 pointer-events-none">
           <div className="flex flex-col items-center gap-1 bg-slate-950/40 backdrop-blur-md px-6 py-2 rounded-xl border border-white/5 shadow-xl">
              <div className="text-[10px] font-black uppercase tracking-widest text-blue-400 drop-shadow-md">
                 {hudState.respawnTimer > 0 
                   ? `REENTRADA ${(hudState.respawnTimer / 1000).toFixed(1)}S` 
                   : `INTEGRIDADE ${hudState.playerType}`}
              </div>
              
              <div className="flex items-center gap-2">
                 <div className="text-3xl font-black text-white drop-shadow-md leading-none tracking-tighter">
                    {Math.ceil(hudState.playerHealth)}<span className="text-[14px] text-blue-300 ml-1">HP</span>
                 </div>
              </div>

              <div className="relative w-48 h-2 bg-slate-900 rounded-full overflow-hidden shadow-[0_0_5px_rgba(0,0,0,0.5)] mt-1 border border-white/5">
                 <div className="absolute top-0 left-0 bottom-0 bg-blue-500 transition-all duration-300 shadow-[0_0_10px_#3b82f6]" style={{ width: `${(hudState.playerHealth / hudState.playerMaxHealth) * 100}%` }} />
              </div>
              {hudState.playerShield > 0 && (
                <div className="relative w-48 h-1 bg-slate-900 overflow-hidden shadow-[0_0_5px_rgba(0,0,0,0.5)] mt-1 border border-white/5">
                   <div className="absolute top-0 left-0 bottom-0 bg-blue-300 transition-all duration-300 shadow-[0_0_10px_#93c5fd]" style={{ width: `${(hudState.playerShield / hudState.playerMaxShield) * 100}%` }} />
                </div>
              )}
              <div className="w-48 flex justify-between mt-1">
                 <span className="text-[8px] font-black text-slate-500 uppercase">Esp</span>
                 <span className={`text-[8px] font-black ${hudState.playerAbilityCooldown === 0 ? 'text-yellow-400 drop-shadow-[0_0_5px_#facc15]' : 'text-slate-600'}`}>{hudState.playerAbilityCooldown === 0 ? 'PRONTO' : 'RECARGA'}</span>
              </div>
           </div>
        </div>

        {hudState.gameOver && (
          <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl flex items-center justify-center z-50 p-6 pointer-events-auto">
             <div className="text-center p-8 md:p-16 bg-slate-950 border border-white/5 rounded-[40px] md:rounded-[60px] shadow-2xl w-full max-w-2xl">
                <h1 className={`text-6xl md:text-8xl font-black mb-6 tracking-tighter uppercase ${hudState.winner === Team.PLAYER ? 'text-blue-500 drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]' : 'text-red-600'}`}>
                   {hudState.winner === Team.PLAYER ? 'Vitória' : 'Derrota'}
                </h1>
                <p className="text-slate-400 text-sm md:text-lg font-medium mb-12 tracking-tight opacity-70">
                   {hudState.winner === Team.PLAYER 
                     ? 'A hegemonia inimiga foi destruída. O quadrante está seguro.' 
                     : 'A frota foi dizimada. A resistência terminou.'}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center">
                   <button 
                     onClick={() => onExit(true)} 
                     className="bg-white text-black px-8 py-4 md:px-12 md:py-5 rounded-2xl font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all text-xs md:text-sm pointer-events-auto"
                   >
                      Reiniciar Missão
                   </button>
                   <button 
                     onClick={() => onExit(false)} 
                     className="bg-slate-900 text-white px-8 py-4 md:px-12 md:py-5 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-slate-800 active:scale-95 transition-all text-xs md:text-sm pointer-events-auto flex items-center justify-center gap-2"
                   >
                      Menu Principal
                      <span className="text-blue-400 font-bold ml-2">({hudState.earnedCredits} CR)</span>
                   </button>
                </div>
             </div>
          </div>
        )}

        {!hudState.gameOver && <MobileControls />}
      </div>
  );
};

const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();

const ParticleSystem: React.FC<{ engine: GameEngine }> = ({ engine }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  // Create a minimal icosahedron for particles (low poly)
  const [geometry] = useState(() => new THREE.IcosahedronGeometry(1, 0));
  const [material] = useState(() => new THREE.MeshBasicMaterial({ 
    color: 0xffffff,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  }));

  useEffect(() => {
     if (meshRef.current) {
         // Pre-allocate color buffer to avoid GPU driver crashes on dynamic array allocations
         meshRef.current.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(engine.particles.length * 3), 3);
     }
  }, [engine.particles.length]);

  useFrame(() => {
    if (!meshRef.current) return;
    
    const maxParticles = engine.particles.length;
    let count = 0;
    
    // We update all active particles
    for (let i = 0; i < maxParticles; i++) {
       const p = engine.particles[i];
       if (p.active) {
          // X -> X, Z -> Y, Y -> Z
          tempObject.position.set(p.x, p.z, p.y);
          // Scale down based on life
          const scale = p.size * Math.max(0, p.life / p.maxLife);
          tempObject.scale.set(scale, scale, scale);
          tempObject.updateMatrix();
          
          meshRef.current.setMatrixAt(count, tempObject.matrix);
          tempColor.setHex(p.color);
          meshRef.current.setColorAt(count, tempColor);
          count++;
       }
    }
    
    meshRef.current.count = count;
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
        meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
     <instancedMesh ref={meshRef} args={[geometry, material, engine.particles.length]} />
  );
};

const GameScene: React.FC<{ engine: GameEngine, onExit: (restart?: boolean) => void }> = ({ engine, onExit }) => {
  const playerRef = useRef<THREE.Group>(null);
  const keys = useRef<Set<string>>(new Set());
  const mouse = useRef({ left: false, right: false });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => keys.current.add(e.key.toLowerCase());
    const handleKeyUp = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    const handleMouseDown = (e: MouseEvent | TouchEvent) => {
      // Allow shooting and avoid conflict with HUD buttons
      if (e.target && (e.target as HTMLElement).closest && (e.target as HTMLElement).closest('.pointer-events-auto')) return;
      if ('button' in e) {
        if (e.button === 0) mouse.current.left = true;
        if (e.button === 2) mouse.current.right = true;
      } else {
        // Touch event
        mouse.current.left = true;
      }
    };
    const handleMouseUp = (e: MouseEvent | TouchEvent) => {
      if ('button' in e) {
        if (e.button === 0) mouse.current.left = false;
        if (e.button === 2) mouse.current.right = false;
      } else {
        // Touch event
        mouse.current.left = false;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown as EventListener);
    window.addEventListener('mouseup', handleMouseUp as EventListener);
    window.addEventListener('touchstart', handleMouseDown as EventListener, { passive: false });
    window.addEventListener('touchend', handleMouseUp as EventListener);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown as EventListener);
      window.removeEventListener('mouseup', handleMouseUp as EventListener);
      window.removeEventListener('touchstart', handleMouseDown as EventListener);
      window.removeEventListener('touchend', handleMouseUp as EventListener);
    };
  }, []);

  useFrame((state, delta) => {
    const player = engine.player;
    if (player && player.health > 0) {
      if (inputState.joystick.x !== 0 || inputState.joystick.y !== 0) {
        // Joystick gives y positive for UP. Game engine uses y positive for DOWN (since it maps to 3D Z-axis usually).
        const targetAngle = Math.atan2(-inputState.joystick.y, inputState.joystick.x);
        
        // Rotate towards target angle smoothly but quickly
        const diff = targetAngle - player.angle;
        const normalizedDiff = Math.atan2(Math.sin(diff), Math.cos(diff));
        player.angle += Math.sign(normalizedDiff) * Math.min(Math.abs(normalizedDiff), player.config.rotationSpeed * 3);
        
        // Move with speed based on distance along the TARGET angle, not the player angle.
        // This makes it so pushing "Forward" (Up) immediately pushes the ship up globally.
        const distance = Math.min(1, Math.sqrt(inputState.joystick.x**2 + inputState.joystick.y**2) / 40);
        player.vx += Math.cos(targetAngle) * player.config.speed * 0.15 * distance;
        player.vy += Math.sin(targetAngle) * player.config.speed * 0.15 * distance;
      } else {
        if (keys.current.has('w') || inputState.up) {
          player.vx += Math.cos(player.angle) * player.config.speed * 0.15;
          player.vy += Math.sin(player.angle) * player.config.speed * 0.15;
        }
        if (keys.current.has('s') || inputState.down) {
          player.vx -= Math.cos(player.angle) * player.config.speed * 0.1;
          player.vy -= Math.sin(player.angle) * player.config.speed * 0.1;
        }
        if (keys.current.has('a') || inputState.left) player.angle -= player.config.rotationSpeed;
        if (keys.current.has('d') || inputState.right) player.angle += player.config.rotationSpeed;
      }

      if (keys.current.has('e') || inputState.target) {
        let nearestEnemy = engine.getNearestTargetTo(player.x, player.y, player.team);
        if (nearestEnemy) {
          player.angle = Math.atan2(nearestEnemy.y - player.y, nearestEnemy.x - player.x);
        }
      }

      if (mouse.current.left || inputState.firePrimary) player.fire(engine, false);
      if (mouse.current.right || inputState.fireSecondary) player.fire(engine, true);
      if (keys.current.has(' ') || inputState.ability) player.useAbility(engine);
    }

    engine.update();
  });

  return (
    <>
      <ChaseCamera playerRef={playerRef} />
      <ambientLight intensity={4.5} />
      <directionalLight position={[100, 200, 100]} intensity={6.5} color="#fff4e6" shadow />
      <pointLight position={[-100, -100, -100]} intensity={3} color="#3b82f6" />
      <color attach="background" args={['#070716']} />
      <fog attach="fog" args={['#070716', 500, 7000]} />
      <Stars radius={500} depth={50} count={15000} factor={4} saturation={0.5} fade speed={1} />
      
      {/* Planetas */}
      <mesh position={[1500, -500, -3000]}>
        <sphereGeometry args={[400, 32, 32]} />
        <meshStandardMaterial color="#4f46e5" roughness={0.7} />
      </mesh>
      <mesh position={[-2500, 800, 2000]}>
        <sphereGeometry args={[800, 32, 32]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.9} />
        <mesh rotation={[Math.PI / 2.2, 0, 0]}>
          <ringGeometry args={[1000, 1400, 64]} />
          <meshStandardMaterial color="#fca5a5" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      </mesh>
      <mesh position={[3000, 2000, 1500]}>
        <sphereGeometry args={[200, 32, 32]} />
        <meshStandardMaterial color="#10b981" roughness={0.6} emissive="#064e3b" emissiveIntensity={0.2} />
      </mesh>

      <ParticleSystem engine={engine} />

      {/* Rest of scene as before */}
      {engine.ships.map((ship) => (
        <Ship3D key={ship.id} ship={ship} isPlayer={ship.isPlayer} playerRef={ship.isPlayer ? playerRef : undefined} />
      ))}

      <BulletSystem engine={engine} />

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

export const GameView: React.FC<GameViewProps> = ({ playerType, upgrades, onExit }) => {
  const [engine] = useState(() => new GameEngine());

  useEffect(() => {
    engine.init(playerType, upgrades);
  }, [playerType, engine, upgrades]);

  // We should pass onExit down to HUD
  return (
    <div 
      className="relative w-full h-screen overflow-hidden bg-black text-white font-sans select-none touch-callout-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      <Canvas shadows camera={{ fov: 60 }}>
        <GameScene engine={engine} onExit={(restart) => onExit(engine.earnedCredits, restart)} />
      </Canvas>
      <HUD engine={engine} onExit={onExit} />
      <Radar engine={engine} />
    </div>
  );
};
