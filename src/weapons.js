import { Pool, clamp, dist, dist2, angleTo, randRange, TAU } from './utils.js';

// ---- Weapon definitions -----------------------------------------------
// getStats(level, player) returns the numbers a fire/update call needs.
// `evolvesInto` + `evolutionRequires` drive the evolution check.
export const WEAPONS = {
  shardCannon: {
    id: 'shardCannon', name: 'Shard Cannon', maxLevel: 8, damageType: 'physical',
    desc: 'Fires a piercing shard at the nearest foe.',
    evolvedName: 'Prism Cannon', evolutionRequires: 'might',
    getStats(level, player) {
      return {
        damage: (15 + level * 4.2) * player.might,
        cooldown: clamp(0.72 - level * 0.05, 0.24, 0.72) * player.cooldownMult,
        pierce: 1 + Math.floor(level / 2),
        speed: 560 * player.projSpeedMult,
        count: 1 + (level >= 6 ? 1 : 0) + player.projCountBonus,
        range: 900,
      };
    },
  },
  pulseBlade: {
    id: 'pulseBlade', name: 'Pulse Blade', maxLevel: 8, damageType: 'physical',
    desc: 'Sweeps a damaging arc in front of you.',
    evolvedName: 'Ring Blade', evolutionRequires: 'vitality',
    getStats(level, player) {
      return {
        damage: (19 + level * 5.5) * player.might,
        cooldown: clamp(0.8 - level * 0.045, 0.3, 0.8) * player.cooldownMult,
        arc: (1.35 + level * 0.06) ,
        range: (82 + level * 5) * player.area,
      };
    },
  },
  orbitDrones: {
    id: 'orbitDrones', name: 'Orbit Drones', maxLevel: 8, damageType: 'frost',
    desc: 'Orbiting drones that shred and chill anything they touch.',
    evolvedName: 'Halo Storm', evolutionRequires: 'amulet',
    getStats(level, player) {
      return {
        damage: (10 + level * 2.8) * player.might,
        count: Math.min(6, 1 + Math.floor(level / 1.4)) + player.projCountBonus,
        radius: (72 + level * 5) * player.area,
        rotSpeed: 2.3,
        tickCooldown: 0.26,
      };
    },
  },
  novaBurst: {
    id: 'novaBurst', name: 'Nova Burst', maxLevel: 8, damageType: 'fire',
    desc: 'Periodic fiery shockwave around you.',
    evolvedName: 'Supernova', evolutionRequires: 'haste',
    getStats(level, player) {
      return {
        damage: (16 + level * 4.4) * player.might,
        cooldown: clamp(2.0 - level * 0.09, 0.8, 2.0) * player.cooldownMult,
        radius: (95 + level * 9) * player.area,
      };
    },
  },
  homingMissile: {
    id: 'homingMissile', name: 'Homing Missile', maxLevel: 8, damageType: 'poison',
    desc: 'Slow but relentless corrosive tracking missiles.',
    evolvedName: 'Swarm Missiles', evolutionRequires: 'magnet',
    getStats(level, player) {
      return {
        damage: (24 + level * 6.5) * player.might,
        cooldown: clamp(1.4 - level * 0.05, 0.5, 1.4) * player.cooldownMult,
        count: 1 + Math.floor(level / 3) + player.projCountBonus,
        splash: (42 + level * 4) * player.area,
        speed: 250 * player.projSpeedMult,
        turnRate: 5.2,
      };
    },
  },
  chainLightning: {
    id: 'chainLightning', name: 'Chain Lightning', maxLevel: 8, damageType: 'shock',
    desc: 'Arcs between nearby enemies.',
    evolvedName: 'Storm Chain', evolutionRequires: 'fortune',
    getStats(level, player) {
      return {
        damage: (17 + level * 4.4) * player.might,
        cooldown: clamp(0.95 - level * 0.04, 0.35, 0.95) * player.cooldownMult,
        bounces: 2 + level,
        bounceRadius: 190 * player.area,
      };
    },
  },
};

function makeBullet() {
  return { x: 0, y: 0, vx: 0, vy: 0, damage: 0, damageType: 'physical', pierceLeft: 0, radius: 6, life: 3, color: '#5ee6ff', kind: 'bullet', hitSet: null, evolvedSplit: false, __alive: true, splash: 0, targetRef: null, turnRate: 0, speed: 0 };
}

