import { lib } from "../libs";
import { h, sfx, takeaway, css, fmt } from "../ui";

interface Srv { cap: number; load: number; alive: boolean; x: number; y: number; w: number; h: number }
interface Req { x: number; y: number; tx: number; ty: number; s: number; target: number; stage: 0 | 1 | 2; drop: boolean; vy: number }

const TIERS = [{ cap: 40, cost: 1 }, { cap: 80, cost: 2.5 }, { cap: 140, cost: 6 }, { cap: 200, cost: 15 }, { cap: 240, cost: 40 }];

/** Scale up (one bigger machine) vs scale out (many machines behind a load balancer). PixiJS. */
export async function scalingLab(bench: HTMLElement) {
  const stage = h("div.scale-stage", { role: "img", "aria-label": "Requests flowing from users to servers" });
  const upBtn = h("button", { type: "button", "aria-pressed": "true" }, "Scale up");
  const outBtn = h("button", { type: "button", "aria-pressed": "false" }, "Scale out");
  const traffic = h("input#traffic", { type: "range", min: 10, max: 400, value: 60 }) as HTMLInputElement;
  const trafficOut = h("output", {}, "60 requests/s");
  const bigger = h("button.btn", { type: "button" }, "Buy a bigger machine");
  const add = h("button.btn", { type: "button", hidden: true }, "Add a server");
  const kill = h("button.btn", { type: "button", style: "border-color:var(--bad)" }, "Unplug a server");
  const st = (k: string, c: string) => { const v = h("span.v.tnum", { style: `color:var(${c})` }, "0"); return { el: h("div.stat", {}, v, h("span.k", {}, k)), v }; };
  const sOk = st("served per second", "--good"), sDrop = st("dropped per second", "--bad"), sCost = st("cost (relative)", "--storage"), sMax = st("most it can take", "--net");
  const msg = h("p.dim", { "aria-live": "polite", style: "min-height:1.6em" });
  bench.append(
    h("div.row", { style: "justify-content:space-between; margin-bottom:12px" }, h("div.seg", { role: "group", "aria-label": "Scaling strategy" }, upBtn, outBtn), h("label.field", { for: "traffic", style: "min-width:min(320px,100%)" }, h("span", {}, "Traffic: ", trafficOut), traffic)),
    stage,
    h("div.row", { style: "margin-top:12px" }, bigger, add, kill),
    msg,
    h("div.stats", { style: "margin-top:8px" }, sOk.el, sDrop.el, sMax.el, sCost.el),
    takeaway("A bigger machine has a ceiling, gets expensive fast, and takes everything down when it dies. Many machines behind a load balancer keep going."),
  );

  const PIXI = await lib.pixi();
  const app = new PIXI.Application();
  await app.init({ resizeTo: stage, backgroundAlpha: 0, antialias: true, resolution: Math.min(devicePixelRatio, 2), autoDensity: true });
  stage.append(app.canvas);
  const g = new PIXI.Graphics();
  app.stage.addChild(g);
  const labelStyle = { fill: css("--dim"), fontSize: 13, fontFamily: "SFZ Mono, monospace" };
  const labels = new PIXI.Container(); app.stage.addChild(labels);

  let mode: "up" | "out" = "up", tier = 0;
  let servers: Srv[] = [];
  const reqs: Req[] = [];
  let acc = 0, okWin = 0, dropWin = 0, winT = 0, rr = 0;
  const col = (v: string) => new PIXI.Color(css(v)).toNumber();
  const C = { net: col("--net"), ram: col("--ram"), bad: col("--bad"), good: col("--good"), line: col("--line"), text: col("--text"), cpu: col("--cpu") };

  function layout() {
    const W = app.screen.width, H = app.screen.height;
    if (mode === "up") {
      const s = servers[0] ?? { cap: 0, load: 0, alive: true, x: 0, y: 0, w: 0, h: 0 };
      const size = 46 + tier * 22;
      Object.assign(s, { cap: TIERS[tier].cap, x: W * 0.74 - size / 2, y: H / 2 - size / 2, w: size, h: size });
      servers = [s];
    } else {
      const n = servers.length, gap = Math.min(70, (H - 40) / n);
      servers.forEach((s, i) => Object.assign(s, { cap: 40, x: W * 0.8 - 22, y: H / 2 - ((n - 1) * gap) / 2 + i * gap - 18, w: 44, h: 36 }));
    }
    labels.removeChildren();
    const t1 = new PIXI.Text({ text: "users", style: labelStyle }); t1.position.set(14, 10); labels.addChild(t1);
    if (mode === "out") { const t2 = new PIXI.Text({ text: "load balancer", style: labelStyle }); t2.anchor.set(0.5, 0); t2.position.set(W * 0.46, H / 2 + 26); labels.addChild(t2); }
    const t3 = new PIXI.Text({ text: mode === "up" ? `server · tier ${tier + 1} of ${TIERS.length}` : `${servers.filter((s) => s.alive).length} servers`, style: labelStyle });
    t3.anchor.set(1, 0); t3.position.set(W - 12, 10); labels.addChild(t3);
    const totalCost = mode === "up" ? TIERS[tier].cost : servers.length * 1;
    sCost.v.textContent = `${fmt(totalCost, 1)}×`;
    sMax.v.textContent = `${servers.filter((s) => s.alive).reduce((a, s) => a + s.cap, 0)}/s`;
    bigger.toggleAttribute("disabled", tier >= TIERS.length - 1);
    if (mode === "up" && tier >= TIERS.length - 1) msg.textContent = "That's the biggest machine you can buy. There is no next size.";
  }
  function setMode(m: typeof mode) {
    mode = m; upBtn.setAttribute("aria-pressed", String(m === "up")); outBtn.setAttribute("aria-pressed", String(m === "out"));
    bigger.hidden = m !== "up"; add.hidden = m !== "out";
    reqs.length = 0;
    servers = m === "up" ? [] : Array.from({ length: 3 }, () => ({ cap: 40, load: 0, alive: true, x: 0, y: 0, w: 0, h: 0 }));
    if (m === "up") tier = 0;
    msg.textContent = m === "up" ? "One machine. Push the traffic up, then buy bigger." : "Three small servers behind a load balancer. Add more as traffic grows.";
    layout(); sfx("whoosh", 0.25);
  }
  upBtn.addEventListener("click", () => setMode("up"));
  outBtn.addEventListener("click", () => setMode("out"));
  bigger.addEventListener("click", () => { if (tier < TIERS.length - 1) { tier++; layout(); sfx("hit", 0.3); msg.textContent = `Tier ${tier + 1}: ${TIERS[tier].cap}/s for ${TIERS[tier].cost}× the price.`; } });
  add.addEventListener("click", () => { if (servers.length < 12) { servers.push({ cap: 40, load: 0, alive: true, x: 0, y: 0, w: 0, h: 0 }); layout(); sfx("pop", 0.3); } });
  kill.addEventListener("click", () => {
    const alive = servers.filter((s) => s.alive);
    if (!alive.length) return;
    alive[alive.length - 1].alive = false; sfx("powerdown", 0.35);
    msg.textContent = mode === "up" ? "The only server is down. Every request fails." : `One server down. The load balancer sends its share to the other ${alive.length - 1}.`;
    setTimeout(() => { servers.forEach((s) => (s.alive = true)); layout(); msg.textContent = "Server back online."; }, 4000);
    layout();
  });
  traffic.addEventListener("input", () => (trafficOut.textContent = `${traffic.value} requests/s`));
  new ResizeObserver(() => layout()).observe(stage);
  setMode("up");

  let vis = true; new IntersectionObserver((e) => (vis = e[0].isIntersecting)).observe(stage);
  app.ticker.add((tk) => {
    if (!vis) return;
    const dt = Math.min(0.05, tk.deltaMS / 1000);
    const W = app.screen.width, H = app.screen.height, lbx = W * 0.46, lby = H / 2;
    acc += +traffic.value * dt * 0.25; // show a quarter of requests as dots
    while (acc >= 1) {
      acc--;
      reqs.push({ x: 20, y: 30 + Math.random() * (H - 60), tx: 0, ty: 0, s: 320 + Math.random() * 120, target: -1, stage: mode === "out" ? 0 : 1, drop: false, vy: 0 });
    }
    servers.forEach((s) => (s.load = Math.max(0, s.load - s.cap * dt)));
    for (let i = reqs.length - 1; i >= 0; i--) {
      const r = reqs[i];
      if (r.drop) { r.vy += 600 * dt; r.y += r.vy * dt; if (r.y > H + 10) reqs.splice(i, 1); continue; }
      if (r.target < 0) {
        if (mode === "out" && r.stage === 0) { r.tx = lbx; r.ty = lby; }
        else {
          const alive = servers.map((s, k) => (s.alive ? k : -1)).filter((k) => k >= 0);
          r.target = alive.length ? alive[rr++ % alive.length] : 0;
        }
      }
      if (r.target >= 0) { const s = servers[r.target]; r.tx = s.x + s.w / 2; r.ty = s.y + s.h / 2; }
      const dx = r.tx - r.x, dy = r.ty - r.y, d = Math.hypot(dx, dy);
      if (d < 6) {
        if (r.stage === 0) { r.stage = 1; continue; }
        const s = servers[r.target];
        if (s && s.alive && s.load < s.cap * 0.25) { s.load += 4; okWin += 4; reqs.splice(i, 1); }
        else { r.drop = true; r.vy = -60; dropWin += 4; }
        continue;
      }
      r.x += (dx / d) * r.s * dt; r.y += (dy / d) * r.s * dt;
    }
    winT += dt;
    if (winT > 1) { sOk.v.textContent = fmt(okWin / winT); sDrop.v.textContent = fmt(dropWin / winT); okWin = dropWin = 0; winT = 0; }
    g.clear();
    if (mode === "out") {
      g.circle(lbx, lby, 16).fill({ color: C.net, alpha: 0.25 }).stroke({ color: C.net, width: 2 });
      servers.forEach((s) => g.moveTo(lbx, lby).lineTo(s.x, s.y + s.h / 2).stroke({ color: C.line, width: 1 }));
    }
    servers.forEach((s) => {
      const f = Math.min(1, s.load / (s.cap * 0.25));
      g.roundRect(s.x, s.y, s.w, s.h, 8).fill({ color: s.alive ? C.ram : C.bad, alpha: s.alive ? 0.15 : 0.08 }).stroke({ color: s.alive ? C.ram : C.bad, width: 2 });
      if (s.alive) g.rect(s.x + 4, s.y + s.h - 6, (s.w - 8) * f, 3).fill({ color: f > 0.9 ? C.bad : C.good });
      else { g.moveTo(s.x + 6, s.y + 6).lineTo(s.x + s.w - 6, s.y + s.h - 6).stroke({ color: C.bad, width: 2 }); }
    });
    for (const r of reqs) g.circle(r.x, r.y, 3).fill({ color: r.drop ? C.bad : C.text, alpha: r.drop ? 0.8 : 0.9 });
  });
}
