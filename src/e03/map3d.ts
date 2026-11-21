import type * as T from "three";
import { lib } from "../kit/libs";
import { css, reducedMotion, sfx } from "../kit/ui";

export const NODES = [
  { k: "phone", name: "Maya's phone", sub: "client", x: -7, z: 0, c: "--net", s: 0.7 },
  { k: "lb", name: "Load balancer", sub: "the host at the door", x: -3.6, z: 0, c: "--net", s: 0.8 },
  { k: "s1", name: "", sub: "", x: 0, z: -2.2, c: "--cpu", s: 0.8 },
  { k: "s2", name: "Servers", sub: "the waiters", x: 0, z: 0, c: "--cpu", s: 0.8 },
  { k: "s3", name: "", sub: "", x: 0, z: 2.2, c: "--cpu", s: 0.8 },
  { k: "cache", name: "Cache", sub: "shelf of ready dishes", x: 3.8, z: -1.7, c: "--cache", s: 0.8 },
  { k: "db", name: "Database", sub: "the kitchen", x: 3.8, z: 1.7, c: "--storage", s: 1 },
  { k: "pay", name: "Payment service", sub: "another company's machines", x: 7.2, z: 0, c: "--good", s: 0.8 },
  { k: "mon", name: "Monitoring", sub: "logs · metrics · alerts", x: 0, z: -5, c: "--bad", s: 0.7 },
  { k: "ci", name: "Pipeline", sub: "ships new code", x: 0, z: 5, c: "--dim", s: 0.7 },
] as const;
export const EDGES: [string, string][] = [["phone", "lb"], ["lb", "s1"], ["lb", "s2"], ["lb", "s3"], ["s1", "cache"], ["s2", "cache"], ["s3", "cache"], ["s1", "db"], ["s2", "db"], ["s3", "db"], ["s2", "pay"], ["s1", "mon"], ["ci", "s3"]];
const SHORT: Record<string, string> = {"phone": "Phone", "lb": "Balancer", "s2": "Servers", "cache": "Cache", "db": "Database", "pay": "Payments", "mon": "Monitoring", "ci": "Pipeline"};
export const TRACE = ["phone", "lb", "s2", "cache", "s2", "db", "s2", "pay", "s2", "lb", "phone"];

