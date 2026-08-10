import { Pool, randRange, TAU } from './utils.js';

function makeParticle() {
  return { x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1, size: 2, color: '#fff', drag: 0.94, gravity: 0, __alive: true, glow: false };
}

export class ParticleSystem {
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
