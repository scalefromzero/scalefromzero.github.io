import { lib } from "../../kit/libs";
import { h, sfx, takeaway, css } from "../../kit/ui";
import { NODES, EDGES, TRACE } from "../map3d";

const SAY: Record<string, string> = {
  phone: "Maya taps Buy. Her phone is the client.",
  lb: "The load balancer picks one of many servers.",
  s2: "A server takes the order.",
  cache: "It checks the cache: is the seat map already on the shelf?",
  db: "It asks the database whether seat 12 is still free, and books it.",
  pay: "It calls the payment company to charge the card.",
};

/** The whole map, flat: step through one request. Monitoring logs every step; the pipeline ships code behind the scenes. */
export async function flatMapLab(bench: HTMLElement) {
  const box = h("div.flat-map");
  const say = h("p.map-step", { "aria-live": "polite", style: "font-family:var(--head); font-size:var(--step-1)" }, "Step through Maya's request.");
  const stepBtn = h("button.btn.primary", { type: "button" }, "Next step");
  const playBtn = h("button.btn", { type: "button" }, "Play it all");
  const resetBtn = h("button.btn", { type: "button" }, "Start over");
  const logCount = h("span.chip", {}, "0 log lines written");
  bench.append(box, h("div.row", { style: "margin-top:12px" }, stepBtn, playBtn, resetBtn, logCount), say,
    takeaway("Almost every app in your pocket follows this map. The big ones just have more copies of every box, spread across the world."));

  const d3 = await lib.d3();
  const W = 1000, H = 560, sx = (x: number) => 500 + x * 62, sz = (z: number) => 280 + z * 48;
  const svg = d3.select(box).append("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("class", "fill").attr("role", "img").attr("aria-label", "Diagram: phone, load balancer, servers, cache, database, payment service, monitoring and pipeline");
  const pos = Object.fromEntries(NODES.map((n) => [n.k, [sx(n.x), sz(n.z)]])) as Record<string, [number, number]>;
  const edges = svg.append("g").selectAll("line").data(EDGES).join("line")
    .attr("x1", (d) => pos[d[0]][0]).attr("y1", (d) => pos[d[0]][1]).attr("x2", (d) => pos[d[1]][0]).attr("y2", (d) => pos[d[1]][1])
    .attr("stroke", css("--line")).attr("stroke-width", 2).attr("stroke-dasharray", (d) => (d[0] === "ci" || d[1] === "mon" ? "5 5" : null));
  const nodes = svg.append("g").selectAll("g").data(NODES).join("g").attr("transform", (n) => `translate(${pos[n.k][0]},${pos[n.k][1]})`);
  const rect = nodes.append("rect").attr("x", -74).attr("y", -26).attr("width", 148).attr("height", 52).attr("rx", 10)
    .attr("fill", css("--bg2")).attr("stroke", (n) => css(n.c)).attr("stroke-width", 2);
  nodes.append("text").attr("text-anchor", "middle").attr("y", -3).attr("fill", css("--text")).attr("font-size", 15).attr("font-weight", 700).text((n) => n.name);
  nodes.append("text").attr("text-anchor", "middle").attr("y", 15).attr("fill", css("--dim")).attr("font-size", 11).text((n) => n.sub);
  const dot = svg.append("circle").attr("r", 9).attr("fill", css("--text")).attr("opacity", 0).style("filter", "drop-shadow(0 0 6px #fff)");

  let i = -1, logs = 0;
  const show = (k: number) => {
    const key = TRACE[k], prev = TRACE[k - 1];
    rect.attr("fill", (n) => (n.k === key ? css(n.c) + "33" : css("--bg2")));
    edges.attr("stroke", (e) => (prev && ((e[0] === prev && e[1] === key) || (e[1] === prev && e[0] === key)) ? css("--text") : css("--line")));
    dot.attr("opacity", 1).transition().duration(450).attr("cx", pos[key][0]).attr("cy", pos[key][1]);
    const back = k > TRACE.indexOf(key);
    say.textContent = k === TRACE.length - 1 ? "The answer travels back. Seat booked." : back ? (key === "s2" ? "Back at the server with the answer." : "Passing the answer back.") : SAY[key];
    logs++; logCount.textContent = `${logs} log line${logs === 1 ? "" : "s"} written · metrics updated`;
    svg.selectAll<SVGRectElement, (typeof NODES)[number]>("g rect").filter((n) => n.k === "mon").transition().duration(150).attr("fill", css("--bad") + "44").transition().duration(400).attr("fill", css("--bg2"));
    sfx("tick", 0.18);
  };
  const step = () => { if (i < TRACE.length - 1) { i++; show(i); } };
  stepBtn.addEventListener("click", step);
  resetBtn.addEventListener("click", () => { i = -1; logs = 0; logCount.textContent = "0 log lines written"; dot.attr("opacity", 0); rect.attr("fill", css("--bg2")); edges.attr("stroke", css("--line")); say.textContent = "Step through Maya's request."; });
  playBtn.addEventListener("click", async () => { resetBtn.dispatchEvent(new Event("click")); for (let k = 0; k < TRACE.length; k++) { step(); await new Promise((r) => setTimeout(r, 650)); } });
}
