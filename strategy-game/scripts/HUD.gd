extends CanvasLayer
class_name HUD
## All UI built procedurally in code (touch-friendly, mobile-first).
## Emits intents; Battle.gd owns all actual game-state mutation.

signal end_turn_requested
signal recruit_requested(unit_type: int)
signal tech_requested(tech_key: String)
signal build_requested(building_type: int)
signal build_cancelled
signal restart_requested

var gold_label: Label
var turn_label: Label
var unit_info_panel: PanelContainer
var unit_info_label: RichTextLabel
var recruit_panel: PanelContainer
var tech_panel: PanelContainer
var build_panel: PanelContainer
var legend_panel: PanelContainer
var game_over_panel: PanelContainer
var game_over_label: Label
var recruit_buttons: Array[Button] = []
var tech_buttons: Dictionary = {}
var build_buttons: Dictionary = {} # Terrain type -> Button
var end_turn_button: Button
var minimap: Minimap

var _toggleable_panels: Array[PanelContainer] = []

const SIDEBAR_X := 970.0
const PANEL_Y := 340.0
const PANEL_H := 360.0

const PANEL_BG := Color(0.08, 0.09, 0.13, 0.93)
const PANEL_BORDER := Color(0.35, 0.4, 0.52, 0.7)
const ACCENT := Color(0.32, 0.55, 0.85)

func _panel_stylebox() -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = PANEL_BG
	sb.set_corner_radius_all(10)
	sb.set_content_margin_all(10)
	sb.border_color = PANEL_BORDER
	sb.set_border_width_all(2)
	return sb

func _style_panel(panel: PanelContainer) -> void:
	panel.add_theme_stylebox_override("panel", _panel_stylebox())

func _button_stylebox(bg: Color, border: Color) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = bg
	sb.set_corner_radius_all(8)
	sb.border_color = border
	sb.set_border_width_all(1)
	sb.content_margin_left = 10
	sb.content_margin_right = 10
	return sb

func _style_button(btn: Button) -> void:
	btn.add_theme_stylebox_override("normal", _button_stylebox(Color(0.14, 0.16, 0.22, 0.95), ACCENT.darkened(0.4)))
	btn.add_theme_stylebox_override("hover", _button_stylebox(Color(0.19, 0.23, 0.31, 0.95), ACCENT))
	btn.add_theme_stylebox_override("pressed", _button_stylebox(ACCENT.darkened(0.25), ACCENT))
	btn.add_theme_stylebox_override("disabled", _button_stylebox(Color(0.09, 0.09, 0.11, 0.75), Color(0.25, 0.25, 0.28)))
	btn.add_theme_color_override("font_color", Color(0.95, 0.95, 0.98))
	btn.add_theme_color_override("font_disabled_color", Color(0.5, 0.5, 0.55))

func _ready() -> void:
	_build_sidebar()
	_build_unit_info_panel()
	_build_recruit_panel()
	_build_tech_panel()
	_build_build_panel()
	_build_legend_panel()
	_build_game_over_panel()
	_build_minimap()
	_toggleable_panels = [recruit_panel, tech_panel, build_panel, legend_panel]

func _build_minimap() -> void:
	minimap = Minimap.new()
	minimap.position = Vector2(SIDEBAR_X - 10, 720 - 176)
	add_child(minimap)

