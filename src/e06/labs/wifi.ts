import { h, sfx, takeaway, fmt } from "../../kit/ui";
import { paintPhoto } from "../../e05/photo";

const RTT = 63; // ms, New York to London
const PAGE = 60; // packets in a small web page

/** Simplified TCP: rounds of `cwnd` packets; a loss halves the speed and costs a resend. Returns ms. */
function tcpLoad(loss: number, seed = 4) {
  let s = seed; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  let done = 0, cwnd = 2, rounds = 1; // the handshake
  while (done < PAGE) {
    let lostHere = false;
    for (let k = 0; k < cwnd && done < PAGE; k++) { if (r() < loss) lostHere = true; else done++; }
    rounds += lostHere ? 2 : 1; // waiting for the timeout costs about one extra round
    cwnd = lostHere ? Math.max(1, Math.floor(cwnd / 2)) : Math.min(cwnd * 2, 32);
  }
  return rounds * RTT;
}

/** Weak Wi-Fi: TCP gets slow but correct; UDP stays live but rough. And an office firewall that blocks UDP. */
export function wifiLab(bench: HTMLElement) {
  const loss = h("input#wf-loss", { type: "range", min: 0, max: 15, step: 0.5, value: 0 }) as HTMLInputElement;
  const lossOut = h("output", {});
  const block = h("input#wf-block", { type: "checkbox" }) as HTMLInputElement;
  const bars = h("span.wifi", { "aria-hidden": "true" }, h("i"), h("i"), h("i"), h("i"));
  const pageBar = h("i", { style: "display:block; height:100%; width:0%; background:var(--good); border-radius:8px" });
  const pageTime = h("span.v.tnum", { style: "color:var(--good)" }, "–");
  const pageSay = h("span.k", {}, "to load a 60-packet page, and every byte correct");
  const cv = h("canvas", { width: 240, height: 160, style: "width:100%; height:auto; border-radius:10px; image-rendering:pixelated; display:block" }) as HTMLCanvasElement;
  const callStatus = h("b", {}, "live");
  const timer = h("span.mono", {}, "00:00");
  const callVia = h("span.chip", {}, "over UDP");
  const say = h("p.dim", { "aria-live": "polite", style: "min-height:3em" });
  bench.append(
    h("div", { style: "display:grid; gap:12px" },
      h("div.row", { style: "gap:14px" }, bars, h("label.field", { for: "wf-loss", style: "flex:1; min-width:220px" }, h("span", {}, "Packets lost on this Wi-Fi: ", lossOut), loss)),
      h("label.row", { for: "wf-block", style: "gap:8px; color:var(--dim)" }, block, "At the office: the network blocks UDP")),
    h("div.bench-grid", { style: "margin-top:14px" },
      h("div.q", { style: "align-content:start" }, h("span.eyebrow", { style: "color:var(--good)" }, "Banking page · TCP"), h("div", { style: "height:14px; background:var(--line); border-radius:8px; overflow:hidden" }, pageBar), h("div.stat", {}, pageTime, pageSay)),
      h("div.q", { style: "align-content:start" }, h("div.row", { style: "justify-content:space-between" }, h("span.eyebrow", { style: "color:var(--net)" }, "Video call with Sam"), callVia), cv, h("div.row", { style: "justify-content:space-between" }, callStatus, timer)),
    ),
    say,
    h("p.note", {}, "Simplified model on a New York–London round trip of 63 ms: a loss costs a resend and halves TCP's speed. Video apps prefer UDP and fall back to TCP when a network blocks it, usually with worse quality (Zoom's network guide)."),
    takeaway("TCP stays correct and gets slow. UDP stays in the present and gets rough."),
  );
  const img = new Image(); img.src = paintPhoto(480, 320);
  const g = cv.getContext("2d")!;
  let t0 = performance.now(), frozenUntil = 0, seed = 21;
  const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  function calc() {
    const L = +loss.value / 100; lossOut.textContent = `${loss.value}%`;
    [...bars.children].forEach((b, i) => ((b as HTMLElement).style.opacity = i < Math.max(1, 4 - Math.ceil(L * 25)) ? "1" : "0.2"));
    const ms = tcpLoad(L);
    pageTime.textContent = ms < 1000 ? `${fmt(ms)} ms` : `${fmt(ms / 1000, 1)} s`;
    pageBar.style.width = "0%"; requestAnimationFrame(() => { pageBar.style.transition = `width ${Math.min(4, ms / 600)}s linear`; pageBar.style.width = "100%"; });
    callVia.textContent = block.checked ? "forced over TCP" : "over UDP";
    callVia.style.color = block.checked ? "var(--bad)" : "var(--net)";
    say.textContent = L === 0 ? "Good Wi-Fi: both are fine." : block.checked ? "UDP is blocked, so the call is pushed through TCP. Every lost packet now freezes the picture while TCP waits for the copy." : `On weak Wi-Fi the page takes ${pageTime.textContent} but loads correctly. The call turns blocky and robotic, but stays live.`;
  }
  [loss, block].forEach((e) => e.addEventListener("input", () => { calc(); sfx("tick", 0.1); }));
  block.addEventListener("change", () => { calc(); sfx(block.checked ? "miss" : "hit", 0.2); });
  let vis = true; new IntersectionObserver((e) => (vis = e[0].isIntersecting)).observe(cv);
  let lastDraw = 0;
  function frame(now: number) {
    requestAnimationFrame(frame);
    if (!vis || now - lastDraw < 120 || !img.complete) return;
    lastDraw = now;
    const L = +loss.value / 100;
    const s = Math.floor((now - t0) / 1000);
    if (block.checked && L > 0 && now > frozenUntil && r() < L * 3) frozenUntil = now + 300 + L * 4000;
    const frozen = now < frozenUntil;
    if (!frozen) {
      // UDP: lost packets just make the picture blocky; the call carries on
      const block_ = block.checked ? 1 : Math.max(1, Math.round(1 + L * 60 * (0.7 + 0.6 * r())));
      g.imageSmoothingEnabled = false;
      const w = Math.max(2, Math.floor(240 / block_)), hh = Math.max(2, Math.floor(160 / block_));
      g.drawImage(img, 0, 0, w, hh); g.drawImage(cv, 0, 0, w, hh, 0, 0, 240, 160);
      timer.textContent = `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
    } else { g.fillStyle = "rgba(10,15,30,0.08)"; g.fillRect(0, 0, 240, 160); }
    callStatus.textContent = frozen ? "frozen, waiting for a lost packet" : L > 0.04 && !block.checked ? "live · blocky, robotic voice" : "live";
    callStatus.style.color = frozen ? "var(--bad)" : L > 0.04 && !block.checked ? "var(--storage)" : "var(--good)";
  }
  calc(); t0 = performance.now(); requestAnimationFrame(frame);
}
