/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, Suspense } from "react";
import { GameView } from "./components/GameView";
import { ShipType, SHIP_CONFIGS } from "./types";
import { motion } from "motion/react";
import { Rocket, Shield, Bomb, Crosshair } from "lucide-react";
import { Canvas } from "@react-three/fiber";
import { ShipModel } from "./components/ShipModel";
import { OrbitControls, Stage } from "@react-three/drei";

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedShip, setSelectedShip] = useState<ShipType>(ShipType.FIGHTER);

  const handleStartGame = () => {
    setGameStarted(true);
  };

  if (gameStarted) {
    return <GameView playerType={selectedShip} onExit={() => setGameStarted(false)} />;
  }

  return (
    <div className="w-full h-screen bg-[#050508] text-white overflow-hidden flex flex-col items-center justify-center font-sans select-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1),transparent_70%)] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 text-center mb-12"
      >
        <h1 className="text-7xl font-black tracking-tighter uppercase mb-2">Conquista <span className="text-blue-500">Galáctica</span></h1>
        <p className="text-slate-500 font-medium tracking-[0.3em] uppercase text-[10px]">Fleet Warfare Simulator v3.0</p>
      </motion.div>

      <div className="z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl w-full px-6">
        {Object.values(ShipType).map((type) => {
          const config = SHIP_CONFIGS[type];
          return (
            <motion.div
              key={type}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedShip(type)}
              className={`cursor-pointer p-0 rounded-[2.5rem] border-2 transition-all duration-300 flex flex-col items-center overflow-hidden ${
                selectedShip === type 
                  ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_60px_rgba(59,130,246,0.2)]' 
                  : 'bg-slate-900/40 border-white/5 hover:border-white/20'
              }`}
            >
              <div className="w-full h-48 bg-slate-950/50 relative overflow-hidden">
                 <Suspense fallback={<div className="flex items-center justify-center h-full text-[10px] uppercase font-black opacity-20">Iniciando...</div>}>
                    <Canvas camera={{ position: [0, 1.5, 4], fov: 45 }}>
                       <ambientLight intensity={1.5} />
                       <pointLight position={[5, 5, 5]} intensity={2} />
                       <pointLight position={[-5, -5, -5]} intensity={1} color="#3b82f6" />
                       <group position={[0, -0.5, 0]}>
                          <ShipModel type={type} teamColor="#3b82f6" />
                       </group>
                       <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={3} />
                    </Canvas>
                 </Suspense>
                 <div className="absolute top-4 right-4 bg-black/60 p-2 rounded-full backdrop-blur">
                    {type === ShipType.FIGHTER && <Crosshair className="w-4 h-4 text-blue-400" />}
                    {type === ShipType.TANK && <Shield className="w-4 h-4 text-blue-400" />}
                    {type === ShipType.BOMBER && <Bomb className="w-4 h-4 text-blue-400" />}
                    {type === ShipType.FAST_ATTACK && <Rocket className="w-4 h-4 text-blue-400" />}
                 </div>
              </div>
              
              <div className="p-6 text-center w-full">
                 <h3 className="text-2xl font-black uppercase mb-1 tracking-tight">{type.replace('_', ' ')}</h3>
                 <p className="text-[9px] text-blue-400 font-black uppercase mb-4 tracking-[0.2em]">{config.abilityName}</p>
                 
                 <div className="w-full space-y-3">
                    <div>
                       <div className="flex justify-between items-center mb-1">
                          <span className="text-[8px] text-slate-500 font-black uppercase tracking-wider">Resistência</span>
                          <span className="text-xs font-black">{config.health}</span>
                       </div>
                       <div className="w-full h-1.5 bg-slate-800 rounded-full">
                          <div className="h-full bg-blue-500" style={{ width: `${(config.health / 250) * 100}%` }} />
                       </div>
                    </div>
                    
                    <div>
                       <div className="flex justify-between items-center mb-1">
                          <span className="text-[8px] text-slate-500 font-black uppercase tracking-wider">Velocidade</span>
                          <span className="text-xs font-black">{config.speed.toFixed(1)}</span>
                       </div>
                       <div className="w-full h-1.5 bg-slate-800 rounded-full">
                          <div className="h-full bg-blue-400" style={{ width: `${(config.speed / 6) * 100}%` }} />
                       </div>
                    </div>
                 </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={handleStartGame}
        className="mt-16 bg-blue-600 text-white px-20 py-6 rounded-3xl font-black uppercase tracking-[0.4em] hover:bg-blue-500 transition-all shadow-[0_20px_50px_rgba(59,130,246,0.3)] hover:scale-105 active:scale-95 text-sm"
      >
        INICIAR OPERAÇÃO
      </motion.button>
      
      <div className="mt-8 text-slate-600 text-[9px] uppercase font-black tracking-[0.3em] flex gap-8">
        <span>WASD: Piloto</span>
        <span>Mouse ESQ: Canhão</span>
        <span>Mouse DIR: Míssil</span>
        <span>Espaço: Especial</span>
      </div>
    </div>
  );
}
