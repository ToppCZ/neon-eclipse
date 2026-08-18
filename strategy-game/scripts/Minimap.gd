extends Control
class_name Minimap
## Always-visible overview of the whole map (territory ownership + visible units),
## with tap/click-to-jump. Standard strategy-game staple, and important here since
## the 36x24 map doesn't fit on one screen.

signal jump_requested(world_pos: Vector2)

var terrain: Array = []
var capture_owner: Array = []
var units: Array = []
var player_visible: Array = []
var camera_rect: Rect2 = Rect2()

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_STOP
	custom_minimum_size = Vector2(240, 160)
	size = custom_minimum_size

func update_data(p_terrain: Array, p_capture_owner: Array, p_units: Array, p_player_visible: Array) -> void:
	terrain = p_terrain
	capture_owner = p_capture_owner
	units = p_units
	player_visible = p_player_visible
	queue_redraw()

func set_camera_rect(world_rect: Rect2) -> void:
	var scale_x: float = size.x / (GameData.GRID_COLS * GameData.TILE_SIZE)
	var scale_y: float = size.y / (GameData.GRID_ROWS * GameData.TILE_SIZE)
	camera_rect = Rect2(
		world_rect.position.x * scale_x, world_rect.position.y * scale_y,
		world_rect.size.x * scale_x, world_rect.size.y * scale_y,
	)
	queue_redraw()

func _draw() -> void:
	draw_rect(Rect2(Vector2.ZERO, size), Color(0.03, 0.03, 0.05))
	if terrain.is_empty():
		return
	var cell_w: float = size.x / GameData.GRID_COLS
	var cell_h: float = size.y / GameData.GRID_ROWS
	var has_fog: bool = player_visible.size() > 0

	for x in range(GameData.GRID_COLS):
		for y in range(GameData.GRID_ROWS):
			var t: int = terrain[x][y]
			var col := Color(0.22, 0.28, 0.22)
			if t == GameData.Terrain.HQ_PLAYER:
				col = Color(0.3, 0.5, 0.9)
			elif t == GameData.Terrain.HQ_AI:
				col = Color(0.9, 0.3, 0.3)
			elif t == GameData.Terrain.WATER:
				col = Color(0.15, 0.25, 0.45)
			elif GameData.CAPTURABLE_TERRAIN.has(t):
				var owner: int = capture_owner[x][y]
				if owner == GameData.Faction.PLAYER:
					col = Color(0.3, 0.5, 0.85)
				elif owner == GameData.Faction.AI:
					col = Color(0.8, 0.3, 0.3)
				else:
					col = Color(0.55, 0.5, 0.25)
			draw_rect(Rect2(Vector2(x * cell_w, y * cell_h), Vector2(cell_w + 0.6, cell_h + 0.6)), col)

	for u in units:
		if u.faction == GameData.Faction.AI and has_fog and not player_visible[u.grid_pos.x][u.grid_pos.y]:
			continue
		var dot_col := Color(0.4, 0.7, 1.0) if u.faction == GameData.Faction.PLAYER else Color(1.0, 0.4, 0.4)
		draw_circle(Vector2((u.grid_pos.x + 0.5) * cell_w, (u.grid_pos.y + 0.5) * cell_h), 2.2, dot_col)

	if camera_rect.size != Vector2.ZERO:
		draw_rect(camera_rect, Color(1, 1, 1, 0.9), false, 1.5)

func _gui_input(event: InputEvent) -> void:
	var local_pos: Vector2
	if event is InputEventScreenTouch and event.pressed:
		local_pos = event.position
	elif event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		local_pos = event.position
	else:
		return
	var grid_x: float = local_pos.x / (size.x / GameData.GRID_COLS)
	var grid_y: float = local_pos.y / (size.y / GameData.GRID_ROWS)
	jump_requested.emit(Vector2(grid_x * GameData.TILE_SIZE, grid_y * GameData.TILE_SIZE))
