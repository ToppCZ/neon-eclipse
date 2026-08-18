extends Node2D
class_name Battle
## Main battle controller: grid state, turn flow, input, and win condition.
## Built entirely in code (no hand-authored child scenes) for reliability.

enum Phase { IDLE, UNIT_MOVE, UNIT_ATTACK }

var terrain: Array = [] # [x][y] -> GameData.Terrain
var capture_owner: Array = [] # [x][y] -> -1 / Faction
var capture_contest: Array = [] # [x][y] -> -1 / Faction
var capture_progress: Array = [] # [x][y] -> int ticks remaining

var units: Array[Unit] = []
var unit_at: Dictionary = {} # Vector2i -> Unit

var gold: Dictionary = {0: GameData.STARTING_GOLD, 1: GameData.STARTING_GOLD}
var faction_bonuses: Dictionary = {
	0: {"hp_mult": 0.0, "atk_mult": 0.0, "move_bonus": 0, "techs": []},
	1: {"hp_mult": 0.0, "atk_mult": 0.0, "move_bonus": 0, "techs": []},
}

var active_faction: int = GameData.Faction.PLAYER
var phase: int = Phase.IDLE
var selected_unit: Unit = null
var pending_move_options: Array[Vector2i] = []
var pending_attack_options: Array[Vector2i] = []
var game_over := false

var grid_renderer: GridRenderer
var units_layer: Node2D
var hud: HUD

## 16x12, fully mirrored (horizontally and vertically) for fairness.
const MAP_LAYOUT := [
	". . F . . . . . . . . . . F . .",
	". . . H . . W W W W . . H . . .",
	". . . . . C . . . . C . . . . .",
	". . . . R . . . . . . R . . . .",
	". . . . . . B . . B . . . . . .",
	"P P . . . . . . . . . . . . A A",
	"P P . . . . . . . . . . . . A A",
	". . . . . . B . . B . . . . . .",
	". . . . R . . . . . . R . . . .",
	". . . . . C . . . . C . . . . .",
	". . . H . . W W W W . . H . . .",
	". . F . . . . . . . . . . F . .",
]

const TERRAIN_CHAR := {
	".": GameData.Terrain.PLAIN,
	"F": GameData.Terrain.FOREST,
	"H": GameData.Terrain.HILL,
	"W": GameData.Terrain.WATER,
	"C": GameData.Terrain.CAPTURE,
	"R": GameData.Terrain.RESOURCE,
	"B": GameData.Terrain.BARRACKS,
	"P": GameData.Terrain.HQ_PLAYER,
	"A": GameData.Terrain.HQ_AI,
}

func _ready() -> void:
	_generate_map()

	grid_renderer = GridRenderer.new()
	add_child(grid_renderer)
	grid_renderer.set_grid(terrain, capture_owner)

	units_layer = Node2D.new()
	add_child(units_layer)

	hud = HUD.new()
	add_child(hud)
	hud.end_turn_requested.connect(_on_end_turn_requested)
	hud.recruit_requested.connect(_on_recruit_requested)
	hud.tech_requested.connect(_on_tech_requested)
	hud.restart_requested.connect(_on_restart_requested)

	_spawn_starting_units()
	_start_turn(active_faction)

func _generate_map() -> void:
	terrain.resize(GameData.GRID_COLS)
	capture_owner.resize(GameData.GRID_COLS)
	capture_contest.resize(GameData.GRID_COLS)
	capture_progress.resize(GameData.GRID_COLS)
	for x in range(GameData.GRID_COLS):
		terrain[x] = []
		capture_owner[x] = []
		capture_contest[x] = []
		capture_progress[x] = []
		terrain[x].resize(GameData.GRID_ROWS)
		capture_owner[x].resize(GameData.GRID_ROWS)
		capture_contest[x].resize(GameData.GRID_ROWS)
		capture_progress[x].resize(GameData.GRID_ROWS)

	for y in range(GameData.GRID_ROWS):
		var row: PackedStringArray = MAP_LAYOUT[y].split(" ")
		for x in range(GameData.GRID_COLS):
			terrain[x][y] = TERRAIN_CHAR[row[x]]
			capture_owner[x][y] = -1
			capture_contest[x][y] = -1
			capture_progress[x][y] = 0

