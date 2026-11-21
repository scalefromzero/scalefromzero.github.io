import type * as T from "three";
import type { GeoPermissibleObjects } from "d3";
import { lib } from "../kit/libs";
import { css, reducedMotion, sfx } from "../kit/ui";

export const NY: [number, number] = [40.71, -74.01];
export const LONDON: [number, number] = [51.51, -0.13];
const LISBON: [number, number] = [38.72, -9.14];
const N_PACKETS = 24;
const DETOUR = new Set([5, 12, 19]);

/** Night globe with a dotted coastline. Send Maya's photo to London as 24 packet dots. */
export async function mountGlobe(box: HTMLElement, onArrive: (n: number, id: number, detour: boolean) => void) {
  const THREE = await lib.three();
  const [{ CSS2DRenderer, CSS2DObject }, d3, topo, land] = await Promise.all([
    import("three/examples/jsm/renderers/CSS2DRenderer.js"),
    lib.d3(),
    import("topojson-client"),
    import("world-atlas/land-110m.json"),
  ]);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  box.prepend(renderer.domElement);
  const labelR = new CSS2DRenderer();
  labelR.domElement.style.cssText = "position:absolute; inset:0; pointer-events:none";
  box.append(labelR.domElement);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  cam.position.set(0, 0, 3.9);
  scene.add(new THREE.AmbientLight(0x8090ff, 0.5));
  const sun = new THREE.DirectionalLight(0xffffff, 1.1); sun.position.set(-3, 2, 4); scene.add(sun);

  const globe = new THREE.Group(); scene.add(globe);
  const v3 = ([lat, lon]: [number, number], r = 1) => {
    const phi = ((90 - lat) * Math.PI) / 180, th = ((lon + 180) * Math.PI) / 180;
    return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
  };
  globe.add(new THREE.Mesh(new THREE.SphereGeometry(0.995, 64, 48), new THREE.MeshPhongMaterial({ color: 0x0c1430, emissive: 0x060a1c, shininess: 18, specular: 0x223366 })));
  const glow = new THREE.Mesh(new THREE.SphereGeometry(1.12, 48, 32), new THREE.ShaderMaterial({
    transparent: true, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: "varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: "varying vec3 vN; void main(){ float i = pow(0.72 - dot(vN, vec3(0.0,0.0,1.0)), 3.0); gl_FragColor = vec4(0.22,0.55,0.97,1.0) * i; }",
  }));
  scene.add(glow);

  // dotted land from world-atlas (Natural Earth 110m)
  const topology = (land as unknown as { default?: unknown }).default ?? land;
  const geo = topo.feature(topology as never, (topology as { objects: { land: never } }).objects.land) as unknown as GeoPermissibleObjects;
  const pts: number[] = [];
  for (let lat = -58; lat <= 80; lat += 1.6) {
    const step = 1.6 / Math.max(0.25, Math.cos((lat * Math.PI) / 180));
    for (let lon = -180; lon < 180; lon += step) if (d3.geoContains(geo, [lon, lat])) { const p = v3([lat, lon], 1.002); pts.push(p.x, p.y, p.z); }
  }
  const dots = new THREE.BufferGeometry(); dots.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  globe.add(new THREE.Points(dots, new THREE.PointsMaterial({ color: 0x7b93e6, size: 0.017, sizeAttenuation: true, transparent: true, opacity: 0.85 })));

  // routes
  const gc = (a: [number, number], b: [number, number], lift: number, n = 80) => {
    const A = v3(a), B = v3(b), out: T.Vector3[] = [];
    for (let i = 0; i <= n; i++) { const t = i / n; const p = A.clone().lerp(B, t).normalize(); out.push(p.multiplyScalar(1.004 + lift * Math.sin(Math.PI * t))); }
    return out;
  };
  const main = new THREE.CatmullRomCurve3(gc(NY, LONDON, 0.05));
  const det = new THREE.CatmullRomCurve3([...gc(NY, LISBON, 0.05, 60), ...gc(LISBON, LONDON, 0.03, 30).slice(1)]);
  const lineMat = (c: string, o: number) => new THREE.LineBasicMaterial({ color: new THREE.Color(c), transparent: true, opacity: o });
  globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(main.getPoints(160)), lineMat(css("--net"), 0.55)));
  const detLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(det.getPoints(160)), lineMat(css("--storage"), 0.0));
  globe.add(detLine);
  const city = (ll: [number, number], name: string, colour: string) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.018, 16, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(colour) }));
    m.position.copy(v3(ll, 1.006)); globe.add(m);
    const el = document.createElement("div"); el.className = "map-label"; el.innerHTML = `<b style="color:${colour}">${name}</b>`;
    const o = new CSS2DObject(el); o.position.set(0, 0.07, 0); m.add(o);
  };
  city(NY, "New York · Maya", css("--net"));
  city(LONDON, "London · Sam", css("--good"));

  // face the Atlantic
  const mid = v3([47, -38]);
  globe.quaternion.setFromUnitVectors(mid, new THREE.Vector3(0, 0.22, 1).normalize());
  const baseQ = globe.quaternion.clone();

  const packets = Array.from({ length: N_PACKETS }, (_, i) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(DETOUR.has(i + 1) ? css("--storage") : "#EEF2FF") }));
    m.visible = false; globe.add(m);
    return { m, t: -1, start: 0, dur: 0, curve: main, detour: DETOUR.has(i + 1) };
  });

  const resize = () => { const w = box.clientWidth, hh = box.clientHeight; renderer.setSize(w, hh, false); labelR.setSize(w, hh); cam.aspect = w / hh; cam.position.z = w / hh < 1 ? 5.0 : 3.9; cam.updateProjectionMatrix(); };
  new ResizeObserver(resize).observe(box); resize();
  let vis = true; new IntersectionObserver((e) => (vis = e[0].isIntersecting)).observe(box);
  const t0 = performance.now();
  let arrived = 0;
  const wob = new THREE.Quaternion(), axisY = new THREE.Vector3(0, 1, 0);
  renderer.setAnimationLoop(() => {
    if (!vis) return;
    const now = (performance.now() - t0) / 1000;
    if (!reducedMotion()) { wob.setFromAxisAngle(axisY, Math.sin(now * 0.12) * 0.12); globe.quaternion.copy(wob).multiply(baseQ); }
    for (const [i, p] of packets.entries()) {
      if (p.t < 0) continue;
      const k = (now - p.start) / p.dur;
      if (k < 0) { p.m.visible = false; continue; }
      if (k >= 1) { p.m.visible = false; p.t = -1; arrived++; onArrive(arrived, i + 1, p.detour); sfx("tick", 0.05); continue; }
      p.m.visible = true; p.m.position.copy(p.curve.getPointAt(k));
    }
    renderer.render(scene, cam); labelR.render(scene, cam);
  });

  function send() {
    const now = (performance.now() - t0) / 1000;
    arrived = 0;
    (detLine.material as T.LineBasicMaterial).opacity = 0.45;
    packets.forEach((p, i) => {
      p.curve = p.detour ? det : main;
      p.start = now + (reducedMotion() ? 0 : i * 0.09);
      p.dur = reducedMotion() ? 0.01 : (p.detour ? 2.5 : 2.0) + ((i * 7) % 5) * 0.06;
      p.t = 0;
    });
    sfx("whoosh", 0.3);
  }
  return { send, packets: N_PACKETS };
}
