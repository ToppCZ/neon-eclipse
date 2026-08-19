# Game Popularity Research (August 2026)

Research into what kinds of games are currently popular, with a focus on how it applies to
Neon Eclipse (a bullet-heaven combat core + strategic roguelike run structure, no external assets).

## 1. Genre market share (overall industry, 2026)

Based on GAMIVO's 2026 genre analysis of the top 1,000 titles sold:

| Genre | Share |
|---|---|
| Action-adventure | 22.7% |
| RPG | 19.5% |
| Survival | 18.2% |
| Shooter | 14.5% |
| Simulation | 8.6% |
| Strategy | 6.7% |
| Sports | 6.2% |
| Puzzle | 2.0% |
| Fighting | 1.6% |

Takeaways:
- No single genre dominates overwhelmingly — genre diversity is healthy, which is good news for
  a niche-but-crystallizing genre like bullet heaven.
- RPGs are trending toward **meaningful choices** over grinding — players want builds, dialogue,
  and paths that feel personal, not repetitive. This validates run-structure choice-driven design
  (branching maps, relic tradeoffs) over pure stat-grind loops.
- Shooters/battle royale are *losing* playtime share to sandbox-style experiences — big
  live-service PvP shooters are past their peak growth phase.

## 2. Bullet heaven / survivors-like: directly relevant to this project

This is the most important finding for Neon Eclipse specifically.

- **Steam made it official**: Valve added a dedicated "Bullet Heaven" store tag on May 18, 2026 —
  formal recognition that the genre (kicked off by *Vampire Survivors*) has crystallized into its
  own category with conventions and an audience, not just a wave of clones.
- **2026 is the genre's busiest year ever** for releases — new entries arrive weekly. The genre
  went from novelty to established category in ~4 years, one of the fastest genre crystallizations
  in gaming history.
- **What separates commercial success from the pack in 2026**: the cosmetic-reskin wave of
  2023–2024 Vampire Survivors clones has largely receded. Titles that succeed now bring a
  **distinctive premise, mechanical innovation, or genuine creative vision** — not just a new
  skin on the same auto-fire/XP-orb loop.
- **Sub-genre fragmentation / format flexibility**: the format is spreading into adjacent styles —
  open-world bullet hell, spellslinger bullet hell, turn-based variants, and **cooperative**
  bullet heaven (e.g. a co-op survivors-like reportedly sold 1M+ copies in Early Access).
- **Accessibility + depth combo**: the genre keeps growing steadily (not spiking/fading) because
  it's easy to pick up but has room for build depth — matches Neon Eclipse's elemental
  resistance/synergy system and relic tradeoffs well.

### Relevance to Neon Eclipse

Neon Eclipse already leans into several of the winning patterns:
- ✅ Distinctive structure: bullet-heaven combat *wrapped in* a Slay-the-Spire-style branching
  run map (act/node choices, elites, shops) — this is a mechanical differentiator, not a reskin.
- ✅ Build depth via 5 damage types with real resistances/weaknesses + 2 synergy archetypes
  (physical focus vs. elemental diversity) rather than a flat stat pile.
- ✅ Meaningful choices between fights (node paths, shop picks, tiered rewards) rather than pure
  grind — aligned with the "RPGs moving away from grinding" trend above.

Gaps worth considering given the trend data:
- ⚠️ No co-op — cooperative bullet heaven is called out as a growing, commercially strong
  sub-genre in 2026 (the standout example sold 1M+ copies in EA). Multiplayer is a heavier lift
  (netcode, shared state) but is the clearest genre-level growth vector right now.
- ⚠️ "Distinctive premise" — the game currently reads as a fairly generic sci-fi/neon aesthetic;
  genre analysis specifically flags *world/premise commitment* (not just mechanics) as a
  differentiator for 2026 breakout titles.

## 3. Roguelike/roguelite: broader trend behind the run structure

- Hybrid fusion is the dominant 2026 trend: deckbuilder + survivors-like, word-crafting +
  roguelite, match-3 + roguelite, physics-puzzle + dungeon crawler, etc. Pure single-mechanic
  roguelites are less novel than genre-blends now.
- **Run-altering decision trees** are called out as a fresh design idea: branching systems that
  *lock out* certain future choices during a run based on earlier picks, adding strategic weight
  per decision — a step beyond simple tiered reward choices. Neon Eclipse's branching act map
  already has the skeleton for this; leaning harder into "this choice forecloses that path" could
  track the trend.
- Meta-progression layers (persistent unlocks between runs) remain a staple — Neon Eclipse already
  has this via the `localStorage` meta-progression shop.

## 4. Overall platform snapshot (Steam, August 2026)

- Counter-Strike 2 still leads Steam by playtime (legacy live-service dominance — not a useful
  comparison point for an indie roguelike).
- Top sellers by copies that week were mid/large-budget titles (Titan Quest II, Mafia: The Old
  Country, Warhammer 40k: Dawn of War – Definitive Edition) — i.e., established franchises/ARPGs
  still sell well, reinforcing action-RPG's strong overall market share (see section 1).
- This context mainly confirms the top-line genre data — the specific action-adventure/AAA chart
  toppers aren't directly comparable to a small bullet-heaven indie title, but ARPG's continued
  strength is a positive signal for genre-adjacent titles like this one.

## 5. Summary — what's "very popular" right now

1. **Action-adventure / RPG / survival** are the three biggest genre buckets industry-wide, with
   choice-driven, non-grindy RPG design specifically on the rise.
