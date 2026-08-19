// ---- Math & general helpers ----------------------------------------------

export const TAU = Math.PI * 2;
export const WORLD_HALF = 2200; // shared arena half-extent, used by Game, EnemyManager, and WeaponSystem (ricochet bounces)

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function dist2(ax, ay, bx, by) {
  const dx = ax - bx, dy = ay - by;
  return dx * dx + dy * dy;
}

export function dist(ax, ay, bx, by) {
  return Math.sqrt(dist2(ax, ay, bx, by));
}

export function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

// Mulberry32 seeded PRNG so runs can be reproduced/debugged if needed.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The whole codebase draws randomness through this one `rng()` function
// rather than calling makeRng() output directly, so a run can be reseeded
// (see seedRng below) without touching any other call site.
let _rngImpl = makeRng(Date.now() & 0xffffffff);
export function rng() { return _rngImpl(); }

export function seedRng(seed) {
  _rngImpl = makeRng(seed >>> 0);
}

// Small string hash so a player can type a word as a seed, not just a number.
export function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return h >>> 0;
}

export function randRange(min, max) {
  return min + rng() * (max - min);
}

export function randInt(min, max) {
  return Math.floor(randRange(min, max + 1));
}

export function pick(arr) {
  return arr[Math.floor(rng() * arr.length)];
}

// Weighted pick: items = [{weight, value}]
export function weightedPick(items) {
  let total = 0;
  for (const it of items) total += it.weight;
  let r = rng() * total;
  for (const it of items) {
    if ((r -= it.weight) <= 0) return it.value;
  }
  return items[items.length - 1].value;
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const num = parseInt(v, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function mixColor(hex, target, amt) {
  const [r, g, b] = hexToRgb(hex);
  const mr = Math.round(r + (target[0] - r) * amt);
  const mg = Math.round(g + (target[1] - g) * amt);
  const mb = Math.round(b + (target[2] - b) * amt);
  return `rgb(${mr},${mg},${mb})`;
}

// A cheap "beveled" look for a flat-colored shape: a radial gradient offset
// toward the upper-left (a fixed implied light source) so every ship/enemy
// body reads as a lit, faceted solid instead of a flat silhouette — without
// touching any of the individual model-drawing functions. Call with ctx
// already translated to the shape's local origin.
export function shadeFill(ctx, radius, color) {
  const g = ctx.createRadialGradient(-radius * 0.35, -radius * 0.35, radius * 0.1, 0, 0, radius * 1.35);
  g.addColorStop(0, mixColor(color, [255, 255, 255], 0.45));
  g.addColorStop(0.55, color);
  g.addColorStop(1, mixColor(color, [0, 0, 0], 0.4));
  return g;
}

// Real generated surface texture — not a gradient — drawn once to a small
// offscreen tile and cached as a repeating CanvasPattern, since generating
// per-pixel noise every frame would be far too slow. 'hull' gives a
// mechanical brushed-metal/panel-hatch look (ships, bosses, armored
// enemies); 'organic' gives a mottled scale/chitin look (bio enemies).
// Caller draws this at low alpha over an existing fill as a grain pass.
const _patternCache = new Map();
export function texturePattern(ctx, color, kind = 'organic') {
  const key = kind + color;
  let cached = _patternCache.get(key);
  if (cached) return cached;

  const size = 28;
  const tile = document.createElement('canvas');
  tile.width = size; tile.height = size;
  const tctx = tile.getContext('2d');
  const [r, g, b] = hexToRgb(color);
  const dark = `rgba(${Math.round(r * 0.35)},${Math.round(g * 0.35)},${Math.round(b * 0.35)},0.9)`;
  const light = `rgba(255,255,255,0.5)`;

  if (kind === 'hull') {
    // Diagonal brushed-panel hatching with a couple of seam lines.
    tctx.strokeStyle = dark;
    tctx.lineWidth = 1;
    for (let i = -size; i < size * 2; i += 4) {
      tctx.beginPath();
      tctx.moveTo(i, 0);
      tctx.lineTo(i + size, size);
      tctx.stroke();
    }
    tctx.strokeStyle = light;
    tctx.globalAlpha = 0.35;
    tctx.beginPath();
    tctx.moveTo(0, size * 0.3); tctx.lineTo(size, size * 0.3);
    tctx.moveTo(0, size * 0.75); tctx.lineTo(size, size * 0.75);
    tctx.stroke();
  } else {
    // Overlapping scale/chitin blotches (deterministic pseudo-random via a
    // fixed seed sequence, so the tile is stable across cache hits).
    let seed = 1337;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 14; i++) {
      const x = rnd() * size, y = rnd() * size, rad = 2 + rnd() * 3;
      tctx.fillStyle = rnd() > 0.5 ? dark : light;
      tctx.globalAlpha = 0.25 + rnd() * 0.25;
      tctx.beginPath();
      tctx.ellipse(x, y, rad, rad * 0.7, rnd() * TAU, 0, TAU);
      tctx.fill();
    }
  }

  const pattern = ctx.createPattern(tile, 'repeat');
  _patternCache.set(key, pattern);
  return pattern;
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ---- Object pool -----------------------------------------------------------
// Reuses dead objects instead of allocating new ones every frame, which
// matters a lot once hundreds of projectiles/particles are alive at once.
export class Pool {
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
export class SpatialGrid {
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
