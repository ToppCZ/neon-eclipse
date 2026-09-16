// Game state: the four things the story can read and write — the Window
// (minutes of night left), Wren's composure, her trust in you, and the set of
// leads/flags you've established. Everything the player "has" is in here.

const SAVE_KEY = 'deadair.save.v1';
const PROFILE_KEY = 'deadair.profile.v1';

// The night runs 23:50 -> 04:50. 300 minutes, and you will not get all of it.
export const WINDOW_START = 300;
export const CLOCK_START_MIN = 23 * 60 + 50;

export function newState() {
  return {
    node: null,
    chapter: 1,
    time: WINDOW_START,
    trust: 50,
    composure: 70,
    leads: [],
    flags: {},
    counts: {},   // named tallies the story can gate on (e.g. desk actions taken)
    loc: 'relay',
    signal: 'clear',
    trace: [],        // places visited, in order, for the Trace tab
    log: [],          // rendered transcript entries, so tab switches/resume redraw
    ended: null,
  };
}

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

// ---- Clock -----------------------------------------------------------------

// Minutes remaining -> the in-fiction wall clock Wren is running against.
export function clockString(timeLeft) {
  const elapsed = WINDOW_START - timeLeft;
  const mins = (CLOCK_START_MIN + elapsed) % (24 * 60);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function remainingString(timeLeft) {
  const t = Math.max(0, timeLeft);
  const h = Math.floor(t / 60);
  const m = t % 60;
  if (h <= 0) return `${m}m to grid-up`;
  return `${h}h ${String(m).padStart(2, '0')}m to grid-up`;
}

// ---- Leads & flags ---------------------------------------------------------

export function hasLead(state, id) {
  return state.leads.includes(id);
}

export function addLead(state, id) {
  if (!state.leads.includes(id)) {
    state.leads.push(id);
    return true;
  }
  return false;
}

export function flag(state, name) {
  return !!state.flags[name];
}

// ---- Effects ---------------------------------------------------------------

// An effect block looks like:
//   { time: -12, trust: +5, composure: -10,
//     leads: ['a','b'], flags: { toldTruth: true }, loc: 'ashgate', signal: 'weak' }
// Returns the leads newly gained, so the UI can announce them.
export function applyEffects(state, fx) {
  const gained = [];
  if (!fx) return gained;

  if (fx.time) state.time = Math.max(0, state.time + fx.time);
  if (fx.trust) state.trust = clamp(state.trust + fx.trust, 0, 100);
  if (fx.composure) state.composure = clamp(state.composure + fx.composure, 0, 100);

  if (fx.leads) {
    for (const id of fx.leads) {
      if (addLead(state, id)) gained.push(id);
    }
  }
  if (fx.dropLeads) {
    state.leads = state.leads.filter((id) => !fx.dropLeads.includes(id));
  }
  if (fx.flags) Object.assign(state.flags, fx.flags);
  if (fx.count) {
    for (const [k, v] of Object.entries(fx.count)) {
      state.counts[k] = (state.counts[k] || 0) + v;
    }
  }
  if (fx.loc && fx.loc !== state.loc) {
    state.loc = fx.loc;
    if (!state.trace.includes(fx.loc)) state.trace.push(fx.loc);
  }
  if (fx.signal) state.signal = fx.signal;
  if (fx.chapter) state.chapter = fx.chapter;

  return gained;
}

// ---- Conditions ------------------------------------------------------------

// A requires block:
//   { leads: [...], anyLead: [...], notLeads: [...],
//     flags: { x: true }, trust: { min, max }, composure: { min, max },
//     timeMin, timeMax }
// All present keys must pass.
export function meets(state, req) {
  if (!req) return true;

  if (req.leads && !req.leads.every((id) => hasLead(state, id))) return false;
  if (req.anyLead && !req.anyLead.some((id) => hasLead(state, id))) return false;
  if (req.notLeads && req.notLeads.some((id) => hasLead(state, id))) return false;

  if (req.flags) {
    for (const [k, v] of Object.entries(req.flags)) {
      // Boolean requirements test presence; anything else must match exactly,
      // or a flag like plan:'deliver' would satisfy a plan:'broadcast' gate.
      if (typeof v === 'boolean') {
        if (!!state.flags[k] !== v) return false;
      } else if (state.flags[k] !== v) {
        return false;
      }
    }
  }
  if (req.trust) {
    if (req.trust.min != null && state.trust < req.trust.min) return false;
    if (req.trust.max != null && state.trust > req.trust.max) return false;
  }
  if (req.composure) {
    if (req.composure.min != null && state.composure < req.composure.min) return false;
    if (req.composure.max != null && state.composure > req.composure.max) return false;
  }
  if (req.counts) {
    for (const [k, r] of Object.entries(req.counts)) {
      const v = state.counts[k] || 0;
      if (r.min != null && v < r.min) return false;
      if (r.max != null && v > r.max) return false;
    }
  }
  if (req.timeMin != null && state.time < req.timeMin) return false;
  if (req.timeMax != null && state.time > req.timeMax) return false;

  return true;
}

// ---- Persistence -----------------------------------------------------------

export function save(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) { /* private mode / quota — the night just won't resume */ }
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return s && s.node && !s.ended ? s : null;
  } catch (e) { return null; }
}

export function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
}

// Profile persists across nights: which outcomes you've reached, settings.
export function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    const p = raw ? JSON.parse(raw) : {};
    return {
      seen: p.seen || [],
      reduced: !!p.reduced,
      muted: !!p.muted,
      fastText: !!p.fastText,
    };
  } catch (e) {
    return { seen: [], reduced: false, muted: false, fastText: false };
  }
}

export function saveProfile(p) {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch (e) { /* ignore */ }
}