function makeEffect() {
  return { kind: 'arc', x: 0, y: 0, angle: 0, arc: 0, range: 0, life: 0.15, maxLife: 0.15, damage: 0, damageType: 'physical', color: '#fff', hitSet: null, radius: 0, growTo: 0, __alive: true, points: null };
}

export class WeaponSystem {
  constructor(enemyManager, particles, audio) {
    this.enemyManager = enemyManager;
    this.particles = particles;
    this.audio = audio;
    this.slots = []; // {id, level, cooldownTimer, evolved, orbitAngle, hitCooldowns}
    this.bullets = new Pool(makeBullet, (b, opts) => {
      Object.assign(b, {
        x: opts.x, y: opts.y, vx: opts.vx, vy: opts.vy, damage: opts.damage,
        damageType: opts.damageType ?? 'physical',
        pierceLeft: opts.pierce ?? 0, radius: opts.radius ?? 6, life: opts.life ?? 3,
        color: opts.color ?? '#5ee6ff', kind: opts.kind ?? 'bullet', evolvedSplit: !!opts.evolvedSplit,
        splash: opts.splash ?? 0, targetRef: opts.targetRef ?? null, turnRate: opts.turnRate ?? 0,
        speed: opts.speed ?? 300,
      });
      b.hitSet = b.hitSet || new Set();
      b.hitSet.clear();
    });
    this.effects = new Pool(makeEffect, (e, opts) => {
      Object.assign(e, {
        kind: opts.kind, x: opts.x, y: opts.y, angle: opts.angle ?? 0, arc: opts.arc ?? 0,
        range: opts.range ?? 0, life: opts.life ?? 0.15, maxLife: opts.life ?? 0.15,
        damage: opts.damage ?? 0, damageType: opts.damageType ?? 'physical',
        color: opts.color ?? '#fff', radius: opts.radius ?? 0,
        growTo: opts.growTo ?? 0, points: opts.points ?? null,
      });
      e.hitSet = e.hitSet || new Set();
      e.hitSet.clear();
    });

    // Recomputed once per update() tick — see computeSynergy().
    this.synergy = { physical: 1, fire: 1, poison: 1, shock: 1, frost: 1, elementCount: 0 };
  }

  // Two build archetypes: "Physical Focus" (own both physical weapons) and
  // "Elemental Diversity" (own weapons across distinct non-physical types).
  // Both are passive bonuses that reward a real strategic weapon-picking
  // choice rather than just picking whatever's offered.
  computeSynergy() {
    const elements = new Set();
    let hasShard = false, hasPulse = false;
    for (const slot of this.slots) {
      const def = WEAPONS[slot.id];
      if (def.damageType && def.damageType !== 'physical') elements.add(def.damageType);
      if (slot.id === 'shardCannon') hasShard = true;
      if (slot.id === 'pulseBlade') hasPulse = true;
    }
    const diversity = 1 + elements.size * 0.05;
    const physicalFocus = (hasShard && hasPulse) ? 1.15 : 1;
    return { physical: physicalFocus, fire: diversity, poison: diversity, shock: diversity, frost: diversity, elementCount: elements.size };
  }

  reset() {
    this.slots = [];
    this.bullets.clear();
    this.effects.clear();
  }

  hasWeapon(id) { return this.slots.some(s => s.id === id); }
  weaponCount() { return this.slots.length; }
  getSlot(id) { return this.slots.find(s => s.id === id); }

  equip(id) {
    if (this.hasWeapon(id) || this.slots.length >= 6) return false;
    this.slots.push({ id, level: 1, cooldownTimer: randRange(0, 0.2), evolved: false, orbitAngle: 0, hitCooldowns: new Map(), fireTimer: 0 });
    return true;
  }

  levelUp(id) {
    const slot = this.getSlot(id);
    if (!slot) return false;
    const def = WEAPONS[id];
    if (slot.level >= def.maxLevel) return false;
    slot.level += 1;
    return true;
  }

  checkEvolutions(player) {
    for (const slot of this.slots) {
      if (slot.evolved) continue;
      const def = WEAPONS[slot.id];
      if (slot.level >= def.maxLevel && player.passives.get(def.evolutionRequires) > 0) {
        slot.evolved = true;
        this.particles.labelText(player.x, player.y - 40, `${def.evolvedName}!`, '#ffd54a');
        if (this.audio) this.audio.levelUp();
      }
    }
  }

