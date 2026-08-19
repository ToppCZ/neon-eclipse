import { clamp, randRange, TAU, rng, seedRng, hashSeed, WORLD_HALF, angleTo, shadeFill } from './utils.js';
import { Player, getCharacter, listCharacters, getRelic, listRelics } from './player.js';
import { EnemyManager, FROST_AURA_RADIUS } from './enemies.js';
import { WeaponSystem, WEAPONS } from './weapons.js';
import { PASSIVES, rollUpgradeChoices, applyUpgradeChoice, rollShopOffers, shopRerollCost } from './upgrades.js';
import { PickupManager } from './pickups.js';
import { ParticleSystem } from './particles.js';
import { BOSS_TYPES, BIOMES } from './enemyData.js';
import { generateRun, currentAct, isLastAct } from './runMap.js';
import {
  loadMeta, saveMeta, getMetaBonuses, purchaseUpgrade, recordRunResult,
  listSlots, getActiveSlot, setActiveSlot, createSlot,
} from './meta.js';
import { loadSettings, saveSettings, diffMultipliers } from './settings.js';
import { checkAchievements } from './achievements.js';
import { rollBoonChoices } from './boons.js';
import { statusGlowColor } from './statusEffects.js';
import { audio } from './audio.js';
import { ui } from './ui.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = 0;
    this.height = 0;

    this.particles = new ParticleSystem();
    this.enemyManager = new EnemyManager(this.particles, audio);
    this.weaponSystem = new WeaponSystem(this.enemyManager, this.particles, audio);
    this.pickups = new PickupManager(this.particles, audio);

    this.meta = loadMeta();
    this.settings = loadSettings();
    audio.setMusicVolume(this.settings.musicVolume);
    audio.setSfxVolume(this.settings.sfxVolume);
    this.particles.reduced = this.settings.reducedMotion;
    this.enemyManager.diff = diffMultipliers(this.settings.difficulty);
    this.enemyManager.colorblind = this.settings.colorblindMode;
    this.weaponSystem.manualAimEnabled = this.settings.manualAim;
    this._settingsReturnTo = 'menu';
    this.player = null;
    this.state = 'menu';
    this.mode = 'story'; // 'story' | 'endless'
    this.pendingMode = 'story';
    this.elapsed = 0; // total time across the whole run (display only)
    this.killCount = 0;

    this.run = null;
    this.endless = null; // { wave, waveDuration } — only set while mode === 'endless'
    this.currentNode = null;
    this.nodeType = null;
    this.nodeBiome = null;
    this.nodeActNumber = 1;
    this.nodeElapsed = 0;
    this.nodeDuration = 0;

    this.camX = 0; this.camY = 0;
    this.shakeTime = 0; this.shakeMag = 0;
    this.hitStopTimer = 0;

    this.pendingLevelUps = [];
    this.hazards = [];
    this.statSamples = [];
    this._sampleTimer = 0;
    this.extractTarget = 0;
    this.extractCollected = 0;

    // Kill-streak momentum: decays if the player stops scoring kills.
    this.killStreak = 0;
    this.killStreakTimer = 0;

    // Adrenaline: a brief damage buff granted for dashing near danger.
    this.adrenalineTimer = 0;
    this._wasDashing = false;

    // Full-screen flash overlay, used for level-up / evolution / combo beats.
    this.flashColor = null;
    this.flashAlpha = 0;
    this.flashTimer = 0;
    this.flashDuration = 0;

    // Live menu background animation clock (real-time, since update() is
    // gated off while state !== 'playing').
    this.menuTime = 0;
    this._menuLastNow = null;

    this.enemyManager.onDeath = (e) => this.onEnemyDeath(e);
    this.enemyManager.onPlayerHit = (amount, x, y) => this.onPlayerHit(amount, x, y);
    this.weaponSystem._onComboUnlocked = (c) => this.onComboUnlocked(c);

    this.bindMenus();
  }

  flashScreen(color, alpha, duration) {
    this.flashColor = color;
    this.flashAlpha = alpha;
    this.flashDuration = duration;
    this.flashTimer = duration;
  }

  onComboUnlocked(combo) {
    ui.flashBanner(`⚡ COMBO UNLOCKED: ${combo.name}! ⚡`);
    this.flashScreen('#c98cff', 0.3, 0.3);
    this.addHitStop(0.06);
    this.addShake(5, 0.25);
    if (audio.levelUp) audio.levelUp();
  }

  resize(w, h) { this.width = w; this.height = h; }

  addShake(mag, time) {
    const scale = this.settings.screenShake;
    if (scale <= 0) return;
    this.shakeMag = Math.max(this.shakeMag, mag * scale);
    this.shakeTime = Math.max(this.shakeTime, time);
  }

  // Brief heavy-slowmo beat on a big hit, for impact weight (see update()).
  // Skipped under reduced motion, same spirit as the particle-count halving.
  addHitStop(duration) {
    if (this.particles.reduced) return;
    this.hitStopTimer = Math.max(this.hitStopTimer, duration);
  }

  openSettings() {
    ui.showSettings(this.settings, (k, v) => this.onSettingChange(k, v), { slots: listSlots(), active: getActiveSlot() });
  }

  onSettingChange(key, value) {
    if (key === 'exportSave') { this.exportSave(); return; }
    if (key === 'importSave') { this.importSave(); return; }
    if (key === 'switchSlot') {
      setActiveSlot(value);
      this.meta = loadMeta(value);
      this.openSettings();
      return;
    }
    if (key === 'newSlot') {
      const name = (window.prompt('New save slot name:') || '').trim().slice(0, 24);
      if (!name) return;
      createSlot(name);
      this.meta = loadMeta(name);
      this.openSettings();
      return;
    }
    if (key.startsWith('keybind:')) {
      this.settings.keybinds[key.slice('keybind:'.length)] = value;
      saveSettings(this.settings);
      return;
    }
    this.settings[key] = value;
    saveSettings(this.settings);
    if (key === 'musicVolume') audio.setMusicVolume(value);
    else if (key === 'sfxVolume') audio.setSfxVolume(value);
    else if (key === 'reducedMotion') this.particles.reduced = value;
    else if (key === 'difficulty') this.enemyManager.diff = diffMultipliers(value);
    else if (key === 'colorblindMode') this.enemyManager.colorblind = value;
    else if (key === 'manualAim') this.weaponSystem.manualAimEnabled = value;
  }

  // Same-conditions-for-everyone-today run: a date-derived seed picks the
  // character/relic deterministically and forces Hard, without touching the
  // player's own saved difficulty. Always Endless Mode, since it has no
  // branching map to also make deterministic. Tracked separately in
  // meta.dailyBest by calendar date (UTC).
  startDailyChallenge() {
    const dateStr = new Date().toISOString().slice(0, 10);
    const seed = hashSeed(`daily-${dateStr}`);
    const chars = listCharacters();
    const relics = listRelics();
    const character = chars[seed % chars.length];
    const relic = relics[Math.floor(seed / chars.length) % relics.length];
    this._pendingSeed = seed;
    this._dailyChallengeDate = dateStr;
    this.enemyManager.diff = diffMultipliers('hard');
    this.startRun(character.id, relic.id, 'endless');
  }

  // Downloads meta-progression + settings as one JSON file so progress
  // survives a browser data clear or moves to another device/browser.
  exportSave() {
    const payload = { version: 1, meta: this.meta, settings: this.settings };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'neon-eclipse-save.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  importSave() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const payload = JSON.parse(String(reader.result));
          if (payload.meta) { this.meta = payload.meta; saveMeta(this.meta); }
          if (payload.settings) {
            this.settings = { ...loadSettings(), ...payload.settings };
            saveSettings(this.settings);
            audio.setMusicVolume(this.settings.musicVolume);
            audio.setSfxVolume(this.settings.sfxVolume);
            this.particles.reduced = this.settings.reducedMotion;
            this.enemyManager.diff = diffMultipliers(this.settings.difficulty);
            this.enemyManager.colorblind = this.settings.colorblindMode;
            this.weaponSystem.manualAimEnabled = this.settings.manualAim;
          }
          this.openSettings();
          window.alert('Save imported.');
        } catch {
          window.alert('That file could not be read as a Neon Eclipse save.');
        }
      };
      reader.readAsText(file);
    });
    input.click();
  }

  // ---------------- Menu wiring ----------------
  bindMenus() {
    const goToCharacterSelect = (mode) => {
      audio.uiClick();
      this.pendingMode = mode;
      ui.showCharacterSelect(listCharacters(), (id) => this.showRelicSelect(id));
    };
    ui.el.btnPlay.addEventListener('click', () => goToCharacterSelect('story'));
    ui.el.btnEndless.addEventListener('click', () => goToCharacterSelect('endless'));
    ui.el.btnDaily.addEventListener('click', () => { audio.uiClick(); this.startDailyChallenge(); });
    ui.el.btnShop.addEventListener('click', () => { audio.uiClick(); ui.showShop(this.meta, (id) => this.buyMetaUpgrade(id)); });
    ui.el.btnLeaderboard.addEventListener('click', () => { audio.uiClick(); ui.showLeaderboard(this.meta); });
    ui.el.btnBackLeaderboard.addEventListener('click', () => { audio.uiClick(); this.goToMenu(); });
    ui.el.btnBackChars.addEventListener('click', () => { audio.uiClick(); this.goToMenu(); });
    ui.el.btnBackShop.addEventListener('click', () => { audio.uiClick(); this.goToMenu(); });
    ui.el.btnResume.addEventListener('click', () => { audio.uiClick(); this.resume(); });
    ui.el.btnQuit.addEventListener('click', () => {
      if (!window.confirm('Quit this run? Progress will be lost.')) return;
      audio.uiClick();
      this.goToMenu();
    });
    ui.el.btnRetry.addEventListener('click', () => goToCharacterSelect(this.mode));

    ui.el.btnSeed.addEventListener('click', () => {
      const input = window.prompt('Enter a seed (letters or numbers, blank = random):', this._pendingSeed != null ? String(this._pendingSeed) : '');
      if (input === null) return;
      const trimmed = input.trim();
      if (trimmed === '') { this._pendingSeed = null; }
      else {
        const asNum = Number(trimmed);
        this._pendingSeed = Number.isFinite(asNum) ? (Math.abs(Math.floor(asNum)) >>> 0) : hashSeed(trimmed);
      }
      ui.el.btnSeed.textContent = this._pendingSeed != null ? `Seed: ${this._pendingSeed}` : 'Seed: Random';
    });

    ui.el.btnBuildSummary.addEventListener('click', () => {
      if (!this.player) return;
      audio.uiClick();
      ui.toggleBuildSummary(this.player, this.weaponSystem);
    });

    ui.el.btnSettings.addEventListener('click', () => { audio.uiClick(); this._settingsReturnTo = 'menu'; this.openSettings(); });
    ui.el.btnPauseSettings.addEventListener('click', () => { audio.uiClick(); this._settingsReturnTo = 'pause'; this.openSettings(); });
    ui.el.btnBackSettings.addEventListener('click', () => {
      audio.uiClick();
      if (this._settingsReturnTo === 'pause') { this.state = 'paused'; ui.showPause(); }
      else this.goToMenu();
    });
    ui.el.btnBalance.addEventListener('click', () => { audio.uiClick(); ui.showBalance(this.meta); });
    ui.el.btnBackBalance.addEventListener('click', () => { audio.uiClick(); this.openSettings(); });
    ui.el.btnEndMenu.addEventListener('click', () => { audio.uiClick(); this.goToMenu(); });
    ui.el.muteBtn.addEventListener('click', () => {
      this.muted = !this.muted;
      audio.setMuted(this.muted);
      ui.el.muteBtn.textContent = this.muted ? '🔇' : '🔊';
    });
  }

  // Dev-only pick-frequency tracking (backlog item #47): every applied
  // weapon/passive choice increments a counter in meta.pickStats, visible
  // from Settings -> Balance Stats. Deliberately scoped to pick counts, not
  // "win rate" — attributing a single win/loss to one item among several
  // picked over a run isn't reliably meaningful, so it's not claimed here.
  applyChoiceTracked(choice) {
    applyUpgradeChoice(choice, this.player, this.weaponSystem);
    this.meta.pickStats = this.meta.pickStats || { weapons: {}, passives: {} };
    if (choice.kind === 'weaponNew' || choice.kind === 'weaponLevel') {
      this.meta.pickStats.weapons[choice.id] = (this.meta.pickStats.weapons[choice.id] || 0) + 1;
    } else if (choice.kind === 'passive') {
      this.meta.pickStats.passives[choice.id] = (this.meta.pickStats.passives[choice.id] || 0) + 1;
    }
    saveMeta(this.meta);
  }

  buyMetaUpgrade(id) {
    const ok = purchaseUpgrade(this.meta, id);
    if (ok) audio.uiClick();
    return ok;
  }

  goToMenu() {
    this.state = 'menu';
    audio.stopMusic();
    ui.showMenu(this.meta);
    this.applyBiomeTint(null);
  }

  applyBiomeTint(biome) {
    document.documentElement.style.setProperty('--biome-tint', biome ? biome.accent + '26' : 'transparent');
  }

  runLabel() {
    if (this.mode === 'endless') {
      if (!this.endless) return '';
      const elements = this.weaponSystem.synergy ? this.weaponSystem.synergy.elementCount : 0;
      return `Wave ${this.endless.wave} · Elements ${elements}/4`;
    }
    if (!this.run) return '';
    const act = currentAct(this.run);
    const elements = this.weaponSystem.synergy ? this.weaponSystem.synergy.elementCount : 0;
    return `Act ${act.actNumber} · Node ${this.run.stepIndex + 1}/${act.steps.length} · Elements ${elements}/4`;
  }

  showRelicSelect(characterId) {
    audio.uiClick();
    const choices = listRelics().map(r => ({ kind: 'relic', id: r.id, title: r.name, subtitle: 'Relic', desc: r.desc, tier: 'legendary' }));
    ui.showChoiceModal('Choose a Relic', choices, (choice) => this.startRun(characterId, choice.id, this.pendingMode));
  }

  // ---------------- Run lifecycle ----------------
  startRun(characterId, relicId, mode = 'story') {
    audio.resume();
    const seed = this._pendingSeed != null ? this._pendingSeed : Math.floor(Math.random() * 0xffffffff);
    seedRng(seed);
    this.runSeed = seed;
    const character = getCharacter(characterId);
    const relic = getRelic(relicId);
    const bonuses = getMetaBonuses(this.meta);
    this.player = new Player(character, bonuses, relic);
    this.player.recomputeStats(PASSIVES);
    this.player.hp = this.player.maxHp;

    this.weaponSystem.reset();
    this.weaponSystem.equip(character.startWeapon);

    this.mode = mode;
    this.elapsed = 0;
    this.killCount = 0;
    this.statSamples = [{ t: 0, hpPct: 1 }];
    this._sampleTimer = 2;
    this.killStreak = 0;
    this.killStreakTimer = 0;
    this.adrenalineTimer = 0;
    this._wasDashing = false;

    if (mode === 'endless') {
      this.run = null;
      this.startEndlessRun();
    } else {
      this.run = generateRun();
      this.goToMap();
    }
  }

  // Wave-based survival mode: no acts/bosses to clear, just an escalating
  // spawn ramp that never stops. Progression comes from the between-wave
  // shop (spend in-run Cores on permanent-for-the-run upgrades) instead of
  // node choices — endless "keep buying upgrades to push further."
  startEndlessRun() {
    this.enemyManager.reset();
    this.pickups.reset();
    this.particles.clear();

    this.endless = { wave: 1, waveDuration: 40 };
    this.nodeType = 'endless';
    this.nodeBiome = BIOMES[0];
    this.nodeActNumber = this.endlessTier(1);
    this.nodeElapsed = 0;
    this.applyBiomeTint(this.nodeBiome);

    this.camX = this.player.x; this.camY = this.player.y;
    this.hazards = this.generateHazards(this.nodeBiome, this.player.x, this.player.y);

    this.state = 'playing';
    ui.hideAllScreens();
    ui.setHudVisible(true);
    ui.updateHud(this.player, this.elapsed, this.weaponSystem, this.killCount, this.runLabel());
    audio.startMusic();
  }

  // Difficulty keeps climbing forever with wave count (fed into the same
  // per-act scaling formulas enemies.js already uses for the story mode).
  endlessTier(wave) { return 1 + (wave - 1) * 0.5; }

  // Every 5th wave drops in a tougher elite; every 10th a full boss (cycled
  // through the roster, scaled up by how many times it's been re-fought).
  spawnWaveThreat() {
    const wave = this.endless.wave;
    if (wave % 10 === 0) {
      const bossIds = Object.keys(BOSS_TYPES);
      const cycle = Math.floor(wave / 10) - 1;
      const bossId = bossIds[cycle % bossIds.length];
      const tierMult = 1 + Math.floor(cycle / bossIds.length) * 0.8;
      this.enemyManager.spawnBoss(bossId, this.player, WORLD_HALF, tierMult, 1 + (tierMult - 1) * 0.6);
      ui.flashBossBanner(BOSS_TYPES[bossId].name);
      this.addShake(14, 0.5);
    } else if (wave % 5 === 0) {
      const elite = this.enemyManager.spawnElite(this.nodeBiome, this.player, WORLD_HALF, this.nodeActNumber, this.weaponSystem);
      const affixNames = { explosive: 'Explosive', shielded: 'Shielded', frozenAura: 'Frost Aura' };
      ui.flashBossBanner(`Elite Enemy (${affixNames[elite.affix] || elite.affix})`);
    }
  }

  onWaveCleared() {
    this.endless.wave += 1;
    this.state = 'nodeShop';
    this._shopRerollCount = 0;
    this.shopState = {
      player: this.player,
      offers: rollShopOffers(this.player, this.weaponSystem, 4).map(o => ({ ...o, bought: false })),
      rerollCost: shopRerollCost(0),
    };
    this.shopContinueFn = () => this.continueEndless();
    audio.levelUp();
    ui.showNodeShop(this.shopState, (offer) => this.buyShopOffer(offer), () => this.rerollShop(), this.shopContinueFn);
  }

  continueEndless() {
    this.nodeElapsed = 0;
    this.nodeBiome = BIOMES[(this.endless.wave - 1) % BIOMES.length];
    this.nodeActNumber = this.endlessTier(this.endless.wave);
    this.applyBiomeTint(this.nodeBiome);
    this.hazards = this.generateHazards(this.nodeBiome, this.player.x, this.player.y);
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + this.player.maxHp * 0.12);
    this.spawnWaveThreat();

    this.state = 'playing';
    ui.hideAllScreens();
    ui.setHudVisible(true);
    ui.updateHud(this.player, this.elapsed, this.weaponSystem, this.killCount, this.runLabel());
  }

  goToMap() {
    this.state = 'map';
    ui.showMap(this.run, (node) => this.selectNode(node));
    this.applyBiomeTint(null);
  }

  selectNode(node) {
    audio.uiClick();
    this.currentNode = node;
    if (node.type === 'combat' || node.type === 'elite' || node.type === 'boss' || node.type === 'extract') {
      this.beginCombatNode(node);
    } else if (node.type === 'shop') {
      this.beginShopNode(node);
    } else if (node.type === 'treasure') {
      this.beginTreasureNode(node);
    } else if (node.type === 'rest') {
      this.beginRestNode(node);
    } else if (node.type === 'boon') {
      this.beginBoonNode();
    }
  }

  beginCombatNode(node) {
    this.enemyManager.reset();
    this.pickups.reset();
    this.particles.clear();

    this.nodeType = node.type;
    this.nodeBiome = node.biome;
    this.nodeActNumber = node.biome.act;
    this.applyBiomeTint(this.nodeBiome);
    this.nodeElapsed = 0;
    this.nodeDuration = (node.type === 'combat' || node.type === 'extract') ? randRange(100, 130) : null;

    this.camX = this.player.x; this.camY = this.player.y;
    this.hazards = this.generateHazards(node.biome, this.player.x, this.player.y);

    if (node.type === 'elite') {
      const elite = this.enemyManager.spawnElite(node.biome, this.player, WORLD_HALF, this.nodeActNumber, this.weaponSystem);
      const affixNames = { explosive: 'Explosive', shielded: 'Shielded', frozenAura: 'Frost Aura', regenerating: 'Regenerating' };
      ui.flashBossBanner(`Elite Enemy (${affixNames[elite.affix] || elite.affix})`);
    } else if (node.type === 'boss') {
      this.enemyManager.spawnBoss(node.biome.boss, this.player, WORLD_HALF);
      ui.flashBossBanner(BOSS_TYPES[node.biome.boss].name);
      this.addShake(14, 0.5);
    } else if (node.type === 'extract') {
      this.extractTarget = 5;
      this.extractCollected = 0;
      for (let i = 0; i < this.extractTarget; i++) {
        const a = randRange(0, TAU);
        const d = randRange(300, 700);
        this.pickups.spawnCanister(this.player.x + Math.cos(a) * d, this.player.y + Math.sin(a) * d);
      }
      ui.flashBossBanner('Extraction: collect the canisters!');
    }

    this.state = 'playing';
    ui.hideAllScreens();
    ui.setHudVisible(true);
    ui.updateHud(this.player, this.elapsed, this.weaponSystem, this.killCount, this.runLabel());
    audio.startMusic();
  }

  // Static terrain hazards scattered around the node's starting position —
  // tactical ground the player has to route around while fighting.
  generateHazards(biome, originX, originY) {
    if (!biome.hazardType) return [];
    const hazards = [];
    const count = 3 + Math.floor(randRange(0, 2));
    for (let i = 0; i < count; i++) {
      const angle = randRange(0, TAU);
      const dist = randRange(280, 650);
      hazards.push({
        x: originX + Math.cos(angle) * dist,
        y: originY + Math.sin(angle) * dist,
        radius: randRange(55, 90),
        type: biome.hazardType,
        tickTimer: 0,
      });
    }
    return hazards;
  }

  updateHazards(dt) {
    if (this.hazards.length === 0) return;
    const p = this.player;
    for (const h of this.hazards) {
      h.tickTimer -= dt;
      if (h.tickTimer > 0) continue;
      h.tickTimer = 0.5;
      const dmg = h.type === 'fire' ? 7 : 5;
      if (Math.hypot(p.x - h.x, p.y - h.y) <= h.radius) this.onPlayerHit(dmg, p.x, p.y);

      // Enemies knocked (or wandered) into a hazard zone take damage too —
      // gives knockback weapons a real tactical payoff beyond crowd control.
      this.enemyManager.queryNearby(h.x, h.y, h.radius, (e) => {
        const dealt = this.enemyManager.damageEnemy(e, dmg + 2, angleTo(h.x, h.y, e.x, e.y), 30, h.type === 'fire' ? 'fire' : 'physical');
        this.particles.damageText(e.x, e.y - 10, dealt);
      });
    }
  }

  beginShopNode() {
    this.state = 'nodeShop';
    this._shopRerollCount = 0;
    this.shopState = {
      player: this.player,
      offers: rollShopOffers(this.player, this.weaponSystem, 4).map(o => ({ ...o, bought: false })),
      rerollCost: shopRerollCost(0),
    };
    this.shopContinueFn = () => { this.run.nodesCleared += 1; this.advanceRun(); };
    ui.showNodeShop(this.shopState, (offer) => this.buyShopOffer(offer), () => this.rerollShop(), this.shopContinueFn);
  }

  buyShopOffer(offer) {
    if (offer.bought || this.player.cores < offer.cost) return;
    this.player.cores -= offer.cost;
    this.applyChoiceTracked(offer);
    offer.bought = true;
    audio.pickup();
    ui.renderNodeShop(this.shopState, (o) => this.buyShopOffer(o), () => this.rerollShop(), this.shopContinueFn);
  }

  rerollShop() {
    const cost = this.shopState.rerollCost;
    if (this.player.cores < cost) return;
    this.player.cores -= cost;
    this._shopRerollCount += 1;
    this.shopState.offers = rollShopOffers(this.player, this.weaponSystem, 4).map(o => ({ ...o, bought: false }));
    this.shopState.rerollCost = shopRerollCost(this._shopRerollCount);
    audio.uiClick();
    ui.renderNodeShop(this.shopState, (o) => this.buyShopOffer(o), () => this.rerollShop(), this.shopContinueFn);
  }

  beginTreasureNode() {
    this.state = 'nodeChoice';
    const choices = rollUpgradeChoices(this.player, this.weaponSystem, 3);
    ui.showChoiceModal('Treasure Found', choices, (choice) => {
      this.applyChoiceTracked(choice);
      this.run.nodesCleared += 1;
      audio.pickup();
      this.advanceRun();
    });
  }

  beginRestNode() {
    this.state = 'nodeChoice';
    const healAmt = Math.round(this.player.maxHp * 0.35);
    const choices = [
      { kind: 'restHeal', id: 'vitality', title: 'Rest & Heal', subtitle: `+${healAmt} HP`, desc: 'Patch up before the next fight.' },
      { kind: 'restTemper', id: 'might', title: 'Temper Gear', subtitle: '+5% Might', desc: 'Sharpen your weapons instead of resting.' },
    ];
    ui.showChoiceModal('Safehouse', choices, (choice) => {
      if (choice.kind === 'restHeal') {
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + healAmt);
      } else {
        this.player.baseMight *= 1.05;
        this.player.recomputeStats(PASSIVES);
      }
      this.run.nodesCleared += 1;
      audio.levelUp();
      this.advanceRun();
    });
  }

  onCombatNodeCleared() {
    this.run.nodesCleared += 1;
    this.state = 'nodeChoice';
    audio.levelUp();
    this.addShake(6, 0.25);

    let title = 'Node Cleared!';
    if (this.nodeType === 'extract') {
      const success = this.extractCollected >= this.extractTarget;
      const bonus = success ? 40 : Math.round(40 * (this.extractCollected / this.extractTarget));
      this.player.cores += bonus;
      title = success
        ? `Extraction Complete! (+${bonus} Cores)`
        : `Extraction Partial (${this.extractCollected}/${this.extractTarget}, +${bonus} Cores)`;
    }

    const choices = rollUpgradeChoices(this.player, this.weaponSystem, 3);
    ui.showChoiceModal(title, choices, (choice) => {
      this.applyChoiceTracked(choice);
      this.advanceRun();
    });
  }

  // "Boon" nodes: a real risk/reward tradeoff (buff + drawback), with two
  // mutually-exclusive paths that lock each other out once either is picked
  // — a branching choice, not just a bigger number. See boons.js.
  beginBoonNode() {
    this.state = 'nodeChoice';
    const choices = rollBoonChoices(this.player, 2);
    ui.showChoiceModal('Cursed Altar', choices, (choice) => {
      choice._apply(this.player);
      if (choice._path) this.player.lockedBoonPath = choice._path;
      this.player.recomputeStats(PASSIVES);
      this.player.hp = Math.min(this.player.hp, this.player.maxHp);
      this.run.nodesCleared += 1;
      audio.levelUp();
      this.advanceRun();
    });
  }

  advanceRun() {
    this.run.stepIndex += 1;
    if (this.run.stepIndex >= currentAct(this.run).steps.length) {
      if (isLastAct(this.run)) { this.endRun(true); return; }
      this.run.actIndex += 1;
      this.run.stepIndex = 0;
      this.player.hp = this.player.maxHp; // breather between acts
    }
    this.goToMap();
  }

  togglePause() {
    if (this.state === 'playing') { this.state = 'paused'; ui.showPause(); }
    else if (this.state === 'paused') this.resume();
  }

  resume() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    ui.hideAllScreens();
    ui.setHudVisible(true);
  }

  endRun(victory) {
    this.state = victory ? 'victory' : 'gameover';
    audio.stopMusic();
    if (victory) audio.victory(); else audio.gameOver();

    let stats;
    if (this.mode === 'endless') {
      const wave = this.endless.wave;
      const goldEarned = Math.floor(this.player.cores * 0.5 + wave * 18);
      stats = { mode: 'endless', victory, time: this.elapsed, level: this.player.level, kills: this.killCount, wave, goldEarned, seed: this.runSeed, samples: this.statSamples };
    } else {
      const actReached = this.run.actIndex + 1;
      const goldEarned = Math.floor(
        this.player.cores * 0.5 + this.run.nodesCleared * 12 + this.run.actIndex * 60 + (victory ? 150 : 0)
      );
      stats = {
        mode: 'story', victory, time: this.elapsed, level: this.player.level, kills: this.killCount,
        actReached, nodesCleared: this.run.nodesCleared, goldEarned, seed: this.runSeed, samples: this.statSamples,
      };
    }

    if (!victory) stats.nearMiss = this.computeNearMiss();

    // A brand-new player's first run guarantees enough gold for their first
    // meta-shop unlock, rather than leaving first-session pacing to luck.
    if (this.meta.stats.totalRuns === 0) {
      stats.firstRunBonus = 40;
      stats.goldEarned += 40;
    }

    recordRunResult(this.meta, stats);
    const unlocked = checkAchievements(this.meta, stats);

    if (this._dailyChallengeDate) {
      const dateStr = this._dailyChallengeDate;
      this.meta.dailyBest = this.meta.dailyBest || {};
      const prevBest = this.meta.dailyBest[dateStr] || 0;
      stats.daily = dateStr;
      stats.dailyBest = Math.max(prevBest, stats.wave || 0);
      stats.dailyIsNewBest = (stats.wave || 0) > prevBest;
      this.meta.dailyBest[dateStr] = stats.dailyBest;
      // Restore normal state — the challenge's fixed seed/difficulty only apply to this one run.
      this._pendingSeed = null;
      this._dailyChallengeDate = null;
      this.enemyManager.diff = diffMultipliers(this.settings.difficulty);
    }

    saveMeta(this.meta);
    ui.setHudVisible(false);
    ui.showEnd(victory, stats, unlocked);
  }

  // "So close" framing for a death screen: surfaces how near the player was
  // to their next weapon evolution and their ultimate, instead of just "you died."
  computeNearMiss() {
    const ultimatePct = Math.round(clamp(this.player.ultimateCharge, 0, 1) * 100);
    let closest = null;
    for (const slot of this.weaponSystem.slots) {
      if (slot.evolved) continue;
      const def = WEAPONS[slot.id];
      const levelsLeft = def.maxLevel - slot.level;
      const hasPassive = this.player.passives.get(def.evolutionRequires) > 0;
      const score = levelsLeft + (hasPassive ? 0 : 1); // roughly "steps away"
      if (!closest || score < closest.score) closest = { score, name: def.name, levelsLeft, hasPassive };
    }
    return { ultimatePct, evolution: closest };
  }

  // Active ability, independent of the 6 passive-fire weapon slots (backlog
  // item #12: "weapon-swap/active-ability slot"). A big AoE burst, manually
  // triggered once fully charged (see Player.ULTIMATE_CHARGE_TIME).
  triggerUltimate() {
    this.player.ultimateCharge = 0;
    const radius = 260 * this.player.area;
    const damage = 60 * this.player.might;
    this.enemyManager.queryNearby(this.player.x, this.player.y, radius, (e) => {
      const a = angleTo(this.player.x, this.player.y, e.x, e.y);
      const dealt = this.enemyManager.damageEnemy(e, damage, a, 300, 'physical');
      this.particles.damageText(e.x, e.y - 10, dealt);
    });
    this.particles.burst(this.player.x, this.player.y, { count: 50, color: '#ffffff', speed: 380, life: 0.7, glow: true });
    this.addShake(18, 0.5);
    audio.explosion();
  }

  // ---------------- Event callbacks ----------------
  onEnemyDeath(e) {
    this.killCount += 1;
    this.killStreak += 1;
    this.killStreakTimer = 2.5; // resets to 0 if no kill lands within this window
    this.pickups.spawnXp(e.x, e.y, e.xp);
    const coreChance = e.isBoss ? 1 : (e.isElite ? 0.9 : 0.16 * clamp(this.player.luck, 0.5, 3));
    if (rng() < coreChance) {
      const value = e.isBoss ? randRange(30, 60) : (e.isElite ? randRange(15, 28) : randRange(1, 4));
      this.pickups.spawnCores(e.x, e.y, value);
    }
    const deathColor = statusGlowColor(e, this.settings.colorblindMode) || e.color;
    this.particles.burst(e.x, e.y, { count: e.isBoss ? 40 : (e.isElite ? 24 : 10), color: deathColor, speed: e.isBoss ? 260 : 140, life: 0.5, glow: true });
    if (audio) audio.enemyDeath(1 + Math.min(0.3, Math.floor(this.killStreak / 10) * 0.03));
    if (e.isBoss || e.isElite) {
      // Expanding ring shockwave (reuses the purely-visual nova effect — damage:0
      // means it never applies damage on its own) plus a beat of hit-stop weight.
      this.weaponSystem.effects.spawn({ kind: 'nova', x: e.x, y: e.y, life: 0.4, damage: 0, radius: 0, growTo: e.isBoss ? 220 : 120, color: deathColor });
      this.addHitStop(e.isBoss ? 0.1 : 0.05);
    }
    if (e.isBoss) this.addShake(16, 0.6);

    if (e.affix === 'explosive') {
      const d = Math.hypot(this.player.x - e.x, this.player.y - e.y);
      if (d < 150) this.onPlayerHit(35, e.x, e.y);
      this.particles.burst(e.x, e.y, { count: 30, color: '#ffb14a', speed: 300, life: 0.6, glow: true });
      audio.explosion();
      this.addShake(12, 0.4);
    }
  }

  onPlayerHit(amount, x, y) {
    const dealt = this.player.takeDamage(amount);
    if (dealt > 0) {
      this.particles.burst(x, y, { count: 6, color: '#ff5e8a', speed: 100, life: 0.3 });
      audio.playerHurt();
      this.addShake(9, 0.25);
      if (dealt > 20) this.addHitStop(0.05);
    }
    if (this.player.dead) this.endRun(false);
  }

  onPickupCollect(g) {
    if (g.kind === 'xp') {
      const streakMult = 1 + Math.min(0.3, Math.floor(this.killStreak / 10) * 0.03);
      const levels = this.player.gainXp(g.value * streakMult);
      this.particles.spark(g.x, g.y, 0, '#5ee6ff', 3);
      if (levels) this.queueLevelUps(levels.length);
    } else if (g.kind === 'canister') {
      this.extractCollected = (this.extractCollected || 0) + 1;
      this.particles.burst(g.x, g.y, { count: 14, color: '#7CFC9A', speed: 160, life: 0.4, glow: true });
    } else {
      this.player.cores += g.value * this.player.coreValueMult;
      this.particles.spark(g.x, g.y, 0, '#ffd54a', 3);
    }
  }

  queueLevelUps(count) {
    for (let i = 0; i < count; i++) this.pendingLevelUps.push(true);
    if (this.state === 'playing') this.presentNextLevelUp();
  }

  presentNextLevelUp() {
    if (this.pendingLevelUps.length === 0) return;
    this.pendingLevelUps.pop();
    this.state = 'levelup';
    audio.levelUp();
    this.addShake(4, 0.2);
    this.flashScreen('#ffd54a', 0.35, 0.25);
    this.addHitStop(0.05);
    this.particles.burst(this.player.x, this.player.y, { count: 18, color: '#ffd54a', speed: 220, life: 0.5, glow: true });
    const choices = rollUpgradeChoices(this.player, this.weaponSystem, 3);
    ui.showChoiceModal('Level Up!', choices, (choice) => {
      this.applyChoiceTracked(choice);
      if (this.pendingLevelUps.length > 0) {
        this.presentNextLevelUp();
      } else {
        this.state = 'playing';
        ui.hideAllScreens();
        ui.setHudVisible(true);
      }
    });
  }

  // ---------------- Main loop ----------------
  update(dt, input) {
    if (this.state !== 'playing') return;

    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= dt;
      dt *= 0.06; // heavy slowmo rather than a full freeze — keeps rendering/input smooth
    }

    this.elapsed += dt;
    this.nodeElapsed += dt;

    this._sampleTimer -= dt;
    if (this._sampleTimer <= 0) {
      this._sampleTimer = 2;
      this.statSamples.push({ t: this.elapsed, hpPct: clamp(this.player.hp / this.player.maxHp, 0, 1) });
    }

    const elite = this.enemyManager.activeElite;
    this.player.auraSlowMult = (elite && elite.affix === 'frozenAura' && Math.hypot(this.player.x - elite.x, this.player.y - elite.y) < FROST_AURA_RADIUS) ? 0.6 : 1;

    if (this.weaponSystem.manualAimEnabled) {
      this.weaponSystem.aim = { x: input.mouseX - this.width / 2 + this.camX, y: input.mouseY - this.height / 2 + this.camY };
    }

    this.player.update(dt, input, WORLD_HALF);
    if (input.ultimatePressed && this.player.ultimateCharge >= 1) this.triggerUltimate();
    if (this.player.dashTimeLeft > 0) {
      this.particles.spark(this.player.x, this.player.y, this.player.dashAngle + Math.PI, this.player.char.color, 2);
      // A dash sweeps through and turns back any enemy shots caught in it —
      // a skill-based counter to ranged telegraphs, not just avoidance.
      this.enemyManager.deflectShotsNear(this.player.x, this.player.y, this.player.radius + 46);
    }
    // Adrenaline: dashing near danger (an enemy close enough to have hit you)
    // grants a brief post-dash damage window, making the dash an offensive
    // tool worth timing, not just a defensive panic button.
    if (this._wasDashing && this.player.dashTimeLeft <= 0) {
      if (this.enemyManager.nearest(this.player.x, this.player.y, 140)) {
        this.adrenalineTimer = 1.2;
        this.particles.labelText(this.player.x, this.player.y - 30, 'Adrenaline!', '#ff5e8a');
      }
    }
    this._wasDashing = this.player.dashTimeLeft > 0;
    if (this.adrenalineTimer > 0) this.adrenalineTimer -= dt;
    this.updateHazards(dt);

    // Kill-streak momentum: decays if no kill lands within the window, and
    // grants a small temporary damage bonus so momentum is worth protecting.
    if (this.killStreakTimer > 0) {
      this.killStreakTimer -= dt;
      if (this.killStreakTimer <= 0) this.killStreak = 0;
    }
    const streakMult = 1 + Math.min(0.3, Math.floor(this.killStreak / 10) * 0.03);
    this._streakDamageMult = streakMult;

    const spawningEnabled = this.nodeType === 'combat' || this.nodeType === 'endless' || this.nodeType === 'extract';
    this.enemyManager.update(dt, this.nodeElapsed, this.player, WORLD_HALF, this.nodeBiome, this.nodeActNumber, spawningEnabled);

    const adrenalineMult = this.adrenalineTimer > 0 ? 1.25 : 1;
    const baseMight = this.player.might;
    this.player.might = baseMight * streakMult * adrenalineMult;
    this.weaponSystem.update(dt, this.player);
    this.player.might = baseMight;

    const newlyEvolved = this.weaponSystem.checkEvolutions(this.player);
    if (newlyEvolved.length) {
      this.flashScreen('#ffd54a', 0.35, 0.3);
      this.addHitStop(0.08);
      this.addShake(6, 0.25);
    }

    this.pickups.update(dt, this.player, (g) => this.onPickupCollect(g));
    this.particles.update(dt);

    const camK = 1 - Math.exp(-6 * dt);
    this.camX += (this.player.x - this.camX) * camK;
    this.camY += (this.player.y - this.camY) * camK;

    if (this.shakeTime > 0) this.shakeTime -= dt;
    if (this.flashTimer > 0) this.flashTimer -= dt;

    // Music intensity ramps with time-into-node and player HP danger.
    const dangerFromTime = clamp(this.nodeElapsed / 60, 0, 1);
    const dangerFromHp = 1 - clamp(this.player.hp / this.player.maxHp, 0, 1);
    audio.setMusicIntensity(Math.max(dangerFromTime * 0.6, dangerFromHp));

    ui.updateHud(this.player, this.elapsed, this.weaponSystem, this.killCount, this.runLabel(), this.killStreak);

    if (this.player.dead) return; // onPlayerHit already triggered endRun

    if ((this.nodeType === 'combat' || this.nodeType === 'extract') && this.nodeElapsed >= this.nodeDuration) this.onCombatNodeCleared();
    else if (this.nodeType === 'elite' && !this.enemyManager.activeElite) this.onCombatNodeCleared();
    else if (this.nodeType === 'boss' && !this.enemyManager.activeBoss) this.onCombatNodeCleared();
    else if (this.nodeType === 'endless' && this.nodeElapsed >= this.endless.waveDuration) this.onWaveCleared();
  }

  // ---------------- Rendering ----------------
  render() {
    const ctx = this.ctx;
    ctx.save();
    const bg = (this.nodeBiome && this.state === 'playing') ? this.nodeBiome.bg : '#05060f';
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, this.width, this.height);

    let sx = 0, sy = 0;
    if (this.shakeTime > 0) {
      const f = this.shakeTime * this.shakeMag;
      sx = randRange(-f, f); sy = randRange(-f, f);
    } else {
      this.shakeMag = 0;
    }

    ctx.translate(this.width / 2 + sx, this.height / 2 + sy);

    const camX = this.camX, camY = this.camY;
    this.drawBackground(ctx, camX, camY);
    this.drawHazards(ctx, camX, camY);

    if (this.player) {
      this.pickups.render(ctx, camX, camY);
      this.enemyManager.render(ctx, camX, camY);
      this.weaponSystem.render(ctx, camX, camY, this.player);
      this.drawPlayer(ctx, camX, camY);
      this.particles.render(ctx);
    } else if (this.state === 'menu') {
      this.updateMenuTime();
      this.drawMenuScene(ctx);
    }

    ctx.restore();

    if (this.player && (this.state === 'playing' || this.state === 'paused' || this.state === 'levelup' || this.state === 'nodeShop')) {
      this.drawMinimap(ctx);
      this.drawThreatIndicators(ctx);
      if (this.enemyManager.activeBoss) this.drawBossBar(ctx, this.enemyManager.activeBoss);
    }

    if (this.flashTimer > 0) {
      const alpha = this.flashAlpha * (this.flashTimer / this.flashDuration);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.flashColor;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
    }
  }

  // Real-clock delta since update() is gated off while state !== 'playing',
  // so the menu background can't ride the game-logic dt.
  updateMenuTime() {
    const now = performance.now();
    if (this._menuLastNow == null) this._menuLastNow = now;
    const dt = Math.min(0.1, (now - this._menuLastNow) / 1000);
    this._menuLastNow = now;
    this.menuTime += dt;
  }

  // Slowly drifting glowing motes behind the main menu — cheap, deterministic
  // Lissajous motion so the menu no longer reads as a static black screen.
  drawMenuScene(ctx) {
    const t = this.menuTime;
    const colors = ['#5ee6ff', '#ff8a5e', '#c98cff', '#ffd54a', '#7CFC9A'];
    const halfW = this.width / 2, halfH = this.height / 2;
    ctx.save();
    for (let i = 0; i < 10; i++) {
      const seed = i * 12.9898;
      const fx = 0.05 + (i % 3) * 0.02;
      const fy = 0.04 + (i % 4) * 0.017;
      const x = Math.sin(t * fx + seed) * halfW * 0.7;
      const y = Math.cos(t * fy + seed * 1.7) * halfH * 0.6;
      const r = 3 + ((i * 37) % 5);
      ctx.globalAlpha = 0.35 + 0.25 * Math.sin(t * 0.6 + seed);
      ctx.fillStyle = colors[i % colors.length];
      ctx.shadowColor = colors[i % colors.length];
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  // Arrow at the screen edge pointing toward an active elite/boss once it
  // scrolls off-screen, so the player can navigate back to (or away from) it.
  drawThreatIndicators(ctx) {
    const targets = [];
    if (this.enemyManager.activeBoss) targets.push({ e: this.enemyManager.activeBoss, color: '#ff5e8a' });
    if (this.enemyManager.activeElite) targets.push({ e: this.enemyManager.activeElite, color: '#ffd54a' });
    if (!targets.length) return;

    const halfW = this.width / 2, halfH = this.height / 2, margin = 30;
    for (const { e, color } of targets) {
      const rx = e.x - this.camX, ry = e.y - this.camY;
      if (Math.abs(rx) < halfW - 40 && Math.abs(ry) < halfH - 40) continue; // already on-screen
      const angle = Math.atan2(ry, rx);
      const cos = Math.cos(angle) || 1e-6, sin = Math.sin(angle) || 1e-6;
      const scale = Math.min((halfW - margin) / Math.abs(cos), (halfH - margin) / Math.abs(sin));
      const px = halfW + cos * scale, py = halfH + sin * scale;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(angle);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(-8, 7);
      ctx.lineTo(-8, -7);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  // Sparse, slow-scrolling dot field behind the grid — cheap depth cue.
  // Deterministic per-cell jitter (sine hash) instead of stored star data
  // so it needs no state and never desyncs from the camera.
  drawParallaxStars(ctx, camX, camY) {
    const spacing = 140, parallax = 0.35;
    const px = camX * parallax, py = camY * parallax;
    const halfW = this.width / 2, halfH = this.height / 2;
    const startX = -halfW - ((px + halfW) % spacing);
    const startY = -halfH - ((py + halfH) % spacing);
    ctx.save();
    for (let x = startX; x < halfW; x += spacing) {
      for (let y = startY; y < halfH; y += spacing) {
        const worldX = x + px, worldY = y + py;
        const jx = frac(Math.sin(worldX * 12.9898 + worldY * 78.233) * 43758.5453);
        const jy = frac(Math.cos(worldX * 93.9898 + worldY * 67.345) * 24634.634);
        const sx = x + jx * spacing * 0.7, sy = y + jy * spacing * 0.7;
        ctx.globalAlpha = 0.12 + jy * 0.28;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(sx, sy, 0.6 + jx * 1.1, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  drawBackground(ctx, camX, camY) {
    this.drawParallaxStars(ctx, camX, camY);
    const biome = this.nodeBiome;
    const gridColor = biome ? biome.grid : 'rgba(94, 230, 255, 0.06)';
    const accent = biome ? biome.accent : '#c98cff';
    const spacing = 64;
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    const halfW = this.width / 2, halfH = this.height / 2;
    const startX = -halfW - ((camX + halfW) % spacing);
    const startY = -halfH - ((camY + halfH) % spacing);
    ctx.beginPath();
    for (let x = startX; x < halfW; x += spacing) { ctx.moveTo(x, -halfH); ctx.lineTo(x, halfH); }
    for (let y = startY; y < halfH; y += spacing) { ctx.moveTo(-halfW, y); ctx.lineTo(halfW, y); }
    ctx.stroke();

    // World boundary
    const left = -WORLD_HALF - camX, right = WORLD_HALF - camX;
    const top = -WORLD_HALF - camY, bottom = WORLD_HALF - camY;
    ctx.strokeStyle = accent + '59';
    ctx.shadowColor = accent;
    ctx.shadowBlur = 20;
    ctx.lineWidth = 4;
    ctx.strokeRect(left, top, right - left, bottom - top);
    ctx.shadowBlur = 0;
  }

  drawHazards(ctx, camX, camY) {
    if (this.hazards.length === 0) return;
    const color = { poison: '#7CFC9A', fire: '#ff8a5e' };
    for (const h of this.hazards) {
      const sx = h.x - camX, sy = h.y - camY;
      const c = color[h.type] || '#ffffff';
      const pulse = 0.85 + 0.15 * Math.sin(this.elapsed * 3 + h.x * 0.01);
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = c;
      ctx.shadowColor = c;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(sx, sy, h.radius * pulse, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = c;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }
  }

  drawPlayer(ctx, camX, camY) {
    const p = this.player;
    const sx = p.x - camX, sy = p.y - camY;

    // Idle bob when stationary; suppressed while dashing so the dash reads clean.
    const bob = (!p.moving && p.dashTimeLeft <= 0) ? Math.sin(this.elapsed * 3) * 2 : 0;

    // Bank tilt: lean into the turn based on how fast facing angle is changing.
    if (this._prevFacing == null) this._prevFacing = p.facing;
    let dFacing = p.facing - this._prevFacing;
    while (dFacing > Math.PI) dFacing -= TAU;
    while (dFacing < -Math.PI) dFacing += TAU;
    this._bankTilt = clamp((this._bankTilt || 0) * 0.85 + dFacing * 4, -0.35, 0.35);
    this._prevFacing = p.facing;

    // Continuous thruster particles while moving normally (dash already has its own trail).
    if (p.moving && p.dashTimeLeft <= 0 && rng() < 0.5) {
      const backAngle = p.facing + Math.PI;
      this.particles.spark(p.x + Math.cos(backAngle) * 10, p.y + bob + Math.sin(backAngle) * 10, backAngle, p.char.color, 1);
    }

    const dashStretch = p.dashTimeLeft > 0 ? 1.35 : 1;

    ctx.save();
    ctx.translate(sx, sy + bob);

    const flicker = p.invulnTimer > 0 && Math.floor(p.invulnTimer * 20) % 2 === 0;
    ctx.globalAlpha = flicker ? 0.4 : 1;

    ctx.rotate(p.facing);
    ctx.scale(dashStretch, 1 / Math.sqrt(dashStretch));
    ctx.rotate(this._bankTilt);

    // Engine glow — intensifies while moving, flares while dashing. Shape
    // (single/twin/swept) matches each character's ship silhouette.
    const engineIntensity = p.dashTimeLeft > 0 ? 1 : (p.moving ? 0.6 : 0.25);
    const shipShape = p.char.shipShape || 'balanced';
    ctx.save();
    ctx.globalAlpha *= engineIntensity;
    ctx.fillStyle = p.char.accent || p.char.color;
    ctx.shadowColor = p.char.color;
    ctx.shadowBlur = 16;
    for (const eng of ENGINE_POSITIONS[shipShape]) {
      ctx.beginPath();
      ctx.ellipse(eng.x, eng.y, eng.rx * (6 + engineIntensity * 3), eng.ry * 3, 0, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    // Hull — a distinct silhouette per character, not just a recolored triangle.
    ctx.shadowColor = p.char.color;
    ctx.shadowBlur = 18;
    ctx.fillStyle = p.hurtFlash > 0 ? '#ffffff' : shadeFill(ctx, 18, p.char.color);
    drawShipHull(ctx, shipShape);
    ctx.fill();
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = p.char.accent || '#ffffff';
    ctx.lineWidth = 0.75;
    ctx.shadowBlur = 0;
    drawShipHull(ctx, shipShape);
    ctx.stroke();
    ctx.restore();

    // Panel line: a single highlight stroke down the spine reads as a hull
    // seam rather than a flat cutout — cheap but sells "built", not drawn.
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = p.char.accent || '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(COCKPIT_X[shipShape] + 4, 0);
    ctx.lineTo(-8, 0);
    ctx.stroke();
    ctx.restore();

    // Cockpit accent
    ctx.fillStyle = p.char.accent || '#ffffff';
    ctx.globalAlpha *= 0.9;
    ctx.beginPath();
    ctx.arc(COCKPIT_X[shipShape], 0, 3, 0, TAU);
    ctx.fill();

    ctx.restore();

    // Soft ground glow beneath player
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = p.char.color;
    ctx.shadowColor = p.char.color;
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.ellipse(sx, sy + 4 + bob, 16, 7, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    if (this.settings.showHitbox) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(sx, sy, p.radius, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  // ---------------- Screen-space HUD overlays (drawn after the world's camera transform is undone) ----------------
  drawMinimap(ctx) {
    if (!this.player) return;
    const size = 100, pad = 16, cx = this.width - size / 2 - pad, cy = size / 2 + pad + 30;
    const range = 900;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, size / 2, 0, TAU);
    ctx.fillStyle = 'rgba(10, 12, 30, 0.65)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(94, 230, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.clip();
    for (const e of this.enemyManager.pool.active) {
      const dx = ((e.x - this.player.x) / range) * (size / 2);
      const dy = ((e.y - this.player.y) / range) * (size / 2);
      if (Math.hypot(dx, dy) > size / 2) continue;
      ctx.fillStyle = e.isBoss ? '#ff5e8a' : (e.isElite ? '#ffd54a' : e.color);
      ctx.beginPath();
      ctx.arc(cx + dx, cy + dy, e.isBoss ? 4 : (e.isElite ? 3 : 1.6), 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  drawBossBar(ctx, boss) {
    const w = Math.min(420, this.width * 0.6), h = 14, x = this.width / 2 - w / 2, y = 74;
    const pct = clamp(boss.hp / boss.maxHp, 0, 1);
    ctx.save();
    ctx.fillStyle = 'rgba(10, 12, 30, 0.8)';
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.fillStyle = 'rgba(255, 94, 138, 0.25)';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#ff5e8a';
    ctx.fillRect(x, y, w * pct, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 12px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    const name = (BOSS_TYPES[boss.bossId] && BOSS_TYPES[boss.bossId].name) || 'Boss';
    ctx.fillText(name, this.width / 2, y - 6);
    ctx.restore();
  }
}

function frac(v) { return v - Math.floor(v); }

// Per-character ship silhouettes — matches each character's tagline instead
// of one triangle recolored three ways: 'balanced' is the original dart,
// 'armored' is a wide hexagonal hull (Rook: slow, armored, relentless),
// 'sleek' is an elongated needle with swept flanks (Nyx: fast, fragile).
function drawShipHull(ctx, shipShape) {
  ctx.beginPath();
  if (shipShape === 'armored') {
    ctx.moveTo(15, 0);
    ctx.lineTo(6, 8);
    ctx.lineTo(-9, 12);
    ctx.lineTo(-13, 0);
    ctx.lineTo(-9, -12);
    ctx.lineTo(6, -8);
  } else if (shipShape === 'sleek') {
    ctx.moveTo(22, 0);
    ctx.lineTo(-2, 5);
    ctx.lineTo(-15, 8);
    ctx.lineTo(-9, 0);
    ctx.lineTo(-15, -8);
    ctx.lineTo(-2, -5);
  } else {
    ctx.moveTo(18, 0);
    ctx.lineTo(-12, 11);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-12, -11);
  }
  ctx.closePath();
}

const ENGINE_POSITIONS = {
  balanced: [{ x: -10, y: 0, rx: 1, ry: 1 }],
  armored: [{ x: -11, y: 5, rx: 0.75, ry: 0.8 }, { x: -11, y: -5, rx: 0.75, ry: 0.8 }],
  sleek: [{ x: -13, y: 0, rx: 1.3, ry: 0.65 }],
};
const COCKPIT_X = { balanced: 6, armored: 3, sleek: 11 };
