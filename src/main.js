import { Game } from './game.js';
import { audio } from './audio.js';
import { ui } from './ui.js';

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
