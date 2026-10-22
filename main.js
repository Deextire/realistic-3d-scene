import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/UnrealBloomPass.js';

const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || innerWidth < 768;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const safeNumber = (v, fallback) => Number.isFinite(Number(v)) ? Number(v) : fallback;
const MAX_PIXEL_RATIO = mobile ? 1.25 : 1.75;

const presets = {
  minimum: { pixelRatio: .65, ground: 24, grass: 350, trees: 4, clouds: 1, rays: 0, shadow: 0, bloom: 0, aurora: false },
  low: { pixelRatio: .8, ground: 40, grass: 650, trees: 6, clouds: 2, rays: 2, shadow: 512, bloom: .25, aurora: false },
  medium: { pixelRatio: 1, ground: 64, grass: 1100, trees: 8, clouds: 3, rays: 4, shadow: 1024, bloom: .55, aurora: false },
  high: { pixelRatio: 1.35, ground: 88, grass: 1800, trees: 11, clouds: 5, rays: 6, shadow: 1536, bloom: .8, aurora: false },
  ultra: { pixelRatio: 1.7, ground: 120, grass: 2600, trees: 14, clouds: 6, rays: 9, shadow: 2048, bloom: 1.05, aurora: false },
  cinematic: { pixelRatio: 1.35, ground: 80, grass: 1500, trees: 10, clouds: 4, rays: 8, shadow: 1536, bloom: .95, aurora: false },
  realistic: { pixelRatio: 1.5, ground: 112, grass: 2300, trees: 13, clouds: 6, rays: 7, shadow: 2048, bloom: .75, aurora: false },
};

const memory = navigator.deviceMemory || 4;
const cores = navigator.hardwareConcurrency || 4;
const recommended = mobile || memory < 3 || cores < 4 ? 'low' : memory >= 8 && cores >= 8 ? 'high' : 'medium';

const state = {
  mode: 'simulated',
  paused: false,
  minutes: 720,
  multiplier: 1,
  latitude: 0,
  longitude: 0,
  location: 'Manual location',
  aurora: false,
  dayColor: 0xc0d3e5,
  nightColor: 0x11182f,
  fogColor: 0xc0d3e5,
  demoMode: true,
  wind: 0.8,
};

let quality = { ...presets[recommended] };
let qualityName = recommended;
let lastNonDemoPresetName = recommended;
let animationFrameId = null;
let lastFrameTime = performance.now();
let waterNormalRefreshCounter = 0;
let waterLastSampleTime = 0;

const diagnostics = {
  enabled: false,
  samples: [],
  lastSampleAt: 0,
  minimum: Infinity,
  maximum: 0,
  average: 0,
};

const perfMonitor = {
  enable(force) {
    diagnostics.enabled = force !== undefined ? !!force : true;
    diagnostics.samples = [];
    diagnostics.minimum = Infinity;
    diagnostics.maximum = 0;
    diagnostics.average = 0;
    diagnostics.lastSampleAt = performance.now();
    console.info('[ScenePerf] diagnostics enabled');
  },
  disable() {
    diagnostics.enabled = false;
    console.info('[ScenePerf] diagnostics disabled');
  },
  record(deltaMs) {
    if (!diagnostics.enabled) return;
    diagnostics.samples.push(deltaMs);
    if (diagnostics.samples.length > 90) diagnostics.samples.shift();
    diagnostics.minimum = Math.min(diagnostics.minimum, deltaMs);
    diagnostics.maximum = Math.max(diagnostics.maximum, deltaMs);
    diagnostics.average = diagnostics.samples.reduce((sum, value) => sum + value, 0) / diagnostics.samples.length;
  },
  snapshot() {
    const sampleCount = diagnostics.samples.length || 1;
    const avg = diagnostics.samples.reduce((sum, value) => sum + value, 0) / sampleCount;
    return {
      enabled: diagnostics.enabled,
      sampleCount,
      averageMs: Number(avg.toFixed(2)),
      minMs: Number((Math.min(...diagnostics.samples, Infinity) || 0).toFixed(2)),
      maxMs: Number((Math.max(...diagnostics.samples, 0) || 0).toFixed(2)),
      qualityName,
      demoMode: state.demoMode,
      pixelRatio: renderer ? renderer.getPixelRatio() : quality.pixelRatio,
      shadowMap: quality.shadow,
      bloom: quality.bloom,
      water: { sampleCount: Math.max(1, waterNormalRefreshCounter), lastSampleMs: waterLastSampleTime },
      clouds: quality.clouds,
      rays: quality.rays,
    };
  },
};

