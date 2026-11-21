import { lib } from "../kit/libs";
import { h, sfx, takeaway, fmt, css, sleep, reducedMotion } from "../kit/ui";
import { seg, stat, seeded } from "../kit/episode";

const HDR = 600; // bytes of HTTP headers on a typical request + response, illustrative
const FRAME = 6; // bytes of WebSocket framing for a small message (2 + 4-byte mask from the client)

/** Hero: Sam types, Maya's phone receives. Polling vs a WebSocket, with delay and wasted requests counted. */
export function chatHero() {
  let mode: "poll" | "ws" = "poll";
  const pick = seg("How Maya's phone gets messages", [["Polling every 3 s", "poll"], ["WebSocket", "ws"]], mode, (v) => { mode = v as typeof mode; reset(); sfx("tick", 0.15); });
  const phone = (who: string) => h("div.phone", { style: "min-height:240px; width:100%" }, h("b", { style: "font-size:0.85rem; padding:0 4px" }, who));
  const sam = phone("Sam · London"), maya = phone("Maya · New York");
  const input = h("input#ch-in", { type: "text", value: "Goal!! ⚽", "aria-label": "Sam's message", style: "font: 500 0.9rem var(--body); padding:8px 10px; border-radius:10px; border:1px solid var(--line); background:var(--bg); color:var(--text); width:100%" }) as HTMLInputElement;
  const send = h("button.btn.primary", { type: "button" }, "Send as Sam");
  const sDelay = stat("last message's delay", "--net"), sEmpty = stat("requests that came back empty", "--storage", "0"), sBytes = stat("bytes on Maya's connection", "--dim", "0");
  const wire = h("div.logs", { style: "height:96px" });
  let empty = 0, bytes = 0, pending: { text: string; at: number }[] = [], timer = 0;
  const bubble = (el: HTMLElement, t: string, mine: boolean) => { el.append(h("div", { style: `justify-self:${mine ? "end" : "start"}; max-width:80%; padding:6px 10px; border-radius:12px; font-size:0.85rem; background:${mine ? "#1d4ed8" : "var(--panel)"}` }, t)); while (el.children.length > 7) el.children[1].remove(); };
  const log = (t: string, cls = "ok") => { wire.append(h("div", { class: cls }, t)); while (wire.children.length > 5) wire.firstElementChild!.remove(); };
  function deliver(now: number) {
    for (const m of pending) { bubble(maya, m.text, false); sDelay.v.textContent = `${fmt((now - m.at) / 1000, 1)} s`; sDelay.v.style.color = now - m.at > 1000 ? "var(--storage)" : "var(--good)"; }
    if (pending.length) sfx("pop", 0.2);
    pending = [];
  }
  function reset() {
    clearInterval(timer); empty = 0; bytes = 0; wire.innerHTML = ""; sEmpty.v.textContent = "0"; sBytes.v.textContent = "0";
    if (mode === "poll") timer = window.setInterval(() => {
      bytes += HDR + (pending.length ? 40 : 2); sBytes.v.textContent = fmt(bytes);
      if (pending.length) { log("GET /messages?after=… → 200 (1 new)"); deliver(performance.now()); }
      else { empty++; sEmpty.v.textContent = fmt(empty); log("GET /messages?after=… → 200 (nothing new)", "err"); }
    }, reducedMotion() ? 3000 : 3000);
    else { bytes = HDR; sBytes.v.textContent = fmt(bytes); log("GET /chat  Upgrade: websocket → 101 Switching Protocols"); timer = window.setInterval(() => { bytes += 2 * FRAME; sBytes.v.textContent = fmt(bytes); log("ping ↔ pong (heartbeat)"); }, 15000); }
  }
  send.addEventListener("click", () => {
    const t = input.value.trim() || "…"; bubble(sam, t, true);
    pending.push({ text: t, at: performance.now() }); sfx("whoosh", 0.15);
    if (mode === "ws") { setTimeout(() => { bytes += FRAME + t.length; sBytes.v.textContent = fmt(bytes); log(`frame ← "${t}" (${FRAME + t.length} bytes)`); deliver(performance.now()); }, 80); }
  });
  let started = false;
  const el = h("div.bench", { style: "display:grid; gap:10px" }, pick,
    h("div", { style: "display:grid; grid-template-columns:1fr 1fr; gap:10px" }, sam, maya),
    h("div.row", { style: "flex-wrap:nowrap" }, input, send), h("div.stats", {}, sDelay.el, sEmpty.el, sBytes.el), wire);
  const io = new IntersectionObserver((e) => { if (e[0].isIntersecting && !started) { started = true; reset(); } });
  io.observe(el);
  return el;
}

