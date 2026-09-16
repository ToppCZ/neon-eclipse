// Rendering. Everything DOM lives here; the engine never touches an element.

import { LEADS, PLACES, ENDINGS } from './story.js';
import { speakerOf } from './engine.js';
import * as S from './state.js';

const $ = (id) => document.getElementById(id);

const GLITCH = '#%&/\\|_~^*+=';

// Deterministic per-message corruption, so redrawing the transcript (tab
// switch, resume) doesn't reshuffle the damage.
function hash(n) {
  let x = (n * 2654435761) >>> 0;
  x ^= x >>> 15;
  x = Math.imul(x, 2246822519);
  x ^= x >>> 13;
  return x >>> 0;
}

function corrupt(text, sig, seed) {
  const rate = sig === 'dead' ? 0.07 : sig === 'weak' ? 0.028 : 0;
  if (!rate) return [{ text }];
  const parts = [];
  let buf = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const roll = (hash(seed * 7919 + i) % 1000) / 1000;
    if (ch !== ' ' && ch !== '\n' && roll < rate) {
      if (buf) { parts.push({ text: buf }); buf = ''; }
      parts.push({ text: GLITCH[hash(seed + i) % GLITCH.length], bad: true });
    } else {
      buf += ch;
    }
  }
  if (buf) parts.push({ text: buf });
  return parts;
}

