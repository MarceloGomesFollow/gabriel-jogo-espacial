/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Vector, Team, ShipType, SHIP_CONFIGS, ShipConfig } from "../types";

export class Bullet {
  x: number;
  y: number;
  z: number = 0;
  vx: number;
  vy: number;
  vz: number = 0;
  team: Team;
  damage: number;
  life: number = 100;
  isMissile: boolean;

  constructor(x: number, y: number, z: number, angle: number, speed: number, team: Team, damage: number, isMissile: boolean = false) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.team = team;
    this.damage = damage;
    this.isMissile = isMissile;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.z += this.vz;
    this.life -= 1;
  }
}

export class Ship {
  id: string;
  x: number;
  y: number;
  z: number = 0;
  angle: number = 0;
  pitch: number = 0;
  roll: number = 0;
  vx: number = 0;
  vy: number = 0;
  vz: number = 0;
  team: Team;
  type: ShipType;
  config: ShipConfig;
  health: number;
  maxHealth: number;
  lastFired: number = 0;
  lastMissileFired: number = 0;
  lastAbilityUsed: number = 0;
  target: Ship | Mothership | null = null;
  isPlayer: boolean = false;
  
  // Abilitiy state
  abilityActive: boolean = false;
  abilityTimer: number = 0;

  constructor(id: string, x: number, y: number, team: Team, type: ShipType, isPlayer: boolean = false) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.team = team;
    this.type = type;
    this.config = SHIP_CONFIGS[type];
    this.health = this.config.health;
    this.maxHealth = this.config.health;
    this.isPlayer = isPlayer;
    this.angle = team === Team.PLAYER ? 0 : Math.PI;
  }

  update(engine: GameEngine) {
    if (this.abilityActive) {
      this.abilityTimer -= 16;
      if (this.abilityTimer <= 0) {
        this.abilityActive = false;
      }
    }

    if (!this.isPlayer) {
      this.updateAI(engine);
    }

    // Apply movement
    this.x += this.vx;
    this.y += this.vy;
    this.z += this.vz;

    // Dampen velocity
    this.vx *= 0.95;
    this.vy *= 0.95;
    this.vz *= 0.95;

    // Visual banking logic
    const lateralSpeed = -Math.sin(this.angle) * this.vx + Math.cos(this.angle) * this.vy;
    this.roll = lateralSpeed * 0.1;

    // Bounds check
    this.x = Math.max(-engine.worldSize / 2, Math.min(engine.worldSize / 2, this.x));
    this.y = Math.max(-engine.worldSize / 2, Math.min(engine.worldSize / 2, this.y));
  }

  updateAI(engine: GameEngine) {
    if (!this.target || this.target.health <= 0) {
      this.target = engine.getNearestTarget(this);
    }

    if (this.target) {
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const targetAngle = Math.atan2(dy, dx);

      let angleDiff = targetAngle - this.angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      this.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), this.config.rotationSpeed);

      if (dist > 300) {
        this.vx += Math.cos(this.angle) * this.config.speed * 0.1;
        this.vy += Math.sin(this.angle) * this.config.speed * 0.1;
      } else if (dist < 150) {
         this.vx -= Math.cos(this.angle) * this.config.speed * 0.05;
         this.vy -= Math.sin(this.angle) * this.config.speed * 0.05;
      }

      if (dist < 800 && Math.abs(angleDiff) < 0.3) {
        this.fire(engine, false);
      }
      if (dist < 500 && Math.random() < 0.01) {
        this.fire(engine, true);
      }
    }
  }

  fire(engine: GameEngine, isMissile: boolean) {
    const now = Date.now();
    if (isMissile) {
      if (now - this.lastMissileFired > 1000 / this.config.missileRate) {
        engine.bullets.push(new Bullet(this.x, this.y, this.z, this.angle, 15, this.team, 50, true));
        this.lastMissileFired = now;
      }
    } else {
      if (now - this.lastFired > 1000 / this.config.fireRate) {
        engine.bullets.push(new Bullet(this.x, this.y, this.z, this.angle, 25, this.team, 10, false));
        this.lastFired = now;
      }
    }
  }

  useAbility(engine: GameEngine) {
    const now = Date.now();
    if (now - this.lastAbilityUsed < this.config.abilityCooldown) return;

    this.lastAbilityUsed = now;
    this.abilityActive = true;

    switch (this.type) {
      case ShipType.FAST_ATTACK:
        this.abilityTimer = 500;
        this.vx += Math.cos(this.angle) * 30;
        this.vy += Math.sin(this.angle) * 30;
        break;
      case ShipType.TANK:
        this.abilityTimer = 3000;
        // Logic handled in renderer/collision
        break;
      case ShipType.BOMBER:
        // Spawn 8 bullets around the ship
        for (let i = 0; i < 8; i++) {
          engine.bullets.push(new Bullet(this.x, this.y, this.z, (Math.PI * 2 / 8) * i, 10, this.team, 30, false));
        }
        this.abilityActive = false;
        break;
      case ShipType.FIGHTER:
        // Burst fire
        for (let i = 0; i < 3; i++) {
           setTimeout(() => {
             if (this.health > 0) engine.bullets.push(new Bullet(this.x, this.y, this.z, this.angle, 15, this.team, 10, false));
           }, i * 100);
        }
        this.abilityActive = false;
        break;
    }
  }
}

export class Mothership {
  x: number;
  y: number;
  z: number = 0;
  health: number = 2000;
  maxHealth: number = 2000;
  team: Team;
  size: number = 100;

  constructor(x: number, y: number, team: Team) {
    this.x = x;
    this.y = y;
    this.team = team;
  }

