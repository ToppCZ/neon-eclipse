import { Pool, randRange, angleTo, dist, dist2, clamp, weightedPick, TAU } from './utils.js';
import { ENEMY_TYPES, BOSS_TYPES, BOSS_SCHEDULE } from './enemyData.js';

function makeEnemy() {
  return {
    x: 0, y: 0, vx: 0, vy: 0, hp: 1, maxHp: 1, speed: 0, damage: 0, radius: 10,
    xp: 1, color: '#fff', glow: '#000', type: null, behavior: 'chase', isBoss: false,
    hitCooldown: 0, hurtFlash: 0, t: 0, phaseTimer: 0, phase: 0, __alive: true,
    knockX: 0, knockY: 0,
  };
}

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
    });
    this.shots = new Pool(makeEnemyShot, (s, x, y, vx, vy, damage, color) => {
      Object.assign(s, { x, y, vx, vy, damage, life: 4, color });
    });

    this.spawnTimer = 0;
    this.bossSpawned = new Set();
    this.activeBoss = null;
    this.onDeath = null; // (enemy) => void
    this.onPlayerHit = null; // (amount, x, y) => void
    this.onBossSpawned = null; // (name) => void
  }

  reset() {
    this.pool.clear();
    this.shots.clear();
    this.spawnTimer = 0;
    this.bossSpawned.clear();
    this.activeBoss = null;
  }

  difficultyScale(elapsed) {
    const t = elapsed / 60;
    return {
      hp: 1 + t * 0.22 + Math.pow(t, 1.5) * 0.01,
      dmg: 1 + t * 0.08,
      speed: 1 + Math.min(0.35, t * 0.03),
      spawnRate: 1 + t * 0.26,
    };
  }

  availableTypes(elapsed) {
    return Object.values(ENEMY_TYPES).filter(t => elapsed >= t.unlockAt);
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

  trySpawnBoss(elapsed) {
    for (const sched of BOSS_SCHEDULE) {
      if (elapsed >= sched.time && !this.bossSpawned.has(sched.id)) {
        this.bossSpawned.add(sched.id);
        return sched.id;
      }
    }
    return null;
  }

  spawnBoss(id, player, worldHalf) {
    const type = { ...BOSS_TYPES[id], isBoss: true };
    const { x, y } = this.spawnPointAround(player.x, player.y, worldHalf);
    const e = this.pool.spawn(type, x, y, 1, 1, 1);
    e.bossId = id;
    this.activeBoss = e;
    if (this.onBossSpawned) this.onBossSpawned(type.name);
    if (this.audio) this.audio.bossRoar();
    return e;
  }

  update(dt, elapsed, player, worldHalf, difficultyOverride) {
    const scale = difficultyOverride || this.difficultyScale(elapsed);

    // Boss check
    const bossId = this.trySpawnBoss(elapsed);
    if (bossId) this.spawnBoss(bossId, player, worldHalf);

    // Regular spawn director
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.pool.active.length < 320) {
      this.spawnTimer = clamp(0.85 / scale.spawnRate, 0.045, 0.85);
      const types = this.availableTypes(elapsed);
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

    // Update enemies
    this.pool.update((e) => {
      e.t += dt;
      if (e.hurtFlash > 0) e.hurtFlash -= dt;
      if (e.hitCooldown > 0) e.hitCooldown -= dt;

      this.runBehavior(e, dt, player, worldHalf);

      // apply knockback decay
      if (e.knockX || e.knockY) {
        e.x += e.knockX * dt;
        e.y += e.knockY * dt;
        e.knockX *= 0.86; e.knockY *= 0.86;
        if (Math.abs(e.knockX) < 1) e.knockX = 0;
        if (Math.abs(e.knockY) < 1) e.knockY = 0;
      }

      e.x = clamp(e.x, -worldHalf, worldHalf);
      e.y = clamp(e.y, -worldHalf, worldHalf);

      // contact damage with player
      const r = e.radius + player.radius;
      if (e.hitCooldown <= 0 && dist2(e.x, e.y, player.x, player.y) <= r * r) {
        e.hitCooldown = 0.55;
        if (this.onPlayerHit) this.onPlayerHit(e.damage, player.x, player.y);
      }

      if (e.hp <= 0) {
        if (e.isBoss) this.activeBoss = null;
        if (this.onDeath) this.onDeath(e);
        return false;
      }
      return true;
    });

    // Update enemy projectiles
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
      case 'boss_eclipse': return this.behaviorEclipse(e, dt, player, worldHalf);
      default: return this.behaviorChase(e, dt, player);
    }
  }

  moveToward(e, dt, tx, ty, speedMult = 1) {
    const a = angleTo(e.x, e.y, tx, ty);
    e.x += Math.cos(a) * e.speed * speedMult * dt;
    e.y += Math.sin(a) * e.speed * speedMult * dt;
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

  // Called by weapon system when a projectile hits an enemy.
  damageEnemy(e, amount, knockAngle, knockForce = 0) {
    e.hp -= amount;
    e.hurtFlash = 0.12;
    if (knockForce && !e.isBoss) {
      e.knockX += Math.cos(knockAngle) * knockForce;
      e.knockY += Math.sin(knockAngle) * knockForce;
    }
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
      ctx.save();
      ctx.translate(sx, sy);
      ctx.shadowColor = e.glow;
      ctx.shadowBlur = e.isBoss ? 22 : 10;
      ctx.fillStyle = e.hurtFlash > 0 ? '#ffffff' : e.color;
      ctx.beginPath();
      const spikes = e.isBoss ? 10 : 5;
      drawSpikyBlob(ctx, e.radius, spikes, e.t);
      ctx.fill();
      ctx.restore();

      // HP bar for bosses / tough enemies
      if (e.isBoss || e.maxHp > 30) {
        const w = e.isBoss ? 70 : 26;
        const pct = clamp(e.hp / e.maxHp, 0, 1);
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(sx - w / 2, sy - e.radius - 12, w, 5);
        ctx.fillStyle = e.isBoss ? '#ff5e8a' : '#ff6b6b';
        ctx.fillRect(sx - w / 2, sy - e.radius - 12, w * pct, 5);
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