/** The whole map behind an app, in 3D. Returns controls for tracing a request and zooming out. */
export async function mountMap3d(box: HTMLElement, onStep: (k: string) => void) {
  const THREE = await lib.three();
  const { CSS2DRenderer, CSS2DObject } = await import("three/examples/jsm/renderers/CSS2DRenderer.js");
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  box.prepend(renderer.domElement);
  const labelR = new CSS2DRenderer();
  labelR.domElement.style.cssText = "position:absolute; inset:0; pointer-events:none";
  box.append(labelR.domElement);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
  const home = new THREE.Vector3(0, 17, 10);
  cam.position.copy(home); cam.lookAt(0, 0, 0.6);
  scene.add(new THREE.AmbientLight(0x9aa8ff, 0.7));
  const dl = new THREE.DirectionalLight(0xffffff, 1.4); dl.position.set(4, 12, 6); scene.add(dl);
  const grid = new THREE.GridHelper(60, 60, 0x26315a, 0x161e3c); scene.add(grid);

  const world = new THREE.Group(); scene.add(world);
  const makeCluster = (withLabels: boolean) => {
    const g = new THREE.Group();
    const meshes: Record<string, T.Mesh> = {};
    for (const n of NODES) {
      const colour = new THREE.Color(css(n.c));
      const geo = n.k === "db" ? new THREE.CylinderGeometry(0.6 * n.s, 0.6 * n.s, 1.1 * n.s, 28) : n.k === "phone" ? new THREE.BoxGeometry(0.55, 1.0, 0.1) : new THREE.BoxGeometry(1.2 * n.s, 0.8 * n.s, 1.0 * n.s);
      const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: colour, emissive: colour, emissiveIntensity: 0.25, roughness: 0.45, metalness: 0.2 }));
      m.position.set(n.x, n.k === "phone" ? 0.5 : 0.45 * n.s, n.z);
      g.add(m); meshes[n.k] = m;
      if (withLabels && n.name) {
        const el = document.createElement("div");
        el.className = "map-label";
        el.innerHTML = `<b class="full" style="color:var(${n.c})">${n.name}</b><b class="short" style="color:var(${n.c})">${SHORT[n.k] ?? n.name}</b>${n.sub ? `<span>${n.sub}</span>` : ""}`;
        const o = new CSS2DObject(el); o.position.set(0, 1.0 * n.s + 0.35, 0); m.add(o);
      }
    }
    for (const [a, b] of EDGES) {
      const pa = meshes[a].position, pb = meshes[b].position;
      const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(pa.x, 0.08, pa.z), new THREE.Vector3(pb.x, 0.08, pb.z)]);
      g.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x3a4780 })));
    }
    return { g, meshes };
  };
  const main = makeCluster(true);
  world.add(main.g);
  const copies: T.Group[] = [];
  [[-22, -14], [22, -14], [0, -26]].forEach(([x, z]) => { const c = makeCluster(false); c.g.position.set(x, 0, z); c.g.scale.setScalar(0.9); c.g.visible = false; world.add(c.g); copies.push(c.g); });

  const packet = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 20), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  packet.visible = false; scene.add(packet);
  const glowOn = (k: string, on: boolean) => { const mat = main.meshes[k].material as T.MeshStandardMaterial; mat.emissiveIntensity = on ? 0.9 : 0.25; };

  const resize = () => { const w = box.clientWidth, hh = box.clientHeight; renderer.setSize(w, hh, false); labelR.setSize(w, hh); cam.aspect = w / hh; cam.updateProjectionMatrix(); const far = w < 600 ? 1.55 : 1; cam.position.copy(home).multiplyScalar(far); cam.lookAt(0, 0, 0.6); };
  new ResizeObserver(resize).observe(box); resize();
  let vis = true; new IntersectionObserver((e) => (vis = e[0].isIntersecting)).observe(box);
  const t0 = performance.now();
  renderer.setAnimationLoop(() => {
    if (!vis) return;
    const t = (performance.now() - t0) / 1000;
    if (!reducedMotion()) world.rotation.y = Math.sin(t * 0.15) * 0.08;
    (main.meshes.mon.material as T.MeshStandardMaterial).emissiveIntensity = 0.25 + 0.2 * (0.5 + 0.5 * Math.sin(t * 3));
    renderer.render(scene, cam); labelR.render(scene, cam);
  });

  let busy = false;
  async function trace() {
    if (busy) return; busy = true;
    const { gsap } = await lib.gsap();
    packet.visible = true;
    const p0 = main.meshes[TRACE[0]].position; packet.position.set(p0.x, 1.2, p0.z);
    for (let i = 0; i < TRACE.length; i++) {
      const k = TRACE[i], p = main.meshes[k].position.clone().applyMatrix4(world.matrixWorld);
      await gsap.to(packet.position, { x: p.x, y: 1.2, z: p.z, duration: reducedMotion() ? 0 : i === 0 ? 0 : 0.55, ease: "power1.inOut" });
      glowOn(k, true); onStep(k); sfx(k === "db" || k === "pay" ? "pop" : "tick", 0.2);
      setTimeout(() => glowOn(k, false), 500);
    }
    packet.visible = false; busy = false;
  }
  let zoomed = false;
  async function zoom() {
    zoomed = !zoomed;
    const { gsap } = await lib.gsap();
    copies.forEach((c) => (c.visible = true));
    const target = zoomed ? new THREE.Vector3(0, 34, 30) : home.clone().multiplyScalar(box.clientWidth < 600 ? 1.55 : 1);
    await gsap.to(cam.position, { x: target.x, y: target.y, z: target.z, duration: reducedMotion() ? 0 : 1.4, ease: "power2.inOut", onUpdate: () => cam.lookAt(0, 0, zoomed ? -8 : 0.6) });
    if (!zoomed) copies.forEach((c) => (c.visible = false));
    labelR.domElement.style.opacity = zoomed ? "0" : "1";
    return zoomed;
  }
  return { trace, zoom };
}
