// Three.js 3D Studio Stage for Kinetic Noir:
// Floats real product screenshots on angled glass planes over a reflective obsidian floor with brand-tinted rim bloom.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export function makeStage3D(canvas, { w = 1920, h = 1080, accent = '#6366F1', bg = '#07080D' } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setSize(w, h, false);
  renderer.setPixelRatio(1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(bg);
  scene.fog = new THREE.FogExp2(bg, 0.11);

  const cam = new THREE.PerspectiveCamera(34, w / h, 0.1, 40);
  cam.position.set(0, 0.35, 5.2);
  cam.lookAt(0, 0, 0);

  const composer = new EffectComposer(renderer);
  composer.setSize(w, h);
  const rp = new RenderPass(scene, cam);
  const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.28, 0.55, 0.82);
  composer.addPass(rp);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // Studio lights tinted by the product's brand accent
  const amb = new THREE.AmbientLight('#FFFFFF', 1.45);
  const key = new THREE.DirectionalLight('#FFFFFF', 2.4);
  key.position.set(3, 5, 4);
  const rim = new THREE.PointLight(accent, 14, 18, 1.5);
  rim.position.set(-2.4, 1.6, -1.6);
  const rim2 = new THREE.PointLight(accent, 9, 16, 1.5);
  rim2.position.set(2.8, -0.8, 1.8);
  scene.add(amb, key, rim, rim2);

  // Subtle floor grid + sheen plane
  const floorGeo = new THREE.PlaneGeometry(24, 24);
  const floorMat = new THREE.MeshStandardMaterial({ color: bg, roughness: 0.28, metalness: 0.65 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.45;
  scene.add(floor);

  const grid = new THREE.GridHelper(22, 36, accent, '#1E2233');
  grid.position.y = -1.44;
  grid.material.opacity = 0.22;
  grid.material.transparent = true;
  scene.add(grid);

  // Build rounded UI screen card + metallic bezel + subtle reflection below
  const group = new THREE.Group();
  scene.add(group);

  let screenMat = new THREE.MeshBasicMaterial({ color: '#111524' });
  const screenGeo = new THREE.PlaneGeometry(3.2, 1.8);
  const screenMesh = new THREE.Mesh(screenGeo, screenMat);
  screenMesh.position.z = 0.025;
  group.add(screenMesh);

  const bezelGeo = new THREE.BoxGeometry(3.32, 1.92, 0.04);
  const bezelMat = new THREE.MeshStandardMaterial({ color: '#171A26', roughness: 0.22, metalness: 0.85 });
  const bezel = new THREE.Mesh(bezelGeo, bezelMat);
  group.add(bezel);

  // Glowing accent trim ring behind the floating UI card
  const glowGeo = new THREE.PlaneGeometry(3.48, 2.08);
  const glowMat = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.22 });
  const glowPlane = new THREE.Mesh(glowGeo, glowMat);
  glowPlane.position.z = -0.025;
  group.add(glowPlane);

  // Subtle mirrored reflection mesh under the card
  const reflMat = new THREE.MeshBasicMaterial({ color: '#111524', transparent: true, opacity: 0.16 });
  const reflMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.8), reflMat);
  reflMesh.scale.y = -1;
  reflMesh.position.set(0, -2.05, 0.025);
  group.add(reflMesh);

  const textures = new Map();
  function useImage(img) {
    if (!img) return;
    let tex = textures.get(img);
    if (!tex) {
      tex = new THREE.Texture(img);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      tex.needsUpdate = true;
      textures.set(img, tex);
    }
    if (screenMat.map !== tex) {
      screenMat.map = tex;
      screenMat.color.set('#FFFFFF');
      screenMat.needsUpdate = true;
      reflMat.map = tex;
      reflMat.color.set('#FFFFFF');
      reflMat.needsUpdate = true;
    }
    const aspect = (img.width || 16) / (img.height || 9);
    const h0 = 1.85;
    const w0 = Math.min(3.5, Math.max(1.2, h0 * aspect));
    screenMesh.scale.set(w0 / 3.2, h0 / 1.8, 1);
    bezel.scale.set((w0 + 0.12) / 3.32, (h0 + 0.12) / 1.92, 1);
    glowPlane.scale.set((w0 + 0.26) / 3.48, (h0 + 0.26) / 2.08, 1);
    reflMesh.scale.set(w0 / 3.2, -h0 / 1.8, 1);
    reflMesh.position.y = -h0 - 0.16;
  }

  return {
    resize(nw, nh) {
      renderer.setSize(nw, nh, false);
      composer.setSize(nw, nh);
      bloom.setSize(nw, nh);
      cam.aspect = nw / nh;
      cam.updateProjectionMatrix();
    },
    render({ img, rotY = -0.22, rotX = 0.08, rotZ = 0, cardX = 0, cardY = 0.05, camPos = [0, 0.35, 5.2], lookAt = [0, 0, 0], fov = 34, bloomStrength = 0.28, glowAlpha = 0.22 } = {}) {
      if (img) useImage(img);
      if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
      cam.position.set(camPos[0], camPos[1], camPos[2]);
      cam.lookAt(lookAt[0], lookAt[1], lookAt[2]);
      group.position.set(cardX, cardY, 0);
      group.rotation.set(rotX, rotY, rotZ);
      glowMat.opacity = glowAlpha;
      bloom.strength = bloomStrength;
      composer.render();
    },
  };
}
