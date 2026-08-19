// Status effects live as plain fields directly on each (pooled) enemy object
// rather than as separate pooled entities — enemies already are long-lived
// pooled objects, so this avoids a second bookkeeping layer for what's really
// just a handful of timers per enemy.

export function applyBurn(e, dps, duration) {
  e.burnTime = Math.max(e.burnTime || 0, duration);
  e.burnDps = Math.max(e.burnDps || 0, dps);
}

export function applyPoison(e, dpsPerStack, duration) {
  e.poisonStacks = Math.min(5, (e.poisonStacks || 0) + 1);
  e.poisonTime = Math.max(e.poisonTime || 0, duration);
  e.poisonDpsPerStack = dpsPerStack;
}

export function applyShock(e, stunDuration) {
  e.stunTime = Math.max(e.stunTime || 0, stunDuration);
}

export function applyFrost(e, slowPerStack, duration) {
  e.frostStacks = Math.min(3, (e.frostStacks || 0) + 1);
  e.frostTime = Math.max(e.frostTime || 0, duration);
  e.frostSlowPerStack = slowPerStack;
}

export function clearStatuses(e) {
  e.burnTime = 0; e.burnDps = 0;
  e.poisonTime = 0; e.poisonStacks = 0; e.poisonDpsPerStack = 0;
  e.stunTime = 0;
  e.frostTime = 0; e.frostStacks = 0; e.frostSlowPerStack = 0;
  e._burnTick = 0; e._poisonTick = 0;
}

// Ticks DoTs, decays timers, and reports back this frame's movement
// multiplier (frost) and whether the enemy is stunned (shock) — both of
// which the caller applies in its own movement/behavior code.
export function updateStatuses(e, dt) {
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
// The colorblind palette (Okabe-Ito derived) swaps in colors chosen to stay
// distinguishable under protanopia/deuteranopia/tritanopia, not just a
// cosmetic recolor.
const GLOW_DEFAULT = { stun: '#ffe066', frost: '#5ee6ff', poison: '#7CFC9A', burn: '#ff8a5e' };
const GLOW_COLORBLIND = { stun: '#F0E442', frost: '#56B4E9', poison: '#009E73', burn: '#E69F00' };

export function statusGlowColor(e, colorblind = false) {
  const p = colorblind ? GLOW_COLORBLIND : GLOW_DEFAULT;
  if (e.stunTime > 0) return p.stun;
  if (e.frostTime > 0) return p.frost;
  if (e.poisonTime > 0) return p.poison;
  if (e.burnTime > 0) return p.burn;
  return null;
}
