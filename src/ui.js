import { WEAPONS } from './weapons.js';
import { PASSIVES } from './upgrades.js';
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
  gold: { glyph: '●', color: '#ffd54a' },
};

function iconFor(id) { return ICONS[id] || { glyph: '?', color: '#fff' }; }

class UI {
  constructor() {
    this.el = {};
    [
      'hud', 'hp-bar', 'hp-label', 'xp-bar', 'timer', 'gold-val', 'level-badge', 'weapon-tray',
      'boss-banner', 'kill-counter',
      'screen-menu', 'btn-play', 'btn-shop', 'menu-stats',
      'screen-characters', 'character-list', 'btn-back-chars',
      'screen-shop', 'shop-list', 'shop-gold', 'btn-back-shop',
      'screen-levelup', 'levelup-choices',
      'screen-pause', 'btn-resume', 'btn-quit',
      'screen-end', 'end-title', 'end-stats', 'btn-retry', 'btn-end-menu',
      'mute-btn',
    ].forEach((id) => { this.el[camel(id)] = document.getElementById(id); });

    this.screens = ['screen-menu', 'screen-characters', 'screen-shop', 'screen-levelup', 'screen-pause', 'screen-end']
      .map(id => document.getElementById(id));
  }

  hideAllScreens() { this.screens.forEach(s => s.classList.add('hidden')); }
  show(id) { document.getElementById(id).classList.remove('hidden'); }

  setHudVisible(visible) { this.el.hud.classList.toggle('hidden', !visible); }

  updateHud(player, elapsed, weaponSystem, killCount) {
    const hpPct = clamp(player.hp / player.maxHp, 0, 1);
    this.el.hpBar.style.transform = `scaleX(${hpPct})`;
    this.el.hpLabel.textContent = `${Math.ceil(player.hp)} / ${Math.round(player.maxHp)}`;
    const xpPct = clamp(player.xp / player.xpToNext, 0, 1);
    this.el.xpBar.style.transform = `scaleX(${xpPct})`;
    this.el.timer.textContent = formatTime(elapsed);
    this.el.goldVal.textContent = Math.floor(player.gold);
    this.el.levelBadge.textContent = `Lv ${player.level}`;
    this.el.killCounter.textContent = `Kills: ${killCount}`;
    this.el.killCounter.classList.remove('hidden');

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
    this.el.menuStats.innerHTML = `
      <div><b>${meta.stats.totalRuns}</b>Runs</div>
      <div><b>${formatTime(meta.stats.bestTime)}</b>Best Time</div>
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

  showLevelUp(choices, onPick) {
    this.hideAllScreens();
    this.show('screen-levelup');
    this.el.levelupChoices.innerHTML = '';
    for (const choice of choices) {
      const icon = iconFor(choice.id);
      const card = document.createElement('div');
      card.className = 'choice-card';
      card.innerHTML = `
        <div class="choice-icon" style="color:${icon.color};background:${icon.color}22;">${icon.glyph}</div>
        <div class="choice-text">
          <b>${choice.title}</b>
          <span class="sub">${choice.subtitle}</span>
          <p>${choice.desc}</p>
        </div>`;
      card.addEventListener('click', () => onPick(choice));
      this.el.levelupChoices.appendChild(card);
    }
  }

  showPause() { this.hideAllScreens(); this.show('screen-pause'); }

  showEnd(victory, stats) {
    this.hideAllScreens();
    this.show('screen-end');
    this.el.endTitle.textContent = victory ? 'You Survived!' : 'You Fell...';
    this.el.endTitle.style.color = victory ? '#7CFC9A' : '#ff5e8a';
    this.el.endStats.innerHTML = `
      <div><b>${formatTime(stats.time)}</b>Time Survived</div>
      <div><b>${stats.level}</b>Level Reached</div>
      <div><b>${stats.kills}</b>Kills</div>
      <div><b>${stats.goldEarned}</b>Gold Earned</div>
    `;
  }
}

function camel(id) {
  return id.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

export const ui = new UI();
