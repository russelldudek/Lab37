import * as THREE from './assets/vendor/three.module.js';

const canvas = document.querySelector('#assembly-canvas');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const scenarios = {
  peak: {
    name: 'Peak rush',
    values: { throughput: 5, variability: 3, operator: 2, service: 2 },
    state: 'Integrated pilot — ready to validate',
    headline: 'Protect flow without losing bowl-level truth.',
    summary: 'The release should preserve throughput while keeping portion evidence, operator recovery, and service signals visible enough to learn from the rush rather than merely survive it.',
    evidence: ['Throughput', 'Order latency', 'Dispense accuracy', 'Interventions', 'Recovery time'],
  },
  menu: {
    name: 'Menu expansion',
    values: { throughput: 3, variability: 5, operator: 3, service: 2 },
    state: 'Recipe contract — validate the range',
    headline: 'Scale variety through bounded recipe behavior.',
    summary: 'A new menu is product work across food behavior, dispenser parameters, software configuration, loading, quality checks, and economics. The contract makes the acceptable range explicit before rollout.',
    evidence: ['Recipe yield', 'Weight variance', 'Ingredient behavior', 'Changeover time', 'Waste'],
  },
  pilot: {
    name: 'New-site pilot',
    values: { throughput: 4, variability: 3, operator: 4, service: 3 },
    state: 'Pilot evidence — build the repeatable launch',
    headline: 'Make the next installation easier than the last.',
    summary: 'The pilot should test more than machine output. It should prove onboarding, order integration, operator routines, support ownership, site economics, and a clean path from field signal to product decision.',
    evidence: ['Install readiness', 'Time to first bowl', 'Training load', 'Support demand', 'Unit economics'],
  },
  service: {
    name: 'Maintenance event',
    values: { throughput: 2, variability: 2, operator: 4, service: 5 },
    state: 'Service learning — restore and retain',
    headline: 'Turn every recovery into product memory.',
    summary: 'A maintenance event is a product-learning moment. Good instrumentation connects fault context, operator action, component access, time to recover, and the requirement or design decision that prevents recurrence.',
    evidence: ['Fault context', 'Diagnosis time', 'Access steps', 'Time to restore', 'Repeat incidence'],
  },
};

let activeScenario = 'peak';
let customAdjusted = false;
const ranges = {
  throughput: document.querySelector('#throughput'),
  variability: document.querySelector('#variability'),
  operator: document.querySelector('#operator'),
  service: document.querySelector('#service'),
};

const readout = {
  state: document.querySelector('#readout-state'),
  headline: document.querySelector('#readout-headline'),
  summary: document.querySelector('#readout-summary'),
  cells: [...document.querySelectorAll('.evidence-cell strong')],
};

function rangeValue(key) {
  return ranges[key] ? Number(ranges[key].value) : 3;
}

function updateRangeOutputs() {
  Object.entries(ranges).forEach(([key, input]) => {
    const output = document.querySelector(`[data-output="${key}"]`);
    if (output && input) output.textContent = input.value;
  });
}

function deriveReadout() {
  const values = Object.fromEntries(Object.keys(ranges).map((key) => [key, rangeValue(key)]));
  const spread = Math.max(...Object.values(values)) - Math.min(...Object.values(values));
  const pressure = values.throughput + values.variability;
  const resilience = values.operator + values.service;
  const base = scenarios[activeScenario];

  let state = base.state;
  let headline = base.headline;
  let summary = base.summary;

  if (customAdjusted && spread >= 4) {
    state = 'Refine the product contract';
    headline = 'One constraint is outrunning the system.';
    summary = `This illustrative state makes the trade-off visible: ${values.throughput >= 5 ? 'throughput pressure' : values.variability >= 5 ? 'recipe variability' : values.operator >= 5 ? 'operator demand' : 'service access'} needs an explicit acceptance test and owner before the release can remain coherent.`;
  } else if (customAdjusted && pressure >= 8 && resilience <= 5) {
    state = 'Validate recovery under load';
    headline = 'Speed needs an equally clear recovery path.';
    summary = 'The model recommends validating intervention frequency, fault context, and time to restore alongside throughput. The goal is not slower innovation; it is faster learning from a complete system.';
  } else if (customAdjusted && resilience >= 8 && pressure <= 5) {
    state = 'Ready to simplify the operating burden';
    headline = 'Serviceability can become a scaling advantage.';
    summary = 'Strong operator and service conditions create room to standardize training, maintenance, support ownership, and launch readiness while the product continues to expand.';
  }

  if (readout.state) readout.state.textContent = state;
  if (readout.headline) readout.headline.textContent = headline;
  if (readout.summary) readout.summary.textContent = summary;
  readout.cells.forEach((cell, index) => { cell.textContent = base.evidence[index] || ''; });
  updateRangeOutputs();
  updateSceneTargets(values);
}

function setScenario(key) {
  if (!scenarios[key]) return;
  activeScenario = key;
  customAdjusted = false;
  document.querySelectorAll('.scenario-button').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.scenario === key));
  });
  Object.entries(scenarios[key].values).forEach(([name, value]) => {
    if (ranges[name]) ranges[name].value = value;
  });
  deriveReadout();
}

