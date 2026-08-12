import { clamp, randRange, TAU } from './utils.js';
import { Player, getCharacter, listCharacters, getRelic, listRelics } from './player.js';
import { EnemyManager } from './enemies.js';
import { WeaponSystem, WEAPONS } from './weapons.js';
import { PASSIVES, rollUpgradeChoices, applyUpgradeChoice, rollShopOffers, shopRerollCost } from './upgrades.js';
import { PickupManager } from './pickups.js';
import { ParticleSystem } from './particles.js';
import { BOSS_TYPES } from './enemyData.js';
import { generateRun, currentAct, isLastAct } from './runMap.js';
import { loadMeta, getMetaBonuses, purchaseUpgrade, recordRunResult } from './meta.js';
import { audio } from './audio.js';
import { ui } from './ui.js';

const WORLD_HALF = 2200;

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
    this.player = null;
    this.state = 'menu';
    this.elapsed = 0; // total time across the whole run (display only)
    this.killCount = 0;

    this.run = null;
    this.currentNode = null;
    this.nodeType = null;
    this.nodeBiome = null;
    this.nodeActNumber = 1;
    this.nodeElapsed = 0;
    this.nodeDuration = 0;

    this.camX = 0; this.camY = 0;
    this.shakeTime = 0; this.shakeMag = 0;

    this.pendingLevelUps = [];
    this.hazards = [];

    this.enemyManager.onDeath = (e) => this.onEnemyDeath(e);
    this.enemyManager.onPlayerHit = (amount, x, y) => this.onPlayerHit(amount, x, y);

    this.bindMenus();
  }

  resize(w, h) { this.width = w; this.height = h; }

  addShake(mag, time) { this.shakeMag = Math.max(this.shakeMag, mag); this.shakeTime = Math.max(this.shakeTime, time); }

  // ---------------- Menu wiring ----------------
  bindMenus() {
    const goToCharacterSelect = () => { audio.uiClick(); ui.showCharacterSelect(listCharacters(), (id) => this.showRelicSelect(id)); };
    ui.el.btnPlay.addEventListener('click', goToCharacterSelect);
    ui.el.btnShop.addEventListener('click', () => { audio.uiClick(); ui.showShop(this.meta, (id) => this.buyMetaUpgrade(id)); });
    ui.el.btnBackChars.addEventListener('click', () => { audio.uiClick(); this.goToMenu(); });
    ui.el.btnBackShop.addEventListener('click', () => { audio.uiClick(); this.goToMenu(); });
    ui.el.btnResume.addEventListener('click', () => { audio.uiClick(); this.resume(); });
    ui.el.btnQuit.addEventListener('click', () => { audio.uiClick(); this.goToMenu(); });
    ui.el.btnRetry.addEventListener('click', goToCharacterSelect);
    ui.el.btnEndMenu.addEventListener('click', () => { audio.uiClick(); this.goToMenu(); });
    ui.el.muteBtn.addEventListener('click', () => {
      this.muted = !this.muted;
      audio.setMuted(this.muted);
      ui.el.muteBtn.textContent = this.muted ? '🔇' : '🔊';
    });
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
  }

  runLabel() {
    if (!this.run) return '';
    const act = currentAct(this.run);
    const elements = this.weaponSystem.synergy ? this.weaponSystem.synergy.elementCount : 0;
    return `Act ${act.actNumber} · Node ${this.run.stepIndex + 1}/${act.steps.length} · Elements ${elements}/4`;
  }

  showRelicSelect(characterId) {
    audio.uiClick();
    const choices = listRelics().map(r => ({ kind: 'relic', id: r.id, title: r.name, subtitle: 'Relic', desc: r.desc, tier: 'legendary' }));
    ui.showChoiceModal('Choose a Relic', choices, (choice) => this.startRun(characterId, choice.id));
  }

  // ---------------- Run lifecycle ----------------
  startRun(characterId, relicId) {
    audio.resume();
    const character = getCharacter(characterId);
    const relic = getRelic(relicId);
    const bonuses = getMetaBonuses(this.meta);
    this.player = new Player(character, bonuses, relic);
    this.player.recomputeStats(PASSIVES);
    this.player.hp = this.player.maxHp;

    this.weaponSystem.reset();
    this.weaponSystem.equip(character.startWeapon);

    this.elapsed = 0;
    this.killCount = 0;
    this.run = generateRun();

    this.goToMap();
  }

  goToMap() {
    this.state = 'map';
    ui.showMap(this.run, (node) => this.selectNode(node));
  }

  selectNode(node) {
    audio.uiClick();
    this.currentNode = node;
    if (node.type === 'combat' || node.type === 'elite' || node.type === 'boss') {
      this.beginCombatNode(node);
    } else if (node.type === 'shop') {
      this.beginShopNode(node);
    } else if (node.type === 'treasure') {
      this.beginTreasureNode(node);
    } else if (node.type === 'rest') {
      this.beginRestNode(node);
    }
  }

  beginCombatNode(node) {
    this.enemyManager.reset();
    this.pickups.reset();
    this.particles.clear();

    this.nodeType = node.type;
    this.nodeBiome = node.biome;
    this.nodeActNumber = node.biome.act;
    this.nodeElapsed = 0;
    this.nodeDuration = node.type === 'combat' ? randRange(100, 130) : null;

    this.camX = this.player.x; this.camY = this.player.y;
    this.hazards = this.generateHazards(node.biome, this.player.x, this.player.y);

    if (node.type === 'elite') {
      const elite = this.enemyManager.spawnElite(node.biome, this.player, WORLD_HALF, this.nodeActNumber);
      const affixNames = { explosive: 'Explosive', shielded: 'Shielded', frozenAura: 'Frost Aura' };
      ui.flashBossBanner(`Elite Enemy (${affixNames[elite.affix] || elite.affix})`);
    } else if (node.type === 'boss') {
      this.enemyManager.spawnBoss(node.biome.boss, this.player, WORLD_HALF);
      ui.flashBossBanner(BOSS_TYPES[node.biome.boss].name);
      this.addShake(14, 0.5);
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
      const d = Math.hypot(p.x - h.x, p.y - h.y);
      if (d <= h.radius) {
        if (h.tickTimer <= 0) {
          h.tickTimer = 0.5;
          const dmg = h.type === 'fire' ? 7 : 5;
          this.onPlayerHit(dmg, p.x, p.y);
        }
      }
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
    ui.showNodeShop(this.shopState,
      (offer) => this.buyShopOffer(offer),
      () => this.rerollShop(),
      () => { this.run.nodesCleared += 1; this.advanceRun(); });
  }

  buyShopOffer(offer) {
    if (offer.bought || this.player.cores < offer.cost) return;
    this.player.cores -= offer.cost;
    applyUpgradeChoice(offer, this.player, this.weaponSystem);
    offer.bought = true;
    audio.pickup();
    ui.renderNodeShop(this.shopState,
      (o) => this.buyShopOffer(o),
      () => this.rerollShop(),
      () => { this.run.nodesCleared += 1; this.advanceRun(); });
  }

  rerollShop() {
    const cost = this.shopState.rerollCost;
    if (this.player.cores < cost) return;
    this.player.cores -= cost;
    this._shopRerollCount += 1;
    this.shopState.offers = rollShopOffers(this.player, this.weaponSystem, 4).map(o => ({ ...o, bought: false }));
    this.shopState.rerollCost = shopRerollCost(this._shopRerollCount);
    audio.uiClick();
    ui.renderNodeShop(this.shopState,
      (o) => this.buyShopOffer(o),
      () => this.rerollShop(),
      () => { this.run.nodesCleared += 1; this.advanceRun(); });
  }

  beginTreasureNode() {
    this.state = 'nodeChoice';
    const choices = rollUpgradeChoices(this.player, this.weaponSystem, 3);
    ui.showChoiceModal('Treasure Found', choices, (choice) => {
      applyUpgradeChoice(choice, this.player, this.weaponSystem);
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
    const choices = rollUpgradeChoices(this.player, this.weaponSystem, 3);
    ui.showChoiceModal('Node Cleared!', choices, (choice) => {
      applyUpgradeChoice(choice, this.player, this.weaponSystem);
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
    const actReached = this.run.actIndex + 1;
    const goldEarned = Math.floor(
      this.player.cores * 0.5 + this.run.nodesCleared * 12 + this.run.actIndex * 60 + (victory ? 150 : 0)
    );
    const stats = {
      time: this.elapsed, level: this.player.level, kills: this.killCount,
      actReached, nodesCleared: this.run.nodesCleared, goldEarned,
    };
    recordRunResult(this.meta, stats);
    ui.setHudVisible(false);
    ui.showEnd(victory, stats);
  }

  // ---------------- Event callbacks ----------------
  onEnemyDeath(e) {
    this.killCount += 1;
    this.pickups.spawnXp(e.x, e.y, e.xp);
    const coreChance = e.isBoss ? 1 : (e.isElite ? 0.9 : 0.16 * clamp(this.player.luck, 0.5, 3));
    if (Math.random() < coreChance) {
      const value = e.isBoss ? randRange(30, 60) : (e.isElite ? randRange(15, 28) : randRange(1, 4));
      this.pickups.spawnCores(e.x, e.y, value);
    }
    this.particles.burst(e.x, e.y, { count: e.isBoss ? 40 : (e.isElite ? 24 : 10), color: e.color, speed: e.isBoss ? 260 : 140, life: 0.5, glow: true });
    if (audio) audio.enemyDeath();
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
    }
    if (this.player.dead) this.endRun(false);
  }

  onPickupCollect(g) {
    if (g.kind === 'xp') {
      const levels = this.player.gainXp(g.value);
      this.particles.spark(g.x, g.y, 0, '#5ee6ff', 3);
      if (levels) this.queueLevelUps(levels.length);
    } else {
      this.player.cores += g.value;
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
    const choices = rollUpgradeChoices(this.player, this.weaponSystem, 3);
    ui.showChoiceModal('Level Up!', choices, (choice) => {
      applyUpgradeChoice(choice, this.player, this.weaponSystem);
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

    this.elapsed += dt;
    this.nodeElapsed += dt;

    const elite = this.enemyManager.activeElite;
    this.player.auraSlowMult = (elite && elite.affix === 'frozenAura' && Math.hypot(this.player.x - elite.x, this.player.y - elite.y) < 220) ? 0.6 : 1;

    this.player.update(dt, input, WORLD_HALF);
    this.updateHazards(dt);
    this.enemyManager.update(dt, this.nodeElapsed, this.player, WORLD_HALF, this.nodeBiome, this.nodeActNumber, this.nodeType === 'combat');
    this.weaponSystem.update(dt, this.player);
    this.weaponSystem.checkEvolutions(this.player);
    this.pickups.update(dt, this.player, (g) => this.onPickupCollect(g));
    this.particles.update(dt);

    const camK = 1 - Math.exp(-6 * dt);
    this.camX += (this.player.x - this.camX) * camK;
    this.camY += (this.player.y - this.camY) * camK;

    if (this.shakeTime > 0) this.shakeTime -= dt;

    ui.updateHud(this.player, this.elapsed, this.weaponSystem, this.killCount, this.runLabel());

    if (this.player.dead) return; // onPlayerHit already triggered endRun

    if (this.nodeType === 'combat' && this.nodeElapsed >= this.nodeDuration) this.onCombatNodeCleared();
    else if (this.nodeType === 'elite' && !this.enemyManager.activeElite) this.onCombatNodeCleared();
    else if (this.nodeType === 'boss' && !this.enemyManager.activeBoss) this.onCombatNodeCleared();
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
    }

    ctx.restore();
  }

  drawBackground(ctx, camX, camY) {
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
    ctx.save();
    ctx.translate(sx, sy);

    const flicker = p.invulnTimer > 0 && Math.floor(p.invulnTimer * 20) % 2 === 0;
    ctx.globalAlpha = flicker ? 0.4 : 1;

    ctx.rotate(p.facing);
    ctx.shadowColor = p.char.color;
    ctx.shadowBlur = 18;
    ctx.fillStyle = p.hurtFlash > 0 ? '#ffffff' : p.char.color;
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(-12, 11);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-12, -11);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Soft ground glow beneath player
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = p.char.color;
    ctx.shadowColor = p.char.color;
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.ellipse(sx, sy + 4, 16, 7, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}
