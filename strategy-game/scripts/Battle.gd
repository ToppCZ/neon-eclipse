extends Node2D
class_name Battle
## Main battle controller: grid state, turn flow, input, camera, and win
## condition. Built entirely in code (no hand-authored child scenes).

enum Phase { IDLE, UNIT_MOVE, UNIT_ACTION }

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
var pending_action_options: Array[Vector2i] = [] # enemies (attack) or allies (heal)
var build_mode_active := false
var game_over := false

var grid_renderer: GridRenderer
var units_layer: Node2D
var hud: HUD
var camera: Camera2D

# --- Input state: drag-to-pan vs tap-to-act disambiguation -----------------
var _press_screen_pos: Vector2
var _press_active := false
var _press_moved_far := false
const DRAG_THRESHOLD := 14.0

const HQ_DEPTH := 2
const HQ_HEIGHT := 4
const FEATURE_SEED := 20260818

func _ready() -> void:
	_generate_map()

	grid_renderer = GridRenderer.new()
	add_child(grid_renderer)
	grid_renderer.set_grid(terrain, capture_owner)

	units_layer = Node2D.new()
	add_child(units_layer)

	camera = Camera2D.new()
	camera.position_smoothing_enabled = false
	add_child(camera)

	hud = HUD.new()
	add_child(hud)
	hud.end_turn_requested.connect(_on_end_turn_requested)
	hud.recruit_requested.connect(_on_recruit_requested)
	hud.tech_requested.connect(_on_tech_requested)
	hud.build_requested.connect(_on_build_requested)
	hud.build_cancelled.connect(cancel_build_mode)
	hud.restart_requested.connect(_on_restart_requested)

	_spawn_starting_units()
	camera.position = GameData.grid_to_world(Vector2i(HQ_DEPTH + 3, GameData.GRID_ROWS / 2))
	_clamp_camera()
	_start_turn(active_faction)

# --- Map generation ----------------------------------------------------------

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
			terrain[x][y] = GameData.Terrain.PLAIN
			capture_owner[x][y] = -1
			capture_contest[x][y] = -1
			capture_progress[x][y] = 0

	var mid_row := GameData.GRID_ROWS / 2
	for y in range(mid_row - HQ_HEIGHT / 2, mid_row + HQ_HEIGHT / 2):
		for x in range(HQ_DEPTH):
			terrain[x][y] = GameData.Terrain.HQ_PLAYER
			terrain[GameData.GRID_COLS - 1 - x][y] = GameData.Terrain.HQ_AI

	var rng := RandomNumberGenerator.new()
	rng.seed = FEATURE_SEED

	var half_cols := GameData.GRID_COLS / 2
	var half_rows := GameData.GRID_ROWS / 2

	# Terrain clutter, generated in the top-left quadrant and mirrored to all four
	# for a fair, symmetric map. Kept clear of the home spawn column (x < HQ_DEPTH+4).
	var clutter_positions := _pick_scattered_positions(rng, int(half_cols * half_rows * 0.1), HQ_DEPTH + 4, half_cols - 1, 0, half_rows - 1, 1)
	for p in clutter_positions:
		var kind: int = [GameData.Terrain.FOREST, GameData.Terrain.HILL, GameData.Terrain.WATER][rng.randi_range(0, 2)]
		_set_mirrored_terrain(p.x, p.y, kind)

	# Capture points + resource deposits, scattered across the quadrant (economy targets
	# at a range of distances from home, so the early game has something close to secure
	# and the map's center is worth a longer push).
	var building_positions := _pick_scattered_positions(rng, 8, HQ_DEPTH + 5, half_cols - 1, 1, half_rows - 2, 4)
	for i in range(building_positions.size()):
		var kind: int = GameData.Terrain.CAPTURE if i % 2 == 0 else GameData.Terrain.RESOURCE
		_set_mirrored_terrain(building_positions[i].x, building_positions[i].y, kind)

	# A handful of special neutral Barracks deep in no-man's-land: unlike the
	# player-built ones, these have to be captured, not bought.
	var barracks_positions := _pick_scattered_positions(rng, 1, half_cols - 3, half_cols - 1, half_rows - 3, half_rows - 1, 3)
	for p in barracks_positions:
		_set_mirrored_terrain(p.x, p.y, GameData.Terrain.BARRACKS)

