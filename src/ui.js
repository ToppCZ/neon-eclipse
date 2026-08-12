import { WEAPONS } from './weapons.js';
import { PASSIVES, TIER_COLORS } from './upgrades.js';
import { META_UPGRADES, upgradeCost } from './meta.js';
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
};

const NODE_ICONS = {
  combat: { glyph: '⚔', color: '#ff8a5e' },
  elite: { glyph: '☠', color: '#ffd54a' },
  shop: { glyph: '$', color: '#7CFC9A' },
  treasure: { glyph: '◆', color: '#c98cff' },
  rest: { glyph: '♥', color: '#5ee6ff' },
  boss: { glyph: '★', color: '#ff5e8a' },
};

function iconFor(id) { return ICONS[id] || { glyph: '?', color: '#fff' }; }
function nodeIconFor(type) { return NODE_ICONS[type] || { glyph: '?', color: '#fff' }; }

class UI {
  constructor() {
    this.el = {};
    [
      'hud', 'hp-bar', 'hp-label', 'xp-bar', 'timer', 'gold-val', 'level-badge', 'weapon-tray',
      'run-progress',
      'boss-banner', 'kill-counter',
      'screen-menu', 'btn-play', 'btn-shop', 'menu-stats',
      'screen-characters', 'character-list', 'btn-back-chars',
      'screen-shop', 'shop-list', 'shop-gold', 'btn-back-shop',
      'screen-choice', 'choice-title', 'choice-list',
      'screen-map', 'map-header', 'map-choices',
      'screen-node-shop', 'node-shop-cores', 'node-shop-list', 'btn-node-shop-reroll', 'node-shop-reroll-cost', 'btn-node-shop-continue',
      'screen-pause', 'btn-resume', 'btn-quit',
      'screen-end', 'end-title', 'end-stats', 'btn-retry', 'btn-end-menu',
      'mute-btn',
    ].forEach((id) => { this.el[camel(id)] = document.getElementById(id); });

    this.screens = [
      'screen-menu', 'screen-characters', 'screen-shop', 'screen-choice',
      'screen-map', 'screen-node-shop', 'screen-pause', 'screen-end',
    ].map(id => document.getElementById(id));
  }

  hideAllScreens() { this.screens.forEach(s => s.classList.add('hidden')); }
  show(id) { document.getElementById(id).classList.remove('hidden'); }

  setHudVisible(visible) { this.el.hud.classList.toggle('hidden', !visible); }

  updateHud(player, elapsed, weaponSystem, killCount, runLabel) {
    const hpPct = clamp(player.hp / player.maxHp, 0, 1);
    this.el.hpBar.style.transform = `scaleX(${hpPct})`;
    this.el.hpLabel.textContent = `${Math.ceil(player.hp)} / ${Math.round(player.maxHp)}`;
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
      div.title = `${slot.evolved ? def.evolvedName : def.name} — Lv ${slot.level}`;
      this.el.weaponTray.appendChild(div);
    }
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
      <div><b>${meta.stats.bestLevel}</b>Best Level</div>
      <div><b>${meta.gold}</b>Gold</div>
    `;
  }

  showCharacterSelect(characters, onPick) {
    this.hideAllScreens();
    this.show('screen-characters');
    this.el.characterList.innerHTML = '';
    for (const c of characters) {
      const card = document.createElement('div');
      card.className = 'char-card';
      card.innerHTML = `<div class="char-swatch" style="background:${c.color};box-shadow:0 0 16px ${c.color}"></div>
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

  showPause() { this.hideAllScreens(); this.show('screen-pause'); }

  showEnd(victory, stats) {
    this.hideAllScreens();
    this.show('screen-end');
    this.el.endTitle.textContent = victory ? 'Run Complete!' : 'You Fell...';
    this.el.endTitle.style.color = victory ? '#7CFC9A' : '#ff5e8a';
    this.el.endStats.innerHTML = `
      <div><b>Act ${stats.actReached}</b>Act Reached</div>
      <div><b>${stats.nodesCleared}</b>Nodes Cleared</div>
      <div><b>${stats.level}</b>Level Reached</div>
      <div><b>${stats.kills}</b>Kills</div>
      <div><b>${formatTime(stats.time)}</b>Time Survived</div>
      <div><b>${stats.goldEarned}</b>Gold Earned</div>
    `;
  }
}

function camel(id) {
  return id.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

export const ui = new UI();
