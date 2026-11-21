import { lib } from "../kit/libs";
import { h, sfx, takeaway, fmt, css, sleep, reducedMotion } from "../kit/ui";
import { seg, stat, seeded } from "../kit/episode";
import { Pool, type Algo } from "./sim";

/** Draw a pool as rows of servers with live load bars. */
function poolView(pool: Pool, onClick?: (i: number) => void) {
  const el = h("div", { style: "display:grid; grid-template-columns:repeat(auto-fill,minmax(110px,1fr)); gap:6px" });
  const paint = () => {
    el.innerHTML = "";
    pool.servers.forEach((s, i) => {
      const load = Math.min(1, s.active.length / (8 * s.weight));
      const c = !s.up ? "--bad" : s.draining ? "--storage" : !s.healthy ? "--bad" : load > 0.85 ? "--storage" : "--good";
      const b = h("button", { type: "button", class: "srvcard", style: `--sc: var(${c})`, title: onClick ? "Tap to crash or revive" : "" },
        h("b", {}, `Server ${s.id}${s.weight > 1 ? ` ×${s.weight}` : ""}`),
        h("div", { class: "srvbar" }, h("i", { style: `width:${s.up ? load * 100 : 0}%` })),
        h("span", {}, !s.up ? (s.healthy ? "down · still getting traffic" : "down · removed") : s.draining ? "draining" : `${s.active.length} in progress`));
      if (onClick) b.addEventListener("click", () => onClick(i));
      el.append(b);
    });
  };
  return { el, paint };
}

/** Hero: one address in front of a pool. Pick an algorithm, crash servers, and watch the load balancer route around them. */
export function lbHero() {
  let algo: Algo = "lc";
  const pool = new Pool(6, algo);
  const view = poolView(pool, (i) => { const s = pool.servers[i]; s.up = !s.up; sfx(s.up ? "hit" : "powerdown", 0.25); });
  const pick = seg("Algorithm", [["Round robin", "rr"], ["Least connections", "lc"], ["Random", "random"]], algo, (v) => { algo = v as Algo; pool.algo = algo; sfx("tick", 0.15); });
  const checks = h("input#hero-hc", { type: "checkbox", checked: true }) as HTMLInputElement;
  const sOk = stat("requests served per second", "--good"), sBad = stat("requests failed per second", "--bad");
  const door = h("div.box", { style: "--bc: var(--net); min-height:auto; text-align:center" }, h("b", {}, "app.example · one address"), h("span", {}, "the load balancer"));
  const el = h("div.bench", { style: "display:grid; gap:10px" }, door, pick,
    h("label.row", { for: "hero-hc", style: "gap:8px; color:var(--text)" }, checks, "Health checks on"),
    view.el, h("div.stats", {}, sOk.el, sBad.el),
    h("p.note", { style: "margin:0" }, "Tap a server to crash it or bring it back. Requests take between 0.1 s and 2 s of work (illustrative)."));
  const r = seeded(3);
  let last = performance.now(), acc = 0, okWin = 0, badWin = 0, winT = 0, vis = true, hcT = 0;
  new IntersectionObserver((e) => (vis = e[0].isIntersecting)).observe(el);
  function frame(now: number) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!vis) return;
    acc += dt * 30; // 30 requests a second arrive
    while (acc >= 1) { acc--; const before = pool.failed; pool.send(r() < 0.85 ? 0.1 + r() * 0.3 : 1 + r(), checks.checked); if (pool.failed > before) badWin++; else okWin++; }
    pool.tick(dt);
    hcT += dt; if (hcT > 0.6) { hcT = 0; pool.servers.forEach((s) => (s.healthy = checks.checked ? s.up : true)); }
    winT += dt; if (winT > 1) { sOk.v.textContent = fmt(okWin / winT); sBad.v.textContent = fmt(badWin / winT); okWin = badWin = 0; winT = 0; view.paint(); }
  }
  view.paint(); requestAnimationFrame(frame);
  checks.addEventListener("change", () => sfx("tick", 0.15));
  return el;
}