func _set_mirrored_terrain(x: int, y: int, kind: int) -> void:
	for mx in [x, GameData.GRID_COLS - 1 - x]:
		for my in [y, GameData.GRID_ROWS - 1 - y]:
			if terrain[mx][my] == GameData.Terrain.PLAIN:
				terrain[mx][my] = kind

func _pick_scattered_positions(rng: RandomNumberGenerator, count: int, x_min: int, x_max: int, y_min: int, y_max: int, min_dist: int) -> Array[Vector2i]:
	var picked: Array[Vector2i] = []
	var attempts := 0
	while picked.size() < count and attempts < count * 50:
		attempts += 1
		var p := Vector2i(rng.randi_range(x_min, x_max), rng.randi_range(y_min, y_max))
		if terrain[p.x][p.y] != GameData.Terrain.PLAIN:
			continue
		var ok := true
		for q in picked:
			if abs(p.x - q.x) + abs(p.y - q.y) < min_dist:
				ok = false
				break
		if ok:
			picked.append(p)
	return picked

func _spawn_starting_units() -> void:
	var mid := GameData.GRID_ROWS / 2
	var loadout := [
		GameData.UnitType.INFANTRY, GameData.UnitType.INFANTRY,
		GameData.UnitType.CAVALRY, GameData.UnitType.RANGED,
		GameData.UnitType.SIEGE, GameData.UnitType.SCOUT, GameData.UnitType.MEDIC,
	]
	for i in range(loadout.size()):
		var row := mid - 3 + i
		spawn_unit(loadout[i], GameData.Faction.PLAYER, Vector2i(2, row))
		spawn_unit(loadout[i], GameData.Faction.AI, Vector2i(GameData.GRID_COLS - 3, row))

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
			var move_cost: int = 1 if u.flies else GameData.TERRAIN_MOVE_COST[t]
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

## Valid action targets from a given position: enemies for combat units,
## damaged allies for healers.
func compute_action_targets(u: Unit, from_pos: Vector2i) -> Array[Vector2i]:
	var candidates := compute_attack_targets(from_pos, u.range_min, u.range_max)
	var results: Array[Vector2i] = []
	for t in candidates:
		var other := get_unit_at(t)
		if other == null or other == u:
			continue
		if u.is_healer:
			if other.faction == u.faction and other.hp < other.max_hp:
				results.append(t)
		else:
			if other.faction != u.faction:
				results.append(t)
	return results

func get_faction_hq_tiles(faction: int) -> Array[Vector2i]:
	var wanted: int = GameData.Terrain.HQ_PLAYER if faction == GameData.Faction.PLAYER else GameData.Terrain.HQ_AI
	var tiles: Array[Vector2i] = []
	for x in range(GameData.GRID_COLS):
		for y in range(GameData.GRID_ROWS):
			if terrain[x][y] == wanted:
				tiles.append(Vector2i(x, y))
	return tiles

## HQ tiles plus any Barracks the faction has captured or built - all valid recruit spawn points.
func get_faction_recruit_tiles(faction: int) -> Array[Vector2i]:
	var tiles := get_faction_hq_tiles(faction)
	for x in range(GameData.GRID_COLS):
		for y in range(GameData.GRID_ROWS):
			if terrain[x][y] == GameData.Terrain.BARRACKS and capture_owner[x][y] == faction:
				tiles.append(Vector2i(x, y))
	return tiles

## Tiles the faction owns for the purpose of anchoring new construction: its HQ plus any
## capturable tile it currently holds.
func get_owned_anchor_tiles(faction: int) -> Array[Vector2i]:
	var tiles := get_faction_hq_tiles(faction)
	for x in range(GameData.GRID_COLS):
		for y in range(GameData.GRID_ROWS):
			if GameData.CAPTURABLE_TERRAIN.has(terrain[x][y]) and capture_owner[x][y] == faction:
				tiles.append(Vector2i(x, y))
	return tiles

