const byId = (id) => document.getElementById(id);
const buttons = (attribute) => [...document.querySelectorAll(`button[data-${attribute}]`)];
const press = (items, key, value) => {
  for (const item of items) item.setAttribute('aria-pressed', String(item.dataset[key] === value));
};

const viewport = byId('viewport');
const message = byId('scene-message');
const dialog = byId('guide-dialog');
byId('open-guide').addEventListener('click', () => dialog.showModal());

const timeSettings = {
  day: { name: 'siang', hue: 39, intensity: 2.4, sky: 0x7c9987, hemiSky: 0xe1ead5, hemiGround: 0x697446, ambient: 1.42, lantern: 7, ocarina: 2.3, sun: [-7, 11, 6] },
  night: { name: 'malam', hue: 218, intensity: .85, sky: 0x202f43, hemiSky: 0x8b9fca, hemiGround: 0x435361, ambient: .79, lantern: 23, ocarina: 8, sun: [7, 8, -4] },
};
const viewSettings = {
  orbit: { name: 'Perspektif orbit', position: [6.4, 6.05, 12.65] },
  front: { name: 'Tampak depan · Perspektif', position: [0, 1.63, 15.25] },
  top: { name: 'Tampak atas · Ortografis', position: [0, 20, -.699] },
};
const format = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 });

