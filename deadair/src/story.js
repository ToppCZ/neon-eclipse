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
};

export const ENDINGS = {
  dead_air: { name: 'Dead Air', desc: 'The line went quiet and stayed quiet.' },
  timeout: { name: 'Grid-Up', desc: 'Dawn found her still carrying it.' },
  delivery: { name: 'The Delivery', desc: 'The job got done. Only the job.' },
  burned: { name: 'Burned', desc: 'You were played, and you paid with someone else.' },
  ash: { name: 'Ash and Salt', desc: 'You put the truth in the water and let her go.' },
  broadcast: { name: 'Broadcast', desc: 'The city woke up knowing.' },
  handshake: { name: 'Handshake', desc: 'The truth got out, and so did she, and you chose how you went dark.' },
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
    { who: 'sys', text: 'Relay K-7 · Night shift · Handle: HALCYON' },
    { who: 'sys', text: 'Grid-up in 5h 00m' },
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
      effects: { time: -9, flags: { askedClient: true }, leads: ['L_MADDOX_NEW'] },
      goto: 'ch1_q_client',
    },
    {
      text: "What's in the case?",
      requires: { flags: { askedCase: false } },
      effects: { time: -8, flags: { askedCase: true }, leads: ['L_MANIFEST_BLANK'] },
      goto: 'ch1_q_case',
    },
    {
      text: 'Why you? Why tonight?',
      requires: { flags: { askedWhy: false } },
      effects: { time: -9, flags: { askedWhy: true }, trust: 3 },
      goto: 'ch1_q_why',
    },
    {
      text: 'Before you move — are you alright?',
      sub: 'Costs night. Buys you a steadier courier.',
      requires: { flags: { askedOkay: false } },
      effects: { time: -7, flags: { askedOkay: true }, composure: 12, trust: 5 },
      goto: 'ch1_okay',
    },
    {
      text: 'Enough. Start moving.',
      sub: 'Spend nothing. Learn nothing.',
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
      goto: 'ch1_drop',
    },
    {
      text: 'Count the steps with her.',
      effects: { time: -4, composure: 6, trust: 2 },
      goto: 'ch1_drop',
    },
    {
      text: 'Keep her eyes up and her mouth shut.',
      effects: { composure: -4 },
      goto: 'ch1_drop',
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
  goto: 'ch1_drop',
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
  goto: 'ch1_drop',
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
      goto: 'ch2_open',
    },
    {
      text: "You're right to ask. Keep asking. Don't stop at me.",
      sub: 'Give her the suspicion and aim it.',
      effects: { trust: 9, composure: -3 },
      goto: 'ch2_open',
    },
    {
      text: 'It was me, in the sense that this desk is on the list. I have no way to rule myself out yet.',
      sub: 'Total honesty. Expensive.',
      effects: { trust: 9, composure: -10, flags: { honestEarly: true } },
      goto: 'ch2_open',
    },
    {
      text: "Walk the job. Suspicion doesn't pay nine thousand.",
      effects: { trust: -8, composure: 4 },
      goto: 'ch2_open',
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
  goto: 'ch2_wren_asks',
});

