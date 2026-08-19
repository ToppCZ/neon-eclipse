import { WEAPONS } from './weapons.js';
import { weightedPick } from './utils.js';

// Passive ids intentionally match each weapon's `evolutionRequires`. Each
// `apply` bakes in a "mastery" kicker at max level (5) — a small extra jump
// so maxing a passive feels like it transforms into a stronger unique
// version, the same spirit as weapon evolution, without a second bookkeeping
// system for it.
export const PASSIVES = {
  might: {
    id: 'might', name: 'Might', maxLevel: 5, icon: 'might',
    desc: '+8% damage (+mastery at 5)',
    apply(player, level) { player.might *= 1 + 0.08 * level + (level >= 5 ? 0.1 : 0); },
  },
  vitality: {
    id: 'vitality', name: 'Vitality', maxLevel: 5, icon: 'vitality',
    desc: '+15% max HP (+mastery at 5)',
    apply(player, level) { player.maxHp *= 1 + 0.15 * level + (level >= 5 ? 0.1 : 0); },
  },
  amulet: {
    id: 'amulet', name: 'Amulet', maxLevel: 5, icon: 'amulet',
    desc: '+8% area (+mastery at 5)',
    apply(player, level) { player.area *= 1 + 0.08 * level + (level >= 5 ? 0.1 : 0); },
  },
  haste: {
    id: 'haste', name: 'Haste', maxLevel: 5, icon: 'haste',
    desc: '-6% cooldowns (+mastery at 5)',
    apply(player, level) { player.cooldownMult *= Math.max(0.35, 1 - 0.06 * level - (level >= 5 ? 0.05 : 0)); },
  },
  magnet: {
    id: 'magnet', name: 'Magnet', maxLevel: 5, icon: 'magnet',
    desc: '+25% pickup radius (+mastery at 5)',
    apply(player, level) { player.magnet *= 1 + 0.25 * level + (level >= 5 ? 0.15 : 0); },
  },
  fortune: {
    id: 'fortune', name: 'Fortune', maxLevel: 5, icon: 'fortune',
    desc: '+12% luck & cores (+mastery at 5)',
    apply(player, level) { player.luck *= 1 + 0.12 * level + (level >= 5 ? 0.1 : 0); },
  },
  boots: {
    id: 'boots', name: 'Boots', maxLevel: 5, icon: 'boots',
    desc: '+7% move speed (+mastery at 5)',
    apply(player, level) { player.speed *= 1 + 0.07 * level + (level >= 5 ? 0.1 : 0); },
  },
  thorns: {
    id: 'thorns', name: 'Thorns', maxLevel: 5, icon: 'thorns',
    desc: '+3 reflect damage on contact (+mastery at 5)',
    apply(player, level) { player.thorns += 3 * level + (level >= 5 ? 5 : 0); },
  },
  regen: {
    id: 'regen', name: 'Second Wind', maxLevel: 5, icon: 'regen',
    desc: '+0.3 HP/s regen (+mastery at 5)',
    apply(player, level) { player.regen += 0.3 * level + (level >= 5 ? 0.3 : 0); },
  },
  dashCharges: {
    id: 'dashCharges', name: 'Phase Coil', maxLevel: 2, icon: 'dashCharges',
    desc: '+1 max dash charge',
    apply(player, level) { player.maxDashCharges += level; },
  },
};

export const TIER_COLORS = { common: '#9aa4c9', rare: '#5ee6ff', legendary: '#ffd54a' };

function weaponTier(level) {
  if (level >= 7) return 'legendary';
  if (level >= 4) return 'rare';
  return 'common';
}
function passiveTier(level) {
  if (level >= 5) return 'legendary';
  if (level >= 3) return 'rare';
  return 'common';
}

const WEAPON_IDS = Object.keys(WEAPONS);
const PASSIVE_IDS = Object.keys(PASSIVES);

// Builds up to `n` distinct upgrade choices for the level-up modal.
// Weighting: new weapons/passives are common when slots are open; once a
// weapon or passive is maxed it drops out of the pool automatically.
export function rollUpgradeChoices(player, weaponSystem, n = 3) {
  const pool = [];

  for (const id of WEAPON_IDS) {
    const slot = weaponSystem.getSlot(id);
    const def = WEAPONS[id];
    if (slot) {
      if (slot.level < def.maxLevel) {
        const level = slot.level + 1;
        pool.push({ kind: 'weaponLevel', id, weight: 10, title: def.name, subtitle: `Level ${level}`, desc: def.desc, level, maxLevel: def.maxLevel, tier: weaponTier(level) });
      }
    } else if (weaponSystem.weaponCount() < 6) {
      pool.push({ kind: 'weaponNew', id, weight: 7, title: def.name, subtitle: 'New Weapon', desc: def.desc, level: 1, maxLevel: def.maxLevel, tier: 'common' });
    }
  }

  for (const id of PASSIVE_IDS) {
    const def = PASSIVES[id];
    const level = player.passiveLevel(id);
    if (level < def.maxLevel) {
      const nextLevel = level + 1;
      pool.push({ kind: 'passive', id, weight: 8, title: def.name, subtitle: level === 0 ? 'New Passive' : `Level ${nextLevel}`, desc: def.desc, level: nextLevel, maxLevel: def.maxLevel, tier: passiveTier(nextLevel) });
    }
  }

  // Small cores-only fallback so the pool is never empty late-game once
  // everything is maxed.
  if (pool.length === 0) {
    return [{ kind: 'cores', id: 'cores', weight: 1, title: 'Cache of Cores', subtitle: '+50 Cores', desc: 'Everything is maxed. Take the spoils.', tier: 'common' }];
  }

  const luckBias = Math.min(2.2, player.luck);
  const chosen = [];
  const remaining = [...pool];
  const count = Math.min(n, remaining.length);
  for (let i = 0; i < count; i++) {
    const weighted = remaining.map(item => ({ weight: item.weight * (item.kind === 'weaponNew' ? luckBias : 1), value: item }));
    const pickd = weightedPick(weighted);
    chosen.push(pickd);
    const idx = remaining.indexOf(pickd);
    remaining.splice(idx, 1);
  }
  return chosen;
}

export function applyUpgradeChoice(choice, player, weaponSystem) {
  switch (choice.kind) {
    case 'weaponNew':
      weaponSystem.equip(choice.id);
      break;
    case 'weaponLevel':
      weaponSystem.levelUp(choice.id);
      break;
    case 'passive':
      player.addPassive(choice.id, PASSIVES[choice.id].maxLevel);
      player.recomputeStats(PASSIVES);
      break;
    case 'cores':
      player.cores += 50;
      break;
  }
  weaponSystem.checkEvolutions(player);
}

// ---- Shop nodes: same candidate pool as level-up choices, but priced in
// Cores and offered several at once without pausing the run. ----
function costFor(choice) {
  switch (choice.kind) {
    case 'weaponNew': return 45;
    case 'weaponLevel': return 22 + choice.level * 6;
    case 'passive': return 18 + choice.level * 5;
    default: return 20;
  }
}

export function rollShopOffers(player, weaponSystem, n = 4) {
  const choices = rollUpgradeChoices(player, weaponSystem, n);
  return choices.map(c => ({ ...c, cost: costFor(c) }));
}

export function shopRerollCost(rerollCount) {
  return 15 + rerollCount * 10;
}
