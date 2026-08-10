import { clamp, TAU } from './utils.js';

const CHARACTERS = {
  vex: {
    id: 'vex', name: 'Vex', tagline: 'Balanced striker',
    color: '#5ee6ff', accent: '#bff6ff',
    baseHp: 100, baseSpeed: 235, baseMight: 1, baseArea: 1, baseCooldown: 1,
    baseMagnet: 90, baseLuck: 1, baseArmor: 0, baseRegen: 0.4,
    startWeapon: 'shardCannon',
  },
  rook: {
    id: 'rook', name: 'Rook', tagline: 'Slow, armored, relentless',
    color: '#ff8a5e', accent: '#ffd7c2',
    baseHp: 150, baseSpeed: 195, baseMight: 1.15, baseArea: 1.1, baseCooldown: 1.05,
    baseMagnet: 75, baseLuck: 0.9, baseArmor: 4, baseRegen: 0.7,
    startWeapon: 'pulseBlade',
  },
  nyx: {
    id: 'nyx', name: 'Nyx', tagline: 'Fast, fragile, lucky',
    color: '#c98cff', accent: '#ecd6ff',
    baseHp: 80, baseSpeed: 270, baseMight: 0.9, baseArea: 0.95, baseCooldown: 0.92,
    baseMagnet: 110, baseLuck: 1.4, baseArmor: 0, baseRegen: 0.25,
    startWeapon: 'orbitDrones',
  },
};

export function getCharacter(id) { return CHARACTERS[id] || CHARACTERS.vex; }
export function listCharacters() { return Object.values(CHARACTERS); }

export class Player {
  constructor(character, metaBonuses) {
    this.char = character;
    this.x = 0;
    this.y = 0;
    this.radius = 16;
    this.facing = 0;

    const meta = metaBonuses || { hp: 0, might: 0, speed: 0, armor: 0, luck: 0, magnet: 0 };
    this.baseMaxHp = character.baseHp * (1 + meta.hp);
    this.baseSpeed = character.baseSpeed * (1 + meta.speed);
    this.baseMight = character.baseMight * (1 + meta.might);
    this.baseArea = character.baseArea;
    this.baseCooldown = character.baseCooldown;
    this.baseMagnet = character.baseMagnet * (1 + meta.magnet);
    this.baseLuck = character.baseLuck * (1 + meta.luck);
    this.baseArmor = character.baseArmor + meta.armor;
    this.baseRegen = character.baseRegen;

    this.passives = new Map(); // id -> level

    this.maxHp = this.baseMaxHp;
    this.hp = this.maxHp;
    this.speed = this.baseSpeed;
    this.might = this.baseMight;
    this.area = this.baseArea;
    this.cooldownMult = this.baseCooldown;
    this.magnet = this.baseMagnet;
    this.luck = this.baseLuck;
    this.armor = this.baseArmor;
    this.regen = this.baseRegen;
    this.xpGainMult = 1;
    this.projSpeedMult = 1;
    this.projCountBonus = 0;

    this.level = 1;
    this.xp = 0;
    this.xpToNext = 5;
    this.gold = 0;

    this.invulnTimer = 0;
    this.hurtFlash = 0;
    this.regenAccum = 0;
    this.dead = false;

    this.kills = 0;
    this.moveAngle = 0;
    this.moving = false;
  }

  xpCurveFor(level) {
    return Math.round(5 + level * 4.5 + Math.pow(level, 1.35) * 2.2);
  }

  passiveLevel(id) { return this.passives.get(id) || 0; }

  addPassive(id, maxLevel) {
    const cur = this.passiveLevel(id);
    if (cur >= maxLevel) return cur;
    this.passives.set(id, cur + 1);
    return cur + 1;
  }

  // Recomputes every derived stat from base values + owned passives.
  // Called after any passive is gained so stacking is always consistent
  // rather than relying on incremental multiplication (which drifts).
  recomputeStats(passiveDefs) {
    const prevMax = this.maxHp;
    this.maxHp = this.baseMaxHp;
    this.speed = this.baseSpeed;
    this.might = this.baseMight;
    this.area = this.baseArea;
    this.cooldownMult = this.baseCooldown;
    this.magnet = this.baseMagnet;
    this.luck = this.baseLuck;
    this.armor = this.baseArmor;
    this.regen = this.baseRegen;
    this.xpGainMult = 1;
    this.projSpeedMult = 1;
    this.projCountBonus = 0;

    for (const [id, level] of this.passives) {
      const def = passiveDefs[id];
      if (def && def.apply) def.apply(this, level);
    }

    // Gaining max-HP passives heals by the same delta rather than leaving
    // the player at a now-smaller fraction of their bar.
    if (this.maxHp > prevMax) this.hp += (this.maxHp - prevMax);
    this.hp = clamp(this.hp, 0, this.maxHp);
  }

  update(dt, input, worldHalf) {
    if (this.invulnTimer > 0) this.invulnTimer -= dt;
    if (this.hurtFlash > 0) this.hurtFlash -= dt;

    let mx = 0, my = 0;
    if (input.left) mx -= 1;
    if (input.right) mx += 1;
    if (input.up) my -= 1;
    if (input.down) my += 1;
    this.moving = mx !== 0 || my !== 0;
    if (this.moving) {
      const len = Math.hypot(mx, my) || 1;
      mx /= len; my /= len;
      this.x += mx * this.speed * dt;
      this.y += my * this.speed * dt;
      this.facing = Math.atan2(my, mx);
    }
    this.x = clamp(this.x, -worldHalf, worldHalf);
    this.y = clamp(this.y, -worldHalf, worldHalf);

    if (this.regen > 0 && this.hp < this.maxHp) {
      this.regenAccum += this.regen * dt;
      if (this.regenAccum >= 1) {
        const heal = Math.floor(this.regenAccum);
        this.regenAccum -= heal;
        this.hp = Math.min(this.maxHp, this.hp + heal);
      }
    }
  }

  takeDamage(amount) {
    if (this.invulnTimer > 0 || this.dead) return 0;
    const mitigated = Math.max(1, amount - this.armor);
    this.hp -= mitigated;
    this.invulnTimer = 0.6;
    this.hurtFlash = 0.25;
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
    }
    return mitigated;
  }

  gainXp(amount) {
    if (this.dead) return null;
    this.xp += amount * this.xpGainMult;
    const levelsGained = [];
    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level += 1;
      this.xpToNext = this.xpCurveFor(this.level);
      levelsGained.push(this.level);
    }
    return levelsGained.length ? levelsGained : null;
  }
}