window.__scenePerf = {
  enable: () => perfMonitor.enable(true),
  disable: () => perfMonitor.disable(),
  getSummary: () => perfMonitor.snapshot(),
  setEnabled: (enabled) => perfMonitor.enable(enabled),
};

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: !mobile, powerPreference: 'high-performance' });
} catch (error) {
  document.body.innerHTML = '<main style="padding:2rem;color:white;background:#101522;font-family:sans-serif"><h1>WebGL tidak tersedia</h1><p>Gunakan browser modern dan aktifkan akselerasi grafis.</p></main>';
  throw error;
}

const scene = new THREE.Scene();
const daySky = new THREE.Color(state.dayColor);
const nightSky = new THREE.Color(state.nightColor);
const currentSky = new THREE.Color();
scene.fog = new THREE.Fog(state.fogColor, 20, 70);

renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, quality.pixelRatio, MAX_PIXEL_RATIO));
renderer.shadowMap.enabled = quality.shadow > 0;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, .1, 220);
camera.position.set(12, 8.5, 14);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 2.5, 0);
controls.enableDamping = true;
controls.dampingFactor = mobile ? .11 : .075;
controls.minDistance = 6;
controls.maxDistance = 32;
controls.maxPolarAngle = Math.PI * .48;
controls.enablePan = false;
controls.zoomSpeed = mobile ? .55 : .8;
controls.rotateSpeed = mobile ? .42 : .7;
controls.autoRotate = mobile && !reducedMotion;
controls.autoRotateSpeed = .35;
if ('zoomToCursor' in controls) controls.zoomToCursor = true;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), quality.bloom, .45, .12);
composer.addPass(bloom);

