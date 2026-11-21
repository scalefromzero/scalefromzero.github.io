import { lib } from "../../kit/libs";
import { h, sfx, takeaway, fmt, css } from "../../kit/ui";
import { downtime } from "../ring";

const NAMES = ["Load balancer", "Server", "Cache", "Database", "Auth service", "Payments", "Search", "Queue", "Email", "Images", "Pricing", "Seat map", "Fraud check", "Logging", "Config", "Session store", "Inventory", "Notifications", "Reports", "Recommendations"];
const STEPS = [0.99, 0.999, 0.9999];

/** Nines multiply along a chain. Add parts, change their nines, and watch the whole chain drop. Chart.js. */
export async function chainLab(bench: HTMLElement) {
  let parts = [0.999, 0.999, 0.999, 0.999];
  const chainEl = h("div", { style: "display:flex; flex-wrap:wrap; gap:6px; align-items:center" });
  const add = h("button.btn", { type: "button" }, "+ Add a part"), rem = h("button.btn", { type: "button" }, "− Remove"), twenty = h("button.btn", { type: "button" }, "Twenty parts");
  const big = h("span.v.tnum", {}, "–"), down = h("span.v.tnum", { style: "color:var(--bad)" }, "–");
  const sum = h("p.mono", { style: "font-size:var(--step--1); margin:0; overflow-wrap:anywhere" });
  const chartBox = h("div.chart-box", { style: "height:240px" }, h("canvas", { "aria-label": "Chain availability against number of parts" }));
  bench.append(
    h("div", { style: "display:grid; gap:12px" },
      h("span.eyebrow", {}, "A request passes through every part, one after another. Tap a part to change its nines."),
      chainEl,
      h("div.row", {}, add, rem, twenty)),
    h("div.bench-grid", { style: "margin-top:16px" },
      h("div", { style: "display:grid; gap:12px; align-content:start" },
        h("div.stats", {}, h("div.stat", {}, big, h("span.k", {}, "whole chain up")), h("div.stat", {}, down, h("span.k", {}, "down a year"))), sum),
      chartBox,
    ),
    h("p.note", {}, "Chain availability is every part's availability multiplied together, assuming parts fail independently."),
    takeaway("The more boxes a request must pass through, the weaker the chain."),
  );
  const { Chart } = await lib.chart();
  const xs = Array.from({ length: 20 }, (_, i) => i + 1);
  const chart = new Chart(chartBox.querySelector("canvas")!, {
    type: "line",
    data: { labels: xs, datasets: [
      { label: "every part 99.9%", data: xs.map((n) => 100 * 0.999 ** n), borderColor: css("--storage"), borderWidth: 2.5, pointRadius: 0, tension: 0.2 },
      { label: "your chain", data: [], borderColor: css("--cpu"), backgroundColor: css("--cpu"), pointRadius: 7, showLine: false },
    ] },
    options: {
      maintainAspectRatio: false, animation: { duration: 300 },
      scales: {
        x: { title: { display: true, text: "parts in a row", color: css("--dim") }, ticks: { color: css("--faint") }, grid: { color: "rgba(120,140,220,0.08)" } },
        y: { min: 97.5, max: 100, ticks: { color: css("--faint"), callback: (v) => `${v}%` }, grid: { color: "rgba(120,140,220,0.08)" } },
      },
      plugins: { legend: { labels: { color: css("--dim"), boxWidth: 12 } }, tooltip: { callbacks: { label: (c) => `${fmt(c.parsed.y ?? 0, 2)}%` } } },
    },
  });
  function draw() {
    chainEl.innerHTML = "";
    parts.forEach((a, i) => {
      const chip = h("button.chip", { type: "button", style: `color:var(${a >= 0.9999 ? "--good" : a >= 0.999 ? "--storage" : "--bad"}); cursor:pointer`, title: "Change this part's nines" }, h("i"), `${NAMES[i]} ${+(a * 100).toFixed(2)}%`);
      chip.addEventListener("click", () => { parts[i] = STEPS[(STEPS.indexOf(a) + 1) % STEPS.length]; draw(); sfx("tick", 0.2); });
      chainEl.append(chip);
      if (i < parts.length - 1) chainEl.append(h("span.faint", {}, "→"));
    });
    const A = parts.reduce((p, a) => p * a, 1);
    big.textContent = `${fmt(A * 100, A > 0.999 ? 2 : 1)}%`;
    big.style.color = A >= 0.999 ? "var(--good)" : A >= 0.99 ? "var(--storage)" : "var(--bad)";
    down.textContent = downtime((1 - A) * 8760);
    sum.textContent = parts.map((a) => +(a * 100).toFixed(2)).join(" × ").replace(/(\d)(?= ×)/g, "$1%") + `% = ${fmt(A * 100, 2)}%`;
    (chart.options.scales!.y as { min: number }).min = Math.min(97.5, Math.floor(A * 100 - 0.5));
    chart.data.datasets[1].data = xs.map((n) => (n === parts.length ? A * 100 : null)) as never;
    chart.update();
    (add as HTMLButtonElement).disabled = parts.length >= 20; (rem as HTMLButtonElement).disabled = parts.length <= 1;
  }
  add.addEventListener("click", () => { if (parts.length < 20) { parts.push(0.999); draw(); sfx("pop", 0.2); } });
  rem.addEventListener("click", () => { if (parts.length > 1) { parts.pop(); draw(); sfx("tick", 0.2); } });
  twenty.addEventListener("click", () => { parts = Array(20).fill(0.999); draw(); sfx("miss", 0.25); });
  draw();
}
