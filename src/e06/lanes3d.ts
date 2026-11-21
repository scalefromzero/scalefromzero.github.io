import type * as T from "three";
import { lib } from "../kit/libs";
import { css, reducedMotion, sfx } from "../kit/ui";

type P = { id: number; x: number; mesh: T.Mesh; lost: boolean; held: boolean; resend: boolean; dieAt: number; slot: number };
export type LaneStats = { tcpDone: number; tcpWaiting: number; udpDone: number; udpSkipped: number; stalled: boolean };

const X0 = -5.2, X1 = 5.2, SPEED = 3.6, GAP = 0.36;

/** Two delivery lanes in 3D. TCP (top, green) numbers, acknowledges and waits; UDP (bottom, blue) just keeps going. */
export async function mountLanes(box: HTMLElement, onStats: (s: LaneStats) => void) {
  const THREE = await lib.three();
  const { CSS2DRenderer, CSS2DObject } = await import("three/examples/jsm/renderers/CSS2DRenderer.js");
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  box.prepend(renderer.domElement);
  const labelR = new CSS2DRenderer();
  labelR.domElement.style.cssText = "position:absolute; inset:0; pointer-events:none";
  box.append(labelR.domElement);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  const home = new THREE.Vector3(0, 8, 11.5);
  scene.add(new THREE.AmbientLight(0x9aa8ff, 0.8));
  const dl = new THREE.DirectionalLight(0xffffff, 1.2); dl.position.set(3, 8, 6); scene.add(dl);
  scene.add(new THREE.GridHelper(40, 40, 0x26315a, 0x141b38));
  const G = new THREE.Color(css("--good")), B = new THREE.Color(css("--net")), R = new THREE.Color(css("--bad")), A = new THREE.Color(css("--storage"));
  const label = (html: string, x: number, y: number, z: number) => { const el = document.createElement("div"); el.className = "map-label"; el.innerHTML = html; const o = new CSS2DObject(el); o.position.set(x, y, z); scene.add(o); return el; };
  const lane = (z: number, c: T.Color) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(X1 - X0 + 1.2, 0.06, 0.9), new THREE.MeshStandardMaterial({ color: 0x131a34, emissive: c, emissiveIntensity: 0.08 }));
    m.position.set(0, 0, z); scene.add(m);
    const edge = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(X0 - 0.6, 0.05, z - 0.45), new THREE.Vector3(X1 + 0.6, 0.05, z - 0.45)]), new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: 0.6 }));
    scene.add(edge);
  };
  const ZT = -1.4, ZU = 1.4;
  lane(ZT, G); lane(ZU, B);
  label(`<b style="color:var(--good)">TCP</b><span>numbered · acknowledged · in order</span>`, 0, 0.5, ZT - 1.0);
  label(`<b style="color:var(--net)">UDP</b><span>send it and forget it</span>`, 0, 0.1, ZU + 1.05);
  label(`<b>Maya</b>`, X0 + 0.4, 0.2, 0); label(`<b>Sam</b>`, X1 - 0.4, 0.2, 0);
  const waitBox = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 1.1), new THREE.MeshBasicMaterial({ color: R, transparent: true, opacity: 0 }));
  waitBox.position.set(X1 - 0.9, 0.03, ZT); scene.add(waitBox);
  const waitLabel = label(`<b style="color:var(--bad)">waiting for the gap</b>`, X1 - 0.9, 1.6, ZT);
  waitLabel.style.opacity = "0";

  const geo = new THREE.BoxGeometry(0.34, 0.22, 0.42);
  const ackGeo = new THREE.SphereGeometry(0.07, 10, 10);
  const mk = (c: T.Color) => { const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.4 })); scene.add(m); return m; };
  let tcp: P[] = [], udp: P[] = [];
  let acks: { mesh: T.Mesh; x: number }[] = [];
  let nextT = 1, nextU = 1, expect = 1, tcpDone = 0, udpDone = 0, udpSkipped = 0, loseNext = 0, spawnT = 0;
  const pendingResend: { id: number; at: number }[] = [];
  let now = 0, halve = false;

  function spawn(lst: P[], id: number, z: number, c: T.Color, resend = false) {
    const mesh = mk(resend ? A : c); mesh.position.set(X0, 0.2, z);
    const p: P = { id, x: X0, mesh, lost: false, held: false, resend, dieAt: 0, slot: 0 };
    lst.push(p); return p;
  }
  function kill(p: P) { scene.remove(p.mesh); (p.mesh.material as T.Material).dispose(); }
  function stats() {
    const waiting = tcp.filter((p) => p.held).length;
    onStats({ tcpDone, tcpWaiting: waiting, udpDone, udpSkipped, stalled: waiting > 0 });
  }

  const resize = () => { const w = box.clientWidth, hh = box.clientHeight; renderer.setSize(w, hh, false); labelR.setSize(w, hh); cam.aspect = w / hh; cam.position.copy(home).multiplyScalar(w / hh < 1.1 ? 1.7 : 1); cam.lookAt(0, 0, 0.2); cam.updateProjectionMatrix(); };
  new ResizeObserver(resize).observe(box); resize();
  let vis = true; new IntersectionObserver((e) => (vis = e[0].isIntersecting)).observe(box);
  let last = performance.now();
  renderer.setAnimationLoop(() => {
    const t = performance.now(); const dt = Math.min(0.05, (t - last) / 1000); last = t;
    if (!vis) return;
    if (reducedMotion()) { renderer.render(scene, cam); labelR.render(scene, cam); return; }
    now += dt; spawnT += dt;
    // TCP sends a little slower while it is waiting for a gap (it has noticed loss)
    const tcpStalled = tcp.some((p) => p.held);
    if (spawnT >= GAP) {
      spawnT = 0;
      const lose = loseNext > 0; if (lose) loseNext--;
      if (!tcpStalled || (halve = !halve)) { const p = spawn(tcp, nextT++, ZT, G); if (lose) { p.lost = true; p.dieAt = 0.2 + Math.random() * 0.5; } }
      const u = spawn(udp, nextU++, ZU, B); if (lose) { u.lost = true; u.dieAt = 0.2 + Math.random() * 0.5; }
    }
    for (const r of pendingResend.filter((r) => now >= r.at)) { spawn(tcp, r.id, ZT, G, true); pendingResend.splice(pendingResend.indexOf(r), 1); }
    // move TCP
    for (const p of tcp) {
      if (p.held) continue;
      p.x += SPEED * dt; p.mesh.position.x = p.x;
      if (p.lost && (p.x - X0) / (X1 - X0) > p.dieAt) {
        (p.mesh.material as T.MeshStandardMaterial).color.copy(R); (p.mesh.material as T.MeshStandardMaterial).emissive.copy(R);
        p.mesh.scale.multiplyScalar(0.9); if (p.mesh.scale.x < 0.3) { p.x = 99; pendingResend.push({ id: p.id, at: now + 1.1 }); sfx("miss", 0.1); }
        continue;
      }
      if (p.x >= X1) {
        if (p.id === expect) {
          expect++; tcpDone++; p.x = 99;
          const ack = new THREE.Mesh(ackGeo, new THREE.MeshBasicMaterial({ color: G })); ack.position.set(X1, 0.55, ZT); scene.add(ack); acks.push({ mesh: ack, x: X1 });
          // release anything waiting that is now in order
          let moved = true;
          while (moved) { moved = false; const nxt = tcp.find((q) => q.held && q.id === expect); if (nxt) { nxt.held = false; nxt.x = 99; expect++; tcpDone++; moved = true; } }
          if (p.resend) sfx("hit", 0.15);
        } else if (p.id > expect) { p.held = true; p.slot = tcp.filter((q) => q.held).length - 1; p.x = X1 - 0.9; }
        else p.x = 99;
      }
    }
    // stack held packets in the waiting box
    tcp.filter((p) => p.held).forEach((p, i) => { p.mesh.position.set(X1 - 1.2 + (i % 3) * 0.32, 0.2 + Math.floor(i / 3) * 0.26, ZT); });
    tcp = tcp.filter((p) => { if (p.x > 50) { kill(p); return false; } return true; });
    const anyHeld = tcp.some((p) => p.held);
    (waitBox.material as T.MeshBasicMaterial).opacity = anyHeld ? 0.35 : 0; waitLabel.style.opacity = anyHeld ? "1" : "0";
    // move UDP
    for (const p of udp) {
      p.x += SPEED * 1.15 * dt; p.mesh.position.x = p.x;
      if (p.lost && (p.x - X0) / (X1 - X0) > p.dieAt) { (p.mesh.material as T.MeshStandardMaterial).color.copy(R); (p.mesh.material as T.MeshStandardMaterial).emissive.copy(R); p.mesh.scale.multiplyScalar(0.9); if (p.mesh.scale.x < 0.3) { p.x = 99; udpSkipped++; } continue; }
      if (p.x >= X1 && p.x < 50) { udpDone++; p.x = 99; }
    }
    udp = udp.filter((p) => { if (p.x > 50) { kill(p); return false; } return true; });
    // acks fly back above the TCP lane
    for (const a of acks) { a.x -= SPEED * 1.4 * dt; a.mesh.position.x = a.x; }
    acks = acks.filter((a) => { if (a.x < X0) { scene.remove(a.mesh); return false; } return true; });
    stats();
    renderer.render(scene, cam); labelR.render(scene, cam);
  });
  return {
    lose(n = 1) { loseNext += n; sfx("pop", 0.2); },
    reset() { tcp.forEach(kill); udp.forEach(kill); tcp = []; udp = []; acks.forEach((a) => scene.remove(a.mesh)); acks = []; pendingResend.length = 0; nextT = nextU = expect = 1; tcpDone = udpDone = udpSkipped = 0; stats(); },
  };
}
