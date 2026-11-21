import { lib } from "../kit/libs";
import { h, sfx, takeaway, fmt, css, reducedMotion } from "../kit/ui";
import { seg, stat } from "../kit/episode";
import { Ring, hash, MAX, modLookup, USERS } from "./ring";

const COLOURS = ["#38BDF8", "#4ADE80", "#F5A524", "#A78BFA", "#FB7185", "#2DD4BF", "#FACC15", "#F472B6"];
const NAMES = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"];
const colourOf = (s: string) => COLOURS[NAMES.indexOf(s) % COLOURS.length];

/** Draw a ring: server points as coloured ticks, sample keys as dots coloured by their server. */
function ringSvg(size = 360) {
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${size} ${size}`); svg.setAttribute("role", "img"); svg.setAttribute("aria-label", "A hash ring with servers and users placed around it");
  svg.style.cssText = "width:100%; max-width:420px; display:block; margin:auto";
  const c = size / 2, R = size * 0.38;
  const xy = (pos: number, r: number) => { const a = (pos / MAX) * 2 * Math.PI - Math.PI / 2; return [c + r * Math.cos(a), c + r * Math.sin(a)]; };
  function draw(ring: Ring, keys: string[], moved: Set<string> = new Set(), labels = true) {
    svg.innerHTML = `<circle cx="${c}" cy="${c}" r="${R}" fill="none" stroke="#26315A" stroke-width="10"/>`;
    for (const k of keys) {
      const [x, y] = xy(hash(k), R - 22), s = ring.lookup(k);
      const m = moved.has(k);
      svg.insertAdjacentHTML("beforeend", `<circle cx="${x}" cy="${y}" r="${m ? 5 : 3.4}" fill="${colourOf(s)}" ${m ? 'stroke="#fff" stroke-width="1.5"' : 'opacity="0.85"'}/>`);
    }
    const big = ring.vnodes <= 3;
    for (const p of ring.points) {
      const [x1, y1] = xy(p.pos, R - 8), [x2, y2] = xy(p.pos, R + 8);
      svg.insertAdjacentHTML("beforeend", `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${colourOf(p.server)}" stroke-width="${big ? 5 : 2}" stroke-linecap="round"/>`);
      if (labels && big) { const [lx, ly] = xy(p.pos, R + 26); svg.insertAdjacentHTML("beforeend", `<text x="${lx}" y="${ly + 4}" text-anchor="middle" fill="${colourOf(p.server)}" font-size="13" font-weight="700">${p.server}</text>`); }
    }
  }
  return { svg, draw };
}

/** Hero: the ring. Add and remove servers and see which users move. */
export function ringHero() {
  let n = 4;
  const keys = USERS.slice(0, 220);
  const r = ringSvg();
  const sMoved = stat("of users moved", "--storage"), sMod = stat("would move with hash mod N", "--bad");
  const add = h("button.btn.primary", { type: "button" }, "Add a server");
  const rem = h("button.btn", { type: "button" }, "Remove a server");
  const say = h("p.dim", { "aria-live": "polite", style: "min-height:3em; margin:0" }, "Each user walks clockwise to the first server they meet.");
  let ring = new Ring(NAMES.slice(0, n));
  function change(k: number) {
    const old = ring, oldN = n;
    n = Math.max(2, Math.min(8, n + k)); if (n === oldN) return;
    ring = new Ring(NAMES.slice(0, n));
    const moved = new Set(keys.filter((u) => old.lookup(u) !== ring.lookup(u)));
    const all = USERS.slice(0, 5000);
    const ringMoved = all.filter((u) => old.lookup(u) !== ring.lookup(u)).length / all.length;
    const modMoved = all.filter((u) => modLookup(u, oldN) !== modLookup(u, n)).length / all.length;
    r.draw(ring, keys, moved);
    sMoved.v.textContent = `${Math.round(ringMoved * 100)}%`; sMod.v.textContent = `${Math.round(modMoved * 100)}%`;
    say.textContent = k > 0 ? `${NAMES[n - 1]} joined. Only the users just before it moved (white rings).` : `${NAMES[oldN - 1]} left. Its users carried on clockwise to the next server. Nobody else moved.`;
    sfx(k > 0 ? "pop" : "powerdown", 0.2);
  }
  add.addEventListener("click", () => change(1)); rem.addEventListener("click", () => change(-1));
  r.draw(ring, keys);
  sMoved.v.textContent = "–"; sMod.v.textContent = "–";
  return h("div.bench", { style: "display:grid; gap:10px" }, r.svg, h("div.row", {}, add, rem), h("div.stats", {}, sMoved.el, sMod.el), say,
    h("p.note", { style: "margin:0" }, "Real hashing of user IDs, running in your browser. Percentages use 5,000 users; one server per point on the ring."));
}

