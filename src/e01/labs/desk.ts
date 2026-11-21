import { lib } from "../../kit/libs";
import { h, sfx, takeaway, reducedMotion, css } from "../../kit/ui";

type Where = "cabinet" | "desk" | "hand";
const ST = [
  { key: "cabinet", x: 90, label: "Filing cabinet", real: "Storage (SSD)", c: "--storage" },
  { key: "desk", x: 250, label: "Desk", real: "RAM", c: "--ram" },
  { key: "hand", x: 410, label: "Page in hand", real: "CPU cache", c: "--cache" },
  { key: "brain", x: 560, label: "Brain", real: "CPU", c: "--cpu" },
] as const;

/** The desk analogy as a working model: the report is copied up the layers, and the next read is instant. */
export async function deskLab(bench: HTMLElement) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 640 300");
  svg.setAttribute("class", "desk-svg");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Filing cabinet, desk, page in hand and brain, left to right");
  const log = h("div.log", { "aria-live": "polite" });
  const ask = h("button.btn.primary", { type: "button" }, "Ask for the sales report");
  const clearHands = h("button.btn", { type: "button" }, "Drop the page");
  const clearDesk = h("button.btn", { type: "button" }, "Clear the desk");
  bench.append(
    h("div.bench-grid", {},
      h("div", {}, svg),
      h("div", { style: "display:grid; gap:12px" }, h("div.row", {}, ask, clearHands, clearDesk), log),
    ),
    takeaway("The first read pays for the long walk. Every read after it is close at hand. That is a cache."),
  );

  const rough = await lib.rough();
  const rs = rough.svg(svg);
  const add = (n: Element) => svg.appendChild(n);
  const col = (v: string) => css(v) || "#fff";
  // floor
  add(rs.line(20, 250, 620, 250, { stroke: col("--faint"), roughness: 1.4 }));
  // cabinet
  add(rs.rectangle(50, 90, 80, 160, { stroke: col("--storage"), fill: "rgba(245,165,36,0.12)", fillStyle: "solid" }));
  [0, 1, 2].forEach((i) => add(rs.rectangle(60, 104 + i * 48, 60, 36, { stroke: col("--storage") })));
  // desk
  add(rs.rectangle(190, 180, 120, 12, { stroke: col("--ram"), fill: col("--ram"), fillStyle: "hachure", hachureGap: 4 }));
  add(rs.line(200, 192, 200, 250, { stroke: col("--ram") }));
  add(rs.line(300, 192, 300, 250, { stroke: col("--ram") }));
  // hand
  add(rs.ellipse(410, 205, 70, 40, { stroke: col("--cache"), fill: "rgba(167,139,250,0.14)", fillStyle: "solid" }));
  // brain
  add(rs.circle(560, 150, 86, { stroke: col("--cpu"), fill: "rgba(251,113,133,0.14)", fillStyle: "solid", roughness: 2 }));
  add(rs.curve([[530, 150], [548, 130], [565, 158], [588, 138]], { stroke: col("--cpu") }));
  ST.forEach((s) => {
    const t = document.createElementNS(svg.namespaceURI, "text");
    t.setAttribute("x", String(s.x)); t.setAttribute("y", "282"); t.setAttribute("text-anchor", "middle");
    t.setAttribute("fill", col(s.c)); t.setAttribute("font-size", "14"); t.setAttribute("font-family", "SFZ Head, sans-serif"); t.setAttribute("font-weight", "700");
    t.textContent = s.real; add(t);
    const t2 = t.cloneNode() as SVGTextElement; t2.setAttribute("y", "40"); t2.setAttribute("fill", col("--dim")); t2.setAttribute("font-weight", "500"); t2.textContent = s.label; add(t2);
  });
  // copies of the report that stay behind
  const copies: Record<string, SVGGElement> = {};
  const paper = (x: number, y: number, c: string) => {
    const g = document.createElementNS(svg.namespaceURI, "g") as SVGGElement;
    g.appendChild(rs.rectangle(-14, -18, 28, 36, { stroke: "#EEF2FF", fill: c, fillStyle: "solid", roughness: 0.8 }));
    [-8, -1, 6].forEach((yy) => g.appendChild(rs.line(-8, yy, 8, yy, { stroke: "#0A0F1E", roughness: 0.4 })));
    g.setAttribute("transform", `translate(${x},${y})`);
    return g;
  };
  const spot: Record<Where, [number, number]> = { cabinet: [90, 128], desk: [250, 160], hand: [410, 196] };
  (["cabinet", "desk", "hand"] as Where[]).forEach((w) => { copies[w] = paper(...spot[w], "#F8FAFC"); add(copies[w]); });
  const mover = paper(90, 128, "#FDE68A"); mover.style.opacity = "0"; add(mover);

  const state: Record<Where, boolean> = { cabinet: true, desk: false, hand: false };
  const paint = () => (["desk", "hand"] as Where[]).forEach((w) => (copies[w].style.opacity = state[w] ? "1" : "0"));
  paint();
  let reads = 0;
  const line = (text: string, cls = "") => { log.append(h(`span${cls ? "." + cls : ""}`, {}, text)); while (log.children.length > 7) log.firstElementChild!.remove(); };
  line("The report lives in the cabinet. Ask for it.");

  async function move(from: [number, number], to: [number, number], dur: number) {
    const { gsap } = await lib.gsap();
    mover.style.opacity = "1";
    const o = { x: from[0], y: from[1] };
    await gsap.to(o, { x: to[0], y: to[1], duration: reducedMotion() ? 0 : dur, ease: "power2.inOut", onUpdate: () => mover.setAttribute("transform", `translate(${o.x},${o.y - Math.sin(((o.x - from[0]) / (to[0] - from[0] || 1)) * Math.PI) * 40})`) });
  }
  let busy = false;
  ask.addEventListener("click", async () => {
    if (busy) return; busy = true; ask.setAttribute("disabled", "");
    reads++;
    if (state.hand) { line(`Read ${reads}: already in your hand. Hit. ≈ 1 second.`, "hit"); sfx("hit"); }
    else if (state.desk) {
      line(`Read ${reads}: not in hand, but on the desk. ≈ 2 minutes.`, "miss"); sfx("tick");
      await move(spot.desk, spot.hand, 0.7); state.hand = true;
    } else {
      line(`Read ${reads}: walk to the cabinet… ≈ 1 day.`, "miss"); sfx("whoosh");
      await move(spot.cabinet, spot.desk, 1.6); state.desk = true; paint();
      line("Copy left on the desk. Now pick it up. ≈ 2 minutes.");
      await move(spot.desk, spot.hand, 0.7); state.hand = true;
    }
    await move(spot.hand, [560, 150], 0.3);
    mover.style.opacity = "0"; paint();
    line("Your brain uses it.");
    busy = false; ask.removeAttribute("disabled");
  });
  clearHands.addEventListener("click", () => { state.hand = false; paint(); line("You put the page down. It's still on the desk."); sfx("pop"); });
  clearDesk.addEventListener("click", () => { state.hand = state.desk = false; paint(); line("Desk cleared (like RAM after a restart). Only the cabinet has it."); sfx("powerdown", 0.25); });
}
