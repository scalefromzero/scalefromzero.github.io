import { lib } from "../../kit/libs";
import { h, sfx, takeaway, sleep, reducedMotion } from "../../kit/ui";

const N = 20;

/** TCP up close: numbers, acknowledgements, resending, holding back, and slowing down when packets are lost. */
export async function reliableLab(bench: HTMLElement) {
  const sendRow = h("div.cells", { "aria-label": "Sender" });
  const recvRow = h("div.cells", { "aria-label": "Receiver" });
  const sCells = Array.from({ length: N }, (_, i) => { const c = h("i", {}, String(i + 1)); sendRow.append(c); return c; });
  const rCells = Array.from({ length: N }, (_, i) => { const c = h("i", {}, String(i + 1)); recvRow.append(c); return c; });
  const pipe = h("div.flight", { style: "height:84px", "aria-hidden": "true" }, h("span.lane-l", {}, "data →"), h("span.lane-l", { style: "top:auto; bottom:6px" }, "← acknowledgements"));
  const play = h("button.btn.primary", { type: "button" }, "Start sending");
  const lose = h("button.btn", { type: "button" }, "Lose the next packet");
  const cw = h("span.v.tnum", { style: "color:var(--ram)" }, "1");
  const ack = h("span.v.tnum", { style: "color:var(--good)" }, "0");
  const held = h("span.v.tnum", { style: "color:var(--bad)" }, "0");
  const say = h("p.dim", { "aria-live": "polite", style: "min-height:3em" }, "Each round, the sender sends a few packets and waits for acknowledgements.");
  const legend = h("div.row", { style: "gap:6px" }, ...[["sent", "--net"], ["acknowledged", "--good"], ["lost", "--bad"], ["sent again", "--storage"], ["held back", "--cache"]].map(([t, c]) => h("span.chip", { style: `color:var(${c})` }, h("i"), t)));
  bench.append(
    h("div", { style: "display:grid; gap:10px" },
      h("div.row", {}, play, lose),
      h("span.eyebrow", {}, "Maya's computer (sender)"), sendRow, pipe,
      h("span.eyebrow", {}, "Sam's phone (receiver)"), recvRow, legend,
      h("div.stats", {}, h("div.stat", {}, cw, h("span.k", {}, "packets sent per round (speed)")), h("div.stat", {}, ack, h("span.k", {}, "acknowledged: \"I have everything up to…\"")), h("div.stat", {}, held, h("span.k", {}, "held back, waiting for a gap"))),
      say),
    h("p.note", {}, "Simplified: real TCP numbers every byte, not every packet, and grows and shrinks its speed in finer steps. One round here is one round trip."),
    takeaway("Number, acknowledge, resend, hold back until the gap is filled, and slow down when the network looks crowded."),
  );
  const { gsap } = await lib.gsap();
  let running = false, loseNext = 0;
  lose.addEventListener("click", () => { loseNext++; lose.textContent = `Lose the next packet (${loseNext} queued)`; sfx("pop", 0.15); });
  const set = (c: HTMLElement, cls: string) => { c.className = cls; };
  const fly = (id: number, top: number, colour: string, back = false, dieAt = 1) => new Promise<void>((done) => {
    const chip = h("span.chip2", { style: `top:${top}px; background:${colour}` }, back ? `✓${id}` : `#${id}`);
    pipe.append(chip);
    const W = pipe.clientWidth - 46;
    const d = reducedMotion() ? 0.01 : 0.7;
    gsap.fromTo(chip, { x: back ? W : 0 }, { x: back ? 0 : W * dieAt, duration: d * dieAt, ease: "none", onComplete: () => {
      if (dieAt < 1) gsap.to(chip, { opacity: 0, y: 20, duration: 0.3, onComplete: () => { chip.remove(); done(); } });
      else { chip.remove(); done(); }
    } });
  });
  play.addEventListener("click", async () => {
    if (running) return; running = true;
    sCells.forEach((c) => set(c, "")); rCells.forEach((c) => set(c, ""));
    let next = 1, expect = 1, cwnd = 1; const holding = new Set<number>(); const resend: number[] = [];
    cw.textContent = "1"; ack.textContent = "0"; held.textContent = "0";
    while (expect <= N) {
      const batch: { id: number; again: boolean }[] = [];
      while (resend.length && batch.length < cwnd) batch.push({ id: resend.shift()!, again: true });
      while (next <= N && batch.length < cwnd) batch.push({ id: next++, again: false });
      let lostThisRound = false;
      await Promise.all(batch.map(async ({ id, again }, k) => {
        await sleep(reducedMotion() ? 0 : k * 130);
        set(sCells[id - 1], again ? "again" : "sent");
        const lost = loseNext > 0 && !again; if (lost) { loseNext--; lose.textContent = loseNext ? `Lose the next packet (${loseNext} queued)` : "Lose the next packet"; }
        if (lost) { lostThisRound = true; await fly(id, 8, "var(--bad)", false, 0.45); set(sCells[id - 1], "lost"); resend.push(id); sfx("miss", 0.15); return; }
        await fly(id, 8, again ? "var(--storage)" : "var(--net)");
        if (id === expect) {
          set(rCells[id - 1], "ok"); expect++;
          while (holding.has(expect)) { holding.delete(expect); set(rCells[expect - 1], "ok"); expect++; }
          if (again) say.textContent = `#${id} arrived on its second try. Everything held back behind it is handed over at once.`;
        } else if (id > expect) { holding.add(id); set(rCells[id - 1], "held"); say.textContent = `#${id} arrived, but #${expect} is missing. Sam's phone holds #${id} back until the gap is filled.`; }
        held.textContent = String(holding.size);
        const a = expect - 1; ack.textContent = String(a);
        await fly(a, 50, "var(--good)", true);
        for (let i = 0; i < a; i++) if (sCells[i].className !== "acked") set(sCells[i], "acked");
        sfx("tick", 0.05);
      }));
      if (lostThisRound) { cwnd = Math.max(1, Math.floor(cwnd / 2)); say.textContent = "No acknowledgement came back in time. TCP sends that piece again, and assumes the network is crowded: it slows down."; }
      else if (cwnd < 6) cwnd++;
      cw.textContent = String(cwnd);
      await sleep(reducedMotion() ? 0 : 250);
    }
    say.innerHTML = '<span style="color:var(--good)">All 20 delivered, complete and in order.</span>';
    sfx("hit", 0.25); running = false;
  });
}