  update(engine: GameEngine) {
     if (Math.random() < 0.05) {
       const target = engine.getNearestTargetTo(this.x, this.y, this.team);
       if (target && this.distTo(target) < 1000) {
         const angle = Math.atan2(target.y - this.y, target.x - this.x);
         engine.bullets.push(new Bullet(this.x, this.y, this.z, angle, 15, this.team, 15, false));
       }
     }
  }

  distTo(other: {x: number, y: number}) {
    return Math.sqrt((this.x - other.x) ** 2 + (this.y - other.y) ** 2);
  }
}

export class GameEngine {
  ships: Ship[] = [];
  bullets: Bullet[] = [];
  motherships: Mothership[] = [];
  worldSize: number = 10000;
  player: Ship | null = null;
  playerRespawnTimer: number = 0;
  private selectedPlayerType: ShipType = ShipType.FIGHTER;
  gameOver: boolean = false;
  winner: Team | null = null;

  constructor() {
    this.init();
  }

  init(playerShipType: ShipType = ShipType.FIGHTER) {
    this.ships = [];
    this.bullets = [];
    this.motherships = [];
    this.gameOver = false;
    this.winner = null;
    this.playerRespawnTimer = 0;
    this.selectedPlayerType = playerShipType;
    
    // Motherships
    this.motherships.push(new Mothership(-4000, 0, Team.PLAYER));
    this.motherships.push(new Mothership(4000, 0, Team.ENEMY));

    this.respawnPlayer();

    // Populate fleets
    const types = [ShipType.FAST_ATTACK, ShipType.TANK, ShipType.BOMBER, ShipType.FIGHTER];
    
    // Player team
    for (let i = 0; i < 49; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      this.ships.push(new Ship(`p-${i}`, -3500 + Math.random() * 1000, (Math.random() - 0.5) * 2000, Team.PLAYER, type));
    }

    // Enemy team
    for (let i = 0; i < 50; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      this.ships.push(new Ship(`e-${i}`, 3500 - Math.random() * 1000, (Math.random() - 0.5) * 2000, Team.ENEMY, type));
    }
  }

  respawnPlayer() {
    this.player = new Ship("player", -3800, 0, Team.PLAYER, this.selectedPlayerType, true);
    this.player.health *= 1.4; // 40% health boost for player
    this.player.maxHealth = this.player.health;
    this.ships.push(this.player);
  }

  update() {
    if (this.gameOver) return;

    const playerWasAlive = this.player && this.player.health > 0;
    this.ships = this.ships.filter(s => s.health > 0);
    const playerIsAlive = this.ships.some(s => s.isPlayer);

    if (playerWasAlive && !playerIsAlive) {
      this.playerRespawnTimer = 5000; // 5 seconds in ms
    }

    if (this.playerRespawnTimer > 0) {
      this.playerRespawnTimer -= 16; 
      if (this.playerRespawnTimer <= 0) {
        this.playerRespawnTimer = 0;
        this.respawnPlayer();
      }
    }

    this.bullets = this.bullets.filter(b => b.life > 0);

    for (const ship of this.ships) {
      ship.update(this);
    }

    for (const ms of this.motherships) {
      ms.update(this);
    }

    for (const bullet of this.bullets) {
      bullet.update();
      this.checkCollisions(bullet);
    }

    // Check game over
    const playerMS = this.motherships.find(m => m.team === Team.PLAYER);
    const enemyMS = this.motherships.find(m => m.team === Team.ENEMY);

    if (enemyMS && enemyMS.health <= 0) {
      this.gameOver = true;
      this.winner = Team.PLAYER;
    } else if (playerMS && playerMS.health <= 0) {
      this.gameOver = true;
      this.winner = Team.ENEMY;
    }
  }

  checkCollisions(bullet: Bullet) {
    // Bullet vs ships
    for (const ship of this.ships) {
      if (ship.team !== bullet.team) {
        const dx = ship.x - bullet.x;
        const dy = ship.y - bullet.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < ship.config.size) {
          // Check tank shield
          if (ship.type === ShipType.TANK && ship.abilityActive) {
             bullet.life = 0;
             return;
          }
          ship.health -= bullet.damage;
          bullet.life = 0;
          return;
        }
      }
    }

    // Bullet vs motherships
    for (const ms of this.motherships) {
      if (ms.team !== bullet.team) {
        const dx = ms.x - bullet.x;
        const dy = ms.y - bullet.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < ms.size) {
          ms.health -= bullet.damage;
          bullet.life = 0;
          return;
        }
      }
    }
  }

  getNearestTarget(ship: Ship) {
    let nearest: Ship | Mothership | null = null;
    let minDist = Infinity;

    // Check enemy ships
    for (const s of this.ships) {
      if (s.team !== ship.team) {
        const d = Math.sqrt((s.x - ship.x) ** 2 + (s.y - ship.y) ** 2);
        if (d < minDist) {
          minDist = d;
          nearest = s;
        }
      }
    }

    // Check enemy mothership
    for (const ms of this.motherships) {
      if (ms.team !== ship.team) {
        const d = Math.sqrt((ms.x - ship.x) ** 2 + (ms.y - ship.y) ** 2);
        if (d < minDist) {
          minDist = d;
          nearest = ms;
        }
      }
    }

    return nearest;
  }

  getNearestTargetTo(x: number, y: number, myTeam: Team) {
    let nearest: Ship | null = null;
    let minDist = Infinity;
    for (const s of this.ships) {
      if (s.team !== myTeam) {
        const d = Math.sqrt((s.x - x) ** 2 + (s.y - y) ** 2);
        if (d < minDist) {
          minDist = d;
          nearest = s;
        }
      }
    }
    return nearest;
  }
}