/** DNS round robin: a dead address lives on in caches until the TTL runs out. */
export async function dnsRrLab(bench: HTMLElement) {
  let ttl = 300;
  const pick = seg("TTL on the DNS answer", [["1 minute", 60], ["5 minutes", 300], ["1 hour", 3600]], ttl, (v) => { ttl = v; draw(); sfx("tick", 0.15); });
  const n = h("input#rr-n", { type: "range", min: 2, max: 20, step: 1, value: 4 }) as HTMLInputElement;
  const nOut = h("output", {});
  const sPeak = stat("of requests failing right after the crash", "--bad"), sDur = stat("until every cached copy has expired", "--storage");
  const box = h("div.chart-box", { style: "height:240px" }, h("canvas", { "aria-label": "Share of requests failing after one server crashes" }));
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:12px; align-content:start" }, h("label.field", { for: "rr-n" }, h("span", {}, "Servers in the DNS answer: ", nOut), n), pick, h("div.stats", {}, sPeak.el, sDur.el),
        h("p.dim", { style: "margin:0" }, "One server crashes at time 0. Phones and resolvers that cached the old list keep picking its address until their copy expires.")),
      box,
    ),
    h("p.note", {}, "Simplified: each cached list was fetched at a random moment, and phones pick evenly from the list. DNS load balancing is RFC 1794; caching and TTLs are from Episode 7."),
    takeaway("DNS round robin spreads traffic, but it can't see crashes or load, and every change waits for caches to expire."),
  );
  const { Chart } = await lib.chart();
  const xs = Array.from({ length: 61 }, (_, i) => i);
  const chart = new Chart(box.querySelector("canvas")!, {
    type: "line", data: { labels: [], datasets: [{ label: "requests failing (%)", data: [], borderColor: css("--bad"), backgroundColor: "rgba(248,113,113,0.12)", fill: true, pointRadius: 0, borderWidth: 2.5 }] },
    options: { maintainAspectRatio: false, animation: { duration: reducedMotion() ? 0 : 400 }, plugins: { legend: { labels: { color: css("--dim"), boxWidth: 12 } } }, scales: { y: { min: 0, max: 50, ticks: { color: css("--faint"), callback: (v) => `${v}%` }, grid: { color: "rgba(120,140,220,0.08)" } }, x: { ticks: { color: css("--faint"), maxTicksLimit: 7 }, grid: { display: false } } } },
  });
  function draw() {
    const k = +n.value; nOut.textContent = String(k);
    const span = ttl; // show 0..TTL
    const pts = xs.map((i) => { const t = (i / 60) * span * 1.2; return Math.max(0, (1 - t / ttl) * (100 / k)); });
    chart.data.labels = (xs.map((i) => { const t = (i / 60) * span * 1.2; return t < 120 ? `${Math.round(t)} s` : `${Math.round(t / 60)} min`; }) as never);
    chart.data.datasets[0].data = pts as never; chart.update();
    sPeak.v.textContent = `${fmt(100 / k, 1)}%`; sDur.v.textContent = ttl < 120 ? `${ttl} s` : `${ttl / 60} min`;
  }
  n.addEventListener("input", draw); draw();
}

/** Forward or reverse proxy? Sort the examples. */
export function proxyLab(bench: HTMLElement) {
  const Q: [string, number, string][] = [
    ["A VPN on Maya's laptop", 0, "It works for the user, making requests on her behalf and hiding who she is."],
    ["A school network filter that blocks games", 0, "It sits on the users' side and decides what they may reach."],
    ["A CDN in front of the video app", 1, "It works for the servers: you talk to it, it passes misses to the origin."],
    ["A load balancer in front of 20 servers", 1, "One public address, and servers you never see behind it."],
    ["An API gateway like Netflix's Zuul", 1, "A layer 7 reverse proxy that routes each request to the right service (Episode 14)."],
  ];
  const grid = h("div", { style: "display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr)); gap:10px" });
  const score = h("p.dim", { "aria-live": "polite" }, "Who does each proxy work for?");
  let right = 0, done = 0;
  Q.forEach(([q, a, why]) => {
    const w = h("p.dim", { style: "margin:0; font-size:var(--step--1)", hidden: true }, why);
    const opts = h("div", { style: "display:grid; grid-template-columns:1fr 1fr; gap:6px" });
    [["Forward · for the user", "--net"], ["Reverse · for the servers", "--good"]].forEach(([t], i) => {
      const b = h("button.btn", { type: "button", style: "justify-content:center; font-size:0.8rem; padding:7px" }, t);
      b.addEventListener("click", () => { if (opts.dataset.done) return; opts.dataset.done = "1"; done++; const ok = i === a; if (ok) right++; const g = opts.children[a] as HTMLElement; g.style.borderColor = "var(--good)"; g.style.color = "var(--good)"; if (!ok) b.style.borderColor = "var(--bad)"; w.hidden = false; sfx(ok ? "hit" : "miss", 0.2); score.textContent = `${right} of ${done}` + (done === Q.length ? ". A load balancer is a reverse proxy whose main job is spreading work." : ""); });
      opts.append(b);
    });
    grid.append(h("div.q", { style: "align-content:start" }, h("b", {}, q), opts, w));
  });
  bench.append(
    h("div", { style: "display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr)); gap:10px; margin-bottom:14px" },
      h("div.box", { style: "--bc: var(--net); min-height:auto" }, h("b", {}, "Forward proxy"), h("span", {}, "You → [proxy] → the internet. Works for the user and hides who you are.")),
      h("div.box", { style: "--bc: var(--good); min-height:auto" }, h("b", {}, "Reverse proxy"), h("span", {}, "The internet → [proxy] → servers you never see. Works for the servers."))),
    grid, score, takeaway("Same middleman, two jobs. A load balancer is a reverse proxy."));
}

