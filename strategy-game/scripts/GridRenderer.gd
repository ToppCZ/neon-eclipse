extends Node2D
class_name GridRenderer
## Draws the battle grid: terrain, capture ownership, and move/attack
## highlights. Entirely procedural (colored rects), no tile images.

var terrain: Array = [] # [x][y] -> GameData.Terrain
var capture_owner: Array = [] # [x][y] -> -1 (neutral) / Faction
var move_highlights: Array[Vector2i] = []
var attack_highlights: Array[Vector2i] = []

const TERRAIN_COLOR := {
	0: Color(0.32, 0.45, 0.28), # PLAIN
	1: Color(0.16, 0.32, 0.18), # FOREST
	2: Color(0.5, 0.44, 0.32), # HILL
	3: Color(0.18, 0.32, 0.55), # WATER
	4: Color(0.42, 0.4, 0.2), # CAPTURE (base, tinted further by owner)
	5: Color(0.15, 0.3, 0.6), # HQ_PLAYER
	6: Color(0.55, 0.15, 0.15), # HQ_AI
}

func set_grid(p_terrain: Array, p_capture_owner: Array) -> void:
	terrain = p_terrain
	capture_owner = p_capture_owner
	queue_redraw()

func set_highlights(moves: Array[Vector2i], attacks: Array[Vector2i]) -> void:
	move_highlights = moves
	attack_highlights = attacks
	queue_redraw()

func clear_highlights() -> void:
	move_highlights.clear()
	attack_highlights.clear()
	queue_redraw()

func _draw() -> void:
	var ts := GameData.TILE_SIZE
	for x in range(GameData.GRID_COLS):
		for y in range(GameData.GRID_ROWS):
			var t: int = terrain[x][y]
			var color: Color = TERRAIN_COLOR.get(t, Color.MAGENTA)
			if t == GameData.Terrain.CAPTURE:
				var owner: int = capture_owner[x][y]
				if owner == GameData.Faction.PLAYER:
					color = Color(0.2, 0.4, 0.75)
				elif owner == GameData.Faction.AI:
					color = Color(0.7, 0.25, 0.2)
			var rect := Rect2(Vector2(x * ts, y * ts), Vector2(ts, ts))
			draw_rect(rect, color)
			draw_rect(rect, Color(0, 0, 0, 0.25), false, 1.5)
	for pos in move_highlights:
		var rect := Rect2(Vector2(pos.x * ts, pos.y * ts), Vector2(ts, ts))
		draw_rect(rect, Color(0.3, 0.6, 1.0, 0.35))
	for pos in attack_highlights:
		var rect := Rect2(Vector2(pos.x * ts, pos.y * ts), Vector2(ts, ts))
		draw_rect(rect, Color(1.0, 0.25, 0.2, 0.4))
