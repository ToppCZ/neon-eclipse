import { WEAPONS } from './weapons.js';
import { weightedPick } from './utils.js';

// Passive ids intentionally match each weapon's `evolutionRequires`.
export const PASSIVES = {
  might: {
    id: 'might', name: 'Might', maxLevel: 5, icon: 'might',
    desc: '+8% damage',
    apply(player, level) { player.might *= 1 + 0.08 * level; },
  },
  vitality: {
    id: 'vitality', name: 'Vitality', maxLevel: 5, icon: 'vitality',
    desc: '+15% max HP',
    apply(player, level) { player.maxHp *= 1 + 0.15 * level; },
  },
  amulet: {
    id: 'amulet', name: 'Amulet', maxLevel: 5, icon: 'amulet',
    desc: '+8% area',
    apply(player, level) { player.area *= 1 + 0.08 * level; },
  },
  haste: {
    id: 'haste', name: 'Haste', maxLevel: 5, icon: 'haste',
    desc: '-6% cooldowns',
    apply(player, level) { player.cooldownMult *= Math.max(0.4, 1 - 0.06 * level); },
  },
  magnet: {
    id: 'magnet', name: 'Magnet', maxLevel: 5, icon: 'magnet',
    desc: '+25% pickup radius',
    apply(player, level) { player.magnet *= 1 + 0.25 * level; },
  },
  fortune: {
    id: 'fortune', name: 'Fortune', maxLevel: 5, icon: 'fortune',
    desc: '+12% luck & gold',
    apply(player, level) { player.luck *= 1 + 0.12 * level; },
  },
  boots: {
    id: 'boots', name: 'Boots', maxLevel: 5, icon: 'boots',
    desc: '+7% move speed',
    apply(player, level) { player.speed *= 1 + 0.07 * level; },
  },
};

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
        pool.push({ kind: 'weaponLevel', id, weight: 10, title: def.name, subtitle: `Level ${slot.level + 1}`, desc: def.desc, level: slot.level + 1, maxLevel: def.maxLevel });
      }
    } else if (weaponSystem.weaponCount() < 6) {
      pool.push({ kind: 'weaponNew', id, weight: 7, title: def.name, subtitle: 'New Weapon', desc: def.desc, level: 1, maxLevel: def.maxLevel });
    }
  }

  for (const id of PASSIVE_IDS) {
    const def = PASSIVES[id];
    const level = player.passiveLevel(id);
    if (level < def.maxLevel) {
      pool.push({ kind: 'passive', id, weight: 8, title: def.name, subtitle: level === 0 ? 'New Passive' : `Level ${level + 1}`, desc: def.desc, level: level + 1, maxLevel: def.maxLevel });
    }
  }

  // Small gold-only fallback so the pool is never empty late-game once
  // everything is maxed.
  if (pool.length === 0) {
    return [{ kind: 'gold', id: 'gold', weight: 1, title: 'Cache of Gold', subtitle: '+50 Gold', desc: 'Everything is maxed. Take the spoils.' }];
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
    case 'gold':
      player.gold += 50;
      break;
  }
  weaponSystem.checkEvolutions(player);
}
