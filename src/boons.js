import { rng } from './utils.js';

// Mid-run risk/reward picks offered by "boon" nodes — a real tradeoff (both
// a buff and a drawback), distinct from the level-up/treasure pool which is
// pure upside. Applied once, directly to the player's base stats or a
// dedicated multiplier field, so they persist independent of the
// passive-recompute cycle (recomputeStats reads FROM these, never resets them).
//
// Berserker's Pact and Warden's Pact are mutually exclusive: picking either
// one locks player.lockedBoonPath, which permanently removes the other from
// the pool for the rest of the run — a real branching choice, not just a
// bigger number.
export const BOONS = [
  {
    id: 'berserkerPact', title: "Berserker's Pact", path: 'berserker',
    desc: '+30% damage, -20% max HP. Locks out the Warden path for this run.',
    apply(player) { player.baseMight *= 1.3; player.baseMaxHp *= 0.8; },
  },
  {
    id: 'wardenPact', title: "Warden's Pact", path: 'warden',
    desc: '+30% max HP, +3 armor, -15% damage. Locks out the Berserker path for this run.',
    apply(player) { player.baseMaxHp *= 1.3; player.baseArmor += 3; player.baseMight *= 0.85; },
  },
  {
    id: 'overclock', title: 'Overclock',
    desc: '-25% cooldowns, -15% max HP',
    apply(player) { player.baseCooldown *= 0.75; player.baseMaxHp *= 0.85; },
  },
  {
    id: 'greedsToll', title: "Greed's Toll",
    desc: '+50% Cores from kills, +20% damage taken',
    apply(player) { player.coreValueMult *= 1.5; player.incomingDmgMult *= 1.2; },
  },
];

export function rollBoonChoices(player, n = 2) {
  const available = BOONS.filter((b) => !b.path || !player.lockedBoonPath || b.path === player.lockedBoonPath);
  const pool = [...available];
  const chosen = [];
  for (let i = 0; i < Math.min(n, pool.length); i++) {
    const idx = Math.floor(rng() * pool.length);
    chosen.push(pool.splice(idx, 1)[0]);
  }
  return chosen.map((b) => ({
    kind: 'boon', id: b.id,
    title: b.title,
    subtitle: b.path ? `Boon · ${b.path === 'berserker' ? 'Berserker Path' : 'Warden Path'}` : 'Boon',
    desc: b.desc, tier: 'legendary',
    _apply: b.apply, _path: b.path,
  }));
}
