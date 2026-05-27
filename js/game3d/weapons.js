export const WEAPONS = {
  pistol: {
    name: 'Pistol',
    damage: 25,
    headshotMultiplier: 2.5,
    ammo: 15,
    maxAmmo: 15,
    totalAmmo: 60,
    fireRate: 300,
    reloadTime: 1000,
    spread: 0.02,
    range: 80,
    recoil: 0.02,
    auto: false,
    sound: 'gunshot',
  },
  rifle: {
    name: 'Assault Rifle',
    damage: 18,
    headshotMultiplier: 2.2,
    ammo: 30,
    maxAmmo: 30,
    totalAmmo: 120,
    fireRate: 100,
    reloadTime: 1800,
    spread: 0.04,
    range: 100,
    recoil: 0.015,
    auto: true,
    sound: 'rifleShot',
  },
  shotgun: {
    name: 'Shotgun',
    damage: 12,
    headshotMultiplier: 1.8,
    ammo: 8,
    maxAmmo: 8,
    totalAmmo: 32,
    fireRate: 700,
    reloadTime: 2500,
    spread: 0.15,
    range: 30,
    recoil: 0.04,
    auto: false,
    sound: 'shotgunBlast',
    pellets: 8,
  },
  sniper: {
    name: 'Sniper',
    damage: 90,
    headshotMultiplier: 3.0,
    ammo: 5,
    maxAmmo: 5,
    totalAmmo: 20,
    fireRate: 1000,
    reloadTime: 3000,
    spread: 0.002,
    range: 200,
    recoil: 0.06,
    auto: false,
    sound: 'sniperShot',
    scope: true,
  },
};

export class WeaponManager {
  constructor() {
    this.weapons = ['pistol', 'rifle', 'shotgun', 'sniper'];
    this.currentIndex = 0;
    this.current = WEAPONS.pistol;
    this.fireTimer = 0;
    this.reloading = false;
    this.reloadTimer = 0;
    this.ammoPools = {};

    this.weapons.forEach(w => {
      const def = WEAPONS[w];
      this.ammoPools[w] = { current: def.ammo, reserve: def.totalAmmo };
    });

    this.updateCurrent();
  }

  updateCurrent() {
    const key = this.weapons[this.currentIndex];
    this.current = WEAPONS[key];
    this.currentKey = key;
  }

  switchWeapon(index) {
    if (index < 0 || index >= this.weapons.length) return;
    if (this.reloading) return;
    this.currentIndex = index;
    this.updateCurrent();
    this.fireTimer = 0;
    this.reloading = false;
  }

  nextWeapon() {
    this.switchWeapon((this.currentIndex + 1) % this.weapons.length);
  }

  prevWeapon() {
    this.switchWeapon((this.currentIndex - 1 + this.weapons.length) % this.weapons.length);
  }

  getAmmo() {
    const pool = this.ammoPools[this.currentKey];
    return { current: pool.current, reserve: pool.reserve, max: this.current.maxAmmo };
  }

  canFire() {
    if (this.reloading) return false;
    if (this.fireTimer > 0) return false;
    const pool = this.ammoPools[this.currentKey];
    if (pool.current <= 0) return false;
    return true;
  }

  fire() {
    if (!this.canFire()) return null;
    const pool = this.ammoPools[this.currentKey];
    pool.current--;
    this.fireTimer = this.current.fireRate;

    const pellets = this.current.pellets || 1;
    const hits = [];

    for (let i = 0; i < pellets; i++) {
      const spreadX = (Math.random() - 0.5) * this.current.spread;
      const spreadY = (Math.random() - 0.5) * this.current.spread;
      hits.push({
        damage: this.current.damage,
        headshotMultiplier: this.current.headshotMultiplier,
        spreadX,
        spreadY,
        range: this.current.range,
      });
    }

    return {
      weapon: this.currentKey,
      sound: this.current.sound,
      recoil: this.current.recoil,
      hits,
    };
  }

  reload() {
    if (this.reloading) return false;
    const pool = this.ammoPools[this.currentKey];
    if (pool.current >= this.current.maxAmmo) return false;
    if (pool.reserve <= 0) return false;
    this.reloading = true;
    this.reloadTimer = this.current.reloadTime;
    return true;
  }

  update(dt) {
    if (this.fireTimer > 0) this.fireTimer -= dt * 1000;
    if (this.reloading) {
      this.reloadTimer -= dt * 1000;
      if (this.reloadTimer <= 0) {
        this._finishReload();
      }
    }
  }

  _finishReload() {
    const pool = this.ammoPools[this.currentKey];
    const needed = this.current.maxAmmo - pool.current;
    const available = Math.min(needed, pool.reserve);
    pool.current += available;
    pool.reserve -= available;
    this.reloading = false;
    this.reloadTimer = 0;
  }

  addAmmo(weaponKey, amount) {
    if (!this.ammoPools[weaponKey]) return;
    const def = WEAPONS[weaponKey];
    this.ammoPools[weaponKey].reserve += Math.min(amount, def.maxAmmo * 3);
  }
}
