const COLORS = [0xffb84d, 0xf4f4f1, 0x72d7ff, 0xff6b58, 0xcaff38];
const TOTAL_MS = 8800;
const PHASES = { fill: 5000, validate: 1200, release: 600, exchange: 2000 };

function clamp01(value) { return Math.max(0, Math.min(1, value)); }
function smooth(value) { const t = clamp01(value); return t * t * (3 - 2 * t); }

function cycleState(elapsed) {
  const cycleIndex = Math.floor(elapsed / TOTAL_MS);
  const time = elapsed % TOTAL_MS;
  if (time < PHASES.fill) return { cycleIndex, phase: 'fill', progress: time / PHASES.fill, fill: time / PHASES.fill, gates: 0, outX: 0, inX: -8.2 };
  if (time < PHASES.fill + PHASES.validate) {
    const progress = (time - PHASES.fill) / PHASES.validate;
    return { cycleIndex, phase: 'validate', progress, fill: 1, gates: Math.min(5, Math.floor(progress * 5) + 1), outX: 0, inX: -8.2 };
  }
  if (time < PHASES.fill + PHASES.validate + PHASES.release) {
    const progress = (time - PHASES.fill - PHASES.validate) / PHASES.release;
    return { cycleIndex, phase: 'release', progress, fill: 1, gates: 5, outX: 0, inX: -8.2 };
  }
  const progress = smooth((time - PHASES.fill - PHASES.validate - PHASES.release) / PHASES.exchange);
  return { cycleIndex, phase: 'exchange', progress, fill: 1, gates: 5, outX: progress * 8.2, inX: -8.2 + progress * 8.2 };
}

async function loadThree() {
  const sources = [
    'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js',
    './assets/vendor/three.module.js',
  ];
  let lastError;
  for (const source of sources) {
    try { return await import(source); } catch (error) { lastError = error; }
  }
  throw lastError || new Error('Three.js unavailable');
}

function installFallback(stage) {
  if (stage.querySelector('.assembly-v2-fallback')) return;
  const fallback = document.createElement('div');
  fallback.className = 'assembly-v2-fallback';
  fallback.setAttribute('aria-hidden', 'true');
  fallback.innerHTML = `
    <div class="v2-gates"><i></i><i></i><i></i><i></i><i></i></div>
    <div class="v2-stream">${Array.from({ length: 15 }, (_, index) => `<b style="--n:${index}"></b>`).join('')}</div>
    <div class="v2-belt"></div>
    <div class="v2-bowl v2-bowl-a"><span></span></div>
    <div class="v2-bowl v2-bowl-b"><span></span></div>`;
  stage.prepend(fallback);
}

function roundedShape(THREE, width, depth, radius) {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -depth / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + depth - radius);
  shape.quadraticCurveTo(x + width, y + depth, x + width - radius, y + depth);
  shape.lineTo(x + radius, y + depth);
  shape.quadraticCurveTo(x, y + depth, x, y + depth - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

function createGate(THREE, index, scale) {
  const width = (6.9 - index * 0.16) * scale;
  const depth = (4.7 - index * 0.12) * scale;
  const shape = roundedShape(THREE, width, depth, 0.36 * scale);
  const hole = new THREE.Path();
  hole.absellipse(0, 0, (1.06 - index * 0.025) * scale, (1.06 - index * 0.025) * scale, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.075 * scale, bevelEnabled: false, curveSegments: 40 });
  geometry.center();
  geometry.rotateX(-Math.PI / 2);
  const material = new THREE.MeshPhysicalMaterial({ color: COLORS[index], transparent: true, opacity: 0.2, roughness: 0.28, metalness: 0.52, transmission: 0.1, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geometry, material);
  const group = new THREE.Group();
  group.add(mesh);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 20), new THREE.LineBasicMaterial({ color: COLORS[index], transparent: true, opacity: 0.92 }));
  group.add(edges);
  const clearRing = new THREE.Mesh(new THREE.TorusGeometry((1.18 - index * 0.02) * scale, 0.048 * scale, 12, 80), new THREE.MeshBasicMaterial({ color: 0xcaff38, transparent: true, opacity: 0 }));
  clearRing.rotation.x = Math.PI / 2;
  clearRing.position.y = 0.07 * scale;
  group.add(clearRing);
  group.userData = { clearRing, baseY: (2.95 - index * 1.08) * scale, targetX: 0, targetZ: 0, targetRot: 0 };
  group.position.y = group.userData.baseY;
  return group;
}