/** Polling at scale: requests, wasted answers, header bytes and delay. */
export function pollLab(bench: HTMLElement) {
  const users = h("input#pl-u", { type: "range", min: 3, max: 8, step: 0.01, value: 6 }) as HTMLInputElement;
  const every = h("input#pl-e", { type: "range", min: 0, max: 60, step: 1, value: 1 }) as HTMLInputElement;
  const uOut = h("output", {}), eOut = h("output", {});
  const sR = stat("requests a day", "--storage"), sW = stat("that answer 'nothing new'", "--bad"), sB = stat("of headers a day", "--cpu"), sD = stat("average delay for a new message", "--net");
  function draw() {
    const U = Math.round(10 ** +users.value), E = Math.max(1, +every.value);
    uOut.textContent = U >= 1e6 ? `${fmt(U / 1e6, 1)} million` : fmt(U); eOut.textContent = `every ${E} s`;
    const perDay = (U * 86400) / E, msgs = U * 50; // 50 incoming messages per user per day, illustrative
    sR.v.textContent = perDay >= 1e9 ? `${fmt(perDay / 1e9, 1)} billion` : perDay >= 1e6 ? `${fmt(perDay / 1e6, 1)} million` : fmt(perDay);
    sW.v.textContent = `${fmt(Math.max(0, (1 - msgs / perDay) * 100), 2)}%`;
    const b = perDay * HDR; sB.v.textContent = b >= 1e12 ? `${fmt(b / 1e12, 1)} TB` : `${fmt(b / 1e9, 1)} GB`;
    sD.v.textContent = `${fmt(E / 2, 1)} s`;
  }
  [users, every].forEach((x) => x.addEventListener("input", draw));
  bench.append(
    h("div.bench-grid", {}, h("div", { style: "display:grid; gap:12px; align-content:start" },
      h("label.field", { for: "pl-u" }, h("span", {}, "People with the chat open: ", uOut), users),
      h("label.field", { for: "pl-e" }, h("span", {}, "Each phone asks: ", eOut), every)),
      h("div.stats", {}, sR.el, sW.el, sB.el, sD.el)),
    h("p.note", {}, "Illustrative: about 600 bytes of headers per request and response, and 50 incoming messages per person per day. A million people polling once a second is over 86 billion requests a day."),
    takeaway("Polling is fine for a feed that refreshes every minute. For a chat, almost every request is wasted, and it's still slow."),
  );
  draw();
}

