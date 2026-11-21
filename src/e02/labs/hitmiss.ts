import { lib } from "../../kit/libs";
import { h, sfx, takeaway, css, fmt } from "../../kit/ui";

interface Dot { x: number; y: number; path: [number, number][]; i: number; hit: boolean; s: number }

/** Live traffic: every dot is a fan's question. Turn on Redis and watch the database calm down. */
export async function hitMissLab(bench: HTMLElement) {
  const stage = h("div.scale-stage", { role: "img", "aria-label": "Questions flowing from fans to the server, the cache and the database" });
  const onBtn = h("button", { type: "button", "aria-pressed": "false" }, "No cache");
  const offBtn = h("button", { type: "button", "aria-pressed": "true" }, "");
  onBtn.textContent = "Cache on"; offBtn.textContent = "Cache off";
  const rate = h("input#qrate", { type: "range", min: 2, max: 60, value: 24 }) as HTMLInputElement;
  const wipe = h("button.btn", { type: "button" }, "Wipe the cache");
  const st = (k: string, c: string) => { const v = h("span.v.tnum", { style: `color:var(${c})` }, "0"); return { el: h("div.stat", {}, v, h("span.k", {}, k)), v }; };
  const sHit = st("hits (instant)", "--good"), sMiss = st("misses (database)", "--storage"), sDb = st("database load", "--bad");
  const msg = h("p.dim", { "aria-live": "polite", style: "min-height:1.6em" }, "No cache yet: every question goes to the database.");
  bench.append(
    h("div.row", { style: "justify-content:space-between; margin-bottom:12px" },
      h("div.seg", { role: "group", "aria-label": "Cache" }, offBtn, onBtn),
      h("label.field", { for: "qrate", style: "min-width:min(300px,100%)" }, "How many fans are refreshing", rate)),
    stage,
    h("div.row", { style: "margin-top:12px" }, wipe),
    msg,
    h("div.stats", {}, sHit.el, sMiss.el, sDb.el),
    takeaway("The first fan causes a miss. Everyone after that gets a hit, until the copy expires. Thousands of database questions become a handful."),
  );

  const PIXI = await lib.pixi();
  const app = new PIXI.Application();
  await app.init({ resizeTo: stage, backgroundAlpha: 0, antialias: true, resolution: Math.min(devicePixelRatio, 2), autoDensity: true });
  stage.append(app.canvas);
  const g = new PIXI.Graphics();
  app.stage.addChild(g);
  const labels = new PIXI.Container(); app.stage.addChild(labels);
  const col = (v: string) => new PIXI.Color(css(v)).toNumber();
  const C = { cpu: col("--cpu"), ram: col("--ram"), st: col("--storage"), good: col("--good"), text: col("--text"), line: col("--line"), bad: col("--bad") };
  const TTL = 5; // seconds a cached seats-left note lives
  let cacheOn = false, fresh = -1, now = 0, acc = 0, inDb = 0;
  let hits = 0, misses = 0, win = 0;
  const dots: Dot[] = [];
  let P = { srv: [0, 0], redis: [0, 0], db: [0, 0] } as Record<string, [number, number]>;
  const layout = () => {
    const W = app.screen.width, H = app.screen.height;
    P = { srv: [W * 0.45, H * 0.5], redis: [W * 0.78, H * 0.26], db: [W * 0.78, H * 0.74] };
    labels.removeChildren();
    const style = { fill: css("--dim"), fontSize: 13, fontFamily: "SFZ Mono, monospace" };
    const add = (t: string, x: number, y: number) => { const tx = new PIXI.Text({ text: t, style }); tx.anchor.set(0.5, 0); tx.position.set(x, y); labels.addChild(tx); };
    add("fans", 34, 10); add("server", P.srv[0], P.srv[1] + 30); add("cache (Redis) · in memory", P.redis[0], P.redis[1] + 30); add("database · careful, slow", P.db[0], P.db[1] + 30);
  };
  new ResizeObserver(layout).observe(stage); layout();
  const set = (on: boolean) => {
    cacheOn = on; onBtn.setAttribute("aria-pressed", String(on)); offBtn.setAttribute("aria-pressed", String(!on));
    if (!on) fresh = -1;
    msg.textContent = on ? "Cache on. The first question misses and fills the cache; the rest are hits for 5 seconds." : "No cache: every question goes to the database.";
    sfx(on ? "hit" : "powerdown", 0.25);
  };
  onBtn.addEventListener("click", () => set(true));
  offBtn.addEventListener("click", () => set(false));
  wipe.addEventListener("click", () => { fresh = -1; msg.textContent = "Cache wiped. The next question has to go to the database."; sfx("pop", 0.25); });

  let vis = true; new IntersectionObserver((e) => (vis = e[0].isIntersecting)).observe(stage);
  app.ticker.add((tk) => {
    if (!vis) return;
    const dt = Math.min(0.05, tk.deltaMS / 1000);
    now += dt;
    const H = app.screen.height;
    acc += +rate.value * dt;
    while (acc >= 1) {
      acc--;
      const y = 26 + Math.random() * (H - 52);
      const hit = cacheOn && now < fresh;
      const path: [number, number][] = hit
        ? [[20, y], P.srv, P.redis, P.srv, [20, y]]
        : [[20, y], P.srv, P.db, P.srv, [20, y]];
      dots.push({ x: 20, y, path, i: 1, hit, s: 420 });
      if (hit) hits++; else { misses++; inDb++; }
    }
    for (let k = dots.length - 1; k >= 0; k--) {
      const d = dots[k];
      const [tx, ty] = d.path[d.i];
      const dx = tx - d.x, dy = ty - d.y, dist = Math.hypot(dx, dy);
      const step = d.s * dt * (!d.hit && d.i === 2 ? 0.35 : 1); // the database is slower
      if (dist <= step) {
        d.x = tx; d.y = ty; d.i++;
        if (!d.hit && d.i === 3) { inDb--; if (cacheOn && now >= fresh) fresh = now + TTL; }
        if (d.i >= d.path.length) dots.splice(k, 1);
      } else { d.x += (dx / dist) * step; d.y += (dy / dist) * step; }
    }
    win += dt;
    if (win > 1) {
      sHit.v.textContent = fmt(hits / win); sMiss.v.textContent = fmt(misses / win);
      const load = Math.min(100, inDb * 6);
      sDb.v.textContent = `${fmt(load)}%`;
      hits = misses = 0; win = 0;
    }
    g.clear();
    const box = (p: [number, number], w: number, hgt: number, c: number, glow: number) => g.roundRect(p[0] - w / 2, p[1] - hgt / 2, w, hgt, 10).fill({ color: c, alpha: 0.12 + glow * 0.4 }).stroke({ color: c, width: 2 });
    box(P.srv, 70, 46, C.cpu, 0);
    box(P.redis, 96, 46, C.ram, cacheOn && now < fresh ? 0.35 : 0);
    box(P.db, 96, 46, C.st, Math.min(1, inDb / 16));
    if (cacheOn) {
      const left = Math.max(0, fresh - now) / TTL;
      g.rect(P.redis[0] - 40, P.redis[1] + 14, 80 * left, 4).fill({ color: C.good });
    }
    for (const d of dots) g.circle(d.x, d.y, 3.2).fill({ color: d.i >= 4 ? (d.hit ? C.good : C.st) : C.text, alpha: 0.95 });
  });
}
