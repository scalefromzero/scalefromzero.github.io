import { lib } from "../../kit/libs";
import { h, sfx, takeaway, fmt, reducedMotion } from "../../kit/ui";
import { paintPhoto, tiles } from "../photo";

const MTU = 1500;
const FILES = [
  { name: "A text message", bytes: 200 },
  { name: "Maya's photo", bytes: 3_000_000 },
  { name: "A one-minute video", bytes: 60_000_000 },
];
const COLS = 6, ROWS = 4;

/** Cut the photo into postcards. anime.js staggers the slices apart; tap one to read its label. */
export async function packetsLab(bench: HTMLElement) {
  const url = paintPhoto();
  const grid = h("div.pgrid", { style: `grid-template-columns:repeat(${COLS},minmax(0,1fr))`, role: "img", "aria-label": "Maya's photo, cut into pieces" }, ...tiles(url, COLS, ROWS));
  const seg = h("div.seg", { role: "group", "aria-label": "What to send" });
  let file = 1;
  FILES.forEach((f, i) => {
    const b = h("button", { type: "button", "aria-pressed": String(i === file) }, f.name);
    b.addEventListener("click", () => { file = i; [...seg.children].forEach((x) => x.setAttribute("aria-pressed", String(x === b))); count(); sfx("tick", 0.2); });
    seg.append(b);
  });
  const big = h("span.v.tnum", { style: "color:var(--net)" }, "–"), sum = h("span.k", {}, "");
  const cut = h("button.btn.primary", { type: "button", style: "justify-self:start" }, "Cut it into packets");
  const card = h("div.postcard", { "aria-live": "polite" },
    h("span.eyebrow", {}, "One packet"),
    h("div.pc-row", {}, h("span", {}, "FROM"), h("b.mono", {}, "203.0.113.42"), h("span.faint", {}, "Maya's laptop")),
    h("div.pc-row", {}, h("span", {}, "TO"), h("b.mono", {}, "198.51.100.7"), h("span.faint", {}, "Sam's phone")),
    h("div.pc-row", {}, h("span", {}, "DATA"), h("b.mono", {}, `up to ${fmt(MTU)} bytes`), h("span.faint", {}, "one small slice")),
  );
  card.hidden = true;
  function count() {
    const f = FILES[file], n = Math.ceil(f.bytes / MTU);
    big.textContent = fmt(n);
    sum.textContent = `packet${n > 1 ? "s" : ""}: ${fmt(f.bytes)} bytes ÷ ${fmt(MTU)}`;
  }
  let split = false;
  cut.addEventListener("click", async () => {
    split = !split;
    cut.textContent = split ? "Put it back together" : "Cut it into packets";
    const { animate, stagger } = await lib.anime();
    const els = [...grid.children] as HTMLElement[];
    grid.classList.toggle("split", split);
    if (!reducedMotion()) animate(els, { scale: split ? [1, 0.86] : [0.86, 1], rotate: () => (split ? (Math.random() - 0.5) * 10 : 0), delay: stagger(25, { from: "center" }), duration: 450, ease: "outBack" });
    card.hidden = !split;
    sfx(split ? "whoosh" : "pop", 0.25);
  });
  grid.addEventListener("click", (e) => {
    const t = (e.target as HTMLElement).closest(".ptile") as HTMLElement | null;
    if (!t || !split) return;
    [...grid.children].forEach((x) => x.classList.toggle("picked", x === t));
    sfx("pop", 0.2);
  });
  count();
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:12px; align-content:start" }, seg, h("div.stat", {}, big, sum), cut, card),
      h("div", { style: "min-width:0" }, grid),
    ),
    h("p.note", {}, "1,500 bytes is the standard size limit for one packet on Ethernet and Wi-Fi networks. Addresses shown are reserved for examples."),
    takeaway("Stop sending messages whole. Every small packet carries where it came from and where it's going."),
  );
}