/** Hash and divide: user 42 always lands on the same server, until N changes. */
export function modLab(bench: HTMLElement) {
  const user = h("input#md-u", { type: "text", value: "user-42", spellcheck: "false", "aria-label": "User ID", style: "font: 600 0.95rem var(--mono); padding:8px 10px; border-radius:8px; border:1px solid var(--line); background:var(--bg); color:var(--text); width:100%" }) as HTMLInputElement;
  const n = h("input#md-n", { type: "range", min: 2, max: 10, step: 1, value: 4 }) as HTMLInputElement;
  const nOut = h("output", {});
  const maths = h("pre.json", {});
  const sM = stat("of 20,000 users move when you go from N to N+1", "--bad");
  const bars = h("div", { style: "display:grid; gap:4px" });
  function draw() {
    const N = +n.value; nOut.textContent = String(N);
    const hv = hash(user.value);
    maths.innerHTML = `hash("${user.value.replace(/</g, "&lt;")}") = <span class="n">${hv}</span>\n${hv} mod ${N} = <span class="s">${hv % N}</span>  →  server ${hv % N + 1}\n${hv} mod ${N + 1} = <span class="s">${hv % (N + 1)}</span>  →  server ${hv % (N + 1) + 1} after adding one`;
    const moved = USERS.filter((u) => modLookup(u, N) !== modLookup(u, N + 1)).length / USERS.length;
    sM.v.textContent = `${Math.round(moved * 100)}%`;
    const counts = Array(N).fill(0); USERS.forEach((u) => counts[hash(u) % N]++);
    bars.innerHTML = "";
    counts.forEach((c, i) => bars.append(h("div.meter", { style: "grid-template-columns: 5em minmax(0,1fr) 4em" }, h("span", {}, `Server ${i + 1}`), h("div.track", {}, h("i", { style: `width:${(c / USERS.length) * N * 50}%; background:${COLOURS[i % 8]}` })), h("b", {}, `${fmt((c / USERS.length) * 100, 1)}%`))));
  }
  user.addEventListener("input", draw); n.addEventListener("input", () => { draw(); sfx("tick", 0.1); });
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:12px; align-content:start" }, h("label.field", { for: "md-u" }, "User ID", user), h("label.field", { for: "md-n" }, h("span", {}, "Servers N: ", nOut), n), maths, sM.el),
      h("div", { style: "display:grid; gap:8px; align-content:start" }, h("span.eyebrow", {}, "How 20,000 users spread"), bars),
    ),
    h("p.note", {}, "The episode's simulation (100,000 users, MD5) found 80% move from 4 to 5 servers. In general, going from N to N+1 moves about N out of N+1 users."),
    takeaway("Hash and divide is simple and even. But change the number of servers and almost every user moves."),
  );
  draw();
}