const hemi = new THREE.HemisphereLight(0xe9f2ff, 0x29251f, 1.4);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0ca, 2.5);
sun.castShadow = quality.shadow > 0;
sun.shadow.mapSize.set(quality.shadow || 512, quality.shadow || 512);
sun.shadow.camera.left = -28; sun.shadow.camera.right = 28;
sun.shadow.camera.top = 28; sun.shadow.camera.bottom = -28;
sun.shadow.camera.far = 80;
scene.add(sun);
const fill = new THREE.DirectionalLight(0x719bdb, .65);
fill.position.set(14, 10, -12); scene.add(fill);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(120, 120, quality.ground, quality.ground),
  new THREE.MeshStandardMaterial({ color: 0x71885a, roughness: 1 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = quality.shadow > 0;
scene.add(ground);
const gp = ground.geometry.attributes.position;
for (let i = 0; i < gp.count; i++) {
  gp.setZ(i, Math.sin(gp.getX(i) * .55) * .16 + Math.cos(gp.getY(i) * .7) * .2);
}
gp.needsUpdate = true;
ground.geometry.computeVertexNormals();

const path = new THREE.Mesh(new THREE.BoxGeometry(8, .08, 18), new THREE.MeshStandardMaterial({ color: 0xa39579, roughness: 1 }));
path.position.y = .04; path.receiveShadow = quality.shadow > 0; scene.add(path);

const stoneGeo = new THREE.DodecahedronGeometry(.42, 0);
const stoneMat = new THREE.MeshStandardMaterial({ color: 0x777778, roughness: 1 });
for (let i = 0; i < Math.max(8, Math.floor(quality.grass / 30)); i++) {
  const stone = new THREE.Mesh(stoneGeo, stoneMat);
  stone.position.set((Math.random() - .5) * 20, .2 + Math.random() * .3, (Math.random() - .5) * 20);
  stone.scale.setScalar(.7 + Math.random() * 1.5); stone.rotation.y = Math.random() * 6;
  stone.castShadow = stone.receiveShadow = quality.shadow > 0; scene.add(stone);
}

const grass = new THREE.InstancedMesh(new THREE.ConeGeometry(.028, .7, 5), new THREE.MeshStandardMaterial({ color: 0x5b8d45, roughness: 1 }), quality.grass);
const matrix = new THREE.Matrix4();
const position = new THREE.Vector3();
const scale = new THREE.Vector3();
const quaternion = new THREE.Quaternion();
for (let i = 0; i < quality.grass; i++) {
  const radius = 12 + Math.random() * 31; const angle = Math.random() * Math.PI * 2;
  position.set(Math.cos(angle) * radius + (Math.random() - .5) * 4, .08, Math.sin(angle) * radius + (Math.random() - .5) * 4);
  quaternion.setFromEuler(new THREE.Euler((Math.random() - .5) * .6, Math.random() * 6.28, (Math.random() - .5) * .6));
  scale.set(1, .6 + Math.random() * 1.1, 1); matrix.compose(position, quaternion, scale); grass.setMatrixAt(i, matrix);
}
grass.castShadow = grass.receiveShadow = quality.shadow > 0; scene.add(grass);

const trees = new THREE.Group();
const treePositions = [[-6,-8,1.1],[-10,11,.9],[9,-10,1.4],[13,7,1.15],[-14,3,1.2],[5,13,.95],[-2,16,1.2],[18,1,1.2],[-18,-2,.85],[0,-18,1.05],[18,-15,1.05],[7,-22,.8],[-20,20,.9],[22,18,1]];
for (const [x, z, s] of treePositions.slice(0, quality.trees)) {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.28,.42,2.6, mobile ? 7 : 9), new THREE.MeshStandardMaterial({ color: 0x6e4d35, roughness: 1 }));
  trunk.position.y = 1.3; tree.add(trunk);
  const leaves = new THREE.Mesh(new THREE.SphereGeometry(1.25, mobile ? 7 : 11, mobile ? 7 : 11), new THREE.MeshStandardMaterial({ color: 0x3d7e4f, roughness: 1 }));
  leaves.position.y = 3.2; leaves.scale.set(1.3, 1.25, 1.3); tree.add(leaves);
  tree.position.set(x, 0, z); tree.scale.setScalar(s); tree.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = quality.shadow > 0; }); trees.add(tree);
}
scene.add(trees);