2. **Bullet heaven / survivors-like** — Neon Eclipse's own genre — just got formally recognized by
   Steam and is having its busiest release year yet; standing out now requires a distinctive
   premise/mechanics, not a reskin, and co-op is the clearest emerging growth pocket.
3. **Roguelite hybrids** (genre-blending, run-altering branching choices, persistent meta-progression)
   are the design trend layered on top of run-based games generally.
4. Big-budget shooters/battle royale are *losing* relative playtime share — sandbox and
   choice-driven genres are gaining it instead.

## 6. Follow-up: narrowing to 2D, cheap-to-art, endless + buy-upgrades

Constraint from discussion: the target is a **2D game, low art burden, endless (not a fixed
run/win-state), with progression driven by buying upgrades**. That points at two genres, both
backed by 2026 research and both compatible with Neon Eclipse's existing no-external-assets
Canvas/WebAudio tech:

### Idle / incremental games
- Proven that minimal art is not a liability: **Cookie Clicker** is the canonical proof point —
  no complex graphics, no story, no multiplayer, and it's still one of the most durable games in
  the genre. Clicker Heroes is described the same way: "simple 2D artwork, bright colorful UI,
  easy to understand."
- 2026 trend within the genre: developers are layering in more sophisticated mechanics on top of
  the simple core — better visual feedback, prestige systems, skill trees (Idle Skiller: "hundreds
  of items, dozens of zones, an extensive skill tree") — i.e. depth is added through *systems*,
  not art budget.
- Core loop is exactly "endless + buy upgrades to progress further": earn currency → spend on
  upgrades → higher earn rate / power → repeat, often with a prestige/reset layer for long-term
  replayability (NGU Idle, DodecaDragons, Realm Grinder).

### Endless bullet-heaven / survival mode
- This is the smaller pivot for Neon Eclipse specifically: keep the existing auto-fire combat,
  elemental system, and `meta.js` persistent shop, but replace (or add alongside) the fixed
  3-act/boss run structure with an **endless wave-survival mode** where in-run Cores (or a new
  meta-currency) buy permanent power-ups between attempts, and the "win condition" is just
  "how far/long can you get" — matching the requested endless + buy-upgrades loop while staying
  in genre.
- This lines up with genre data above: co-op/endless variants are the fastest-growing bullet-heaven
  sub-genre in 2026, and the format's whole appeal is "simple 2D shapes/sprites, no complex art,"
  which is already true of Neon Eclipse's runtime-generated Canvas visuals.

### Recommendation

The lowest-risk direction, given the existing codebase, is a **hybrid**: keep bullet-heaven combat
as the moment-to-moment gameplay, but restructure the meta-layer around an idle-game-style
progression loop — endless survival waves feeding a currency that buys permanent upgrades
(stat multipliers, unlocks, new weapons/passives), with a prestige/reset mechanic for long-term
replayability. This satisfies all three asked-for constraints (2D, cheap art, endless +
buy-upgrades) while reusing ~everything already built (`enemies.js`, `weapons.js`, `upgrades.js`,
`meta.js`, procedural Canvas/WebAudio) rather than starting a new game from scratch.

## Sources

- [GAMIVO Unveils Analysis on 2026's Most Popular Video Game Genres](https://www.globenewswire.com/news-release/2026/04/03/3268097/0/en/gamivo-unveils-analysis-on-2026-s-most-popular-video-game-genres.html)
- [Top Video Game Genres in 2026: Revenue, Statistics](https://rocketbrush.com/blog/most-popular-video-game-genres-revenue-statistics-genres-overview)
- [Weekly Top Selling Games on Steam (3rd–9th of August 2026)](https://www.gamegrin.com/news/weekly-top-selling-games-on-steam-3rd9th-of-august-2026)
- [The Best Bullet Heaven Games Now Steam Has Made The Genre Official](https://gamerant.com/best-bullet-heaven-games-steam-ranked/)
- [Vampire Survivors–like — Wikipedia](https://en.wikipedia.org/wiki/Vampire_Survivors%E2%80%93like)
- [Best Bullet Heaven Games 2026: 5 Picks Worth Playing](https://www.gamebrief.net/blog/best-bullet-heaven-games-2026)
- [What "Bullet Hell" Even Means in 2026 (Choost Games)](https://medium.com/@choost-games/what-bullet-hell-even-means-in-2026-131965d9a6dc)
- [The Best New Survivors-Like Games in 2026 (Choost Games)](https://choostgames.com/blog/new-survivors-like-games-2026/)
- [The 5 Most Innovative Roguelites of 2026 (Entalto Studios)](https://entaltostudios.com/the-5-most-innovative-roguelites-of-2026/)
- [New Roguelikes and Roguelites in August 2026: The Monthly Update (Rogueliker)](https://rogueliker.com/new-roguelikes-and-roguelites-in-august-2026-the-monthly-update/)
- [Best Idle Game in 2026: What to Play for Endless Progression](https://blog.clickerheroes.com/best-idle-game-2025/)
- [20 Best Idle Games 2026 – Top Clickers, RPGs & Sims](https://www.eneba.com/hub/games/best-idle-games/)
- [Top 10 Incremental & Idle Games — June 2026](https://www.topincrementalgames.com/guides/top-10-incremental-idle-games-june-2026)
- [Best 2D Games 2025–2026: Top Titles You Must Play](https://www.techwhoop.com/gaming/best-2d-games-2025-2026-guide/)
