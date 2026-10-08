import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

function signTexture(title, subtitle, active, logoUrl = '') {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 180;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, active ? '#eaf6ff' : '#d5dce3');
  gradient.addColorStop(1, active ? '#a9d7f7' : '#909ca8');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = active ? '#168cff' : '#667686'; ctx.lineWidth = 8; ctx.strokeRect(5, 5, 502, 170);
  ctx.fillStyle = '#102237'; ctx.textAlign = 'center'; ctx.font = '700 40px Arial'; ctx.fillText(title, 256, 78, 450);
  ctx.fillStyle = active ? '#075fa9' : '#4e5b68'; ctx.font = '600 25px Arial'; ctx.fillText(subtitle, 256, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  if (active && logoUrl) {
    const image = new Image();
    image.onload = () => {
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#168cff'; ctx.lineWidth = 8; ctx.strokeRect(5, 5, 502, 170);
      const ratio = Math.min(110 / image.width, 110 / image.height);
      const width = image.width * ratio; const height = image.height * ratio;
      ctx.drawImage(image, 22 + (110 - width) / 2, 35 + (110 - height) / 2, width, height);
      ctx.fillStyle = '#102237'; ctx.textAlign = 'left'; ctx.font = '700 35px Arial'; ctx.fillText(title, 155, 78, 330);
      ctx.fillStyle = '#075fa9'; ctx.font = '600 23px Arial'; ctx.fillText(subtitle, 155, 126, 330);
      texture.needsUpdate = true;
    };
    image.src = logoUrl;
  }
  return texture;
}