node({
  id: 'ch2_nest',
  chapter: 2,
  effects: { signal: 'clear' },
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
      goto: 'ch2_wren_asks',
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
  goto: 'ch3_open',
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
    { requires: { timeMax: 58 }, goto: 'ch3_forced' },
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
      effects: { time: -18, count: { desk: 1 }, flags: { didRoster: true }, leads: ['L_HALCYON_DESK'], composure: -2 },
      goto: 'ch3_roster',
    },
    {
      text: 'Open the archive. The night of the Eclipse, 03:00 to 04:00.',
      sub: 'The tapes. Slow, and you may not like it.',
      silent: true,
      requires: { flags: { didBurnLog: false } },
      effects: { time: -36, count: { desk: 1 }, flags: { didBurnLog: true }, leads: ['L_BURN_LOG'], composure: -3 },
      goto: 'ch3_burnlog',
    },
    {
      text: 'Ping Sable. Ask her why she built tonight around this chair.',
      sub: 'She will know you are asking.',
      silent: true,
      requires: { flags: { didSable: false } },
      effects: { time: -20, count: { desk: 1 }, flags: { didSable: true }, leads: ['L_SABLE_ROSTER'], composure: -2 },
      goto: 'ch3_sable',
    },
    {
      text: 'Run the client properly. Not the ticket — the man.',
      sub: 'Ezra Maddox, four days old, nine thousand up front.',
      silent: true,
      requires: { flags: { didMaddox: false } },
      effects: { time: -26, count: { desk: 1 }, flags: { didMaddox: true }, leads: ['L_MADDOX_TRUE'], composure: -2 },
      goto: 'ch3_maddox',
    },
    {
      text: 'Look at the pier. Handshakes, traffic, anything sitting still.',
      sub: 'The handover point, an hour out.',
      silent: true,
      requires: { flags: { didPier: false } },
      effects: { time: -17, count: { desk: 1 }, flags: { didPier: true }, leads: ['L_PIER_NET'], composure: -2 },
      goto: 'ch3_pier',
    },
    {
      text: 'Check what this relay can still transmit.',
      sub: 'You have never once had a reason to ask.',
      silent: true,
      requires: { flags: { didBroadcast: false } },
      effects: { time: -16, count: { desk: 1 }, flags: { didBroadcast: true }, leads: ['L_BROADCAST_KEY'], composure: -2 },
      goto: 'ch3_broadcast',
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
      silent: true,
      goto: 'ch4_open',
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
    { who: 'desc', text: 'Thirty-six minutes of spooling. The tapes are physical, degraded, and were never meant to be listened to again.' },
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
    { who: 'desc', text: 'Twenty-six minutes of pulling a name apart. The man is not hiding well, because he is not a professional at hiding.' },
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
  goto: 'ch4_open',
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
  branch: [
    { requires: { flags: { beaconDead: true } }, goto: 'ch4_raid_slow' },
    { goto: 'ch4_raid_fast' },
  ],
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
  branch: [
    { requires: { leads: ['L_BURN_LOG'], trust: { min: 72 }, flags: { toldTruth: true } }, goto: 'end_handshake' },
    { goto: 'end_broadcast' },
  ],
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
  goto: 'end_ash',
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
  goto: 'end_burned',
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
    { goto: 'end_delivery_plain' },
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
  goto: 'end_delivery_clean',
});

// ============================================================================
// ENDINGS
// ============================================================================

node({
  id: 'end_handshake',
  chapter: 5,
  ending: {
    key: 'handshake',
    title: 'Handshake',
    body: `At 04:50 every receiver in Kestrel Bay syncs to the relay band to ask a dead station what time it is.

For ninety seconds this year, they got something else: array telemetry from sixteen years ago, and under it a handler's voice saying nine words, and under that a woman's voice — yours, in the end, reading out what the nine words meant, because raw data with nobody to interpret it is just a panic and you had decided not to do that to anyone.

Wren went off the mast down a maintenance run while Halo were still working out that "up" had been a transmitter. Somebody on the Rill counted her out. Somebody always is.

Cormac Vale was suspended, restored, and quietly retired. Eight of the nine settlements were reopened. Nobody has ever officially said the word Ledger.

You had about four minutes after the broadcast to decide how you went dark. You used them to unscrew the nameplate from the desk, because it was the only part of the room that was actually yours to take, and because a call sign should not be allowed to outlive the people who have to answer to it.

She found you eleven days later. She did not have to look very hard. You had left the nameplate on Ilsa's board with a note on it, and the note said: ASK HER, SHE KNOWS EVERYTHING.`,
  },
  lines: [],
});

node({
  id: 'end_broadcast',
  chapter: 5,
  ending: {
    key: 'broadcast',
    title: 'Broadcast',
    body: `It went out. That is the part that matters and it should be said first: at grid-up, for ninety seconds, the whole city got sixteen years of array telemetry pushed into every receiver it owned.

What the city got was numbers. No voice over the top of it, no nine words, nobody to say here is what this means and here is who said yes — because you did not have that, or she did not trust you enough to let you speak for her, and so the truth arrived as a wall of engineering data at five in the morning.

It was enough to start an inquiry. It was not enough to finish one. Halo Division's press office had a statement out before the streetlights were fully warm, and the word they used was "fragmentary", and they used it a great many times.

They took Wren off the mast platform at 04:58. She is alive. There is a file, and a charge, and a woman in it who will not say one word about who was in her ear.

The desk at K-7 was decommissioned that week. They screwed the nameplate off and put the chair in a corridor.

Somewhere in the city there are people who recorded those ninety seconds. It is not nothing. Some mornings it even feels like enough.`,
  },
  lines: [],
});

