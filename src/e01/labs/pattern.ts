import { lib } from "../../kit/libs";
import { h, sfx, takeaway, reducedMotion } from "../../kit/ui";

/** The same lookup pattern on one computer and on a distributed system, side by side. */
export function patternLab(bench: HTMLElement) {
  const mk = (title: string, boxes: [string, string, string][]) => {
    const els = boxes.map(([n, d, c]) => h("div.box", { style: `--bc: var(${c})` }, h("b", {}, n), h("span", {}, d), h("span.has", {}, "✓ has customer #42")));
    const token = h("div.token");
    const track = h("div.lane-track", {}, ...els, token);
    return { el: h("div.lane", {}, h("h3", {}, title), track), els, token, track, holds: [false, false, false, true] };
  };
  const one = mk("Inside one computer", [["CPU", "does the work", "--cpu"], ["CPU cache", "tiny, fastest", "--cache"], ["RAM", "fast, temporary", "--ram"], ["SSD", "durable source", "--storage"]]);
  const many = mk("Across many computers", [["Server", "handles the request", "--cpu"], ["Server memory", "in-process cache", "--cache"], ["Redis", "shared fast cache", "--ram"], ["Database", "durable source", "--storage"]]);
  const lanes = [one, many];
  const ask = h("button.btn.primary", { type: "button" }, "Ask for customer #42");
  const reset = h("button.btn", { type: "button" }, "Restart everything");
  const change = h("button.btn", { type: "button" }, "Change #42's address in the source");
  const log = h("p.dim", { "aria-live": "polite", style: "min-height:3.2em" }, "Only the durable source has customer #42 so far. Ask for it.");
  bench.append(h("div.lanes", {}, one.el, many.el), h("div.row", { style: "margin-top:14px" }, ask, change, reset), log,
    takeaway("Fast small layer, slower bigger layer, durable source. Same idea, one level higher. The catch: copies can go stale."));

  const paint = () => lanes.forEach((L) => L.els.forEach((e, i) => { e.classList.toggle("holds", L.holds[i]); }));
  paint();

  async function travel(L: (typeof lanes)[number]) {
    const { gsap } = await lib.gsap();
    const pos = (i: number) => {
      const tr = L.track.getBoundingClientRect(), b = L.els[i].getBoundingClientRect();
      return { x: b.left - tr.left + b.width / 2 - 11, y: b.top - tr.top + b.height - 30 };
    };
    const found = L.holds.findIndex((v, i) => i > 0 && v);
    const d = reducedMotion() ? 0 : 0.35;
    const p0 = pos(0);
    gsap.set(L.token, { x: p0.x, y: p0.y, opacity: 1 });
    for (let i = 1; i <= found; i++) { const p = pos(i); await gsap.to(L.token, { x: p.x, y: p.y, duration: d, ease: "power1.inOut" }); if (i < found) sfx("miss", 0.12); }
    sfx(found === 1 ? "hit" : "pop", 0.25);
    for (let i = found - 1; i >= 0; i--) { const p = pos(i); await gsap.to(L.token, { x: p.x, y: p.y, duration: d, ease: "power1.inOut" }); L.holds[i] = true; paint(); }
    gsap.to(L.token, { opacity: 0, duration: 0.3 });
    return found;
  }
  let stale = false, busy = false;
  ask.addEventListener("click", async () => {
    if (busy) return; busy = true;
    const [a] = await Promise.all(lanes.map(travel));
    const names = ["", "the fast cache", "the middle layer", "the durable source"];
    log.innerHTML = a === 1
      ? (stale ? `<b style="color:var(--bad)">Hit, but the copy is stale.</b> The source changed and the caches still hold the old address. That's Episode 2.` : `<b style="color:var(--good)">Hit in ${names[a]}.</b> No trip down the layers this time.`)
      : `<b style="color:var(--storage)">Miss.</b> Went all the way to ${names[a]}, then saved a copy in every layer on the way back.`;
    busy = false;
  });
  reset.addEventListener("click", () => { lanes.forEach((L) => (L.holds = [false, false, false, true])); stale = false; lanes.forEach((L) => L.els.forEach((e) => e.style.removeProperty("--bc-override"))); paint(); log.textContent = "Caches cleared. Only the durable source has #42."; sfx("powerdown", 0.25); });
  change.addEventListener("click", () => {
    stale = lanes.some((L) => L.holds[1] || L.holds[2]);
    log.innerHTML = stale ? `The source now has the new address, but the <b>cached copies don't know</b>. Ask again and see what you get.` : "Changed in the source. No copies exist yet, so nothing is stale.";
    sfx("tick", 0.3);
  });
}
