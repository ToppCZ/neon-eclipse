extends RefCounted
class_name AIController
## Simple heuristic AI: recruit when it can afford it, attack the best
## available target, otherwise advance toward capture points or the
## nearest enemy. Fully synchronous (no animation delays) for MVP.

static func take_turn(battle: Battle) -> void:
	var faction: int = GameData.Faction.AI
	_try_recruit(battle, faction)
	var ai_units: Array = []
	for u in battle.units:
		if u.faction == faction:
			ai_units.append(u)
	for u in ai_units:
		if not is_instance_valid(u) or u.hp <= 0.0:
			continue
		_act_unit(battle, u)

static func _try_recruit(battle: Battle, faction: int) -> void:
	var hq_tiles := battle.get_faction_hq_tiles(faction)
	for pos in hq_tiles:
		if battle.get_unit_at(pos) != null:
			continue
		var gold: int = battle.gold[faction]
		var best_type := -1
		var best_cost := -1
		for type in GameData.UNIT_DEFS.keys():
			var cost: int = GameData.UNIT_DEFS[type]["cost"]
			if cost <= gold and cost > best_cost:
				best_cost = cost
				best_type = type
		if best_type == -1:
			continue
		battle.ai_recruit(faction, best_type, pos)

static func _act_unit(battle: Battle, u: Unit) -> void:
	var reachable: Array[Vector2i] = battle.compute_reachable(u)
	var best_score := -INF
	var best_move: Vector2i = u.grid_pos
	var best_target: Unit = null

	for pos in reachable:
		var attack_tiles := battle.compute_attack_targets(pos, u.range_min, u.range_max)
		for t in attack_tiles:
			var enemy := battle.get_unit_at(t)
			if enemy != null and enemy.faction != u.faction:
				var dmg := CombatResolver.compute_damage(u, enemy, battle.terrain[t.x][t.y])
				var score := dmg
				if dmg >= enemy.hp:
					score += 1000.0
				if score > best_score:
					best_score = score
					best_move = pos
					best_target = enemy

	if best_target != null:
		battle.ai_move_unit(u, best_move)
		battle.ai_attack(u, best_target)
		return

	var goal: Variant = battle.find_ai_move_goal(u)
	if goal != null:
		var closest := _closest_reachable_toward(reachable, goal)
		battle.ai_move_unit(u, closest)
	battle.ai_finish_unit(u)

static func _closest_reachable_toward(reachable: Array[Vector2i], goal: Vector2i) -> Vector2i:
	var best: Vector2i = reachable[0]
	var best_dist := 999999
	for pos in reachable:
		var d: int = abs(pos.x - goal.x) + abs(pos.y - goal.y)
		if d < best_dist:
			best_dist = d
			best = pos
	return best
