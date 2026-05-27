export class UIManager {
  constructor() {
    this.visible = true;
    this.lastHealth = -1;
    this.lastAmmo = -1;
    this.lastReserve = -1;
    this.lastWeapon = '';
    this.lastScore = -1;
    this.lastWave = -1;
    this.lastFPS = -1;
    this.hitMarkerTimer = 0;
    this.damageIndicators = [];
    this.fpsValues = [];
  }

  init() {
    const style = document.createElement('style');
    style.textContent = `
      #game-hud { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 100; font-family: 'Segoe UI', Arial, sans-serif; user-select: none; }
      #game-hud * { pointer-events: none; }
      #crosshair {
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
        width: 24px; height: 24px;
      }
      #crosshair::before, #crosshair::after {
        content: ''; position: absolute; background: rgba(255,255,255,0.85);
      }
      #crosshair::before { width: 2px; height: 100%; left: 50%; transform: translateX(-50%); }
      #crosshair::after { width: 100%; height: 2px; top: 50%; transform: translateY(-50%); }
      #crosshair-dot {
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
        width: 3px; height: 3px; border-radius: 50%; background: #fff; opacity: 0.7;
      }
      #crosshair-hit {
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
        width: 36px; height: 36px; display: none;
      }
      #crosshair-hit::before, #crosshair-hit::after {
        content: ''; position: absolute; background: #ff4444; border-radius: 1px;
      }
      #crosshair-hit::before {
        width: 3px; height: 100%; left: 50%; transform: translateX(-50%);
        box-shadow: -8px 0 0 0 #ff4444, 8px 0 0 0 #ff4444;
      }
      #crosshair-hit::after {
        width: 100%; height: 3px; top: 50%; transform: translateY(-50%);
        box-shadow: 0 -8px 0 0 #ff4444, 0 8px 0 0 #ff4444;
      }
      #health-bar {
        position: absolute; bottom: 60px; left: 50%; transform: translateX(-50%);
        width: 250px; height: 8px; background: rgba(0,0,0,0.5); border-radius: 4px; overflow: hidden;
        border: 1px solid rgba(255,255,255,0.15);
      }
      #health-fill {
        height: 100%; background: linear-gradient(90deg, #ff4444, #44ff44);
        border-radius: 4px; transition: width 0.2s; width: 100%;
      }
      #health-text {
        position: absolute; bottom: 72px; left: 50%; transform: translateX(-50%);
        color: #fff; font-size: 0.7rem; font-weight: 600; text-shadow: 0 1px 4px rgba(0,0,0,0.8);
        letter-spacing: 0.5px;
      }
      #ammo-display {
        position: absolute; bottom: 80px; right: 50px;
        color: #fff; font-size: 1.8rem; font-weight: 700;
        text-shadow: 0 2px 8px rgba(0,0,0,0.8);
        text-align: right; line-height: 1;
      }
      #ammo-reserve { font-size: 0.75rem; opacity: 0.6; font-weight: 400; }
      #weapon-name {
        position: absolute; bottom: 115px; right: 50px;
        color: #fff; font-size: 0.65rem; opacity: 0.5;
        text-shadow: 0 1px 4px rgba(0,0,0,0.8);
      }
      #reload-indicator {
        position: absolute; bottom: 110px; left: 50%; transform: translateX(-50%);
        color: #ffaa44; font-size: 0.8rem; font-weight: 600;
        text-shadow: 0 1px 4px rgba(0,0,0,0.8); animation: pulse 0.5s infinite; display: none;
      }
      @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      #score-display {
        position: absolute; top: 20px; right: 30px;
        color: #fff; font-size: 1.2rem; font-weight: 700;
        text-shadow: 0 2px 8px rgba(0,0,0,0.8);
      }
      #wave-display {
        position: absolute; top: 55px; right: 30px;
        color: #ff8844; font-size: 0.85rem; font-weight: 600;
        text-shadow: 0 1px 4px rgba(0,0,0,0.8);
      }
      #enemy-count {
        position: absolute; top: 20px; left: 30px;
        color: #ff4444; font-size: 0.85rem; font-weight: 600;
        text-shadow: 0 1px 4px rgba(0,0,0,0.8);
      }
      #fps-counter {
        position: absolute; bottom: 80px; left: 30px;
        color: rgba(255,255,255,0.5); font-size: 0.7rem; font-weight: 400;
        font-family: monospace;
      }
      #game-overlay {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.7); z-index: 200;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        pointer-events: auto !important;
      }
      #game-overlay * { pointer-events: auto !important; }
      #game-overlay h1 {
        color: #fff; font-size: 3rem; font-weight: 800; margin-bottom: 0.5rem;
        text-shadow: 0 4px 20px rgba(0,0,0,0.5);
      }
      #game-overlay .sub {
        color: rgba(255,255,255,0.6); font-size: 1.1rem; margin-bottom: 2rem;
      }
      #game-overlay button {
        background: var(--accent, #ff4444); color: #fff; border: none;
        padding: 14px 40px; border-radius: 8px; font-size: 1.1rem; font-weight: 700;
        cursor: pointer; transition: transform 0.15s, box-shadow 0.15s;
        pointer-events: auto !important;
      }
      #game-overlay button:hover {
        transform: scale(1.05);
        box-shadow: 0 8px 30px rgba(255,68,68,0.4);
      }
      #game-overlay .stats {
        color: rgba(255,255,255,0.7); font-size: 0.9rem; margin-top: 1.5rem;
        text-align: center; line-height: 1.8;
      }
      #game-overlay .controls-info {
        color: rgba(255,255,255,0.4); font-size: 0.75rem; margin-top: 2rem;
        text-align: center; line-height: 1.6;
      }
      #damage-container {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        pointer-events: none; z-index: 50;
      }
      .damage-vignette {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        pointer-events: none;
        box-shadow: inset 0 0 100px rgba(255,0,0,0.4);
        opacity: 0; transition: opacity 0.1s;
      }
      #wave-announce {
        position: fixed; top: 40%; left: 50%; transform: translate(-50%, -50%);
        color: #ff8844; font-size: 2.5rem; font-weight: 800; z-index: 150;
        text-shadow: 0 4px 20px rgba(0,0,0,0.8);
        opacity: 0; transition: opacity 0.3s;
        pointer-events: none;
      }
      .controls-key {
        display: inline-block; background: rgba(255,255,255,0.1); padding: 1px 6px;
        border-radius: 3px; font-family: monospace; font-size: 0.7rem;
      }
      #weapon-selector {
        position: absolute; bottom: 140px; right: 50px;
        display: flex; flex-direction: column; gap: 3px;
      }
      .weapon-slot {
        color: rgba(255,255,255,0.3); font-size: 0.6rem;
        text-shadow: 0 1px 4px rgba(0,0,0,0.8);
        text-align: right; padding: 2px 6px; border-radius: 3px;
        background: rgba(0,0,0,0.2); transition: all 0.15s;
      }
      .weapon-slot.active {
        color: #fff; opacity: 1;
        background: rgba(255,68,68,0.3);
      }
      .weapon-slot .keyhint {
        opacity: 0.4; margin-right: 4px;
      }
    `;
    document.head.appendChild(style);

    const hud = document.createElement('div');
    hud.id = 'game-hud';
    hud.innerHTML = `
      <div id="crosshair"><div id="crosshair-dot"></div></div>
      <div id="crosshair-hit"></div>
      <div id="health-text">HP</div>
      <div id="health-bar"><div id="health-fill"></div></div>
      <div id="ammo-display"><span id="ammo-current">--</span> <span id="ammo-reserve">/ --</span></div>
      <div id="weapon-name">WEAPON</div>
      <div id="weapon-selector">
        <div class="weapon-slot active" data-slot="0"><span class="keyhint">1</span> Pistol</div>
        <div class="weapon-slot" data-slot="1"><span class="keyhint">2</span> Rifle</div>
        <div class="weapon-slot" data-slot="2"><span class="keyhint">3</span> Shotgun</div>
        <div class="weapon-slot" data-slot="3"><span class="keyhint">4</span> Sniper</div>
      </div>
      <div id="score-display">Score: 0</div>
      <div id="wave-display">Wave 1</div>
      <div id="enemy-count">Enemies: 0</div>
      <div id="fps-counter">FPS: --</div>
      <div id="reload-indicator">Reloading...</div>
      <div id="damage-container">
        <div class="damage-vignette" id="damage-vignette"></div>
      </div>
      <div id="wave-announce"></div>
    `;
    document.body.appendChild(hud);

    this.vignette = document.getElementById('damage-vignette');
    this.waveAnnounce = document.getElementById('wave-announce');
    this.crosshairHit = document.getElementById('crosshair-hit');
  }

  showOverlay(type, stats = {}) {
    const existing = document.getElementById('game-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'game-overlay';

    if (type === 'start') {
      overlay.style.background = 'rgba(0,0,0,0.85)';
      overlay.innerHTML = `
        <h1 style="color:var(--accent,#ff4444)">⟳ COMBAT ARENA</h1>
        <div class="sub">Wave-based survival shooter</div>
        <button id="start-btn">START GAME</button>
        <div class="controls-info">
          <span class="controls-key">W A S D</span> Move &nbsp;|&nbsp;
          <span class="controls-key">Shift</span> Sprint &nbsp;|&nbsp;
          <span class="controls-key">Space</span> Jump &nbsp;|&nbsp;
          <span class="controls-key">1-4</span> Weapons &nbsp;|&nbsp;
          <span class="controls-key">R</span> Reload &nbsp;|&nbsp;
          <span class="controls-key">ESC</span> Pause
        </div>
      `;
    } else if (type === 'gameover') {
      overlay.innerHTML = `
        <h1 style="color:#ff4444">GAME OVER</h1>
        <div class="sub">You survived ${stats.wave} waves</div>
        <div class="stats">
          Kills: ${stats.kills} &bull; Score: ${stats.score} &bull; Wave: ${stats.wave}
        </div>
        <button id="restart-btn" style="margin-top:1rem">PLAY AGAIN</button>
      `;
    } else if (type === 'pause') {
      overlay.style.background = 'rgba(0,0,0,0.6)';
      overlay.innerHTML = `
        <h1 style="font-size:2rem">PAUSED</h1>
        <button id="resume-btn">RESUME</button>
        <div class="controls-info" style="margin-top:1rem">
          <span class="controls-key">ESC</span> or click to resume
        </div>
      `;
    }

    document.body.appendChild(overlay);
    return overlay;
  }

  hideOverlay() {
    const overlay = document.getElementById('game-overlay');
    if (overlay) overlay.remove();
  }

  showHitMarker() {
    this.hitMarkerTimer = 0.15;
    this.crosshairHit.style.display = 'block';
  }

  showDamage() {
    this.vignette.style.opacity = '1';
    setTimeout(() => { this.vignette.style.opacity = '0'; }, 100);
  }

  announceWave(wave) {
    this.waveAnnounce.textContent = `WAVE ${wave}`;
    this.waveAnnounce.style.opacity = '1';
    setTimeout(() => {
      this.waveAnnounce.style.opacity = '0';
    }, 1500);
  }

  update(health, maxHealth, ammo, reserve, weaponName, score, wave, enemies, fps, reloading, weaponIndex) {
    if (!this.visible) return;

    if (health !== this.lastHealth) {
      const pct = (health / maxHealth) * 100;
      const fill = document.getElementById('health-fill');
      fill.style.width = pct + '%';
      const healthText = document.getElementById('health-text');
      healthText.textContent = Math.round(health) + ' HP';
      this.lastHealth = health;
    }

    if (ammo !== this.lastAmmo || reserve !== this.lastReserve) {
      document.getElementById('ammo-current').textContent = reloading ? '--' : ammo;
      document.getElementById('ammo-reserve').textContent = '/ ' + reserve;
      this.lastAmmo = ammo;
      this.lastReserve = reserve;
    }

    if (weaponName !== this.lastWeapon) {
      document.getElementById('weapon-name').textContent = weaponName.toUpperCase();
      document.querySelectorAll('.weapon-slot').forEach(slot => {
        slot.classList.toggle('active', parseInt(slot.dataset.slot) === weaponIndex);
      });
      this.lastWeapon = weaponName;
    }

    if (score !== this.lastScore) {
      document.getElementById('score-display').textContent = 'Score: ' + score;
      this.lastScore = score;
    }

    if (wave !== this.lastWave) {
      document.getElementById('wave-display').textContent = 'Wave ' + wave;
      this.lastWave = wave;
    }

    document.getElementById('enemy-count').textContent = 'Enemies: ' + enemies;

    if (fps !== this.lastFPS) {
      document.getElementById('fps-counter').textContent = 'FPS: ' + fps;
      this.lastFPS = fps;
    }

    const reloadEl = document.getElementById('reload-indicator');
    reloadEl.style.display = reloading ? 'block' : 'none';

    if (this.hitMarkerTimer > 0) {
      this.hitMarkerTimer -= 0.016;
      if (this.hitMarkerTimer <= 0) {
        this.hitMarkerTimer = 0;
        this.crosshairHit.style.display = 'none';
      }
    }
  }

  clear() {
    const hud = document.getElementById('game-hud');
    if (hud) hud.remove();
    const overlay = document.getElementById('game-overlay');
    if (overlay) overlay.remove();
    this.lastHealth = -1;
  }
}