/** Race the algorithms on the same stream of requests, some of them slow. */
export async function algoLab(bench: HTMLElement) {
  const mix = h("input#al-slow", { type: "range", min: 0, max: 30, step: 1, value: 10 }) as HTMLInputElement;
  const mixOut = h("output", {});
  const big = h("input#al-big", { type: "checkbox", checked: true }) as HTMLInputElement;
  const run = h("button.btn.primary", { type: "button", style: "justify-self:start" }, "Run 3,000 requests");
  const box = h("div.chart-box", { style: "height:260px" }, h("canvas", { "aria-label": "Busiest server's queue for each algorithm" }));
  const say = h("p.dim", { "aria-live": "polite", style: "min-height:3em; margin:0" });
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:12px; align-content:start" },
        h("label.field", { for: "al-slow" }, h("span", {}, "Slow requests (2–4 s of work): ", mixOut), mix),
        h("label.row", { for: "al-big", style: "gap:8px; color:var(--text)" }, big, "Two of the five servers are twice as powerful"),
        run, say),
      box,
    ),
    h("p.note", {}, "Simulated in your browser: 5 servers, 50 requests a second for 60 s; fast requests take 0.1–0.3 s. The bars show the average and worst number of requests waiting on the busiest server."),
    takeaway("Round robin is simple. Weighted round robin respects bigger servers. Least connections copes best when some requests are slow."),
  );
  const { Chart } = await lib.chart();
  const ALGOS: [Algo, string][] = [["rr", "Round robin"], ["wrr", "Weighted RR"], ["lc", "Least connections"], ["random", "Random"]];
  const chart = new Chart(box.querySelector("canvas")!, {
    type: "bar", data: { labels: ALGOS.map(([, n]) => n), datasets: [{ label: "average queue on the busiest server", data: [], backgroundColor: css("--net"), borderRadius: 6 }, { label: "worst moment", data: [], backgroundColor: css("--bad"), borderRadius: 6 }] },
    options: { maintainAspectRatio: false, plugins: { legend: { labels: { color: css("--dim"), boxWidth: 12 } } }, scales: { y: { beginAtZero: true, ticks: { color: css("--faint") }, grid: { color: "rgba(120,140,220,0.08)" } }, x: { ticks: { color: css("--dim") }, grid: { display: false } } } },
  });
  function simulate(algo: Algo) {
    const weights = big.checked ? [2, 2, 1, 1, 1] : [1, 1, 1, 1, 1];
    const pool = new Pool(5, algo, weights), r = seeded(41);
    let avg = 0, worst = 0, steps = 0;
    for (let t = 0; t < 60; t += 0.02) {
      if (r() < 50 * 0.02) pool.send(r() * 100 < +mix.value ? 2 + r() * 2 : 0.1 + r() * 0.2, true);
      pool.tick(0.02);
      const q = Math.max(...pool.servers.map((s) => s.active.length / s.weight));
      avg += q; worst = Math.max(worst, q); steps++;
    }
    return [avg / steps, worst];
  }
  run.addEventListener("click", () => {
    mixOut.textContent = `${mix.value}%`;
    const res = ALGOS.map(([a]) => simulate(a));
    chart.data.datasets[0].data = res.map((x) => +x[0].toFixed(1)) as never; chart.data.datasets[1].data = res.map((x) => +x[1].toFixed(1)) as never; chart.update();
    const best = ALGOS[res.reduce((b, x, i) => (x[0] < res[b][0] ? i : b), 0)][1];
    say.textContent = `Lowest average queue: ${best}.`;
    sfx("hit", 0.2);
  });
  mix.addEventListener("input", () => (mixOut.textContent = `${mix.value}%`));
  big.addEventListener("change", () => run.click());
  run.click();
}

