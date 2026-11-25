// Transparent Alpha Three.js 3D Stage — Floating Rounded macOS Windows Over Living Sky
// Zero tron GridHelpers, zero opaque background overwrites, zero muddy grey lighting.
import * as THREE from 'three';
import { clamp, lerp, eo, rr, drawCover } from './lib.js';

function makeShadowTexture() {
  const cv = document.createElement('canvas');
  cv.width = 512;
  cv.height = 384;
  const c = cv.getContext('2d');
  c.clearRect(0, 0, 512, 384);
  c.save();
  c.shadowColor = 'rgba(12,14,22,0.42)';
  c.shadowBlur = 52;
  c.shadowOffsetY = 18;
  rr(c, 58, 42, 396, 282, 24);
  c.fillStyle = 'rgba(12,14,22,0.52)';
  c.fill();
  c.restore();
  // Carve inner body slightly softer so edge shadow glows cleanly
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

class MacWindow3D {
  constructor(renderer, aspect = 1.44, baseW = 3.15) {
    this.texW = 1280;
    this.texH = Math.round(1280 / aspect);
    this.cv = document.createElement('canvas');
    this.cv.width = this.texW;
    this.cv.height = this.texH;
    this.ctx = this.cv.getContext('2d');

    this.tex = new THREE.CanvasTexture(this.cv);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.tex.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());
    this.tex.minFilter = THREE.LinearMipmapLinearFilter;
    this.tex.magFilter = THREE.LinearFilter;

    this.group = new THREE.Group();
    const h = baseW / aspect;

    // Soft floating shadow quad behind the window
    const shadowMat = new THREE.MeshBasicMaterial({
      map: makeShadowTexture(),
      transparent: true,
      depthWrite: false,
      opacity: 0.78,
    });
    this.shadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(baseW * 1.24, h * 1.28), shadowMat);
    this.shadowMesh.position.set(0, -0.09, -0.08);
    this.group.add(this.shadowMesh);

    // Main crisp rounded macOS window plane
    const mat = new THREE.MeshBasicMaterial({
      map: this.tex,
      transparent: true,
      side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(baseW, h), mat);
    this.group.add(this.mesh);
  }

  paint({
    img = null,
    afterImg = null,
    wipeP = 0,
    wipeColor = '#FF9E8A',
    title = '',
    badge = '',
    badgeBg = '#15803D',
    badgeFg = '#FFFFFF',
    chromeDark = true,
    panX = 0.5,
    panY = 0.0,
    zoom = 1.0,
    highlightRing = 0,
    fallbackBg = '#FAF9F7',
    drawCustom = null,
  } = {}) {
    const c = this.ctx;
    const W = this.texW, H = this.texH;
    const r = 28;
    const barH = 58;

    c.clearRect(0, 0, W, H);
    c.save();
    rr(c, 2, 2, W - 4, H - 4, r);
    c.clip();

    // Base fill
    c.fillStyle = fallbackBg;
    c.fillRect(0, 0, W, H);

    // Body area beneath macOS titlebar
    const by = barH;
    const bh = H - barH;
    c.save();
    c.beginPath();
    c.rect(0, by, W, bh);
    c.clip();

    if (drawCustom) {
      drawCustom(c, 0, by, W, bh);
    } else if (img) {
      drawCover(c, img, 0, by, W, bh, { panX, panY, zoom });
    }

    // Real-time luminous optical scan-wipe into afterImg inside the 3D window
    if (afterImg && wipeP > 0.001) {
      const splitX = Math.round(W * clamp(wipeP));
      c.save();
      c.beginPath();
      c.rect(0, by, splitX, bh);
      c.clip();
      drawCover(c, afterImg, 0, by, W, bh, { panX, panY, zoom });
      c.restore();

      if (wipeP > 0.01 && wipeP < 0.995) {
        // Soft optical beam trail + crisp luminous edge
        const grad = c.createLinearGradient(splitX - 96, 0, splitX + 12, 0);
        grad.addColorStop(0, 'rgba(255,158,138,0)');
        grad.addColorStop(0.75, 'rgba(255,158,138,0.22)');
        grad.addColorStop(1, 'rgba(255,255,255,0.75)');
        c.fillStyle = grad;
        c.fillRect(splitX - 96, by, 108, bh);

        c.fillStyle = wipeColor;
        c.fillRect(splitX - 3, by, 6, bh);
        c.fillStyle = '#FFFFFF';
        c.fillRect(splitX - 1, by, 2, bh);
      }
    }
    c.restore();

    // macOS Titlebar
    c.fillStyle = chromeDark ? '#151514' : '#F4F3F0';
    c.fillRect(0, 0, W, barH);
    c.fillStyle = chromeDark ? 'rgba(255,255,255,0.08)' : 'rgba(17,17,16,0.08)';
    c.fillRect(0, barH - 1, W, 1);

    // 3 crisp macOS traffic lights
    const dots = ['#FF5F56', '#FFBD2E', '#27C93F'];
    dots.forEach((col, i) => {
      c.beginPath();
      c.arc(28 + i * 24, barH / 2, 7.2, 0, Math.PI * 2);
      c.fillStyle = col;
      c.fill();
    });

    // Centered window title
    if (title) {
      c.font = '600 21px "Inter", "DM Sans", sans-serif';
      c.fillStyle = chromeDark ? 'rgba(250,249,247,0.88)' : 'rgba(17,17,16,0.84)';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(title, W / 2, barH / 2 + 1);
    }

    // Optional right-aligned telemetry pill (e.g. "46/100" or "94/100")
    if (badge) {
      c.font = '700 18px "JetBrains Mono", monospace';
      const tw = c.measureText(badge).width;
      const pw = tw + 26, ph = 30;
      const px = W - pw - 20, py = (barH - ph) / 2;
      rr(c, px, py, pw, ph, ph / 2);
      c.fillStyle = badgeBg;
      c.fill();
      c.fillStyle = badgeFg;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(badge, px + pw / 2, py + ph / 2 + 0.5);
    }

    // Crisp outer glass specular bevel border
    c.restore();
    rr(c, 2.5, 2.5, W - 5, H - 5, r);
    c.strokeStyle = highlightRing > 0.05
      ? wipeColor
      : (chromeDark ? 'rgba(255,255,255,0.34)' : 'rgba(17,17,16,0.16)');
    c.lineWidth = highlightRing > 0.05 ? 4.5 : 2.5;
    c.stroke();

    this.tex.needsUpdate = true;
  }
}

