import { lib } from "../../kit/libs";
import { h, sfx, takeaway, reducedMotion } from "../../kit/ui";

const NS = "http://www.w3.org/2000/svg";
const LAYERS = [
  { r: 120, fill: "#1b2547", name: "Plastic outer jacket", what: "keeps the sea out" },
  { r: 98, fill: "#8a6a3a", name: "Copper tube", what: "carries power to the amplifiers along the cable" },
  { r: 80, fill: "#55607e", name: "Steel wires", what: "give it strength on the sea floor" },
  { r: 58, fill: "#2c3a66", name: "Water barrier", what: "seals the glass from water" },
  { r: 36, fill: "#0b1022", name: "Glass fibres", what: "hair-thin strands; your packet travels as flashes of light" },
];

/** Inside an undersea cable. Tap to pull it apart; light pulses run through the glass. */
export async function oceanLab(bench: HTMLElement) {
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 300 300"); svg.setAttribute("role", "img"); svg.setAttribute("aria-label", "Cross-section of an undersea cable");
  svg.style.cssText = "width:100%; max-width:340px; display:block; margin:auto; overflow:visible";
  const groups = LAYERS.map((l) => {
    const g = document.createElementNS(NS, "g");
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("cx", "150"); c.setAttribute("cy", "150"); c.setAttribute("r", String(l.r)); c.setAttribute("fill", l.fill); c.setAttribute("stroke", "#0A0F1E"); c.setAttribute("stroke-width", "2");
    g.style.transformOrigin = "150px 150px";
    g.append(c); svg.append(g); return g;
  });
  // steel wires ring
  for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; const c = document.createElementNS(NS, "circle"); c.setAttribute("cx", String(150 + 69 * Math.cos(a))); c.setAttribute("cy", String(150 + 69 * Math.sin(a))); c.setAttribute("r", "8"); c.setAttribute("fill", "#7d89aa"); groups[2].append(c); }
  // 8 fibres
  const fibres: SVGCircleElement[] = [];
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; const c = document.createElementNS(NS, "circle"); c.setAttribute("cx", String(150 + 18 * Math.cos(a))); c.setAttribute("cy", String(150 + 18 * Math.sin(a))); c.setAttribute("r", "5"); c.setAttribute("fill", "#38BDF8"); groups[4].append(c); fibres.push(c); }
  const list = h("ol.layers", {}, ...LAYERS.map((l, i) => h("li", { style: `--lc:${l.fill}` }, h("b", {}, `${i + 1}. ${l.name}`), h("span", {}, l.what))));
  const apart = h("button.btn.primary", { type: "button" }, "Pull the layers apart");
  const strand = h("div.strand", { "aria-hidden": "true" }, ...Array.from({ length: 6 }, (_, i) => h("i", { style: `animation-delay:${-i * 0.35}s` })));
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:12px; justify-items:center" }, svg, apart),
      h("div", { style: "display:grid; gap:12px; align-content:start" }, list,
        h("span.eyebrow", {}, "Inside one glass strand"), strand,
        h("div.stats", {},
          h("div.stat", {}, h("span.v.tnum", { style: "color:var(--ram)" }, "1.5M km"), h("span.k", {}, "of cable in service, about 37 times around the Earth")),
          h("div.stat", {}, h("span.v.tnum", { style: "color:var(--storage)" }, "600+"), h("span.k", {}, "cable systems, active and planned")),
          h("div.stat", {}, h("span.v.tnum", { style: "color:var(--bad)" }, "< 1%"), h("span.k", {}, "of US international capacity runs over satellites")))),
    ),
    h("p.note", {}, "Cable figures: ", h("a", { href: "https://www2.telegeography.com/submarine-cable-faqs-frequently-asked-questions", target: "_blank", rel: "noopener" }, "TeleGeography submarine cable FAQ"), " (early 2026). Satellites carry about 0.37% of US international capacity, per the FCC figure it cites. Layers are simplified; real cables vary, and deep-sea cables carry less armour than ones near the shore."),
    takeaway("Not by satellite. By cable: hair-thin glass on the sea floor, carrying almost all the traffic between continents."),
  );
  let open = false;
  apart.addEventListener("click", async () => {
    open = !open; apart.textContent = open ? "Put it back together" : "Pull the layers apart";
    const { animate } = await lib.anime();
    const d = reducedMotion() ? 0 : 600;
    groups.forEach((g, i) => animate(g, { translateX: open ? i * 30 - 60 : 0, delay: d ? i * 70 : 0, duration: d, ease: "outBack" }));
    sfx("whoosh", 0.25);
  });
  if (!reducedMotion()) {
    const { animate, stagger } = await lib.anime();
    animate(fibres, { opacity: [0.35, 1], r: [4, 6], delay: stagger(120), duration: 700, loop: true, alternate: true, ease: "inOutSine" });
  }
}
