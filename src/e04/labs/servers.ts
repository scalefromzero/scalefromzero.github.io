import type * as T from "three";
import { lib } from "../../kit/libs";
import { h, sfx, takeaway, fmt, css, reducedMotion } from "../../kit/ui";

const MAXS = 64;

/** Throughput turns into a number of servers. three.js grid: one box per server you need. */
export async function serversLab(bench: HTMLElement) {
  const rpsIn = h("input#sv-rps", { type: "range", min: 2, max: 4.7, step: 0.01, value: Math.log10(3333) }) as HTMLInputElement;
  const capIn = h("select#sv-cap", {}, ...[100, 250, 500, 1000, 2000].map((v) => h("option", { value: v, selected: v === 500 }, `${fmt(v)} requests a second`))) as HTMLSelectElement;
  const roomIn = h("input#sv-room", { type: "range", min: 0, max: 100, step: 5, value: 50 }) as HTMLInputElement;
  const rpsOut = h("output", {}), roomOut = h("output", {});
  const sum = h("p.mono", { style: "font-size:var(--step--1); line-height:1.7; margin:0" });
  const big = h("span.v.tnum", { style: "color:var(--ram)" }, "10");
  const box = h("div.map-box", { style: "aspect-ratio:16/10", role: "img", "aria-label": "A grid of servers; lit ones are the servers you need" });
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:12px; align-content:start" },
        h("label.field", { for: "sv-rps" }, h("span", {}, "Peak requests per second: ", rpsOut), rpsIn),
        h("label.field", { for: "sv-cap" }, h("span", {}, "One server handles"), capIn),
        h("label.field", { for: "sv-room" }, h("span", {}, "Room to spare: ", roomOut), roomIn),
        h("div.stat", {}, big, h("span.k", {}, "servers to plan for")),
        sum,
      ),
      box,
    ),
    h("p.note", {}, "Three thousand three hundred is two million fans over six hundred seconds. Five hundred a second per server is an illustrative number from the episode."),
    takeaway("One number turned into a real design decision: ten servers, not one."),
  );

  const THREE = await lib.three();
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  box.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  cam.position.set(0, 10, 11.5); cam.lookAt(0, 0, 0.3);
  scene.add(new THREE.AmbientLight(0x9aa8ff, 0.8));
  const dl = new THREE.DirectionalLight(0xffffff, 1.3); dl.position.set(5, 10, 6); scene.add(dl);
  scene.add(new THREE.GridHelper(40, 40, 0x26315a, 0x161e3c));
  const geo = new THREE.BoxGeometry(0.9, 1.5, 0.9);
  const on = new THREE.Color(css("--ram")), off = new THREE.Color("#1d2547");
  const mesh = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.2 }), MAXS);
  const dummy = new THREE.Object3D();
  const pos: T.Vector3[] = [];
  for (let i = 0; i < MAXS; i++) {
    const r = Math.floor(i / 8), c = i % 8;
    pos.push(new THREE.Vector3((c - 3.5) * 1.5, 0, (r - 3.5) * 1.5));
    mesh.setColorAt(i, off);
  }
  // light the servers from the middle outwards, front rows first
  pos.sort((p, q) => (Math.hypot(p.x, p.z * 1.2 - 0.8) - Math.hypot(q.x, q.z * 1.2 - 0.8)) || p.x - q.x);
  scene.add(mesh);
  const height = new Float32Array(MAXS).fill(0.15), target = new Float32Array(MAXS).fill(0.15);
  let lit = 0;

  function calc() {
    const rps = Number((10 ** +rpsIn.value).toPrecision(2));
    const cap = +capIn.value, room = +roomIn.value / 100;
    const exact = rps / cap, need = Math.max(1, Math.ceil(exact - 1e-9)), plan = Math.max(1, Math.ceil(exact * (1 + room) - 1e-9));
    rpsOut.textContent = fmt(rps); roomOut.textContent = `${roomIn.value}%`;
    big.textContent = plan > MAXS ? `${fmt(plan)}` : String(plan);
    sum.innerHTML = `${fmt(rps)} ÷ ${fmt(cap)} = <b>${fmt(exact, 1)}</b> → ${need} server${need > 1 ? "s" : ""} at the very limit<br>+ ${roomIn.value}% room to spare → <b style="color:var(--ram)">${fmt(plan)}</b>${plan > MAXS ? ` <span class="faint">(grid shows ${MAXS})</span>` : ""}`;
    const prev = lit; lit = Math.min(MAXS, plan);
    for (let i = 0; i < MAXS; i++) { target[i] = i < lit ? 1 : 0.15; mesh.setColorAt(i, i < lit ? (i < need ? on : new THREE.Color(css("--storage"))) : off); }
    mesh.instanceColor!.needsUpdate = true;
    if (lit !== prev) sfx(lit > prev ? "pop" : "tick", 0.15);
  }
  [rpsIn, roomIn].forEach((e) => e.addEventListener("input", calc));
  capIn.addEventListener("change", calc);
  const resize = () => { const w = box.clientWidth, hh = box.clientHeight; renderer.setSize(w, hh, false); cam.aspect = w / hh; cam.position.set(0, 10, 11.5).multiplyScalar(w < 500 ? 1.35 : 1); cam.lookAt(0, 0, 0.3); cam.updateProjectionMatrix(); };
  new ResizeObserver(resize).observe(box); resize();
  let vis = true; new IntersectionObserver((e) => (vis = e[0].isIntersecting)).observe(box);
  const t0 = performance.now();
  renderer.setAnimationLoop(() => {
    if (!vis) return;
    const t = (performance.now() - t0) / 1000;
    for (let i = 0; i < MAXS; i++) {
      height[i] += (target[i] - height[i]) * (reducedMotion() ? 1 : 0.12);
      const s = height[i];
      dummy.position.copy(pos[i]); dummy.position.y = (1.5 * s) / 2 + (i < lit && !reducedMotion() ? 0.04 * Math.sin(t * 3 + i) : 0);
      dummy.scale.set(1, s, 1); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (!reducedMotion()) scene.rotation.y = Math.sin(t * 0.2) * 0.12;
    renderer.render(scene, cam);
  });
  calc();
  const legend = h("div.row", { style: "position:absolute; left:10px; bottom:8px; gap:6px" }, h("span.chip", { style: "color:var(--ram)" }, h("i"), "needed at the limit"), h("span.chip", { style: "color:var(--storage)" }, h("i"), "room to spare"));
  box.append(legend);
}
