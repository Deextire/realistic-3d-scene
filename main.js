import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/UnrealBloomPass.js';

// ============================================================================
// Device Detection & Graphics Settings
// ============================================================================

const deviceDetection = {
  isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768,
  isTablet: /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent),
  isHighEnd: false,
  isMidRange: false,
  isLowEnd: false,
  gpuTier: 'unknown',
  recommendedQuality: 'medium',
};

function detectDeviceCapabilities() {
  const deviceMemory = navigator.deviceMemory || 8;
  const cores = navigator.hardwareConcurrency || 4;
  const isAppleDevice = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
  
  const pixelRatio = window.devicePixelRatio || 1;
  
  if (deviceMemory >= 8 && cores >= 6 && pixelRatio >= 2) {
    deviceDetection.isHighEnd = true;
    deviceDetection.gpuTier = 'high';
    deviceDetection.recommendedQuality = deviceDetection.isMobile ? 'high' : 'ultra';
  } else if (deviceMemory >= 4 && cores >= 4) {
    deviceDetection.isMidRange = true;
    deviceDetection.gpuTier = 'medium';
    deviceDetection.recommendedQuality = 'medium';
  } else {
    deviceDetection.isLowEnd = true;
    deviceDetection.gpuTier = 'low';
    deviceDetection.recommendedQuality = 'low';
  }
}

const graphicsPresets = {
  ultra: {
    resolution: 2,
    shadowMapSize: 2048,
    shadowsEnabled: true,
    groundSegments: 128,
    grassCount: 2600,
    treeCount: 14,
    stoneCount: 55,
    rayCount: 9,
    cloudCount: 6,
    cloudSegments: 18,
    mistSegments: 24,
    bloomThreshold: 0.08,
    bloomStrength: 1.1,
    bloomRadius: 0.55,
    antialias: true,
    fogDensity: 'medium',
    useInstancedGrass: true,
    textureQuality: 512,
  },
  high: {
    resolution: 1.5,
    shadowMapSize: 1024,
    shadowsEnabled: true,
    groundSegments: 96,
    grassCount: 1800,
    treeCount: 12,
    stoneCount: 40,
    rayCount: 7,
    cloudCount: 5,
    cloudSegments: 14,
    mistSegments: 18,
    bloomThreshold: 0.1,
    bloomStrength: 0.9,
    bloomRadius: 0.45,
    antialias: true,
    fogDensity: 'medium',
    useInstancedGrass: true,
    textureQuality: 256,
  },
  medium: {
    resolution: 1,
    shadowMapSize: 1024,
    shadowsEnabled: true,
    groundSegments: 64,
    grassCount: 1000,
    treeCount: 8,
    stoneCount: 25,
    rayCount: 5,
    cloudCount: 3,
    cloudSegments: 10,
    mistSegments: 14,
    bloomThreshold: 0.12,
    bloomStrength: 0.6,
    bloomRadius: 0.35,
    antialias: false,
    fogDensity: 'dense',
    useInstancedGrass: true,
    textureQuality: 256,
  },
  low: {
    resolution: 0.75,
    shadowMapSize: 512,
    shadowsEnabled: false,
    groundSegments: 32,
    grassCount: 500,
    treeCount: 5,
    stoneCount: 15,
    rayCount: 3,
    cloudCount: 2,
    cloudSegments: 8,
    mistSegments: 10,
    bloomThreshold: 0.15,
    bloomStrength: 0.4,
    bloomRadius: 0.25,
    antialias: false,
    fogDensity: 'dense',
    useInstancedGrass: true,
    textureQuality: 128,
  },
  minimum: {
    resolution: 0.5,
    shadowMapSize: 256,
    shadowsEnabled: false,
    groundSegments: 16,
    grassCount: 200,
    treeCount: 3,
    stoneCount: 8,
    rayCount: 1,
    cloudCount: 1,
    cloudSegments: 6,
    mistSegments: 8,
    bloomThreshold: 0.2,
    bloomStrength: 0.2,
    bloomRadius: 0.15,
    antialias: false,
    fogDensity: 'dense',
    useInstancedGrass: false,
    textureQuality: 128,
  },
};

