export const COLORS = [0xffb84d, 0xf4f4f1, 0x72d7ff, 0xff6b58, 0xcaff38];
export const COLOR_HEX = ['#ffb84d', '#f4f4f1', '#72d7ff', '#ff6b58', '#caff38'];
export const PARTICLE_COUNT = 54;
export const FLIGHT_MS = 1150;
export const DROP_WINDOW_MS = 3200;
export const PHASES = { fill: 5000, validate: 1200, release: 600, exchange: 2000 };
export const TOTAL_MS = 8800;
export const RUNTIME_TIMEOUT_MS = 2500;

export function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

export function smooth(value) {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

export function particleSchedule(count = PARTICLE_COUNT) {
  return Array.from({ length: count }, (_, index) => {
    const spawnAt = count <= 1 ? 0 : (index / (count - 1)) * DROP_WINDOW_MS;
    return { index, spawnAt, impactAt: spawnAt + FLIGHT_MS };
  });
}

export function particleProgress(fillTime, spawnAt) {
  return clamp01((fillTime - spawnAt) / FLIGHT_MS);
}

export function settledRatioForTime(fillTime, schedule = particleSchedule()) {
  if (!schedule.length) return 0;
  const impacts = schedule.reduce((total, item) => total + (fillTime >= item.impactAt ? 1 : 0), 0);
  return impacts / schedule.length;
}

export function cycleState(elapsed) {
  const cycleIndex = Math.floor(elapsed / TOTAL_MS);
  const time = elapsed % TOTAL_MS;
  if (time < PHASES.fill) {
    return { cycleIndex, time, phase: 'fill', phaseTime: time, progress: time / PHASES.fill, gates: 0, outX: 0, inX: -8.2 };
  }
  if (time < PHASES.fill + PHASES.validate) {
    const progress = (time - PHASES.fill) / PHASES.validate;
    return { cycleIndex, time, phase: 'validate', phaseTime: time - PHASES.fill, progress, gates: Math.min(5, Math.floor(progress * 5) + 1), outX: 0, inX: -8.2 };
  }
  if (time < PHASES.fill + PHASES.validate + PHASES.release) {
    const progress = (time - PHASES.fill - PHASES.validate) / PHASES.release;
    return { cycleIndex, time, phase: 'release', phaseTime: time - PHASES.fill - PHASES.validate, progress, gates: 5, outX: 0, inX: -8.2 };
  }
  const progress = smooth((time - PHASES.fill - PHASES.validate - PHASES.release) / PHASES.exchange);
  return { cycleIndex, time, phase: 'exchange', phaseTime: time - PHASES.fill - PHASES.validate - PHASES.release, progress, gates: 5, outX: progress * 8.2, inX: -8.2 + progress * 8.2 };
}

export function conveyorMotionForState(state) {
  return state.phase === 'exchange' ? state.progress : 0;
}

export function phaseLabel(state, schedule = particleSchedule()) {
  if (state.phase === 'fill') {
    return state.phaseTime < schedule[0].impactAt ? 'Ingredients in flight' : 'Filling the bowl';
  }
  return {
    validate: 'Clearing five product gates',
    release: 'Release cleared',
    exchange: 'Conveyor exchange',
  }[state.phase];
}

function timeout(ms) {
  return new Promise((_, reject) => {
    window.setTimeout(() => reject(new Error(`Three.js runtime exceeded ${ms}ms startup budget`)), ms);
  });
}

async function loadThree() {
  const runtime = await Promise.race([
    import('https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js'),
    timeout(RUNTIME_TIMEOUT_MS),
  ]);
  if (!runtime?.WebGLRenderer) throw new Error('Three.js runtime is incomplete');
  return runtime;
}

function updatePanel(state, elapsed, schedule) {
  const phase = document.querySelector('#cycle-phase');
  if (phase) phase.textContent = phaseLabel(state, schedule);
  const bowl = document.querySelector('#cycle-bowl');
  if (bowl) bowl.textContent = `Bowl ${String(state.cycleIndex + 1).padStart(2, '0')}`;
  const progress = document.querySelector('#cycle-progress');
  if (progress) progress.style.transform = `scaleX(${(elapsed % TOTAL_MS) / TOTAL_MS})`;
}

function installFallback(stage, schedule) {
  let fallback = stage.querySelector('.assembly-v3-fallback');
  if (fallback) return fallback;
  fallback = document.createElement('div');
  fallback.className = 'assembly-v3-fallback';
  fallback.setAttribute('aria-hidden', 'true');
  fallback.innerHTML = `<div class="v3-gates">${COLOR_HEX.map(color => `<i style="--gate:${color}"></i>`).join('')}</div><div class="v3-stream">${schedule.slice(0, 30).map(item => `<b style="--particle:${COLOR_HEX[item.index % 5]}"></b>`).join('')}</div><div class="v3-belt"></div><div class="v3-bowl v3-bowl-a"><span></span></div><div class="v3-bowl v3-bowl-b"><span></span></div>`;
  stage.prepend(fallback);
  return fallback;
}

function startFallback(stage, reduceMotion, schedule) {
  const fallback = installFallback(stage, schedule);
  stage.classList.add('is-fallback');
  stage.dataset.runtimeState = 'fallback-active';
  const bowls = [fallback.querySelector('.v3-bowl-a'), fallback.querySelector('.v3-bowl-b')];
  const particles = [...fallback.querySelectorAll('.v3-stream b')];
  const gates = [...fallback.querySelectorAll('.v3-gates i')];
  const belt = fallback.querySelector('.v3-belt');
  let cycleStart = performance.now();
  let frame = 0;
  let stopped = false;

  const replay = () => { cycleStart = performance.now(); };
  document.querySelector('#replay-assembly')?.addEventListener('click', replay);

  const render = now => {
    if (stopped) return;
    const elapsed = reduceMotion ? PHASES.fill + PHASES.validate * 0.8 : now - cycleStart;
    const state = cycleState(elapsed);
    const activeIndex = state.cycleIndex % 2;
    bowls.forEach((element, index) => {
      const x = index === activeIndex ? state.outX : state.inX;
      element.style.transform = `translateX(calc(-50% + ${x * 12}%))`;
      const fill = index === activeIndex ? (state.phase === 'fill' ? settledRatioForTime(state.phaseTime, schedule) : 1) : 0;
      element.querySelector('span').style.transform = `scaleY(${fill})`;
    });
    particles.forEach((element, index) => {
      const item = schedule[index];
      const progress = state.phase === 'fill' ? particleProgress(state.phaseTime, item.spawnAt) : 1;
      const inFlight = state.phase === 'fill' && state.phaseTime >= item.spawnAt && state.phaseTime < item.impactAt;
      element.style.opacity = inFlight ? '1' : '0';
      element.style.transform = `translate3d(${Math.sin(index * 1.7) * 48 * (1 - progress)}px, ${progress * 390}px, 0)`;
    });
    gates.forEach((element, index) => { element.style.opacity = index < state.gates ? '1' : '.45'; });
    belt.style.backgroundPositionX = `${conveyorMotionForState(state) * 160}px`;
    updatePanel(state, elapsed, schedule);
    stage.dataset.cyclePhase = state.phase;
    stage.dataset.conveyorMoving = String(state.phase === 'exchange');
    if (!reduceMotion) frame = requestAnimationFrame(render);
  };

  render(performance.now());
  return () => {
    stopped = true;
    cancelAnimationFrame(frame);
    document.querySelector('#replay-assembly')?.removeEventListener('click', replay);
  };
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

function createParticleResources(THREE) {
  return {
    geometries: Array.from({ length: 6 }, (_, index) => new THREE.IcosahedronGeometry(0.06 + index * 0.006, 1)),
    materials: COLORS.map(color => new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.02 })),
  };
}