function textureRadial() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 4, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.2, 'rgba(255,245,200,1)');
  g.addColorStop(0.7, 'rgba(255,180,80,0.35)');
  g.addColorStop(1, 'rgba(255,180,80,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: textureRadial(), color: 0xfff0ae, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
sunSprite.scale.set(9, 9, 1); scene.add(sunSprite);
const rays = new THREE.Group();
for (let i = 0; i < quality.rays; i++) {
  const r = new THREE.Sprite(new THREE.SpriteMaterial({ map: textureRadial(), color: 0xffd69b, transparent: true, opacity: .12, blending: THREE.AdditiveBlending, depthWrite: false }));
  r.position.set(Math.cos(i) * 4, 1.8 + (i % 3) * .6, Math.sin(i) * 4); r.scale.set(10 + i * 2, 16 + i * 2, 1); rays.add(r);
}
scene.add(rays);

const aurora = new THREE.Group();
for (let i = 0; i < (mobile ? 5 : 12); i++) {
  const material = new THREE.MeshBasicMaterial({ color: i % 2 ? 0x39d9b3 : 0x7659ff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
  const ribbon = new THREE.Mesh(new THREE.PlaneGeometry(3, 9, 8, 12), material);
  ribbon.position.set(-18 + i * 3.2, 14 + Math.random() * 5, -18 + Math.random() * 10); ribbon.rotation.y = (Math.random() - .5) * .5; aurora.add(ribbon);
}
scene.add(aurora);

const water = new THREE.Mesh(
  new THREE.PlaneGeometry(84, 84, 22, 22),
  new THREE.MeshStandardMaterial({
    color: 0x4aa9b5,
    transparent: true,
    opacity: 0.8,
    roughness: 0.35,
    metalness: 0.08,
    emissive: 0x1d404f,
    emissiveIntensity: 0.18,
  })
);
water.rotation.x = -Math.PI / 2;
water.position.y = 0.12;
water.receiveShadow = quality.shadow > 0;
scene.add(water);
const waterBasePositions = water.geometry.attributes.position.array.slice();

const clouds = new THREE.Group();
for (let i = 0; i < 5; i++) {
  const cloud = new THREE.Group();
  const puffMaterial = new THREE.MeshStandardMaterial({ color: 0xdde9ff, transparent: true, opacity: 0.32, roughness: 1 });
  const puffPositions = [
    [-1.2, 0, 0], [0, .2, 0], [1.1, 0, 0], [.2, .4, .4],
  ];
  puffPositions.forEach(([x, y, z]) => {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(1.2, 12, 12), puffMaterial);
    puff.position.set(x, y, z); cloud.add(puff);
  });
  cloud.position.set(-18 + i * 10, 15 + (i % 2) * 2.2, -24 + (i % 3) * 8);
  cloud.scale.setScalar(1 + i * 0.2);
  cloud.userData.offset = i * 1.7;
  cloud.visible = i < quality.clouds;
  clouds.add(cloud);
}
scene.add(clouds);

const dustGeometry = new THREE.BufferGeometry();
const dustPositions = [];
for (let i = 0; i < 180; i++) {
  dustPositions.push((Math.random() - .5) * 70, 2 + Math.random() * 16, (Math.random() - .5) * 70);
}
dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dustPositions, 3));
const dustMaterial = new THREE.PointsMaterial({
  color: 0xe7efff,
  size: .12,
  transparent: true,
  opacity: 0.45,
  depthWrite: false,
});
const dustCloud = new THREE.Points(dustGeometry, dustMaterial);
scene.add(dustCloud);

function setTime(minutes, label = '') {
  state.minutes = ((minutes % 1440) + 1440) % 1440;
  if (label) flashStatus(label);
}

function flashStatus(text) {
  const el = document.getElementById('locationDisplay');
  if (el) el.textContent = text;
}

function getCurrentMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function syncRendererState() {
  const targetPixelRatio = Math.min(devicePixelRatio || 1, quality.pixelRatio, MAX_PIXEL_RATIO);
  renderer.setPixelRatio(targetPixelRatio);

  const shadowsEnabled = quality.shadow > 0;
  renderer.shadowMap.enabled = shadowsEnabled;
  sun.castShadow = shadowsEnabled;
  sun.shadow.mapSize.set(quality.shadow || 512, quality.shadow || 512);
  sun.shadow.needsUpdate = true;

  ground.receiveShadow = shadowsEnabled;
  path.receiveShadow = shadowsEnabled;
  grass.castShadow = grass.receiveShadow = shadowsEnabled;
  trees.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = shadowsEnabled; });

  bloom.strength = quality.bloom;
  bloom.radius = quality.bloom > 0.3 ? 0.45 : 0.2;

  rays.children.forEach((ray, index) => { ray.visible = index < quality.rays; });
  clouds.children.forEach((cloud, index) => { cloud.visible = index < quality.clouds; });
  if (water) {
    water.receiveShadow = shadowsEnabled;
  }

  if (document.getElementById('qualitySelect')) {
    document.getElementById('qualitySelect').value = qualityName;
  }
}

