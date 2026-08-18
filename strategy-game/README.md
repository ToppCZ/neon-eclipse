# Ironfall Tactics

A mobile strategy game that blends the core loops of several strategy-game
eras into one grid battle:

- **Tactical grid combat** (Advance Wars / Into the Breach) — the core loop.
  Move on a grid, fight with a rock-paper-scissors unit matchup system
  (Infantry beats Cavalry, Cavalry beats Ranged, Ranged beats Infantry,
  Siege is a slow high-damage indirect-fire unit that's weak to Cavalry
  rushes), and terrain gives real defense bonuses (forest, hills).
- **Territory capture & economy** (Command & Conquer-style control points /
  Advance Wars properties) — capture **Capture Points** (fixed gold/turn) and
  **Resource Deposits** (a variable, randomized gold/turn — some turns are a
  windfall, some are lean, so holding several evens out the swings) to fund
  your army.
- **Base building, lite** (Clash of Clans / RTS production buildings) —
  recruit new units at your HQ, or at any **Barracks** you've captured out on
  the map — inspired by Advance Wars factories and C&C war factories, extra
  Barracks are worth fighting over since they let you reinforce closer to
  the front line instead of marching everything from your HQ.
- **Tech tree, lite** (Civilization / 4X) — spend gold on one-time research
  (Logistics, Armor Plating, Weaponry) that permanently upgrades your whole
  army for the rest of the match.
- **Win conditions** — eliminate the enemy army, or march a unit onto the
  enemy HQ for an instant win (Advance Wars-style HQ capture).

The map is 16x12 tiles with 6 starting units per side (up from an initial
12x8 / 4-unit prototype), symmetric buildings on both flanks, and a central
no-man's-land of forest/hill/water terrain to fight over.

No external art or audio assets — everything is drawn procedurally at
runtime (circles, rectangles, colors), matching this repo's existing
"generated, not asset-based" philosophy. Built in [Godot 4.3](https://godotengine.org/).

## Play it on your phone

Every push to this folder builds an installable Android **debug APK**
automatically via GitHub Actions:

1. Go to this repo's **Actions** tab → **Strategy Game - Android Build**
   workflow → pick the latest successful run.
2. Download the `IronfallTactics-android-debug` artifact (a zipped APK).
3. Transfer it to your phone (email it to yourself, Google Drive, etc.) and
   unzip it.
4. On Android, enable "Install unknown apps" for whichever app you used to
   open the file, then tap the `.apk` to install.
5. Launch **Ironfall Tactics** from your app drawer.

This is a debug build (self-signed with a throwaway debug keystore), fine
for installing directly — it isn't signed for the Play Store.

There's currently no iOS build pipeline here: iOS export requires a Mac
with Xcode and an Apple Developer account to sign the build, which has to
happen outside this environment. Ask if you want that added.

## Play it on desktop (for faster iteration while developing)

Install the free [Godot 4.3 editor](https://godotengine.org/download), then
`Import` this `strategy-game/` folder as a project and press Play. Or
headless-run it in a terminal:

```bash
godot --path strategy-game
```

## Controls

- Tap one of your units to select it — reachable tiles highlight blue.
- Tap a highlighted tile to move there (or tap the unit's own tile to stay
  put) — tiles you can attack from your new position highlight red.
- Tap a red-highlighted enemy to attack, or tap anywhere else to skip the
  attack and end that unit's turn.
- **Recruit** panel (sidebar): spend gold to add a new unit at your HQ, or at
  any Barracks you control.
- **Tech** panel (sidebar): spend gold on a one-time army-wide upgrade.
- **End Turn**: hands control to the AI, which recruits, advances on
  capture points, and attacks when it can. Control returns to you
  automatically afterward.

## Project structure

```
project.godot          Engine config, autoloads, mobile display settings
export_presets.cfg     Android export preset (debug-signed)
scenes/
  MainMenu.tscn         Empty root + MainMenu.gd
  Battle.tscn            Empty root + Battle.gd
scripts/
  autoload/GameData.gd   Unit stats, type matchup matrix, tech defs, constants
  Battle.gd              Grid state, turn flow, input, win conditions
  Unit.gd                Single unit: stats + procedural rendering
  GridRenderer.gd        Procedural tile + highlight rendering
  CombatResolver.gd       Damage math (pure functions)
  AIController.gd         Heuristic AI opponent
  HUD.gd                  All UI, built in code
  MainMenu.gd             Title screen
```

Nearly everything is built programmatically in `_ready()` rather than as
hand-authored `.tscn` node trees — this keeps the project resilient to
editing without the Godot editor GUI (every scene file here is just an
empty root node with a script attached).

## Design notes / what's intentionally MVP-scope

This is a first playable slice, not the final game. Known simplifications:
- Single hand-authored skirmish map (no map selection, no campaign yet).
- One AI difficulty (heuristic, not adaptive).
- No fog of war, no multiplayer — both are natural next additions given the
  systems already in place (grid state and turn flow are already fully
  separated from rendering/input).
- Unit roster is 4 types; more types (e.g., a scout/vision unit, an
  anti-siege unit) would deepen the counter-play.
- Buildings are currently 2 types (Resource Deposit, Barracks) captured the
  same way as Capture Points; a natural next step is giving Barracks a
  build queue / limited unit-type specialization instead of producing the
  full roster.

## Testing notes

Every script here was compiled and exercised headlessly with Godot's
`--headless` mode during development (grid pathfinding, combat resolution,
capture ticking, tech purchase, recruiting, and a full AI turn cycle were
all run and asserted against, not just eyeballed). The map/buildings update
was additionally verified with an actual rendered frame (Xvfb + software
GL, screenshotted) to catch draw-time errors headless mode can't reach, and
a real touch-input bug — Godot's default touch↔mouse emulation was causing
every tap to fire twice, silently auto-completing a unit's turn right after
selection — was found from real device testing and fixed (both emulation
directions are now disabled in `project.godot`; each real touch or mouse
click fires exactly once). Still not tested in the Godot editor GUI itself.