export class UI {
  constructor(radio, profile) {
    this.radio = radio;
    this.profile = profile;
    this.engine = null;
    this.tab = 'comms';
    this.typingEl = null;
    this.skippable = false;
    this.pinned = true;

    this.transcript = $('transcript');
    this.choicesEl = $('choices');

    // Auto-scroll fires scroll events of its own, so "did the player scroll?"
    // is decided by input intent (wheel / drag / keys), not by scroll events.
    const markUser = () => { this.userScrolling = true; };
    this.userScrolling = false;
    for (const ev of ['wheel', 'touchmove', 'keydown']) {
      this.transcript.addEventListener(ev, markUser, { passive: true });
    }
    this.transcript.addEventListener('scroll', () => {
      if (!this.userScrolling) return;
      const el = this.transcript;
      this.pinned = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
      $('scroll-latest').classList.toggle('hidden', this.pinned);
      if (this.pinned) this.userScrolling = false;
    }, { passive: true });

    $('scroll-latest').addEventListener('click', () => {
      this.pinned = true;
      this.userScrolling = false;
      this.scrollToEnd(true);
      $('scroll-latest').classList.add('hidden');
    });

    // Tap the transcript to hurry the current beat along.
    this.transcript.addEventListener('click', () => {
      if (this.skippable && this.engine) this.engine.skipAhead();
    });

    // Rendering the choice buttons grows the bottom bar, which shrinks the
    // transcript and shoves the newest lines out of sight. Nothing is appended
    // at that moment, so only a resize can catch it.
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => { if (this.pinned) this.scrollToEnd(); });
      ro.observe($('bottom'));
    }
  }

  bindEngine(engine) { this.engine = engine; }

  setSkippable(v) { this.skippable = v; }

  // ---- Transcript ----------------------------------------------------------

  appendEntry(entry) {
    const el = entry.kind === 'lead' ? this.leadEl(entry) : this.msgEl(entry);
    if (!el) return;
    this.transcript.appendChild(el);
    if (this.pinned) {
      this.scrollToEnd();
      $('scroll-latest').classList.add('hidden');
    }
  }

  msgEl(entry) {
    const sp = speakerOf(entry.who);
    const wrap = document.createElement('div');
    wrap.className = `msg ${sp.cls}`;

    if (sp.label) {
      const who = document.createElement('div');
      who.className = 'msg-who';
      who.textContent = sp.label;
      wrap.appendChild(who);
    }

    const body = document.createElement('div');
    body.className = 'msg-body';
    const glitchable = entry.who === 'wren' || entry.who === 'ilsa';
    const parts = (glitchable && !this.profile.reduced)
      ? corrupt(entry.text, entry.sig, entry.seed || 0)
      : [{ text: entry.text }];
    for (const p of parts) {
      if (p.bad) {
        const s = document.createElement('span');
        s.className = 'glitch';
        s.textContent = p.text;
        body.appendChild(s);
      } else {
        body.appendChild(document.createTextNode(p.text));
      }
    }
    wrap.appendChild(body);
    return wrap;
  }

  leadEl(entry) {
    const lead = LEADS[entry.id];
    if (!lead) return null;
    const outer = document.createElement('div');
    outer.className = 'lead-drop-wrap';
    const el = document.createElement('div');
    el.className = 'lead-drop';
    el.textContent = `◈ Casefile — ${lead.title}`;
    outer.appendChild(el);
    return outer;
  }

  showTyping(sp) {
    this.hideTyping();
    const wrap = document.createElement('div');
    wrap.className = `msg ${sp.cls} typing`;
    const body = document.createElement('div');
    body.className = 'msg-body';
    body.innerHTML = '<i></i><i></i><i></i>';
    wrap.appendChild(body);
    this.transcript.appendChild(wrap);
    this.typingEl = wrap;
    if (this.pinned) this.scrollToEnd();
  }

  hideTyping() {
    if (this.typingEl) { this.typingEl.remove(); this.typingEl = null; }
  }

  scrollToEnd(smooth = false) {
    const el = this.transcript;
    if (smooth) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      return;
    }
    // Land it now, then again after layout settles — scrollHeight is measured
    // before the new bubble has a height, so a single pass stops short.
    el.scrollTop = el.scrollHeight;
    requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
  }

  redrawAll(state) {
    this.transcript.innerHTML = '';
    for (const entry of state.log) this.appendEntry(entry);
    this.pinned = true;
    this.scrollToEnd();
    this.syncLeadBadge(state);
  }

  // ---- Choices -------------------------------------------------------------

  setChoices(choices) {
    this.choicesEl.innerHTML = '';
    for (const c of choices) {
      this.choicesEl.appendChild(this.choiceEl(c));
    }
    if (this.pinned) this.scrollToEnd();
  }

  choiceEl(c) {
    const btn = document.createElement('button');
    btn.className = 'choice' + (c.locked ? ' locked' : '') + (c.continueLine ? ' continue' : '');
    btn.type = 'button';

    const label = document.createElement('div');
    label.textContent = c.locked ? c.text : c.text;
    btn.appendChild(label);

    const sub = c.locked ? c.lockedText : c.sub;
    if (sub) {
      const s = document.createElement('div');
      s.className = 'opt-sub';
      s.textContent = sub;
      btn.appendChild(s);
    }

    const chips = this.chipsFor(c);
    if (chips.length) {
      const meta = document.createElement('div');
      meta.className = 'choice-meta';
      for (const ch of chips) {
        const el = document.createElement('span');
        el.className = `chip ${ch.kind}`;
        el.textContent = ch.text;
        meta.appendChild(el);
      }
      btn.appendChild(meta);
    }

    if (!c.locked) {
      btn.addEventListener('click', () => this.engine.choose(c));
    } else {
      btn.setAttribute('aria-disabled', 'true');
    }
    return btn;
  }

  chipsFor(c) {
    const chips = [];
    if (c.locked) return [{ kind: 'lead', text: 'Locked' }];
    const fx = c.effects || {};
    if (fx.time) chips.push({ kind: 'time', text: `${fx.time} min` });
    if (c.requires && (c.requires.leads || c.requires.anyLead)) {
      chips.push({ kind: 'lead', text: 'From casefile' });
    }
    if (fx.composure <= -10) chips.push({ kind: 'risk', text: 'Hard on her' });
    else if (fx.composure >= 8) chips.push({ kind: 'warm', text: 'Steadies her' });
    return chips;
  }

  // ---- Meters --------------------------------------------------------------

  syncMeters(state) {
    const win = state.window || S.WINDOWS.act1;
    $('clock').textContent = S.clockString(state.time, win);
    $('clock-left').textContent = S.remainingString(state.time, win);
    $('clock-wrap').classList.toggle('urgent', state.time <= win.total * 0.2);
    $('act-badge').textContent = ['ACT I', 'ACT I', 'ACT II', 'ACT III'][state.act] || 'ACT I';

    const wf = $('window-fill');
    wf.style.width = `${(state.time / win.total) * 100}%`;
    wf.classList.toggle('low', state.time <= win.total * 0.25);

    const cf = $('comp-fill');
    cf.style.width = `${state.composure}%`;
    cf.classList.toggle('low', state.composure <= 30);

    const tf = $('trust-fill');
    tf.style.width = `${state.trust}%`;
    tf.classList.toggle('low', state.trust <= 30);

    // Exposure stays hidden until the night makes it your problem.
    const em = $('exposure-meter');
    em.classList.toggle('shown', state.act >= 2 || state.exposure > 0);
    const ef = $('exp-fill');
    ef.style.width = `${state.exposure}%`;
    ef.classList.toggle('high', state.exposure >= 60);

    const sw = $('signal-wrap');
    sw.className = `sig-${state.signal}`;
    $('signal-label').textContent =
      state.signal === 'dead' ? 'NO LINK' : state.signal === 'weak' ? 'WEAK' : 'LINK';
  }

  syncLeadBadge(state) {
    const badge = $('lead-badge');
    const n = state.leads.length;
    badge.textContent = String(n);
    badge.classList.toggle('hidden', n === 0);
  }

  // ---- Timed beats ---------------------------------------------------------

  showTimer() { $('timed-wrap').classList.remove('hidden'); $('timed-fill').style.width = '100%'; }
  setTimerFill(frac) { $('timed-fill').style.width = `${Math.max(0, frac) * 100}%`; }
  hideTimer() { $('timed-wrap').classList.add('hidden'); }

  // ---- Tabs ----------------------------------------------------------------

  setTab(tab, state) {
    if (tab === 'menu') return;
    this.tab = tab;
    for (const el of document.querySelectorAll('.tab')) {
      el.classList.toggle('active', el.dataset.tab === tab);
    }
    $('panel-comms').classList.toggle('hidden', tab !== 'comms');
    $('panel-casefile').classList.toggle('hidden', tab !== 'casefile');
    $('panel-map').classList.toggle('hidden', tab !== 'map');
    if (tab === 'casefile') this.renderCasefile(state);
    if (tab === 'map') this.renderMap(state);
    if (tab === 'comms') this.scrollToEnd();
  }

  renderCasefile(state) {
    const list = $('lead-list');
    list.innerHTML = '';
    if (!state.leads.length) {
      const p = document.createElement('div');
      p.className = 'empty-note';
      p.textContent = 'Nothing established yet. You have a voice on a channel and a job ticket, and neither of those is a fact.';
      list.appendChild(p);
      return;
    }
    for (const id of state.leads) {
      const lead = LEADS[id];
      if (!lead) continue;
      const exposed = lead.planted && state.flags.valePlantExposed;
      const card = document.createElement('div');
      card.className = 'lead' + (exposed ? ' false' : '');

      const t = document.createElement('div');
      t.className = 'lead-title';
      t.textContent = lead.title;
      card.appendChild(t);

      const b = document.createElement('div');
      b.className = 'lead-text';
      b.textContent = lead.text;
      card.appendChild(b);

      if (exposed && lead.falseNote) {
        const tag = document.createElement('div');
        tag.className = 'lead-tag';
        tag.textContent = `Planted — ${lead.falseNote}`;
        card.appendChild(tag);
      }
      list.appendChild(card);
    }
  }

  renderMap(state) {
    const list = $('map-list');
    list.innerHTML = '';
    const trace = state.trace.length ? state.trace : ['relay'];
    for (const id of trace) {
      const place = PLACES[id];
      if (!place) continue;
      const row = document.createElement('div');
      row.className = 'place' + (id === state.loc ? ' current' : '');
      row.innerHTML = '<div class="place-dot"></div>';
      const body = document.createElement('div');
      const n = document.createElement('div');
      n.className = 'place-name';
      n.textContent = place.name + (id === state.loc ? '  ·  here now' : '');
      const note = document.createElement('div');
      note.className = 'place-note';
      note.textContent = place.note;
      body.appendChild(n);
      body.appendChild(note);
      row.appendChild(body);
      list.appendChild(row);
    }
  }

  // ---- Screens -------------------------------------------------------------

  showScreen(id) {
    for (const el of document.querySelectorAll('.screen')) el.classList.add('hidden');
    $(id).classList.remove('hidden');
  }

  showEnding(ending, state) {
    $('end-title').textContent = ending.title;
    $('end-body').textContent = ending.body;

    const stats = $('end-stats');
    stats.innerHTML = '';
    const rows = [
      ['Time remaining at close', state.time > 0 ? S.remainingString(state.time, state.window).replace(/ (to grid-up|of daylight left)/, '') : 'none'],
      ['Act reached', ['I', 'I', 'II', 'III'][state.act] || 'I'],
      ['Facts established', `${state.leads.length} of ${Object.keys(LEADS).length}`],
      ['Her trust in you', `${state.trust}`],
      ['Her composure', `${state.composure}`],
      ['What Halo had on you', `${state.exposure}`],
      ['Outcomes logged', `${this.profile.seen.length} of ${Object.keys(ENDINGS).length}`],
    ];
    for (const [k, v] of rows) {
      const row = document.createElement('div');
      row.className = 'stat-row';
      const a = document.createElement('span');
      a.textContent = k;
      const b = document.createElement('b');
      b.textContent = v;
      row.appendChild(a); row.appendChild(b);
      stats.appendChild(row);
    }
    this.showScreen('screen-end');
  }

  // ---- Modal ---------------------------------------------------------------

  openModal(title, build) {
    $('modal-title').textContent = title;
    const body = $('modal-body');
    body.innerHTML = '';
    build(body);
    $('modal').classList.remove('hidden');
  }

  closeModal() { $('modal').classList.add('hidden'); }
}