let currentGraphicsQuality = deviceDetection.recommendedQuality;
let graphicsSettings = { ...graphicsPresets[currentGraphicsQuality] };

detectDeviceCapabilities();

// ============================================================================
// Time & Cycle System
// ============================================================================

const timeSystem = {
  mode: 'simulated', // 'simulated' | 'realtime'
  paused: false,
  simulatedMinutes: 12 * 60, // noon
  timeMultiplier: 1,
  latitude: 0,
  longitude: 0,
  timezone: 0,
  locationName: 'Unknown',
};

let geolocationLoaded = false;
let geolocationError = false;

function requestGeolocation() {
  if (!navigator.geolocation) {
    console.warn('Geolocation not available');
    geolocationError = true;
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      timeSystem.latitude = position.coords.latitude;
      timeSystem.longitude = position.coords.longitude;
      geolocationLoaded = true;
      updateLocationName();
    },
    (error) => {
      console.warn('Geolocation error:', error);
      geolocationError = true;
    },
    { timeout: 5000 }
  );
}

function updateLocationName() {
  const lat = timeSystem.latitude.toFixed(2);
  const lon = timeSystem.longitude.toFixed(2);
  timeSystem.locationName = `${lat}°, ${lon}°`;
}

function calculateSunAngle(minutesFromMidnight, latitude) {
  const dayOfYear = new Date().getDay();
  const normalized = (minutesFromMidnight / 1440) * Math.PI * 2;
  const solarDeclination = Math.sin(((dayOfYear - 80) / 365) * Math.PI * 2) * 0.409;
  const hourAngle = ((minutesFromMidnight / 1440) * 2 * Math.PI) - Math.PI;
  
  const latRad = (latitude * Math.PI) / 180;
  const sinElevation = 
    Math.sin(latRad) * Math.sin(solarDeclination) +
    Math.cos(latRad) * Math.cos(solarDeclination) * Math.cos(hourAngle);
  
  const elevation = Math.asin(Math.max(-1, Math.min(1, sinElevation)));
  return elevation;
}

function updateTimeDisplay() {
  const hours = Math.floor(timeSystem.simulatedMinutes / 60);
  const minutes = Math.floor(timeSystem.simulatedMinutes % 60);
  const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  const timeDisplay = document.getElementById('timeDisplay');
  if (timeDisplay) timeDisplay.textContent = timeStr;
}

// ============================================================================
// Scene Setup
// ============================================================================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9bb3cf);
scene.fog = new THREE.Fog(0xc0d3e5, 18, 60);

const renderer = new THREE.WebGLRenderer({
  antialias: graphicsSettings.antialias,
  powerPreference: deviceDetection.isMobile ? 'low-power' : 'high-performance',
  alpha: false,
  precision: deviceDetection.isMobile ? 'mediump' : 'highp',
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.max(0.5, Math.min(window.devicePixelRatio, graphicsSettings.resolution)));
renderer.shadowMap.enabled = graphicsSettings.shadowsEnabled;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(12, 8.5, 14);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = deviceDetection.isMobile ? 0.08 : 0.05;
controls.target.set(0, 2.5, 0);
controls.maxPolarAngle = Math.PI * 0.48;
controls.minDistance = 8;
controls.maxDistance = 28;
controls.enablePan = false;
controls.autoRotate = deviceDetection.isMobile;
controls.autoRotateSpeed = 0.8;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  graphicsSettings.bloomStrength,
  graphicsSettings.bloomRadius,
  graphicsSettings.bloomThreshold
);
bloomPass.threshold = graphicsSettings.bloomThreshold;
bloomPass.strength = graphicsSettings.bloomStrength;
bloomPass.radius = graphicsSettings.bloomRadius;
composer.addPass(bloomPass);

const hemi = new THREE.HemisphereLight(0xe9f2ff, 0x312d28, 1.5);
scene.add(hemi);

