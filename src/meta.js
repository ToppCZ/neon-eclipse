const STORAGE_KEY = 'neonEclipse.meta.v1';
const SLOTS_INDEX_KEY = 'neonEclipse.slots.v1';
const MAX_LEADERBOARD = 10;

// ---- Save slots ------------------------------------------------------------
// The unsuffixed STORAGE_KEY is always the 'default' slot, so existing saves
// from before this feature keep working untouched. Extra slots live under
// `${STORAGE_KEY}.<slot>`.
function slotStorageKey(slot) {
  return slot === 'default' ? STORAGE_KEY : `${STORAGE_KEY}.${slot}`;
}

export function listSlots() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SLOTS_INDEX_KEY) || 'null');
    return parsed && Array.isArray(parsed.slots) && parsed.slots.length ? parsed.slots : ['default'];
  } catch {
    return ['default'];
  }
}

export function getActiveSlot() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SLOTS_INDEX_KEY) || 'null');
    return (parsed && parsed.active) || 'default';
  } catch {
    return 'default';
  }
}

function saveSlotsIndex(slots, active) {
  try { localStorage.setItem(SLOTS_INDEX_KEY, JSON.stringify({ slots, active })); } catch { /* unavailable */ }
}

export function setActiveSlot(name) {
  const slots = listSlots();
  if (!slots.includes(name)) slots.push(name);
  saveSlotsIndex(slots, name);
}

// Creates (if needed) and switches to a new named slot, seeded with fresh defaults.
export function createSlot(name) {
  setActiveSlot(name);
  saveMeta(defaultMeta(), name);
}

export const META_UPGRADES = {
  hp: { id: 'hp', name: 'Vital Core', desc: '+5% max HP', stat: 'hp', perLevel: 0.05, maxLevel: 10, baseCost: 40, costGrowth: 1.28 },
  might: { id: 'might', name: 'Overcharge', desc: '+4% damage', stat: 'might', perLevel: 0.04, maxLevel: 10, baseCost: 45, costGrowth: 1.3 },
  speed: { id: 'speed', name: 'Lightweight Frame', desc: '+3% move speed', stat: 'speed', perLevel: 0.03, maxLevel: 8, baseCost: 35, costGrowth: 1.28 },
  armor: { id: 'armor', name: 'Plating', desc: '+1 armor', stat: 'armor', perLevel: 1, maxLevel: 8, baseCost: 50, costGrowth: 1.32, flat: true },
  luck: { id: 'luck', name: "Gambler's Charm", desc: '+5% luck', stat: 'luck', perLevel: 0.05, maxLevel: 8, baseCost: 45, costGrowth: 1.3 },
  magnet: { id: 'magnet', name: 'Attractor Coil', desc: '+8% pickup radius', stat: 'magnet', perLevel: 0.08, maxLevel: 8, baseCost: 30, costGrowth: 1.25 },
};

const MAX_HISTORY = 5;

function defaultMeta() {
  return {
    gold: 0,
    levels: { hp: 0, might: 0, speed: 0, armor: 0, luck: 0, magnet: 0 },
    stats: { totalRuns: 0, bestTime: 0, bestLevel: 0, bestAct: 0, bestWave: 0, totalKills: 0, totalNodesCleared: 0 },
    history: [], // last few runs, newest first — quick "what happened last time" glance on the menu
    achievements: [], // unlocked achievement ids, see achievements.js
    leaderboard: [], // top runs by score, longer-lived than history — see recordRunResult
    dailyBest: {}, // dateStr -> best Daily Challenge wave reached
    pickStats: { weapons: {}, passives: {} }, // dev-only pick-frequency counters, see game.js applyChoiceTracked
  };
}

