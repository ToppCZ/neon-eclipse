// ---- utils.js ----
// ---- Math & general helpers ----------------------------------------------

const TAU = Math.PI * 2;

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function dist2(ax, ay, bx, by) {
  const dx = ax - bx, dy = ay - by;
  return dx * dx + dy * dy;
}

function dist(ax, ay, bx, by) {
  return Math.sqrt(dist2(ax, ay, bx, by));
}

function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

// Mulberry32 seeded PRNG so runs can be reproduced/debugged if needed.
function makeRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = makeRng(Date.now() & 0xffffffff);

function randRange(min, max) {
  return min + rng() * (max - min);
}

function randInt(min, max) {
  return Math.floor(randRange(min, max + 1));
}

function pick(arr) {
  return arr[Math.floor(rng() * arr.length)];
}

// Weighted pick: items = [{weight, value}]
function weightedPick(items) {
  let total = 0;
  for (const it of items) total += it.weight;
  let r = rng() * total;
  for (const it of items) {
    if ((r -= it.weight) <= 0) return it.value;
  }
  return items[items.length - 1].value;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ---- Object pool -----------------------------------------------------------
// Reuses dead objects instead of allocating new ones every frame, which
// matters a lot once hundreds of projectiles/particles are alive at once.
class Pool {
  constructor(factory, reset) {
    this.factory = factory;
    this.reset = reset;
    this.free = [];
    this.active = [];
  }
  spawn(...args) {
    let obj = this.free.pop();
    if (!obj) obj = this.factory();
    this.reset(obj, ...args);
    obj.__alive = true;
    this.active.push(obj);
    return obj;
  }
  update(fn) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const obj = this.active[i];
      const alive = fn(obj);
      if (alive === false || obj.__alive === false) {
        this.active[i] = this.active[this.active.length - 1];
        this.active.pop();
        this.free.push(obj);
      }
    }
  }
  clear() {
    while (this.active.length) this.free.push(this.active.pop());
  }
}

// ---- Uniform spatial grid ---------------------------------------------------
// Broad-phase collision so we don't do O(enemies * projectiles) every frame.
class SpatialGrid {
  constructor(cellSize) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }
  key(cx, cy) { return cx * 100000 + cy; }

  clear() { this.cells.clear(); }

  insert(item, x, y) {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    const k = this.key(cx, cy);
    let arr = this.cells.get(k);
    if (!arr) { arr = []; this.cells.set(k, arr); }
    arr.push(item);
  }

  // Calls fn(item) for every item within `radius` of (x,y) (cell-approx, not exact circle).
  queryRadius(x, y, radius, fn) {
    const cs = this.cellSize;
    const minCx = Math.floor((x - radius) / cs);
    const maxCx = Math.floor((x + radius) / cs);
    const minCy = Math.floor((y - radius) / cs);
    const maxCy = Math.floor((y + radius) / cs);
    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const arr = this.cells.get(this.key(cx, cy));
        if (!arr) continue;
        for (const item of arr) fn(item);
      }
    }
  }
}

// ---- audio.js ----
// All sound is synthesized at runtime with WebAudio — no asset files to load,
// no network fetch, works offline. Keeps everything self-contained.

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.enabled = true;
    this.musicNodes = [];
    this.musicTimer = null;
  }

  ensure() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.8;
    this.sfxGain.connect(this.master);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.35;
    this.musicGain.connect(this.master);
  }

  resume() {
    this.ensure();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setMuted(muted) {
    this.ensure();
    this.master.gain.value = muted ? 0 : 0.9;
  }

  now() { return this.ctx.currentTime; }

  // ---- Low-level tone helper ----
  tone({ freq = 440, type = 'sine', dur = 0.12, gain = 0.2, slideTo = null, delay = 0, gainNode = null }) {
    this.ensure();
    const target = gainNode || this.sfxGain;
    const t0 = this.now() + delay;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo != null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(target);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  noiseBurst({ dur = 0.15, gain = 0.25, filterFreq = 1200, delay = 0, gainNode = null }) {
    this.ensure();
    const target = gainNode || this.sfxGain;
    const t0 = this.now() + delay;
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(target);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  // ---- Named SFX ----
  hit() { this.tone({ freq: 180, type: 'square', dur: 0.06, gain: 0.12, slideTo: 60 }); }
  shoot() { this.tone({ freq: 520, type: 'triangle', dur: 0.05, gain: 0.06, slideTo: 300 }); }
  enemyDeath() { this.noiseBurst({ dur: 0.12, gain: 0.14, filterFreq: 900 }); this.tone({ freq: 260, type: 'sawtooth', dur: 0.1, gain: 0.08, slideTo: 90 }); }
  playerHurt() { this.tone({ freq: 140, type: 'sawtooth', dur: 0.18, gain: 0.22, slideTo: 60 }); this.noiseBurst({ dur: 0.15, gain: 0.15, filterFreq: 500 }); }
  pickup() { this.tone({ freq: 700, type: 'sine', dur: 0.05, gain: 0.05, slideTo: 1100 }); }
  levelUp() {
    const notes = [523, 659, 784, 1046];
    notes.forEach((f, i) => this.tone({ freq: f, type: 'triangle', dur: 0.18, gain: 0.14, delay: i * 0.06 }));
  }
  explosion() { this.noiseBurst({ dur: 0.35, gain: 0.28, filterFreq: 700 }); this.tone({ freq: 90, type: 'sine', dur: 0.3, gain: 0.2, slideTo: 30 }); }
  uiClick() { this.tone({ freq: 440, type: 'square', dur: 0.04, gain: 0.06, slideTo: 620 }); }
  bossRoar() { this.tone({ freq: 100, type: 'sawtooth', dur: 0.6, gain: 0.22, slideTo: 40 }); this.noiseBurst({ dur: 0.5, gain: 0.15, filterFreq: 300 }); }
  gameOver() {
    [392, 349, 311, 261].forEach((f, i) => this.tone({ freq: f, type: 'sawtooth', dur: 0.35, gain: 0.15, delay: i * 0.15 }));
  }
  victory() {
    [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone({ freq: f, type: 'triangle', dur: 0.3, gain: 0.16, delay: i * 0.1 }));
  }

  // ---- Ambient procedural music: a slow evolving arpeggio pad ----
  startMusic() {
    this.ensure();
    this.stopMusic();
    const scale = [130.81, 155.56, 174.61, 196.00, 233.08]; // C minor-ish pentatonic-ish, low register
    let step = 0;
    const playStep = () => {
      const base = pickRandom(scale);
      const octaveMul = Math.random() < 0.5 ? 1 : 2;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = base * octaveMul;
      const g = this.ctx.createGain();
      const t0 = this.now();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.06, t0 + 1.2);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.4);
      osc.connect(g);
      g.connect(this.musicGain);
      osc.start(t0);
      osc.stop(t0 + 3.5);
      step++;
      this.musicTimer = setTimeout(playStep, 1400 + Math.random() * 900);
    };
    playStep();
  }

  stopMusic() {
    if (this.musicTimer) clearTimeout(this.musicTimer);
    this.musicTimer = null;
  }
}

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const audio = new AudioEngine();

// ---- particles.js ----
function makeParticle() {
  return { x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1, size: 2, color: '#fff', drag: 0.94, gravity: 0, __alive: true, glow: false };
}

class ParticleSystem {
  constructor() {
    this.pool = new Pool(makeParticle, (p, opts) => {
      Object.assign(p, {
        x: opts.x, y: opts.y, vx: opts.vx, vy: opts.vy,
        life: opts.life, maxLife: opts.life, size: opts.size,
        color: opts.color, drag: opts.drag ?? 0.94, gravity: opts.gravity ?? 0,
        glow: opts.glow ?? false,
      });
    });
    this.floaters = new Pool(() => ({ x: 0, y: 0, vy: 0, life: 0, maxLife: 1, text: '', color: '#fff' }),
      (f, opts) => Object.assign(f, { x: opts.x, y: opts.y, vy: -30, life: opts.life ?? 0.8, maxLife: opts.life ?? 0.8, text: opts.text, color: opts.color ?? '#fff' }));
  }

