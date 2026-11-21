import { h, sfx, takeaway, sleep, reducedMotion } from "../../kit/ui";

const STREAMS = [["Page styles", "--cache"], ["Photo", "--storage"], ["Script", "--ram"]] as const;
const PER = 6;

/** Head-of-line blocking: one lost packet stalls everything on TCP, but only its own stream on QUIC. */
export function holLab(bench: HTMLElement) {
  const seg = h("div.seg", { role: "group", "aria-label": "Protocol" });
  let quic = false;
  [["TCP: one ordered line", false], ["QUIC: separate streams", true]].forEach(([t, v]) => {
    const b = h("button", { type: "button", "aria-pressed": String(v === quic) }, String(t));
    b.addEventListener("click", () => { quic = v as boolean; [...seg.children].forEach((x) => x.setAttribute("aria-pressed", String(x === b))); sfx("tick", 0.2); });
    seg.append(b);
  });
  const lose = h("input#hl-lose", { type: "checkbox", checked: true }) as HTMLInputElement;
  const run = h("button.btn.primary", { type: "button", style: "justify-self:start" }, "Load the page");
  const rows = STREAMS.map(([n, c]) => {
    const cells = Array.from({ length: PER }, () => h("i", {}));
    const done = h("b.mono", { style: "font-size:0.78rem; color:var(--dim)" }, "");
    const el = h("div.streamrow", {}, h("span", { style: `color:var(${c}); font-weight:700; font-size:var(--step--1)` }, n), h("div.cells", { style: `grid-template-columns:repeat(${PER},1fr); --sc: var(${c})` }, ...cells), done);
    return { el, cells, done };
  });
  const say = h("p.dim", { "aria-live": "polite", style: "min-height:3em" }, "Three things on one page, sent over one connection.");
  const share = h("div.share", { role: "img", "aria-label": "Share of web requests to Cloudflare in 2025: HTTP/3 21%, HTTP/2 50%, HTTP/1.x 29%" },
    h("span", { style: "flex:21; background:var(--cache)" }, "HTTP/3 21%"), h("span", { style: "flex:50; background:var(--net)" }, "HTTP/2 50%"), h("span", { style: "flex:29; background:var(--panel2); color:var(--dim)" }, "HTTP/1.x 29%"));
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:12px; align-content:start" }, seg,
        h("label.row", { for: "hl-lose", style: "gap:8px; color:var(--dim)" }, lose, "Lose one of the photo's packets"), run, say),
      h("div", { style: "display:grid; gap:10px; align-content:start; min-width:0" }, h("span.eyebrow", {}, "Handed to the browser"), ...rows.map((r) => r.el)),
    ),
    h("div", { style: "display:grid; gap:8px; margin-top:18px" }, h("span.eyebrow", {}, "Web requests to Cloudflare in 2025, by version"), share),
    h("p.note", {}, "Packets take turns across the three streams. The lost one is sent again after about one round trip. Shares: ", h("a", { href: "https://blog.cloudflare.com/radar-2025-year-in-review/", target: "_blank", rel: "noopener" }, "Cloudflare Radar 2025 Year in Review"), "."),
    takeaway("QUIC runs on UDP but adds numbering, resending, encryption and separate streams, so one lost packet only holds up its own stream."),
  );
  let busy = false;
  run.addEventListener("click", async () => {
    if (busy) return; busy = true;
    rows.forEach((r) => { r.cells.forEach((c) => (c.className = "")); r.done.textContent = ""; });
    // interleaved send order: s0p0, s1p0, s2p0, s0p1, ...
    const order: [number, number][] = [];
    for (let p = 0; p < PER; p++) for (let s = 0; s < 3; s++) order.push([s, p]);
    const lostKey = lose.checked ? "1-3" : "";
    const arrived = new Set<string>(); const delivered = new Set<string>();
    let tick = 0; const RESEND = 8; let resendAt = -1;
    const finish: number[] = [-1, -1, -1];
    const tryDeliver = () => {
      if (quic) {
        for (let s = 0; s < 3; s++) for (let p = 0; p < PER; p++) { const k = `${s}-${p}`; if (!arrived.has(k)) break; if (!delivered.has(k)) { delivered.add(k); rows[s].cells[p].className = "ok"; } }
      } else {
        for (const [s, p] of order) { const k = `${s}-${p}`; if (!arrived.has(k)) break; if (!delivered.has(k)) { delivered.add(k); rows[s].cells[p].className = "ok"; } }
      }
      for (const [s, p] of order) { const k = `${s}-${p}`; if (arrived.has(k) && !delivered.has(k)) rows[s].cells[p].className = "held"; }
      rows.forEach((r, s) => { if (finish[s] < 0 && r.cells.every((c) => c.className === "ok")) { finish[s] = tick; r.done.textContent = `done at step ${tick}`; } });
    };
    for (const [s, p] of [...order, ...(lostKey ? [[-1, -1] as [number, number]] : [])]) {
      tick++;
      await sleep(reducedMotion() ? 0 : 160);
      if (s >= 0) {
        const k = `${s}-${p}`;
        if (k === lostKey) { rows[s].cells[p].className = "lost"; resendAt = tick + RESEND; sfx("miss", 0.15); say.textContent = quic ? "The photo lost a packet. Only the photo waits; styles and script keep arriving." : "The photo lost a packet. On TCP everything after it waits in line, even data that arrived fine."; continue; }
        arrived.add(k); sfx("tick", 0.03);
      }
      if (resendAt > 0 && tick >= resendAt) { arrived.add(lostKey); resendAt = -1; sfx("pop", 0.15); }
      tryDeliver();
    }
    while (resendAt > 0) { tick++; await sleep(reducedMotion() ? 0 : 160); if (tick >= resendAt) { arrived.add(lostKey); resendAt = -1; } tryDeliver(); }
    tryDeliver();
    say.textContent = !lose.checked ? "Nothing lost: both finish together." : quic ? "QUIC: styles and script finished on time. Only the photo waited for its lost packet." : "TCP: head-of-line blocking. One lost photo packet delayed the styles and the script too.";
    sfx("hit", 0.2); busy = false;
  });
}
