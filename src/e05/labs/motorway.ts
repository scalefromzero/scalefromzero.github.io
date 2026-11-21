import { lib } from "../../kit/libs";
import { h, sfx, takeaway, css, reducedMotion } from "../../kit/ui";

const USERS = [["Maya", "--net"], ["Ali", "--good"], ["Priya", "--cache"], ["Tom", "--storage"]] as const;

/** Private roads versus one shared motorway. PixiJS moves the packets; the busy meter tells the story. */
export async function motorwayLab(bench: HTMLElement) {
  const seg = h("div.seg", { role: "group", "aria-label": "Road layout" });
  let shared = false;
  [["A private road each", false], ["One shared motorway", true]].forEach(([t, v]) => {
    const b = h("button", { type: "button", "aria-pressed": String(v === shared) }, String(t));
    b.addEventListener("click", () => { shared = v as boolean; [...seg.children].forEach((x) => x.setAttribute("aria-pressed", String(x === b))); layout(); sfx("whoosh", 0.2); });
    seg.append(b);
  });
  const roads = h("span.v.tnum", {}, "4"), busy = h("span.v.tnum", {}, "–");
  const stage = h("div", { style: "position:relative; width:100%; height:260px; border-radius:12px; overflow:hidden; background:var(--bg); border:1px solid var(--line)", role: "img", "aria-label": "Packets from four people travelling on roads" });
  const say = h("p.dim", { "aria-live": "polite", style: "min-height:3em" });
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:12px; align-content:start" }, seg,
        h("div.stats", {}, h("div.stat", {}, roads, h("span.k", {}, "roads to build")), h("div.stat", {}, busy, h("span.k", {}, "how full each road is, on average"))),
        h("div.row", { style: "gap:6px" }, ...USERS.map(([n, c]) => h("span.chip", { style: `color:var(${c})` }, h("i"), n))), say),
      stage,
    ),
    h("p.note", {}, "Each person sends a short burst of packets, then goes quiet, like a chat. How full a road is gets measured live from the animation."),
    takeaway("Packets from millions of people take turns on the same wires, like cars sharing a motorway."),
  );
  const PIXI = await lib.pixi();
  const app = new PIXI.Application();
  await app.init({ resizeTo: stage, backgroundAlpha: 0, antialias: true, resolution: Math.min(devicePixelRatio, 2), autoDensity: true });
  stage.append(app.canvas);
  const roadG = new PIXI.Graphics(); app.stage.addChild(roadG);
  const cols = USERS.map(([, c]) => new PIXI.Color(css(c)).toNumber());
  type Car = { g: InstanceType<typeof PIXI.Graphics>; x: number; lane: number; user: number };
  let cars: Car[] = [];
  const nextBurst = USERS.map((_, i) => 0.3 + i * 0.7);
  let laneBusy = [0, 0, 0, 0], laneTime = 0;
  const laneY = (lane: number) => { const H = stage.clientHeight; return shared ? H / 2 : (H / 5) * (lane + 1); };
  function layout() {
    cars.forEach((c) => c.g.destroy()); cars = [];
    laneBusy = [0, 0, 0, 0]; laneTime = 0;
    roads.textContent = shared ? "1" : "4";
    say.textContent = shared ? "One road, and everyone's packets take turns. The road is busy most of the time, and nobody waits long." : "Four private roads. Each one sits empty between bursts, even during a busy chat.";
    drawRoads();
  }
  function drawRoads() {
    roadG.clear();
    const W = stage.clientWidth;
    const lanes = shared ? [0] : [0, 1, 2, 3];
    for (const l of lanes) {
      const y = laneY(l);
      roadG.rect(0, y - 14, W, 28).fill({ color: 0x131a34 });
      for (let x = 0; x < W; x += 34) roadG.rect(x, y - 1, 16, 2).fill({ color: 0x26315a });
    }
  }
  new ResizeObserver(drawRoads).observe(stage);
  let t = 0, shown = 0;
  app.ticker.add((tk) => {
    const dt = Math.min(0.05, tk.deltaMS / 1000);
    if (reducedMotion() && t > 0.1) return;
    t += dt;
    const W = stage.clientWidth, speed = 150;
    USERS.forEach((_, u) => {
      if (t >= nextBurst[u]) {
        const n = 3 + ((u * 3 + Math.floor(t)) % 3);
        for (let k = 0; k < n; k++) {
          const g = new PIXI.Graphics().roundRect(-9, -6, 18, 12, 3).fill({ color: cols[u] });
          app.stage.addChild(g);
          cars.push({ g, x: -20 - k * 26, lane: shared ? 0 : u, user: u });
        }
        nextBurst[u] = t + 3.2 + u * 0.35;
      }
    });
    if (shared) {
      // merge: keep a gap behind the car in front
      cars.sort((a, b) => b.x - a.x);
      for (let i = 0; i < cars.length; i++) {
        const front = cars[i - 1];
        const want = cars[i].x + speed * dt;
        cars[i].x = front ? Math.min(want, front.x - 22) : want;
      }
    } else cars.forEach((c) => (c.x += speed * dt));
    const fill = [0, 0, 0, 0];
    cars.forEach((c) => { c.g.x = c.x; c.g.y = laneY(c.lane); if (c.x > 0 && c.x < W) fill[c.lane] += 22 / W; });
    laneTime += dt; fill.forEach((f, i) => (laneBusy[i] += Math.min(1, f) * dt));
    cars = cars.filter((c) => { if (c.x > W + 30) { c.g.destroy(); return false; } return true; });
    shown += dt;
    if (shown > 0.5 && laneTime > 2) {
      shown = 0;
      const lanes = shared ? [0] : [0, 1, 2, 3];
      const pct = (lanes.reduce((s, l) => s + laneBusy[l], 0) / lanes.length / laneTime) * 100;
      busy.textContent = `${Math.round(pct)}%`;
      busy.style.color = pct > 40 ? "var(--good)" : "var(--bad)";
    }
  });
  layout();
}