  burst(x, y, { count = 10, color = '#fff', speed = 120, life = 0.5, size = 3, glow = false } = {}) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * TAU + randRange(-0.3, 0.3);
      const s = speed * randRange(0.4, 1);
      this.pool.spawn({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        life: life * randRange(0.6, 1.2), color, size: size * randRange(0.7, 1.3), glow,
      });
    }
  }

  spark(x, y, angle, color = '#9ef', count = 4) {
    for (let i = 0; i < count; i++) {
      const a = angle + randRange(-0.5, 0.5);
      const s = randRange(80, 220);
      this.pool.spawn({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: randRange(0.15, 0.3), color, size: randRange(1.5, 3), glow: true });
    }
  }

  damageText(x, y, amount, { crit = false, color } = {}) {
    this.floaters.spawn({
      x, y, text: Math.round(amount).toString(),
      color: color || (crit ? '#ffd54a' : '#ffffff'),
      life: crit ? 0.9 : 0.7,
    });
  }

  labelText(x, y, text, color = '#7CFC9A') {
    this.floaters.spawn({ x, y, text, color, life: 1.1 });
  }

  update(dt) {
    this.pool.update((p) => {
      p.life -= dt;
      if (p.life <= 0) return false;
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      return true;
    });
    this.floaters.update((f) => {
      f.life -= dt;
      if (f.life <= 0) return false;
      f.y += f.vy * dt;
      f.vy *= 0.92;
      return true;
    });
  }

  render(ctx) {
    for (const p of this.pool.active) {
      const t = p.life / p.maxLife;
      ctx.globalAlpha = clamp01(t);
      if (p.glow) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.4, p.size * t), 0, TAU);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    ctx.font = '600 14px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    for (const f of this.floaters.active) {
      const t = f.life / f.maxLife;
      ctx.globalAlpha = clamp01(t);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }

  clear() { this.pool.clear(); this.floaters.clear(); }
}

function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

// ---- player.js ----
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

function getCharacter(id) { return CHARACTERS[id] || CHARACTERS.vex; }
function listCharacters() { return Object.values(CHARACTERS); }

// Pre-run picks: a real strategic tradeoff before the run even starts, not
// just a flat buff. Applied once, directly to the character's base stats.
const RELICS = {
  glassCannon: {
    id: 'glassCannon', name: 'Glass Cannon', glyph: '⚡', color: '#ff5e8a',
    desc: '+35% damage, -25% max HP',
    apply(base) { base.baseMight *= 1.35; base.baseMaxHp *= 0.75; },
  },
  fortress: {
    id: 'fortress', name: 'Fortress', glyph: '▣', color: '#ff8a5e',
    desc: '+30% max HP, +3 armor, -15% move speed',
    apply(base) { base.baseMaxHp *= 1.3; base.baseArmor += 3; base.baseSpeed *= 0.85; },
  },
  berserker: {
    id: 'berserker', name: 'Berserker', glyph: '⚔', color: '#ffd54a',
    desc: '+20% attack speed, -10% damage',
    apply(base) { base.baseCooldown *= 0.8; base.baseMight *= 0.9; },
  },
  vampire: {
    id: 'vampire', name: 'Vampire', glyph: '♥', color: '#7CFC9A',
    desc: '+1.5 HP/s regen, -20% pickup radius',
    apply(base) { base.baseRegen += 1.5; base.baseMagnet *= 0.8; },
  },
};

function getRelic(id) { return RELICS[id] || null; }
function listRelics() { return Object.values(RELICS); }

const DASH_COOLDOWN = 2.2;
const DASH_DURATION = 0.18;
const DASH_SPEED_MULT = 3.4;

