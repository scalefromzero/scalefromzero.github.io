import { lib } from "../kit/libs";
import { h, sfx, takeaway, fmt, css, reducedMotion } from "../kit/ui";
import { seg, stat, seeded } from "../kit/episode";
import { flow } from "../kit/flow";

/** Hero: two systems. Browse in the cloud, then press play and the video comes from a box in your ISP. */
export function netflixHero() {
  const f = flow([
    { key: "tv", name: "Maya's TV", sub: "the app", colour: "net" },
    { key: "gw", name: "API gateway", sub: "Zuul · in the cloud", colour: "cache" },
    { key: "svc", name: "Services", sub: "profiles · rows · playback", colour: "cache" },
    { key: "steer", name: "Steering", sub: "which video server?", colour: "storage" },
    { key: "oca", name: "Open Connect box", sub: "inside Maya's ISP", colour: "good" },
  ], 5);
  const browse = h("button.btn", { type: "button" }, "Open the app");
  const play = h("button.btn.primary", { type: "button" }, "Press play");
  const sCtl = stat("bytes from the cloud (control plane)", "--cache", "0 KB"), sData = stat("bytes from Open Connect (data plane)", "--good", "0 MB");
  const say = h("p.dim", { "aria-live": "polite", style: "min-height:3em; margin:0" }, "Netflix is really two systems. Small decisions run in the cloud; the heavy video comes from next door.");
  let ctl = 0, data = 0, busy = false, streaming = 0;
  const upd = () => { sCtl.v.textContent = `${fmt(ctl)} KB`; sData.v.textContent = data >= 1000 ? `${fmt(data / 1000, 1)} GB` : `${fmt(data)} MB`; };
  browse.addEventListener("click", async () => {
    if (busy) return; busy = true;
    say.textContent = "Every API call goes through the gateway, which fans out to the right services. Rows come back mostly from cache.";
    await f.travel(["tv", "gw", "svc", "gw", "tv"], reducedMotion() ? 0 : 0.35, () => sfx("tick", 0.08), "#A78BFA");
    ctl += 180; upd(); busy = false;
  });
  play.addEventListener("click", async () => {
    if (busy) return; busy = true;
    say.textContent = "The playback service asks steering: which servers have this file, are healthy, and are closest to Maya?";
    await f.travel(["tv", "gw", "svc", "steer", "svc", "gw", "tv"], reducedMotion() ? 0 : 0.3, () => sfx("tick", 0.08), "#F5A524");
    ctl += 40; upd();
    say.textContent = "From here the cloud is mostly out of the picture. Chunks stream from a box inside her own internet provider.";
    f.glow("oca", true);
    clearInterval(streaming);
    streaming = window.setInterval(() => { data += 45; upd(); }, 200);
    setTimeout(() => { clearInterval(streaming); f.glow("oca", false); say.textContent = "Two minutes of HD video: almost all the bytes came from Open Connect, almost none from the cloud."; }, reducedMotion() ? 200 : 6000);
    busy = false;
  });
  return h("div.bench", { style: "display:grid; gap:12px" }, f.el, h("div.row", {}, browse, play), h("div.stats", {}, sCtl.el, sData.el), say,
    h("p.note", { style: "margin:0" }, "Byte counts are illustrative (HD streaming uses roughly 3 GB an hour)."));
}

