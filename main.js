import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/UnrealBloomPass.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8da9c8);
scene.fog = new THREE.Fog(0xb7c8d6, 18, 65);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(12, 8.5, 14);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 2.6, 0);
controls.maxPolarAngle = Math.PI * 0.48;
controls.minDistance = 8;
controls.maxDistance = 28;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.2, 0.6, 0.22);
bloomPass.threshold = 0.08;
bloomPass.strength = 1.1;
bloomPass.radius = 0.55;
composer.addPass(bloomPass);

const ambient = new THREE.HemisphereLight(0xdfeaff, 0x2d2a22, 1.5);
scene.add(ambient);

const sunLight = new THREE.DirectionalLight(0xfff2d0, 2.6);
sunLight.position.set(-18, 23, 7);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.left = -25;
sunLight.shadow.camera.right = 25;
sunLight.shadow.camera.top = 25;
sunLight.shadow.camera.bottom = -25;
sunLight.shadow.camera.near = 0.1;
sunLight.shadow.camera.far = 80;
sunLight.shadow.bias = -0.00015;
scene.add(sunLight);

const fillLight = new THREE.DirectionalLight(0x8bb7ff, 0.75);
fillLight.position.set(14, 10, -12);
scene.add(fillLight);

const groundGeo = new THREE.PlaneGeometry(120, 120, 128, 128);
const groundMat = new THREE.MeshStandardMaterial({
  color: 0x7d8b64,
  roughness: 0.95,
  metalness: 0.04,
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const pos = groundGeo.attributes.position;
for (let i = 0; i < pos.count; i++) {
  const x = pos.getX(i);
  const y = pos.getY(i);
  const wave = Math.sin(x * 0.6) * 0.18 + Math.cos(y * 0.7) * 0.22;
  pos.setZ(i, wave);
}
pos.needsUpdate = true;
groundGeo.computeVertexNormals();

const pathMat = new THREE.MeshStandardMaterial({
  color: 0x9b907a,
  roughness: 1,
  metalness: 0,
});
const path = new THREE.Mesh(new THREE.BoxGeometry(8, 0.08, 18), pathMat);
path.position.set(0, 0.04, 0);
path.receiveShadow = true;
scene.add(path);

const stoneGeo = new THREE.DodecahedronGeometry(0.4, 0);
const stoneMat = new THREE.MeshStandardMaterial({
  color: 0x7d7c7b,
  roughness: 1,
  metalness: 0,
});

for (let i = 0; i < 55; i++) {
  const s = new THREE.Mesh(stoneGeo, stoneMat);
  s.position.set((Math.random() - 0.5) * 18, 0.15 + Math.random() * 0.4, (Math.random() - 0.5) * 18);
  s.scale.setScalar(0.8 + Math.random() * 1.8);
  s.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  s.castShadow = true;
  s.receiveShadow = true;
  scene.add(s);
}

function createGrassPatch(count = 2600) {
  const bladeGeo = new THREE.ConeGeometry(0.03, 0.7, 5, 1, false);
  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0x5b8d45,
    roughness: 1,
    metalness: 0,
  });

  const grass = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    const radius = 14 + Math.random() * 27;
    const angle = Math.random() * Math.PI * 2;
    const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 4;
    const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 4;
    const y = 0.08 + Math.random() * 0.1;

    blade.position.set(x, y, z);
    blade.rotation.z = (Math.random() - 0.5) * 0.8;
    blade.rotation.x = (Math.random() - 0.5) * 0.7;
    blade.rotation.y = Math.random() * Math.PI;
    blade.scale.y = 0.6 + Math.random() * 0.9;
    blade.castShadow = true;
    blade.receiveShadow = true;
    grass.add(blade);
  }
  return grass;
}

const grass = createGrassPatch(2600);
scene.add(grass);

function createTree(x, z, scale = 1) {
  const tree = new THREE.Group();

  const trunkGeo = new THREE.CylinderGeometry(0.28, 0.42, 2.6, 10);
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x6f4f34,
    roughness: 0.95,
  });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 1.3;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  tree.add(trunk);

  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x3f7a4d,
    roughness: 1,
    metalness: 0,
  });

  for (let i = 0; i < 9; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.8 + Math.random() * 0.55, 12, 12), leafMat);
    leaf.position.set(
      (Math.random() - 0.5) * 1.8,
      2.6 + Math.random() * 1.5,
      (Math.random() - 0.5) * 1.8,
    );
    leaf.scale.set(1.1, 0.9 + Math.random() * 0.5, 1.1);
    leaf.castShadow = true;
    leaf.receiveShadow = true;
    tree.add(leaf);
  }

  tree.position.set(x, 0, z);
  tree.scale.setScalar(scale);
  scene.add(tree);
}