function createParticle(THREE, index, resources) {
  return new THREE.Mesh(resources.geometries[index % resources.geometries.length], resources.materials[index % resources.materials.length]);
}

function createGate(THREE, index) {
  const width = 6.9 - index * 0.16;
  const depth = 4.7 - index * 0.12;
  const holeRadius = 1.06 - index * 0.025;
  const shape = roundedShape(THREE, width, depth, 0.36);
  const hole = new THREE.Path();
  hole.absellipse(0, 0, holeRadius, holeRadius, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.075, bevelEnabled: false, curveSegments: 20 });
  geometry.center();
  geometry.rotateX(-Math.PI / 2);
  const group = new THREE.Group();
  group.add(new THREE.Mesh(geometry, new THREE.MeshPhysicalMaterial({ color: COLORS[index], transparent: true, opacity: 0.2, roughness: 0.3, metalness: 0.45, transmission: 0.06, side: THREE.DoubleSide })));
  group.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 20), new THREE.LineBasicMaterial({ color: COLORS[index], transparent: true, opacity: 0.92 })));
  const clearRing = new THREE.Mesh(new THREE.TorusGeometry(holeRadius * 1.12, 0.048, 10, 48), new THREE.MeshBasicMaterial({ color: COLORS[index], transparent: true, opacity: 0 }));
  clearRing.rotation.x = Math.PI / 2;
  clearRing.position.y = 0.07;
  group.add(clearRing);
  group.userData = { clearRing, baseY: 2.95 - index * 1.08, targetX: 0, targetZ: 0, targetRot: 0 };
  group.position.y = group.userData.baseY;
  return group;
}

