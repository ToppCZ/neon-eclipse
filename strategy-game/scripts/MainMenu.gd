extends Node2D
## Main menu, built entirely in code.

func _ready() -> void:
	var bg := ColorRect.new()
	bg.color = Color(0.08, 0.1, 0.14)
	bg.size = Vector2(1280, 720)
	add_child(bg)

	var vbox := VBoxContainer.new()
	vbox.position = Vector2(390, 220)
	vbox.custom_minimum_size = Vector2(500, 300)
	vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	vbox.add_theme_constant_override("separation", 18)
	add_child(vbox)

	var title := Label.new()
	title.text = "IRONFALL TACTICS"
	title.add_theme_font_size_override("font_size", 44)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(title)

	var subtitle := Label.new()
	subtitle.text = "Grid tactics + territory capture + tech research"
	subtitle.add_theme_font_size_override("font_size", 16)
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(subtitle)

	var start_btn := Button.new()
	start_btn.text = "Start Skirmish vs AI"
	start_btn.custom_minimum_size = Vector2(320, 64)
	start_btn.pressed.connect(func(): get_tree().change_scene_to_file("res://scenes/Battle.tscn"))
	vbox.add_child(start_btn)

	var help := Label.new()
	help.text = "Tap a unit, tap a highlighted tile to move,\ntap an enemy to attack. Capture points and\nthe enemy HQ to win."
	help.add_theme_font_size_override("font_size", 14)
	help.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(help)
