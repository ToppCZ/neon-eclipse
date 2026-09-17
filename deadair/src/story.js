// The script. Everything narrative lives here as data so the engine stays dumb.
//
// Node shape:
//   id, chapter, linesOnce?, effects?, lines[], choices[]|goto, timed?, ending?
// Line shape:
//   { who: 'wren'|'you'|'sys'|'desc'|'alert'|'vale'|'ilsa'|'sable', text, pause? }
// Choice shape:
//   { text, sub?, requires?, hideIfLocked?, lockedText?, effects?, goto }
//
// Costs are in minutes of the Window. The Window is the real antagonist: there
// is more to find out tonight than there is night to find it in.

export const LEADS = {
  L_MADDOX_NEW: {
    title: 'Maddox is new',
    text: 'The client booked through the relay four days ago. No prior jobs, no reputation, and he paid the full nine thousand up front — which nobody does unless the money is not theirs.',
  },
  L_MANIFEST_BLANK: {
    title: 'Blank manifest',
    text: 'The job ticket lists no contents. Not "sealed", not "discretionary" — the field is empty. Someone stripped it after filing.',
  },
  L_WREN_MOTHER: {
    title: "Wren's mother",
    text: 'Wren grew up in relay housing. Her mother was grid staff and died the year of the Eclipse. Wren has never once said how.',
  },
  L_CASE_PREGRID: {
    title: 'Pre-Eclipse hardware',
    text: 'The case holds a sealed optical drum, not a chip. That format died with the old grid sixteen years ago. Whatever is on it was written before the sky went out.',
  },
  L_HALO_LEDGER: {
    title: 'They call it the Ledger',
    text: 'The team that hit the drop was Halo Division, off-books, no district markings. They were not looking for a courier. They were looking for something they called the Ledger.',
  },
  L_ROUTE_LEAK: {
    title: 'The route leaked',
    text: 'Halo was standing on the drop before Wren got there. Only three parties knew that address: the client, the relay dispatcher, and this desk.',
  },
  L_BEACON: {
    title: 'The case is calling',
    text: 'The case emits a slow paired pulse on an old maintenance band. It is not tracking Wren. It is announcing itself — and it has been doing it since she picked it up.',
  },
  L_ILSA_ECLIPSE: {
    title: "Ilsa's night",
    text: 'Ilsa was on air the night of the Eclipse. She says the burn order came down a relay line, not a corporate one, and that the voice reading it out used a handler call sign.',
  },
  L_SABLE_ROSTER: {
    title: 'Sable built the shift',
    text: 'Sable assigned this job to this desk on this night by hand, overriding the rota. She has never done that for any other ticket in the log.',
  },
  L_HALCYON_DESK: {
    title: 'HALCYON is a chair',
    text: 'HALCYON is not you. It is the call sign attached to this desk, inherited by whoever sits in it. Sixteen years ago someone else answered to it here.',
  },
  L_BURN_LOG: {
    title: 'The burn relay',
    text: 'Archive fragment, 03:14, the night of the Eclipse: the order to burn the satellite array was acknowledged and passed on from this relay. The acknowledging station was K-7. This station.',
  },
  L_OPERATOR_SEVEN: {
    title: 'Operator Seven',
    text: 'The grid crew blamed for the Eclipse were named as numbers, never people. Operator Seven refused the burn order twice before someone else confirmed it. Seven was Wren\'s mother.',
  },
  L_WREN_ASKED: {
    title: 'She asked for you',
    text: 'Wren did not get this desk by chance. She has been buying relay shifts for a year looking for the handler who was on air that night. She asked for HALCYON by name.',
  },
  L_VALE_DEAL: {
    title: "Vale's offer",
    text: 'Cormac Vale of Halo Division has your channel and your real name. He is offering a clean file and a pension for one thing: the case, and the courier carrying it.',
  },
  L_MADDOX_FED: {
    title: 'Maddox sold her out',
    text: 'A cross-check puts the client in a Halo interview room the day before he filed the job. The obvious read is that the whole contract was a net.',
    planted: true,
    falseNote: 'Fed to you by Vale. Maddox was in that room because Halo pulled him in — he filed the job the next day anyway.',
  },
  L_MADDOX_TRUE: {
    title: 'Maddox is grid staff',
    text: 'The client is Ezra Maddox — archivist, old grid, one of the crew blamed for the Eclipse and the only one who never took the settlement. He is not buying the Ledger. He is trying to get it out.',
  },
  L_PIER_NET: {
    title: 'The pier is a net',
    text: 'Halo has the Ashgate handover covered. If Wren walks the case to the pier as contracted, she walks it into them.',
  },
  L_BROADCAST_KEY: {
    title: 'The relay can still shout',
    text: 'K-7 keeps its legacy broadcast stack. At grid-up, for about ninety seconds, every receiver in the city syncs to the relay band. Enough to push the drum out to all of them at once.',
  },

  L_SUBSTATION_FOUR: {
    title: 'Four of us still here',
    text: 'Scratched into the wall of Ashgate substation: 03:25, LOST, FOUR OF US STILL HERE, and four sets of initials. The substation crews were never on the review board — never named, numbered, blamed or compensated. They were four people in a building that stopped working.',
  },
  L_STANIK: {
    title: 'Aurel Stanik',
    text: 'The handler who held this call sign that night. Forty-four years old, eleven years on the desk, eleven more after it, died in the chair. He filed a maintenance ticket about a leak over switch four every quarter for nineteen years and it was never once actioned.',
  },
  L_M2_CALLER: {
    title: 'The call came from M-2',
    text: 'An acknowledgement implies somebody to acknowledge. The trunk log shows one inbound to K-7 at 03:13 that night, from relay station M-2 — another handler, in another dead room, passing it down the line.',
  },

  // --- Act II: daylight ---
  L_SABLE_ORDER: {
    title: "Sable took the money",
    text: 'The standing order routing old-grid jobs to K-7 was not a favour Sable did for a courier. Wren paid her for it, monthly, for a year — and Sable never once told her the desk she was buying had already been searched by somebody else.',
  },
  L_NINE_LIST: {
    title: 'The Nine',
    text: 'The Eclipse review board named nine operators as numbers, never names. Three are dead, one is Maddox, one refused to be found, and the rest took a settlement and the silence that came with it. Operator Seven was Wren\'s mother.',
  },
  L_ROOK_HEARD: {
    title: 'Rook was on the floor',
    text: 'Teodor "Rook" Reyes was Operator Four and stood eight feet from Seven when the order came down. He heard her refuse it twice. He will say so to anyone who buys him a drink, which is why nobody has ever believed him.',
  },
  L_AMMI_GAG: {
    title: 'The gag names a relay',
    text: "Ammi Sarran's settlement forbids her from discussing the array, the review board, or — in a clause nobody has ever explained — any relay station or its staff. Somebody was frightened of a relay sixteen years ago.",
  },
  L_FERRANT_SIGNED: {
    title: 'Ferrant signed it',
    text: 'The burn authorisation carries one signature above the operator line: O. FERRANT, then Director of Grid Continuity, now chair of the Eclipse Memorial Trust and the woman who reads the names out every year.',
  },
  L_VALE_WAS_RELAY: {
    title: 'Vale sat in a chair like yours',
    text: 'Before Halo, Cormac Vale worked a relay desk — station M-2, eleven years, ending the month after the Eclipse. He was not the voice on the K-7 tape. He was the voice that called K-7.',
  },
  L_SECOND_COPY: {
    title: 'Maddox kept a copy',
    text: 'Archivists do not move a unique object across a city in a toolbox. There is a second drum, and Ezra Maddox has been sitting on it for four days waiting to find out whether the first one got through.',
  },
  L_MEMORIAL: {
    title: 'The memorial is tonight',
    text: 'The sixteenth Eclipse memorial is held at the Ashgate Exchange at 23:00 — the one night a year the old grid frequencies are re-energised for the bell, and the one room where every name on the review board will be standing together.',
  },
  L_WREN_CHARGE: {
    title: 'What they are charging her with',
    text: 'Not theft. Unlicensed carriage across a restricted grid corridor — a transport offence with a bail figure and no requirement to say what was being carried. They are not trying to convict her. They are trying to not have a trial.',
  },
  L_DESK_TAPES: {
    title: 'The tapes are physical',
    text: 'K-7\'s archive is spooled tape in a cabinet, not a file on a server. It cannot be remotely deleted, edited, or denied. It can only be carried out of the building or set on fire.',
  },
};

export const PLACES = {
  relay: { name: 'Relay K-7', note: 'Your desk. Nine floors of dead switchgear and one working chair.' },
  ferrite: { name: 'Ferrite Row', note: 'Salvage terraces under the old freight line. The dead drop is in a gutted transformer housing.' },
  stair: { name: 'The Mercy Stair', note: 'Nine hundred steps down the seawall. Fast, exposed, no cover at all.' },
  rill: { name: 'The Rill', note: 'Storm canal. Slow, wet, and nobody watches it but the people who live in it.' },
  spine: { name: 'Ferrite Spine', note: 'The elevated freight line. Halo runs patrols on it because it sees everything.' },
  belt: { name: 'The Blackout Belt', note: 'Twelve blocks with no grid, no light, and no working relay handshake since the Eclipse.' },
  nest: { name: "Ilsa's nest", note: 'A scav radio shack built into a collapsed exchange. She hears everything and sells most of it.' },
  substation: { name: 'Ashgate Substation', note: 'Cold since the Eclipse. Thick walls, one door, and a transmitter mast nobody decommissioned.' },
  pier: { name: 'Ashgate Pier', note: 'The handover point. Open water on one side, one road on the other.' },

  home: { name: 'Your flat', note: 'Two rooms above a shuttered chandler. You have slept in it for six years and nobody has ever knocked on the door.' },
  relay_sealed: { name: 'Relay K-7, sealed', note: 'Halo tape across the stairwell and a man on the door who will not meet your eye.' },
  rill_bar: { name: "The Drowned Bell", note: 'A bar built into the Rill wall that has been open since before the Eclipse and serves exactly one thing.' },
  ammi_house: { name: 'Sarran house, Verge', note: 'The good side of the hill, where the streetlights have worked continuously for sixteen years.' },
  maddox_flat: { name: "Maddox's rooms", note: 'Index cards on every surface, about a building that no longer exists.' },
  exchange: { name: 'Ashgate Exchange', note: 'Where the memorial is held. The one night a year they re-energise the old grid frequencies for the bell.' },
  holding: { name: 'Ashgate holding', note: 'Four cells and a duty desk. Nobody is ever there long enough to need more.' },
};

export const ENDINGS = {
  dead_air: { name: 'Dead Air', desc: 'The line went quiet and stayed quiet.' },
  timeout: { name: 'Grid-Up', desc: 'The night ended before you did.' },
  burned: { name: 'Burned', desc: 'You were played, and you paid with someone else.' },
  seat: { name: 'The Seat', desc: 'You took the chair, and in four years you read the numbers out.' },
  ash: { name: 'Ash and Salt', desc: 'You let it go. Everyone lived. Nothing changed.' },
  broadcast: { name: 'Broadcast', desc: 'It went out raw, to a city with no idea what it meant.' },
  testimony: { name: 'Testimony', desc: 'One room heard it from the people it happened to.' },
  handshake: { name: 'Handshake', desc: 'The truth got out with its context, with their consent, and you chose how you went dark.' },
};

export const NODES = {};

function node(def) { NODES[def.id] = def; }

// ============================================================================
// CHAPTER 1 — NIGHTSIDE
// ============================================================================

node({
  id: 'ch1_open',
  chapter: 1,
  effects: { loc: 'relay', signal: 'clear' },
  lines: [
    { who: 'sys', text: 'Channel 4 — courier band — OPEN' },
    { who: 'desc', text: 'The desk wakes up the way it always does: nine dead channels, one live one, and the sound of the sea coming through a wall that has not been fixed since before you were hired.' },
    { who: 'desc', text: 'The live channel is a courier. It is always a courier.' },
    { who: 'wren', text: 'Halcyon. You there?' },
    { who: 'wren', text: "It's Wren. I'm on the Row, and I've got a bad feeling and no better options, so I'd like a voice tonight." },
  ],
  choices: [
    {
      text: "I'm here. Talk to me.",
      sub: 'Open warm.',
      effects: { trust: 6, composure: 4 },
      goto: 'ch1_job',
    },
    {
      text: 'Handler on station. Give me the ticket.',
      sub: 'Open professional.',
      effects: { trust: 2 },
      goto: 'ch1_job',
    },
    {
      text: "Bad feelings aren't billable. What's the job?",
      sub: 'Open cold.',
      effects: { trust: -3, composure: -4 },
      goto: 'ch1_job',
    },
  ],
});

node({
  id: 'ch1_job',
  chapter: 1,
  linesOnce: true,
  lines: [
    { who: 'wren', text: 'Pickup is a dead drop in Ferrite Row — transformer housing, third terrace. One case. Hand it to a man at Ashgate Pier before grid-up.' },
    { who: 'wren', text: "Nine thousand. Paid already, all of it, which you'll notice is not how anybody does this." },
    { who: 'desc', text: 'You can hear her walking. Gravel, then metal, then gravel.' },
  ],
  choices: [
    {
      text: "Who's the client?",
      sub: "Pull the ticket while she walks.",
      requires: { flags: { askedClient: false } },
      effects: { time: -9, count: { brief: 1 }, flags: { askedClient: true }, leads: ['L_MADDOX_NEW'] },
      goto: 'ch1_q_client',
    },
    {
      text: "What's in the case?",
      requires: { flags: { askedCase: false } },
      effects: { time: -8, count: { brief: 1 }, flags: { askedCase: true }, leads: ['L_MANIFEST_BLANK'] },
      goto: 'ch1_q_case',
    },
    {
      text: 'Why you? Why tonight?',
      requires: { flags: { askedWhy: false } },
      effects: { time: -9, count: { brief: 1 }, flags: { askedWhy: true }, trust: 3 },
      goto: 'ch1_q_why',
    },
    {
      text: 'Before you move — are you alright?',
      sub: 'Costs night. Buys you a steadier courier.',
      requires: { flags: { askedOkay: false } },
      effects: { time: -7, count: { brief: 1 }, flags: { askedOkay: true }, composure: 12, trust: 5 },
      goto: 'ch1_okay',
    },
    {
      text: 'Enough. Start moving.',
      sub: 'Spend nothing. Learn nothing.',
      requires: { counts: { brief: { min: 2 } } },
      lockedText: 'She has told you almost nothing about the job and you have asked her less. (Needs: 2 questions)',
      effects: { composure: 3 },
      goto: 'ch1_route',
    },
  ],
});

node({
  id: 'ch1_q_client',
  chapter: 1,
  lines: [
    { who: 'desc', text: 'The ticket comes up slow. Everything on this desk comes up slow.' },
    { who: 'sys', text: 'Client: MADDOX, E. · Registered 4 days · Prior jobs: none · Balance: paid in full' },
    { who: 'you', text: "He's four days old and he's already paid you. That's not a client, that's a man in a hurry." },
    { who: 'wren', text: "Or a man who's scared. Those pay the same." },
  ],
  goto: 'ch1_job',
});

node({
  id: 'ch1_q_case',
  chapter: 1,
  lines: [
    { who: 'wren', text: "Ticket says nothing. Literally nothing — I looked. Contents field is blank." },
    { who: 'you', text: "Not 'sealed'. Blank." },
    { who: 'wren', text: "Blank. Somebody typed something there and then went back and took it out." },
    { who: 'desc', text: 'Which is a thing you can only do from inside the relay.' },
  ],
  goto: 'ch1_job',
});

node({
  id: 'ch1_q_why',
  chapter: 1,
  lines: [
    { who: 'wren', text: 'Because I asked for Belt work and Sable gave me Belt work.' },
    { who: 'wren', text: "...and because I asked for this desk. You. I've been buying shifts off your relay for a while, Halcyon." },
    { who: 'you', text: 'Why?' },
    { who: 'wren', text: "Ask me at the pier. If I'm at the pier." },
    { who: 'desc', text: 'She says it lightly. She has clearly practiced saying it lightly.' },
  ],
  effects: { leads: ['L_WREN_MOTHER'] },
  goto: 'ch1_job',
});

node({
  id: 'ch1_route',
  chapter: 1,
  lines: [
    { who: 'wren', text: 'Three ways down to the third terrace. Your call — you can see the Row better than I can from in it.' },
    { who: 'desc', text: 'You cannot, really. You have a sixteen-year-old survey map and the sound of her breathing. It has been enough before.' },
  ],
  choices: [
    {
      text: 'The Mercy Stair.',
      sub: 'Straight down the seawall. Fastest. Nothing to hide behind.',
      effects: { time: -26, composure: -8, loc: 'stair' },
      goto: 'ch1_stair',
    },
    {
      text: 'The Rill.',
      sub: 'The storm canal. Slow, wet, and unwatched.',
      effects: { time: -52, composure: 5, loc: 'rill' },
      goto: 'ch1_rill',
    },
    {
      text: 'The Ferrite spine.',
      sub: 'The old freight line. Middling. Halo walks it.',
      effects: { time: -38, loc: 'spine' },
      goto: 'ch1_spine',
    },
  ],
});

node({
  id: 'ch1_stair',
  chapter: 1,
  lines: [
    { who: 'desc', text: 'Nine hundred steps of wet concrete with the whole dark bay on one side. Her breathing goes flat and fast and stays that way.' },
    { who: 'wren', text: "There's no cover on the Stair. None. If anybody's looking at the seawall right now they are looking at me." },
    { who: 'wren', text: "Talk to me about something that isn't this." },
  ],
  choices: [
    {
      text: 'Tell her about the desk. The nine dead channels, the leak over switch four.',
      sub: 'Cost a minute. Give her something to hold.',
      effects: { time: -7, composure: 10, trust: 5 },
      goto: 'ch1_row',
    },
    {
      text: 'Count the steps with her.',
      effects: { time: -4, composure: 6, trust: 2 },
      goto: 'ch1_row',
    },
    {
      text: 'Keep her eyes up and her mouth shut.',
      effects: { composure: -4 },
      goto: 'ch1_row',
    },
  ],
});

node({
  id: 'ch1_rill',
  chapter: 1,
  lines: [
    { who: 'desc', text: 'The canal takes forever and gives her walls on both sides. You can hear water, and under it, other people living in the water.' },
    { who: 'wren', text: 'Rill folk are watching me. Not moving. Just watching.' },
    { who: 'wren', text: "One of them's counting on her fingers. Like she's timing me." },
    { who: 'you', text: 'Timing you against what?' },
    { who: 'wren', text: "That's the question, isn't it." },
  ],
  effects: { leads: ['L_ROUTE_LEAK'] },
  goto: 'ch1_row',
});

node({
  id: 'ch1_spine',
  chapter: 1,
  lines: [
    { who: 'desc', text: 'The freight line runs above the Row on rusted trestles. You can hear her footsteps change pitch as she crosses the gaps.' },
    { who: 'wren', text: 'Halo truck on the access road. Parked, running, nobody in it.' },
    { who: 'wren', text: "No district plate. No unit markings. That's off-books, Halcyon. That's the kind they don't write down." },
    { who: 'you', text: 'How long has it been parked?' },
    { who: 'wren', text: "Engine's warm and the windows are dry. Twenty minutes, maybe." },
    { who: 'desc', text: 'Twenty minutes ago she was still arguing with you about the ticket.' },
  ],
  effects: { leads: ['L_ROUTE_LEAK'] },
  goto: 'ch1_row',
});

node({
  id: 'ch1_drop',
  chapter: 1,
  linesOnce: true,
  effects: { loc: 'ferrite' },
  lines: [
    { who: 'desc', text: 'Third terrace. A transformer housing gutted forty years ago and used as a mailbox ever since.' },
    { who: 'wren', text: "It's here. Case, about the size of a toolbox. Heavier than it looks." },
    { who: 'wren', text: 'No lock. Just a seal.' },
  ],
  choices: [
    {
      text: 'Open it.',
      sub: "You cannot advise on cargo you haven't seen.",
      requires: { flags: { openedCase: false } },
      effects: { time: -11, flags: { openedCase: true }, leads: ['L_CASE_PREGRID'], trust: 2 },
      goto: 'ch1_open_case',
    },
    {
      text: 'Leave the seal. Sealed jobs pay more than curious ones.',
      requires: { flags: { openedCase: false } },
      effects: { flags: { openedCase: true, leftSealed: true } },
      goto: 'ch1_sealed',
    },
  ],
});

node({
  id: 'ch1_open_case',
  chapter: 1,
  lines: [
    { who: 'desc', text: 'A click, and then a long pause while she looks at something you cannot see.' },
    { who: 'wren', text: "It's a drum." },
    { who: 'you', text: 'A what?' },
    { who: 'wren', text: 'Optical drum. Sealed, in a foam cradle, with a hand-written index card taped to the cradle.' },
    { who: 'wren', text: "Halcyon, nothing has used drums since the old grid. This is pre-Eclipse. Somebody wrote this before the sky went out." },
    { who: 'you', text: 'What does the card say?' },
    { who: 'wren', text: 'One word. "Ledger."' },
  ],
  goto: 'ch1_ambush_pre',
});

node({
  id: 'ch1_sealed',
  chapter: 1,
  lines: [
    { who: 'wren', text: "Fine. Sealed it is." },
    { who: 'desc', text: 'She says it like a woman putting a hand in her pocket to stop herself using it.' },
    { who: 'wren', text: "For the record, though — it's heavy in a way toolboxes aren't, and it's warm." },
    { who: 'you', text: 'Warm.' },
    { who: 'wren', text: "Warm. Sealed boxes aren't supposed to be doing anything." },
  ],
  goto: 'ch1_ambush_pre',
});

node({
  id: 'ch1_ambush_pre',
  chapter: 1,
  lines: [
    { who: 'desc', text: 'Then the channel does the thing you have heard maybe four times in six years of night shifts. It goes completely silent, because she has stopped breathing.' },
    { who: 'wren', text: 'lights' },
    { who: 'wren', text: 'four of them, terrace above, coming down' },
    { who: 'alert', text: 'Link degraded · movement on her channel' },
  ],
  goto: 'ch1_ambush',
});

node({
  id: 'ch1_ambush',
  chapter: 1,
  lines: [
    { who: 'wren', text: 'HALCYON' },
    { who: 'wren', requires: { flags: { knewWaiting: true } }, text: "they've been here an hour. they were always going to be here" },
  ],
  timed: { seconds: 9, goto: 'ch1_frozen' },
  choices: [
    {
      text: 'RUN. Back up the Row, now.',
      effects: { time: -16, composure: -14 },
      goto: 'ch1_run',
    },
    {
      text: 'HIDE. Get in the housing and stop moving.',
      sub: 'Needs a steady hand.',
      effects: { time: -18 },
      goto: 'ch1_hide',
    },
    {
      text: "TALK. You're a courier with a ticket. Act like one.",
      sub: 'Only works if she believes you.',
      effects: { time: -13 },
      goto: 'ch1_talk',
    },
  ],
});

node({
  id: 'ch1_frozen',
  chapter: 1,
  lines: [
    { who: 'desc', text: 'You take a half-second too long. Everyone does, once.' },
    { who: 'wren', text: 'never mind' },
    { who: 'desc', text: 'Scraping. A fall. Then running, hard, for a long time, with the case banging against something metal every third step.' },
    { who: 'wren', text: "made it out. no thanks to the voice in my ear." },
    { who: 'you', text: "I'm sorry." },
    { who: 'wren', text: "Don't be sorry. Be faster." },
  ],
  effects: { composure: -18, trust: -10, time: -20 },
  goto: 'ch1_after',
});

node({
  id: 'ch1_run',
  chapter: 1,
  lines: [
    { who: 'desc', text: 'She runs. You listen to sixteen minutes of a person running and you cannot do one thing about any of it.' },
    { who: 'wren', text: "Clear. I think. I'm under the freight line." },
    { who: 'wren', text: "They didn't chase hard. Halcyon, they didn't chase hard at all." },
    { who: 'you', text: 'Then they were not there for you.' },
    { who: 'wren', text: 'They were there for the box. And they were there first.' },
  ],
  effects: { leads: ['L_ROUTE_LEAK'] },
  goto: 'ch1_after',
});

node({
  id: 'ch1_hide',
  chapter: 1,
  lines: [
    { who: 'desc', text: 'Forty seconds of nothing. Then boots on the terrace, close enough that you can hear them through her collar mic.' },
  ],
  branch: [
    { requires: { composure: { min: 62 } }, goto: 'ch1_hide_good' },
    { goto: 'ch1_hide_bad' },
  ],
});

node({
  id: 'ch1_hide_good',
  chapter: 1,
  lines: [
    { who: 'desc', text: 'She holds. Whatever else is true about Wren, she holds.' },
    { who: 'vale', text: '"Housing\'s cold. Drop\'s been serviced."' },
    { who: 'vale', text: '"Then the Ledger walked. Sweep to the seawall and tell the captain it\'s moving."' },
    { who: 'desc', text: 'Boots going away. A very long time. Then:' },
    { who: 'wren', text: 'Halcyon. They said Ledger.' },
    { who: 'wren', text: "That's the word on the card. That's the word that's taped to the thing in my hands." },
    { who: 'wren', text: 'No unit markings on any of them. That was Halo off the books.' },
  ],
  effects: { leads: ['L_HALO_LEDGER', 'L_ROUTE_LEAK'], composure: -6, trust: 6 },
  goto: 'ch1_after',
});

node({
  id: 'ch1_hide_bad',
  chapter: 1,
  lines: [
    { who: 'desc', text: 'She does not hold. You hear the exact moment her nerve goes — a scrape, a gasp, and then a light swinging across the housing.' },
    { who: 'vale', text: '"There. THERE —"' },
    { who: 'desc', text: 'Then nine minutes of running you can do nothing about.' },
    { who: 'wren', text: "out. clear. lost them in the terraces" },
    { who: 'wren', text: "i'm not doing that again. don't ask me to hold like that again." },
  ],
  effects: { composure: -20, time: -13, trust: -4 },
  goto: 'ch1_after',
});

node({
  id: 'ch1_talk',
  chapter: 1,
  lines: [
    { who: 'desc', text: 'It is a real strategy. A courier with a ticket is boring, and boring is the best camouflage in this city.' },
    { who: 'desc', text: 'It only works if she can sell it, and she can only sell it if she is not frightened of the man in her ear.' },
  ],
  branch: [
    { requires: { trust: { min: 55 }, composure: { min: 45 } }, goto: 'ch1_talk_good' },
    { goto: 'ch1_talk_bad' },
  ],
});

node({
  id: 'ch1_talk_good',
  chapter: 1,
  lines: [
    { who: 'desc', text: 'She steps out into the light with the case in plain sight, which is the single bravest thing you have ever heard a person do on your channel.' },
    { who: 'wren', text: '"Evening. Courier, Ashgate run, ticket\'s on the relay if you want to bore yourself."' },
    { who: 'vale', text: '"...Row salvage?"' },
    { who: 'wren', text: '"Row salvage."' },
    { who: 'desc', text: 'A pause the length of a life. Then boots, moving off.' },
    { who: 'wren', text: "They went past me. They went PAST me, Halcyon." },
    { who: 'wren', text: "One of them said 'Ledger' into his collar. They were looking for a thing, not a person, and I was holding the thing and they didn't know." },
  ],
  effects: { leads: ['L_HALO_LEDGER'], trust: 9, composure: -4 },
  goto: 'ch1_after',
});

node({
  id: 'ch1_talk_bad',
  chapter: 1,
  lines: [
    { who: 'desc', text: 'She tries. Her voice comes out wrong on the first word and everyone hears it, including you.' },
    { who: 'vale', text: '"Put the case down."' },
    { who: 'desc', text: 'What follows is not a conversation. It is a scramble, a drop, a dive off a terrace wall, and a landing that makes a sound you will think about later.' },
    { who: 'wren', text: 'still got it' },
    { who: 'wren', text: "ankle's wrong but i still got it" },
    { who: 'wren', text: "don't ever have me talk to them again" },
  ],
  effects: { composure: -20, trust: -12, time: -17, flags: { hurt: true } },
  goto: 'ch1_after',
});

node({
  id: 'ch1_after',
  chapter: 1,
  linesOnce: true,
  lines: [
    { who: 'desc', text: 'The Row goes quiet. Somewhere above the cloud deck, the dead satellites keep going round.' },
    { who: 'wren', text: 'Halcyon. They were standing on my drop before I got to it.' },
    { who: 'wren', text: 'Three people knew that address. The client. Sable on dispatch.' },
    { who: 'wren', text: 'And you.' },
  ],
  choices: [
    {
      text: "It wasn't me. I'll prove it before dawn.",
      sub: 'Stake yourself on it.',
      effects: { trust: 5, flags: { promised: true } },
      goto: 'ch1_offrow',
    },
    {
      text: "You're right to ask. Keep asking. Don't stop at me.",
      sub: 'Give her the suspicion and aim it.',
      effects: { trust: 9, composure: -3 },
      goto: 'ch1_offrow',
    },
    {
      text: 'It was me, in the sense that this desk is on the list. I have no way to rule myself out yet.',
      sub: 'Total honesty. Expensive.',
      effects: { trust: 9, composure: -10, flags: { honestEarly: true } },
      goto: 'ch1_offrow',
    },
    {
      text: "Walk the job. Suspicion doesn't pay nine thousand.",
      effects: { trust: -8, composure: 4 },
      goto: 'ch1_offrow',
    },
  ],
});

// ============================================================================
// CHAPTER 2 — THE BELT
// ============================================================================

node({
  id: 'ch2_open',
  chapter: 2,
  effects: { chapter: 2, signal: 'weak', loc: 'belt' },
  linesOnce: true,
  lines: [
    { who: 'sys', text: 'Chapter Two — The Blackout Belt' },
    { who: 'desc', text: 'Twelve blocks where the grid never came back. No streetlight, no handshake, no relay repeater since the night the sky burned. Your link to her drops to one bar and stays there.' },
    { who: 'wren', text: "I'm in the Belt. You're going to lose me in patches — that's the Belt, not you." },
    { who: 'wren', text: 'Something else. The case is doing something.' },
    { who: 'you', text: 'Define something.' },
    { who: 'wren', text: 'Two ticks, pause, two ticks. Over and over. It has been doing it since I picked it up and I thought it was my heartbeat.' },
  ],
  choices: [
    {
      text: 'That is a beacon. It has been announcing itself all night.',
      sub: 'Say the quiet part.',
      effects: { leads: ['L_BEACON'], composure: -8, trust: 6, time: -4 },
      goto: 'ch2_beacon',
    },
    {
      text: 'Old hardware makes noise. Keep walking.',
      sub: "Protect her nerve. Cost yourself a fact.",
      effects: { composure: 5, trust: -4, flags: { hidBeacon: true }, time: -3 },
      goto: 'ch2_route',
    },
    {
      text: 'Put the case against the wall and walk ten paces. Tell me if it changes.',
      sub: 'Test it properly. Costs minutes.',
      effects: { time: -14, leads: ['L_BEACON'], trust: 9, composure: -6 },
      goto: 'ch2_beacon',
    },
  ],
});

node({
  id: 'ch2_beacon',
  chapter: 2,
  lines: [
    { who: 'wren', text: "So I'm carrying a thing that's been shouting my position since the Row." },
    { who: 'you', text: 'Not your position. Its own. It does not know you exist.' },
    { who: 'wren', text: 'That is somehow worse.' },
    { who: 'desc', text: 'It is worse. A beacon that old is not surveillance. It is a homing pin someone armed sixteen years ago and never came back for.' },
  ],
  goto: 'ch2_route',
});

node({
  id: 'ch2_route',
  chapter: 2,
  linesOnce: true,
  lines: [
    { who: 'wren', text: 'Two ways across. Straight through the dead blocks, or north past the old exchange.' },
    { who: 'wren', text: "There's a scav in the exchange who runs a real antenna. Ilsa. She'll talk to anyone who pays and she hears everything in this city." },
    { who: 'wren', text: 'Straight through is faster and I go dark for most of it.' },
  ],
  choices: [
    {
      text: 'Straight through. Speed is the only thing we still have.',
      sub: 'You lose her for twenty minutes.',
      effects: { time: -38, signal: 'dead', loc: 'belt' },
      goto: 'ch2_dark',
    },
    {
      text: "Go to Ilsa. If the case is shouting, I want someone who's listening.",
      sub: 'Costs time. Buys answers.',
      effects: { time: -54, loc: 'nest' },
      goto: 'ch2_nest',
    },
  ],
});

node({
  id: 'ch2_dark',
  chapter: 2,
  lines: [
    { who: 'sys', text: 'Link lost · carrier only' },
    { who: 'desc', text: 'Half an hour of carrier tone. You sit in a dead building with a headset on, listening to a sound that means she is either walking or not.' },
    { who: 'desc', text: 'This is the part of the job nobody warns you about. Not the danger. The waiting, with a switchboard and no switch.' },
    { who: 'sys', text: 'Handshake · link restored · 1 bar' },
    { who: 'wren', text: "— still here. Still here. Halcyon?" },
    { who: 'you', text: "Still here." },
    { who: 'wren', text: "Good. Because there's a man on the north edge of the Belt in a Halo coat and he is not walking like someone looking for a person. He's walking a grid." },
    { who: 'wren', text: "He's sweeping. For the ticks." },
  ],
  effects: { signal: 'weak', composure: -8, leads: ['L_BEACON'] },
  goto: 'ch2_hail',
});

node({
  id: 'ch2_nest',
  chapter: 2,
  effects: { signal: 'clear', flags: { metIlsa: true } },
  linesOnce: true,
  lines: [
    { who: 'desc', text: 'The old exchange came down in the third year and someone built a radio shack inside the collapse, using the wreck as an antenna. It should not work. It works extremely well.' },
    { who: 'sys', text: 'Third-party carrier patched in · link 3 bars' },
    { who: 'ilsa', text: "Well. A relay handler. On a live line. In my house." },
    { who: 'ilsa', text: "I'm Ilsa. Your courier's bleeding on my floor and carrying something that's been pinging my board for two hours." },
    { who: 'you', text: 'You can hear the case.' },
    { who: 'ilsa', text: "Handler, everyone with an antenna between here and the water can hear the case. That's what it's for." },
  ],
  choices: [
    {
      text: 'Can you kill the beacon?',
      requires: { flags: { askedKill: false } },
      effects: { time: -17, flags: { askedKill: true } },
      goto: 'ch2_ilsa_kill',
    },
    {
      text: 'What do you know about the night of the Eclipse?',
      sub: 'She is old enough to have been on air for it.',
      requires: { flags: { askedEclipse: false } },
      effects: { time: -20, flags: { askedEclipse: true }, leads: ['L_ILSA_ECLIPSE'] },
      goto: 'ch2_ilsa_eclipse',
    },
    {
      text: 'Who else is asking about this case?',
      requires: { flags: { askedWho: false } },
      effects: { time: -15, flags: { askedWho: true }, leads: ['L_SABLE_ROSTER'] },
      goto: 'ch2_ilsa_who',
    },
    {
      text: "We're out of night. Wren, move.",
      effects: { loc: 'belt' },
      silent: true,
      goto: 'ch2_cross',
    },
  ],
});

node({
  id: 'ch2_ilsa_kill',
  chapter: 2,
  lines: [
    { who: 'ilsa', text: 'I can. Takes the best part of twenty minutes and it costs you, and not in money.' },
    { who: 'you', text: 'Then what.' },
    { who: 'ilsa', text: "Tell me what desk you're sitting at. Full station code. I collect them." },
  ],
  choices: [
    {
      text: 'K-7. Relay K-7, Ashgate side.',
      sub: 'Give her the desk. Kill the beacon.',
      effects: { time: -18, flags: { beaconDead: true, gaveStation: true }, leads: ['L_ILSA_ECLIPSE'], composure: 12 },
      goto: 'ch2_ilsa_k7',
    },
    {
      text: "No. She carries it noisy and we move faster instead.",
      effects: { trust: -3 },
      goto: 'ch2_nest',
    },
  ],
});

node({
  id: 'ch2_ilsa_k7',
  chapter: 2,
  lines: [
    { who: 'desc', text: 'There is a silence on the patched line that is quite different from the silence of a bad link.' },
    { who: 'ilsa', text: 'K-7.' },
    { who: 'ilsa', text: "Say your call sign for me, handler." },
    { who: 'you', text: 'Halcyon.' },
    { who: 'ilsa', text: "...Of course it is." },
    { who: 'desc', text: 'Something metal is set down, hard, on the other end.' },
    { who: 'ilsa', text: "Beacon's dead. Your girl can walk quiet now. Get off my board." },
    { who: 'wren', text: 'Ilsa — what? What was that?' },
    { who: 'ilsa', text: "Ask him. If he doesn't know yet, he will." },
  ],
  effects: { flags: { ilsaKnows: true }, trust: -2 },
  goto: 'ch2_nest',
});

node({
  id: 'ch2_ilsa_eclipse',
  chapter: 2,
  lines: [
    { who: 'ilsa', text: 'I was on air. Sixteen years, four months. I had a board like this one and I heard the whole thing go.' },
    { who: 'ilsa', text: "Everybody tells you it was an accident in the array. Cascade fault, tragic, nobody's fault, here's a memorial." },
    { who: 'ilsa', text: 'It was an order. Somebody burned that array on purpose and the order came down a relay line — a courier relay, not a corporate one. Deniable. Cheap.' },
    { who: 'you', text: 'You heard the order?' },
    { who: 'ilsa', text: "I heard the acknowledgement. A handler's voice, using a handler's call sign, confirming a burn like it was a parcel." },
    { who: 'ilsa', text: "I've been listening for that voice ever since. So has your courier, by the way, though she thinks she's subtle." },
  ],
  goto: 'ch2_nest',
});

node({
  id: 'ch2_ilsa_who',
  chapter: 2,
  lines: [
    { who: 'ilsa', text: "Halo's been screaming about it all night on a channel they think is private. And your own relay's been odd." },
    { who: 'you', text: 'Odd how.' },
    { who: 'ilsa', text: 'Your dispatcher pulled the rota apart at dusk. Moved three handlers, opened one desk, and hand-fed this ticket to it.' },
    { who: 'ilsa', text: 'That desk being yours, handler. Sable built tonight around your chair.' },
  ],
  goto: 'ch2_nest',
});

node({
  id: 'ch2_wren_asks',
  chapter: 2,
  linesOnce: true,
  lines: [
    { who: 'desc', text: 'The Belt at three in the morning is the closest thing this city has to the countryside. No light, no signal, no one who wants anything.' },
    { who: 'wren', text: 'Halcyon. Can I ask you the thing I was saving for the pier?' },
    { who: 'you', text: 'Ask.' },
    { who: 'wren', text: 'How long have you had that call sign?' },
  ],
  choices: [
    {
      text: 'Six years. Why.',
      sub: 'The truth, as far as you know it.',
      effects: { trust: 4, flags: { saidSixYears: true } },
      goto: 'ch2_six',
    },
    {
      text: 'Long enough. Why are you asking me that here?',
      sub: 'Deflect and probe.',
      effects: { time: -5 },
      goto: 'ch2_probe',
    },
    {
      text: 'Longer than you think.',
      sub: 'A lie you cannot yet check.',
      effects: { flags: { lieLive: true }, trust: 6 },
      goto: 'ch2_lie',
    },
  ],
});

node({
  id: 'ch2_six',
  chapter: 2,
  lines: [
    { who: 'wren', text: 'Six.' },
    { who: 'desc', text: 'You can hear her doing arithmetic that does not come out the way she wanted it to.' },
    { who: 'wren', text: "Okay. Okay, that's — that's fine. That's good, actually." },
    { who: 'you', text: 'Wren.' },
    { who: 'wren', text: 'Sixteen years ago a voice on a relay confirmed an order that put out the sky. It used a handler call sign.' },
    { who: 'wren', text: "I've spent a year buying night shifts off every relay in this city listening for it." },
    { who: 'wren', text: "And I asked for your desk specifically, Halcyon, because the call sign I'm hunting is yours." },
  ],
  effects: { leads: ['L_WREN_ASKED'], trust: 5, composure: -8 },
  goto: 'ch2_close',
});

node({
  id: 'ch2_probe',
  chapter: 2,
  lines: [
    { who: 'wren', text: "Because I've been looking for a handler for a year and tonight I paid to be handled by you." },
    { who: 'wren', text: "The night of the Eclipse, somebody with a handler's call sign acknowledged the burn order. Confirmed it. Passed it on." },
    { who: 'wren', text: 'The call sign was HALCYON.' },
    { who: 'desc', text: 'You look at the nameplate screwed into the desk. It has been screwed into this desk longer than you have been alive.' },
  ],
  effects: { leads: ['L_WREN_ASKED'], composure: -6 },
  goto: 'ch2_close',
});

node({
  id: 'ch2_lie',
  chapter: 2,
  lines: [
    { who: 'wren', text: 'Longer than I think.' },
    { who: 'desc', text: 'It is the wrong answer to give a woman who has spent a year looking for a voice, and you know it the moment it leaves you.' },
    { who: 'wren', text: 'Say that again.' },
    { who: 'you', text: 'Wren —' },
    { who: 'wren', text: "The night of the Eclipse, a handler using the call sign HALCYON confirmed the order that burned the array. I've been hunting that voice for a year." },
    { who: 'wren', text: "And you just told me you've had it longer than I think." },
    { who: 'desc', text: 'The link hisses. She does not say anything for a while.' },
  ],
  effects: { leads: ['L_WREN_ASKED'], composure: -12 },
  goto: 'ch2_close',
});

node({
  id: 'ch2_close',
  chapter: 2,
  lines: [
    { who: 'wren', text: "I'm not accusing you. I'm telling you what I came for." },
    { who: 'wren', text: 'The case has a word taped inside it and the word is Ledger, and Halo wants it badly enough to put four off-books bodies on a salvage terrace.' },
    { who: 'wren', text: "So whatever's on that drum is the night my mother got blamed for the sky." },
    { who: 'you', text: 'Your mother.' },
    { who: 'wren', text: 'Operator Seven. They never used names. Just numbers, in the report, so nobody had to be a person.' },
    { who: 'wren', text: "I'm going to ground in the Ashgate substation and you are going to go through your own archive, Halcyon, and one of us is going to find out what your chair did." },
  ],
  effects: { leads: ['L_OPERATOR_SEVEN', 'L_WREN_MOTHER'], loc: 'substation', signal: 'clear' },
  goto: 'ch2_offrow',
});

// ============================================================================
// CHAPTER 3 — OLD GRID
// The investigation chapter. Wren is holed up and safe-ish; the clock is now
// yours to spend. There is more in the archive than there is night left.
// ============================================================================

node({
  id: 'ch3_open',
  chapter: 3,
  effects: { chapter: 3, loc: 'substation', signal: 'clear' },
  lines: [
    { who: 'sys', text: 'Chapter Three — Old Grid' },
    { who: 'desc', text: 'Ashgate substation. Cold since the Eclipse, walls a metre thick, one door, and a transmitter mast on the roof that nobody ever got round to cutting down.' },
    { who: 'wren', text: "I'm in. Door's barred with a switch handle. It's freezing and it smells like pennies." },
    { who: 'wren', text: "I can hold here maybe an hour before I have to move for the pier. Use it." },
    { who: 'desc', text: 'So you turn around in the chair and look at the rest of the room for the first time in six years.' },
    { who: 'desc', text: 'Nine dead channels. A tape archive nobody has opened since the handover. A nameplate screwed to the desk.' },
  ],
  goto: 'ch3_desk',
});

node({
  id: 'ch3_desk',
  chapter: 3,
  branch: [
    { requires: { timeMax: 112 }, goto: 'ch3_forced' },
    { requires: { counts: { desk: { min: 2 } }, flags: { valeCalled: false } }, goto: 'ch3_vale' },
    { requires: { counts: { desk: { min: 4 } }, flags: { wrenChecked: false } }, goto: 'ch3_wren_check' },
  ],
  lines: [
    { who: 'sys', text: 'K-7 local terminal · archive mounted · you are alone in the building' },
  ],
  linesOnce: true,
  choices: [
    {
      text: 'Pull the shift roster for this desk. All of it, back to the handover.',
      sub: 'Who has sat in this chair.',
      silent: true,
      requires: { flags: { didRoster: false } },
      effects: { time: -35, count: { desk: 1 }, flags: { didRoster: true }, leads: ['L_HALCYON_DESK'], composure: -2 },
      goto: 'ch3_roster',
    },
    {
      text: 'Open the archive. The night of the Eclipse, 03:00 to 04:00.',
      sub: 'The tapes. Slow, and you may not like it.',
      silent: true,
      requires: { flags: { didBurnLog: false } },
      effects: { time: -50, count: { desk: 1 }, flags: { didBurnLog: true }, leads: ['L_BURN_LOG'], composure: -3 },
      goto: 'ch3_burnlog',
    },
    {
      text: 'Ping Sable. Ask her why she built tonight around this chair.',
      sub: 'She will know you are asking.',
      silent: true,
      requires: { flags: { didSable: false } },
      effects: { time: -28, count: { desk: 1 }, flags: { didSable: true }, leads: ['L_SABLE_ROSTER'], composure: -2 },
      goto: 'ch3_sable',
    },
    {
      text: 'Run the client properly. Not the ticket — the man.',
      sub: 'Ezra Maddox, four days old, nine thousand up front.',
      silent: true,
      requires: { flags: { didMaddox: false } },
      effects: { time: -36, count: { desk: 1 }, flags: { didMaddox: true }, leads: ['L_MADDOX_TRUE'], composure: -2 },
      goto: 'ch3_maddox',
    },
    {
      text: 'Look at the pier. Handshakes, traffic, anything sitting still.',
      sub: 'The handover point, an hour out.',
      silent: true,
      requires: { flags: { didPier: false } },
      effects: { time: -24, count: { desk: 1 }, flags: { didPier: true }, leads: ['L_PIER_NET'], composure: -2 },
      goto: 'ch3_pier',
    },
    {
      text: 'Check what this relay can still transmit.',
      sub: 'You have never once had a reason to ask.',
      silent: true,
      requires: { flags: { didBroadcast: false } },
      effects: { time: -23, count: { desk: 1 }, flags: { didBroadcast: true }, leads: ['L_BROADCAST_KEY'], composure: -2 },
      goto: 'ch3_broadcast',
    },
    {
      text: 'Find out who else has answered to this call sign.',
      sub: 'The roster gave you a chair. It did not give you a man.',
      requires: { leads: ['L_HALCYON_DESK'], flags: { didStanik: false } },
      lockedText: 'You do not yet know the call sign outlived anyone. (Needs: HALCYON is a chair)',
      effects: { time: -31, count: { desk: 1 }, flags: { didStanik: true }, leads: ['L_STANIK'], composure: -3 },
      silent: true,
      goto: 'ch3_stanik',
    },
    {
      text: 'Who called K-7 that night? Somebody had to be on the other end.',
      sub: 'An acknowledgement implies a caller.',
      requires: { leads: ['L_BURN_LOG'], flags: { didCaller: false } },
      lockedText: 'You have not heard the tape, so you do not know there was a caller. (Needs: The burn relay)',
      effects: { time: -35, count: { desk: 1 }, flags: { didCaller: true }, leads: ['L_M2_CALLER'] },
      silent: true,
      goto: 'ch3_caller',
    },
    {
      text: "Pull the courier's own file. All of it.",
      sub: 'She has been buying shifts for a year. That is a paper trail.',
      requires: { flags: { didWrenFile: false } },
      effects: { time: -35, count: { desk: 1 }, flags: { didWrenFile: true }, leads: ['L_WREN_ASKED'], trust: -4 },
      silent: true,
      goto: 'ch3_wrenfile',
    },
    {
      text: 'Put the archive down and talk to her.',
      sub: 'Minutes you will not get back. She is not a meter.',
      effects: { time: -10, count: { steady: 1 }, composure: 13, trust: 3 },
      silent: true,
      goto: 'ch3_steady',
    },
    {
      text: 'Stop. Get her moving while she still has the night.',
      sub: 'End the search. Whatever you have is what you have.',
      requires: { counts: { desk: { min: 4 } } },
      lockedText: 'You have been in this chair an hour and looked at almost nothing. (Needs: 4 lines of enquiry)',
      silent: true,
      goto: 'ch3b_open',
    },
  ],
});

node({
  id: 'ch3_roster',
  chapter: 3,
  lines: [
    { who: 'desc', text: 'The roster goes back further than the building\'s own certification. Relay desks outlive everyone.' },
    { who: 'sys', text: 'DESK K-7 · CALL SIGN: HALCYON · assignments:' },
    { who: 'sys', text: '· current holder — 6 yrs' },
    { who: 'sys', text: '· prior holder — 4 yrs · separated' },
    { who: 'sys', text: '· prior holder — 11 yrs · deceased · CALL SIGN HALCYON (orig.)' },
    { who: 'desc', text: 'HALCYON is not a person. It never was. It is a chair, and a call sign screwed to a desk, and whoever is sitting in it at three in the morning.' },
    { who: 'desc', text: 'Sixteen years ago, somebody else answered to your name in this room.' },
  ],
  goto: 'ch3_desk',
});

node({
  id: 'ch3_burnlog',
  chapter: 3,
  lines: [
    { who: 'desc', text: 'Fifty minutes of spooling. The tapes are physical, degraded, and were never meant to be listened to again.' },
    { who: 'sys', text: 'ARCHIVE FRAGMENT · 03:14 · channel 2 · degraded' },
    { who: 'other', text: '"— array burn is authorised, confirm and relay."' },
    { who: 'other', text: '"Confirm from operator station?"' },
    { who: 'other', text: '"Operator Seven refuses. Twice. Go around her."' },
    { who: 'desc', text: 'Then a third voice. Tired, flat, closer to the microphone than the others. A handler\'s voice, in a handler\'s room, at a handler\'s desk.' },
    { who: 'other', text: '"K-7 acknowledges. Relaying."' },
    { who: 'desc', text: 'That is it. Nine words. The sky went out eleven minutes later and everyone blamed the operators who said no.' },
    { who: 'desc', text: 'You sit very still in the chair that said yes.' },
  ],
  effects: { composure: -4, leads: ['L_OPERATOR_SEVEN'] },
  goto: 'ch3_desk',
});

node({
  id: 'ch3_sable',
  chapter: 3,
  lines: [
    { who: 'desc', text: 'Dispatch picks up on the fourth ring, which for Sable is instant.' },
    { who: 'sable', text: 'Working, Halcyon. Make it quick.' },
    { who: 'you', text: 'You tore up the rota at dusk and hand-fed this ticket to my desk. Why.' },
    { who: 'desc', text: 'A long pause, with typing in it. Sable types when she is deciding how much to say.' },
    { who: 'sable', text: 'Because the courier paid for it. Standing order, a year old. Any job touching the old grid, any job with a blank manifest — route it to K-7 and put her on it.' },
    { who: 'sable', text: "She's been paying that order every month out of her own take. I assumed it was a grudge. I didn't ask whose." },
    { who: 'you', text: 'Did you know what was in the case?' },
    { who: 'sable', text: "I knew the manifest was blanked after filing, and I knew I didn't blank it." },
    { who: 'sable', text: 'Halcyon — Halo pulled our trunk logs at nineteen hundred. Legally. With paper. They know which desk is on this.' },
    { who: 'sable', text: 'They know which desk. Go home when this is over.' },
  ],
  effects: { leads: ['L_WREN_ASKED'], composure: -2 },
  goto: 'ch3_desk',
});

node({
  id: 'ch3_maddox',
  chapter: 3,
  lines: [
    { who: 'desc', text: 'Thirty-six minutes of pulling a name apart. The man is not hiding well, because he is not a professional at hiding.' },
    { who: 'sys', text: 'MADDOX, EZRA · 61 · archivist, Grid Authority (dissolved) · no criminal file' },
    { who: 'sys', text: 'Named party: Eclipse review board · one of nine · SETTLEMENT: DECLINED' },
    { who: 'desc', text: 'Nine people were blamed for the sky. Eight took the money and the silence that came with it.' },
    { who: 'desc', text: 'Maddox spent sixteen years as an archivist for an authority that no longer exists, which is the job you take when you are waiting for a shelf to give up something.' },
    { who: 'desc', text: 'He is not buying the Ledger. He found it, and he is trying to get it out of a building, and he has nine thousand and no idea how to move anything.' },
  ],
  branch: [
    { requires: { leads: ['L_MADDOX_FED'] }, goto: 'ch3_maddox_exposed' },
    { goto: 'ch3_desk' },
  ],
});

node({
  id: 'ch3_maddox_exposed',
  chapter: 3,
  lines: [
    { who: 'desc', text: 'Which makes the file Vale sent you interesting, because it was true and useless at the same time.' },
    { who: 'desc', text: 'Maddox was in a Halo interview room the day before he filed the job. That part was real.' },
    { who: 'desc', text: 'They picked him up, leaned on him, and let him go. And the next morning he filed the job anyway — which is not what a man does after he sells you out. It is what a man does when he has run out of time.' },
    { who: 'sys', text: 'Casefile updated · MADDOX SOLD HER OUT flagged as planted' },
  ],
  effects: { flags: { valePlantExposed: true }, dropLeads: ['L_MADDOX_FED'], composure: 2 },
  goto: 'ch3_desk',
});

node({
  id: 'ch3_pier',
  chapter: 3,
  lines: [
    { who: 'desc', text: 'Ashgate Pier has one road in and open black water on the other three sides. You pull every handshake within four hundred metres of the handover point.' },
    { who: 'sys', text: 'Static handsets, stationary, 04:00-present: 11' },
    { who: 'desc', text: 'Eleven radios, none of them moving, arranged in a shape you recognise from a survey map because it is the shape of a road being closed at both ends.' },
    { who: 'desc', text: 'The handover is a net. It has been a net since before she picked the case up.' },
  ],
  effects: { composure: -2 },
  goto: 'ch3_desk',
});

node({
  id: 'ch3_broadcast',
  chapter: 3,
  lines: [
    { who: 'desc', text: 'You have worked this desk for six years and you have never asked it what it can do, because handlers listen and couriers move and that is the arrangement.' },
    { who: 'sys', text: 'K-7 · legacy broadcast stack · PRESENT · last used: 16 yrs ago' },
    { who: 'desc', text: 'It is still wired. Of course it is still wired — nobody decommissions anything in this city, they just stop looking at it.' },
    { who: 'desc', text: 'And at grid-up, for about ninety seconds, every receiver in Kestrel Bay syncs to the relay band to find out what time it is.' },
    { who: 'desc', text: 'Ninety seconds in which this dead room could talk to the entire city at once.' },
  ],
  goto: 'ch3_desk',
});

node({
  id: 'ch3_vale',
  chapter: 3,
  effects: { flags: { valeCalled: true } },
  linesOnce: true,
  lines: [
    { who: 'alert', text: 'Inbound on channel 1 — your channel, not hers' },
    { who: 'desc', text: 'Channel one has not rung in six years. It is the line the building came with.' },
    { who: 'vale', text: "Good evening. Cormac Vale, Halo Division. I'd like to save us both a night." },
    { who: 'vale', text: "I have your name. Not the call sign — the name on your housing lease, and the ward your sister's kids are schooled in. I mention it once, up front, so we needn't do the part where I imply it." },
    { who: 'vale', text: "You're carrying something that was stolen from a secure archive by a sixty-one-year-old man who is not built for this, and a courier who is." },
    { who: 'vale', text: 'Tell her to walk to the pier as contracted. Nobody is hurt. Your file gets very boring, permanently.' },
  ],
  choices: [
    {
      text: "What's on the drum, Vale?",
      requires: { flags: { askedVale: false } },
      effects: { time: -8, flags: { askedVale: true } },
      goto: 'ch3_vale_what',
    },
    {
      text: "Why should I believe the client's clean?",
      sub: 'Invite him to give you something.',
      requires: { flags: { askedValeProof: false } },
      effects: { time: -8, flags: { askedValeProof: true }, leads: ['L_MADDOX_FED'] },
      goto: 'ch3_vale_proof',
    },
    {
      text: 'Tell him yes. Buy the time and the file.',
      effects: { leads: ['L_VALE_DEAL'], flags: { tookDeal: true }, time: -4 },
      goto: 'ch3_vale_yes',
    },
    {
      text: 'Tell him no, and hang up.',
      effects: { leads: ['L_VALE_DEAL'], flags: { refusedDeal: true }, time: -3, composure: -4 },
      goto: 'ch3_vale_no',
    },
  ],
});

node({
  id: 'ch3_vale_what',
  chapter: 3,
  lines: [
    { who: 'vale', text: "Telemetry. Array logs from the night of the fault. Deeply boring engineering data." },
    { who: 'you', text: 'Then let a boring old man mail it to a newspaper.' },
    { who: 'vale', text: 'Because context is a weapon, handler. Raw data with no one to interpret it is just a panic. People were hurt enough the first time.' },
    { who: 'desc', text: 'It is a good answer. It is too good, delivered too fast, by a man who has given it before.' },
  ],
  goto: 'ch3_vale',
});

node({
  id: 'ch3_vale_proof',
  chapter: 3,
  lines: [
    { who: 'vale', text: "Because your client spent four hours in one of my interview rooms the day before he filed that job. I'm sending you the intake sheet. Timestamped, signed, quite real." },
    { who: 'sys', text: 'Inbound file · HALO INTAKE 4471 · MADDOX, E. · verified signature' },
    { who: 'vale', text: 'He gave her up before she was hired. Whatever you think you\'re protecting, handler, he sold it first.' },
    { who: 'desc', text: 'The sheet is real. You check the signature twice and it is real.' },
    { who: 'desc', text: 'What a real document does not tell you is what it was for.' },
  ],
  goto: 'ch3_vale',
});

node({
  id: 'ch3_vale_yes',
  chapter: 3,
  lines: [
    { who: 'you', text: 'She walks to the pier as contracted.' },
    { who: 'vale', text: "Sensible. You'll find the rest of your career is like this — one bad night, handled quietly." },
    { who: 'vale', text: "One more thing, since we're friends. Don't tell her. If she runs at the pier, my people have to make choices, and they're tired." },
    { who: 'desc', text: 'The line closes. Channel one goes back to being furniture.' },
    { who: 'desc', text: 'Down on channel four, a woman is sitting in the dark in a freezing substation, waiting for you to tell her what you found.' },
  ],
  goto: 'ch3_desk',
});

node({
  id: 'ch3_vale_no',
  chapter: 3,
  lines: [
    { who: 'you', text: 'No.' },
    { who: 'vale', text: '...Just no?' },
    { who: 'you', text: 'Just no.' },
    { who: 'vale', text: "That's a shame. You had the good version of tonight available and you've chosen the other one." },
    { who: 'vale', text: 'For what it is worth, handler — I was on the other end of a relay once too, taking an order I did not like. You will find it does not help afterwards to have said no slowly.' },
    { who: 'desc', text: 'The line closes. You sit there with your heart going and a building full of dead switchgear listening.' },
  ],
  goto: 'ch3_desk',
});

node({
  id: 'ch3_wren_check',
  chapter: 3,
  effects: { flags: { wrenChecked: true }, composure: -8 },
  lines: [
    { who: 'wren', text: "Halcyon. It's been a while and it's very quiet in here." },
    { who: 'wren', text: "I can hear the mast humming. I keep thinking it's a truck." },
    { who: 'wren', text: 'Tell me you found something. Tell me anything, actually. I just want the channel to have a person on it.' },
  ],
  choices: [
    {
      text: 'Give her what you have so far. All of it.',
      sub: 'Steadies her. Costs minutes you were spending on the archive.',
      effects: { time: -11, composure: 14, trust: 8 },
      goto: 'ch3_desk',
    },
    {
      text: "Not yet. Hold on. I'm close.",
      effects: { composure: -4, trust: -2 },
      goto: 'ch3_desk',
    },
    {
      text: 'Talk to her about nothing for two minutes.',
      effects: { time: -4, composure: 8, trust: 4 },
      goto: 'ch3_desk',
    },
  ],
});

node({
  id: 'ch3_forced',
  chapter: 3,
  lines: [
    { who: 'alert', text: 'Grid-up in under one hour' },
    { who: 'wren', text: "I'm out of holding. If I'm walking to the pier I walk now, and if I'm not walking to the pier you need to tell me that now." },
    { who: 'desc', text: 'The archive is still spooling something. You will not get to hear it.' },
  ],
  goto: 'ch3b_open',
});

// ============================================================================
// CHAPTER 4 — TOTALITY
// ============================================================================

node({
  id: 'ch4_open',
  chapter: 4,
  effects: { chapter: 4, loc: 'substation' },
  linesOnce: true,
  lines: [
    { who: 'sys', text: 'Chapter Four — Totality' },
    { who: 'wren', text: "Before I move. You've had an hour with your own archive." },
    { who: 'wren', text: 'Was it your desk.' },
    { who: 'desc', text: 'There is no version of the next sentence that costs you nothing.' },
  ],
  choices: [
    {
      text: 'HALCYON is a chair, not a man. The handler who answered to it that night died eleven years ago.',
      sub: 'The truth, with the part that lets you off.',
      requires: { leads: ['L_HALCYON_DESK'] },
      lockedText: 'You do not actually know who else has sat here. (Needs: HALCYON is a chair)',
      effects: { trust: 10, flags: { toldTruth: true } },
      goto: 'ch4_truth',
    },
    {
      text: 'Yes. This desk acknowledged the order and relayed it on. I heard the tape an hour ago.',
      sub: 'The truth, with the part that does not.',
      requires: { leads: ['L_BURN_LOG'] },
      lockedText: 'You have not heard the tape. (Needs: The burn relay)',
      effects: { trust: 16, composure: -10, flags: { toldTruth: true, toldHard: true } },
      goto: 'ch4_truth_hard',
    },
    {
      text: 'It was me.',
      sub: 'It was not. Give her the thing she came for anyway.',
      effects: { trust: -30, composure: -18, flags: { falseConfession: true } },
      goto: 'ch4_false',
    },
    {
      text: "I don't know yet, and you have forty minutes of night left.",
      sub: 'Spend nothing. Answer nothing.',
      effects: { trust: -10, composure: -5 },
      goto: 'ch4_deflect',
    },
  ],
});

node({
  id: 'ch4_truth',
  chapter: 4,
  branch: [
    { requires: { flags: { lieLive: true } }, goto: 'ch4_truth_recant' },
  ],
  lines: [
    { who: 'you', text: "The call sign came with the room. Three people have held it. The one who was in this chair that night has been dead eleven years." },
    { who: 'you', text: "I've been HALCYON for six years, Wren. I have been sitting in it without ever once asking what it did." },
    { who: 'desc', text: 'The link hisses. Somewhere in a freezing substation a woman puts her head back against a wall.' },
    { who: 'wren', text: 'A year.' },
    { who: 'wren', text: "A year of buying shifts. And it's a chair." },
    { who: 'wren', text: "...Thank you for not letting me find that out at the pier." },
  ],
  goto: 'ch4_plan',
});

node({
  id: 'ch4_truth_hard',
  chapter: 4,
  branch: [
    { requires: { flags: { lieLive: true } }, goto: 'ch4_truth_recant' },
  ],
  lines: [
    { who: 'you', text: 'Nine words. "K-7 acknowledges. Relaying." Then eleven minutes, then the sky.' },
    { who: 'you', text: 'Your mother said no twice. They went around her, and this room is what they went around her with.' },
    { who: 'desc', text: 'You listen to her not say anything for a length of time that you will remember for the rest of your life.' },
    { who: 'wren', text: 'Say the nine words again.' },
    { who: 'you', text: '"K-7 acknowledges. Relaying."' },
    { who: 'wren', text: "Okay." },
    { who: 'wren', text: "Okay. That's sixteen years, that is. That's my whole adult life in nine words and you gave it to me in an hour, and you didn't have to." },
    { who: 'wren', text: "I came here to find a man to hate. I'll settle for a man who looked." },
  ],
  effects: { trust: 8 },
  goto: 'ch4_plan',
});

node({
  id: 'ch4_false',
  chapter: 4,
  lines: [
    { who: 'you', text: 'It was me. I was on this desk that night and I passed the order on.' },
    { who: 'desc', text: 'You are eleven years too young for it to be true and she works that out in about four seconds, because she has been doing this arithmetic for a year.' },
    { who: 'wren', text: 'No you were not.' },
    { who: 'wren', text: "You'd have been a child. You just lied to me about the one thing I came for." },
    { who: 'wren', text: "Was that kindness? Did you think giving me somebody to hate was kindness?" },
    { who: 'desc', text: 'She is not wrong that it was easier than the truth.' },
  ],
  goto: 'ch4_plan',
});

node({
  id: 'ch4_deflect',
  chapter: 4,
  lines: [
    { who: 'wren', text: "Right." },
    { who: 'desc', text: 'One syllable, and then the professional voice, which is worse than shouting.' },
    { who: 'wren', text: 'Route me to the pier, handler.' },
  ],
  goto: 'ch4_plan',
});

node({
  id: 'ch4_plan',
  chapter: 4,
  linesOnce: true,
  lines: [
    { who: 'desc', text: 'Grid-up is close enough now that the dead streetlights on the Ashgate road have started their pre-warm tick.' },
    { who: 'wren', text: 'So what do I do with it.' },
  ],
  choices: [
    {
      text: 'Warn Maddox off the pier first.',
      sub: 'He is sixty-one and he is going to walk into it.',
      requires: { leads: ['L_MADDOX_TRUE', 'L_PIER_NET'], flags: { warnedMaddox: false } },
      lockedText: 'You do not know enough about the client, or about the pier. (Needs: Maddox is grid staff + The pier is a net)',
      effects: { time: -8, flags: { warnedMaddox: true }, trust: 6 },
      goto: 'ch4_warn_maddox',
    },
    {
      text: 'Wait. Breathe. I am not routing you anywhere in this state.',
      sub: 'The last steady minute either of you gets.',
      requires: { flags: { steadied4: false } },
      effects: { time: -9, flags: { steadied4: true }, composure: 15, trust: 4 },
      goto: 'ch4_steady',
    },
    {
      text: 'Walk it to the pier. Do the job you were paid for.',
      effects: { flags: { plan: 'deliver' } },
      goto: 'ch4_raid',
    },
    {
      text: 'Patch the drum into the substation mast. I push it citywide at grid-up.',
      sub: 'Ninety seconds when every receiver in Kestrel Bay is listening.',
      requires: { leads: ['L_BROADCAST_KEY'], timeMin: 22 },
      lockedText: 'You have no way to put anything on the air, or no night left to do it in. (Needs: The relay can still shout)',
      effects: { flags: { plan: 'broadcast' }, composure: -5 },
      goto: 'ch4_raid',
    },
    {
      text: 'Put it in the water. Nobody gets it, and you walk away alive.',
      effects: { flags: { plan: 'destroy' } },
      goto: 'ch4_raid',
    },
  ],
});

node({
  id: 'ch4_warn_maddox',
  chapter: 4,
  lines: [
    { who: 'desc', text: 'It takes eight minutes to find a sixty-one-year-old archivist on a public handset and convince him you are not Halo.' },
    { who: 'maddox', text: "You're — you're her handler? Is she — " },
    { who: 'you', text: "She's alive. Do not go to the pier. There are eleven radios sitting on that road and none of them are moving." },
    { who: 'maddox', text: 'Oh.' },
    { who: 'maddox', text: 'Oh, I see. Of course there are.' },
    { who: 'desc', text: 'A man breathing on a bad handset, doing the arithmetic on sixteen years of waiting.' },
    { who: 'maddox', text: "I'm sorry. I truly am. I found it on a shelf in a building that doesn't exist any more and I had no one to give it to who wasn't already paid." },
    { who: 'maddox', text: "Tell her — tell her Seven said no. Twice. It's in there. It's the first thing in there." },
  ],
  effects: { leads: ['L_OPERATOR_SEVEN'] },
  goto: 'ch4_plan',
});

node({
  id: 'ch4_raid',
  chapter: 4,
  lines: [
    { who: 'desc', text: 'She is five steps from the substation door when your board lights up with handshakes that were not there a minute ago.' },
    { who: 'alert', text: 'Eleven handsets · inbound · four hundred metres and closing' },
    { who: 'you', text: 'Wren. Back inside. Now.' },
  ],
  goto: 'ch4_wait',
});

node({
  id: 'ch4_raid_slow',
  chapter: 4,
  lines: [
    { who: 'desc', text: 'They are sweeping street by street, because Ilsa killed the beacon hours ago and they have nothing to follow but a map and a guess.' },
    { who: 'wren', text: "They're going door to door. I've got minutes." },
    { who: 'desc', text: 'Minutes is a luxury. Minutes is the whole difference.' },
  ],
  effects: { time: -6 },
  goto: 'ch4_choice',
});

node({
  id: 'ch4_raid_fast',
  chapter: 4,
  lines: [
    { who: 'desc', text: 'They come straight down the Ashgate road without pausing once, because the case in her hands has been telling them where it is all night.' },
    { who: 'wren', text: "They're not searching. They're walking right at me." },
    { who: 'alert', text: 'Two hundred metres' },
    { who: 'wren', requires: { flags: { hidBeacon: true } },
      text: "The ticks. The case has been ticking all night and you told me it was old hardware." },
    { who: 'wren', requires: { flags: { hidBeacon: true } },
      text: "You KNEW. You knew in the Belt and you let me carry it across twelve blocks." },
  ],
  effects: { time: -3, composure: -9 },
  branch: [
    { requires: { flags: { hidBeacon: true } }, goto: 'ch4_beacon_owned' },
  ],
  goto: 'ch4_choice',
});

node({
  id: 'ch4_choice',
  chapter: 4,
  lines: [
    { who: 'wren', text: 'Halcyon. Tell me where to put my feet.' },
  ],
  timed: { seconds: 10, goto: 'ch4_late' },
  choices: [
    {
      text: 'Cable trench. Under the road, out the far side.',
      sub: 'Filthy, slow, and nobody has opened it since the Eclipse.',
      effects: { time: -12, composure: -6 },
      goto: 'ch4_trench',
    },
    {
      text: 'Bar the door and go up. The mast platform.',
      sub: 'Up is a corner. Up is also a transmitter.',
      effects: { time: -7 },
      goto: 'ch4_mast',
    },
    {
      text: 'Out the front, straight through, and run the road.',
      sub: 'Eleven of them. One of her.',
      effects: { time: -5, composure: -11 },
      goto: 'ch4_run',
    },
  ],
});

node({
  id: 'ch4_late',
  chapter: 4,
  lines: [
    { who: 'desc', text: 'You hesitate. It is a small hesitation and it is the only thing she is standing on.' },
    { who: 'wren', text: 'Halcyon?' },
    { who: 'wren', text: 'HALCYON.' },
    { who: 'desc', text: 'She chooses for herself, which is what couriers do when the voice in their ear stops being a voice.' },
    { who: 'wren', text: "going up. don't talk to me for a minute." },
  ],
  effects: { composure: -16, trust: -8, time: -7 },
  goto: 'ch4_mast',
});

node({
  id: 'ch4_trench',
  chapter: 4,
  lines: [
    { who: 'desc', text: 'The trench runs under the Ashgate road, full of sixteen years of standing water and cable that stopped carrying anything the night the sky went out.' },
    { who: 'desc', text: 'You listen to her drag a case through it for twelve minutes, on her elbows, in the dark, under the feet of eleven people looking for her.' },
    { who: 'desc', requires: { flags: { hurt: true } },
      text: 'She does it on an ankle that has been wrong since the Row, and she does not mention it once, which is its own kind of accusation.' },
    { who: 'wren', text: 'out. far side. behind the substation fence.' },
    { who: 'wren', text: "they're in the building. i can hear them through the ground." },
  ],
  effects: { flags: { escaped: true } },
  goto: 'ch4_resolve',
});

node({
  id: 'ch4_mast',
  chapter: 4,
  lines: [
    { who: 'desc', text: 'A switch handle through the door brackets, and forty rungs of ladder to a platform under a transmitter mast that has not carried a signal since the Eclipse.' },
    { who: 'desc', text: 'Below her, somebody starts hitting the door with something heavy, on a rhythm, the way you do when you are in no hurry at all.' },
    { who: 'wren', text: "I'm on the platform. There's nowhere after this." },
    { who: 'wren', text: "So whatever we're doing, Halcyon, we're doing it here." },
  ],
  effects: { flags: { onMast: true }, composure: -6 },
  goto: 'ch4_resolve',
});

node({
  id: 'ch4_run',
  chapter: 4,
  lines: [
    { who: 'desc', text: 'She goes out the front at a dead sprint with the case under one arm, and for about nine seconds it is working.' },
    { who: 'desc', text: 'Then a light finds her, and another, and you hear her go down hard on the road.' },
    { who: 'alert', text: 'Channel 4 — carrier only' },
  ],
  branch: [
    { requires: { composure: { min: 45 } }, goto: 'ch4_run_up' },
    { goto: 'end_dead_air_road' },
  ],
});

node({
  id: 'ch4_run_up',
  chapter: 4,
  lines: [
    { who: 'desc', text: 'Forty seconds of carrier. Then a sound like someone breathing through a torn lip.' },
    { who: 'wren', text: "up. i'm up. i'm behind the fence line and i still have it" },
    { who: 'wren', text: "don't ever route me down a road again" },
  ],
  effects: { composure: -18, flags: { escaped: true, hurt: true } },
  goto: 'ch4_resolve',
});

// Resolution: which ending the night lands on.
node({
  id: 'ch4_resolve',
  chapter: 4,
  branch: [
    { requires: { flags: { plan: 'broadcast' } }, goto: 'res_broadcast' },
    { requires: { flags: { plan: 'destroy' } }, goto: 'res_destroy' },
    { requires: { flags: { tookDeal: true } }, goto: 'res_burned' },
    { goto: 'res_deliver' },
  ],
});

node({
  id: 'res_broadcast',
  chapter: 5,
  lines: [
    { who: 'sys', text: 'Chapter Five — Dawn' },
    { who: 'desc', requires: { flags: { onMast: true } },
      text: 'The mast on the Ashgate substation is a dead thing with a live spine, and she is already standing at the foot of it.' },
    { who: 'desc', requires: { flags: { onMast: false } },
      text: 'The mast is back inside the fence line she just crawled out from under. She goes back over it — up and in, with eleven people in the building below her — because the feed head is forty rungs up and there is nowhere else in Ashgate that can shout.' },
    { who: 'wren', requires: { flags: { leftSealed: true } },
      text: "I'm breaking the seal. Sixteen years and a nine-thousand-credit contract and I'm finding out what it is on a ladder." },
    { who: 'desc', requires: { flags: { leftSealed: true } },
      text: 'A click, and a pause, and then a woman on a ladder looking at an optical drum with an index card taped to its cradle, and the card says Ledger.' },
    { who: 'desc', text: 'She strips the drum out of its cradle with cold hands and puts it on the feed line by touch, while you read her the pinout off a schematic older than she is.' },
    { who: 'you', text: 'Red to the standoff. Not the shield — the standoff.' },
    { who: 'wren', text: 'Red to the standoff.' },
    { who: 'sys', text: 'K-7 · legacy broadcast stack · ARMED · grid-up sync in 00:40' },
    { who: 'desc', text: 'Below her they are still hitting the door on a rhythm, in no hurry at all, because they think up is a corner.' },
  ],
  effects: { time: -6 },
  goto: 'a1_broadcast',
});

node({
  id: 'res_destroy',
  chapter: 5,
  lines: [
    { who: 'sys', text: 'Chapter Five — Dawn' },
    { who: 'desc', text: 'Ashgate has open black water on three sides and forty metres of it under the substation apron.' },
    { who: 'wren', requires: { flags: { leftSealed: true } },
      text: "I never even opened it. Sixteen years, and I'm going to drop it in the water without looking." },
    { who: 'wren', text: 'If I do this, nobody ever knows. Not the city. Not me.' },
    { who: 'you', text: 'And nobody ever comes looking for you again either.' },
    { who: 'desc', text: 'A long pause. Water, and men on a road, and a woman deciding what sixteen years was worth.' },
    { who: 'wren', text: "My mother said no twice. Somebody should get to say no once and have it stick." },
    { who: 'desc', text: 'You hear it go in. It is a very small sound.' },
    { who: 'desc', requires: { flags: { warnedMaddox: true } },
      text: 'North of the pier, a man who has waited sixteen years for a shelf to give something up is sitting in a stairwell where you told him to sit, and he will never know what he missed by eight minutes and one phone call.' },
  ],
  goto: 'a1_ashed',
});

node({
  id: 'res_burned',
  chapter: 5,
  lines: [
    { who: 'sys', text: 'Chapter Five — Dawn' },
    { who: 'desc', text: 'You told her to walk to the pier, because a man on channel one offered you a boring file and you took it.' },
    { who: 'wren', text: 'Road looks clear. Handler, you sure about this?' },
    { who: 'you', text: '...' },
    { who: 'wren', text: 'Halcyon?' },
    { who: 'desc', text: 'Eleven radios that had been sitting still all night stop sitting still.' },
  ],
  goto: 'a1_burned',
});

node({
  id: 'res_deliver',
  chapter: 5,
  lines: [
    { who: 'sys', text: 'Chapter Five — Dawn' },
    { who: 'desc', text: 'The Ashgate road at ten to five, with the streetlights ticking as they pre-warm and the water going grey at the edge.' },
    { who: 'desc', requires: { flags: { warnedMaddox: true } },
      text: 'Somewhere north of it, a sixty-one-year-old archivist is not walking to a pier, because you spent eight minutes of a night you did not have telling him not to.' },
  ],
  branch: [
    { requires: { leads: ['L_PIER_NET'], composure: { min: 35 } }, goto: 'res_deliver_careful' },
    { goto: 'res_deliver_plain_tail' },
  ],
});

node({
  id: 'res_deliver_careful',
  chapter: 5,
  lines: [
    { who: 'you', text: 'Eleven radios on that road, Wren, and none of them have moved since four. Do not walk up the middle of it.' },
    { who: 'wren', text: 'Then what.' },
    { who: 'you', text: 'Put it on the apron rail at the seaward end, walk away north, and let the client collect it in daylight with witnesses.' },
    { who: 'desc', text: 'It is not brave. It is the kind of small competent thing that keeps couriers alive, and it is most of what six years on a desk teaches you.' },
  ],
  goto: 'a1_delivered',
});

// ============================================================================
// ENDINGS
// ============================================================================

node({
  id: 'a1_broadcast',
  chapter: 5,
  effects: { flags: { act1: 'broadcast' }, exposure: 55, trust: 6 },
  lines: [
    { who: 'desc', text: 'At 04:50 every receiver in Kestrel Bay syncs to the relay band to ask a dead station what time it is.' },
    { who: 'desc', text: 'For ninety seconds this year, they got something else: sixteen-year-old array telemetry, pushed into every handset, every dashboard, every kitchen radio in the city, from a station that has not transmitted since the night the sky went out.' },
    { who: 'wren', text: "It's going. Halcyon, it's going out." },
    { who: 'desc', text: 'Then the ladder, and the maintenance run, and a long stretch of handset noise that is a woman moving fast in the dark.' },
    { who: 'wren', text: "clear of the fence. i don't know where i am but i'm not where they are" },
    { who: 'desc', text: 'The sun comes up on a city that has been handed a wall of engineering data at five in the morning and has absolutely no idea what to do with it.' },
    { who: 'sys', text: 'K-7 · legacy broadcast stack · TRANSMISSION LOGGED · station identified' },
    { who: 'desc', text: 'Station identified. Of course station identified. The stack stamps its own call sign on everything it sends, and has done since before you were born.' },
    { who: 'desc', text: 'Somewhere in a Halo building, a man called Cormac Vale is being handed a printout with the letters K-7 on it, and under that, the word HALCYON.' },
  ],
  goto: 'a1_close',
});

node({
  id: 'a1_ashed',
  chapter: 5,
  effects: { flags: { act1: 'ashed' }, exposure: 10, trust: 4 },
  lines: [
    { who: 'desc', text: 'Forty metres of black water under the Ashgate apron, and a very small sound.' },
    { who: 'desc', text: 'Halo searched her for two hours and found a courier with no cargo, no ticket worth reading, and nothing to charge.' },
    { who: 'desc', text: 'Vale stood on the road at grid-up with his hands in his coat and watched the streetlights come up over an empty apron. You listened to him not say anything for a long time, and it was the most satisfying silence of your career, and it lasted about four minutes.' },
    { who: 'wren', text: "They've let me go." },
    { who: 'wren', text: "Halcyon, they've let me go and I feel worse than I did on the mast." },
    { who: 'you', text: "You're alive. That was the job I was actually doing tonight." },
    { who: 'wren', text: "Sixteen years, and I put it in the water, and now nobody will ever have to answer for any of it." },
    { who: 'desc', text: 'The sun comes up. The sky is exactly as dark as it was yesterday. Nothing whatsoever has changed.' },
    { who: 'desc', text: 'Which is when Ezra Maddox, who waited at the pier until seven and then went home, starts making phone calls — because the drum was never the only copy of anything, and an archivist knows that better than anyone alive.' },
  ],
  goto: 'a1_close',
});

node({
  id: 'a1_delivered',
  chapter: 5,
  effects: { flags: { act1: 'delivered' }, exposure: 20 },
  lines: [
    { who: 'desc', text: 'Halo collected it at 05:20 in full daylight, with a Port Authority clerk standing there wondering what everybody was looking so serious about.' },
    { who: 'sys', text: 'Ticket 4471 · HANDOVER COMPLETE · 9,000 cleared' },
    { who: 'desc', text: 'Job complete. The relay logged a clean handover and the money is real and it is in her account before the streetlights are fully warm.' },
    { who: 'wren', text: "I've been paid." },
    { who: 'wren', text: "I want you to know that I have been paid, and that I am going to be sick." },
    { who: 'desc', text: 'The drum goes into a Halo evidence locker. The Eclipse remains, officially, a cascade fault in an aging array, tragic, nobody\'s fault, here is a memorial.' },
    { who: 'desc', text: 'And that would be the end of it, except for two things.' },
    { who: 'desc', text: 'The first is that Vale did not need to put eleven radios on a public road for a courier who was going to hand it over anyway — which means he was never sure she would.' },
    { who: 'desc', text: 'The second is that at 06:40, less than two hours after you go off shift, your own door gets knocked on.' },
  ],
  goto: 'a1_close',
});

node({
  id: 'a1_burned',
  chapter: 5,
  effects: { flags: { act1: 'burned' }, exposure: -5, trust: -25, composure: -25 },
  lines: [
    { who: 'desc', text: 'They took her on the Ashgate road at 04:52. She did not run, because you had told her the road was clear, and she believed you, because believing the voice in your ear is the entire job.' },
    { who: 'desc', text: 'The last thing on channel four before they bagged the handset was not a scream and not a curse. It was:' },
    { who: 'wren', text: 'Halcyon? Halcyon, are you still there?' },
    { who: 'desc', text: 'You were. You are. That is the part that does not improve with time.' },
    { who: 'vale', text: '"Clean work. I meant what I said about the file."' },
    { who: 'desc', text: 'And your file does go very boring, permanently, exactly as promised, which you discover at 06:15 when you look yourself up and find a record so unremarkable it reads like a man who has never been anywhere.' },
    { who: 'sys', text: 'Shift closed · HALCYON · no incidents logged' },
    { who: 'desc', text: 'No incidents logged. Five hours, four people, one courier in a holding room at Ashgate, and the log says no incidents.' },
    { who: 'desc', text: 'You sit in the chair until the cleaners come. Then you go home and you do not sleep, and at 06:40 somebody knocks on your door, and it is not Halo.' },
  ],
  goto: 'a1_close',
});

node({
  id: 'a1_close',
  chapter: 5,
  effects: { composure: 22 },
  lines: [
    { who: 'sys', text: 'End of Act One' },
    { who: 'desc', text: 'Handlers work nights. That is the whole shape of the job: you are awake for the part of the day when the city cannot see itself, and then you go home and sleep through the part where it can.' },
    { who: 'desc', text: 'You have not gone home.' },
  ],
  goto: 'ch5_open',
});

node({
  id: 'res_deliver_plain_tail',
  chapter: 5,
  effects: { exposure: 8, trust: -10 },
  lines: [
    { who: 'desc', text: 'She walked up the middle of the Ashgate road at five to five, because you had not found out that eleven radios were sitting on it, and you cannot warn anybody about a thing you did not spend the night learning.' },
    { who: 'vale', text: '"Tell your handler it was a good night\'s work. Most people don\'t get this close."' },
    { who: 'desc', text: 'Close enough to her collar mic that it was clearly meant for you.' },
  ],
  goto: 'a1_delivered',
});

node({
  id: 'end_dead_air_road',
  chapter: 5,
  ending: {
    key: 'dead_air',
    title: 'Dead Air',
    body: `Carrier tone is not silence. That is the thing nobody tells you about this job. Silence would be bearable. Carrier tone is the sound of a channel that is still open, still paid for, still perfectly capable of carrying a voice, and simply has no voice on it.

You sat with it for four hours. You did all the things you are trained to do — reraise, reroute, request a relay handshake from every repeater between the Belt and the water — and each one came back clean, which meant the handset was fine.

The handset was fine.

Halo recovered a case from the Ashgate road at 05:04 and there is no public record of anything else being recovered from it.

Sable came in at six and found you still at the desk with the headset on and took it off your head herself.

"You can't have it open," she said. "It's dawn. She's not going to answer."

You know that. You still did not want to be the one who closed it.`,
  },
  lines: [],
});

node({
  id: 'end_timeout',
  chapter: 10,
  branch: [
    { requires: { act: 3 }, goto: 'end_timeout_a3' },
    { requires: { act: 2 }, goto: 'end_timeout_a2' },
    { goto: 'end_timeout_a1' },
  ],
  lines: [],
});

node({
  id: 'end_timeout_a1',
  chapter: 5,
  ending: {
    key: 'timeout',
    title: 'Grid-Up',
    body: `At 04:50 the streetlights of Kestrel Bay came up all at once, the way they have every morning for sixteen years, and every receiver in the city synced to the relay band to find out what time it was.

Wren was still carrying it. Still deciding, or still waiting for you to decide, in a city that had just switched its lights on around her.

There is nowhere to be invisible in Ashgate in daylight. It took them forty minutes.

You spent the night doing careful, thorough, genuinely good work, and you ran out of the only thing on that desk you could not requisition more of.

Sable's note in the log reads: HANDLER ON STATION THROUGHOUT. It is meant kindly.`,
  },
  lines: [],
});

node({
  id: 'end_timeout_a2',
  chapter: 8,
  ending: {
    key: 'timeout',
    title: 'Grid-Up',
    body: `The light goes at about four in this city, all at once and from the bottom up, and it does not matter in the slightest how much you still had left to do.

You were on a tram, or in a stairwell, or halfway to a door on the Verge, and then it was dark and the memorial was at eleven and you had nothing to take into it.

You went anyway. Everyone does. Two hundred people in evening coats and a bell, and a woman of sixty-eight reading out nine numbers in a nice voice, and you standing at the back with a canvas bag full of tape and no one in that room who knew what it was.

There is a version of this where you found the man who was eight feet away, or asked an archivist a direct question, or knocked on a door in the Verge before the afternoon ran out. All of them were available. None of them were free.

That is the whole difficulty with daylight: it is eight hours, and it is the same eight hours for everybody, and there is no chair you can sit in to get more of it.

Wren was at the Exchange too. You found each other by the drinks table at about midnight and neither of you had anything to say.`,
  },
  lines: [],
});

node({
  id: 'end_timeout_a3',
  chapter: 10,
  ending: {
    key: 'timeout',
    title: 'Grid-Up',
    body: `The bell rang at eleven and the frequency dropped at 23:01, and grid-up came at 04:40, and both of the doors this night had in it opened and closed while you were still deciding which one to use.

You were not caught. Nothing dramatic happened at all. You simply stood in a hall, and then in a street, and then in the grey, holding everything you needed and no longer having anywhere to put it.

Sixteen years of array telemetry. A burn authorisation with a signature above the operator line. Four spools of K-7 tape in a canvas bag. The whole of it, intact, in your hands, at dawn, with the memorial over and the next one in a year.

A year is not actually very long. That is what you tell yourself on the tram home, and it is true, and Ammi Sarran is seventy-one, and Teodor Reyes drinks.

Wren raised you twice on the way back and you did not answer, because the only sentence available was "we'll do it next February", and you could not make yourself say it on an open channel.`,
  },
  lines: [],
});

node({
  id: 'break_point',
  chapter: 4,
  branch: [
    { requires: { act: 3 }, goto: 'break_act3' },
    { requires: { act: 2 }, goto: 'break_act2' },
  ],
  lines: [
    { who: 'desc', text: 'There is a point past which a person stops hearing the voice in their ear as help and starts hearing it as one more thing in the dark that wants something from them.' },
    { who: 'wren', text: 'stop' },
    { who: 'wren', text: 'stop talking. stop telling me where to put my feet.' },
    { who: 'wren', text: "i've had a voice in my ear all night and every single time it said go, it was wrong" },
    { who: 'desc', text: 'Then she takes the handset off. You hear it hit something, and then you hear the inside of a pocket, and then you hear a road.' },
    { who: 'alert', text: 'Channel 4 — carrier only' },
  ],
  goto: 'end_dead_air_break',
});

node({
  id: 'break_act2',
  chapter: 6,
  effects: { flags: { wrenGone: true } },
  lines: [
    { who: 'desc', text: 'It does not happen on a channel this time. It happens in a room, in daylight, which is infinitely worse, because you have to watch it.' },
    { who: 'wren', text: "I've been awake for thirty hours and every single thing that has happened to me in them happened because a voice told me to do it." },
    { who: 'you', text: 'Wren —' },
    { who: 'wren', text: "No. You don't get to say my name in that voice. That's the handler voice. That's the voice that put me on a road." },
    { who: 'desc', text: 'She is not wrong, and there is no available sentence that is not also the handler voice, because it is the only voice you have.' },
    { who: 'desc', text: 'She goes. Not dramatically — she picks up her coat and goes out of a collapsed exchange into the grey, and Ilsa does not try to stop her, and neither do you, because you have finally worked out that trying would be the same act again.' },
  ],
  goto: 'end_dead_air_walk',
});

node({
  id: 'break_act3',
  chapter: 10,
  effects: { flags: { wrenGone: true } },
  lines: [
    { who: 'desc', text: 'Two hundred people in evening coats, a bell about to go, and a courier who has not properly slept in two days standing at the back of a hall with her hands shaking.' },
    { who: 'wren', text: "I can't." },
    { who: 'wren', text: "I've come all this way and I have wanted this for sixteen years and I am standing in the room and I cannot make my legs do it." },
    { who: 'desc', text: 'You could push. She would go. That is the thing about a voice somebody has been listening to for two days — it works, right up until the moment it has cost too much, and then it works one last time and takes everything left.' },
    { who: 'desc', text: 'You do not push.' },
    { who: 'desc', text: 'The bell rings for sixty seconds. Odile Ferrant reads out nine numbers. Somebody near the drinks table starts talking about the rain, and a woman at the back of the hall stands very still with her eyes shut until it is over.' },
  ],
  goto: 'end_ash_broken',
});

node({
  id: 'end_dead_air_walk',
  chapter: 6,
  ending: {
    key: 'dead_air',
    title: 'Dead Air',
    body: `She did not die. It is important to be accurate about that, and it is the only accurate thing available that helps at all.

She walked out of a collapsed exchange at two in the afternoon and did not come back, and did not go to the memorial, and has not raised this desk or any other desk since.

Ilsa says she left the city. Ilsa says a lot of things and knows most of them.

You went to the Exchange anyway, with a canvas bag of tape and a drum and every fact you had assembled in a day of daylight, and stood at the back while a woman of sixty-eight read out nine numbers in a nice voice, and you did not stand up.

Not because you were afraid. Because the entire case you had built ran through one person — not her evidence, her *presence*; the daughter of Operator Seven standing in the room — and you had spent two days spending her down to nothing without ever once checking the level.

Composure is not a bar on a screen. It is a person deciding, incrementally, whether the voice in their ear is worth listening to.

She stopped deciding yes.

You still work nights. Nine dead channels and one live one, and a leak over switch four, and a bucket you change on Thursdays.`,
  },
  lines: [],
});

node({
  id: 'end_ash_broken',
  chapter: 10,
  ending: {
    key: 'ash',
    title: 'Ash and Salt',
    body: `You did not push, and that was the right call, and it cost you the entire thing.

The bell rang. The frequency was live for sixty seconds over a roof. Every surviving person it happened to was standing in that hall and not one of them said a word, because the only person who was ever going to start it was at the back with her eyes shut, and she had nothing left.

You could have pushed. She would have gone. Two days of a voice in her ear had made absolutely certain of that, and using it one last time would have worked, and would have been the same act that put her on a road on the first night, and you finally — a night and a day and a night too late — declined to do it.

Afterwards you sat on the Exchange steps in the rain.

"I'm sorry," she said.

"Don't."

"I had it. It was right there and I had it and I couldn't."

"You'd been awake for two days because of me. That's not a failure of nerve, that's arithmetic."

She laughed, a bit. It was not much of a laugh but it was hers, and it was the first thing in forty-eight hours that had not been extracted from her by somebody who needed something.

The sky is still out. The record still says accident. Odile Ferrant will read the numbers again in February and somebody else will have to do something about it.

Wren sleeps now. She says it took about a month. She takes your desk sometimes and you talk about nothing for five hours, which is, it turns out, the only part of any of this either of you was ever actually good at.`,
  },
  lines: [],
});

node({
  id: 'end_dead_air_break',
  chapter: 5,
  ending: {
    key: 'dead_air',
    title: 'Dead Air',
    body: `She did not die because of one decision. That would be cleaner than what actually happened.

She came apart slowly, over five hours, in increments you could have seen coming if you had been watching her instead of the clock — and the clock was right there, and it was so much easier to read.

Composure is not a bar on a screen. It is a person deciding, incrementally, whether the voice in their ear is worth listening to. She stopped deciding yes.

The handset came back on at 06:10 in a Halo property inventory. There is no public record of what else was inventoried.

You still have the shift. Sable offered you a week off and you did not take it, because the desk is quiet and the channel is open and some nights you can convince yourself you are waiting for something.

Nine dead channels, and one live one, and nobody on it.`,
  },
  lines: [],
});

// ---- Steadying beats: the cost of treating her as a person -----------------

node({
  id: 'ch1_okay',
  chapter: 1,
  lines: [
    { who: 'wren', text: "...Nobody's asked me that on a job before." },
    { who: 'wren', text: "No. Not really. I've had a bad feeling since I took the ticket and it hasn't improved." },
    { who: 'you', text: 'Then we go slow and we go careful, and if it gets worse you say so out loud.' },
    { who: 'wren', text: "Out loud. Alright." },
    { who: 'desc', text: 'Her breathing changes. It is not much. It is the only instrument you have.' },
  ],
  goto: 'ch1_job',
});

node({
  id: 'ch3_steady',
  chapter: 3,
  branch: [
    { requires: { counts: { steady: { min: 3 } } }, goto: 'ch3_steady_c' },
    { requires: { counts: { steady: { min: 2 } } }, goto: 'ch3_steady_b' },
  ],
  lines: [
    { who: 'desc', text: 'The archive keeps spooling without you. You turn the chair away from it.' },
    { who: 'wren', text: "You've gone quiet again." },
    { who: 'you', text: "I'm here. I'm not going to do the thing where I stop being a person because I'm busy." },
    { who: 'wren', text: "It's very cold in here and there's a hum in the wall and I have been listening to it for forty minutes deciding whether it's a truck." },
    { who: 'you', text: "It's the mast. It's been humming since before either of us was born." },
    { who: 'wren', text: 'Okay.' },
    { who: 'wren', text: 'Okay. That helps, actually. That is a stupid amount of help.' },
  ],
  goto: 'ch3_desk',
});

node({
  id: 'ch3_steady_b',
  chapter: 3,
  lines: [
    { who: 'wren', text: 'Talk about anything. I genuinely do not care what.' },
    { who: 'you', text: 'Switch four on this board has had a leak in it for six years. Drips into a bucket. I change the bucket on Thursdays.' },
    { who: 'wren', text: 'You change the bucket.' },
    { who: 'you', text: 'Somebody has to change the bucket.' },
    { who: 'wren', text: "God. Sixteen years of night and somebody's still changing the bucket." },
    { who: 'desc', text: 'She laughs — properly, once — and it is worth more to tonight than anything on the tapes.' },
  ],
  goto: 'ch3_desk',
});

node({
  id: 'ch3_steady_c',
  chapter: 3,
  lines: [
    { who: 'wren', text: "Halcyon. You keep coming back." },
    { who: 'you', text: 'Yes.' },
    { who: 'wren', text: "You've got an archive open with the worst night of my life in it and you keep putting it down to ask how I am." },
    { who: 'wren', text: "I don't know what to do with that. I came here ready to hate whoever picked up." },
    { who: 'desc', text: 'The clock on your board turns over another minute. You let it.' },
  ],
  effects: { trust: 6 },
  goto: 'ch3_desk',
});

node({
  id: 'ch4_steady',
  chapter: 4,
  lines: [
    { who: 'you', text: 'Sit down. Back to the wall. Case on your knees.' },
    { who: 'wren', text: "There isn't time —" },
    { who: 'you', text: 'There is nine minutes of time, and you are going to spend it breathing, because I have listened to people make this decision badly and it always sounds like this first.' },
    { who: 'desc', text: 'Nine minutes of a woman breathing in a freezing substation while a city gets ready to switch its lights on.' },
    { who: 'wren', text: "Alright." },
    { who: 'wren', text: "Alright. Ask me again what I want to do with it, and I'll give you a real answer." },
  ],
  goto: 'ch4_plan',
});

// ---- Debts coming due ------------------------------------------------------

node({
  id: 'ch4_truth_recant',
  chapter: 4,
  effects: { flags: { toldTruth: true, recanted: true }, trust: -12 },
  lines: [
    { who: 'you', text: "Earlier tonight you asked how long I'd had the call sign and I said longer than you think. That was a lie, and I want it back." },
    { who: 'you', text: 'Six years. HALCYON is a chair. Three people have sat in it, and the one who was in it that night has been dead eleven years.' },
    { who: 'desc', text: 'The link hisses. It is a long hiss.' },
    { who: 'wren', text: 'Why would you say that to me.' },
    { who: 'you', text: "Because you'd been looking for a year and I wanted to be the thing you found." },
    { who: 'wren', text: "...That's almost an answer." },
    { who: 'wren', text: "I believe this version. I want you to understand that's a decision I'm making, not a thing you've earned." },
  ],
  goto: 'ch4_plan',
});

node({
  id: 'ch4_beacon_owned',
  chapter: 4,
  effects: { trust: -16, composure: -6 },
  lines: [
    { who: 'desc', text: 'There is no good half-second available here, so you take the one that is true.' },
    { who: 'you', text: 'Yes. I knew in the Belt. I decided you were better off walking steady than walking scared, and I was wrong, and it cost you twelve blocks.' },
    { who: 'wren', text: 'You decided.' },
    { who: 'you', text: 'I decided.' },
    { who: 'wren', text: "That's the whole job, isn't it. You sit in a warm room and you decide what I'm allowed to know about the thing in my hands." },
    { who: 'desc', text: 'Below her, on the Ashgate road, eleven radios that have been sitting still all night stop sitting still.' },
    { who: 'wren', text: "We'll do this now. But when it's done, we're going to have a conversation about that." },
  ],
  goto: 'ch4_choice',
});

// ============================================================================
// ACT TWO — DAYLIGHT
// The clock resets and the pressure inverts. In Act I you spent the night
// protecting somebody else; in daylight you are the exposed one, and every
// useful thing you can do makes you more visible doing it.
// ============================================================================

node({
  id: 'ch5_open',
  chapter: 5,
  effects: { openAct: 2, chapter: 5, loc: 'home', signal: 'clear' },
  lines: [
    { who: 'sys', text: 'ACT TWO — DAYLIGHT' },
    { who: 'sys', text: 'Kestrel Bay · 06:10 · twelve hours of usable light' },
    { who: 'desc', text: 'Daylight in Kestrel Bay is not sunlight. It is a grey that comes up under the cloud deck and makes everything look like a photograph of itself. It lasts until about half past six, and then the city gives up.' },
    { who: 'desc', text: 'You have never once worked in it. Handlers are nocturnal by contract.' },
    { who: 'desc', text: 'Somebody knocks on your door at 06:40, and in six years nobody has ever knocked on your door.' },
  ],
  goto: 'ch5_knock',
});

node({
  id: 'ch5_knock',
  chapter: 5,
  branch: [
    { requires: { flags: { act1: 'burned' } }, goto: 'ch5_knock_burned' },
    { requires: { flags: { act1: 'broadcast' } }, goto: 'ch5_knock_broadcast' },
    { goto: 'ch5_knock_normal' },
  ],
  lines: [],
});

node({
  id: 'ch5_knock_normal',
  chapter: 5,
  lines: [
    { who: 'desc', text: 'It is Sable. Off shift, out of the relay, in a coat you have never seen because you have never seen her anywhere but behind a dispatch board.' },
    { who: 'sable', text: "Don't turn the light on." },
    { who: 'sable', text: "Halo sealed K-7 at six. Tape across the stairwell, a man on the door, and a list of everyone rostered in the last seventy-two hours." },
    { who: 'you', text: 'A list with me on it.' },
    { who: 'sable', text: 'A list with you at the top of it, because you were in the chair.' },
    { who: 'desc', text: 'She has a canvas bag with her. She puts it down the way people put down things they have been carrying too long.' },
  ],
  goto: 'ch5_sable',
});

node({
  id: 'ch5_knock_broadcast',
  chapter: 5,
  effects: { exposure: 8 },
  lines: [
    { who: 'desc', text: 'It is Sable, and she is furious in the specific way of a person who has spent three hours being frightened first.' },
    { who: 'sable', text: 'You put it on the ACTUAL AIR.' },
    { who: 'sable', text: "Every handset in the city, from a station whose call sign is stamped on the carrier. That's not a leak, that's a signed confession with a soundtrack." },
    { who: 'you', text: 'It went out.' },
    { who: 'sable', text: "It went out and nobody knows what it MEANS. It's numbers, Halcyon. By eight they'd called it fragmentary on three channels and by nine it was a prank." },
    { who: 'desc', text: 'She stops. Puts a canvas bag down on your table the way people put down things they have been carrying too long.' },
    { who: 'sable', text: "Which is why you're going to need this, and why I'm going to be sick about having brought it." },
  ],
  goto: 'ch5_sable',
});

node({
  id: 'ch5_knock_burned',
  chapter: 5,
  lines: [
    { who: 'desc', text: 'It is Sable, and she does not say anything at all for long enough that you have to look at her.' },
    { who: 'sable', text: 'Ashgate holding took a courier in at five this morning on a transport charge.' },
    { who: 'sable', text: 'The arresting note says the subject was cooperative and stationary and had been advised the road was clear.' },
    { who: 'desc', text: 'Advised the road was clear. Somebody typed that.' },
    { who: 'sable', text: "I've known you six years. Tell me you didn't." },
    { who: 'desc', text: 'There is a version of the next ten seconds where you explain about the ward your sister\'s kids are schooled in. You have already worked out that it does not help.' },
    { who: 'sable', text: "...Right." },
    { who: 'desc', text: 'She puts a canvas bag down on your table the way people put down things they have been carrying too long.' },
    { who: 'sable', text: "Then you're going to spend today fixing it, and I'm going to help, and neither of us is going to enjoy it." },
  ],
  effects: { composure: -8 },
  goto: 'ch5_sable',
});

node({
  id: 'ch5_sable',
  chapter: 5,
  linesOnce: true,
  lines: [
    { who: 'desc', text: 'The bag has four spools of tape in it. Physical tape, in tins, with K-7 stencilled on the lids and a date sixteen years old.' },
    { who: 'you', text: 'You took the archive out of a sealed building.' },
    { who: 'sable', text: 'I took the archive out at five-forty. The building was sealed at six.' },
    { who: 'sable', text: "Tape can't be deleted from a desk in another district, Halcyon. That's the entire reason they're in a cabinet and not on a server, and it's the entire reason Halo went to K-7 first and not to you." },
  ],
  choices: [
    {
      text: "Why did you route this job to my desk, Sable?",
      sub: 'The question from last night, asked in daylight.',
      requires: { flags: { askedSableWhy: false } },
      effects: { time: -18, count: { table: 1 }, flags: { askedSableWhy: true }, leads: ['L_SABLE_ORDER'] },
      goto: 'ch5_q_order',
    },
    {
      text: 'What are they actually charging her with?',
      requires: { flags: { askedCharge: false } },
      effects: { time: -14, count: { table: 1 }, flags: { askedCharge: true }, leads: ['L_WREN_CHARGE'] },
      goto: 'ch5_q_charge',
    },
    {
      text: 'Who else was blamed? Give me all nine.',
      requires: { flags: { askedNine: false } },
      effects: { time: -20, count: { table: 1 }, flags: { askedNine: true }, leads: ['L_NINE_LIST', 'L_DESK_TAPES'] },
      goto: 'ch5_q_nine',
    },
    {
      text: 'Then we work. Where do I start?',
      sub: 'Spend nothing more on the kitchen table.',
      requires: { counts: { table: { min: 2 } } },
      lockedText: 'She has carried a stolen archive across a city to your door and you have asked her almost nothing. (Needs: 2 questions)',
      silent: true,
      goto: 'ch5_out',
    },
  ],
});

node({
  id: 'ch5_q_order',
  chapter: 5,
  lines: [
    { who: 'sable', text: 'Because she paid me to.' },
    { who: 'desc', text: 'Flatly, straight out, the way people confess things they have already finished arguing with themselves about.' },
    { who: 'sable', text: 'Standing order, a year old. Any job touching the old grid, any blank manifest — route it to K-7, put Wren on it. She paid it monthly out of her own take and she never missed one.' },
    { who: 'you', text: 'And you never told her why K-7 mattered.' },
    { who: 'sable', text: "I didn't know why it mattered. I knew that in my second year someone from Halo came and read the K-7 roster and left, and that they did it again the year after, and then stopped." },
    { who: 'sable', text: "I knew somebody had been checking who was sitting in that chair. I took a courier's money for a year to put her in front of it, and I never once said that out loud to her." },
    { who: 'you', text: 'Why not?' },
    { who: 'sable', text: 'Because she\'d have stopped paying, and because I\'d have had to find out what it meant.' },
  ],
  goto: 'ch5_sable',
});

node({
  id: 'ch5_q_charge',
  chapter: 5,
  lines: [
    { who: 'sable', text: 'Unlicensed carriage across a restricted grid corridor.' },
    { who: 'you', text: "That's a transport offence. That's a fine." },
    { who: 'sable', text: "That's a fine, a bail figure, and — this is the part — no requirement anywhere in it to state what was being carried." },
    { who: 'desc', text: 'You look at that for a second and the shape of it arrives all at once.' },
    { who: 'you', text: "They're not trying to convict her." },
    { who: 'sable', text: "They're trying very hard to not have a trial. A trial has disclosure in it. Disclosure has a drum in it." },
  ],
  goto: 'ch5_sable',
});

node({
  id: 'ch5_q_nine',
  chapter: 5,
  lines: [
    { who: 'sable', text: 'Nine operators on the review board finding. They were never named — just numbered, so nobody had to be a person.' },
    { who: 'desc', text: 'She writes them out on the back of a dispatch slip, which is the only paper either of you owns.' },
    { who: 'sys', text: 'ONE — dead, 3 yrs · TWO — dead, 11 yrs · THREE — Ammi Sarran, settled · FOUR — T. Reyes, settled, then spent it' },
    { who: 'sys', text: 'FIVE — dead, 16 yrs (that night) · SIX — refused contact, whereabouts unknown' },
    { who: 'sys', text: 'SEVEN — deceased · EIGHT — E. Maddox, settlement declined · NINE — emigrated, unreachable' },
    { who: 'you', text: 'Seven.' },
    { who: 'sable', text: "Seven is her mother. Yes." },
    { who: 'desc', text: 'Three of them are alive and in this city. That is the entire remaining evidence base for the worst night in its history, and two of them signed something promising never to discuss it.' },
    { who: 'sable', text: "One more thing, and it's the only good news you'll get today. K-7's archive is tape. It always was. Tape can't be quietly edited, and it can't be denied — it can only be carried out of a building or set on fire." },
    { who: 'sable', text: "I carried it out. So now it can only be set on fire." },
  ],
  goto: 'ch5_sable',
});

// ---- Chapter Six: The Nine --------------------------------------------------
// Act II's hub. Same shape as the Act I desk, different currency: out here
// every useful thing you do is done in daylight, where people can see you.

node({
  id: 'ch6_open',
  chapter: 6,
  effects: { chapter: 6 },
  lines: [
    { who: 'sys', text: 'Chapter Six — The Nine' },
    { who: 'desc', text: 'Three of the nine are alive and in this city. One is an archivist who has already tried to move a drum across it and failed. The other two signed something.' },
    { who: 'sable', text: "I'll work dispatch and keep the rota noisy so nobody notices which desks are empty. You go out." },
    { who: 'you', text: 'I have never once worked in daylight.' },
    { who: 'sable', text: "No. And everything you do out there, somebody watches you do." },
    { who: 'desc', text: 'Which is the whole difference, and it takes you most of the morning to understand it properly: last night you were invisible and she was exposed. Today it is the other way round.' },
  ],
  goto: 'ch6_hub',
});

node({
  id: 'ch6_hub',
  chapter: 6,
  linesOnce: true,
  branch: [
    { requires: { exposure: { min: 82 }, flags: { raided: false } }, goto: 'ch6_raid' },
    { requires: { timeMax: 120 }, goto: 'ch7_open' },
    { requires: { counts: { day: { min: 1 } }, flags: { sawMorning: false } }, goto: 'ch6_news' },
    { requires: { counts: { day: { min: 2 } }, flags: { vale2: false } }, goto: 'ch6_vale' },
    { requires: { counts: { day: { min: 3 } }, flags: { interviewed: false } }, goto: 'ch6_interview' },
    { requires: { counts: { day: { min: 4 } }, flags: { together: false } }, goto: 'ch6_together' },
    { requires: { counts: { day: { min: 5 } }, flags: { followed: false } }, goto: 'ch6_followed' },
  ],
  lines: [
    { who: 'sys', text: 'Daylight · you are on foot and on a list' },
  ],
  choices: [
    {
      text: 'The Drowned Bell. Find Operator Four.',
      sub: 'Reyes. Settled, then spent it. Talks to anyone.',
      requires: { flags: { didRook: false } },
      effects: { time: -76, exposure: 6, count: { day: 1 }, flags: { didRook: true }, leads: ['L_ROOK_HEARD'] },
      silent: true,
      goto: 'ch6_rook',
    },
    {
      text: 'The Verge. Operator Three, in her own house.',
      sub: 'Sarran. Settled and kept it. This will not be welcome.',
      requires: { flags: { didAmmi: false } },
      effects: { time: -96, exposure: 12, count: { day: 1 }, flags: { didAmmi: true }, leads: ['L_AMMI_GAG'] },
      silent: true,
      goto: 'ch6_ammi',
    },
    {
      text: "Maddox's rooms. He is the only one who chose this.",
      requires: { flags: { didMaddoxVisit: false } },
      effects: { time: -69, exposure: 10, count: { day: 1 }, flags: { didMaddoxVisit: true }, leads: ['L_SECOND_COPY'] },
      silent: true,
      goto: 'ch6_maddox',
    },
    {
      text: 'Pull everything there is on Cormac Vale.',
      sub: 'He said something last night that has not stopped itching.',
      requires: { flags: { didValeCheck: false } },
      effects: { time: -55, exposure: 8, count: { day: 1 }, flags: { didValeCheck: true }, leads: ['L_VALE_WAS_RELAY'] },
      silent: true,
      goto: 'ch6_valefile',
    },
    {
      text: 'Reach Wren.',
      requires: { flags: { didWren: false } },
      effects: { time: -62, exposure: 9, count: { day: 1 }, flags: { didWren: true } },
      silent: true,
      goto: 'ch6_wren',
    },
    {
      text: 'Find out what happens in this city tonight.',
      sub: 'The sixteenth memorial. Somebody reads the names out.',
      requires: { flags: { didMemorial: false } },
      effects: { time: -35, exposure: 4, count: { day: 1 }, flags: { didMemorial: true }, leads: ['L_MEMORIAL', 'L_FERRANT_SIGNED'] },
      silent: true,
      goto: 'ch6_memorial',
    },
    {
      text: 'Go quiet for an hour. Sit somewhere with no line of sight.',
      sub: 'Buys back what they have on you. Costs the day.',
      effects: { time: -60, exposure: -18, composure: 14, count: { quiet: 1 } },
      silent: true,
      goto: 'ch6_quiet',
    },
    {
      text: 'Enough. Whatever I have is what I take into tonight.',
      requires: { counts: { day: { min: 4 } } },
      lockedText: 'You have a day and you have spent almost none of it. (Needs: 4 lines of enquiry)',
      silent: true,
      goto: 'ch7_open',
    },
  ],
});

node({
  id: 'ch6_rook',
  chapter: 6,
  effects: { loc: 'rill_bar' },
  lines: [
    { who: 'desc', text: 'The Drowned Bell is built into the Rill wall and has been open continuously since before the Eclipse, which its customers will tell you is the longest anything in Kestrel Bay has managed.' },
    { who: 'desc', text: 'Teodor Reyes is at the end of it at eleven in the morning, and has clearly been at the end of it for some years.' },
    { who: 'rook', text: "You're not from the Trust." },
    { who: 'you', text: 'No.' },
    { who: 'rook', text: "Good. They come every February. Very nice about it. Ask how I'm getting on and then leave before I get to the part." },
    { who: 'you', text: 'What part?' },
    { who: 'rook', text: 'The part where I tell them Seven said no.' },
    { who: 'desc', text: 'He says it like a man putting a coin in a slot he has put a lot of coins in.' },
    { who: 'rook', text: "I was eight feet from her. Operator Four, board eleven. The order came down and she read it and she said — and I can do the voice, I've had sixteen years to practise the voice —" },
    { who: 'rook', text: '"Array burn is not survivable for the satellite tier. I am not confirming this."' },
    { who: 'rook', text: 'And the line said fine, and asked her again, and she said it again. Twice. Which nobody writes down, because refusing twice is the same as refusing once in a report.' },
    { who: 'you', text: 'Then what?' },
    { who: 'rook', text: "Then somebody else confirmed it. Not on our floor. It came back to us already agreed, from outside, with a station code on it that nobody in that room recognised." },
    { who: 'desc', text: 'He looks into the glass. This is plainly the part where the Trust leaves.' },
    { who: 'you', text: 'K-7.' },
    { who: 'desc', text: 'Reyes stops with the glass halfway up.' },
    { who: 'rook', text: 'Say that again.' },
    { who: 'you', text: 'The station code was K-7. I have heard the tape. I have been sitting at that desk for six years.' },
    { who: 'desc', text: 'The most frightening thing about the next thirty seconds is that he does not look triumphant. He looks like a man who has just been told the thing he has been shouting into a bar for sixteen years is true, and is discovering that it does not help.' },
    { who: 'rook', text: "...I'd stopped believing me too, you know. Round about year nine." },
  ],
  effects: { composure: -3 },
  goto: 'ch6_rook_ask',
});

node({
  id: 'ch6_rook_ask',
  chapter: 6,
  lines: [
    { who: 'rook', text: 'What do you want, then. You didn\'t come to a bar at eleven for the company.' },
  ],
  choices: [
    {
      text: 'I want you to say it tonight. In a room. With the Trust in it.',
      sub: 'A drunk witness is still a witness, and there is only one room.',
      requires: { leads: ['L_MEMORIAL'] },
      lockedText: 'You do not yet know of a room where it would matter. (Needs: The memorial is tonight)',
      effects: { time: -12, trust: 4, flags: { rookCommitted: true } },
      goto: 'ch6_rook_yes',
    },
    {
      text: 'I want it written down and signed while you are sober enough to sign it.',
      effects: { time: -25, flags: { rookStatement: true } },
      goto: 'ch6_rook_sign',
    },
    {
      text: 'Nothing yet. I needed to know the tape matched a person.',
      effects: { trust: 2 },
      goto: 'ch6_hub',
    },
  ],
});

node({
  id: 'ch6_rook_yes',
  chapter: 6,
  lines: [
    { who: 'rook', text: 'The memorial.' },
    { who: 'you', text: 'The memorial. Where they read the numbers out and everybody looks at their shoes.' },
    { who: 'rook', text: "I've been to fourteen of them. I stand at the back and I don't say anything, because the one year I did, two very polite men walked me to a car." },
    { who: 'desc', text: 'He turns the glass round on the bar. Once, twice.' },
    { who: 'rook', text: "Will you be there?" },
    { who: 'you', text: 'Yes.' },
    { who: 'rook', text: "Then I'll be sober, and I'll be at the back, and when you want me you'll say Operator Four out loud and I'll come up the aisle." },
    { who: 'rook', text: "Sixteen years. And all anybody had to do was believe the tape existed." },
  ],
  goto: 'ch6_hub',
});

node({
  id: 'ch6_rook_sign',
  chapter: 6,
  lines: [
    { who: 'desc', text: 'It takes twenty-five minutes and two cups of the bar\'s terrible coffee, and what comes out of it is a page and a half in a shaking hand that is nevertheless entirely coherent.' },
    { who: 'rook', text: 'There. Operator Four, statement of, sixteen years late.' },
    { who: 'you', text: 'Thank you.' },
    { who: 'rook', text: "It's worth nothing, you know. A settled man who drinks, describing a conversation from sixteen years ago. Any lawyer alive takes that apart in a minute." },
    { who: 'you', text: "It's worth nothing on its own. Next to a tape with the same nine words on it, it's worth everything, because then it isn't a memory — it's a corroboration." },
    { who: 'desc', text: 'Reyes looks at you for a while.' },
    { who: 'rook', text: "Nobody's ever put it the good way round before." },
  ],
  goto: 'ch6_hub',
});

node({
  id: 'ch6_ammi',
  chapter: 6,
  effects: { loc: 'ammi_house' },
  lines: [
    { who: 'desc', text: 'The Verge is the good side of the hill. The streetlights here have worked continuously for sixteen years, which in this city is not a municipal fact but a moral one.' },
    { who: 'desc', text: 'Ammi Sarran opens the door on a chain, and her face does something complicated and fast, and then she opens it properly, which tells you she has been expecting somebody for sixteen years and it may as well be you.' },
    { who: 'ammi', text: "You're not police." },
    { who: 'you', text: "No. I'm a relay handler." },
    { who: 'desc', text: 'She closes her eyes.' },
    { who: 'ammi', text: 'Of course you are.' },
    { who: 'desc', text: 'The house is comfortable in the specific way of a house bought all at once. There is a piano nobody plays.' },
    { who: 'ammi', text: "I can't discuss the array. I can't discuss the board. And I can't discuss — " },
    { who: 'desc', text: 'She stops, and you watch her decide how much of the clause to say out loud.' },
    { who: 'ammi', text: " — any relay station, or any member of its staff." },
    { who: 'you', text: 'That is an extremely strange thing to put in a settlement about an equipment fault.' },
    { who: 'ammi', text: "Yes. It is." },
    { who: 'ammi', text: "I have thought about that clause every day for sixteen years, in this house, that I could not otherwise afford." },
  ],
  effects: { composure: -2 },
  goto: 'ch6_ammi_ask',
});

node({
  id: 'ch6_ammi_ask',
  chapter: 6,
  lines: [
    { who: 'desc', text: 'She does not ask you to leave. That is the entire opening you get.' },
  ],
  choices: [
    {
      text: "Then don't discuss it. Tell me what you'd be allowed to say if somebody else said it first.",
      sub: 'Give her a shape she can stay inside.',
      effects: { time: -20, trust: 3, flags: { ammiOpen: true } },
      goto: 'ch6_ammi_open',
    },
    {
      text: 'A courier is in a cell this morning for carrying the proof. Her mother was Operator Seven.',
      sub: 'Hard, and true, and unfair.',
      effects: { time: -14, composure: -4, flags: { ammiPressed: true } },
      goto: 'ch6_ammi_pressed',
    },
    {
      text: 'Thank you. I have what I came for — the clause itself is the evidence.',
      effects: { time: -6 },
      goto: 'ch6_hub',
    },
  ],
});

node({
  id: 'ch6_ammi_open',
  chapter: 6,
  lines: [
    { who: 'desc', text: 'She thinks about it for a long time, standing in her own hallway, next to a piano nobody plays.' },
    { who: 'ammi', text: 'If somebody else said it first.' },
    { who: 'ammi', text: "Then I would be allowed to agree that the confirmation did not come from our floor. I would be allowed to agree that it arrived with a station code on it. I would not be allowed to say the code." },
    { who: 'you', text: 'If somebody else said the code?' },
    { who: 'ammi', text: "...Then I would be allowed to not deny it." },
    { who: 'desc', text: 'Which is, you realise, exactly as much as a settled woman can give you, and she has worked out the geometry of it long before you arrived.' },
    { who: 'ammi', text: "I am at the memorial every year. I sit four rows from the front and I let a woman read my number out and I say nothing." },
    { who: 'ammi', text: "If somebody said it first, in that room, out loud — I would be in the room." },
  ],
  effects: { flags: { ammiCommitted: true }, trust: 4 },
  goto: 'ch6_hub',
});

node({
  id: 'ch6_ammi_pressed',
  chapter: 6,
  lines: [
    { who: 'ammi', text: "Don't." },
    { who: 'you', text: 'Her name is Wren. She has spent a year buying night shifts looking for the voice on the tape.' },
    { who: 'ammi', text: "DON'T." },
    { who: 'desc', text: 'It comes out of her much louder than either of you expected, in a hallway with good carpet.' },
    { who: 'ammi', text: "I have a daughter. I signed that thing when she was four years old and I have watched her grow up in a house it bought, and you are standing in my hall telling me about somebody else's daughter." },
    { who: 'desc', text: 'She is right, and you did it on purpose, and it works.' },
    { who: 'ammi', text: "The confirmation came from outside. It had a station code on it. That is all I will ever say to you and I will deny saying it." },
    { who: 'desc', text: 'The door closes. Through it, after a moment:' },
    { who: 'ammi', text: "...I go to the memorial every year. I sit four rows from the front." },
  ],
  effects: { flags: { ammiCommitted: true }, composure: -6, trust: -2 },
  goto: 'ch6_hub',
});

node({
  id: 'ch6_maddox',
  chapter: 6,
  effects: { loc: 'maddox_flat' },
  lines: [
    { who: 'desc', text: 'Ezra Maddox lives in two rooms with index cards on every surface. Not a filing system — a memory, externalised, about a building that no longer exists.' },
    { who: 'maddox', text: "You're the handler. The voice." },
    { who: 'you', text: 'Yes.' },
    { who: 'maddox', text: 'I have been awake since four. I have made a great deal of tea and drunk none of it.' },
    { who: 'desc', text: 'He is sixty-one and he has the specific brittleness of a man who did one brave thing four days ago and has been waiting ever since to find out what it cost.' },
    { who: 'desc', text: 'Then he goes to a shelf, and moves a row of cards, and takes down a second case exactly like the first.' },
    { who: 'you', text: '...Ezra.' },
    { who: 'maddox', text: 'I am an archivist.' },
    { who: 'maddox', text: 'An archivist does not move a unique object across a city in a toolbox. That is not caution, that is simply what the job is. There are two. There were always two.' },
    { who: 'desc', text: 'You sit down on a chair with index cards on it, because your legs have opinions about this.' },
    { who: 'maddox', text: "The first one was to find out whether they'd stop it. And they did stop it, which told me everything I needed to know about whether it was worth stopping." },
  ],
  effects: { trust: 5 },
  goto: 'ch6_maddox_ask',
});

node({
  id: 'ch6_maddox_ask',
  chapter: 6,
  lines: [
    { who: 'maddox', text: "So. It is yours, if you want it, and I would very much like somebody else to be holding it." },
  ],
  choices: [
    {
      text: 'What is actually on it? Say it in one sentence.',
      requires: { flags: { askedContents: false } },
      effects: { time: -16, flags: { askedContents: true }, leads: ['L_FERRANT_SIGNED'] },
      goto: 'ch6_maddox_what',
    },
    {
      text: "I'll take it. And you are going somewhere Halo has not got an address for.",
      sub: 'Take the copy. Move the man.',
      effects: { time: -22, exposure: 6, flags: { haveCopy: true, maddoxSafe: true }, trust: 4 },
      goto: 'ch6_maddox_take',
    },
    {
      text: 'Keep it. You are the safest place it can be, because nobody believes you have it.',
      sub: 'Leave it where it is. Leave him where he is.',
      effects: { time: -8, flags: { copyWithMaddox: true } },
      goto: 'ch6_maddox_keep',
    },
  ],
});

node({
  id: 'ch6_maddox_what',
  chapter: 6,
  lines: [
    { who: 'maddox', text: 'One sentence.' },
    { who: 'desc', text: 'He closes his eyes to get it right, the way people do with a thing they have rehearsed alone for years.' },
    { who: 'maddox', text: '"Array burn authorised by O. Ferrant, Director of Grid Continuity, refused twice at operator level, confirmed on relay, executed at 03:25."' },
    { who: 'desc', text: 'The room is very quiet.' },
    { who: 'you', text: 'Ferrant.' },
    { who: 'maddox', text: 'Odile Ferrant. Who is now the chair of the Eclipse Memorial Trust, and who reads the numbers out every year, in a nice voice, at the Exchange.' },
    { who: 'maddox', text: 'She reads out the number of a woman who refused her order twice, and then everybody has a drink.' },
  ],
  goto: 'ch6_maddox_ask',
});

node({
  id: 'ch6_maddox_take',
  chapter: 6,
  lines: [
    { who: 'desc', text: 'It takes the better part of an hour to get a sixty-one-year-old archivist out of his own flat with a bag, and most of that is him trying to decide which index cards matter.' },
    { who: 'you', text: 'Ezra. None of the cards matter. You are the only irreplaceable object in this room and you are wasting daylight.' },
    { who: 'maddox', text: 'Nobody has said anything that kind to me in some years.' },
    { who: 'desc', text: 'Ilsa takes him. Of course Ilsa takes him — a scav with an antenna and a collapsed exchange to hide it in has room for one frightened archivist and finds the whole thing enormously funny.' },
    { who: 'ilsa', text: "Handler. You keep giving me people." },
    { who: 'you', text: 'You keep taking them.' },
    { who: 'ilsa', text: "Yes, well. It's been a boring sixteen years." },
  ],
  goto: 'ch6_hub',
});

node({
  id: 'ch6_maddox_keep',
  chapter: 6,
  lines: [
    { who: 'maddox', text: 'You want me to sit here with it.' },
    { who: 'you', text: "I want it somewhere nobody is looking. They took the first one off a courier on a road at five in the morning. As far as Halo is concerned, this is finished and you are a sad old man they leaned on once." },
    { who: 'maddox', text: '...That is an unpleasantly accurate description and an extremely good hiding place.' },
    { who: 'desc', text: 'He puts the case back on the shelf and moves the row of index cards in front of it, and the whole thing disappears again.' },
    { who: 'maddox', text: 'Come back for it. Whatever else happens today — come back for it.' },
  ],
  goto: 'ch6_hub',
});

node({
  id: 'ch6_valefile',
  chapter: 6,
  lines: [
    { who: 'desc', text: 'Last night, on a line he had no business being on, Cormac Vale said something that has not stopped itching.' },
    { who: 'vale', text: '"I was on the other end of a relay once too, taking an order I did not like."' },
    { who: 'desc', text: 'Handlers say relay the way sailors say ship. It is not a figure of speech.' },
    { who: 'desc', text: 'Sable pulls the employment record from dispatch, which is a thing the relay service keeps on everyone who has ever held a call sign, because call signs outlive people.' },
    { who: 'sys', text: 'VALE, CORMAC · relay service · STATION M-2 · 11 yrs · separated [Eclipse +1 month]' },
    { who: 'sys', text: 'Subsequent: Halo Division, 15 yrs, current rank Captain' },
    { who: 'desc', text: 'Eleven years on a desk. Left the month after the sky went out, and walked straight into the organisation that benefited from it.' },
    { who: 'you', text: "He wasn't the voice on my tape." },
    { who: 'sable', text: 'No. Your tape has K-7 acknowledging. Somebody had to call K-7.' },
    { who: 'desc', text: 'M-2 to K-7. One handler to another, at three in the morning, passing an order down a chain that was chosen precisely because it was made of tired people in dead rooms who would do what they were told.' },
    { who: 'desc', text: 'And one of those two men spent the next sixteen years being promoted for it, and the other one died eleven years ago in a chair you now sit in.' },
  ],
  effects: { composure: -4 },
  goto: 'ch6_hub',
});

node({
  id: 'ch6_memorial',
  chapter: 6,
  lines: [
    { who: 'desc', text: 'It takes half an hour to find out what happens in Kestrel Bay tonight, because it is on a poster at every tram stop and has been for a month.' },
    { who: 'sys', text: 'THE SIXTEENTH ECLIPSE MEMORIAL · Ashgate Exchange · 23:00 · Eclipse Memorial Trust' },
    { who: 'desc', text: 'Once a year, at the Exchange, the Trust re-energises a section of the old grid frequencies for exactly one minute so the bell in the tower can be rung the way it was rung on the night — which is sentimental, and expensive, and the single most useful fact you have acquired all day.' },
    { who: 'you', text: 'They put the old frequencies back on air. For a minute. Once a year.' },
    { who: 'sable', text: 'For the bell.' },
    { who: 'you', text: 'Sable, for one minute a year every legacy receiver in this city is listening on a band that has been dead since the Eclipse.' },
    { who: 'desc', text: 'A pause on the line.' },
    { who: 'sable', text: "...And the chair of the Trust reads the numbers out." },
    { who: 'sys', text: 'Chair, Eclipse Memorial Trust: O. FERRANT' },
    { who: 'desc', text: 'The woman who signed the order stands up once a year and reads out the numbers of the people who took the blame for it, into a room that contains every one of them who is still alive, on the only night the old frequencies are live.' },
    { who: 'desc', text: 'It is the most arrogant thing you have ever heard of, and it is also, tonight, a room with a door you can walk through.' },
  ],
  goto: 'ch6_hub',
});

node({
  id: 'ch6_quiet',
  chapter: 6,
  branch: [
    { requires: { counts: { quiet: { min: 2 } } }, goto: 'ch6_quiet_b' },
  ],
  lines: [
    { who: 'desc', text: 'An hour in the back of a tram shelter on the Rill road with no line of sight to anything, which is the closest thing to a dead channel available in daylight.' },
    { who: 'desc', text: 'Handlers are good at this. Sitting still and listening is ninety per cent of the job; it is only strange doing it as the one being listened for.' },
    { who: 'sable', text: 'Anything?' },
    { who: 'you', text: 'Two Halo cars on the Rill road in forty minutes. Neither slowed.' },
    { who: 'sable', text: "Good. Stay there another twenty. You've been visible all morning and it accumulates." },
    { who: 'desc', text: 'It does accumulate. That is the thing nobody tells you about daylight: it is not one dangerous moment, it is a total.' },
  ],
  goto: 'ch6_hub',
});

node({
  id: 'ch6_quiet_b',
  chapter: 6,
  lines: [
    { who: 'desc', text: 'Another hour of nothing, and this time it is harder, because you have run out of things to notice and started on things to think about.' },
    { who: 'desc', text: 'Chiefly: that the man in your chair sixteen years ago also had a night, and a morning after it, and presumably an hour like this one somewhere.' },
    { who: 'desc', text: 'And that he went back in and worked the desk for eleven more years and then died in it, and nobody ever asked him a single question.' },
    { who: 'sable', text: "You've gone quiet even for you." },
    { who: 'you', text: "I'm trying to work out whether he was a coward." },
    { who: 'sable', text: 'And?' },
    { who: 'you', text: "I'm trying to work out whether it matters, given I'm the one sitting in it now." },
  ],
  effects: { composure: 4 },
  goto: 'ch6_hub',
});

node({
  id: 'ch6_wren',
  chapter: 6,
  branch: [
    { requires: { flags: { act1: 'burned' } }, goto: 'ch6_wren_cell' },
    { requires: { flags: { act1: 'broadcast' } }, goto: 'ch6_wren_running' },
    { goto: 'ch6_wren_free' },
  ],
  lines: [],
});

node({
  id: 'ch6_wren_cell',
  chapter: 6,
  effects: { loc: 'holding' },
  lines: [
    { who: 'desc', text: 'Ashgate holding has four cells and a duty desk, and a rule that a person on a transport charge may receive one visitor before the bail hearing.' },
    { who: 'desc', text: 'You have never been in a room with her. You have spent five hours inside her ear and you would not have recognised her on a tram.' },
    { who: 'desc', text: 'She is smaller than the voice. Everyone is.' },
    { who: 'wren', text: '...Say something.' },
    { who: 'you', text: 'Why?' },
    { who: 'wren', text: 'Because I have been sitting here for six hours trying to work out whether I would know the voice, and I need to know before I decide what I think of you.' },
    { who: 'you', text: "It's me, Wren. I'm sorry." },
    { who: 'desc', text: 'She closes her eyes.' },
    { who: 'wren', text: 'There it is.' },
    { who: 'wren', text: "You told me the road was clear." },
    { who: 'you', text: 'I did.' },
    { who: 'wren', text: 'Why.' },
  ],
  goto: 'ch6_cell_answer',
});

node({
  id: 'ch6_cell_answer',
  chapter: 6,
  choices: [
    {
      text: 'A man offered me a clean file and named my sister’s children, and I took it.',
      sub: 'All of it. No shaping.',
      effects: { time: -14, trust: 18, composure: -6, flags: { confessedDeal: true } },
      goto: 'ch6_cell_truth',
    },
    {
      text: 'Because I thought it was the version where you lived.',
      sub: 'True, and not the whole truth.',
      effects: { time: -10, trust: 4, composure: -4 },
      goto: 'ch6_cell_partial',
    },
    {
      text: 'I was wrong. That is the entire answer and I am not going to dress it up.',
      effects: { time: -8, trust: 9 },
      goto: 'ch6_cell_partial',
    },
  ],
});

node({
  id: 'ch6_cell_truth',
  chapter: 6,
  lines: [
    { who: 'desc', text: 'She listens to the whole thing without interrupting once, which is worse than shouting.' },
    { who: 'wren', text: 'Cormac Vale.' },
    { who: 'you', text: 'Cormac Vale.' },
    { who: 'wren', text: "Did he say the ward out loud, or just enough of it?" },
    { who: 'you', text: 'He said it once, up front, so we needn’t do the part where he implied it.' },
    { who: 'wren', text: "...Yeah. That's the trick. That's the whole trick, and it works, and you're not the first." },
    { who: 'desc', text: 'She puts her head back against the wall of a holding cell and laughs, once, with no humour in it at all.' },
    { who: 'wren', text: "Sixteen years I've been hunting a man who sat in a room and did what a voice on a relay told him. And when I finally find the desk, the man in it does exactly the same thing, on the same night, to me." },
    { who: 'you', text: 'Yes.' },
    { who: 'wren', text: "At least you said it out loud. He never did. That's — that is genuinely the only thing you've got, so hold onto it." },
  ],
  effects: { flags: { wrenKnowsDeal: true } },
  goto: 'ch6_cell_plan',
});

node({
  id: 'ch6_cell_partial',
  chapter: 6,
  lines: [
    { who: 'wren', text: "That's not an answer, it's a shape." },
    { who: 'desc', text: 'She is right and you both know it, and she lets it sit there for a while, because a woman in a cell has time.' },
    { who: 'wren', text: 'Fine. Keep it. I have got considerably bigger problems than your conscience.' },
  ],
  goto: 'ch6_cell_plan',
});

node({
  id: 'ch6_cell_plan',
  chapter: 6,
  lines: [
    { who: 'wren', text: 'Bail hearing is at four. Transport charge, so there is a figure, and the figure is nine thousand.' },
    { who: 'you', text: 'Nine thousand.' },
    { who: 'wren', text: 'Nine thousand. The same nine thousand. It is in my account and it is the exact amount and I want you to appreciate how funny that is.' },
    { who: 'desc', text: 'It is not funny. It is a man who read the ticket before he set the figure.' },
    { who: 'wren', text: "So I'm out at five, minus every credit I have, and I'll be at the Exchange tonight, because that is the only place left where any of this can go." },
    { who: 'wren', text: "Don't visit me again. Next time we're in a room, I want it to be that one." },
  ],
  effects: { flags: { wrenFree: true, wrenBailed: true }, trust: 4 },
  goto: 'ch6_hub',
});

node({
  id: 'ch6_wren_running',
  chapter: 6,
  effects: { loc: 'nest' },
  lines: [
    { who: 'desc', text: "Ilsa's nest, in daylight, is a collapsed exchange with a radio shack inside it and a woman asleep on a camp bed in the corner with her boots still on." },
    { who: 'ilsa', text: "She came in at seven. Went out for four hours like somebody put her down." },
    { who: 'ilsa', text: 'She got across the Belt on foot after transmitting the biggest thing this city has heard in sixteen years. I have known couriers I would not have bet on doing that.' },
    { who: 'desc', text: 'Wren wakes up the way people do when they have not properly slept — all at once, and badly.' },
    { who: 'wren', text: 'Halcyon.' },
    { who: 'you', text: 'It went out.' },
    { who: 'wren', text: "It went out and by nine they were calling it a prank." },
    { who: 'desc', text: 'She says it without much heat. She has clearly been round this several times already, lying on a camp bed in a collapsed building.' },
    { who: 'wren', text: "It's numbers, isn't it. I put sixteen years of numbers on the air at five in the morning and nobody in this city has the first idea what they mean." },
    { who: 'you', text: 'They have no context. Data with nobody to interpret it is just a panic — which is, and I want to be clear about how much I hate this, the exact thing Vale said to me.' },
    { who: 'wren', text: "Then we give it context. Tonight. With people standing next to it." },
  ],
  effects: { flags: { wrenFree: true }, trust: 6, composure: 5 },
  goto: 'ch6_hub',
});

node({
  id: 'ch6_wren_free',
  chapter: 6,
  effects: { loc: 'nest' },
  lines: [
    { who: 'desc', text: "You find her at Ilsa's, which you did not arrange and neither did she. There is nowhere else in this city for a courier who has stopped being able to work." },
    { who: 'wren', text: "I keep checking the account." },
    { who: 'you', text: 'The nine thousand.' },
    { who: 'wren', text: "It's still there. I keep opening it to check it's still there, and every time it is, and every time I feel worse." },
    { who: 'desc', text: 'She is sitting on an upturned crate in a collapsed exchange with a mug of something Ilsa made, and she has not taken her coat off.' },
    { who: 'wren', text: 'Sixteen years. And what I actually did, when it came to it, was complete a delivery.' },
    { who: 'ilsa', text: "You survived a night that four off-books Halo bodies were built to end. Don't let her tell you otherwise, handler, she's been at it since eight." },
    { who: 'wren', text: 'Ilsa —' },
    { who: 'ilsa', text: "I was on air the night it happened. I have been carrying it for sixteen years and I did considerably less than you did last night. Drink the tea." },
  ],
  effects: { flags: { wrenFree: true }, trust: 4, composure: 4 },
  goto: 'ch6_hub',
});

// ---- Interrupts -------------------------------------------------------------

node({
  id: 'ch6_vale',
  chapter: 6,
  effects: { flags: { vale2: true }, exposure: 6 },
  linesOnce: true,
  lines: [
    { who: 'alert', text: 'Your own handset. A number with no name on it.' },
    { who: 'vale', text: "You've been out in the light all morning. It doesn't suit you." },
    { who: 'desc', text: 'He does not sound triumphant. He sounds like a man doing a job on a Tuesday.' },
    { who: 'vale', text: "I know where you've been, roughly. I know who you've talked to, approximately. And I want you to understand that the gap between roughly and exactly is a decision I make at about four o'clock." },
    { who: 'vale', text: "So here is the last offer, and it is a better one than last night's, because last night I only needed a courier to walk down a road." },
    { who: 'vale', text: 'Stop. Today. Go home, sleep, come back on shift Thursday. Nobody is charged, nobody is fired, and the whole thing stays what it has been for sixteen years: an equipment fault.' },
  ],
  choices: [
    {
      text: 'You worked a relay desk for eleven years. M-2. You called K-7 that night.',
      sub: 'Say the thing you found out.',
      requires: { leads: ['L_VALE_WAS_RELAY'] },
      lockedText: 'You have not looked into him. (Needs: Vale sat in a chair like yours)',
      effects: { time: -10, exposure: 10, flags: { confrontedVale: true } },
      goto: 'ch6_vale_m2',
    },
    {
      text: 'What did they give you for it?',
      requires: { flags: { askedVale2: false } },
      effects: { time: -8, flags: { askedVale2: true } },
      goto: 'ch6_vale_price',
    },
    {
      text: 'No. And you can stop calling this desk.',
      effects: { time: -4, exposure: 4, flags: { refused2: true }, composure: -3 },
      goto: 'ch6_vale_no',
    },
    {
      text: 'Agree. Go home. Let it be an equipment fault.',
      sub: 'It is not too late to have had an ordinary life.',
      effects: { time: -6, flags: { tookDeal2: true }, exposure: -25, trust: -30 },
      goto: 'ch6_vale_yes',
    },
  ],
});

node({
  id: 'ch6_vale_m2',
  chapter: 6,
  lines: [
    { who: 'desc', text: 'The line does not go dead. It does something more interesting: it stays open, and he does not say anything for four full seconds.' },
    { who: 'vale', text: 'M-2.' },
    { who: 'you', text: 'Eleven years. You left the month after. You have spent sixteen years hunting a tape with your own voice on one end of it.' },
    { who: 'vale', text: "My voice isn't on your tape, handler. Check it again. I called the station. The station acknowledged. Those are different acts and the difference is the only thing I have." },
    { who: 'you', text: 'That is the thinnest thing I have ever heard a grown man say.' },
    { who: 'vale', text: "Yes. I've had sixteen years to find a thinner one and that's the best available." },
    { who: 'desc', text: 'And for one moment, on a handset, in daylight, he sounds exactly like what he is: a relay man who did what a voice told him and has been being promoted for it ever since.' },
    { who: 'vale', text: "Go home. I am asking you as somebody who sat in one of those rooms. It does not get better and it does not get worse. It just stays." },
  ],
  effects: { leads: ['L_VALE_WAS_RELAY'] },
  goto: 'ch6_hub',
});

node({
  id: 'ch6_vale_price',
  chapter: 6,
  lines: [
    { who: 'vale', text: 'A job. A rank. A pension I will draw in four years.' },
    { who: 'you', text: 'For the sky.' },
    { who: 'vale', text: "For passing a message. Which is what the job was, handler — it is what your job is. You don't author anything. You pass it on." },
    { who: 'vale', text: "That's the arrangement. You have been perfectly content with it for six years and you would have gone on being content with it if a courier hadn't paid to sit in front of your desk." },
    { who: 'desc', text: 'It is a horrible argument and it is not entirely wrong, and he knows both of those things.' },
  ],
  goto: 'ch6_vale',
});

node({
  id: 'ch6_vale_no',
  chapter: 6,
  lines: [
    { who: 'you', text: 'No.' },
    { who: 'vale', text: 'Then at four o’clock roughly becomes exactly, and you will find that daylight is not your medium.' },
    { who: 'desc', text: 'The line closes. You stand in a street in the grey with a handset in your hand and the clear sense of having just spent something you cannot get back.' },
  ],
  goto: 'ch6_hub',
});

node({
  id: 'ch6_vale_yes',
  chapter: 6,
  lines: [
    { who: 'you', text: 'All right.' },
    { who: 'vale', text: 'Good. Go home.' },
    { who: 'desc', text: 'And you do. You go home, and you take your coat off, and you sit down in a flat with two rooms and no knock on the door.' },
    { who: 'desc', text: 'For about forty minutes it is the most relief you have ever felt.' },
    { who: 'desc', text: 'Then the afternoon gets on, and the light starts going, and somewhere across the city a woman who paid for a year of night shifts to find this desk is getting ready to go to a memorial on her own.' },
  ],
  goto: 'ch6_hub',
});

node({
  id: 'ch6_followed',
  chapter: 6,
  effects: { flags: { followed: true }, exposure: 5, composure: -5 },
  lines: [
    { who: 'desc', text: 'You notice it on the Rill road, which is the only stretch you have walked twice.' },
    { who: 'desc', text: 'A grey coat, forty metres back, who stopped when you stopped and did not look in the window he was standing in front of.' },
    { who: 'sable', text: 'How long?' },
    { who: 'you', text: 'Since the tram at least. Possibly since this morning.' },
    { who: 'sable', text: "Then they've got your route, your stops, and everyone you've been seen with." },
    { who: 'desc', text: 'Which is the part that matters. Not you — you were always on the list. The people who were not on any list until you walked up to their front doors in the middle of the day.' },
  ],
  choices: [
    {
      text: 'Lose him. Properly. Whatever it costs.',
      sub: 'The Belt swallows people. It is just a long way round.',
      effects: { time: -50, exposure: -20, composure: -4 },
      goto: 'ch6_lose',
    },
    {
      text: 'Let him follow. Give him a boring afternoon and nothing to write down.',
      sub: 'Cheap. Does nothing about what he already has.',
      effects: { time: -12, exposure: 3 },
      goto: 'ch6_hub',
    },
    {
      text: 'Walk up to him.',
      sub: 'Handlers do not do this. That is rather the point.',
      effects: { time: -20, exposure: 12, composure: -5, flags: { facedTail: true } },
      goto: 'ch6_face',
    },
  ],
});

node({
  id: 'ch6_lose',
  chapter: 6,
  lines: [
    { who: 'desc', text: 'The Belt has no grid, no cameras, and twelve blocks of buildings with two ways into each of them. It takes fifty minutes and it works, because it always works — it is the only thing the Belt is actually good for.' },
    { who: 'desc', text: 'You come out on the far side with a coat full of dust and nobody behind you.' },
    { who: 'sable', text: 'Clear?' },
    { who: 'you', text: 'Clear. And it cost me nearly an hour of the only daylight there is.' },
    { who: 'sable', text: "That's the trade. That was always the trade." },
  ],
  goto: 'ch6_hub',
});

node({
  id: 'ch6_face',
  chapter: 6,
  lines: [
    { who: 'desc', text: 'He is about twenty-six and he does not have a plan for this, which is how you know he is not one of the four from the terrace.' },
    { who: 'you', text: 'You have been behind me since the tram.' },
    { who: 'watcher', text: '"...I\'m going to have to report this conversation."' },
    { who: 'you', text: 'Yes. Report it accurately. My name is on the roster, I am the handler who was in the chair, and I have spent today talking to three people who were blamed for the Eclipse.' },
    { who: 'watcher', text: '"I know who you are."' },
    { who: 'you', text: 'Then you know I have not run, hidden, or destroyed anything, and that everything I have done today I have done in the street in the middle of the afternoon.' },
    { who: 'desc', text: 'The young man in the grey coat looks at you for a moment with an expression you did not expect, which is something quite close to envy.' },
    { who: 'watcher', text: '"They said you\'d be difficult."' },
    { who: 'you', text: 'I am being extremely easy. That is what is difficult about it.' },
  ],
  effects: { trust: 2 },
  goto: 'ch6_hub',
});

node({
  id: 'ch6_raid',
  chapter: 6,
  effects: { flags: { raided: true }, composure: -12, time: -30, exposure: -30 },
  lines: [
    { who: 'alert', text: 'Exposure critical — they have exactly where you are' },
    { who: 'desc', text: 'It is not dramatic. That is the thing about being taken in daylight: there is no chase, because there is nowhere in a city at two in the afternoon to chase anybody to.' },
    { who: 'desc', text: 'Two cars, one street, and a very polite man with a clipboard who wants to ask about your movements since 06:40.' },
    { who: 'desc', text: 'They hold you for half an hour in the back of a car and let you go, because you have not actually committed an offence, and because half an hour was all the point ever was.' },
    { who: 'vale', text: '"Roughly is now exactly. Enjoy what\'s left of the afternoon."' },
    { who: 'desc', text: 'They have your route. Your stops. Ammi Sarran\'s front door, if you went to it. A bar on the Rill. An archivist’s flat.' },
    { who: 'desc', text: 'Everyone you visited today is now a name on a page in a building, which is the precise thing you spent the whole of last night trying to prevent happening to one courier.' },
  ],
  goto: 'ch6_hub',
});

// ---- Chapter Seven: Ferrant -------------------------------------------------

node({
  id: 'ch7_open',
  chapter: 7,
  effects: { chapter: 7, loc: 'exchange' },
  lines: [
    { who: 'sys', text: 'Chapter Seven — The Chair of the Trust' },
    { who: 'desc', text: 'At about half past six the light starts going, the way it does here, all at once and from the bottom up.' },
    { who: 'desc', text: 'And a car pulls alongside you — not a Halo car, a good one — and a woman in the back winds the window down and says your call sign, correctly, with the stress on the right syllable, the way only somebody from the service ever gets it.' },
    { who: 'ferrant', text: 'Halcyon. Get in, it’s about to rain and I would like forty minutes of your time.' },
    { who: 'desc', text: 'Odile Ferrant is sixty-eight, and reads out the numbers of the dead once a year in a nice voice, and has a signature on a burn authorisation from sixteen years ago.' },
  ],
  choices: [
    {
      text: 'Get in.',
      sub: 'She is the only person left who can tell you anything.',
      effects: { time: -40, exposure: 10, flags: { metFerrant: true } },
      goto: 'ch7_car',
    },
    {
      text: 'Walk away. Nothing she says can be used and everything she hears can.',
      sub: 'Safe. Leaves the argument unanswered.',
      effects: { time: -10, exposure: -4, flags: { refusedFerrant: true } },
      goto: 'ch7_walk',
    },
  ],
});

node({
  id: 'ch7_walk',
  chapter: 7,
  lines: [
    { who: 'desc', text: 'You keep walking. The car keeps pace for about fifteen metres, which is exactly long enough to be a sentence, and then does not.' },
    { who: 'ferrant', text: '"I’ll be at the Exchange at eleven. So will you. We’ll do it there instead."' },
    { who: 'desc', text: 'The window goes up.' },
    { who: 'desc', text: 'It is the correct decision and it costs you the only chance you will get to hear the argument in private, where you could have lost it without anybody watching.' },
  ],
  goto: 'ch8_open',
});

node({
  id: 'ch7_car',
  chapter: 7,
  linesOnce: true,
  lines: [
    { who: 'desc', text: 'The car is warm and smells of nothing. She does not offer you anything and she does not start with the weather.' },
    { who: 'ferrant', text: 'You have been to see Reyes, and to the Verge, and to an archivist in two rooms. You have been extremely busy and extremely visible and I would like to save you the evening.' },
    { who: 'you', text: 'You signed it.' },
    { who: 'ferrant', text: 'I signed it.' },
    { who: 'desc', text: 'No pause, no hedge, no lawyer. It is so far from what you expected that it takes the next question out of your mouth entirely.' },
    { who: 'ferrant', text: "I have never once denied that, because nobody has ever once asked me. Sixteen years, and you are the first person to put it to me in a sentence." },
  ],
  choices: [
    {
      text: 'Why.',
      requires: { flags: { askedWhyBurn: false } },
      effects: { time: -12, count: { car: 1 }, flags: { askedWhyBurn: true }, leads: ['L_FERRANT_SIGNED'] },
      goto: 'ch7_why',
    },
    {
      text: 'Operator Seven refused you twice.',
      requires: { flags: { askedSeven: false } },
      effects: { time: -10, count: { car: 1 }, flags: { askedSeven: true }, composure: -4 },
      goto: 'ch7_seven',
    },
    {
      text: 'Who was the handler at K-7? I want his name.',
      sub: 'The one thing nobody has been able to give you.',
      requires: { flags: { askedHandler: false } },
      effects: { time: -10, count: { car: 1 }, flags: { askedHandler: true }, leads: ['L_HALCYON_DESK'] },
      goto: 'ch7_handler',
    },
    {
      text: 'Say what you brought me here to say.',
      requires: { counts: { car: { min: 2 } } },
      lockedText: 'She is the only person alive who can answer any of this and you are cutting her off. (Needs: 2 questions)',
      effects: { time: -6 },
      goto: 'ch7_offer',
    },
  ],
});

node({
  id: 'ch7_why',
  chapter: 7,
  lines: [
    { who: 'ferrant', text: 'Because the array was about to tell the truth about us, and I decided the city could survive the dark better than it could survive the truth.' },
    { who: 'you', text: 'What truth.' },
    { who: 'ferrant', text: 'That the grid had been failing for eleven years and the Authority had been signing capacity reports that said otherwise. Mine among them. Many of mine.' },
    { who: 'ferrant', text: 'The satellite tier logged actual load. Every hour, for a decade. It was the only honest instrument in the system and we had forgotten it was there until somebody scheduled a review.' },
    { who: 'desc', text: 'She says this looking out of the window at a city she put the lights out on.' },
    { who: 'ferrant', text: "So: burn the array, lose the sky, and the eleven years go with it. Or let it run, and the Authority collapses in a month, and the grid it was holding together collapses with it — not gradually, not in a controlled way." },
    { who: 'you', text: 'That is a very tidy account of setting fire to the evidence.' },
    { who: 'ferrant', text: "Yes. That's what makes it a good one. The tidy account and the true one are the same sentence, and I have never been able to get anyone to see the difference, including myself." },
  ],
  goto: 'ch7_car',
});

node({
  id: 'ch7_seven',
  chapter: 7,
  lines: [
    { who: 'desc', text: 'It is the first thing all afternoon that lands on her.' },
    { who: 'ferrant', text: 'Twice. Yes.' },
    { who: 'ferrant', text: '"Array burn is not survivable for the satellite tier. I am not confirming this." And then, when we put it to her again — the same sentence. Word for word. She had worked out that repeating it exactly was harder to minute as a discussion.' },
    { who: 'you', text: 'She was right.' },
    { who: 'ferrant', text: 'She was the only person in the entire chain who behaved correctly, and it is the reason I have read her number out loud sixteen times.' },
    { who: 'you', text: 'You think that is penance.' },
    { who: 'ferrant', text: "I think it is the only thing I do all year that costs me anything." },
    { who: 'desc', text: 'And you understand, finally, why she goes: not to gloat, and not to hide. She goes because it is the one hour a year she has to stand in a room and say the numbers of people she chose.' },
    { who: 'desc', text: 'It does not make her better. It makes her worse, and far more dangerous, because a person who has already priced the guilt cannot be threatened with it.' },
  ],
  effects: { leads: ['L_OPERATOR_SEVEN'] },
  goto: 'ch7_car',
});

node({
  id: 'ch7_handler',
  chapter: 7,
  lines: [
    { who: 'ferrant', text: 'You want his name.' },
    { who: 'you', text: 'I have been sitting in his chair for six years. I have heard nine words of him. Nobody will tell me his name.' },
    { who: 'ferrant', text: "Nobody will tell you because nobody wrote it down. That was the point of using a relay — a call sign acknowledges, and a call sign is a chair." },
    { who: 'desc', text: 'She looks at you properly for the first time.' },
    { who: 'ferrant', text: 'Aurel Stanik. He was forty-four. He had been on that desk eleven years and he had a leak over switch four he kept complaining about.' },
    { who: 'desc', text: 'The bucket. You change the bucket on Thursdays.' },
    { who: 'ferrant', text: "He did what he was told at three in the morning by a voice from another station, and then he worked eleven more years in that room, and he died in it, and no one ever asked him a single question about it — including me, and I knew exactly where to find him." },
    { who: 'ferrant', text: "That is what the chain is for, handler. Not to make people do things. To make sure that afterwards there is nobody it makes sense to ask." },
  ],
  effects: { leads: ['L_HALCYON_DESK', 'L_BURN_LOG'], composure: -6, flags: { knowsStanik: true } },
  goto: 'ch7_car',
});

node({
  id: 'ch7_offer',
  chapter: 7,
  lines: [
    { who: 'ferrant', text: 'Here is what I brought you here to say.' },
    { who: 'ferrant', text: 'The transport charge against your courier goes away this afternoon and her nine thousand stays in her account. Your file becomes unremarkable. The relay reopens on Thursday and you sit in it.' },
    { who: 'ferrant', text: 'And there is a seat on the Trust that is mine to give, and I would like you to have it, and I am aware of exactly how that sounds.' },
    { who: 'you', text: 'Why would you put me on it?' },
    { who: 'ferrant', text: 'Because in four years I will be dead or senile and somebody will have to read the numbers out, and it should be somebody it costs.' },
    { who: 'desc', text: 'The rain starts. The car is warm and smells of nothing.' },
    { who: 'ferrant', text: 'And against that: if you put it on the air tonight, you take eight settlements apart. Sarran loses a house her daughter grew up in. Reyes loses the only income he has. Three families of dead operators find out, publicly, in one evening, that it was deliberate.' },
    { who: 'ferrant', text: "You will have told the truth, and every single person it was about will be worse off, and you will be the one who chose that for them, at night, without asking any of them." },
    { who: 'desc', text: 'Which is, you notice, precisely the accusation you have spent a day and a night aiming at her.' },
  ],
  effects: { flags: { heardOffer: true } },
  goto: 'ch7_answer',
});

node({
  id: 'ch7_answer',
  chapter: 7,
  choices: [
    {
      text: 'Then I ask them. Tonight. In the room. Before anything goes out.',
      sub: 'Answer the accusation instead of swallowing it.',
      effects: { time: -8, flags: { willAsk: true }, trust: 8 },
      goto: 'ch7_ask',
    },
    {
      text: 'Sarran and Reyes are grown adults who were never once asked. You are still not asking them — you are using them.',
      effects: { time: -6, flags: { refusedFerrantOffer: true }, composure: -4 },
      goto: 'ch7_refuse',
    },
    {
      text: 'Take the seat.',
      sub: 'The charge drops. The lights stay off. You read the numbers in four years.',
      effects: { time: -6, flags: { tookSeat: true }, exposure: -40, trust: -20 },
      goto: 'ch7_seat',
    },
  ],
});

node({
  id: 'ch7_ask',
  chapter: 7,
  lines: [
    { who: 'you', text: 'You are right that it is not my choice to make for them. So I am not going to make it for them.' },
    { who: 'you', text: 'They will be in that room tonight. All of them who are left. I am going to put it to them out loud, in front of you, and whatever they say is what happens.' },
    { who: 'desc', text: 'Ferrant considers this for a long moment.' },
    { who: 'ferrant', text: "They'll say no." },
    { who: 'you', text: 'Then they say no, and it stays off the air, and I will have done the thing you did not do in sixteen years, which is let the people it happened to have an opinion about it.' },
    { who: 'ferrant', text: '...' },
    { who: 'ferrant', text: 'Stop the car.' },
    { who: 'desc', text: 'The car stops. It is raining properly now.' },
    { who: 'ferrant', text: "Eleven o'clock. Ashgate Exchange. I will read the numbers and then I will sit down, and the floor will be yours, and I will not have you removed." },
    { who: 'you', text: 'Why not?' },
    { who: 'ferrant', text: 'Because I have wanted somebody to ask them for sixteen years and I have never once been brave enough to be the one who does it.' },
  ],
  effects: { flags: { floorGranted: true }, trust: 6 },
  goto: 'ch8_open',
});

node({
  id: 'ch7_refuse',
  chapter: 7,
  lines: [
    { who: 'you', text: 'You have had sixteen years to ask Ammi Sarran what she wanted and you have spent all of them reading her number out instead.' },
    { who: 'ferrant', text: 'That is fair.' },
    { who: 'you', text: "It isn't fair, it's just true. Stop the car." },
    { who: 'desc', text: 'The car stops. It is raining properly now, and you are a considerable distance from anywhere you wanted to be, which you suspect was always part of the offer.' },
    { who: 'ferrant', text: "Eleven o'clock, handler. Whatever you're going to do, you'll be doing it in a room with me in it." },
  ],
  effects: { time: -18 },
  goto: 'ch8_open',
});

node({
  id: 'ch7_seat',
  chapter: 7,
  lines: [
    { who: 'desc', text: 'You say yes in a warm car in the rain, and the thing that frightens you most about it afterwards is how ordinary it felt while you were saying it.' },
    { who: 'ferrant', text: 'Good. That is the right answer and you will spend some years finding out why.' },
    { who: 'desc', text: 'By five the transport charge against Wren is withdrawn. By six your file is unremarkable. By seven the relay is scheduled to reopen Thursday.' },
    { who: 'desc', text: 'Everything she offered, delivered, inside two hours, which is how you learn exactly how small the thing you were fighting actually was to the people running it.' },
    { who: 'wren', text: "They've dropped it." },
    { who: 'wren', text: 'Halcyon, they have dropped the charge and put the money back and I have not done anything.' },
    { who: 'wren', text: '...Have you done something?' },
  ],
  effects: { flags: { tookSeat: true } },
  goto: 'ch8_open',
});

// ---- Chapter Eight: Dusk ----------------------------------------------------

node({
  id: 'ch8_open',
  chapter: 8,
  effects: { chapter: 8, composure: 12, setWindow: 'dusk' },
  linesOnce: true,
  lines: [
    { who: 'sys', text: 'Chapter Eight — Dusk' },
    { who: 'desc', text: 'The light goes at about four and the city switches over, and for the first time in a day and a night you are standing in your own medium again.' },
    { who: 'desc', text: 'Seven hours until the Exchange. Everything you have is what you have.' },
    { who: 'sable', text: 'So say it out loud. What are we doing tonight, and with what.' },
  ],
  choices: [
    {
      text: 'The bell. One minute of live old-grid frequency, and we put the drum on it.',
      sub: 'Reach: the whole city. Requires something to play and a way to reach the feed.',
      requires: { leads: ['L_MEMORIAL'] },
      lockedText: 'You never found out what happens in this city tonight. (Needs: The memorial is tonight)',
      effects: { flags: { plan3: 'bell' } },
      goto: 'ch8_bell',
    },
    {
      text: 'The floor. Put it to the people it happened to, in front of Ferrant, and let them decide.',
      sub: 'Reach: one room. Requires people willing to stand up in it.',
      requires: { anyLead: ['L_NINE_LIST'], flags: { } },
      lockedText: 'You do not know who is left to stand up. (Needs: The Nine)',
      effects: { flags: { plan3: 'floor' } },
      goto: 'ch8_floor',
    },
    {
      text: 'The desk. Back into K-7 past the seal, and out on the legacy stack at grid-up.',
      sub: 'Reach: the whole city. Requires getting into a sealed building.',
      requires: { leads: ['L_BROADCAST_KEY'] },
      lockedText: 'You never asked what your own relay could transmit. (Needs: The relay can still shout)',
      effects: { flags: { plan3: 'desk' } },
      goto: 'ch8_desk',
    },
    {
      text: 'Nothing. It stays off the air and everybody keeps what they have.',
      sub: 'Including you.',
      effects: { flags: { plan3: 'stand_down' } },
      goto: 'ch8_down',
    },
  ],
});

node({
  id: 'ch8_bell',
  chapter: 8,
  lines: [
    { who: 'you', text: 'For one minute at eleven, the Trust puts the old grid frequencies back on air for the bell. Every legacy receiver in Kestrel Bay syncs to it.' },
    { who: 'sable', text: 'Including every handset in the Belt, every scav board, every dead kitchen radio nobody threw out.' },
    { who: 'you', text: 'It is the only transmitter in this city that reaches further than K-7 ever could, and they switch it on themselves, once a year, for sentiment.' },
    { who: 'sable', text: 'And the feed head?' },
    { who: 'you', text: 'In the Exchange tower, forty feet above a room containing everybody who was blamed for the Eclipse and the woman who signed the order.' },
    { who: 'desc', text: 'A pause on the dispatch line.' },
    { who: 'sable', text: "You understand that if this works, it works once, and every single person in that room watches you do it." },
  ],
  goto: 'ch8_kit',
});

node({
  id: 'ch8_floor',
  chapter: 8,
  lines: [
    { who: 'you', text: 'Reyes was eight feet from Seven when she refused. Sarran will not deny it if somebody else says it first. Maddox has the drum and a settlement he never signed.' },
    { who: 'sable', text: 'Three people, in one room, with the Trust in front of them.' },
    { who: 'you', text: 'Three people who have spent sixteen years being numbers, saying it out loud as people, in the one hour a year anybody is listening.' },
    { who: 'sable', text: "It reaches one room, Halcyon. Two hundred people, half of them Trust." },
    { who: 'you', text: 'It reaches one room, and it cannot be called fragmentary, and nobody can put it in an evidence locker.' },
    { who: 'desc', text: 'Which is either the most or the least this could possibly achieve, and you genuinely cannot tell which.' },
  ],
  goto: 'ch8_kit',
});

node({
  id: 'ch8_desk',
  chapter: 8,
  lines: [
    { who: 'you', text: 'K-7 still has the legacy stack, and at grid-up every receiver in the city syncs to the relay band for ninety seconds.' },
    { who: 'sable', text: 'K-7 has Halo tape across the stairwell and a man on the door.' },
    { who: 'you', text: 'K-7 has a cable trench, a roof access, and a switch room nobody has opened since before either of us was hired, and I have sat in that building for six years doing nothing but learning what is in it.' },
    { who: 'sable', text: '...That is the first genuinely frightening thing you have said all day.' },
    { who: 'desc', text: 'It is also the version where you end the night inside the building with your name on the roster, which has a certain symmetry that you decide not to examine.' },
  ],
  goto: 'ch8_kit',
});

node({
  id: 'ch8_down',
  chapter: 8,
  lines: [
    { who: 'sable', text: 'Say it properly.' },
    { who: 'you', text: 'It stays off the air. Sarran keeps the house. Reyes keeps the income. Three families do not find out in one evening that it was deliberate.' },
    { who: 'sable', text: 'And the woman who signed it reads the numbers out again at eleven.' },
    { who: 'you', text: 'Yes.' },
    { who: 'desc', text: 'Sable does not argue. That is somehow much worse than if she had.' },
    { who: 'sable', text: "All right. It's a real answer. It's the one most people pick and almost nobody says out loud." },
    { who: 'sable', text: 'Go to the memorial anyway. You should at least be in the room while you do it.' },
  ],
  goto: 'ch8_approach',
});

node({
  id: 'ch8_kit',
  chapter: 8,
  linesOnce: true,
  lines: [
    { who: 'desc', text: 'Six hours to arrange whatever you can arrange, and the arranging is the part nobody writes songs about.' },
  ],
  choices: [
    {
      text: 'Get the second drum from Maddox.',
      sub: 'You left it on his shelf behind a row of index cards.',
      requires: { flags: { copyWithMaddox: true, gotCopy: false } },
      effects: { time: -60, exposure: 8, count: { prep: 1 }, flags: { gotCopy: true, haveCopy: true } },
      goto: 'ch8_fetch',
    },
    {
      text: 'Make sure Reyes is sober and in the room.',
      requires: { flags: { rookCommitted: true, rookReady: false } },
      effects: { time: -54, count: { prep: 1 }, flags: { rookReady: true }, trust: 3 },
      goto: 'ch8_rook_ready',
    },
    {
      text: 'Send word to Sarran that somebody will say it first.',
      requires: { flags: { ammiCommitted: true, ammiReady: false } },
      effects: { time: -40, exposure: 5, count: { prep: 1 }, flags: { ammiReady: true } },
      goto: 'ch8_ammi_ready',
    },
    {
      text: 'Brief Wren. All of it, in order, with nothing left out.',
      requires: { flags: { briefedWren: false } },
      effects: { time: -47, count: { prep: 1 }, flags: { briefedWren: true }, trust: 10, composure: 8 },
      goto: 'ch8_brief',
    },
    {
      text: 'Go quiet until eleven.',
      sub: 'Arrive with less on you.',
      effects: { time: -60, exposure: -15, composure: 12 },
      silent: true,
      goto: 'ch8_kit',
    },
    {
      text: "It's eleven. Go.",
      requires: { counts: { prep: { min: 1 } } },
      lockedText: 'You have six hours and nothing arranged. (Needs: something prepared)',
      silent: true,
      goto: 'ch8_approach',
    },
  ],
});

node({
  id: 'ch8_fetch',
  chapter: 8,
  lines: [
    { who: 'desc', text: 'Two rooms, index cards, and a sixty-one-year-old man who has spent the entire day sitting with a drum behind a row of cards, listening to the stairs.' },
    { who: 'maddox', text: 'You came back.' },
    { who: 'you', text: 'I said I would.' },
    { who: 'maddox', text: 'People say that.' },
    { who: 'desc', text: 'He hands it over with both hands, the way you hand over something you have been holding too long, and then does not let go of it for a second longer than he means to.' },
    { who: 'maddox', text: "Sixteen years I have known where a copy of that was. Do you know what the worst part of it is?" },
    { who: 'you', text: 'Tell me.' },
    { who: 'maddox', text: 'That it was never hard. It sat on a shelf and all anybody ever had to do was ask an archivist a direct question, and in sixteen years not one person did.' },
  ],
  goto: 'ch8_kit',
});

node({
  id: 'ch8_rook_ready',
  chapter: 8,
  lines: [
    { who: 'desc', text: 'Getting Teodor Reyes sober by eleven takes four hours, two of them unpleasant, and most of the difficulty is not the drink.' },
    { who: 'rook', text: "I've stood at the back of fourteen of these." },
    { who: 'you', text: 'I know.' },
    { who: 'rook', text: "The one year I said anything, two very polite men walked me to a car, and I have thought about that car every February since." },
    { who: 'desc', text: 'He is wearing a jacket that has been pressed. Somebody pressed a jacket for this.' },
    { who: 'rook', text: 'Operator Four. You say it out loud and I come up the aisle.' },
    { who: 'you', text: 'Operator Four.' },
    { who: 'rook', text: "...Say it in the room. I'd like the first time to be in the room." },
  ],
  goto: 'ch8_kit',
});

node({
  id: 'ch8_ammi_ready',
  chapter: 8,
  lines: [
    { who: 'desc', text: 'You do not go back to the Verge. You send a dispatch slip, by courier, because Sable knows every courier in this city and one of them owes her.' },
    { who: 'desc', text: 'It says nine words, which is a number you chose on purpose.' },
    { who: 'sys', text: '"Somebody will say it first tonight. Four rows from the front."' },
    { who: 'desc', text: 'There is no reply, and there was never going to be one, because a reply is a thing a settlement can be shown.' },
    { who: 'sable', text: 'She might not come.' },
    { who: 'you', text: 'She comes every year. She told me so twice, which is how people tell you something that matters.' },
  ],
  goto: 'ch8_kit',
});

node({
  id: 'ch8_brief',
  chapter: 8,
  lines: [
    { who: 'desc', text: 'It takes thirty-five minutes to tell Wren everything, in order, with nothing left out, and it is the single hardest thing you do all day.' },
    { who: 'desc', text: 'Ferrant signed it. The array logged eleven years of falsified capacity. Aurel Stanik was forty-four and had a leak over switch four. Vale called from M-2. Sable took her money for a year without telling her what the desk was.' },
    { who: 'desc', text: 'You do not leave out the parts that make you look bad. There is no version of tonight that survives you leaving those out.' },
    { who: 'wren', text: 'Aurel Stanik.' },
    { who: 'you', text: 'Aurel Stanik.' },
    { who: 'wren', text: "A year. A year of night shifts, and he's been dead for eleven of them, and he had a bucket." },
    { who: 'desc', text: 'She is quiet for a while.' },
    { who: 'wren', text: "I wanted him to be somebody it was worth hating. That was the whole plan, really. I never had a second half to it." },
    { who: 'you', text: 'There is a second half. It is in about four hours and it is in a room with two hundred people in it.' },
    { who: 'wren', text: "...Right. Yes. All right." },
    { who: 'wren', text: "Thank you for telling me the Sable part. You didn't have to and I'd have found out and it would have been the end of us." },
  ],
  effects: { flags: { fullTruth: true } },
  goto: 'ch8_kit',
});

// ============================================================================
// ACT THREE — THE SECOND NIGHT
// ============================================================================

node({
  id: 'ch9_open',
  chapter: 9,
  effects: { openAct: 3, chapter: 9, loc: 'exchange', signal: 'clear', composure: 10 },
  lines: [
    { who: 'sys', text: 'ACT THREE — THE SECOND NIGHT' },
    { who: 'sys', text: 'Ashgate Exchange · 22:40 · the bell at 23:00' },
    { who: 'desc', text: 'The Ashgate Exchange was the telephone heart of this city for ninety years and is now a hall with a tower on it that gets used twice a year.' },
    { who: 'desc', text: 'Tonight there are two hundred people in it, a bell in the tower nobody has rung since last February, and a section of old grid frequency that will be live for exactly sixty seconds at eleven o’clock.' },
    { who: 'desc', text: 'It is raining. Everyone is very well dressed. There is a table with drinks on it.' },
  ],
  branch: [
    { requires: { flags: { plan3: 'desk' } }, goto: 'ch9_relay' },
    { requires: { flags: { plan3: 'stand_down' } }, goto: 'ch10_open' },
  ],
  goto: 'ch9_entry',
});

node({
  id: 'ch9_entry',
  chapter: 9,
  lines: [
    { who: 'wren', text: "I'm at the east door. There's a list." },
    { who: 'you', text: 'Of course there is a list.' },
    { who: 'wren', text: "There are also two men on it who were on a terrace in Ferrite Row the night before last, and I would recognise the shorter one in my sleep." },
  ],
  choices: [
    {
      text: 'Walk in the front. Ferrant said the floor would be mine.',
      sub: 'Only worth anything if she meant it.',
      requires: { flags: { floorGranted: true } },
      lockedText: 'Nobody in that building has given you permission to be in it. (Needs: Ferrant’s word)',
      effects: { time: -10, exposure: 5 },
      goto: 'ch9_front',
    },
    {
      text: 'The service tunnel. Every exchange in this city has one.',
      sub: 'Slow, filthy, and you know exactly where it comes out.',
      effects: { time: -40, exposure: -5, composure: -4 },
      goto: 'ch9_tunnel',
    },
    {
      text: 'Go in as staff. There is a table with drinks on it and somebody has to carry them.',
      sub: 'Requires nerve rather than time.',
      requires: { composure: { min: 45 } },
      lockedText: 'Neither of you has the nerve left for this. (Needs: composure 45+)',
      effects: { time: -20, exposure: 3, composure: -5 },
      goto: 'ch9_staff',
    },
  ],
});

node({
  id: 'ch9_front',
  chapter: 9,
  lines: [
    { who: 'desc', text: 'You walk up to a list held by a man in a good coat and give him your call sign, because you do not actually have anything else to give.' },
    { who: 'you', text: 'Halcyon. Relay K-7.' },
    { who: 'desc', text: 'He looks down the page. He looks up. He looks down the page again.' },
    { who: 'watcher', text: '"...You\'re on it. You\'re on it twice."' },
    { who: 'desc', text: 'Once in the ordinary way, and once in a hand that is not the list-maker’s, in ink, at the bottom, where somebody has written a call sign and initialled it O.F.' },
    { who: 'desc', text: 'She wrote you onto the list in the car. Before you had answered.' },
  ],
  effects: { flags: { insideClean: true } },
  goto: 'ch9_hall',
});

node({
  id: 'ch9_tunnel',
  chapter: 9,
  lines: [
    { who: 'desc', text: 'Every exchange in Kestrel Bay has a cable tunnel, because ninety years ago every exchange in Kestrel Bay had to be connected to every other one, and nobody has ever filled a single one of them in.' },
    { who: 'desc', text: 'Forty minutes on your hands and knees under a building full of people in evening coats.' },
    { who: 'wren', text: "This is the second night in a row I have crawled under something for you." },
    { who: 'you', text: 'I am aware.' },
    { who: 'wren', text: "I want that on a record somewhere." },
    { who: 'desc', text: 'It comes out in a switch room on the north side, behind a door that has not been locked since the Authority stopped existing, because nobody locks a door to a room full of equipment nobody can use.' },
  ],
  effects: { flags: { insideQuiet: true } },
  goto: 'ch9_hall',
});

node({
  id: 'ch9_staff',
  chapter: 9,
  lines: [
    { who: 'desc', text: 'There is a table with drinks on it and a service entrance with a man leaning on it smoking, and the entire security apparatus of the evening is pointed at the east door.' },
    { who: 'wren', text: 'I am carrying a tray. I have never carried a tray in my life.' },
    { who: 'you', text: 'Carry it badly. Staff carry trays badly.' },
    { who: 'wren', text: "That is genuinely useful advice and I hate that it's you giving it." },
    { who: 'desc', text: 'Twenty minutes later there is a courier in a borrowed white jacket standing four metres from Cormac Vale, handing a glass to a member of the Eclipse Memorial Trust, and neither of them looks at her once.' },
    { who: 'desc', text: 'Nobody looks at staff. That is not a security failure, it is a fact about people, and it is the single most reliable thing in this city.' },
  ],
  effects: { flags: { insideQuiet: true }, trust: 4 },
  goto: 'ch9_hall',
});

node({
  id: 'ch9_relay',
  chapter: 9,
  effects: { loc: 'relay_sealed' },
  lines: [
    { who: 'desc', text: 'Everybody who matters is at the Exchange. That is the whole plan and it is not a small one: the entire senior weight of Halo Division and the Eclipse Memorial Trust is standing in a hall four districts away, holding drinks.' },
    { who: 'desc', text: 'K-7 has one man on the door.' },
    { who: 'sable', text: 'Cable trench comes up in the switch room. Same as it always did. Nobody has looked at it since the Authority stopped existing.' },
    { who: 'you', text: 'And the stack?' },
    { who: 'sable', text: 'Sealed in a building, not disabled. They put tape on a stairwell, Halcyon. Tape.' },
    { who: 'desc', text: 'Six hours until grid-up, in a dead building you have worked in for six years, with the bell ringing on a frequency you cannot reach four districts away.' },
    { who: 'wren', text: "I'm at the Exchange. I'll be your ears in the room." },
    { who: 'wren', text: 'Which is — do you see what we have done here. We have swapped.' },
    { who: 'you', text: 'I had noticed.' },
    { who: 'wren', text: "Don't enjoy it too much. It's horrible over here." },
  ],
  effects: { flags: { atRelay: true }, trust: 5 },
  goto: 'ch10_open',
});

// ---- Chapter Ten: The Bell --------------------------------------------------

node({
  id: 'ch10_open',
  chapter: 10,
  effects: { chapter: 10 },
  lines: [
    { who: 'sys', text: 'Chapter Ten — The Bell' },
    { who: 'desc', text: 'At three minutes to eleven the room goes quiet on its own, the way rooms do, and a woman of sixty-eight walks to the front of it without notes.' },
    { who: 'ferrant', text: '"Sixteen years ago tonight, this city lost its sky."' },
    { who: 'desc', text: 'She is very good at this. That is the thing you were not prepared for. She is genuinely, unshowily good at it.' },
    { who: 'ferrant', text: '"We do not have their names. The review board recorded them as numbers, and the families have asked that we honour the record as it stands."' },
    { who: 'desc', text: 'The families have asked. Somebody wrote that sentence, and it has been read out sixteen times, and it is a lie with a bow on it.' },
  ],
  goto: 'ch10_numbers',
});

node({
  id: 'ch10_numbers',
  chapter: 10,
  lines: [
    { who: 'ferrant', text: '"Operator One."' },
    { who: 'desc', text: 'Dead three years. Nobody in the room moves.' },
    { who: 'ferrant', text: '"Operator Two."' },
    { who: 'desc', text: 'Dead eleven.' },
    { who: 'ferrant', text: '"Operator Three."' },
    { who: 'desc', text: 'Four rows from the front, a woman in a good coat looks at her hands. Nobody around her knows why.' },
    { who: 'ferrant', text: '"Operator Four."' },
    { who: 'desc', text: 'At the back, if you went and got him, a man in a pressed jacket keeps his hands where he can see them.' },
    { who: 'ferrant', text: '"Operator Five. Operator Six."' },
    { who: 'desc', text: 'And then she stops.' },
    { who: 'desc', text: 'A second and a half. Sixteen years running, in the same place, and the room has always thought it was for effect.' },
  ],
  goto: 'ch10_seven',
});

node({
  id: 'ch10_seven',
  chapter: 10,
  lines: [
    { who: 'ferrant', text: '"...Operator Seven."' },
    { who: 'desc', text: 'Somewhere at the back of the hall, a courier who has spent a year of night shifts buying her way to a desk hears her mother turned into an integer for the sixteenth time.' },
    { who: 'desc', text: 'You are close enough to hear her breathing on the link and far enough that you cannot reach her, which is the arrangement you have had for two days and which has never once been worse than it is now.' },
    { who: 'wren', text: '...' },
  ],
  choices: [
    {
      text: 'Ilva Kestrel.',
      sub: 'Say the name on the channel. Just to her. Just so it exists in the room.',
      requires: { leads: ['L_OPERATOR_SEVEN'] },
      lockedText: 'You never found out what Operator Seven was called. (Needs: Operator Seven)',
      effects: { trust: 10, composure: 8, flags: { saidTheName: true } },
      goto: 'ch10_seven_name',
    },
    {
      text: "I'm here. Breathe. Forty seconds.",
      sub: 'The handler answer.',
      effects: { trust: 4, composure: 6 },
      goto: 'ch10_seven_steady',
    },
    {
      text: 'Say nothing. She did not ask you for anything.',
      effects: { composure: -4, trust: 2 },
      goto: 'ch10_seven_quiet',
    },
  ],
});

node({
  id: 'ch10_seven_name',
  chapter: 10,
  lines: [
    { who: 'you', text: 'Ilva Kestrel.' },
    { who: 'desc', text: 'Nobody in the hall hears it. It goes down a courier band into one earpiece at the back of a room of two hundred people, while a woman at the front says a number out loud.' },
    { who: 'wren', text: '...Say it again.' },
    { who: 'you', text: 'Ilva Kestrel. Operator Seven. She refused it twice in the same words because she worked out that repeating it exactly was harder to minute as a discussion.' },
    { who: 'desc', text: 'Two hundred people hear a number. One person hears a name and what the person it belonged to actually did.' },
    { who: 'wren', text: "Sixteen years and nobody has said her name in this building." },
    { who: 'wren', text: "Right. Right, okay. I'm ready. Whatever it is, I'm ready." },
  ],
  effects: { composure: 6 },
  goto: 'ch10_rest',
});

node({
  id: 'ch10_seven_steady',
  chapter: 10,
  lines: [
    { who: 'you', text: "I'm here. Breathe. Forty seconds and then the bell." },
    { who: 'wren', text: "Yeah." },
    { who: 'wren', text: "Yeah. Handler voice. That's fine, I'll take the handler voice." },
    { who: 'desc', text: 'It works, because it always works, and it is the correct thing to do, and you will wonder afterwards whether correct was what the moment wanted.' },
  ],
  goto: 'ch10_rest',
});

node({
  id: 'ch10_seven_quiet',
  chapter: 10,
  lines: [
    { who: 'desc', text: 'You say nothing, because she did not ask you for anything, and because six years have taught you that most of what people need on a channel is for it to stay open.' },
    { who: 'desc', text: 'The link hisses very faintly. She does not speak either.' },
    { who: 'desc', text: 'It is the right call maybe half the time. You will not find out which half this was.' },
  ],
  goto: 'ch10_rest',
});

node({
  id: 'ch10_rest',
  chapter: 10,
  lines: [
    { who: 'ferrant', text: '"Operator Eight. Operator Nine."' },
    { who: 'desc', text: 'Eight declined the settlement and has spent sixteen years as an archivist for an authority that does not exist. Nine emigrated and has never been found.' },
    { who: 'desc', text: 'Odile Ferrant folds her hands. The technician by the tower stair puts down his newspaper and reaches for a switch that gets used once a year.' },
    { who: 'sys', text: '23:00 · old grid frequencies energised · bell · 60 seconds' },
  ],
  goto: 'ch10_beat',
});

node({
  id: 'ch10_beat',
  chapter: 10,
  lines: [
    { who: 'desc', text: 'The bell starts. It is enormous, and old, and for sixty seconds every legacy receiver in Kestrel Bay is listening to a dead band because a trust wanted the sound to carry.' },
    { who: 'desc', text: 'Sixty seconds. This is the whole of it.' },
  ],
  timed: { seconds: 14, goto: 'ch10_missed' },
  branch: [
    { requires: { flags: { plan3: 'stand_down' } }, goto: 'ch10_stand_down' },
    { requires: { flags: { plan3: 'desk' } }, goto: 'ch10_desk' },
    { requires: { flags: { tookSeat: true } }, goto: 'ch10_seat_moment' },
  ],
  choices: [
    {
      text: 'Stand up and call a number out loud.',
      sub: 'The room first. The people it happened to, before anything goes anywhere.',
      requires: { anyFlags: { rookCommitted: true, ammiCommitted: true, didMaddoxVisit: true } },
      lockedText: 'You found nobody today who will stand up in this room. (Needs: any of the Nine)',
      effects: { composure: -6 },
      goto: 'ch10_floor',
    },
    {
      text: 'Go for the tower. Sixty seconds and the feed head is forty feet up.',
      requires: { flags: { plan3: 'bell' } },
      lockedText: 'You have no way to put anything on the bell frequency. (Needs: the bell plan)',
      effects: { flags: { wentTower: true }, composure: -8 },
      goto: 'ch10_tower',
    },
    {
      text: 'Put the question to the room. Cold, to whoever is in it.',
      sub: 'You never found anyone. Ask anyway.',
      requires: { flags: { rookCommitted: false } },
      effects: { flags: { askedCold: true }, composure: -6 },
      goto: 'ch10_question',
    },
    {
      text: 'Say nothing. Let the bell finish and the room have its evening.',
      effects: { flags: { plan3: 'stand_down' } },
      goto: 'ch10_stand_down',
    },
  ],
});

node({
  id: 'ch10_missed',
  chapter: 10,
  lines: [
    { who: 'desc', text: 'Sixty seconds is not very long, and you have spent two nights learning that a handler’s failure is almost never the wrong decision. It is the half-second before one.' },
    { who: 'desc', text: 'The bell stops. The frequency drops. Somebody near the drinks table starts talking about the rain.' },
    { who: 'wren', text: 'Halcyon.' },
    { who: 'wren', text: 'HALCYON.' },
    { who: 'desc', text: 'And then, because she is a courier and not a handler and has never in her life waited for a voice to tell her where to put her feet:' },
    { who: 'wren', text: 'Fine.' },
  ],
  effects: { composure: -10, trust: -6 },
  goto: 'ch10_wren_acts',
});

node({
  id: 'ch10_wren_acts',
  chapter: 10,
  lines: [
    { who: 'desc', text: 'She walks up the middle of a hall containing two hundred people in evening coats, in a borrowed white jacket or a courier’s canvas one, and she does not stop when a man in a good coat steps toward her.' },
    { who: 'wren', text: '"Operator Seven was called Ilva. She was my mother. She refused that order twice."' },
    { who: 'desc', text: 'The bell is still going. The frequency is still live. Nobody has told the tower to stop.' },
    { who: 'desc', text: 'And out of the back of the hall, unsteadily, a man in a pressed jacket:' },
    { who: 'rook', text: '"I was eight feet from her. Operator Four. I heard her say it."' },
  ],
  branch: [
    { requires: { flags: { rookCommitted: true } }, goto: 'ch10_floor_late' },
    { goto: 'ch10_floor_alone' },
  ],
});

node({
  id: 'ch10_floor',
  chapter: 10,
  branch: [
    { requires: { flags: { rookCommitted: false }, anyFlags: { ammiCommitted: true, didMaddoxVisit: true } }, goto: 'ch10_floor_alt' },
  ],
  lines: [
    { who: 'desc', text: 'You stand up in a room of two hundred people, under a bell, on a live frequency, and you say two words.' },
    { who: 'you', text: 'Operator Four.' },
    { who: 'desc', text: 'It is not loud. It does not have to be. It is the only two words in sixteen years of these evenings that have not been on the programme.' },
    { who: 'desc', text: 'And at the back of the hall, a man in a jacket somebody pressed for him stands up, unsteadily, and starts walking.' },
    { who: 'rook', text: '"Here."' },
    { who: 'desc', text: 'Two hundred people turn round.' },
    { who: 'rook', text: '"Teodor Reyes. Operator Four, board eleven. I was eight feet from Operator Seven when the burn order came down and I heard her refuse it twice."' },
    { who: 'rook', text: '"She said: array burn is not survivable for the satellite tier, I am not confirming this. And they asked her again, and she said the same words, because she’d worked out that saying it the same way was harder to write up as a discussion."' },
    { who: 'desc', text: 'Nobody stops him. That is the extraordinary thing. Two very polite men start to move and Odile Ferrant, at the front, lifts one hand about four inches, and they stop.' },
  ],
  effects: { flags: { fourSpoke: true }, trust: 6 },
  goto: 'ch10_floor_hub',
});

node({
  id: 'ch10_floor_late',
  chapter: 10,
  effects: { flags: { fourSpoke: true, wrenSpoke: true }, trust: 4, composure: -4 },
  lines: [
    { who: 'desc', text: 'It happens without you. That is the correct punishment and you will think about it for a long time.' },
    { who: 'desc', text: 'A courier says her mother’s name in a room that has spent sixteen years calling her a number, and a drunk operator comes up the aisle to back her, and neither of them waited for the voice in their ear.' },
    { who: 'ferrant', text: '"...Let him finish."' },
    { who: 'desc', text: 'Two very polite men stop moving.' },
  ],
  goto: 'ch10_floor_hub',
});

node({
  id: 'ch10_floor_alone',
  chapter: 10,
  effects: { flags: { wrenSpoke: true }, composure: -10, trust: -4 },
  lines: [
    { who: 'desc', text: 'She says it alone, in a room of two hundred people, with nobody prepared to stand up behind her — because you never found the man who was eight feet away, or never got him sober, or never asked.' },
    { who: 'wren', text: '"She refused it twice. Somebody in this room knows that."' },
    { who: 'desc', text: 'Nobody moves. Four rows from the front a woman in a good coat looks at her hands and does not raise her eyes.' },
    { who: 'desc', text: 'Two very polite men reach her at about the forty-second mark and walk her toward a side door, and the bell finishes, and somebody near the drinks table starts talking about the rain.' },
    { who: 'desc', text: 'It is the loneliest thing you have ever heard on an open channel, and you heard all of it, and you could not do one single thing about any of it.' },
  ],
  goto: 'end_testimony_thin',
});

node({
  id: 'ch10_floor_hub',
  chapter: 10,
  linesOnce: true,
  lines: [
    { who: 'desc', text: 'The bell is still going. Nobody has told the tower to stop, because the man who operates the tower is standing in the doorway watching a room come apart.' },
    { who: 'desc', text: 'You have a room, and a frequency, and about forty seconds.' },
  ],
  choices: [
    {
      text: 'Operator Three.',
      requires: { flags: { ammiCommitted: true, calledThree: false } },
      lockedText: 'There is no one else here who will answer to a number. (Needs: Sarran)',
      effects: { count: { floor: 1 }, flags: { calledThree: true } },
      goto: 'ch10_three',
    },
    {
      text: 'Operator Eight.',
      sub: 'The only one of the nine who never signed anything.',
      requires: { flags: { calledEight: false } },
      effects: { count: { floor: 1 }, flags: { calledEight: true } },
      goto: 'ch10_eight',
    },
    {
      text: 'Ask the room the question. All of it. Out loud.',
      sub: 'Whether this goes any further is not yours to decide.',
      requires: { counts: { floor: { min: 1 } } },
      lockedText: 'One voice has spoken and you are already asking the room to decide. (Needs: another of the Nine)',
      effects: { flags: { askedRoom: true } },
      goto: 'ch10_vale_moment',
    },
  ],
});

node({
  id: 'ch10_three',
  chapter: 10,
  lines: [
    { who: 'you', text: 'Operator Three.' },
    { who: 'desc', text: 'Four rows from the front, a woman in a good coat sits absolutely still for what feels like a very long time.' },
    { who: 'desc', text: 'She has a settlement. She has a house on the Verge her daughter grew up in. She has a clause forbidding her from discussing any relay station or any member of its staff, and she has read it every day for sixteen years.' },
    { who: 'desc', text: 'She stands up.' },
    { who: 'ammi', text: '"Ammi Sarran."' },
    { who: 'ammi', text: '"I am not permitted to discuss the array, or the board, or any relay station. So I am not going to discuss them."' },
    { who: 'ammi', text: '"I am going to say that when Operator Four describes the confirmation arriving from outside our floor with a station code on it, I do not deny it."' },
    { who: 'desc', text: 'It is the most carefully constructed sentence you have ever heard a frightened person say, and she has clearly been building it since you stood in her hallway this afternoon.' },
    { who: 'ammi', text: '"And I would like it minuted that I have not denied it."' },
  ],
  effects: { flags: { threeSpoke: true }, trust: 5 },
  goto: 'ch10_floor_hub',
});

node({
  id: 'ch10_eight',
  chapter: 10,
  branch: [
    { requires: { flags: { maddoxSafe: true } }, goto: 'ch10_eight_here' },
    { requires: { flags: { didMaddoxVisit: true } }, goto: 'ch10_eight_here' },
    { goto: 'ch10_eight_absent' },
  ],
  lines: [
    { who: 'you', text: 'Operator Eight.' },
  ],
});

node({
  id: 'ch10_eight_here',
  chapter: 10,
  lines: [
    { who: 'desc', text: 'Ezra Maddox is sixty-one and has been standing at the back of this hall for twenty minutes holding a case, because an archivist who has been told he will be needed does not arrive late.' },
    { who: 'maddox', text: '"Ezra Maddox. Operator Eight. I declined the settlement."' },
    { who: 'maddox', text: '"I have spent sixteen years as an archivist for an authority that does not exist, which is the job you take when you are waiting for a shelf to give something up."' },
    { who: 'desc', text: 'He lifts the case. It is the least dramatic gesture imaginable and the room goes completely silent.' },
    { who: 'maddox', text: '"Array telemetry, full night, sealed. Burn authorisation with a signature on it above the operator line. It has been on a shelf in my rooms for four days and on a shelf in a building for sixteen years, and in all that time not one person ever asked an archivist a direct question."' },
    { who: 'desc', text: 'At the front of the hall, Odile Ferrant closes her eyes.' },
  ],
  effects: { flags: { eightSpoke: true }, trust: 4 },
  goto: 'ch10_floor_hub',
});

node({
  id: 'ch10_eight_absent',
  chapter: 10,
  lines: [
    { who: 'desc', text: 'Nobody answers.' },
    { who: 'desc', text: 'Ezra Maddox is not in this room, because you never went to his rooms and never asked him to be, and he is at this moment sitting alone in two rooms full of index cards, listening to a bell four districts away.' },
    { who: 'desc', text: 'He would have come. That is the part that will stay with you. All anybody ever had to do was ask an archivist a direct question.' },
  ],
  effects: { composure: -4 },
  goto: 'ch10_floor_hub',
});

node({
  id: 'ch10_question',
  chapter: 10,
  lines: [
    { who: 'desc', text: 'So you ask it. Out loud, in a hall, with the bell still going and a live frequency over your head and every surviving person this happened to standing in the room.' },
    { who: 'you', text: 'The frequency above this building is live for about another thirty seconds, and it reaches every receiver in Kestrel Bay, and I am holding the only copy of what actually happened.' },
    { who: 'you', text: 'If it goes out, eight settlements come apart. Sarran loses a house. Reyes loses his income. Three families find out tonight, publicly, that it was deliberate.' },
    { who: 'you', text: 'I am not going to decide that for you. Sixteen years of people deciding things for you is the entire reason we are all standing here.' },
    { who: 'you', text: 'So: does it go out?' },
    { who: 'desc', text: 'And the room — two hundred people in evening coats, a trust, a Halo captain by the drinks table, and the four or five human beings it actually happened to — does not say anything at all.' },
    { who: 'desc', text: 'Until one of them does.' },
  ],
  effects: { flags: { askedRoom: true } },
  goto: 'ch10_verdict',
});

node({
  id: 'ch10_verdict',
  chapter: 10,
  branch: [
    { requires: { flags: { fourSpoke: true, threeSpoke: true, eightSpoke: true } }, goto: 'ch10_yes_full' },
    { requires: { flags: { fourSpoke: true, threeSpoke: true } }, goto: 'ch10_yes_partial' },
    { requires: { flags: { fourSpoke: true } }, goto: 'ch10_yes_thin' },
    { goto: 'ch10_no' },
  ],
  lines: [],
});

node({
  id: 'ch10_yes_full',
  chapter: 10,
  lines: [
    { who: 'ammi', text: '"Yes."' },
    { who: 'desc', text: 'Ammi Sarran, four rows from the front, who has the most to lose in this room and has done the arithmetic on it every day for sixteen years.' },
    { who: 'ammi', text: '"I have a daughter who is twenty and who has been told her whole life that her mother was part of an accident. She can have the house or she can have the truth. She is twenty. She would rather have the truth and she would be right."' },
    { who: 'rook', text: '"Four. Yes."' },
    { who: 'maddox', text: '"Eight. Yes. Obviously yes, I carried it across a city in a toolbox."' },
    { who: 'desc', text: 'And then, at the back, in a borrowed white jacket:' },
    { who: 'wren', text: '"Seven’s daughter. Yes."' },
    { who: 'desc', text: 'Four voices, in a room, on a record, with about twenty seconds of live frequency left above the roof.' },
  ],
  effects: { flags: { consent: 'full' }, trust: 10 },
  goto: 'ch10_execute',
});

node({
  id: 'ch10_yes_partial',
  chapter: 10,
  lines: [
    { who: 'ammi', text: '"...Yes."' },
    { who: 'desc', text: 'Very quietly, from four rows from the front, by a woman who is going to lose a house for it.' },
    { who: 'rook', text: '"Four. Yes."' },
    { who: 'desc', text: 'Two of the nine, out of the three who are still alive and in this city. The third is at home in two rooms full of index cards because nobody asked him.' },
    { who: 'desc', text: 'It is a majority of the people available, which is not the same as all of them, and you will have to decide later whether that distinction matters.' },
  ],
  effects: { flags: { consent: 'partial' }, trust: 6 },
  goto: 'ch10_execute',
});

node({
  id: 'ch10_yes_thin',
  chapter: 10,
  lines: [
    { who: 'rook', text: '"Four. Yes."' },
    { who: 'desc', text: 'One voice. A settled man who drinks, describing a conversation from sixteen years ago.' },
    { who: 'desc', text: 'Four rows from the front, a woman in a good coat looks at her hands and says nothing, and her silence is not consent and you know it.' },
  ],
  effects: { flags: { consent: 'thin' } },
  goto: 'ch10_execute',
});

node({
  id: 'ch10_no',
  chapter: 10,
  lines: [
    { who: 'desc', text: 'Nobody says anything.' },
    { who: 'desc', text: 'You asked a room full of people who have been numbers for sixteen years to speak as people, and you did it without having found a single one of them first, and they do not know you, and they have everything to lose.' },
    { who: 'desc', text: 'The bell finishes. The frequency drops. Somebody near the drinks table starts talking about the rain.' },
    { who: 'desc', text: 'It was the right question. You simply asked it of strangers.' },
  ],
  effects: { flags: { consent: 'none' }, composure: -8 },
  goto: 'end_ash_asked',
});

node({
  id: 'ch10_execute',
  chapter: 10,
  branch: [
    // Consent is worth nothing without a way to carry it. The bell plan is what
    // bought the feed head; the room alone reaches two hundred people.
    { requires: { flags: { plan3: 'bell', consent: 'full' } }, goto: 'ch11_sent' },
    { requires: { flags: { plan3: 'bell', consent: 'partial' } }, goto: 'ch11_sent' },
    { requires: { flags: { plan3: 'bell', consent: 'thin' } }, goto: 'ch11_sent' },
    { goto: 'ch11_room' },
  ],
  lines: [
    { who: 'desc', text: 'Twenty seconds of live frequency over a roof, and a room that has just said something out loud for the first time in sixteen years.' },
  ],
});

node({
  id: 'ch10_tower',
  chapter: 10,
  lines: [
    { who: 'desc', text: 'Forty feet of maintenance ladder inside a bell tower while the bell is being rung, which is an experience you would not wish on anyone.' },
    { who: 'desc', text: 'The feed head is a brass junction older than the Authority, and the drum goes onto it the same way it went onto a substation mast two nights ago: by touch, in the dark, with somebody reading a pinout at you.' },
    { who: 'sable', text: 'Red to the standoff. Not the shield.' },
    { who: 'you', text: 'Red to the standoff.' },
    { who: 'desc', text: 'Below you, two hundred people in evening coats are listening to a bell.' },
    { who: 'desc', text: 'You did not ask any of them. There was not time, and you did not make time, and both of those are true at once.' },
  ],
  effects: { flags: { consent: 'none', wentTower: true }, composure: -6 },
  goto: 'ch10_tower_top',
});

node({
  id: 'ch10_stand_down',
  chapter: 10,
  lines: [
    { who: 'desc', text: 'The bell rings for sixty seconds and you stand in a hall and let it.' },
    { who: 'desc', text: 'Odile Ferrant reads nine numbers and sits down. Four rows from the front a woman in a good coat keeps a house. At the back, a man in a pressed jacket does not have to lose an income.' },
    { who: 'desc', text: 'And a courier who spent a year of night shifts buying her way to a desk stands next to you with her hands in her pockets and does not say anything at all, because you told her what you were going to do and she did not agree and she came anyway.' },
    { who: 'desc', text: 'The frequency drops. Somebody near the drinks table starts talking about the rain.' },
  ],
  goto: 'ch11_quiet',
});

node({
  id: 'ch10_seat_moment',
  chapter: 10,
  lines: [
    { who: 'desc', text: 'The bell rings for sixty seconds.' },
    { who: 'desc', text: 'You are standing four rows from the back of a hall with a seat on the Eclipse Memorial Trust that begins on Monday, and a file that is unremarkable, and a courier across the room whose transport charge was withdrawn at five o’clock this afternoon by somebody she has never met.' },
    { who: 'desc', text: 'She works out what happened at about the thirty-second mark. You watch her do it, across a room, in real time.' },
    { who: 'wren', text: '"...Halcyon."' },
    { who: 'wren', text: '"What did you give her."' },
    { who: 'desc', text: 'The frequency drops. Odile Ferrant sits down. Somebody near the drinks table starts talking about the rain.' },
  ],
  goto: 'end_seat',
});

node({
  id: 'ch10_desk',
  chapter: 10,
  lines: [
    { who: 'desc', text: 'Four districts away, a bell rings on a frequency you cannot reach, and you are lying in a cable trench under your own building listening to it on a handset.' },
    { who: 'wren', text: "She's reading the numbers. One. Two. Three." },
    { who: 'desc', text: 'The trench comes up in the switch room. The switch room has a door that has not been locked since the Authority stopped existing.' },
    { who: 'wren', text: 'Seven.' },
    { who: 'desc', text: 'Seven.' },
    { who: 'desc', text: 'You come up into a building you have worked in for six years, past nine dead channels and a bucket under switch four, and you sit down in the chair.' },
    { who: 'sys', text: 'K-7 · local terminal · legacy broadcast stack · PRESENT' },
    { who: 'sys', text: 'Grid-up sync in 5h 38m' },
    { who: 'desc', text: 'Five and a half hours in a sealed building with one man on the door, and then ninety seconds of every receiver in Kestrel Bay.' },
  ],
  effects: { time: -20, composure: -5 },
  goto: 'ch10_desk_wait',
});

node({
  id: 'ch10_desk_wait',
  chapter: 10,
  linesOnce: true,
  lines: [
    { who: 'desc', text: 'Handlers are good at waiting. It is ninety per cent of the job.' },
  ],
  choices: [
    {
      text: 'Spend the night cutting it together. Telemetry, then the tape, then me explaining what the nine words mean.',
      sub: 'Context is the whole difference between proof and a panic.',
      requires: { flags: { cut: false } },
      effects: { time: -180, flags: { cut: true }, composure: -6 },
      goto: 'ch10_desk_cut',
    },
    {
      text: 'Get Reyes and Sarran on a line and record them before dawn.',
      sub: 'Voices, not numbers.',
      requires: { flags: { rookCommitted: true } },
      lockedText: 'You have nobody who will speak. (Needs: Reyes committed)',
      effects: { time: -120, flags: { voices: true }, trust: 6 },
      goto: 'ch10_desk_voices',
    },
    {
      text: 'Go up and watch the door. If they come, I want to hear them coming.',
      sub: 'Costs the night. Buys nothing but knowing.',
      effects: { time: -90, composure: -4, exposure: -8 },
      silent: true,
      goto: 'ch10_desk_watch',
    },
    {
      text: 'Wait it out and send at grid-up.',
      silent: true,
      goto: 'ch10_desk_send',
    },
  ],
});

node({
  id: 'ch10_desk_cut',
  chapter: 10,
  lines: [
    { who: 'desc', text: 'Three hours in a dead building assembling ninety seconds.' },
    { who: 'desc', text: 'Eleven years of falsified capacity reports, compressed to a figure a person can hold. The burn authorisation with a name above the operator line. Nine words off a tape from this room, sixteen years old, degraded, unmistakable.' },
    { who: 'desc', text: 'And then thirty seconds of your own voice, recorded at four in the morning in the chair that said yes, explaining in plain words what the nine words mean — because raw data with nobody to interpret it is just a panic, and a man called Vale was right about that, and it is the only true thing he ever said to you.' },
    { who: 'desc', text: 'You say Aurel Stanik’s name in it. Twice. Nobody has said it out loud in eleven years.' },
  ],
  goto: 'ch10_desk_wait',
});

node({
  id: 'ch10_desk_voices',
  chapter: 10,
  lines: [
    { who: 'desc', text: 'Two hours, on a relay line, from a sealed building, to a bar on the Rill and a house on the Verge.' },
    { who: 'rook', text: '"Teodor Reyes. Operator Four, board eleven. I heard her refuse it twice."' },
    { who: 'ammi', text: '"Ammi Sarran. I am not permitted to discuss any relay station. I am not denying that the confirmation came from one."' },
    { who: 'desc', text: 'Sarran does it at three in the morning from her own kitchen, with a settlement in a drawer that says she cannot, and she does not ask you a single question about what it will cost her.' },
    { who: 'ammi', text: '"You said somebody would say it first. Nobody has ever said it first."' },
  ],
  effects: { trust: 5 },
  goto: 'ch10_desk_wait',
});

node({
  id: 'ch10_desk_send',
  chapter: 10,
  branch: [
    { requires: { exposure: { min: 70 } }, goto: 'end_burned_relay' },
    { requires: { flags: { cut: true, voices: true } }, goto: 'end_handshake' },
    { requires: { flags: { cut: true } }, goto: 'end_handshake' },
    { goto: 'end_broadcast' },
  ],
  lines: [
    { who: 'sys', text: '04:40 · grid-up sync · legacy stack ARMED' },
    { who: 'desc', text: 'The streetlights of Kestrel Bay start their pre-warm tick, all at once, the way they have every morning for sixteen years.' },
  ],
});

// ============================================================================
// ENDINGS
// ============================================================================

node({
  id: 'end_handshake',
  chapter: 10,
  ending: {
    key: 'handshake',
    title: 'Handshake',
    body: `It went out with its context, and it went out with their permission, and those two facts are the entire difference between what happened and what would otherwise have happened.

Not numbers. A voice saying that the grid had been failing for eleven years and the reports said otherwise. A signature above the operator line. Nine words off a sixteen-year-old tape, degraded, unmistakable. And then people — actual named people, who had spent sixteen years being integers — saying what they saw, in their own words, having been asked first.

The inquiry opened in eleven days. Odile Ferrant did not contest a single point of it, which surprised everyone but you. Cormac Vale's separation from Halo Division was described as long planned. Eight settlements were reopened and the word "accident" quietly stopped appearing in the Trust's literature.

Ammi Sarran lost the house on the Verge. Her daughter, who is twenty, gave three interviews and was extremely good in all of them.

They read the names out this February. Not numbers. Ilva Kestrel, Operator Seven, who refused an order twice in identical words because she had worked out that repeating it exactly was harder to minute as a discussion. And Aurel Stanik, who was not on the list, because he was not one of the nine — he was the man in the chair, and somebody had to ask for him to be added, and you did.

You had about four minutes to decide how you went dark. You used them to unscrew the nameplate off the desk, because it was the only part of that room that was ever actually yours to take, and because a call sign should not be allowed to outlive the people who have to answer to it.

She found you eleven days later. She did not have to look very hard.

"You left the plate on Ilsa's board."

"I left a note on it."

"'Ask her, she knows everything.'" Wren sat down next to you, on a wall, in the dark, in the usual weather. "She does, as it turns out. She's insufferable about it."

The sky is still out. That was never going to be fixable. But the record says what happened now, and it says it in the names of people, and every February somebody reads them properly.`,
  },
  lines: [],
});

node({
  id: 'end_broadcast',
  chapter: 10,
  ending: {
    key: 'broadcast',
    title: 'Broadcast',
    body: `It went out. Say that first, because it is true and it matters: for sixty seconds on a dead band, or ninety at grid-up, the whole of Kestrel Bay was handed sixteen years of array telemetry.

What the city got was numbers.

No one standing next to it. No voice over the top explaining that the figures are eleven years of falsified capacity reports, no name read out above the operator line, no one who was there saying so in their own words — because you did not have that, or did not build it, or did not stop long enough to ask the people it happened to whether they wanted it at all.

The Trust's statement was out before the streetlights were fully warm. The word was "fragmentary", and they used it a great many times, and by the evening a man on a discussion programme was explaining patiently that raw data without interpretation is really just a panic.

He was right. That is the unbearable part. He was repeating, almost word for word, the argument Cormac Vale made to you in the small hours of the first night, and he was right, and you had two days to build the answer to it and you spent them on other things.

There was an inquiry. It ran four months and found the record incomplete.

Ammi Sarran kept her house and has not left it much. Teodor Reyes is at the end of the Drowned Bell most days and has stopped telling people about Operator Seven, because now they have heard the numbers and they still do not believe him, and that is worse.

Wren got clear. She will not say where and you have stopped asking.

Some mornings it feels like enough. It went out. Somebody somewhere recorded those sixty seconds and has them still, and one day somebody will put the context next to them.

You had it. That is the thing. You were holding the context in your hands.`,
  },
  lines: [],
});

node({
  id: 'end_testimony',
  chapter: 10,
  ending: {
    key: 'testimony',
    title: 'Testimony',
    body: `There was no way to put it on the air, and so it stayed in the room, and the room turned out to be enough — not for everything, but for the thing that actually needed doing.

Two hundred people in evening coats heard Teodor Reyes say he was eight feet away. They heard Ammi Sarran construct, with enormous care, a sentence that did not breach a settlement and did not deny a word of it. They heard an archivist explain that all anybody had ever needed to do was ask him a direct question.

And they heard a courier in a borrowed jacket say a name out loud: Ilva Kestrel, Operator Seven, who refused twice.

Nobody can put that in an evidence locker. That is the whole value of it. Two hundred people were standing there, half of them Trust, a third of them press-adjacent, and there is no version of the next year in which every single one of them forgets.

It took fourteen months instead of eleven days. It went through a subcommittee, then a review, then a proper inquiry, and the momentum came and went twice and both times it was Sarran's daughter who put it back.

Ferrant resigned the chair in the spring and was not replaced for a year, because nobody wanted the job once it meant something.

You went back on shift on the Thursday, because nobody had actually charged you with anything and the rota had a hole in it. Six years of nights, and then two days, and then more nights.

Wren takes your desk when she can get it. Neither of you has ever said the word Ledger on an open channel, but you have both, on separate occasions and without discussing it, started saying Aurel Stanik's name out loud on the shift log, so that it is written down somewhere every single night.

It is a slow way to win. It is the only kind that was ever available in this city.`,
  },
  lines: [],
});

node({
  id: 'end_testimony_thin',
  chapter: 10,
  ending: {
    key: 'testimony',
    title: 'Testimony',
    body: `She said it alone.

Two hundred people in evening coats, a live frequency over the roof, and one courier in the middle of the floor saying her mother had a name and refused an order twice — with nobody behind her, because the man who was eight feet away was at the end of a bar on the Rill and you never went, or never asked, or never got him sober.

Forty seconds, and then two very polite men, and a side door.

They did not charge her. There is nothing to charge a person with for saying a name in a hall. They held her four hours and let her out at three in the morning into the rain, and she walked, because her money was a bail figure now or a memory of a job.

The Trust's account of the evening describes a disturbance.

Here is the thing, though, and it took you a year to believe it: two hundred people heard her. Not enough of them to matter that night. But a woman four rows from the front, who has a settlement and a house on the Verge and a daughter who is twenty, heard a stranger say it alone, and did nothing, and then had to go home and be a person who did nothing.

She wrote to the Trust in February. Then to a lawyer, in March.

It is fourteen months and counting and it is not finished, and it started because somebody stood up in a room with no support and said a name, and the cost of that landed almost entirely on her while you listened.

You still work nights. She has not taken your desk since.`,
  },
  lines: [],
});

node({
  id: 'end_ash_quiet',
  chapter: 10,
  ending: {
    key: 'ash',
    title: 'Ash and Salt',
    body: `The bell rang for sixty seconds and you stood in a hall and let it.

It is a real answer. Sable said so, and she was not being kind — it is the answer most people arrive at and almost nobody says out loud, and there is an argument for it that survives being examined.

Ammi Sarran kept the house on the Verge. Her daughter finished her degree in it. Teodor Reyes kept the only income he has and is still at the end of the Drowned Bell most days, telling anyone who will listen that Operator Seven said no twice, and being believed by nobody, as he has been for sixteen years and will be for the rest of them.

Three families were not told, on a wet evening, in front of two hundred strangers, that it was deliberate.

Odile Ferrant read the numbers again the following February. She is very good at it. She will go on being very good at it until she dies, and then somebody else will do it, and the sky will stay exactly as dark as it is.

Wren did not argue with you. That is the part that does not go away. You told her what you were going to do and she disagreed and she came to the Exchange anyway and stood next to you with her hands in her pockets while a woman read out her mother's number.

She still works the Belt. You still work nights. She takes your desk sometimes and you talk about nothing for five hours at a stretch, companionably, in the dark, which is a thing you are both extremely good at.

Neither of you has said the word Ledger since.

Every so often, around three in the morning, she says: "Do you ever think about it?"

And you say no.

And she says no, me neither.`,
  },
  lines: [],
});

node({
  id: 'end_ash_asked',
  chapter: 10,
  ending: {
    key: 'ash',
    title: 'Ash and Salt',
    body: `You asked the right question. You simply asked it of strangers.

Two hundred people, a live frequency, and a handler standing in the middle of a hall inviting a room full of people he had never met to decide the rest of their own lives in thirty seconds, with no one in it who knew him, or trusted him, or had been asked anything by anyone in sixteen years.

Of course nobody said yes. Silence in that room was not cowardice. It was sixteen years of correctly learning what happens to people who speak.

The bell finished. The frequency dropped. Somebody near the drinks table started talking about the rain, and the Trust's account of the evening does not mention you at all.

You had the drum, or you knew where it was. You had the tape in a canvas bag. You had every piece of it except the one that mattered, which was a single human being in that room who would stand up — and they were findable, all of them, in daylight, in this city, and you spent the day you had on other things.

Ferrant found you afterwards, by the drinks.

"You did the right thing and it didn't work," she said. "You'll find that happens. It's the part nobody warns you about."

She meant it kindly, which is the worst available version.

The sky is still out. The record still says accident. Ammi Sarran still has the house and Teodor Reyes still has the bar, and neither of them ever knew how close it came, because nobody asked them.

Wren went home. So did you, eventually, and slept through a whole day for the first time in six years, and woke up at dusk out of habit.`,
  },
  lines: [],
});

node({
  id: 'end_seat',
  chapter: 10,
  ending: {
    key: 'seat',
    title: 'The Seat',
    body: `The charge was withdrawn at five. Your file was unremarkable by six. The relay reopened on the Thursday and you sat in it, and the whole thing took about two hours to arrange, which is how you learned exactly how small the thing you had been fighting was to the people running it.

Wren worked it out across a room while a bell was ringing.

She did not shout. She has never once shouted at you. She stood four rows back with her hands in her pockets and looked at you for a long moment and then went out through the east door, and she has not taken your desk since, and she does not answer when you raise her.

You took the seat on the Trust the following Monday. There are eleven of you. It meets four times a year in a good room and does a genuinely large amount of real good: a hardship fund, a scholarship, the upkeep on the Exchange, the bell.

You have read the file. All of it, everything the Trust holds, which is considerably more than Halo ever needed to seize. It is all still there. You could put it on the air tomorrow.

You have been able to put it on the air tomorrow for four years now.

Odile Ferrant died in the winter. She was not senile and she was not surprised, and she left a note that said three words and your call sign, and the three words were: *it should cost.*

So this February you will stand up in the Ashgate Exchange with the bell about to go and two hundred people in evening coats in front of you, and you will read out nine numbers in a nice voice, and it will cost exactly as much as she promised it would.

You change the bucket on Thursdays. Somebody has to change the bucket.`,
  },
  lines: [],
});

node({
  id: 'end_burned_relay',
  chapter: 10,
  ending: {
    key: 'burned',
    title: 'Burned',
    body: `They were waiting in the switch room, which means they had been waiting since before the bell, which means they knew the shape of your day long before you did.

That is what exposure is. Not one mistake — a total. A bar on the Rill at eleven, a door on the Verge at one, an archivist's stairwell at two, a tail on the Rill road you did or did not lose. Every one of them a reasonable decision, and all of them together a map with your name on it.

Vale did not come. He sent the young man in the grey coat, who was apologetic, and who had clearly been told to be.

"For what it's worth," he said, in the stairwell of a building you have worked in for six years, "he said you'd be here. Nobody else believed him."

The tapes went into an evidence locker. So did the second drum, if you had it. Halo does not need a conviction and never did; they need the objects in a room they control, and at 04:40 on the morning of the seventeenth anniversary they had every single one.

You were released in the afternoon without charge. There is no offence in the statutes for going into your own workplace.

K-7 was decommissioned that week. They took the legacy stack out properly this time, and unscrewed the nameplate, and put the chair in a corridor.

Wren was at the Exchange all night with a handset, waiting for a voice that stopped at 04:39.

She looked for you for a while. You have not been easy to find, mostly because you have not tried to be, and because the thing you cannot work out how to say to her is that you had it — you were in the chair, at the desk, with the whole of it in your hands — and you ran out of the one resource you never thought to count.`,
  },
  lines: [],
});

node({
  id: 'ch10_desk_watch',
  chapter: 10,
  lines: [
    { who: 'desc', text: 'Ninety minutes on the ninth floor of your own building with the lights off, looking down at a street through a window you have never once looked out of in six years of working here.' },
    { who: 'desc', text: 'One man on the door. He sits in a car and at about two in the morning he falls asleep, because he is guarding a sealed building full of equipment nobody can use and he has been told this is a formality.' },
    { who: 'wren', text: 'Anything?' },
    { who: 'you', text: 'A man asleep in a car.' },
    { who: 'wren', text: "That's what it comes down to, isn't it. Sixteen years and the whole thing is standing on one bloke who's bored." },
    { who: 'desc', text: 'It is. It always was. That is what the chain is made of at three in the morning — tired people in dead rooms, doing the formality, not being asked anything.' },
  ],
  goto: 'ch10_desk_wait',
});

node({
  id: 'ch10_floor_alt',
  chapter: 10,
  effects: { flags: { calledFour: true }, composure: -4 },
  lines: [
    { who: 'desc', text: 'You stand up in a room of two hundred people, under a bell, on a live frequency, and you say two words.' },
    { who: 'you', text: 'Operator Four.' },
    { who: 'desc', text: 'And nothing happens, because Teodor Reyes is at the end of the Drowned Bell four districts away, where he has been every February for fourteen years, and nobody went to get him.' },
    { who: 'desc', text: 'Two hundred people look at a man who has just shouted a number at a memorial.' },
    { who: 'desc', text: 'So you say the next one, because there is nothing else left to do with the forty seconds.' },
  ],
  goto: 'ch10_floor_hub',
});

node({
  id: 'ch3_stanik',
  chapter: 3,
  lines: [
    { who: 'desc', text: 'The roster gave you a chair. It takes another half hour to make the chair give you a man.' },
    { who: 'sys', text: 'STANIK, AUREL · desk K-7 · appointed age 33 · deceased in service, age 55' },
    { who: 'desc', text: 'Twenty-two years. Eleven before the Eclipse and eleven after, in this room, on these nine channels.' },
    { who: 'desc', text: 'There is no disciplinary record. There is no commendation. There is a personnel photograph of a man with a tired face, and there is — because the relay service keeps everything and files none of it — nineteen years of maintenance tickets.' },
    { who: 'sys', text: 'TICKET 4-1190 · water ingress above switch four · NOT ACTIONED' },
    { who: 'sys', text: 'TICKET 4-1191 · water ingress above switch four · NOT ACTIONED' },
    { who: 'sys', text: 'TICKET 4-1192 · water ingress above switch four · NOT ACTIONED' },
    { who: 'desc', text: 'Every quarter. For nineteen years. The same three words, refiled every ninety days by a man in a dead room, never once actioned by anybody.' },
    { who: 'desc', text: 'You look up. There is a bucket under switch four. You put it there in your second week and you have changed it on Thursdays ever since, and it has never once occurred to you to ask how long it had been leaking.' },
    { who: 'desc', text: 'He acknowledged an order at three in the morning that put the sky out, and then he came back the next night, and the night after that, for eleven years, and filed a ticket about the leak.' },
    { who: 'desc', text: 'You cannot decide whether that is the saddest thing you have ever read or the most frightening, and you are fairly sure the answer is that there is no difference.' },
  ],
  effects: { composure: -2 },
  goto: 'ch3_desk',
});

node({
  id: 'ch3_caller',
  chapter: 3,
  lines: [
    { who: 'desc', text: 'Nine words. "K-7 acknowledges. Relaying." You have listened to them enough times tonight to hear them with the tape off.' },
    { who: 'desc', text: 'An acknowledgement is an answer. Somebody asked.' },
    { who: 'desc', text: 'The trunk logs from that night are a mess — half of them were written during a citywide emergency by people who had just watched the sky go out — but a relay log records every inbound, because billing does not care about emergencies.' },
    { who: 'sys', text: 'K-7 INBOUND · 03:13 · origin: RELAY M-2 · duration 0:41' },
    { who: 'sys', text: 'K-7 OUTBOUND · 03:14 · [ACKNOWLEDGEMENT]' },
    { who: 'desc', text: 'Forty-one seconds. That is how long it took one handler to give another handler an order that ended the sky.' },
    { who: 'you', text: 'M-2.' },
    { who: 'desc', text: 'Not a corporate line. Not an executive. Another tired man in another dead room, doing exactly what this desk does, passing it on — which is the whole design, and it is beautiful in a way that makes you feel ill.' },
    { who: 'desc', text: 'Nobody in the chain ever authored anything. That is the point of a chain.' },
  ],
  goto: 'ch3_desk',
});

node({
  id: 'ch3_wrenfile',
  chapter: 3,
  lines: [
    { who: 'desc', text: 'It feels wrong and you do it anyway, which is most of what a handler is.' },
    { who: 'sys', text: 'COURIER FILE · 412 completed · 0 disputes · rating: exceptional' },
    { who: 'sys', text: 'Standing order (self-funded, 13 months): old-grid / blank-manifest tickets -> relay K-7' },
    { who: 'desc', text: 'Thirteen months of paying a dispatcher out of her own take for the right to be given the jobs nobody wants, on the desk nobody wants, on the shift nobody wants.' },
    { who: 'desc', text: 'Four hundred and twelve jobs, no disputes. She is extremely good at this and she has been spending the proceeds on a year of night shifts looking for a voice.' },
    { who: 'desc', text: 'And there is one more line, filed under next-of-kin, which is the field couriers leave blank because couriers do not have anybody.' },
    { who: 'sys', text: 'Next of kin: KESTREL, ILVA (deceased) — mother' },
    { who: 'desc', text: 'Kestrel. Like the bay. Half this city is called Kestrel something.' },
    { who: 'desc', text: 'You sit with that for a moment: that Operator Seven had a name, and the name is in a courier file, in a field nobody reads, and has been sitting in this relay’s own records for thirteen months while you worked nights eight feet away from it.' },
  ],
  effects: { leads: ['L_OPERATOR_SEVEN'], composure: -3 },
  goto: 'ch3_desk',
});

// ---- The hour before the bell -----------------------------------------------
// Mandatory on every Exchange path. You are inside, nothing has happened yet,
// and there are three people in this room you have to be in front of.

node({
  id: 'ch9_hall',
  chapter: 9,
  linesOnce: true,
  lines: [
    { who: 'desc', text: 'The hall is the old switching floor with the equipment taken out, which means it is enormous and has appalling acoustics and everybody has to stand slightly closer together than they want to.' },
    { who: 'desc', text: 'Two hundred people. A table with drinks on it. A bell in a tower above all of it that will be rung at eleven on a frequency nobody has used in sixteen years.' },
    { who: 'desc', text: 'Fifty minutes. You have never in your life been in a room with the people you work on.' },
  ],
  choices: [
    {
      text: 'Cormac Vale is by the drinks table and has already seen you.',
      requires: { flags: { metValeHall: false } },
      effects: { time: -15, count: { hall: 1 }, flags: { metValeHall: true } },
      silent: true,
      goto: 'ch9_hall_vale',
    },
    {
      text: 'Ferrant, before she goes up.',
      requires: { flags: { metFerrantHall: false } },
      effects: { time: -15, count: { hall: 1 }, flags: { metFerrantHall: true } },
      silent: true,
      goto: 'ch9_hall_ferrant',
    },
    {
      text: 'Find Wren.',
      requires: { flags: { metWrenHall: false } },
      effects: { time: -15, count: { hall: 1 }, flags: { metWrenHall: true } },
      silent: true,
      goto: 'ch9_hall_wren',
    },
    {
      text: 'Stand at the back and read the room.',
      sub: 'Handlers listen. It is ninety per cent of the job.',
      requires: { flags: { readRoom: false } },
      effects: { time: -12, count: { hall: 1 }, flags: { readRoom: true }, composure: 5 },
      silent: true,
      goto: 'ch9_hall_read',
    },
    {
      text: "It's nearly eleven.",
      requires: { counts: { hall: { min: 3 } } },
      lockedText: 'You are in a room with three people who matter and you have barely spoken to them. (Needs: 3)',
      silent: true,
      goto: 'ch10_open',
    },
  ],
});

node({
  id: 'ch9_hall_vale',
  chapter: 9,
  lines: [
    { who: 'desc', text: 'He is in a good coat with a glass he is not drinking from, and he watches you come the whole way across the floor.' },
    { who: 'vale', text: 'Handler.' },
    { who: 'you', text: 'Captain.' },
    { who: 'vale', text: "Eleven radios on a road, four bodies on a terrace, a day of you walking around in the light, and here we both are at a drinks table. I've been doing this nineteen years and it always ends up being a drinks table." },
    { who: 'desc', text: 'Up close he is older than he sounds on a line, and tired in a way that is not tonight’s tiredness.' },
  ],
  choices: [
    {
      text: 'Forty-one seconds. That is how long the call from M-2 lasted.',
      requires: { anyLead: ['L_M2_CALLER', 'L_VALE_WAS_RELAY'] },
      lockedText: 'You have nothing to put to him. (Needs: the caller, or his record)',
      effects: { time: -8, exposure: 6, flags: { toldValeSeconds: true } },
      goto: 'ch9_vale_41',
    },
    {
      text: 'His name was Aurel Stanik. Did you know that, or did you only ever have the station code?',
      requires: { leads: ['L_STANIK'] },
      lockedText: 'You do not know the name of the man you are defending. (Needs: Aurel Stanik)',
      effects: { time: -8, composure: -4 },
      goto: 'ch9_vale_name',
    },
    {
      text: 'Nothing. Let him stand there with a glass he is not drinking.',
      effects: { time: -3, composure: 3 },
      goto: 'ch9_hall',
    },
  ],
});

node({
  id: 'ch9_vale_41',
  chapter: 9,
  lines: [
    { who: 'you', text: 'Forty-one seconds, inbound, 03:13, from M-2 to K-7. Then one minute later, outbound: acknowledgement.' },
    { who: 'desc', text: 'Vale does not move at all.' },
    { who: 'vale', text: 'Forty-one.' },
    { who: 'you', text: 'Forty-one.' },
    { who: 'vale', text: "I've spent sixteen years telling myself it was longer than that. That there was a conversation in it. That I argued." },
    { who: 'vale', text: "Forty-one seconds is not a conversation. It's a dictation and a yes." },
    { who: 'desc', text: 'He puts the glass down on the table, finally, having carried it around all evening.' },
    { who: 'vale', text: "He never asked me anything. Not one question. I gave him the order and he said K-7 acknowledges, relaying, and I have waited sixteen years for somebody to explain to me why that makes him the guilty one and not me." },
    { who: 'you', text: 'It does not. It never did. It makes you both people who were used, and one of you got a rank for it.' },
    { who: 'vale', text: "...Yes. That's the sentence. I've been trying to build that sentence since about year four." },
  ],
  effects: { flags: { valeCracked: true }, trust: 4 },
  goto: 'ch9_hall',
});

node({
  id: 'ch9_vale_name',
  chapter: 9,
  lines: [
    { who: 'you', text: 'Aurel Stanik. Forty-four years old. Twenty-two years on that desk, eleven of them after.' },
    { who: 'desc', text: 'Something happens in Vale’s face that you would not have predicted.' },
    { who: 'vale', text: "...Stanik." },
    { who: 'you', text: 'You did not know.' },
    { who: 'vale', text: 'I knew a station code. That is what the design is for, handler — you have been sitting in one of these rooms for six years, you know exactly what it is for.' },
    { who: 'vale', text: 'I have thought about that voice every day for sixteen years and I did not know it had a surname.' },
    { who: 'desc', text: 'He looks across a hall full of people in evening coats, at a woman of sixty-eight who is about to read out nine numbers.' },
    { who: 'vale', text: '"She does the numbers because names are harder. Everybody knows that. Nobody says it."' },
  ],
  effects: { flags: { valeCracked: true }, composure: -2 },
  goto: 'ch9_hall',
});

node({
  id: 'ch9_hall_ferrant',
  chapter: 9,
  lines: [
    { who: 'desc', text: 'She is standing on her own near the front, which you suspect is not an accident and not loneliness but preparation.' },
    { who: 'ferrant', text: 'Handler. You came.' },
    { who: 'you', text: 'You wrote me onto the list before I answered you.' },
    { who: 'ferrant', text: 'I wrote you onto the list because you were going to come whatever you said in the car, and I would rather you came through a door than a tunnel. There is a tunnel, by the way. Everyone thinks it is a secret.' },
    { who: 'desc', text: 'She checks a watch she does not need to check.' },
    { who: 'ferrant', text: "I have read these numbers sixteen times. Do you know what I have never once done?" },
    { who: 'you', text: 'Tell me.' },
    { who: 'ferrant', text: 'Got to the end of them without stopping. Every year I stop somewhere in the middle for about a second and a half, and every year the room thinks it is for effect.' },
    { who: 'ferrant', text: "It is at Seven. It has always been at Seven." },
  ],
  effects: { composure: -3 },
  goto: 'ch9_hall',
});

node({
  id: 'ch9_hall_wren',
  chapter: 9,
  branch: [
    { requires: { flags: { fullTruth: true } }, goto: 'ch9_wren_ready' },
  ],
  lines: [
    { who: 'desc', text: 'She is at the back, near a pillar, in the worst position in the room for seeing and the best one for leaving.' },
    { who: 'desc', text: 'You have been in a room with her once, or not at all, and either way she has been a voice for two days and it is still strange to watch the voice come out of a person.' },
    { who: 'wren', text: 'Two hundred people.' },
    { who: 'you', text: 'Two hundred people.' },
    { who: 'wren', text: "I have been in this building before, you know. Fourteen years old. My aunt brought me to the second one because she thought it would help." },
    { who: 'wren', text: "A woman stood up there and said 'Operator Seven' in a nice voice and everybody looked at their shoes, and I said, out loud, 'her name is Ilva', and my aunt put her hand over my mouth." },
    { who: 'desc', text: 'She says it evenly. She has clearly not told anybody this before, and is telling you now because in fifty minutes it will either matter or not.' },
    { who: 'wren', text: "So. That's why I bought a year of night shifts. It wasn't for a voice on a tape. It was for a hand over my mouth." },
  ],
  effects: { trust: 6, composure: -2 },
  goto: 'ch9_hall',
});

node({
  id: 'ch9_wren_ready',
  chapter: 9,
  lines: [
    { who: 'desc', text: 'She is at the back near a pillar, and she has been going over the whole of it in her head since you briefed her, in order, with nothing left out.' },
    { who: 'wren', text: 'Aurel Stanik had a bucket.' },
    { who: 'you', text: 'He filed a ticket about it every quarter for nineteen years.' },
    { who: 'wren', text: "That's the bit I keep coming back to. Not the nine words. The tickets." },
    { who: 'wren', text: "A man does a thing at three in the morning that puts the sky out, and then he comes back the next night and files a form about a leak, and he does that seventy-six times." },
    { who: 'you', text: 'Yes.' },
    { who: 'wren', text: "I came here to hate him and I've ended up frightened of him instead, because he's just a bloke who kept turning up." },
    { who: 'desc', text: 'She looks across two hundred people in evening coats.' },
    { who: 'wren', text: "My mother said no twice and got a number. He said yes once and got a bucket and eleven more years. And the woman who signed it gets to read the numbers out." },
    { who: 'wren', text: "Whatever happens at eleven — thank you for telling me all of it. Nobody has ever told me all of anything." },
  ],
  effects: { trust: 8, composure: 6 },
  goto: 'ch9_hall',
});

node({
  id: 'ch9_hall_read',
  chapter: 9,
  lines: [
    { who: 'desc', text: 'So you do the thing you are actually good at, which is stand still at the edge of a room with your mouth shut and find out what is in it.' },
    { who: 'desc', text: 'Four rows from the front: a woman in a good coat who arrived alone, has spoken to nobody, and is sitting four rows from the front exactly as she said she would.' },
    { who: 'desc', text: 'By the north door: two very polite men who are not drinking and who divide the room between them with their eyes every ninety seconds.' },
    { who: 'desc', text: 'At the back, if you went and got him: a man in a pressed jacket, sober, with his hands where he can see them.' },
    { who: 'desc', text: 'Near the tower stair: an Exchange technician of about sixty who will re-energise a dead band for sixty seconds at eleven, and who has done it fifteen times, and who is reading a newspaper.' },
    { who: 'desc', text: 'And two hundred people in evening coats who have come to a memorial for a thing they were told was an accident, and who will go home afterwards, and who have no idea that every single person who knows otherwise is standing in this room with them.' },
    { who: 'sys', text: '22:51' },
  ],
  effects: { leads: ['L_MEMORIAL'] },
  goto: 'ch9_hall',
});

// ---- Act I: the dead blocks -------------------------------------------------

node({
  id: 'ch2_cross',
  chapter: 2,
  effects: { loc: 'belt', signal: 'weak' },
  lines: [
    { who: 'desc', text: 'Whatever route she took, the Belt has to be crossed, and the Belt is twelve blocks of buildings that have been dark since the night the sky went out.' },
    { who: 'desc', text: 'People live here. That is the thing outsiders never believe. Four thousand of them, in blocks with no grid, no light, and no relay handshake, doing it the way people have always done it — badly, and completely.' },
    { who: 'wren', text: "There's a family on the third floor of a block with no third floor left. They've got a stove going. You can see it from the street." },
    { who: 'wren', text: 'Somebody has painted numbers on all the doors down this row. Not addresses. Dates.' },
    { who: 'you', text: 'Dates of what?' },
    { who: 'wren', text: 'Sixteen years ago, mostly. Same week. Some of them have two.' },
    { who: 'desc', text: 'The Eclipse did not only put out a sky. It put out the heating in twelve blocks in February, and somebody in each of those buildings wrote down when.' },
  ],
  goto: 'ch2_cross_beat',
});

node({
  id: 'ch2_cross_beat',
  chapter: 2,
  lines: [
    { who: 'wren', text: 'Halcyon, there are people ahead of me on the street. Six or seven. Standing.' },
    { who: 'wren', text: 'They are not moving and they are not talking and they are between me and the north edge.' },
    { who: 'desc', text: 'You have a sixteen-year-old survey map, no light, and a woman with a case that until very recently was announcing itself on an open band.' },
  ],
  timed: { seconds: 12, goto: 'ch2_cross_late' },
  choices: [
    {
      text: 'Stop. Put the case down where they can see it and let them look at you.',
      sub: 'Belt people are not a threat. They are an audience deciding something.',
      effects: { time: -14, composure: -4 },
      goto: 'ch2_cross_stop',
    },
    {
      text: 'Go round. Back a block and take the parallel street.',
      sub: 'Costs the night. Costs nothing else.',
      effects: { time: -30, composure: 3 },
      goto: 'ch2_cross_round',
    },
    {
      text: 'Straight through at a walk. Do not break stride.',
      effects: { time: -8, composure: -10 },
      goto: 'ch2_cross_through',
    },
  ],
});

node({
  id: 'ch2_cross_late',
  chapter: 2,
  lines: [
    { who: 'desc', text: 'You take too long, and she does the thing couriers do when the voice stops, which is decide.' },
    { who: 'wren', text: "going round" },
    { who: 'desc', text: 'Thirty-five minutes of a woman walking a parallel street in the dark, in silence, because she has stopped talking to you for a bit.' },
  ],
  effects: { time: -35, composure: -8, trust: -5 },
  goto: 'ch2_cross_after',
});

node({
  id: 'ch2_cross_stop',
  chapter: 2,
  lines: [
    { who: 'desc', text: 'She stops in the middle of a dark street in the Blackout Belt, puts a case down at her feet, and stands there with her hands open.' },
    { who: 'desc', text: 'Nothing happens for a long time.' },
    { who: 'wren', text: "...One of them's coming over. Old woman. Really old." },
    { who: 'other', text: '"You\'re the one with the ticking box."' },
    { who: 'wren', text: '"Not any more."' },
    { who: 'other', text: '"No. We noticed it stop. That\'s why we came out."' },
    { who: 'desc', text: 'Four thousand people with no grid and no light, who navigate by what they can hear on scav sets, and who all heard a maintenance-band pulse crossing their blocks tonight for the first time in sixteen years.' },
    { who: 'other', text: '"Last time we heard that band, the sky went out. So you\'ll understand the interest."' },
    { who: 'wren', text: '"It\'s from that night. What\'s in it is from that night."' },
    { who: 'desc', text: 'The old woman considers a courier standing in the dark with her hands open.' },
    { who: 'other', text: '"Then go the north way, not the east. Halo\'s been walking the east edge since eleven and they don\'t know we can see them."' },
  ],
  effects: { trust: 8, composure: 6, leads: ['L_BEACON'], flags: { beltHelped: true } },
  goto: 'ch2_cross_after',
});

node({
  id: 'ch2_cross_round',
  chapter: 2,
  lines: [
    { who: 'desc', text: 'Thirty minutes to go back a block and take the parallel street, which is the correct decision and costs exactly what correct decisions cost.' },
    { who: 'wren', text: 'They watched me go round. All of them turned and watched, and none of them said anything.' },
    { who: 'you', text: 'They were not going to hurt you.' },
    { who: 'wren', text: "I know. That's what's bothering me. I think they were going to tell me something." },
  ],
  goto: 'ch2_cross_after',
});

node({
  id: 'ch2_cross_through',
  chapter: 2,
  lines: [
    { who: 'desc', text: 'She walks straight down the middle of a dark street through seven people who do not move out of the way and do not stop her.' },
    { who: 'desc', text: 'Somebody says something as she passes. She does not catch it. You do not catch it either, because the link is one bar and the Belt eats everything.' },
    { who: 'wren', text: "What did she say?" },
    { who: 'you', text: "I didn't get it." },
    { who: 'wren', text: 'She said it twice, Halcyon. Somebody said something to me twice in the dark and neither of us heard it.' },
    { who: 'desc', text: 'Eight minutes saved. You will think about the thing you did not hear for a long while.' },
  ],
  effects: { flags: { missedBelt: true } },
  goto: 'ch2_cross_after',
});

node({
  id: 'ch2_cross_after',
  chapter: 2,
  lines: [
    { who: 'desc', text: 'The north edge of the Belt is a seawall and a view of a city with its lights on, which after twelve blocks of nothing looks obscene.' },
    { who: 'wren', text: 'Four thousand people back there.' },
    { who: 'you', text: 'About that.' },
    { who: 'wren', text: 'Sixteen years. And when they talk about the Eclipse on the news they talk about the satellites.' },
  ],
  effects: { composure: 3 },
  goto: 'ch2_wren_asks',
});

// ---- Act II: the interview --------------------------------------------------

node({
  id: 'ch6_interview',
  chapter: 6,
  effects: { flags: { interviewed: true }, time: -55, exposure: 6, composure: -6 },
  lines: [
    { who: 'alert', text: 'Two men, one street, no chase — there is nowhere to chase anyone to at one in the afternoon' },
    { who: 'desc', text: 'It is not an arrest. They are extremely clear about that, twice, which is how you know how carefully it has been staged.' },
    { who: 'desc', text: 'A Halo building on the Ashgate road. A room with a table in it. A jug of water nobody touches.' },
    { who: 'vale', text: "Thank you for coming." },
    { who: 'you', text: 'I was brought.' },
    { who: 'vale', text: 'You were invited by two people who would have kept inviting. Sit down.' },
    { who: 'desc', text: 'He has a folder. He does not open it, which means the folder is the point.' },
    { who: 'vale', text: "Relay handler, K-7, six years, no disciplinary record. On station the night of the incident at Ferrite Row. And since 06:40 this morning: a bar on the Rill, a house on the Verge, an archivist's stairwell." },
    { who: 'vale', text: 'Any of that wrong?' },
  ],
  choices: [
    {
      text: 'None of it is wrong. All of it is a matter of public record and none of it is an offence.',
      sub: 'Give him nothing by giving him everything.',
      effects: { time: -10, composure: 4 },
      goto: 'ch6_int_open',
    },
    {
      text: 'Say nothing at all.',
      sub: 'The handler default. It has never once failed you.',
      effects: { time: -10, exposure: 4, composure: -4 },
      goto: 'ch6_int_silent',
    },
    {
      text: "Ask him what M-2's call sign was.",
      requires: { leads: ['L_VALE_WAS_RELAY'] },
      lockedText: 'You have nothing to put to him. (Needs: Vale sat in a chair like yours)',
      effects: { time: -12, exposure: 8, flags: { confrontedVale: true } },
      goto: 'ch6_int_m2',
    },
  ],
});

node({
  id: 'ch6_int_open',
  chapter: 6,
  lines: [
    { who: 'you', text: 'I visited three people today. I walked to all of them. I did it between eleven and one, in the street, in daylight, and I did not conceal a single step of it.' },
    { who: 'vale', text: 'Why not?' },
    { who: 'you', text: 'Because a man who hides is a man you can charge with hiding. I have been on a relay desk for six years, Captain. I know exactly what the offences are, and talking to people is not one of them.' },
    { who: 'desc', text: 'Vale looks at the folder he has not opened.' },
    { who: 'vale', text: "That's the correct answer and it is enormously irritating." },
    { who: 'vale', text: 'Here is the difficulty with it. Everyone you spoke to today is now a name in this folder, and none of them were in it yesterday. You did that. Not me.' },
    { who: 'desc', text: 'Which is true, and is the actual price of a day in daylight, and he has been waiting since eleven o’clock this morning to say it to your face.' },
  ],
  goto: 'ch6_int_end',
});

node({
  id: 'ch6_int_silent',
  chapter: 6,
  lines: [
    { who: 'desc', text: 'You say nothing. It is what handlers do — you sit on a dead channel and you wait, and you are better at it than almost anyone alive.' },
    { who: 'desc', text: 'Vale waits too. He worked a desk for eleven years. He is also extremely good at it.' },
    { who: 'desc', text: 'Forty minutes pass in a room with a table and a jug of water nobody touches, and it is the longest forty minutes of the entire day, and neither of you says one word.' },
    { who: 'vale', text: "...Well. That was nostalgic." },
    { who: 'vale', text: 'You understand that silence is not actually a defence. It is just a way of spending an afternoon you did not have.' },
    { who: 'desc', text: 'He is right, and it has cost you the better part of an hour of the only daylight there is.' },
  ],
  effects: { time: -20 },
  goto: 'ch6_int_end',
});

node({
  id: 'ch6_int_m2',
  chapter: 6,
  lines: [
    { who: 'you', text: 'What was the call sign at M-2?' },
    { who: 'desc', text: 'The room does something. Not the two men by the door, who do not know what M-2 is. The room.' },
    { who: 'vale', text: '...' },
    { who: 'vale', text: 'Leave us.' },
    { who: 'desc', text: 'The two men look at each other and go, and a Halo captain sits in an interview room with a folder he has not opened and does not say anything for some time.' },
    { who: 'vale', text: 'Petrel.' },
    { who: 'you', text: 'Petrel.' },
    { who: 'vale', text: "Eleven years. It's a seabird. They're all seabirds — the whole east network was named by somebody with a book in about 1940." },
    { who: 'desc', text: 'Halcyon is a seabird too. It is also a word that means a period of calm.' },
    { who: 'vale', text: "I called K-7 at 03:13 and a man said K-7 acknowledges, relaying, and I have never in sixteen years been asked one single question about it by anybody — including, I want to be clear, by me." },
    { who: 'vale', text: 'Go home, handler.' },
    { who: 'you', text: 'No.' },
    { who: 'vale', text: "No. I didn't think so." },
  ],
  effects: { leads: ['L_M2_CALLER'], flags: { valeCracked: true }, trust: 3 },
  goto: 'ch6_int_end',
});

node({
  id: 'ch6_int_end',
  chapter: 6,
  lines: [
    { who: 'desc', text: 'They let you out onto the Ashgate road at ten past two with most of the afternoon gone.' },
    { who: 'desc', text: 'Nobody has charged you with anything. Nobody was ever going to. That was never what the room was for.' },
    { who: 'sable', text: 'Where have you BEEN.' },
    { who: 'you', text: 'In a room with a jug of water.' },
    { who: 'sable', text: "...Right. Yes. They do that. They did it to a dispatcher I knew in the third year and she lost a whole day to it and never worked out why until about a decade later." },
    { who: 'sable', text: 'The why is that you only get one day, Halcyon, and they can spend it for you.' },
  ],
  goto: 'ch6_swap',
});

// ============================================================================
// CHAPTER ELEVEN — AFTER THE BELL
// The twenty minutes nobody plans for. Whatever happened at eleven has
// happened; this is the part where you find out what it costs and who pays.
// ============================================================================

node({
  id: 'ch11_sent',
  chapter: 11,
  effects: { chapter: 11 },
  lines: [
    { who: 'sys', text: 'Chapter Eleven — After the Bell' },
    { who: 'desc', text: 'The frequency drops at 23:01 and for about four seconds the Ashgate Exchange is the quietest room in the city.' },
    { who: 'desc', text: 'Then two hundred people all start talking at once, which is a sound you have never heard before and will not forget.' },
    { who: 'desc', text: 'The technician by the tower stair has put his newspaper down. He is sixty and he has re-energised that band fifteen times for a bell, and he is looking up the stairwell with an expression of pure professional outrage.' },
    { who: 'alert', text: 'Two men moving from the north door' },
    { who: 'wren', text: "They're coming. Both of them. Not at me — at you." },
  ],
  branch: [
    { requires: { flags: { consent: 'none' } }, goto: 'ch11_sent_alone' },
  ],
  goto: 'ch11_sent_backed',
});

node({
  id: 'ch11_sent_backed',
  chapter: 11,
  lines: [
    { who: 'desc', text: 'And then the thing you did not plan for, because you spent two days planning everything else.' },
    { who: 'desc', text: 'Four rows from the front, Ammi Sarran stands up and steps into the aisle. Not dramatically. She simply moves into the space the two men need to walk through, and stops, and does not look at them.' },
    { who: 'ammi', text: '"I am a named party to the review board finding and I am speaking to the handler. You may wait."' },
    { who: 'desc', text: 'It is the single most effective use of a settlement anybody has ever managed. They are not permitted to move a named party aside at a Trust event in front of the Trust.' },
    { who: 'desc', text: 'They wait. Two Halo officers, in a hall, waiting, because a fifty-eight-year-old woman in a good coat used the only sentence she had.' },
  ],
  effects: { trust: 5 },
  goto: 'ch11_choice',
});

node({
  id: 'ch11_sent_alone',
  chapter: 11,
  lines: [
    { who: 'desc', text: 'Nobody stands up.' },
    { who: 'desc', text: 'You did not ask them, and the ones you never found are at home, and the ones you did find are watching a stranger be walked toward a north door by two men in good coats.' },
    { who: 'desc', text: 'Four rows from the front a woman looks at her hands. At the back, a man who was not sober enough to be here is not here.' },
    { who: 'desc', text: 'You get about forty metres.' },
  ],
  effects: { composure: -8 },
  goto: 'ch11_choice',
});

node({
  id: 'ch11_choice',
  chapter: 11,
  lines: [
    { who: 'wren', text: 'Halcyon. East door. NOW.' },
    { who: 'desc', text: 'There is an east door and there is a service tunnel under it and she is standing in the gap holding it open with her foot, and she has about fifteen seconds of doing that before somebody notices.' },
  ],
  timed: { seconds: 13, goto: 'ch11_taken' },
  choices: [
    {
      text: 'Go. Out the east door and into the tunnel.',
      sub: 'You are no use to anyone in a room.',
      effects: { flags: { gotOut: true } },
      goto: 'ch11_out',
    },
    {
      text: 'Stay. Somebody has to be standing here when they ask who did it.',
      sub: 'It answers the one question the broadcast leaves open.',
      effects: { flags: { stayed: true }, composure: -6, trust: 8 },
      goto: 'ch11_stay',
    },
    {
      text: 'Send her. Shut the door behind her and turn round.',
      sub: 'She is the one with a name in this. You are a call sign.',
      effects: { flags: { sentHer: true, stayed: true }, trust: 12, composure: -4 },
      goto: 'ch11_sent_her',
    },
  ],
});

node({
  id: 'ch11_taken',
  chapter: 11,
  lines: [
    { who: 'desc', text: 'You do the thing you have been doing for two days, which is take a moment too long, except this time it is your own feet you are deciding about and it turns out that is not easier.' },
    { who: 'desc', text: 'A hand on your arm, quite gently, and a voice saying something about stepping outside.' },
    { who: 'wren', text: 'HALCYON —' },
    { who: 'desc', text: 'The east door closes. Somebody has noticed her holding it.' },
  ],
  effects: { flags: { stayed: true }, composure: -10 },
  goto: 'ch11_stay',
});

node({
  id: 'ch11_out',
  chapter: 11,
  lines: [
    { who: 'desc', text: 'The service tunnel under the Ashgate Exchange has been there for ninety years and is full of cable that stopped carrying anything the night the sky went out.' },
    { who: 'desc', text: 'Two people running through it in the dark, badly, laughing in the way people do when the alternative is not available.' },
    { who: 'wren', text: "You've done this before." },
    { who: 'you', text: 'I have never done anything before. I sit in a chair.' },
    { who: 'wren', text: "You sat in a chair for six years and then you did two days." },
    { who: 'desc', text: 'It comes out on the north side, in the rain, four hundred metres from a hall in which two hundred people are all talking at once.' },
  ],
  effects: { flags: { gotOut: true } },
  goto: 'ch11_close',
});

node({
  id: 'ch11_stay',
  chapter: 11,
  lines: [
    { who: 'desc', text: 'You stay. There is a version of this where that is brave and a version where it is simply the only thing you can think of, and you will never be sure which it was.' },
    { who: 'desc', text: 'A hand on the arm. Politely. There is no scene, because there is never a scene — two hundred people watch a man walk out of a side door with two other men, and then go back to talking.' },
    { who: 'desc', text: 'On the way past the front, Odile Ferrant says something that only you hear.' },
    { who: 'ferrant', text: '"Aurel Stanik."' },
    { who: 'you', text: '...' },
    { who: 'ferrant', text: '"I wanted you to know I remembered it without being told."' },
  ],
  goto: 'ch11_close',
});

node({
  id: 'ch11_sent_her',
  chapter: 11,
  lines: [
    { who: 'you', text: 'Go.' },
    { who: 'wren', text: 'What — no. No, we both —' },
    { who: 'you', text: "Wren. You are Ilva Kestrel's daughter and there are two hundred people who just heard you say so. I am a call sign on a nameplate. If they take one of us tonight it should be the one who is interchangeable." },
    { who: 'desc', text: 'It is the truest thing you have said in two days and you have picked a terrible moment for it.' },
    { who: 'wren', text: "That's the worst sentence I've ever heard." },
    { who: 'you', text: 'It is also correct. Go.' },
    { who: 'desc', text: 'She goes. She does not want to and she does it anyway, because she has spent two days learning to do what the voice in her ear says and this is the one time you have ever been glad of it, and the one time you have ever hated it.' },
    { who: 'desc', text: 'You shut the east door and turn round into a hall full of people, and the two men are already most of the way across it.' },
  ],
  effects: { composure: -5 },
  goto: 'ch11_close',
});

node({
  id: 'ch11_close',
  chapter: 11,
  branch: [
    { requires: { flags: { consent: 'thin' } }, goto: 'end_broadcast' },
    { requires: { flags: { consent: 'none' } }, goto: 'end_broadcast' },
    { requires: { flags: { stayed: true } }, goto: 'end_handshake' },
    { goto: 'end_handshake' },
  ],
  lines: [
    { who: 'desc', text: 'Somewhere above the cloud deck, the dead satellites keep going round. They will do that for another nine hundred years whatever anybody in this building decides.' },
  ],
});

// ---- The room, without a transmitter ----------------------------------------

node({
  id: 'ch11_room',
  chapter: 11,
  effects: { chapter: 11 },
  lines: [
    { who: 'sys', text: 'Chapter Eleven — After the Bell' },
    { who: 'desc', text: 'The bell finishes. The frequency drops. It does not go anywhere, because you had nothing to put it on and no way to reach the tower, and the whole of it stays in a hall in Ashgate with two hundred people in it.' },
    { who: 'desc', text: 'Which is not nothing. It takes you about four minutes to work out that it is not nothing.' },
    { who: 'desc', text: 'Nobody goes home. That is the first sign. At a memorial people leave in a slow trickle from about the forty-minute mark, and tonight not one person has moved toward a coat.' },
    { who: 'desc', text: 'A woman from a broadsheet is talking to Teodor Reyes with a notebook out. Two members of the Trust are having a short, extremely quiet argument by the drinks. Somebody has found Ammi Sarran a chair.' },
  ],
  goto: 'ch11_room_hub',
});

node({
  id: 'ch11_room_hub',
  chapter: 11,
  linesOnce: true,
  lines: [
    { who: 'desc', text: 'Twenty minutes before anybody official arrives. Use them.' },
  ],
  choices: [
    {
      text: 'Get the names into somebody’s notebook while the room is still standing.',
      sub: 'A journalist with a shorthand pad is a transmitter of a slower kind.',
      requires: { flags: { didPress: false } },
      effects: { count: { after: 1 }, flags: { didPress: true }, trust: 5 },
      silent: true,
      goto: 'ch11_press',
    },
    {
      text: 'Ferrant. She sat down and let it happen and you want to know why.',
      requires: { flags: { didFerrantAfter: false } },
      effects: { count: { after: 1 }, flags: { didFerrantAfter: true } },
      silent: true,
      goto: 'ch11_ferrant_after',
    },
    {
      text: 'Sarran. Somebody should ask her how she is, given what she just spent.',
      requires: { flags: { ammiCommitted: true, didSarranAfter: false } },
      lockedText: 'She is not here, or never spoke. (Needs: Sarran)',
      effects: { count: { after: 1 }, flags: { didSarranAfter: true }, trust: 4 },
      silent: true,
      goto: 'ch11_sarran_after',
    },
    {
      text: 'Find Wren and get out before anybody official arrives.',
      requires: { counts: { after: { min: 2 } } },
      lockedText: 'Twenty minutes, a room that has not gone home, and you are leaving it to itself. (Needs: 2)',
      silent: true,
      goto: 'end_testimony',
    },
  ],
});

node({
  id: 'ch11_press',
  chapter: 11,
  lines: [
    { who: 'desc', text: 'The woman from the broadsheet is about thirty-five and has covered the memorial for six years, which means she has written the same nine paragraphs six times and has clearly been waiting her entire career for this.' },
    { who: 'other', text: '"Spell the operator\'s name for me."' },
    { who: 'you', text: 'Ilva Kestrel. K-E-S-T-R-E-L. Operator Seven.' },
    { who: 'other', text: '"Like the bay."' },
    { who: 'you', text: 'Like the bay.' },
    { who: 'desc', text: 'She writes it down, and then she asks for the others, and you give her Reyes and Sarran and Maddox and a man called Aurel Stanik who was not one of the nine and was never named in anything.' },
    { who: 'other', text: '"Who\'s Stanik?"' },
    { who: 'you', text: 'The handler at K-7. He acknowledged the order. He was forty-four and he had a leak over switch four and nobody has ever asked him a single question about any of it.' },
    { who: 'other', text: '"...You\'re giving me the man who said yes."' },
    { who: 'you', text: 'If the names only go one way it is not the truth, it is a better-organised version of the same thing.' },
    { who: 'desc', text: 'She looks at you for a moment, and then writes down Stanik, and underlines it.' },
  ],
  effects: { flags: { namesOut: true }, trust: 6 },
  goto: 'ch11_room_hub',
});

node({
  id: 'ch11_ferrant_after',
  chapter: 11,
  lines: [
    { who: 'desc', text: 'She is standing exactly where she was when she sat down, which is to say she has not moved in twenty minutes, in a room that has come apart around her.' },
    { who: 'you', text: 'You lifted your hand and they stopped. You could have not lifted it.' },
    { who: 'ferrant', text: 'I could have not lifted it.' },
    { who: 'you', text: 'Why.' },
    { who: 'ferrant', text: "Because I have read those numbers sixteen times and stopped at Seven every single time, and this year somebody said the rest of the sentence for me." },
    { who: 'desc', text: 'She says it without any self-pity at all, which is the thing that makes her genuinely frightening: she has priced every part of this, including this part.' },
    { who: 'ferrant', text: "I will fight the inquiry, you understand. Properly. With lawyers, and for years. I am not converted and I am not sorry in any way you would recognise." },
    { who: 'you', text: 'Then what was the hand for?' },
    { who: 'ferrant', text: '"It should cost."' },
    { who: 'ferrant', text: 'That is the whole of my position, handler. I have always thought it should cost. I simply also arranged, very carefully, for sixteen years, that it never did.' },
  ],
  effects: { flags: { ferrantSpoke: true } },
  goto: 'ch11_room_hub',
});

node({
  id: 'ch11_sarran_after',
  chapter: 11,
  lines: [
    { who: 'desc', text: 'Somebody has found her a chair and she is sitting in it in the middle of a hall, quite composed, with her hands in her lap.' },
    { who: 'you', text: 'How are you?' },
    { who: 'desc', text: 'She looks up as though it is a very unusual question, which — given that she has spent sixteen years being a number in other people’s sentences — it probably is.' },
    { who: 'ammi', text: "I have lost a house. I worked that out at about ten past eleven and I have been sitting here since, being surprised at how little I mind." },
    { who: 'ammi', text: "My daughter is twenty. She is going to be insufferable about this. She has wanted me to do it since she was fifteen and I have told her every year that she does not understand." },
    { who: 'ammi', text: '"She understood perfectly. I just could not afford to agree with her."' },
    { who: 'desc', text: 'She smooths her coat over her knees.' },
    { who: 'ammi', text: '"You said somebody would say it first. Nobody had ever said it first. That is all it needed, for sixteen years — one person, going first."' },
  ],
  effects: { trust: 5, composure: 5 },
  goto: 'ch11_room_hub',
});

// ---- The room, having said nothing ------------------------------------------

node({
  id: 'ch11_quiet',
  chapter: 11,
  effects: { chapter: 11 },
  lines: [
    { who: 'sys', text: 'Chapter Eleven — After the Bell' },
    { who: 'desc', text: 'The bell rings for sixty seconds and then stops, and the evening goes on exactly as sixteen previous evenings have gone on, because that is what you chose and it is working.' },
    { who: 'desc', text: 'People collect coats from about the forty-minute mark. Somebody near the drinks talks about the rain. Teodor Reyes, if he is here at all, is at the back with his hands where he can see them, not being walked to a car by anybody.' },
    { who: 'desc', text: 'Ammi Sarran leaves at twenty past, alone, and will go home to a house on the Verge that she still owns.' },
    { who: 'desc', text: 'Every single person you spent two days finding is going home tonight with exactly what they came in with. That is the achievement. It is real, and it is yours, and nobody will ever know about it including them.' },
  ],
  goto: 'ch11_quiet_end',
});

node({
  id: 'ch11_quiet_end',
  chapter: 11,
  lines: [
    { who: 'desc', text: 'Wren is by the east door with her coat already on.' },
    { who: 'wren', text: "I'm not going to shout at you." },
    { who: 'you', text: 'You can.' },
    { who: 'wren', text: "No, because you told me what you were going to do and I came anyway, and if I shout now I'm pretending I didn't choose to stand next to it." },
    { who: 'desc', text: 'She does up her coat. It is raining outside and it will be raining tomorrow.' },
  ],
  choices: [
    {
      text: 'Tell her the real reason. Not the argument — the reason.',
      sub: 'Sarran has a daughter. Reyes has an income. You did the arithmetic and could not make it come out.',
      effects: { trust: 8, composure: 5 },
      goto: 'ch11_quiet_real',
    },
    {
      text: 'Say nothing. She has earned not being managed.',
      effects: { trust: 3 },
      goto: 'end_ash_quiet',
    },
    {
      text: 'Tell her it can be next February. There is always a next February.',
      sub: 'Sarran is fifty-eight. Reyes drinks.',
      effects: { trust: -6, composure: -4 },
      goto: 'ch11_quiet_next',
    },
  ],
});

node({
  id: 'ch11_quiet_real',
  chapter: 11,
  lines: [
    { who: 'you', text: "I did the arithmetic about four times in that hall and it never came out." },
    { who: 'you', text: "Sarran has a daughter who grew up in a house she'd lose. Reyes has an income and nothing else. Three families would have found out tonight, in public, from a stranger, that it was deliberate." },
    { who: 'you', text: "And the only person in that room who had actually agreed to any of it was you." },
    { who: 'wren', text: 'And me.' },
    { who: 'you', text: 'And you. One. Out of everybody it happened to.' },
    { who: 'desc', text: 'She is quiet for a while.' },
    { who: 'wren', text: "I hate it. I want to be clear that I hate it." },
    { who: 'wren', text: "But I've spent a year deciding what my mother would have wanted without ever once asking anybody who knew her, and I've just watched you refuse to do that to four people, so I can't pretend I don't know what it was." },
  ],
  effects: { trust: 6 },
  goto: 'end_ash_quiet',
});

node({
  id: 'ch11_quiet_next',
  chapter: 11,
  lines: [
    { who: 'you', text: 'There is always a next February.' },
    { who: 'wren', text: 'Sarran is fifty-eight. Reyes drinks like a man with a schedule. Maddox is sixty-one and spent four days waiting to find out if a drum got through.' },
    { who: 'wren', text: 'Say it again.' },
    { who: 'desc', text: 'You do not say it again.' },
    { who: 'wren', text: "Yeah." },
    { who: 'desc', text: 'She goes out into the rain, and you stand in the doorway of the Ashgate Exchange for a while listening to a hall full of people collect their coats.' },
  ],
  goto: 'end_ash_quiet',
});

// ---- The substation ---------------------------------------------------------
// Act I spends an hour desk-side while she sits in the cold. This is her half
// of it, and it is mandatory: a handler who never asks what the room is like
// is a handler who finds out too late.

node({
  id: 'ch3b_open',
  chapter: 3,
  effects: { loc: 'substation' },
  lines: [
    { who: 'desc', text: 'You have been in an archive for an hour. She has been in a substation.' },
    { who: 'wren', text: "Talk to me. Anything. I've counted the bolts on the door twice and got different numbers." },
    { who: 'desc', text: 'Ashgate substation has been cold since the Eclipse. Metre-thick walls, one door, a transformer hall with nothing in it, and a mast on the roof that nobody got round to cutting down.' },
    { who: 'wren', text: "There's writing on the wall in here." },
    { who: 'you', text: 'Writing.' },
    { who: 'wren', text: 'Scratched. Not paint. Somebody did it with a tool, carefully, like it was going to have to last.' },
  ],
  goto: 'ch3b_wall',
});

node({
  id: 'ch3b_wall',
  chapter: 3,
  lines: [
    { who: 'wren', text: '"03:25. LOST. FOUR OF US STILL HERE."' },
    { who: 'wren', text: "And then four sets of initials, and a date, and the date is the night." },
    { who: 'desc', text: 'Three twenty-five. You have that number. It is on the burn authorisation as the execution time, if you got that far, and it is eleven minutes after a man in your chair said nine words.' },
    { who: 'wren', text: 'Four people were in this building when it happened. They stayed in it. In the dark, with the grid going down under their hands, and one of them found something to scratch with and wrote down that they were still here.' },
    { who: 'desc', text: 'Substation crews were not on the review board. They were not named, or numbered, or blamed, or compensated. They were not even mentioned; they were four people in a building that stopped working.' },
  ],
  choices: [
    {
      text: 'Get the initials. All four sets.',
      sub: 'Costs minutes. They are the only record these people have.',
      effects: { time: -14, leads: ['L_SUBSTATION_FOUR'], trust: 6, composure: 4 },
      goto: 'ch3b_initials',
    },
    {
      text: 'Leave it. It is sixteen years old and we have fifty minutes.',
      effects: { trust: -4, composure: -3 },
      goto: 'ch3b_cold',
    },
  ],
});

node({
  id: 'ch3b_initials',
  chapter: 3,
  lines: [
    { who: 'desc', text: 'It takes fourteen minutes because the light is a handset screen and the scratches are shallow and she reads each set back twice so you can write them down properly.' },
    { who: 'wren', text: 'E.T. · M.O. · R.V. · and one that’s just a shape. Might be a J.' },
    { who: 'you', text: 'Might be a J.' },
    { who: 'wren', text: "Somebody's whole name is 'might be a J'." },
    { who: 'desc', text: 'You write them into the shift log at K-7, which is the only permanent record you personally control, under the heading of a delivery that is going wrong.' },
    { who: 'wren', text: "Why are you writing them down? Nobody's asked us to." },
    { who: 'you', text: 'Because the entire problem with that night is that a great many people were not written down.' },
    { who: 'desc', text: 'She does not say anything for a second.' },
    { who: 'wren', text: "...Yeah. All right. Yeah." },
  ],
  effects: { flags: { loggedFour: true } },
  goto: 'ch3b_cold',
});

node({
  id: 'ch3b_cold',
  chapter: 3,
  lines: [
    { who: 'desc', text: 'Then the thing that actually matters, which is that it is four degrees in there and she has been still for an hour.' },
    { who: 'wren', text: "I've stopped shivering." },
    { who: 'you', text: 'How long ago.' },
    { who: 'wren', text: "Don't know. While you were on the tapes." },
    { who: 'desc', text: 'Stopping shivering is not the good news people think it is. You have sat on a relay desk for six years and half the medical training a handler gets is about people who have stopped shivering.' },
  ],
  choices: [
    {
      text: 'Get her moving. Laps of the transformer hall until she is shaking again.',
      sub: 'Undignified. Costs night. Works.',
      effects: { time: -18, composure: 14, trust: 5 },
      goto: 'ch3b_laps',
    },
    {
      text: 'Burn something. There is nothing in that hall but there is a hall.',
      sub: 'Light and smoke in a building she is hiding in.',
      effects: { time: -10, composure: 8, exposure: 4, flags: { litFire: true } },
      goto: 'ch3b_fire',
    },
    {
      text: 'She has fifty minutes left in there. Leave it.',
      effects: { composure: -12 },
      goto: 'ch3b_end',
    },
  ],
});

node({
  id: 'ch3b_laps',
  chapter: 3,
  lines: [
    { who: 'desc', text: 'Eighteen minutes of a courier doing laps of an empty transformer hall at four in the morning while a handler counts them out loud over a link, which is not in any manual and is the most useful thing either of you does all night.' },
    { who: 'wren', text: 'Forty-one. Forty-two.' },
    { who: 'you', text: 'Talk while you do it. If you can talk you are warm enough.' },
    { who: 'wren', text: "What about?" },
    { who: 'you', text: 'Anything. The bolts on the door.' },
    { who: 'wren', text: "Thirty-one. I counted again. It's thirty-one both times now, so either I've got better or I've got worse." },
    { who: 'desc', text: 'By lap sixty she is shivering properly again and complaining about it, which is the single best sound you have heard since the Row.' },
  ],
  goto: 'ch3b_end',
});

node({
  id: 'ch3b_fire',
  chapter: 3,
  lines: [
    { who: 'desc', text: 'There is nothing in a stripped transformer hall to burn except the hall itself: a wooden cable drum, a pallet, sixteen years of paper that blew in under the door.' },
    { who: 'wren', text: "It's going. God, that's better. That is so much better." },
    { who: 'desc', text: 'It is better. It is also a light source inside a building with one door, in a district where an off-books Halo team has been sweeping since eleven, and both of you know it and neither of you says it.' },
    { who: 'wren', text: "How long can I have it?" },
    { who: 'you', text: 'Ten minutes. Then it goes out and we scatter the ash.' },
    { who: 'wren', text: "Ten minutes." },
    { who: 'desc', text: 'She gets ten minutes of being warm, in a substation, with four sets of initials scratched on the wall above her.' },
  ],
  goto: 'ch3b_end',
});

node({
  id: 'ch3b_end',
  chapter: 3,
  lines: [
    { who: 'wren', text: 'Halcyon.' },
    { who: 'wren', text: 'What did you find? In the archive. You have been very careful not to say, for an hour, and you are not a careful person about most things.' },
    { who: 'desc', text: 'Which is true, and she has been sitting in a cold building working it out while counting bolts.' },
  ],
  goto: 'ch4_open',
});

// ---- The wait ---------------------------------------------------------------
// Act I's climax was a raid and an escape. The part that was missing is the
// twenty minutes before it, which is what a handler's job actually consists of.

node({
  id: 'ch4_wait',
  chapter: 4,
  lines: [
    { who: 'desc', text: 'Handshakes appear on your board the way weather appears: not all at once, just steadily more of them, in a shape that is not a coincidence.' },
    { who: 'sys', text: 'Ashgate district · static handsets · 4 · 7 · 9' },
    { who: 'desc', text: 'You have somewhere between fifteen and forty minutes. There is no way to know which, and she is inside a building with one door.' },
    { who: 'wren', text: "What do I do." },
    { who: 'desc', text: 'And here is the thing nobody tells you about this job: most of it is not the decision. Most of it is the twenty minutes before the decision, with somebody frightened on an open channel, and nothing to give them but the sound of a person who is not panicking.' },
  ],
  choices: [
    {
      text: 'Walk her through the building. Every exit, every wall, before she needs one.',
      sub: 'Costs night. She will move without thinking when it matters.',
      effects: { time: -16, composure: 8, flags: { walkedBuilding: true }, trust: 5 },
      goto: 'ch4_walk',
    },
    {
      text: 'Tell her what is actually coming, in numbers, with no softening.',
      sub: 'Frightening, and the truth, and she has asked for it all night.',
      effects: { time: -8, composure: -6, trust: 10, flags: { toldNumbers: true } },
      goto: 'ch4_numbers',
    },
    {
      text: 'Talk about nothing. Fill the channel until they arrive.',
      effects: { time: -12, composure: 10, trust: 4 },
      goto: 'ch4_nothing',
    },
  ],
});

node({
  id: 'ch4_walk',
  chapter: 4,
  lines: [
    { who: 'desc', text: 'Sixteen minutes on a survey map older than she is, walking a woman through a building you have never been inside.' },
    { who: 'you', text: 'From where you are standing: door behind you, transformer hall left, cable trench access under the floor plate at the north end — it will be a square plate, about a metre, probably seized.' },
    { who: 'wren', text: "Seized how?" },
    { who: 'you', text: 'Sixteen years of rust. You will need something to lever it and you will need to have already found the something.' },
    { who: 'desc', text: 'She finds a length of bar. She puts it next to the plate. She does not use it yet.' },
    { who: 'you', text: 'Ladder to the roof platform is on the east wall, forty rungs, and the last four are the ones that will be wrong.' },
    { who: 'wren', text: "You've never been in here." },
    { who: 'you', text: 'The last four rungs are always the ones that are wrong.' },
    { who: 'desc', text: 'By the end of it she has walked every route in the dark once, and knows where the bar is, and has stopped asking what happens if.' },
  ],
  goto: 'ch4_wait_end',
});

node({
  id: 'ch4_numbers',
  chapter: 4,
  lines: [
    { who: 'you', text: 'Eleven handsets. Nine of them stationary on the Ashgate road since four, two moving. They are a hundred metres apart, which means a line, not a search.' },
    { who: 'wren', text: 'Eleven.' },
    { who: 'you', text: 'Eleven. And they will be here somewhere between fifteen and forty minutes from now and I cannot narrow it because the board does not tell me speed.' },
    { who: 'desc', text: 'A long silence on the link.' },
    { who: 'wren', text: 'Thank you.' },
    { who: 'you', text: 'For what?' },
    { who: 'wren', text: "For the fifteen. Everyone else I've ever worked with would have said thirty and made it sound like a fact." },
    { who: 'wren', text: "You've been giving me the real number all night, even when it's worse. It's the only reason I'm still on this channel." },
  ],
  effects: { trust: 6 },
  goto: 'ch4_wait_end',
});

node({
  id: 'ch4_nothing',
  chapter: 4,
  lines: [
    { who: 'desc', text: 'So you talk about nothing for twelve minutes, which is harder than it sounds and is, on the evidence of six years, the actual skill of the job.' },
    { who: 'you', text: 'Switch four has a leak. Drips into a bucket. I change the bucket on Thursdays.' },
    { who: 'wren', text: 'Why Thursdays?' },
    { who: 'you', text: 'No reason. It was a Thursday when I started.' },
    { who: 'wren', text: "Six years of Thursdays." },
    { who: 'you', text: 'Six years of Thursdays.' },
    { who: 'wren', text: "That's the most depressing thing anybody has ever said to me and I feel considerably better, so well done." },
    { who: 'desc', text: 'Her breathing has come down. That is the whole objective and it worked, and it cost twelve minutes of a night that is running out.' },
  ],
  goto: 'ch4_wait_end',
});

node({
  id: 'ch4_wait_end',
  chapter: 4,
  branch: [
    { requires: { flags: { beaconDead: true } }, goto: 'ch4_raid_slow' },
    { goto: 'ch4_raid_fast' },
  ],
  lines: [
    { who: 'alert', text: 'Movement — the line on the Ashgate road has stopped being a line' },
  ],
});

// ---- K-7 --------------------------------------------------------------------
// Two days of a voice in an ear, and they have never been in a room together.
// She bought a year of night shifts to reach this desk. She should get to see it.

node({
  id: 'ch6_together',
  chapter: 6,
  effects: { flags: { together: true }, time: -70, exposure: 10, loc: 'relay_sealed' },
  lines: [
    { who: 'wren', text: 'I want to see it.' },
    { who: 'you', text: 'See what?' },
    { who: 'wren', text: 'The desk.' },
    { who: 'desc', text: 'There is no good operational reason to do this. It is a sealed building with a man on the door and every minute spent there is a minute in daylight in front of somebody who is writing things down.' },
    { who: 'wren', text: "I have paid for a year of night shifts to get onto that relay. I have never been inside the building. I am not going to spend the rest of my life having not looked at the room." },
    { who: 'desc', text: 'Which is, you have to concede, the only reason that was ever going to work on you.' },
  ],
  goto: 'ch6_together_in',
});

node({
  id: 'ch6_together_in',
  chapter: 6,
  lines: [
    { who: 'desc', text: 'Getting in is absurdly easy and that is its own kind of insult. Halo tape across the stairwell, a man on the door who is bored, and a goods entrance on the north side that has not been locked since the Authority stopped existing.' },
    { who: 'desc', text: 'Nine floors of dead switchgear. And then the room.' },
    { who: 'desc', text: 'You have worked in it for six years and you watch somebody see it for the first time, which turns out to be a completely different room.' },
    { who: 'wren', text: "It's small." },
    { who: 'you', text: 'Yes.' },
    { who: 'wren', text: "It's really small. I had it about four times this size." },
    { who: 'desc', text: 'Nine dead channels. One live one, currently dead too. A chair. A nameplate screwed into the desk with HALCYON on it in a typeface that stopped being made before the Eclipse.' },
    { who: 'desc', text: 'And a bucket under switch four, with about two inches of water in it, because it is Wednesday.' },
  ],
  goto: 'ch6_together_hub',
});

node({
  id: 'ch6_together_hub',
  chapter: 6,
  linesOnce: true,
  lines: [
    { who: 'desc', text: 'She stands in the middle of it with her hands in her pockets and does not touch anything.' },
  ],
  choices: [
    {
      text: 'Tell her to sit in it.',
      sub: 'It is a chair. That is the entire point and also the entire problem.',
      requires: { flags: { satInIt: false } },
      effects: { flags: { satInIt: true }, time: -10, trust: 8 },
      goto: 'ch6_together_sit',
    },
    {
      text: 'Show her the bucket.',
      requires: { leads: ['L_STANIK'], flags: { showedBucket: false } },
      lockedText: 'It is a bucket. You have no reason to think it means anything. (Needs: Aurel Stanik)',
      effects: { flags: { showedBucket: true }, time: -12, trust: 6, composure: -4 },
      goto: 'ch6_together_bucket',
    },
    {
      text: 'Play her the nine words.',
      sub: 'She has never heard them. She has spent a year looking for them.',
      requires: { leads: ['L_BURN_LOG'], flags: { playedTape: false } },
      lockedText: 'You never got the tape off the spool. (Needs: The burn relay)',
      effects: { flags: { playedTape: true }, time: -14, trust: 12, composure: -10 },
      goto: 'ch6_together_tape',
    },
    {
      text: 'We should not be in this building. Out.',
      silent: true,
      effects: { time: -8 },
      goto: 'ch6_together_out',
    },
  ],
});

node({
  id: 'ch6_together_sit',
  chapter: 6,
  lines: [
    { who: 'you', text: 'Sit in it.' },
    { who: 'wren', text: 'No.' },
    { who: 'you', text: 'Wren. Sit in the chair.' },
    { who: 'desc', text: 'She sits in the chair.' },
    { who: 'desc', text: 'It is a chair. It has a worn patch on the left arm where twenty-two years of one man and six years of another put their elbow, and it is four degrees colder in this building than outside, and she sits in it and looks at nine dead channels.' },
    { who: 'wren', text: "...It's just a room." },
    { who: 'you', text: 'It is just a room.' },
    { who: 'wren', text: "I have hated this room for a year. I have been angry at a room." },
    { who: 'desc', text: 'She puts her hands on the desk, flat, either side of the nameplate.' },
    { who: 'wren', text: "He sat here and said nine words and then he sat here for eleven more years. And you sat here for six. And I've been paying a dispatcher every month to get me into this chair, and now I'm in it, and it's just a chair, and the thing I wanted isn't in the room." },
    { who: 'you', text: 'No.' },
    { who: 'wren', text: "Where is it, then." },
    { who: 'you', text: "In a hall in Ashgate at eleven o'clock tonight, with everybody it happened to standing in it." },
  ],
  effects: { composure: 6 },
  goto: 'ch6_together_hub',
});

node({
  id: 'ch6_together_bucket',
  chapter: 6,
  lines: [
    { who: 'you', text: 'Look at the bucket.' },
    { who: 'wren', text: "It's a bucket." },
    { who: 'you', text: 'Nineteen years of maintenance tickets. Every quarter. "Water ingress above switch four." Never once actioned. He filed it seventy-six times.' },
    { who: 'desc', text: 'She looks at a bucket with two inches of water in it for a long time.' },
    { who: 'wren', text: "Seventy-six." },
    { who: 'you', text: 'And then I inherited it, and I put a bucket under it in my second week, and I have changed it on Thursdays for six years and never once asked how long it had been leaking.' },
    { who: 'wren', text: "That's the bit, isn't it. That's the actual bit." },
    { who: 'wren', text: "He kept filing the ticket. He did the one thing he was allowed to do, seventy-six times, and nobody came. And you stopped filing it and just emptied the bucket." },
    { who: 'desc', text: 'There is no answer to that. You have been turning it over since two o’clock this morning and there is no answer to it.' },
    { who: 'wren', text: "I'm not having a go at you." },
    { who: 'you', text: 'I know. It would be easier if you were.' },
  ],
  goto: 'ch6_together_hub',
});

node({
  id: 'ch6_together_tape',
  chapter: 6,
  lines: [
    { who: 'desc', text: 'Sable brought four spools out of this building at five-forty this morning, and one of them has eleven minutes of the worst night in this city on it, and there is a deck in this room that can still read them.' },
    { who: 'you', text: 'You do not have to hear this.' },
    { who: 'wren', text: 'Put it on.' },
    { who: 'desc', text: 'Spooling. Hiss. Sixteen years of degradation on a physical medium in a cold room.' },
    { who: 'other', text: '"— array burn is authorised, confirm and relay."' },
    { who: 'other', text: '"Operator Seven refuses. Twice. Go around her."' },
    { who: 'desc', text: 'And then the third voice. Tired, flat, close to the microphone.' },
    { who: 'other', text: '"K-7 acknowledges. Relaying."' },
    { who: 'desc', text: 'The tape runs on into hiss. Neither of you stops it for about forty seconds.' },
    { who: 'wren', text: "That's it." },
    { who: 'you', text: "That's it." },
    { who: 'wren', text: "A year. And it's nine words in a tired voice and he sounds — " },
    { who: 'desc', text: 'She stops. Starts again.' },
    { who: 'wren', text: "He sounds like you do at four in the morning. He sounds exactly like you do at four in the morning." },
    { who: 'desc', text: 'The tape hisses. Somewhere above the cloud deck the dead satellites keep going round.' },
    { who: 'wren', text: "I don't want it to be a tired man in a small room. I've wanted it to be somebody for a year." },
    { who: 'you', text: "It is also a woman who signed the authorisation, and a captain who made the call, and nine people who took the blame for both of them. It is allowed to be all of that." },
    { who: 'wren', text: "Yeah." },
    { who: 'wren', text: "Yeah, all right. Turn it off." },
  ],
  effects: { flags: { heardTapeTogether: true } },
  goto: 'ch6_together_hub',
});

node({
  id: 'ch6_together_out',
  chapter: 6,
  lines: [
    { who: 'desc', text: 'You are eleven minutes over any sensible estimate and there is a man on the door and daylight outside, and you go down nine floors of dead switchgear rather faster than you came up them.' },
    { who: 'wren', text: 'Halcyon.' },
    { who: 'wren', text: "Thank you for taking me in there. It was a stupid thing to do and I'd have spent the rest of my life on it." },
    { who: 'desc', text: 'Out through the goods entrance into the grey, with the whole afternoon gone and the memorial at eleven.' },
  ],
  effects: { trust: 6, composure: 5 },
  goto: 'ch6_hub',
});

// ---- The tower --------------------------------------------------------------

node({
  id: 'ch10_tower_top',
  chapter: 10,
  lines: [
    { who: 'desc', text: 'The platform under the bell is a steel grating four feet square and the bell is being rung eight feet above it, and the noise is not a sound at that range, it is a physical condition.' },
    { who: 'desc', text: 'You cannot hear the handset. You cannot hear yourself. You get the drum onto the feed head by touch and by counting, because counting is the only thing that survives up there.' },
    { who: 'wren', text: '[unreadable]' },
    { who: 'sys', text: 'Link — carrier only — acoustic floor exceeded' },
    { who: 'desc', text: 'Forty seconds. Thirty. A brass junction older than the Authority, two contacts, and a woman somewhere below you in a hall full of people in evening coats who has no idea whether it has worked.' },
  ],
  goto: 'ch10_tower_last',
});

node({
  id: 'ch10_tower_last',
  chapter: 10,
  lines: [
    { who: 'desc', text: 'And then it is done, and the bell stops, and the silence afterwards is so complete that you can hear the drum spinning down on the feed head.' },
    { who: 'desc', text: 'You stand on a grating forty feet above the Ashgate Exchange with your hands shaking and the certain knowledge that sixteen years of somebody else’s telemetry has just gone into every receiver in Kestrel Bay.' },
    { who: 'desc', text: 'You did not ask anybody. There was not time, and you did not make time, and both of those are true at once and will go on being true.' },
    { who: 'wren', text: 'Halcyon. Halcyon, come down. Now. They know where the stair is.' },
  ],
  effects: { composure: -4 },
  goto: 'ch11_sent',
});

// ---- Vale, at the moment it matters -----------------------------------------

node({
  id: 'ch10_vale_moment',
  chapter: 10,
  lines: [
    { who: 'desc', text: 'You get as far as drawing breath.' },
    { who: 'desc', text: 'Cormac Vale has crossed the floor. He is four feet away, between you and the front of the hall, and he has been a Halo captain for fifteen years and this is the part of his job he is unambiguously good at.' },
    { who: 'vale', text: '"Don\'t."' },
  ],
  branch: [
    { requires: { flags: { valeCracked: true } }, goto: 'ch10_vale_stands_down' },
    { goto: 'ch10_vale_blocks' },
  ],
});

node({
  id: 'ch10_vale_stands_down',
  chapter: 10,
  lines: [
    { who: 'desc', text: 'And then he does not do anything else.' },
    { who: 'desc', text: 'That is the whole of it. A man who has spent two days competently arranging eleven radios on a road and four bodies on a terrace stands four feet away with his hands at his sides and does not do the next thing.' },
    { who: 'you', text: 'Forty-one seconds.' },
    { who: 'vale', text: '"...Yes."' },
    { who: 'you', text: 'Aurel Stanik.' },
    { who: 'desc', text: 'Something in his face that you would not have predicted two nights ago on a channel you had never used.' },
    { who: 'vale', text: '"Say the name in the room. Not just the numbers. If you only say the numbers it is the same evening it has always been."' },
    { who: 'desc', text: 'He steps aside. Not dramatically — he simply is not standing where he was, and the front of the hall is open, and two very polite men by the north door look at their captain and do not move because he has not told them to.' },
    { who: 'vale', text: '"For the record, handler, I have wanted somebody to do this for sixteen years and I have arrested four people for trying."' },
  ],
  effects: { flags: { valeStoodDown: true }, trust: 6 },
  goto: 'ch10_question',
});

node({
  id: 'ch10_vale_blocks',
  chapter: 10,
  lines: [
    { who: 'desc', text: 'He does the next thing, because nobody has ever given him a reason not to and you never found the one that existed.' },
    { who: 'vale', text: '"There is a side room and a conversation and it can happen quietly. Or there is this, in front of two hundred people, and it happens loudly and it ends the same way."' },
    { who: 'desc', text: 'Thirty seconds of live frequency over a roof and a man with fifteen years of practice standing in the way of it.' },
  ],
  choices: [
    {
      text: 'You worked a relay desk for eleven years. M-2. You made the call.',
      sub: 'The only thing you have that is not evidence.',
      requires: { anyLead: ['L_VALE_WAS_RELAY', 'L_M2_CALLER'] },
      lockedText: 'You never found out what he was before Halo. (Needs: Vale sat in a chair like yours)',
      effects: { flags: { valeStoodDown: true }, composure: -4 },
      goto: 'ch10_vale_late_crack',
    },
    {
      text: 'Go round him. Say it to the room over his shoulder.',
      sub: 'He is one man and the room is two hundred.',
      effects: { composure: -8, exposure: 10 },
      goto: 'ch10_round_him',
    },
    {
      text: 'Take the side room. There will be another February.',
      effects: { flags: { plan3: 'stand_down' }, trust: -12, composure: -6 },
      goto: 'ch10_stand_down',
    },
  ],
});

node({
  id: 'ch10_vale_late_crack',
  chapter: 10,
  lines: [
    { who: 'you', text: 'Station M-2. Eleven years. You left the month after and walked into the people who benefited.' },
    { who: 'you', text: 'You called K-7 at 03:13 and a tired man said nine words and you have been arresting people about it ever since.' },
    { who: 'desc', text: 'Two hundred people in evening coats are watching a Halo captain be told something in the middle of a floor.' },
    { who: 'vale', text: '"...You had all day to say that and you said it now."' },
    { who: 'you', text: 'I said it now because now is when it is worth something.' },
    { who: 'desc', text: 'He looks at the front of the hall. At Ferrant. At a woman four rows from the front with her hands in her lap.' },
    { who: 'vale', text: '"Twenty seconds."' },
    { who: 'desc', text: 'And he is not standing where he was.' },
  ],
  effects: { trust: 5 },
  goto: 'ch10_question',
});

node({
  id: 'ch10_round_him',
  chapter: 10,
  lines: [
    { who: 'desc', text: 'You go round him, which works for about four steps, because a hall is large and one man cannot cover it and he was never actually going to put hands on you in front of the Trust.' },
    { who: 'desc', text: 'What it costs is the thing you did not think about: the two very polite men by the north door start moving the moment their captain has to move, and now everybody in the room is watching three men converge instead of listening to a question.' },
    { who: 'desc', text: 'You get the question out. You get all of it out. You are simply not, by then, the most interesting thing happening in the room.' },
  ],
  effects: { composure: -6, flags: { messyFloor: true } },
  goto: 'ch10_question',
});

// ---- Ferrite Row ------------------------------------------------------------
// Whichever way she came down, she arrives somewhere, and the somewhere is a
// place four thousand people live in that nobody in this city thinks about.

node({
  id: 'ch1_row',
  chapter: 1,
  effects: { loc: 'ferrite' },
  lines: [
    { who: 'desc', text: 'Ferrite Row is six salvage terraces cut into the hill under the old freight line, built out of whatever the city stopped wanting, in the order it stopped wanting it.' },
    { who: 'wren', text: "Second terrace. There's a woman selling soup out of a pressure vessel." },
    { who: 'wren', text: 'At half past midnight. To a queue.' },
    { who: 'desc', text: 'Night shifts. Half this district works nights because half this district works the docks, and the docks run on a tide, and a tide does not care that there has been no sky for sixteen years.' },
    { who: 'wren', text: "Everyone's looking at me." },
    { who: 'you', text: 'Everyone is looking at anybody who is walking through at half past midnight and not queuing for soup.' },
    { who: 'wren', text: "That's not comforting." },
    { who: 'you', text: 'It was not meant to be comforting, it was meant to be accurate. Those are different services.' },
    { who: 'wren', text: "...Fine. Fair." },
  ],
  choices: [
    {
      text: 'Have her queue for the soup.',
      sub: 'Three minutes of being a person in a queue instead of a courier walking through.',
      effects: { time: -12, composure: 12, trust: 6, flags: { hadSoup: true } },
      goto: 'ch1_row_soup',
    },
    {
      text: 'Ask somebody in the queue who has been up on the third terrace tonight.',
      sub: 'The Row watches the Row. Costs a little standing still.',
      effects: { time: -15, leads: ['L_ROUTE_LEAK'], composure: -3 },
      goto: 'ch1_row_ask',
    },
    {
      text: 'Straight past. The drop is four minutes away.',
      effects: { composure: -5 },
      goto: 'ch1_drop',
    },
  ],
});

node({
  id: 'ch1_row_soup',
  chapter: 1,
  lines: [
    { who: 'desc', text: 'She queues. It takes three minutes and costs almost nothing and she stands in a line of dock workers on a salvage terrace being nobody in particular.' },
    { who: 'wren', text: "It's terrible soup." },
    { who: 'you', text: 'It is always terrible soup.' },
    { who: 'wren', text: "It's so much better than not having it." },
    { who: 'desc', text: 'Her breathing has come right down. Nine minutes ago she was walking through a district convinced everybody in it was looking at her, and now she is a person in a queue complaining about soup.' },
    { who: 'desc', text: 'This is a thing you learned in your second year and have never been able to explain to anybody: most of what goes wrong on a courier run goes wrong because somebody has been alone and moving for too long.' },
    { who: 'wren', text: 'Right. Third terrace.' },
    { who: 'you', text: 'Third terrace.' },
  ],
  goto: 'ch1_drop',
});

node({
  id: 'ch1_row_ask',
  chapter: 1,
  lines: [
    { who: 'desc', text: 'The Row watches the Row. That is not solidarity, it is simply that when there is no grid and no light there is nothing else to do with an evening.' },
    { who: 'wren', text: 'Asked the soup woman. She says four men went up to the third terrace about an hour ago and have not come down.' },
    { who: 'you', text: 'An hour.' },
    { who: 'wren', text: "An hour. She says they went up in a car and she noticed because nobody drives onto the terraces, there's nowhere to put a car." },
    { who: 'desc', text: 'An hour ago she was on a stair, or in a canal, or on the freight line — and four men were already parked above a dead drop that only three parties knew the address of.' },
    { who: 'wren', text: "Halcyon. They were there before I picked a route." },
    { who: 'you', text: 'Yes.' },
    { who: 'wren', text: "Then it doesn't matter which way I came. It was never about the route." },
    { who: 'desc', text: 'Which is the first genuinely useful thing either of you has established tonight, and it cost fifteen minutes and a conversation with a woman selling soup.' },
  ],
  effects: { flags: { knewWaiting: true }, trust: 5 },
  goto: 'ch1_drop',
});

// ---- Off the Row ------------------------------------------------------------

node({
  id: 'ch2_offrow',
  chapter: 2,
  lines: [
    { who: 'desc', text: 'Getting off Ferrite Row after something has happened on it is a different problem from getting onto it, because the Row now knows.' },
    { who: 'wren', text: "Nobody's looking at me." },
    { who: 'you', text: 'Nobody at all?' },
    { who: 'wren', text: "Nobody. Second terrace, twenty people, and every single one of them is looking somewhere else. The soup woman has turned her back." },
    { who: 'desc', text: 'That is not indifference. That is the most sophisticated thing a district like this does: two hundred people simultaneously deciding to have seen nothing, in the four minutes after four men in a car came down off a terrace.' },
    { who: 'wren', text: "It's horrible. It's like walking through a photograph." },
    { who: 'you', text: 'It is the only protection they have and they are giving you the benefit of it.' },
    { who: 'desc', text: 'A child on the third step down watches her go past without any of that discipline at all, the way children do, and then an adult hand comes out and turns the child around by the shoulder.' },
    { who: 'wren', text: 'Right.' },
    { who: 'wren', text: "Sixteen years of this. This is what sixteen years of it makes." },
  ],
  effects: { composure: -4, trust: 3 },
  goto: 'ch3_open',
});

// ---- The city on memorial night ---------------------------------------------

node({
  id: 'ch8_approach',
  chapter: 8,
  effects: { chapter: 8 },
  lines: [
    { who: 'desc', text: 'Kestrel Bay on the night of the memorial does a thing it does no other night of the year, and you have worked through sixteen of them without once seeing it, because you have always been in a room with nine dead channels.' },
    { who: 'desc', text: 'People put lights in windows. Not many, and not everywhere — but in the Belt, where there is no grid to put them on, there are four thousand windows with something burning in them.' },
    { who: 'wren', text: "The Rill's got them all the way down. Candles, mostly. Somebody's rigged a whole string off a scav cell." },
    { who: 'wren', text: "Nobody organises it. There's no committee. They just do it." },
    { who: 'desc', text: 'The Trust holds an event in a hall for two hundred people in evening coats, and the city holds this, and the two have never once acknowledged each other.' },
  ],
  goto: 'ch8_approach_two',
});

node({
  id: 'ch8_approach_two',
  chapter: 8,
  lines: [
    { who: 'desc', text: 'The tram out to Ashgate is full and nobody is talking much. A man opposite has a paper folded to the memorial notice and has not turned the page in four stops.' },
    { who: 'wren', text: 'Halcyon. Can I ask you something that is not about tonight.' },
    { who: 'you', text: 'Go on.' },
    { who: 'wren', text: 'Why did you take the night shift? Six years. Nobody takes six years of nights unless something is wrong with the day.' },
  ],
  choices: [
    {
      text: 'Because nothing happens at night and I wanted nothing to happen.',
      sub: 'The true one.',
      effects: { trust: 8, composure: 4 },
      goto: 'ch8_approach_answer',
    },
    {
      text: 'Because somebody has to be on the channel when it is three in the morning.',
      sub: 'Also true, and the version that survives being repeated.',
      effects: { trust: 4 },
      goto: 'ch8_approach_answer',
    },
    {
      text: "That's not a question for a tram.",
      effects: { trust: -4, composure: -3 },
      goto: 'ch8_approach_answer',
    },
  ],
});

node({
  id: 'ch8_approach_answer',
  chapter: 8,
  lines: [
    { who: 'wren', text: 'Right.' },
    { who: 'desc', text: 'Four more stops. The lights in the Belt windows go past in the dark, in ones and twos, all the way out to the water.' },
    { who: 'wren', text: "For what it's worth — and I've had two days to think about this and I'm only going to say it once —" },
    { who: 'wren', text: "The reason I bought a year of night shifts wasn't only my mother. It was that somebody answered. Every time. Whatever desk I got, whatever hour, there was always a voice, and it was always somebody who'd chosen to be awake in a room by themselves for the benefit of people they'd never meet." },
    { who: 'wren', text: "I've spent a year being furious at a job that is, when you look at it, four hundred people volunteering to be alone so that couriers aren't." },
    { who: 'desc', text: 'The tram comes round the headland and the Ashgate Exchange is lit up on the point, with its tower and its bell, the only building in the district with all its windows on.' },
    { who: 'wren', text: "Anyway. That's the last nice thing I'm saying to you tonight." },
  ],
  effects: { trust: 6, composure: 6 },
  goto: 'ch9_open',
});

node({
  id: 'ch5_out',
  chapter: 5,
  lines: [
    { who: 'desc', text: 'Sable leaves at ten past ten with her coat collar up, in daylight, from a flat she has never been to before, carrying nothing — because she came carrying everything and put it on your table.' },
    { who: 'sable', text: 'One thing and then I have to be on a dispatch board pretending today is normal.' },
    { who: 'sable', text: "I have run that relay for nineteen years. In that time I have lost four couriers. Two to the water, one to a stairwell, one nobody ever found." },
    { who: 'you', text: 'I know.' },
    { who: 'sable', text: "You don't, actually, because you have never had to make the call to anybody. Handlers hear it happen. Dispatchers do the afterwards." },
    { who: 'desc', text: 'She does up her coat.' },
    { who: 'sable', text: "I took a courier's money for a year to put her in front of your desk and I never told her what the desk was. Whatever today turns into, I want it on the record between us that I know exactly what I did." },
    { who: 'you', text: 'She knows too. Or she will, because I am going to tell her.' },
    { who: 'sable', text: '...Good. That is the correct answer and I was hoping very much that you would not give it.' },
  ],
  effects: { flags: { sableConfessed: true }, trust: 4 },
  goto: 'ch6_open',
});

node({
  id: 'ch6_news',
  chapter: 6,
  effects: { flags: { sawMorning: true }, time: -20, composure: 3 },
  lines: [
    { who: 'desc', text: 'Kestrel Bay at eleven in the morning, which you have seen perhaps forty times in six years and never once while it mattered.' },
    { who: 'desc', text: 'Trams. A queue outside a bakery. Two hundred thousand people going about a Wednesday.' },
  ],
  branch: [
    { requires: { flags: { act1: 'broadcast' } }, goto: 'ch6_news_broadcast' },
    { requires: { flags: { act1: 'burned' } }, goto: 'ch6_news_burned' },
    { goto: 'ch6_news_quiet' },
  ],
});

node({
  id: 'ch6_news_broadcast',
  chapter: 6,
  lines: [
    { who: 'desc', text: 'And every third person is talking about the noise their radio made at five in the morning.' },
    { who: 'other', text: '"— woke the whole street. Mine came on by itself. It hasn\'t worked in nine years."' },
    { who: 'other', text: '"They\'re saying it was a fault at the relay."' },
    { who: 'other', text: '"It was numbers. I wrote some down."' },
    { who: 'desc', text: 'Somebody wrote some down. In a city of two hundred thousand, on a Wednesday morning, somebody heard a wall of sixteen-year-old telemetry and got a pen.' },
    { who: 'desc', text: 'By the bakery there is a man with a scav set on a folding table who has been recording the relay band as a hobby for eleven years, and who has a queue.' },
    { who: 'desc', text: 'It is not an inquiry. It is not even a story yet. But it is the first time in sixteen years that this city has been curious out loud, in the street, in daylight.' },
    { who: 'sable', text: "Halcyon. Don't go near him." },
    { who: 'you', text: "I'm not going near him." },
    { who: 'sable', text: "You're standing forty feet away looking at him with your whole face." },
  ],
  effects: { trust: 4, exposure: 4 },
  goto: 'ch6_hub',
});

node({
  id: 'ch6_news_burned',
  chapter: 6,
  lines: [
    { who: 'desc', text: 'And nothing has happened. That is the thing about it. A courier was taken off a road at ten to five and the city has no idea and would not care.' },
    { who: 'desc', text: 'The bakery queue. The trams. Two hundred thousand people on a Wednesday, and somewhere in a building on the Ashgate road a woman is sitting in a holding cell on a transport charge with a bail figure set to the exact amount she was paid.' },
    { who: 'desc', text: 'You stand in a street for a while and find that you have to put your hand on a railing.' },
    { who: 'sable', text: 'Halcyon.' },
    { who: 'you', text: "I'm here." },
    { who: 'sable', text: "You've gone quiet in a way I don't like and I have known you six years." },
    { who: 'you', text: 'Nobody knows. She is in a cell and the entire city is buying bread.' },
    { who: 'sable', text: "Yes. That's what they count on. That has always been what they count on." },
  ],
  effects: { composure: -3, trust: 2 },
  goto: 'ch6_hub',
});

node({
  id: 'ch6_news_quiet',
  chapter: 6,
  lines: [
    { who: 'desc', text: 'And nothing whatsoever has happened, which you had not emotionally prepared for.' },
    { who: 'desc', text: 'Somewhere a drum is in an evidence locker, or forty metres down under the Ashgate apron, and there is no version of this morning in which anybody queuing for bread finds out about either.' },
    { who: 'desc', text: 'The memorial posters are up at every tram stop. They have been up for a month. Nobody looks at them; they are part of the furniture of February in this city, like the weather and the dark.' },
    { who: 'desc', text: 'You stand at a tram stop reading one properly for the first time in six years.' },
    { who: 'sys', text: 'THE SIXTEENTH ECLIPSE MEMORIAL · Ashgate Exchange · 23:00' },
    { who: 'desc', text: 'Sixteen. You were in the chair for six of them and did not once go.' },
  ],
  effects: { composure: -2 },
  goto: 'ch6_hub',
});

// ============================================================================
// PROLOGUE — SHIFT START
// Six years of this room before the night that matters. The bucket, the nine
// dead channels and the nameplate all pay off later; they should be established
// by somebody who has stopped noticing them.
// ============================================================================

node({
  id: 'ch0_open',
  chapter: 1,
  effects: { loc: 'relay', signal: 'clear' },
  lines: [
    { who: 'sys', text: 'Relay K-7 · Night shift · Handle: HALCYON' },
    { who: 'sys', text: '19:30 · grid-up in 9h 20m' },
    { who: 'desc', text: 'Nine floors of dead switchgear and one working chair.' },
    { who: 'desc', text: 'The relay service ran forty stations across Kestrel Bay before the Eclipse. It runs eleven now, and four of those are automated, and K-7 is kept because somebody has to handle the Belt and nobody else will take the shift.' },
    { who: 'desc', text: 'You take the shift. You have taken it for six years.' },
    { who: 'desc', text: 'The room: a board with nine channels on it, of which one has carried anything in living memory. A tape cabinet nobody has opened since the handover. A nameplate screwed into the desk with your call sign on it in a typeface that stopped being made before you were born.' },
    { who: 'desc', text: 'And a bucket under switch four, with about two inches of water in it.' },
  ],
  goto: 'ch0_room',
});

node({
  id: 'ch0_room',
  chapter: 1,
  linesOnce: true,
  lines: [
    { who: 'desc', text: 'Forty minutes before anything happens. There is always forty minutes before anything happens; it is most of the job.' },
  ],
  choices: [
    {
      text: 'Change the bucket.',
      sub: 'It is Thursday.',
      requires: { flags: { didBucket: false } },
      effects: { time: -6, count: { shift: 1 }, flags: { didBucket: true } },
      silent: true,
      goto: 'ch0_bucket',
    },
    {
      text: 'Run the channel checks.',
      sub: 'Nine of them. Eight will be dead. They were dead yesterday.',
      requires: { flags: { didChecks: false } },
      effects: { time: -8, count: { shift: 1 }, flags: { didChecks: true } },
      silent: true,
      goto: 'ch0_checks',
    },
    {
      text: 'Read the rota for the week.',
      requires: { flags: { didRota: false } },
      effects: { time: -7, count: { shift: 1 }, flags: { didRota: true } },
      silent: true,
      goto: 'ch0_rota',
    },
    {
      text: 'Sit down and wait for the channel to do something.',
      requires: { counts: { shift: { min: 2 } } },
      lockedText: 'You have been in the chair four minutes and you are already waiting. (Needs: start the shift properly)',
      silent: true,
      goto: 'ch0_wait',
    },
  ],
});

node({
  id: 'ch0_bucket',
  chapter: 1,
  lines: [
    { who: 'desc', text: 'The bucket goes down the stair to the ninth-floor sluice, gets emptied, and comes back. Two inches. It is always about two inches.' },
    { who: 'desc', text: 'You put it back under switch four without measuring, because six years ago you worked out exactly where it goes and you have not thought about it since.' },
    { who: 'desc', text: 'There is a stain on the concrete around it, a wide pale ring, considerably older than six years.' },
    { who: 'desc', text: 'You have never once wondered how long it has been leaking.' },
  ],
  goto: 'ch0_room',
});

node({
  id: 'ch0_checks',
  chapter: 1,
  lines: [
    { who: 'desc', text: 'Nine channels. You raise each one in order, the way the procedure card on the wall says to, and the procedure card is laminated and yellow and has a phone number on it for an authority that no longer exists.' },
    { who: 'sys', text: 'CH 1 — carrier only · CH 2 — no carrier · CH 3 — no carrier' },
    { who: 'sys', text: 'CH 4 — READY · CH 5 — no carrier · CH 6 — no carrier' },
    { who: 'sys', text: 'CH 7 — no carrier · CH 8 — no carrier · CH 9 — no carrier' },
    { who: 'desc', text: 'Channel one has a carrier and nothing else. It is the line the building came with; it has not rung in your six years and you have stopped expecting it to.' },
    { who: 'desc', text: 'Channel four is the courier band. Channel four is the job.' },
    { who: 'desc', text: 'The other seven have been dead since before the Eclipse, and you check them every night anyway, because the card says to and because a handler who stops checking is a handler who has started leaving.' },
  ],
  goto: 'ch0_room',
});

node({
  id: 'ch0_rota',
  chapter: 1,
  lines: [
    { who: 'desc', text: 'Dispatch pushes the week out at dusk. It is four lines long and it has been substantially the same four lines for six years.' },
    { who: 'sys', text: 'K-7 · NIGHTS · HALCYON · Mon-Sat' },
    { who: 'desc', text: 'Then, at the bottom, in the amendments field, which is normally empty:' },
    { who: 'sys', text: 'AMENDED 19:10 — rota rebuilt — see dispatch' },
    { who: 'desc', text: 'Sable has torn the week up and rebuilt it twenty minutes before your shift, which in six years she has not done once.' },
  ],
  choices: [
    {
      text: 'Raise dispatch and ask about it.',
      effects: { time: -9, trust: 2, flags: { askedRota: true } },
      goto: 'ch0_sable',
    },
    {
      text: 'Leave it. Rotas change.',
      sub: 'They do not, in fact, change.',
      effects: { composure: 2 },
      goto: 'ch0_room',
    },
  ],
});

node({
  id: 'ch0_sable',
  chapter: 1,
  lines: [
    { who: 'sable', text: 'Dispatch.' },
    { who: 'you', text: 'You rebuilt the week at ten past seven.' },
    { who: 'sable', text: 'I did.' },
    { who: 'you', text: 'Why?' },
    { who: 'desc', text: 'Typing. Sable types when she is deciding how much to say, and you have known that about her for six years and have never once found it useful until tonight.' },
    { who: 'sable', text: 'Moved three handlers. Opened a desk. Nothing that affects you.' },
    { who: 'you', text: 'It opened my desk, Sable.' },
    { who: 'sable', text: "Your desk was already open, you're on it Monday to Saturday. Go and check your channels." },
    { who: 'desc', text: 'The line closes. It is the first time in six years that a dispatcher has hung up on you, and you sit there for a moment in a room with nine channels and a bucket, being mildly insulted, having learned something you will not understand for another eleven hours.' },
  ],
  effects: { flags: { sableOdd: true } },
  goto: 'ch0_room',
});

node({
  id: 'ch0_wait',
  chapter: 1,
  lines: [
    { who: 'desc', text: 'So you sit down, and the sea comes through a wall that has not been fixed since before you were hired, and above the cloud deck the dead satellites go round the way they have for sixteen years and will for another nine hundred.' },
    { who: 'desc', text: 'People ask what a night handler does. The honest answer is: waits, correctly. Anybody can wait. Waiting correctly means being the same person at 04:00 that you were at 20:00, so that when somebody finally needs a voice there is one, and it is steady, and it has not spent the night going quietly strange in an empty building.' },
    { who: 'desc', text: 'You are good at it. It is the only thing you have ever been unambiguously good at.' },
    { who: 'desc', text: 'At 20:04, channel four opens.' },
  ],
  goto: 'ch1_open',
});

// ---- Act I: the Row, immediately after ---------------------------------------

node({
  id: 'ch1_offrow',
  chapter: 1,
  lines: [
    { who: 'desc', text: 'The first ten minutes after something happens are the ones couriers get killed in, and they are the ten minutes a handler is actually for.' },
    { who: 'wren', text: "I'm shaking. That's — is that normal? My hands won't do the thing." },
    { who: 'you', text: 'Entirely normal and it will pass in about six minutes. Do not make any decisions during it.' },
    { who: 'wren', text: "That's a very specific number." },
    { who: 'you', text: 'It is in the training card. It is the single most useful sentence on the training card and nobody believes it until the first time.' },
    { who: 'desc', text: 'She laughs, which is not really a laugh, and sits down on something metal in the dark for six minutes, and you stay on the channel and say nothing much.' },
  ],
  choices: [
    {
      text: 'Get the case description while it is fresh. Every detail.',
      sub: 'Memory degrades fastest in the first hour.',
      requires: { flags: { leftSealed: false } },
      lockedText: 'She never opened it, so there is nothing to describe.',
      effects: { time: -11, leads: ['L_CASE_PREGRID'], trust: 4 },
      goto: 'ch1_offrow_case',
    },
    {
      text: 'Get the men described instead. Kit, markings, how they moved.',
      effects: { time: -13, leads: ['L_HALO_LEDGER'], composure: -3 },
      goto: 'ch1_offrow_men',
    },
    {
      text: 'Nothing. Let her have the six minutes.',
      effects: { time: -6, composure: 10, trust: 5 },
      goto: 'ch1_offrow_quiet',
    },
  ],
});

node({
  id: 'ch1_offrow_case',
  chapter: 1,
  lines: [
    { who: 'wren', text: 'Drum. Sealed, in a foam cradle. Index card taped to the cradle with one word on it, handwritten, and the ink has gone brown.' },
    { who: 'you', text: 'Brown.' },
    { who: 'wren', text: "Old-ink brown. My aunt's letters go that colour." },
    { who: 'desc', text: 'Somebody wrote a word on a card sixteen years ago and taped it to a cradle and then, at some point, stopped being able to do anything else about it.' },
    { who: 'wren', text: "There's a number under the word. Small. 03:25." },
    { who: 'desc', text: 'You write that down without knowing why, on a shift log, in a building with nine dead channels.' },
  ],
  effects: { flags: { noted325: true } },
  goto: 'ch2_open',
});

node({
  id: 'ch1_offrow_men',
  chapter: 1,
  lines: [
    { who: 'wren', text: 'Four. Coats, not armour. No district plate on the car, no unit flash, nothing stencilled.' },
    { who: 'wren', text: "And they moved wrong. They moved like people who'd been told to find an object, not like people looking for a person. Nobody covered the exits. Nobody watched the stair." },
    { who: 'you', text: 'Because a case cannot run.' },
    { who: 'wren', text: "Because a case cannot run. They weren't expecting a courier at all." },
    { who: 'desc', text: 'Which means the leak they worked from had an address and a time on it, and no name — and a job ticket has all three.' },
    { who: 'wren', text: "So whoever told them, told them from the ticket. Not from watching me." },
  ],
  effects: { leads: ['L_ROUTE_LEAK'], flags: { objectNotPerson: true } },
  goto: 'ch2_open',
});

node({
  id: 'ch1_offrow_quiet',
  chapter: 1,
  lines: [
    { who: 'desc', text: 'So you do nothing, for six minutes, on an open channel, in a dead building, while a woman sits on something metal in the dark and gets her hands back.' },
    { who: 'desc', text: 'It is the hardest thing in the job and there is no card for it.' },
    { who: 'wren', text: "...Okay." },
    { who: 'wren', text: "Okay. Hands work." },
    { who: 'you', text: 'Good.' },
    { who: 'wren', text: "You didn't fill it." },
    { who: 'you', text: 'No.' },
    { who: 'wren', text: "Every handler I've ever had fills it. They talk at you the whole way through because the silence makes them feel useless." },
    { who: 'wren', text: "Thank you for being useless quietly." },
  ],
  effects: { trust: 6 },
  goto: 'ch2_open',
});

// ---- The swap ---------------------------------------------------------------
// Act I was a handler in a safe room and a courier in danger. After the
// interview, Halo has your movements and not hers, and the shape inverts.

node({
  id: 'ch6_swap',
  chapter: 6,
  effects: { flags: { swapped: true } },
  lines: [
    { who: 'wren', text: "They've got your whole morning." },
    { who: 'you', text: 'They have my whole morning.' },
    { who: 'wren', text: "Then you don't get an afternoon. Anywhere you go this afternoon, they know about within the hour, and so does whoever answers the door." },
    { who: 'desc', text: 'She is right, and she has worked it out faster than you did, because this is her trade and not yours: a courier spends her whole working life thinking about who can see her.' },
    { who: 'wren', text: 'So I go.' },
    { who: 'you', text: 'Wren —' },
    { who: 'wren', text: "No, listen. Four hundred and twelve jobs. Nobody in this city can look at me and see anything except a courier, because I am one, and I have been one on every street on this list." },
    { who: 'wren', text: "You sit somewhere with no line of sight and you handle me. Which is, and I want to point this out, the actual job you are trained for and have been doing for six years, as opposed to walking up to front doors in the middle of the afternoon like a man delivering a summons." },
    { who: 'desc', text: 'There is a silence on the line while you fail to find anything wrong with that.' },
  ],
  goto: 'ch6_swap_answer',
});

node({
  id: 'ch6_swap_answer',
  chapter: 6,
  choices: [
    {
      text: 'Agree. Take the desk position and run her.',
      sub: 'What you are for. Also what put her on a road last night.',
      effects: { time: -20, exposure: -12, flags: { runningHer: true }, trust: 8 },
      goto: 'ch6_swap_yes',
    },
    {
      text: 'Say the thing out loud first: last time you did this, it went badly.',
      sub: 'Name it before you repeat it.',
      effects: { time: -14, trust: 12, composure: 6, flags: { runningHer: true, namedIt: true } },
      goto: 'ch6_swap_named',
    },
    {
      text: 'Refuse. You are not putting her out there again.',
      sub: 'Costs the afternoon. Costs it in daylight, where they can see you.',
      effects: { time: -10, exposure: 8, trust: -6 },
      goto: 'ch6_swap_no',
    },
  ],
});

node({
  id: 'ch6_swap_yes',
  chapter: 6,
  lines: [
    { who: 'desc', text: 'You find a tram shelter on the Rill road with no line of sight to anything, and a courier walks into the afternoon, and you put a voice in her ear.' },
    { who: 'you', text: 'Left at the chandler, then hold — there is a car at the junction that has not moved since I got here.' },
    { who: 'wren', text: 'Holding.' },
    { who: 'desc', text: 'And it is easy. That is the disconcerting part. Twenty minutes in it is completely routine, the way it was at 23:00 last night before anything happened, and your hands are steady and your voice is level and you are good at this.' },
    { who: 'wren', text: "You've gone into the voice." },
    { who: 'you', text: 'What voice?' },
    { who: 'wren', text: "The flat one. The one from the Row. It's fine — it's better than fine, it's the reason I'm still walking. I just noticed you can turn it on." },
  ],
  goto: 'ch6_hub',
});

node({
  id: 'ch6_swap_named',
  chapter: 6,
  lines: [
    { who: 'you', text: 'Before you go. The last time I put a voice in your ear and told you where to walk, you spent the night on a terrace and a substation floor and a mast platform, and at one point I got it wrong and you paid for it.' },
    { who: 'wren', text: 'I know.' },
    { who: 'you', text: "I want it said out loud, because last night it was a job and neither of us chose it, and this afternoon I would be choosing it." },
    { who: 'desc', text: 'The line is quiet for a moment.' },
    { who: 'wren', text: "My mother refused an order twice and they went round her." },
    { who: 'wren', text: "The reason that is the worst sentence in my life isn't that she refused. It's that nobody ever asked her again. They just routed round her and she never got to be part of it after that." },
    { who: 'wren', text: "So ask me. Out loud, like you just did. And then let me say yes." },
    { who: 'you', text: 'Will you walk the afternoon for me?' },
    { who: 'wren', text: 'Yes.' },
    { who: 'desc', text: 'It costs fourteen minutes of the only daylight there is, and it is the best fourteen minutes either of you spends all day.' },
  ],
  goto: 'ch6_hub',
});

node({
  id: 'ch6_swap_no',
  chapter: 6,
  lines: [
    { who: 'you', text: 'No. I put you on a road last night and I am not doing the afternoon version of it.' },
    { who: 'wren', text: "That isn't a reason, that's a feeling." },
    { who: 'you', text: 'It is a feeling I am going to act on.' },
    { who: 'wren', text: "Right. So instead the man they photographed all morning is going to keep knocking on doors, and every door he knocks on goes in a folder, and I'm going to sit in a collapsed exchange being protected." },
    { who: 'desc', text: 'She does not slam anything, because there is nothing to slam on a radio link, and the absence is worse.' },
    { who: 'wren', text: "Fine. It's your afternoon." },
    { who: 'desc', text: 'It is your afternoon, and it is now ten minutes shorter, and everyone you visit in it will be in a folder by evening.' },
  ],
  goto: 'ch6_hub',
});

// ---- Ilsa, unbidden ---------------------------------------------------------
// She hosts an archivist and a courier in Act II. A player who took the fast
// route across the Belt had never met her, which made that a stranger's sofa.
// She has an antenna and the case has been ticking across her blocks all night;
// of course she calls.

node({
  id: 'ch2_hail',
  chapter: 2,
  lines: [
    { who: 'alert', text: 'Third-party carrier — somebody is pushing onto your link' },
    { who: 'desc', text: 'You do not get third parties on a courier band. The band is point to point and sixteen years dead everywhere else, and in six years nobody has ever once come up on it uninvited.' },
    { who: 'ilsa', text: "Relay handler. K-7, by the carrier tone. Don't bother denying it, I've been listening to that transmitter since before you were hired." },
    { who: 'you', text: 'Who is this?' },
    { who: 'ilsa', text: "Somebody with a better antenna than you and considerably more free time. Your courier is carrying a box that has been pinging a maintenance band across my blocks for two hours." },
    { who: 'wren', text: 'Halcyon, who —' },
    { who: 'ilsa', text: "Ilsa. I live in the old exchange. I am not a threat to either of you and I am about to be extremely useful, so listen." },
  ],
  goto: 'ch2_hail_two',
});

node({
  id: 'ch2_hail_two',
  chapter: 2,
  lines: [
    { who: 'ilsa', text: 'That band has not carried anything since the night the sky went out. I know, because I was on air for it, and I have had a receiver parked on it ever since like an idiot with a grudge.' },
    { who: 'ilsa', text: "And at twenty past eleven tonight it started ticking. Two, pause, two." },
    { who: 'you', text: 'It is a beacon.' },
    { who: 'ilsa', text: "It is a beacon that somebody armed sixteen years ago and never came back for, and your courier has been walking it through a district of four thousand people who can all hear it." },
    { who: 'desc', text: 'Which explains the seven people standing in a dark street, and the old woman who came out, and the thing that was said twice that neither of you caught.' },
  ],
  choices: [
    {
      text: 'Can you kill it?',
      sub: 'She is offering. There is always a price.',
      effects: { time: -22, flags: { beaconDead: true }, composure: 10, leads: ['L_BEACON'] },
      goto: 'ch2_hail_kill',
    },
    {
      text: 'What do you want out of this?',
      effects: { time: -8, leads: ['L_ILSA_ECLIPSE'] },
      goto: 'ch2_hail_want',
    },
    {
      text: 'Get off my channel.',
      sub: 'She is an unknown on a line you cannot secure.',
      effects: { time: -3, trust: -3, flags: { refusedIlsa: true } },
      goto: 'ch2_hail_off',
    },
  ],
});

node({
  id: 'ch2_hail_kill',
  chapter: 2,
  lines: [
    { who: 'ilsa', text: 'I can talk her through it. Twenty minutes, and it is fiddly, and she will have to take the cradle apart with whatever she has in her pockets.' },
    { who: 'wren', text: 'I have a multitool and no patience.' },
    { who: 'ilsa', text: 'One of those is sufficient.' },
    { who: 'desc', text: 'Twenty-two minutes of a scav radio operator reading a sixteen-year-old cradle layout to a courier from memory, in the dark, in the Blackout Belt, while a handler four districts away listens to both of them and contributes absolutely nothing of value.' },
    { who: 'wren', text: "It's stopped." },
    { who: 'ilsa', text: 'It has stopped. My board is quiet for the first time tonight and I find I do not like it as much as I expected.' },
    { who: 'you', text: 'Ilsa. Thank you.' },
    { who: 'ilsa', text: "Don't. I have wanted to know what was on the other end of that band for sixteen years and you have just told me it is a courier with a box. That is payment." },
  ],
  goto: 'ch2_hail_close',
});

node({
  id: 'ch2_hail_want',
  chapter: 2,
  lines: [
    { who: 'ilsa', text: 'I was on air the night it happened. I had a board like this one and I heard the whole thing go.' },
    { who: 'ilsa', text: "Everybody tells you it was an accident in the array. It was an order. It came down a relay line — a courier relay, not a corporate one. Deniable and cheap." },
    { who: 'ilsa', text: 'I heard the acknowledgement. A handler’s voice, using a handler’s call sign, confirming a burn like it was a parcel.' },
    { who: 'ilsa', text: "So what do I want? I want to know which station. I have wanted it for sixteen years and I have never once had a relay handler on my board to ask." },
    { who: 'desc', text: 'The Belt is very quiet. Somewhere behind her you can hear a board humming.' },
  ],
  goto: 'ch2_hail_two',
});

node({
  id: 'ch2_hail_off',
  chapter: 2,
  lines: [
    { who: 'you', text: 'Get off my channel.' },
    { who: 'ilsa', text: "...Fair enough. It is your channel." },
    { who: 'desc', text: 'The carrier drops and the link is point to point again, the way it has been for six years, and you sit there having just refused the only person in this city who volunteered anything.' },
    { who: 'wren', text: 'That was a mistake.' },
    { who: 'you', text: 'Probably.' },
    { who: 'wren', text: "Not probably. Belt people don't come up on a stranger's band for fun. She'll have been deciding whether to do it for an hour." },
  ],
  goto: 'ch2_hail_close',
});

node({
  id: 'ch2_hail_close',
  chapter: 2,
  lines: [
    { who: 'desc', text: 'The Belt goes back to being twelve blocks of nothing with four thousand people in it.' },
    { who: 'wren', text: 'Halcyon. She said she was on air that night.' },
    { who: 'you', text: 'She did.' },
    { who: 'wren', text: "Everybody in this city was on air that night, and not one of them has ever been asked a single question about it." },
  ],
  effects: { flags: { metIlsa: true } },
  goto: 'ch2_cross',
});
