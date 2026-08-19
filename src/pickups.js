import { Pool, dist2, angleTo, TAU } from './utils.js';

function makeGem() {
  return { x: 0, y: 0, value: 1, radius: 5, color: '#5ee6ff', kind: 'xp', vx: 0, vy: 0, attracted: false, bob: 0, __alive: true };
}

export class PickupManager {
  constructor(particles, audio) {
    this.particles = particles;
    this.audio = audio;
    this.pool = new Pool(makeGem, (g, x, y, value, kind) => {
      g.x = x; g.y = y; g.value = value; g.kind = kind;
      g.color = kind === 'cores' ? '#ffd54a' : kind === 'canister' ? '#7CFC9A' : (value >= 5 ? '#c98cff' : '#5ee6ff');
      g.radius = kind === 'cores' ? 6 : kind === 'canister' ? 9 : (value >= 5 ? 7 : 5);
      g.vx = 0; g.vy = 0; g.attracted = false; g.bob = Math.random() * TAU;
    });
  }

  reset() { this.pool.clear(); }

  spawnXp(x, y, value) { this.pool.spawn(x, y, value, 'xp'); }
  spawnCores(x, y, value) { this.pool.spawn(x, y, value, 'cores'); }
  spawnCanister(x, y) { this.pool.spawn(x, y, 1, 'canister'); }

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
      if (g.attracted) {
        const ang = Math.atan2(g.vy, g.vx);
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = g.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx - Math.cos(ang) * 14, sy - Math.sin(ang) * 14);
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.translate(sx, sy);
      ctx.shadowColor = g.color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = g.color;
      if (g.kind === 'cores') {
        ctx.beginPath();
        ctx.arc(0, 0, g.radius, 0, TAU);
        ctx.fill();
      } else if (g.kind === 'canister') {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * TAU;
          const px = Math.cos(a) * g.radius, py = Math.sin(a) * g.radius;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.6;
        ctx.stroke();
      } else {
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-g.radius, -g.radius, g.radius * 2, g.radius * 2);
      }
      ctx.restore();
    }
    ctx.shadowBlur = 0;
  }
}