document.querySelectorAll('.scenario-button').forEach((button) => {
  button.addEventListener('click', () => setScenario(button.dataset.scenario));
});
Object.values(ranges).forEach((input) => input?.addEventListener('input', () => { customAdjusted = true; deriveReadout(); }));
document.querySelector('#reset-simulator')?.addEventListener('click', () => setScenario('peak'));

document.querySelectorAll('[data-print]').forEach((button) => {
  button.addEventListener('click', () => window.print());
});

let renderer;
let scene;
let camera;
let layerGroups = [];
let particles = [];
let targetState = { throughput: 5, variability: 3, operator: 2, service: 2 };
let frameId;

function createRoundedRectLine(width, depth, radius, color) {
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
  const points = shape.getPoints(64).map((p) => new THREE.Vector3(p.x, 0, p.y));
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.88 });
  return new THREE.LineLoop(geometry, material);
}

function initScene() {
  if (!canvas) return;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (error) {
    canvas.classList.add('webgl-fallback');
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(9.4, 7.5, 12.5);
  camera.lookAt(0, 0.5, 0);

  const ambient = new THREE.AmbientLight(0xffffff, 1.45);
  scene.add(ambient);
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(7, 10, 9);
  scene.add(key);
  const green = new THREE.PointLight(0xcaff38, 16, 22);
  green.position.set(-4, 2, 5);
  scene.add(green);
  const blue = new THREE.PointLight(0x72d7ff, 7, 18);
  blue.position.set(5, -1, 2);
  scene.add(blue);

  const base = new THREE.Group();
  scene.add(base);

  const platform = new THREE.Mesh(
    new THREE.CylinderGeometry(4.8, 5.2, 0.24, 64),
    new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.28 })
  );
  platform.position.y = -3.4;
  base.add(platform);
  const platformEdge = new THREE.LineSegments(
    new THREE.EdgesGeometry(platform.geometry),
    new THREE.LineBasicMaterial({ color: 0x666666, transparent: true, opacity: 0.5 })
  );
  platformEdge.position.copy(platform.position);
  base.add(platformEdge);

  const profile = [
    new THREE.Vector2(0.2, -0.8),
    new THREE.Vector2(1.45, -0.76),
    new THREE.Vector2(2.2, -0.3),
    new THREE.Vector2(2.65, 0.35),
    new THREE.Vector2(2.85, 0.82),
  ];
  const bowl = new THREE.Mesh(
    new THREE.LatheGeometry(profile, 72),
    new THREE.MeshPhysicalMaterial({ color: 0xf2f2ed, metalness: 0.08, roughness: 0.42, transparent: true, opacity: 0.94, side: THREE.DoubleSide })
  );
  bowl.position.y = -2.43;
  base.add(bowl);
  const bowlWire = new THREE.LineSegments(
    new THREE.WireframeGeometry(bowl.geometry),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12 })
  );
  bowlWire.position.copy(bowl.position);
  base.add(bowlWire);

  const colors = [0xffb84d, 0xf4f4f1, 0x72d7ff, 0xff6b58, 0xcaff38];
  const layerNames = ['food', 'mechanics', 'software', 'operator', 'economics'];
  layerGroups = layerNames.map((name, index) => {
    const group = new THREE.Group();
    group.userData = { name, index, baseY: 2.95 - index * 1.2, targetX: 0, targetZ: 0, targetRot: 0, targetScale: 1 };

    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(7.4 - index * 0.28, 0.055, 5.1 - index * 0.18),
      new THREE.MeshPhysicalMaterial({
        color: colors[index], transparent: true, opacity: index === 1 ? 0.055 : 0.08,
        roughness: 0.25, metalness: 0.28, transmission: 0.28, thickness: 0.2, side: THREE.DoubleSide
      })
    );
    group.add(panel);
    const outline = createRoundedRectLine(7.4 - index * 0.28, 5.1 - index * 0.18, 0.52, colors[index]);
    outline.position.y = 0.04;
    group.add(outline);

    const aperture = new THREE.Mesh(
      new THREE.TorusGeometry(1.12 + index * 0.08, 0.025, 8, 72),
      new THREE.MeshBasicMaterial({ color: colors[index], transparent: true, opacity: 0.7 })
    );
    aperture.rotation.x = Math.PI / 2;
    aperture.position.y = 0.08;
    group.add(aperture);

    for (let corner = 0; corner < 4; corner += 1) {
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.055, 0.34, 12),
        new THREE.MeshBasicMaterial({ color: colors[index], transparent: true, opacity: 0.7 })
      );
      post.position.set(corner % 2 ? 2.85 : -2.85, 0.14, corner < 2 ? -1.75 : 1.75);
      group.add(post);
    }

    group.position.y = group.userData.baseY;
    base.add(group);
    return group;
  });

  const particleColors = [0xffb84d, 0xcaff38, 0xff6b58, 0x72d7ff, 0xf4f4f1];
  for (let i = 0; i < 42; i += 1) {
    const particle = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.06 + Math.random() * 0.08, 1),
      new THREE.MeshStandardMaterial({ color: particleColors[i % particleColors.length], roughness: 0.65, metalness: 0.05 })
    );
    particle.position.set((Math.random() - 0.5) * 1.8, 5 + Math.random() * 7, (Math.random() - 0.5) * 1.8);
    particle.userData.speed = 0.012 + Math.random() * 0.018;
    particle.userData.drift = (Math.random() - 0.5) * 0.004;
    base.add(particle);
    particles.push(particle);
  }

  const centralBeam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.032, 8.5, 12),
    new THREE.MeshBasicMaterial({ color: 0xcaff38, transparent: true, opacity: 0.3 })
  );
  centralBeam.position.y = 0.5;
  base.add(centralBeam);

  const orderFrame = new THREE.Mesh(
    new THREE.BoxGeometry(2.15, 1.3, 0.08),
    new THREE.MeshPhysicalMaterial({ color: 0x090909, roughness: 0.22, metalness: 0.55, transparent: true, opacity: 0.96 })
  );
  orderFrame.position.set(-3.9, 1.25, 0.3);
  orderFrame.rotation.y = 0.32;
  base.add(orderFrame);
  const orderEdge = new THREE.LineSegments(new THREE.EdgesGeometry(orderFrame.geometry), new THREE.LineBasicMaterial({ color: 0x72d7ff, opacity: .78, transparent: true }));
  orderEdge.position.copy(orderFrame.position);
  orderEdge.rotation.copy(orderFrame.rotation);
  base.add(orderEdge);

  resizeScene();
  updateSceneTargets(targetState);
  if (reduceMotion) renderScene(performance.now());
  else animateScene(performance.now());
}

