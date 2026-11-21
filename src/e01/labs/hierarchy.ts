import type * as T from "three";
import { lib } from "../../kit/libs";
import { h, sfx, takeaway, css, reducedMotion } from "../../kit/ui";

const LAYERS = [
  { name: "Registers", c: "--cpu", ns: 0.3, size: "about 1 KB", bytes: 1e3, cost: 7, keeps: false },
  { name: "L1 cache", c: "--cache", ns: 1, size: "32–64 KB per core", bytes: 5e4, cost: 6, keeps: false },
  { name: "L2 cache", c: "--cache", ns: 4, size: "~1–2 MB per core", bytes: 1.5e6, cost: 5, keeps: false },
  { name: "L3 cache", c: "--cache", ns: 15, size: "8–64 MB, shared", bytes: 3e7, cost: 4, keeps: false },
  { name: "RAM", c: "--ram", ns: 100, size: "8–64 GB", bytes: 1.6e10, cost: 3, keeps: false },
  { name: "SSD", c: "--storage", ns: 1e5, size: "0.5–4 TB", bytes: 1e12, cost: 2, keeps: true },
  { name: "Hard disk", c: "--storage", ns: 5e6, size: "1–20 TB", bytes: 8e12, cost: 1, keeps: true },
];

/** 3D pyramid of the memory hierarchy. Pick a layer to compare its four trade-offs. */
export async function hierarchyLab(bench: HTMLElement) {
  const box = h("div.hier-box", { role: "img", "aria-label": "Pyramid: registers at the top, hard disk at the bottom" });
  const list = h("div.layer-list", { role: "group", "aria-label": "Layers" });
  const meters = h("div.meters");
  const title = h("h3", {}, "");
  const btns: HTMLElement[] = [];
  const meter = (k: string) => { const i = h("i"), b = h("b"); meters.append(h("div.meter", {}, h("span", {}, k), h("div.track", {}, i), b)); return { i, b }; };
  const mSpeed = meter("Speed"), mCap = meter("Capacity"), mCost = meter("Cost per byte"), mKeep = meter("Survives power cut");
  let select: (i: number) => void = () => {};
  LAYERS.forEach((L, i) => {
    const b = h("button.layer-btn", { type: "button", style: `--lc: var(${L.c})`, "aria-pressed": "false" }, h("i"), L.name, h("span", {}, L.ns >= 1e3 ? (L.ns >= 1e6 ? `${L.ns / 1e6} ms` : `${L.ns / 1e3} µs`) : `${L.ns} ns`));
    b.addEventListener("click", () => select(i));
    btns.push(b); list.append(b);
  });
  const show = (i: number) => {
    const L = LAYERS[i];
    btns.forEach((b, k) => b.setAttribute("aria-pressed", String(k === i)));
    title.innerHTML = `<span style="color:var(${L.c})">${L.name}</span>`;
    meters.style.setProperty("--lc", `var(${L.c})`);
    const sp = 1 - (Math.log10(L.ns) + 0.6) / 7.4;
    mSpeed.i.style.width = `${Math.max(4, sp * 100)}%`; mSpeed.b.textContent = L.ns >= 1e3 ? (L.ns >= 1e6 ? `~${L.ns / 1e6} ms` : `~${L.ns / 1e3} µs`) : `~${L.ns} ns`;
    mCap.i.style.width = `${Math.max(4, ((Math.log10(L.bytes) - 2.5) / 10.5) * 100)}%`; mCap.b.textContent = L.size;
    mCost.i.style.width = `${(L.cost / 7) * 100}%`; mCost.b.textContent = "$".repeat(Math.ceil(L.cost / 1.5));
    mKeep.i.style.width = L.keeps ? "100%" : "4%"; mKeep.b.textContent = L.keeps ? "yes" : "no";
  };
  bench.append(
    h("div.bench-grid", {},
      box,
      h("div", { style: "display:grid; gap:12px; align-content:start" }, list, title, meters, h("p.note", { style: "margin:0" }, "Sizes and speeds are typical 2020s laptop and server values; cost is relative.")),
    ),
    takeaway("Every layer trades speed, capacity, cost and survival. No single technology wins all four, which is why the hierarchy exists."),
  );
  show(4);

  const THREE = await lib.three();
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  box.append(renderer.domElement);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(34, 4 / 3, 0.1, 100);
  cam.position.set(8.5, 6.2, 12.5);
  cam.lookAt(0, 1.9, 0);
  scene.add(new THREE.AmbientLight(0x9aa8ff, 0.7));
  const dl = new THREE.DirectionalLight(0xffffff, 1.5); dl.position.set(5, 10, 7); scene.add(dl);
  const pyramid = new THREE.Group(); scene.add(pyramid);
  const slabs: T.Mesh[] = [];
  const n = LAYERS.length, sh = 0.62;
  LAYERS.forEach((L, i) => {
    const top = 0.35 + i * 0.62, bottom = top + 0.62;
    const geo = new THREE.CylinderGeometry(top, bottom, sh - 0.06, 4, 1);
    geo.rotateY(Math.PI / 4);
    const col = new THREE.Color(css(L.c));
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: col, roughness: 0.45, metalness: 0.2, emissive: col, emissiveIntensity: 0.12, transparent: true, opacity: 0.92 }));
    m.position.y = (n - 1 - i) * sh + sh / 2;
    m.userData = { i, y: m.position.y };
    pyramid.add(m); slabs.push(m);
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 }));
    m.add(e);
  });
  let sel = 4, t = 0;
  const { gsap } = await lib.gsap();
  select = (i: number) => {
    sel = i; show(i); sfx("pop", 0.25);
    slabs.forEach((s, k) => {
      gsap.to(s.position, { y: s.userData.y + (k === i ? 0.35 : 0), x: k === i ? 0.5 : 0, duration: reducedMotion() ? 0 : 0.5, ease: "back.out(2)" });
      (s.material as T.MeshStandardMaterial).emissiveIntensity = k === i ? 0.55 : 0.1;
      (s.material as T.MeshStandardMaterial).opacity = k === i ? 1 : 0.55;
    });
  };
  select(4);
  const ray = new THREE.Raycaster(), mv = new THREE.Vector2();
  renderer.domElement.addEventListener("click", (ev) => {
    const r = renderer.domElement.getBoundingClientRect();
    mv.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(mv, cam);
    const hit = ray.intersectObjects(slabs, false)[0];
    if (hit) select((hit.object as T.Mesh).userData.i);
  });
  const resize = () => { const w = box.clientWidth, hh = box.clientHeight; renderer.setSize(w, hh, false); cam.aspect = w / hh; cam.updateProjectionMatrix(); };
  new ResizeObserver(resize).observe(box); resize();
  let vis = true; new IntersectionObserver((e) => (vis = e[0].isIntersecting)).observe(box);
  renderer.setAnimationLoop(() => {
    if (!vis) return;
    if (!reducedMotion()) { t += 0.004; pyramid.rotation.y = Math.sin(t) * 0.5; }
    renderer.render(scene, cam);
  });
  void sel;
}
