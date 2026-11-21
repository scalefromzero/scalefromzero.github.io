import { lib } from "../../kit/libs";
import { h, takeaway, css, fmt, sfx } from "../../kit/ui";

/** The episode's cache maths: 100 requests, hit = 1, RAM = 100. Slide the hit rate. */
export async function mathLab(bench: HTMLElement) {
  const rate = h("input#hitrate", { type: "range", min: 0, max: 100, value: 95 }) as HTMLInputElement;
  const ratio = h("input#ratio", { type: "range", min: 1, max: 3, step: 0.01, value: 2 }) as HTMLInputElement;
  const rateOut = h("output", {}, "95%"), ratioOut = h("output", {}, "100×");
  const formula = h("div.mono", { style: "font-size:var(--step-0); line-height:1.9; background:var(--bg); border:1px solid var(--line); border-radius:12px; padding:14px 16px" });
  const big = h("span.v.tnum", { style: "color:var(--cache); font-size:var(--step-3)" });
  const chartBox = h("div.chart-box", { style: "height:260px" }, h("canvas", { "aria-label": "Speed-up against hit rate" }));
  const ans = h("p.dim", { hidden: true }, "At 90%: 90 hits cost 90, 10 misses cost 1,000. Total 1,090 against 10,000 without a cache, so about 9× faster. Dropping five points of hit rate almost halved the speed-up.");
  const reveal = h("button.btn", { type: "button" }, "Show the answer to the pinned-comment question (90%)");
  reveal.addEventListener("click", () => { ans.hidden = false; reveal.hidden = true; rate.value = "90"; draw(); sfx("hit"); });
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:14px" },
        h("label.field", { for: "hitrate" }, h("span", {}, "Requests that hit the cache: ", rateOut), rate),
        h("label.field", { for: "ratio" }, h("span", {}, "How much slower RAM is than cache: ", ratioOut), ratio),
        formula,
      ),
      h("div", { style: "display:grid; gap:10px; align-content:start" }, h("div.stat", {}, big, h("span.k", {}, "faster than sending every request to RAM")), chartBox),
    ),
    h("div.row", { style: "margin-top:14px" }, reveal), ans,
    takeaway("Keep what you need most in a small, fast layer, and everything else in a big, slow one. You'll see this in every system design."),
  );

  const { Chart } = await lib.chart();
  const xs = Array.from({ length: 101 }, (_, i) => i);
  const chart = new Chart(chartBox.querySelector("canvas")!, {
    type: "line",
    data: { labels: xs, datasets: [
      { label: "speed-up", data: [], borderColor: css("--cache"), borderWidth: 2.5, pointRadius: 0, tension: 0.2 },
      { label: "you are here", data: [], borderColor: css("--text"), backgroundColor: css("--text"), pointRadius: 6, showLine: false },
    ] },
    options: {
      animation: false, maintainAspectRatio: false,
      scales: {
        x: { title: { display: true, text: "hit rate %", color: css("--dim") }, ticks: { color: css("--faint"), maxTicksLimit: 11 }, grid: { color: "rgba(120,140,220,0.08)" } },
        y: { type: "logarithmic", title: { display: true, text: "times faster (log)", color: css("--dim") }, ticks: { color: css("--faint"), callback: (v) => ([1, 2, 5, 10, 20, 50, 100, 200, 500, 1000].includes(+v) ? `${v}×` : "") }, grid: { color: "rgba(120,140,220,0.08)" } },
      },
      plugins: { legend: { display: false } },
    },
  });
  function draw() {
    const r = +rate.value / 100, slow = Math.round(10 ** +ratio.value);
    rateOut.textContent = `${rate.value}%`; ratioOut.textContent = `${slow}×`;
    const hits = Math.round(r * 100), miss = 100 - hits, cost = hits + miss * slow, without = 100 * slow;
    formula.innerHTML = `${hits} hits × 1 = <b>${fmt(hits)}</b><br>${miss} misses × ${slow} = <b>${fmt(miss * slow)}</b><br>with cache: <b style="color:var(--cache)">${fmt(cost)}</b> · without: <b>${fmt(without)}</b>`;
    big.textContent = `${fmt(without / cost, 1)}×`;
    chart.data.datasets[0].data = xs.map((p) => (100 * slow) / (p + (100 - p) * slow)) as never;
    chart.data.datasets[1].data = xs.map((p) => (p === hits ? without / cost : NaN)) as never;
    chart.update();
  }
  rate.addEventListener("input", draw);
  ratio.addEventListener("input", draw);
  draw();
}