func _spawn_starting_units() -> void:
	spawn_unit(GameData.UnitType.INFANTRY, GameData.Faction.PLAYER, Vector2i(2, 4))
	spawn_unit(GameData.UnitType.CAVALRY, GameData.Faction.PLAYER, Vector2i(2, 5))
	spawn_unit(GameData.UnitType.CAVALRY, GameData.Faction.PLAYER, Vector2i(2, 6))
	spawn_unit(GameData.UnitType.INFANTRY, GameData.Faction.PLAYER, Vector2i(2, 7))
	spawn_unit(GameData.UnitType.RANGED, GameData.Faction.PLAYER, Vector2i(3, 5))
	spawn_unit(GameData.UnitType.SIEGE, GameData.Faction.PLAYER, Vector2i(3, 6))

	spawn_unit(GameData.UnitType.INFANTRY, GameData.Faction.AI, Vector2i(13, 4))
	spawn_unit(GameData.UnitType.CAVALRY, GameData.Faction.AI, Vector2i(13, 5))
	spawn_unit(GameData.UnitType.CAVALRY, GameData.Faction.AI, Vector2i(13, 6))
	spawn_unit(GameData.UnitType.INFANTRY, GameData.Faction.AI, Vector2i(13, 7))
	spawn_unit(GameData.UnitType.RANGED, GameData.Faction.AI, Vector2i(12, 5))
	spawn_unit(GameData.UnitType.SIEGE, GameData.Faction.AI, Vector2i(12, 6))

# --- Unit lifecycle -------------------------------------------------------

func spawn_unit(type: int, faction: int, pos: Vector2i) -> Unit:
	var u := Unit.new()
	units_layer.add_child(u)
	u.setup(type, faction, pos, faction_bonuses[faction])
	unit_at[pos] = u
	units.append(u)
	return u

func remove_unit(u: Unit) -> void:
	unit_at.erase(u.grid_pos)
	units.erase(u)
	if selected_unit == u:
		deselect()
	u.queue_free()

func get_unit_at(pos: Vector2i) -> Unit:
	return unit_at.get(pos, null)

# --- Grid queries -----------------------------------------------------------

func compute_reachable(u: Unit) -> Array[Vector2i]:
	var start: Vector2i = u.grid_pos
	var cost_so_far := {start: 0}
	var frontier: Array[Vector2i] = [start]
	var result: Array[Vector2i] = [start]
	var dirs := [Vector2i(1, 0), Vector2i(-1, 0), Vector2i(0, 1), Vector2i(0, -1)]
	while frontier.size() > 0:
		var current: Vector2i = frontier.pop_front()
		for d in dirs:
			var next: Vector2i = current + d
			if not GameData.in_bounds(next):
				continue
			var t: int = terrain[next.x][next.y]
			var move_cost: int = GameData.TERRAIN_MOVE_COST[t]
			if move_cost >= 999:
				continue
			var occupant := get_unit_at(next)
			if occupant != null and occupant != u:
				continue
			var new_cost: int = cost_so_far[current] + move_cost
			if new_cost <= u.move_range and (not cost_so_far.has(next) or new_cost < cost_so_far[next]):
				cost_so_far[next] = new_cost
				frontier.append(next)
				if not result.has(next):
					result.append(next)
	return result

func compute_attack_targets(from_pos: Vector2i, range_min: int, range_max: int) -> Array[Vector2i]:
	var tiles: Array[Vector2i] = []
	for x in range(GameData.GRID_COLS):
		for y in range(GameData.GRID_ROWS):
			var p := Vector2i(x, y)
			var dist: int = abs(p.x - from_pos.x) + abs(p.y - from_pos.y)
			if dist >= range_min and dist <= range_max:
				tiles.append(p)
	return tiles

