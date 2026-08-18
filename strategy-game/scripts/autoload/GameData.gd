extends Node
## Central static game data: unit stats, type matchups, tech defs, tunables.
## Autoloaded as "GameData".

const GRID_COLS := 36
const GRID_ROWS := 24
const TILE_SIZE := 64

const STARTING_GOLD := 400
const CAPTURE_TICKS := 2 # turns of uninterrupted occupation needed to flip a point
const CAPTURE_INCOME := 30
const HQ_INCOME := 20
const RESOURCE_INCOME_MIN := 10 # resource deposits yield a variable amount each turn
const RESOURCE_INCOME_MAX := 50

const BUILD_RADIUS := 3 # must build within this many tiles of owned territory
const HEAL_FRACTION := 0.35 # Medic heals this fraction of the target's max HP per action

const MARKET_INCOME := 20 # flat gold/turn while owned
const WATCHTOWER_DAMAGE := 20 # dealt to each adjacent enemy at the start of the owner's turn

enum Faction { PLAYER = 0, AI = 1 }
enum UnitType {
	INFANTRY, CAVALRY, RANGED, SIEGE,
	SCOUT, MARKSMAN, JUGGERNAUT, SKYRAIDER, MEDIC, COMMANDER,
}
enum Terrain {
	PLAIN, FOREST, HILL, WATER,
	CAPTURE, RESOURCE, BARRACKS, MARKET, WATCHTOWER,
	HQ_PLAYER, HQ_AI,
}

## Terrain types that can be owned/contested via the capture mechanic.
const CAPTURABLE_TERRAIN := [
	Terrain.CAPTURE, Terrain.RESOURCE, Terrain.BARRACKS, Terrain.MARKET, Terrain.WATCHTOWER,
]

## Buildings the player can construct for gold (as opposed to Capture/Resource, which can
## only be taken by capture). Keyed by Terrain type.
const BUILDING_DEFS := {
	Terrain.BARRACKS: {
		"name": "Barracks", "cost": 200, "category": "Troops",
		"desc": "Recruit any unit here, just like your HQ. Build one forward to reinforce\nthe front line without a long march back home.",
	},
	Terrain.MARKET: {
		"name": "Market", "cost": 180, "category": "Income",
		"desc": "Produces %d steady gold every turn you hold it. Cheaper and safer\nthan fighting over a Resource Deposit, but the payout is fixed." % MARKET_INCOME,
	},
	Terrain.WATCHTOWER: {
		"name": "Watchtower", "cost": 220, "category": "Defense",
		"desc": "Chips %d damage into every adjacent enemy unit at the start of your\nturn, and gives whoever garrisons it a strong defense bonus." % WATCHTOWER_DAMAGE,
	},
}

const UNIT_DEFS := {
	UnitType.INFANTRY: {
		"name": "Infantry", "letter": "I", "cost": 100,
		"hp": 100, "atk": 40, "def": 10, "move": 3, "range_min": 1, "range_max": 1,
		"color": Color(0.85, 0.85, 0.9), "shape": "circle",
		"blurb": "Balanced line unit. Cheap and reliable; strong against Cavalry.",
	},
	UnitType.CAVALRY: {
		"name": "Cavalry", "letter": "C", "cost": 150,
		"hp": 90, "atk": 45, "def": 6, "move": 5, "range_min": 1, "range_max": 1,
		"color": Color(0.95, 0.75, 0.25), "shape": "triangle",
		"blurb": "Fast striker. Runs down Ranged and Scouts, but Infantry spears it down.",
	},
	UnitType.RANGED: {
		"name": "Ranged", "letter": "R", "cost": 150,
		"hp": 70, "atk": 50, "def": 5, "move": 2, "range_min": 1, "range_max": 2,
		"color": Color(0.4, 0.85, 0.55), "shape": "diamond",
		"blurb": "Backline attacker, hits from 2 tiles. Strong vs Infantry, weak vs Cavalry.",
	},
	UnitType.SIEGE: {
		"name": "Siege", "letter": "S", "cost": 250,
		"hp": 120, "atk": 70, "def": 15, "move": 1, "range_min": 2, "range_max": 3,
		"color": Color(0.75, 0.35, 0.85), "shape": "hexagon",
		"blurb": "Slow indirect fire (can't hit adjacent tiles). Heavy damage, weak to Cavalry rushes.",
	},
	UnitType.SCOUT: {
		"name": "Scout", "letter": "V", "cost": 80,
		"hp": 50, "atk": 15, "def": 3, "move": 7, "range_min": 1, "range_max": 1,
		"color": Color(0.75, 0.95, 0.5), "shape": "chevron",
		"blurb": "Cheap and very fast. Built for grabbing territory, not fighting.",
	},
	UnitType.MARKSMAN: {
		"name": "Marksman", "letter": "M", "cost": 180,
		"hp": 60, "atk": 55, "def": 4, "move": 2, "range_min": 1, "range_max": 3,
		"color": Color(0.3, 0.75, 0.75), "shape": "star5",
		"blurb": "Long-range specialist. Shreds Siege and Skyraiders; Cavalry closes the gap on it.",
	},
	UnitType.JUGGERNAUT: {
		"name": "Juggernaut", "letter": "J", "cost": 300,
		"hp": 180, "atk": 55, "def": 25, "move": 1, "range_min": 1, "range_max": 1,
		"color": Color(0.55, 0.15, 0.15), "shape": "octagon",
		"blurb": "Heavy armor. Crushes Infantry and Scouts; Siege artillery shreds it.",
	},
	UnitType.SKYRAIDER: {
		"name": "Skyraider", "letter": "K", "cost": 260,
		"hp": 80, "atk": 60, "def": 8, "move": 6, "range_min": 1, "range_max": 2,
		"color": Color(0.55, 0.75, 0.98), "shape": "triangle_down",
		"flies": true,
		"blurb": "Flies over water/forest/hills freely. Strong vs Siege/Juggernaut, weak to Marksman AA.",
	},
	UnitType.MEDIC: {
		"name": "Medic", "letter": "H", "cost": 120,
		"hp": 60, "atk": 0, "def": 5, "move": 3, "range_min": 1, "range_max": 1,
		"color": Color(0.95, 0.85, 0.9), "shape": "cross",
		"role": "heal",
		"blurb": "No attack - heals an adjacent damaged ally instead. Keep it behind the line.",
	},
	UnitType.COMMANDER: {
		"name": "Commander", "letter": "G", "cost": 400,
		"hp": 140, "atk": 60, "def": 18, "move": 3, "range_min": 1, "range_max": 1,
		"color": Color(0.95, 0.8, 0.2), "shape": "star6",
		"blurb": "Expensive elite. A flat combat edge against every other unit type.",
	},
}

