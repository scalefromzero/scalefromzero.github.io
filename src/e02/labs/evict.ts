import { lib } from "../../kit/libs";
import { h, sfx, takeaway, css, sleep, reducedMotion, fmt } from "../../kit/ui";

type Policy = "FIFO" | "LFU" | "LRU";
const SHOWS = ["Tonight's concert", "Last month's comedy", "Jazz night", "Football final", "Theatre", "Opera", "Magic show", "Kids' musical", "Poetry night", "Choir", "Ballet", "Open mic", "Film screening", "Quiz night", "Circus", "Orchestra"];
const SLOTS = 4;

/** Requests for shows; the comedy show is hot last month, tonight's concert is hot now. */
function sequence(): number[] {
  let seed = 11; const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const out: number[] = [];
  for (let i = 0; i < 60; i++) out.push(r() < 0.6 ? 1 : 2 + Math.floor(r() * 3)); // last month: the comedy show is hot
  for (let b = 0; b < 6; b++) { // tonight: the concert, two shows that are popular for a while, and one-off requests
    const cur = [2 + ((b * 2) % 6), 2 + ((b * 2 + 1) % 6)];
    for (let i = 0; i < 20; i++) { const x = r(); out.push(x < 0.4 ? 0 : x < 0.55 ? 8 + Math.floor(r() * 8) : cur[Math.floor(r() * 2)]); }
  }
  return out;
}

function run(policy: Policy, seq: number[], onStep?: (cache: number[], req: number, hit: boolean, evicted: number | null) => void) {
  let cache: number[] = []; const uses = new Map<number, number>(); let hits = 0;
  for (const req of seq) {
    let evicted: number | null = null;
    const hit = cache.includes(req);
    if (hit) { hits++; uses.set(req, (uses.get(req) ?? 0) + 1); if (policy === "LRU") cache = [...cache.filter((c) => c !== req), req]; }
    else {
      if (cache.length >= SLOTS) {
        if (policy === "FIFO" || policy === "LRU") evicted = cache[0];
        else evicted = cache.reduce((a, b) => ((uses.get(b) ?? 0) < (uses.get(a) ?? 0) ? b : a));
        cache = cache.filter((c) => c !== evicted);
      }
      cache.push(req); uses.set(req, (uses.get(req) ?? 0) + 1);
    }
    onStep?.(cache, req, hit, evicted);
  }
  return hits / seq.length;
}

export async function evictLab(bench: HTMLElement) {
  const seq = sequence();
  const seg = h("div.seg", { role: "group", "aria-label": "Eviction policy" });
  let policy: Policy = "LRU";
  const desc: Record<Policy, string> = {
    FIFO: "First in, first out: remove the oldest note, even if everyone still reads it.",
    LFU: "Least frequently used: remove the note used the fewest times overall.",
    LRU: "Least recently used: remove the note nobody has looked at for the longest time.",
  };
  const p = h("p.dim", {}, desc.LRU);
  const slots = h("div.cache-slots", { "aria-label": "Whiteboard slots" });
  const now = h("p.mono", { "aria-live": "polite", style: "min-height:1.5em" }, "Press play to replay 180 requests.");
  const play = h("button.btn.primary", { type: "button" }, "Play the evening");
  const chartBox = h("div.chart-box", { style: "height:220px" }, h("canvas", { "aria-label": "Hit rate for each eviction policy" }));
  (["FIFO", "LFU", "LRU"] as Policy[]).forEach((k) => {
    const b = h("button", { type: "button", "aria-pressed": String(k === policy) }, k);
    b.addEventListener("click", () => { policy = k; [...seg.children].forEach((c, i) => c.setAttribute("aria-pressed", String(["FIFO", "LFU", "LRU"][i] === k))); p.textContent = desc[k]; paint([], -1, false, null); sfx("pop", 0.2); });
    seg.append(b);
  });
  const paint = (cache: number[], req: number, hit: boolean, ev: number | null) => {
    slots.innerHTML = "";
    for (let i = 0; i < SLOTS; i++) {
      const c = cache[i];
      slots.append(c === undefined ? h("div.slot.empty", {}, "empty") : h(`div.slot${c === req && !hit ? ".new" : ""}`, { style: c === req ? `border-color:var(${hit ? "--good" : "--storage"})` : "" }, SHOWS[c]));
    }
    if (req >= 0) now.innerHTML = `${hit ? '<span style="color:var(--good)">hit</span>' : '<span style="color:var(--storage)">miss</span>'} · ${SHOWS[req]}${ev !== null ? ` · wiped: <b>${SHOWS[ev]}</b>` : ""}`;
  };
  paint([], -1, false, null);
  let playing = 0;
  play.addEventListener("click", async () => {
    const me = ++playing;
    const steps: [number[], number, boolean, number | null][] = [];
    run(policy, seq, (c, r, hh, e) => steps.push([[...c], r, hh, e]));
    for (const s of steps) { if (me !== playing) return; paint(...s); sfx(s[2] ? "tick" : "pop", 0.08); await sleep(reducedMotion() ? 0 : 70); }
  });
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:12px; align-content:start" }, seg, p, h("span.eyebrow", {}, `Whiteboard with ${SLOTS} spaces`), slots, now, h("div.row", {}, play)),
      h("div", { style: "display:grid; gap:8px" }, h("span.eyebrow", {}, "Hit rate over the same 180 requests"), chartBox),
    ),
    h("p.note", {}, "The first 60 requests are last month, when the comedy show was hot. The next 120 are tonight: the concert, a couple of shows that are popular for a while, and some one-off requests."),
    takeaway("Least recently used is a common default, because what people asked for recently is usually what they'll ask for next."),
  );
  const { Chart } = await lib.chart();
  const rates = (["FIFO", "LFU", "LRU"] as Policy[]).map((k) => Math.round(run(k, seq) * 100));
  new Chart(chartBox.querySelector("canvas")!, {
    type: "bar",
    data: { labels: ["FIFO", "LFU", "LRU"], datasets: [{ label: "hit rate %", data: rates, backgroundColor: [css("--storage"), css("--cache"), css("--ram")], borderRadius: 6 }] },
    options: { maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `${fmt(c.parsed.y ?? 0)}% hits` } } }, scales: { y: { min: 0, max: 100, ticks: { color: css("--faint"), callback: (v) => `${v}%` }, grid: { color: "rgba(120,140,220,0.08)" } }, x: { ticks: { color: css("--dim") }, grid: { display: false } } } },
  });
}
