// Lean milestone system: no separate unlock-condition engine, just a plain
// array of { id, check(meta, runStats) } checked once per run's end. meta is
// the full persistent save (gold, stats, history); runStats is this run's
// end-of-run stats object from Game.endRun().
export const ACHIEVEMENTS = [
  { id: 'firstBlood', name: 'First Blood', desc: 'Kill your first enemy.', check: (meta) => meta.stats.totalKills >= 1 },
  { id: 'centurion', name: 'Centurion', desc: 'Kill 100 enemies in a single run.', check: (meta, run) => (run.kills || 0) >= 100 },
  { id: 'actThree', name: 'Eclipse Walker', desc: 'Reach Act 3 in Story Mode.', check: (meta, run) => run.mode === 'story' && (run.actReached || 0) >= 3 },
  { id: 'victory', name: 'Survivor', desc: 'Win a Story Mode run.', check: (meta, run) => run.mode === 'story' && !!run.victory },
  { id: 'wave10', name: 'Deep Runner', desc: 'Reach Wave 10 in Endless Mode.', check: (meta, run) => run.mode === 'endless' && (run.wave || 0) >= 10 },
  { id: 'wave25', name: 'Abyss Walker', desc: 'Reach Wave 25 in Endless Mode.', check: (meta, run) => run.mode === 'endless' && (run.wave || 0) >= 25 },
  { id: 'level20', name: 'Ascendant', desc: 'Reach character level 20 in a single run.', check: (meta, run) => (run.level || 0) >= 20 },
  { id: 'hoarder', name: 'Hoarder', desc: 'Accumulate 1000 lifetime Gold.', check: (meta) => meta.gold >= 1000 },
  { id: 'tenRuns', name: 'Regular', desc: 'Complete 10 runs.', check: (meta) => meta.stats.totalRuns >= 10 },
];

// Call once per run's end, after meta.stats/gold have already been updated
// for that run. Mutates meta.achievements in place and returns the
// newly-unlocked defs (for an end-screen banner) — empty array if none.
export function checkAchievements(meta, runStats) {
  meta.achievements = meta.achievements || [];
  const newlyUnlocked = [];
  for (const a of ACHIEVEMENTS) {
    if (meta.achievements.includes(a.id)) continue;
    if (a.check(meta, runStats || {})) {
      meta.achievements.push(a.id);
      newlyUnlocked.push(a);
    }
  }
  return newlyUnlocked;
}
