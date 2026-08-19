import { WEAPONS } from './weapons.js';
import { PASSIVES, TIER_COLORS } from './upgrades.js';
import { META_UPGRADES, upgradeCost } from './meta.js';
import { ACHIEVEMENTS } from './achievements.js';
import { formatTime, clamp } from './utils.js';

const ICONS = {
  shardCannon: { glyph: '◆', color: '#5ee6ff' },
  pulseBlade: { glyph: '⚔', color: '#ff8a5e' },
  orbitDrones: { glyph: '✦', color: '#c98cff' },
  novaBurst: { glyph: '◎', color: '#5ee6ff' },
  homingMissile: { glyph: '➤', color: '#c98cff' },
  chainLightning: { glyph: '⚡', color: '#ffd54a' },
  might: { glyph: 'M', color: '#ff5e8a' },
  vitality: { glyph: 'V', color: '#7CFC9A' },
  amulet: { glyph: 'A', color: '#c98cff' },
  haste: { glyph: 'H', color: '#5ee6ff' },
  magnet: { glyph: 'Mg', color: '#ffd54a' },
  fortune: { glyph: 'F', color: '#ffd54a' },
  boots: { glyph: 'B', color: '#7CFC9A' },
  cores: { glyph: '◈', color: '#ffd54a' },
  glassCannon: { glyph: '⚡', color: '#ff5e8a' },
  fortress: { glyph: '▣', color: '#ff8a5e' },
  berserker: { glyph: '⚔', color: '#ffd54a' },
  vampire: { glyph: '♥', color: '#7CFC9A' },
  thorns: { glyph: '✦', color: '#ff8a5e' },
  regen: { glyph: '+', color: '#7CFC9A' },
  dashCharges: { glyph: '»', color: '#5ee6ff' },
};

const NODE_ICONS = {
  combat: { glyph: '⚔', color: '#ff8a5e' },
  elite: { glyph: '☠', color: '#ffd54a' },
  shop: { glyph: '$', color: '#7CFC9A' },
  treasure: { glyph: '◆', color: '#c98cff' },
  rest: { glyph: '♥', color: '#5ee6ff' },
  boss: { glyph: '★', color: '#ff5e8a' },
};

