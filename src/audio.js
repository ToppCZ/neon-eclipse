// All sound is synthesized at runtime with WebAudio — no asset files to load,
// no network fetch, works offline. Keeps everything self-contained.

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.enabled = true;
    this.musicNodes = [];
    this.musicTimer = null;
  }

  ensure() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.8;
    this.sfxGain.connect(this.master);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.35;
    this.musicGain.connect(this.master);
  }

  resume() {
    this.ensure();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setMuted(muted) {
    this.ensure();
    this.master.gain.value = muted ? 0 : 0.9;
  }

  now() { return this.ctx.currentTime; }

  // ---- Low-level tone helper ----
  tone({ freq = 440, type = 'sine', dur = 0.12, gain = 0.2, slideTo = null, delay = 0, gainNode = null }) {
    this.ensure();
    const target = gainNode || this.sfxGain;
    const t0 = this.now() + delay;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo != null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(target);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  noiseBurst({ dur = 0.15, gain = 0.25, filterFreq = 1200, delay = 0, gainNode = null }) {
    this.ensure();
    const target = gainNode || this.sfxGain;
    const t0 = this.now() + delay;
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(target);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  // ---- Named SFX ----
  hit() { this.tone({ freq: 180, type: 'square', dur: 0.06, gain: 0.12, slideTo: 60 }); }
  shoot() { this.tone({ freq: 520, type: 'triangle', dur: 0.05, gain: 0.06, slideTo: 300 }); }
  enemyDeath() { this.noiseBurst({ dur: 0.12, gain: 0.14, filterFreq: 900 }); this.tone({ freq: 260, type: 'sawtooth', dur: 0.1, gain: 0.08, slideTo: 90 }); }
  playerHurt() { this.tone({ freq: 140, type: 'sawtooth', dur: 0.18, gain: 0.22, slideTo: 60 }); this.noiseBurst({ dur: 0.15, gain: 0.15, filterFreq: 500 }); }
  pickup() { this.tone({ freq: 700, type: 'sine', dur: 0.05, gain: 0.05, slideTo: 1100 }); }
  levelUp() {
    const notes = [523, 659, 784, 1046];
    notes.forEach((f, i) => this.tone({ freq: f, type: 'triangle', dur: 0.18, gain: 0.14, delay: i * 0.06 }));
  }
  explosion() { this.noiseBurst({ dur: 0.35, gain: 0.28, filterFreq: 700 }); this.tone({ freq: 90, type: 'sine', dur: 0.3, gain: 0.2, slideTo: 30 }); }
  uiClick() { this.tone({ freq: 440, type: 'square', dur: 0.04, gain: 0.06, slideTo: 620 }); }
  bossRoar() { this.tone({ freq: 100, type: 'sawtooth', dur: 0.6, gain: 0.22, slideTo: 40 }); this.noiseBurst({ dur: 0.5, gain: 0.15, filterFreq: 300 }); }
  gameOver() {
    [392, 349, 311, 261].forEach((f, i) => this.tone({ freq: f, type: 'sawtooth', dur: 0.35, gain: 0.15, delay: i * 0.15 }));
  }
  victory() {
    [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone({ freq: f, type: 'triangle', dur: 0.3, gain: 0.16, delay: i * 0.1 }));
  }

  // ---- Ambient procedural music: a slow evolving arpeggio pad ----
  startMusic() {
    this.ensure();
    this.stopMusic();
    const scale = [130.81, 155.56, 174.61, 196.00, 233.08]; // C minor-ish pentatonic-ish, low register
    let step = 0;
    const playStep = () => {
      const base = pickRandom(scale);
      const octaveMul = Math.random() < 0.5 ? 1 : 2;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = base * octaveMul;
      const g = this.ctx.createGain();
      const t0 = this.now();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.06, t0 + 1.2);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.4);
      osc.connect(g);
      g.connect(this.musicGain);
      osc.start(t0);
      osc.stop(t0 + 3.5);
      step++;
      this.musicTimer = setTimeout(playStep, 1400 + Math.random() * 900);
    };
    playStep();
  }

  stopMusic() {
    if (this.musicTimer) clearTimeout(this.musicTimer);
    this.musicTimer = null;
  }
}

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

export const audio = new AudioEngine();
