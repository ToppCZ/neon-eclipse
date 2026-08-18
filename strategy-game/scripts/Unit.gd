extends Node2D
class_name Unit
## A single military unit on the battle grid. Fully procedural visuals (no
## external art), matching the rest of the project's "generated at runtime"
## approach.

signal died(unit)

var unit_type: int
var faction: int
var grid_pos: Vector2i

var base_hp: float
var base_atk: float
var base_def: float
var base_move: int

var max_hp: float
var hp: float
var atk: float
var def_stat: float
var move_range: int
var range_min: int
var range_max: int
var vision_range: int

var has_moved := false
var has_acted := false
var is_selected := false
var flies := false
var is_healer := false

## Veterancy: units get stronger the more kills they rack up, like Advance Wars/XCOM-style
## unit experience, instead of every unit staying identical for the whole match.
var kills := 0
var rank := 0
const RANK_NAMES := ["", "Veteran", "Elite"]
const RANK_KILLS := [0, 2, 5]
const RANK_BONUS := [0.0, 0.10, 0.20]
const RANK_COLOR := Color(1.0, 0.85, 0.2)

var _label: Label
var _move_tween: Tween

func setup(p_type: int, p_faction: int, p_grid_pos: Vector2i, bonuses: Dictionary) -> void:
	unit_type = p_type
	faction = p_faction
	grid_pos = p_grid_pos
	var def: Dictionary = GameData.UNIT_DEFS[p_type]
	base_hp = def["hp"]
	base_atk = def["atk"]
	base_def = def["def"]
	base_move = def["move"]
	range_min = def["range_min"]
	range_max = def["range_max"]
	vision_range = def.get("vision", 3)
	flies = def.get("flies", false)
	is_healer = def.get("role", "attack") == "heal"
	position = GameData.grid_to_world(grid_pos)
	z_index = 10
	refresh_stats(bonuses, true)
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

## Recomputes effective stats from base stats + faction tech bonuses + veterancy rank.
## Called on setup, whenever tech is researched, and whenever this unit ranks up - keeping
## stat computation in one place instead of duplicated between Unit and Battle.
func refresh_stats(bonuses: Dictionary, full_heal: bool = false) -> void:
	var hp_ratio: float = 1.0 if full_heal else (hp / max_hp if max_hp > 0.0 else 1.0)
	var rank_mult: float = 1.0 + RANK_BONUS[rank]
	max_hp = base_hp * (1.0 + bonuses.get("hp_mult", 0.0)) * rank_mult
	hp = max_hp * hp_ratio
	atk = base_atk * (1.0 + bonuses.get("atk_mult", 0.0)) * rank_mult
	def_stat = base_def * rank_mult
	move_range = base_move + bonuses.get("move_bonus", 0)
	queue_redraw()

func register_kill(bonuses: Dictionary) -> void:
	kills += 1
	for i in range(RANK_KILLS.size() - 1, -1, -1):
		if kills >= RANK_KILLS[i] and rank < i:
			rank = i
			refresh_stats(bonuses)
			break

func _draw() -> void:
	var r := GameData.TILE_SIZE * 0.34
	var body_color: Color = GameData.UNIT_DEFS[unit_type]["color"]
	var shape: String = GameData.UNIT_DEFS[unit_type].get("shape", "circle")
	var ring_color := (Color(0.3, 0.55, 1.0) if faction == GameData.Faction.PLAYER else Color(0.9, 0.25, 0.25))
	draw_circle(Vector2.ZERO, r + 4, ring_color)
	_draw_body_shape(shape, r, body_color)
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
	# Rank chevrons: one small upward chevron per rank, below the HP bar.
	for i in range(rank):
		var cy: float = bar_pos.y + bar_h + 5 + i * 5
		draw_colored_polygon(PackedVector2Array([
			Vector2(-5, cy + 3), Vector2(0, cy), Vector2(5, cy + 3), Vector2(0, cy + 2),
		]), RANK_COLOR)

