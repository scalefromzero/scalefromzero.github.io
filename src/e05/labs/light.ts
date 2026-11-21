import { lib } from "../../kit/libs";
import { h, sfx, takeaway, fmt, reducedMotion } from "../../kit/ui";

const C_GLASS = 200_000; // km/s, light in glass fibre (about two-thirds of its speed in a vacuum)
const CITIES: Record<string, [number, number]> = {
  "New York": [40.71, -74.01], London: [51.51, -0.13], Tokyo: [35.68, 139.69], Sydney: [-33.87, 151.21],
  "São Paulo": [-23.55, -46.63], Mumbai: [19.08, 72.88], Singapore: [1.35, 103.82], "San Francisco": [37.77, -122.42],
};
const PAIRS = [["New York", "London"], ["London", "Mumbai"], ["San Francisco", "Tokyo"], ["London", "Sydney"], ["São Paulo", "Singapore"]] as const;

function km([la1, lo1]: [number, number], [la2, lo2]: [number, number]) {
  const r = Math.PI / 180, R = 6371;
  const a = Math.sin(((la2 - la1) * r) / 2) ** 2 + Math.cos(la1 * r) * Math.cos(la2 * r) * Math.sin(((lo2 - lo1) * r) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Two limits nobody can engineer away: best effort, and the speed of light. */
export async function lightLab(bench: HTMLElement) {
  const sel = h("select#lt-pair", { "aria-label": "Two cities" }, ...PAIRS.map(([a, b], i) => h("option", { value: i }, `${a} ↔ ${b}`))) as HTMLSelectElement;
  const big = "font-size:var(--step-1); white-space:nowrap"; const dist = h("span.v.tnum", { style: `color:var(--net); ${big}` }), one = h("span.v.tnum", { style: `color:var(--storage); ${big}` }), rtt = h("span.v.tnum", { style: `color:var(--cpu); ${big}` });
  const real = h("p.dim", { style: "margin:0; min-height:3em" });
  const track = h("div.lt-track", {}, h("span.lt-a", {}), h("span.lt-b", {}), h("i.lt-dot", {}));
  const fire = h("button.btn.primary", { type: "button", style: "justify-self:start" }, "Send a flash of light");
  // best effort mini-demos
  const lane = h("div.be-lane", { "aria-live": "polite" });
  const be = h("div.row", {}, ...(["Dropped", "Delayed", "Out of order"] as const).map((k) => { const b = h("button.btn", { type: "button" }, k); b.addEventListener("click", () => demo(k)); return b; }));
  const beSay = h("p.dim", { style: "margin:0; min-height:1.6em" }, "The network makes no promises. Try each one.");
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:12px; align-content:start" },
        h("span.eyebrow", {}, "Limit 1 · best effort"), be, lane, beSay),
      h("div", { style: "display:grid; gap:12px; align-content:start" },
        h("span.eyebrow", {}, "Limit 2 · distance"), sel, track, fire,
        h("div.stats", {}, h("div.stat", {}, dist, h("span.k", {}, "straight-line distance")), h("div.stat", {}, one, h("span.k", {}, "fastest possible, one way")), h("div.stat", {}, rtt, h("span.k", {}, "fastest possible round trip"))), real),
    ),
    h("p.note", {}, "Light in glass covers about 200,000 km a second. Cables don't run in perfectly straight lines, and every router adds a little, so real times are longer. New York–London measured round trip: about 63 ms (",
      h("a", { href: "https://hatsnet.io/", target: "_blank", rel: "noopener" }, "hatsnet.io"), ")."),
    takeaway("New York to London takes at least 28 milliseconds one way, because that's how fast light moves in glass."),
  );
  const { gsap } = await lib.gsap();
  function show() {
    const [a, b] = PAIRS[+sel.value];
    const d = km(CITIES[a], CITIES[b]), ms = (d / C_GLASS) * 1000;
    (track.querySelector(".lt-a") as HTMLElement).textContent = a; (track.querySelector(".lt-b") as HTMLElement).textContent = b;
    dist.textContent = `${fmt(Math.round(d / 10) * 10)} km`;
    one.textContent = `${fmt(ms)} ms`; rtt.textContent = `${fmt(ms * 2)} ms`;
    real.innerHTML = +sel.value === 0 ? `${fmt(d)} ÷ 200,000 km/s ≈ <b>${fmt(ms)} ms</b> one way. Add the routers along the path, and a real round trip is usually <b>a little over 60 ms</b>.` : `${fmt(Math.round(d))} ÷ 200,000 km/s. That's the floor: no engineering gets a round trip under ${fmt(ms * 2)} ms.`;
  }
  sel.addEventListener("change", () => { show(); sfx("tick", 0.2); });
  fire.addEventListener("click", () => {
    const [a, b] = PAIRS[+sel.value];
    const ms = (km(CITIES[a], CITIES[b]) / C_GLASS) * 1000;
    const dot = track.querySelector(".lt-dot") as HTMLElement, W = track.clientWidth - 16;
    sfx("whoosh", 0.2);
    // slow motion: 1 ms of real light = 40 ms on screen
    gsap.timeline().fromTo(dot, { x: 0, opacity: 1 }, { x: W, duration: reducedMotion() ? 0 : (ms * 40) / 1000, ease: "none" }).to(dot, { x: 0, duration: reducedMotion() ? 0 : (ms * 40) / 1000, ease: "none" }).to(dot, { opacity: 0.4, duration: 0.2 });
  });
  let busy = false;
  async function demo(k: "Dropped" | "Delayed" | "Out of order") {
    if (busy) return; busy = true;
    lane.innerHTML = "";
    const W = lane.clientWidth - 40;
    const chips = [1, 2, 3, 4].map((n) => { const c = h("span.chip2", { style: "top:10px; background:var(--net)" }, `#${n}`); lane.append(c); return c; });
    const got: number[] = [];
    await Promise.all(chips.map((c, i) => {
      const n = i + 1;
      const delay = reducedMotion() ? 0 : i * 0.25 + (k === "Out of order" && n === 2 ? 0.7 : 0);
      if (k === "Dropped" && n === 3) return gsap.fromTo(c, { x: 0 }, { x: W * 0.55, duration: 0.6, delay, onComplete: () => { c.style.background = "var(--bad)"; gsap.to(c, { y: 30, opacity: 0, duration: 0.4 }); sfx("miss", 0.2); } });
      return gsap.fromTo(c, { x: 0 }, { x: W, duration: reducedMotion() ? 0 : k === "Delayed" ? 2.6 : 1, delay, ease: "none", onComplete: () => { got.push(n); } });
    }));
    beSay.textContent = `Arrived: ${got.map((g) => `#${g}`).join(" ")}${k === "Dropped" ? " · #3 never came" : k === "Delayed" ? " · all of them, but slowly (a busy router held them in a queue)" : " · #2 overtaken"}. IP just does its best.`;
    busy = false;
  }
  show();
}