export function loadMeta(slot = getActiveSlot()) {
  try {
    const raw = localStorage.getItem(slotStorageKey(slot));
    if (!raw) return defaultMeta();
    const parsed = JSON.parse(raw);
    const base = defaultMeta();
    return {
      gold: parsed.gold ?? base.gold,
      levels: { ...base.levels, ...(parsed.levels || {}) },
      stats: { ...base.stats, ...(parsed.stats || {}) },
      history: Array.isArray(parsed.history) ? parsed.history.slice(0, MAX_HISTORY) : base.history,
      achievements: Array.isArray(parsed.achievements) ? parsed.achievements : base.achievements,
      leaderboard: Array.isArray(parsed.leaderboard) ? parsed.leaderboard.slice(0, MAX_LEADERBOARD) : base.leaderboard,
      dailyBest: (parsed.dailyBest && typeof parsed.dailyBest === 'object') ? parsed.dailyBest : base.dailyBest,
      pickStats: {
        weapons: { ...base.pickStats.weapons, ...((parsed.pickStats && parsed.pickStats.weapons) || {}) },
        passives: { ...base.pickStats.passives, ...((parsed.pickStats && parsed.pickStats.passives) || {}) },
      },
    };
  } catch {
    return defaultMeta();
  }
}

export function saveMeta(meta, slot = getActiveSlot()) {
  try { localStorage.setItem(slotStorageKey(slot), JSON.stringify(meta)); } catch { /* storage unavailable — progress just won't persist */ }
}

export function upgradeCost(def, level) {
  return Math.round(def.baseCost * Math.pow(def.costGrowth, level));
}

export function purchaseUpgrade(meta, id) {
  const def = META_UPGRADES[id];
  if (!def) return false;
  const level = meta.levels[id] || 0;
  if (level >= def.maxLevel) return false;
  const cost = upgradeCost(def, level);
  if (meta.gold < cost) return false;
  meta.gold -= cost;
  meta.levels[id] = level + 1;
  saveMeta(meta);
  return true;
}

export function getMetaBonuses(meta) {
  const bonuses = { hp: 0, might: 0, speed: 0, armor: 0, luck: 0, magnet: 0 };
  for (const id of Object.keys(META_UPGRADES)) {
    const def = META_UPGRADES[id];
    const level = meta.levels[id] || 0;
    bonuses[def.stat] = def.flat ? level * def.perLevel : level * def.perLevel;
  }
  return bonuses;
}

// A single comparable score across both modes: acts and endless waves both
// count for a lot, kills/level/time-survived are the tiebreaker texture.
function computeScore(stats) {
  const base = stats.mode === 'endless'
    ? (stats.wave || 0) * 100
    : (stats.actReached || 0) * 500 + (stats.victory ? 1000 : 0);
  return Math.round(base + (stats.kills || 0) + (stats.level || 0) * 20 + (stats.time || 0));
}

export function recordRunResult(meta, stats) {
  const { time, level, kills, actReached, nodesCleared, goldEarned, wave, mode, victory } = stats;
  meta.gold += goldEarned;
  meta.stats.totalRuns += 1;
  meta.stats.bestTime = Math.max(meta.stats.bestTime, time);
  meta.stats.bestLevel = Math.max(meta.stats.bestLevel, level);
  meta.stats.bestAct = Math.max(meta.stats.bestAct, actReached || 0);
  meta.stats.bestWave = Math.max(meta.stats.bestWave || 0, wave || 0);
  meta.stats.totalKills += kills;
  meta.stats.totalNodesCleared += nodesCleared || 0;
  meta.history = meta.history || [];
  meta.history.unshift({ mode, victory: !!victory, wave, actReached, level, kills, time, goldEarned });
  meta.history = meta.history.slice(0, MAX_HISTORY);
  meta.leaderboard = meta.leaderboard || [];
  meta.leaderboard.push({ mode, victory: !!victory, wave, actReached, level, kills, time, goldEarned, score: computeScore(stats) });
  meta.leaderboard.sort((a, b) => b.score - a.score);
  meta.leaderboard = meta.leaderboard.slice(0, MAX_LEADERBOARD);
  saveMeta(meta);
}
