# Ironfall Tactics

A mobile strategy game that blends the core loops of several strategy-game
eras into one grid battle:

- **Tactical grid combat** (Advance Wars / Into the Breach) — the core loop.
  Move on a grid, fight with a rock-paper-scissors unit matchup system across
  a 10-unit roster (see below), and terrain gives real defense bonuses
  (forest, hills).
- **Territory capture & economy** (Command & Conquer-style control points /
  Advance Wars properties) — capture **Capture Points** (fixed gold/turn) and
  **Resource Deposits** (a variable, randomized gold/turn — some turns are a
  windfall, some are lean, so holding several evens out the swings) to fund
  your army.
- **Base building** (Clash of Clans / RTS production buildings) — spend gold
  to **construct a Barracks** on any empty tile near your territory (not just
  capture pre-placed ones), giving you a forward recruiting point closer to
  the front line. A handful of special neutral Barracks are still scattered
  deep in no-man's-land, pre-built and only takeable by capturing them — a
  worthwhile, contested prize distinct from the ones you build yourself.
- **Tech tree, lite** (Civilization / 4X) — spend gold on one-time research
  (Logistics, Armor Plating, Weaponry) that permanently upgrades your whole
  army for the rest of the match.
- **Win conditions** — eliminate the enemy army, or march a unit onto the
  enemy HQ for an instant win (Advance Wars-style HQ capture).

The map is 36x24 tiles (up from an initial 12x8 prototype) — big enough that
first contact between armies takes several turns, so there's real time to
build up an economy and a second wave of units before the fighting starts,
and reinforcements from a Barracks can reach an ongoing fight. The camera
pans (drag to scroll) since the whole map doesn't fit on one screen; the
sidebar UI stays fixed regardless of where you've scrolled.

### Unit roster (10 types)

| Unit | Role |
|---|---|
| Infantry | Balanced core unit; strong vs Cavalry |
| Cavalry | Fast striker; strong vs Ranged, weak vs Infantry |
| Ranged | Backline attacker; strong vs Infantry, weak vs Cavalry |
| Siege | Slow indirect-fire (can't hit adjacent tiles), heavy damage |
| Scout | Cheap and very fast, for map/economy control rather than fighting |
| Marksman | Long-range specialist; strong vs Siege and Skyraider |
| Juggernaut | Heavy armor; strong vs Infantry/Scout, weak vs Siege |
| Skyraider | Flying — ignores terrain movement cost, crosses water/forest/hills freely; strong vs Siege/Juggernaut, weak vs Marksman |
| Medic | No attack — heals an adjacent damaged ally instead |
| Commander | Expensive elite unit, a flat combat edge against everything |

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

- Tap one of your units to select it — reachable tiles highlight blue, and
  any enemy already in range highlights red immediately (tap it to attack in
  place, no need to move first). For a Medic, damaged allies in range
  highlight green instead — tap one to heal instead of attack.
- Tap a highlighted blue tile to move there (or tap the unit's own tile to
  stay put) — attackable/healable tiles from the new position highlight
  next; tap one, or tap anywhere else to skip and end that unit's turn.
- **Drag** anywhere on the map to pan the camera — a drag is only treated as
  a pan, never as a tap-action, so scrolling never accidentally selects or
  moves a unit.
- **Recruit** panel (sidebar): spend gold to add a new unit at your HQ, or at
  any Barracks you control.
- **Build** panel (sidebar): spend gold to construct a new Barracks on an
  eligible tile (highlighted white) near your territory.
- **Tech** panel (sidebar): spend gold on a one-time army-wide upgrade.
- **End Turn**: hands control to the AI, which recruits, builds, heals,
  advances on capture points/resources, and attacks when it can. Control
  returns to you automatically afterward.

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
- The map layout is procedurally generated but from a **fixed seed**, so
  it's the same map every match (deterministic, for balance/testability) -
  randomizing it per match would be a small change.
- One AI difficulty (heuristic, not adaptive).
- No fog of war, no multiplayer — both are natural next additions given the
  systems already in place (grid state and turn flow are already fully
  separated from rendering/input).
- Built Barracks currently produce the full unit roster, same as HQ; a
  natural next step is limiting what each production building can build
  (e.g. a Barracks vs. an Airfield vs. a Workshop).
- No pinch-to-zoom on the camera, only pan — the map is sized so the base
  zoom level keeps units readable, but a zoom-out overview would help
  orientation on a map this size.

## Testing notes

Every script here was compiled and exercised headlessly with Godot's
`--headless` mode during development (grid pathfinding, combat resolution,
capture ticking, tech purchase, recruiting, and full AI turn cycles were
run and checked, not just eyeballed). Two real bugs were found from actual
device/browser testing and are worth calling out because of how they were
found and fixed:

1. **Touch double-fire**: Godot's default touch↔mouse emulation caused
   every real tap to fire twice (once as a touch event, once as a
   synthesized mouse event at the same position), silently advancing the
   turn state machine twice per tap. Fixed by disabling both emulation
   directions in `project.godot`.
2. **Attack-in-place gap**: selecting a unit and tapping an already-adjacent
   enemy directly (without first confirming a move) silently deselected
   instead of attacking, because the state machine required a redundant
   "confirm position" tap before attack options were ever computed. Fixed
   by computing and highlighting in-range targets immediately on selection.

Both are exactly the class of bug that's invisible to a headless test that
only calls internal functions directly — the bug lives in the input-event
pipeline itself. After finding that gap, the test approach changed to
**drive the game through real simulated input events**
(`Viewport.push_input()` with actual `InputEventScreenTouch` /
`InputEventScreenDrag` objects, run under Xvfb with real rendering rather
than pure `--headless`, since a real Camera2D/viewport is needed for the
screen↔world coordinate math to behave like it does on a real device) for
select/move/attack/heal/build/drag-pan, rather than only asserting on
internal state after calling functions directly. Still not tested in the
Godot editor GUI itself or on physical hardware.