## Sparse override list of [attacker, defender, multiplier]; unlisted pairs default to 1.0.
## Kept as explicit rules rather than a full N*N literal table so relationships stay
## readable and every pair is still guaranteed a value (no missing-key crashes).
const MATCHUP_RULES := [
	[UnitType.INFANTRY, UnitType.CAVALRY, 1.3],
	[UnitType.INFANTRY, UnitType.RANGED, 0.8],
	[UnitType.INFANTRY, UnitType.SIEGE, 1.1],
	[UnitType.CAVALRY, UnitType.INFANTRY, 0.75],
	[UnitType.CAVALRY, UnitType.RANGED, 1.4],
	[UnitType.CAVALRY, UnitType.SIEGE, 1.2],
	[UnitType.CAVALRY, UnitType.SCOUT, 1.3],
	[UnitType.RANGED, UnitType.INFANTRY, 1.3],
	[UnitType.RANGED, UnitType.CAVALRY, 0.8],
	[UnitType.SIEGE, UnitType.INFANTRY, 1.2],
	[UnitType.SIEGE, UnitType.CAVALRY, 0.7],
	[UnitType.SIEGE, UnitType.RANGED, 1.3],
	[UnitType.SCOUT, UnitType.RANGED, 1.2],
	[UnitType.SCOUT, UnitType.SIEGE, 1.1],
	[UnitType.MARKSMAN, UnitType.SIEGE, 1.6],
	[UnitType.MARKSMAN, UnitType.SKYRAIDER, 1.5],
	[UnitType.MARKSMAN, UnitType.CAVALRY, 0.7],
	[UnitType.JUGGERNAUT, UnitType.INFANTRY, 1.5],
	[UnitType.JUGGERNAUT, UnitType.SCOUT, 1.6],
	[UnitType.JUGGERNAUT, UnitType.SIEGE, 0.6],
	[UnitType.JUGGERNAUT, UnitType.MARKSMAN, 0.75],
	[UnitType.SKYRAIDER, UnitType.SIEGE, 1.4],
	[UnitType.SKYRAIDER, UnitType.JUGGERNAUT, 1.3],
	[UnitType.SKYRAIDER, UnitType.MARKSMAN, 0.6],
]

## Built in _ready() from MATCHUP_RULES: attacker type -> defender type -> damage multiplier.
var TYPE_MATRIX: Dictionary = {}

func _ready() -> void:
	for a in UnitType.values():
		TYPE_MATRIX[a] = {}
		for d in UnitType.values():
			TYPE_MATRIX[a][d] = 1.0
	for rule in MATCHUP_RULES:
		TYPE_MATRIX[rule[0]][rule[1]] = rule[2]
	for a in UnitType.values():
		if a != UnitType.COMMANDER:
			TYPE_MATRIX[UnitType.COMMANDER][a] = 1.15