/** Health checks: how often, and how many failures before a server is removed. */
export function healthLab(bench: HTMLElement) {
  const every = h("input#hc-every", { type: "range", min: 1, max: 30, step: 1, value: 5 }) as HTMLInputElement;
  const fails = h("input#hc-fails", { type: "range", min: 1, max: 5, step: 1, value: 3 }) as HTMLInputElement;
  const deep = h("input#hc-deep", { type: "checkbox" }) as HTMLInputElement;
  const eOut = h("output", {}), fOut = h("output", {});
  const sDet = stat("to notice a crashed server", "--storage"), sLost = stat("requests sent to it in that time", "--bad"), sFalse = stat("healthy servers wrongly removed per day (2 s blips)", "--cpu"), sDb = stat("a server with a broken database", "--text");
  function draw() {
    const e = +every.value, f = +fails.value;
    eOut.textContent = `every ${e} s`; fOut.textContent = `${f} in a row`;
    const det = e * (f - 0.5);
    sDet.v.textContent = `≈ ${fmt(det)} s`; sLost.v.textContent = fmt(det * 10);
    // a 2-second blip fails a check if it lands on one; f in a row needs the blip to span (f-1)*e
    const blipsPerDay = 50; const p = f === 1 ? Math.min(1, 2 / e) : 2 >= (f - 1) * e ? Math.min(1, (2 - (f - 1) * e) / e + 0.0001) : 0;
    sFalse.v.textContent = fmt(blipsPerDay * p, 1);
    sDb.v.textContent = deep.checked ? "removed ✓" : "still gets traffic ✕";
    sDb.v.style.color = deep.checked ? "var(--good)" : "var(--bad)";
  }
  [every, fails].forEach((x) => x.addEventListener("input", draw)); deep.addEventListener("change", () => { draw(); sfx("tick", 0.15); });
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:12px; align-content:start" },
        h("label.field", { for: "hc-every" }, h("span", {}, "Ask each server: ", eOut), every),
        h("label.field", { for: "hc-fails" }, h("span", {}, "Remove it after failures: ", fOut), fails),
        h("label.row", { for: "hc-deep", style: "gap:8px; color:var(--text)" }, deep, "Deep check: the server also tests its database")),
      h("div.stats", {}, sDet.el, sLost.el, sFalse.el, sDb.el),
    ),
    h("p.note", {}, "Illustrative: the server normally gets 10 requests a second, and suffers about 50 two-second hiccups a day. Engineers also drain a server before updating it: no new requests, but the ones in progress finish."),
    takeaway("Check often enough to catch real failures, slowly enough to ignore a short blip, and deeply enough to catch a broken dependency."),
  );
  draw();
}