  update(dt, player) {
    this.synergy = this.computeSynergy();
    for (const slot of this.slots) {
      const def = WEAPONS[slot.id];
      const stats = def.getStats(slot.level, player);
      if (slot.evolved) applyEvolutionBuffs(slot.id, stats);
      if (stats.damage != null) stats.damage *= (this.synergy[def.damageType] || 1);

      if (slot.id === 'orbitDrones') {
        this.updateOrbit(slot, stats, player, dt);
        continue;
      }

      slot.cooldownTimer -= dt;
      if (slot.cooldownTimer <= 0) {
        slot.cooldownTimer = stats.cooldown;
        this.fire(slot, def, stats, player);
      }
    }

    this.updateBullets(dt);
    this.updateEffects(dt, player);
  }

  fire(slot, def, stats, player) {
    switch (slot.id) {
      case 'shardCannon': return this.fireShardCannon(slot, stats, player);
      case 'pulseBlade': return this.firePulseBlade(slot, stats, player);
      case 'novaBurst': return this.fireNovaBurst(slot, stats, player);
      case 'homingMissile': return this.fireHomingMissile(slot, stats, player);
      case 'chainLightning': return this.fireChainLightning(slot, stats, player);
    }
  }

  fireShardCannon(slot, stats, player) {
    const target = this.enemyManager.nearest(player.x, player.y, stats.range);
    if (!target) return;
    const baseAngle = angleTo(player.x, player.y, target.x, target.y);
    const spread = stats.count > 1 ? 0.16 : 0;
    for (let i = 0; i < stats.count; i++) {
      const a = baseAngle + (i - (stats.count - 1) / 2) * spread;
      this.bullets.spawn({
        x: player.x, y: player.y, vx: Math.cos(a) * stats.speed, vy: Math.sin(a) * stats.speed,
        damage: stats.damage, damageType: WEAPONS.shardCannon.damageType, pierce: stats.pierce, radius: 6, life: 2.2,
        color: slot.evolved ? '#ffd54a' : '#5ee6ff', kind: 'bullet', evolvedSplit: slot.evolved,
      });
    }
    if (this.audio) this.audio.shoot();
  }

  firePulseBlade(slot, stats, player) {
    const arc = slot.evolved ? TAU : stats.arc;
    this.effects.spawn({
      kind: 'arc', x: player.x, y: player.y, angle: player.facing, arc,
      range: stats.range, life: 0.16, damage: stats.damage, damageType: WEAPONS.pulseBlade.damageType,
      color: slot.evolved ? '#ffd54a' : '#ff8a5e',
    });
    if (this.audio) this.audio.hit();
  }

  fireNovaBurst(slot, stats, player) {
    this.effects.spawn({
      kind: 'nova', x: player.x, y: player.y, life: 0.35, damage: 0, radius: 0,
      growTo: stats.radius, color: slot.evolved ? '#ffd54a' : '#5ee6ff',
    });
    // Instant damage application (visual ring continues to grow after).
    const knock = slot.evolved ? 260 : 140;
    this.enemyManager.queryNearby(player.x, player.y, stats.radius, (e) => {
      const a = angleTo(player.x, player.y, e.x, e.y);
      const dealt = this.enemyManager.damageEnemy(e, stats.damage, a, knock, WEAPONS.novaBurst.damageType);
      this.particles.damageText(e.x, e.y - 10, dealt);
    });
    if (this.audio) this.audio.explosion();
  }

  fireHomingMissile(slot, stats, player) {
    for (let i = 0; i < stats.count; i++) {
      const target = this.enemyManager.nearest(player.x, player.y, 1400);
      const a = target ? angleTo(player.x, player.y, target.x, target.y) : randRange(0, TAU);
      this.bullets.spawn({
        x: player.x, y: player.y, vx: Math.cos(a) * stats.speed, vy: Math.sin(a) * stats.speed,
        damage: stats.damage, damageType: WEAPONS.homingMissile.damageType, pierce: 0, radius: 7, life: 4,
        color: slot.evolved ? '#ffd54a' : '#c98cff', kind: 'missile', splash: stats.splash,
        targetRef: target, turnRate: stats.turnRate, speed: stats.speed,
      });
    }
    if (this.audio) this.audio.shoot();
  }

