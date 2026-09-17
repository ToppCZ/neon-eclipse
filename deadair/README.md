# Dead Air

A story adventure for a phone, set in the Neon Eclipse universe sixteen years after the sky went out.

You are **HALCYON**, a night-shift handler at relay K-7. You never leave the desk. Everything that happens tonight happens to somebody else, twelve blocks away in the dark, and reaches you as a voice on a channel.

Wren takes a delivery job across the Blackout Belt. Halo Division is standing on the pickup before she gets there. You have seven hours until grid-up, an archive nobody has opened since the handover, and no way to help her except by knowing things.

The night is only the first act.

- **Prologue — Shift Start.** 19:30. Six years of the same room: nine dead channels, a tape cabinet nobody has opened since the handover, and a bucket under switch four.
- **Act I — The Night.** 19:30 to grid-up at 04:50: the courier run, the ambush, and what is actually on the drum. Only dying and running out of night end the story here; everything else becomes the board state for what follows.
- **Act II — Daylight.** 06:10 to dusk: you are off shift, the relay is sealed, and you have one grey day to find the people who were blamed for the Eclipse. Out here *you* are the exposed one.
- **Act III — The Second Night.** The sixteenth Eclipse memorial, the one hour a year the old grid frequencies go live, and every surviving person this happened to standing in one room.

Each act runs its own clock and they join up: Act I ends at grid-up, Act II starts when you come off shift, dusk runs to the bell at 23:00, and the last night ends at grid-up again.

## Play it

It's a static page — any static server works. A zero-dependency one ships with the repo:

```bash
python devserver.py 8080 .
```

Then open `http://localhost:8080/deadair/` — **on a phone, or in a browser's device emulation at phone size.** Portrait is the design target, not a fallback.

## Design

It's built around one constraint: **there is more to find out tonight than there is night to find it in.**

- **The Window** — each act runs its own clock, and every question you ask, route you pick, tape you pull and door you knock on spends it. Nothing refunds it. There is always more worth doing than there is clock to do it in; that is the whole game.
- **Leads** — discrete facts in a Casefile. They aren't flavour: they unlock dialogue and route options, and the endgame is gated on what you can actually *prove*. Locked choices show you what you would have needed, so you finish a run knowing what you missed. One lead you can acquire is false, planted by someone who wants a particular night to happen; there is exactly one way to catch it.
- **Composure** and **Trust** — Wren's nerve, and her belief in you. Both are spendable and both are recoverable, but recovery costs minutes, which means every kind thing you do is taken directly out of the investigation. That trade is the game.
- **Exposure** — from Act II on, a third meter: how much Halo has on *you*. Everything useful you do in daylight is done where people can see you doing it, and it accumulates. Buying it back costs the only thing you need more.
- **Signal** — the Belt has no grid. In degraded stretches her messages arrive corrupted and options close. You hear it before you read it: the room tone is synthesized and gets grittier as the link does.
- **Timed beats** — three or four moments where the choice list has a countdown on it, because sometimes a handler's real failure is taking half a second too long.

Eight outcomes. A run that reaches the end measures roughly 80 minutes and up to 96, and comfortably over an hour and a half at an unhurried reading pace. You cannot see the whole map in one — a typical finishing run establishes around 22 of 31 facts and takes 5 or 6 of the 9 lines of enquiry open to it at the desk — and the Logged Outcomes screen tracks which endings you've reached.

Each investigation chapter has a floor as well as a ceiling: you cannot leave the desk, or the day, having looked into almost nothing. What you can't do is look into everything.

## Phone-first, specifically

- Single column, portrait, `100%`-height flex layout — no page scroll, only panel scroll
- Every control is a ≥48px tap target inside thumb reach; tabs sit at the bottom
- `env(safe-area-inset-*)` throughout, so notches and home indicators don't eat anything
- Nothing depends on hover, right-click, or a keyboard
- Tap the transcript to hurry a beat along
- Autosaves at every decision, across act boundaries; **Settings → Reduce effects** kills the scanlines, animation and text corruption

## Structure

```
index.html     shell: title, comms/casefile/trace panels, ending, modal
style.css      theming + the portrait layout
src/
  main.js        boot, title screen, tabs, settings/menu
  engine.js      story runner: node graph, line pacing, timed beats, fail states
  story.js       the entire script as data — nodes, leads, places, endings
  state.js       meters, leads, flags, counters, conditions, save/load
  ui.js          all DOM rendering; the engine never touches an element
  audio.js       procedural WebAudio room tone and message cues
```

Adding to the story means editing `story.js` and nothing else. `window.__deadair` exposes the live engine and state in the console.