/** Layer 4 vs layer 7: what each one can see, and what it can do with it. */
export function layersLab(bench: HTMLElement) {
  let mode: "4" | "7" = "4";
  const pick = seg("Load balancer type", [["Layer 4 · TCP", "4"], ["Layer 7 · HTTP", "7"]], mode, (v) => { mode = v as "4" | "7"; draw(); sfx("tick", 0.15); });
  const pkt = h("pre.json", {});
  const REQS: [string, string][] = [["GET /videos/42", "video"], ["POST /payments", "pay"], ["GET /videos/43", "video"], ["GET /feed", "web"], ["POST /payments", "pay"], ["GET /profile", "web"]];
  const groups = h("div", { style: "display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px" });
  const say = h("p.dim", { "aria-live": "polite", style: "min-height:3em; margin:0" });
  const send = h("button.btn.primary", { type: "button", style: "justify-self:start" }, "Send six requests");
  function draw() {
    pkt.innerHTML = mode === "4"
      ? `<span class="k">from</span> 198.51.100.7:51514  <span class="k">to</span> 203.0.113.10:443\n<span style="color:var(--faint)">▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒\n(encrypted HTTPS: it never opens the message)</span>`
      : `<span class="k">from</span> 198.51.100.7:51514  <span class="k">to</span> 203.0.113.10:443\n<span class="s">POST /payments HTTP/1.1\nHost: app.example\nCookie: session=7f3a…</span>\n<span style="color:var(--faint)">(it unlocks HTTPS, reads the request, then re-locks it)</span>`;
    say.textContent = mode === "4" ? "Layer 4 only sees addresses and ports. Extremely fast, but every request goes to the same pool." : "Layer 7 reads the HTTP request, so it can send videos to one group and payments to another. Smarter, a little slower.";
    groups.innerHTML = "";
    (mode === "4" ? [["Pool", "--net"]] : [["Video servers", "--cache"], ["Payment servers", "--good"], ["Web servers", "--net"]]).forEach(([n, c]) => groups.append(h("div.box", { style: `--bc: var(${c}); min-height:120px; align-content:start`, "data-g": n }, h("b", {}, n), h("div", { class: "drop", style: "display:grid; gap:4px" }))));
    if (mode === "4") (groups.firstElementChild as HTMLElement).style.gridColumn = "1 / -1";
  }
  send.addEventListener("click", async () => {
    draw();
    for (const [r, g] of REQS) {
      const target = mode === "4" ? groups.children[0] : groups.children[g === "video" ? 0 : g === "pay" ? 1 : 2];
      target.querySelector(".drop")!.append(h("span.mono", { style: "font-size:0.75rem" }, r));
      sfx("tick", 0.1); await sleep(reducedMotion() ? 0 : 250);
    }
  });
  bench.append(
    h("div.bench-grid", {}, h("div", { style: "display:grid; gap:10px; align-content:start" }, pick, h("span.eyebrow", {}, "What the load balancer can see"), pkt, say, send), groups),
    takeaway("Layer 4 for raw speed. Layer 7 to route by path, and to handle the HTTPS lock in one place."),
  );
  draw();
}

/** Launch day: autoscaling from 20 to 40 servers as traffic climbs. */
export async function launchLab(bench: HTMLElement) {
  const auto = h("input#ln-auto", { type: "checkbox", checked: true }) as HTMLInputElement;
  const run = h("button.btn.primary", { type: "button", style: "justify-self:start" }, "Play launch day");
  const box = h("div.chart-box", { style: "height:260px" }, h("canvas", { "aria-label": "Traffic, servers and failed requests during launch day" }));
  const say = h("p.dim", { "aria-live": "polite", style: "min-height:3em; margin:0" });
  bench.append(
    h("div.bench-grid", {}, h("div", { style: "display:grid; gap:12px; align-content:start" }, h("label.row", { for: "ln-auto", style: "gap:8px; color:var(--text)" }, auto, "Add servers automatically when load is high"), run, say), box),
    h("p.note", {}, "Illustrative: each server handles 1,000 requests a second; a new server takes 2 minutes to start. Server 7 crashes at minute 15 and is removed by health checks."),
    takeaway("The load balancer adds new servers to its pool as they come up, and drops crashed ones within seconds. Nobody outside notices."),
  );
  const { Chart } = await lib.chart();
  const mins = Array.from({ length: 61 }, (_, i) => i);
  const chart = new Chart(box.querySelector("canvas")!, {
    type: "line", data: { labels: mins.map((m) => (m % 10 === 0 ? `${m} min` : "")), datasets: [
      { label: "traffic (thousand req/s)", data: [], borderColor: css("--net"), pointRadius: 0, borderWidth: 2.5, yAxisID: "y" },
      { label: "healthy servers", data: [], borderColor: css("--good"), pointRadius: 0, borderWidth: 2.5, stepped: true, yAxisID: "y" },
      { label: "failed requests (%)", data: [], borderColor: css("--bad"), backgroundColor: "rgba(248,113,113,0.15)", fill: true, pointRadius: 0, borderWidth: 2, yAxisID: "y2" },
    ] },
    options: { maintainAspectRatio: false, animation: { duration: reducedMotion() ? 0 : 800 }, plugins: { legend: { labels: { color: css("--dim"), boxWidth: 12 } } }, scales: { y: { min: 0, max: 50, ticks: { color: css("--faint") }, grid: { color: "rgba(120,140,220,0.08)" } }, y2: { position: "right", min: 0, max: 100, ticks: { color: css("--faint"), callback: (v) => `${v}%` }, grid: { display: false } }, x: { ticks: { color: css("--faint"), autoSkip: false, maxRotation: 0 }, grid: { display: false } } } },
  });
  run.addEventListener("click", () => {
    const traffic = mins.map((m) => Math.min(36, 8 + 30 / (1 + Math.exp(-(m - 20) / 4))));
    const servers: number[] = [], failed: number[] = [];
    let n = 20, pending: number[] = [];
    mins.forEach((m, i) => {
      pending = pending.filter((t) => { if (t <= m) { n++; return false; } return true; });
      if (m === 15) n--;
      if (auto.checked && traffic[i] / n > 0.75 && n + pending.length < 40) for (let k = 0; k < 5 && n + pending.length < 40; k++) pending.push(m + 2);
      servers.push(n);
      failed.push(Math.max(0, Math.min(100, ((traffic[i] - n) / traffic[i]) * 100)));
    });
    chart.data.datasets[0].data = traffic as never; chart.data.datasets[1].data = servers as never; chart.data.datasets[2].data = failed as never; chart.update();
    const worst = Math.max(...failed);
    say.textContent = auto.checked ? `Twenty became ${servers.at(-1)}. Worst moment: ${fmt(worst)}% of requests failed.` : `Stuck at ${servers.at(-1)} servers. At the peak, ${fmt(worst)}% of requests failed.`;
    sfx(worst > 5 ? "miss" : "hit", 0.25);
  });
  auto.addEventListener("change", () => run.click());
  run.click();
}

