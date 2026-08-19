// Enemy archetypes. `hp`/`damage`/`speed` are base values at act 1, node-elapsed 0;
// the spawner scales them up over a node's duration and by act tier. `behavior`
// selects an update function in enemies.js. `minAct` gates which acts a type can
// appear in — availability is otherwise driven by the current biome's `enemyPool`.
// `resistances` multiply incoming damage by weapon damageType (>1 = weak to it,
// <1 = resists it); an omitted type defaults to 1 (neutral).
export const ENEMY_TYPES = {
  crawler: {
    id: 'crawler', name: 'Crawler', behavior: 'chase',
    hp: 14, speed: 95, damage: 8, radius: 12, xp: 1, color: '#7CFC9A', glow: '#2f7a45',
    minAct: 1, weight: 10,
    resistances: { fire: 1.15, frost: 0.9 },
  },
  sprinter: {
    id: 'sprinter', name: 'Sprinter', behavior: 'chase',
    hp: 9, speed: 190, damage: 6, radius: 9, xp: 1, color: '#FFE066', glow: '#8a7a1f',
    minAct: 1, weight: 6,
    resistances: { shock: 1.25, frost: 0.85 },
  },
  swarmling: {
    id: 'swarmling', name: 'Swarmling', behavior: 'chase',
    hp: 4, speed: 130, damage: 4, radius: 6, xp: 1, color: '#5ee6ff', glow: '#1f5a6b',
    minAct: 1, weight: 8, spawnsInGroups: true,
    resistances: { fire: 1.3, poison: 0.75 },
  },
  spitter: {
    id: 'spitter', name: 'Spitter', behavior: 'ranged',
    hp: 20, speed: 70, damage: 10, radius: 11, xp: 2, color: '#c98cff', glow: '#5a2f7a',
    minAct: 2, weight: 5, range: 320, fireRate: 1.6, projSpeed: 190,
    resistances: { fire: 0.85, poison: 1.25 },
  },
  brute: {
    id: 'brute', name: 'Brute', behavior: 'chase',
    hp: 70, speed: 65, damage: 18, radius: 20, xp: 4, color: '#FF6B6B', glow: '#7a2020',
    minAct: 2, weight: 4,
    resistances: { poison: 0.8, shock: 0.85, frost: 1.2 },
  },
};

export const BOSS_TYPES = {
  warden: {
    id: 'warden', name: 'The Warden', behavior: 'boss_warden',
    hp: 900, speed: 78, damage: 14, radius: 34, xp: 40, color: '#ff5e8a', glow: '#7a1f3a',
    slamRange: 90, slamDamage: 28, slamCooldown: 2.6, summonCooldown: 7,
    resistances: { poison: 0.85, shock: 0.9, frost: 1.1 },
  },
  swarmMother: {
    id: 'swarmMother', name: 'The Swarm Mother', behavior: 'boss_swarmmother',
    hp: 1500, speed: 72, damage: 12, radius: 36, xp: 70, color: '#7CFC9A', glow: '#1f5a2f',
    pulseRadius: 130, pulseDamage: 20, pulseCooldown: 3.2, summonCooldown: 5,
    resistances: { fire: 1.25, poison: 0.6 },
  },
  eclipse: {
    id: 'eclipse', name: 'The Eclipse', behavior: 'boss_eclipse',
    hp: 2600, speed: 90, damage: 16, radius: 42, xp: 120, color: '#ffb14a', glow: '#7a4a1f',
    burstCooldown: 3.2, burstCount: 16, dashCooldown: 5,
    resistances: { fire: 0.95, poison: 0.95, shock: 1.15, frost: 0.95 },
  },
};

// Each act plays out in one biome: it picks which enemy types can spawn, the
// act's boss, and the arena's color palette.
export const BIOMES = [
  {
    id: 'neonSlums', name: 'Neon Slums', act: 1,
    enemyPool: ['crawler', 'sprinter', 'swarmling'],
    boss: 'warden', hazardType: null,
    bg: '#05060f', grid: 'rgba(94, 230, 255, 0.06)', accent: '#5ee6ff',
  },
  {
    id: 'toxicWastes', name: 'Toxic Wastes', act: 2,
    enemyPool: ['sprinter', 'swarmling', 'spitter', 'brute'],
    boss: 'swarmMother', hazardType: 'poison',
    bg: '#050f08', grid: 'rgba(124, 252, 154, 0.07)', accent: '#7CFC9A',
  },
  {
    id: 'eclipseCore', name: 'Eclipse Core', act: 3,
    enemyPool: ['crawler', 'brute', 'spitter', 'swarmling'],
    boss: 'eclipse', hazardType: 'fire',
    bg: '#0f0605', grid: 'rgba(255, 138, 94, 0.07)', accent: '#ffb14a',
  },
];

export function biomeForAct(actNumber) {
  return BIOMES[actNumber - 1] || BIOMES[BIOMES.length - 1];
}

// The game's core difficulty curve, centralized here instead of scattered as
// magic numbers in enemies.js's difficultyScale() — same math, just named and
// in one place so future balance passes have a single table to tune.
export const DIFFICULTY_CURVE = {
  actHpPerAct: 0.6, actDmgPerAct: 0.45, actSpeedPerAct: 0.12, actSpawnPerAct: 0.3,
  timeHpRate: 0.35, timeDmgRate: 0.12, timeSpeedRate: 0.06, timeSpeedCap: 0.25, timeSpawnRate: 0.4,
};
