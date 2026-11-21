import { lib } from "../../kit/libs";
import { h, sfx, takeaway, css, reducedMotion } from "../../kit/ui";

type N = { id: string; x: number; y: number; end?: boolean };
const NODES: N[] = [
  { id: "Maya", x: 30, y: 170, end: true },
  { id: "A", x: 110, y: 110 }, { id: "B", x: 110, y: 230 }, { id: "C", x: 190, y: 60 }, { id: "D", x: 190, y: 170 }, { id: "E", x: 190, y: 285 },
  { id: "F", x: 450, y: 60 }, { id: "G", x: 450, y: 170 }, { id: "H", x: 450, y: 285 }, { id: "I", x: 530, y: 110 }, { id: "J", x: 530, y: 230 },
  { id: "Sam", x: 610, y: 170, end: true },
];
const EDGES: [string, string, boolean?][] = [
  ["Maya", "A"], ["Maya", "B"], ["A", "C"], ["A", "D"], ["B", "D"], ["B", "E"], ["C", "D"], ["D", "E"],
  ["C", "F", true], ["D", "G", true], ["E", "H", true],
  ["F", "G"], ["G", "H"], ["F", "I"], ["G", "I"], ["G", "J"], ["H", "J"], ["I", "Sam"], ["J", "Sam"],
];