func _build_sidebar() -> void:
	var panel := PanelContainer.new()
	panel.position = Vector2(SIDEBAR_X, 16)
	panel.custom_minimum_size = Vector2(300, 240)
	_style_panel(panel)
	add_child(panel)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 6)
	panel.add_child(vbox)

	turn_label = Label.new()
	turn_label.add_theme_font_size_override("font_size", 22)
	turn_label.text = "Player Turn"
	vbox.add_child(turn_label)

	gold_label = Label.new()
	gold_label.add_theme_font_size_override("font_size", 18)
	gold_label.add_theme_color_override("font_color", Color(1.0, 0.85, 0.3))
	gold_label.text = "Gold: 0"
	vbox.add_child(gold_label)

	end_turn_button = Button.new()
	end_turn_button.text = "End Turn"
	end_turn_button.custom_minimum_size = Vector2(260, 44)
	end_turn_button.pressed.connect(func(): end_turn_requested.emit())
	_style_button(end_turn_button)
	vbox.add_child(end_turn_button)

	vbox.add_child(_make_toggle_button("Recruit", func(): return recruit_panel))
	vbox.add_child(_make_toggle_button("Build", func(): return build_panel))
	vbox.add_child(_make_toggle_button("Tech", func(): return tech_panel))
	vbox.add_child(_make_toggle_button("Legend", func(): return legend_panel))

func _make_toggle_button(label: String, panel_getter: Callable) -> Button:
	var btn := Button.new()
	btn.text = label
	btn.custom_minimum_size = Vector2(260, 44)
	btn.pressed.connect(func(): _toggle_panel(panel_getter.call()))
	_style_button(btn)
	return btn

## Only one panel is open at a time; closing Build also cancels build-placement mode.
func _toggle_panel(panel: PanelContainer) -> void:
	var was_visible := panel.visible
	var build_was_open := build_panel.visible
	for p in _toggleable_panels:
		p.visible = false
	panel.visible = not was_visible
	if build_was_open and panel != build_panel:
		build_cancelled.emit()

func _build_unit_info_panel() -> void:
	unit_info_panel = PanelContainer.new()
	unit_info_panel.position = Vector2(SIDEBAR_X, 266)
	unit_info_panel.custom_minimum_size = Vector2(300, 100)
	unit_info_panel.visible = false
	_style_panel(unit_info_panel)
	add_child(unit_info_panel)

	unit_info_label = RichTextLabel.new()
	unit_info_label.bbcode_enabled = true
	unit_info_label.custom_minimum_size = Vector2(280, 90)
	unit_info_label.fit_content = true
	unit_info_panel.add_child(unit_info_label)

func _build_recruit_panel() -> void:
	recruit_panel = PanelContainer.new()
	recruit_panel.position = Vector2(SIDEBAR_X, PANEL_Y)
	recruit_panel.custom_minimum_size = Vector2(300, PANEL_H)
	recruit_panel.visible = false
	_style_panel(recruit_panel)
	add_child(recruit_panel)

	var outer := VBoxContainer.new()
	outer.add_theme_constant_override("separation", 6)
	recruit_panel.add_child(outer)

	var title := Label.new()
	title.text = "Recruit (HQ / Barracks)"
	title.add_theme_font_size_override("font_size", 18)
	outer.add_child(title)

	var scroll := ScrollContainer.new()
	scroll.custom_minimum_size = Vector2(280, PANEL_H - 40)
	outer.add_child(scroll)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 10)
	scroll.add_child(vbox)

	for type in GameData.UNIT_DEFS.keys():
		var def: Dictionary = GameData.UNIT_DEFS[type]
		var group := VBoxContainer.new()
		group.add_theme_constant_override("separation", 1)
		vbox.add_child(group)

		var btn := Button.new()
		btn.text = "%s - %d gold" % [def["name"], def["cost"]]
		btn.custom_minimum_size = Vector2(260, 40)
		btn.pressed.connect(func(): recruit_requested.emit(type))
		_style_button(btn)
		group.add_child(btn)
		recruit_buttons.append(btn)

		var blurb := Label.new()
		blurb.text = def.get("blurb", "")
		blurb.add_theme_font_size_override("font_size", 11)
		blurb.modulate = Color(1, 1, 1, 0.7)
		blurb.autowrap_mode = TextServer.AUTOWRAP_WORD
		blurb.custom_minimum_size = Vector2(260, 0)
		group.add_child(blurb)

