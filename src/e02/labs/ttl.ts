import { lib } from "../../kit/libs";
import { h, takeaway, css, fmt } from "../../kit/ui";

/** Time to live: fresher answers vs fewer database trips, over two minutes of a sale. */
export async function ttlLab(bench: HTMLElement) {
  const ttl = h("input#ttl", { type: "range", min: 0, max: 5, step: 1, value: 2 }) as HTMLInputElement;
  const STEPS = [1, 2, 5, 10, 30, 60];
  const ttlOut = h("output", {});
  const st = (k: string, c: string) => { const v = h("span.v.tnum", { style: `color:var(${c})` }); return { el: h("div.stat", {}, v, h("span.k", {}, k)), v }; };
  const sReads = st("database reads in 2 minutes", "--storage"), sErr = st("worst gap between screen and truth", "--bad"), sAge = st("average age of the number", "--cache");
  const chartBox = h("div.chart-box", { style: "height:280px" }, h("canvas", { "aria-label": "Seats really left vs seats shown from the cache" }));
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:14px; align-content:start" },
        h("label.field", { for: "ttl" }, h("span", {}, "Time to live for the seats-left note: ", ttlOut), ttl),
        h("div.stats", {}, sReads.el, sErr.el, sAge.el),
        h("div", { style: "display:grid; gap:6px; font-size:var(--step--1)" },
          h("span.chip", {}, h("i", { style: "color:var(--ram)" }), "Poster and description: cache for hours"),
          h("span.chip", {}, h("i", { style: "color:var(--bad)" }), "Seats left: cache for a few seconds")),
      ),
      chartBox,
    ),
    h("p.note", {}, "Simulated sale: 500 seats, selling a few per second, thousands of fans asking. When the note expires, the next question refreshes it from the database."),
    takeaway("A short time to live means fresher answers and more database trips. A long one means fewer trips and older answers. Pick it per kind of data."),
  );

  // deterministic sales: same curve every time
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const truth: number[] = []; let seats = 500;
  for (let t = 0; t <= 120; t++) { truth.push(seats); seats = Math.max(0, seats - Math.round(rnd() * 8)); }
  const { Chart } = await lib.chart();
  const xs = truth.map((_, i) => i);
  const chart = new Chart(chartBox.querySelector("canvas")!, {
    type: "line",
    data: { labels: xs, datasets: [
      { label: "seats really left", data: truth, borderColor: css("--storage"), borderWidth: 2, pointRadius: 0 },
      { label: "seats shown (from cache)", data: [], borderColor: css("--ram"), borderWidth: 2.5, pointRadius: 0, stepped: true },
    ] },
    options: {
      animation: false, maintainAspectRatio: false,
      scales: {
        x: { title: { display: true, text: "seconds into the sale", color: css("--dim") }, ticks: { color: css("--faint"), maxTicksLimit: 9 }, grid: { color: "rgba(120,140,220,0.08)" } },
        y: { title: { display: true, text: "seats", color: css("--dim") }, ticks: { color: css("--faint") }, grid: { color: "rgba(120,140,220,0.08)" } },
      },
      plugins: { legend: { labels: { color: css("--dim"), boxWidth: 12 } } },
    },
  });
  function draw() {
    const T = STEPS[+ttl.value];
    ttlOut.textContent = `${T} s`;
    const shown = xs.map((t) => truth[Math.floor(t / T) * T]);
    chart.data.datasets[1].data = shown as never;
    chart.update();
    sReads.v.textContent = fmt(Math.ceil(121 / T));
    sErr.v.textContent = `${fmt(Math.max(...xs.map((t) => shown[t] - truth[t])))} seats`;
    sAge.v.textContent = `${fmt(T / 2, T < 2 ? 1 : 0)} s`;
  }
  ttl.addEventListener("input", draw);
  draw();
}
