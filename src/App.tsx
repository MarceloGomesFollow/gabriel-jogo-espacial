/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, Suspense } from "react";
import { GameView } from "./components/GameView";
import { ShipType, SHIP_CONFIGS } from "./types";
import { motion, AnimatePresence } from "motion/react";
import { Rocket, Shield, Bomb, Crosshair, Wrench, ChevronLeft, Zap, Heart, Timer, Maximize, Anchor, Hammer } from "lucide-react";
import { Canvas } from "@react-three/fiber";
import { ShipModel } from "./components/ShipModel";
import { OrbitControls, Stage } from "@react-three/drei";

export interface Upgrades {
  health: number;
  speed: number;
  damage: number;
  cooldown: number;
}

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedShip, setSelectedShip] = useState<ShipType>(ShipType.FIGHTER);
  const [showUpgrades, setShowUpgrades] = useState(false);
  
  const [credits, setCredits] = useState(2500);
  const [upgrades, setUpgrades] = useState<Upgrades>({
    health: 0,
    speed: 0,
    damage: 0,
    cooldown: 0
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

  const handleStartGame = () => {
    setGameStarted(true);
  };

  const handleEarnCredits = (amount: number) => {
    setCredits(c => c + amount);
  };

  const upgradeParams = [
    { key: 'health' as keyof Upgrades, label: 'Resistência', icon: Heart, desc: '+15% HP Máximo', cost: 500, color: 'text-red-400', max: 10 },
    { key: 'speed' as keyof Upgrades, label: 'Propulsores', icon: Rocket, desc: '+10% Velocidade', cost: 400, color: 'text-blue-400', max: 5 },
    { key: 'damage' as keyof Upgrades, label: 'Armamento', icon: Zap, desc: '+20% Dano Base', cost: 800, color: 'text-amber-400', max: 8 },
    { key: 'cooldown' as keyof Upgrades, label: 'Sistemas', icon: Timer, desc: '-10% Recarga Hab.', cost: 600, color: 'text-cyan-400', max: 5 },
  ] as const;

  const buyUpgrade = (key: keyof Upgrades, cost: number, max: number) => {
    if (credits >= cost && upgrades[key] < max) {
      setCredits(c => c - cost);
      setUpgrades(u => ({ ...u, [key]: u[key] + 1 }));
    }
  };

  if (gameStarted) {
    return <GameView playerType={selectedShip} upgrades={upgrades} onExit={(earned, restart) => {
      handleEarnCredits(earned);
      if (restart) {
        // Just re-mount GameView by toggling off and immediately on
        setGameStarted(false);
        setTimeout(() => setGameStarted(true), 0);
      } else {
        setGameStarted(false);
      }
    }} />;
  }

  return (
    <div className="w-full min-h-screen bg-[#050508] text-white overflow-y-auto overflow-x-hidden flex flex-col items-center justify-center font-sans select-none py-12 md:py-0">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1),transparent_70%)] pointer-events-none" />
      
      <div className="absolute top-4 right-4 md:top-8 md:right-12 z-20 flex items-center gap-4 bg-slate-900/50 p-3 md:p-4 rounded-2xl md:rounded-3xl border border-blue-500/20 backdrop-blur-md">
         <button onClick={toggleFullScreen} className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all mr-2 group hidden sm:block">
            <Maximize className="w-4 h-4 md:w-5 md:h-5 text-slate-400 group-hover:text-white" />
         </button>
         <div className="text-right">
            <div className="text-[8px] md:text-[10px] text-blue-400 font-black uppercase tracking-widest">Créditos</div>
            <div className="text-xl md:text-2xl font-black text-white">{credits.toLocaleString()} <span className="text-xs md:text-sm font-bold text-slate-500">CR</span></div>
         </div>
      </div>

      <AnimatePresence mode="wait">
        {!showUpgrades ? (
          <motion.div 
            key="menu"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center w-full max-w-6xl z-10 px-4 mt-16 md:mt-0"
          >
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8 md:mb-12"
            >
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-2">Conquista <span className="text-blue-500">Galáctica</span></h1>
              <p className="text-slate-500 font-medium tracking-[0.2em] md:tracking-[0.3em] uppercase text-[8px] md:text-[10px]">Fleet Warfare Simulator v4.0</p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
              {Object.values(ShipType).map((type) => {
                const config = SHIP_CONFIGS[type];
                return (
                  <motion.div
                    key={type}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedShip(type)}
                    className={`cursor-pointer p-0 rounded-[2rem] md:rounded-[2.5rem] border-2 transition-all duration-300 flex flex-col items-center overflow-hidden ${
                      selectedShip === type 
                        ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.2)] md:shadow-[0_0_60px_rgba(59,130,246,0.2)]' 
                        : 'bg-slate-900/40 border-white/5 hover:border-white/20'
                    }`}
                  >
                     <div className="w-full h-40 md:h-48 bg-slate-950/50 relative overflow-hidden flex items-center justify-center">
                       {selectedShip === type ? (
                          <Suspense fallback={<div className="flex items-center justify-center h-full text-[10px] uppercase font-black opacity-20">Iniciando...</div>}>
                             <Canvas camera={{ position: [0, 5, 0.01], fov: 45 }}>
                                <color attach="background" args={['#070716']} />
                                <ambientLight intensity={3.5} />
                                <directionalLight position={[10, 10, 5]} intensity={4.5} color="#ffffff" shadow />
                                <pointLight position={[5, 5, 5]} intensity={3} />
                                <pointLight position={[-5, -5, -5]} intensity={3} color="#3b82f6" />
                                <group position={[0, 0, 0]}>
                                   <ShipModel type={type} teamColor="#3b82f6" />
                                </group>
                                <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} />
                             </Canvas>
                          </Suspense>
                       ) : (
                          <div className="opacity-20 flex flex-col items-center gap-4">
                             {type === ShipType.FIGHTER && <Crosshair className="w-12 h-12 text-blue-400" />}
                             {type === ShipType.TANK && <Shield className="w-12 h-12 text-blue-400" />}
                             {type === ShipType.BOMBER && <Bomb className="w-12 h-12 text-blue-400" />}
                             {type === ShipType.FAST_ATTACK && <Rocket className="w-12 h-12 text-blue-400" />}
                             {type === ShipType.CRUISER && <Anchor className="w-12 h-12 text-blue-400" />}
                             {type === ShipType.DESTROYER && <Hammer className="w-12 h-12 text-blue-400" />}
                             <span className="text-[10px] uppercase font-black tracking-widest text-white">Selecionar</span>
                          </div>
                       )}
                       <div className="absolute top-4 right-4 bg-black/60 p-2 rounded-full backdrop-blur">
                          {type === ShipType.FIGHTER && <Crosshair className="w-4 h-4 text-blue-400" />}
                          {type === ShipType.TANK && <Shield className="w-4 h-4 text-blue-400" />}
                          {type === ShipType.BOMBER && <Bomb className="w-4 h-4 text-blue-400" />}
                          {type === ShipType.FAST_ATTACK && <Rocket className="w-4 h-4 text-blue-400" />}
                          {type === ShipType.CRUISER && <Anchor className="w-4 h-4 text-blue-400" />}
                          {type === ShipType.DESTROYER && <Hammer className="w-4 h-4 text-blue-400" />}
                       </div>
                    </div>
                    
                    <div className="p-5 md:p-6 text-center w-full">
                       <h3 className="text-xl md:text-2xl font-black uppercase mb-1 tracking-tight">{type.replace('_', ' ')}</h3>
                       <p className="text-[8px] md:text-[9px] text-blue-400 font-black uppercase mb-4 tracking-[0.2em]">{config.abilityName}</p>
                       
                       <div className="w-full space-y-3">
                          <div>
                             <div className="flex justify-between items-center mb-1">
                                <span className="text-[8px] text-slate-500 font-black uppercase tracking-wider">Resistência</span>
                                <span className="text-xs font-black">{config.health}</span>
                             </div>
                             <div className="w-full h-1.5 bg-slate-800 rounded-full">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(config.health / 800) * 100}%` }} />
                             </div>
                          </div>
                          
                          <div>
                             <div className="flex justify-between items-center mb-1">
                                <span className="text-[8px] text-slate-500 font-black uppercase tracking-wider">Velocidade</span>
                                <span className="text-xs font-black">{config.speed.toFixed(1)}</span>
                             </div>
                             <div className="w-full h-1.5 bg-slate-800 rounded-full">
                                <div className="h-full bg-blue-400 rounded-full" style={{ width: `${(config.speed / 2.5) * 100}%` }} />
                             </div>
                          </div>
                       </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-12 md:mt-16 flex flex-col sm:flex-row gap-4 md:gap-6 w-full sm:w-auto">
               <motion.button
                 onClick={() => setShowUpgrades(true)}
                 className="bg-slate-800 text-white px-8 md:px-10 py-5 md:py-6 rounded-2xl md:rounded-3xl font-black uppercase tracking-[0.2em] md:tracking-[0.4em] hover:bg-slate-700 transition-all border border-slate-600 hover:border-slate-400 flex items-center justify-center gap-3 text-xs md:text-sm w-full sm:w-auto"
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
               >
                 <Wrench className="w-5 h-5" />
                 Aprimorar
               </motion.button>
               <motion.button
                 onClick={handleStartGame}
                 className="bg-blue-600 text-white px-8 md:px-20 py-5 md:py-6 rounded-2xl md:rounded-3xl font-black uppercase tracking-[0.2em] md:tracking-[0.4em] hover:bg-blue-500 transition-all shadow-[0_20px_40px_rgba(59,130,246,0.3)] md:shadow-[0_20px_50px_rgba(59,130,246,0.3)] hover:shadow-[0_20px_50px_rgba(59,130,246,0.6)] flex items-center justify-center text-xs md:text-sm w-full sm:w-auto"
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
               >
                 INICIAR OPERAÇÃO
               </motion.button>
            </div>
            
            <div className="mt-8 text-slate-600 text-[8px] md:text-[9px] uppercase font-black tracking-[0.2em] md:tracking-[0.3em] flex flex-wrap justify-center gap-4 md:gap-8 pb-8">
              <span>WASD: Piloto</span>
              <span>Mouse ESQ: Canhão</span>
              <span>Mouse DIR: Míssil</span>
              <span>Espaço: Especial</span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="upgrades"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex flex-col items-center w-full max-w-5xl z-10 px-4 mt-20 md:mt-0 pb-12"
          >
            <div className="flex flex-col md:flex-row w-full items-start md:items-center justify-between mb-8 md:mb-12 gap-6">
               <button onClick={() => setShowUpgrades(false)} className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 font-black uppercase tracking-widest text-[10px]">
                 <ChevronLeft className="w-5 h-5" />
                 Voltar ao Hangar
               </button>
               <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white mr-auto md:mx-auto">Engenharia</h2>
               <div className="hidden md:block w-[124px]"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full">
              {upgradeParams.map(param => (
                <div key={param.key} className="bg-slate-900/50 p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-white/5 relative overflow-hidden group hover:border-white/20 transition-all">
                   <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-500 to-indigo-600 opacity-50" />
                   
                   <div className="flex justify-between items-start mb-6">
                      <div className="flex gap-4 items-center">
                         <div className="bg-slate-800 p-3 md:p-4 rounded-full">
                            <param.icon className={`w-5 h-5 md:w-6 md:h-6 ${param.color}`} />
                         </div>
                         <div>
                            <h3 className="text-lg md:text-xl font-black uppercase tracking-tight">{param.label}</h3>
                            <p className="text-[9px] md:text-[10px] text-slate-400 uppercase font-bold tracking-widest">{param.desc}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <div className="text-[9px] md:text-[10px] text-slate-500 font-black uppercase tracking-widest">Nível</div>
                         <div className="text-xl md:text-2xl font-black text-white">{upgrades[param.key]}<span className="text-xs md:text-sm text-slate-600">/{param.max}</span></div>
                      </div>
                   </div>

                   <div className="flex gap-1 mb-6">
                      {Array.from({ length: param.max }).map((_, i) => (
                         <div key={i} className={`h-1.5 md:h-2 flex-1 rounded-sm ${i < upgrades[param.key] ? 'bg-blue-500 shadow-[0_0_10px_#3b82f6]' : 'bg-slate-800'}`} />
                      ))}
                   </div>

                   <button
                     disabled={upgrades[param.key] >= param.max || credits < param.cost}
                     onClick={() => buyUpgrade(param.key, param.cost, param.max)}
                     className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2
                       ${upgrades[param.key] >= param.max 
                         ? 'bg-slate-800 text-slate-600' 
                         : credits >= param.cost 
                            ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/30 hover:border-blue-500' 
                            : 'bg-red-950/30 text-red-500 border border-red-500/30 cursor-not-allowed'
                       }
                     `}
                   >
                     {upgrades[param.key] >= param.max ? (
                        'MÁXIMO ALCANÇADO'
                     ) : (
                        <>
                           Instalar Melhoria
                           <span className={credits >= param.cost ? 'text-white font-bold text-xs' : 'text-red-400 text-xs'}>{param.cost} CR</span>
                        </>
                     )}
                   </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
