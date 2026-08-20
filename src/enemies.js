import { Pool, randRange, angleTo, dist, dist2, clamp, weightedPick, rng, shadeFill, texturePattern, TAU } from './utils.js';
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
    affix: null, shieldHp: 0, shieldMaxHp: 0, _chargePulse: 0,
    facing: 0, poise: 1, poiseMax: 1, staggerTime: 0,
  };
}

export const ELITE_AFFIXES = ['explosive', 'shielded', 'frozenAura', 'regenerating'];
export const FROST_AURA_RADIUS = 220;
const REGEN_AFFIX_RATE = 0.015; // fraction of maxHp/sec — encourages bursting it down rather than chipping

function makeEnemyShot() {
  return { x: 0, y: 0, vx: 0, vy: 0, damage: 0, radius: 6, life: 4, color: '#c98cff', __alive: true, reflected: false };
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
      e.facing = 0;
      // Poise: how much burst damage an enemy can absorb before staggering.
      // Bigger enemies (bosses/elites already scale hp) take proportionally
      // more to stagger, so a single weak hit can't lock them down forever.
      e.poiseMax = Math.max(14, e.maxHp * 0.22);
      e.poise = e.poiseMax;
      e.staggerTime = 0;
      clearStatuses(e);
    });
    this.shots = new Pool(makeEnemyShot, (s, x, y, vx, vy, damage, color) => {
      Object.assign(s, { x, y, vx, vy, damage, life: 4, color, reflected: false });
    });

    // A short guaranteed-quiet beat at the start of every node so the player
    // can feel movement/dash before anything shoots at them (wordless onboarding).
    this.spawnTimer = 1.5;
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
    // A short guaranteed-quiet beat at the start of every node so the player
    // can feel movement/dash before anything shoots at them (wordless onboarding).
    this.spawnTimer = 1.5;
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
    // Opening burst: once the initial quiet beat ends, spawn rate ramps up
    // hard for the first ~15s so the screen fills sooner ("time-to-chaos"),
    // then settles back onto the normal time-based curve.
    const openingBurst = nodeElapsed < 15 ? 1 + (1 - nodeElapsed / 15) * 0.9 : 1;
    return {
      hp: (1 + t * DC.timeHpRate) * actHp * this.diff.hp,
      dmg: (1 + t * DC.timeDmgRate) * actDmg * this.diff.dmg,
      speed: (1 + Math.min(DC.timeSpeedCap, t * DC.timeSpeedRate)) * actSpeed,
      spawnRate: (1 + t * DC.timeSpawnRate) * actSpawn * this.diff.spawn * openingBurst,
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

  spawnElite(biome, player, worldHalf, actNumber, weaponSystem = null) {
    const types = this.availableTypes(biome);
    const type = types.reduce((a, b) => (b.hp > a.hp ? b : a), types[0]);
    const { x, y } = this.spawnPointAround(player.x, player.y, worldHalf);
    const actHp = 1 + (actNumber - 1) * DC.actHpPerAct;
    const actDmg = 1 + (actNumber - 1) * DC.actDmgPerAct;
    const e = this.pool.spawn(type, x, y, 7 * actHp, 1.6 * actDmg, 1.05);
    e.isElite = true;
    e.radius *= 1.4;
    e.affix = this.pickAdaptiveAffix(weaponSystem);
    if (e.affix === 'shielded') {
      e.shieldMaxHp = e.maxHp * 0.5;
      e.shieldHp = e.shieldMaxHp;
    }
    this.activeElite = e;
    if (this.audio) this.audio.bossRoar();
    return e;
  }

  // Weights the affix roll against the player's current build instead of
  // picking uniformly at random, so elites feel like they're actually
  // countering you rather than just being a random damage-sponge reskin.
  pickAdaptiveAffix(weaponSystem) {
    const weights = ELITE_AFFIXES.map((a) => ({ weight: 1, value: a }));
    if (weaponSystem) {
      const avgLevel = weaponSystem.slots.length
        ? weaponSystem.slots.reduce((s, sl) => s + sl.level, 0) / weaponSystem.slots.length
        : 1;
      const closeRange = weaponSystem.hasWeapon('orbitDrones') || weaponSystem.hasWeapon('pulseBlade');
      for (const w of weights) {
        if (w.value === 'frozenAura' && closeRange) w.weight *= 2.5; // punishes staying in melee range
        if (w.value === 'shielded' && avgLevel >= 5) w.weight *= 2; // denies burst-focused builds a one-shot
        if (w.value === 'regenerating' && avgLevel >= 5) w.weight *= 1.5; // denies low-uptime poke builds
      }
    }
    return weightedPick(weights);
  }

  update(dt, nodeElapsed, player, worldHalf, biome, actNumber, spawningEnabled = true) {
    const scale = this.difficultyScale(nodeElapsed, actNumber);
    this._player = player; // for damageEnemy's crit-chance lookup

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

      // Staggered enemies (poise broken by a burst hit) are locked out of
      // their behavior for a beat — a distinct "punish window" from a stun,
      // which only enemies with the shock status get.
      if (e.staggerTime > 0) {
        e.staggerTime -= dt;
      } else if (!status.stunned) {
        this.runBehavior(e, dt, player, worldHalf);
      }
      e.facing = angleTo(e.x, e.y, player.x, player.y);

      // Poise regenerates back to full when the enemy hasn't been staggered
      // recently, so it has to be burst down again rather than chipped away.
      if (e.staggerTime <= 0 && e.poise < e.poiseMax) {
        e.poise = Math.min(e.poiseMax, e.poise + e.poiseMax * 0.2 * dt);
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

      if (s.reflected) {
        // A dash-deflected shot hunts the nearest enemy instead of just
        // flying back the way it came, so deflecting is a reliable counter.
        let hit = null, bestD = Infinity;
        for (const e of this.pool.active) {
          const d = dist2(s.x, s.y, e.x, e.y);
          if (d <= (s.radius + e.radius) * (s.radius + e.radius) && d < bestD) { bestD = d; hit = e; }
        }
        if (hit) {
          const a = angleTo(s.x, s.y, hit.x, hit.y);
          const dealt = this.damageEnemy(hit, s.damage * 1.5, a, 100, 'physical');
          this.particles.damageText(hit.x, hit.y - 10, dealt);
          this.particles.spark(s.x, s.y, a, '#ffd54a', 4);
          return false;
        }
        return true;
      }

      const r = s.radius + player.radius;
      if (dist2(s.x, s.y, player.x, player.y) <= r * r) {
        if (this.onPlayerHit) this.onPlayerHit(s.damage, player.x, player.y);
        return false;
      }
      return true;
    });
  }

  // A dash sweeps through a small radius and turns back any enemy shots
  // caught in it — a skill-based counter to ranged telegraphs, not just
  // pure damage-avoidance.
  deflectShotsNear(x, y, radius) {
    const r2 = radius * radius;
    for (const s of this.shots.active) {
      if (s.reflected || dist2(s.x, s.y, x, y) > r2) continue;
      s.reflected = true;
      s.vx *= -1.3; s.vy *= -1.3;
      s.color = '#ffd54a';
      if (this.audio) this.audio.hit();
    }
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
    // Telegraph: a visible charge-up pulse in the last 0.35s before firing (see render()).
    e._chargePulse = e.fireTimer < 0.35 ? 1 - clamp(e.fireTimer / 0.35, 0, 1) : 0;
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
  // actual damage applied (after resistance, before mitigation-adjacent
  // bonuses like crit/backstab/combos are folded back in) so callers can
  // show accurate damage-number popups.
  damageEnemy(e, amount, knockAngle, knockForce = 0, damageType = 'physical') {
    const resist = (e.type && e.type.resistances && e.type.resistances[damageType]) || 1;
    let finalAmount = amount * resist;

    // Crit chance scales with the player's luck stat, giving it combat
    // relevance beyond drop/pickup rolls.
    const luck = this._player ? this._player.luck : 1;
    const isCrit = rng() < clamp(0.06 * luck, 0.05, 0.4);
    if (isCrit) finalAmount *= 1.75;

    // Backstab: knockAngle points from the damage source toward the enemy
    // (it's also the knockback direction). If that's roughly the same
    // direction the enemy is already facing (toward the player), the hit
    // landed from behind it relative to its own heading.
    let isBackstab = false;
    if (knockForce > 0) {
      let diff = knockAngle - e.facing;
      while (diff > Math.PI) diff -= TAU;
      while (diff < -Math.PI) diff += TAU;
      if (Math.abs(diff) < 0.7) { isBackstab = true; finalAmount *= 1.4; }
    }

    let remaining = finalAmount;
    if (e.shieldHp > 0) {
      const absorbed = Math.min(e.shieldHp, remaining);
      e.shieldHp -= absorbed;
      remaining -= absorbed;
    }

    // Status combo reactions: landing an element on a target already
    // carrying its opposite (frost+shock, fire+poison) triggers a bonus
    // burst and consumes both statuses, rewarding mixed-element builds
    // over stacking one type.
    let comboResult = null;
    switch (damageType) {
      case 'fire': comboResult = applyBurn(e, finalAmount * 0.25, 3); break;
      case 'poison': comboResult = applyPoison(e, finalAmount * 0.18, 4); break;
      case 'shock': comboResult = applyShock(e, 0.35); break;
      case 'frost': comboResult = applyFrost(e, 0.2, 2.2); break;
    }
    let comboBonus = 0;
    if (comboResult) {
      comboBonus = finalAmount * 0.8;
      remaining += comboBonus;
      if (comboResult === 'shatter') {
        e.frostStacks = 0; e.frostTime = 0;
        e.stunTime = Math.max(e.stunTime, 0.6);
      } else if (comboResult === 'combust') {
        e.poisonStacks = 0; e.poisonTime = 0; e.burnTime = 0; e.burnDps = 0;
      }
      this.particles.burst(e.x, e.y, { count: 14, color: comboResult === 'shatter' ? '#5ee6ff' : '#ff8a5e', speed: 220, life: 0.4, glow: true });
      this.particles.labelText(e.x, e.y - 24, comboResult === 'shatter' ? 'SHATTER!' : 'COMBUST!', comboResult === 'shatter' ? '#5ee6ff' : '#ff8a5e');
      if (this.audio) this.audio.explosion();
    }

    e.hp -= remaining;
    e.hurtFlash = 0.12;
    if (knockForce && !e.isBoss) {
      e.knockX += Math.cos(knockAngle) * knockForce;
      e.knockY += Math.sin(knockAngle) * knockForce;
    }

    // Poise: burst damage staggers an enemy briefly (locking out its
    // behavior) once it's absorbed enough hits without a break; regenerates
    // on its own otherwise, so it has to be burst down again each time.
    // Bosses are exempt so stagger can't trivialize a boss fight.
    if (!e.isBoss && e.staggerTime <= 0) {
      e.poise -= remaining;
      if (e.poise <= 0) {
        e.poise = e.poiseMax;
        e.staggerTime = 1.0;
        this.particles.spark(e.x, e.y, 0, '#ffffff', 6);
        if (this.audio) this.audio.hit();
      }
    }

    // Execute: a near-dead enemy dies outright instead of lingering at a
    // sliver of hp, rewarding finishing what you started over chasing the
    // next target. Bosses are exempt.
    if (e.hp > 0 && !e.isBoss && e.hp / e.maxHp < 0.08) {
      e.hp = 0;
      this.particles.burst(e.x, e.y, { count: 10, color: '#ffffff', speed: 180, life: 0.3, glow: true });
    }

    if (isCrit) this.particles.spark(e.x, e.y, knockAngle, '#ffd54a', 3);
    if (isBackstab) this.particles.spark(e.x, e.y, knockAngle, '#ff5e8a', 3);

    return finalAmount + comboBonus;
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

      // Spawn-in: bosses/elites ease up to full size instead of popping in at
      // full scale, using e.t (already tracked as time-since-spawn) directly.
      if (e.isBoss || e.isElite) {
        const introT = e.isBoss ? e.t / 0.4 : e.t / 0.3;
        if (introT < 1) ctx.scale(easeOutCubic(introT), easeOutCubic(introT));
      }

      ctx.shadowColor = statusGlow || e.glow;
      ctx.shadowBlur = e.isBoss ? 22 : (e.isElite ? 18 : (statusGlow ? 14 : 10));
      ctx.fillStyle = e.hurtFlash > 0 ? '#ffffff' : shadeFill(ctx, e.radius, e.color);
      // Rim-light + texture grain are now added per-type by finishBody(),
      // called right after each type's own main-body fill (see below) so
      // they clip to the exact silhouette instead of a bounding circle.
      drawEnemyBody(ctx, e);

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

function easeOutCubic(t) {
  const c = clamp(t, 0, 1);
  return 1 - Math.pow(1 - c, 3);
}

// Called immediately after a type's main-body ctx.fill(), while that exact
// path is still current (fill/stroke/clip don't clear the path — only a new
// beginPath() does). Adds a rim-light stroke and a texture-pattern grain
// pass clipped to that exact silhouette, instead of the bounding-circle
// approximation a post-hoc pass would need.
function finishBody(ctx, e, textureKind) {
  if (e.hurtFlash > 0) return; // keep the white hit-flash frame pure
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = e.glow;
  ctx.lineWidth = 0.75;
  ctx.shadowBlur = 0;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.clip();
  ctx.globalAlpha = 0.3;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = texturePattern(ctx, e.color, textureKind);
  ctx.fillRect(-e.radius * 1.4, -e.radius * 1.4, e.radius * 2.8, e.radius * 2.8);
  ctx.restore();
}

// Bio-mechanical swarm creatures, not abstract polygons: legs that scuttle,
// wings that flutter, a maw that visibly opens as it charges a shot. Each
// function owns its full draw (legs/accents behind, body filled on top)
// using whatever ctx.fillStyle/shadow the caller already set. Falls back to
// the original spiky blob for anything unlisted.
function drawEnemyBody(ctx, e) {
  const id = e.isBoss ? e.bossId : (e.type && e.type.id);
  switch (id) {
    case 'crawler': return drawCrawler(ctx, e);
    case 'sprinter': return drawSprinter(ctx, e);
    case 'swarmling': return drawSwarmling(ctx, e);
    case 'spitter': return drawSpitter(ctx, e);
    case 'brute': return drawBrute(ctx, e);
    case 'warden': return drawWardenBoss(ctx, e);
    case 'swarmMother': return drawSwarmMotherBoss(ctx, e);
    case 'eclipse': return drawEclipseBoss(ctx, e);
    default: {
      ctx.beginPath();
      drawSpikyBlob(ctx, e.radius, e.isBoss ? 10 : (e.isElite ? 7 : 5), e.t);
      ctx.fill();
      finishBody(ctx, e, 'organic');
    }
  }
}

// Ground-scuttling bug: a fanned cluster of legs trailing the body, with a
// small glowing eye-core. Slow, steady gait matches its slow-ish speed.
function drawCrawler(ctx, e) {
  drawLegs(ctx, e.radius, 4, e.t, 6, e.radius * 0.7, e.color);
  ctx.beginPath();
  drawSpikyBlob(ctx, e.radius, 5, e.t);
  ctx.fill();
  finishBody(ctx, e, 'organic');
  drawEyeCore(ctx, e.radius);
}

// Same bug body plan as the crawler but stretched into a dart and given a
// much faster leg-scuttle — the animation itself communicates the speed,
// not just the color.
function drawSprinter(ctx, e) {
  drawLegs(ctx, e.radius, 4, e.t, 16, e.radius * 0.95, e.color);
  ctx.beginPath();
  ctx.moveTo(e.radius * 1.5, 0);
  ctx.lineTo(-e.radius * 0.7, e.radius * 0.75);
  ctx.lineTo(-e.radius * 0.25, 0);
  ctx.lineTo(-e.radius * 0.7, -e.radius * 0.75);
  ctx.closePath();
  ctx.fill();
  finishBody(ctx, e, 'organic');
}

// Tiny flying nanobot: fluttering wing pair around a small glowing body —
// these spawn in groups, so the shape stays deliberately quiet/small.
function drawSwarmling(ctx, e) {
  drawWings(ctx, e.radius, e.t, e.color);
  ctx.beginPath();
  ctx.arc(0, 0, e.radius * 0.7, 0, TAU);
  ctx.fill();
  finishBody(ctx, e, 'organic');
  drawEyeCore(ctx, e.radius * 0.55);
}

// Stationary bio-turret: a camera-iris maw that visibly dilates open as it
// charges its shot — the telegraph is the mechanism, not a color tint.
function drawSpitter(ctx, e) {
  ctx.beginPath();
  ctx.arc(0, 0, e.radius, 0, TAU);
  ctx.fill();
  finishBody(ctx, e, 'organic');
  drawIris(ctx, e.radius, e._chargePulse || 0);
}

// Heavy armored quadruped: thick slow-stomping legs, notched shoulder-plate
// hull, and a plating ring accent that reads as "tank" at a glance.
function drawBrute(ctx, e) {
  drawLegs(ctx, e.radius, 4, e.t, 2.6, e.radius * 0.85, e.color);
  ctx.beginPath();
  drawNotchedPolygon(ctx, e.radius, 8, 0.8);
  ctx.fill();
  finishBody(ctx, e, 'hull');
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, e.radius * 0.6, 0, TAU);
  ctx.stroke();
  ctx.restore();
}

// The Warden: an armored sentinel core ringed by rotating shield plates —
// the plates flare outward when it winds up its slam.
function drawWardenBoss(ctx, e) {
  const slamFlare = e.slamming > 0 ? 1.2 : 1;
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = e.color;
  ctx.lineWidth = 3;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + e.t * 0.6;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius * 1.25 * slamFlare, a, a + 0.35);
    ctx.stroke();
  }
  ctx.restore();
  ctx.beginPath();
  drawNotchedPolygon(ctx, e.radius * (e.slamming > 0 ? 1.1 : 1), 8, 0.82);
  ctx.fill();
  finishBody(ctx, e, 'hull');
}