/** Four ways to get updates, on one timeline. */
export function techniquesLab(bench: HTMLElement) {
  const NS = "http://www.w3.org/2000/svg";
  const W = 640, H = 300, T = 10; // seconds
  const svg = document.createElementNS(NS, "svg"); svg.setAttribute("viewBox", `0 0 ${W} ${H}`); svg.style.cssText = "width:100%; height:auto; display:block"; svg.setAttribute("role", "img"); svg.setAttribute("aria-label", "Timeline of requests for polling, long polling, server-sent events and WebSockets");
  const events = [2.2, 2.6, 7.1];
  const play = h("button.btn.primary", { type: "button", style: "justify-self:start" }, "Replay 10 seconds");
  const x = (t: number) => 142 + (t / T) * (W - 160);
  const rows: [string, string, string][] = [["Polling (1 s)", "--storage", "poll"], ["Long polling", "--cache", "long"], ["Server-sent events", "--net", "sse"], ["WebSocket", "--good", "ws"]];
  async function draw() {
    svg.innerHTML = "";
    events.forEach((t, i) => svg.insertAdjacentHTML("beforeend", `<line x1="${x(t)}" y1="10" x2="${x(t)}" y2="${H - 20}" stroke="#FB7185" stroke-dasharray="4 4"/>${i > 0 && t - events[i - 1] < 1 ? "" : `<text x="${x(t)}" y="${H - 6}" text-anchor="middle" fill="#FB7185" font-size="11">${i + 1 < events.length && events[i + 1] - t < 1 ? "Sam sends ×2" : "Sam sends"}</text>`}`));
    for (const [i, [name, c, k]] of rows.entries()) {
      const y = 40 + i * 62, col = css(c);
      svg.insertAdjacentHTML("beforeend", `<text x="8" y="${y + 5}" fill="${col}" font-size="13" font-weight="700">${name}</text><line x1="${x(0)}" y1="${y}" x2="${x(T)}" y2="${y}" stroke="#26315A" stroke-width="2"/>`);
      const mark = (t: number, ok: boolean, label = "") => svg.insertAdjacentHTML("beforeend", `<circle cx="${x(t)}" cy="${y}" r="${ok ? 6 : 3.5}" fill="${ok ? col : "#3b4675"}"/>${label ? `<text x="${x(t)}" y="${y - 12}" text-anchor="middle" fill="${col}" font-size="10">${label}</text>` : ""}`);
      const bar = (a: number, b: number) => svg.insertAdjacentHTML("beforeend", `<rect x="${x(a)}" y="${y - 5}" width="${x(b) - x(a)}" height="10" rx="5" fill="${col}" opacity="0.25"/>`);
      if (k === "poll") for (let t = 1; t <= T; t++) { const got = events.some((e) => e > t - 1 && e <= t); mark(t, got); }
      if (k === "long") { let s = 0; for (const e of events) { bar(s, e); mark(e + 0.05, true); s = e + 0.1; } bar(s, T); }
      if (k === "sse" || k === "ws") { bar(0, T); events.forEach((e) => mark(e + 0.02, true)); if (k === "ws") [4.5, 8.4].forEach((t) => mark(t, true, "Maya sends")); }
      await sleep(reducedMotion() ? 0 : 250); sfx("tick", 0.08);
    }
  }
  play.addEventListener("click", draw);
  bench.append(play, svg,
    h("div", { style: "display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:8px; margin-top:10px" },
      ...[["Polling", "Ask every second. Grey dots are wasted requests; messages wait for the next ask."], ["Long polling", "Ask, and the server holds the request open until something happens (RFC 6202)."], ["Server-sent events", "One request, and the server keeps streaming updates down it. One way only."], ["WebSocket", "One open pipe; either side can send at any moment."]].map(([a, b]) => h("div.box", { style: "min-height:auto" }, h("b", {}, a), h("span", {}, b)))),
    takeaway("Long polling and server-sent events help. For two-way, low-latency messaging, use a WebSocket."));
  draw();
}

/** The upgrade handshake, then frames: and a real WebSocket key computation. */
export async function handshakeLab(bench: HTMLElement) {
  const req = h("pre.json", {}), res = h("pre.json", {});
  const again = h("button.btn", { type: "button" }, "New random key");
  const frames = h("div.logs", { style: "height:140px" });
  const msg = h("input#hs-msg", { type: "text", value: "hi Maya!", "aria-label": "Message", style: "font: 500 0.9rem var(--mono); padding:8px 10px; border-radius:8px; border:1px solid var(--line); background:var(--bg); color:var(--text); flex:1" }) as HTMLInputElement;
  const sendF = h("button.btn.primary", { type: "button" }, "Send a frame");
  const sCmp = stat("bytes as a WebSocket frame vs a new HTTP request", "--good");
  async function accept(key: string) {
    const d = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"));
    return btoa(String.fromCharCode(...new Uint8Array(d)));
  }
  async function draw() {
    const key = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
    req.innerHTML = `GET /chat HTTP/1.1\nHost: chat.example\n<span class="s">Upgrade: websocket\nConnection: Upgrade</span>\nSec-WebSocket-Key: <span class="n">${key}</span>\nSec-WebSocket-Version: 13`;
    let acc = "(needs HTTPS to compute)"; try { acc = await accept(key); } catch { /* no subtle crypto */ }
    res.innerHTML = `<span class="s">HTTP/1.1 101 Switching Protocols</span>\nUpgrade: websocket\nConnection: Upgrade\nSec-WebSocket-Accept: <span class="n">${acc}</span>\n\n<span style="color:var(--faint)">From here on, this connection is no longer HTTP.</span>`;
  }
  sendF.addEventListener("click", () => {
    const n = new TextEncoder().encode(msg.value).length;
    const hdr = 2 + (n > 125 ? 2 : 0) + 4;
    frames.append(h("div", { class: "ok" }, `→ [FIN, text, mask, len ${n}] "${msg.value}"  · ${hdr} + ${n} bytes`));
    while (frames.children.length > 5) frames.firstElementChild!.remove();
    sCmp.v.textContent = `${hdr + n} vs ~${HDR + n}`; sfx("pop", 0.15);
  });
  again.addEventListener("click", () => { draw(); sfx("tick", 0.15); });
  bench.append(
    h("div.bench-grid", {}, h("div", { style: "display:grid; gap:8px; align-content:start" }, h("span.eyebrow", {}, "The browser asks to upgrade"), req, again), h("div", { style: "display:grid; gap:8px; align-content:start" }, h("span.eyebrow", {}, "The server agrees"), res)),
    h("div.bench-grid", { style: "margin-top:14px" }, h("div", { style: "display:grid; gap:10px; align-content:start" }, h("div.row", { style: "flex-wrap:nowrap" }, msg, sendF), sCmp.el), frames),
    h("p.note", {}, "The Sec-WebSocket-Accept value is computed in your browser exactly as RFC 6455 §4 specifies: SHA-1 of the key plus a fixed GUID, in base64. Frames from the browser carry a 4-byte mask (§5.2)."),
    takeaway("It starts as ordinary HTTP on the same port, so it passes through the internet we already have. Then each message costs a few bytes."),
  );
  sendF.click(); await draw();
}