func _build_tech_panel() -> void:
	tech_panel = PanelContainer.new()
	tech_panel.position = Vector2(SIDEBAR_X, PANEL_Y)
	tech_panel.custom_minimum_size = Vector2(300, 220)
	tech_panel.visible = false
	_style_panel(tech_panel)
	add_child(tech_panel)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 6)
	tech_panel.add_child(vbox)

	var title := Label.new()
	title.text = "Research"
	title.add_theme_font_size_override("font_size", 18)
	vbox.add_child(title)

	for key in GameData.TECH_DEFS.keys():
		var def: Dictionary = GameData.TECH_DEFS[key]
		var btn := Button.new()
		btn.text = "%s (%s) - %d gold" % [def["name"], def["desc"], def["cost"]]
		btn.custom_minimum_size = Vector2(280, 48)
		btn.pressed.connect(func(): tech_requested.emit(key))
		_style_button(btn)
		vbox.add_child(btn)
		tech_buttons[key] = btn

func _build_build_panel() -> void:
	build_panel = PanelContainer.new()
	build_panel.position = Vector2(SIDEBAR_X, PANEL_Y)
	build_panel.custom_minimum_size = Vector2(300, PANEL_H)
	build_panel.visible = false
	_style_panel(build_panel)
	add_child(build_panel)

	var outer := VBoxContainer.new()
	outer.add_theme_constant_override("separation", 8)
	build_panel.add_child(outer)

	var title := Label.new()
	title.text = "Construction"
	title.add_theme_font_size_override("font_size", 18)
	outer.add_child(title)

	for building_type in GameData.BUILDING_DEFS.keys():
		var def: Dictionary = GameData.BUILDING_DEFS[building_type]
		var group := VBoxContainer.new()
		group.add_theme_constant_override("separation", 1)
		outer.add_child(group)

		var btn := Button.new()
		btn.text = "[%s] %s - %d gold" % [def["category"], def["name"], def["cost"]]
		btn.custom_minimum_size = Vector2(280, 40)
		btn.pressed.connect(func(): build_requested.emit(building_type))
		_style_button(btn)
		group.add_child(btn)
		build_buttons[building_type] = btn

		var desc := Label.new()
		desc.text = def["desc"]
		desc.add_theme_font_size_override("font_size", 11)
		desc.modulate = Color(1, 1, 1, 0.7)
		desc.autowrap_mode = TextServer.AUTOWRAP_WORD
		desc.custom_minimum_size = Vector2(280, 0)
		group.add_child(desc)

	var cancel_btn := Button.new()
	cancel_btn.text = "Cancel"
	cancel_btn.custom_minimum_size = Vector2(280, 40)
	cancel_btn.pressed.connect(func():
		build_panel.visible = false
		build_cancelled.emit()
	)
	_style_button(cancel_btn)
	outer.add_child(cancel_btn)

func _build_legend_panel() -> void:
	legend_panel = PanelContainer.new()
	legend_panel.position = Vector2(SIDEBAR_X, PANEL_Y)
	legend_panel.custom_minimum_size = Vector2(300, PANEL_H)
	legend_panel.visible = false
	_style_panel(legend_panel)
	add_child(legend_panel)

	var outer := VBoxContainer.new()
	outer.add_theme_constant_override("separation", 6)
	legend_panel.add_child(outer)

	var title := Label.new()
	title.text = "Tile Legend"
	title.add_theme_font_size_override("font_size", 18)
	outer.add_child(title)

	var scroll := ScrollContainer.new()
	scroll.custom_minimum_size = Vector2(280, PANEL_H - 40)
	outer.add_child(scroll)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 8)
	scroll.add_child(vbox)

	for terrain_type in GameData.TERRAIN_INFO.keys():
		var info: Dictionary = GameData.TERRAIN_INFO[terrain_type]
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 8)
		vbox.add_child(row)

		var swatch := ColorRect.new()
		swatch.color = GameData.TERRAIN_COLOR.get(terrain_type, Color.MAGENTA)
		swatch.custom_minimum_size = Vector2(22, 22)
		row.add_child(swatch)

		var text_col := VBoxContainer.new()
		text_col.add_theme_constant_override("separation", 0)
		text_col.custom_minimum_size = Vector2(240, 0)
		row.add_child(text_col)

		var name_label := Label.new()
		name_label.text = info["name"]
		name_label.add_theme_font_size_override("font_size", 14)
		text_col.add_child(name_label)

		var desc_label := Label.new()
		desc_label.text = info["desc"]
		desc_label.add_theme_font_size_override("font_size", 11)
		desc_label.modulate = Color(1, 1, 1, 0.7)
		desc_label.autowrap_mode = TextServer.AUTOWRAP_WORD
		desc_label.custom_minimum_size = Vector2(240, 0)
		text_col.add_child(desc_label)

