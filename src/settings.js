const STORAGE_KEY = 'neonEclipse.settings.v1';

function defaultSettings() {
  return {
    musicVolume: 0.35,
    sfxVolume: 0.8,
    screenShake: 1,       // 0 = off, 0.5 = reduced, 1 = full
    reducedMotion: false, // halves particle counts
    showHitbox: false,    // draws the player's actual collision radius
    difficulty: 'normal', // 'easy' | 'normal' | 'hard'
  };
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings();
    return { ...defaultSettings(), ...JSON.parse(raw) };
  } catch {
    return defaultSettings();
  }
}

export function saveSettings(settings) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch { /* storage unavailable */ }
}

export const DIFFICULTIES = {
  easy: { id: 'easy', name: 'Easy', hpMult: 0.8, dmgMult: 0.75, spawnMult: 0.85 },
  normal: { id: 'normal', name: 'Normal', hpMult: 1, dmgMult: 1, spawnMult: 1 },
  hard: { id: 'hard', name: 'Hard', hpMult: 1.3, dmgMult: 1.25, spawnMult: 1.2 },
};

export function diffMultipliers(id) {
  const d = DIFFICULTIES[id] || DIFFICULTIES.normal;
  return { hp: d.hpMult, dmg: d.dmgMult, spawn: d.spawnMult };
}