const TERRAIN_DEFENSE_BONUS := {
	Terrain.PLAIN: 0.0,
	Terrain.FOREST: 0.2,
	Terrain.HILL: 0.35,
	Terrain.WATER: 0.0,
	Terrain.CAPTURE: 0.0,
	Terrain.RESOURCE: 0.0,
	Terrain.BARRACKS: 0.1,
	Terrain.MARKET: 0.0,
	Terrain.WATCHTOWER: 0.5,
	Terrain.HQ_PLAYER: 0.15,
	Terrain.HQ_AI: 0.15,
}

## Terrain movement cost; Water is impassable to ground units (flying units ignore this).
const TERRAIN_MOVE_COST := {
	Terrain.PLAIN: 1,
	Terrain.FOREST: 2,
	Terrain.HILL: 2,
	Terrain.WATER: 999,
	Terrain.CAPTURE: 1,
	Terrain.RESOURCE: 1,
	Terrain.BARRACKS: 1,
	Terrain.MARKET: 1,
	Terrain.WATCHTOWER: 1,
	Terrain.HQ_PLAYER: 1,
	Terrain.HQ_AI: 1,
}

## Colors used both for map rendering (GridRenderer) and the tile legend (HUD), kept here
## so both stay in sync automatically.
const TERRAIN_COLOR := {
	Terrain.PLAIN: Color(0.32, 0.45, 0.28),
	Terrain.FOREST: Color(0.16, 0.32, 0.18),
	Terrain.HILL: Color(0.5, 0.44, 0.32),
	Terrain.WATER: Color(0.18, 0.32, 0.55),
	Terrain.CAPTURE: Color(0.42, 0.4, 0.2),
	Terrain.RESOURCE: Color(0.55, 0.5, 0.15),
	Terrain.BARRACKS: Color(0.4, 0.26, 0.14),
	Terrain.MARKET: Color(0.55, 0.35, 0.55),
	Terrain.WATCHTOWER: Color(0.35, 0.35, 0.4),
	Terrain.HQ_PLAYER: Color(0.15, 0.3, 0.6),
	Terrain.HQ_AI: Color(0.55, 0.15, 0.15),
}

## Player-facing name + one-line explanation for every terrain type, for the Legend panel.
const TERRAIN_INFO := {
	Terrain.PLAIN: {"name": "Plain", "desc": "Open ground. No move cost or defense bonus."},
	Terrain.FOREST: {"name": "Forest", "desc": "+20% defense. Costs 2 move to enter."},
	Terrain.HILL: {"name": "Hill", "desc": "+35% defense. Costs 2 move to enter."},
	Terrain.WATER: {"name": "Water", "desc": "Impassable to ground units. Flying units cross freely."},
	Terrain.CAPTURE: {"name": "Capture Point", "desc": "Capture it (stand 2 turns) for a fixed gold bonus every turn you hold it."},
	Terrain.RESOURCE: {"name": "Resource Deposit", "desc": "Capture for a variable gold bonus every turn - some turns pay more than others."},
	Terrain.BARRACKS: {"name": "Barracks", "desc": "Recruit units here. Build your own nearby, or capture a rare neutral one."},
	Terrain.MARKET: {"name": "Market", "desc": "Built for gold. Produces steady passive income every turn you own it."},
	Terrain.WATCHTOWER: {"name": "Watchtower", "desc": "Built for gold. Damages adjacent enemies each turn and defends its garrison."},
	Terrain.HQ_PLAYER: {"name": "Your HQ", "desc": "Recruit units here. Lose this tile and you lose the game."},
	Terrain.HQ_AI: {"name": "Enemy HQ", "desc": "March a unit onto this tile for an instant win."},
}

const TECH_DEFS := {
	"logistics": {
		"name": "Logistics",
		"desc": "+1 Move to all units",
		"cost": 300,
	},
	"armor": {
		"name": "Armor Plating",
		"desc": "+15% max HP to all units",
		"cost": 300,
	},
	"weaponry": {
		"name": "Weaponry",
		"desc": "+15% Attack to all units",
		"cost": 300,
	},
}

static func unit_type_name(t: int) -> String:
	return UNIT_DEFS[t]["name"]

static func grid_to_world(pos: Vector2i) -> Vector2:
	return Vector2(pos.x * TILE_SIZE + TILE_SIZE / 2.0, pos.y * TILE_SIZE + TILE_SIZE / 2.0)

static func world_to_grid(pos: Vector2) -> Vector2i:
	return Vector2i(int(floor(pos.x / TILE_SIZE)), int(floor(pos.y / TILE_SIZE)))

static func in_bounds(pos: Vector2i) -> bool:
	return pos.x >= 0 and pos.x < GRID_COLS and pos.y >= 0 and pos.y < GRID_ROWS
