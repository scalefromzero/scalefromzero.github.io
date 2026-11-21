import { h, sfx, takeaway, fmt, css, reducedMotion } from "../../kit/ui";

const SLOW = 10; // slow motion: one real millisecond plays as ten

/** One lost packet of voice. Waiting for it freezes the call; skipping it is a tiny blip. */
export function callLab(bench: HTMLElement) {
  const rtt = h("input#cl-rtt", { type: "range", min: 20, max: 300, step: 1, value: 63 }) as HTMLInputElement;
  const rttOut = h("output", {});
  const lose = h("button.btn.primary", { type: "button", style: "justify-self:start" }, "Lose one packet of Maya's voice");
  const mk = (title: string, sub: string, colour: string) => {
    const c = h("canvas", { width: 600, height: 120, style: "width:100%; height:auto; display:block; border-radius:10px; background:var(--bg); border:1px solid var(--line)" }) as HTMLCanvasElement;
    const status = h("b", { style: "font: 600 var(--step--1)/1.3 var(--body)" }, "live");
    return { el: h("div", { style: "display:grid; gap:6px" }, h("div.row", { style: "justify-content:space-between" }, h("span", {}, h("b", { style: `color:var(${colour})` }, title), h("span.dim", {}, ` · ${sub}`)), status), c), c, status };
  };
  const A = mk("Wait for it", "how the numbered, receipt-based fix behaves", "--good");
  const B = mk("Skip it", "what a live call actually wants", "--net");
  const say = h("p.dim", { "aria-live": "polite", style: "min-height:3em" }, "Maya is talking. Each bar is a small packet of her voice.");
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:12px; align-content:start" },
        h("label.field", { for: "cl-rtt" }, h("span", {}, "One round trip across the Atlantic: ", rttOut), rtt), lose, say),
      h("div", { style: "display:grid; gap:14px; min-width:0" }, A.el, B.el),
    ),
    h("p.note", {}, `Shown in slow motion (×${SLOW}). New York–London round trips are a little over 60 ms. Phone engineers aim to keep one-way delay under about 150 ms so talking feels natural (ITU-T G.114).`),
    takeaway("For a live call, a late piece is worth nothing. Waiting for it freezes everything behind it."),
  );
  rttOut.textContent = `${rtt.value} ms`;
  rtt.addEventListener("input", () => (rttOut.textContent = `${rtt.value} ms`));
  const W = 600, H = 120, BAR = 10;
  type Bar = { x: number; h: number; kind: "ok" | "gap" | "late" };
  const lanes = [{ bars: [] as Bar[], frozenUntil: 0, backlog: 0, side: A, wait: true }, { bars: [] as Bar[], frozenUntil: 0, backlog: 0, side: B, wait: false }];
  let t = 0, emitted = 0, last = performance.now();
  const amp = (i: number) => 18 + 34 * Math.abs(Math.sin(i * 0.37) * Math.cos(i * 0.11));
  let pendingLoss = false;
  lose.addEventListener("click", () => { pendingLoss = true; sfx("pop", 0.2); });
  const cG = css("--good"), cN = css("--net"), cBad = css("--bad"), cLine = css("--line"), cFaint = css("--faint");
  let vis = true; new IntersectionObserver((e) => (vis = e[0].isIntersecting)).observe(bench);
  function frame(now: number) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!vis) return;
    t += reducedMotion() ? 0 : dt;
    // one bar every 0.2 s on screen (= 20 ms of real audio in slow motion)
    while (emitted < t / 0.2) {
      const i = emitted++;
      const lost = pendingLoss; pendingLoss = false;
      for (const L of lanes) {
        if (lost && L.wait) {
          const freeze = (+rtt.value * 2 * SLOW) / 1000; // notice the gap (~1 round trip), then the copy crosses back (~1 more)
          L.frozenUntil = t + freeze; L.backlog = 0;
          say.textContent = `A packet is lost. "Wait for it" holds everything behind the gap for about ${fmt(+rtt.value * 2)} ms. "Skip it" just plays on.`;
          sfx("miss", 0.2);
        }
        if (L.wait && t < L.frozenUntil) { L.backlog++; continue; }
        L.bars.push({ x: W, h: amp(i), kind: lost && !L.wait ? "gap" : "ok" });
      }
    }
    for (const L of lanes) {
      const frozen = L.wait && t < L.frozenUntil;
      if (L.wait && !frozen && L.backlog > 0) {
        // the late packet arrives, then the backlog plays all at once
        L.bars.push({ x: W, h: 40, kind: "late" });
        for (let k = 0; k < L.backlog; k++) L.bars.push({ x: W + (k + 1) * (BAR + 2), h: amp(emitted - L.backlog + k), kind: "ok" });
        L.backlog = 0;
        say.textContent = "The missing piece finally arrives. It's a word Maya said a moment ago. It's useless now.";
      }
      if (!frozen) L.bars.forEach((b) => (b.x -= (BAR + 2) * 5 * dt));
      L.bars = L.bars.filter((b) => b.x > -BAR);
      const g = L.side.c.getContext("2d")!;
      g.clearRect(0, 0, W, H);
      g.fillStyle = cLine; g.fillRect(0, H / 2, W, 1);
      for (const b of L.bars) {
        g.fillStyle = b.kind === "gap" ? "transparent" : b.kind === "late" ? cFaint : L.wait ? cG : cN;
        if (b.kind === "gap") { g.strokeStyle = cBad; g.strokeRect(b.x, H / 2 - 8, BAR, 16); continue; }
        g.fillRect(b.x, H / 2 - b.h / 2, BAR, b.h);
      }
      if (frozen) { g.fillStyle = "rgba(10,15,30,0.6)"; g.fillRect(0, 0, W, H); g.fillStyle = cBad; g.font = "700 18px Space Grotesk, sans-serif"; g.textAlign = "center"; g.fillText("FROZEN · waiting for the lost packet", W / 2, H / 2 + 6); g.textAlign = "left"; }
      L.side.status.textContent = frozen ? "frozen" : "live";
      L.side.status.style.color = frozen ? "var(--bad)" : "var(--good)";
    }
  }
  requestAnimationFrame(frame);
}