const sunLight = new THREE.DirectionalLight(0xfff3d1, 2.5);
sunLight.position.set(-18, 23, 7);
sunLight.castShadow = graphicsSettings.shadowsEnabled;
sunLight.shadow.mapSize.set(graphicsSettings.shadowMapSize, graphicsSettings.shadowMapSize);
sunLight.shadow.camera.left = -28;
sunLight.shadow.camera.right = 28;
sunLight.shadow.camera.top = 28;
sunLight.shadow.camera.bottom = -28;
sunLight.shadow.camera.near = 0.1;
sunLight.shadow.camera.far = 80;
sunLight.shadow.bias = -0.0002;
scene.add(sunLight);

const fillLight = new THREE.DirectionalLight(0x8bb8ff, 0.75);
fillLight.position.set(14, 11, -12);
scene.add(fillLight);

// ============================================================================
// Ground & Environment
// ============================================================================

function makeGroundTexture(size = graphicsSettings.textureQuality) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#6f8a57';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 1200; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const s = Math.random() * 8 + 2;
    const g = 120 + Math.random() * 50;
    ctx.fillStyle = `rgba(${50 + Math.random() * 30}, ${g}, ${40 + Math.random() * 30}, 0.7)`;
    ctx.fillRect(x, y, s, s);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  tex.anisotropy = 8;
  return tex;
}

const groundTexture = makeGroundTexture();
const groundMaterial = new THREE.MeshStandardMaterial({
  map: groundTexture,
  color: 0x7e8f63,
  roughness: 0.95,
  metalness: 0.04,
  envMapIntensity: 0.75,
});

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(120, 120, graphicsSettings.groundSegments, graphicsSettings.groundSegments),
  groundMaterial
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = graphicsSettings.shadowsEnabled;
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
  color: 0xa5967a,
  roughness: 1,
  metalness: 0,
});
const path = new THREE.Mesh(new THREE.BoxGeometry(8, 0.08, 18), pathMat);
path.position.set(0, 0.04, 0);
path.receiveShadow = graphicsSettings.shadowsEnabled;
scene.add(path);

// ============================================================================
// Stones
// ============================================================================

const stoneGeo = new THREE.DodecahedronGeometry(0.45, 0);
const stoneMat = new THREE.MeshStandardMaterial({
  color: 0x7a7a7b,
  roughness: 1,
  metalness: 0,
});

for (let i = 0; i < graphicsSettings.stoneCount; i++) {
  const stone = new THREE.Mesh(stoneGeo, stoneMat);
  stone.position.set((Math.random() - 0.5) * 18, 0.18 + Math.random() * 0.4, (Math.random() - 0.5) * 18);
  stone.scale.setScalar(0.8 + Math.random() * 1.6);
  stone.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  stone.castShadow = graphicsSettings.shadowsEnabled;
  stone.receiveShadow = graphicsSettings.shadowsEnabled;
  scene.add(stone);
}

// ============================================================================
// Grass (Instanced)
// ============================================================================

let grassMesh = null;

if (graphicsSettings.useInstancedGrass) {
  const grassGeo = new THREE.ConeGeometry(0.025, 0.7, 5, 1, false);
  const grassMat = new THREE.MeshStandardMaterial({
    color: 0x5e9054,
    roughness: 1,
    metalness: 0,
  });
  grassMesh = new THREE.InstancedMesh(grassGeo, grassMat, graphicsSettings.grassCount);
  const tempMatrix = new THREE.Matrix4();
  const tempQuaternion = new THREE.Quaternion();
  const tempScale = new THREE.Vector3();
  const tempPosition = new THREE.Vector3();

  for (let i = 0; i < graphicsSettings.grassCount; i++) {
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
}

// ============================================================================
// Trees
// ============================================================================

function createTree(x, z, scale = 1) {
  const tree = new THREE.Group();

  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x6e4d35,
    roughness: 0.95,
  });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, 2.6, 9), trunkMat);
  trunk.position.y = 1.3;
  trunk.castShadow = graphicsSettings.shadowsEnabled;
  trunk.receiveShadow = graphicsSettings.shadowsEnabled;
  tree.add(trunk);

  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x3d7e4f,
    roughness: 1,
    metalness: 0,
  });

  const leafCount = graphicsSettings.treeCount < 6 ? 3 : 5;
  const leafSegments = graphicsSettings.treeCount < 6 ? 6 : 10;
  
  for (let i = 0; i < leafCount; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.85 + Math.random() * 0.5, leafSegments, leafSegments), leafMat);
    leaf.position.set((Math.random() - 0.5) * 1.8, 2.6 + Math.random() * 1.5, (Math.random() - 0.5) * 1.8);
    leaf.scale.set(1.1, 0.9 + Math.random() * 0.5, 1.1);
    leaf.castShadow = graphicsSettings.shadowsEnabled;
    leaf.receiveShadow = graphicsSettings.shadowsEnabled;
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
].slice(0, graphicsSettings.treeCount);