func _build_game_over_panel() -> void:
	game_over_panel = PanelContainer.new()
	game_over_panel.position = Vector2(340, 260)
	game_over_panel.custom_minimum_size = Vector2(400, 200)
	game_over_panel.visible = false
	_style_panel(game_over_panel)
	add_child(game_over_panel)

	var vbox := VBoxContainer.new()
	vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	vbox.add_theme_constant_override("separation", 12)
	game_over_panel.add_child(vbox)

	game_over_label = Label.new()
	game_over_label.add_theme_font_size_override("font_size", 30)
	game_over_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(game_over_label)

	var restart_btn := Button.new()
	restart_btn.text = "Back to Menu"
	restart_btn.custom_minimum_size = Vector2(200, 56)
	restart_btn.pressed.connect(func(): restart_requested.emit())
	_style_button(restart_btn)
	vbox.add_child(restart_btn)

func update_gold(player_gold: int, ai_gold: int) -> void:
	gold_label.text = "Gold: %d   (AI: %d)" % [player_gold, ai_gold]

func set_turn_label(faction: int) -> void:
	turn_label.text = "Player Turn" if faction == GameData.Faction.PLAYER else "AI Turn"

func show_unit_info(unit: Unit) -> void:
	unit_info_panel.visible = true
	var def: Dictionary = GameData.UNIT_DEFS[unit.unit_type]
	var role_line := "Heals allies" if unit.is_healer else "ATK: %d" % int(unit.atk)
	var name_line: String = def["name"]
	if unit.rank > 0:
		name_line += " [color=#ffd933](%s)[/color]" % Unit.RANK_NAMES[unit.rank]
	unit_info_label.text = "[b]%s[/b]\nHP: %d / %d\n%s  DEF: %d\nMove: %d  Range: %d-%d  Kills: %d" % [
		name_line, int(unit.hp), int(unit.max_hp), role_line, int(unit.def_stat),
		unit.move_range, unit.range_min, unit.range_max, unit.kills,
	]

func hide_unit_info() -> void:
	unit_info_panel.visible = false

func close_popups() -> void:
	for p in _toggleable_panels:
		p.visible = false

func refresh_tech_buttons(bought: Array, gold: int) -> void:
	for key in tech_buttons.keys():
		var btn: Button = tech_buttons[key]
		var cost: int = GameData.TECH_DEFS[key]["cost"]
		btn.disabled = bought.has(key) or gold < cost
		if bought.has(key):
			btn.text = "%s - RESEARCHED" % GameData.TECH_DEFS[key]["name"]

func refresh_recruit_buttons(gold: int) -> void:
	var i := 0
	for type in GameData.UNIT_DEFS.keys():
		var cost: int = GameData.UNIT_DEFS[type]["cost"]
		recruit_buttons[i].disabled = gold < cost
		i += 1

func refresh_build_buttons(gold: int) -> void:
	for building_type in build_buttons.keys():
		var cost: int = GameData.BUILDING_DEFS[building_type]["cost"]
		build_buttons[building_type].disabled = gold < cost

func show_game_over(text: String) -> void:
	game_over_label.text = text
	game_over_panel.visible = true
