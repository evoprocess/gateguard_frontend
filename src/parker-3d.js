import * as THREE from 'three';

const colors = {
  white: 0xf3f7fb,
  blue: 0x0878d1,
  navy: 0x072d5a,
  cyan: 0x36d8ff,
  silver: 0x8fa9bb,
  dark: 0x041426
};

function mesh(geometry, material, position, scale = [1, 1, 1], parent) {
  const item = new THREE.Mesh(geometry, material);
  item.position.set(...position);
  item.scale.set(...scale);
  item.castShadow = true;
  item.receiveShadow = true;
  parent.add(item);
  return item;
}

function shieldShape() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 1.22);
  shape.lineTo(.88, .84);
  shape.lineTo(.75, -.42);
  shape.quadraticCurveTo(.52, -.92, 0, -1.2);
  shape.quadraticCurveTo(-.52, -.92, -.75, -.42);
  shape.lineTo(-.88, .84);
  shape.closePath();
  return shape;
}

export function createParker3D(canvas, shieldUrl) {
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const camera = new THREE.PerspectiveCamera(31, 1, .1, 100);
  camera.position.set(0, 2.25, 10.5);
  camera.lookAt(0, 2.05, 0);

  scene.add(new THREE.HemisphereLight(0xdff4ff, 0x08203e, 2.7));
  const key = new THREE.DirectionalLight(0xffffff, 4.2);
  key.position.set(4, 7, 7);
  scene.add(key);
  const rim = new THREE.PointLight(colors.cyan, 12, 15);
  rim.position.set(-4, 3, 4);
  scene.add(rim);

  const white = new THREE.MeshPhysicalMaterial({ color: colors.white, metalness: .35, roughness: .24, clearcoat: .8, clearcoatRoughness: .18 });
  const blue = new THREE.MeshPhysicalMaterial({ color: colors.blue, metalness: .55, roughness: .2, clearcoat: 1 });
  const navy = new THREE.MeshStandardMaterial({ color: colors.navy, metalness: .7, roughness: .25 });
  const silver = new THREE.MeshStandardMaterial({ color: colors.silver, metalness: .85, roughness: .22 });
  const dark = new THREE.MeshStandardMaterial({ color: colors.dark, metalness: .45, roughness: .22 });
  const glow = new THREE.MeshStandardMaterial({ color: colors.cyan, emissive: colors.cyan, emissiveIntensity: 3, metalness: .15, roughness: .15 });

  const parker = new THREE.Group();
  parker.scale.setScalar(.88);
  parker.rotation.y = -.12;
  scene.add(parker);

  mesh(new THREE.SphereGeometry(1.03, 40, 28), blue, [0, 3.18, 0], [1.05, .96, .92], parker);
  mesh(new THREE.SphereGeometry(.96, 40, 28), white, [0, 3.13, .25], [1, .84, .76], parker);
  mesh(new THREE.BoxGeometry(.42, .3, .18, 4, 3, 2), glow, [0, 4.02, .18], [1, 1, 1], parker).rotation.x = -.08;

  const eyeGeometry = new THREE.SphereGeometry(.21, 24, 18);
  const irisGeometry = new THREE.SphereGeometry(.105, 20, 14);
  const pupils = [];
  [-.36, .36].forEach(x => {
    const eye = mesh(eyeGeometry, dark, [x, 3.28, 1.02], [1, 1.22, .42], parker);
    const iris = mesh(irisGeometry, glow, [x, 3.28, 1.115], [1, 1.15, .28], parker);
    pupils.push(eye, iris);
  });
  mesh(new THREE.TorusGeometry(.25, .055, 10, 28, Math.PI), dark, [0, 2.93, 1.02], [1, .68, .35], parker).rotation.z = Math.PI;

  mesh(new THREE.SphereGeometry(.92, 32, 24), navy, [0, 1.82, 0], [1, 1.12, .68], parker);
  mesh(new THREE.SphereGeometry(.82, 32, 24), white, [0, 1.88, .34], [.9, 1, .52], parker);
  mesh(new THREE.BoxGeometry(.58, .5, .16, 3, 3, 2), blue, [0, 2.05, .84], [1, 1, 1], parker);
  mesh(new THREE.SphereGeometry(.18, 20, 16), glow, [0, 2.05, .96], [1, 1, .4], parker);

  [-1, 1].forEach(side => {
    mesh(new THREE.SphereGeometry(.38, 24, 18), blue, [side * .94, 2.25, .05], [1.2, .9, 1], parker);
  });

  const leftArm = new THREE.Group();
  leftArm.position.set(-1.03, 2.22, 0);
  leftArm.rotation.z = .22;
  parker.add(leftArm);
  mesh(new THREE.CapsuleGeometry(.22, .58, 8, 16), white, [0, -.48, 0], [1, 1, 1], leftArm);
  mesh(new THREE.SphereGeometry(.24, 20, 16), silver, [0, -.92, 0], [1, 1, 1], leftArm);
  mesh(new THREE.CapsuleGeometry(.2, .5, 8, 16), blue, [0, -1.25, .03], [1, 1, 1], leftArm);

  const waveArm = new THREE.Group();
  waveArm.position.set(1.05, 2.28, .02);
  waveArm.rotation.z = -.78;
  parker.add(waveArm);
  mesh(new THREE.CapsuleGeometry(.22, .54, 8, 16), white, [0, .42, 0], [1, 1, 1], waveArm);
  mesh(new THREE.SphereGeometry(.24, 20, 16), silver, [0, .86, 0], [1, 1, 1], waveArm);
  const forearm = new THREE.Group();
  forearm.position.set(0, .9, 0);
  forearm.rotation.z = -.28;
  waveArm.add(forearm);
  mesh(new THREE.CapsuleGeometry(.2, .5, 8, 16), blue, [0, .32, 0], [1, 1, 1], forearm);
  mesh(new THREE.SphereGeometry(.28, 24, 18), white, [0, .78, 0], [1.05, .85, .72], forearm);

  [-.48, .48].forEach(side => {
    mesh(new THREE.CapsuleGeometry(.27, .62, 8, 18), white, [side, .55, 0], [1, 1, 1], parker);
    mesh(new THREE.SphereGeometry(.24, 20, 16), blue, [side, .04, 0], [1, 1, 1], parker);
    mesh(new THREE.CapsuleGeometry(.3, .55, 8, 18), navy, [side, -.38, .08], [1, 1, 1], parker);
    mesh(new THREE.BoxGeometry(.72, .32, 1, 3, 2, 3), white, [side + side * .07, -.82, .25], [1, 1, 1], parker);
  });

  const shield = new THREE.Group();
  shield.position.set(-1.42, 1.16, .72);
  shield.rotation.set(-.05, .18, -.08);
  parker.add(shield);
  mesh(new THREE.ExtrudeGeometry(shieldShape(), { depth: .16, bevelEnabled: true, bevelSize: .07, bevelThickness: .06, bevelSegments: 3 }), silver, [0, 0, 0], [1, 1, 1], shield);
  const shieldFace = mesh(new THREE.ExtrudeGeometry(shieldShape(), { depth: .08, bevelEnabled: true, bevelSize: .03, bevelThickness: .025, bevelSegments: 2 }), navy, [0, 0, .17], [.86, .86, 1], shield);
  shieldFace.castShadow = false;
  const lockMark = new THREE.Group();
  lockMark.position.set(0, .03, .37);
  shield.add(lockMark);
  mesh(new THREE.BoxGeometry(.54, .43, .08), glow, [0, -.1, 0], [0, 0, 0], lockMark);
  mesh(new THREE.TorusGeometry(.23, .055, 12, 28, Math.PI), glow, [0, .15, 0], [0, 0, 0], lockMark);
  mesh(new THREE.SphereGeometry(.055, 16, 12), dark, [0, -.08, .05], [0, 0, 0], lockMark);
  mesh(new THREE.BoxGeometry(.055, .13, .055), dark, [0, -.17, .05], [0, 0, 0], lockMark);
  new THREE.TextureLoader().load(shieldUrl, texture => {
    texture.colorSpace = THREE.SRGBColorSpace;
    const emblem = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 1.05), new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }));
    emblem.position.set(0, .05, .31);
    shield.add(emblem);
  });

  let active = true;
  let frame = 0;
  const clock = new THREE.Clock();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const resize = () => {
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  const render = () => {
    if (!active) return;
    const time = clock.getElapsedTime();
    if (!reducedMotion) {
      parker.position.y = Math.sin(time * 1.5) * .06;
      parker.rotation.y = -.12 + Math.sin(time * .7) * .1;
      waveArm.rotation.z = -.78 + Math.sin(time * 2.6) * .1;
      forearm.rotation.z = -.28 + Math.sin(time * 3.1) * .13;
      const blink = time % 4.2 < .12 ? .12 : 1;
      pupils.forEach(part => { part.scale.y = blink * (part.userData.baseScaleY || part.scale.y); });
    }
    renderer.render(scene, camera);
    frame = requestAnimationFrame(render);
  };

  pupils.forEach(part => { part.userData.baseScaleY = part.scale.y; });
  render();

  return {
    setActive(value) {
      active = value;
      cancelAnimationFrame(frame);
      if (active) { clock.start(); render(); }
    },
    destroy() {
      active = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.dispose();
    }
  };
}
