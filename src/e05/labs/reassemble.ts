import { lib } from "../../kit/libs";
import { h, sfx, takeaway, reducedMotion } from "../../kit/ui";
import { paintPhoto, tiles } from "../photo";

const COLS = 6, ROWS = 4, N = COLS * ROWS;
const DETOUR = new Set([5, 12, 19]);

/** Send the photo again: packets take two routes, arrive out of order, and get put back together. */
export async function reassembleLab(bench: HTMLElement) {
  const url = paintPhoto();
  const recv = h("div.pgrid.recv", { style: `grid-template-columns:repeat(${COLS},minmax(0,1fr))`, role: "img", "aria-label": "Sam's phone putting the photo back together" });
  const slots = Array.from({ length: N }, () => { const s = h("div.slot2"); recv.append(s); return s; });
  const pieces = tiles(url, COLS, ROWS);
  const flight = h("div.flight", { "aria-hidden": "true" }, h("span.lane-l", {}, "main route"), h("span.lane-l", { style: "top:auto; bottom:6px" }, "detour"));
  const numbered = h("input#ra-num", { type: "checkbox", checked: true }) as HTMLInputElement;
  const send = h("button.btn.primary", { type: "button", style: "justify-self:start" }, "Send the photo");
  const order = h("p.mono", { style: "font-size:0.8rem; margin:0; min-height:2.6em; overflow-wrap:anywhere" });
  const say = h("p.dim", { "aria-live": "polite", style: "min-height:3em" }, "Three megabytes becomes about two thousand packets. Here are 24 of them.");
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:12px; align-content:start" },
        h("label.row", { for: "ra-num", style: "gap:8px; color:var(--text)" }, numbered, h("span", {}, "Number the packets ", h("span.dim", {}, "(TCP's job, next episode)"))),
        send, flight, h("span.eyebrow", {}, "Arrival order"), order, say),
      h("div", { style: "display:grid; gap:8px; align-content:start; min-width:0" }, h("span.eyebrow", {}, "Sam's phone"), recv),
    ),
    h("p.note", {}, "IP itself doesn't number packets. The software on both ends (TCP) adds the numbers so the pieces can be put back in order."),
    takeaway("Packets might not take the same path, and might not arrive in order. Numbers on the cards put them back together."),
  );
  const { gsap } = await lib.gsap();
  let busy = false;
  send.addEventListener("click", async () => {
    if (busy) return; busy = true;
    slots.forEach((s) => (s.innerHTML = ""));
    order.textContent = "";
    flight.querySelectorAll(".chip2").forEach((c) => c.remove());
    say.textContent = "Routers pass them along hop by hop, through New York, under the ocean, into London…";
    sfx("whoosh", 0.25);
    const W = flight.clientWidth;
    let landed = 0;
    const arrivals: number[] = [];
    await Promise.all(Array.from({ length: N }, (_, i) => new Promise<void>((done) => {
      const id = i + 1, det = DETOUR.has(id);
      const chip = h("span.chip2", { style: `top:${det ? 34 : 6}px; background:${det ? "var(--storage)" : "var(--net)"}` }, `#${id}`);
      flight.append(chip);
      const dur = reducedMotion() ? 0.01 : (det ? 1.8 : 1.1) + ((id * 7) % 5) * 0.05;
      gsap.fromTo(chip, { x: -40 }, { x: W + 10, duration: dur, delay: reducedMotion() ? 0 : i * 0.08, ease: "none", onComplete: () => {
        chip.remove();
        arrivals.push(id);
        const slot = numbered.checked ? id - 1 : landed;
        landed++;
        const p = pieces[id - 1].cloneNode(true) as HTMLElement;
        if (numbered.checked) p.append(h("span.badge", {}, `#${id}`));
        slots[slot].append(p);
        if (!reducedMotion()) gsap.from(p, { scale: 0.4, opacity: 0, duration: 0.25 });
        order.textContent = arrivals.map((a) => `#${a}`).join(" ");
        sfx("tick", 0.05);
        done();
      } });
    })));
    const inOrder = arrivals.every((a, k) => k === 0 || a > arrivals[k - 1]);
    say.innerHTML = numbered.checked
      ? `<span style="color:var(--good)">The photo appears.</span> ${inOrder ? "" : "They arrived out of order, but the numbers put every piece back in place."}`
      : '<span style="color:var(--bad)">Pieces in arrival order.</span> Without numbers, nobody knows where the late ones belong.';
    sfx(numbered.checked ? "hit" : "miss", 0.3);
    busy = false;
  });
}