/** Scaling open lines: memory per connection, servers needed, and a message bus between servers. */
export function scaleLab(bench: HTMLElement) {
  const users = h("input#sc-u", { type: "range", min: 4, max: 9, step: 0.01, value: 7 }) as HTMLInputElement;
  const per = h("input#sc-p", { type: "range", min: 4, max: 6.5, step: 0.01, value: 5.7 }) as HTMLInputElement;
  const uOut = h("output", {}), pOut = h("output", {});
  const sS = stat("chat servers needed", "--good"), sM = stat("memory per server, at ~20 KB a line", "--storage");
  const bus = h("div", { style: "display:grid; gap:8px" });
  const sendBtn = h("button.btn.primary", { type: "button" }, "Sam sends to the group");
  let busOn = true;
  const busSeg = seg("Between servers", [["Message bus", true], ["Nothing", false]], busOn, (v) => { busOn = v; draw(); });
  function draw() {
    const U = Math.round(10 ** +users.value), P = Math.round(10 ** +per.value);
    uOut.textContent = U >= 1e6 ? `${fmt(U / 1e6, 1)} million` : fmt(U); pOut.textContent = fmt(P);
    sS.v.textContent = fmt(Math.ceil(U / P)); sM.v.textContent = `${fmt((P * 20) / 1e6, 1)} GB`;
    bus.innerHTML = "";
    const srv = (n: string, who: string) => h("div.box", { style: "--bc: var(--good); min-height:auto", "data-s": n }, h("b", {}, n), h("span", {}, who));
    bus.append(h("div", { style: "display:grid; grid-template-columns:1fr 1fr; gap:8px" }, srv("Chat server A", "Maya, Ali"), srv("Chat server B", "Sam, Priya")));
    bus.append(h("div.box", { style: `--bc: var(${busOn ? "--cache" : "--line"}); min-height:auto; text-align:center` }, h("b", {}, busOn ? "Message bus (publish / subscribe)" : "no link between servers")));
  }
  sendBtn.addEventListener("click", async () => {
    const [a, b] = [...bus.querySelectorAll("[data-s]")] as HTMLElement[];
    b.style.boxShadow = "0 0 0 2px var(--net)"; sfx("whoosh", 0.15); await sleep(reducedMotion() ? 0 : 400);
    if (busOn) { (bus.lastElementChild as HTMLElement).style.boxShadow = "0 0 0 2px var(--cache)"; await sleep(reducedMotion() ? 0 : 400); a.style.boxShadow = "0 0 0 2px var(--good)"; a.querySelector("span")!.textContent = "Maya ✓, Ali ✓"; b.querySelector("span")!.textContent = "Sam, Priya ✓"; sfx("hit", 0.2); }
    else { b.querySelector("span")!.textContent = "Sam, Priya ✓"; a.querySelector("span")!.textContent = "Maya ✕, Ali ✕ (never heard)"; sfx("miss", 0.2); }
    setTimeout(draw, 2500);
  });
  [users, per].forEach((x) => x.addEventListener("input", draw));
  bench.append(
    h("div.bench-grid", {}, h("div", { style: "display:grid; gap:12px; align-content:start" },
      h("label.field", { for: "sc-u" }, h("span", {}, "Phones connected at once: ", uOut), users),
      h("label.field", { for: "sc-p" }, h("span", {}, "Open lines one server can hold: ", pOut), per), h("div.stats", {}, sS.el, sM.el),
      h("p.dim", { style: "margin:0" }, "Each line stays on the server it started on, so the load balancer keeps it there.")),
      h("div", { style: "display:grid; gap:10px; align-content:start" }, busSeg, bus, sendBtn)),
    h("p.note", {}, "WhatsApp wrote in 2012 that one server held over 2 million connections. About 20 KB of memory per mostly idle connection is illustrative."),
    takeaway("Servers hold huge numbers of mostly idle lines, and a message bus lets any server reach any user."),
  );
  draw();
}