func get_faction_hq_tiles(faction: int) -> Array[Vector2i]:
	var wanted: int = GameData.Terrain.HQ_PLAYER if faction == GameData.Faction.PLAYER else GameData.Terrain.HQ_AI
	var tiles: Array[Vector2i] = []
	for x in range(GameData.GRID_COLS):
		for y in range(GameData.GRID_ROWS):
			if terrain[x][y] == wanted:
				tiles.append(Vector2i(x, y))
	return tiles

## HQ tiles plus any Barracks the faction has captured - all valid recruit spawn points.
func get_faction_recruit_tiles(faction: int) -> Array[Vector2i]:
	var tiles := get_faction_hq_tiles(faction)
	for x in range(GameData.GRID_COLS):
		for y in range(GameData.GRID_ROWS):
			if terrain[x][y] == GameData.Terrain.BARRACKS and capture_owner[x][y] == faction:
				tiles.append(Vector2i(x, y))
	return tiles

func find_ai_move_goal(u: Unit):
	var best: Vector2i
	var best_dist := 999999
	var found := false
	for x in range(GameData.GRID_COLS):
		for y in range(GameData.GRID_ROWS):
			if GameData.CAPTURABLE_TERRAIN.has(terrain[x][y]) and capture_owner[x][y] != u.faction:
				var d: int = abs(x - u.grid_pos.x) + abs(y - u.grid_pos.y)
				if d < best_dist:
					best_dist = d
					best = Vector2i(x, y)
					found = true
	for enemy in units:
		if enemy.faction != u.faction:
			var d: int = abs(enemy.grid_pos.x - u.grid_pos.x) + abs(enemy.grid_pos.y - u.grid_pos.y)
			if d < best_dist:
				best_dist = d
				best = enemy.grid_pos
				found = true
	return best if found else null

# --- Player input -----------------------------------------------------------

func _unhandled_input(event: InputEvent) -> void:
	if game_over or active_faction != GameData.Faction.PLAYER:
		return
	var pos: Vector2 = Vector2.ZERO
	var triggered := false
	if event is InputEventScreenTouch and event.pressed:
		pos = event.position
		triggered = true
	elif event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		pos = event.position
		triggered = true
	if not triggered:
		return
	var grid_pos: Vector2i = GameData.world_to_grid(pos)
	if not GameData.in_bounds(grid_pos):
		return
	_handle_tap(grid_pos)

func _handle_tap(grid_pos: Vector2i) -> void:
	match phase:
		Phase.IDLE:
			var u := get_unit_at(grid_pos)
			if u != null and u.faction == active_faction and u.can_act():
				_select_unit(u)
		Phase.UNIT_MOVE:
			if grid_pos == selected_unit.grid_pos or pending_move_options.has(grid_pos):
				_perform_move(selected_unit, grid_pos)
				if not game_over:
					_enter_attack_phase(selected_unit)
			else:
				var u := get_unit_at(grid_pos)
				if u != null and u.faction == active_faction and u.can_act() and u != selected_unit:
					_select_unit(u)
				else:
					deselect()
		Phase.UNIT_ATTACK:
			var target := get_unit_at(grid_pos)
			if target != null and target.faction != active_faction and pending_attack_options.has(grid_pos):
				_perform_attack(selected_unit, target)
				deselect()
			else:
				_finish_unit_turn(selected_unit)
				deselect()

func _select_unit(u: Unit) -> void:
	deselect()
	selected_unit = u
	u.set_selected(true)
	phase = Phase.UNIT_MOVE
	pending_move_options = compute_reachable(u)
	grid_renderer.set_highlights(pending_move_options, [])
	hud.show_unit_info(u)

func deselect() -> void:
	if selected_unit != null and is_instance_valid(selected_unit):
		selected_unit.set_selected(false)
	selected_unit = null
	phase = Phase.IDLE
	pending_move_options = []
	pending_attack_options = []
	grid_renderer.clear_highlights()
	hud.hide_unit_info()

