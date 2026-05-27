export const CONFIG = {
  WORLD_SIZE: 100,
  GRAVITY: -25,
  PLAYER_HEIGHT: 1.8,
  PLAYER_SPEED: 5,
  PLAYER_SPRINT: 8,
  PLAYER_JUMP: 8,
  PLAYER_HEALTH: 100,
  MOUSE_SENSITIVITY: 0.002,
  ENEMY_SPEED: 3.5,
  ENEMY_CHASE_RANGE: 30,
  ENEMY_ATTACK_RANGE: 15,
  ENEMY_HEALTH: 50,
  ENEMY_DAMAGE: 8,
  ENEMY_RESPAWN_DELAY: 3000,
  WAVE_ENEMIES_BASE: 3,
  WAVE_ENEMY_MULTIPLIER: 2,
  WAVE_DELAY: 5000,
};

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    this.masterVolume = 0.3;
    this.bgmNode = null;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
    } catch (e) {
      console.warn('AudioContext unavailable:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  _gain(vol = 1) {
    const g = this.ctx.createGain();
    g.gain.value = vol * this.masterVolume;
    return g;
  }

  _noise(len) {
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  _osc(type, freq, dur, vol) {
    const osc = this.ctx.createOscillator();
    const gain = this._gain(vol);
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    osc.stop(this.ctx.currentTime + dur);
  }

  gunshot() {
    if (!this.initialized) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this._noise(0.08);
    const gain = this._gain(0.6);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2000;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    src.start();
    this._osc('square', 80, 0.06, 0.3);
  }

  rifleShot() {
    if (!this.initialized) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this._noise(0.05);
    const gain = this._gain(0.4);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1500;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    src.start();
    this._osc('sawtooth', 120, 0.04, 0.2);
  }

  shotgunBlast() {
    if (!this.initialized) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this._noise(0.15);
    const gain = this._gain(0.8);
    src.connect(gain);
    gain.connect(this.ctx.destination);
    src.start();
    this._osc('square', 50, 0.12, 0.5);
  }

  sniperShot() {
    if (!this.initialized) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this._noise(0.1);
    const gain = this._gain(0.7);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 3000;
    filter.Q.value = 2;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    src.start();
    this._osc('sawtooth', 200, 0.08, 0.4);
  }

  reload() {
    if (!this.initialized) return;
    this._osc('sine', 300, 0.1, 0.15);
    setTimeout(() => this._osc('sine', 500, 0.15, 0.15), 100);
  }

  hit() {
    if (!this.initialized) return;
    this._osc('sine', 600, 0.08, 0.2);
  }

  explosion() {
    if (!this.initialized) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this._noise(0.5);
    const gain = this._gain(0.9);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    src.start();
    this._osc('sine', 40, 0.4, 0.6);
  }

  enemyHit() {
    if (!this.initialized) return;
    this._osc('sawtooth', 200, 0.1, 0.2);
  }

  enemyDeath() {
    if (!this.initialized) return;
    this._osc('sawtooth', 150, 0.3, 0.3);
    setTimeout(() => this._osc('sawtooth', 80, 0.2, 0.2), 150);
  }

  playerHit() {
    if (!this.initialized) return;
    this._osc('sine', 250, 0.15, 0.25);
  }

  waveStart() {
    if (!this.initialized) return;
    this._osc('sine', 440, 0.15, 0.2);
    setTimeout(() => this._osc('sine', 660, 0.15, 0.2), 150);
    setTimeout(() => this._osc('sine', 880, 0.2, 0.25), 300);
  }

  gameOver() {
    if (!this.initialized) return;
    this._osc('sawtooth', 300, 0.2, 0.3);
    setTimeout(() => this._osc('sawtooth', 200, 0.3, 0.3), 250);
    setTimeout(() => this._osc('sawtooth', 100, 0.5, 0.4), 550);
  }

  footstep() {
    if (!this.initialized) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this._noise(0.03);
    const gain = this._gain(0.1);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    src.start();
  }
}

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function rand(min, max) {
  return Math.random() * (max - min) + min;
}

export function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

export function vecLen(a, b) {
  const dx = a.x - b.x, dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

export function vecDist(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
