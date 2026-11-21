import { lib } from "../kit/libs";
import { h, sfx, reducedMotion } from "../kit/ui";

const NS = "http://www.w3.org/2000/svg";
const svg = (tag: string, attrs: Record<string, string | number>) => {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
};

export const NINES = [
  { label: "99%", a: 0.99 },
  { label: "99.9%", a: 0.999 },
  { label: "99.99%", a: 0.9999 },
  { label: "99.999%", a: 0.99999 },
];

/** Downtime as words: "3.7 days", "8.8 hours", "53 minutes", "5.3 minutes". */
export function downtime(hours: number): string {
  if (hours >= 48) return `${(hours / 24).toFixed(1)} days`;
  if (hours >= 1.5) return `${hours.toFixed(1)} hours`;
  const m = hours * 60;
  if (m < 1) { const sec = m * 60; return sec < 1 ? "under a second" : `${Math.round(sec)} seconds`; }
  return m >= 10 ? `${Math.round(m)} minutes` : `${m.toFixed(1)} minutes`;
}

/** The year as a ring of 365 days. Bad days turn red; the last, partly bad day opens into 24 hours. */
export function yearRing() {
  const size = 420, c = size / 2;
  const root = svg("svg", { viewBox: `0 0 ${size} ${size}`, role: "img", "aria-label": "A year as a ring of 365 days, with the downtime shown in red" }) as SVGSVGElement;
  root.style.width = "100%"; root.style.maxWidth = "440px"; root.style.display = "block"; root.style.margin = "0 auto";
  const days: SVGElement[] = [];
  for (let d = 0; d < 365; d++) {
    const ang = (d / 365) * 360;
    const r = svg("rect", { x: c - 1.1, y: 14, width: 2.2, height: 26, rx: 1, fill: "var(--line)", transform: `rotate(${ang} ${c} ${c})` });
    root.append(r); days.push(r);
  }
  const hours: SVGElement[] = [];
  for (let k = 0; k < 24; k++) {
    const a0 = (k / 24) * Math.PI * 2 - Math.PI / 2, a1 = ((k + 1) / 24) * Math.PI * 2 - Math.PI / 2 - 0.035;
    const R = 128, r = 92;
    const p = (A: number, rad: number) => `${c + rad * Math.cos(A)} ${c + rad * Math.sin(A)}`;
    const path = svg("path", { d: `M ${p(a0, R)} A ${R} ${R} 0 0 1 ${p(a1, R)} L ${p(a1, r)} A ${r} ${r} 0 0 0 ${p(a0, r)} Z`, fill: "var(--panel2)", stroke: "var(--line)", "stroke-width": 1 });
    root.append(path); hours.push(path);
  }
  const big = svg("text", { x: c, y: c - 4, "text-anchor": "middle", fill: "var(--bad)", "font-family": "var(--head)", "font-weight": 700, "font-size": 34 });
  const small = svg("text", { x: c, y: c + 22, "text-anchor": "middle", fill: "var(--dim)", "font-family": "var(--mono)", "font-size": 12 });
  const tiny = svg("text", { x: c, y: c + 40, "text-anchor": "middle", fill: "var(--faint)", "font-family": "var(--mono)", "font-size": 11 });
  root.append(big, small, tiny);
  const hoursLabel = svg("text", { x: c, y: 60, "text-anchor": "middle", fill: "var(--faint)", "font-family": "var(--mono)", "font-size": 10.5 });
  root.append(hoursLabel);

  async function show(a: number) {
    const downH = (1 - a) * 8760;
    const fullDays = Math.floor(downH / 24);
    const restH = downH - fullDays * 24;
    big.textContent = downtime(downH);
    small.textContent = "down every year";
    tiny.textContent = `${(a * 100).toFixed(a >= 0.9999 ? 3 : a >= 0.999 ? 1 : 0)}% up`;
    hoursLabel.textContent = fullDays ? `${fullDays} whole days red · the next day, hour by hour ↓` : "one day, opened into 24 hours ↓";
    const { gsap } = await lib.gsap();
    const d = reducedMotion() ? 0 : 0.5;
    days.forEach((el, i) => gsap.to(el, { attr: { fill: i < fullDays ? "#F87171" : i === fullDays ? "#FBBF24" : "#26315A" }, duration: d, delay: d ? Math.min(i, 40) * 0.006 : 0 }));
    hours.forEach((el, k) => {
      const part = Math.max(0, Math.min(1, restH - k));
      gsap.to(el, { attr: { fill: part >= 1 ? "#F87171" : part > 0 ? "#FCA5A5" : "#18214A" }, opacity: part > 0 && part < 1 ? 0.35 + 0.65 * part : 1, duration: d, delay: d ? k * 0.03 : 0 });
    });
    sfx(downH > 24 ? "miss" : "tick", 0.25);
  }
  return { el: root, show };
}

/** Hero widget: pick a number of nines and watch the year. */
export function heroRing() {
  const ring = yearRing();
  const seg = h("div.seg", { role: "group", "aria-label": "Availability target" });
  const say = h("p.dim", { "aria-live": "polite", style: "margin:0; min-height:3em" });
  const SAY: Record<string, string> = {
    "99%": "Two nines: more than three and a half days of downtime a year.",
    "99.9%": "Three nines sounds perfect. It still allows almost nine hours down every year. If one bad hour lands in a ten-minute sale, the sale is over.",
    "99.99%": "Four nines: under an hour a year. Each extra nine cuts downtime by ten.",
    "99.999%": "Five nines: about five minutes a year, and a lot more engineering.",
  };
  NINES.forEach((n) => {
    const b = h("button", { type: "button", "aria-pressed": String(n.label === "99.9%") }, n.label);
    b.addEventListener("click", () => {
      [...seg.children].forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      ring.show(n.a); say.textContent = SAY[n.label];
    });
    seg.append(b);
  });
  say.textContent = SAY["99.9%"];
  const el = h("div", { style: "display:grid; gap:14px; justify-items:center" }, ring.el, seg, say);
  return { el, start: () => ring.show(0.999) };
}