func is_valid_build_tile(pos: Vector2i, anchors: Array[Vector2i]) -> bool:
	if terrain[pos.x][pos.y] != GameData.Terrain.PLAIN:
		return false
	if get_unit_at(pos) != null:
		return false
	for a in anchors:
		if abs(a.x - pos.x) + abs(a.y - pos.y) <= GameData.BARRACKS_BUILD_RADIUS:
			return true
	return false

func get_eligible_build_tiles(faction: int) -> Array[Vector2i]:
	var anchors := get_owned_anchor_tiles(faction)
	var eligible: Array[Vector2i] = []
	for x in range(GameData.GRID_COLS):
		for y in range(GameData.GRID_ROWS):
			var p := Vector2i(x, y)
			if is_valid_build_tile(p, anchors):
				eligible.append(p)
	return eligible

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

## Nearest damaged ally to a healer, for the AI.
func find_nearest_hurt_ally(u: Unit):
	var best: Unit = null
	var best_dist := 999999
	for other in units:
		if other.faction == u.faction and other != u and other.hp < other.max_hp:
			var d: int = abs(other.grid_pos.x - u.grid_pos.x) + abs(other.grid_pos.y - u.grid_pos.y)
			if d < best_dist:
				best_dist = d
				best = other
	return best

# --- Camera / input -----------------------------------------------------------

func _clamp_camera() -> void:
	var half_vp: Vector2 = get_viewport_rect().size / 2.0
	var map_size := Vector2(GameData.GRID_COLS * GameData.TILE_SIZE, GameData.GRID_ROWS * GameData.TILE_SIZE)
	camera.position.x = clamp(camera.position.x, half_vp.x, max(half_vp.x, map_size.x - half_vp.x))
	camera.position.y = clamp(camera.position.y, half_vp.y, max(half_vp.y, map_size.y - half_vp.y))

func _pan_camera(relative: Vector2) -> void:
	camera.position -= relative
	_clamp_camera()

func _unhandled_input(event: InputEvent) -> void:
	if game_over or active_faction != GameData.Faction.PLAYER:
		return
	if event is InputEventScreenTouch:
		if event.pressed:
			_press_screen_pos = event.position
			_press_active = true
			_press_moved_far = false
		else:
			if _press_active and not _press_moved_far:
				_try_tap(event.position)
			_press_active = false
	elif event is InputEventScreenDrag:
		if _press_active:
			_pan_camera(event.relative)
			if event.position.distance_to(_press_screen_pos) > DRAG_THRESHOLD:
				_press_moved_far = true
	elif event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		if event.pressed:
			_press_screen_pos = event.position
			_press_active = true
			_press_moved_far = false
		else:
			if _press_active and not _press_moved_far:
				_try_tap(event.position)
			_press_active = false
	elif event is InputEventMouseMotion:
		if _press_active and (event.button_mask & MOUSE_BUTTON_MASK_LEFT):
			_pan_camera(event.relative)
			if event.position.distance_to(_press_screen_pos) > DRAG_THRESHOLD:
				_press_moved_far = true

func _try_tap(screen_pos: Vector2) -> void:
	var world_pos: Vector2 = get_canvas_transform().affine_inverse() * screen_pos
	var grid_pos: Vector2i = GameData.world_to_grid(world_pos)
	if not GameData.in_bounds(grid_pos):
		return
	_handle_tap(grid_pos)

# --- Player input: tile taps -------------------------------------------------

