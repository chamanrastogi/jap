import * as THREE from 'three';
import { AudioManager, CONFIG, clamp, rand } from './utils.js';
import { buildMap, checkCollision, resolveCollision } from './map.js';
import { Player } from './player.js';
import { WeaponManager, WEAPONS } from './weapons.js';
import { Enemy, EnemyManager } from './enemies.js';
import { EffectsManager } from './effects.js';
import { UIManager } from './ui.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.running = false;
    this.paused = false;
    this.score = 0;
    this.gameTime = 0;
    this.difficulty = 1;

    this._initRenderer();
    this._initScene();
    this._initLights();
    this._initSkybox();
    this._initFog();

    this.audio = new AudioManager();
    this.walls = null;
    this.mapObjects = null;
    this.player = new Player(this.camera, this.scene);
    this.weapons = new WeaponManager();
    this.enemies = new EnemyManager(this.scene);
    this.effects = new EffectsManager(this.scene);
    this.ui = new UIManager();

    this.raycaster = new THREE.Raycaster();
    this.clock = new THREE.Clock();
    this.fpsCounter = { frames: 0, time: 0, fps: 60 };

    this.keys = {};
    this.mouseDown = false;
    this.pointerLocked = false;

    this._setupInput();
    this._setupResize();

    this._buildWorld();
    this.ui.init();

    this.gameState = 'menu';
    this.ui.showOverlay('start');
  }

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
    this.camera.position.set(0, CONFIG.PLAYER_HEIGHT, 0);
  }

  _initLights() {
    const ambient = new THREE.AmbientLight(0x404060, 0.4);
    this.scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0x88aaff, 0x444422, 0.6);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xffeedd, 1.2);
    sun.position.set(30, 40, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 100;
    sun.shadow.camera.left = -50;
    sun.shadow.camera.right = 50;
    sun.shadow.camera.top = 50;
    sun.shadow.camera.bottom = -50;
    this.scene.add(sun);
    this.sun = sun;

    const fill = new THREE.DirectionalLight(0x8888ff, 0.3);
    fill.position.set(-20, 10, -30);
    this.scene.add(fill);
  }

  _initSkybox() {
    const skyGeo = new THREE.SphereGeometry(200, 16, 16);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x0a0a1a) },
        bottomColor: { value: new THREE.Color(0x1a1a3e) },
        offset: { value: 10 },
        exponent: { value: 0.3 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide,
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(sky);
  }

  _initFog() {
    this.scene.fog = new THREE.FogExp2(0x1a1a2e, 0.008);
  }

  _buildWorld() {
    const result = buildMap(this.scene);
    this.walls = result.walls;
    this.mapObjects = result.buildings;
  }

  _setupInput() {
    document.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if (e.key === 'r' || e.key === 'R') {
        if (this.weapons.reload()) {
          this.audio.reload();
        }
      }
      if (e.key >= '1' && e.key <= '4') {
        this.weapons.switchWeapon(parseInt(e.key) - 1);
      }
      if (e.key === 'Escape') {
        this._togglePause();
      }
    });

    document.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    this.canvas.addEventListener('click', () => {
      if (this.gameState === 'playing' && !this.pointerLocked) {
        this.canvas.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === this.canvas;
      if (!this.pointerLocked && this.gameState === 'playing' && !this.paused) {
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.pointerLocked || this.paused) return;
      this.player.yaw -= e.movementX * CONFIG.MOUSE_SENSITIVITY;
      this.player.pitch -= e.movementY * CONFIG.MOUSE_SENSITIVITY;
      this.player.pitch = clamp(this.player.pitch, -Math.PI / 2.2, Math.PI / 2.2);
    });

    document.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.mouseDown = true;
    });

    document.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouseDown = false;
    });

    document.addEventListener('click', (e) => {
      const overlay = document.getElementById('game-overlay');
      if (!overlay) return;

      const startBtn = document.getElementById('start-btn');
      const restartBtn = document.getElementById('restart-btn');
      const resumeBtn = document.getElementById('resume-btn');

      if (startBtn && startBtn.contains(e.target)) {
        this.startGame();
      } else if (restartBtn && restartBtn.contains(e.target)) {
        this.restartGame();
      } else if (resumeBtn && resumeBtn.contains(e.target)) {
        this._togglePause();
      } else if (overlay && overlay.id === 'game-overlay' && this.paused) {
        this._togglePause();
      }
    });

    window.addEventListener('blur', () => {
      if (this.gameState === 'playing') this._togglePause();
    });
  }

  _setupResize() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  startGame() {
    this.audio.init();
    this.audio.resume();
    this.ui.hideOverlay();

    this.gameState = 'playing';
    this.running = true;
    this.score = 0;
    this.gameTime = 0;
    this.difficulty = 1;

    this.player.reset();
    this.player.showWeapon();

    this.enemies.removeAll();
    this.effects.clear();

    const count = this.enemies.startWave();
    this.audio.waveStart();

    this.canvas.requestPointerLock();
    this._startLoop();
  }

  restartGame() {
    this._stopLoop();
    this.startGame();
  }

  _togglePause() {
    if (this.gameState !== 'playing') return;
    this.paused = !this.paused;

    if (this.paused) {
      if (this.pointerLocked) document.exitPointerLock();
      this.ui.showOverlay('pause');
    } else {
      this.ui.hideOverlay();
      this.canvas.requestPointerLock();
    }
  }

  _startLoop() {
    if (this._loopRunning) return;
    this._loopRunning = true;
    this.clock.start();
    this._loop();
  }

  _stopLoop() {
    this._loopRunning = false;
    this.running = false;
  }

  _loop() {
    if (!this._loopRunning) return;
    requestAnimationFrame(() => this._loop());

    const dt = Math.min(this.clock.getDelta(), 0.05);

    if (this.paused) {
      this.renderer.render(this.scene, this.camera);
      return;
    }

    this._updateFPS(dt);
    this._updatePlayer(dt);
    this._updateCamera();
    this.weapons.update(dt);
    this._updateShooting(dt);
    this._updateEnemies(dt);
    this.effects.update(dt);
    this._updateUI(dt);

    this.renderer.render(this.scene, this.camera);
  }

  _updateFPS(dt) {
    this.fpsCounter.frames++;
    this.fpsCounter.time += dt;
    if (this.fpsCounter.time >= 0.5) {
      this.fpsCounter.fps = Math.round(this.fpsCounter.frames / this.fpsCounter.time);
      this.fpsCounter.frames = 0;
      this.fpsCounter.time = 0;
    }
  }

  _updatePlayer(dt) {
    this.player.keys = {
      w: this.keys['w'] || false,
      a: this.keys['a'] || false,
      s: this.keys['s'] || false,
      d: this.keys['d'] || false,
      shift: this.keys['shift'] || false,
      space: this.keys[' '] || false,
    };

    const event = this.player.update(dt, this.walls);
    if (event === 'footstep') {
      this.audio.footstep();
    }
  }

  _updateCamera() {
    const qx = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.player.yaw);
    const qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.player.pitch);
    this.camera.quaternion.copy(qx.multiply(qy));
  }

  _updateShooting(dt) {
    if (this.mouseDown && this.pointerLocked) {
      if (this.weapons.canFire()) {
        this._fireWeapon();
      }
    }
  }

  _fireWeapon() {
    const result = this.weapons.fire();
    if (!result) return;

    this.audio.resume();
    const soundMethod = this.audio[result.sound];
    if (soundMethod) soundMethod.call(this.audio);

    switch (result.weapon) {
      case 'pistol': this.player.recoil(result.recoil); break;
      case 'rifle': this.player.recoilRifle(); break;
      case 'shotgun': this.player.recoilShotgun(); break;
      case 'sniper': this.player.recoilSniper(); break;
    }

    const muzzlePos = this.camera.position.clone().add(
      new THREE.Vector3(0, -0.1, -0.3).applyQuaternion(this.camera.quaternion)
    );
    this.effects.muzzleFlash(muzzlePos, this.camera.getWorldDirection(new THREE.Vector3()));

    for (const hit of result.hits) {
      const dir = this.camera.getWorldDirection(new THREE.Vector3());
      dir.x += hit.spreadX;
      dir.y += hit.spreadY;
      dir.normalize();

      this.raycaster.set(this.camera.position, dir);
      this.raycaster.far = hit.range;

      const enemyMeshes = [];
      for (const e of this.enemies.enemies) {
        if (e.alive) {
          e.group.traverse(child => {
            if (child.isMesh) enemyMeshes.push({ mesh: child, enemy: e });
          });
        }
      }

      const intersects = this.raycaster.intersectObjects(enemyMeshes.map(m => m.mesh));

      let hitEnemy = null;
      let hitPoint = null;
      let isHeadshot = false;

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object;
        hitPoint = intersects[0].point;
        const found = enemyMeshes.find(m => m.mesh === hitMesh);
        if (found) {
          hitEnemy = found.enemy;
          const headY = found.enemy.position.y + 0.7;
          isHeadshot = hitPoint.y > headY;
        }
      }

      if (hitEnemy) {
        const dmg = isHeadshot ? hit.damage * hit.headshotMultiplier : hit.damage;
        hitEnemy.takeDamage(dmg, hitPoint);
        this.effects.bloodEffect(hitPoint);
        this.effects.bulletImpact(hitPoint, intersects[0].face?.normal);
        this.audio.enemyHit();

        if (!hitEnemy.alive) {
          this.score += isHeadshot ? 150 : 100;
          this.audio.enemyDeath();
          this.effects.explosion(hitEnemy.position, 1.5);
          this.enemies.killCount++;
        } else {
          this.score += isHeadshot ? 15 : 10;
        }

        this.ui.showHitMarker();
        this.audio.hit();
      } else {
        const wallIntersects = this.raycaster.intersectObjects(
          this.walls.filter(w => w.mesh).map(w => w.mesh),
          true
        );
        if (wallIntersects.length > 0) {
          const wHit = wallIntersects[0];
          this.effects.bulletImpact(wHit.point, wHit.face?.normal);
        }
      }
    }
  }

  _updateEnemies(dt) {
    const events = this.enemies.update(dt, this.player.position, this.walls);

    for (const event of events) {
      switch (event.type) {
        case 'attack':
          const dist = event.position.distanceTo(this.player.position);
          if (dist < CONFIG.ENEMY_ATTACK_RANGE * 1.2) {
            this.player.takeDamage(event.damage);
            this.ui.showDamage();
            this.audio.playerHit();
          }
          break;
        case 'wave_complete':
          this.score += 500 * this.enemies.wave;
          break;
        case 'wave_start':
          this.audio.waveStart();
          this.ui.announceWave(event.wave);
          break;
      }
    }

    if (this.player.health <= 0 && this.player.alive) {
      this._gameOver();
    }
  }

  _gameOver() {
    this.player.alive = false;
    this.gameState = 'gameover';
    this._stopLoop();
    this.audio.gameOver();
    if (this.pointerLocked) document.exitPointerLock();

    this.ui.showOverlay('gameover', {
      kills: this.enemies.killCount,
      score: this.score,
      wave: this.enemies.wave,
    });
  }

  _updateUI(dt) {
    const ammo = this.weapons.getAmmo();
    this.ui.update(
      this.player.health,
      this.player.maxHealth,
      ammo.current,
      ammo.reserve,
      this.weapons.current.name,
      this.score,
      this.enemies.wave,
      this.enemies.enemiesRemaining,
      this.fpsCounter.fps,
      this.weapons.reloading,
      this.weapons.currentIndex
    );
  }
}