export function bindFirstPersonDirectory(app, openLogin, directory) {
  const container = app.querySelector('.locator-game');
  const prompt = document.createElement('div');
  prompt.className = 'game-prompt fps-prompt';
  const start = document.createElement('button');
  start.className = 'fps-start';
  start.innerHTML = '<b>Entrar no ambiente 3D</b><span>Clique para controlar a câmera com o mouse</span>';
  const enterButton = document.createElement('button');
  enterButton.id = 'enter-store';
  enterButton.className = 'fps-enter-store';
  enterButton.type = 'button';
  enterButton.innerHTML = '<span>⌾</span><b>ENTRAR</b><small>Espaço ou Enter</small>';
  enterButton.hidden = true;
  enterButton.disabled = true;
  container.innerHTML = '';
  container.append(start, prompt, enterButton);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xdce8f2);
  scene.fog = new THREE.Fog(0xdce8f2, 28, 62);
  const camera = new THREE.PerspectiveCamera(70, 1, .1, 100);
  camera.position.set(0, 1.7, 4);
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.setAttribute('aria-label', 'Ambiente tridimensional das organizações parceiras');
  container.prepend(renderer.domElement);
  const controls = new PointerLockControls(camera, renderer.domElement);
  const timer = new THREE.Timer();
  timer.connect(document);
  const keys = { forward: false, backward: false, left: false, right: false };
  const stores = [];
  let floorId = 1;
  let nearby = null;
  let runningTo = null;
  let lockedAtRunDestination = false;

  scene.add(new THREE.HemisphereLight(0xffffff, 0x7f96aa, 2.7));
  scene.add(new THREE.AmbientLight(0xffffff, 1.15));
  const mainLight = new THREE.DirectionalLight(0xffffff, 2.5);
  mainLight.position.set(2, 8, 4); mainLight.castShadow = true; scene.add(mainLight);
  const blueLight = new THREE.PointLight(0x59b8ff, 13, 27, 2);
  blueLight.position.set(0, 2.6, -12); scene.add(blueLight);

  const materials = {
    floor: new THREE.MeshStandardMaterial({ color: 0x617b91, metalness: .42, roughness: .52 }),
    ceiling: new THREE.MeshStandardMaterial({ color: 0xf4f7fa, metalness: .18, roughness: .68 }),
    wall: new THREE.MeshStandardMaterial({ color: 0xd2dce5, metalness: .12, roughness: .72 }),
    door: new THREE.MeshStandardMaterial({ color: 0x0b2842, metalness: .72, roughness: .22, emissive: 0x06274a, emissiveIntensity: .45 }),
    blocked: new THREE.MeshStandardMaterial({ color: 0x58636d, metalness: .4, roughness: .7 })
  };
  const architecture = new THREE.Group(); scene.add(architecture);
  const shops = new THREE.Group(); scene.add(shops);
  const staircase = new THREE.Group(); scene.add(staircase);
  let stairCooldown = 0;

  const box = (width, height, depth, material, x, y, z) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.position.set(x, y, z); mesh.receiveShadow = true; mesh.castShadow = true; architecture.add(mesh); return mesh;
  };
  box(10, .18, 48, materials.floor, 0, -.1, -18);
  box(10, .15, 48, materials.ceiling, 0, 4.3, -18);
  box(.25, 4.4, 48, materials.wall, -5, 2.1, -18);
  box(.25, 4.4, 48, materials.wall, 5, 2.1, -18);
  for (let z = 4; z > -43; z -= 4) {
    box(9.7, .025, .045, new THREE.MeshBasicMaterial({ color: 0x91a9bd }), 0, .015, z);
  }
  for (let z = 2; z > -42; z -= 6) {
    const strip = box(7.5, .04, .12, new THREE.MeshBasicMaterial({ color: 0x8bd1ff }), 0, 4.2, z);
    strip.castShadow = false;
  }

  function buildStaircase(id) {
    while (staircase.children.length) {
      const child = staircase.children.pop();
      child.geometry?.dispose(); child.material?.dispose();
    }
    const stepMaterial = new THREE.MeshStandardMaterial({ color: 0x708ba1, metalness: .48, roughness: .42 });
    const direction = id === 1 ? 1 : -1;
    for (let index = 0; index < 9; index += 1) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(3.2, .22 + index * .23, .72), stepMaterial);
      step.position.set(0, direction * index * .115, -38.2 - index * .68);
      step.castShadow = true; step.receiveShadow = true; staircase.add(step);
    }
    const landing = new THREE.Mesh(new THREE.BoxGeometry(3.7, .25, 2), stepMaterial);
    landing.position.set(0, direction * 1.12, -44); staircase.add(landing);
    const label = new THREE.Mesh(new THREE.PlaneGeometry(3.4, .9), new THREE.MeshBasicMaterial({
      map: signTexture(id === 1 ? 'ESCADA ↑' : 'ESCADA ↓', id === 1 ? 'ACESSO AO PISO 2' : 'ACESSO AO PISO 1', true)
    }));
    label.position.set(0, 2.7, -45.02); staircase.add(label);
    const railMaterial = new THREE.MeshStandardMaterial({ color: 0xb8c6d3, metalness: .9, roughness: .18 });
    [-1.75, 1.75].forEach(x => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(.08, .08, 7), railMaterial);
      rail.position.set(x, direction * 1.35, -41); rail.rotation.x = direction * -.17; staircase.add(rail);
    });
  }

  function renderFloor(id, arrivalByStairs = false) {
    floorId = id; stores.length = 0;
    while (shops.children.length) {
      const child = shops.children.pop();
      child.traverse(item => { item.geometry?.dispose(); if (item.material?.map) item.material.map.dispose(); item.material?.dispose(); });
    }
    const systems = directory.floors.find(floor => floor.id === id)?.systems || [];
    systems.forEach((system, index) => {
      let side;
      let z;
      if (id === 1 && system.id === 'SIS_0000') {
        side = -1; z = -5;
      } else if (id === 1 && system.id === 'SIS_0001') {
        side = -1; z = -13;
      } else if (id === 1) {
        const slot = index - 2;
        side = slot % 2 === 0 ? 1 : -1;
        z = -13 - Math.floor((slot + 1) / 2) * 8;
      } else {
        side = index % 2 === 0 ? -1 : 1;
        z = -5 - Math.floor(index / 2) * 11;
      }
      const group = new THREE.Group();
      const gateGuardStore = system.id === 'SIS_0000';
      const frame = new THREE.Mesh(new THREE.BoxGeometry(gateGuardStore ? 3.55 : 2.8, 3.2, .45), new THREE.MeshStandardMaterial({ color: 0xf0f3f6, metalness: .38, roughness: .4 }));
      const doorMaterial = system.status === 'active' ? materials.door.clone() : materials.blocked.clone();
      const doors = [];
      if (gateGuardStore) {
        [-.44, .44].forEach(x => {
          const door = new THREE.Mesh(new THREE.BoxGeometry(.82, 2.35, .18), doorMaterial.clone());
          door.position.set(x, -.35, .31);
          doors.push(door);
        });
      } else {
        const door = new THREE.Mesh(new THREE.BoxGeometry(1.65, 2.35, .18), doorMaterial);
        door.position.set(0, -.35, .31);
        doors.push(door);
      }
      const active = system.status === 'active';
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.45, .86), new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        map: signTexture(
          active ? system.name : 'Em construção...',
          active ? 'ENTRADA' : 'AGUARDE NOVIDADES',
          active,
          active ? system.id === 'SIS_0000'
            ? `${import.meta.env.BASE_URL}imagens_pub/gateguard_logo.png`
            : system.logo ? `${import.meta.env.BASE_URL}${system.logo}` : ''
          : ''
        )
      }));
      sign.position.set(0, 1.75, .25);
      if (side < 0) { group.rotation.y = Math.PI / 2; group.position.set(-4.72, 1.65, z); }
      else { group.rotation.y = -Math.PI / 2; group.position.set(4.72, 1.65, z); }
      group.add(frame, ...doors, sign); group.userData = { system, position: new THREE.Vector3(side * 4.15, 1.7, z) };
      group.traverse(item => { item.castShadow = true; item.receiveShadow = true; });
      shops.add(group); stores.push(group);
      if (system.status === 'active') {
        const glow = new THREE.PointLight(0x168cff, 7, 6, 2);
        glow.position.set(side * 3.9, 2, z); shops.add(glow);
      }
    });
    buildStaircase(id);
    camera.position.set(0, 1.7, arrivalByStairs ? -34 : 4);
    camera.rotation.set(0, arrivalByStairs ? Math.PI : 0, 0);
    stairCooldown = performance.now() + 1400;
    const floorLabel = app.querySelector('#current-floor-label');
    if (floorLabel) floorLabel.textContent = `Piso ${id}`;
    prompt.textContent = `Piso ${id} — caminhe até uma porta`;
  }

  function enterNearby(target = nearby) {
    if (target?.system.status === 'active') {
      controls.unlock();
      openLogin(target.system.id, target.system.name, target.system.publicUrl, ({ reason } = {}) => {
        if (!container.isConnected) return;
        if (reason === 'escape') start.hidden = false;
        else controls.lock();
      });
    }
  }
  const keyState = (event, pressed) => {
    if (controls.isLocked && ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    if (lockedAtRunDestination && !['Enter', 'Space'].includes(event.code)) return;
    if (['KeyW', 'ArrowUp'].includes(event.code)) keys.forward = pressed;
    if (['KeyS', 'ArrowDown'].includes(event.code)) keys.backward = pressed;
    if (['KeyA', 'ArrowLeft'].includes(event.code)) keys.left = pressed;
    if (['KeyD', 'ArrowRight'].includes(event.code)) keys.right = pressed;
    if (pressed && ['Enter', 'Space'].includes(event.code)) enterNearby();
  };
  const onKeyDown = event => keyState(event, true);
  const onKeyUp = event => keyState(event, false);
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
  start.onclick = () => controls.lock();
  renderer.domElement.addEventListener('click', () => {
    if (!controls.isLocked) controls.lock();
  });
  const stopPageScroll = event => { if (controls.isLocked) event.preventDefault(); };
  controls.addEventListener('lock', () => {
    start.hidden = true;
    container.classList.add('is-playing');
    container.focus({ preventScroll: true });
    document.addEventListener('wheel', stopPageScroll, { passive: false });
  });
  controls.addEventListener('unlock', () => {
    lockedAtRunDestination = false;
    controls.enabled = true;
    container.classList.remove('is-playing');
    document.removeEventListener('wheel', stopPageScroll);
    Object.keys(keys).forEach(key => { keys[key] = false; });
    if (container.isConnected && !app.querySelector('.login-modal')) start.hidden = false;
  });
  enterButton.onclick = enterNearby;
  const searchForm = app.querySelector('#store-search-form');
  const searchInput = app.querySelector('#store-search');
  const searchFeedback = app.querySelector('#store-search-feedback');
  searchForm.onsubmit = event => {
    event.preventDefault();
    const query = searchInput.value.trim().toLocaleLowerCase('pt-BR');
    const floor = directory.floors.find(item => item.systems.some(system => system.status === 'active' && system.name.toLocaleLowerCase('pt-BR') === query));
    const system = floor?.systems.find(item => item.status === 'active' && item.name.toLocaleLowerCase('pt-BR') === query);
    if (!system) {
      searchFeedback.textContent = 'Selecione uma organização disponível na lista de sugestões.';
      searchFeedback.classList.add('is-error');
      return;
    }
    if (floor.id !== floorId) {
      searchFeedback.textContent = `${system.name} fica no Piso ${floor.id}. Use a escada para chegar até lá.`;
      searchFeedback.classList.remove('is-error');
      return;
    }
    const store = stores.find(item => item.userData.system.id === system.id);
    if (!store) return;
    if (!controls.isLocked) controls.lock();
    lockedAtRunDestination = false;
    controls.enabled = true;
    Object.keys(keys).forEach(key => { keys[key] = false; });
    runningTo = {
      store: store.userData,
      destination: new THREE.Vector3(store.userData.position.x > 0 ? .75 : -.75, 1.7, store.userData.position.z)
    };
    searchFeedback.textContent = `Correndo até ${system.name}...`;
    searchFeedback.classList.remove('is-error');
    prompt.textContent = `Indo até ${system.name}...`;
  };

  function resize() {
    const width = container.clientWidth; const height = container.clientHeight;
    renderer.setSize(width, height, false); camera.aspect = width / Math.max(height, 1); camera.updateProjectionMatrix();
  }
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(container); resize();

  function animate(timestamp) {
    if (!container.isConnected) {
      document.removeEventListener('keydown', onKeyDown); document.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('wheel', stopPageScroll);
      resizeObserver.disconnect(); controls.unlock(); timer.dispose(); renderer.dispose(); return;
    }
    requestAnimationFrame(animate);
    timer.update(timestamp);
    const delta = Math.min(timer.getDelta(), .05);
    if (runningTo) {
      const offset = runningTo.destination.clone().sub(camera.position);
      const remaining = offset.length();
      if (remaining > .16) {
        const step = Math.min(remaining, 9.5 * delta);
        camera.position.addScaledVector(offset.normalize(), step);
        camera.position.y = 1.7 + Math.sin(performance.now() * .025) * .045;
        camera.lookAt(runningTo.store.position);
      } else {
        camera.position.copy(runningTo.destination);
        camera.lookAt(runningTo.store.position);
        nearby = runningTo.store;
        searchFeedback.textContent = '';
        prompt.textContent = 'Espaço / Enter para entrar · Esc para sair da navegação';
        runningTo = null;
        lockedAtRunDestination = true;
        controls.enabled = false;
        Object.keys(keys).forEach(key => { keys[key] = false; });
        start.hidden = true;
      }
    } else if (controls.isLocked && !lockedAtRunDestination) {
      const speed = 4.6 * delta;
      if (keys.forward) controls.moveForward(speed);
      if (keys.backward) controls.moveForward(-speed);
      if (keys.left) controls.moveRight(-speed);
      if (keys.right) controls.moveRight(speed);
      camera.position.x = THREE.MathUtils.clamp(camera.position.x, -3.65, 3.65);
      camera.position.z = THREE.MathUtils.clamp(camera.position.z, -39.35, 5);
      const stairProgress = THREE.MathUtils.clamp((-camera.position.z - 37) / 2.35, 0, 1);
      camera.position.y = 1.7 + stairProgress * (floorId === 1 ? 1.05 : -.8);
      if (camera.position.z < -39.2 && Math.abs(camera.position.x) < 2.1 && performance.now() > stairCooldown) {
        renderFloor(floorId === 1 ? 2 : 1, true);
        prompt.textContent = floorId === 2 ? 'Você subiu para o Piso 2' : 'Você desceu para o Piso 1';
      }
    }
    nearby = null; let distance = Infinity;
    stores.forEach(store => {
      const current = camera.position.distanceTo(store.userData.position);
      if (current < distance) { distance = current; nearby = store.userData; }
    });
    const available = distance < 3.8;
    if (!available) nearby = null;
    enterButton.disabled = !(nearby?.system.status === 'active');
    enterButton.hidden = enterButton.disabled;
    prompt.textContent = nearby
      ? nearby.system.status === 'active'
        ? 'Espaço / Enter para entrar · Esc para sair da navegação'
        : 'Sala em construção · Esc para sair da navegação'
      : `Piso ${floorId} — use WASD e o mouse${controls.isLocked ? ' · Aperte ESC para sair' : ''}`;
    renderer.render(scene, camera);
  }
  renderFloor(1); animate();
}
