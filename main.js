import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/UnrealBloomPass.js';

const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || innerWidth < 768;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const safeNumber = (v, fallback) => Number.isFinite(Number(v)) ? Number(v) : fallback;

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
let quality = { ...presets[recommended] };
let qualityName = recommended;

const state = {
  mode: 'simulated', paused: false, minutes: 720, multiplier: 1,
  latitude: 0, longitude: 0, location: 'Manual location', aurora: false,
  dayColor: 0xc0d3e5, nightColor: 0x11182f, fogColor: 0xc0d3e5,
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
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, quality.pixelRatio));
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

const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120, quality.ground, quality.ground), new THREE.MeshStandardMaterial({ color: 0x71885a, roughness: 1 }));
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = quality.shadow > 0; scene.add(ground);
const gp = ground.geometry.attributes.position;
for (let i = 0; i < gp.count; i++) gp.setZ(i, Math.sin(gp.getX(i) * .55) * .16 + Math.cos(gp.getY(i) * .7) * .2);
gp.needsUpdate = true; ground.geometry.computeVertexNormals();
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
const matrix = new THREE.Matrix4(); const position = new THREE.Vector3(); const scale = new THREE.Vector3(); const quaternion = new THREE.Quaternion();
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
  tree.position.set(x,0,z); tree.scale.setScalar(s); tree.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = quality.shadow > 0; }); trees.add(tree);
}
scene.add(trees);

function textureRadial() { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const g = x.createRadialGradient(64,64,4,64,64,64); g.addColorStop(0,'#fff'); g.addColorStop(.25,'#ffe9a0'); g.addColorStop(1,'transparent'); x.fillStyle=g; x.fillRect(0,0,128,128); return new THREE.CanvasTexture(c); }
const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: textureRadial(), color: 0xfff0ae, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
sunSprite.scale.set(9,9,1); scene.add(sunSprite);
const rays = new THREE.Group();
for (let i = 0; i < quality.rays; i++) { const r = new THREE.Sprite(new THREE.SpriteMaterial({ map: textureRadial(), color: 0xffd69b, transparent: true, opacity: .12, blending: THREE.AdditiveBlending, depthWrite: false })); r.scale.set(5, 18, 1); r.position.set(-12 + i * 3, 14, 8); rays.add(r); }
scene.add(rays);

