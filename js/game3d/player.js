import * as THREE from 'three';
import { CONFIG, clamp } from './utils.js';
import { checkCollision, resolveCollision } from './map.js';

export class Player {
  constructor(camera, scene) {
    this.camera = camera;
    this.scene = scene;
    this.health = CONFIG.PLAYER_HEALTH;
    this.maxHealth = CONFIG.PLAYER_HEALTH;
    this.position = new THREE.Vector3(0, CONFIG.PLAYER_HEIGHT, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.yaw = 0;
    this.pitch = 0;
    this.onGround = false;
    this.sprinting = false;
    this.alive = true;

    this.keys = { w: false, a: false, s: false, d: false, shift: false, space: false };
    this.prevPosition = this.position.clone();

    this.weaponBob = 0;
    this.bobAmount = 0;
    this.footstepTimer = 0;

    this.camera.position.set(0, CONFIG.PLAYER_HEIGHT, 0);
    this.camera.position.copy(this.position);

    this._createWeaponMesh();
  }

  _createWeaponMesh() {
    const group = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6, roughness: 0.3 });
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.7, roughness: 0.2 });
    const gripMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.9 });

    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.25, 8), barrelMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, -0.05, -0.4);
    group.add(barrel);

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.2), bodyMat);
    body.position.set(0, -0.03, -0.3);
    group.add(body);

    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.04), gripMat);
    grip.position.set(0, -0.1, -0.25);
    group.add(grip);

    const slide = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.15), bodyMat);
    slide.position.set(0, -0.02, -0.3);
    group.add(slide);

    group.position.set(0.3, -0.25, -0.5);
    this.camera.add(group);
    this.weaponGroup = group;
    this.weaponGroup.visible = false;
  }

  showWeapon() {
    this.weaponGroup.visible = true;
  }

  hideWeapon() {
    this.weaponGroup.visible = false;
  }

  recoil(amount = 0.02) {
    this.pitch -= amount * 0.5;
    this.weaponGroup.position.x = 0.35;
    this.weaponGroup.position.y = -0.22;
  }

  recoilRifle() {
    this.recoil(0.015);
  }

  recoilShotgun() {
    this.pitch -= 0.04;
    this.weaponGroup.position.x = 0.4;
    this.weaponGroup.position.y = -0.18;
  }

  recoilSniper() {
    this.pitch -= 0.06;
    this.weaponGroup.position.x = 0.45;
    this.weaponGroup.position.y = -0.15;
  }

  takeDamage(amount) {
    if (!this.alive) return;
    this.health = clamp(this.health - amount, 0, this.maxHealth);
    if (this.health <= 0) {
      this.alive = false;
    }
  }

  heal(amount) {
    this.health = clamp(this.health + amount, 0, this.maxHealth);
  }

  update(dt, walls) {
    if (!this.alive) return;

    this.sprinting = this.keys.shift;
    const speed = this.sprinting ? CONFIG.PLAYER_SPRINT : CONFIG.PLAYER_SPEED;
    const move = new THREE.Vector3(0, 0, 0);

    if (this.keys.w) move.z -= 1;
    if (this.keys.s) move.z += 1;
    if (this.keys.a) move.x -= 1;
    if (this.keys.d) move.x += 1;

    if (move.length() > 0) {
      move.normalize();
      this.bobAmount = Math.min(this.bobAmount + dt * 8, 1);
    } else {
      this.bobAmount = Math.max(this.bobAmount - dt * 4, 0);
    }

    this.prevPosition.copy(this.position);

    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

    const moveWorld = new THREE.Vector3();
    moveWorld.addScaledVector(forward, move.z);
    moveWorld.addScaledVector(right, move.x);
    moveWorld.multiplyScalar(speed * dt);

    this.position.x += moveWorld.x;
    this.position.z += moveWorld.z;

    resolveCollision(this.position, this.prevPosition, walls);

    if (this.keys.space && this.onGround) {
      this.velocity.y = CONFIG.PLAYER_JUMP;
      this.onGround = false;
    }

    this.velocity.y += CONFIG.GRAVITY * dt;
    this.position.y += this.velocity.y * dt;

    if (this.position.y <= CONFIG.PLAYER_HEIGHT) {
      this.position.y = CONFIG.PLAYER_HEIGHT;
      this.velocity.y = 0;
      this.onGround = true;
    }

    this.camera.position.copy(this.position);

    this.weaponBob += dt * 10 * this.bobAmount;
    const bobX = Math.sin(this.weaponBob) * 0.008 * this.bobAmount;
    const bobY = Math.abs(Math.cos(this.weaponBob)) * 0.008 * this.bobAmount;
    this.weaponGroup.position.x = 0.3 + bobX;
    this.weaponGroup.position.y = -0.25 + bobY;

    const recoilRecover = 1 - Math.exp(-10 * dt);
    this.weaponGroup.position.x += (0.3 - this.weaponGroup.position.x) * (1 - Math.exp(-10 * dt));
    this.weaponGroup.position.y += (-0.25 - this.weaponGroup.position.y) * (1 - Math.exp(-10 * dt));

    if (move.length() > 0 && this.onGround) {
      this.footstepTimer += dt;
      if (this.footstepTimer > 0.5) {
        this.footstepTimer = 0;
        return 'footstep';
      }
    } else {
      this.footstepTimer = 0;
    }

    return null;
  }

  reset() {
    this.health = CONFIG.PLAYER_HEALTH;
    this.position.set(0, CONFIG.PLAYER_HEIGHT, 0);
    this.velocity.set(0, 0, 0);
    this.yaw = 0;
    this.pitch = 0;
    this.onGround = false;
    this.sprinting = false;
    this.alive = true;
    this.camera.position.copy(this.position);
    this.weaponGroup.position.set(0.3, -0.25, -0.5);
  }
}