  fireChainLightning(slot, stats, player) {
    const hit = new Set();
    let originX = player.x, originY = player.y;
    let dmg = stats.damage;
    const points = [[player.x, player.y]];
    let current = this.enemyManager.nearest(player.x, player.y, 700);
    let bounces = stats.bounces;
    while (current && bounces > 0) {
      hit.add(current);
      const dealt = this.enemyManager.damageEnemy(current, dmg, angleTo(originX, originY, current.x, current.y), 60, WEAPONS.chainLightning.damageType);
      this.particles.damageText(current.x, current.y - 10, dealt);
      this.particles.spark(current.x, current.y, 0, '#5ee6ff', 5);
      points.push([current.x, current.y]);
      originX = current.x; originY = current.y;
      if (!slot.evolved) dmg *= 0.82;
      bounces--;
      let next = null, bestD = stats.bounceRadius * stats.bounceRadius;
      for (const e of this.enemyManager.pool.active) {
        if (hit.has(e)) continue;
        const d = dist2(e.x, e.y, current.x, current.y);
        if (d <= bestD) { bestD = d; next = e; }
      }
      current = next;
    }
    if (points.length > 1) {
      this.effects.spawn({ kind: 'chain', x: 0, y: 0, life: 0.18, color: slot.evolved ? '#ffd54a' : '#9ef', points });
      if (this.audio) this.audio.hit();
    }
  }

  updateOrbit(slot, stats, player, dt) {
    slot.orbitAngle += stats.rotSpeed * dt;
    const count = stats.count;
    for (let i = 0; i < count; i++) {
      const a = slot.orbitAngle + (i / count) * TAU;
      const ox = player.x + Math.cos(a) * stats.radius;
      const oy = player.y + Math.sin(a) * stats.radius;
      const key = i;
      let cd = slot.hitCooldowns.get(key) || 0;
      cd -= dt;
      this.enemyManager.queryNearby(ox, oy, 16, (e) => {
        if (cd <= 0) {
          this.enemyManager.damageEnemy(e, stats.damage, angleTo(ox, oy, e.x, e.y), 90, WEAPONS.orbitDrones.damageType);
          this.particles.spark(e.x, e.y, 0, slot.evolved ? '#ffd54a' : '#5ee6ff', 2);
          cd = stats.tickCooldown;
        }
      });
      slot.hitCooldowns.set(key, cd);
    }
    slot._renderCount = count;
    slot._renderRadius = stats.radius;
  }

  updateBullets(dt) {
    this.bullets.update((b) => {
      b.life -= dt;
      if (b.life <= 0) return false;

      if (b.kind === 'missile' && b.targetRef && b.targetRef.hp > 0 && b.targetRef.__alive !== false) {
        const desired = angleTo(b.x, b.y, b.targetRef.x, b.targetRef.y);
        const current = Math.atan2(b.vy, b.vx);
        let diff = desired - current;
        while (diff > Math.PI) diff -= TAU;
        while (diff < -Math.PI) diff += TAU;
        const maxTurn = b.turnRate * dt;
        const newAngle = current + clamp(diff, -maxTurn, maxTurn);
        b.vx = Math.cos(newAngle) * b.speed;
        b.vy = Math.sin(newAngle) * b.speed;
      }

      b.x += b.vx * dt;
      b.y += b.vy * dt;

      let hitOne = null;
      this.enemyManager.queryNearby(b.x, b.y, b.radius + 24, (e) => {
        if (hitOne) return;
        if (b.hitSet.has(e)) return;
        if (dist2(b.x, b.y, e.x, e.y) <= (b.radius + e.radius) * (b.radius + e.radius)) hitOne = e;
      });

      if (hitOne) {
        b.hitSet.add(hitOne);
        const a = angleTo(b.x, b.y, hitOne.x, hitOne.y);
        const dealt = this.enemyManager.damageEnemy(hitOne, b.damage, a, 120, b.damageType);
        this.particles.damageText(hitOne.x, hitOne.y - 10, dealt);
        this.particles.spark(b.x, b.y, Math.atan2(b.vy, b.vx), b.color, 4);

        if (b.kind === 'missile') {
          this.enemyManager.queryNearby(b.x, b.y, b.splash, (e2) => {
            if (e2 === hitOne) return;
            this.enemyManager.damageEnemy(e2, b.damage * 0.6, angleTo(b.x, b.y, e2.x, e2.y), 80, b.damageType);
          });
          this.particles.burst(b.x, b.y, { count: 14, color: '#ffb14a', speed: 180, life: 0.4, glow: true });
          if (this.audio) this.audio.explosion();
          return false;
        }

        if (b.evolvedSplit) {
          for (let i = -1; i <= 1; i += 2) {
            const sa = Math.atan2(b.vy, b.vx) + i * 0.5;
            this.bullets.spawn({
              x: b.x, y: b.y, vx: Math.cos(sa) * b.speed * 0.85, vy: Math.sin(sa) * b.speed * 0.85,
              damage: b.damage * 0.5, pierce: 0, radius: 4, life: 0.9, color: '#ffd54a', kind: 'bullet',
            });
          }
        }

        b.pierceLeft -= 1;
        if (b.pierceLeft < 0) return false;
      }

      return true;
    });
  }

