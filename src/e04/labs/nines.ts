import { lib } from "../../kit/libs";
import { h, sfx, takeaway, fmt, css } from "../../kit/ui";
import { downtime } from "../ring";

const LEVELS = [0.9, 0.99, 0.999, 0.9999, 0.99999];
const PERIODS = [["a year", 8760], ["a month", 720], ["a week", 168], ["a day", 24]] as const;

/** Every extra nine cuts downtime by ten. D3 log-scale bars, plus SLO vs SLA with a month you control. */
export async function ninesLab(bench: HTMLElement) {
  const seg = h("div.seg", { role: "group", "aria-label": "Downtime per" });
  let period = 0;
  PERIODS.forEach(([name], i) => {
    const b = h("button", { type: "button", "aria-pressed": String(i === 0) }, `per ${name.split(" ")[1]}`);
    b.addEventListener("click", () => { period = i; [...seg.children].forEach((x) => x.setAttribute("aria-pressed", String(x === b))); draw(); sfx("tick", 0.2); });
    seg.append(b);
  });
  const chart = h("div", { style: "min-width:0" });
  const month = h("input#nn-month", { type: "range", min: 99, max: 100, step: 0.01, value: 99.95 }) as HTMLInputElement;
  const monthOut = h("output", {});
  const slo = h("div.box", { style: "--bc: var(--net); min-height:auto" });
  const sla = h("div.box", { style: "--bc: var(--storage); min-height:auto" });
  bench.append(
    h("div", { style: "display:grid; gap:12px" }, h("div.row", { style: "justify-content:space-between" }, h("span.eyebrow", {}, "Allowed downtime"), seg), chart),
    h("div.bench-grid", { style: "margin-top:18px" },
      h("div", { style: "display:grid; gap:10px; align-content:start" },
        h("span.eyebrow", {}, "Target: 99.9% this month"),
        h("label.field", { for: "nn-month" }, h("span", {}, "What actually happened: ", monthOut), month)),
      h("div", { style: "display:grid; gap:10px" }, slo, sla),
    ),
    h("p.note", {}, "Bars use a log scale, so each step is ten times shorter. Downtime = (1 − availability) × the period. A month here is 30 days. The money-back figure is an example; real contracts differ."),
    takeaway("Your own target is an SLO. Promise it to customers in a contract, with money back if you miss, and it's an SLA."),
  );

  const d3 = await lib.d3();
  const x = d3.scaleLog().range([2, 100]);
  const label = (a: number) => `${+(a * 100).toFixed(3)}%`;
  const COL = [css("--bad"), css("--bad"), css("--storage"), css("--ram"), css("--good")];
  const rows = LEVELS.map((a, i) => {
    const bar = h("i", { style: `display:block; height:100%; width:0%; border-radius:6px; background:${COL[i]}; transition:width .5s cubic-bezier(.2,.8,.2,1)` });
    const val = h("b", { style: "font: 600 var(--step--1)/1.2 var(--body); color:var(--dim); white-space:nowrap" });
    chart.append(h("div", { style: "display:grid; grid-template-columns: 5.2em minmax(0,1fr) 7.5em; gap:10px; align-items:center" },
      h("span", { style: "font: 700 var(--step--1)/1 var(--mono); text-align:right" }, label(a)),
      h("div", { style: "height:clamp(18px,3vw,34px)" }, bar), val));
    return { bar, val };
  });
  chart.style.cssText += "; display:grid; gap:10px";
  chart.setAttribute("role", "img"); chart.setAttribute("aria-label", "Downtime allowed by each number of nines, log scale");
  function draw() {
    const hrs = PERIODS[period][1];
    const v = LEVELS.map((a) => (1 - a) * hrs);
    x.domain([d3.min(v)! / 2, d3.max(v)!]);
    rows.forEach((r, i) => { r.bar.style.width = `${Math.max(2, x(v[i]))}%`; r.val.textContent = downtime(v[i]); });
  }
  function month_() {
    const a = +month.value; monthOut.textContent = `${fmt(a, 2)}% up · ${downtime((1 - a / 100) * 720)} down`;
    const met = a >= 99.9;
    slo.innerHTML = `<b>SLO · your own target</b><span>Service level objective: 99.9%, about 43 minutes of downtime a month.</span><b style="color:var(${met ? "--good" : "--bad"}); font-size:0.95rem">${met ? "Met. Keep shipping." : "Missed. The team slows down and fixes reliability."}</b>`;
    sla.innerHTML = `<b>SLA · a promise in a contract</b><span>Service level agreement: the same 99.9%, with money back if you miss it.</span><b style="color:var(${met ? "--good" : "--bad"}); font-size:0.95rem">${met ? "No refund owed." : "Customers get money back, for example 10% of the monthly bill."}</b>`;
  }
  month.addEventListener("input", () => { const was = slo.textContent?.includes("Met"); month_(); if (was !== slo.textContent?.includes("Met")) sfx(was ? "miss" : "hit", 0.25); });
  draw(); month_();
}