/** Sticky sessions in memory vs a shared session store, when a server crashes. */
export function sessionLab(bench: HTMLElement) {
  let shared = false;
  const pick = seg("Where sessions live", [["In each server's memory", false], ["In a shared store", true]], shared, (v) => { shared = v; reset(); sfx("tick", 0.15); });
  const users = ["Maya", "Sam", "Ali", "Priya", "Tom", "Lena"];
  const grid = h("div", { style: "display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px" });
  const crash = h("button.btn", { type: "button" }, "Crash server 2");
  const say = h("p.dim", { "aria-live": "polite", style: "min-height:3em; margin:0" });
  let down = false;
  function reset() { down = false; draw(); say.textContent = shared ? "Any server can look up any user's session in the shared store." : "Each user is pinned to one server, which keeps their login in its own memory."; }
  function draw() {
    grid.innerHTML = "";
    [1, 2, 3].forEach((sv) => {
      const mine = users.filter((_, i) => (i % 3) + 1 === sv);
      const dead = down && sv === 2;
      grid.append(h("div.box", { style: `--bc: var(${dead ? "--bad" : "--good"}); min-height:auto` }, h("b", {}, `Server ${sv}${dead ? " ✕" : ""}`),
        ...(shared ? [h("span", {}, dead ? "down" : "stateless")] : mine.map((u) => h("span", {}, dead ? `${u}: session lost` : `${u}: logged in`)))));
    });
    if (shared) grid.append(h("div.box", { style: "--bc: var(--cache); min-height:auto; grid-column: 1 / -1" }, h("b", {}, "Shared session store"), h("span", {}, users.map((u) => `${u} ✓`).join(" · "))));
  }
  crash.addEventListener("click", () => {
    down = true; draw(); sfx("powerdown", 0.3);
    say.innerHTML = shared ? '<b style="color:var(--good)">Nobody notices.</b> Their next requests go to servers 1 and 3, which read the same session store.' : '<b style="color:var(--bad)">Sam and Tom are logged out.</b> Their sessions lived only in server 2\'s memory.';
  });
  bench.append(h("div.bench-grid", {}, h("div", { style: "display:grid; gap:12px; align-content:start" }, pick, h("div.row", {}, crash, h("button.btn", { type: "button", onclick: () => { reset(); sfx("hit", 0.2); } }, "Reset")), say), grid),
    takeaway("A load balancer can only spread work freely if any server can answer any request: keep the servers stateless."));
  reset();
}
