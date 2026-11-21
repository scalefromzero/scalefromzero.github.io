import { h, sfx, takeaway, reducedMotion } from "../../kit/ui";

const LAYERS = [
  { key: "browser", name: "Your browser's cache", where: "on your phone", ms: 1, c: "--cache" },
  { key: "cdn", name: "Content delivery network", where: "a server in your city · Episode 11", ms: 20, c: "--net" },
  { key: "redis", name: "Server-side cache (Redis)", where: "next to the server", ms: 60, c: "--ram" },
  { key: "db", name: "Database", where: "the slow, careful source", ms: 150, c: "--storage" },
] as const;
type L = (typeof LAYERS)[number]["key"];

const ITEMS = [
  { name: "Concert poster", first: "cdn" as L, kind: "image" },
  { name: "Page styles and code", first: "cdn" as L, kind: "file" },
  { name: "Concert description", first: "redis" as L, kind: "data" },
  { name: "Seats left", first: "db" as L, kind: "data" },
];

/** Caches sit at every step between you and the data. Load the page twice. */
export function layersLab(bench: HTMLElement) {
  const loads: number[] = [];
  const rows = h("div", { style: "display:grid; gap:8px" });
  const head = h("p.dim", { "aria-live": "polite" }, "Nothing loaded yet. Open the page.");
  const first = h("button.btn.primary", { type: "button" }, "Open the concert page");
  const back = h("button.btn", { type: "button", disabled: true }, "Go back, then open it again");
  const ladder = h("div", { style: "display:grid; gap:6px" }, ...LAYERS.map((l) => h("div.layer-btn", { style: `--lc: var(${l.c}); cursor:default` }, h("i"), h("span", { style: "color:var(--text); font:600 0.9rem var(--body)" }, l.name), h("span", {}, l.where))));
  let visit = 0;
  function load() {
    visit++;
    rows.innerHTML = "";
    const served = ITEMS.map((it) => {
      if (visit === 1) return it.first;
      if (it.kind === "image" || it.kind === "file") return "browser" as L;
      return it.name === "Seats left" ? ("redis" as L) : ("redis" as L);
    });
    let total = 0;
    const bars: HTMLElement[] = [];
    ITEMS.forEach((it, i) => {
      const L = LAYERS.find((l) => l.key === served[i])!;
      total = Math.max(total, L.ms);
      const bar = h("i", { style: `width:0%; background:var(${L.c})` });
      bars.push(bar);
      rows.append(h("div.meter", { style: "grid-template-columns: 11em minmax(0,1fr) 13em" }, h("span", {}, it.name), h("div.track", {}, bar), h("b", { style: `color:var(${L.c})` }, `${L.name.split(" (")[0]} · ~${L.ms} ms`)));
    });
    loads.push(total);
    bars.forEach((b, i) => setTimeout(() => (b.style.width = `${(LAYERS.find((l) => l.key === served[i])!.ms / 150) * 100}%`), reducedMotion() ? 0 : 60 + i * 90));
    head.innerHTML = visit === 1
      ? `First visit: the page is ready in about <b>${total} ms</b>, waiting on the slowest item.`
      : `Back again: images and code come from your own phone; the description and seats come from Redis. Ready in about <b>${total} ms</b>.`;
    sfx(visit === 1 ? "whoosh" : "hit", 0.25);
    back.removeAttribute("disabled");
  }
  first.addEventListener("click", () => { visit = 0; load(); });
  back.addEventListener("click", load);
  bench.append(
    h("div.bench-grid", {}, h("div", { style: "display:grid; gap:12px" }, h("div.row", {}, first, back), head, rows), h("div", { style: "display:grid; gap:8px; align-content:start" }, h("span.eyebrow", {}, "Closest to slowest"), ladder)),
    h("p.note", {}, "Times are illustrative round numbers for a phone on a decent connection."),
    takeaway("Keep a copy closer to whoever needs it. Closer means faster, and every hit is one less trip to the slow place."),
  );
}