function applyPreset(name) {
  if (!presets[name]) return;
  qualityName = name;
  quality = { ...presets[name] };
  if (!state.demoMode) {
    lastNonDemoPresetName = name;
  }
  syncRendererState();
  refreshGraphicsSettings();
}

function updateWaterAndAtmosphere(timeSeconds) {
  if (!water) return;
  const minDelta = mobile ? 1 / 30 : 1 / 45;
  if (timeSeconds - waterLastSampleTime < minDelta) return;
  waterLastSampleTime = timeSeconds;

  const pos = water.geometry.attributes.position;
  const base = waterBasePositions;
  const amplitude = mobile ? .12 : .16;
  const waveScale = state.demoMode ? 1.35 : 1;
  for (let i = 0; i < pos.count; i++) {
    const index = i * 3;
    const x = base[index];
    const y = base[index + 1];
    const z = base[index + 2];
    const offset = Math.sin((x * .26) + timeSeconds * 1.5) * amplitude + Math.cos((y * .26) - timeSeconds * 1.1) * amplitude * 0.7;
    pos.setZ(i, z + offset * waveScale);
  }
  pos.needsUpdate = true;
  waterNormalRefreshCounter += 1;
  if (waterNormalRefreshCounter % 3 === 0) {
    water.geometry.computeVertexNormals();
  }
}

function updateSky() {
  const timeMinutes = state.mode === 'realtime' && !state.paused ? getCurrentMinutes() : state.minutes;
  if (state.mode === 'realtime' && !state.paused) {
    state.minutes = timeMinutes;
  }

  const daylight = clamp(Math.sin((state.minutes / 1440 - .25) * Math.PI), .04, 1);
  const t = state.minutes / 1440;
  const angle = t * Math.PI * 2;

  currentSky.lerpColors(nightSky, daySky, daylight);
  scene.background.copy(currentSky);
  scene.fog.color.copy(currentSky);

  sun.position.set(-18 + Math.sin(angle) * 20, 15 + Math.cos(angle + Math.PI / 4) * 15, 7 + Math.cos(angle) * 10);
  sun.intensity = .18 + daylight * 2.45;
  hemi.intensity = .25 + daylight * 1.25;
  renderer.toneMappingExposure = .72 + daylight * .9;

  sunSprite.position.copy(sun.position);
  sunSprite.material.opacity = daylight > .08 ? daylight : 0;

  rays.children.forEach(r => { r.material.opacity = daylight > .3 ? .14 * daylight : 0; });
  aurora.visible = state.aurora;
  aurora.children.forEach((r, i) => {
    r.material.opacity = state.aurora && daylight < .35 ? .12 + Math.sin(performance.now() * .001 + i) * .04 : 0;
  });

  bloom.strength = quality.bloom * (.45 + daylight * .55);
  water.material.emissiveIntensity = daylight < .35 ? .22 : .12;
}

function updateClouds(timeSeconds) {
  if (!clouds) return;
  clouds.children.forEach((cloud, index) => {
    const drift = ((timeSeconds * 1.6 * state.wind) + index * 7.5) % 66;
    cloud.position.x = -28 + drift - 20;
    cloud.position.z = -22 + (index % 3) * 8 + Math.sin(timeSeconds * 0.2 + cloud.userData.offset) * 4;
    cloud.position.y = 14 + Math.sin(timeSeconds * 0.4 + index) * 1.4 + (index % 2) * 2;
  });
}

function updateDust(timeSeconds) {
  if (dustCloud) {
    dustCloud.rotation.y = timeSeconds * 0.04;
    dustCloud.material.opacity = state.demoMode ? 0.55 : 0.3;
  }
}