function updateSceneTargets(values) {
  targetState = values;
  if (!layerGroups.length) return;
  const n = (value) => (value - 3) / 2;
  const targetOffsets = [
    { x: n(values.variability) * -0.5, z: n(values.variability) * 0.32, rot: n(values.variability) * 0.055 },
    { x: n(values.service) * 0.28, z: n(values.service) * -0.18, rot: n(values.service) * -0.04 },
    { x: n(values.throughput) * 0.34, z: n(values.throughput) * 0.1, rot: n(values.throughput) * 0.045 },
    { x: n(values.operator) * -0.34, z: n(values.operator) * -0.12, rot: n(values.operator) * -0.05 },
    { x: (n(values.throughput) - n(values.service)) * 0.25, z: (n(values.variability) - n(values.operator)) * 0.2, rot: (n(values.throughput) - n(values.operator)) * 0.035 },
  ];
  layerGroups.forEach((group, index) => {
    const offset = targetOffsets[index];
    group.userData.targetX = offset.x;
    group.userData.targetZ = offset.z;
    group.userData.targetRot = offset.rot;
    group.userData.targetScale = 1 + (values.throughput - 3) * 0.012 - (values.service - 3) * 0.006;
  });
  if (reduceMotion && renderer) renderScene(performance.now());
}

function resizeScene() {
  if (!renderer || !camera || !canvas) return;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, rect.width);
  const height = Math.max(1, rect.height);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function renderScene(time) {
  if (!renderer || !scene || !camera) return;
  layerGroups.forEach((group, index) => {
    const ease = reduceMotion ? 1 : 0.045;
    group.position.x += (group.userData.targetX - group.position.x) * ease;
    group.position.z += (group.userData.targetZ - group.position.z) * ease;
    group.rotation.y += (group.userData.targetRot - group.rotation.y) * ease;
    const targetY = group.userData.baseY + (reduceMotion ? 0 : Math.sin(time * 0.00055 + index * 0.72) * 0.045);
    group.position.y += (targetY - group.position.y) * ease;
    const scale = group.scale.x + (group.userData.targetScale - group.scale.x) * ease;
    group.scale.set(scale, scale, scale);
  });

  if (!reduceMotion) {
    const spread = Math.max(...Object.values(targetState)) - Math.min(...Object.values(targetState));
    particles.forEach((particle, index) => {
      particle.position.y -= particle.userData.speed * (1 + targetState.throughput * 0.12);
      particle.position.x += Math.sin(time * 0.0012 + index) * particle.userData.drift * (1 + spread * 0.4);
      if (particle.position.y < -2.2) {
        particle.position.y = 6.2 + Math.random() * 5;
        particle.position.x = (Math.random() - 0.5) * (1.2 + spread * 0.35);
        particle.position.z = (Math.random() - 0.5) * (1.2 + spread * 0.35);
      }
    });
    camera.position.x = 9.4 + Math.sin(time * 0.00018) * 0.38;
    camera.position.z = 12.5 + Math.cos(time * 0.00016) * 0.28;
    camera.lookAt(0, 0.35, 0);
  }
  renderer.render(scene, camera);
}

function animateScene(time) {
  renderScene(time);
  frameId = requestAnimationFrame(animateScene);
}

window.addEventListener('resize', resizeScene, { passive: true });
window.addEventListener('beforeunload', () => cancelAnimationFrame(frameId));

initScene();
setScenario('peak');
