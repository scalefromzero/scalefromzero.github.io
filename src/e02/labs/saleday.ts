import { lib } from "../../kit/libs";
import { h, takeaway, css, fmt, sfx } from "../../kit/ui";

const CAP = 5_000; // example: careful database answers 5,000 seat questions a second
const TIMEOUT = 30;

/** Queue maths for sale day: questions arrive faster than the database can answer, and waits explode. */
export async function saleDayLab(bench: HTMLElement) {
  const fans = h("input#fans", { type: "range", min: 2, max: 6.3, step: 0.01, value: 6.3 }) as HTMLInputElement;
  const fansOut = h("output", {});
  const cache = h("input#cacheon", { type: "checkbox" }) as HTMLInputElement;
  const st = (k: string, c = "--text") => { const v = h("span.v.tnum", { style: `color:var(${c})` }); return { el: h("div.stat", {}, v, h("span.k", {}, k)), v }; };
  const sQps = st("questions per second", "--net"), sDb = st("reach the database", "--storage"), sFail = st("pages start failing after", "--bad");
  const chartBox = h("div.chart-box", { style: "height:260px" }, h("canvas", { "aria-label": "Wait time for a page during the first minute of the sale" }));
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:14px; align-content:start" },
        h("label.field", { for: "fans" }, h("span", {}, "Fans refreshing in the same minute: ", fansOut), fans),
        h("label.row", { for: "cacheon", style: "gap:8px; color:var(--dim)" }, cache, "Put a cache in front of the database"),
        h("div.stats", {}, sQps.el, sDb.el, sFail.el),
      ),
      chartBox,
    ),
    h("p.note", {}, `Example database that can answer ${fmt(CAP)} seat questions a second. Questions it can't answer yet wait in a queue; a page gives up after ${TIMEOUT} s.`),
    takeaway("Almost every question is the same question with the same answer. Asking the slowest part of the system to repeat itself is the real problem."),
  );

  const { Chart } = await lib.chart();
  const secs = Array.from({ length: 61 }, (_, i) => i);
  const chart = new Chart(chartBox.querySelector("canvas")!, {
    type: "line",
    data: { labels: secs, datasets: [
      { label: "wait for a page (s)", data: [], borderColor: css("--bad"), backgroundColor: "rgba(248,113,113,0.12)", fill: true, borderWidth: 2.5, pointRadius: 0 },
      { label: "page gives up", data: secs.map(() => TIMEOUT), borderColor: css("--faint"), borderDash: [6, 6], borderWidth: 1.5, pointRadius: 0 },
    ] },
    options: {
      animation: { duration: 400 }, maintainAspectRatio: false,
      scales: {
        x: { title: { display: true, text: "seconds after 10:00", color: css("--dim") }, ticks: { color: css("--faint"), maxTicksLimit: 7 }, grid: { color: "rgba(120,140,220,0.08)" } },
        y: { min: 0, max: 60, title: { display: true, text: "wait (s)", color: css("--dim") }, ticks: { color: css("--faint") }, grid: { color: "rgba(120,140,220,0.08)" } },
      },
      plugins: { legend: { labels: { color: css("--dim"), boxWidth: 12 } } },
    },
  });
  let lastFail = false;
  function draw() {
    const n = Number((10 ** +fans.value).toPrecision(2));
    fansOut.textContent = fmt(n);
    const qps = n / 60;
    // with a cache: ~10 different questions on the page, each re-fetched once per 5 s note → ~2 database questions a second
    const db = cache.checked ? Math.min(qps, 2) : qps;
    sQps.v.textContent = fmt(qps);
    sDb.v.textContent = cache.checked ? `${fmt(db)}/s` : "all of them";
    const wait = secs.map((t) => Math.min(60, db > CAP ? ((db - CAP) * t) / CAP + 0.2 : 0.2));
    chart.data.datasets[0].data = wait as never;
    chart.update();
    const failAt = wait.findIndex((w) => w >= TIMEOUT);
    sFail.v.textContent = failAt >= 0 ? `${failAt} s` : "never";
    if ((failAt >= 0) !== lastFail) { sfx(failAt >= 0 ? "miss" : "hit", 0.3); lastFail = failAt >= 0; }
  }
  fans.addEventListener("input", draw);
  cache.addEventListener("change", draw);
  draw();
}
