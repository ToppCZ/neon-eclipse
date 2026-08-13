extends RefCounted
class_name CombatResolver
## Pure damage-math helper. No state; everything is passed in.

## Returns raw damage attacker deals to defender, before terrain defense.
static func compute_damage(attacker: Unit, defender: Unit, defender_terrain: int) -> float:
	var multiplier: float = GameData.TYPE_MATRIX[attacker.unit_type][defender.unit_type]
	var terrain_bonus: float = GameData.TERRAIN_DEFENSE_BONUS.get(defender_terrain, 0.0)
	var mitigation: float = 100.0 / (100.0 + defender.def_stat) * (1.0 - terrain_bonus)
	var variance := randf_range(0.9, 1.1)
	return attacker.atk * multiplier * mitigation * variance

## Resolves an attack: attacker hits defender, and if the defender survives
## and the attacker is within the defender's engagement range, defender
## counters at reduced strength. Returns a result dict for UI/logging.
static func resolve_attack(attacker: Unit, defender: Unit, defender_terrain: int, attacker_terrain: int) -> Dictionary:
	var dmg := compute_damage(attacker, defender, defender_terrain)
	var defender_died := defender.take_damage(dmg)
	var result := {
		"damage_dealt": dmg,
		"defender_died": defender_died,
		"counter_damage": 0.0,
		"attacker_died": false,
	}
	if not defender_died:
		var dist: int = abs(attacker.grid_pos.x - defender.grid_pos.x) + abs(attacker.grid_pos.y - defender.grid_pos.y)
		if dist >= defender.range_min and dist <= defender.range_max:
			var counter := compute_damage(defender, attacker, attacker_terrain) * 0.5
			result["counter_damage"] = counter
			result["attacker_died"] = attacker.take_damage(counter)
	return result