const treePositions = [
  [-6, -8, 1.1], [-10, 11, 0.9], [9, -10, 1.4], [13, 7, 1.15], [-14, 3, 1.2],
  [5, 13, 0.95], [-2, 16, 1.2], [18, 1, 1.2], [-18, -2, 0.85], [0, -18, 1.05],
  [18, -15, 1.05], [7, -22, 0.8], [-20, 20, 0.9], [22, 18, 1.0],
];

treePositions.forEach(([x, z, scale]) => createTree(x, z, scale));

const sunSpriteTexture = createRadialGradientTexture();
const sunSpriteMat = new THREE.SpriteMaterial({
  map: sunSpriteTexture,
  color: 0xfff1b1,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  opacity: 0.9,
});

const sunSprite = new THREE.Sprite(sunSpriteMat);
sunSprite.position.set(-18, 22, 6);
sunSprite.scale.set(9, 9, 1);
scene.add(sunSprite);

for (let i = 0; i < 9; i++) {
  const beam = new THREE.Sprite(new THREE.SpriteMaterial({
    map: createRayTexture(),
    color: 0xffdca8,
    transparent: true,
    opacity: 0.26,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  beam.position.set(-16 + i * 2.3, 17 + Math.random() * 4, 8 + Math.random() * 7);
  beam.scale.set(12 + Math.random() * 7, 18 + Math.random() * 12, 1);
  scene.add(beam);
}

const mist = new THREE.Mesh(
  new THREE.SphereGeometry(20, 24, 24),
  new THREE.MeshBasicMaterial({
    color: 0xcad8ef,
    transparent: true,
    opacity: 0.08,
    side: THREE.BackSide,
    depthWrite: false,
  })
);
mist.position.set(0, 8, 0);
scene.add(mist);

const cloudGroup = new THREE.Group();
for (let i = 0; i < 6; i++) {
  const cloud = new THREE.Mesh(
    new THREE.SphereGeometry(2 + Math.random() * 2.2, 18, 18),
    new THREE.MeshStandardMaterial({
      color: 0xf4f7ff,
      roughness: 1,
      metalness: 0,
      transparent: true,
      opacity: 0.18,
    })
  );
  cloud.scale.set(2.8, 1.0, 1.8);
  cloud.position.set(-18 + i * 9, 12 + Math.random() * 3, -10 + Math.random() * 18);
  cloudGroup.add(cloud);
}
scene.add(cloudGroup);

function createRadialGradientTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(128, 128, 12, 128, 128, 128);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.2, 'rgba(255,240,180,1)');
  gradient.addColorStop(0.5, 'rgba(255,210,90,0.55)');
  gradient.addColorStop(1, 'rgba(255,180,80,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createRayTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const grd = ctx.createLinearGradient(128, 0, 128, 512);
  grd.addColorStop(0, 'rgba(255,255,255,0)');
  grd.addColorStop(0.2, 'rgba(255,255,255,0.2)');
  grd.addColorStop(0.5, 'rgba(255,220,120,0.72)');
  grd.addColorStop(1, 'rgba(255,180,60,0)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 256, 512);
  const mask = ctx.createRadialGradient(128, 96, 10, 128, 96, 190);
  mask.addColorStop(0, 'rgba(255,255,255,1)');
  mask.addColorStop(0.5, 'rgba(255,255,255,0.6)');
  mask.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = mask;
  ctx.fillRect(0, 0, 256, 512);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const clock = new THREE.Clock();
function animate() {
  const t = clock.getElapsedTime();
  sunLight.position.x = -18 + Math.sin(t * 0.2) * 2;
  sunLight.position.z = 7 + Math.cos(t * 0.18) * 1.6;
  sunSprite.position.x = sunLight.position.x;
  sunSprite.position.z = sunLight.position.z;
  sunSprite.position.y = sunLight.position.y;
  cloudGroup.children.forEach((cloud, index) => {
    cloud.position.x += Math.sin(t * 0.15 + index) * 0.003;
  });

  controls.update();
  composer.render();
  requestAnimationFrame(animate);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});
