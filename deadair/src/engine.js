// The story runner. Owns the state, walks the node graph, paces the lines out
// so a conversation feels like a conversation, and hands everything visual to
// the UI layer.

import { NODES, LEADS } from './story.js';
import * as S from './state.js';

// People whose lines arrive as messages on a channel (and so get a typing beat
// before them). 'desc', 'sys' and 'alert' are the room, not a person.
const SPEAKERS = {
  wren: { label: 'Wren', cls: 'wren' },
  you: { label: 'You', cls: 'you' },
  ilsa: { label: 'Ilsa', cls: 'other' },
  vale: { label: 'Vale', cls: 'other' },
  sable: { label: 'Sable — dispatch', cls: 'other' },
  maddox: { label: 'Maddox', cls: 'other' },
  rook: { label: 'Reyes — Operator Four', cls: 'other' },
  ammi: { label: 'Sarran — Operator Three', cls: 'other' },
  ferrant: { label: 'Ferrant', cls: 'other' },
  watcher: { label: 'Halo', cls: 'other' },
  bell: { label: '', cls: 'sys' },
  other: { label: 'Archive', cls: 'other' },
  sys: { label: '', cls: 'sys' },
  alert: { label: '', cls: 'sys alert' },
  desc: { label: '', cls: 'desc' },
};

export function speakerOf(who) {
  return SPEAKERS[who] || SPEAKERS.other;
}

const TYPING_SPEAKERS = new Set(['wren', 'ilsa', 'vale', 'sable', 'maddox', 'rook', 'ammi', 'ferrant', 'watcher', 'other']);

export class Engine {
  constructor(ui, radio, profile) {
    this.ui = ui;
    this.radio = radio;
    this.profile = profile;
    this.state = null;
    this.node = null;
    this.visited = new Set();
    this.skip = false;
    this.playToken = 0;
    this._resolveWait = null;
    this.timer = null;
  }

  get fast() { return this.profile.fastText; }

  // ---- Lifecycle -----------------------------------------------------------

  start(state) {
    this.state = state;
    this.visited = new Set(state.visited || []);
    this.ui.bindEngine(this);
    this.ui.redrawAll(this.state);
    this.ui.syncMeters(this.state);
    this.enter(state.node || 'ch0_open', { replay: !!state.node });
  }

  // `replay` means we're resuming a save: re-entering the node the player was
  // parked on, so don't repeat lines they already read.
  enter(nodeId, { replay = false } = {}) {
    const node = NODES[nodeId];
    if (!node) {
      console.error('Dead Air: missing node', nodeId);
      return;
    }
    this.node = node;
    this.state.node = nodeId;
    this.clearTimer();
    this.ui.setChoices([]);

    const firstVisit = !this.visited.has(nodeId);
    this.visited.add(nodeId);
    this.state.visited = [...this.visited];

    if (!replay) {
      const gained = S.applyEffects(this.state, node.effects);
      this.announceLeads(gained);
    }
    this.ui.syncMeters(this.state);
    this.radio.setSignal(this.state.signal);

    const showLines = !replay && (firstVisit || !node.linesOnce);
    this.play(node, showLines ? node.lines || [] : []);
  }

  // ---- Line playback -------------------------------------------------------

  async play(node, lines) {
    const token = ++this.playToken;
    this.skip = false;
    this.ui.setSkippable(lines.length > 0);

    for (const line of lines) {
      if (token !== this.playToken) return;
      if (line.requires && !S.meets(this.state, line.requires)) continue;

      const sp = speakerOf(line.who);
      if (TYPING_SPEAKERS.has(line.who) && !this.skip) {
        this.ui.showTyping(sp);
        await this.wait(this.typingTime(line.text));
        this.ui.hideTyping();
        if (token !== this.playToken) return;
      } else if (!this.skip) {
        await this.wait(this.beatTime(line.text));
        if (token !== this.playToken) return;
      }

      this.pushLine(line);
      if (!this.skip) await this.wait(this.fast ? 60 : 140);
    }

    if (token !== this.playToken) return;
    this.ui.setSkippable(false);
    this.afterLines(node);
  }

  pushLine(line) {
    const entry = {
      kind: 'msg',
      who: line.who,
      text: line.text,
      sig: this.state.signal,
      seed: this.state.log.length,
    };
    this.state.log.push(entry);
    this.ui.appendEntry(entry);
    if (line.who === 'alert') this.radio.alert();
    else if (line.who === 'you') this.radio.msgOut();
    else if (line.who !== 'desc' && line.who !== 'sys') this.radio.msgIn();
  }