treePositions.forEach(([x, z, scale]) => createTree(x, z, scale));

// ============================================================================
// Sun & Lighting Effects
// ============================================================================

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

const rayGroup = new THREE.Group();
for (let i = 0; i < graphicsSettings.rayCount; i++) {
  const ray = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeRayTexture(),
    color: 0xffdca8,
    transparent: true,
    opacity: 0.26,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  ray.position.set(-16 + i * 2.5, 17 + Math.random() * 4, 8 + Math.random() * 7);
  ray.scale.set(12 + Math.random() * 7, 18 + Math.random() * 12, 1);
  rayGroup.add(ray);
}
scene.add(rayGroup);

const mist = new THREE.Mesh(
  new THREE.SphereGeometry(20, graphicsSettings.mistSegments, graphicsSettings.mistSegments),
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
for (let i = 0; i < graphicsSettings.cloudCount; i++) {
  const cloud = new THREE.Mesh(
    new THREE.SphereGeometry(2 + Math.random() * 2.2, graphicsSettings.cloudSegments, graphicsSettings.cloudSegments),
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

// ============================================================================
// Lighting & Atmosphere
// ============================================================================

function updateDayNightCycle() {
  const minutes = timeSystem.simulatedMinutes;
  const normalizedTime = minutes / 1440;
  
  let daylight = Math.sin((normalizedTime - 0.25) * Math.PI);
  daylight = Math.max(0.05, Math.min(1, daylight));
  
  const sunElevation = calculateSunAngle(minutes, timeSystem.latitude);
  const elevationFactor = Math.max(0.05, Math.sin(Math.max(0, sunElevation)));
  
  if (timeSystem.mode === 'realtime') {
    daylight = elevationFactor;
  }
  
  // Update lighting
  sunLight.intensity = 0.2 + daylight * 2.3;
  hemi.intensity = 0.3 + daylight * 1.2;
  renderer.toneMappingExposure = 0.8 + daylight * 0.8;
  
  // Update colors
  const dayColor = new THREE.Color(0xc0d3e5);
  const nightColor = new THREE.Color(0x1a1a2e);
  const fogColor = new THREE.Color().lerpColors(nightColor, dayColor, daylight);
  
  scene.fog.color.copy(fogColor);
  scene.background.copy(fogColor);
  
  // Update sun position
  const sunAngle = normalizedTime * Math.PI * 2;
  sunLight.position.x = -18 + Math.sin(sunAngle) * 20;
  sunLight.position.y = 15 + Math.cos(sunAngle + Math.PI / 4) * 15;
  sunLight.position.z = 7 + Math.cos(sunAngle) * 10;
  
  sunSprite.position.copy(sunLight.position);
  sunSprite.position.y = Math.max(3, sunLight.position.y);
  
  // Update ray visibility
  rayGroup.children.forEach((ray, idx) => {
    ray.material.opacity = daylight > 0.3 ? 0.26 * daylight : 0;
  });
  
  // Update bloom
  bloomPass.strength = graphicsSettings.bloomStrength * (0.5 + daylight * 0.5);
}

// ============================================================================
// Animation Loop
// ============================================================================

const clock = new THREE.Clock();

function animate() {
  const dt = clock.getDelta();
  
  // Update time
  if (!timeSystem.paused) {
    if (timeSystem.mode === 'simulated') {
      const minutesPerSecond = (24 * 60) / (20 * 60);
      timeSystem.simulatedMinutes += dt * minutesPerSecond * timeSystem.timeMultiplier;
      if (timeSystem.simulatedMinutes >= 24 * 60) timeSystem.simulatedMinutes -= 24 * 60;
    } else {
      const now = new Date();
      const minutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
      timeSystem.simulatedMinutes = minutes;
    }
  }
  
  updateTimeDisplay();
  updateDayNightCycle();
  
  // Update clouds
  cloudGroup.children.forEach((cloud, index) => {
    cloud.position.x += Math.sin(clock.getElapsedTime() * 0.18 + index) * 0.0025;
  });
  
  controls.update();
  composer.render();
  requestAnimationFrame(animate);
}

animate();

// ============================================================================
// UI Controls
// ============================================================================

document.querySelectorAll('input[name="cycle-mode"]').forEach((radio) => {
  radio.addEventListener('change', (e) => {
    timeSystem.mode = e.target.value;
    if (e.target.value === 'realtime' && !geolocationLoaded) {
      requestGeolocation();
    }
  });
});

document.getElementById('pauseBtn')?.addEventListener('click', () => {
  timeSystem.paused = !timeSystem.paused;
  const btn = document.getElementById('pauseBtn');
  if (btn) btn.textContent = timeSystem.paused ? '▶ Resume' : '⏸ Pause';
});

document.getElementById('resetBtn')?.addEventListener('click', () => {
  if (timeSystem.mode === 'simulated') {
    timeSystem.simulatedMinutes = 12 * 60;
  } else {
    const now = new Date();
    timeSystem.simulatedMinutes = now.getHours() * 60 + now.getMinutes();
  }
});

document.getElementById('cameraResetBtn')?.addEventListener('click', () => {
  camera.position.set(12, 8.5, 14);
  controls.target.set(0, 2.5, 0);
  controls.update();
});

document.getElementById('useLocationBtn')?.addEventListener('click', () => {
  requestGeolocation();
});

document.getElementById('timeMultiplier')?.addEventListener('input', (e) => {
  timeSystem.timeMultiplier = parseFloat(e.target.value);
  const value = document.getElementById('multiplierValue');
  if (value) value.textContent = timeSystem.timeMultiplier.toFixed(1) + 'x';
});

document.getElementById('latitude')?.addEventListener('input', (e) => {
  timeSystem.latitude = parseFloat(e.target.value);
  updateLocationName();
  const locDisplay = document.getElementById('locationDisplay');
  if (locDisplay) locDisplay.textContent = timeSystem.locationName;
});

document.getElementById('longitude')?.addEventListener('input', (e) => {
  timeSystem.longitude = parseFloat(e.target.value);
  updateLocationName();
  const locDisplay = document.getElementById('locationDisplay');
  if (locDisplay) locDisplay.textContent = timeSystem.locationName;
});

updateLocationName();
const locDisplay = document.getElementById('locationDisplay');
if (locDisplay) locDisplay.textContent = timeSystem.locationName;

// ============================================================================
// Graphics Settings Panel
// ============================================================================

function createGraphicsPanel() {
  const panel = document.createElement('div');
  panel.id = 'graphicsPanel';
  panel.className = 'graphics-panel';
  panel.innerHTML = `
    <div class="graphics-header">
      <h3>Graphics Settings</h3>
      <button id="closeGraphicsBtn" class="close-btn">✕</button>
    </div>
    <div class="graphics-content">
      <div class="quality-presets">
        <label>Quality Preset:</label>
        <select id="qualitySelect">
          <option value="minimum">Minimum (${deviceDetection.isMobile ? 'Mobile' : 'Very Low'})</option>
          <option value="low">Low</option>
          <option value="medium" ${currentGraphicsQuality === 'medium' ? 'selected' : ''}>Medium (Recommended)</option>
          <option value="high">High</option>
          <option value="ultra" ${currentGraphicsQuality === 'ultra' ? 'selected' : ''}>Ultra</option>
        </select>
        <small>Device: ${deviceDetection.gpuTier.toUpperCase()} - ${deviceDetection.recommendedQuality.toUpperCase()}</small>
      </div>
      
      <div class="graphics-slider">
        <label>Shadow Quality</label>
        <input type="range" id="shadowQuality" min="0" max="3" step="1" value="${graphicsSettings.shadowsEnabled ? '2' : '0'}" />
        <span id="shadowLabel">Enabled</span>
      </div>
      
      <div class="graphics-slider">
        <label>Bloom Strength</label>
        <input type="range" id="bloomSlider" min="0" max="1" step="0.1" value="${graphicsSettings.bloomStrength}" />
        <span id="bloomLabel">${graphicsSettings.bloomStrength.toFixed(1)}</span>
      </div>
      
      <div class="graphics-slider">
        <label>Vegetation Density</label>
        <input type="range" id="vegetationSlider" min="0" max="1" step="0.1" value="1" />
        <span id="vegetationLabel">100%</span>
      </div>
      
      <div class="graphics-slider">
        <label>Shadow Resolution</label>
        <input type="range" id="shadowResSlider" min="0" max="3" step="1" value="${Math.log2(graphicsSettings.shadowMapSize / 256)}" />
        <span id="shadowResLabel">${graphicsSettings.shadowMapSize}x${graphicsSettings.shadowMapSize}</span>
      </div>
      
      <button id="resetGraphicsBtn" class="reset-btn">Reset to Recommended</button>
    </div>
  `;
  
  document.body.appendChild(panel);
  
  document.getElementById('closeGraphicsBtn').addEventListener('click', () => {
    panel.classList.remove('active');
  });
  
  document.getElementById('qualitySelect').addEventListener('change', (e) => {
    applyGraphicsPreset(e.target.value);
  });
  
  document.getElementById('bloomSlider').addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    bloomPass.strength = val;
    document.getElementById('bloomLabel').textContent = val.toFixed(1);
  });
  
  document.getElementById('shadowQuality').addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    const shadowsEnabled = val > 0;
    graphicsSettings.shadowsEnabled = shadowsEnabled;
    sunLight.castShadow = shadowsEnabled;
    renderer.shadowMap.enabled = shadowsEnabled;
    const labels = ['Disabled', 'Low', 'Medium', 'High'];
    document.getElementById('shadowLabel').textContent = labels[val];
  });
  
  document.getElementById('vegetationSlider').addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    const targetCount = Math.floor(graphicsSettings.grassCount * val);
    document.getElementById('vegetationLabel').textContent = Math.floor(val * 100) + '%';
    if (grassMesh) grassMesh.count = targetCount;
  });
  
  document.getElementById('shadowResSlider').addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    const size = Math.pow(2, val + 8);
    graphicsSettings.shadowMapSize = size;
    sunLight.shadow.mapSize.set(size, size);
    document.getElementById('shadowResLabel').textContent = size + 'x' + size;
  });
  
  document.getElementById('resetGraphicsBtn').addEventListener('click', () => {
    applyGraphicsPreset(deviceDetection.recommendedQuality);
    document.getElementById('qualitySelect').value = deviceDetection.recommendedQuality;
  });
}

