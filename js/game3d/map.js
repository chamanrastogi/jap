import * as THREE from 'three';
import { CONFIG } from './utils.js';

export function buildMap(scene) {
  const worldSize = CONFIG.WORLD_SIZE;

  const groundGeo = new THREE.PlaneGeometry(worldSize * 2, worldSize * 2);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x3a5a3a,
    roughness: 0.9,
    metalness: 0,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const grid = new THREE.GridHelper(worldSize * 2, 40, 0x444444, 0x333333);
  grid.position.y = 0.01;
  scene.add(grid);

  const walls = [];
  const buildings = [];

  function addWall(x, z, w, h, d, color = 0x555555) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.2 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    const halfW = w / 2, halfH = h / 2, halfD = d / 2;
    const min = new THREE.Vector3(x - halfW, 0, z - halfD);
    const max = new THREE.Vector3(x + halfW, h, z + halfD);
    walls.push({ mesh, min, max, isBuilding: false });
    return { mesh, min, max, isBuilding: false };
  }

  function addBuilding(x, z, w, h, d, color = 0x6b7b8d) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.1 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const roofMat = new THREE.MeshStandardMaterial({ color: 0x4a5568, roughness: 0.8 });
    const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, 0.15, d + 0.2), roofMat);
    roof.position.set(x, h + 0.075, z);
    roof.castShadow = true;
    roof.receiveShadow = true;
    scene.add(roof);

    const hw = w / 2, hd = d / 2;
    const min = new THREE.Vector3(x - hw, 0, z - hd);
    const max = new THREE.Vector3(x + hw, h, z + hd);
    walls.push({ mesh, min, max, isBuilding: true });
    buildings.push(mesh);
    return { mesh, min, max, isBuilding: true };
  }

  function addCrate(x, z, s = 0.8, color = 0x8B4513) {
    const geo = new THREE.BoxGeometry(s, s, s);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, s / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    const hs = s / 2;
    const min = new THREE.Vector3(x - hs, 0, z - hs);
    const max = new THREE.Vector3(x + hs, s, z + hs);
    walls.push({ mesh, min, max, isBuilding: false });
  }

  function addTree(x, z) {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.9 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 2, 6), trunkMat);
    trunk.position.set(x, 1, z);
    trunk.castShadow = true;
    scene.add(trunk);

    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2d5a27, roughness: 0.8 });
    const crown = new THREE.Mesh(new THREE.SphereGeometry(1.2, 6, 6), leafMat);
    crown.position.set(x, 2.8, z);
    crown.castShadow = true;
    scene.add(crown);
  }

  function addLamp(x, z) {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.5, roughness: 0.3 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3, 6), poleMat);
    pole.position.set(x, 1.5, z);
    pole.castShadow = true;
    scene.add(pole);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.05), poleMat);
    arm.position.set(x + 0.25, 3, z);
    scene.add(arm);
    const light = new THREE.PointLight(0xffeedd, 0.3, 8);
    light.position.set(x + 0.25, 2.9, z);
    scene.add(light);
  }

  addBuilding(-20, -20, 6, 4, 6, 0x6b7b8d);
  addBuilding(20, 15, 5, 3.5, 5, 0x7d8a96);
  addBuilding(-15, 22, 7, 5, 5, 0x5a6a7a);
  addBuilding(22, -18, 4, 3, 8, 0x7a8a9a);
  addBuilding(-25, 0, 5, 4, 5, 0x6a7b8b);

  addWall(-5, -5, 3, 2, 0.5);
  addWall(5, 8, 4, 2.5, 0.5);
  addWall(-8, 10, 0.5, 2, 3);
  addWall(10, -10, 0.5, 2, 3);

  addCrate(-3, -8);
  addCrate(-2, -8);
  addCrate(-2.5, -7);
  addCrate(8, 5);
  addCrate(9, 5);
  addCrate(8.5, 6);
  addCrate(-12, -12, 0.6, 0x654321);
  addCrate(15, -5, 0.6, 0x654321);
  addCrate(15, -4, 0.6, 0x654321);
  addCrate(-18, 15, 0.7, 0x556b2f);

  const treePositions = [
    [-30, -30], [-28, -25], [30, -28], [25, -30],
    [-30, 28], [-25, 30], [30, 28], [28, 25],
    [-33, -10], [-33, 10], [33, -10], [33, 10],
    [-10, -33], [10, -33], [-10, 33], [10, 33],
    [-22, -28], [28, -22], [-28, 22], [22, 28],
  ];
  treePositions.forEach(([x, z]) => addTree(x, z));

  const lampPositions = [
    [-20, -20], [20, 20], [-20, 20], [20, -20],
    [0, -30], [0, 30], [-30, 0], [30, 0],
  ];
  lampPositions.forEach(([x, z]) => addLamp(x, z));

  const boundaryMat = new THREE.MeshBasicMaterial({ color: 0xff3333, transparent: true, opacity: 0.15, side: THREE.DoubleSide });
  const boundaryHeight = 5;
  const halfW = worldSize;
  const bThick = 0.5;

  const bPositions = [
    [0, 0, -halfW, 0, halfW * 2, boundaryHeight, bThick],
    [0, 0, halfW, 0, halfW * 2, boundaryHeight, bThick],
    [-halfW, 0, 0, 0, bThick, boundaryHeight, halfW * 2],
    [halfW, 0, 0, 0, bThick, boundaryHeight, halfW * 2],
  ];

  bPositions.forEach(([x, y, z, rx, ry, rz, sx]) => {
    const bGeo = new THREE.BoxGeometry(rz, ry, rx);
    const bMesh = new THREE.Mesh(bGeo, boundaryMat);
    bMesh.position.set(x, y, z);
    scene.add(bMesh);
  });

  const boundaryWallData = [];
  const bCount = 4;
  const bHalf = worldSize;
  const thick = 1;
  const bData = [
    { x: 0, z: -bHalf - thick / 2, w: bHalf * 2, d: thick },
    { x: 0, z: bHalf + thick / 2, w: bHalf * 2, d: thick },
    { x: -bHalf - thick / 2, z: 0, w: thick, d: bHalf * 2 },
    { x: bHalf + thick / 2, z: 0, w: thick, d: bHalf * 2 },
  ];
  bData.forEach(({ x, z, w, d }) => {
    const min = new THREE.Vector3(x - w / 2, 0, z - d / 2);
    const max = new THREE.Vector3(x + w / 2, boundaryHeight, z + d / 2);
    boundaryWallData.push({ min, max, isBoundary: true });
  });

  return { walls: [...walls, ...boundaryWallData], buildings };
}

export function checkCollision(pos, walls) {
  const r = 0.4;
  for (const w of walls) {
    const px = pos.x, pz = pos.z;
    if (px + r > w.min.x && px - r < w.max.x && pz + r > w.min.z && pz - r < w.max.z) {
      if (pos.y < w.max.y) {
        return w;
      }
    }
  }
  return null;
}

export function resolveCollision(pos, prev, walls) {
  for (const w of walls) {
    const r = 0.4;
    if (pos.x + r > w.min.x && pos.x - r < w.max.x &&
        pos.z + r > w.min.z && pos.z - r < w.max.z &&
        pos.y < w.max.y) {
      const dx = pos.x - prev.x;
      const dz = pos.z - prev.z;
      if (dx !== 0) {
        const nx = dx > 0 ? w.max.x - r : w.min.x + r;
        pos.x = nx;
      }
      if (dz !== 0) {
        const nz = dz > 0 ? w.max.z - r : w.min.z + r;
        pos.z = nz;
      }
      return true;
    }
  }
  return false;
}
