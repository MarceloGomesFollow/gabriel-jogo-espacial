/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Vector = {
  x: number;
  y: number;
};

export enum Team {
  PLAYER = "PLAYER",
  ENEMY = "ENEMY",
}

export enum ShipType {
  FAST_ATTACK = "FAST_ATTACK",
  TANK = "TANK",
  BOMBER = "BOMBER",
  FIGHTER = "FIGHTER",
  CRUISER = "CRUISER",
  DESTROYER = "DESTROYER",
}

export interface ShipConfig {
  type: ShipType;
  health: number;
  maxHealth: number;
  speed: number;
  rotationSpeed: number;
  fireRate: number; // bullets per second
  missileRate: number; // missiles per second
  color: string;
  size: number;
  abilityName: string;
  abilityCooldown: number;
}

export const SHIP_CONFIGS: Record<ShipType, ShipConfig> = {
  [ShipType.FAST_ATTACK]: {
    type: ShipType.FAST_ATTACK,
    health: 60,
    maxHealth: 60,
    speed: 2.5,
    rotationSpeed: 0.05,
    fireRate: 8,
    missileRate: 0.5,
    color: "#4ade80", // Green
    size: 15,
    abilityName: "Super Dash",
    abilityCooldown: 3000,
  },
  [ShipType.TANK]: {
    type: ShipType.TANK,
    health: 250,
    maxHealth: 250,
    speed: 1,
    rotationSpeed: 0.02,
    fireRate: 3,
    missileRate: 0.2,
    color: "#60a5fa", // Blueish
    size: 25,
    abilityName: "Escudo de Plasma",
    abilityCooldown: 8000,
  },
  [ShipType.BOMBER]: {
    type: ShipType.BOMBER,
    health: 120,
    maxHealth: 120,
    speed: 1.5,
    rotationSpeed: 0.03,
    fireRate: 1.5,
    missileRate: 1,
    color: "#f87171", // Reddish
    size: 22,
    abilityName: "Bomba de Fragmentação",
    abilityCooldown: 6000,
  },
  [ShipType.FIGHTER]: {
    type: ShipType.FIGHTER,
    health: 100,
    maxHealth: 100,
    speed: 2.0,
    rotationSpeed: 0.04,
    fireRate: 5,
    missileRate: 0.4,
    color: "#fbbf24", // Yellow/Amber
    size: 18,
    abilityName: "Disparo Triplo",
    abilityCooldown: 4000,
  },
  [ShipType.CRUISER]: {
    type: ShipType.CRUISER,
    health: 400,
    maxHealth: 400,
    speed: 0.7,
    rotationSpeed: 0.015,
    fireRate: 4,
    missileRate: 0.3,
    color: "#a78bfa", // Purple/Violet
    size: 40,
    abilityName: "Raio Trator",
    abilityCooldown: 10000,
  },
  [ShipType.DESTROYER]: {
    type: ShipType.DESTROYER,
    health: 800,
    maxHealth: 800,
    speed: 0.4,
    rotationSpeed: 0.01,
    fireRate: 2,
    missileRate: 0.1,
    color: "#f472b6", // Pink
    size: 60,
    abilityName: "Onda de Choque",
    abilityCooldown: 15000,
  },
};