func _handle_tap(grid_pos: Vector2i) -> void:
	if build_mode_active:
		_handle_build_tap(grid_pos)
		return
	match phase:
		Phase.IDLE:
			var u := get_unit_at(grid_pos)
			if u != null and u.faction == active_faction and u.can_act():
				_select_unit(u)
		Phase.UNIT_MOVE:
			if pending_action_options.has(grid_pos):
				# Enemy (or, for healers, ally) already in range without moving.
				_perform_unit_action(selected_unit, get_unit_at(grid_pos))
				deselect()
			elif grid_pos == selected_unit.grid_pos or pending_move_options.has(grid_pos):
				_perform_move(selected_unit, grid_pos)
				if not game_over:
					_enter_action_phase(selected_unit)
			else:
				var u := get_unit_at(grid_pos)
				if u != null and u.faction == active_faction and u.can_act() and u != selected_unit:
					_select_unit(u)
				else:
					deselect()
		Phase.UNIT_ACTION:
			if pending_action_options.has(grid_pos):
				_perform_unit_action(selected_unit, get_unit_at(grid_pos))
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
	pending_action_options = compute_action_targets(u, u.grid_pos)
	grid_renderer.set_highlights(pending_move_options, pending_action_options, u.is_healer)
	hud.show_unit_info(u)

func deselect() -> void:
	if selected_unit != null and is_instance_valid(selected_unit):
		selected_unit.set_selected(false)
	selected_unit = null
	phase = Phase.IDLE
	pending_move_options = []
	pending_action_options = []
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

func _enter_action_phase(u: Unit) -> void:
	phase = Phase.UNIT_ACTION
	pending_action_options = compute_action_targets(u, u.grid_pos)
	grid_renderer.set_highlights([], pending_action_options, u.is_healer)

func _perform_unit_action(actor: Unit, target: Unit) -> void:
	if actor.is_healer:
		_perform_heal(actor, target)
	else:
		_perform_attack(actor, target)

func _perform_heal(healer: Unit, target: Unit) -> void:
	target.heal(target.max_hp * GameData.HEAL_FRACTION)
	_finish_unit_turn(healer)

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

# --- Build mode ---------------------------------------------------------------

func start_build_mode() -> void:
	if active_faction != GameData.Faction.PLAYER or game_over:
		return
	deselect()
	build_mode_active = true
	grid_renderer.set_build_highlights(get_eligible_build_tiles(GameData.Faction.PLAYER))

func cancel_build_mode() -> void:
	build_mode_active = false
	grid_renderer.clear_build_highlights()
	hud.close_popups()

func _handle_build_tap(grid_pos: Vector2i) -> void:
	var anchors := get_owned_anchor_tiles(GameData.Faction.PLAYER)
	if not is_valid_build_tile(grid_pos, anchors):
		return
	if gold[GameData.Faction.PLAYER] < GameData.BARRACKS_BUILD_COST:
		return
	gold[GameData.Faction.PLAYER] -= GameData.BARRACKS_BUILD_COST
	terrain[grid_pos.x][grid_pos.y] = GameData.Terrain.BARRACKS
	capture_owner[grid_pos.x][grid_pos.y] = GameData.Faction.PLAYER
	grid_renderer.set_grid(terrain, capture_owner)
	_refresh_hud()
	cancel_build_mode()

func _on_build_requested() -> void:
	start_build_mode()

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

func ai_heal(healer: Unit, target: Unit) -> void:
	if game_over or not is_instance_valid(healer) or not is_instance_valid(target):
		return
	_perform_heal(healer, target)

func ai_finish_unit(u: Unit) -> void:
	_finish_unit_turn(u)

func ai_recruit(faction: int, type: int, pos: Vector2i) -> void:
	var cost: int = GameData.UNIT_DEFS[type]["cost"]
	if gold[faction] < cost:
		return
	gold[faction] -= cost
	spawn_unit(type, faction, pos)

func ai_build(faction: int, pos: Vector2i) -> void:
	if gold[faction] < GameData.BARRACKS_BUILD_COST:
		return
	gold[faction] -= GameData.BARRACKS_BUILD_COST
	terrain[pos.x][pos.y] = GameData.Terrain.BARRACKS
	capture_owner[pos.x][pos.y] = faction

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
	cancel_build_mode()
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
	hud.refresh_build_button(gold[GameData.Faction.PLAYER])
