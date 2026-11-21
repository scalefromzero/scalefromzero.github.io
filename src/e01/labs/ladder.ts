import { lib } from "../../kit/libs";
import { h, sfx, takeaway, css, reducedMotion } from "../../kit/ui";
import { OPS, human, real, SOURCES } from "../data";

/** Log-scale latency ladder (D3). Toggle the axis between real time and "1 ns = 1 s" time. */
export async function ladderLab(bench: HTMLElement) {
  const box = h("div.ladder");
  const real_ = h("button", { type: "button", "aria-pressed": "true" }, "Real time");
  const human_ = h("button", { type: "button", "aria-pressed": "false" }, "If 1 ns = 1 s");
  const detail = h("p.dim", { "aria-live": "polite", style: "min-height:3em" }, "Hover or tap a bar.");
  bench.append(
    h("div.row", { style: "justify-content:space-between; margin-bottom:12px" }, h("div.seg", { role: "group", "aria-label": "Axis units" }, real_, human_), h("span.chip", {}, "log scale: every gridline is 10× slower")),
    box, detail,
    h("p.note", {}, "Rounded orders of magnitude; real hardware varies. Sources: ", ...SOURCES.flatMap(([t, u], i) => [i ? " · " : "", h("a", { href: u, target: "_blank", rel: "noopener" }, t)])),
    takeaway("Don't memorise the numbers. Remember the shape: cache, then RAM, then storage, then the network, each a giant step slower."),
  );

  const d3 = await lib.d3();
  const W = 900, rowH = 38, M = { t: 10, r: 140, b: 42, l: 250 };
  const H = M.t + M.b + rowH * OPS.length;
  const svg = d3.select(box).append("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("class", "fill").attr("role", "img").attr("aria-label", "Latency of common operations on a log scale");
  const x = d3.scaleLog().domain([0.5, 1e9]).range([M.l, W - M.r]);
  const y = d3.scaleBand().domain(OPS.map((o) => o.key)).range([M.t, H - M.b]).padding(0.28);
  const ticks = [1, 10, 100, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9];
  const grid = svg.append("g");
  const axis = svg.append("g").attr("transform", `translate(0,${H - M.b + 8})`);
  let mode: "real" | "human" = "real";
  const drawAxis = () => {
    grid.selectAll("line").data(ticks).join("line").attr("x1", (d) => x(d)).attr("x2", (d) => x(d)).attr("y1", M.t).attr("y2", H - M.b).attr("stroke", css("--line")).attr("stroke-dasharray", "2 4");
    const t = axis.selectAll<SVGTextElement, number>("text").data(ticks).join("text").attr("x", (d) => x(d)).attr("y", 14).attr("text-anchor", "middle").attr("fill", css("--dim")).attr("font-size", 12);
    t.text((d) => (mode === "real" ? real(d) : human(d).replace(/ (seconds?|minutes?|hours?|days?|months?|years?)/, (m) => " " + m.trim().slice(0, 3))));
  };
  drawAxis();
  const g = svg.append("g").selectAll("g").data(OPS).join("g").attr("transform", (d) => `translate(0,${y(d.key)})`).style("cursor", "pointer");
  g.append("text").attr("x", M.l - 12).attr("y", y.bandwidth() / 2 + 5).attr("text-anchor", "end").attr("fill", css("--text")).attr("font-size", 14).text((d) => d.label);
  const bars = g.append("rect").attr("x", x(0.5)).attr("height", y.bandwidth()).attr("rx", 5).attr("fill", (d) => css(`--${d.layer}`)).attr("width", 0);
  const lab = g.append("text").attr("y", y.bandwidth() / 2 + 5).attr("fill", css("--dim")).attr("font-size", 13);
  const place = () => {
    bars.transition().duration(reducedMotion() ? 0 : 900).delay((_, i) => i * 70).attr("width", (d) => x(d.ns) - x(0.5));
    lab.attr("x", (d) => x(d.ns) + 8).text((d) => (mode === "real" ? real(d.ns) : human(d.ns)));
  };
  place();
  g.on("mouseenter click", (_, d) => {
    detail.innerHTML = `<b style="color:var(--${d.layer})">${d.label}</b>: about ${real(d.ns)}. If one nanosecond lasted a second, that's <b>${human(d.ns)}</b>. In the desk picture, ${d.note}.`;
    bars.attr("opacity", (o) => (o === d ? 1 : 0.45));
  }).on("mouseleave", () => bars.attr("opacity", 1));
  const setMode = (m: typeof mode) => {
    mode = m; real_.setAttribute("aria-pressed", String(m === "real")); human_.setAttribute("aria-pressed", String(m === "human"));
    drawAxis(); lab.text((d) => (mode === "real" ? real(d.ns) : human(d.ns))); sfx("whoosh", 0.25);
  };
  real_.addEventListener("click", () => setMode("real"));
  human_.addEventListener("click", () => setMode("human"));
}
