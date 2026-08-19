import { Pool, randRange, angleTo, dist, dist2, clamp, weightedPick, TAU } from './utils.js';
import { ENEMY_TYPES, BOSS_TYPES, DIFFICULTY_CURVE as DC } from './enemyData.js';
import { applyBurn, applyPoison, applyShock, applyFrost, updateStatuses, clearStatuses, statusGlowColor } from './statusEffects.js';

function makeEnemy() {
  return {
    x: 0, y: 0, vx: 0, vy: 0, hp: 1, maxHp: 1, speed: 0, damage: 0, radius: 10,
    xp: 1, color: '#fff', glow: '#000', type: null, behavior: 'chase', isBoss: false,
    isElite: false, hitCooldown: 0, hurtFlash: 0, t: 0, phaseTimer: 0, phase: 0, __alive: true,
    knockX: 0, knockY: 0, _statusSpeedMult: 1,
    burnTime: 0, burnDps: 0, poisonTime: 0, poisonStacks: 0, poisonDpsPerStack: 0,
    stunTime: 0, frostTime: 0, frostStacks: 0, frostSlowPerStack: 0,
    affix: null, shieldHp: 0, shieldMaxHp: 0,
  };
}

export const ELITE_AFFIXES = ['explosive', 'shielded', 'frozenAura', 'regenerating'];
export const FROST_AURA_RADIUS = 220;
const REGEN_AFFIX_RATE = 0.015; // fraction of maxHp/sec — encourages bursting it down rather than chipping

function makeEnemyShot() {
  return { x: 0, y: 0, vx: 0, vy: 0, damage: 0, radius: 6, life: 4, color: '#c98cff', __alive: true };
}

export class EnemyManager {
  constructor(particles, audio) {
    this.particles = particles;
    this.audio = audio;
    this.pool = new Pool(makeEnemy, (e, type, x, y, hpMult, dmgMult, spMult) => {
      e.type = type;
      e.behavior = type.behavior;
      e.isBoss = !!type.isBoss;
      e.isElite = false;
      e.x = x; e.y = y; e.vx = 0; e.vy = 0;
      e.maxHp = Math.round(type.hp * hpMult);
      e.hp = e.maxHp;
      e.speed = type.speed * spMult;
      e.damage = type.damage * dmgMult;
      e.radius = type.radius;
      e.xp = type.xp;
      e.color = type.color;
      e.glow = type.glow;
      e.hitCooldown = 0;
      e.hurtFlash = 0;
      e.t = 0;
      e.phaseTimer = 0;
      e.phase = 0;
      e.knockX = 0; e.knockY = 0;
      e._statusSpeedMult = 1;
      e.affix = null; e.shieldHp = 0; e.shieldMaxHp = 0;
      clearStatuses(e);
    });
    this.shots = new Pool(makeEnemyShot, (s, x, y, vx, vy, damage, color) => {
      Object.assign(s, { x, y, vx, vy, damage, life: 4, color });
    });

    this.spawnTimer = 0;
    this.activeBoss = null;
    this.activeElite = null;
    this.onDeath = null; // (enemy) => void
    this.onPlayerHit = null; // (amount, x, y) => void
    this.diff = { hp: 1, dmg: 1, spawn: 1 }; // difficulty-setting multipliers, set by Game per run
    this.colorblind = false; // set by Game from settings.colorblindMode
  }

  reset() {
    this.pool.clear();
    this.shots.clear();
    this.spawnTimer = 0;
    this.activeBoss = null;
    this.activeElite = null;
  }

