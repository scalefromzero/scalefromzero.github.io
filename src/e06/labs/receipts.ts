import { lib } from "../../kit/libs";
import { h, sfx, takeaway, sleep, reducedMotion } from "../../kit/ui";
import { paintPhoto, tiles } from "../../e05/photo";

const COLS = 6, ROWS = 4, N = COLS * ROWS;

/** IP drops packets and tells nobody. Number every page and ask for a receipt, and the holes get filled. */
export async function receiptsLab(bench: HTMLElement) {
  const url = paintPhoto();
  const loss = h("input#rc-loss", { type: "range", min: 0, max: 30, step: 1, value: 15 }) as HTMLInputElement;
  const lossOut = h("output", {});
  const fix = h("input#rc-fix", { type: "checkbox" }) as HTMLInputElement;
  const send = h("button.btn.primary", { type: "button", style: "justify-self:start" }, "Send the photo");
  const recv = h("div.pgrid.recv", { style: `grid-template-columns:repeat(${COLS},minmax(0,1fr))`, role: "img", "aria-label": "Sam's phone receiving the photo" });
  const slots = Array.from({ length: N }, () => { const s = h("div.slot2"); recv.append(s); return s; });
  const pieces = tiles(url, COLS, ROWS);
  const st = (k: string, c: string) => { const v = h("span.v.tnum", { style: `color:var(${c})` }, "–"); return { el: h("div.stat", {}, v, h("span.k", {}, k)), v }; };
  const sLost = st("packets lost on the way", "--bad"), sAgain = st("sent again", "--storage"), sHoles = st("holes in Sam's photo", "--text");
  const say = h("p.dim", { "aria-live": "polite", style: "min-height:3em" }, "Plain IP: routers drop packets when they're overloaded, and nobody is told.");
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:12px; align-content:start" },
        h("label.field", { for: "rc-loss" }, h("span", {}, "Packets lost on a bad day: ", lossOut), loss),
        h("label.row", { for: "rc-fix", style: "gap:8px; color:var(--text)" }, fix, h("span", {}, "Number every packet and ask for a receipt")),
        send, h("div.stats", {}, sLost.el, sAgain.el, sHoles.el), say),
      h("div", { style: "display:grid; gap:8px; align-content:start; min-width:0" }, h("span.eyebrow", {}, "Sam's phone"), recv),
    ),
    h("p.note", {}, "Real loss is usually far below this; the slider exaggerates it so you can see the holes. 24 pieces stand in for the photo's 2,000 packets."),
    takeaway("Number every page and ask for a receipt. Anything that doesn't come back in time is sent again."),
  );
  const { gsap } = await lib.gsap();
  lossOut.textContent = `${loss.value}%`;
  loss.addEventListener("input", () => (lossOut.textContent = `${loss.value}%`));
  let busy = false, seed = 9;
  const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const place = (id: number, again = false) => {
    const p = pieces[id].cloneNode(true) as HTMLElement;
    if (fix.checked) p.append(h("span.badge", { style: again ? "background:var(--storage); color:#1a1205" : "" }, `#${id + 1}`));
    slots[id].innerHTML = ""; slots[id].classList.remove("hole"); slots[id].append(p);
    if (!reducedMotion()) gsap.from(p, { scale: 0.4, opacity: 0, duration: 0.25 });
  };
  send.addEventListener("click", async () => {
    if (busy) return; busy = true;
    slots.forEach((s) => { s.innerHTML = ""; s.classList.remove("hole"); });
    // lose exactly the slider's share of the 24 pieces, at random places
    const order = Array.from({ length: N }, (_, i) => i).sort(() => r() - 0.5);
    const lost = order.slice(0, Math.round((N * +loss.value) / 100)).sort((a, b) => a - b);
    for (let i = 0; i < N; i++) {
      await sleep(reducedMotion() ? 0 : 45);
      if (lost.includes(i)) continue;
      place(i); sfx("tick", 0.04);
    }
    sLost.v.textContent = String(lost.length);
    if (!fix.checked) {
      lost.forEach((i) => slots[i].classList.add("hole"));
      sAgain.v.textContent = "0"; sHoles.v.textContent = String(lost.length);
      say.textContent = lost.length ? `${lost.length} pieces never arrived, and nobody noticed. Sam's photo has holes in it.` : "Lucky: nothing was lost this time. Try a worse day.";
      sfx(lost.length ? "miss" : "hit", 0.25);
    } else {
      lost.forEach((i) => slots[i].classList.add("hole"));
      say.textContent = lost.length ? `Sam's phone sends receipts. ${lost.length} never come back in time, so Maya's computer sends those again…` : "Every receipt came back. Nothing to resend.";
      await sleep(reducedMotion() ? 0 : 900);
      let again = 0;
      for (const i of lost) { await sleep(reducedMotion() ? 0 : 160); place(i, true); again++; sfx("pop", 0.1); }
      sAgain.v.textContent = String(again); sHoles.v.textContent = "0";
      if (lost.length) say.innerHTML = `<span style="color:var(--good)">Complete.</span> ${again} pieces were sent again (amber numbers), and the numbers put every piece in its place.`;
      sfx("hit", 0.25);
    }
    busy = false;
  });
}