const aurora = new THREE.Group();
for (let i = 0; i < (mobile ? 5 : 12); i++) {
  const material = new THREE.MeshBasicMaterial({ color: i % 2 ? 0x39d9b3 : 0x7659ff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
  const ribbon = new THREE.Mesh(new THREE.PlaneGeometry(3, 9, 8, 12), material);
  ribbon.position.set(-18 + i * 3.2, 14 + Math.random() * 5, -18 + Math.random() * 10); ribbon.rotation.y = (Math.random() - .5) * .5; aurora.add(ribbon);
}
scene.add(aurora);

function setTime(minutes, label = '') { state.minutes = ((minutes % 1440) + 1440) % 1440; if (label) flashStatus(label); }
function flashStatus(text) { const el = document.getElementById('locationDisplay'); if (el) el.textContent = text; }
function updateSky() {
  const daylight = clamp(Math.sin((state.minutes / 1440 - .25) * Math.PI), .04, 1);
  const n = state.mode === 'realtime' ? new Date().getHours() * 60 + new Date().getMinutes() : state.minutes;
  state.minutes = state.mode === 'realtime' && !state.paused ? n : state.minutes;
  const t = state.minutes / 1440; const angle = t * Math.PI * 2;
  const effective = state.mode === 'realtime' ? daylight : daylight;
  currentSky.lerpColors(nightSky, daySky, effective); scene.background.copy(currentSky); scene.fog.color.copy(currentSky);
  sun.position.set(-18 + Math.sin(angle) * 20, 15 + Math.cos(angle + Math.PI / 4) * 15, 7 + Math.cos(angle) * 10);
  sun.intensity = .18 + effective * 2.45; hemi.intensity = .25 + effective * 1.25; renderer.toneMappingExposure = .72 + effective * .9;
  sunSprite.position.copy(sun.position); sunSprite.material.opacity = effective > .08 ? effective : 0;
  rays.children.forEach(r => { r.material.opacity = effective > .3 ? .14 * effective : 0; });
  aurora.visible = state.aurora; aurora.children.forEach((r, i) => { r.material.opacity = state.aurora && effective < .35 ? .12 + Math.sin(performance.now() * .001 + i) * .04 : 0; });
  bloom.strength = quality.bloom * (.45 + effective * .55);
}

const clock = new THREE.Clock();
function animate() {
  const dt = Math.min(clock.getDelta(), .05);
  if (!state.paused && state.mode === 'simulated') state.minutes = (state.minutes + dt * 72 * state.multiplier) % 1440;
  updateSky();
  document.getElementById('timeDisplay')?.replaceChildren(document.createTextNode(`${String(Math.floor(state.minutes/60)).padStart(2,'0')}:${String(Math.floor(state.minutes%60)).padStart(2,'0')}`));
  controls.update(); composer.render(); requestAnimationFrame(animate);
}
animate();

function applyPreset(name) { if (!presets[name]) return; qualityName = name; quality = { ...presets[name] }; renderer.setPixelRatio(Math.min(devicePixelRatio || 1, quality.pixelRatio)); renderer.shadowMap.enabled = quality.shadow > 0; sun.castShadow = quality.shadow > 0; sun.shadow.mapSize.set(quality.shadow || 512, quality.shadow || 512); bloom.strength = quality.bloom; document.getElementById('qualitySelect') && (document.getElementById('qualitySelect').value = name); flashStatus(`Preset: ${name}`); }
function bind(id, event, fn) { document.getElementById(id)?.addEventListener(event, fn); }
bind('pauseBtn','click', () => { state.paused = !state.paused; const b = document.getElementById('pauseBtn'); if (b) b.textContent = state.paused ? '▶ Resume' : '⏸ Pause'; });
bind('resetBtn','click', () => { setTime(state.mode === 'realtime' ? new Date().getHours() * 60 + new Date().getMinutes() : 720); });
bind('cameraResetBtn','click', () => { camera.position.set(12,8.5,14); controls.target.set(0,2.5,0); controls.update(); });
bind('timeMultiplier','input', e => { state.multiplier = clamp(safeNumber(e.target.value,1), .1, 5); const el=document.getElementById('multiplierValue'); if(el) el.textContent=`${state.multiplier.toFixed(1)}x`; });
bind('qualitySelect','change', e => applyPreset(e.target.value));
for (const [id, min, max, key] of [['latitude',-90,90,'latitude'],['longitude',-180,180,'longitude']]) bind(id,'change',e => { const v=clamp(safeNumber(e.target.value,0),min,max); state[key]=v; e.target.value=v; });
bind('useLocationBtn','click', () => navigator.geolocation?.getCurrentPosition(p => { state.latitude=p.coords.latitude; state.longitude=p.coords.longitude; state.location='GPS location'; flashStatus(state.location); }, () => flashStatus('GPS unavailable; using manual location')));
bind('settingsBtn','click', () => document.getElementById('graphicsPanel')?.classList.toggle('active'));
bind('closeGraphicsBtn','click', () => document.getElementById('graphicsPanel')?.classList.remove('active'));
bind('helpBtn','click', () => document.getElementById('tutorialModal')?.classList.add('active'));
bind('closeTutorialBtn','click', () => document.getElementById('tutorialModal')?.classList.remove('active'));
bind('closeTutorialBtnMain','click', () => document.getElementById('tutorialModal')?.classList.remove('active'));
bind('closeDebugBtn','click', () => document.getElementById('debugPanel')?.classList.remove('active'));
for (const radio of document.querySelectorAll('input[name="cycle-mode"]')) radio.addEventListener('change', e => { state.mode=e.target.value; if(state.mode==='realtime') state.minutes=new Date().getHours()*60+new Date().getMinutes(); });

const modeBar = document.createElement('div'); modeBar.className='mode-bar';
[['Day',720],['Sunrise',390],['Sunset',1110],['Night',0]].forEach(([label, minutes]) => { const b=document.createElement('button'); b.textContent=label; b.onclick=()=>setTime(minutes,label); modeBar.appendChild(b); });
document.querySelector('.controls')?.appendChild(modeBar);
const qualitySelect = document.getElementById('qualitySelect'); if (qualitySelect) { qualitySelect.innerHTML = Object.keys(presets).map(p => `<option value="${p}" ${p===qualityName?'selected':''}>${p[0].toUpperCase()+p.slice(1)}</option>`).join(''); }
const graphicsContent = document.querySelector('.graphics-content'); if (graphicsContent) { const label=document.createElement('label'); label.className='aurora-toggle'; label.innerHTML='<input type="checkbox" id="auroraToggle"> Aurora Borealis'; graphicsContent.appendChild(label); bind('auroraToggle','change',e=>state.aurora=e.target.checked); }
document.addEventListener('keydown', e => { if (e.target.matches('input,select,textarea')) return; if(e.key===' '){e.preventDefault(); document.getElementById('pauseBtn')?.click();} if(e.key.toLowerCase()==='g') document.getElementById('graphicsPanel')?.classList.toggle('active'); if(e.key.toLowerCase()==='h') document.getElementById('helpBtn')?.click(); if(e.key.toLowerCase()==='r') document.getElementById('cameraResetBtn')?.click(); });
addEventListener('resize', () => { camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); composer.setSize(innerWidth,innerHeight); });