function start() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', 'Adegan 3D. Gunakan tombol panah untuk orbit dan tombol plus atau minus untuk zoom.');
  viewport.prepend(canvas);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color();
  scene.fog = new THREE.Fog(0xffffff, 11, 48);
  const { objects, ocarinaLight, lanternLight } = createWorld(scene);
  const sun = new THREE.DirectionalLight(0xffffff, 1);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1536, 1536);
  Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: .5, far: 40 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.normalBias = .041;
  sun.shadow.bias = -.0002;
  const hemisphere = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
  scene.add(sun, hemisphere);

  const perspective = new THREE.PerspectiveCamera(44, 1, .1, 125);
  const orthographic = new THREE.OrthographicCamera(-8, 8, 8, -8, .1, 125);
  let camera = perspective;
  let view = 'orbit';
  const controls = new THREE.OrbitControls(perspective, canvas);
  controls.enablePan = false;
  controls.maxPolarAngle = Math.PI * .485;
  controls.minDistance = 4;
  controls.maxDistance = 29;
  controls.minZoom = .65;
  controls.maxZoom = 2.5;
  controls.addEventListener('change', requestRender);

  let activeId = 'ocarina';
  let axis = 'x';
  let pending = false;
  const needle = byId('compass-needle');
  const ranges = {
    position: { element: byId('position'), unit: ' u' },
    rotation: { element: byId('rotation'), unit: '°' },
    scale: { element: byId('scale'), unit: '×' },
    intensity: { element: byId('intensity'), unit: '' },
    hue: { element: byId('hue'), unit: '°' },
  };

  function syncRange(name, value) {
    const { element, unit } = ranges[name];
    element.value = String(value);
    const progress = (element.valueAsNumber - Number(element.min)) / (Number(element.max) - Number(element.min));
    element.style.setProperty('--progress', `${progress * 100}%`);
    const display = format.format(element.valueAsNumber) + unit;
    byId(`${name}-value`).value = display;
    element.setAttribute('aria-valuetext', display);
  }

  function requestRender() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      renderer.render(scene, camera);
      needle.style.transform = `rotate(${-controls.getAzimuthalAngle()}rad)`;
    });
  }

  function resize() {
    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    const aspect = width / Math.max(1, height);
    if (!width) return;
    renderer.setSize(width, height, false);
    perspective.aspect = aspect;
    const fit = Math.max(1, 1.22 / aspect);
    perspective.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(22)) * fit));
    perspective.updateProjectionMatrix();
    orthographic.top = 7.3 * fit;
    orthographic.bottom = -orthographic.top;
    orthographic.right = orthographic.top * aspect;
    orthographic.left = -orthographic.right;
    orthographic.updateProjectionMatrix();
    requestRender();
  }

  function setView(next) {
    const preset = viewSettings[next];
    view = next;
    camera = next === 'top' ? orthographic : perspective;
    camera.position.set(...preset.position);
    camera.zoom = 1;
    camera.updateProjectionMatrix();
    controls.object = camera;
    controls.target.set(0, next === 'top' ? 0 : 1.63, -.7);
    controls.enableRotate = next === 'orbit';
    controls.update();
    press(buttons('view'), 'view', next);
    byId('view-name').textContent = preset.name;
    byId('mouse-orbit-hint').hidden = next !== 'orbit';
    byId('touch-orbit-hint').hidden = next !== 'orbit';
    requestRender();
  }

  function zoom(direction) {
    if (direction === 'in') controls.dollyIn(.85);
    else controls.dollyOut(.85);
  }

  function syncTransform() {
    const group = objects.get(activeId).group;
    syncRange('position', group.position[axis]);
    syncRange('rotation', THREE.MathUtils.radToDeg(group.rotation[axis]));
    syncRange('scale', group.scale[axis]);
  }

  const tabs = [...document.querySelectorAll('[role="tab"]')];
  function setTab(active) {
    for (const tab of tabs) {
      const selected = tab === active;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      byId(tab.getAttribute('aria-controls')).hidden = !selected;
    }
  }

  for (const tab of tabs) {
    tab.addEventListener('click', () => setTab(tab));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs.at(-1) : tabs.find((item) => item !== tab);
      setTab(next);
      next.focus();
    });
  }

  const list = byId('object-list');
  for (const [id, artifact] of objects) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'object-choice';
    button.dataset.object = id;
    button.setAttribute('aria-label', artifact.name);
    button.textContent = artifact.name;
    button.addEventListener('click', () => select(id));
    list.append(button);
  }

  function select(id) {
    activeId = id;
    const artifact = objects.get(id);
    byId('object-name').textContent = artifact.name;
    press(buttons('object'), 'object', id);
    setTab(byId('object-tab'));
    syncTransform();
    requestRender();
  }

  function applyLight() {
    const intensity = ranges.intensity.element.valueAsNumber;
    const hue = ranges.hue.element.valueAsNumber;
    sun.intensity = intensity;
    sun.color.setStyle(`hsl(${hue}, 68%, 79%)`);
    const color = `#${sun.color.getHexString()}`;
    byId('light-swatch').style.backgroundColor = color;
    byId('light-hex').textContent = color.toUpperCase();
    syncRange('intensity', intensity);
    syncRange('hue', hue);
    requestRender();
  }

  function setTime(next) {
    const preset = timeSettings[next];
    scene.background.setHex(preset.sky);
    scene.fog.color.setHex(preset.sky);
    hemisphere.color.setHex(preset.hemiSky);
    hemisphere.groundColor.setHex(preset.hemiGround);
    hemisphere.intensity = preset.ambient;
    sun.position.set(...preset.sun);
    ocarinaLight.intensity = preset.ocarina;
    lanternLight.intensity = preset.lantern;
    renderer.shadowMap.needsUpdate = true;
    ranges.intensity.element.value = preset.intensity;
    ranges.hue.element.value = preset.hue;
    byId('light-time').textContent = `Pencahayaan ${preset.name}`;
    byId('light-symbol').textContent = next === 'day' ? '☼' : '☾';
    press(buttons('time'), 'time', next);
    applyLight();
  }

  for (const button of buttons('view')) button.addEventListener('click', () => setView(button.dataset.view));
  for (const button of buttons('zoom')) button.addEventListener('click', () => zoom(button.dataset.zoom));
  for (const button of buttons('axis')) {
    button.addEventListener('click', () => {
      axis = button.dataset.axis;
      press(buttons('axis'), 'axis', axis);
      syncTransform();
    });
  }

  for (const name of ['position', 'rotation', 'scale']) {
    ranges[name].element.addEventListener('input', (event) => syncRange(name, event.target.valueAsNumber));
  }

  canvas.addEventListener('keydown', (event) => {
    if (event.key === '+' || event.key === '=' || event.key === '-') {
      event.preventDefault();
      zoom(event.key === '-' ? 'out' : 'in');
      return;
    }
    if (view !== 'orbit' || !event.key.startsWith('Arrow')) return;
    event.preventDefault();
    const turn = .12;
    if (event.key === 'ArrowLeft') controls.rotateLeft(turn);
    if (event.key === 'ArrowRight') controls.rotateLeft(-turn);
    if (event.key === 'ArrowUp') controls.rotateUp(turn);
    if (event.key === 'ArrowDown') controls.rotateUp(-turn);
  });

  new ResizeObserver(resize).observe(viewport);
  resize();
  setView('orbit');
  setTime('day');
  select(activeId);
  viewport.setAttribute('aria-busy', 'false');
  message.hidden = true;
}

try {
  start();
} catch (error) {
  viewport.setAttribute('aria-busy', 'false');
  message.textContent = 'Adegan tidak dapat dibuka. Pastikan WebGL 2 aktif lalu muat ulang halaman.';
  for (const control of document.querySelectorAll('main button, main input')) control.disabled = true;
  console.error(error);
}