function applyGraphicsPreset(preset) {
  currentGraphicsQuality = preset;
  graphicsSettings = { ...graphicsPresets[preset] };
  
  renderer.setPixelRatio(Math.max(0.5, Math.min(window.devicePixelRatio, graphicsSettings.resolution)));
  bloomPass.strength = graphicsSettings.bloomStrength;
  bloomPass.threshold = graphicsSettings.bloomThreshold;
  bloomPass.radius = graphicsSettings.bloomRadius;
  sunLight.castShadow = graphicsSettings.shadowsEnabled;
  sunLight.shadow.mapSize.set(graphicsSettings.shadowMapSize, graphicsSettings.shadowMapSize);
  renderer.shadowMap.enabled = graphicsSettings.shadowsEnabled;
  
  document.getElementById('bloomSlider').value = graphicsSettings.bloomStrength;
  document.getElementById('bloomLabel').textContent = graphicsSettings.bloomStrength.toFixed(1);
}

createGraphicsPanel();

// Toggle graphics panel
document.addEventListener('keydown', (e) => {
  if (e.key === 'g' || e.key === 'G') {
    const panel = document.getElementById('graphicsPanel');
    if (panel) panel.classList.toggle('active');
  }
});

// ============================================================================
// Window Events
// ============================================================================

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

if (deviceDetection.isMobile) {
  renderer.shadowMap.autoUpdate = false;
  setTimeout(() => {
    renderer.shadowMap.needsUpdate = true;
  }, 100);
}
