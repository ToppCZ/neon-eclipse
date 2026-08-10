import { clamp, randRange, TAU } from './utils.js';
import { Player, getCharacter, listCharacters } from './player.js';
import { EnemyManager } from './enemies.js';
import { WeaponSystem, WEAPONS } from './weapons.js';
import { PASSIVES, rollUpgradeChoices, applyUpgradeChoice } from './upgrades.js';
import { PickupManager } from './pickups.js';
import { ParticleSystem } from './particles.js';
import { RUN_LENGTH } from './enemyData.js';
import { loadMeta, saveMeta, getMetaBonuses, purchaseUpgrade, recordRunResult } from './meta.js';
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
    this.elapsed = 0;
    this.killCount = 0;
    this.goldEarnedThisRun = 0;

    this.camX = 0; this.camY = 0;
    this.shakeTime = 0; this.shakeMag = 0;
    this.bgOffset = 0;

    this.pendingLevelUps = [];

    this.enemyManager.onDeath = (e) => this.onEnemyDeath(e);
    this.enemyManager.onPlayerHit = (amount, x, y) => this.onPlayerHit(amount, x, y);
    this.enemyManager.onBossSpawned = (name) => { ui.flashBossBanner(name); this.addShake(14, 0.5); };

    this.bindMenus();
  }

  resize(w, h) { this.width = w; this.height = h; }

  addShake(mag, time) { this.shakeMag = Math.max(this.shakeMag, mag); this.shakeTime = Math.max(this.shakeTime, time); }

  // ---------------- Menu wiring ----------------
  bindMenus() {
    ui.el.btnPlay.addEventListener('click', () => { audio.uiClick(); ui.showCharacterSelect(listCharacters(), (id) => this.startRun(id)); });
    ui.el.btnShop.addEventListener('click', () => { audio.uiClick(); ui.showShop(this.meta, (id) => this.buyMetaUpgrade(id)); });
    ui.el.btnBackChars.addEventListener('click', () => { audio.uiClick(); this.goToMenu(); });
    ui.el.btnBackShop.addEventListener('click', () => { audio.uiClick(); this.goToMenu(); });
    ui.el.btnResume.addEventListener('click', () => { audio.uiClick(); this.resume(); });
    ui.el.btnQuit.addEventListener('click', () => { audio.uiClick(); this.goToMenu(); });
    ui.el.btnRetry.addEventListener('click', () => { audio.uiClick(); ui.showCharacterSelect(listCharacters(), (id) => this.startRun(id)); });
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

  // ---------------- Run lifecycle ----------------
  startRun(characterId) {
    audio.resume();
    const character = getCharacter(characterId);
    const bonuses = getMetaBonuses(this.meta);
    this.player = new Player(character, bonuses);
    this.player.recomputeStats(PASSIVES);
    this.player.hp = this.player.maxHp;

    this.enemyManager.reset();
    this.weaponSystem.reset();
    this.pickups.reset();
    this.particles.clear();

    this.weaponSystem.equip(character.startWeapon);

    this.elapsed = 0;
    this.killCount = 0;
    this.goldEarnedThisRun = 0;
    this.camX = this.player.x; this.camY = this.player.y;

    this.state = 'playing';
    ui.hideAllScreens();
    ui.setHudVisible(true);
    ui.updateHud(this.player, this.elapsed, this.weaponSystem, this.killCount);
    audio.startMusic();
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
    const stats = { time: this.elapsed, level: this.player.level, kills: this.killCount, goldEarned: Math.floor(this.goldEarnedThisRun) };
    recordRunResult(this.meta, stats);
    ui.setHudVisible(false);
    ui.showEnd(victory, stats);
  }

  // ---------------- Event callbacks ----------------
  onEnemyDeath(e) {
    this.killCount += 1;
    this.pickups.spawnXp(e.x, e.y, e.xp);
    const goldChance = e.isBoss ? 1 : 0.16 * clamp(this.player.luck, 0.5, 3);
    if (Math.random() < goldChance) {
      this.pickups.spawnGold(e.x, e.y, e.isBoss ? randRange(30, 60) : randRange(1, 4));
    }
    this.particles.burst(e.x, e.y, { count: e.isBoss ? 40 : 10, color: e.color, speed: e.isBoss ? 260 : 140, life: 0.5, glow: true });
    if (audio) audio.enemyDeath();
    if (e.isBoss) this.addShake(16, 0.6);
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
      this.player.gold += g.value;
      this.goldEarnedThisRun += g.value;
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
    ui.showLevelUp(choices, (choice) => {
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
    this.player.update(dt, input, WORLD_HALF);
    this.enemyManager.update(dt, this.elapsed, this.player, WORLD_HALF);
    this.weaponSystem.update(dt, this.player);
    this.weaponSystem.checkEvolutions(this.player);
    this.pickups.update(dt, this.player, (g) => this.onPickupCollect(g));
    this.particles.update(dt);

    const camK = 1 - Math.exp(-6 * dt);
    this.camX += (this.player.x - this.camX) * camK;
    this.camY += (this.player.y - this.camY) * camK;

    if (this.shakeTime > 0) this.shakeTime -= dt;

    ui.updateHud(this.player, this.elapsed, this.weaponSystem, this.killCount);

    if (this.elapsed >= RUN_LENGTH) this.endRun(true);
  }

  // ---------------- Rendering ----------------
  render() {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = '#05060f';
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
    const spacing = 64;
    ctx.strokeStyle = 'rgba(94, 230, 255, 0.06)';
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
    ctx.strokeStyle = 'rgba(201, 140, 255, 0.35)';
    ctx.shadowColor = '#c98cff';
    ctx.shadowBlur = 20;
    ctx.lineWidth = 4;
    ctx.strokeRect(left, top, right - left, bottom - top);
    ctx.shadowBlur = 0;
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