function createBowl(THREE, resources) {
  const radius = 2.42;
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
  const geometry = new THREE.LatheGeometry(profile, 64);
  geometry.computeVertexNormals();
  group.add(new THREE.Mesh(geometry, new THREE.MeshPhysicalMaterial({ color: 0xf4f4f1, roughness: 0.4, metalness: 0.03, transparent: true, opacity: 0.985, clearcoat: 0.22, side: THREE.DoubleSide })));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.978, 0.07, 12, 72), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.28, metalness: 0.06 }));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.38 * radius;
  group.add(rim);
  const settled = [];
  for (let index = 0; index < 90; index += 1) {
    const level = index / 89;
    const angle = index * 2.399963229728653;
    const radial = Math.sqrt((index % 30) / 29) * radius * (0.38 - level * 0.08);
    const piece = createParticle(THREE, index, resources);
    piece.position.set(Math.cos(angle) * radial, -0.32 * radius + level * 0.57 * radius, Math.sin(angle) * radial * 0.62);
    piece.rotation.set(index * 0.13, index * 0.17, index * 0.11);
    piece.visible = false;
    group.add(piece);
    settled.push(piece);
  }
  const halo = new THREE.Mesh(new THREE.TorusGeometry(radius * 1.12, 0.045, 10, 64), new THREE.MeshBasicMaterial({ color: 0xcaff38, transparent: true, opacity: 0 }));
  halo.rotation.x = Math.PI / 2;
  group.add(halo);
  group.userData = { settled, halo };
  return group;
}