const KEY_LABELS = { Space: 'Space', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', Escape: 'Esc' };
function keyLabel(code) {
  if (!code) return '—';
  if (KEY_LABELS[code]) return KEY_LABELS[code];
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  return code;
}

function iconFor(id) { return ICONS[id] || { glyph: '?', color: '#fff' }; }
function nodeIconFor(type) { return NODE_ICONS[type] || { glyph: '?', color: '#fff' }; }

class UI {
  constructor() {
    this.el = {};
    [
      'hud', 'hp-bar', 'hp-label', 'xp-bar', 'timer', 'gold-val', 'level-badge', 'weapon-tray',
      'run-progress',
      'boss-banner', 'kill-counter', 'btn-build-summary', 'build-summary-panel',
      'screen-menu', 'btn-play', 'btn-endless', 'btn-daily', 'btn-shop', 'btn-settings',
      'btn-leaderboard', 'menu-stats', 'menu-history',
      'screen-characters', 'character-list', 'btn-back-chars', 'btn-seed',
      'screen-leaderboard', 'leaderboard-list', 'btn-back-leaderboard',
      'screen-balance', 'balance-list', 'btn-back-balance', 'btn-balance',
      'tooltip',
      'screen-shop', 'shop-list', 'shop-gold', 'btn-back-shop',
      'screen-choice', 'choice-title', 'choice-list',
      'screen-map', 'map-header', 'map-choices',
      'screen-node-shop', 'node-shop-cores', 'node-shop-list', 'btn-node-shop-reroll', 'node-shop-reroll-cost', 'btn-node-shop-continue',
      'screen-settings', 'settings-list', 'btn-back-settings',
      'screen-pause', 'btn-resume', 'btn-pause-settings', 'btn-quit',
      'screen-end', 'end-title', 'end-stats', 'btn-retry', 'btn-end-menu',
      'mute-btn',
    ].forEach((id) => { this.el[camel(id)] = document.getElementById(id); });

    this.screens = [
      'screen-menu', 'screen-characters', 'screen-shop', 'screen-choice',
      'screen-map', 'screen-node-shop', 'screen-settings', 'screen-pause', 'screen-end',
      'screen-leaderboard', 'screen-balance',
    ].map(id => document.getElementById(id));

    this.bindWeaponTrayTooltip();
  }

  hideAllScreens() { this.screens.forEach(s => s.classList.add('hidden')); }
  show(id) { document.getElementById(id).classList.remove('hidden'); }

  setHudVisible(visible) {
    this.el.hud.classList.toggle('hidden', !visible);
    if (!visible) {
      document.body.classList.remove('low-hp');
      this.el.buildSummaryPanel.classList.add('hidden');
    }
  }

  toggleBuildSummary(player, weaponSystem) {
    const panel = this.el.buildSummaryPanel;
    const opening = panel.classList.contains('hidden');
    if (opening) this.renderBuildSummary(player, weaponSystem);
    panel.classList.toggle('hidden');
  }

  renderBuildSummary(player, weaponSystem) {
    const rows = [];
    for (const slot of weaponSystem.slots) {
      const def = WEAPONS[slot.id];
      const icon = iconFor(slot.id);
      rows.push(`<div class="build-summary-row"><span style="color:${icon.color}">${icon.glyph}</span><b>${slot.evolved ? def.evolvedName : def.name}</b><span class="sub">Lv ${slot.level}${slot.evolved ? ' ★' : ''}</span></div>`);
    }
    for (const [id, level] of player.passives) {
      const def = PASSIVES[id];
      if (!def) continue;
      const icon = iconFor(id);
      rows.push(`<div class="build-summary-row"><span style="color:${icon.color}">${icon.glyph}</span><b>${def.name}</b><span class="sub">Lv ${level}</span></div>`);
    }
    this.el.buildSummaryPanel.innerHTML = `<h4>Current Build</h4>${rows.join('') || '<p class="sub">No weapons or passives yet.</p>'}`;
  }

  updateHud(player, elapsed, weaponSystem, killCount, runLabel) {
    const hpPct = clamp(player.hp / player.maxHp, 0, 1);
    this.el.hpBar.style.transform = `scaleX(${hpPct})`;
    this.el.hpLabel.textContent = `${Math.ceil(player.hp)} / ${Math.round(player.maxHp)}`;
    document.body.classList.toggle('low-hp', hpPct > 0 && hpPct < 0.25);
    const xpPct = clamp(player.xp / player.xpToNext, 0, 1);
    this.el.xpBar.style.transform = `scaleX(${xpPct})`;
    this.el.timer.textContent = formatTime(elapsed);
    this.el.goldVal.textContent = Math.floor(player.cores);
    this.el.levelBadge.textContent = `Lv ${player.level}`;
    this.el.killCounter.textContent = `Kills: ${killCount}`;
    this.el.killCounter.classList.remove('hidden');
    if (runLabel) { this.el.runProgress.textContent = runLabel; this.el.runProgress.classList.remove('hidden'); }

    this.el.weaponTray.innerHTML = '';
    for (const slot of weaponSystem.slots) {
      const def = WEAPONS[slot.id];
      const icon = iconFor(slot.id);
      const div = document.createElement('div');
      div.className = 'weapon-icon' + (slot.evolved ? ' evolved' : '');
      div.style.color = icon.color;
      div.style.borderColor = slot.evolved ? undefined : icon.color + '55';
      div.textContent = icon.glyph;
      const lvl = document.createElement('span');
      lvl.className = 'lvl';
      lvl.textContent = slot.evolved ? '★' : slot.level;
      div.appendChild(lvl);
      div._tipText = `${slot.evolved ? def.evolvedName : def.name} — Lv ${slot.level}\n${def.desc}`;
      this.el.weaponTray.appendChild(div);
    }
  }

  // The tray's own children are rebuilt every frame (see above), so per-icon
  // hover listeners would get silently orphaned, and #weapon-tray itself
  // inherits pointer-events: none from #hud so it never becomes a hover
  // target for a reliable mouseleave. A single document-level listener that
  // re-checks ev.target on every move sidesteps both problems.
  bindWeaponTrayTooltip() {
    document.addEventListener('mousemove', (ev) => {
      const icon = ev.target && ev.target.closest ? ev.target.closest('.weapon-icon') : null;
      if (icon && icon._tipText) this.showTooltip(ev.clientX, ev.clientY, icon._tipText);
      else this.hideTooltip();
    });
  }

  showTooltip(x, y, text) {
    const t = this.el.tooltip;
    if (!t) return;
    t.textContent = text;
    t.classList.remove('hidden');
    this.moveTooltip(x, y);
  }

  moveTooltip(x, y) {
    const t = this.el.tooltip;
    if (!t || t.classList.contains('hidden')) return;
    t.style.left = `${x + 14}px`;
    t.style.top = `${y - 12}px`;
  }

  hideTooltip() {
    if (this.el.tooltip) this.el.tooltip.classList.add('hidden');
  }

  flashBossBanner(name) {
    this.el.bossBanner.textContent = `⚠ ${name} APPROACHES ⚠`;
    this.el.bossBanner.classList.remove('hidden');
    clearTimeout(this._bossTimer);
    this._bossTimer = setTimeout(() => this.el.bossBanner.classList.add('hidden'), 3500);
  }

  showMenu(meta) {
    this.hideAllScreens();
    this.show('screen-menu');
    this.setHudVisible(false);
    this.el.killCounter.classList.add('hidden');
    this.el.runProgress.classList.add('hidden');
    this.el.menuStats.innerHTML = `
      <div><b>${meta.stats.totalRuns}</b>Runs</div>
      <div><b>${meta.stats.bestAct || 0}</b>Best Act</div>
      <div><b>${meta.stats.bestWave || 0}</b>Best Wave</div>
      <div><b>${meta.stats.bestLevel}</b>Best Level</div>
      <div><b>${meta.gold}</b>Gold</div>
      <div><b>${(meta.achievements || []).length}/${ACHIEVEMENTS.length}</b>Achievements</div>
    `;
    this.renderHistory(meta.history || []);
  }

  renderHistory(history) {
    if (!this.el.menuHistory) return;
    if (!history.length) { this.el.menuHistory.innerHTML = ''; return; }
    this.el.menuHistory.innerHTML = history.map((h) => {
      const modeLabel = h.mode === 'endless' ? 'Endless' : 'Story';
      const reach = h.mode === 'endless' ? `Wave ${h.wave}` : `Act ${h.actReached}${h.victory ? ' · Win' : ''}`;
      return `<div class="history-row"><span class="history-mode">${modeLabel}</span><span>${reach}</span><span>Lv ${h.level}</span><span class="history-gold">◈ ${h.goldEarned}</span></div>`;
    }).join('');
  }

  showCharacterSelect(characters, onPick) {
    this.hideAllScreens();
    this.show('screen-characters');
    this.el.characterList.innerHTML = '';
    for (const c of characters) {
      const card = document.createElement('div');
      card.className = 'char-card';
      card.innerHTML = `<div class="char-swatch" style="box-shadow:0 0 16px ${c.color}66">
          <svg viewBox="-20 -14 40 28" width="30" height="21"><polygon points="18,0 -12,11 -6,0 -12,-11" fill="${c.color}"/></svg>
        </div>
        <h3>${c.name}</h3><p>${c.tagline}</p>`;
      card.addEventListener('click', () => onPick(c.id));
      this.el.characterList.appendChild(card);
    }
  }

  showShop(meta, onBuy) {
    this.hideAllScreens();
    this.show('screen-shop');
    this.renderShop(meta, onBuy);
  }

  renderShop(meta, onBuy) {
    this.el.shopGold.textContent = Math.floor(meta.gold);
    this.el.shopList.innerHTML = '';
    for (const id of Object.keys(META_UPGRADES)) {
      const def = META_UPGRADES[id];
      const level = meta.levels[id] || 0;
      const maxed = level >= def.maxLevel;
      const cost = maxed ? 0 : upgradeCost(def, level);
      const row = document.createElement('div');
      row.className = 'shop-row';
      row.innerHTML = `
        <div class="shop-row-info"><b>${def.name}</b><p>${def.desc}</p></div>
        <div style="display:flex;align-items:center;">
          <span class="shop-row-level">Lv ${level}/${def.maxLevel}</span>
          <button class="btn shop-buy" ${maxed || meta.gold < cost ? 'disabled' : ''}>${maxed ? 'MAX' : `● ${cost}`}</button>
        </div>`;
      const btn = row.querySelector('.shop-buy');
      btn.addEventListener('click', () => { if (onBuy(id)) this.renderShop(meta, onBuy); });
      this.el.shopList.appendChild(row);
    }
  }

  // Generic "pick 1 of N" modal — used for in-combat level-ups, post-node
  // rewards, treasure nodes, and rest-site choices.
  showChoiceModal(title, choices, onPick) {
    this.hideAllScreens();
    this.show('screen-choice');
    this.el.choiceTitle.textContent = title;
    this.el.choiceList.innerHTML = '';
    for (const choice of choices) {
      const icon = iconFor(choice.id);
      const tierColor = TIER_COLORS[choice.tier] || null;
      const card = document.createElement('div');
      card.className = 'choice-card';
      if (tierColor) card.style.borderColor = tierColor + '66';
      card.innerHTML = `
        <div class="choice-icon" style="color:${icon.color};background:${icon.color}22;">${icon.glyph}</div>
        <div class="choice-text">
          <b>${choice.title}</b>
          <span class="sub" ${tierColor ? `style="color:${tierColor}"` : ''}>${choice.subtitle}${choice.tier ? ` · ${choice.tier}` : ''}</span>
          <p>${choice.desc}</p>
        </div>`;
      card.addEventListener('click', () => onPick(choice));
      this.el.choiceList.appendChild(card);
    }
  }

  showMap(run, onPick) {
    this.hideAllScreens();
    this.show('screen-map');
    this.setHudVisible(false);
    const act = run.acts[run.actIndex];
    const step = act.steps[run.stepIndex];
    this.el.mapHeader.textContent = `Act ${act.actNumber} — ${act.biome.name}  ·  Step ${run.stepIndex + 1}/${act.steps.length}`;
    this.el.mapChoices.innerHTML = '';
    for (const node of step.choices) {
      const icon = nodeIconFor(node.type);
      const card = document.createElement('div');
      card.className = 'node-card';
      card.innerHTML = `
        <div class="node-icon" style="color:${icon.color};background:${icon.color}22;border-color:${icon.color}55;">${icon.glyph}</div>
        <b>${node.label}</b>
        <span class="node-type">${node.type}</span>`;
      card.addEventListener('click', () => onPick(node));
      this.el.mapChoices.appendChild(card);
    }
  }

  showNodeShop(state, onBuy, onReroll, onContinue) {
    this.hideAllScreens();
    this.show('screen-node-shop');
    this.renderNodeShop(state, onBuy, onReroll, onContinue);
  }

  renderNodeShop(state, onBuy, onReroll, onContinue) {
    this.el.nodeShopCores.textContent = Math.floor(state.player.cores);
    this.el.nodeShopList.innerHTML = '';
    for (const offer of state.offers) {
      const icon = iconFor(offer.id);
      const tierColor = TIER_COLORS[offer.tier] || null;
      const afford = state.player.cores >= offer.cost;
      const row = document.createElement('div');
      row.className = 'shop-row';
      if (tierColor) row.style.borderColor = tierColor + '66';
      row.innerHTML = `
        <div class="shop-row-info">
          <b style="color:${icon.color}">${icon.glyph} ${offer.title}</b>
          <p ${tierColor ? `style="color:${tierColor}"` : ''}>${offer.subtitle}${offer.tier ? ` · ${offer.tier}` : ''} — ${offer.desc}</p>
        </div>
        <button class="btn shop-buy" ${offer.bought || !afford ? 'disabled' : ''}>${offer.bought ? 'Bought' : `◈ ${offer.cost}`}</button>`;
      const btn = row.querySelector('.shop-buy');
      btn.addEventListener('click', () => onBuy(offer));
      this.el.nodeShopList.appendChild(row);
    }
    this.el.nodeShopRerollCost.textContent = state.rerollCost;
    this.el.btnNodeShopReroll.disabled = state.player.cores < state.rerollCost;
    this.el.btnNodeShopReroll.onclick = onReroll;
    this.el.btnNodeShopContinue.onclick = onContinue;
  }

  showSettings(settings, onChange, slotsInfo = { slots: ['default'], active: 'default' }) {
    this.hideAllScreens();
    this.show('screen-settings');
    this.renderSettings(settings, onChange, slotsInfo);
  }

  renderSettings(settings, onChange, slotsInfo = { slots: ['default'], active: 'default' }) {
    const el = this.el.settingsList;
    el.innerHTML = '';

    const slotHeading = document.createElement('div');
    slotHeading.className = 'settings-subheading';
    slotHeading.textContent = 'Save Slot';
    el.appendChild(slotHeading);
    const slotRow = document.createElement('div');
    slotRow.className = 'settings-row';
    slotRow.appendChild(this._toggleGroup(
      slotsInfo.slots.map((s) => [s, s]), slotsInfo.active,
      (v) => onChange('switchSlot', v)));
    const newSlotBtn = document.createElement('button');
    newSlotBtn.className = 'btn';
    newSlotBtn.textContent = '+ New';
    newSlotBtn.addEventListener('click', () => onChange('newSlot', null));
    slotRow.appendChild(newSlotBtn);
    el.appendChild(slotRow);
    el.appendChild(this._settingsRow('Music Volume', this._slider(Math.round(settings.musicVolume * 100), (v) => onChange('musicVolume', v / 100))));
    el.appendChild(this._settingsRow('SFX Volume', this._slider(Math.round(settings.sfxVolume * 100), (v) => onChange('sfxVolume', v / 100))));
    el.appendChild(this._settingsRow('Screen Shake', this._toggleGroup(
      [[0, 'Off'], [0.5, 'Reduced'], [1, 'Full']], settings.screenShake,
      (v) => { onChange('screenShake', v); this.renderSettings(settings, onChange, slotsInfo); })));
    el.appendChild(this._settingsRow('Reduced Motion', this._toggleGroup(
      [[false, 'Off'], [true, 'On']], settings.reducedMotion,
      (v) => { onChange('reducedMotion', v); this.renderSettings(settings, onChange, slotsInfo); })));
    el.appendChild(this._settingsRow('Show Hitbox', this._toggleGroup(
      [[false, 'Off'], [true, 'On']], settings.showHitbox,
      (v) => { onChange('showHitbox', v); this.renderSettings(settings, onChange, slotsInfo); })));
    el.appendChild(this._settingsRow('Colorblind Mode', this._toggleGroup(
      [[false, 'Off'], [true, 'On']], settings.colorblindMode,
      (v) => { onChange('colorblindMode', v); this.renderSettings(settings, onChange, slotsInfo); })));
    el.appendChild(this._settingsRow('Manual Aim (Shard Cannon)', this._toggleGroup(
      [[false, 'Off'], [true, 'On']], settings.manualAim,
      (v) => { onChange('manualAim', v); this.renderSettings(settings, onChange, slotsInfo); })));
    el.appendChild(this._settingsRow('Difficulty', this._toggleGroup(
      [['easy', 'Easy'], ['normal', 'Normal'], ['hard', 'Hard']], settings.difficulty,
      (v) => { onChange('difficulty', v); this.renderSettings(settings, onChange, slotsInfo); })));

    const heading = document.createElement('div');
    heading.className = 'settings-subheading';
    heading.textContent = 'Controls (arrows / Shift / P always still work)';
    el.appendChild(heading);
    const labels = { up: 'Move Up', down: 'Move Down', left: 'Move Left', right: 'Move Right', dash: 'Dash', pause: 'Pause' };
    for (const action of Object.keys(labels)) {
      el.appendChild(this._settingsRow(labels[action], this._keybindButton(settings.keybinds[action], (code) => {
        onChange(`keybind:${action}`, code);
        this.renderSettings(settings, onChange, slotsInfo);
      })));
    }

    const saveRow = document.createElement('div');
    saveRow.className = 'settings-row';
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn';
    saveBtn.textContent = 'Export Save';
    saveBtn.addEventListener('click', () => onChange('exportSave', null));
    const importBtn = document.createElement('button');
    importBtn.className = 'btn';
    importBtn.textContent = 'Import Save';
    importBtn.addEventListener('click', () => onChange('importSave', null));
    saveRow.appendChild(saveBtn);
    saveRow.appendChild(importBtn);
    el.appendChild(saveRow);
  }

  _keybindButton(currentCode, onCaptured) {
    const btn = document.createElement('button');
    btn.className = 'btn toggle-opt';
    btn.textContent = keyLabel(currentCode);
    btn.addEventListener('click', () => {
      btn.textContent = 'Press a key…';
      const capture = (ev) => {
        ev.preventDefault();
        window.removeEventListener('keydown', capture, true);
        onCaptured(ev.code);
      };
      window.addEventListener('keydown', capture, true);
    });
    return btn;
  }

  _settingsRow(labelText, controlEl) {
    const row = document.createElement('div');
    row.className = 'settings-row';
    const label = document.createElement('label');
    label.textContent = labelText;
    row.appendChild(label);
    row.appendChild(controlEl);
    return row;
  }

  _slider(value, onInput) {
    const input = document.createElement('input');
    input.type = 'range'; input.min = '0'; input.max = '100'; input.value = String(value);
    input.addEventListener('input', () => onInput(Number(input.value)));
    return input;
  }

  _toggleGroup(options, current, onPick) {
    const wrap = document.createElement('div');
    wrap.className = 'settings-toggle-group';
    for (const [val, label] of options) {
      const btn = document.createElement('button');
      btn.className = 'btn toggle-opt' + (String(current) === String(val) ? ' active' : '');
      btn.textContent = label;
      btn.addEventListener('click', () => onPick(val));
      wrap.appendChild(btn);
    }
    return wrap;
  }

  showLeaderboard(meta) {
    this.hideAllScreens();
    this.show('screen-leaderboard');
    const rows = (meta.leaderboard || []);
    this.el.leaderboardList.innerHTML = rows.length ? rows.map((r, i) => {
      const reach = r.mode === 'endless' ? `Wave ${r.wave}` : `Act ${r.actReached}${r.victory ? ' · Win' : ''}`;
      return `<div class="shop-row">
        <div class="shop-row-info"><b>#${i + 1} — ${r.mode === 'endless' ? 'Endless' : 'Story'}</b><p>${reach} · Lv ${r.level} · ${r.kills} kills · ${formatTime(r.time)}</p></div>
        <span class="shop-row-level">${r.score} pts</span>
      </div>`;
    }).join('') : '<p style="color:var(--text-dim);text-align:center;">No runs recorded yet.</p>';
  }

  showBalance(meta) {
    this.hideAllScreens();
    this.show('screen-balance');
    const ps = meta.pickStats || { weapons: {}, passives: {} };
    const section = (title, counts, defs) => {
      const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      if (!entries.length) return `<h3>${title}</h3><p style="color:var(--text-dim);">No picks recorded yet.</p>`;
      const rows = entries.map(([id, count]) => {
        const name = (defs[id] && defs[id].name) || id;
        return `<div class="shop-row"><div class="shop-row-info"><b>${name}</b></div><span class="shop-row-level">${count} picks</span></div>`;
      }).join('');
      return `<h3>${title}</h3>${rows}`;
    };
    this.el.balanceList.innerHTML =
      section('Weapons', ps.weapons, WEAPONS) + section('Passives', ps.passives, PASSIVES);
  }

  showPause() { this.hideAllScreens(); this.show('screen-pause'); }

  showEnd(victory, stats, unlockedAchievements = []) {
    this.hideAllScreens();
    this.show('screen-end');
    const prevExtras = this.el.endStats.parentElement.querySelector('.end-extras');
    if (prevExtras) prevExtras.remove();
    const endless = stats.mode === 'endless';
    this.el.endTitle.textContent = victory ? 'Run Complete!' : (endless ? 'Overwhelmed...' : 'You Fell...');
    this.el.endTitle.style.color = victory ? '#7CFC9A' : '#ff5e8a';
    const topRow = endless
      ? `<div><b>Wave ${stats.wave}</b>Wave Reached</div>`
      : `<div><b>Act ${stats.actReached}</b>Act Reached</div><div><b>${stats.nodesCleared}</b>Nodes Cleared</div>`;
    this.el.endStats.innerHTML = `
      ${topRow}
      <div><b>${stats.level}</b>Level Reached</div>
      <div><b>${stats.kills}</b>Kills</div>
      <div><b>${formatTime(stats.time)}</b>Time Survived</div>
      <div><b>${stats.goldEarned}</b>Gold Earned</div>
      <div><b>${stats.seed}</b>Seed</div>
    `;

    const extras = document.createElement('div');
    extras.className = 'end-extras';
    extras.innerHTML = this._statGraphHtml(stats.samples) +
      (stats.daily ? this._dailyBannerHtml(stats) : '') +
      (unlockedAchievements.length ? this._achievementBannerHtml(unlockedAchievements) : '');
    if (extras.innerHTML.trim()) this.el.endStats.insertAdjacentElement('afterend', extras);
  }

  _dailyBannerHtml(stats) {
    const label = stats.dailyIsNewBest ? 'New Daily Best!' : 'Daily Challenge';
    return `<div class="achievement-banner daily-banner">🗓️ <b>${label}</b> — Wave ${stats.wave} (best today: ${stats.dailyBest})</div>`;
  }

  _statGraphHtml(samples) {
    if (!samples || samples.length < 2) return '';
    const w = 380, h = 60, pad = 4;
    const maxT = samples[samples.length - 1].t || 1;
    const pts = samples.map((s) => {
      const x = pad + (s.t / maxT) * (w - pad * 2);
      const y = pad + (1 - s.hpPct) * (h - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    return `<div class="stat-graph">
      <div class="stat-graph-label">HP over time</div>
      <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="#ff5e8a" stroke-width="2" /></svg>
    </div>`;
  }

  _achievementBannerHtml(unlockedAchievements) {
    return `<div class="achievement-banner">${unlockedAchievements.map(a => `<div>🏆 <b>${a.name}</b> — ${a.desc}</div>`).join('')}</div>`;
  }
}

function camel(id) {
  return id.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

export const ui = new UI();
