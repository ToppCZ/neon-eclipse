// Boot, title screen, tabs, and the settings/menu plumbing.

import { radio } from './audio.js';
import { UI } from './ui.js';
import { Engine } from './engine.js';
import { ENDINGS } from './story.js';
import * as S from './state.js';

const $ = (id) => document.getElementById(id);

const profile = S.loadProfile();
const ui = new UI(radio, profile);
const engine = new Engine(ui, radio, profile);

function applyProfile() {
  document.body.classList.toggle('reduced', profile.reduced);
  radio.setMuted(profile.muted);
  S.saveProfile(profile);
}

// iOS and friends only allow audio after a real gesture.
function wakeAudio() {
  radio.resume();
  radio.startBed();
}

// ---- Title ------------------------------------------------------------------

function showTitle() {
  const saved = S.loadSave();
  $('btn-continue').classList.toggle('hidden', !saved);
  ui.showScreen('screen-title');
}

function beginGame(state) {
  ui.showScreen('screen-game');
  ui.setTab('comms', state);
  wakeAudio();
  engine.start(state);
}

$('btn-new').addEventListener('click', () => {
  S.clearSave();
  const state = S.newState();
  state.trace = ['relay'];
  beginGame(state);
});

$('btn-continue').addEventListener('click', () => {
  const saved = S.loadSave();
  if (!saved) { showTitle(); return; }
  if (!saved.counts) saved.counts = {};
  beginGame(saved);
});

$('btn-endings').addEventListener('click', openEndings);
$('btn-settings').addEventListener('click', openSettings);

$('btn-again').addEventListener('click', () => {
  const state = S.newState();
  state.trace = ['relay'];
  beginGame(state);
});
$('btn-end-home').addEventListener('click', showTitle);

// ---- Tabs -------------------------------------------------------------------

for (const tabBtn of document.querySelectorAll('.tab')) {
  tabBtn.addEventListener('click', () => {
    radio.tap();
    const tab = tabBtn.dataset.tab;
    if (tab === 'menu') { openMenu(); return; }
    ui.setTab(tab, engine.state);
  });
}

// ---- Modals -----------------------------------------------------------------

$('modal-close').addEventListener('click', () => ui.closeModal());
$('modal').addEventListener('click', (e) => { if (e.target.id === 'modal') ui.closeModal(); });

function toggleRow(body, label, sub, get, set) {
  const row = document.createElement('div');
  row.className = 'opt-row';
  const left = document.createElement('div');
  const l = document.createElement('div');
  l.className = 'opt-label';
  l.textContent = label;
  left.appendChild(l);
  if (sub) {
    const s = document.createElement('div');
    s.className = 'opt-sub';
    s.textContent = sub;
    left.appendChild(s);
  }
  const sw = document.createElement('div');
  sw.className = 'switch' + (get() ? ' on' : '');
  sw.setAttribute('role', 'switch');
  sw.setAttribute('aria-checked', String(!!get()));
  sw.addEventListener('click', () => {
    set(!get());
    sw.classList.toggle('on', get());
    sw.setAttribute('aria-checked', String(!!get()));
    applyProfile();
    radio.tap();
  });
  row.appendChild(left);
  row.appendChild(sw);
  body.appendChild(row);
}

function buildSettings(body) {
  toggleRow(body, 'Sound', 'Procedural room tone and message cues.',
    () => !profile.muted, (v) => { profile.muted = !v; });
  toggleRow(body, 'Faster text', 'Skip the conversational pacing.',
    () => profile.fastText, (v) => { profile.fastText = v; });
  toggleRow(body, 'Reduce effects', 'No scanlines, no animation, no signal corruption.',
    () => profile.reduced, (v) => { profile.reduced = v; });
}

function openSettings() {
  radio.tap();
  ui.openModal('Settings', buildSettings);
}

function openEndings() {
  radio.tap();
  ui.openModal('Logged outcomes', (body) => {
    const intro = document.createElement('p');
    intro.className = 'opt-sub';
    intro.style.marginBottom = '14px';
    intro.textContent = `${profile.seen.length} of ${Object.keys(ENDINGS).length} reached. The night is short enough that you cannot learn everything in one run — that is the point.`;
    body.appendChild(intro);

    for (const [key, e] of Object.entries(ENDINGS)) {
      const seen = profile.seen.includes(key);
      const card = document.createElement('div');
      card.className = 'ending-card' + (seen ? '' : ' locked');
      const n = document.createElement('div');
      n.className = 'ending-name';
      n.textContent = seen ? e.name : '— — —';
      const d = document.createElement('div');
      d.className = 'ending-desc';
      d.textContent = seen ? e.desc : 'Not yet reached.';
      card.appendChild(n); card.appendChild(d);
      body.appendChild(card);
    }
  });
}

function openMenu() {
  radio.tap();
  ui.openModal('Menu', (body) => {
    const mk = (label, fn) => {
      const b = document.createElement('button');
      b.className = 'btn btn-ghost menu-btn';
      b.textContent = label;
      b.addEventListener('click', fn);
      body.appendChild(b);
    };
    mk('Settings', () => { ui.closeModal(); openSettings(); });
    mk('Logged outcomes', () => { ui.closeModal(); openEndings(); });
    mk('Abandon the shift', () => {
      S.clearSave();
      ui.closeModal();
      radio.stopBed();
      showTitle();
    });
    const note = document.createElement('p');
    note.className = 'opt-sub';
    note.style.marginTop = '12px';
    note.textContent = 'Progress saves automatically at every decision.';
    body.appendChild(note);
  });
}

// ---- Go ---------------------------------------------------------------------

applyProfile();
showTitle();

// Handy for poking at a run from the console, same as the main game.
window.__deadair = { engine, ui, profile, state: () => engine.state };
