import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/UnrealBloomPass.js';

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9bb3cf);
scene.fog = new THREE.Fog(0xc0d3e5, 18, 60);

const renderer = new THREE.WebGLRenderer({
  antialias: !isMobile,
  powerPreference: isMobile ? 'low-power' : 'high-performance',
  alpha: false,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = !isMobile;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = isMobile ? 1.0 : 1.2;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(12, 8.5, 14);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = isMobile ? 0.08 : 0.05;
controls.target.set(0, 2.5, 0);
controls.maxPolarAngle = Math.PI * 0.48;
controls.minDistance = 8;
controls.maxDistance = 28;
controls.enablePan = false;
controls.autoRotate = isMobile;
controls.autoRotateSpeed = 0.8;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  isMobile ? 0.75 : 1.2,
  isMobile ? 0.35 : 0.6,
  isMobile ? 0.25 : 0.22
);
bloomPass.threshold = isMobile ? 0.12 : 0.08;
bloomPass.strength = isMobile ? 0.7 : 1.1;
bloomPass.radius = isMobile ? 0.38 : 0.55;
composer.addPass(bloomPass);

const hemi = new THREE.HemisphereLight(0xe9f2ff, 0x312d28, isMobile ? 1.2 : 1.5);
scene.add(hemi);

const sunLight = new THREE.DirectionalLight(0xfff3d1, isMobile ? 1.9 : 2.5);
sunLight.position.set(-18, 23, 7);
sunLight.castShadow = !isMobile;
sunLight.shadow.mapSize.set(isMobile ? 1024 : 2048, isMobile ? 1024 : 2048);
sunLight.shadow.camera.left = -28;
sunLight.shadow.camera.right = 28;
sunLight.shadow.camera.top = 28;
sunLight.shadow.camera.bottom = -28;
sunLight.shadow.camera.near = 0.1;
sunLight.shadow.camera.far = 80;
sunLight.shadow.bias = -0.0002;
scene.add(sunLight);

const fillLight = new THREE.DirectionalLight(0x8bb8ff, isMobile ? 0.5 : 0.75);
fillLight.position.set(14, 11, -12);
scene.add(fillLight);

const groundTexture = makeGroundTexture();
const groundMaterial = new THREE.MeshStandardMaterial({
  map: groundTexture,
  color: 0x7e8f63,
  roughness: 0.95,
  metalness: 0.04,
  envMapIntensity: 0.75,
});

const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120, isMobile ? 36 : 120, isMobile ? 36 : 120), groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = !isMobile;
scene.add(ground);

const groundPos = ground.geometry.attributes.position;
for (let i = 0; i < groundPos.count; i++) {
  const x = groundPos.getX(i);
  const y = groundPos.getY(i);
  const h = Math.sin(x * 0.55) * 0.16 + Math.cos(y * 0.75) * 0.22;
  groundPos.setZ(i, h);
}
groundPos.needsUpdate = true;
ground.geometry.computeVertexNormals();

const pathMat = new THREE.MeshStandardMaterial({
  map: makePathTexture(),
  color: 0xa5967a,
  roughness: 1,
  metalness: 0,
});
const path = new THREE.Mesh(new THREE.BoxGeometry(8, 0.08, 18), pathMat);
path.position.set(0, 0.04, 0);
path.receiveShadow = !isMobile;
scene.add(path);

function makeGroundTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#6f8a57';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 1800; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = Math.random() * 10 + 3;
    const green = 120 + Math.random() * 50;
    ctx.fillStyle = `rgba(${50 + Math.random() * 30}, ${green}, ${40 + Math.random() * 30}, 0.7)`;
    ctx.fillRect(x, y, size, size);
  }

  for (let i = 0; i < 900; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const r = Math.random() * 5 + 2;
    ctx.beginPath();
    ctx.fillStyle = 'rgba(90,110,70,0.25)';
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

function makePathTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#b8a481';
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 5000; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const alpha = Math.random() * 0.22;
    ctx.fillStyle = `rgba(108, 94, 75, ${alpha})`;
    ctx.fillRect(x, y, 2, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 1);
  return tex;
}

const stoneCount = isMobile ? 18 : 40;
const stoneGeo = new THREE.DodecahedronGeometry(0.45, 0);
const stoneMat = new THREE.MeshStandardMaterial({
  color: 0x7a7a7b,
  roughness: 1,
  metalness: 0,
});

for (let i = 0; i < stoneCount; i++) {
  const stone = new THREE.Mesh(stoneGeo, stoneMat);
  stone.position.set((Math.random() - 0.5) * 18, 0.18 + Math.random() * 0.4, (Math.random() - 0.5) * 18);
  stone.scale.setScalar(0.8 + Math.random() * 1.6);
  stone.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  stone.castShadow = !isMobile;
  stone.receiveShadow = !isMobile;
  scene.add(stone);
}

const grassCount = isMobile ? 900 : 2400;
const grassGeo = new THREE.ConeGeometry(0.025, 0.7, 5, 1, false);
const grassMat = new THREE.MeshStandardMaterial({
  color: 0x5e9054,
  roughness: 1,
  metalness: 0,
});
const grassMesh = new THREE.InstancedMesh(grassGeo, grassMat, grassCount);
const tempMatrix = new THREE.Matrix4();
const tempQuaternion = new THREE.Quaternion();
const tempScale = new THREE.Vector3();
const tempPosition = new THREE.Vector3();