const clock = new THREE.Clock();
function animate(now = performance.now()) {
  const elapsed = Math.min(now - lastFrameTime, 200);
  lastFrameTime = now;
  perfMonitor.record(elapsed);

  if (diagnostics.enabled && now - diagnostics.lastSampleAt > 2000) {
    const summary = perfMonitor.snapshot();
    console.info('[ScenePerf]', summary);
    diagnostics.lastSampleAt = now;
  }

  if (!document.hidden) {
    const dt = elapsed / 1000;
    if (!state.paused && state.mode === 'simulated') {
      state.minutes = (state.minutes + dt * 72 * state.multiplier) % 1440;
    }

    updateSky();
    updateWaterAndAtmosphere(now / 1000);
    updateClouds(now / 1000);
    updateDust(now / 1000);

    document.getElementById('timeDisplay')?.replaceChildren(
      document.createTextNode(`${String(Math.floor(state.minutes / 60)).padStart(2, '0')}:${String(Math.floor(state.minutes % 60)).padStart(2, '0')}`)
    );

    controls.update();
    composer.render();
  }

  animationFrameId = requestAnimationFrame(animate);
}

function updateDemoButton() {
  const demoBtn = document.getElementById('demoModeBtn');
  if (!demoBtn) return;
  demoBtn.classList.toggle('active', state.demoMode);
  demoBtn.textContent = state.demoMode ? '🎬 Demo On' : '🎬 Demo Off';
  demoBtn.title = state.demoMode ? 'Presentation mode enabled' : 'Custom quality mode';
}

function setDemoMode(enabled) {
  state.demoMode = enabled;

  if (state.demoMode) {
    const demoPresetName = mobile ? 'low' : 'medium';
    qualityName = demoPresetName;
    quality = { ...presets[demoPresetName], bloom: Math.min(presets[demoPresetName].bloom, 0.7), aurora: false };
    state.wind = 0.8;
  } else {
    const targetPreset = lastNonDemoPresetName || recommended;
    qualityName = targetPreset;
    quality = { ...presets[targetPreset] };
    state.wind = 1;
  }

  syncRendererState();
  refreshGraphicsSettings();
  updateDemoButton();
}

function bind(id, event, fn) {
  document.getElementById(id)?.addEventListener(event, fn);
}

bind('pauseBtn','click', () => {
  state.paused = !state.paused;
  const b = document.getElementById('pauseBtn');
  if (b) b.textContent = state.paused ? '▶ Resume' : '⏸ Pause';
});

bind('resetBtn','click', () => {
  setTime(state.mode === 'realtime' ? getCurrentMinutes() : 720);
});

bind('cameraResetBtn','click', () => {
  camera.position.set(12, 8.5, 14); controls.target.set(0, 2.5, 0); controls.update();
});

bind('timeMultiplier','input', e => {
  state.multiplier = clamp(safeNumber(e.target.value, 1), .1, 5);
  const el = document.getElementById('multiplierValue');
  if (el) el.textContent = `${state.multiplier.toFixed(1)}x`;
});

bind('qualitySelect','change', e => {
  const targetName = e.target.value;
  if (presets[targetName]) {
    qualityName = targetName;
    lastNonDemoPresetName = targetName;
    quality = { ...presets[targetName] };
    if (!state.demoMode) {
      lastNonDemoPresetName = targetName;
    }
    syncRendererState();
    refreshGraphicsSettings();
  }
});

for (const [id, min, max, key] of [['latitude',-90,90,'latitude'],['longitude',-180,180,'longitude']]) {
  bind(id,'change', e => {
    const v = clamp(safeNumber(e.target.value, 0), min, max);
    state[key] = v; e.target.value = v;
  });
}

bind('useLocationBtn','click', () => navigator.geolocation?.getCurrentPosition(
  p => {
    state.latitude = p.coords.latitude;
    state.longitude = p.coords.longitude;
    state.location = 'GPS location';
    flashStatus('GPS location');
  },
  () => {
    state.location = 'Manual location';
    flashStatus('Manual location');
  }
));