  updateEffects(dt, player) {
    this.effects.update((e) => {
      e.life -= dt;
      if (e.kind === 'arc') {
        this.enemyManager.queryNearby(e.x, e.y, e.range, (en) => {
          if (e.hitSet.has(en)) return;
          const a = angleTo(e.x, e.y, en.x, en.y);
          let diff = a - e.angle;
          while (diff > Math.PI) diff -= TAU;
          while (diff < -Math.PI) diff += TAU;
          if (Math.abs(diff) <= e.arc / 2) {
            e.hitSet.add(en);
            const dealt = this.enemyManager.damageEnemy(en, e.damage, a, 150, e.damageType);
            this.particles.damageText(en.x, en.y - 10, dealt);
            this.particles.spark(en.x, en.y, a, '#ff8a5e', 3);
          }
        });
      }
      if (e.kind === 'nova') {
        e.radius = e.growTo * (1 - e.life / e.maxLife);
      }
      return e.life > 0;
    });
  }

  render(ctx, camX, camY, player) {
    // Orbit drones
    for (const slot of this.slots) {
      if (slot.id !== 'orbitDrones' || !slot._renderCount) continue;
      for (let i = 0; i < slot._renderCount; i++) {
        const a = slot.orbitAngle + (i / slot._renderCount) * TAU;
        const ox = player.x + Math.cos(a) * slot._renderRadius - camX;
        const oy = player.y + Math.sin(a) * slot._renderRadius - camY;
        ctx.save();
        ctx.shadowColor = slot.evolved ? '#ffd54a' : '#5ee6ff';
        ctx.shadowBlur = 14;
        ctx.fillStyle = slot.evolved ? '#ffd54a' : '#5ee6ff';
        ctx.beginPath();
        ctx.arc(ox, oy, 9, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    }

    // Bullets
    for (const b of this.bullets.active) {
      const sx = b.x - camX, sy = b.y - camY;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(Math.atan2(b.vy, b.vx));
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      if (b.kind === 'missile') {
        ctx.moveTo(10, 0); ctx.lineTo(-8, 5); ctx.lineTo(-4, 0); ctx.lineTo(-8, -5);
      } else {
        ctx.moveTo(8, 0); ctx.lineTo(-6, 4); ctx.lineTo(-6, -4);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.shadowBlur = 0;

    // Effects
    for (const e of this.effects.active) {
      const t = e.life / e.maxLife;
      const sx = e.x - camX, sy = e.y - camY;
      if (e.kind === 'arc') {
        ctx.save();
        ctx.globalAlpha = clamp(t, 0, 1) * 0.55;
        ctx.fillStyle = e.color;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.arc(sx, sy, e.range, e.angle - e.arc / 2, e.angle + e.arc / 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else if (e.kind === 'nova') {
        ctx.save();
        ctx.globalAlpha = clamp(t, 0, 1) * 0.7;
        ctx.strokeStyle = e.color;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 18;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(sx, sy, Math.max(1, e.radius), 0, TAU);
        ctx.stroke();
        ctx.restore();
      } else if (e.kind === 'chain' && e.points) {
        ctx.save();
        ctx.globalAlpha = clamp(t, 0, 1);
        ctx.strokeStyle = e.color;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 12;
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < e.points.length; i++) {
          const [px, py] = e.points[i];
          const rx = px - camX, ry = py - camY;
          if (i === 0) ctx.moveTo(rx, ry); else ctx.lineTo(rx, ry);
        }
        ctx.stroke();
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }
}

function applyEvolutionBuffs(id, stats) {
  switch (id) {
    case 'shardCannon': stats.pierce += 3; stats.damage *= 1.3; break;
    case 'pulseBlade': stats.damage *= 1.4; stats.range *= 1.25; break;
    case 'orbitDrones': stats.count += 2; stats.damage *= 1.3; stats.radius *= 1.1; break;
    case 'novaBurst': stats.radius *= 1.35; stats.cooldown *= 0.75; break;
    case 'homingMissile': stats.count += 2; stats.splash *= 1.4; break;
    case 'chainLightning': stats.bounces += 3; break;
  }
}
