extends CanvasLayer
class_name HUD
## All UI built procedurally in code (touch-friendly, mobile-first).
## Emits intents; Battle.gd owns all actual game-state mutation.

signal end_turn_requested
signal recruit_requested(unit_type: int)
signal tech_requested(tech_key: String)
signal build_requested
signal build_cancelled
signal restart_requested

var gold_label: Label
var turn_label: Label
var unit_info_panel: PanelContainer
var unit_info_label: RichTextLabel
var recruit_panel: PanelContainer
var tech_panel: PanelContainer
var build_panel: PanelContainer
var build_button: Button
var game_over_panel: PanelContainer
var game_over_label: Label
var recruit_buttons: Array[Button] = []
var tech_buttons: Dictionary = {}
var end_turn_button: Button
var recruit_toggle: Button
var tech_toggle: Button
var build_toggle: Button

const SIDEBAR_X := 970.0
const PANEL_Y := 340.0
const PANEL_H := 360.0

func _ready() -> void:
	_build_sidebar()
	_build_unit_info_panel()
	_build_recruit_panel()
	_build_tech_panel()
	_build_build_panel()
	_build_game_over_panel()

func _build_sidebar() -> void:
	var panel := PanelContainer.new()
	panel.position = Vector2(SIDEBAR_X, 16)
	panel.custom_minimum_size = Vector2(300, 200)
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
	gold_label.text = "Gold: 0"
	vbox.add_child(gold_label)

	end_turn_button = Button.new()
	end_turn_button.text = "End Turn"
	end_turn_button.custom_minimum_size = Vector2(260, 48)
	end_turn_button.pressed.connect(func(): end_turn_requested.emit())
	vbox.add_child(end_turn_button)

	recruit_toggle = Button.new()
	recruit_toggle.text = "Recruit"
	recruit_toggle.custom_minimum_size = Vector2(260, 48)
	recruit_toggle.pressed.connect(func(): _toggle_panel(recruit_panel))
	vbox.add_child(recruit_toggle)

	tech_toggle = Button.new()
	tech_toggle.text = "Tech"
	tech_toggle.custom_minimum_size = Vector2(260, 48)
	tech_toggle.pressed.connect(func(): _toggle_panel(tech_panel))
	vbox.add_child(tech_toggle)

	build_toggle = Button.new()
	build_toggle.text = "Build"
	build_toggle.custom_minimum_size = Vector2(260, 48)
	build_toggle.pressed.connect(func(): _toggle_panel(build_panel))
	vbox.add_child(build_toggle)

## Only one of recruit/tech/build should be open at a time; closing Build also
## cancels build-placement mode in Battle.gd.
func _toggle_panel(panel: PanelContainer) -> void:
	var was_visible := panel.visible
	recruit_panel.visible = false
	tech_panel.visible = false
	var build_was_open := build_panel.visible
	build_panel.visible = false
	panel.visible = not was_visible
	if build_was_open and panel != build_panel:
		build_cancelled.emit()

func _build_unit_info_panel() -> void:
	unit_info_panel = PanelContainer.new()
	unit_info_panel.position = Vector2(SIDEBAR_X, 226)
	unit_info_panel.custom_minimum_size = Vector2(300, 100)
	unit_info_panel.visible = false
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
	vbox.add_theme_constant_override("separation", 6)
	scroll.add_child(vbox)

	for type in GameData.UNIT_DEFS.keys():
		var def: Dictionary = GameData.UNIT_DEFS[type]
		var btn := Button.new()
		btn.text = "%s - %d gold" % [def["name"], def["cost"]]
		btn.custom_minimum_size = Vector2(260, 44)
		btn.pressed.connect(func(): recruit_requested.emit(type))
		vbox.add_child(btn)
		recruit_buttons.append(btn)

func _build_tech_panel() -> void:
	tech_panel = PanelContainer.new()
	tech_panel.position = Vector2(SIDEBAR_X, PANEL_Y)
	tech_panel.custom_minimum_size = Vector2(300, 220)
	tech_panel.visible = false
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
		vbox.add_child(btn)
		tech_buttons[key] = btn

func _build_build_panel() -> void:
	build_panel = PanelContainer.new()
	build_panel.position = Vector2(SIDEBAR_X, PANEL_Y)
	build_panel.custom_minimum_size = Vector2(300, 180)
	build_panel.visible = false
	add_child(build_panel)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 8)
	build_panel.add_child(vbox)

	var title := Label.new()
	title.text = "Construction"
	title.add_theme_font_size_override("font_size", 18)
	vbox.add_child(title)

	var hint := Label.new()
	hint.text = "Build a Barracks near your\nterritory to recruit closer\nto the front line."
	hint.add_theme_font_size_override("font_size", 13)
	vbox.add_child(hint)

	build_button = Button.new()
	build_button.text = "Build Barracks - %d gold" % GameData.BARRACKS_BUILD_COST
	build_button.custom_minimum_size = Vector2(280, 48)
	build_button.pressed.connect(func(): build_requested.emit())
	vbox.add_child(build_button)

	var cancel_btn := Button.new()
	cancel_btn.text = "Cancel"
	cancel_btn.custom_minimum_size = Vector2(280, 40)
	cancel_btn.pressed.connect(func():
		build_panel.visible = false
		build_cancelled.emit()
	)
	vbox.add_child(cancel_btn)

func _build_game_over_panel() -> void:
	game_over_panel = PanelContainer.new()
	game_over_panel.position = Vector2(340, 260)
	game_over_panel.custom_minimum_size = Vector2(400, 200)
	game_over_panel.visible = false
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
	vbox.add_child(restart_btn)

func update_gold(player_gold: int, ai_gold: int) -> void:
	gold_label.text = "Gold: %d   (AI: %d)" % [player_gold, ai_gold]

func set_turn_label(faction: int) -> void:
	turn_label.text = "Player Turn" if faction == GameData.Faction.PLAYER else "AI Turn"

func show_unit_info(unit: Unit) -> void:
	unit_info_panel.visible = true
	var def: Dictionary = GameData.UNIT_DEFS[unit.unit_type]
	var role_line := "Heals allies" if unit.is_healer else "ATK: %d" % int(unit.atk)
	unit_info_label.text = "[b]%s[/b]\nHP: %d / %d\n%s  DEF: %d\nMove: %d  Range: %d-%d" % [
		def["name"], int(unit.hp), int(unit.max_hp), role_line, int(unit.def_stat),
		unit.move_range, unit.range_min, unit.range_max,
	]

func hide_unit_info() -> void:
	unit_info_panel.visible = false

func close_popups() -> void:
	recruit_panel.visible = false
	tech_panel.visible = false
	build_panel.visible = false

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

func refresh_build_button(gold: int) -> void:
	build_button.disabled = gold < GameData.BARRACKS_BUILD_COST

func show_game_over(text: String) -> void:
	game_over_label.text = text
	game_over_panel.visible = true