class Player {
  constructor(character, metaBonuses, relic) {
    this.char = character;
    this.relic = relic || null;
    this.x = 0;
    this.y = 0;
    this.radius = 16;
    this.facing = 0;

    const meta = metaBonuses || { hp: 0, might: 0, speed: 0, armor: 0, luck: 0, magnet: 0 };
    const base = {
      baseMaxHp: character.baseHp * (1 + meta.hp),
      baseSpeed: character.baseSpeed * (1 + meta.speed),
      baseMight: character.baseMight * (1 + meta.might),
      baseArea: character.baseArea,
      baseCooldown: character.baseCooldown,
      baseMagnet: character.baseMagnet * (1 + meta.magnet),
      baseLuck: character.baseLuck * (1 + meta.luck),
      baseArmor: character.baseArmor + meta.armor,
      baseRegen: character.baseRegen,
    };
    if (relic && relic.apply) relic.apply(base);
    Object.assign(this, base);

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
    this.cores = 0; // in-run currency, spent at shop nodes; resets each run

    this.invulnTimer = 0;
    this.hurtFlash = 0;
    this.regenAccum = 0;
    this.dead = false;

    this.kills = 0;
    this.moveAngle = 0;
    this.moving = false;

    this.auraSlowMult = 1; // set externally each frame by a nearby frost-aura elite, if any

    this.dashCooldownTimer = 0;
    this.dashTimeLeft = 0;
    this.dashAngle = 0;
    this.dashMaxCooldown = DASH_COOLDOWN;
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
    if (this.dashCooldownTimer > 0) this.dashCooldownTimer -= dt;

    let mx = 0, my = 0;
    if (input.left) mx -= 1;
    if (input.right) mx += 1;
    if (input.up) my -= 1;
    if (input.down) my += 1;
    this.moving = mx !== 0 || my !== 0;
    if (this.moving) this.facing = Math.atan2(my, mx);

    if (input.dashPressed && this.dashCooldownTimer <= 0 && this.dashTimeLeft <= 0) {
      this.dashTimeLeft = DASH_DURATION;
      this.dashCooldownTimer = DASH_COOLDOWN;
      this.dashAngle = this.moving ? Math.atan2(my, mx) : this.facing;
      this.invulnTimer = Math.max(this.invulnTimer, DASH_DURATION + 0.05);
    }

    if (this.dashTimeLeft > 0) {
      this.dashTimeLeft -= dt;
      const dashSpeed = this.speed * DASH_SPEED_MULT;
      this.x += Math.cos(this.dashAngle) * dashSpeed * dt;
      this.y += Math.sin(this.dashAngle) * dashSpeed * dt;
    } else if (this.moving) {
      const len = Math.hypot(mx, my) || 1;
      mx /= len; my /= len;
      const effSpeed = this.speed * this.auraSlowMult;
      this.x += mx * effSpeed * dt;
      this.y += my * effSpeed * dt;
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

// ---- enemyData.js ----
// Enemy archetypes. `hp`/`damage`/`speed` are base values at act 1, node-elapsed 0;
// the spawner scales them up over a node's duration and by act tier. `behavior`
// selects an update function in enemies.js. `minAct` gates which acts a type can
// appear in — availability is otherwise driven by the current biome's `enemyPool`.
// `resistances` multiply incoming damage by weapon damageType (>1 = weak to it,
// <1 = resists it); an omitted type defaults to 1 (neutral).
const ENEMY_TYPES = {
  crawler: {
    id: 'crawler', name: 'Crawler', behavior: 'chase',
    hp: 14, speed: 95, damage: 8, radius: 12, xp: 1, color: '#7CFC9A', glow: '#2f7a45',
    minAct: 1, weight: 10,
    resistances: { fire: 1.15, frost: 0.9 },
  },
  sprinter: {
    id: 'sprinter', name: 'Sprinter', behavior: 'chase',
    hp: 9, speed: 190, damage: 6, radius: 9, xp: 1, color: '#FFE066', glow: '#8a7a1f',
    minAct: 1, weight: 6,
    resistances: { shock: 1.25, frost: 0.85 },
  },
  swarmling: {
    id: 'swarmling', name: 'Swarmling', behavior: 'chase',
    hp: 4, speed: 130, damage: 4, radius: 6, xp: 1, color: '#5ee6ff', glow: '#1f5a6b',
    minAct: 1, weight: 8, spawnsInGroups: true,
    resistances: { fire: 1.3, poison: 0.75 },
  },
  spitter: {
    id: 'spitter', name: 'Spitter', behavior: 'ranged',
    hp: 20, speed: 70, damage: 10, radius: 11, xp: 2, color: '#c98cff', glow: '#5a2f7a',
    minAct: 2, weight: 5, range: 320, fireRate: 1.6, projSpeed: 190,
    resistances: { fire: 0.85, poison: 1.25 },
  },
  brute: {
    id: 'brute', name: 'Brute', behavior: 'chase',
    hp: 70, speed: 65, damage: 18, radius: 20, xp: 4, color: '#FF6B6B', glow: '#7a2020',
    minAct: 2, weight: 4,
    resistances: { poison: 0.8, shock: 0.85, frost: 1.2 },
  },
};

const BOSS_TYPES = {
  warden: {
    id: 'warden', name: 'The Warden', behavior: 'boss_warden',
    hp: 900, speed: 78, damage: 14, radius: 34, xp: 40, color: '#ff5e8a', glow: '#7a1f3a',
    slamRange: 90, slamDamage: 28, slamCooldown: 2.6, summonCooldown: 7,
    resistances: { poison: 0.85, shock: 0.9, frost: 1.1 },
  },
  swarmMother: {
    id: 'swarmMother', name: 'The Swarm Mother', behavior: 'boss_swarmmother',
    hp: 1500, speed: 72, damage: 12, radius: 36, xp: 70, color: '#7CFC9A', glow: '#1f5a2f',
    pulseRadius: 130, pulseDamage: 20, pulseCooldown: 3.2, summonCooldown: 5,
    resistances: { fire: 1.25, poison: 0.6 },
  },
  eclipse: {
    id: 'eclipse', name: 'The Eclipse', behavior: 'boss_eclipse',
    hp: 2600, speed: 90, damage: 16, radius: 42, xp: 120, color: '#ffb14a', glow: '#7a4a1f',
    burstCooldown: 3.2, burstCount: 16, dashCooldown: 5,
    resistances: { fire: 0.95, poison: 0.95, shock: 1.15, frost: 0.95 },
  },
};

// Each act plays out in one biome: it picks which enemy types can spawn, the
// act's boss, and the arena's color palette.
const BIOMES = [
  {
    id: 'neonSlums', name: 'Neon Slums', act: 1,
    enemyPool: ['crawler', 'sprinter', 'swarmling'],
    boss: 'warden', hazardType: null,
    bg: '#05060f', grid: 'rgba(94, 230, 255, 0.06)', accent: '#5ee6ff',
  },
  {
    id: 'toxicWastes', name: 'Toxic Wastes', act: 2,
    enemyPool: ['sprinter', 'swarmling', 'spitter', 'brute'],
    boss: 'swarmMother', hazardType: 'poison',
    bg: '#050f08', grid: 'rgba(124, 252, 154, 0.07)', accent: '#7CFC9A',
  },
  {
    id: 'eclipseCore', name: 'Eclipse Core', act: 3,
    enemyPool: ['crawler', 'brute', 'spitter', 'swarmling'],
    boss: 'eclipse', hazardType: 'fire',
    bg: '#0f0605', grid: 'rgba(255, 138, 94, 0.07)', accent: '#ffb14a',
  },
];

function biomeForAct(actNumber) {
  return BIOMES[actNumber - 1] || BIOMES[BIOMES.length - 1];
}

// ---- runMap.js ----
// A run is 3 acts. Each act is a sequence of steps the player resolves in order;
// every non-boss step offers 3 node choices (Slay the Spire-style "pick what's
// next", without needing a full branching graph renderer). The final step of
// every act is always the act's boss, forced.
const STEPS_PER_ACT = 4; // + 1 forced boss step

const NODE_TYPE_WEIGHTS = [
  { weight: 45, value: 'combat' },
  { weight: 15, value: 'elite' },
  { weight: 15, value: 'shop' },
  { weight: 15, value: 'treasure' },
  { weight: 10, value: 'rest' },
];

const NODE_LABELS = {
  combat: ['Ambush', 'Skirmish', 'Incursion', 'Breach', 'Hunting Ground'],
  elite: ['Elite Sighting', "Champion's Den", 'Marked Target'],
  shop: ['Black Market', 'Supply Cache', "Vendor's Stall"],
  treasure: ['Vault', 'Cache', 'Stash'],
  rest: ['Safehouse', 'Sanctuary', 'Respite'],
  boss: ['Act Boss'],
};

function rollNodeType(excludeType) {
  let type = weightedPick(NODE_TYPE_WEIGHTS);
  if (type === excludeType) type = weightedPick(NODE_TYPE_WEIGHTS);
  return type;
}

function makeNode(type, biome, stepIndex) {
  const labels = NODE_LABELS[type];
  return {
    id: `${biome.id}-${stepIndex}-${type}-${Math.floor(rng() * 1e6)}`,
    type,
    biome,
    label: labels[randInt(0, labels.length - 1)],
  };
}

function generateAct(actNumber) {
  const biome = biomeForAct(actNumber);
  const steps = [];
  let lastType = null;
  for (let i = 0; i < STEPS_PER_ACT; i++) {
    const choices = [];
    const usedTypes = new Set();
    for (let c = 0; c < 3; c++) {
      let type = rollNodeType(i === 0 ? null : lastType);
      let attempts = 0;
      while (usedTypes.has(type) && attempts < 4) { type = rollNodeType(null); attempts++; }
      usedTypes.add(type);
      choices.push(makeNode(type, biome, i));
    }
    lastType = choices[0].type;
    steps.push({ index: i, choices, forced: null });
  }
  // Final forced boss step.
  steps.push({ index: STEPS_PER_ACT, choices: [makeNode('boss', biome, STEPS_PER_ACT)], forced: 'boss' });
  return { actNumber, biome, steps };
}

function generateRun() {
  return {
    actIndex: 0,
    stepIndex: 0,
    acts: [generateAct(1), generateAct(2), generateAct(3)],
    nodesCleared: 0,
  };
}

function currentAct(run) { return run.acts[run.actIndex]; }
function currentStep(run) { return currentAct(run).steps[run.stepIndex]; }
function isLastAct(run) { return run.actIndex >= run.acts.length - 1; }
function isLastStepOfAct(run) { return run.stepIndex >= currentAct(run).steps.length - 1; }
function totalActs(run) { return run.acts.length; }

// ---- statusEffects.js ----
// Status effects live as plain fields directly on each (pooled) enemy object
// rather than as separate pooled entities — enemies already are long-lived
// pooled objects, so this avoids a second bookkeeping layer for what's really
// just a handful of timers per enemy.

function applyBurn(e, dps, duration) {
  e.burnTime = Math.max(e.burnTime || 0, duration);
  e.burnDps = Math.max(e.burnDps || 0, dps);
}

function applyPoison(e, dpsPerStack, duration) {
  e.poisonStacks = Math.min(5, (e.poisonStacks || 0) + 1);
  e.poisonTime = Math.max(e.poisonTime || 0, duration);
  e.poisonDpsPerStack = dpsPerStack;
}

function applyShock(e, stunDuration) {
  e.stunTime = Math.max(e.stunTime || 0, stunDuration);
}

function applyFrost(e, slowPerStack, duration) {
  e.frostStacks = Math.min(3, (e.frostStacks || 0) + 1);
  e.frostTime = Math.max(e.frostTime || 0, duration);
  e.frostSlowPerStack = slowPerStack;
}

function clearStatuses(e) {
  e.burnTime = 0; e.burnDps = 0;
  e.poisonTime = 0; e.poisonStacks = 0; e.poisonDpsPerStack = 0;
  e.stunTime = 0;
  e.frostTime = 0; e.frostStacks = 0; e.frostSlowPerStack = 0;
  e._burnTick = 0; e._poisonTick = 0;
}

// Ticks DoTs, decays timers, and reports back this frame's movement
// multiplier (frost) and whether the enemy is stunned (shock) — both of
// which the caller applies in its own movement/behavior code.
function updateStatuses(e, dt) {
  let speedMult = 1;
  let stunned = false;

  if (e.burnTime > 0) {
    e.burnTime -= dt;
    e._burnTick = (e._burnTick ?? 0) - dt;
    if (e._burnTick <= 0) { e._burnTick += 0.5; e.hp -= e.burnDps * 0.5; e.hurtFlash = Math.max(e.hurtFlash, 0.06); }
    if (e.burnTime <= 0) { e.burnTime = 0; e.burnDps = 0; }
  }
  if (e.poisonTime > 0) {
    e.poisonTime -= dt;
    e._poisonTick = (e._poisonTick ?? 0) - dt;
    if (e._poisonTick <= 0) { e._poisonTick += 0.5; e.hp -= e.poisonDpsPerStack * e.poisonStacks * 0.5; e.hurtFlash = Math.max(e.hurtFlash, 0.06); }
    if (e.poisonTime <= 0) { e.poisonTime = 0; e.poisonStacks = 0; }
  }
  if (e.stunTime > 0) {
    e.stunTime -= dt;
    stunned = true;
    if (e.stunTime <= 0) e.stunTime = 0;
  }
  if (e.frostTime > 0) {
    e.frostTime -= dt;
    speedMult = Math.max(0.25, 1 - 0.2 * e.frostStacks);
    if (e.frostTime <= 0) { e.frostTime = 0; e.frostStacks = 0; }
  }

  return { speedMult, stunned };
}

// Render-time glow override so the player can see what's afflicting an enemy.
function statusGlowColor(e) {
  if (e.stunTime > 0) return '#ffe066';
  if (e.frostTime > 0) return '#5ee6ff';
  if (e.poisonTime > 0) return '#7CFC9A';
  if (e.burnTime > 0) return '#ff8a5e';
  return null;
}

// ---- enemies.js ----
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

const ELITE_AFFIXES = ['explosive', 'shielded', 'frozenAura'];

function makeEnemyShot() {
  return { x: 0, y: 0, vx: 0, vy: 0, damage: 0, radius: 6, life: 4, color: '#c98cff', __alive: true };
}

class EnemyManager {
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
    const actHp = 1 + (actNumber - 1) * 0.6;
    const actDmg = 1 + (actNumber - 1) * 0.45;
    const actSpeed = 1 + (actNumber - 1) * 0.12;
    const actSpawn = 1 + (actNumber - 1) * 0.3;
    return {
      hp: (1 + t * 0.35) * actHp,
      dmg: (1 + t * 0.12) * actDmg,
      speed: (1 + Math.min(0.25, t * 0.06)) * actSpeed,
      spawnRate: (1 + t * 0.4) * actSpawn,
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

  spawnBoss(bossId, player, worldHalf) {
    const type = { ...BOSS_TYPES[bossId], isBoss: true };
    const { x, y } = this.spawnPointAround(player.x, player.y, worldHalf);
    const e = this.pool.spawn(type, x, y, 1, 1, 1);
    e.bossId = bossId;
    this.activeBoss = e;
    if (this.audio) this.audio.bossRoar();
    return e;
  }

  spawnElite(biome, player, worldHalf, actNumber) {
    const types = this.availableTypes(biome);
    const type = types.reduce((a, b) => (b.hp > a.hp ? b : a), types[0]);
    const { x, y } = this.spawnPointAround(player.x, player.y, worldHalf);
    const actHp = 1 + (actNumber - 1) * 0.6;
    const actDmg = 1 + (actNumber - 1) * 0.45;
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
      const statusGlow = statusGlowColor(e);
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

const AFFIX_LABELS = { explosive: 'EXPLOSIVE', shielded: 'SHIELDED', frozenAura: 'FROST AURA' };
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

// ---- weapons.js ----
// ---- Weapon definitions -----------------------------------------------
// getStats(level, player) returns the numbers a fire/update call needs.
// `evolvesInto` + `evolutionRequires` drive the evolution check.
const WEAPONS = {
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

class WeaponSystem {
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

// ---- upgrades.js ----
// Passive ids intentionally match each weapon's `evolutionRequires`. Each
// `apply` bakes in a "mastery" kicker at max level (5) — a small extra jump
// so maxing a passive feels like it transforms into a stronger unique
// version, the same spirit as weapon evolution, without a second bookkeeping
// system for it.
const PASSIVES = {
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
};

const TIER_COLORS = { common: '#9aa4c9', rare: '#5ee6ff', legendary: '#ffd54a' };

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
function rollUpgradeChoices(player, weaponSystem, n = 3) {
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

function applyUpgradeChoice(choice, player, weaponSystem) {
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

function rollShopOffers(player, weaponSystem, n = 4) {
  const choices = rollUpgradeChoices(player, weaponSystem, n);
  return choices.map(c => ({ ...c, cost: costFor(c) }));
}

function shopRerollCost(rerollCount) {
  return 15 + rerollCount * 10;
}

// ---- pickups.js ----
function makeGem() {
  return { x: 0, y: 0, value: 1, radius: 5, color: '#5ee6ff', kind: 'xp', vx: 0, vy: 0, attracted: false, bob: 0, __alive: true };
}

class PickupManager {
  constructor(particles, audio) {
    this.particles = particles;
    this.audio = audio;
    this.pool = new Pool(makeGem, (g, x, y, value, kind) => {
      g.x = x; g.y = y; g.value = value; g.kind = kind;
      g.color = kind === 'cores' ? '#ffd54a' : (value >= 5 ? '#c98cff' : '#5ee6ff');
      g.radius = kind === 'cores' ? 6 : (value >= 5 ? 7 : 5);
      g.vx = 0; g.vy = 0; g.attracted = false; g.bob = Math.random() * TAU;
    });
  }

  reset() { this.pool.clear(); }

  spawnXp(x, y, value) { this.pool.spawn(x, y, value, 'xp'); }
  spawnCores(x, y, value) { this.pool.spawn(x, y, value, 'cores'); }

  update(dt, player, onCollect) {
    const magnetR2 = player.magnet * player.magnet;
    const collectR = player.radius + 4;
    const collectR2 = collectR * collectR;

    this.pool.update((g) => {
      g.bob += dt * 4;
      const d2 = dist2(g.x, g.y, player.x, player.y);
      if (d2 <= magnetR2) g.attracted = true;
      if (g.attracted) {
        const a = angleTo(g.x, g.y, player.x, player.y);
        const speed = 620;
        g.x += Math.cos(a) * speed * dt;
        g.y += Math.sin(a) * speed * dt;
      }
      if (d2 <= collectR2 || (g.attracted && dist2(g.x, g.y, player.x, player.y) <= collectR2 * 4)) {
        onCollect(g);
        if (this.audio) this.audio.pickup();
        return false;
      }
      return true;
    });
  }

  render(ctx, camX, camY) {
    for (const g of this.pool.active) {
      const sx = g.x - camX, sy = g.y - camY + Math.sin(g.bob) * 2;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.shadowColor = g.color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = g.color;
      if (g.kind === 'cores') {
        ctx.beginPath();
        ctx.arc(0, 0, g.radius, 0, TAU);
        ctx.fill();
      } else {
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-g.radius, -g.radius, g.radius * 2, g.radius * 2);
      }
      ctx.restore();
    }
    ctx.shadowBlur = 0;
  }
}

// ---- meta.js ----
const STORAGE_KEY = 'neonEclipse.meta.v1';

const META_UPGRADES = {
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

function loadMeta() {
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

function saveMeta(meta) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(meta)); } catch { /* storage unavailable — progress just won't persist */ }
}

function upgradeCost(def, level) {
  return Math.round(def.baseCost * Math.pow(def.costGrowth, level));
}

function purchaseUpgrade(meta, id) {
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

function getMetaBonuses(meta) {
  const bonuses = { hp: 0, might: 0, speed: 0, armor: 0, luck: 0, magnet: 0 };
  for (const id of Object.keys(META_UPGRADES)) {
    const def = META_UPGRADES[id];
    const level = meta.levels[id] || 0;
    bonuses[def.stat] = def.flat ? level * def.perLevel : level * def.perLevel;
  }
  return bonuses;
}

function recordRunResult(meta, { time, level, kills, actReached, nodesCleared, goldEarned }) {
  meta.gold += goldEarned;
  meta.stats.totalRuns += 1;
  meta.stats.bestTime = Math.max(meta.stats.bestTime, time);
  meta.stats.bestLevel = Math.max(meta.stats.bestLevel, level);
  meta.stats.bestAct = Math.max(meta.stats.bestAct, actReached || 0);
  meta.stats.totalKills += kills;
  meta.stats.totalNodesCleared += nodesCleared || 0;
  saveMeta(meta);
}

// ---- ui.js ----
const ICONS = {
  shardCannon: { glyph: '◆', color: '#5ee6ff' },
  pulseBlade: { glyph: '⚔', color: '#ff8a5e' },
  orbitDrones: { glyph: '✦', color: '#c98cff' },
  novaBurst: { glyph: '◎', color: '#5ee6ff' },
  homingMissile: { glyph: '➤', color: '#c98cff' },
  chainLightning: { glyph: '⚡', color: '#ffd54a' },
  might: { glyph: 'M', color: '#ff5e8a' },
  vitality: { glyph: 'V', color: '#7CFC9A' },
  amulet: { glyph: 'A', color: '#c98cff' },
  haste: { glyph: 'H', color: '#5ee6ff' },
  magnet: { glyph: 'Mg', color: '#ffd54a' },
  fortune: { glyph: 'F', color: '#ffd54a' },
  boots: { glyph: 'B', color: '#7CFC9A' },
  cores: { glyph: '◈', color: '#ffd54a' },
  glassCannon: { glyph: '⚡', color: '#ff5e8a' },
  fortress: { glyph: '▣', color: '#ff8a5e' },
  berserker: { glyph: '⚔', color: '#ffd54a' },
  vampire: { glyph: '♥', color: '#7CFC9A' },
};

const NODE_ICONS = {
  combat: { glyph: '⚔', color: '#ff8a5e' },
  elite: { glyph: '☠', color: '#ffd54a' },
  shop: { glyph: '$', color: '#7CFC9A' },
  treasure: { glyph: '◆', color: '#c98cff' },
  rest: { glyph: '♥', color: '#5ee6ff' },
  boss: { glyph: '★', color: '#ff5e8a' },
};

function iconFor(id) { return ICONS[id] || { glyph: '?', color: '#fff' }; }
function nodeIconFor(type) { return NODE_ICONS[type] || { glyph: '?', color: '#fff' }; }

class UI {
  constructor() {
    this.el = {};
    [
      'hud', 'hp-bar', 'hp-label', 'xp-bar', 'timer', 'gold-val', 'level-badge', 'weapon-tray',
      'run-progress',
      'boss-banner', 'kill-counter',
      'screen-menu', 'btn-play', 'btn-shop', 'menu-stats',
      'screen-characters', 'character-list', 'btn-back-chars',
      'screen-shop', 'shop-list', 'shop-gold', 'btn-back-shop',
      'screen-choice', 'choice-title', 'choice-list',
      'screen-map', 'map-header', 'map-choices',
      'screen-node-shop', 'node-shop-cores', 'node-shop-list', 'btn-node-shop-reroll', 'node-shop-reroll-cost', 'btn-node-shop-continue',
      'screen-pause', 'btn-resume', 'btn-quit',
      'screen-end', 'end-title', 'end-stats', 'btn-retry', 'btn-end-menu',
      'mute-btn',
    ].forEach((id) => { this.el[camel(id)] = document.getElementById(id); });

    this.screens = [
      'screen-menu', 'screen-characters', 'screen-shop', 'screen-choice',
      'screen-map', 'screen-node-shop', 'screen-pause', 'screen-end',
    ].map(id => document.getElementById(id));
  }

  hideAllScreens() { this.screens.forEach(s => s.classList.add('hidden')); }
  show(id) { document.getElementById(id).classList.remove('hidden'); }

  setHudVisible(visible) { this.el.hud.classList.toggle('hidden', !visible); }

  updateHud(player, elapsed, weaponSystem, killCount, runLabel) {
    const hpPct = clamp(player.hp / player.maxHp, 0, 1);
    this.el.hpBar.style.transform = `scaleX(${hpPct})`;
    this.el.hpLabel.textContent = `${Math.ceil(player.hp)} / ${Math.round(player.maxHp)}`;
    const xpPct = clamp(player.xp / player.xpToNext, 0, 1);
    this.el.xpBar.style.transform = `scaleX(${xpPct})`;
    this.el.timer.textContent = formatTime(elapsed);
    this.el.goldVal.textContent = Math.floor(player.cores);
    this.el.levelBadge.textContent = `Lv ${player.level}`;
    this.el.killCounter.textContent = `Kills: ${killCount}`;
    this.el.killCounter.classList.remove('hidden');
    if (runLabel) { this.el.runProgress.textContent = runLabel; this.el.runProgress.classList.remove('hidden'); }

    this.el.weaponTray.innerHTML = '';
    for (const slot of weaponSystem.slots) {
      const def = WEAPONS[slot.id];
      const icon = iconFor(slot.id);
      const div = document.createElement('div');
      div.className = 'weapon-icon' + (slot.evolved ? ' evolved' : '');
      div.style.color = icon.color;
      div.style.borderColor = slot.evolved ? undefined : icon.color + '55';
      div.textContent = icon.glyph;
      const lvl = document.createElement('span');
      lvl.className = 'lvl';
      lvl.textContent = slot.evolved ? '★' : slot.level;
      div.appendChild(lvl);
      div.title = `${slot.evolved ? def.evolvedName : def.name} — Lv ${slot.level}`;
      this.el.weaponTray.appendChild(div);
    }
  }

  flashBossBanner(name) {
    this.el.bossBanner.textContent = `⚠ ${name} APPROACHES ⚠`;
    this.el.bossBanner.classList.remove('hidden');
    clearTimeout(this._bossTimer);
    this._bossTimer = setTimeout(() => this.el.bossBanner.classList.add('hidden'), 3500);
  }

  showMenu(meta) {
    this.hideAllScreens();
    this.show('screen-menu');
    this.setHudVisible(false);
    this.el.killCounter.classList.add('hidden');
    this.el.runProgress.classList.add('hidden');
    this.el.menuStats.innerHTML = `
      <div><b>${meta.stats.totalRuns}</b>Runs</div>
      <div><b>${meta.stats.bestAct || 0}</b>Best Act</div>
      <div><b>${meta.stats.bestLevel}</b>Best Level</div>
      <div><b>${meta.gold}</b>Gold</div>
    `;
  }

  showCharacterSelect(characters, onPick) {
    this.hideAllScreens();
    this.show('screen-characters');
    this.el.characterList.innerHTML = '';
    for (const c of characters) {
      const card = document.createElement('div');
      card.className = 'char-card';
      card.innerHTML = `<div class="char-swatch" style="background:${c.color};box-shadow:0 0 16px ${c.color}"></div>
        <h3>${c.name}</h3><p>${c.tagline}</p>`;
      card.addEventListener('click', () => onPick(c.id));
      this.el.characterList.appendChild(card);
    }
  }

  showShop(meta, onBuy) {
    this.hideAllScreens();
    this.show('screen-shop');
    this.renderShop(meta, onBuy);
  }

  renderShop(meta, onBuy) {
    this.el.shopGold.textContent = Math.floor(meta.gold);
    this.el.shopList.innerHTML = '';
    for (const id of Object.keys(META_UPGRADES)) {
      const def = META_UPGRADES[id];
      const level = meta.levels[id] || 0;
      const maxed = level >= def.maxLevel;
      const cost = maxed ? 0 : upgradeCost(def, level);
      const row = document.createElement('div');
      row.className = 'shop-row';
      row.innerHTML = `
        <div class="shop-row-info"><b>${def.name}</b><p>${def.desc}</p></div>
        <div style="display:flex;align-items:center;">
          <span class="shop-row-level">Lv ${level}/${def.maxLevel}</span>
          <button class="btn shop-buy" ${maxed || meta.gold < cost ? 'disabled' : ''}>${maxed ? 'MAX' : `● ${cost}`}</button>
        </div>`;
      const btn = row.querySelector('.shop-buy');
      btn.addEventListener('click', () => { if (onBuy(id)) this.renderShop(meta, onBuy); });
      this.el.shopList.appendChild(row);
    }
  }

  // Generic "pick 1 of N" modal — used for in-combat level-ups, post-node
  // rewards, treasure nodes, and rest-site choices.
  showChoiceModal(title, choices, onPick) {
    this.hideAllScreens();
    this.show('screen-choice');
    this.el.choiceTitle.textContent = title;
    this.el.choiceList.innerHTML = '';
    for (const choice of choices) {
      const icon = iconFor(choice.id);
      const tierColor = TIER_COLORS[choice.tier] || null;
      const card = document.createElement('div');
      card.className = 'choice-card';
      if (tierColor) card.style.borderColor = tierColor + '66';
      card.innerHTML = `
        <div class="choice-icon" style="color:${icon.color};background:${icon.color}22;">${icon.glyph}</div>
        <div class="choice-text">
          <b>${choice.title}</b>
          <span class="sub" ${tierColor ? `style="color:${tierColor}"` : ''}>${choice.subtitle}${choice.tier ? ` · ${choice.tier}` : ''}</span>
          <p>${choice.desc}</p>
        </div>`;
      card.addEventListener('click', () => onPick(choice));
      this.el.choiceList.appendChild(card);
    }
  }

  showMap(run, onPick) {
    this.hideAllScreens();
    this.show('screen-map');
    this.setHudVisible(false);
    const act = run.acts[run.actIndex];
    const step = act.steps[run.stepIndex];
    this.el.mapHeader.textContent = `Act ${act.actNumber} — ${act.biome.name}  ·  Step ${run.stepIndex + 1}/${act.steps.length}`;
    this.el.mapChoices.innerHTML = '';
    for (const node of step.choices) {
      const icon = nodeIconFor(node.type);
      const card = document.createElement('div');
      card.className = 'node-card';
      card.innerHTML = `
        <div class="node-icon" style="color:${icon.color};background:${icon.color}22;border-color:${icon.color}55;">${icon.glyph}</div>
        <b>${node.label}</b>
        <span class="node-type">${node.type}</span>`;
      card.addEventListener('click', () => onPick(node));
      this.el.mapChoices.appendChild(card);
    }
  }

  showNodeShop(state, onBuy, onReroll, onContinue) {
    this.hideAllScreens();
    this.show('screen-node-shop');
    this.renderNodeShop(state, onBuy, onReroll, onContinue);
  }

  renderNodeShop(state, onBuy, onReroll, onContinue) {
    this.el.nodeShopCores.textContent = Math.floor(state.player.cores);
    this.el.nodeShopList.innerHTML = '';
    for (const offer of state.offers) {
      const icon = iconFor(offer.id);
      const tierColor = TIER_COLORS[offer.tier] || null;
      const afford = state.player.cores >= offer.cost;
      const row = document.createElement('div');
      row.className = 'shop-row';
      if (tierColor) row.style.borderColor = tierColor + '66';
      row.innerHTML = `
        <div class="shop-row-info">
          <b style="color:${icon.color}">${icon.glyph} ${offer.title}</b>
          <p ${tierColor ? `style="color:${tierColor}"` : ''}>${offer.subtitle}${offer.tier ? ` · ${offer.tier}` : ''} — ${offer.desc}</p>
        </div>
        <button class="btn shop-buy" ${offer.bought || !afford ? 'disabled' : ''}>${offer.bought ? 'Bought' : `◈ ${offer.cost}`}</button>`;
      const btn = row.querySelector('.shop-buy');
      btn.addEventListener('click', () => onBuy(offer));
      this.el.nodeShopList.appendChild(row);
    }
    this.el.nodeShopRerollCost.textContent = state.rerollCost;
    this.el.btnNodeShopReroll.disabled = state.player.cores < state.rerollCost;
    this.el.btnNodeShopReroll.onclick = onReroll;
    this.el.btnNodeShopContinue.onclick = onContinue;
  }

  showPause() { this.hideAllScreens(); this.show('screen-pause'); }

  showEnd(victory, stats) {
    this.hideAllScreens();
    this.show('screen-end');
    this.el.endTitle.textContent = victory ? 'Run Complete!' : 'You Fell...';
    this.el.endTitle.style.color = victory ? '#7CFC9A' : '#ff5e8a';
    this.el.endStats.innerHTML = `
      <div><b>Act ${stats.actReached}</b>Act Reached</div>
      <div><b>${stats.nodesCleared}</b>Nodes Cleared</div>
      <div><b>${stats.level}</b>Level Reached</div>
      <div><b>${stats.kills}</b>Kills</div>
      <div><b>${formatTime(stats.time)}</b>Time Survived</div>
      <div><b>${stats.goldEarned}</b>Gold Earned</div>
    `;
  }
}

function camel(id) {
  return id.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

const ui = new UI();

// ---- game.js ----
const WORLD_HALF = 2200;

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = 0;
    this.height = 0;

    this.particles = new ParticleSystem();
    this.enemyManager = new EnemyManager(this.particles, audio);
    this.weaponSystem = new WeaponSystem(this.enemyManager, this.particles, audio);
    this.pickups = new PickupManager(this.particles, audio);

    this.meta = loadMeta();
    this.player = null;
    this.state = 'menu';
    this.elapsed = 0; // total time across the whole run (display only)
    this.killCount = 0;

    this.run = null;
    this.currentNode = null;
    this.nodeType = null;
    this.nodeBiome = null;
    this.nodeActNumber = 1;
    this.nodeElapsed = 0;
    this.nodeDuration = 0;

    this.camX = 0; this.camY = 0;
    this.shakeTime = 0; this.shakeMag = 0;

    this.pendingLevelUps = [];
    this.hazards = [];

    this.enemyManager.onDeath = (e) => this.onEnemyDeath(e);
    this.enemyManager.onPlayerHit = (amount, x, y) => this.onPlayerHit(amount, x, y);

    this.bindMenus();
  }

  resize(w, h) { this.width = w; this.height = h; }

  addShake(mag, time) { this.shakeMag = Math.max(this.shakeMag, mag); this.shakeTime = Math.max(this.shakeTime, time); }

  // ---------------- Menu wiring ----------------
  bindMenus() {
    const goToCharacterSelect = () => { audio.uiClick(); ui.showCharacterSelect(listCharacters(), (id) => this.showRelicSelect(id)); };
    ui.el.btnPlay.addEventListener('click', goToCharacterSelect);
    ui.el.btnShop.addEventListener('click', () => { audio.uiClick(); ui.showShop(this.meta, (id) => this.buyMetaUpgrade(id)); });
    ui.el.btnBackChars.addEventListener('click', () => { audio.uiClick(); this.goToMenu(); });
    ui.el.btnBackShop.addEventListener('click', () => { audio.uiClick(); this.goToMenu(); });
    ui.el.btnResume.addEventListener('click', () => { audio.uiClick(); this.resume(); });
    ui.el.btnQuit.addEventListener('click', () => { audio.uiClick(); this.goToMenu(); });
    ui.el.btnRetry.addEventListener('click', goToCharacterSelect);
    ui.el.btnEndMenu.addEventListener('click', () => { audio.uiClick(); this.goToMenu(); });
    ui.el.muteBtn.addEventListener('click', () => {
      this.muted = !this.muted;
      audio.setMuted(this.muted);
      ui.el.muteBtn.textContent = this.muted ? '🔇' : '🔊';
    });
  }

  buyMetaUpgrade(id) {
    const ok = purchaseUpgrade(this.meta, id);
    if (ok) audio.uiClick();
    return ok;
  }

  goToMenu() {
    this.state = 'menu';
    audio.stopMusic();
    ui.showMenu(this.meta);
  }

  runLabel() {
    if (!this.run) return '';
    const act = currentAct(this.run);
    const elements = this.weaponSystem.synergy ? this.weaponSystem.synergy.elementCount : 0;
    return `Act ${act.actNumber} · Node ${this.run.stepIndex + 1}/${act.steps.length} · Elements ${elements}/4`;
  }

  showRelicSelect(characterId) {
    audio.uiClick();
    const choices = listRelics().map(r => ({ kind: 'relic', id: r.id, title: r.name, subtitle: 'Relic', desc: r.desc, tier: 'legendary' }));
    ui.showChoiceModal('Choose a Relic', choices, (choice) => this.startRun(characterId, choice.id));
  }

  // ---------------- Run lifecycle ----------------
  startRun(characterId, relicId) {
    audio.resume();
    const character = getCharacter(characterId);
    const relic = getRelic(relicId);
    const bonuses = getMetaBonuses(this.meta);
    this.player = new Player(character, bonuses, relic);
    this.player.recomputeStats(PASSIVES);
    this.player.hp = this.player.maxHp;

    this.weaponSystem.reset();
    this.weaponSystem.equip(character.startWeapon);

    this.elapsed = 0;
    this.killCount = 0;
    this.run = generateRun();

    this.goToMap();
  }

  goToMap() {
    this.state = 'map';
    ui.showMap(this.run, (node) => this.selectNode(node));
  }

  selectNode(node) {
    audio.uiClick();
    this.currentNode = node;
    if (node.type === 'combat' || node.type === 'elite' || node.type === 'boss') {
      this.beginCombatNode(node);
    } else if (node.type === 'shop') {
      this.beginShopNode(node);
    } else if (node.type === 'treasure') {
      this.beginTreasureNode(node);
    } else if (node.type === 'rest') {
      this.beginRestNode(node);
    }
  }

  beginCombatNode(node) {
    this.enemyManager.reset();
    this.pickups.reset();
    this.particles.clear();

    this.nodeType = node.type;
    this.nodeBiome = node.biome;
    this.nodeActNumber = node.biome.act;
    this.nodeElapsed = 0;
    this.nodeDuration = node.type === 'combat' ? randRange(100, 130) : null;

    this.camX = this.player.x; this.camY = this.player.y;
    this.hazards = this.generateHazards(node.biome, this.player.x, this.player.y);

    if (node.type === 'elite') {
      const elite = this.enemyManager.spawnElite(node.biome, this.player, WORLD_HALF, this.nodeActNumber);
      const affixNames = { explosive: 'Explosive', shielded: 'Shielded', frozenAura: 'Frost Aura' };
      ui.flashBossBanner(`Elite Enemy (${affixNames[elite.affix] || elite.affix})`);
    } else if (node.type === 'boss') {
      this.enemyManager.spawnBoss(node.biome.boss, this.player, WORLD_HALF);
      ui.flashBossBanner(BOSS_TYPES[node.biome.boss].name);
      this.addShake(14, 0.5);
    }

    this.state = 'playing';
    ui.hideAllScreens();
    ui.setHudVisible(true);
    ui.updateHud(this.player, this.elapsed, this.weaponSystem, this.killCount, this.runLabel());
    audio.startMusic();
  }

  // Static terrain hazards scattered around the node's starting position —
  // tactical ground the player has to route around while fighting.
  generateHazards(biome, originX, originY) {
    if (!biome.hazardType) return [];
    const hazards = [];
    const count = 3 + Math.floor(randRange(0, 2));
    for (let i = 0; i < count; i++) {
      const angle = randRange(0, TAU);
      const dist = randRange(280, 650);
      hazards.push({
        x: originX + Math.cos(angle) * dist,
        y: originY + Math.sin(angle) * dist,
        radius: randRange(55, 90),
        type: biome.hazardType,
        tickTimer: 0,
      });
    }
    return hazards;
  }

  updateHazards(dt) {
    if (this.hazards.length === 0) return;
    const p = this.player;
    for (const h of this.hazards) {
      h.tickTimer -= dt;
      const d = Math.hypot(p.x - h.x, p.y - h.y);
      if (d <= h.radius) {
        if (h.tickTimer <= 0) {
          h.tickTimer = 0.5;
          const dmg = h.type === 'fire' ? 7 : 5;
          this.onPlayerHit(dmg, p.x, p.y);
        }
      }
    }
  }

  beginShopNode() {
    this.state = 'nodeShop';
    this._shopRerollCount = 0;
    this.shopState = {
      player: this.player,
      offers: rollShopOffers(this.player, this.weaponSystem, 4).map(o => ({ ...o, bought: false })),
      rerollCost: shopRerollCost(0),
    };
    ui.showNodeShop(this.shopState,
      (offer) => this.buyShopOffer(offer),
      () => this.rerollShop(),
      () => { this.run.nodesCleared += 1; this.advanceRun(); });
  }

  buyShopOffer(offer) {
    if (offer.bought || this.player.cores < offer.cost) return;
    this.player.cores -= offer.cost;
    applyUpgradeChoice(offer, this.player, this.weaponSystem);
    offer.bought = true;
    audio.pickup();
    ui.renderNodeShop(this.shopState,
      (o) => this.buyShopOffer(o),
      () => this.rerollShop(),
      () => { this.run.nodesCleared += 1; this.advanceRun(); });
  }

  rerollShop() {
    const cost = this.shopState.rerollCost;
    if (this.player.cores < cost) return;
    this.player.cores -= cost;
    this._shopRerollCount += 1;
    this.shopState.offers = rollShopOffers(this.player, this.weaponSystem, 4).map(o => ({ ...o, bought: false }));
    this.shopState.rerollCost = shopRerollCost(this._shopRerollCount);
    audio.uiClick();
    ui.renderNodeShop(this.shopState,
      (o) => this.buyShopOffer(o),
      () => this.rerollShop(),
      () => { this.run.nodesCleared += 1; this.advanceRun(); });
  }

  beginTreasureNode() {
    this.state = 'nodeChoice';
    const choices = rollUpgradeChoices(this.player, this.weaponSystem, 3);
    ui.showChoiceModal('Treasure Found', choices, (choice) => {
      applyUpgradeChoice(choice, this.player, this.weaponSystem);
      this.run.nodesCleared += 1;
      audio.pickup();
      this.advanceRun();
    });
  }

  beginRestNode() {
    this.state = 'nodeChoice';
    const healAmt = Math.round(this.player.maxHp * 0.35);
    const choices = [
      { kind: 'restHeal', id: 'vitality', title: 'Rest & Heal', subtitle: `+${healAmt} HP`, desc: 'Patch up before the next fight.' },
      { kind: 'restTemper', id: 'might', title: 'Temper Gear', subtitle: '+5% Might', desc: 'Sharpen your weapons instead of resting.' },
    ];
    ui.showChoiceModal('Safehouse', choices, (choice) => {
      if (choice.kind === 'restHeal') {
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + healAmt);
      } else {
        this.player.baseMight *= 1.05;
        this.player.recomputeStats(PASSIVES);
      }
      this.run.nodesCleared += 1;
      audio.levelUp();
      this.advanceRun();
    });
  }

  onCombatNodeCleared() {
    this.run.nodesCleared += 1;
    this.state = 'nodeChoice';
    audio.levelUp();
    this.addShake(6, 0.25);
    const choices = rollUpgradeChoices(this.player, this.weaponSystem, 3);
    ui.showChoiceModal('Node Cleared!', choices, (choice) => {
      applyUpgradeChoice(choice, this.player, this.weaponSystem);
      this.advanceRun();
    });
  }

  advanceRun() {
    this.run.stepIndex += 1;
    if (this.run.stepIndex >= currentAct(this.run).steps.length) {
      if (isLastAct(this.run)) { this.endRun(true); return; }
      this.run.actIndex += 1;
      this.run.stepIndex = 0;
      this.player.hp = this.player.maxHp; // breather between acts
    }
    this.goToMap();
  }

  togglePause() {
    if (this.state === 'playing') { this.state = 'paused'; ui.showPause(); }
    else if (this.state === 'paused') this.resume();
  }

  resume() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    ui.hideAllScreens();
    ui.setHudVisible(true);
  }

  endRun(victory) {
    this.state = victory ? 'victory' : 'gameover';
    audio.stopMusic();
    if (victory) audio.victory(); else audio.gameOver();
    const actReached = this.run.actIndex + 1;
    const goldEarned = Math.floor(
      this.player.cores * 0.5 + this.run.nodesCleared * 12 + this.run.actIndex * 60 + (victory ? 150 : 0)
    );
    const stats = {
      time: this.elapsed, level: this.player.level, kills: this.killCount,
      actReached, nodesCleared: this.run.nodesCleared, goldEarned,
    };
    recordRunResult(this.meta, stats);
    ui.setHudVisible(false);
    ui.showEnd(victory, stats);
  }

  // ---------------- Event callbacks ----------------
  onEnemyDeath(e) {
    this.killCount += 1;
    this.pickups.spawnXp(e.x, e.y, e.xp);
    const coreChance = e.isBoss ? 1 : (e.isElite ? 0.9 : 0.16 * clamp(this.player.luck, 0.5, 3));
    if (Math.random() < coreChance) {
      const value = e.isBoss ? randRange(30, 60) : (e.isElite ? randRange(15, 28) : randRange(1, 4));
      this.pickups.spawnCores(e.x, e.y, value);
    }
    this.particles.burst(e.x, e.y, { count: e.isBoss ? 40 : (e.isElite ? 24 : 10), color: e.color, speed: e.isBoss ? 260 : 140, life: 0.5, glow: true });
    if (audio) audio.enemyDeath();
    if (e.isBoss) this.addShake(16, 0.6);

    if (e.affix === 'explosive') {
      const d = Math.hypot(this.player.x - e.x, this.player.y - e.y);
      if (d < 150) this.onPlayerHit(35, e.x, e.y);
      this.particles.burst(e.x, e.y, { count: 30, color: '#ffb14a', speed: 300, life: 0.6, glow: true });
      audio.explosion();
      this.addShake(12, 0.4);
    }
  }

  onPlayerHit(amount, x, y) {
    const dealt = this.player.takeDamage(amount);
    if (dealt > 0) {
      this.particles.burst(x, y, { count: 6, color: '#ff5e8a', speed: 100, life: 0.3 });
      audio.playerHurt();
      this.addShake(9, 0.25);
    }
    if (this.player.dead) this.endRun(false);
  }

  onPickupCollect(g) {
    if (g.kind === 'xp') {
      const levels = this.player.gainXp(g.value);
      this.particles.spark(g.x, g.y, 0, '#5ee6ff', 3);
      if (levels) this.queueLevelUps(levels.length);
    } else {
      this.player.cores += g.value;
      this.particles.spark(g.x, g.y, 0, '#ffd54a', 3);
    }
  }

  queueLevelUps(count) {
    for (let i = 0; i < count; i++) this.pendingLevelUps.push(true);
    if (this.state === 'playing') this.presentNextLevelUp();
  }

  presentNextLevelUp() {
    if (this.pendingLevelUps.length === 0) return;
    this.pendingLevelUps.pop();
    this.state = 'levelup';
    audio.levelUp();
    this.addShake(4, 0.2);
    const choices = rollUpgradeChoices(this.player, this.weaponSystem, 3);
    ui.showChoiceModal('Level Up!', choices, (choice) => {
      applyUpgradeChoice(choice, this.player, this.weaponSystem);
      if (this.pendingLevelUps.length > 0) {
        this.presentNextLevelUp();
      } else {
        this.state = 'playing';
        ui.hideAllScreens();
        ui.setHudVisible(true);
      }
    });
  }

  // ---------------- Main loop ----------------
  update(dt, input) {
    if (this.state !== 'playing') return;

    this.elapsed += dt;
    this.nodeElapsed += dt;

    const elite = this.enemyManager.activeElite;
    this.player.auraSlowMult = (elite && elite.affix === 'frozenAura' && Math.hypot(this.player.x - elite.x, this.player.y - elite.y) < 220) ? 0.6 : 1;

    this.player.update(dt, input, WORLD_HALF);
    this.updateHazards(dt);
    this.enemyManager.update(dt, this.nodeElapsed, this.player, WORLD_HALF, this.nodeBiome, this.nodeActNumber, this.nodeType === 'combat');
    this.weaponSystem.update(dt, this.player);
    this.weaponSystem.checkEvolutions(this.player);
    this.pickups.update(dt, this.player, (g) => this.onPickupCollect(g));
    this.particles.update(dt);

    const camK = 1 - Math.exp(-6 * dt);
    this.camX += (this.player.x - this.camX) * camK;
    this.camY += (this.player.y - this.camY) * camK;

    if (this.shakeTime > 0) this.shakeTime -= dt;

    ui.updateHud(this.player, this.elapsed, this.weaponSystem, this.killCount, this.runLabel());

    if (this.player.dead) return; // onPlayerHit already triggered endRun

    if (this.nodeType === 'combat' && this.nodeElapsed >= this.nodeDuration) this.onCombatNodeCleared();
    else if (this.nodeType === 'elite' && !this.enemyManager.activeElite) this.onCombatNodeCleared();
    else if (this.nodeType === 'boss' && !this.enemyManager.activeBoss) this.onCombatNodeCleared();
  }

  // ---------------- Rendering ----------------
  render() {
    const ctx = this.ctx;
    ctx.save();
    const bg = (this.nodeBiome && this.state === 'playing') ? this.nodeBiome.bg : '#05060f';
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, this.width, this.height);

    let sx = 0, sy = 0;
    if (this.shakeTime > 0) {
      const f = this.shakeTime * this.shakeMag;
      sx = randRange(-f, f); sy = randRange(-f, f);
    } else {
      this.shakeMag = 0;
    }

    ctx.translate(this.width / 2 + sx, this.height / 2 + sy);

    const camX = this.camX, camY = this.camY;
    this.drawBackground(ctx, camX, camY);
    this.drawHazards(ctx, camX, camY);

    if (this.player) {
      this.pickups.render(ctx, camX, camY);
      this.enemyManager.render(ctx, camX, camY);
      this.weaponSystem.render(ctx, camX, camY, this.player);
      this.drawPlayer(ctx, camX, camY);
      this.particles.render(ctx);
    }

    ctx.restore();
  }

  drawBackground(ctx, camX, camY) {
    const biome = this.nodeBiome;
    const gridColor = biome ? biome.grid : 'rgba(94, 230, 255, 0.06)';
    const accent = biome ? biome.accent : '#c98cff';
    const spacing = 64;
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    const halfW = this.width / 2, halfH = this.height / 2;
    const startX = -halfW - ((camX + halfW) % spacing);
    const startY = -halfH - ((camY + halfH) % spacing);
    ctx.beginPath();
    for (let x = startX; x < halfW; x += spacing) { ctx.moveTo(x, -halfH); ctx.lineTo(x, halfH); }
    for (let y = startY; y < halfH; y += spacing) { ctx.moveTo(-halfW, y); ctx.lineTo(halfW, y); }
    ctx.stroke();

    // World boundary
    const left = -WORLD_HALF - camX, right = WORLD_HALF - camX;
    const top = -WORLD_HALF - camY, bottom = WORLD_HALF - camY;
    ctx.strokeStyle = accent + '59';
    ctx.shadowColor = accent;
    ctx.shadowBlur = 20;
    ctx.lineWidth = 4;
    ctx.strokeRect(left, top, right - left, bottom - top);
    ctx.shadowBlur = 0;
  }

  drawHazards(ctx, camX, camY) {
    if (this.hazards.length === 0) return;
    const color = { poison: '#7CFC9A', fire: '#ff8a5e' };
    for (const h of this.hazards) {
      const sx = h.x - camX, sy = h.y - camY;
      const c = color[h.type] || '#ffffff';
      const pulse = 0.85 + 0.15 * Math.sin(this.elapsed * 3 + h.x * 0.01);
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = c;
      ctx.shadowColor = c;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(sx, sy, h.radius * pulse, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = c;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }
  }

  drawPlayer(ctx, camX, camY) {
    const p = this.player;
    const sx = p.x - camX, sy = p.y - camY;
    ctx.save();
    ctx.translate(sx, sy);

    const flicker = p.invulnTimer > 0 && Math.floor(p.invulnTimer * 20) % 2 === 0;
    ctx.globalAlpha = flicker ? 0.4 : 1;

    ctx.rotate(p.facing);
    ctx.shadowColor = p.char.color;
    ctx.shadowBlur = 18;
    ctx.fillStyle = p.hurtFlash > 0 ? '#ffffff' : p.char.color;
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(-12, 11);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-12, -11);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Soft ground glow beneath player
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = p.char.color;
    ctx.shadowColor = p.char.color;
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.ellipse(sx, sy + 4, 16, 7, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

// ---- main.js ----
const canvas = document.getElementById('game-canvas');
const game = new Game(canvas);
window.__game = game; // debug hook for automated/manual testing in the console

const input = { left: false, right: false, up: false, down: false, dashPressed: false };

const KEY_MAP = {
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
};

window.addEventListener('keydown', (e) => {
  const dir = KEY_MAP[e.code];
  if (dir) { input[dir] = true; e.preventDefault(); }
  if (e.code === 'Escape' || e.code === 'KeyP') {
    if (game.state === 'playing' || game.state === 'paused') game.togglePause();
  }
  if (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
    input.dashPressed = true;
    e.preventDefault();
  }
});

window.addEventListener('keyup', (e) => {
  const dir = KEY_MAP[e.code];
  if (dir) { input[dir] = false; e.preventDefault(); }
});

// Touch / on-screen fallback: simple drag-to-move using a virtual joystick
// centered on the first touch point, so the game is playable without a keyboard.
let touchOrigin = null;
canvas.addEventListener('touchstart', (e) => {
  const t = e.changedTouches[0];
  touchOrigin = { x: t.clientX, y: t.clientY, id: t.identifier };
  e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
  if (!touchOrigin) return;
  const t = [...e.changedTouches].find(tt => tt.identifier === touchOrigin.id);
  if (!t) return;
  const dx = t.clientX - touchOrigin.x, dy = t.clientY - touchOrigin.y;
  const dead = 8;
  input.left = dx < -dead; input.right = dx > dead;
  input.up = dy < -dead; input.down = dy > dead;
  e.preventDefault();
}, { passive: false });

function clearTouch() {
  touchOrigin = null;
  input.left = input.right = input.up = input.down = false;
}
canvas.addEventListener('touchend', clearTouch);
canvas.addEventListener('touchcancel', clearTouch);

function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = window.innerWidth, h = window.innerHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  game.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  game.resize(w, h);
}
window.addEventListener('resize', resize);
resize();

document.addEventListener('visibilitychange', () => {
  if (document.hidden && game.state === 'playing') game.togglePause();
});

ui.showMenu(game.meta);

let last = performance.now();
function loop(now) {
  let dt = (now - last) / 1000;
  last = now;
  dt = Math.min(dt, 1 / 20); // clamp to avoid spiral-of-death after a tab switch / stall
  game.update(dt, input);
  input.dashPressed = false; // edge-triggered: consumed once per keypress, not held
  game.render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
