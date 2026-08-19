import { Game } from './game.js';
import { audio } from './audio.js';
import { ui } from './ui.js';

const canvas = document.getElementById('game-canvas');
const game = new Game(canvas);
window.__game = game; // debug hook for automated/manual testing in the console

// `input` is what Game.update() reads each frame; it's the merge point for
// keyboard, touch, and gamepad. `kb` holds keyboard-only held-state so the
// per-frame gamepad poll can OR its own reading in without clobbering keys
// that are still physically held down.
const kb = { left: false, right: false, up: false, down: false };
const input = { left: false, right: false, up: false, down: false, dashPressed: false, mouseX: 0, mouseY: 0 };

// Arrow keys, Shift, and P are always-on fallbacks; game.settings.keybinds
// (rebindable in Settings) adds a second, user-chosen primary key on top —
// rebinding can never lock a player out of basic controls.
const FIXED_DIR = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
function resolveDir(code) {
  return FIXED_DIR[code] || Object.keys(game.settings.keybinds).find(
    (action) => ['up', 'down', 'left', 'right'].includes(action) && game.settings.keybinds[action] === code
  );
}

window.addEventListener('keydown', (e) => {
  const dir = resolveDir(e.code);
  if (dir) { kb[dir] = true; e.preventDefault(); }
  if (e.code === 'Escape' || e.code === 'KeyP' || e.code === game.settings.keybinds.pause) {
    if (game.state === 'playing' || game.state === 'paused') game.togglePause();
  }
  if (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === game.settings.keybinds.dash) {
    input.dashPressed = true;
    e.preventDefault();
  }
});

window.addEventListener('keyup', (e) => {
  const dir = resolveDir(e.code);
  if (dir) { kb[dir] = false; e.preventDefault(); }
});

// Mouse position (screen space; Game converts to world space) drives the
// optional Manual Aim setting — see WeaponSystem.aim in weapons.js.
window.addEventListener('mousemove', (e) => {
  input.mouseX = e.clientX;
  input.mouseY = e.clientY;
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
  kb.left = dx < -dead; kb.right = dx > dead;
  kb.up = dy < -dead; kb.down = dy > dead;
  e.preventDefault();
}, { passive: false });

function clearTouch() {
  touchOrigin = null;
  kb.left = kb.right = kb.up = kb.down = false;
}
canvas.addEventListener('touchend', clearTouch);
canvas.addEventListener('touchcancel', clearTouch);

// Gamepad support (standard Gamepad API, feature-detected — no-op if nothing
// is connected). Left stick or d-pad for movement, button 0 (A/Cross) for
// dash, button 9 (Start) for pause. Polled once per frame rather than
// event-driven, since that's how the API works — there's no "gamepadmove".
const GAMEPAD_DEADZONE = 0.25;
let gpDashHeld = false, gpPauseHeld = false;
function pollGamepad() {
  if (!navigator.getGamepads) return;
  const pads = navigator.getGamepads();
  const gp = pads && (pads[0] || pads[1] || pads[2] || pads[3]);
  if (!gp) return;

  const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
  let gpLeft = ax < -GAMEPAD_DEADZONE, gpRight = ax > GAMEPAD_DEADZONE;
  let gpUp = ay < -GAMEPAD_DEADZONE, gpDown = ay > GAMEPAD_DEADZONE;
  if (gp.buttons[14] && gp.buttons[14].pressed) gpLeft = true;  // d-pad left
  if (gp.buttons[15] && gp.buttons[15].pressed) gpRight = true; // d-pad right
  if (gp.buttons[12] && gp.buttons[12].pressed) gpUp = true;    // d-pad up
  if (gp.buttons[13] && gp.buttons[13].pressed) gpDown = true;  // d-pad down
  input.left = kb.left || gpLeft;
  input.right = kb.right || gpRight;
  input.up = kb.up || gpUp;
  input.down = kb.down || gpDown;

  const dashBtn = gp.buttons[0];
  const dashDown = !!(dashBtn && dashBtn.pressed);
  if (dashDown && !gpDashHeld) input.dashPressed = true;
  gpDashHeld = dashDown;

  const pauseBtn = gp.buttons[9];
  const pauseDown = !!(pauseBtn && pauseBtn.pressed);
  if (pauseDown && !gpPauseHeld && (game.state === 'playing' || game.state === 'paused')) game.togglePause();
  gpPauseHeld = pauseDown;
}

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
  input.left = kb.left; input.right = kb.right; input.up = kb.up; input.down = kb.down;
  pollGamepad();
  game.update(dt, input);
  input.dashPressed = false; // edge-triggered: consumed once per keypress, not held
  game.render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