function createBowl(THREE, scale) {
  const radius = 2.42 * scale;
  const group = new THREE.Group();
  const profile = [
    new THREE.Vector2(0.22 * radius, -0.5 * radius),
    new THREE.Vector2(0.58 * radius, -0.49 * radius),
    new THREE.Vector2(0.82 * radius, -0.27 * radius),
    new THREE.Vector2(0.96 * radius, 0.1 * radius),
    new THREE.Vector2(radius, 0.38 * radius),
    new THREE.Vector2(0.955 * radius, 0.38 * radius),
    new THREE.Vector2(0.91 * radius, 0.11 * radius),
    new THREE.Vector2(0.77 * radius, -0.2 * radius),
    new THREE.Vector2(0.54 * radius, -0.42 * radius),
    new THREE.Vector2(0.24 * radius, -0.43 * radius),
  ];
  const geometry = new THREE.LatheGeometry(profile, 96);
  geometry.computeVertexNormals();
  const shell = new THREE.Mesh(geometry, new THREE.MeshPhysicalMaterial({ color: 0xf4f4f1, roughness: 0.34, metalness: 0.04, transparent: true, opacity: 0.96, clearcoat: 0.38, side: THREE.DoubleSide }));
  group.add(shell);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.978, 0.07 * scale, 16, 112), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25, metalness: 0.08 }));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.38 * radius;
  group.add(rim);
  const settled = [];
  for (let i = 0; i < 120; i += 1) {
    const level = i / 119;
    const angle = i * 2.399963229728653;
    const radial = Math.sqrt((i % 40) / 39) * radius * (0.4 + level * 0.36);
    const piece = new THREE.Mesh(new THREE.IcosahedronGeometry((0.065 + (i % 5) * 0.008) * scale, 1), new THREE.MeshStandardMaterial({ color: COLORS[i % 5], roughness: 0.72, metalness: 0.02 }));
    piece.position.set(Math.cos(angle) * radial, -0.31 * radius + level * 0.68 * radius, Math.sin(angle) * radial * 0.68);
    piece.rotation.set(i * 0.13, i * 0.17, i * 0.11);
    piece.visible = false;
    group.add(piece);
    settled.push(piece);
  }
  const halo = new THREE.Mesh(new THREE.TorusGeometry(radius * 1.12, 0.045 * scale, 12, 96), new THREE.MeshBasicMaterial({ color: 0xcaff38, transparent: true, opacity: 0 }));
  halo.rotation.x = Math.PI / 2;
  group.add(halo);
  group.userData = { settled, halo, radius };
  return group;
}

function phaseLabel(phase) {
  return { fill: 'Filling the bowl', validate: 'Clearing five product gates', release: 'Release cleared', exchange: 'Conveyor exchange' }[phase];
}