/** The gateway fans out to microservices. Break one and see what Maya still gets. */
export function microLab(bench: HTMLElement) {
  const SVC = [
    { k: "auth", n: "Accounts", crit: true, what: "who's signed in" },
    { k: "profiles", n: "Profiles", crit: true, what: "Maya, Sam, Kids" },
    { k: "history", n: "Watch history", crit: false, what: "the 'Continue watching' row" },
    { k: "recs", n: "Recommendations", crit: false, what: "personal rows" },
    { k: "art", n: "Artwork", crit: false, what: "the picture on each title" },
    { k: "play", n: "Playback", crit: true, what: "pressing play" },
  ];
  const down = new Set<string>();
  const grid = h("div", { style: "display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:6px" });
  const screen = h("div.phone", { style: "width:min(340px,100%); min-height:300px; border-radius:16px" });
  function draw() {
    grid.innerHTML = "";
    SVC.forEach((s) => { const d = down.has(s.k); const b = h("button", { type: "button", class: "srvcard", style: `--sc: var(${d ? "--bad" : "--good"})` }, h("b", {}, `${s.n}${d ? " ✕" : ""}`), h("span", {}, s.what)); b.addEventListener("click", () => { d ? down.delete(s.k) : down.add(s.k); draw(); sfx(d ? "hit" : "powerdown", 0.2); }); grid.append(b); });
    screen.innerHTML = "";
    if (down.has("auth") || down.has("profiles")) { screen.append(h("b", { style: "color:var(--bad); padding:10px" }, "Something went wrong. Please try again."), h("span.dim", { style: "padding:0 10px; font-size:0.8rem" }, "Critical service down: no fallback.")); return; }
    const row = (t: string, n: number, fallback: boolean) => h("div", { style: "display:grid; gap:4px" }, h("b", { style: "font-size:0.78rem" }, t), h("div", { style: "display:grid; grid-template-columns:repeat(4,1fr); gap:4px" }, ...Array.from({ length: n }, (_, i) => h("i", { style: `display:block; aspect-ratio:2/3; border-radius:4px; background:${down.has("art") ? "#2a3359" : `linear-gradient(160deg, ${["#e50914", "#38BDF8", "#A78BFA", "#F5A524"][i % 4]}, #0b1124)`}` }))), fallback ? h("span.faint", { style: "font-size:0.66rem" }, "fallback: same for everyone") : "");
    if (!down.has("history")) screen.append(row("Continue watching for Maya", 4, false));
    screen.append(row(down.has("recs") ? "Popular on Netflix" : "Because you watched Dark", 4, down.has("recs")), row(down.has("recs") ? "Trending now" : "Top picks for Maya", 4, down.has("recs")));
    screen.append(h("span", { style: `font-size:0.75rem; padding:4px; color:var(${down.has("play") ? "--bad" : "--good"})` }, down.has("play") ? "▶ Play is unavailable right now" : "▶ Play works"));
  }
  bench.append(
    h("div.bench-grid", {}, h("div", { style: "display:grid; gap:10px; align-content:start" }, h("span.eyebrow", {}, "Tap a service to break it"), grid,
      h("p.dim", { style: "margin:0" }, "Each service has its own API and runs on many copies behind its own load balancer. Non-critical ones fall back instead of failing.")), screen),
    h("p.note", {}, "A simplified set of services. Netflix's API gateway is Zuul, an open-source layer 7 reverse proxy."),
    takeaway("If recommendations have a bad day, you see a plainer home screen, but you can still press play."),
  );
  draw();
}

/** Steering: pick video servers by file, health and network distance. */
export function steeringLab(bench: HTMLElement) {
  const BOXES = [
    { id: "isp", n: "Box inside Maya's ISP", dist: 1, has: true },
    { id: "ix", n: "Box at an exchange point, same city", dist: 4, has: true },
    { id: "region", n: "Data-centre box, same country", dist: 15, has: true },
    { id: "far", n: "Data-centre box, other continent", dist: 90, has: true },
  ];
  const state = BOXES.map((b) => ({ ...b, healthy: true }));
  let title: "popular" | "rare" = "popular";
  const pick = seg("Maya presses play on", [["Tonight's hit series", "popular"], ["A 1970s documentary", "rare"]], title, (v) => { title = v as typeof title; draw(); sfx("tick", 0.15); });
  const list = h("div", { style: "display:grid; gap:6px" });
  const ans = h("pre.json", {});
  function draw() {
    list.innerHTML = "";
    const avail = state.map((b) => ({ ...b, has: title === "popular" ? b.has : b.id === "region" || b.id === "far" }));
    avail.forEach((b, i) => {
      const ok = b.has && b.healthy;
      const el = h("button", { type: "button", class: "srvcard", style: `--sc: var(${!b.healthy ? "--bad" : !b.has ? "--line" : "--good"}); grid-template-columns:1fr auto; align-items:center` },
        h("div", { style: "display:grid; gap:2px" }, h("b", {}, b.n), h("span", {}, `${b.has ? "has the file" : "doesn't have this file"} · ${b.healthy ? "healthy" : "unhealthy"} · ~${b.dist} ms away`)),
        h("b.mono", { style: `color:var(${ok ? "--good" : "--faint"})` }, ok ? "✓" : "–"));
      el.addEventListener("click", () => { state[i].healthy = !state[i].healthy; draw(); sfx(state[i].healthy ? "hit" : "powerdown", 0.2); });
      list.append(el);
    });
    const ranked = avail.filter((b) => b.has && b.healthy).sort((a, b) => a.dist - b.dist).slice(0, 3);
    ans.innerHTML = `steering → Maya's TV\n${ranked.length ? ranked.map((b, i) => `  ${i + 1}. <span class="s">${b.n}</span>`).join("\n") : '  <span style="color:var(--bad)">no healthy server has this file</span>'}`;
  }
  bench.append(
    h("div.bench-grid", {}, h("div", { style: "display:grid; gap:10px; align-content:start" }, pick, list, h("p.note", { style: "margin:0" }, "Tap a box to make it unhealthy.")), h("div", { style: "display:grid; gap:8px; align-content:start" }, h("span.eyebrow", {}, "Steering's answer: a few good choices, best first"), ans)),
    h("p.note", {}, "Per Netflix's Open Connect overview, steering considers which servers have the file, their health, and network proximity. Netflix works with 1,000+ ISPs and 60+ data-centre locations."),
    takeaway("Steering knows which servers have this exact file, which are healthy, and which are closest. The TV picks one and starts pulling video."),
  );
  draw();
}

/** Filling at night: predict what each area will watch and copy it over during quiet hours. */
export async function fillLab(bench: HTMLElement) {
  const cap = h("input#fl-cap", { type: "range", min: 1, max: 60, step: 1, value: 15 }) as HTMLInputElement;
  const capOut = h("output", {});
  let smart = true;
  const pick = seg("What gets copied overnight", [["Predicted for this area", true], ["A random selection", false]], smart, (v) => { smart = v; draw(); sfx("tick", 0.15); });
  const sHit = stat("of tonight's streams served from the box in the ISP", "--good"), sFar = stat("streams that travel further", "--storage");
  const box = h("div.chart-box", { style: "height:220px" }, h("canvas", { "aria-label": "Share of viewing by title rank" }));
  bench.append(
    h("div.bench-grid", {}, h("div", { style: "display:grid; gap:12px; align-content:start" }, h("label.field", { for: "fl-cap" }, h("span", {}, "Box can hold: ", capOut), cap), pick, h("div.stats", {}, sHit.el, sFar.el)), box),
    h("p.note", {}, "Illustrative: 10,000 titles whose popularity follows a long tail (Zipf), and 100,000 streams in one evening. Netflix fills its boxes during off-peak hours and boxes can fill each other."),
    takeaway("By the evening rush, the shows people want are already in the building."),
  );
  const N = 10000, w = Array.from({ length: N }, (_, i) => 1 / Math.pow(i + 1, 0.9)), W = w.reduce((a, b) => a + b, 0);
  const { Chart } = await lib.chart();
  const chart = new Chart(box.querySelector("canvas")!, {
    type: "bar", data: { labels: ["top 1%", "1–5%", "5–20%", "20–50%", "bottom 50%"], datasets: [{ label: "share of all viewing (%)", data: [], backgroundColor: [css("--good"), css("--good"), css("--net"), css("--storage"), css("--faint")], borderRadius: 6 }] },
    options: { maintainAspectRatio: false, plugins: { legend: { labels: { color: css("--dim"), boxWidth: 12 } } }, scales: { y: { beginAtZero: true, ticks: { color: css("--faint"), callback: (v) => `${v}%` }, grid: { color: "rgba(120,140,220,0.08)" } }, x: { ticks: { color: css("--dim") }, grid: { display: false } } } },
  });
  const band = (a: number, b: number) => (w.slice(a, b).reduce((x, y) => x + y, 0) / W) * 100;
  chart.data.datasets[0].data = [band(0, 100), band(100, 500), band(500, 2000), band(2000, 5000), band(5000, N)] as never; chart.update();
  function draw() {
    const pct = +cap.value; capOut.textContent = `${pct}% of the catalogue`;
    const k = Math.round((N * pct) / 100);
    const hit = smart ? w.slice(0, k).reduce((a, b) => a + b, 0) / W : pct / 100;
    sHit.v.textContent = `${fmt(hit * 100)}%`; sFar.v.textContent = fmt(Math.round(100000 * (1 - hit)));
  }
  cap.addEventListener("input", draw); draw();
}

/** Adaptive bitrate: the TV steps down when Wi-Fi dips and back up when it recovers. */
export async function abrLab(bench: HTMLElement) {
  const LADDER = [[0.6, "360p"], [1.5, "540p"], [3, "720p"], [5, "1080p"], [15, "4K"]] as const;
  const bw = h("input#ab-bw", { type: "range", min: 0.3, max: 25, step: 0.1, value: 8 }) as HTMLInputElement;
  const bwOut = h("output", {});
  const abr = h("input#ab-on", { type: "checkbox", checked: true }) as HTMLInputElement;
  const dip = h("button.btn", { type: "button" }, "Microwave on: Wi-Fi dips for 10 s");
  const sQ = stat("picture quality", "--good"), sB = stat("seconds buffered", "--net"), sStall = stat("times the spinning wheel appeared", "--bad", "0");
  const box = h("div.chart-box", { style: "height:240px" }, h("canvas", { "aria-label": "Bandwidth and chosen quality over time" }));
  bench.append(
    h("div.bench-grid", {}, h("div", { style: "display:grid; gap:12px; align-content:start" },
      h("label.field", { for: "ab-bw" }, h("span", {}, "Maya's Wi-Fi: ", bwOut), bw),
      h("label.row", { for: "ab-on", style: "gap:8px; color:var(--text)" }, abr, "Adaptive bitrate (pick each chunk's quality)"), dip,
      h("div.stats", {}, sQ.el, sB.el, sStall.el)), box),
    h("p.note", {}, "Simulated in your browser: 4-second chunks, a 30-second buffer, and a simple rule (pick the best quality that fits 80% of the measured speed). Bitrates per quality are illustrative."),
    takeaway("When Wi-Fi dips, the picture softens for a few seconds instead of stopping. That's adaptive bitrate streaming."),
  );
  const { Chart } = await lib.chart();
  const N = 90, bwHist: number[] = Array(N).fill(8), qHist: number[] = Array(N).fill(5);
  const chart = new Chart(box.querySelector("canvas")!, {
    type: "line", data: { labels: Array.from({ length: N }, (_, i) => (i % 15 === 0 ? `${i - N} s` : "")), datasets: [{ label: "Wi-Fi speed (Mbit/s)", data: [], borderColor: css("--net"), pointRadius: 0, borderWidth: 2 }, { label: "chunk bitrate (Mbit/s)", data: [], borderColor: css("--good"), backgroundColor: "rgba(74,222,128,0.12)", fill: true, stepped: true, pointRadius: 0, borderWidth: 2.5 }] },
    options: { maintainAspectRatio: false, animation: false, plugins: { legend: { labels: { color: css("--dim"), boxWidth: 12 } } }, scales: { y: { min: 0, max: 26, ticks: { color: css("--faint") }, grid: { color: "rgba(120,140,220,0.08)" } }, x: { ticks: { color: css("--faint"), autoSkip: false, maxRotation: 0 }, grid: { display: false } } } },
  });
  let buf = 12, q = 3, stalls = 0, dipUntil = 0, t = 0, stalled = false;
  dip.addEventListener("click", () => { dipUntil = t + 10; sfx("miss", 0.2); });
  let vis = false; new IntersectionObserver((e) => (vis = e[0].isIntersecting)).observe(box);
  setInterval(() => {
    if (!vis) return;
    t += 1;
    const speed = t < dipUntil ? Math.min(+bw.value, 1.2) : +bw.value;
    bwOut.textContent = `${fmt(+bw.value, 1)} Mbit/s`;
    if (abr.checked) { let best = 0; LADDER.forEach(([r], i) => { if (r <= speed * 0.8) best = i; }); q = best; } else q = 3;
    const rate = LADDER[q][0];
    buf += speed / rate - (stalled ? 0 : 1); // seconds of video downloaded per second, minus one played
    if (buf <= 0) { buf = 0; if (!stalled) { stalls++; sfx("miss", 0.2); } stalled = true; } else if (stalled && buf > 4) stalled = false;
    buf = Math.min(30, buf);
    bwHist.shift(); bwHist.push(speed); qHist.shift(); qHist.push(rate);
    chart.data.datasets[0].data = [...bwHist] as never; chart.data.datasets[1].data = [...qHist] as never; chart.update();
    sQ.v.textContent = stalled ? "⟳ buffering" : LADDER[q][1]; sQ.v.style.color = stalled ? "var(--bad)" : q >= 3 ? "var(--good)" : "var(--storage)";
    sB.v.textContent = fmt(buf); sStall.v.textContent = String(stalls);
  }, 500);
}

/** Chaos Monkey: switch off random servers in working hours, with and without redundancy. */
export function chaosLab(bench: HTMLElement) {
  const copies = h("input#ch-c", { type: "range", min: 1, max: 4, step: 1, value: 1 }) as HTMLInputElement;
  const cOut = h("output", {});
  const SVCS = ["Accounts", "Profiles", "Rows", "Artwork", "Playback", "Billing"];
  let alive: boolean[][] = [];
  const grid = h("div", { style: "display:grid; gap:6px" });
  const monkey = h("button.btn.primary", { type: "button" }, "🐒 Unleash Chaos Monkey (one random server)");
  const say = h("p.dim", { "aria-live": "polite", style: "min-height:3em; margin:0" });
  const r = seeded(13);
  function reset() { const n = +copies.value; cOut.textContent = String(n); alive = SVCS.map(() => Array(n).fill(true)); draw(); say.textContent = "Tuesday, 11 a.m. Engineers are at their desks."; }
  function draw() {
    grid.innerHTML = "";
    SVCS.forEach((s, i) => {
      const up = alive[i].filter(Boolean).length;
      grid.append(h("div.meter", { style: "grid-template-columns: 6em minmax(0,1fr) 7em" }, h("span", {}, s),
        h("div", { style: "display:flex; gap:4px" }, ...alive[i].map((a) => h("i", { style: `display:block; flex:1; height:16px; border-radius:4px; background:var(${a ? "--good" : "--bad"})` }))),
        h("b", { style: `color:var(${up ? "--good" : "--bad"})` }, up ? "working" : "DOWN")));
    });
  }
  monkey.addEventListener("click", () => {
    const i = Math.floor(r() * SVCS.length), live = alive[i].map((a, k) => (a ? k : -1)).filter((k) => k >= 0);
    if (!live.length) return;
    alive[i][live[Math.floor(r() * live.length)]] = false; draw(); sfx("powerdown", 0.25);
    const up = alive[i].filter(Boolean).length;
    say.innerHTML = up ? `A ${SVCS[i]} server was switched off. The other ${up} carried on, and nobody watching noticed.` : `<b style="color:var(--bad)">${SVCS[i]} is down.</b> Found on a normal Tuesday, not during a premiere. Add copies so one server can't take a service down.`;
  });
  copies.addEventListener("input", reset);
  bench.append(
    h("div.bench-grid", {}, h("div", { style: "display:grid; gap:12px; align-content:start" }, h("label.field", { for: "ch-c" }, h("span", {}, "Copies of each service: ", cOut), copies), monkey, h("button.btn", { type: "button", onclick: () => { reset(); sfx("hit", 0.2); } }, "Reset"), say), grid),
    h("p.note", {}, "Netflix described Chaos Monkey in 2011 (\"The Netflix Simian Army\"); it switches off production servers during working hours. Netflix also practises evacuating a whole cloud region."),
    takeaway("Cause failures on purpose, while engineers are around to watch, so real ones become boring."),
  );
  reset();
}

/** Live events: a perfect spike, not a smooth evening curve. */
export async function liveLab(bench: HTMLElement) {
  let mode: "series" | "live" = "live";
  const pick = seg("Tonight", [["A new series drops", "series"], ["A live boxing match", "live"]], mode, (v) => { mode = v as typeof mode; draw(); sfx("tick", 0.15); });
  const box = h("div.chart-box", { style: "height:260px" }, h("canvas", { "aria-label": "Concurrent streams over an evening" }));
  const facts = h("div", { style: "display:grid; gap:6px" });
  bench.append(
    h("div.bench-grid", {}, h("div", { style: "display:grid; gap:12px; align-content:start" }, pick, facts), box),
    h("p.note", {}, "Curves are illustrative. The Paul v Tyson peak of 65 million concurrent streams and 100,000+ Downdetector reports are from Fortune (Nov 2024), citing Netflix's CTO memo."),
    takeaway("Every trick so far depends on knowing what people will watch. Live events break that: no overnight copy, no second try."),
  );
  const { Chart } = await lib.chart();
  const hrs = Array.from({ length: 61 }, (_, i) => 18 + i * 0.1);
  const chart = new Chart(box.querySelector("canvas")!, {
    type: "line", data: { labels: hrs.map((x) => (Math.abs(x - Math.round(x)) < 0.01 ? `${Math.round(x)}:00` : "")), datasets: [{ label: "concurrent streams (millions)", data: [], borderColor: css("--net"), backgroundColor: "rgba(56,189,248,0.12)", fill: true, pointRadius: 0, borderWidth: 2.5 }] },
    options: { maintainAspectRatio: false, animation: { duration: reducedMotion() ? 0 : 600 }, plugins: { legend: { labels: { color: css("--dim"), boxWidth: 12 } } }, scales: { y: { min: 0, max: 70, ticks: { color: css("--faint") }, grid: { color: "rgba(120,140,220,0.08)" } }, x: { ticks: { color: css("--faint"), autoSkip: false, maxRotation: 0 }, grid: { display: false } } } },
  });
  function draw() {
    const d = hrs.map((x) => mode === "series" ? 8 + 14 * Math.exp(-((x - 21) ** 2) / 2.5) : 6 + (x >= 22 && x < 22.6 ? 59 * Math.min(1, (x - 22) / 0.15) : x >= 21.4 && x < 22 ? 20 + (x - 21.4) * 40 : 0));
    chart.data.datasets[0].data = d as never; chart.update();
    facts.innerHTML = "";
    const rows: [string, string][] = mode === "series" ? [["Copied the night before", "✓"], ["Viewers spread across episodes and the evening", "✓"], ["A glitch can be fixed tomorrow", "✓"]] : [["Encoded in real time, chunks pushed within seconds", "!"], ["Everyone asks for the same newest chunk at once", "!"], ["No second try", "!"]];
    rows.forEach(([t, m]) => facts.append(h("div.box", { style: `--bc: var(${m === "✓" ? "--good" : "--bad"}); min-height:auto; flex-direction:row` }, h("b", {}, m), h("span", {}, t))));
  }
  draw();
}
