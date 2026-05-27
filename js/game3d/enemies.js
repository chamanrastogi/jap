import * as THREE from 'three';
import { CONFIG, rand, randInt, vecDist } from './utils.js';

export class Enemy {
  constructor(scene, id) {
    this.id = id;
    this.scene = scene;
    this.health = CONFIG.ENEMY_HEALTH;
    this.maxHealth = CONFIG.ENEMY_HEALTH;
    this.alive = true;
    this.speed = CONFIG.ENEMY_SPEED + rand(-0.5, 0.5);
    this.state = 'patrol';
    this.stateTimer = 0;

    this.position = this._randomSpawnPos();
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.targetPosition = this.position.clone();

    this.attackCooldown = 0;
    this.attackRange = CONFIG.ENEMY_ATTACK_RANGE;
    this.chaseRange = CONFIG.ENEMY_CHASE_RANGE;
    this.detectionRange = CONFIG.ENEMY_CHASE_RANGE;

    this.respawnTimer = 0;
    this.deathTimer = 0;

    this._createMesh();

    this._pickNewPatrolTarget();
  }

  _createMesh() {
    this.group = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xcc3333, roughness: 0.6, metalness: 0.2 });
    const headMat = new THREE.MeshStandardMaterial({ color: 0xdd4444, roughness: 0.5 });
    const armMat = new THREE.MeshStandardMaterial({ color: 0xbb2222, roughness: 0.7 });
    const legMat = new THREE.MeshStandardMaterial({ color: 0x881111, roughness: 0.8 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.6, 6), bodyMat);
    body.position.y = 0.6;
    body.castShadow = true;
    this.group.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), headMat);
    head.position.y = 1.0;
    head.castShadow = true;
    this.group.add(head);

    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 4), eyeMat);
    eyeL.position.set(-0.1, 1.05, -0.15);
    this.group.add(eyeL);

    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 4), eyeMat);
    eyeR.position.set(0.1, 1.05, -0.15);
    this.group.add(eyeR);

    const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.35, 4), armMat);
    leftArm.position.set(-0.3, 0.6, 0);
    leftArm.rotation.z = 0.2;
    this.group.add(leftArm);

    const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.35, 4), armMat);
    rightArm.position.set(0.3, 0.6, 0);
    rightArm.rotation.z = -0.2;
    this.group.add(rightArm);

    const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.3, 4), legMat);
    leftLeg.position.set(-0.1, 0.15, 0);
    this.group.add(leftLeg);

    const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.3, 4), legMat);
    rightLeg.position.set(0.1, 0.15, 0);
    this.group.add(rightLeg);

    const glowMat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.3 });
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.4, 6, 6), glowMat);
    glow.position.y = 0.5;
    this.group.add(glow);
    this.glow = glow;

    this.group.position.copy(this.position);
    this.scene.add(this.group);
  }

  _randomSpawnPos() {
    const halfWorld = CONFIG.WORLD_SIZE * 0.8;
    let x, z;
    do {
      x = rand(-halfWorld, halfWorld);
      z = rand(-halfWorld, halfWorld);
    } while (Math.abs(x) < 10 && Math.abs(z) < 10);
    return new THREE.Vector3(x, 0, z);
  }

  _pickNewPatrolTarget() {
    const halfWorld = CONFIG.WORLD_SIZE * 0.7;
    this.targetPosition.set(
      rand(-halfWorld, halfWorld),
      0,
      rand(-halfWorld, halfWorld)
    );
    this.stateTimer = rand(3, 8);
  }

  takeDamage(amount, hitPoint = null) {
    if (!this.alive) return false;
    this.health -= amount;

    if (hitPoint && hitPoint.y > this.position.y + 0.7) {
      this.health -= amount * 0.5;
    }

    if (this.health <= 0) {
      this.health = 0;
      this.die();
      return true;
    }
    return false;
  }

  die() {
    this.alive = false;
    this.state = 'dead';
    this.deathTimer = 2;

    this.group.traverse(child => {
      if (child.isMesh) {
        child.material = child.material.clone();
        child.material.color.setHex(0x666666);
      }
    });

    this.group.rotation.x = Math.PI / 2;
    this.group.position.y = 0.05;
  }

  respawn() {
    this.health = CONFIG.ENEMY_HEALTH;
    this.alive = true;
    this.state = 'patrol';
    this.position.copy(this._randomSpawnPos());
    this.group.position.copy(this.position);
    this.group.rotation.x = 0;
    this.group.rotation.y = 0;

    this.group.traverse(child => {
      if (child.isMesh) {
        child.material = child.material.clone();
        const colors = [0xcc3333, 0xdd4444, 0xbb2222, 0x881111, 0x33cc33, 0x4444cc, 0xcc8833];
        child.material.color.setHex(colors[randInt(0, colors.length - 1)]);
      }
    });

    this._pickNewPatrolTarget();
  }

  update(dt, playerPos, walls) {
    if (!this.alive) {
      this.deathTimer -= dt;
      if (this.deathTimer <= 0) {
        this.respawnTimer -= dt;
        if (this.respawnTimer <= 0) {
          this.respawnTimer = CONFIG.ENEMY_RESPAWN_DELAY / 1000;
          this.respawn();
        }
      }
      return null;
    }

    const dist = vecDist(this.position, playerPos);
    this.attackCooldown -= dt;

    if (dist < this.attackRange) {
      this.state = 'attack';
    } else if (dist < this.chaseRange) {
      this.state = 'chase';
    } else {
      this.state = 'patrol';
    }

    this.glow.material.opacity = this.state === 'attack' ? 0.7 : this.state === 'chase' ? 0.4 : 0.2;

    let moveDir = new THREE.Vector3(0, 0, 0);

    switch (this.state) {
      case 'chase': {
        const toPlayer = new THREE.Vector3().copy(playerPos).sub(this.position);
        toPlayer.y = 0;
        toPlayer.normalize();
        moveDir.copy(toPlayer);
        break;
      }
      case 'attack': {
        const toPlayer = new THREE.Vector3().copy(playerPos).sub(this.position);
        toPlayer.y = 0;
        toPlayer.normalize();
        moveDir.copy(toPlayer);

        if (this.attackCooldown <= 0) {
          this.attackCooldown = 1.5;
          return { type: 'attack', damage: CONFIG.ENEMY_DAMAGE, position: this.position.clone(), target: playerPos.clone() };
        }
        break;
      }
      case 'patrol': {
        const toTarget = new THREE.Vector3().copy(this.targetPosition).sub(this.position);
        if (toTarget.length() < 2) {
          this._pickNewPatrolTarget();
        } else {
          toTarget.y = 0;
          toTarget.normalize();
          moveDir.copy(toTarget);
        }
        break;
      }
    }

    if (moveDir.length() > 0) {
      this.position.x += moveDir.x * this.speed * dt;
      this.position.z += moveDir.z * this.speed * dt;
      this.group.rotation.y = Math.atan2(moveDir.x, moveDir.z);
    }

    const halfWorld = CONFIG.WORLD_SIZE;
    this.position.x = Math.max(-halfWorld, Math.min(halfWorld, this.position.x));
    this.position.z = Math.max(-halfWorld, Math.min(halfWorld, this.position.z));

    this.group.position.copy(this.position);

    const bob = Math.sin(Date.now() * 0.01) * 0.02;
    this.group.position.y = bob;

    return null;
  }

  getHeadPosition() {
    return new THREE.Vector3(this.position.x, this.position.y + 0.9, this.position.z);
  }

  getBodyPosition() {
    return new THREE.Vector3(this.position.x, this.position.y + 0.4, this.position.z);
  }
}

