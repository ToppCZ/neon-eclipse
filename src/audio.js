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
    this.musicVolume = 0.35; // settings-controlled base level, applied even before ensure()
    this.sfxVolume = 0.8;
    this.musicIntensity = 0; // 0..1, set by game.js from wave/act danger + player HP%
  }

  setMusicIntensity(x) { this.musicIntensity = clamp01(x); }

  ensure() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Ctx();

    // A master lowpass sits in front of everything so a big hit can duck
    // the whole mix for a moment (see thump()) — a cheap way to make impact
    // moments felt in the mix, not just louder.
    this.masterFilter = this.ctx.createBiquadFilter();
    this.masterFilter.type = 'lowpass';
    this.masterFilter.frequency.value = 20000;
    this.masterFilter.connect(this.ctx.destination);

    this.master = this.ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(this.masterFilter);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this.sfxVolume;
    this.sfxGain.connect(this.master);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.musicVolume;
    this.musicGain.connect(this.master);

    // Light convolution reverb send — a few taps of decaying noise, not a
    // real impulse response, but enough to keep SFX from feeling dry/flat.
    this.reverb = this.ctx.createConvolver();
    this.reverb.buffer = this._makeReverbImpulse(1.1, 2.2);
    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.value = 0.22;
    this.reverb.connect(this.reverbGain);
    this.reverbGain.connect(this.master);
  }

  _makeReverbImpulse(duration, decay) {
    const rate = this.ctx.sampleRate;
    const len = Math.floor(rate * duration);
    const buf = this.ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  // Briefly ducks the master lowpass closed and back open — a muffled
  // "thump" felt across the whole mix, tied to the game's hit-stop moments.
  thump(amount = 1) {
    if (!this.masterFilter) return;
    const t0 = this.now();
    const f = this.masterFilter.frequency;
    f.cancelScheduledValues(t0);
    f.setValueAtTime(Math.max(200, 20000 - amount * 15000), t0);
    f.exponentialRampToValueAtTime(20000, t0 + 0.22);
  }

  resume() {
    this.ensure();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setMuted(muted) {
    this.ensure();
    this.master.gain.value = muted ? 0 : 0.9;
  }

  setMusicVolume(v) {
    this.musicVolume = v;
    if (this.musicGain) this.musicGain.gain.value = v;
  }

  setSfxVolume(v) {
    this.sfxVolume = v;
    if (this.sfxGain) this.sfxGain.gain.value = v;
  }

  now() { return this.ctx.currentTime; }

  // ---- Low-level tone helper ----
  tone({ freq = 440, type = 'sine', dur = 0.12, gain = 0.2, slideTo = null, delay = 0, gainNode = null, reverb = false, filterFreq = null }) {
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
    let out = osc;
    if (filterFreq != null) {
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(filterFreq * 2.5, t0);
      filter.frequency.exponentialRampToValueAtTime(Math.max(80, filterFreq), t0 + dur);
      osc.connect(filter);
      out = filter;
    }
    out.connect(g);
    g.connect(target);
    if (reverb && this.reverb) g.connect(this.reverb);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  // Two detuned oscillators summed together — thicker/weightier than a
  // single osc, used where a sound needs to feel heavy (explosions, roars).
  layeredTone(opts) {
    this.tone(opts);
    this.tone({ ...opts, freq: opts.freq * 1.008, gain: (opts.gain || 0.2) * 0.6, delay: (opts.delay || 0) + 0.008 });
  }

  noiseBurst({ dur = 0.15, gain = 0.25, filterFreq = 1200, delay = 0, gainNode = null, reverb = false }) {
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
    if (reverb && this.reverb) g.connect(this.reverb);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  // ---- Named SFX ----
  hit() { this.tone({ freq: 180, type: 'square', dur: 0.06, gain: 0.12, slideTo: 60, filterFreq: 900 }); }

  // Distinct timbre per weapon kind instead of one generic blip, so the
  // arsenal has an audible identity, not just a visual one.
  shoot(kind = 'shard') {
    if (kind === 'missile') {
      this.tone({ freq: 220, type: 'sawtooth', dur: 0.14, gain: 0.07, slideTo: 90, filterFreq: 500 });
      this.noiseBurst({ dur: 0.08, gain: 0.04, filterFreq: 1400 });
    } else if (kind === 'ricochet') {
      this.tone({ freq: 900, type: 'square', dur: 0.05, gain: 0.05, slideTo: 400 });
    } else {
      this.tone({ freq: 520, type: 'triangle', dur: 0.05, gain: 0.06, slideTo: 300 });
    }
  }

  // pitch ramps up with kill-streak momentum (streakMult 1 = base pitch).
  enemyDeath(streakMult = 1) {
    const p = clamp01((streakMult - 1) / 0.6) * 0.5 + 1; // up to +50% pitch at high streaks
    this.noiseBurst({ dur: 0.12, gain: 0.14, filterFreq: 900 * p, reverb: true });
    this.tone({ freq: 260 * p, type: 'sawtooth', dur: 0.1, gain: 0.08, slideTo: 90 * p });
  }
  playerHurt() { this.tone({ freq: 140, type: 'sawtooth', dur: 0.18, gain: 0.22, slideTo: 60 }); this.noiseBurst({ dur: 0.15, gain: 0.15, filterFreq: 500 }); }
  pickup() { this.tone({ freq: 700, type: 'sine', dur: 0.05, gain: 0.05, slideTo: 1100 }); }
  levelUp() {
    const notes = [523, 659, 784, 1046];
    notes.forEach((f, i) => this.tone({ freq: f, type: 'triangle', dur: 0.18, gain: 0.14, delay: i * 0.06, reverb: true }));
  }
  explosion() {
    this.noiseBurst({ dur: 0.35, gain: 0.28, filterFreq: 700, reverb: true });
    this.layeredTone({ freq: 90, type: 'sine', dur: 0.3, gain: 0.2, slideTo: 30 });
    this.thump(0.6);
  }
  uiClick() { this.tone({ freq: 440, type: 'square', dur: 0.04, gain: 0.06, slideTo: 620 }); }
  bossRoar() {
    this.layeredTone({ freq: 100, type: 'sawtooth', dur: 0.6, gain: 0.22, slideTo: 40, filterFreq: 400 });
    this.noiseBurst({ dur: 0.5, gain: 0.15, filterFreq: 300, reverb: true });
    this.thump(1);
  }
  gameOver() {
    [392, 349, 311, 261].forEach((f, i) => this.tone({ freq: f, type: 'sawtooth', dur: 0.35, gain: 0.15, delay: i * 0.15, reverb: true }));
  }
  victory() {
    [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone({ freq: f, type: 'triangle', dur: 0.3, gain: 0.16, delay: i * 0.1, reverb: true }));
  }

  // ---- Ambient procedural music: kick + sub-bass + arpeggio on a real beat
  // grid, layered together, instead of one wandering note generator. Tempo
  // and density both rise with musicIntensity (see game.js's danger meter).
  startMusic() {
    this.ensure();
    this.stopMusic();
    const scale = [130.81, 155.56, 174.61, 196.00, 233.08]; // C minor-ish pentatonic-ish, low register
    let beat = 0;
    const playBeat = () => {
      const intensity = this.musicIntensity;
      const t0 = this.now();
      const bpm = 92 + intensity * 34;
      const beatDur = 60 / bpm;
      const downbeat = beat % 4 === 0;

      this._kick(t0, downbeat ? 0.22 : 0.13);
      if (downbeat) this._bass(t0, scale[0] / 2, beatDur * 4);

      // Arpeggio: steady on downbeats, fills in denser as danger rises.
      if (downbeat || beat % 2 === 1 || intensity > 0.45) {
        const note = pickRandom(scale) * (Math.random() < 0.5 + intensity * 0.3 ? 1 : 2);
        const osc = this.ctx.createOscillator();
        osc.type = intensity > 0.6 ? 'sawtooth' : 'triangle';
        osc.frequency.value = note;
        const g = this.ctx.createGain();
        const peak = 0.05 + intensity * 0.04;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(peak, t0 + 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + beatDur * 0.9);
        osc.connect(g);
        g.connect(this.musicGain);
        osc.start(t0);
        osc.stop(t0 + beatDur);
      }

      beat++;
      this.musicTimer = setTimeout(playBeat, beatDur * 1000);
    };
    playBeat();
  }

  _kick(t0, gain) {
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t0);
    osc.frequency.exponentialRampToValueAtTime(35, t0 + 0.15);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
    osc.connect(g);
    g.connect(this.musicGain);
    osc.start(t0);
    osc.stop(t0 + 0.2);
  }

  _bass(t0, freq, dur) {
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.09, t0 + 0.1);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(this.musicGain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  stopMusic() {
    if (this.musicTimer) clearTimeout(this.musicTimer);
    this.musicTimer = null;
  }
}

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function clamp01(x) { return Math.max(0, Math.min(1, x)); }

export const audio = new AudioEngine();
