/* ============================================================
   VAAPS — hero 3D scene (Three.js, module)
   Floating abstract shapes + particle field that react to the
   mouse (parallax + magnetic pull). Performance-guarded:
   capped DPR, reduced particles on mobile, pauses when the tab
   is hidden or the hero is off-screen, single static frame when
   prefers-reduced-motion is set.
   ============================================================ */
import * as THREE from "three";

(function initHeroScene() {
  const canvas = document.getElementById("heroCanvas");
  if (!canvas || typeof THREE === "undefined") return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.matchMedia("(max-width: 760px)").matches;

  // Renderer — cap DPR for perf (2 desktop / 1.5 mobile)
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
  renderer.setClearColor(0x050810, 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050810, 0.028);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.set(0, 0, 14);

  // ---- Lighting: soft ambient + colored key lights ----
  scene.add(new THREE.AmbientLight(0x334466, 1.4));
  const keyBlue = new THREE.PointLight(0x00b4ff, 120, 60);
  keyBlue.position.set(-8, 5, 6);
  scene.add(keyBlue);
  const keyViolet = new THREE.PointLight(0x7b61ff, 140, 60);
  keyViolet.position.set(8, -4, 4);
  scene.add(keyViolet);
  const rimCyan = new THREE.DirectionalLight(0x7de9ff, 0.7);
  rimCyan.position.set(0, 8, -6);
  scene.add(rimCyan);
  // Cursor light — follows the mouse so shapes glint as you move
  const mouseLight = new THREE.PointLight(0x9fd8ff, 55, 30);
  mouseLight.position.set(0, 0, 3);
  scene.add(mouseLight);

  // ---- Floating abstract shapes ----
  const shapes = new THREE.Group();
  scene.add(shapes);

  const matBlue = new THREE.MeshStandardMaterial({ color: 0x0a2540, emissive: 0x00b4ff, emissiveIntensity: 0.35, roughness: 0.35, metalness: 0.7 });
  const matViolet = new THREE.MeshStandardMaterial({ color: 0x1a1440, emissive: 0x7b61ff, emissiveIntensity: 0.4, roughness: 0.35, metalness: 0.7 });
  const matGlass = new THREE.MeshStandardMaterial({ color: 0x7de9ff, emissive: 0x7de9ff, emissiveIntensity: 0.25, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.85 });
  const matWire = new THREE.MeshBasicMaterial({ color: 0x00b4ff, wireframe: true, transparent: true, opacity: 0.22 });

  const floaters = [];
  function addFloater(mesh, basePos, rotSpeed, floatAmp, floatSpeed, floatOffset) {
    mesh.position.copy(basePos);
    mesh.userData = { basePos: basePos.clone(), rotSpeed, floatAmp, floatSpeed, floatOffset };
    shapes.add(mesh);
    floaters.push(mesh);
    return mesh;
  }

  // Hero torus knot (signature piece, right of center)
  addFloater(
    new THREE.Mesh(new THREE.TorusKnotGeometry(2.1, 0.55, 160, 24), matViolet),
    new THREE.Vector3(5.4, 0.6, -2), new THREE.Vector3(0.0016, 0.0022, 0.001), 0.45, 0.5, 0
  );
  // Wireframe shell around the knot
  addFloater(
    new THREE.Mesh(new THREE.TorusKnotGeometry(2.1, 0.55, 80, 12), matWire),
    new THREE.Vector3(5.4, 0.6, -2), new THREE.Vector3(-0.0012, -0.0016, 0.0018), 0.45, 0.5, 0.4
  );
  // Icosahedron cluster (left side)
  addFloater(
    new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 0), matBlue),
    new THREE.Vector3(-5.6, 1.4, -3), new THREE.Vector3(0.002, 0.0028, 0.0012), 0.55, 0.42, 1.3
  );
  addFloater(
    new THREE.Mesh(new THREE.OctahedronGeometry(0.9, 0), matGlass),
    new THREE.Vector3(-3.4, -2.4, -1.5), new THREE.Vector3(0.003, 0.0018, 0.0024), 0.4, 0.6, 2.1
  );
  // Rings
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.06, 16, 90), matGlass);
  ring1.rotation.x = Math.PI / 2.4;
  addFloater(ring1, new THREE.Vector3(0.5, 2.6, -5), new THREE.Vector3(0, 0.0025, 0.001), 0.3, 0.35, 0.8);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.05, 16, 80), matWire);
  ring2.rotation.x = Math.PI / 3;
  addFloater(ring2, new THREE.Vector3(-1.5, -3.2, -4), new THREE.Vector3(0.0015, 0, -0.002), 0.35, 0.45, 2.8);

  // Small scattered satellites
  const satGeo = new THREE.IcosahedronGeometry(0.28, 0);
  for (let i = 0; i < (isMobile ? 6 : 12); i++) {
    const sat = new THREE.Mesh(satGeo, i % 2 ? matGlass : matBlue);
    const angle = (i / 12) * Math.PI * 2;
    addFloater(
      sat,
      new THREE.Vector3(Math.cos(angle) * (6.5 + Math.random() * 3), (Math.random() - 0.5) * 7, -4 - Math.random() * 4),
      new THREE.Vector3(0.004, 0.005, 0.003), 0.5, 0.55, Math.random() * 6.28
    );
  }

  // ---- Particle field ----
  const particleCount = isMobile ? 220 : 520;
  const pGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 30;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 18;
    positions[i * 3 + 2] = -2 - Math.random() * 12;
  }
  pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const pMat = new THREE.PointsMaterial({
    color: 0x7de9ff, size: 0.055, transparent: true, opacity: 0.65,
    sizeAttenuation: true, depthWrite: false
  });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  // ---- Mouse interaction: parallax + magnetic pull ----
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  if (!reducedMotion) {
    window.addEventListener("pointermove", (e) => {
      mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.ty = -((e.clientY / window.innerHeight) * 2 - 1);
    }, { passive: true });
  }

  // ---- Sizing ----
  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  // ---- Render loop with visibility guards ----
  let running = true;
  let heroVisible = true;
  let firstFrame = true;

  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running && !reducedMotion) requestAnimationFrame(tick);
  });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      heroVisible = entries[0].isIntersecting;
      if (heroVisible && running && !reducedMotion) requestAnimationFrame(tick);
    }, { threshold: 0.02 }).observe(canvas);
  }

  const clock = new THREE.Clock();

  function renderFrame(t) {
    // Gentle float + slow rotation per object
    for (const m of floaters) {
      const u = m.userData;
      m.rotation.x += u.rotSpeed.x;
      m.rotation.y += u.rotSpeed.y;
      m.rotation.z += u.rotSpeed.z;
      m.position.y = u.basePos.y + Math.sin(t * u.floatSpeed + u.floatOffset) * u.floatAmp;
    }
    particles.rotation.y = t * 0.012;

    // Smooth mouse follow (lerped): parallax on camera, magnetic pull on shape group
    mouse.x += (mouse.tx - mouse.x) * 0.045;
    mouse.y += (mouse.ty - mouse.y) * 0.045;
    camera.position.x = mouse.x * 1.6;
    camera.position.y = mouse.y * 1.1;
    camera.lookAt(0, 0, -2);
    shapes.position.x = mouse.x * 0.9;   // slight magnetic drift toward cursor
    shapes.position.y = mouse.y * 0.6;
    mouseLight.position.x += (mouse.x * 7 - mouseLight.position.x) * 0.06;
    mouseLight.position.y += (mouse.y * 4.5 - mouseLight.position.y) * 0.06;

    renderer.render(scene, camera);

    if (firstFrame) {
      firstFrame = false;
      window.dispatchEvent(new CustomEvent("vaaps:scene-ready"));
    }
  }

  function tick() {
    if (!running || !heroVisible || reducedMotion) return;
    renderFrame(clock.getElapsedTime());
    requestAnimationFrame(tick);
  }

  if (reducedMotion) {
    // One composed static frame, no loop
    renderFrame(1.2);
  } else {
    tick();
  }
})();