// The Swarm Mother: a queen insect with a bulbous egg-sac abdomen that
// swells and brightens as it nears spawning its next swarmling wave.
function drawSwarmMotherBoss(ctx, e) {
  const cooldown = (e.type && e.type.summonCooldown) || 5;
  const spawnPulse = clamp(1 - (e.summonTimer ?? cooldown) / cooldown, 0, 1);
  ctx.save();
  ctx.globalAlpha = 0.55 + spawnPulse * 0.35;
  ctx.beginPath();
  ctx.ellipse(-e.radius * 0.55, 0, e.radius * (0.85 + spawnPulse * 0.3), e.radius * 0.68, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  drawRippleRing(ctx, e.radius * 0.72, e.t, e.pulsing > 0);
  ctx.fill();
  finishBody(ctx, e, 'organic');
  drawEyeCore(ctx, e.radius * 0.4);
}

// The Eclipse: a literal eclipse — a bright corona of rays around a dark
// void core. The core blacks out and the corona flares while it dashes,
// like the moment of totality.
function drawEclipseBoss(ctx, e) {
  const eclipsing = e.dashing > 0;
  ctx.save();
  ctx.strokeStyle = e.color;
  ctx.globalAlpha = eclipsing ? 1 : 0.7;
  ctx.lineWidth = 2.5;
  const rays = 12;
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * TAU + e.t * 1.2;
    const r1 = e.radius * (eclipsing ? 1.5 : 1.15);
    const r2 = r1 + e.radius * 0.35;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
    ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
    ctx.stroke();
  }
  ctx.restore();
  ctx.save();
  if (eclipsing) ctx.fillStyle = '#050208';
  ctx.beginPath();
  ctx.arc(0, 0, e.radius, 0, TAU);
  ctx.fill();
  ctx.restore();
  if (!eclipsing) finishBody(ctx, e, 'hull');
}