/** A small network that heals itself. Cut a cable or crash a router; packets flow around the damage. D3. */
export async function healLab(bench: HTMLElement) {
  const box = h("div", { style: "min-width:0" });
  const say = h("p.dim", { "aria-live": "polite", style: "min-height:3em" }, "Packets flow from Maya to Sam. Tap a cable to cut it, or a router to crash it.");
  const hops = h("span.v.tnum", { style: "color:var(--net)" }, "–");
  const anchor = h("button.btn", { type: "button" }, "🚢 A ship drags its anchor");
  const crash = h("button.btn", { type: "button" }, "Crash a router on the path");
  const fix = h("button.btn", { type: "button" }, "Repair everything");
  bench.append(
    box,
    h("div.row", { style: "margin-top:12px; justify-content:space-between" }, h("div.row", {}, anchor, crash, fix), h("div.stat", {}, hops, h("span.k", {}, "hops on the current route"))),
    say,
    h("p.note", {}, "Cables are damaged about 200 times a year, mostly by ships' anchors and fishing (",
      h("a", { href: "https://www2.telegeography.com/submarine-cable-faqs-frequently-asked-questions", target: "_blank", rel: "noopener" }, "TeleGeography"), "). Real routers share route updates with each other; here the shortest route by hop count is used."),
    takeaway("Shared wires, no central map, and a network that heals itself."),
  );
  const d3 = await lib.d3();
  // on narrow screens, turn the map on its side: Maya at the top, Sam at the bottom
  const tall = box.clientWidth < 520;
  const W = tall ? 340 : 640, H = tall ? 640 : 340;
  const P = (n: N) => (tall ? { x: n.y, y: n.x } : { x: n.x, y: n.y });
  const svg = d3.select(box).append("svg").attr("viewBox", `0 0 ${W} ${H}`).style("width", "100%").style("max-width", tall ? "400px" : "none").style("display", "block").style("margin", "0 auto").style("height", "auto").attr("role", "img").attr("aria-label", "Network of routers between Maya and Sam");
  if (tall) svg.append("rect").attr("x", 10).attr("y", 250).attr("width", W - 20).attr("height", 140).attr("rx", 14).attr("fill", "rgba(56,189,248,0.06)");
  else svg.append("rect").attr("x", 250).attr("y", 10).attr("width", 140).attr("height", H - 20).attr("rx", 14).attr("fill", "rgba(56,189,248,0.06)");
  svg.append("text").attr("x", tall ? 40 : 320).attr("y", tall ? 324 : 30).attr("text-anchor", "middle").attr("fill", css("--net")).attr("font-size", 12).attr("font-family", "JetBrains Mono, monospace").text("Atlantic");
  const cut = new Set<string>(), down = new Set<string>();
  const key = (a: string, b: string) => [a, b].sort().join("-");
  const byId = Object.fromEntries(NODES.map((n) => [n.id, { ...n, ...P(n) }]));
  const gE = svg.append("g"), gP = svg.append("g"), gN = svg.append("g");
  const edges = gE.selectAll("g").data(EDGES).join("g").style("cursor", "pointer");
  edges.append("line").attr("class", "hit").attr("stroke", "transparent").attr("stroke-width", 18);
  edges.append("line").attr("class", "vis").attr("stroke-width", (d) => (d[2] ? 3.5 : 2));
  edges.selectAll("line").attr("x1", (d) => byId[(d as never)[0]].x).attr("y1", (d) => byId[(d as never)[0]].y).attr("x2", (d) => byId[(d as never)[1]].x).attr("y2", (d) => byId[(d as never)[1]].y);
  const nodes = gN.selectAll("g").data(NODES).join("g").attr("transform", (d) => `translate(${P(d).x},${P(d).y})`).style("cursor", (d) => (d.end ? "default" : "pointer"));
  nodes.append("circle").attr("r", (d) => (d.end ? 20 : 15)).attr("stroke-width", 2);
  nodes.append("text").attr("text-anchor", "middle").attr("dy", 4).attr("font-size", (d) => (d.end ? 11 : 12)).attr("font-weight", 700).attr("fill", css("--text")).text((d) => d.id);
  let path: string[] = [];
  function route() {
    const adj: Record<string, string[]> = {};
    for (const [a, b] of EDGES) { if (cut.has(key(a, b)) || down.has(a) || down.has(b)) continue; (adj[a] ??= []).push(b); (adj[b] ??= []).push(a); }
    const prev: Record<string, string | null> = { Maya: null }; const q = ["Maya"];
    while (q.length) { const u = q.shift()!; if (u === "Sam") break; for (const v of adj[u] ?? []) if (!(v in prev)) { prev[v] = u; q.push(v); } }
    if (!("Sam" in prev)) return [];
    const p: string[] = []; for (let u: string | null = "Sam"; u; u = prev[u]) p.unshift(u); return p;
  }
  function paint() {
    path = route();
    const onPath = new Set(path.slice(1).map((n, i) => key(path[i], n)));
    edges.select<SVGLineElement>("line.vis").attr("stroke", (d) => (cut.has(key(d[0], d[1])) ? css("--bad") : onPath.has(key(d[0], d[1])) ? css("--net") : css("--line"))).attr("stroke-dasharray", (d) => (cut.has(key(d[0], d[1])) ? "6 6" : null)).attr("stroke-opacity", (d) => (onPath.has(key(d[0], d[1])) ? 1 : 0.8));
    nodes.select("circle").attr("fill", (d) => (down.has(d.id) ? "#3a1420" : d.end ? css("--panel2") : css("--panel"))).attr("stroke", (d) => (down.has(d.id) ? css("--bad") : d.end ? css(d.id === "Maya" ? "--net" : "--good") : path.includes(d.id) ? css("--net") : css("--line")));
    hops.textContent = path.length ? String(path.length - 1) : "no route";
    hops.style.color = path.length ? "var(--net)" : "var(--bad)";
  }
  edges.on("click", (_, d) => { const k = key(d[0], d[1]); cut.has(k) ? cut.delete(k) : cut.add(k); paint(); sfx(cut.has(k) ? "miss" : "hit", 0.25); say.textContent = path.length ? (cut.has(k) ? "Link gone. The routers on either side notice and update their signposts. Packets flow around the damage." : "Cable repaired.") : "No route left at all. Even a self-healing network needs at least one path."; });
  nodes.on("click", (_, d) => { if (d.end) return; down.has(d.id) ? down.delete(d.id) : down.add(d.id); paint(); sfx(down.has(d.id) ? "powerdown" : "hit", 0.25); say.textContent = path.length ? (down.has(d.id) ? `Router ${d.id} crashed. Same thing: its neighbours route around it.` : `Router ${d.id} is back.`) : "No route left. Repair something."; });
  anchor.addEventListener("click", () => {
    const sea = path.slice(1).map((n, i) => [path[i], n]).find(([a, b]) => EDGES.some((e) => e[2] && key(e[0], e[1]) === key(a, b)));
    if (!sea) { say.textContent = "No ocean cable in use right now."; return; }
    cut.add(key(sea[0], sea[1])); paint(); sfx("miss", 0.3);
    say.textContent = path.length ? "A ship dragged its anchor across the cable in use. Within moments, packets take another cable." : "That was the last cable. No route to London.";
  });
  crash.addEventListener("click", () => {
    const r = path.find((n) => !byId[n].end && !down.has(n));
    if (!r) return;
    down.add(r); paint(); sfx("powerdown", 0.3);
    say.textContent = path.length ? `Router ${r} crashed. Traffic reroutes again.` : "No route left. Repair something.";
  });
  fix.addEventListener("click", () => { cut.clear(); down.clear(); paint(); sfx("hit", 0.25); say.textContent = "Everything repaired. The shortest route is back."; });
  paint();
  // packets flowing along the current path
  const dots = gP.selectAll("circle").data(d3.range(6)).join("circle").attr("r", 5).attr("fill", "#EEF2FF").attr("opacity", 0);
  const t0 = performance.now();
  let vis = true; new IntersectionObserver((e) => (vis = e[0].isIntersecting)).observe(box);
  d3.timer(() => {
    if (!vis || path.length < 2) { dots.attr("opacity", 0); return; }
    const segs = path.length - 1, T = segs * 0.45;
    const now = reducedMotion() ? 0 : (performance.now() - t0) / 1000;
    dots.each(function (i) {
      const k = ((now / T + i / 6) % 1) * segs, s = Math.floor(k), f = k - s;
      const a = byId[path[s]], b = byId[path[s + 1]];
      d3.select(this).attr("cx", a.x + (b.x - a.x) * f).attr("cy", a.y + (b.y - a.y) * f).attr("opacity", 0.9);
    });
  });
}