func _perform_move(u: Unit, dest: Vector2i) -> void:
	unit_at.erase(u.grid_pos)
	var dest_terrain: int = terrain[dest.x][dest.y]
	u.move_to(dest)
	unit_at[dest] = u
	u.has_moved = true
	_check_hq_capture(u, dest_terrain)

func _check_hq_capture(u: Unit, dest_terrain: int) -> void:
	var enemy_hq: int = GameData.Terrain.HQ_AI if u.faction == GameData.Faction.PLAYER else GameData.Terrain.HQ_PLAYER
	if dest_terrain == enemy_hq:
		_end_game(u.faction)

func _enter_attack_phase(u: Unit) -> void:
	phase = Phase.UNIT_ATTACK
	var candidates := compute_attack_targets(u.grid_pos, u.range_min, u.range_max)
	var enemy_tiles: Array[Vector2i] = []
	for t in candidates:
		var e := get_unit_at(t)
		if e != null and e.faction != u.faction:
			enemy_tiles.append(t)
	pending_attack_options = enemy_tiles
	grid_renderer.set_highlights([], enemy_tiles)

func _perform_attack(attacker: Unit, defender: Unit) -> void:
	var result := CombatResolver.resolve_attack(
		attacker, defender,
		terrain[defender.grid_pos.x][defender.grid_pos.y],
		terrain[attacker.grid_pos.x][attacker.grid_pos.y]
	)
	if result["defender_died"]:
		remove_unit(defender)
	if result["attacker_died"]:
		remove_unit(attacker)
	else:
		_finish_unit_turn(attacker)
	_check_elimination_win()

func _finish_unit_turn(u: Unit) -> void:
	if not is_instance_valid(u):
		return
	u.has_moved = true
	u.has_acted = true

# --- AI hooks (mirrors of the player actions above, no input required) -----

func ai_move_unit(u: Unit, dest: Vector2i) -> void:
	if dest == u.grid_pos:
		return
	unit_at.erase(u.grid_pos)
	var dest_terrain: int = terrain[dest.x][dest.y]
	u.move_to(dest)
	unit_at[dest] = u
	_check_hq_capture(u, dest_terrain)

func ai_attack(attacker: Unit, defender: Unit) -> void:
	if game_over or not is_instance_valid(attacker) or not is_instance_valid(defender):
		return
	_perform_attack(attacker, defender)

func ai_finish_unit(u: Unit) -> void:
	_finish_unit_turn(u)

func ai_recruit(faction: int, type: int, pos: Vector2i) -> void:
	var cost: int = GameData.UNIT_DEFS[type]["cost"]
	if gold[faction] < cost:
		return
	gold[faction] -= cost
	spawn_unit(type, faction, pos)

func _check_elimination_win() -> void:
	var player_alive := false
	var ai_alive := false
	for u in units:
		if u.faction == GameData.Faction.PLAYER:
			player_alive = true
		else:
			ai_alive = true
	if not player_alive:
		_end_game(GameData.Faction.AI)
	elif not ai_alive:
		_end_game(GameData.Faction.PLAYER)

func _end_game(winner: int) -> void:
	if game_over:
		return
	game_over = true
	deselect()
	var text := "Victory!" if winner == GameData.Faction.PLAYER else "Defeat"
	hud.show_game_over(text)

# --- HUD callbacks -----------------------------------------------------------

func _on_recruit_requested(type: int) -> void:
	if active_faction != GameData.Faction.PLAYER or game_over:
		return
	var cost: int = GameData.UNIT_DEFS[type]["cost"]
	if gold[GameData.Faction.PLAYER] < cost:
		return
	var recruit_tiles := get_faction_recruit_tiles(GameData.Faction.PLAYER)
	for pos in recruit_tiles:
		if get_unit_at(pos) == null:
			gold[GameData.Faction.PLAYER] -= cost
			spawn_unit(type, GameData.Faction.PLAYER, pos)
			_refresh_hud()
			return

