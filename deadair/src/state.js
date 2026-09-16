// Game state: the four things the story can read and write — the Window
// (minutes of night left), Wren's composure, her trust in you, and the set of
// leads/flags you've established. Everything the player "has" is in here.

const SAVE_KEY = 'deadair.save.v1';
const PROFILE_KEY = 'deadair.profile.v1';

// Each act runs its own clock. Act I is the night the job goes wrong; Act II is
// the day you spend being hunted for it; Act III is the night you answer it.
export const WINDOWS = {
  act1: { total: 420, start: 22 * 60 + 30, label: 'to grid-up' },
  act2: { total: 600, start: 6 * 60 + 10, label: 'of daylight' },
  act3: { total: 420, start: 21 * 60 + 40, label: 'to grid-up' },
  // Act II runs in two phases: the daylight you are hunted in, and the dusk
  // you get to prepare in. Same act, separate clocks.
  dusk: { total: 480, start: 15 * 60, label: 'to the bell' },
};

export const WINDOW_START = WINDOWS.act1.total;
export const CLOCK_START_MIN = WINDOWS.act1.start;

export function newState() {
  return {
    node: null,
    chapter: 1,
    act: 1,
    window: { ...WINDOWS.act1 },
    time: WINDOWS.act1.total,
    trust: 50,
    composure: 70,
    exposure: 0,   // how much Halo has on you. Act I barely moves it; later it is the whole game.
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

// Minutes remaining -> the in-fiction wall clock the act is running against.
export function clockString(timeLeft, win) {
  const w = win || WINDOWS.act1;
  const elapsed = w.total - timeLeft;
  const mins = (w.start + elapsed) % (24 * 60);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function remainingString(timeLeft, win) {
  const label = (win || WINDOWS.act1).label;
  const t = Math.max(0, timeLeft);
  const h = Math.floor(t / 60);
  const m = t % 60;
  if (h <= 0) return `${m}m ${label}`;
  return `${h}h ${String(m).padStart(2, '0')}m ${label}`;
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
  if (fx.exposure) state.exposure = clamp(state.exposure + fx.exposure, 0, 100);

  // A named phase can reset the clock without starting a new act.
  if (fx.setWindow && WINDOWS[fx.setWindow]) {
    state.window = { ...WINDOWS[fx.setWindow] };
    state.time = WINDOWS[fx.setWindow].total;
  }

  // Starting an act resets the clock rather than continuing the old one.
  if (fx.openAct) {
    const w = WINDOWS['act' + fx.openAct];
    if (w) {
      state.act = fx.openAct;
      state.window = { ...w };
      state.time = w.total;
    }
  }

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

  // anyFlags passes if ANY listed flag matches, for content that several
  // different bits of earlier work can unlock.
  if (req.anyFlags) {
    const hit = Object.entries(req.anyFlags).some(([k, v]) =>
      (typeof v === 'boolean' ? !!state.flags[k] === v : state.flags[k] === v));
    if (!hit) return false;
  }
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
  if (req.exposure) {
    if (req.exposure.min != null && state.exposure < req.exposure.min) return false;
    if (req.exposure.max != null && state.exposure > req.exposure.max) return false;
  }
  if (req.act != null && state.act !== req.act) return false;
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
    if (!s || !s.node || s.ended) return null;
    // Fill in anything a save from an earlier version predates, so a resume
    // never lands on a half-built state.
    const base = newState();
    for (const [k, v] of Object.entries(base)) {
      if (s[k] === undefined) s[k] = v;
    }
    if (!s.window || typeof s.window.total !== 'number') {
      s.window = { ...(WINDOWS['act' + s.act] || WINDOWS.act1) };
    }
    return s;
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