// Shared building blocks -----------------------------------------------

// Fan of single-segment legs trailing the body, with a small per-leg twitch
// so the gait speed itself reads as how fast the creature is.
function drawLegs(ctx, radius, count, t, gaitSpeed, legLen, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(1.4, radius * 0.16);
  ctx.globalAlpha = 0.7;
  for (let i = 0; i < count; i++) {
    const spread = count > 1 ? i / (count - 1) - 0.5 : 0;
    const baseA = Math.PI + spread * 1.3;
    const twitch = Math.sin(t * gaitSpeed + i * 1.7) * 0.25;
    const a = baseA + twitch;
    const x1 = Math.cos(baseA) * radius * 0.65, y1 = Math.sin(baseA) * radius * 0.65;
    const x2 = x1 + Math.cos(a) * legLen, y2 = y1 + Math.sin(a) * legLen;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.restore();
}

// A fluttering pair of wings, both flapping in phase like an insect's.
function drawWings(ctx, radius, t, color) {
  const flap = Math.sin(t * 22) * 0.35;
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.5;
  for (const side of [1, -1]) {
    ctx.save();
    ctx.rotate(side * 0.9 + flap);
    ctx.beginPath();
    ctx.ellipse(radius * 0.9, 0, radius * 0.9, radius * 0.35, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

// A shut eye that visibly opens as `openAmount` (0..1) rises — the spitter's
// charge-up telegraph made literal instead of just a size pulse. At rest it
// reads as a mostly-closed lid with only a thin glowing rim; at full charge
// the lid retracts to a thin ring and a bright core "pupil" fills the eye.
function drawIris(ctx, radius, openAmount) {
  const lidR = radius * (0.92 - 0.75 * openAmount);
  ctx.save();
  ctx.fillStyle = '#0a0612';
  ctx.globalAlpha = 0.92;
  ctx.beginPath();
  ctx.arc(0, 0, Math.max(0, lidR), 0, TAU);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.5 + openAmount * 0.4;
  ctx.beginPath();
  ctx.arc(0, 0, radius * (0.08 + openAmount * 0.5), 0, TAU);
  ctx.fill();
  ctx.restore();
}

// Small glowing eye/core dot, used as a lightweight "this is alive" accent.
function drawEyeCore(ctx, radius) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.65;
  ctx.beginPath();
  ctx.arc(radius * 0.3, 0, Math.max(1, radius * 0.18), 0, TAU);
  ctx.fill();
  ctx.restore();
}

// Notched polygon — reads as armored/tanky (brute, Warden).
function drawNotchedPolygon(ctx, radius, sides, notchDepth) {
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * TAU;
    const r = radius * (i % 2 === 0 ? 1 : notchDepth);
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

// Rippling many-pointed ring — the Swarm Mother's head, flares when pulsing.
function drawRippleRing(ctx, radius, t, pulsing) {
  const pulse = pulsing ? 1.2 : 1;
  for (let i = 0; i <= 12; i++) {
    const a = (i / 12) * TAU;
    const r = radius * pulse * (0.85 + 0.15 * Math.sin(a * 4 + t * 3));
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}
