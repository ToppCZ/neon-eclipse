// Enemy archetypes. `hp`/`damage`/`speed` are base values at t=0; the spawner
// scales them up over the run's duration. `behavior` selects an update
// function in enemies.js.
export const ENEMY_TYPES = {
  crawler: {
    id: 'crawler', name: 'Crawler', behavior: 'chase',
    hp: 14, speed: 95, damage: 8, radius: 12, xp: 1, color: '#7CFC9A', glow: '#2f7a45',
    unlockAt: 0, weight: 10,
  },
  sprinter: {
    id: 'sprinter', name: 'Sprinter', behavior: 'chase',
    hp: 9, speed: 190, damage: 6, radius: 9, xp: 1, color: '#FFE066', glow: '#8a7a1f',
    unlockAt: 60, weight: 6,
  },
  brute: {
    id: 'brute', name: 'Brute', behavior: 'chase',
    hp: 70, speed: 65, damage: 18, radius: 20, xp: 4, color: '#FF6B6B', glow: '#7a2020',
    unlockAt: 150, weight: 4,
  },
  spitter: {
    id: 'spitter', name: 'Spitter', behavior: 'ranged',
    hp: 20, speed: 70, damage: 10, radius: 11, xp: 2, color: '#c98cff', glow: '#5a2f7a',
    unlockAt: 240, weight: 5, range: 320, fireRate: 1.6, projSpeed: 190,
  },
  swarmling: {
    id: 'swarmling', name: 'Swarmling', behavior: 'chase',
    hp: 4, speed: 130, damage: 4, radius: 6, xp: 1, color: '#5ee6ff', glow: '#1f5a6b',
    unlockAt: 90, weight: 8, spawnsInGroups: true,
  },
};

export const BOSS_TYPES = {
  warden: {
    id: 'warden', name: 'The Warden', behavior: 'boss_warden',
    hp: 900, speed: 78, damage: 14, radius: 34, xp: 40, color: '#ff5e8a', glow: '#7a1f3a',
    slamRange: 90, slamDamage: 28, slamCooldown: 2.6, summonCooldown: 7,
  },
  eclipse: {
    id: 'eclipse', name: 'The Eclipse', behavior: 'boss_eclipse',
    hp: 2600, speed: 90, damage: 16, radius: 42, xp: 120, color: '#ffb14a', glow: '#7a4a1f',
    burstCooldown: 3.2, burstCount: 16, dashCooldown: 5,
  },
};

// Time (seconds) -> boss id. Runs cap difficulty escalation shortly after the last one.
export const BOSS_SCHEDULE = [
  { time: 180, id: 'warden' },
  { time: 420, id: 'eclipse' },
];

export const RUN_LENGTH = 600; // 10 minutes to a clean "Victory" screen