for (let i = 0; i < grassCount; i++) {
  const radius = 14 + Math.random() * 26;
  const ang = Math.random() * Math.PI * 2;
  const x = Math.cos(ang) * radius + (Math.random() - 0.5) * 4;
  const z = Math.sin(ang) * radius + (Math.random() - 0.5) * 4;
  const y = 0.08 + Math.random() * 0.12;
  tempPosition.set(x, y, z);
  tempQuaternion.setFromEuler(new THREE.Euler((Math.random() - 0.5) * 0.7, Math.random() * Math.PI, (Math.random() - 0.5) * 0.8));
  tempScale.set(1, 0.7 + Math.random() * 0.9, 1);
  tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
  grassMesh.setMatrixAt(i, tempMatrix);
}
scene.add(grassMesh);

function createTree(x, z, scale = 1) {
  const tree = new THREE.Group();

  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x6e4d35,
    roughness: 0.95,
  });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, 2.6, 9), trunkMat);
  trunk.position.y = 1.3;
  trunk.castShadow = !isMobile;
  trunk.receiveShadow = !isMobile;
  tree.add(trunk);

  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x3d7e4f,
    roughness: 1,
    metalness: 0,
  });

  const leafCount = isMobile ? 5 : 9;
  const leafSegments = isMobile ? 8 : 12;
  for (let i = 0; i < leafCount; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.85 + Math.random() * 0.5, leafSegments, leafSegments), leafMat);
    leaf.position.set((Math.random() - 0.5) * 1.8, 2.6 + Math.random() * 1.5, (Math.random() - 0.5) * 1.8);
    leaf.scale.set(1.1, 0.9 + Math.random() * 0.5, 1.1);
    leaf.castShadow = !isMobile;
    leaf.receiveShadow = !isMobile;
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
].slice(0, isMobile ? 8 : 14);

treePositions.forEach(([x, z, scale]) => createTree(x, z, scale));

const sunTex = makeSunTexture();
const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({
  map: sunTex,
  color: 0xfff1b5,
  transparent: true,
  blending: THREE.AdditiveBlending,
  opacity: 0.9,
  depthWrite: false,
}));
sunSprite.position.set(-18, 22, 6);
sunSprite.scale.set(10, 10, 1);
scene.add(sunSprite);

const rayCount = isMobile ? 4 : 9;
for (let i = 0; i < rayCount; i++) {
  const ray = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeRayTexture(),
    color: 0xffdca8,
    transparent: true,
    opacity: isMobile ? 0.18 : 0.26,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  ray.position.set(-16 + i * 2.5, 17 + Math.random() * 4, 8 + Math.random() * 7);
  ray.scale.set(12 + Math.random() * 7, 18 + Math.random() * 12, 1);
  scene.add(ray);
}

const mist = new THREE.Mesh(
  new THREE.SphereGeometry(20, isMobile ? 14 : 24, isMobile ? 14 : 24),
  new THREE.MeshBasicMaterial({
    color: 0xdbe7f7,
    transparent: true,
    opacity: 0.1,
    side: THREE.BackSide,
    depthWrite: false,
  })
);
mist.position.set(0, 8, 0);
scene.add(mist);

const cloudGroup = new THREE.Group();
const cloudCount = isMobile ? 3 : 6;
for (let i = 0; i < cloudCount; i++) {
  const cloud = new THREE.Mesh(
    new THREE.SphereGeometry(2 + Math.random() * 2.2, isMobile ? 8 : 18, isMobile ? 8 : 18),
    new THREE.MeshStandardMaterial({
      color: 0xf5f8ff,
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

function makeSunTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 10, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.2, 'rgba(255,244,190,1)');
  g.addColorStop(0.5, 'rgba(255,206,96,0.6)');
  g.addColorStop(1, 'rgba(255,180,80,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeRayTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const g = ctx.createLinearGradient(64, 0, 64, 256);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.2, 'rgba(255,255,255,0.2)');
  g.addColorStop(0.5, 'rgba(255,220,120,0.72)');
  g.addColorStop(1, 'rgba(255,180,60,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 256);
  const mask = ctx.createRadialGradient(64, 48, 8, 64, 48, 90);
  mask.addColorStop(0, 'rgba(255,255,255,1)');
  mask.addColorStop(0.5, 'rgba(255,255,255,0.6)');
  mask.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = mask;
  ctx.fillRect(0, 0, 128, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const clock = new THREE.Clock();
function animate() {
  const t = clock.getElapsedTime();
  const sway = Math.sin(t * 0.45) * 1.3;
  sunLight.position.x = -18 + sway;
  sunLight.position.z = 7 + Math.cos(t * 0.3) * 1.8;
  sunSprite.position.set(sunLight.position.x, sunLight.position.y, sunLight.position.z);

  cloudGroup.children.forEach((cloud, index) => {
    cloud.position.x += Math.sin(t * 0.18 + index) * 0.0025;
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

if (isMobile) {
  renderer.shadowMap.autoUpdate = false;
  setTimeout(() => {
    renderer.shadowMap.needsUpdate = true;
  }, 50);
}
