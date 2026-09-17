// Everything audible is synthesized at runtime — same rule as the rest of Neon
// Eclipse. No files to fetch, works offline, and the "room tone" can follow the
// story (clean relay hum vs. Belt static) for free.

class Radio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.sfx = null;
    this.bedGain = null;
    this.muted = false;
    this.bed = [];
    this.noiseBuf = null;
    this.staticGain = null;
  }

  ensure() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();

    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.85;
    this.master.connect(this.ctx.destination);

    this.sfx = this.ctx.createGain();
    this.sfx.gain.value = 0.7;
    this.sfx.connect(this.master);

    this.bedGain = this.ctx.createGain();
    this.bedGain.gain.value = 0.0001;
    this.bedGain.connect(this.master);
  }

  resume() {
    this.ensure();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  setMuted(m) {
    this.muted = m;
    if (!this.ctx) return;
    this.master.gain.setTargetAtTime(m ? 0 : 0.85, this.ctx.currentTime, 0.05);
  }

  now() { return this.ctx.currentTime; }

  tone({ freq = 440, type = 'sine', dur = 0.1, gain = 0.15, slideTo = null, delay = 0 }) {
    this.ensure();
    if (!this.ctx) return;
    const t0 = this.now() + delay;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo != null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(this.sfx);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  noiseBuffer() {
    if (this.noiseBuf) return this.noiseBuf;
    const len = this.ctx.sampleRate * 2;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
    return buf;
  }

  burst({ dur = 0.14, gain = 0.1, freq = 1400, q = 1 }) {
    this.ensure();
    if (!this.ctx) return;
    const t0 = this.now();
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer();
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = freq;
    filt.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filt); filt.connect(g); g.connect(this.sfx);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  // ---- Story cues ----------------------------------------------------------

  msgIn()  { this.tone({ freq: 620, type: 'triangle', dur: 0.09, gain: 0.09, slideTo: 760 }); }
  msgOut() { this.tone({ freq: 430, type: 'sine', dur: 0.08, gain: 0.07, slideTo: 380 }); }
  tap()    { this.tone({ freq: 240, type: 'square', dur: 0.04, gain: 0.035 }); }

  leadFound() {
    this.tone({ freq: 880, type: 'sine', dur: 0.18, gain: 0.08 });
    this.tone({ freq: 1320, type: 'sine', dur: 0.26, gain: 0.05, delay: 0.09 });
  }

  alert() {
    this.tone({ freq: 220, type: 'sawtooth', dur: 0.3, gain: 0.1, slideTo: 140 });
    this.burst({ dur: 0.3, gain: 0.06, freq: 700 });
  }

  tick() { this.tone({ freq: 1200, type: 'square', dur: 0.025, gain: 0.03 }); }

  // ---- Ambient bed ---------------------------------------------------------

  // Two detuned low oscillators + filtered noise. Louder, grittier static as the
  // link degrades, so you *hear* the Belt before you read about it.
  startBed() {
    this.ensure();
    if (!this.ctx || this.bed.length) return;
    const t = this.now();

    for (const f of [55, 82.5]) {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const g = this.ctx.createGain();
      g.gain.value = f < 60 ? 0.5 : 0.18;
      osc.connect(g); g.connect(this.bedGain);
      osc.start(t);
      this.bed.push(osc);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer();
    noise.loop = true;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    this.staticGain = this.ctx.createGain();
    this.staticGain.gain.value = 0.05;
    noise.connect(lp); lp.connect(this.staticGain); this.staticGain.connect(this.bedGain);
    noise.start(t);
    this.bed.push(noise);

    this.bedGain.gain.setTargetAtTime(0.12, t, 1.5);
  }

  stopBed() {
    if (!this.ctx) return;
    const t = this.now();
    this.bedGain.gain.setTargetAtTime(0.0001, t, 0.4);
    const nodes = this.bed;
    this.bed = [];
    setTimeout(() => { for (const n of nodes) { try { n.stop(); } catch (e) { /* already stopped */ } } }, 1400);
  }

  setSignal(sig) {
    if (!this.ctx || !this.staticGain) return;
    const level = sig === 'dead' ? 0.34 : sig === 'weak' ? 0.16 : 0.05;
    this.staticGain.gain.setTargetAtTime(level, this.now(), 0.6);
  }
}

export const radio = new Radio();
