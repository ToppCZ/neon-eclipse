# Neon Eclipse

A bullet-heaven / survivors-like — no external art or audio assets, everything (visuals, sound, music) is generated at runtime from vanilla HTML5 Canvas and WebAudio. Ships two ways: as a browser page, and as a standalone Windows desktop app.

Move to dodge, your weapons auto-fire, kill swarms, level up, evolve your build, and survive the run.

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
- Weapons fire automatically — no attack button
- **Esc** or **P:** pause
- Touch: drag anywhere on screen (virtual joystick)

## What's here

- 3 playable characters with distinct stats and starting weapons
- 6 weapons, each evolving into a stronger form once maxed + paired with the right passive item
- 6 passive items, procedurally-offered level-up choices
- Escalating enemy waves, 5 enemy archetypes, 2 scripted bosses
- Meta-progression shop (persists via `localStorage`) between runs
- Screen shake, particles, hit-flash, floating damage numbers, procedural WebAudio SFX + ambient music

## Project structure

```
index.html       shell + all DOM screens (menu, HUD, shop, level-up, end)
style.css        theming
src/
  main.js        bootstrap, input, resize, render loop
  game.js         state machine + orchestration
  player.js       character defs, Player class
  enemies.js       enemy AI, spawner, boss patterns
  enemyData.js      enemy/boss stat tables
  weapons.js       weapon defs, projectile/effect systems
  upgrades.js      passive items, level-up choice rolling
  pickups.js       XP gems / gold, magnet pickup
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