export async function initBowlAssembly({ canvas, reduceMotion = false }) {
  const stage = canvas.closest('.hero-stage');
  if (!stage) return;
  const schedule = particleSchedule();
  const stopFallback = startFallback(stage, reduceMotion, schedule);
  if (reduceMotion) return;

  let THREE;
  try {
    THREE = await loadThree();
  } catch (error) {
    stage.dataset.runtimeState = 'fallback-only';
    console.info('Using the local bowl-animation fallback:', error.message);
    return;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance', failIfMajorPerformanceCaveat: false });
  } catch (error) {
    stage.dataset.runtimeState = 'fallback-only';
    console.info('WebGL unavailable; keeping the bowl-animation fallback:', error.message);
    return;
  }

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x111111, 2.0));
  const key = new THREE.DirectionalLight(0xffffff, 2.3);
  key.position.set(6, 10, 8);
  scene.add(key);
  const lime = new THREE.PointLight(0xcaff38, 11, 20);
  lime.position.set(-4, 2, 5);
  scene.add(lime);
  const blue = new THREE.PointLight(0x72d7ff, 6, 18);
  blue.position.set(4, 0, 3);
  scene.add(blue);

  const world = new THREE.Group();
  scene.add(world);
  const resources = createParticleResources(THREE);
  const beltMarkers = [];
  const belt = new THREE.Mesh(new THREE.BoxGeometry(16, 0.18, 5.4), new THREE.MeshStandardMaterial({ color: 0x101010, roughness: 0.62, metalness: 0.45 }));
  belt.position.y = -3.48;
  world.add(belt);
  [-2.78, 2.78].forEach(z => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(16.2, 0.12, 0.11), new THREE.MeshStandardMaterial({ color: 0x6c706d, metalness: 0.9, roughness: 0.28 }));
    rail.position.set(0, -3.22, z);
    world.add(rail);
  });
  const markerGeometry = new THREE.BoxGeometry(0.07, 0.025, 5.05);
  const markerMaterial = new THREE.MeshBasicMaterial({ color: 0x454745, transparent: true, opacity: 0.72 });
  for (let index = -8; index <= 8; index += 1) {
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.set(index, -3.36, 0);
    world.add(marker);
    beltMarkers.push(marker);
  }

  const gates = COLORS.map((_, index) => {
    const gate = createGate(THREE, index);
    world.add(gate);
    return gate;
  });
  const bowls = [createBowl(THREE, resources), createBowl(THREE, resources)];
  bowls[0].position.set(0, -2.42, 0);
  bowls[1].position.set(-8.2, -2.42, 0);
  world.add(...bowls);
  const falling = schedule.map(item => {
    const piece = createParticle(THREE, item.index, resources);
    piece.userData = { ...item, angle: item.index * 2.399963229728653, radius: 0.18 + (item.index % 9) * 0.055 };
    world.add(piece);
    return piece;
  });

  let targetValues = { throughput: 5, variability: 3, operator: 2, service: 2 };
  const onContractChange = event => { targetValues = event.detail.values; };
  window.addEventListener('lab37:contractchange', onContractChange);
  const applyPressure = () => {
    const n = value => (value - 3) / 2;
    const offsets = [
      [-n(targetValues.variability) * 0.22, n(targetValues.variability) * 0.13, n(targetValues.variability) * 0.025],
      [n(targetValues.service) * 0.14, -n(targetValues.service) * 0.09, -n(targetValues.service) * 0.018],
      [n(targetValues.throughput) * 0.18, n(targetValues.throughput) * 0.05, n(targetValues.throughput) * 0.02],
      [-n(targetValues.operator) * 0.17, -n(targetValues.operator) * 0.06, -n(targetValues.operator) * 0.022],
      [(n(targetValues.throughput) - n(targetValues.service)) * 0.11, (n(targetValues.variability) - n(targetValues.operator)) * 0.08, 0],
    ];
    gates.forEach((gate, index) => {
      gate.userData.targetX = offsets[index][0];
      gate.userData.targetZ = offsets[index][1];
      gate.userData.targetRot = offsets[index][2];
    });
  };

  const resize = () => {
    const rect = stage.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, width > 900 ? 1.15 : 1.35));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = width < 560 ? 42 : 35;
    camera.position.set(width < 560 ? 7.2 : 8.1, width < 560 ? 5.4 : 6.3, width < 560 ? 14.8 : 13.8);
    camera.lookAt(0, 0.15, 0);
    camera.updateProjectionMatrix();
  };
  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(stage);

  let cycleStart = performance.now();
  let frame = 0;
  let stageVisible = true;
  const replay = () => { cycleStart = performance.now(); };
  document.querySelector('#replay-assembly')?.addEventListener('click', replay);

  const render = now => {
    frame = 0;
    if (!stageVisible || document.hidden) return;
    const elapsed = now - cycleStart;
    const state = cycleState(elapsed);
    const activeIndex = state.cycleIndex % 2;
    const incomingIndex = (activeIndex + 1) % 2;
    const active = bowls[activeIndex];
    const incoming = bowls[incomingIndex];
    active.position.set(state.outX, -2.42, 0);
    incoming.position.set(state.inX, -2.42, 0);
    const fillRatio = state.phase === 'fill' ? settledRatioForTime(state.phaseTime, schedule) : 1;
    const count = Math.round(fillRatio * active.userData.settled.length);
    active.userData.settled.forEach((piece, index) => { piece.visible = index < count; });
    incoming.userData.settled.forEach(piece => { piece.visible = false; });
    active.userData.halo.material.opacity = state.phase === 'release'
      ? 0.35 + Math.sin(state.progress * Math.PI) * 0.65
      : state.phase === 'exchange' ? 0.35 * (1 - state.progress) : 0;
    incoming.userData.halo.material.opacity = 0;
    falling.forEach(piece => {
      const progress = state.phase === 'fill' ? particleProgress(state.phaseTime, piece.userData.spawnAt) : 1;
      const inFlight = state.phase === 'fill' && state.phaseTime >= piece.userData.spawnAt && state.phaseTime < piece.userData.impactAt;
      if (!inFlight) {
        piece.visible = false;
        return;
      }
      piece.visible = true;
      const t = smooth(progress);
      const radius = piece.userData.radius * (1 - t * 0.48);
      const angle = piece.userData.angle + Math.sin(now * 0.0018 + piece.userData.spawnAt * 0.008) * 0.08;
      piece.position.set(Math.cos(angle) * radius, 5.25 + (-2.12 - 5.25) * t, Math.sin(angle) * radius * 0.68);
      piece.rotation.x += 0.02;
      piece.rotation.y += 0.025;
    });
    applyPressure();
    gates.forEach((gate, index) => {
      gate.position.x += (gate.userData.targetX - gate.position.x) * 0.08;
      gate.position.z += (gate.userData.targetZ - gate.position.z) * 0.08;
      gate.rotation.y += (gate.userData.targetRot - gate.rotation.y) * 0.08;
      const cleared = index < state.gates;
      const current = state.phase === 'validate' && index === Math.min(4, state.gates - 1);
      const targetOpacity = cleared ? (current ? 0.95 : 0.48) : 0;
      gate.userData.clearRing.material.opacity += (targetOpacity - gate.userData.clearRing.material.opacity) * 0.16;
    });
    if (conveyorMotionForState(state) > 0) {
      beltMarkers.forEach(marker => {
        marker.position.x += 0.085;
        if (marker.position.x > 8) marker.position.x -= 16;
      });
    }
    updatePanel(state, elapsed, schedule);
    stage.dataset.cyclePhase = state.phase;
    stage.dataset.conveyorMoving = String(state.phase === 'exchange');
    renderer.render(scene, camera);
    frame = requestAnimationFrame(render);
  };

  const resumeLoop = () => {
    if (stageVisible && !document.hidden && !frame) frame = requestAnimationFrame(render);
  };
  const intersectionObserver = new IntersectionObserver(entries => {
    stageVisible = entries[0]?.isIntersecting ?? true;
    if (!stageVisible && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
    resumeLoop();
  }, { rootMargin: '120px' });
  intersectionObserver.observe(stage);
  const onVisibility = () => {
    if (document.hidden && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
    resumeLoop();
  };
  document.addEventListener('visibilitychange', onVisibility);

  renderer.compile(scene, camera);
  renderer.render(scene, camera);
  stage.classList.add('is-webgl-ready');
  stage.classList.remove('is-fallback');
  stage.dataset.runtimeState = 'webgl-ready';
  stopFallback?.();
  frame = requestAnimationFrame(render);

  window.addEventListener('beforeunload', () => {
    cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('lab37:contractchange', onContractChange);
    document.querySelector('#replay-assembly')?.removeEventListener('click', replay);
    renderer.dispose();
  }, { once: true });
}