/** A chat server restarts: a million phones reconnect. With and without random backoff (jitter). */
export async function stampedeLab(bench: HTMLElement) {
  let jitter = false;
  const pick = seg("When reconnecting", [["Retry immediately", false], ["Wait a small random time first", true]], jitter, (v) => { jitter = v; draw(); sfx("tick", 0.15); });
  const box = h("div.chart-box", { style: "height:240px" }, h("canvas", { "aria-label": "Reconnections per second after a restart" }));
  const sPeak = stat("peak reconnections in one second", "--bad");
  bench.append(
    h("div.bench-grid", {}, h("div", { style: "display:grid; gap:12px; align-content:start" }, pick, sPeak.el,
      h("p.dim", { style: "margin:0" }, "Give every message an ID, and on reconnect ask for everything after the last one you saw. Nothing gets lost.")), box),
    h("p.note", {}, "Simulated: 200,000 phones notice the restart within 2 seconds; the next server can accept about 20,000 new connections a second; refused ones retry. Jitter spreads retries over 0–20 s (AWS, \"Exponential Backoff and Jitter\")."),
    takeaway("Wait a small random time before reconnecting, so a million phones don't all hit the server at the same instant."),
  );
  const { Chart } = await lib.chart();
  const S = 40;
  const chart = new Chart(box.querySelector("canvas")!, {
    type: "bar", data: { labels: Array.from({ length: S }, (_, i) => (i % 5 === 0 ? `${i} s` : "")), datasets: [{ label: "connection attempts", data: [], backgroundColor: css("--storage"), borderRadius: 2 }, { label: "server limit", type: "line", data: Array(S).fill(20000), borderColor: css("--bad"), borderDash: [6, 6], pointRadius: 0 } as never] },
    options: { maintainAspectRatio: false, animation: { duration: reducedMotion() ? 0 : 400 }, plugins: { legend: { labels: { color: css("--dim"), boxWidth: 12 } } }, scales: { y: { beginAtZero: true, ticks: { color: css("--faint"), callback: (v) => `${+v / 1000}k` }, grid: { color: "rgba(120,140,220,0.08)" } }, x: { ticks: { color: css("--faint"), autoSkip: false, maxRotation: 0 }, grid: { display: false } } } },
  });
  function draw() {
    const r = seeded(9), N = 200000, CAP = 20000;
    const attempts = Array(S).fill(0);
    let waiting: number[] = Array.from({ length: N }, () => r() * 2 + (jitter ? r() * 20 : 0));
    for (let s = 0; s < S; s++) {
      const now = waiting.filter((t) => t >= s && t < s + 1); waiting = waiting.filter((t) => t >= s + 1);
      attempts[s] = now.length;
      const refused = Math.max(0, now.length - CAP);
      for (let k = 0; k < refused; k++) waiting.push(s + 1 + (jitter ? r() * 4 : 0.5));
    }
    chart.data.datasets[0].data = attempts as never; chart.update();
    sPeak.v.textContent = fmt(Math.max(...attempts));
  }
  draw();
}