  // t maxes out around 2-2.5 for a node's short duration; the act multiplier
  // (much larger swings) is what actually drives the run's difficulty curve.
  difficultyScale(nodeElapsed, actNumber) {
    const t = nodeElapsed / 60;
    const actHp = 1 + (actNumber - 1) * DC.actHpPerAct;
    const actDmg = 1 + (actNumber - 1) * DC.actDmgPerAct;
    const actSpeed = 1 + (actNumber - 1) * DC.actSpeedPerAct;
    const actSpawn = 1 + (actNumber - 1) * DC.actSpawnPerAct;
    return {
      hp: (1 + t * DC.timeHpRate) * actHp * this.diff.hp,
      dmg: (1 + t * DC.timeDmgRate) * actDmg * this.diff.dmg,
      speed: (1 + Math.min(DC.timeSpeedCap, t * DC.timeSpeedRate)) * actSpeed,
      spawnRate: (1 + t * DC.timeSpawnRate) * actSpawn * this.diff.spawn,
    };
  }

  availableTypes(biome) {
    return biome.enemyPool.map(id => ENEMY_TYPES[id]).filter(Boolean);
  }

  spawnPointAround(px, py, worldHalf) {
    const angle = randRange(0, TAU);
    const radius = randRange(620, 780);
    let x = px + Math.cos(angle) * radius;
    let y = py + Math.sin(angle) * radius;
    x = clamp(x, -worldHalf, worldHalf);
    y = clamp(y, -worldHalf, worldHalf);
    return { x, y };
  }

  spawnBoss(bossId, player, worldHalf, hpMult = 1, dmgMult = 1) {
    const type = { ...BOSS_TYPES[bossId], isBoss: true };
    const { x, y } = this.spawnPointAround(player.x, player.y, worldHalf);
    const e = this.pool.spawn(type, x, y, hpMult, dmgMult, 1);
    e.bossId = bossId;
    this.activeBoss = e;
    if (this.audio) this.audio.bossRoar();
    return e;
  }

  spawnElite(biome, player, worldHalf, actNumber) {
    const types = this.availableTypes(biome);
    const type = types.reduce((a, b) => (b.hp > a.hp ? b : a), types[0]);
    const { x, y } = this.spawnPointAround(player.x, player.y, worldHalf);
    const actHp = 1 + (actNumber - 1) * DC.actHpPerAct;
    const actDmg = 1 + (actNumber - 1) * DC.actDmgPerAct;
    const e = this.pool.spawn(type, x, y, 7 * actHp, 1.6 * actDmg, 1.05);
    e.isElite = true;
    e.radius *= 1.4;
    e.affix = ELITE_AFFIXES[Math.floor(randRange(0, ELITE_AFFIXES.length))];
    if (e.affix === 'shielded') {
      e.shieldMaxHp = e.maxHp * 0.5;
      e.shieldHp = e.shieldMaxHp;
    }
    this.activeElite = e;
    if (this.audio) this.audio.bossRoar();
    return e;
  }

