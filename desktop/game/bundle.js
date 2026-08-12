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

class Player {
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

// ---- enemyData.js ----
// Enemy archetypes. `hp`/`damage`/`speed` are base values at t=0; the spawner
// scales them up over the run's duration. `behavior` selects an update
// function in enemies.js.
const ENEMY_TYPES = {
  crawler: {
    id: 'crawler', name: 'Crawler', behavior: 'chase',
    hp: 14, speed: 95, damage: 8, radius: 12, xp: 1, color: '#7CFC9A', glow: '#2f7a45',
    unlockAt: 0, weight: 10,
  },
  sprinter: {
    id: 'sprinter', name: 'Sprinter', behavior: 'chase',
    hp: 9, speed: 190, damage: 6, radius: 9, xp: 1, color: '#FFE066', glow: '#8a7a1f',
    unlockAt: 60, weight: 6,
  },
  brute: {
    id: 'brute', name: 'Brute', behavior: 'chase',
    hp: 70, speed: 65, damage: 18, radius: 20, xp: 4, color: '#FF6B6B', glow: '#7a2020',
    unlockAt: 150, weight: 4,
  },
  spitter: {
    id: 'spitter', name: 'Spitter', behavior: 'ranged',
    hp: 20, speed: 70, damage: 10, radius: 11, xp: 2, color: '#c98cff', glow: '#5a2f7a',
    unlockAt: 240, weight: 5, range: 320, fireRate: 1.6, projSpeed: 190,
  },
  swarmling: {
    id: 'swarmling', name: 'Swarmling', behavior: 'chase',
    hp: 4, speed: 130, damage: 4, radius: 6, xp: 1, color: '#5ee6ff', glow: '#1f5a6b',
    unlockAt: 90, weight: 8, spawnsInGroups: true,
  },
};

const BOSS_TYPES = {
  warden: {
    id: 'warden', name: 'The Warden', behavior: 'boss_warden',
    hp: 900, speed: 78, damage: 14, radius: 34, xp: 40, color: '#ff5e8a', glow: '#7a1f3a',
    slamRange: 90, slamDamage: 28, slamCooldown: 2.6, summonCooldown: 7,
  },
  eclipse: {
    id: 'eclipse', name: 'The Eclipse', behavior: 'boss_eclipse',
    hp: 2600, speed: 90, damage: 16, radius: 42, xp: 120, color: '#ffb14a', glow: '#7a4a1f',
    burstCooldown: 3.2, burstCount: 16, dashCooldown: 5,
  },
};

// Time (seconds) -> boss id. Runs cap difficulty escalation shortly after the last one.
const BOSS_SCHEDULE = [
  { time: 180, id: 'warden' },
  { time: 420, id: 'eclipse' },
];

const RUN_LENGTH = 600; // 10 minutes to a clean "Victory" screen

// ---- enemies.js ----
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

class EnemyManager {
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

// ---- weapons.js ----
// ---- Weapon definitions -----------------------------------------------
// getStats(level, player) returns the numbers a fire/update call needs.
// `evolvesInto` + `evolutionRequires` drive the evolution check.
const WEAPONS = {
  shardCannon: {
    id: 'shardCannon', name: 'Shard Cannon', maxLevel: 8,
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
    id: 'pulseBlade', name: 'Pulse Blade', maxLevel: 8,
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
    id: 'orbitDrones', name: 'Orbit Drones', maxLevel: 8,
    desc: 'Orbiting drones that shred anything they touch.',
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
    id: 'novaBurst', name: 'Nova Burst', maxLevel: 8,
    desc: 'Periodic shockwave around you.',
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
    id: 'homingMissile', name: 'Homing Missile', maxLevel: 8,
    desc: 'Slow but relentless tracking missiles.',
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
    id: 'chainLightning', name: 'Chain Lightning', maxLevel: 8,
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
  return { x: 0, y: 0, vx: 0, vy: 0, damage: 0, pierceLeft: 0, radius: 6, life: 3, color: '#5ee6ff', kind: 'bullet', hitSet: null, evolvedSplit: false, __alive: true, splash: 0, targetRef: null, turnRate: 0, speed: 0 };
}

function makeEffect() {
  return { kind: 'arc', x: 0, y: 0, angle: 0, arc: 0, range: 0, life: 0.15, maxLife: 0.15, damage: 0, color: '#fff', hitSet: null, radius: 0, growTo: 0, __alive: true, points: null };
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
        damage: opts.damage ?? 0, color: opts.color ?? '#fff', radius: opts.radius ?? 0,
        growTo: opts.growTo ?? 0, points: opts.points ?? null,
      });
      e.hitSet = e.hitSet || new Set();
      e.hitSet.clear();
    });
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
    for (const slot of this.slots) {
      const def = WEAPONS[slot.id];
      const stats = def.getStats(slot.level, player);
      if (slot.evolved) applyEvolutionBuffs(slot.id, stats);

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
        damage: stats.damage, pierce: stats.pierce, radius: 6, life: 2.2,
        color: slot.evolved ? '#ffd54a' : '#5ee6ff', kind: 'bullet', evolvedSplit: slot.evolved,
      });
    }
    if (this.audio) this.audio.shoot();
  }

  firePulseBlade(slot, stats, player) {
    const arc = slot.evolved ? TAU : stats.arc;
    this.effects.spawn({
      kind: 'arc', x: player.x, y: player.y, angle: player.facing, arc,
      range: stats.range, life: 0.16, damage: stats.damage, color: slot.evolved ? '#ffd54a' : '#ff8a5e',
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
      this.enemyManager.damageEnemy(e, stats.damage, a, knock);
      this.particles.damageText(e.x, e.y - 10, stats.damage);
    });
    if (this.audio) this.audio.explosion();
  }

  fireHomingMissile(slot, stats, player) {
    for (let i = 0; i < stats.count; i++) {
      const target = this.enemyManager.nearest(player.x, player.y, 1400);
      const a = target ? angleTo(player.x, player.y, target.x, target.y) : randRange(0, TAU);
      this.bullets.spawn({
        x: player.x, y: player.y, vx: Math.cos(a) * stats.speed, vy: Math.sin(a) * stats.speed,
        damage: stats.damage, pierce: 0, radius: 7, life: 4,
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
      this.enemyManager.damageEnemy(current, dmg, angleTo(originX, originY, current.x, current.y), 60);
      this.particles.damageText(current.x, current.y - 10, dmg);
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
          this.enemyManager.damageEnemy(e, stats.damage, angleTo(ox, oy, e.x, e.y), 90);
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
        this.enemyManager.damageEnemy(hitOne, b.damage, a, 120);
        this.particles.damageText(hitOne.x, hitOne.y - 10, b.damage);
        this.particles.spark(b.x, b.y, Math.atan2(b.vy, b.vx), b.color, 4);

        if (b.kind === 'missile') {
          this.enemyManager.queryNearby(b.x, b.y, b.splash, (e2) => {
            if (e2 === hitOne) return;
            this.enemyManager.damageEnemy(e2, b.damage * 0.6, angleTo(b.x, b.y, e2.x, e2.y), 80);
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
            this.enemyManager.damageEnemy(en, e.damage, a, 150);
            this.particles.damageText(en.x, en.y - 10, e.damage);
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
// Passive ids intentionally match each weapon's `evolutionRequires`.
const PASSIVES = {
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
function rollUpgradeChoices(player, weaponSystem, n = 3) {
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
    case 'gold':
      player.gold += 50;
      break;
  }
  weaponSystem.checkEvolutions(player);
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
      g.color = kind === 'gold' ? '#ffd54a' : (value >= 5 ? '#c98cff' : '#5ee6ff');
      g.radius = kind === 'gold' ? 6 : (value >= 5 ? 7 : 5);
      g.vx = 0; g.vy = 0; g.attracted = false; g.bob = Math.random() * TAU;
    });
  }

  reset() { this.pool.clear(); }

  spawnXp(x, y, value) { this.pool.spawn(x, y, value, 'xp'); }
  spawnGold(x, y, value) { this.pool.spawn(x, y, value, 'gold'); }

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
      if (g.kind === 'gold') {
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
    stats: { totalRuns: 0, bestTime: 0, bestLevel: 0, totalKills: 0 },
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

function recordRunResult(meta, { time, level, kills, goldEarned }) {
  meta.gold += goldEarned;
  meta.stats.totalRuns += 1;
  meta.stats.bestTime = Math.max(meta.stats.bestTime, time);
  meta.stats.bestLevel = Math.max(meta.stats.bestLevel, level);
  meta.stats.totalKills += kills;
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
  gold: { glyph: '●', color: '#ffd54a' },
};

function iconFor(id) { return ICONS[id] || { glyph: '?', color: '#fff' }; }

class UI {
  constructor() {
    this.el = {};
    [
      'hud', 'hp-bar', 'hp-label', 'xp-bar', 'timer', 'gold-val', 'level-badge', 'weapon-tray',
      'boss-banner', 'kill-counter',
      'screen-menu', 'btn-play', 'btn-shop', 'menu-stats',
      'screen-characters', 'character-list', 'btn-back-chars',
      'screen-shop', 'shop-list', 'shop-gold', 'btn-back-shop',
      'screen-levelup', 'levelup-choices',
      'screen-pause', 'btn-resume', 'btn-quit',
      'screen-end', 'end-title', 'end-stats', 'btn-retry', 'btn-end-menu',
      'mute-btn',
    ].forEach((id) => { this.el[camel(id)] = document.getElementById(id); });

    this.screens = ['screen-menu', 'screen-characters', 'screen-shop', 'screen-levelup', 'screen-pause', 'screen-end']
      .map(id => document.getElementById(id));
  }

  hideAllScreens() { this.screens.forEach(s => s.classList.add('hidden')); }
  show(id) { document.getElementById(id).classList.remove('hidden'); }

  setHudVisible(visible) { this.el.hud.classList.toggle('hidden', !visible); }

  updateHud(player, elapsed, weaponSystem, killCount) {
    const hpPct = clamp(player.hp / player.maxHp, 0, 1);
    this.el.hpBar.style.transform = `scaleX(${hpPct})`;
    this.el.hpLabel.textContent = `${Math.ceil(player.hp)} / ${Math.round(player.maxHp)}`;
    const xpPct = clamp(player.xp / player.xpToNext, 0, 1);
    this.el.xpBar.style.transform = `scaleX(${xpPct})`;
    this.el.timer.textContent = formatTime(elapsed);
    this.el.goldVal.textContent = Math.floor(player.gold);
    this.el.levelBadge.textContent = `Lv ${player.level}`;
    this.el.killCounter.textContent = `Kills: ${killCount}`;
    this.el.killCounter.classList.remove('hidden');

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
    this.el.menuStats.innerHTML = `
      <div><b>${meta.stats.totalRuns}</b>Runs</div>
      <div><b>${formatTime(meta.stats.bestTime)}</b>Best Time</div>
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

  showLevelUp(choices, onPick) {
    this.hideAllScreens();
    this.show('screen-levelup');
    this.el.levelupChoices.innerHTML = '';
    for (const choice of choices) {
      const icon = iconFor(choice.id);
      const card = document.createElement('div');
      card.className = 'choice-card';
      card.innerHTML = `
        <div class="choice-icon" style="color:${icon.color};background:${icon.color}22;">${icon.glyph}</div>
        <div class="choice-text">
          <b>${choice.title}</b>
          <span class="sub">${choice.subtitle}</span>
          <p>${choice.desc}</p>
        </div>`;
      card.addEventListener('click', () => onPick(choice));
      this.el.levelupChoices.appendChild(card);
    }
  }

  showPause() { this.hideAllScreens(); this.show('screen-pause'); }

  showEnd(victory, stats) {
    this.hideAllScreens();
    this.show('screen-end');
    this.el.endTitle.textContent = victory ? 'You Survived!' : 'You Fell...';
    this.el.endTitle.style.color = victory ? '#7CFC9A' : '#ff5e8a';
    this.el.endStats.innerHTML = `
      <div><b>${formatTime(stats.time)}</b>Time Survived</div>
      <div><b>${stats.level}</b>Level Reached</div>
      <div><b>${stats.kills}</b>Kills</div>
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
    this.elapsed = 0;
    this.killCount = 0;
    this.goldEarnedThisRun = 0;

    this.camX = 0; this.camY = 0;
    this.shakeTime = 0; this.shakeMag = 0;
    this.bgOffset = 0;

    this.pendingLevelUps = [];

    this.enemyManager.onDeath = (e) => this.onEnemyDeath(e);
    this.enemyManager.onPlayerHit = (amount, x, y) => this.onPlayerHit(amount, x, y);
    this.enemyManager.onBossSpawned = (name) => { ui.flashBossBanner(name); this.addShake(14, 0.5); };

    this.bindMenus();
  }

  resize(w, h) { this.width = w; this.height = h; }

  addShake(mag, time) { this.shakeMag = Math.max(this.shakeMag, mag); this.shakeTime = Math.max(this.shakeTime, time); }

  // ---------------- Menu wiring ----------------
  bindMenus() {
    ui.el.btnPlay.addEventListener('click', () => { audio.uiClick(); ui.showCharacterSelect(listCharacters(), (id) => this.startRun(id)); });
    ui.el.btnShop.addEventListener('click', () => { audio.uiClick(); ui.showShop(this.meta, (id) => this.buyMetaUpgrade(id)); });
    ui.el.btnBackChars.addEventListener('click', () => { audio.uiClick(); this.goToMenu(); });
    ui.el.btnBackShop.addEventListener('click', () => { audio.uiClick(); this.goToMenu(); });
    ui.el.btnResume.addEventListener('click', () => { audio.uiClick(); this.resume(); });
    ui.el.btnQuit.addEventListener('click', () => { audio.uiClick(); this.goToMenu(); });
    ui.el.btnRetry.addEventListener('click', () => { audio.uiClick(); ui.showCharacterSelect(listCharacters(), (id) => this.startRun(id)); });
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

  // ---------------- Run lifecycle ----------------
  startRun(characterId) {
    audio.resume();
    const character = getCharacter(characterId);
    const bonuses = getMetaBonuses(this.meta);
    this.player = new Player(character, bonuses);
    this.player.recomputeStats(PASSIVES);
    this.player.hp = this.player.maxHp;

    this.enemyManager.reset();
    this.weaponSystem.reset();
    this.pickups.reset();
    this.particles.clear();

    this.weaponSystem.equip(character.startWeapon);

    this.elapsed = 0;
    this.killCount = 0;
    this.goldEarnedThisRun = 0;
    this.camX = this.player.x; this.camY = this.player.y;

    this.state = 'playing';
    ui.hideAllScreens();
    ui.setHudVisible(true);
    ui.updateHud(this.player, this.elapsed, this.weaponSystem, this.killCount);
    audio.startMusic();
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
    const stats = { time: this.elapsed, level: this.player.level, kills: this.killCount, goldEarned: Math.floor(this.goldEarnedThisRun) };
    recordRunResult(this.meta, stats);
    ui.setHudVisible(false);
    ui.showEnd(victory, stats);
  }

  // ---------------- Event callbacks ----------------
  onEnemyDeath(e) {
    this.killCount += 1;
    this.pickups.spawnXp(e.x, e.y, e.xp);
    const goldChance = e.isBoss ? 1 : 0.16 * clamp(this.player.luck, 0.5, 3);
    if (Math.random() < goldChance) {
      this.pickups.spawnGold(e.x, e.y, e.isBoss ? randRange(30, 60) : randRange(1, 4));
    }
    this.particles.burst(e.x, e.y, { count: e.isBoss ? 40 : 10, color: e.color, speed: e.isBoss ? 260 : 140, life: 0.5, glow: true });
    if (audio) audio.enemyDeath();
    if (e.isBoss) this.addShake(16, 0.6);
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
      this.player.gold += g.value;
      this.goldEarnedThisRun += g.value;
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
    ui.showLevelUp(choices, (choice) => {
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
    this.player.update(dt, input, WORLD_HALF);
    this.enemyManager.update(dt, this.elapsed, this.player, WORLD_HALF);
    this.weaponSystem.update(dt, this.player);
    this.weaponSystem.checkEvolutions(this.player);
    this.pickups.update(dt, this.player, (g) => this.onPickupCollect(g));
    this.particles.update(dt);

    const camK = 1 - Math.exp(-6 * dt);
    this.camX += (this.player.x - this.camX) * camK;
    this.camY += (this.player.y - this.camY) * camK;

    if (this.shakeTime > 0) this.shakeTime -= dt;

    ui.updateHud(this.player, this.elapsed, this.weaponSystem, this.killCount);

    if (this.elapsed >= RUN_LENGTH) this.endRun(true);
  }

  // ---------------- Rendering ----------------
  render() {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = '#05060f';
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
    const spacing = 64;
    ctx.strokeStyle = 'rgba(94, 230, 255, 0.06)';
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
    ctx.strokeStyle = 'rgba(201, 140, 255, 0.35)';
    ctx.shadowColor = '#c98cff';
    ctx.shadowBlur = 20;
    ctx.lineWidth = 4;
    ctx.strokeRect(left, top, right - left, bottom - top);
    ctx.shadowBlur = 0;
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

const input = { left: false, right: false, up: false, down: false };

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
  game.render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
