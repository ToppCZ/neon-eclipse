const STORAGE_KEY = 'neonEclipse.meta.v1';

export const META_UPGRADES = {
  hp: { id: 'hp', name: 'Vital Core', desc: '+5% max HP', stat: 'hp', perLevel: 0.05, maxLevel: 10, baseCost: 40, costGrowth: 1.28 },
  might: { id: 'might', name: 'Overcharge', desc: '+4% damage', stat: 'might', perLevel: 0.04, maxLevel: 10, baseCost: 45, costGrowth: 1.3 },
  speed: { id: 'speed', name: 'Lightweight Frame', desc: '+3% move speed', stat: 'speed', perLevel: 0.03, maxLevel: 8, baseCost: 35, costGrowth: 1.28 },
  armor: { id: 'armor', name: 'Plating', desc: '+1 armor', stat: 'armor', perLevel: 1, maxLevel: 8, baseCost: 50, costGrowth: 1.32, flat: true },
  luck: { id: 'luck', name: "Gambler's Charm", desc: '+5% luck', stat: 'luck', perLevel: 0.05, maxLevel: 8, baseCost: 45, costGrowth: 1.3 },
  magnet: { id: 'magnet', name: 'Attractor Coil', desc: '+8% pickup radius', stat: 'magnet', perLevel: 0.08, maxLevel: 8, baseCost: 30, costGrowth: 1.25 },
};

function defaultMeta() {
  return {
    gold: 0,
    levels: { hp: 0, might: 0, speed: 0, armor: 0, luck: 0, magnet: 0 },
    stats: { totalRuns: 0, bestTime: 0, bestLevel: 0, bestAct: 0, totalKills: 0, totalNodesCleared: 0 },
  };
}

export function loadMeta() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultMeta();
    const parsed = JSON.parse(raw);
    const base = defaultMeta();
    return {
      gold: parsed.gold ?? base.gold,
      levels: { ...base.levels, ...(parsed.levels || {}) },
      stats: { ...base.stats, ...(parsed.stats || {}) },
    };
  } catch {
    return defaultMeta();
  }
}

export function saveMeta(meta) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(meta)); } catch { /* storage unavailable — progress just won't persist */ }
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

export function recordRunResult(meta, { time, level, kills, actReached, nodesCleared, goldEarned }) {
  meta.gold += goldEarned;
  meta.stats.totalRuns += 1;
  meta.stats.bestTime = Math.max(meta.stats.bestTime, time);
  meta.stats.bestLevel = Math.max(meta.stats.bestLevel, level);
  meta.stats.bestAct = Math.max(meta.stats.bestAct, actReached || 0);
  meta.stats.totalKills += kills;
  meta.stats.totalNodesCleared += nodesCleared || 0;
  saveMeta(meta);
}