export class EnemyManager {
  constructor(scene) {
    this.scene = scene;
    this.enemies = [];
    this.killCount = 0;
    this.wave = 1;
    this.enemiesRemaining = 0;
    this.waveActive = false;
    this.waveDelay = 0;
  }

  startWave() {
    const count = CONFIG.WAVE_ENEMIES_BASE + (this.wave - 1) * CONFIG.WAVE_ENEMY_MULTIPLIER;
    const toSpawn = Math.min(count, 30);

    for (let i = 0; i < toSpawn; i++) {
      const enemy = new Enemy(this.scene, this.enemies.length + i);
      this.enemies.push(enemy);
    }

    this.enemiesRemaining = toSpawn;
    this.waveActive = true;
    return toSpawn;
  }

  nextWave() {
    this.wave++;
    this.waveActive = false;
    this.waveDelay = CONFIG.WAVE_DELAY / 1000;
    return this.startWave();
  }

  handleEnemyDeath(index) {
    const enemy = this.enemies[index];
    if (enemy && !enemy.alive) {
      this.killCount++;
      this.enemiesRemaining = this.enemies.filter(e => e.alive).length;
      return true;
    }
    return false;
  }

  update(dt, playerPos, walls) {
    const events = [];
    let allDead = true;

    for (let i = 0; i < this.enemies.length; i++) {
      const enemy = this.enemies[i];
      const event = enemy.update(dt, playerPos, walls);
      if (event) events.push({ ...event, enemyIndex: i });
      if (enemy.alive || enemy.deathTimer > 0) allDead = false;
    }

    this.enemiesRemaining = this.enemies.filter(e => e.alive).length;

    if (this.waveActive && allDead) {
      this.waveActive = false;
      this.waveDelay = CONFIG.WAVE_DELAY / 1000;
      events.push({ type: 'wave_complete', wave: this.wave });
    }

    if (!this.waveActive && this.waveDelay > 0) {
      this.waveDelay -= dt;
      if (this.waveDelay <= 0) {
        this.nextWave();
        events.push({ type: 'wave_start', wave: this.wave });
      }
    }

    return events;
  }

  removeAll() {
    this.enemies.forEach(e => {
      this.scene.remove(e.group);
    });
    this.enemies = [];
    this.killCount = 0;
    this.wave = 1;
    this.waveActive = false;
  }
}