func _on_tech_requested(key: String) -> void:
	if active_faction != GameData.Faction.PLAYER or game_over:
		return
	var bonuses: Dictionary = faction_bonuses[GameData.Faction.PLAYER]
	if bonuses["techs"].has(key):
		return
	var cost: int = GameData.TECH_DEFS[key]["cost"]
	if gold[GameData.Faction.PLAYER] < cost:
		return
	gold[GameData.Faction.PLAYER] -= cost
	bonuses["techs"].append(key)
	match key:
		"logistics":
			bonuses["move_bonus"] += 1
		"armor":
			bonuses["hp_mult"] += 0.15
		"weaponry":
			bonuses["atk_mult"] += 0.15
	_apply_faction_bonuses(GameData.Faction.PLAYER)
	_refresh_hud()

func _apply_faction_bonuses(faction: int) -> void:
	var bonuses: Dictionary = faction_bonuses[faction]
	for u in units:
		if u.faction != faction:
			continue
		var def: Dictionary = GameData.UNIT_DEFS[u.unit_type]
		var hp_ratio: float = u.hp / u.max_hp
		u.max_hp = def["hp"] * (1.0 + bonuses["hp_mult"])
		u.hp = u.max_hp * hp_ratio
		u.atk = def["atk"] * (1.0 + bonuses["atk_mult"])
		u.move_range = def["move"] + bonuses["move_bonus"]
		u.queue_redraw()

func _on_restart_requested() -> void:
	get_tree().change_scene_to_file("res://scenes/MainMenu.tscn")

# --- Turn flow ---------------------------------------------------------------

func _on_end_turn_requested() -> void:
	if active_faction != GameData.Faction.PLAYER or game_over:
		return
	deselect()
	hud.close_popups()
	_end_turn()

func _end_turn() -> void:
	_process_capture_for_faction(active_faction)
	if game_over:
		return
	active_faction = 1 - active_faction
	_start_turn(active_faction)

func _start_turn(faction: int) -> void:
	for u in units:
		if u.faction == faction:
			u.reset_turn_flags()
	var income: int = GameData.HQ_INCOME
	for x in range(GameData.GRID_COLS):
		for y in range(GameData.GRID_ROWS):
			if capture_owner[x][y] != faction:
				continue
			match terrain[x][y]:
				GameData.Terrain.CAPTURE:
					income += GameData.CAPTURE_INCOME
				GameData.Terrain.RESOURCE:
					income += randi_range(GameData.RESOURCE_INCOME_MIN, GameData.RESOURCE_INCOME_MAX)
	gold[faction] += income
	grid_renderer.set_grid(terrain, capture_owner)
	_refresh_hud()

	if faction == GameData.Faction.AI and not game_over:
		AIController.take_turn(self)
		if not game_over:
			_end_turn()

func _process_capture_for_faction(faction: int) -> void:
	for x in range(GameData.GRID_COLS):
		for y in range(GameData.GRID_ROWS):
			if not GameData.CAPTURABLE_TERRAIN.has(terrain[x][y]):
				continue
			var pos := Vector2i(x, y)
			var occ := get_unit_at(pos)
			if occ == null or occ.faction != faction:
				continue
			if capture_owner[x][y] == faction:
				capture_contest[x][y] = -1
				continue
			if capture_contest[x][y] != faction:
				capture_contest[x][y] = faction
				capture_progress[x][y] = GameData.CAPTURE_TICKS
			capture_progress[x][y] -= 1
			if capture_progress[x][y] <= 0:
				capture_owner[x][y] = faction
				capture_contest[x][y] = -1

func _refresh_hud() -> void:
	hud.update_gold(gold[GameData.Faction.PLAYER], gold[GameData.Faction.AI])
	hud.set_turn_label(active_faction)
	hud.refresh_recruit_buttons(gold[GameData.Faction.PLAYER])
	hud.refresh_tech_buttons(faction_bonuses[GameData.Faction.PLAYER]["techs"], gold[GameData.Faction.PLAYER])