/** Virtual nodes: more points per server, more even shares. */
export async function vnodeLab(bench: HTMLElement) {
  const v = h("input#vn-v", { type: "range", min: 0, max: 3, step: 0.01, value: 0 }) as HTMLInputElement;
  const vOut = h("output", {});
  const r = ringSvg(320);
  const sMin = stat("smallest share", "--storage"), sMax = stat("largest share", "--bad");
  const box = h("div.chart-box", { style: "height:200px" }, h("canvas", { "aria-label": "Share of users per server" }));
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:12px; align-content:start" }, h("label.field", { for: "vn-v" }, h("span", {}, "Points on the ring per server: ", vOut), v), h("div.stats", {}, sMin.el, sMax.el), box),
      r.svg,
    ),
    h("p.note", {}, "Five servers, 20,000 users, hashed in your browser. The episode's run found 2%–48% with one point each and 16%–22% with 100 each; yours will be close but not identical."),
    takeaway("Place every server on the ring many times, under slightly different names. These are virtual nodes."),
  );
  const { Chart } = await lib.chart();
  const chart = new Chart(box.querySelector("canvas")!, {
    type: "bar", data: { labels: NAMES.slice(0, 5), datasets: [{ label: "share of users (%)", data: [], backgroundColor: COLOURS.slice(0, 5), borderRadius: 6 }] },
    options: { maintainAspectRatio: false, animation: { duration: reducedMotion() ? 0 : 300 }, plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 60, ticks: { color: css("--faint"), callback: (x) => `${x}%` }, grid: { color: "rgba(120,140,220,0.08)" } }, x: { ticks: { color: css("--dim") }, grid: { display: false } } } },
  });
  function draw() {
    const k = Math.round(10 ** +v.value); vOut.textContent = String(k);
    const ring = new Ring(NAMES.slice(0, 5), k);
    const counts: Record<string, number> = {}; USERS.forEach((u) => { const s = ring.lookup(u); counts[s] = (counts[s] ?? 0) + 1; });
    const shares = NAMES.slice(0, 5).map((s) => ((counts[s] ?? 0) / USERS.length) * 100);
    chart.data.datasets[0].data = shares as never; chart.update();
    sMin.v.textContent = `${fmt(Math.min(...shares), 1)}%`; sMax.v.textContent = `${fmt(Math.max(...shares), 1)}%`;
    r.draw(ring, USERS.slice(0, 160), new Set(), k <= 3);
  }
  v.addEventListener("input", draw); draw();
}

/** The busy night: a fifth cache server joins. How many requests miss and hit the database? */
export async function busyLab(bench: HTMLElement) {
  let mode: "mod" | "ring" = "ring";
  const pick = seg("How users are mapped", [["hash mod N", "mod"], ["Ring + 100 virtual nodes", "ring"]], mode, (x) => { mode = x as typeof mode; draw(); sfx("tick", 0.15); });
  const box = h("div.chart-box", { style: "height:260px" }, h("canvas", { "aria-label": "Database load after adding a server" }));
  const sP = stat("extra database load at the moment the server joins", "--bad");
  bench.append(
    h("div.bench-grid", {}, h("div", { style: "display:grid; gap:12px; align-content:start" }, pick, sP.el,
      h("p.dim", { style: "margin:0" }, "Each moved user's first request misses the cache and goes to the database. Caches warm up again over a few minutes.")), box),
    h("p.note", {}, "Illustrative: the database normally handles 5% of requests (cache misses); the server joins at minute 5; caches rewarm with a 2-minute half-life."),
    takeaway("With a ring, the database sees a small bump in misses, not a flood."),
  );
  const { Chart } = await lib.chart();
  const t = Array.from({ length: 41 }, (_, i) => i / 2);
  const chart = new Chart(box.querySelector("canvas")!, {
    type: "line", data: { labels: t.map((x) => (x % 5 === 0 ? `${x} min` : "")), datasets: [{ label: "database load (% of normal capacity)", data: [], borderColor: css("--storage"), backgroundColor: "rgba(245,165,36,0.12)", fill: true, pointRadius: 0, borderWidth: 2.5 }, { label: "database limit", data: t.map(() => 100), borderColor: css("--bad"), borderDash: [6, 6], pointRadius: 0, borderWidth: 1.5 }] },
    options: { maintainAspectRatio: false, animation: { duration: reducedMotion() ? 0 : 500 }, plugins: { legend: { labels: { color: css("--dim"), boxWidth: 12 } } }, scales: { y: { min: 0, max: 400, ticks: { color: css("--faint"), callback: (x) => `${x}%` }, grid: { color: "rgba(120,140,220,0.08)" } }, x: { ticks: { color: css("--faint"), autoSkip: false, maxRotation: 0 }, grid: { display: false } } } },
  });
  const sample = USERS.slice(0, 8000);
  const movedMod = sample.filter((u) => modLookup(u, 4) !== modLookup(u, 5)).length / sample.length;
  const r4 = new Ring(NAMES.slice(0, 4), 100), r5 = new Ring(NAMES.slice(0, 5), 100);
  const movedRing = sample.filter((u) => r4.lookup(u) !== r5.lookup(u)).length / sample.length;
  function draw() {
    const m = mode === "mod" ? movedMod : movedRing;
    // normal: 5% misses = 25% of DB capacity; moved users' requests all miss at first
    const load = t.map((x) => x < 5 ? 25 : 25 + 500 * m * Math.pow(0.5, (x - 5) / 2) * 0.95);
    chart.data.datasets[0].data = load as never; chart.update();
    sP.v.textContent = `${fmt(Math.max(...load) / 25, 1)}× normal`;
  }
  draw();
}

