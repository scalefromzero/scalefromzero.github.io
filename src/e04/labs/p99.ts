import { lib } from "../../kit/libs";
import { h, sfx, takeaway, fmt, css } from "../../kit/ui";

const N = 1000;
const GOAL = 0.5;

/** 1,000 requests, mostly fast, a few very slow. The average hides them; the p99 doesn't. D3 histogram. */
export async function p99Lab(bench: HTMLElement) {
  const slowIn = h("input#p9-slow", { type: "range", min: 0, max: 8, step: 0.5, value: 2 }) as HTMLInputElement;
  const slowTIn = h("input#p9-slowt", { type: "range", min: 1, max: 10, step: 0.5, value: 10 }) as HTMLInputElement;
  const slowOut = h("output", {}), slowTOut = h("output", {});
  const st = (k: string, c: string) => { const v = h("span.v.tnum", { style: `color:var(${c})` }, "–"); return { el: h("div.stat", {}, v, h("span.k", {}, k)), v }; };
  const sAvg = st("average", "--dim"), sP50 = st("p50 (the middle request)", "--net"), sP99 = st("p99 (99 in 100 are faster)", "--cpu");
  const verdict = h("p", { "aria-live": "polite", style: "margin:0; font-weight:600" });
  const chart = h("div", { style: "width:100%; min-width:0" });
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:12px; align-content:start" },
        h("label.field", { for: "p9-slow" }, h("span", {}, "Slow requests in every hundred: ", slowOut), slowIn),
        h("label.field", { for: "p9-slowt" }, h("span", {}, "How slow they are: ", slowTOut), slowTIn),
        h("div.stats", {}, sAvg.el, sP50.el, sP99.el),
        verdict,
      ),
      chart,
    ),
    h("p.note", {}, `${fmt(N)} illustrative requests, sorted fastest to slowest. Most take about a tenth of a second. The goal line is half a second.`),
    takeaway("Averages lie. Sort every request and look near the end: the goal is a p99 under half a second."),
  );
  const d3 = await lib.d3();
  const W = Math.round(Math.max(330, Math.min(560, chart.clientWidth || 520))), H = 320, m = { l: 44, r: 10, t: 18, b: 44 };
  const svgEl = d3.select(chart).append("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("role", "img").attr("aria-label", "Histogram of request times with average, p50, p99 and goal markers").style("width", "100%").style("height", "auto");
  const x = d3.scaleLog().domain([0.04, 12]).range([m.l, W - m.r]);
  const y = d3.scaleLinear().range([H - m.b, m.t]);
  const gx = svgEl.append("g").attr("transform", `translate(0,${H - m.b})`);
  const gy = svgEl.append("g").attr("transform", `translate(${m.l},0)`);
  svgEl.append("text").attr("x", (W + m.l) / 2).attr("y", H - 6).attr("text-anchor", "middle").attr("fill", css("--dim")).attr("font-size", 14).text("seconds from tap to answer (log scale)");
  const bars = svgEl.append("g");
  const marks = svgEl.append("g");
  const ticks = [0.05, 0.1, 0.5, 1, 5, 10];

  // deterministic base: log-normal around 0.1 s
  let seed = 3; const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const base = Array.from({ length: N }, () => { const u = Math.max(1e-9, r()), v = r(); const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); return Math.min(0.45, Math.max(0.045, 0.1 * Math.exp(0.35 * z))); });
  const order = Array.from({ length: N }, (_, i) => i).sort(() => r() - 0.5);
  let lastOk: boolean | null = null;

  function draw() {
    const per100 = +slowIn.value, slowT = +slowTIn.value;
    slowOut.textContent = fmt(per100, per100 % 1 ? 1 : 0); slowTOut.textContent = `${fmt(slowT, slowT % 1 ? 1 : 0)} s`;
    const nSlow = Math.round((per100 / 100) * N);
    const data = base.slice();
    order.slice(0, nSlow).forEach((i, k) => (data[i] = slowT * (0.85 + 0.3 * ((k * 37) % 100) / 100)));
    const sorted = data.slice().sort((a, b) => a - b);
    const avg = d3.mean(data)!, p50 = sorted[Math.ceil(0.5 * N) - 1], p99 = sorted[Math.ceil(0.99 * N) - 1];
    const bins = d3.bin().domain(x.domain() as [number, number]).thresholds(d3.range(0, 40).map((i) => 0.04 * Math.pow(12 / 0.04, i / 40)))(data);
    y.domain([0, Math.max(10, d3.max(bins, (b) => b.length)!)]).nice();
    gx.call(d3.axisBottom(x).tickValues(ticks).tickFormat((d) => `${d}`)).call((g) => g.selectAll("text").attr("fill", css("--faint")).attr("font-size", 13)).call((g) => g.selectAll("line,path").attr("stroke", css("--line")));
    gy.call(d3.axisLeft(y).ticks(4)).call((g) => g.selectAll("text").attr("fill", css("--faint")).attr("font-size", 12)).call((g) => g.selectAll("line,path").attr("stroke", css("--line")));
    bars.selectAll("rect").data(bins).join("rect")
      .attr("x", (b) => x(b.x0!) + 0.5).attr("width", (b) => Math.max(0, x(b.x1!) - x(b.x0!) - 1))
      .attr("fill", (b) => (b.x0! >= GOAL ? css("--bad") : css("--net"))).attr("rx", 2)
      .transition().duration(350).attr("y", (b) => y(b.length)).attr("height", (b) => y(0) - y(b.length));
    const M = [
      { v: GOAL, c: css("--good"), t: "goal 0.5 s", dy: 0 },
      { v: avg, c: css("--dim"), t: `average ${fmt(avg, 2)} s`, dy: 16 },
      { v: p99, c: css("--cpu"), t: `p99 ${fmt(p99, p99 < 1 ? 2 : 1)} s`, dy: 32 },
    ];
    marks.selectAll("g").data(M).join((e) => { const g = e.append("g"); g.append("line"); g.append("text"); return g; })
      .call((g) => g.select("line").attr("y1", m.t).attr("y2", H - m.b).attr("stroke", (d) => d.c).attr("stroke-width", 2).attr("stroke-dasharray", (d) => (d.v === GOAL ? "5 4" : null)).transition().duration(350).attr("x1", (d) => x(d.v)).attr("x2", (d) => x(d.v)))
      .call((g) => g.select("text").attr("fill", (d) => d.c).attr("font-size", 14).attr("font-weight", 700).attr("y", (d) => m.t + 13 + d.dy * 1.2).attr("text-anchor", (d) => (x(d.v) > W - 130 ? "end" : "start")).transition().duration(350).attr("x", (d) => x(d.v) + (x(d.v) > W - 130 ? -5 : 5)).text((d) => d.t));
    sAvg.v.textContent = `${fmt(avg, 2)} s`; sP50.v.textContent = `${fmt(p50, 2)} s`; sP99.v.textContent = `${fmt(p99, p99 < 1 ? 2 : 1)} s`;
    const avgOk = avg < GOAL, ok = p99 < GOAL;
    sP99.v.style.color = ok ? "var(--good)" : "var(--bad)";
    verdict.innerHTML = ok ? (nSlow ? `<span style="color:var(--good)">P99 under half a second, just.</span> <span class="dim">The slowest ${fmt(nSlow / 10, nSlow % 10 ? 1 : 0)} in every hundred still wait. Big sites also track the p99.9 for them.</span>` : '<span style="color:var(--good)">P99 under half a second. Goal met.</span>')
      : avgOk ? `<span style="color:var(--bad)">The average says ${fmt(avg, 2)} s, fine. But ${fmt(nSlow / 10, nSlow % 10 ? 1 : 0)} fans in every hundred wait ${fmt(slowT, 0)} s. P99 goal missed.</span>`
      : '<span style="color:var(--bad)">Now even the average is over the goal.</span>';
    if (lastOk !== null && lastOk !== ok) sfx(ok ? "hit" : "miss", 0.25);
    lastOk = ok;
  }
  [slowIn, slowTIn].forEach((e) => e.addEventListener("input", draw));
  draw();
}