export async function initBowlAssembly({ canvas, reduceMotion = false }) {
  const stage = canvas.closest('.hero-stage');
  if (!stage) return;
  installFallback(stage);
  let THREE;
  try { THREE = await loadThree(); } catch (error) {
    stage.classList.add('is-fallback');
    throw error;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'default', failIfMajorPerformanceCaveat: false });
  } catch (error) {
    stage.classList.add('is-fallback');
    throw error;
  }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x111111, 2.1));
  const key = new THREE.DirectionalLight(0xffffff, 2.5); key.position.set(6, 10, 8); scene.add(key);
  const lime = new THREE.PointLight(0xcaff38, 13, 20); lime.position.set(-4, 2, 5); scene.add(lime);
  const blue = new THREE.PointLight(0x72d7ff, 7, 18); blue.position.set(4, 0, 3); scene.add(blue);

  const world = new THREE.Group();
  scene.add(world);
  const scale = 1;
  const beltMarkers = [];
  const belt = new THREE.Mesh(new THREE.BoxGeometry(16, 0.18, 5.4), new THREE.MeshStandardMaterial({ color: 0x101010, roughness: 0.62, metalness: 0.45 }));
  belt.position.y = -3.48; world.add(belt);
  [-2.78, 2.78].forEach((z) => { const rail = new THREE.Mesh(new THREE.BoxGeometry(16.2, 0.12, 0.11), new THREE.MeshStandardMaterial({ color: 0x6c706d, metalness: 0.9, roughness: 0.28 })); rail.position.set(0, -3.22, z); world.add(rail); });
  for (let i = -8; i <= 8; i += 1) { const marker = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.025, 5.05), new THREE.MeshBasicMaterial({ color: 0x454745, transparent: true, opacity: 0.72 })); marker.position.set(i, -3.36, 0); world.add(marker); beltMarkers.push(marker); }

  const gates = COLORS.map((_, index) => { const gate = createGate(THREE, index, scale); world.add(gate); return gate; });
  const bowls = [createBowl(THREE, scale), createBowl(THREE, scale)];
  bowls[0].position.set(0, -2.42, 0); bowls[1].position.set(-8.2, -2.42, 0); world.add(...bowls);
  const falling = [];
  for (let i = 0; i < 54; i += 1) {
    const piece = new THREE.Mesh(new THREE.IcosahedronGeometry(0.065 + (i % 6) * 0.008, 1), new THREE.MeshStandardMaterial({ color: COLORS[i % 5], roughness: 0.68, metalness: 0.02 }));
    piece.userData = { start: i / 54, angle: i * 2.399963229728653, radius: 0.18 + (i % 9) * 0.055 };
    world.add(piece); falling.push(piece);
  }

  let targetValues = { throughput: 5, variability: 3, operator: 2, service: 2 };
  window.addEventListener('lab37:contractchange', (event) => { targetValues = event.detail.values; });
  const applyPressure = () => {
    const n = (value) => (value - 3) / 2;
    const offsets = [
      [-n(targetValues.variability) * 0.22, n(targetValues.variability) * 0.13, n(targetValues.variability) * 0.025],
      [n(targetValues.service) * 0.14, -n(targetValues.service) * 0.09, -n(targetValues.service) * 0.018],
      [n(targetValues.throughput) * 0.18, n(targetValues.throughput) * 0.05, n(targetValues.throughput) * 0.02],
      [-n(targetValues.operator) * 0.17, -n(targetValues.operator) * 0.06, -n(targetValues.operator) * 0.022],
      [(n(targetValues.throughput) - n(targetValues.service)) * 0.11, (n(targetValues.variability) - n(targetValues.operator)) * 0.08, 0],
    ];
    gates.forEach((gate, index) => { gate.userData.targetX = offsets[index][0]; gate.userData.targetZ = offsets[index][1]; gate.userData.targetRot = offsets[index][2]; });
  };

  const resize = () => {
    const rect = stage.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, width > 900 ? 1.35 : 1.6));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = width < 560 ? 42 : 35;
    camera.position.set(width < 560 ? 7.2 : 8.1, width < 560 ? 5.4 : 6.3, width < 560 ? 14.8 : 13.8);
    camera.lookAt(0, 0.15, 0);
    camera.updateProjectionMatrix();
  };
  resize();
  const observer = new ResizeObserver(resize); observer.observe(stage);
  stage.classList.add('is-webgl-ready'); stage.classList.remove('is-fallback');

  let cycleStart = performance.now();
  let frame;
  document.querySelector('#replay-assembly')?.addEventListener('click', () => { cycleStart = performance.now(); });
  const render = (now) => {
    const elapsed = reduceMotion ? 5700 : now - cycleStart;
    const cycle = cycleState(elapsed);
    const activeIndex = cycle.cycleIndex % 2;
    const incomingIndex = (activeIndex + 1) % 2;
    const active = bowls[activeIndex];
    const incoming = bowls[incomingIndex];
    active.position.x = cycle.outX; active.position.y = -2.42; active.visible = true;
    incoming.position.x = cycle.inX; incoming.position.y = -2.42; incoming.visible = true;
    const count = Math.round(cycle.fill * active.userData.settled.length);
    active.userData.settled.forEach((piece, index) => { piece.visible = index < count; });
    incoming.userData.settled.forEach((piece) => { piece.visible = false; });
    active.userData.halo.material.opacity = cycle.phase === 'release' ? 0.35 + Math.sin(cycle.progress * Math.PI) * 0.65 : cycle.phase === 'exchange' ? 0.35 * (1 - cycle.progress) : 0;
    incoming.userData.halo.material.opacity = 0;

    falling.forEach((piece) => {
      const local = cycle.fill * 1.22 - piece.userData.start * 0.96;
      if (cycle.phase !== 'fill' || local < 0 || local >= 1) { piece.visible = false; return; }
      piece.visible = true;
      const t = smooth(local);
      const radius = piece.userData.radius * (1 - t * 0.48);
      const angle = piece.userData.angle + Math.sin(now * 0.0018 + piece.userData.start * 8) * 0.08;
      piece.position.set(Math.cos(angle) * radius, 5.25 + (-2.12 - 5.25) * t, Math.sin(angle) * radius * 0.68);
      piece.rotation.x += 0.02; piece.rotation.y += 0.025;
    });

    applyPressure();
    gates.forEach((gate, index) => {
      gate.position.x += (gate.userData.targetX - gate.position.x) * 0.08;
      gate.position.z += (gate.userData.targetZ - gate.position.z) * 0.08;
      gate.rotation.y += (gate.userData.targetRot - gate.rotation.y) * 0.08;
      const cleared = index < cycle.gates;
      const current = cycle.phase === 'validate' && index === Math.min(4, cycle.gates - 1);
      gate.userData.clearRing.material.opacity += ((cleared ? (current ? 0.95 : 0.48) : 0) - gate.userData.clearRing.material.opacity) * 0.16;
    });
    beltMarkers.forEach((marker) => { marker.position.x += cycle.phase === 'exchange' ? 0.06 : 0.008; if (marker.position.x > 8) marker.position.x -= 16; });

    const phase = document.querySelector('#cycle-phase'); if (phase) phase.textContent = phaseLabel(cycle.phase);
    const label = document.querySelector('#cycle-bowl'); if (label) label.textContent = `Bowl ${String(cycle.cycleIndex + 1).padStart(2, '0')}`;
    const progress = document.querySelector('#cycle-progress'); if (progress) progress.style.transform = `scaleX(${(elapsed % TOTAL_MS) / TOTAL_MS})`;
    stage.dataset.cyclePhase = cycle.phase;
    renderer.render(scene, camera);
    if (!reduceMotion) frame = requestAnimationFrame(render);
  };
  render(performance.now());
  window.addEventListener('beforeunload', () => { cancelAnimationFrame(frame); observer.disconnect(); renderer.dispose(); }, { once: true });
}
