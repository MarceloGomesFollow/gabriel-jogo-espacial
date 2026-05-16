/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShipType } from '../types';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ShipModelProps {
  type: ShipType;
  teamColor: string;
  isPlayer?: boolean;
}

export const ShipModel: React.FC<ShipModelProps> = ({ type, teamColor, isPlayer }) => {
  const color = new THREE.Color(teamColor);
  const darkMetal = new THREE.Color("#0a0a0c");
  const armorColor = new THREE.Color("#1a1d23");
  const glowColor = teamColor === "#3b82f6" ? new THREE.Color("#00f0ff") : new THREE.Color("#ff003c");
  
  // Fast Attack: Sleek Interceptor, "F-22" inspired aggressive aerodynamic silhouette
  if (type === ShipType.FAST_ATTACK) {
    return (
      <group rotation={[-Math.PI / 2, Math.PI, 0]}>
        {/* Main Faceted Fuselage */}
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.02, 0.35, 3.5, 6]} />
          <meshStandardMaterial color={darkMetal} metalness={1} roughness={0.1} />
        </mesh>
        {/* Aggressive Faceted Nose Cone */}
        <mesh position={[0, 2.5, 0]}>
          <coneGeometry args={[0.35, 1.2, 6]} />
          <meshStandardMaterial color={darkMetal} metalness={1} />
        </mesh>
        {/* Top-mounted Sensor Spike */}
        <mesh position={[0, 2.2, 0.2]} rotation={[0.4, 0, 0]}>
          <cylinderGeometry args={[0.01, 0.05, 0.8, 8]} />
          <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={0.5} />
        </mesh>
        {/* Military Styled Faceted Cockpit */}
        <mesh position={[0, 1.4, 0.2]}>
          <boxGeometry args={[0.25, 0.8, 0.15]} />
          <meshStandardMaterial color="#000" metalness={1} roughness={0} emissive={glowColor} emissiveIntensity={0.3} />
        </mesh>
        {/* Primary Swept-Back Wings (F-22 / Stealth Fighter Style) */}
        <group position={[0, -0.2, 0]}>
          <mesh position={[1.4, 0, -0.1]} rotation={[0.2, -0.4, -0.2]}>
            <boxGeometry args={[2.8, 0.04, 1.5]} />
            <meshStandardMaterial color={color} metalness={0.8} />
          </mesh>
          <mesh position={[-1.4, 0, -0.1]} rotation={[0.2, 0.4, 0.2]}>
            <boxGeometry args={[2.8, 0.04, 1.5]} />
            <meshStandardMaterial color={color} metalness={0.8} />
          </mesh>
          {/* Top Wing Panel Detail */}
          {[0.8, 1.6].map((x, i) => (
            <mesh key={i} position={[x, 0.05, -0.2]} rotation={[0, -0.4, 0]}>
              <boxGeometry args={[0.1, 0.02, 1]} />
              <meshStandardMaterial color="#000" emissive={glowColor} emissiveIntensity={0.2} />
            </mesh>
          ))}
          {/* Wing Mounted Weapon Arrays */}
          <group position={[1.2, 0.4, 0.1]}>
            <mesh>
              <boxGeometry args={[0.1, 0.8, 0.2]} />
              <meshStandardMaterial color={darkMetal} />
            </mesh>
            <mesh position={[0, 0.4, 0]} rotation={[0, 0, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
              <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={1} />
            </mesh>
          </group>
          <group position={[-1.2, 0.4, 0.1]}>
            <mesh>
              <boxGeometry args={[0.1, 0.8, 0.2]} />
              <meshStandardMaterial color={darkMetal} />
            </mesh>
            <mesh position={[0, 0.4, 0]} rotation={[0, 0, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
              <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={1} />
            </mesh>
          </group>
        </group>
        {/* Rear Horizontal Stabilizers */}
        <group position={[0, -1.8, 0]}>
          <mesh position={[1, 0, 0]} rotation={[0, -0.5, 0]}>
            <boxGeometry args={[1.2, 0.03, 1]} />
            <meshStandardMaterial color={armorColor} />
          </mesh>
          <mesh position={[-1, 0, 0]} rotation={[0, 0.5, 0]}>
            <boxGeometry args={[1.2, 0.03, 1]} />
            <meshStandardMaterial color={armorColor} />
          </mesh>
        </group>
        {/* Twin Vertical Tail Fins (Outward Canted) */}
        <group position={[0, -1.6, 0.4]}>
          <mesh position={[0.4, 0, 0]} rotation={[0, 0, -0.4]}>
            <boxGeometry args={[0.03, 1.2, 1]} />
            <meshStandardMaterial color={armorColor} />
          </mesh>
          <mesh position={[-0.4, 0, 0]} rotation={[0, 0, 0.4]}>
            <boxGeometry args={[0.03, 1.2, 1]} />
            <meshStandardMaterial color={armorColor} />
          </mesh>
        </group>
        {/* Layered Armor Paneling on central spine */}
        {[0, 0.8, 1.6].map((y, i) => (
          <mesh key={i} position={[0, y, 0.1]}>
            <boxGeometry args={[0.45, 0.4, 0.08]} />
            <meshStandardMaterial color={armorColor} metalness={0.8} />
          </mesh>
        ))}
        {/* Detailed Engine Core with Internal Shutter Effect */}
        <group position={[0, -2.2, 0]}>
          <mesh>
            <cylinderGeometry args={[0.4, 0.5, 0.8, 16]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          {/* Main Thrust Glow */}
          <mesh position={[0, -0.4, 0]}>
            <cylinderGeometry args={[0.3, 0.35, 0.2, 16]} />
            <meshStandardMaterial color="#111" emissive={glowColor} emissiveIntensity={8} />
          </mesh>
          {/* Peripheral Maneuvering Thrusters */}
          {[0, Math.PI/2, Math.PI, Math.PI * 1.5].map((angle, i) => (
            <mesh key={i} position={[Math.cos(angle) * 0.4, 0, Math.sin(angle) * 0.4]}>
              <boxGeometry args={[0.1, 0.2, 0.1]} />
              <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={2} />
            </mesh>
          ))}
        </group>
        <pointLight color={glowColor} intensity={12} distance={20} position={[0, -3, 0]} />
      </group>
    );
  }

  // Tank: Heavy Dreadnought, industrial military battleship
  if (type === ShipType.TANK) {
    return (
      <group>
        {/* Core Armored Chassis */}
        <mesh>
          <boxGeometry args={[2.4, 0.8, 5.2]} />
          <meshStandardMaterial color={darkMetal} metalness={0.9} roughness={0.4} />
        </mesh>
        
        {/* Layered Deck Armor Plating */}
        <group position={[0, 0.45, 0]}>
          {[-1.8, -0.6, 0.6, 1.8].map((z, i) => (
            <group key={i} position={[0, 0, z]}>
              <mesh>
                <boxGeometry args={[2, 0.2, 0.9]} />
                <meshStandardMaterial color={armorColor} metalness={0.8} />
              </mesh>
              {/* Top Armor Panel Details */}
              <mesh position={[0, 0.1, 0]}>
                <boxGeometry args={[1.6, 0.02, 0.1]} />
                <meshStandardMaterial color="#000" emissive={glowColor} emissiveIntensity={0.5} />
              </mesh>
            </group>
          ))}
          {/* Central Recessed Energy Trench */}
          <mesh position={[0, -0.1, 0]}>
            <boxGeometry args={[0.4, 0.1, 4.8]} />
            <meshStandardMaterial color="#000" emissive={glowColor} emissiveIntensity={0.5} />
          </mesh>
        </group>

        {/* Command Bridge Complex */}
        <group position={[0, 1.2, 1.2]}>
          {/* Main Tower Base */}
          <mesh>
            <boxGeometry args={[0.8, 1.4, 1]} />
            <meshStandardMaterial color={armorColor} />
          </mesh>
          {/* Top-facing Sensor Dish */}
          <mesh position={[0, 0.75, -0.2]} rotation={[0.4, 0, 0]}>
            <cylinderGeometry args={[0.3, 0.25, 0.1, 16]} />
            <meshStandardMaterial color={darkMetal} />
          </mesh>
          {/* Sensor Array Pods */}
          <mesh position={[0.5, 0.4, 0]}>
            <boxGeometry args={[0.3, 0.2, 0.4]} />
            <meshStandardMaterial color={darkMetal} />
          </mesh>
          <mesh position={[-0.5, 0.4, 0]}>
            <boxGeometry args={[0.3, 0.2, 0.4]} />
            <meshStandardMaterial color={darkMetal} />
          </mesh>
          {/* Command Observation Deck */}
          <mesh position={[0, 0.5, 0.4]}>
            <boxGeometry args={[0.6, 0.15, 0.3]} />
            <meshStandardMaterial color="#000" emissive={glowColor} emissiveIntensity={3} />
          </mesh>
        </group>

        {/* Heavy Weapon Sponsons */}
        <group>
          {/* Right Sponson */}
          <group position={[1.6, 0, -0.5]}>
             <mesh>
               <boxGeometry args={[0.8, 0.9, 3.8]} />
               <meshStandardMaterial color={armorColor} metalness={0.6} />
             </mesh>
             {/* Dual Heavy Cannons */}
             {[0.8, -0.8].map((z, i) => (
               <group key={i} position={[0.2, 0.2, z]}>
                 <mesh rotation={[Math.PI/2, 0, 0]}>
                   <cylinderGeometry args={[0.07, 0.08, 1.8, 8]} />
                   <meshStandardMaterial color="#111" />
                 </mesh>
                 <mesh position={[0, 0, 0.2]} rotation={[Math.PI/2, 0, 0]}>
                    <cylinderGeometry args={[0.09, 0.09, 0.4, 8]} />
                    <meshStandardMaterial color={darkMetal} />
                 </mesh>
               </group>
             ))}
          </group>
          {/* Left Sponson */}
          <group position={[-1.6, 0, -0.5]}>
             <mesh>
               <boxGeometry args={[0.8, 0.9, 3.8]} />
               <meshStandardMaterial color={armorColor} metalness={0.6} />
             </mesh>
             {/* Dual Heavy Cannons */}
             {[0.8, -0.8].map((z, i) => (
               <group key={i} position={[-0.2, 0.2, z]}>
                 <mesh rotation={[Math.PI/2, 0, 0]}>
                   <cylinderGeometry args={[0.07, 0.08, 1.8, 8]} />
                   <meshStandardMaterial color="#111" />
                 </mesh>
                 <mesh position={[0, 0, 0.2]} rotation={[Math.PI/2, 0, 0]}>
                    <cylinderGeometry args={[0.09, 0.09, 0.4, 8]} />
                    <meshStandardMaterial color={darkMetal} />
                 </mesh>
               </group>
             ))}
          </group>
        </group>

        {/* Shield Generator Sub-Systems */}
        <group position={[0, -0.2, 2.2]}>
          <mesh rotation={[Math.PI/2, 0, 0]}>
            <cylinderGeometry args={[0.6, 0.7, 0.5, 16]} />
            <meshStandardMaterial color={darkMetal} />
          </mesh>
          <mesh position={[0, 0, 0.1]} rotation={[Math.PI/2, 0, 0]}>
             <torusGeometry args={[0.5, 0.05, 8, 32]} />
             <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={5} transparent opacity={0.6} />
          </mesh>
        </group>

        {/* Rear Industrial Engine Module */}
        <group position={[0, 0, -2.6]}>
          <mesh>
            <boxGeometry args={[2.2, 1.2, 0.8]} />
            <meshStandardMaterial color="#0a0a0a" />
          </mesh>
          {/* Quad Thruster Arrays */}
          {[[-0.7, 0.35], [0.7, 0.35], [-0.7, -0.35], [0.7, -0.35]].map((pos, i) => (
            <mesh key={i} position={[pos[0], pos[1], -0.2]} rotation={[Math.PI/2, 0, 0]}>
              <cylinderGeometry args={[0.4, 0.52, 0.5, 16]} />
              <meshStandardMaterial color="#000" emissive={glowColor} emissiveIntensity={10} />
            </mesh>
          ))}
          {/* Maneuvering Vents */}
          {[1.1, -1.1].map((x, i) => (
            <mesh key={i} position={[x, 0, 0]}>
              <boxGeometry args={[0.1, 0.6, 0.4]} />
              <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={1} />
            </mesh>
          ))}
        </group>

        {/* Industrial Scaffolding / Structural Ribs */}
        <group>
          {[-1.2, 0, 1.2].map((z, i) => (
             <mesh key={i} position={[0, -0.45, z]} rotation={[0, 0, Math.PI/2]}>
                <cylinderGeometry args={[0.03, 0.03, 3.4, 8]} />
                <meshStandardMaterial color="#111" />
             </mesh>
          ))}
        </group>

        <pointLight color={glowColor} intensity={15} distance={25} position={[0, 0, -3.5]} />
      </group>
    );
  }

  // Bomber: Heavy Strategic Bomber, reinforced wings, visible payload bays
  if (type === ShipType.BOMBER) {
    return (
      <group>
        {/* Main Central Fuselage - Reinforced and Layered */}
        <mesh>
          <boxGeometry args={[1.8, 1.2, 4.8]} />
          <meshStandardMaterial color={darkMetal} metalness={0.9} roughness={0.3} />
        </mesh>
        {/* Upper Surface Detail Plating */}
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[1.4, 0.4, 4.2]} />
          <meshStandardMaterial color={armorColor} />
        </mesh>
        {/* Top-facing Comms Array */}
        <mesh position={[0, 0.7, -0.5]}>
           <cylinderGeometry args={[0.02, 0.02, 1.2, 8]} />
           <meshStandardMaterial color="#111" emissive={glowColor} emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[0, 0.7, -0.5]}>
           <boxGeometry args={[0.2, 0.2, 0.2]} />
           <meshStandardMaterial color={darkMetal} />
        </mesh>
        
        {/* Reinforced Forward Cockpit Section */}
        <group position={[0, 0.3, 1.8]}>
          <mesh>
            <boxGeometry args={[1.2, 1, 1.6]} />
            <meshStandardMaterial color={darkMetal} />
          </mesh>
          {/* Top-visible armor ribbing */}
          {[-0.4, 0, 0.4].map((z, i) => (
             <mesh key={i} position={[0, 0.52, z-0.2]}>
                <boxGeometry args={[0.9, 0.05, 0.1]} />
                <meshStandardMaterial color={armorColor} />
             </mesh>
          ))}
          {/* Faceted Sensor/Glass panels */}
          <mesh position={[0, 0.4, 0.6]}>
             <boxGeometry args={[0.8, 0.3, 0.2]} />
             <meshStandardMaterial color="#000" emissive={glowColor} emissiveIntensity={2} />
          </mesh>
        </group>

        {/* Massive Reinforced Delta Wings */}
        <group position={[0, -0.2, 0]}>
          <mesh>
            <boxGeometry args={[8.5, 0.3, 3]} />
            <meshStandardMaterial color={color} metalness={0.8} />
          </mesh>
          {/* Top Surface Panel Markings */}
          {[2, 3, 4].map((x, i) => (
            <mesh key={i} position={[x, 0.16, 0]}>
              <boxGeometry args={[0.05, 0.02, 2]} />
              <meshStandardMaterial color="#000" transparent opacity={0.5} />
            </mesh>
          ))}
          {/* Surface Mechanical Details */}
          {[1.8, 2.8, 3.8].map((x, i) => (
             <group key={i}>
                <mesh position={[x, 0.2, 0]}>
                  <boxGeometry args={[0.6, 0.15, 2.5]} />
                  <meshStandardMaterial color={armorColor} />
                </mesh>
                <mesh position={[-x, 0.2, 0]}>
                  <boxGeometry args={[0.6, 0.15, 2.5]} />
                  <meshStandardMaterial color={armorColor} />
                </mesh>
             </group>
          ))}
        </group>

        {/* Heavy Engine Modules on Wings */}
        <group>
          {/* Port Engine */}
          <group position={[3, -0.6, -0.8]}>
             <mesh rotation={[Math.PI/2, 0, 0]}>
               <cylinderGeometry args={[0.8, 0.9, 2.5, 16]} />
               <meshStandardMaterial color={armorColor} />
             </mesh>
             <mesh position={[0, 0, -1.3]} rotation={[Math.PI/2, 0, 0]}>
                <cylinderGeometry args={[0.7, 0.7, 0.4, 16]} />
                <meshStandardMaterial color="#000" emissive={glowColor} emissiveIntensity={6} />
             </mesh>
          </group>
          {/* Starboard Engine */}
          <group position={[-3, -0.6, -0.8]}>
             <mesh rotation={[Math.PI/2, 0, 0]}>
               <cylinderGeometry args={[0.8, 0.9, 2.5, 16]} />
               <meshStandardMaterial color={armorColor} />
             </mesh>
             <mesh position={[0, 0, -1.3]} rotation={[Math.PI/2, 0, 0]}>
                <cylinderGeometry args={[0.7, 0.7, 0.4, 16]} />
                <meshStandardMaterial color="#000" emissive={glowColor} emissiveIntensity={6} />
             </mesh>
          </group>
        </group>

        {/* External Heavy Ordnance Racks */}
        {[4, -4].map((x, i) => (
          <group key={i} position={[x, -0.8, 0.2]}>
             <mesh>
               <boxGeometry args={[1.2, 0.6, 2.2]} />
               <meshStandardMaterial color="#111" />
             </mesh>
             {/* Visible Nuclear Class Charges */}
             {[-0.3, 0.3].map((mx, j) => (
                <mesh key={j} position={[mx, -0.2, 0.8]} rotation={[Math.PI/2, 0, 0]}>
                  <cylinderGeometry args={[0.18, 0.18, 1.2, 8]} />
                  <meshStandardMaterial color="#333" />
                </mesh>
             ))}
          </group>
        ))}

        {/* Underside Bomb Bay Doors (Hydraulically Actuated Look) */}
        <group position={[0, -0.7, 0]}>
           <mesh position={[0.4, 0, 0]} rotation={[0, 0, 0.2]}>
              <boxGeometry args={[0.7, 0.1, 3]} />
              <meshStandardMaterial color="#050505" />
           </mesh>
           <mesh position={[-0.4, 0, 0]} rotation={[0, 0, -0.2]}>
              <boxGeometry args={[0.7, 0.1, 3]} />
              <meshStandardMaterial color="#050505" />
           </mesh>
        </group>

        {/* Twin Vertical Stabilizers - High Profile */}
        <group position={[0, 1, -1.8]}>
           <mesh position={[1.4, 0, 0]} rotation={[0, 0, 0.2]}>
              <boxGeometry args={[0.12, 2.5, 2]} />
              <meshStandardMaterial color={color} />
           </mesh>
           <mesh position={[-1.4, 0, 0]} rotation={[0, 0, -0.2]}>
              <boxGeometry args={[0.12, 2.5, 2]} />
              <meshStandardMaterial color={color} />
           </mesh>
        </group>
        
        <pointLight color={glowColor} intensity={12} distance={20} position={[0, 0, -3]} />
      </group>
    );
  }

  // Fighter: Advanced Air-Superiority Fighter, aggressive stealth silhouette, multi-layered wings
  return (
    <group>
      {/* Primary Fuselage - Heavy Faceting and Layered Armor */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.45, 4.2, 6]} />
        <meshStandardMaterial color={darkMetal} metalness={1} roughness={0.1} />
      </mesh>
      
      {/* Armored Spine Plates */}
      {[0.2, 0.8, 1.4].map((z, i) => (
        <group key={i} position={[0, 0.35, -z]}>
          <mesh>
            <boxGeometry args={[0.4, 0.1, 0.5]} />
            <meshStandardMaterial color={armorColor} />
          </mesh>
          {/* Top Detail Gills */}
          <mesh position={[0, 0.06, 0]}>
             <boxGeometry args={[0.2, 0.02, 0.3]} />
             <meshStandardMaterial color="#000" emissive={glowColor} emissiveIntensity={0.5} />
          </mesh>
        </group>
      ))}

      {/* Splayed Aggressive Nose Prongs */}
      <group position={[0, 0, 1.8]}>
        <mesh position={[0.2, 0.15, 0]} rotation={[0, -0.2, 0]}>
          <boxGeometry args={[0.06, 0.08, 1.2]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[-0.2, 0.15, 0]} rotation={[0, 0.2, 0]}>
          <boxGeometry args={[0.06, 0.08, 1.2]} />
          <meshStandardMaterial color={color} />
        </mesh>
        {/* Top Center PITOT Tube */}
        <mesh position={[0, 0.1, -0.4]}>
           <cylinderGeometry args={[0.01, 0.01, 0.6, 8]} />
           <meshStandardMaterial color={glowColor} />
        </mesh>
      </group>

      {/* Advanced Cockpit with Multi-Faceted Armor Glass */}
      <group position={[0, 0.35, 0.4]}>
        <mesh>
          <sphereGeometry args={[0.45, 8, 5]} />
          <meshStandardMaterial color="#000" metalness={1} roughness={0} />
        </mesh>
        {/* Reinforced Canopy Frame - Visible from Above */}
        <mesh position={[0, 0.15, 0]} rotation={[Math.PI/2, 0, 0]}>
           <torusGeometry args={[0.42, 0.02, 8, 24]} />
           <meshStandardMaterial color={darkMetal} />
        </mesh>
        <mesh position={[0, 0.15, 0]}>
           <boxGeometry args={[0.02, 0.4, 0.9]} />
           <meshStandardMaterial color={darkMetal} />
        </mesh>
      </group>

      {/* Signature Multi-Layered Wing Architecture */}
      <group position={[0, 0, -0.4]}>
        {/* Upper Maneuvering Wings */}
        <group position={[0, 0.3, 0]}>
           <mesh position={[1.5, 0, -0.2]} rotation={[0.1, -0.3, -0.1]}>
             <boxGeometry args={[2.8, 0.04, 1.2]} />
             <meshStandardMaterial color={color} metalness={0.8} />
           </mesh>
           <mesh position={[-1.5, 0, -0.2]} rotation={[0.1, 0.3, 0.1]}>
             <boxGeometry args={[2.8, 0.04, 1.2]} />
             <meshStandardMaterial color={color} metalness={0.8} />
           </mesh>
           {/* Top Stealth Vents */}
           <mesh position={[1.2, 0.03, -0.3]} rotation={[0, -0.3, 0]}>
              <boxGeometry args={[0.4, 0.01, 0.6]} />
              <meshStandardMaterial color="#111" />
           </mesh>
           <mesh position={[-1.2, 0.03, -0.3]} rotation={[0, 0.3, 0]}>
              <boxGeometry args={[0.4, 0.01, 0.6]} />
              <meshStandardMaterial color="#111" />
           </mesh>
        </group>
        
        {/* Lower Combat Wings with Integrated Pulse Cannons */}
        <group position={[0, -0.2, -0.1]}>
           <mesh position={[2, 0, 0]} rotation={[-0.1, -0.2, -0.05]}>
             <boxGeometry args={[3.2, 0.05, 1.5]} />
             <meshStandardMaterial color={color} metalness={0.8} />
           </mesh>
           <mesh position={[-2, 0, 0]} rotation={[-0.1, 0.2, 0.05]}>
             <boxGeometry args={[3.2, 0.05, 1.5]} />
             <meshStandardMaterial color={color} metalness={0.8} />
           </mesh>
           
           {/* Twin Pulse Cannon Assemblies */}
           <group position={[3.2, 0.1, 0.5]}>
              <mesh rotation={[Math.PI/2, 0, 0]}>
                <cylinderGeometry args={[0.04, 0.05, 1.4, 8]} />
                <meshStandardMaterial color="#111" />
              </mesh>
              <mesh position={[0, 0, 0.61]} rotation={[Math.PI/2, 0, 0]}>
                 <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} />
                 <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={5} />
              </mesh>
           </group>
           <group position={[-3.2, 0.1, 0.5]}>
              <mesh rotation={[Math.PI/2, 0, 0]}>
                <cylinderGeometry args={[0.04, 0.05, 1.4, 8]} />
                <meshStandardMaterial color="#111" />
              </mesh>
              <mesh position={[0, 0, 0.61]} rotation={[Math.PI/2, 0, 0]}>
                 <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} />
                 <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={5} />
              </mesh>
           </group>
        </group>
      </group>

      {/* Large Twin Vertical Stabilizers - Stealth Canted */}
      <group position={[0, 0.8, -1.6]}>
        <mesh position={[0.7, 0, 0]} rotation={[0, 0, 0.4]}>
          <boxGeometry args={[0.03, 2.2, 1.8]} />
          <meshStandardMaterial color={armorColor} />
        </mesh>
        <mesh position={[-0.7, 0, 0]} rotation={[0, 0, -0.4]}>
          <boxGeometry args={[0.03, 2.2, 1.8]} />
          <meshStandardMaterial color={armorColor} />
        </mesh>
      </group>

      {/* Advanced Thrust Vectoring Engine Block */}
      <group position={[0, 0, -2.1]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.45, 0.6, 0.8, 16]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        {/* Core Ion Injection Glow */}
        <mesh position={[0, 0, -0.3]} rotation={[Math.PI/2, 0, 0]}>
           <cylinderGeometry args={[0.3, 0.35, 0.2, 16]} />
           <meshStandardMaterial color="#000" emissive={glowColor} emissiveIntensity={10} />
        </mesh>
        {/* Vectoring Shutter Plates */}
        {[0, Math.PI/2, Math.PI, Math.PI*1.5].map((angle, i) => (
           <mesh key={i} position={[Math.cos(angle)*0.5, Math.sin(angle)*0.5, -0.1]} rotation={[0, 0, angle]}>
             <boxGeometry args={[0.1, 0.3, 0.4]} />
             <meshStandardMaterial color={armorColor} />
           </mesh>
        ))}
      </group>

      <pointLight color={glowColor} intensity={8} distance={15} position={[0, 0, -3]} />
    </group>
  );
};