export function makeCinemaStage3D(canvas, { w = 1920, h = 1080 } = {}) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    premultipliedAlpha: false,
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(1);
  renderer.setSize(w, h, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = null; // CRITICAL: preserves alpha transparency over sky canvas!

  const cam = new THREE.PerspectiveCamera(34, w / h, 0.1, 80);
  cam.position.set(0, 0.05, 5.4);
  cam.lookAt(0, 0, 0);

  const leftWin = new MacWindow3D(renderer, 1.42, 2.95);
  const rightWin = new MacWindow3D(renderer, 1.42, 2.95);
  const heroWin = new MacWindow3D(renderer, 1.56, 3.85);
  scene.add(leftWin.group, rightWin.group, heroWin.group);

  const fanWins = Array.from({ length: 4 }, () => {
    const fw = new MacWindow3D(renderer, 1.45, 2.3);
    fw.group.visible = false;
    scene.add(fw.group);
    return fw;
  });

  function resize(nw, nh) {
    renderer.setSize(nw, nh, false);
    cam.aspect = nw / nh;
    cam.updateProjectionMatrix();
  }

  function renderDualCompare({
    left = {},
    right = {},
    t = 0,
    portrait = false,
    enterP = 1,
    spread = 1.48,
    angle = 0.20,
    orbitX = 0,
    camZ = 6.15,
    fov = 34,
  } = {}) {
    heroWin.group.visible = false;
    fanWins.forEach((f) => { f.group.visible = false; });
    leftWin.group.visible = true;
    rightWin.group.visible = true;

    leftWin.paint(left);
    rightWin.paint(right);

    const ep = eo(clamp(enterP));
    const floatA = Math.sin(t * 1.45) * 0.035;
    const floatB = Math.cos(t * 1.45 + 0.6) * 0.035;

    if (portrait) {
      const spY = lerp(1.9, 1.18, ep);
      leftWin.group.position.set(0, spY + floatA, 0);
      leftWin.group.rotation.set(0.08, 0.12, 0);
      leftWin.group.scale.setScalar(lerp(0.86, 0.88, ep));

      rightWin.group.position.set(0, -spY + floatB, 0.12);
      rightWin.group.rotation.set(-0.08, -0.12, 0);
      rightWin.group.scale.setScalar(lerp(0.86, 0.88, ep));
    } else {
      const sp = lerp(spread * 1.28, spread, ep);
      leftWin.group.position.set(-sp, 0.08 + floatA, lerp(-0.55, 0, ep));
      leftWin.group.rotation.set(0.025, angle, -0.012);
      leftWin.group.scale.setScalar(lerp(0.92, 1.0, ep));

      rightWin.group.position.set(sp, 0.08 + floatB, lerp(-0.55, 0.06, ep));
      rightWin.group.rotation.set(0.025, -angle, 0.012);
      rightWin.group.scale.setScalar(lerp(0.92, 1.0, ep));
    }

    cam.fov = fov;
    cam.updateProjectionMatrix();
    cam.position.set(orbitX, 0.04, portrait ? camZ + 1.85 : camZ);
    cam.lookAt(0, 0.04, 0);
    renderer.render(scene, cam);
  }

  function renderSingleHero({
    spec = {},
    t = 0,
    rotY = -0.14,
    rotX = 0.04,
    camZ = 4.9,
    scale = 1,
    portrait = false,
  } = {}) {
    leftWin.group.visible = false;
    rightWin.group.visible = false;
    fanWins.forEach((f) => { f.group.visible = false; });
    heroWin.group.visible = true;

    heroWin.paint(spec);
    heroWin.group.position.set(0, Math.sin(t * 1.4) * 0.03, 0);
    heroWin.group.rotation.set(rotX, rotY, 0);
    heroWin.group.scale.setScalar(portrait ? scale * 0.68 : scale);

    cam.fov = 34;
    cam.updateProjectionMatrix();
    cam.position.set(0, 0, portrait ? camZ + 1.2 : camZ);
    cam.lookAt(0, 0, 0);
    renderer.render(scene, cam);
  }

  function renderFanStack({ cards = [], t = 0, spreadP = 1, camZ = 5.8, portrait = false } = {}) {
    leftWin.group.visible = false;
    rightWin.group.visible = false;
    heroWin.group.visible = false;

    const n = Math.min(cards.length, fanWins.length);
    const sp = eo(clamp(spreadP));
    for (let i = 0; i < fanWins.length; i++) {
      const fw = fanWins[i];
      if (i >= n) { fw.group.visible = false; continue; }
      fw.group.visible = true;
      fw.paint(cards[i]);
      const mid = (n - 1) / 2;
      const d = i - mid;
      fw.group.position.set(
        d * lerp(0.4, portrait ? 0.95 : 1.55, sp),
        Math.sin(t * 1.5 + i) * 0.04 - Math.abs(d) * 0.08 * sp,
        -Math.abs(d) * 0.42 * sp,
      );
      fw.group.rotation.set(0.03, -d * 0.24 * sp, -d * 0.03 * sp);
      fw.group.scale.setScalar(portrait ? 0.72 : 0.95);
    }

    cam.fov = 35;
    cam.updateProjectionMatrix();
    cam.position.set(0, 0, portrait ? camZ + 1.6 : camZ);
    cam.lookAt(0, 0, 0);
    renderer.render(scene, cam);
  }

  return {
    canvas,
    resize,
    renderDualCompare,
    renderSingleHero,
    renderFanStack,
  };
}