node({
  id: 'end_ash',
  chapter: 5,
  ending: {
    key: 'ash',
    title: 'Ash and Salt',
    body: `Forty metres of black water under the Ashgate apron, and a very small sound.

Halo searched her for two hours and found a courier with no cargo, no ticket worth reading, and nothing to charge. Vale stood on the road at grid-up with his hands in his coat and watched the streetlights come up over an empty apron, and you listened to him not say anything for a long time, which was the single most satisfying silence of your career.

Ezra Maddox waited at the pier until seven. Nobody came. He went home to a flat full of index cards about a building that does not exist and he did not file another job.

Wren called you once, a week later, from somewhere with gulls.

"Do you think about it?"

"Every night. You?"

"No," she said, and then, after a while, "Yes. But I sleep."

Sixteen years of night, and the sky stayed exactly as dark as it was. Nothing changed. She got to be a person who was not hunting anything, which is a smaller thing than the truth and a great deal harder to come by.

The nameplate is still screwed to the desk. Someone else will inherit it.`,
  },
  lines: [],
});

node({
  id: 'end_delivery_clean',
  chapter: 5,
  ending: {
    key: 'delivery',
    title: 'The Delivery',
    body: `She left it on the apron rail at the seaward end and walked north without looking back, and Halo collected it at 05:20 in full daylight with a Port Authority clerk standing there wondering what everybody was looking so serious about.

Job complete. Nine thousand, paid in advance, no clawback. The relay logged it as a clean handover and Sable put a mark in the good column.

Ezra Maddox was picked up at nine that morning outside a bakery. The charge was archival theft and it stuck. He is sixty-one, so it will be most of what he has left.

The drum went into a Halo evidence locker and out of a Halo evidence locker the same week, and the Eclipse remains, officially, a cascade fault in an aging array, tragic, nobody's fault, here is a memorial.

Wren still works the Belt. You still work nights. She takes your desk when she can get it and neither of you has ever once said the word Ledger on an open channel.

Every so often, around three in the morning, she says: "Do you ever wonder what was on it?"

And you say no, and she says no, me neither, and you both sit there on a live line in the dark, lying to each other companionably until the sun comes up.`,
  },
  lines: [],
});

node({
  id: 'end_delivery_plain',
  chapter: 5,
  ending: {
    key: 'delivery',
    title: 'The Delivery',
    body: `She walked up the middle of the Ashgate road at five to five because you had not found out that eleven radios were sitting on it, and you cannot warn anybody about a thing you did not spend the night learning.

They took the case off her at the seaward end. Politely, even — Vale is a polite man, and he had what he came for, so there was no need to be anything else.

"Tell your handler it was a good night's work," he said, close enough to her collar mic that it was clearly meant for you. "Most people don't get this close."

Job complete, technically. The relay logged a failed handover and Sable put a mark in the other column.

Ezra Maddox was picked up at nine outside a bakery. The Eclipse remains a cascade fault in an aging array.

Wren finished the night alive, which is the only line in this account worth anything, and she did it with no help from the last hour of your shift.

She did not take your desk again.`,
  },
  lines: [],
});

node({
  id: 'end_burned',
  chapter: 5,
  ending: {
    key: 'burned',
    title: 'Burned',
    body: `You did what a man on channel one asked you to do, because he knew the ward your sister's kids are schooled in and he said so once, up front, so you needn't do the part where he implied it.

They took her on the Ashgate road at 04:52. She did not run, because you had told her the road was clear, and she believed you, because believing the voice in your ear is the entire job.

The last thing on channel four before they bagged the handset was not a scream and not a curse. It was:

"Halcyon? Halcyon, are you still there?"

Your file is very boring now. Permanently. It will stay that way as long as it needs to, which is the part of the arrangement Vale did not have to write down.

Ezra Maddox got four years. The Eclipse remains a cascade fault in an aging array, tragic, nobody's fault.

Wren got eighteen months and a note on her licence, and she has never named her handler, not once, in any room they put her in.

You still work nights. The channel is quiet. It is a very good desk, K-7 — nine dead channels, a leak over switch four, and a nameplate that has now been answered to by three people who all said yes.`,
  },
  lines: [],
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
  id: 'break_point',
  chapter: 4,
  lines: [
    { who: 'desc', text: 'There is a point past which a person stops hearing the voice in their ear as help and starts hearing it as one more thing in the dark that wants something from them.' },
    { who: 'wren', text: "stop" },
    { who: 'wren', text: "stop talking. stop telling me where to put my feet." },
    { who: 'wren', text: "i've had a voice in my ear all night and every single time it said go, it was wrong" },
    { who: 'desc', text: 'Then she takes the handset off. You hear it hit something, and then you hear the inside of a pocket, and then you hear a road.' },
    { who: 'alert', text: 'Channel 4 — carrier only' },
  ],
  goto: 'end_dead_air_break',
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
