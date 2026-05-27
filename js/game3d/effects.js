import * as THREE from 'three';
import { rand, randInt } from './utils.js';

export class EffectsManager {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.impacts = [];
    this.muzzleFlashes = [];
    this.bulletHoles = [];
    this.debris = [];
  }

  muzzleFlash(position, direction) {
    const flash = new THREE.Group();

    const mat = new THREE.MeshBasicMaterial({ color: 0xffffaa, transparent: true, opacity: 0.9 });
    const geo = new THREE.SphereGeometry(0.08, 4, 4);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.scale.set(1, 1, 3);
    flash.add(mesh);

    const light = new THREE.PointLight(0xffffaa, 2, 5);
    flash.add(light);

    flash.position.copy(position);
    const dir = direction.clone().normalize();
    flash.position.add(dir.clone().multiplyScalar(0.5));
    flash.lookAt(position.clone().add(dir));

    this.scene.add(flash);
    this.muzzleFlashes.push({ mesh: flash, life: 0.06, maxLife: 0.06 });
  }

  bulletImpact(position, normal) {
    const color = 0xffaa44;
    const count = 6;

    for (let i = 0; i < count; i++) {
      const size = rand(0.02, 0.06);
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.8,
      });
      const geo = new THREE.BoxGeometry(size, size, size);
      const mesh = new THREE.Mesh(geo, mat);

      const dir = new THREE.Vector3(rand(-1, 1), rand(-0.5, 1), rand(-1, 1)).normalize();
      const speed = rand(1, 4);
      mesh.position.copy(position);
      if (normal) mesh.position.add(normal.clone().multiplyScalar(0.05));

      this.scene.add(mesh);
      this.impacts.push({
        mesh,
        velocity: dir.multiplyScalar(speed),
        life: rand(0.3, 0.6),
        maxLife: 0.6,
        gravity: 5,
      });
    }
  }

  bloodEffect(position) {
    const color = 0xcc1111;
    const count = 8;

    for (let i = 0; i < count; i++) {
      const size = rand(0.03, 0.08);
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.7,
      });
      const geo = new THREE.SphereGeometry(size, 4, 4);
      const mesh = new THREE.Mesh(geo, mat);

      const dir = new THREE.Vector3(rand(-1, 1), rand(0.2, 1), rand(-1, 1)).normalize();
      const speed = rand(2, 6);
      mesh.position.copy(position);

      this.scene.add(mesh);
      this.impacts.push({
        mesh,
        velocity: dir.multiplyScalar(speed),
        life: rand(0.4, 0.8),
        maxLife: 0.8,
        gravity: 8,
      });
    }
  }

  explosion(position, radius = 3) {
    const colors = [0xff4400, 0xff8800, 0xffcc00, 0xff6600];
    const count = 30;

    for (let i = 0; i < count; i++) {
      const size = rand(0.05, 0.15);
      const mat = new THREE.MeshBasicMaterial({
        color: colors[randInt(0, colors.length - 1)],
        transparent: true,
        opacity: 0.9,
      });
      const geo = new THREE.BoxGeometry(size, size, size);
      const mesh = new THREE.Mesh(geo, mat);

      const theta = rand(0, Math.PI * 2);
      const phi = rand(0, Math.PI * 2);
      const dir = new THREE.Vector3(
        Math.sin(theta) * Math.cos(phi),
        Math.abs(Math.sin(phi)),
        Math.cos(theta) * Math.cos(phi)
      ).normalize();
      const speed = rand(3, 8);
      mesh.position.copy(position);

      this.scene.add(mesh);
      this.impacts.push({
        mesh,
        velocity: dir.multiplyScalar(speed),
        life: rand(0.5, 1.2),
        maxLife: 1.2,
        gravity: 3,
      });
    }

    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0.6,
    });
    const glowGeo = new THREE.SphereGeometry(radius * 0.3, 8, 8);
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.copy(position);
    this.scene.add(glow);
    this.impacts.push({
      mesh: glow,
      velocity: new THREE.Vector3(0, 0.5, 0),
      life: 0.5,
      maxLife: 0.5,
      gravity: 0,
      scaleUp: true,
    });
  }

  bulletHole(position, normal) {
    const mat = new THREE.MeshBasicMaterial({
      color: 0x222222,
      transparent: true,
      opacity: 0.6,
    });
    const geo = new THREE.CircleGeometry(0.05, 6);
    const mesh = new THREE.Mesh(geo, mat);

    mesh.position.copy(position);
    if (normal) {
      mesh.lookAt(position.clone().add(normal));
      mesh.position.add(normal.clone().multiplyScalar(0.01));
    }

    this.scene.add(mesh);
    this.bulletHoles.push({ mesh, life: 30 });
  }

  update(dt) {
    this._updateParticles(dt);
    this._updateMuzzleFlashes(dt);
    this._updateBulletHoles(dt);
  }

  _updateParticles(dt) {
    for (let i = this.impacts.length - 1; i >= 0; i--) {
      const p = this.impacts[i];
      p.life -= dt;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.impacts.splice(i, 1);
        continue;
      }

      const fade = p.life / p.maxLife;
      p.mesh.material.opacity = fade;

      if (p.scaleUp) {
        const s = 1 + (1 - fade) * 2;
        p.mesh.scale.set(s, s, s);
      }

      p.velocity.y -= p.gravity * dt;
      p.mesh.position.add(p.velocity.clone().multiplyScalar(dt));

      if (p.mesh.position.y < 0) {
        p.velocity.y = -p.velocity.y * 0.3;
        p.mesh.position.y = 0;
      }
    }
  }

  _updateMuzzleFlashes(dt) {
    for (let i = this.muzzleFlashes.length - 1; i >= 0; i--) {
      const f = this.muzzleFlashes[i];
      f.life -= dt;
      f.mesh.material.opacity = f.life / f.maxLife;
      f.mesh.scale.setScalar(1 + (1 - f.life / f.maxLife) * 2);

      if (f.life <= 0) {
        this.scene.remove(f.mesh);
        this.muzzleFlashes.splice(i, 1);
      }
    }
  }

  _updateBulletHoles(dt) {
    for (let i = this.bulletHoles.length - 1; i >= 0; i--) {
      const h = this.bulletHoles[i];
      h.life -= dt;
      if (h.life <= 0) {
        this.scene.remove(h.mesh);
        this.bulletHoles.splice(i, 1);
      }
    }
  }

  clear() {
    [...this.impacts, ...this.muzzleFlashes, ...this.bulletHoles].forEach(p => {
      this.scene.remove(p.mesh || p.mesh);
    });
    this.impacts = [];
    this.muzzleFlashes = [];
    this.bulletHoles = [];
  }
}