/** Hot keys and replicas: a celebrity's key, and copies on the next servers clockwise. */
export function hotLab(bench: HTMLElement) {
  const ring = new Ring(NAMES.slice(0, 5), 100);
  const down = new Set<string>();
  const reps = h("input#hk-r", { type: "range", min: 1, max: 3, step: 1, value: 1 }) as HTMLInputElement;
  const rOut = h("output", {});
  const grid = h("div", { style: "display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:6px" });
  const keyEl = h("pre.json", {});
  const celeb = h("input#hk-c", { type: "checkbox" }) as HTMLInputElement;
  const say = h("p.dim", { "aria-live": "polite", style: "min-height:3em; margin:0" });
  const KEY = "user:celebrity-1";
  function draw() {
    const n = +reps.value; rOut.textContent = String(n);
    const holders = ring.replicas(KEY, n);
    const counts: Record<string, number> = {}; USERS.slice(0, 5000).forEach((u) => { const s = ring.lookup(u); counts[s] = (counts[s] ?? 0) + 1; });
    if (celeb.checked) counts[holders[0]] = (counts[holders[0]] ?? 0) + 12000;
    const maxC = Math.max(...Object.values(counts));
    grid.innerHTML = "";
    NAMES.slice(0, 5).forEach((s) => {
      const isDown = down.has(s), holds = holders.includes(s);
      const b = h("button", { type: "button", class: "srvcard", style: `--sc: ${isDown ? "var(--bad)" : colourOf(s)}` }, h("b", {}, `${s}${isDown ? " ✕" : ""}`),
        h("div", { class: "srvbar" }, h("i", { style: `width:${isDown ? 0 : ((counts[s] ?? 0) / maxC) * 100}%` })), h("span", {}, holds ? (holders[0] === s ? "★ main copy" : "★ replica") : "—"));
      b.addEventListener("click", () => { down.has(s) ? down.delete(s) : down.add(s); draw(); sfx(down.has(s) ? "powerdown" : "hit", 0.2); });
      grid.append(b);
    });
    const alive = holders.filter((s) => !down.has(s));
    keyEl.textContent = `${KEY}\n→ clockwise: ${holders.join(", ")}`;
    say.innerHTML = !alive.length ? `<b style="color:var(--bad)">The celebrity's data is gone.</b> Every server holding it is down. Add replicas.` : celeb.checked ? `One key gets as much traffic as thousands of users, and it all lands on ${holders[0]}. Consistent hashing spreads keys, not load: that's a hot key.` : `Data is safe while any of ${holders.join(", ")} is up. Tap a server to crash it.`;
  }
  reps.addEventListener("input", draw); celeb.addEventListener("change", () => { draw(); sfx("tick", 0.15); });
  bench.append(
    h("div.bench-grid", {}, h("div", { style: "display:grid; gap:12px; align-content:start" },
      h("label.field", { for: "hk-r" }, h("span", {}, "Copies (main + next servers clockwise): ", rOut), reps),
      h("label.row", { for: "hk-c", style: "gap:8px; color:var(--text)" }, celeb, "A celebrity posts: 12,000 requests for one key"), keyEl, say), grid),
    h("p.note", {}, "Bars show requests per server. Dynamo-style systems copy each key to the next servers clockwise (DeCandia et al., 2007). Hot keys need their own fix: an extra cache in front, or splitting the key."),
    takeaway("Copy each key to the next two or three servers clockwise, and protect hot keys separately."),
  );
  draw();
}
