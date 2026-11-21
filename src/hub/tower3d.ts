import type * as T from "three";
import { lib } from "../kit/libs";
import { FLOORS, SEASON, pad, type Episode } from "../kit/season";
import { css, reducedMotion } from "../kit/ui";

/** The season as a five-storey tower. Each window is an episode; lit windows have a companion site. */
export async function mountTower(box: HTMLElement, tip: HTMLElement, onPick: (ep: Episode) => void) {
  const THREE = await lib.three();
  const { OrbitControls } = await lib.threeOrbit();

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  box.prepend(renderer.domElement);
  box.querySelector(".tower-fallback")?.remove();

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0a0f1e, 16, 34);
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(11, 9, 13);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.minPolarAngle = 0.6;
  controls.maxPolarAngle = 1.45;
  controls.autoRotate = !reducedMotion();
  controls.autoRotateSpeed = 0.7;
  controls.target.set(0, 3.6, 0);

  scene.add(new THREE.AmbientLight(0x8899ff, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(8, 14, 6);
  scene.add(key);
  const rim = new THREE.PointLight(0x38bdf8, 40, 30);
  rim.position.set(-6, 8, -6);
  scene.add(rim);

  // ground grid
  const grid = new THREE.GridHelper(30, 30, 0x26315a, 0x1a2244);
  (grid.material as T.Material).transparent = true;
  (grid.material as T.Material).opacity = 0.6;
  scene.add(grid);

  const tower = new THREE.Group();
  scene.add(tower);
  const W = 5, D = 5, FH = 1.35, GAP = 0.12;
  const windows: T.Mesh[] = [];

  // lobby = E00
  const lobby = new THREE.Mesh(new THREE.BoxGeometry(W + 0.8, 0.5, D + 0.8), new THREE.MeshStandardMaterial({ color: 0x151d3a, roughness: 0.7, metalness: 0.2 }));
  lobby.position.y = 0.25;
  tower.add(lobby);
  const floorsGroup: T.Group[] = [];

  FLOORS.forEach((f, i) => {
    const colour = new THREE.Color(css(`--${f.colour}`) || "#38BDF8");
    const g = new THREE.Group();
    g.position.y = 0.5 + i * (FH + GAP) + FH / 2;
    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(W, FH, D),
      new THREE.MeshStandardMaterial({ color: 0x111831, roughness: 0.55, metalness: 0.35, emissive: colour, emissiveIntensity: 0.06 }),
    );
    g.add(slab);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(slab.geometry), new THREE.LineBasicMaterial({ color: colour, transparent: true, opacity: 0.85 }));
    g.add(edges);

    const eps = SEASON.filter((e) => e.floor === f.n);
    // windows wrap around the four faces
    eps.forEach((ep, k) => {
      const face = k % 4, slot = Math.floor(k / 4), perFace = Math.ceil(eps.length / 4);
      const span = W - 1.2, x = perFace === 1 ? 0 : -span / 2 + (slot * span) / Math.max(1, perFace - 1);
      const lit = ep.site;
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(0.7, 0.62),
        new THREE.MeshBasicMaterial({ color: lit ? colour : colour.clone().multiplyScalar(0.28), transparent: true, opacity: lit ? 1 : 0.85, side: THREE.DoubleSide }),
      );
      const off = W / 2 + 0.011;
      if (face === 0) m.position.set(x, 0, off);
      if (face === 1) { m.position.set(off, 0, -x); m.rotation.y = Math.PI / 2; }
      if (face === 2) { m.position.set(-x, 0, -off); m.rotation.y = Math.PI; }
      if (face === 3) { m.position.set(-off, 0, x); m.rotation.y = -Math.PI / 2; }
      m.userData = { ep, base: (m.material as T.MeshBasicMaterial).color.clone() };
      g.add(m);
      windows.push(m);
    });
    tower.add(g);
    floorsGroup.push(g);
  });

  // data particles rising through the core
  const N = 160;
  const pts = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { pts[i * 3] = (Math.random() - 0.5) * 7; pts[i * 3 + 1] = Math.random() * 9; pts[i * 3 + 2] = (Math.random() - 0.5) * 7; }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute("position", new THREE.BufferAttribute(pts, 3));
  const particles = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0x7dd3fc, size: 0.06, transparent: true, opacity: 0.7 }));
  scene.add(particles);

  // intro: floors drop in
  if (!reducedMotion()) {
    const { gsap } = await lib.gsap();
    floorsGroup.forEach((g, i) => {
      const y = g.position.y;
      g.position.y = y + 8;
      g.scale.setScalar(0.92);
      gsap.to(g.position, { y, duration: 0.9, delay: 0.15 + i * 0.16, ease: "bounce.out" });
      gsap.to(g.scale, { x: 1, y: 1, z: 1, duration: 0.6, delay: 0.15 + i * 0.16 });
    });
  }

  // hover / pick
  const ray = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let hovered: T.Mesh | null = null;
  const setTip = (ep?: Episode) => {
    if (!ep) { tip.innerHTML = `<b>Drag to turn the tower</b>Each window is an episode. Lit windows have a lab you can open.`; return; }
    tip.innerHTML = `<b>E${pad(ep.n)} · ${ep.title}</b>${ep.site ? "Lab open. Click the window to go in." : "Lab arrives with the episode."}`;
  };
  setTip();
  const pick = (cx: number, cy: number) => {
    const r = renderer.domElement.getBoundingClientRect();
    mouse.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(mouse, camera);
    return (ray.intersectObjects(windows, false)[0]?.object as T.Mesh) ?? null;
  };
  renderer.domElement.addEventListener("pointermove", (e) => {
    const m = pick(e.clientX, e.clientY);
    if (m === hovered) return;
    if (hovered) (hovered.material as T.MeshBasicMaterial).color.copy(hovered.userData.base);
    hovered = m;
    if (m) (m.material as T.MeshBasicMaterial).color.set(0xffffff);
    renderer.domElement.style.cursor = m && m.userData.ep.site ? "pointer" : "grab";
    setTip(m?.userData.ep);
  });
  renderer.domElement.addEventListener("click", (e) => {
    const m = pick(e.clientX, e.clientY);
    if (m) onPick(m.userData.ep);
  });

  const resize = () => {
    const w = box.clientWidth, hgt = box.clientHeight;
    renderer.setSize(w, hgt, false);
    camera.aspect = w / hgt;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(box);
  resize();

  const t0 = performance.now();
  let visible = true;
  new IntersectionObserver((en) => (visible = en[0].isIntersecting)).observe(box);
  renderer.setAnimationLoop(() => {
    if (!visible) return;
    const t = (performance.now() - t0) / 1000;
    const p = pg.attributes.position as T.BufferAttribute;
    for (let i = 0; i < N; i++) { let y = p.getY(i) + 0.012; if (y > 9.5) y = 0.2; p.setY(i, y); }
    p.needsUpdate = true;
    windows.forEach((w, i) => {
      if (w === hovered || !w.userData.ep.site) return;
      const mat = w.material as T.MeshBasicMaterial;
      mat.color.copy(w.userData.base).multiplyScalar(0.8 + 0.25 * Math.sin(t * 2 + i));
    });
    controls.update();
    renderer.render(scene, camera);
  });
}