  update(dt, nodeElapsed, player, worldHalf, biome, actNumber, spawningEnabled = true) {
    const scale = this.difficultyScale(nodeElapsed, actNumber);

    if (spawningEnabled) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0 && this.pool.active.length < 320) {
        this.spawnTimer = clamp(0.85 / scale.spawnRate, 0.045, 0.85);
        const types = this.availableTypes(biome);
        const weighted = types.map(t => ({ weight: t.weight, value: t }));
        const type = weightedPick(weighted);
        const groupSize = type.spawnsInGroups ? Math.floor(randRange(3, 6)) : 1;
        const origin = this.spawnPointAround(player.x, player.y, worldHalf);
        for (let i = 0; i < groupSize; i++) {
          const jx = origin.x + randRange(-40, 40);
          const jy = origin.y + randRange(-40, 40);
          this.pool.spawn(type, jx, jy, scale.hp, scale.dmg, scale.speed);
        }
      }
    }

    this.pool.update((e) => {
      e.t += dt;
      if (e.hurtFlash > 0) e.hurtFlash -= dt;
      if (e.hitCooldown > 0) e.hitCooldown -= dt;

      const status = updateStatuses(e, dt);
      e._statusSpeedMult = status.speedMult;
      if (!status.stunned) {
        this.runBehavior(e, dt, player, worldHalf);
      }

      if (e.affix === 'regenerating' && e.hp > 0 && e.hp < e.maxHp) {
        e.hp = Math.min(e.maxHp, e.hp + e.maxHp * REGEN_AFFIX_RATE * dt);
      }

      if (e.knockX || e.knockY) {
        e.x += e.knockX * dt;
        e.y += e.knockY * dt;
        e.knockX *= 0.86; e.knockY *= 0.86;
        if (Math.abs(e.knockX) < 1) e.knockX = 0;
        if (Math.abs(e.knockY) < 1) e.knockY = 0;
      }

      e.x = clamp(e.x, -worldHalf, worldHalf);
      e.y = clamp(e.y, -worldHalf, worldHalf);

      const r = e.radius + player.radius;
      if (e.hitCooldown <= 0 && dist2(e.x, e.y, player.x, player.y) <= r * r) {
        e.hitCooldown = 0.55;
        if (this.onPlayerHit) this.onPlayerHit(e.damage, player.x, player.y);
        if (player.thorns > 0) {
          this.damageEnemy(e, player.thorns, angleTo(player.x, player.y, e.x, e.y), 90, 'physical');
        }
      }

      if (e.hp <= 0) {
        if (e.isBoss) this.activeBoss = null;
        if (e.isElite) this.activeElite = null;
        if (this.onDeath) this.onDeath(e);
        return false;
      }
      return true;
    });

    this.shots.update((s) => {
      s.life -= dt;
      if (s.life <= 0) return false;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      const r = s.radius + player.radius;
      if (dist2(s.x, s.y, player.x, player.y) <= r * r) {
        if (this.onPlayerHit) this.onPlayerHit(s.damage, player.x, player.y);
        return false;
      }
      return true;
    });
  }

  runBehavior(e, dt, player, worldHalf) {
    switch (e.behavior) {
      case 'chase': return this.behaviorChase(e, dt, player);
      case 'ranged': return this.behaviorRanged(e, dt, player);
      case 'boss_warden': return this.behaviorWarden(e, dt, player);
      case 'boss_swarmmother': return this.behaviorSwarmMother(e, dt, player);
      case 'boss_eclipse': return this.behaviorEclipse(e, dt, player, worldHalf);
      default: return this.behaviorChase(e, dt, player);
    }
  }

  moveToward(e, dt, tx, ty, speedMult = 1) {
    const a = angleTo(e.x, e.y, tx, ty);
    const mult = speedMult * (e._statusSpeedMult ?? 1);
    e.x += Math.cos(a) * e.speed * mult * dt;
    e.y += Math.sin(a) * e.speed * mult * dt;
    return a;
  }

  behaviorChase(e, dt, player) {
    this.moveToward(e, dt, player.x, player.y);
  }

  behaviorRanged(e, dt, player) {
    const d = dist(e.x, e.y, player.x, player.y);
    const range = e.type.range || 300;
    if (d > range) {
      this.moveToward(e, dt, player.x, player.y, 1);
    } else if (d < range * 0.6) {
      this.moveToward(e, dt, player.x, player.y, -0.6);
    }
    e.fireTimer = (e.fireTimer ?? randRange(0, 1)) - dt;
    if (e.fireTimer <= 0) {
      e.fireTimer = e.type.fireRate || 1.6;
      const a = angleTo(e.x, e.y, player.x, player.y);
      const sp = e.type.projSpeed || 190;
      this.shots.spawn(e.x, e.y, Math.cos(a) * sp, Math.sin(a) * sp, e.damage, '#c98cff');
    }
  }

  behaviorWarden(e, dt, player) {
    const d = dist(e.x, e.y, player.x, player.y);
    e.slamTimer = (e.slamTimer ?? 0) - dt;
    e.summonTimer = (e.summonTimer ?? e.type.summonCooldown) - dt;
    if (d > (e.type.slamRange || 90)) {
      this.moveToward(e, dt, player.x, player.y, 1);
    }
    if (e.slamTimer <= 0 && d <= (e.type.slamRange || 90) * 1.4) {
      e.slamTimer = e.type.slamCooldown || 2.4;
      e.slamming = 0.35;
      if (this.onPlayerHit && d <= (e.type.slamRange || 90) * 1.4) {
        this.onPlayerHit(e.type.slamDamage || e.damage, player.x, player.y);
      }
    }
    if (e.slamming > 0) e.slamming -= dt;
    if (e.summonTimer <= 0) {
      e.summonTimer = e.type.summonCooldown || 6;
      for (let i = 0; i < 3; i++) {
        const a = randRange(0, TAU);
        const sx = e.x + Math.cos(a) * 60, sy = e.y + Math.sin(a) * 60;
        this.pool.spawn(ENEMY_TYPES.swarmling, sx, sy, 1 + (e.t / 90), 1, 1);
      }
    }
  }

  behaviorSwarmMother(e, dt, player) {
    const d = dist(e.x, e.y, player.x, player.y);
    this.moveToward(e, dt, player.x, player.y, 0.55);
    e.pulseTimer = (e.pulseTimer ?? e.type.pulseCooldown) - dt;
    e.summonTimer = (e.summonTimer ?? 2) - dt;
    if (e.pulseTimer <= 0) {
      e.pulseTimer = e.type.pulseCooldown || 3.2;
      e.pulsing = 0.3;
      if (d <= (e.type.pulseRadius || 130) && this.onPlayerHit) {
        this.onPlayerHit(e.type.pulseDamage || 20, player.x, player.y);
      }
    }
    if (e.pulsing > 0) e.pulsing -= dt;
    if (e.summonTimer <= 0) {
      e.summonTimer = e.type.summonCooldown || 5;
      for (let i = 0; i < 4; i++) {
        const a = randRange(0, TAU);
        const sx = e.x + Math.cos(a) * 70, sy = e.y + Math.sin(a) * 70;
        this.pool.spawn(ENEMY_TYPES.swarmling, sx, sy, 1 + (e.t / 60), 1, 1);
      }
    }
  }

  behaviorEclipse(e, dt, player, worldHalf) {
    e.burstTimer = (e.burstTimer ?? e.type.burstCooldown) - dt;
    e.dashTimer = (e.dashTimer ?? e.type.dashCooldown) - dt;
    if (e.dashTimer <= 0) {
      e.dashTimer = e.type.dashCooldown || 5;
      e.dashing = 0.4;
      e.dashAngle = angleTo(e.x, e.y, player.x, player.y);
    }
    if (e.dashing > 0) {
      e.dashing -= dt;
      e.x += Math.cos(e.dashAngle) * e.speed * 3.4 * dt;
      e.y += Math.sin(e.dashAngle) * e.speed * 3.4 * dt;
    } else {
      this.moveToward(e, dt, player.x, player.y, 0.7);
    }
    if (e.burstTimer <= 0) {
      e.burstTimer = e.type.burstCooldown || 3.2;
      const count = e.type.burstCount || 16;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * TAU;
        this.shots.spawn(e.x, e.y, Math.cos(a) * 150, Math.sin(a) * 150, e.damage * 0.6, '#ffb14a');
      }
    }
  }

  // Called by weapon system when a projectile hits an enemy. Returns the
  // actual damage applied (after resistance) so callers can show accurate
  // damage-number popups.
  damageEnemy(e, amount, knockAngle, knockForce = 0, damageType = 'physical') {
    const resist = (e.type && e.type.resistances && e.type.resistances[damageType]) || 1;
    const finalAmount = amount * resist;
    let remaining = finalAmount;
    if (e.shieldHp > 0) {
      const absorbed = Math.min(e.shieldHp, remaining);
      e.shieldHp -= absorbed;
      remaining -= absorbed;
    }
    e.hp -= remaining;
    e.hurtFlash = 0.12;
    if (knockForce && !e.isBoss) {
      e.knockX += Math.cos(knockAngle) * knockForce;
      e.knockY += Math.sin(knockAngle) * knockForce;
    }
    switch (damageType) {
      case 'fire': applyBurn(e, finalAmount * 0.25, 3); break;
      case 'poison': applyPoison(e, finalAmount * 0.18, 4); break;
      case 'shock': applyShock(e, 0.35); break;
      case 'frost': applyFrost(e, 0.2, 2.2); break;
    }
    return finalAmount;
  }

  queryNearby(x, y, radius, fn) {
    const r2 = radius * radius;
    for (const e of this.pool.active) {
      if (dist2(e.x, e.y, x, y) <= r2) fn(e);
    }
  }

  nearest(x, y, maxRadius = Infinity) {
    let best = null, bestD = maxRadius * maxRadius;
    for (const e of this.pool.active) {
      const d = dist2(e.x, e.y, x, y);
      if (d <= bestD) { bestD = d; best = e; }
    }
    return best;
  }

  render(ctx, camX, camY) {
    for (const e of this.pool.active) {
      const sx = e.x - camX, sy = e.y - camY;
      const statusGlow = statusGlowColor(e, this.colorblind);
      ctx.save();
      ctx.translate(sx, sy);
      ctx.shadowColor = statusGlow || e.glow;
      ctx.shadowBlur = e.isBoss ? 22 : (e.isElite ? 18 : (statusGlow ? 14 : 10));
      ctx.fillStyle = e.hurtFlash > 0 ? '#ffffff' : e.color;
      ctx.beginPath();
      const spikes = e.isBoss ? 10 : (e.isElite ? 7 : 5);
      drawSpikyBlob(ctx, e.radius, spikes, e.t);
      ctx.fill();
      if (statusGlow) {
        ctx.strokeStyle = statusGlow;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(0, 0, e.radius + 3, 0, TAU);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      if (e.isElite) {
        ctx.strokeStyle = '#ffd54a';
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, e.radius + 6, 0, TAU);
        ctx.stroke();
      }
      ctx.restore();

      if (e.isElite && e.affix === 'frozenAura') {
        ctx.save();
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = '#5ee6ff';
        ctx.beginPath();
        ctx.arc(sx, sy, FROST_AURA_RADIUS, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = '#5ee6ff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }

      if (e.isBoss || e.isElite || e.maxHp > 30) {
        const w = e.isBoss ? 70 : (e.isElite ? 50 : 26);
        const pct = clamp(e.hp / e.maxHp, 0, 1);
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(sx - w / 2, sy - e.radius - 12, w, 5);
        ctx.fillStyle = e.isBoss ? '#ff5e8a' : (e.isElite ? '#ffd54a' : '#ff6b6b');
        ctx.fillRect(sx - w / 2, sy - e.radius - 12, w * pct, 5);
        if (e.shieldMaxHp > 0) {
          const spct = clamp(e.shieldHp / e.shieldMaxHp, 0, 1);
          ctx.fillStyle = 'rgba(94, 230, 255, 0.85)';
          ctx.fillRect(sx - w / 2, sy - e.radius - 18, w * spct, 3);
        }
      }
      if (e.isElite && e.affix) {
        ctx.fillStyle = '#ffd54a';
        ctx.font = '600 10px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(affixLabel(e.affix), sx, sy - e.radius - 22);
      }
    }

    ctx.shadowBlur = 0;
    for (const s of this.shots.active) {
      const sx = s.x - camX, sy = s.y - camY;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(sx, sy, s.radius, 0, TAU);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }
}

const AFFIX_LABELS = { explosive: 'EXPLOSIVE', shielded: 'SHIELDED', frozenAura: 'FROST AURA', regenerating: 'REGENERATING' };
function affixLabel(affix) { return AFFIX_LABELS[affix] || affix; }

function drawSpikyBlob(ctx, radius, spikes, t) {
  ctx.beginPath();
  for (let i = 0; i <= spikes * 2; i++) {
    const a = (i / (spikes * 2)) * TAU;
    const wobble = 0.85 + 0.15 * Math.sin(a * 3 + t * 4);
    const r = radius * wobble;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}
