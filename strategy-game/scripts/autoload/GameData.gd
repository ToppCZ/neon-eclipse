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

const BARRACKS_BUILD_COST := 200
const BARRACKS_BUILD_RADIUS := 3 # must build within this many tiles of owned territory
const HEAL_FRACTION := 0.35 # Medic heals this fraction of the target's max HP per action

enum Faction { PLAYER = 0, AI = 1 }
enum UnitType {
	INFANTRY, CAVALRY, RANGED, SIEGE,
	SCOUT, MARKSMAN, JUGGERNAUT, SKYRAIDER, MEDIC, COMMANDER,
}
enum Terrain { PLAIN, FOREST, HILL, WATER, CAPTURE, RESOURCE, BARRACKS, HQ_PLAYER, HQ_AI }

## Terrain types that can be owned/contested via the capture mechanic.
const CAPTURABLE_TERRAIN := [Terrain.CAPTURE, Terrain.RESOURCE, Terrain.BARRACKS]

const UNIT_DEFS := {
	UnitType.INFANTRY: {
		"name": "Infantry", "letter": "I", "cost": 100,
		"hp": 100, "atk": 40, "def": 10, "move": 3, "range_min": 1, "range_max": 1,
		"color": Color(0.85, 0.85, 0.9),
	},
	UnitType.CAVALRY: {
		"name": "Cavalry", "letter": "C", "cost": 150,
		"hp": 90, "atk": 45, "def": 6, "move": 5, "range_min": 1, "range_max": 1,
		"color": Color(0.95, 0.75, 0.25),
	},
	UnitType.RANGED: {
		"name": "Ranged", "letter": "R", "cost": 150,
		"hp": 70, "atk": 50, "def": 5, "move": 2, "range_min": 1, "range_max": 2,
		"color": Color(0.4, 0.85, 0.55),
	},
	UnitType.SIEGE: {
		"name": "Siege", "letter": "S", "cost": 250,
		"hp": 120, "atk": 70, "def": 15, "move": 1, "range_min": 2, "range_max": 3,
		"color": Color(0.75, 0.35, 0.85),
	},
	UnitType.SCOUT: {
		"name": "Scout", "letter": "V", "cost": 80,
		"hp": 50, "atk": 15, "def": 3, "move": 7, "range_min": 1, "range_max": 1,
		"color": Color(0.75, 0.95, 0.5),
	},
	UnitType.MARKSMAN: {
		"name": "Marksman", "letter": "M", "cost": 180,
		"hp": 60, "atk": 55, "def": 4, "move": 2, "range_min": 1, "range_max": 3,
		"color": Color(0.3, 0.75, 0.75),
	},
	UnitType.JUGGERNAUT: {
		"name": "Juggernaut", "letter": "J", "cost": 300,
		"hp": 180, "atk": 55, "def": 25, "move": 1, "range_min": 1, "range_max": 1,
		"color": Color(0.55, 0.15, 0.15),
	},
	UnitType.SKYRAIDER: {
		"name": "Skyraider", "letter": "K", "cost": 260,
		"hp": 80, "atk": 60, "def": 8, "move": 6, "range_min": 1, "range_max": 2,
		"color": Color(0.55, 0.75, 0.98),
		"flies": true,
	},
	UnitType.MEDIC: {
		"name": "Medic", "letter": "H", "cost": 120,
		"hp": 60, "atk": 0, "def": 5, "move": 3, "range_min": 1, "range_max": 1,
		"color": Color(0.95, 0.85, 0.9),
		"role": "heal",
	},
	UnitType.COMMANDER: {
		"name": "Commander", "letter": "G", "cost": 400,
		"hp": 140, "atk": 60, "def": 18, "move": 3, "range_min": 1, "range_max": 1,
		"color": Color(0.95, 0.8, 0.2),
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
	Terrain.HQ_PLAYER: 1,
	Terrain.HQ_AI: 1,
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
