extends Node2D
class_name Unit
## A single military unit on the battle grid. Fully procedural visuals (no
## external art), matching the rest of the project's "generated at runtime"
## approach.

signal died(unit)

var unit_type: int
var faction: int
var grid_pos: Vector2i

var max_hp: float
var hp: float
var atk: float
var def_stat: float
var move_range: int
var range_min: int
var range_max: int

var has_moved := false
var has_acted := false
var is_selected := false
var flies := false
var is_healer := false

var _label: Label

func setup(p_type: int, p_faction: int, p_grid_pos: Vector2i, bonuses: Dictionary) -> void:
	unit_type = p_type
	faction = p_faction
	grid_pos = p_grid_pos
	var def: Dictionary = GameData.UNIT_DEFS[p_type]
	var hp_mult: float = 1.0 + bonuses.get("hp_mult", 0.0)
	var atk_mult: float = 1.0 + bonuses.get("atk_mult", 0.0)
	var move_bonus: int = bonuses.get("move_bonus", 0)
	max_hp = def["hp"] * hp_mult
	hp = max_hp
	atk = def["atk"] * atk_mult
	def_stat = def["def"]
	move_range = def["move"] + move_bonus
	range_min = def["range_min"]
	range_max = def["range_max"]
	flies = def.get("flies", false)
	is_healer = def.get("role", "attack") == "heal"
	position = GameData.grid_to_world(grid_pos)
	z_index = 10
	_build_label()
	queue_redraw()

func _build_label() -> void:
	_label = Label.new()
	_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_label.add_theme_font_size_override("font_size", 16)
	_label.add_theme_color_override("font_color", Color.BLACK)
	_label.text = GameData.UNIT_DEFS[unit_type]["letter"]
	_label.size = Vector2(GameData.TILE_SIZE, GameData.TILE_SIZE)
	_label.position = Vector2(-GameData.TILE_SIZE / 2.0, -GameData.TILE_SIZE / 2.0)
	add_child(_label)

func _draw() -> void:
	var r := GameData.TILE_SIZE * 0.34
	var body_color: Color = GameData.UNIT_DEFS[unit_type]["color"]
	var ring_color := (Color(0.3, 0.55, 1.0) if faction == GameData.Faction.PLAYER else Color(0.9, 0.25, 0.25))
	draw_circle(Vector2.ZERO, r + 4, ring_color)
	draw_circle(Vector2.ZERO, r, body_color)
	if is_selected:
		draw_arc(Vector2.ZERO, r + 9, 0, TAU, 32, Color(1, 1, 0.3), 3.0)
	if flies:
		draw_arc(Vector2.ZERO, r + 6, 0, TAU, 24, Color(1, 1, 1, 0.8), 1.5)
	# HP bar
	var bar_w := GameData.TILE_SIZE * 0.7
	var bar_h := 6.0
	var bar_pos := Vector2(-bar_w / 2.0, r + 8)
	draw_rect(Rect2(bar_pos, Vector2(bar_w, bar_h)), Color(0.15, 0.15, 0.15))
	var pct: float = clamp(hp / max_hp, 0.0, 1.0)
	var hp_color := Color(0.3, 0.85, 0.3).lerp(Color(0.9, 0.2, 0.2), 1.0 - pct)
	draw_rect(Rect2(bar_pos, Vector2(bar_w * pct, bar_h)), hp_color)

func move_to(p_grid_pos: Vector2i) -> void:
	grid_pos = p_grid_pos
	position = GameData.grid_to_world(grid_pos)

func take_damage(amount: float) -> bool:
	hp = max(0.0, hp - amount)
	queue_redraw()
	if hp <= 0.0:
		died.emit(self)
		return true
	return false

func heal(amount: float) -> void:
	hp = min(max_hp, hp + amount)
	queue_redraw()

func reset_turn_flags() -> void:
	has_moved = false
	has_acted = false

func can_act() -> bool:
	return not (has_moved and has_acted)

func set_selected(sel: bool) -> void:
	is_selected = sel
	queue_redraw()