  announceLeads(ids) {
    for (const id of ids) {
      if (!LEADS[id]) continue;
      const entry = { kind: 'lead', id, seed: this.state.log.length };
      this.state.log.push(entry);
      this.ui.appendEntry(entry);
      this.radio.leadFound();
    }
    if (ids.length) this.ui.syncLeadBadge(this.state);
  }

  typingTime(text) {
    if (this.fast) return 120;
    return Math.min(1500, 340 + text.length * 11);
  }

  beatTime(text) {
    if (this.fast) return 90;
    return Math.min(1300, 300 + text.length * 7);
  }

  wait(ms) {
    return new Promise((resolve) => {
      if (this.skip || ms <= 0) { resolve(); return; }
      const id = setTimeout(() => { this._resolveWait = null; resolve(); }, ms);
      this._resolveWait = () => { clearTimeout(id); this._resolveWait = null; resolve(); };
    });
  }

  // Tap anywhere on the transcript: dump the rest of the beat immediately.
  skipAhead() {
    if (this.skip) return;
    this.skip = true;
    if (this._resolveWait) this._resolveWait();
    this.ui.hideTyping();
  }

  // ---- After the lines: branch, choices, or an ending ----------------------

  afterLines(node) {
    if (node.ending) {
      this.finish(node.ending);
      return;
    }

    if (node.branch) {
      for (const b of node.branch) {
        if (S.meets(this.state, b.requires)) {
          this.enter(b.goto);
          return;
        }
      }
    }

    const choices = this.visibleChoices(node);
    if (choices.length) {
      this.ui.setChoices(choices);
      if (node.timed) this.startTimer(node.timed);
      S.save(this.state);
      return;
    }

    if (node.goto) {
      this.ui.setChoices([{ continueLine: true, text: 'Continue', goto: node.goto }]);
      S.save(this.state);
      return;
    }

    console.error('Dead Air: node has nowhere to go', node.id);
  }

  visibleChoices(node) {
    const out = [];
    for (const c of node.choices || []) {
      const ok = S.meets(this.state, c.requires);
      if (ok) { out.push({ ...c, locked: false }); continue; }
      // A locked choice is only worth showing when it tells the player what
      // they'd have needed. Gates on internal bookkeeping stay hidden.
      if (c.lockedText) out.push({ ...c, locked: true });
    }
    return out;
  }

  // ---- Timed beats ---------------------------------------------------------

  startTimer(timed) {
    const total = (timed.seconds || 8) * 1000;
    const started = performance.now();
    this.ui.showTimer();
    let lastTick = -1;

    const step = () => {
      const left = total - (performance.now() - started);
      if (left <= 0) {
        this.clearTimer();
        this.ui.hideTimer();
        this.ui.setChoices([]);
        this.enter(timed.goto);
        return;
      }
      this.ui.setTimerFill(left / total);
      const sec = Math.ceil(left / 1000);
      if (sec !== lastTick && sec <= 5) { this.radio.tick(); lastTick = sec; }
      this.timer = requestAnimationFrame(step);
    };
    this.timer = requestAnimationFrame(step);
  }

  clearTimer() {
    if (this.timer) { cancelAnimationFrame(this.timer); this.timer = null; }
    this.ui.hideTimer();
  }

  // ---- Choices -------------------------------------------------------------

  choose(choice) {
    if (choice.locked) return;
    this.clearTimer();
    this.ui.setChoices([]);
    this.radio.tap();

    if (!choice.continueLine) {
      // The player's pick becomes their line in the transcript, unless the
      // node already writes a 'you' line for it.
      if (!choice.silent) {
        this.pushLine({ who: 'you', text: choice.text });
      }
    }

    const gained = S.applyEffects(this.state, choice.effects);
    this.ui.syncMeters(this.state);
    this.radio.setSignal(this.state.signal);
    this.announceLeads(gained);

    const next = this.guard(choice.goto);
    S.save(this.state);
    this.enter(next);
  }

  // Global fail states. Running out of night, or out of her.
  guard(nextId) {
    const target = NODES[nextId];
    if (target && target.ending) return nextId;
    if (this.state.time <= 0) return 'end_timeout';
    if (this.state.composure <= 0 && this.state.chapter >= 2) return 'break_point';
    return nextId;
  }

  // ---- Ending --------------------------------------------------------------

  finish(ending) {
    this.state.ended = ending.key;
    S.clearSave();
    if (!this.profile.seen.includes(ending.key)) {
      this.profile.seen.push(ending.key);
      S.saveProfile(this.profile);
    }
    this.radio.stopBed();
    this.ui.showEnding(ending, this.state);
  }
}
