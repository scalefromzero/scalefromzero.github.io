import type { GeoPermissibleObjects } from "d3";
import { lib } from "../kit/libs";
import { css, reducedMotion } from "../kit/ui";

export type City = { id: string; name: string; ll: [number, number] };
export const ORIGIN: City = { id: "va", name: "Virginia (origin)", ll: [39.04, -77.49] };
export const EDGES: City[] = [
  { id: "syd", name: "Sydney", ll: [-33.87, 151.21] }, { id: "tyo", name: "Tokyo", ll: [35.68, 139.69] }, { id: "sin", name: "Singapore", ll: [1.35, 103.82] },
  { id: "bom", name: "Mumbai", ll: [19.08, 72.88] }, { id: "lon", name: "London", ll: [51.51, -0.13] }, { id: "fra", name: "Frankfurt", ll: [50.11, 8.68] },
  { id: "jnb", name: "Johannesburg", ll: [-26.2, 28.05] }, { id: "gru", name: "São Paulo", ll: [-23.55, -46.63] }, { id: "lax", name: "Los Angeles", ll: [34.05, -118.24] },
  { id: "yyz", name: "Toronto", ll: [43.65, -79.38] }, { id: "iad", name: "Virginia", ll: [38.9, -77.2] },
];

export function km([a1, o1]: [number, number], [a2, o2]: [number, number]) {
  const r = Math.PI / 180, R = 6371;
  const x = Math.sin(((a2 - a1) * r) / 2) ** 2 + Math.cos(a1 * r) * Math.cos(a2 * r) * Math.sin(((o2 - o1) * r) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
export const rttMs = (d: number) => (2 * d) / 200; // light in glass, 200,000 km/s, there and back
export const nearest = (ll: [number, number], up: (c: City) => boolean = () => true) => EDGES.filter(up).reduce<City | null>((b, c) => (!b || km(ll, c.ll) < km(ll, b.ll) ? c : b), null);

/** A flat world map (Natural Earth via world-atlas) with the origin and CDN cities. */
export async function worldMap(box: HTMLElement, onCity?: (c: City) => void) {
  const [d3, topo, land] = await Promise.all([lib.d3(), import("topojson-client"), import("world-atlas/land-110m.json")]);
  const W = 960, H = 470;
  const proj = d3.geoEquirectangular().scale(153).translate([W / 2, H / 2 + 20]);
  const path = d3.geoPath(proj);
  const topology = (land as unknown as { default?: unknown }).default ?? land;
  const geo = topo.feature(topology as never, (topology as { objects: { land: never } }).objects.land) as unknown as GeoPermissibleObjects;
  const svg = d3.select(box).append("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("role", "img").attr("aria-label", "World map with the origin in Virginia and CDN cities");
  svg.append("path").datum(geo).attr("d", path as never).attr("fill", "#1a2450").attr("stroke", "#26315A").attr("stroke-width", 0.6);
  const gArcs = svg.append("g"), gCities = svg.append("g"), gDots = svg.append("g");
  const P = (ll: [number, number]) => proj([ll[1], ll[0]])!;
  const cityG = gCities.selectAll("g").data(EDGES).join("g").attr("transform", (c) => `translate(${P(c.ll)})`).style("cursor", onCity ? "pointer" : "default");
  cityG.append("circle").attr("r", 7).attr("fill", css("--good")).attr("stroke", "#0A0F1E").attr("stroke-width", 2);
  const LEFT = new Set(["lon", "lax"]);
  cityG.append("text").attr("x", (c) => (LEFT.has(c.id) ? -10 : 10)).attr("y", (c) => (c.id === "lon" ? -6 : 5)).attr("text-anchor", (c) => (LEFT.has(c.id) ? "end" : "start")).attr("fill", "#EEF2FF").attr("font-size", 15).attr("font-weight", 700).attr("paint-order", "stroke").attr("stroke", "#0A0F1E").attr("stroke-width", 4).text((c) => (c.id === "iad" ? "" : c.name));
  if (onCity) cityG.on("click", (_, c) => onCity(c));
  const o = P(ORIGIN.ll);
  svg.append("rect").attr("x", o[0] - 9).attr("y", o[1] - 9).attr("width", 18).attr("height", 18).attr("rx", 3).attr("fill", css("--storage")).attr("stroke", "#0A0F1E").attr("stroke-width", 2);
  svg.append("text").attr("x", o[0] + 4).attr("y", o[1] + 30).attr("text-anchor", "middle").attr("paint-order", "stroke").attr("stroke", "#0A0F1E").attr("stroke-width", 4).attr("fill", css("--storage")).attr("font-size", 15).attr("font-weight", 700).text("Origin · Virginia");
  return {
    setDown(ids: Set<string>) { cityG.select("circle").attr("fill", (c) => (ids.has(c.id) ? css("--bad") : css("--good"))); },
    async arc(a: [number, number], b: [number, number], colour: string, dur = 0.9) {
      const { gsap } = await lib.gsap();
      const pa = P(a), pb = P(b);
      const mid: [number, number] = [(pa[0] + pb[0]) / 2, Math.min(pa[1], pb[1]) - Math.min(120, Math.hypot(pb[0] - pa[0], pb[1] - pa[1]) * 0.25)];
      const d = `M${pa[0]},${pa[1]} Q${mid[0]},${mid[1]} ${pb[0]},${pb[1]}`;
      const p = gArcs.append("path").attr("d", d).attr("fill", "none").attr("stroke", colour).attr("stroke-width", 2.5).attr("opacity", 0.9);
      const len = (p.node() as SVGPathElement).getTotalLength();
      p.attr("stroke-dasharray", `${len}`).attr("stroke-dashoffset", len);
      const dot = gDots.append("circle").attr("r", 5).attr("fill", "#fff");
      const o2 = { t: 0 };
      await gsap.to(o2, { t: 1, duration: reducedMotion() ? 0 : dur, ease: "power1.inOut", onUpdate: () => { const pt = (p.node() as SVGPathElement).getPointAtLength(len * o2.t); dot.attr("cx", pt.x).attr("cy", pt.y); p.attr("stroke-dashoffset", len * (1 - o2.t)); } });
      dot.remove();
      gsap.to(p.node(), { opacity: 0.25, duration: 1.2 });
      return p;
    },
    clear() { gArcs.selectAll("*").remove(); },
  };
}
