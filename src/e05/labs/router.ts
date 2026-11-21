import { lib } from "../../kit/libs";
import { h, sfx, takeaway, reducedMotion } from "../../kit/ui";

const TABLE = [
  { match: "198.51.100.*", way: "East", hint: "towards London" },
  { match: "203.0.113.*", way: "West", hint: "towards New York" },
  { match: "192.0.2.*", way: "South", hint: "towards Lisbon" },
  { match: "everything else", way: "Upstream", hint: "a bigger network" },
];
const WAYS = ["West", "East", "South", "Upstream"];
const QUEUE = ["198.51.100.7", "203.0.113.42", "198.51.100.200", "192.0.2.14", "100.64.8.1", "203.0.113.9", "198.51.100.7", "192.0.2.77", "172.16.4.20", "198.51.100.33"];

/** You are a router. Read only the destination, check the table, send it one hop closer, forget it. */
export async function routerLab(bench: HTMLElement) {
  let i = 0, right = 0;
  const pkt = h("div.postcard", { style: "max-width:320px" });
  const table = h("table.rt", {}, h("thead", {}, h("tr", {}, h("th", {}, "Destination"), h("th", {}, "Send it"))),
    h("tbody", {}, ...TABLE.map((r) => h("tr", {}, h("td.mono", {}, r.match), h("td", {}, h("b", {}, r.way), h("span.faint", {}, ` · ${r.hint}`))))));
  const ways = h("div", { style: "display:grid; grid-template-columns:1fr 1fr; gap:8px" });
  const score = h("span.v.tnum", {}, "0 / 0");
  const say = h("p.dim", { "aria-live": "polite", style: "min-height:3em" }, "A packet arrives. Read only the TO line.");
  const memory = h("p.mono.faint", { style: "font-size:0.78rem; margin:0" }, "Packets remembered after forwarding: 0. Always.");
  const way = (ip: string) => ip.startsWith("198.51.100.") ? "East" : ip.startsWith("203.0.113.") ? "West" : ip.startsWith("192.0.2.") ? "South" : "Upstream";
  function next() {
    if (i >= QUEUE.length) {
      pkt.innerHTML = `<span class="eyebrow">Shift over</span><b style="font-size:var(--step-1)">${right} of ${QUEUE.length} sent the right way</b><span class="dim">No router knows the whole route. Each one only knows which way is closer.</span>`;
      ways.querySelectorAll("button").forEach((b) => ((b as HTMLButtonElement).disabled = true));
      const again = h("button.btn.primary", { type: "button" }, "Start a new shift");
      again.addEventListener("click", () => { i = 0; right = 0; score.textContent = "0 / 0"; ways.querySelectorAll("button").forEach((b) => ((b as HTMLButtonElement).disabled = false)); next(); });
      pkt.append(again); return;
    }
    pkt.innerHTML = `<span class="eyebrow">Packet ${i + 1} of ${QUEUE.length}</span><div class="pc-row"><span>FROM</span><b class="mono faint">${["203.0.113.42", "198.51.100.9", "192.0.2.5"][i % 3]}</b></div><div class="pc-row"><span>TO</span><b class="mono" style="color:var(--net); font-size:var(--step-1)">${QUEUE[i]}</b></div><div class="pc-row"><span>DATA</span><b class="mono faint">▒▒▒▒▒▒▒▒</b></div>`;
    if (!reducedMotion()) lib.motion().then(({ animate }) => animate(pkt, { x: [-30, 0], opacity: [0, 1] }, { duration: 0.3 }));
  }
  WAYS.forEach((w) => {
    const b = h("button.btn", { type: "button", style: "justify-content:center" }, `→ ${w}`);
    b.addEventListener("click", async () => {
      if (i >= QUEUE.length) return;
      const ok = way(QUEUE[i]) === w; if (ok) right++;
      i++;
      score.textContent = `${right} / ${i}`;
      say.innerHTML = ok ? `<span style="color:var(--good)">One hop closer.</span> And now the router forgets it completely.` : `<span style="color:var(--bad)">Wrong way.</span> ${QUEUE[i - 1]} matches <b>${TABLE.find((t) => t.way === way(QUEUE[i - 1]))!.match}</b>, so it goes ${way(QUEUE[i - 1])}.`;
      sfx(ok ? "hit" : "miss", 0.2);
      if (!reducedMotion()) { const { animate } = await lib.motion(); await animate(pkt, { x: w === "West" ? -60 : 60, opacity: 0 }, { duration: 0.22 }); }
      next();
    });
    ways.append(b);
  });
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:12px; align-content:start" }, h("span.eyebrow", {}, "Your table of signposts"), table, memory),
      h("div", { style: "display:grid; gap:12px; align-content:start" }, pkt, ways, h("div.stat", {}, score, h("span.k", {}, "sent the right way")), say),
    ),
    h("p.note", {}, "Real routing tables hold hundreds of thousands of entries, matched by the most specific one. Every address here comes from a reserved range that belongs to nobody's device."),
    takeaway("Each router reads only the destination, sends the packet one hop closer, and forgets it."),
  );
  next();
}