## Each unit type gets a distinct geometric silhouette (no external art) so the
## roster reads at a glance instead of everyone being the same colored dot.
func _draw_body_shape(shape: String, r: float, color: Color) -> void:
	match shape:
		"square":
			draw_colored_polygon(PackedVector2Array([
				Vector2(-r, -r), Vector2(r, -r), Vector2(r, r), Vector2(-r, r),
			]), color)
		"triangle":
			draw_colored_polygon(PackedVector2Array([
				Vector2(0, -r), Vector2(r * 0.87, r * 0.5), Vector2(-r * 0.87, r * 0.5),
			]), color)
		"triangle_down":
			draw_colored_polygon(PackedVector2Array([
				Vector2(0, r), Vector2(r * 0.87, -r * 0.5), Vector2(-r * 0.87, -r * 0.5),
			]), color)
		"diamond":
			draw_colored_polygon(PackedVector2Array([
				Vector2(0, -r), Vector2(r, 0), Vector2(0, r), Vector2(-r, 0),
			]), color)
		"hexagon":
			draw_colored_polygon(_regular_polygon(6, r), color)
		"octagon":
			draw_colored_polygon(_regular_polygon(8, r), color)
		"star5":
			draw_colored_polygon(_star_polygon(5, r, r * 0.45), color)
		"star6":
			draw_colored_polygon(_star_polygon(6, r, r * 0.5), color)
		"cross":
			draw_colored_polygon(_cross_polygon(r), color)
		"chevron":
			draw_colored_polygon(PackedVector2Array([
				Vector2(r, 0), Vector2(-r * 0.4, -r * 0.7), Vector2(-r * 0.1, 0), Vector2(-r * 0.4, r * 0.7),
			]), color)
		_:
			draw_circle(Vector2.ZERO, r, color)

func _regular_polygon(sides: int, radius: float) -> PackedVector2Array:
	var pts := PackedVector2Array()
	for i in range(sides):
		var angle := TAU * i / sides - PI / 2.0
		pts.append(Vector2(cos(angle), sin(angle)) * radius)
	return pts

func _star_polygon(spikes: int, outer_r: float, inner_r: float) -> PackedVector2Array:
	var pts := PackedVector2Array()
	var n := spikes * 2
	for i in range(n):
		var angle := TAU * i / n - PI / 2.0
		var r := outer_r if i % 2 == 0 else inner_r
		pts.append(Vector2(cos(angle), sin(angle)) * r)
	return pts

func _cross_polygon(radius: float) -> PackedVector2Array:
	var a := radius * 0.35 # arm half-width
	var b := radius # arm length
	return PackedVector2Array([
		Vector2(-a, -b), Vector2(a, -b), Vector2(a, -a), Vector2(b, -a),
		Vector2(b, a), Vector2(a, a), Vector2(a, b), Vector2(-a, b),
		Vector2(-a, a), Vector2(-b, a), Vector2(-b, -a), Vector2(-a, -a),
	])

## Logic (grid_pos, used by all pathfinding/targeting) updates instantly; the visual
## position eases into place afterward so units glide instead of teleporting.
func move_to(p_grid_pos: Vector2i) -> void:
	grid_pos = p_grid_pos
	var target := GameData.grid_to_world(grid_pos)
	if _move_tween != null and _move_tween.is_valid():
		_move_tween.kill()
	_move_tween = create_tween()
	_move_tween.set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	_move_tween.tween_property(self, "position", target, 0.22)

func take_damage(amount: float) -> bool:
	hp = max(0.0, hp - amount)
	queue_redraw()
	_flash_hit()
	if hp <= 0.0:
		died.emit(self)
		return true
	return false

func _flash_hit() -> void:
	var tween := create_tween()
	modulate = Color(1.6, 0.5, 0.5)
	tween.tween_property(self, "modulate", Color(1, 1, 1), 0.22)

func heal(amount: float) -> void:
	hp = min(max_hp, hp + amount)
	queue_redraw()
	var tween := create_tween()
	modulate = Color(0.6, 1.6, 0.7)
	tween.tween_property(self, "modulate", Color(1, 1, 1), 0.22)

func reset_turn_flags() -> void:
	has_moved = false
	has_acted = false

func can_act() -> bool:
	return not (has_moved and has_acted)

func set_selected(sel: bool) -> void:
	is_selected = sel
	queue_redraw()
