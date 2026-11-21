import { lib } from "../../kit/libs";
import { h, sfx, takeaway, fmt, css } from "../../kit/ui";

const pairs = (n: number) => (n * (n - 1)) / 2;
const words = (x: number) => {
  if (x >= 1e18) return `${fmt(x / 1e18, 1)} billion billion`;
  if (x >= 1e9) return `${fmt(x / 1e9, 1)} billion`;
  if (x >= 1e6) return `${fmt(x / 1e6, 1)} million`;
  return fmt(x);
};

/** Wire every computer to every other one. D3 draws the wires; the count explodes. */
export async function wiresLab(bench: HTMLElement) {
  const n = h("input#wr-n", { type: "range", min: 2, max: 24, step: 1, value: 4 }) as HTMLInputElement;
  const nOut = h("output", {});
  const big = h("span.v.tnum", { style: "color:var(--net)" }, "–");
  const sub = h("span.k", {}, "wires to connect everyone");
  const say = h("p.dim", { "aria-live": "polite", style: "min-height:3em" });
  const jumps = h("div.row", {}, ...[[10, "Ten"], [1000, "A thousand"], [5e9, "Billions of devices"]].map(([v, t]) => {
    const b = h("button.btn", { type: "button" }, String(t));
    b.addEventListener("click", () => show(+v)); return b;
  }));
  const chart = h("div", { style: "min-width:0; display:grid; place-items:center" });
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:12px; align-content:start" },
        h("label.field", { for: "wr-n" }, h("span", {}, "Computers: ", nOut), n), jumps,
        h("div.stat", {}, big, sub), say),
      chart,
    ),
    h("p.note", {}, "Wires needed = n × (n − 1) ÷ 2. Every pair gets its own private line, like the early telephone network."),
    takeaway("Wiring every device to every other device is impossible, and wasteful even where it's possible."),
  );
  const d3 = await lib.d3();
  const S = 360, R = 150, c = S / 2;
  const svg = d3.select(chart).append("svg").attr("viewBox", `0 0 ${S} ${S}`).style("width", "100%").style("max-width", "400px").attr("role", "img").attr("aria-label", "Computers in a circle with a wire between every pair");
  const gL = svg.append("g"), gN = svg.append("g");
  function draw(k: number) {
    const nodes = d3.range(k).map((i) => ({ i, x: c + R * Math.cos((i / k) * 2 * Math.PI - Math.PI / 2), y: c + R * Math.sin((i / k) * 2 * Math.PI - Math.PI / 2) }));
    const links: { a: (typeof nodes)[0]; b: (typeof nodes)[0]; id: string }[] = [];
    for (let a = 0; a < k; a++) for (let b = a + 1; b < k; b++) links.push({ a: nodes[a], b: nodes[b], id: `${a}-${b}` });
    gL.selectAll<SVGLineElement, (typeof links)[0]>("line").data(links, (d) => d.id).join(
      (e) => e.append("line").attr("stroke", css("--net")).attr("stroke-opacity", 0).call((s) => s.transition().duration(400).attr("stroke-opacity", Math.max(0.12, 0.7 - k * 0.025))),
      (u) => u.call((s) => s.transition().duration(400).attr("stroke-opacity", Math.max(0.12, 0.7 - k * 0.025))),
      (x) => x.remove(),
    ).attr("x1", (d) => d.a.x).attr("y1", (d) => d.a.y).attr("x2", (d) => d.b.x).attr("y2", (d) => d.b.y).attr("stroke-width", 1.2);
    gN.selectAll<SVGGElement, (typeof nodes)[0]>("g").data(nodes, (d) => String(d.i)).join((e) => { const g = e.append("g"); g.append("rect").attr("x", -11).attr("y", -8).attr("width", 22).attr("height", 15).attr("rx", 3).attr("fill", css("--panel2")).attr("stroke", css("--net")); g.append("rect").attr("x", -5).attr("y", 8).attr("width", 10).attr("height", 3).attr("fill", css("--net")); return g; })
      .transition().duration(400).attr("transform", (d) => `translate(${d.x},${d.y})`);
  }
  function show(k: number) {
    const w = pairs(k);
    big.textContent = words(w);
    big.style.color = w > 10_000 ? "var(--bad)" : "var(--net)";
    if (k <= 24) { n.value = String(k); nOut.textContent = String(k); draw(k); }
    else { nOut.textContent = `${words(k)} (drawing shows 24)`; draw(24); }
    say.textContent = k === 2 ? "Two computers, one wire. Perfectly fine." : k <= 24 ? `${k} computers need ${fmt(w)} wires. One more computer adds ${k} more.` : k === 1000 ? "A thousand computers need almost half a million wires." : "Billions of devices would need billions of billions of wires. And each private line sits idle most of the time.";
    sfx(w > 10_000 ? "miss" : "tick", 0.2);
  }
  n.addEventListener("input", () => show(+n.value));
  show(4);
}