bind('settingsBtn','click', () => document.getElementById('graphicsPanel')?.classList.toggle('active'));
bind('closeGraphicsBtn','click', () => document.getElementById('graphicsPanel')?.classList.remove('active'));
bind('helpBtn','click', () => document.getElementById('tutorialModal')?.classList.add('active'));
bind('closeTutorialBtn','click', () => document.getElementById('tutorialModal')?.classList.remove('active'));
bind('closeTutorialBtnMain','click', () => document.getElementById('tutorialModal')?.classList.remove('active'));
bind('closeDebugBtn','click', () => document.getElementById('debugPanel')?.classList.remove('active'));

for (const radio of document.querySelectorAll('input[name="cycle-mode"]')) {
  radio.addEventListener('change', e => {
    const nextMode = e.target.value;
    if (nextMode === 'realtime' && state.mode !== 'realtime') {
      state.minutes = getCurrentMinutes();
    }
    state.mode = nextMode;
  });
}

const modeBar = document.createElement('div');
modeBar.className = 'mode-bar';
[['Day',720],['Sunrise',390],['Sunset',1110],['Night',0]].forEach(([label, minutes]) => {
  const b = document.createElement('button');
  b.textContent = label; b.onclick = () => setTime(minutes, label); modeBar.appendChild(b);
});
document.querySelector('.controls')?.appendChild(modeBar);

const qualitySelect = document.getElementById('qualitySelect');
if (qualitySelect) {
  qualitySelect.innerHTML = Object.keys(presets).map(p => `<option value="${p}" ${p === qualityName ? 'selected' : ''}>${p.charAt(0).toUpperCase() + p.slice(1)}</option>`).join('');
  qualitySelect.value = qualityName;
}

const graphicsContent = document.querySelector('.graphics-content');
if (graphicsContent) {
  const label = document.createElement('label');
  label.className = 'aurora-toggle';
  label.innerHTML = '<input type="checkbox" id="auroraToggle" /> Aurora Borealis';
  graphicsContent.appendChild(label);
  const cb = document.getElementById('auroraToggle');
  cb.checked = state.aurora;
  cb.addEventListener('change', e => { state.aurora = e.target.checked; });
}

document.addEventListener('keydown', e => {
  if (e.target.matches('input,select,textarea')) return;
  if (e.key === ' ') {
    e.preventDefault(); document.getElementById('pauseBtn')?.click();
  }
  if (e.key.toLowerCase() === 'r') {
    document.getElementById('cameraResetBtn')?.click();
  }
  if (e.key.toLowerCase() === 'h') {
    document.getElementById('helpBtn')?.click();
  }
  if (e.key.toLowerCase() === 'g') {
    document.getElementById('settingsBtn')?.click();
  }
  if (e.key.toLowerCase() === 'd') {
    setDemoMode(!state.demoMode);
  }
});

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    lastFrameTime = performance.now();
  }
});

const demoBtn = document.getElementById('demoModeBtn');
if (demoBtn) {
  demoBtn.addEventListener('click', () => setDemoMode(!state.demoMode));
}

const deviceInfoText = document.getElementById('deviceInfoText');
if (deviceInfoText) {
  deviceInfoText.textContent = `${mobile ? 'Mobile' : 'Desktop'} • ${memory}GB RAM • ${cores} cores`;
}

function refreshGraphicsSettings() {
  const shadowQuality = document.getElementById('shadowQuality');
  const bloomSlider = document.getElementById('bloomSlider');
  const vegetationSlider = document.getElementById('vegetationSlider');
  const shadowResSlider = document.getElementById('shadowResSlider');
  const shadowLabel = document.getElementById('shadowLabel');
  const bloomLabel = document.getElementById('bloomLabel');
  const vegetationLabel = document.getElementById('vegetationLabel');
  const shadowResLabel = document.getElementById('shadowResLabel');

  if (shadowQuality) {
    shadowQuality.value = quality.shadow > 0 ? (quality.shadow >= 2048 ? 3 : quality.shadow >= 1024 ? 2 : 1) : 0;
  }
  if (bloomSlider) bloomSlider.value = quality.bloom.toFixed(1);
  if (vegetationSlider) vegetationSlider.value = 1;
  if (shadowResSlider) shadowResSlider.value = quality.shadow >= 2048 ? 3 : quality.shadow >= 1024 ? 2 : 1;
  if (shadowLabel) shadowLabel.textContent = quality.shadow > 0 ? `${quality.shadow}px` : 'Disabled';
  if (bloomLabel) bloomLabel.textContent = quality.bloom.toFixed(1);
  if (vegetationLabel) vegetationLabel.textContent = '100%';
  if (shadowResLabel) shadowResLabel.textContent = quality.shadow > 0 ? `${quality.shadow}x${quality.shadow}` : 'Disabled';
}

