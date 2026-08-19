# Neon Eclipse

A bullet-heaven combat core wrapped in a strategic roguelike run structure — no external art or audio assets, everything (visuals, sound, music) is generated at runtime from vanilla HTML5 Canvas and WebAudio. Ships two ways: as a browser page, and as a standalone Windows desktop app.

Pick a character and a build-defining relic, then navigate a branching map across 3 acts — combat, elite, shop, treasure, and rest nodes — choosing your path between fights. In combat, move to dodge and dash past danger while your weapons auto-fire; between fights, spend in-run Cores at shops, pick tiered rewards, and lean into elemental damage-type synergies against enemies with real resistances and weaknesses. Clear all 3 acts and their bosses to win the run.

Prefer no ending? **Endless Mode** drops the act structure for infinite escalating waves: survive a wave, spend Cores at a between-wave shop on permanent-for-the-run upgrades, then push into the next (harder) wave — elites every 5 waves, a scaled-up boss every 10 — for as long as you can last. Best wave reached is tracked alongside the story mode's best act/level on the main menu.

## Play it — Windows desktop app

Grab the latest build from the [Releases page](https://github.com/ToppCZ/neon-eclipse/releases), unzip it, and run `NeonEclipse.exe`. No browser, no server, no install — it's a real window (WPF + Microsoft Edge WebView2, requires the [WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/) — already present on most Windows 10/11 machines).

To build it yourself:

```bash
python bundle.py desktop/game    # bundle src/*.js into one script (no ES modules = no server needed)
cd desktop
dotnet publish -c Release -r win-x64 --self-contained true -o publish_out
```

Then run `desktop\publish_out\NeonEclipse.exe`. (`dotnet` here is the .NET 8 SDK.) The `desktop/` folder is a normal WPF project — `dotnet run` also works for local testing.

## Play it — browser

You need a static file server (ES modules don't load over `file://`). Any static server works; a zero-dependency one is included:

```bash
python devserver.py 8080 .
```

Then open `http://localhost:8080`.

(Any other static server — `npx serve`, VS Code's Live Server, etc. — works too.)

## Controls

- **Move:** WASD or Arrow Keys
- **Dash:** Space or Shift (brief invincibility, on a cooldown)
- Weapons fire automatically — no attack button
- **Esc** or **P:** pause
- Touch: drag anywhere on screen (virtual joystick)

## What's here

- **Run structure:** 3 acts, each a short branching sequence of node choices (combat / elite / shop / treasure / rest) ending in an act boss — pick your path each step, Slay-the-Spire style
- **Pre-run planning:** 3 characters x 4 build-defining relics (each a real tradeoff, not just a buff)
- **Elemental depth:** 5 damage types (physical/fire/poison/shock/frost) with per-enemy resistances/weaknesses, status effects (burn, poison stacks, shock stun, frost slow), and two build-archetype synergy bonuses (physical focus vs. elemental diversity)
- **Items:** 6 weapons (each evolving once maxed + paired with the right passive), 7 passives with mastery bonuses at max level, common/rare/legendary tiers
- **Elites & bosses:** elites roll a random affix (explosive death, damage shield, frost aura), 3 distinct bosses (one per act)
- **Biome hazards:** static terrain danger zones (poison pools, fire vents) to route around mid-fight
- Meta-progression shop (persists via `localStorage`) between runs
- Screen shake, particles, hit-flash, floating damage numbers, procedural WebAudio SFX + ambient music

## Project structure

```
index.html       shell + all DOM screens (menu, HUD, shop, level-up, end)
style.css        theming
src/
  main.js        bootstrap, input, resize, render loop
  game.js         state machine + orchestration (map/combat/shop/reward nodes)
  runMap.js        branching run/act/node generation
  player.js       character + relic defs, Player class, dash
  enemies.js       enemy AI, spawner, boss patterns, elite affixes
  enemyData.js      enemy/boss stat tables, biomes, resistances
  statusEffects.js  burn/poison/shock/frost status effect logic
  weapons.js       weapon defs, damage types, projectile/effect systems, synergies
  upgrades.js      passives, item tiers, level-up/shop choice rolling
  pickups.js       XP gems / Cores, magnet pickup
  particles.js      particle + floating text system
  audio.js         procedural WebAudio SFX/music
  meta.js          localStorage meta-progression + shop
  ui.js            DOM screen/HUD management
  utils.js         math, object pooling, spatial grid
bundle.py        concatenates src/*.js into one script (no ES modules) for the desktop build
desktop/         WPF + WebView2 wrapper -> NeonEclipse.exe (desktop/game/ is bundle.py's output)
```

## Debugging

`window.__game` exposes the live `Game` instance in the browser console for inspection.

## Testing

`tests/smoke.mjs` is an end-to-end regression check (menu → settings → an Endless Mode
run through a wave-shop and death → end screen) driven by a headless Chromium session.
It's the one place in the repo with an external dependency — kept out of the
zero-dependency runtime on purpose, since it's a contributor tool, not part of the game:

```bash
npm install -D playwright
node tests/smoke.mjs
```
