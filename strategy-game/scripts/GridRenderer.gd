extends Node2D
class_name GridRenderer
## Draws the battle grid: terrain, capture ownership, building icons, fog of
## war, and move/attack/build highlights. Entirely procedural (colored
## rects + polygons), no tile images.

var terrain: Array = [] # [x][y] -> GameData.Terrain
var capture_owner: Array = [] # [x][y] -> -1 (neutral) / Faction
var move_highlights: Array[Vector2i] = []
var action_highlights: Array[Vector2i] = []
var action_is_heal := false
var build_highlights: Array[Vector2i] = []

## Fog of war, player-perspective only (the AI plays with full information regardless of
## what's drawn here - this only gates rendering and the player's own targeting).
var player_visible: Array = [] # [x][y] -> bool, currently in vision range of a player unit
var player_explored: Array = [] # [x][y] -> bool, ever seen

const OWNER_TINT := {
	GameData.Faction.PLAYER: Color(0.2, 0.4, 0.75),
	GameData.Faction.AI: Color(0.7, 0.25, 0.2),
}

const FOG_UNEXPLORED := Color(0.04, 0.045, 0.06)
const FOG_DIM_FACTOR := 0.4 # remembered-but-not-visible tiles are darkened toward black by this much

func set_grid(p_terrain: Array, p_capture_owner: Array) -> void:
	terrain = p_terrain
	capture_owner = p_capture_owner
	queue_redraw()

func set_fog(p_visible: Array, p_explored: Array) -> void:
	player_visible = p_visible
	player_explored = p_explored
	queue_redraw()

func set_highlights(moves: Array[Vector2i], actions: Array[Vector2i], is_heal: bool = false) -> void:
	move_highlights = moves
	action_highlights = actions
	action_is_heal = is_heal
	queue_redraw()

func clear_highlights() -> void:
	move_highlights.clear()
	action_highlights.clear()
	queue_redraw()

func set_build_highlights(tiles: Array[Vector2i]) -> void:
	build_highlights = tiles
	queue_redraw()

func clear_build_highlights() -> void:
	build_highlights.clear()
	queue_redraw()

## Cheap deterministic per-tile brightness variation so terrain reads as textured ground
## instead of flat color blocks, without needing any actual texture asset.
static func _tile_dither(x: int, y: int) -> float:
	var h: float = sin(float(x) * 12.9898 + float(y) * 78.233) * 43758.5453
	h = h - floor(h)
	return (h - 0.5) * 0.1

func _draw() -> void:
	var ts := GameData.TILE_SIZE
	var has_fog: bool = player_explored.size() > 0
	for x in range(GameData.GRID_COLS):
		for y in range(GameData.GRID_ROWS):
			var explored: bool = (not has_fog) or player_explored[x][y]
			var rect := Rect2(Vector2(x * ts, y * ts), Vector2(ts, ts))
			if not explored:
				draw_rect(rect, FOG_UNEXPLORED)
				continue

			var t: int = terrain[x][y]
			var color: Color = GameData.TERRAIN_COLOR.get(t, Color.MAGENTA)
			var owner: int = -1
			if GameData.CAPTURABLE_TERRAIN.has(t):
				owner = capture_owner[x][y]
				if OWNER_TINT.has(owner):
					color = color.lerp(OWNER_TINT[owner], 0.65)
			var d := _tile_dither(x, y)
			color = color.lightened(d) if d > 0.0 else color.darkened(-d)

			var visible: bool = (not has_fog) or player_visible[x][y]
			if not visible:
				color = color.lerp(Color.BLACK, FOG_DIM_FACTOR)
			draw_rect(rect, color)
			draw_rect(rect, Color(0, 0, 0, 0.25), false, 1.5)

			if visible or not has_fog:
				_draw_building_icon(t, Vector2(x * ts + ts / 2.0, y * ts + ts / 2.0), ts)

	for pos in move_highlights:
		var rect := Rect2(Vector2(pos.x * ts, pos.y * ts), Vector2(ts, ts))
		draw_rect(rect, Color(0.3, 0.6, 1.0, 0.35))
	var action_color := Color(0.3, 0.95, 0.4, 0.45) if action_is_heal else Color(1.0, 0.25, 0.2, 0.4)
	for pos in action_highlights:
		var rect := Rect2(Vector2(pos.x * ts, pos.y * ts), Vector2(ts, ts))
		draw_rect(rect, action_color)
	for pos in build_highlights:
		var rect := Rect2(Vector2(pos.x * ts, pos.y * ts), Vector2(ts, ts))
		draw_rect(rect, Color(1.0, 1.0, 1.0, 0.3))
		draw_rect(rect, Color(1.0, 1.0, 1.0, 0.8), false, 2.0)

## Small glyph drawn in the middle of building/landmark tiles so they read distinctly from
## flat terrain even before you know the color coding.
func _draw_building_icon(t: int, center: Vector2, ts: float) -> void:
	var s := ts * 0.16 # icon half-size
	match t:
		GameData.Terrain.CAPTURE:
			draw_line(center + Vector2(-s * 0.6, s), center + Vector2(-s * 0.6, -s), Color(1, 1, 1, 0.85), 2.0)
			draw_colored_polygon(PackedVector2Array([
				center + Vector2(-s * 0.6, -s), center + Vector2(s, -s * 0.5), center + Vector2(-s * 0.6, 0),
			]), Color(1, 1, 1, 0.85))
		GameData.Terrain.RESOURCE:
			draw_colored_polygon(PackedVector2Array([
				center + Vector2(0, -s), center + Vector2(s, 0), center + Vector2(0, s), center + Vector2(-s, 0),
			]), Color(1, 1, 1, 0.85))
		GameData.Terrain.BARRACKS:
			draw_line(center + Vector2(-s, -s), center + Vector2(s, s), Color(1, 1, 1, 0.85), 2.5)
			draw_line(center + Vector2(-s, s), center + Vector2(s, -s), Color(1, 1, 1, 0.85), 2.5)
		GameData.Terrain.MARKET:
			draw_arc(center, s, 0, TAU, 16, Color(1, 1, 1, 0.85), 2.0)
			draw_arc(center, s * 0.45, 0, TAU, 12, Color(1, 1, 1, 0.85), 1.5)
		GameData.Terrain.WATCHTOWER:
			draw_rect(Rect2(center + Vector2(-s * 0.5, -s * 0.2), Vector2(s, s * 1.2)), Color(1, 1, 1, 0.85))
			draw_colored_polygon(PackedVector2Array([
				center + Vector2(-s * 0.7, -s * 0.2), center + Vector2(s * 0.7, -s * 0.2), center + Vector2(0, -s * 1.1),
			]), Color(1, 1, 1, 0.85))
		GameData.Terrain.HQ_PLAYER, GameData.Terrain.HQ_AI:
			var pts := PackedVector2Array()
			for i in range(10):
				var angle := TAU * i / 10.0 - PI / 2.0
				var r := s if i % 2 == 0 else s * 0.45
				pts.append(center + Vector2(cos(angle), sin(angle)) * r)
			draw_colored_polygon(pts, Color(1, 1, 1, 0.85))