const demoStatus = document.createElement('div');
demoStatus.id = 'demoStatus';
demoStatus.textContent = state.demoMode ? 'Presentation mode active' : 'Custom mode';
demoStatus.style.cssText = 'font-size:11px; opacity:0.75; letter-spacing:0.08em; text-transform:uppercase;';
document.querySelector('.hud-main')?.appendChild(demoStatus);

const qualityKeyMap = { 0: 0, 1: 512, 2: 1024, 3: 2048 };
const bloomSlider = document.getElementById('bloomSlider');
if (bloomSlider) {
  bloomSlider.addEventListener('input', e => {
    const value = clamp(safeNumber(e.target.value, quality.bloom), 0, 1.5);
    quality.bloom = value;
    bloom.strength = quality.bloom;
    document.getElementById('bloomLabel').textContent = value.toFixed(1);
  });
}

const shadowResSlider = document.getElementById('shadowResSlider');
if (shadowResSlider) {
  shadowResSlider.addEventListener('input', e => {
    const level = Number(e.target.value);
    quality.shadow = qualityKeyMap[level] || 0;
    renderer.shadowMap.enabled = quality.shadow > 0;
    sun.shadow.mapSize.set(quality.shadow || 512, quality.shadow || 512);
    ground.receiveShadow = quality.shadow > 0;
    document.getElementById('shadowResLabel').textContent = quality.shadow > 0 ? `${quality.shadow}x${quality.shadow}` : 'Disabled';
    document.getElementById('shadowLabel').textContent = quality.shadow > 0 ? `${quality.shadow}px` : 'Disabled';
  });
}

const saveSettingsBtn = document.getElementById('saveSettingsBtn');
if (saveSettingsBtn) {
  saveSettingsBtn.addEventListener('click', () => {
    localStorage.setItem('realistic-scene-settings', JSON.stringify({
      qualityName,
      demoMode: state.demoMode,
      bloom: quality.bloom,
      shadow: quality.shadow,
    }));
    flashStatus('Settings saved');
  });
}

const savedSettings = localStorage.getItem('realistic-scene-settings');
if (savedSettings) {
  try {
    const parsed = JSON.parse(savedSettings);
    if (parsed.qualityName && presets[parsed.qualityName]) {
      qualityName = parsed.qualityName;
      quality = { ...presets[parsed.qualityName] };
      lastNonDemoPresetName = parsed.qualityName;
    }
    if (typeof parsed.demoMode === 'boolean') setDemoMode(parsed.demoMode);
    if (typeof parsed.bloom === 'number') quality.bloom = parsed.bloom;
    if (typeof parsed.shadow === 'number') quality.shadow = parsed.shadow;
  } catch (error) {
    console.warn('Could not restore saved scene settings', error);
  }
}

const resetGraphicsBtn = document.getElementById('resetGraphicsBtn');
if (resetGraphicsBtn) {
  resetGraphicsBtn.addEventListener('click', () => {
    applyPreset(recommended);
    setDemoMode(true);
    refreshGraphicsSettings();
  });
}

setDemoMode(true);
refreshGraphicsSettings();
updateDemoButton();
if (animationFrameId === null) animationFrameId = requestAnimationFrame(animate);
window.__demoScene = { state, quality, setDemoMode, applyPreset, refreshGraphicsSettings };
