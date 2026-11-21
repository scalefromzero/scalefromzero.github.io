import { lib } from "../../kit/libs";
import { h, sfx, takeaway, sleep, css, fmt, reducedMotion } from "../../kit/ui";

const LINE = 4; // addresses per cache line: fetching one brings its neighbours (spatial locality)
const MEM = 64;

/** A tiny CPU cache: LRU lines of 4 addresses. Try access patterns and watch the hit rate. */
export async function cacheLab(bench: HTMLElement) {
  const cells = Array.from({ length: MEM }, (_, i) => h("div.cell", { title: `address ${i}` }, String(i)));
  const grid = h("div.mem-grid", { "aria-hidden": "true" }, ...cells);
  const slotsBox = h("div.cache-slots", { "aria-label": "Cache lines" });
  const sizeIn = h("input#csize", { type: "range", min: 1, max: 8, value: 4 }) as HTMLInputElement;
  const sizeOut = h("output", {}, "4 lines (16 values)");
  const pattern = h("select#pattern", {},
    h("option", { value: "array" }, "Loop through an array (neighbours)"),
    h("option", { value: "reuse" }, "Reuse the same few values"),
    h("option", { value: "random" }, "Random addresses"),
  ) as HTMLSelectElement;
  const runBtn = h("button.btn.primary", { type: "button" }, "Run 64 reads");
  const fastBtn = h("button.btn", { type: "button" }, "Run instantly");
  const st = (k: string, c = "--text") => { const v = h("span.v.tnum", { style: `color:var(${c})` }, "0"); return { el: h("div.stat", {}, v, h("span.k", {}, k)), v }; };
  const sHit = st("hits", "--good"), sMiss = st("misses", "--storage"), sRate = st("hit rate"), sSpeed = st("faster than no cache", "--cache");
  const chartBox = h("div.chart-box", {}, h("canvas", { "aria-label": "Hit rate as reads happen" }));
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:12px" },
        h("span.eyebrow", { style: "color:var(--ram)" }, "RAM · 64 addresses"), grid,
        h("span.eyebrow", { style: "color:var(--cache)" }, "CPU cache"), slotsBox,
      ),
      h("div", { style: "display:grid; gap:14px; align-content:start" },
        h("label.field", { for: "pattern" }, "What the program reads", pattern),
        h("label.field", { for: "csize" }, h("span", {}, "Cache size: ", sizeOut), sizeIn),
        h("div.row", {}, runBtn, fastBtn),
        h("div.stats", {}, sHit.el, sMiss.el, sRate.el, sSpeed.el),
      ),
    ),
    chartBox,
    h("p.note", {}, "Cost model from the episode: a cache hit costs 1, a trip to RAM costs 100. A miss loads the whole line of 4 neighbouring addresses. Try the same few values with a 1-line cache: each read throws out the value needed next, and the hit rate collapses."),
    takeaway("Programs are predictable. Neighbours get used next (spatial locality) and recent data gets used again (temporal locality), so a tiny cache catches most reads."),
  );

  const { Chart } = await lib.chart();
  const colours: Record<string, string> = { array: css("--ram"), reuse: css("--cache"), random: css("--storage") };
  const chart = new Chart(chartBox.querySelector("canvas")!, {
    type: "line",
    data: { labels: Array.from({ length: 64 }, (_, i) => i + 1), datasets: [] },
    options: {
      animation: false, maintainAspectRatio: false, responsive: true,
      scales: {
        x: { title: { display: true, text: "reads", color: css("--dim") }, ticks: { color: css("--faint"), maxTicksLimit: 9 }, grid: { color: "rgba(120,140,220,0.08)" } },
        y: { min: 0, max: 100, title: { display: true, text: "hit rate %", color: css("--dim") }, ticks: { color: css("--faint") }, grid: { color: "rgba(120,140,220,0.08)" } },
      },
      plugins: { legend: { labels: { color: css("--dim"), boxWidth: 12 } } },
    },
  });

  let lines: number[] = []; // LRU: most recent last
  let run = 0;
  const cap = () => +sizeIn.value;
  const paintCache = (fresh?: number) => {
    const inSet = new Set(lines);
    cells.forEach((c, i) => c.classList.toggle("in", inSet.has(Math.floor(i / LINE))));
    slotsBox.innerHTML = "";
    for (let k = 0; k < cap(); k++) {
      const ln = lines[lines.length - 1 - k];
      slotsBox.append(ln === undefined ? h("div.slot.empty", {}, "empty") : h(`div.slot${ln === fresh ? ".new" : ""}`, {}, `${ln * LINE}–${ln * LINE + 3}`, h("br"), h("span.faint", {}, k === 0 ? "newest" : k === cap() - 1 ? "oldest" : "")));
    }
  };
  sizeIn.addEventListener("input", () => { sizeOut.textContent = `${cap()} line${cap() === 1 ? "" : "s"} (${cap() * LINE} values)`; lines = lines.slice(-cap()); paintCache(); });
  paintCache();

  const sequence = (p: string) => {
    if (p === "array") return Array.from({ length: 64 }, (_, i) => i);
    if (p === "reuse") { const hot = [5, 22, 41]; return Array.from({ length: 64 }, (_, i) => hot[i % hot.length]); }
    return Array.from({ length: 64 }, () => Math.floor(Math.random() * MEM));
  };

  async function go(animated: boolean) {
    const me = ++run;
    lines = [];
    let hits = 0, miss = 0;
    const p = pattern.value, data: number[] = [];
    const label = { array: "array loop", reuse: "same few values", random: "random" }[p]! + ` · ${cap()} lines`;
    const ds = { label, data, borderColor: colours[p], backgroundColor: colours[p], borderWidth: 2.5, pointRadius: 0, tension: 0.25 };
    chart.data.datasets.forEach((d) => { (d as { borderWidth: number }).borderWidth = 1.2; (d as { borderColor: string }).borderColor = (d.borderColor as string).slice(0, 7) + "66"; });
    chart.data.datasets.push(ds);
    if (chart.data.datasets.length > 4) chart.data.datasets.shift();
    for (const [i, addr] of sequence(p).entries()) {
      if (me !== run) return;
      const ln = Math.floor(addr / LINE);
      const at = lines.indexOf(ln);
      const hit = at >= 0;
      if (hit) { hits++; lines.splice(at, 1); lines.push(ln); }
      else { miss++; lines.push(ln); if (lines.length > cap()) lines.shift(); }
      data.push(Math.round((hits / (i + 1)) * 1000) / 10);
      if (animated) {
        paintCache(hit ? undefined : ln);
        cells.forEach((c) => c.classList.remove("cur", "flash-hit", "flash-miss"));
        cells[addr].classList.add("cur", hit ? "flash-hit" : "flash-miss");
        sfx(hit ? "tick" : "pop", hit ? 0.12 : 0.18);
        updateStats(hits, miss);
        chart.update();
        await sleep(reducedMotion() ? 0 : 90);
      }
    }
    cells.forEach((c) => c.classList.remove("cur", "flash-hit", "flash-miss"));
    paintCache(); updateStats(hits, miss); chart.update();
  }
  function updateStats(hits: number, miss: number) {
    const n = hits + miss;
    sHit.v.textContent = String(hits); sMiss.v.textContent = String(miss);
    sRate.v.textContent = n ? `${fmt((hits / n) * 100)}%` : "0%";
    const cost = hits + miss * 100, without = n * 100;
    sSpeed.v.textContent = n ? `${fmt(without / cost, 1)}×` : "–";
  }
  runBtn.addEventListener("click", () => go(true));
  fastBtn.addEventListener("click", () => go(false));
  await go(false); // open with a finished example run
}
