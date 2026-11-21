import { lib } from "../../kit/libs";
import { h, sfx, takeaway, fmt, reducedMotion } from "../../kit/ui";

const SLOW = 12;
const PRESETS = [["Same city", 2], ["New York ↔ London", 63], ["London ↔ Sydney", 250]] as const;

/** SYN, SYN-ACK, ACK: one full round trip before any data moves. Raced against UDP, which just sends. */
export async function handshakeLab(bench: HTMLElement) {
  let rtt = 63;
  const seg = h("div.seg", { role: "group", "aria-label": "Distance" });
  PRESETS.forEach(([name, v]) => {
    const b = h("button", { type: "button", "aria-pressed": String(v === rtt) }, String(name));
    b.addEventListener("click", () => { rtt = v; [...seg.children].forEach((x) => x.setAttribute("aria-pressed", String(x === b))); sfx("tick", 0.2); });
    seg.append(b);
  });
  const run = h("button.btn.primary", { type: "button", style: "justify-self:start" }, "Open a TCP connection and send");
  const W = 600, H = 300, XA = 70, XB = 530;
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`); svg.setAttribute("role", "img"); svg.setAttribute("aria-label", "Messages between Maya and Sam over time");
  svg.style.cssText = "width:100%; height:auto; display:block";
  svg.innerHTML = `
    <line x1="${XA}" y1="40" x2="${XA}" y2="${H - 10}" stroke="#38BDF8" stroke-width="3"/>
    <line x1="${XB}" y1="40" x2="${XB}" y2="${H - 10}" stroke="#4ADE80" stroke-width="3"/>
    <text x="${XA}" y="26" text-anchor="middle" fill="#EEF2FF" font-weight="700" font-size="15">Maya · New York</text>
    <text x="${XB}" y="26" text-anchor="middle" fill="#EEF2FF" font-weight="700" font-size="15">Sam · London</text>
    <text x="${W / 2}" y="${H - 2}" text-anchor="middle" fill="#6B76A0" font-size="11" font-family="JetBrains Mono, monospace">time runs downwards</text>
    <g id="hs-msgs"></g>`;
  const msgs = svg.querySelector("#hs-msgs") as SVGGElement;
  const clock = h("span.v.tnum", { style: "color:var(--storage)" }, "0 ms");
  const firstByte = h("span.v.tnum", { style: "color:var(--good)" }, "–");
  const udpByte = h("span.v.tnum", { style: "color:var(--net)" }, "–");
  const say = h("p.dim", { "aria-live": "polite", style: "min-height:3em" }, "Before any data moves, TCP sets up a connection with three messages.");
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:12px; align-content:start" }, seg, run,
        h("div.stats", {}, h("div.stat", {}, clock, h("span.k", {}, "clock")), h("div.stat", {}, firstByte, h("span.k", {}, "TCP: first data reaches Sam")), h("div.stat", {}, udpByte, h("span.k", {}, "UDP: first data reaches Sam"))), say),
      svg,
    ),
    h("p.note", {}, `Slow motion (×${SLOW}). New York–London round trip ≈ 63 ms (hatsnet.io); the other two are rough examples. Encryption (TLS) usually adds more round trips on top; QUIC folds them together.`),
    takeaway("The handshake costs one full round trip before a single byte of real data is sent."),
  );
  const { gsap } = await lib.gsap();
  const arrow = (y0: number, y1: number, fromA: boolean, colour: string, text: string, sub: string) => {
    const x0 = fromA ? XA : XB, x1 = fromA ? XB : XA;
    const g = document.createElementNS(NS, "g");
    const line = document.createElementNS(NS, "line");
    line.setAttribute("x1", String(x0)); line.setAttribute("y1", String(y0)); line.setAttribute("x2", String(x0)); line.setAttribute("y2", String(y0));
    line.setAttribute("stroke", colour); line.setAttribute("stroke-width", "3"); line.setAttribute("stroke-linecap", "round");
    const lab = document.createElementNS(NS, "text");
    lab.setAttribute("x", String((x0 + x1) / 2)); lab.setAttribute("y", String((y0 + y1) / 2 - 8)); lab.setAttribute("text-anchor", "middle"); lab.setAttribute("fill", colour); lab.setAttribute("font-size", "14"); lab.setAttribute("font-weight", "700"); lab.setAttribute("opacity", "0");
    lab.innerHTML = `${text}<tspan fill="#A3AED3" font-weight="500" font-size="12"> ${sub}</tspan>`;
    g.append(line, lab); msgs.append(g);
    return { line, lab, x1, y1 };
  };
  let busy = false;
  run.addEventListener("click", async () => {
    if (busy) return; busy = true;
    msgs.innerHTML = ""; firstByte.textContent = "–"; udpByte.textContent = "–";
    const ms = (v: number) => (reducedMotion() ? 0 : (v * SLOW) / 1000);
    const y = (tMs: number) => 50 + (tMs / (rtt * 2)) * (H - 80);
    const o = { t: 0 };
    const tl = gsap.timeline({ onUpdate: () => (clock.textContent = `${fmt(o.t)} ms`) });
    tl.to(o, { t: rtt * 2, duration: ms(rtt * 2), ease: "none" }, 0);
    const steps: [number, number, boolean, string, string, string, string][] = [
      [0, rtt / 2, true, "#FBBF24", "SYN", "I'd like to talk", "Maya: SYN, short for synchronise. Here's where my numbering starts."],
      [rtt / 2, rtt, false, "#FBBF24", "SYN-ACK", "got it", "Sam: SYN-ACK. Got it, and here's my numbering."],
      [rtt, rtt * 1.5, true, "#4ADE80", "ACK + data", "got yours", "Maya: ACK, got yours. Only now can real data go."],
    ];
    for (const [t0, t1, fromA, c, text, sub, line] of steps) {
      const a = arrow(y(t0), y(t1), fromA, c, text, sub);
      tl.call(() => { say.textContent = line; sfx("pop", 0.15); }, [], ms(t0));
      tl.to(a.line, { attr: { x2: a.x1, y2: y(t1) }, duration: ms(t1 - t0), ease: "none" }, ms(t0));
      tl.to(a.lab, { attr: { opacity: 1 }, duration: 0.2 }, ms(t0));
    }
    // UDP, drawn faintly: data leaves at once
    const u = arrow(y(0), y(rtt / 2), true, "#38BDF8", "UDP data", "no handshake");
    u.line.setAttribute("stroke-dasharray", "6 6"); u.lab.setAttribute("y", String(y(rtt / 4) + 24));
    tl.to(u.line, { attr: { x2: u.x1, y2: y(rtt / 2) }, duration: ms(rtt / 2), ease: "none" }, 0);
    tl.to(u.lab, { attr: { opacity: 1 }, duration: 0.2 }, 0);
    tl.call(() => { udpByte.textContent = `${fmt(rtt / 2)} ms`; }, [], ms(rtt / 2));
    tl.call(() => { firstByte.textContent = `${fmt(rtt * 1.5)} ms`; say.textContent = `TCP's first data reaches Sam at ${fmt(rtt * 1.5)} ms, one full round trip later than UDP's.`; sfx("hit", 0.25); busy = false; }, [], ms(rtt * 1.5));
    if (reducedMotion()) tl.progress(1);
  });
}
