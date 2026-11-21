import { h, sfx, takeaway, fmt, css } from "../kit/ui";
import { seg, stat, seeded } from "../kit/episode";

/** A stateless server remembers Maya through a cookie her browser carries. */
export function cookieLab(bench: HTMLElement) {
  let jar = "", cart: string[] = [];
  const sessions: Record<string, { who: string; cart: string[] }> = {};
  const log = h("pre.term", { style: "height:220px; white-space:pre-wrap", "aria-live": "polite" });
  const table = h("div.box", { style: "--bc: var(--storage); min-height:auto" });
  const jarEl = h("div.box", { style: "--bc: var(--cache); min-height:auto" });
  const btn = (t: string) => h("button.btn", { type: "button" }, t);
  const bLogin = btn("Log in as Maya"), bCart = btn("Add a ticket to the cart"), bView = btn("Open the cart page"), bClear = btn("Clear cookies");
  const paint = () => {
    jarEl.innerHTML = `<b>Maya's browser · cookie jar</b><span class="mono">${jar ? `session=${jar}` : "(empty)"}</span>`;
    table.innerHTML = `<b>Server · sessions table</b><span class="mono">${Object.entries(sessions).map(([k, v]) => `${k} → ${v.who}, cart: ${v.cart.length}`).join("<br>") || "(nobody)"}</span>`;
  };
  const send = (line: string, reply: string, extra = "") => {
    log.textContent += `→ ${line}\n   Host: shop.example${jar ? `\n   Cookie: session=${jar}` : ""}\n← ${reply}${extra}\n\n`;
    log.scrollTop = 1e9;
  };
  bLogin.addEventListener("click", () => {
    const tok = Math.random().toString(16).slice(2, 10);
    sessions[tok] = { who: "Maya", cart: [] }; jar = tok; cart = sessions[tok].cart;
    send("POST /login", "200 OK", `\n   Set-Cookie: session=${tok}`); paint(); sfx("hit", 0.2);
  });
  bCart.addEventListener("click", () => {
    const s = sessions[jar];
    if (!s) { send("POST /cart", "401 Unauthorized", "  (who are you?)"); sfx("miss", 0.2); return; }
    s.cart.push("ticket"); cart = s.cart; send("POST /cart", "200 OK", `  (cart now has ${cart.length})`); paint(); sfx("pop", 0.2);
  });
  bView.addEventListener("click", () => {
    const s = sessions[jar];
    send("GET /cart", "200 OK", s ? `  (Hi ${s.who}, ${s.cart.length} item${s.cart.length === 1 ? "" : "s"})` : "  (an empty cart: the server has no idea who you are)");
    sfx(s ? "tick" : "miss", 0.15);
  });
  bClear.addEventListener("click", () => { jar = ""; send("(browser deletes its cookies)", "nothing sent"); paint(); sfx("whoosh", 0.2); });
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:10px; align-content:start" }, bLogin, bCart, bView, bClear, jarEl, table),
      log,
    ),
    h("p.note", {}, "Cookies are defined in RFC 6265. Real session tokens are much longer and random."),
    takeaway("Each request still stands alone. It just carries its own proof of who's asking."),
  );
  paint();
}

/** 70 files, three versions of HTTP. A waterfall of when each file finishes. */
export function versionsLab(bench: HTMLElement) {
  let v = "1.0";
  const pick = seg("HTTP version", [["HTTP/1.0", "1.0"], ["HTTP/1.1", "1.1"], ["HTTP/2", "2"], ["HTTP/3", "3"]], v, (x) => { v = x; draw(); sfx("tick", 0.15); });
  const loss = h("input#vr-loss", { type: "checkbox" }) as HTMLInputElement;
  const cv = h("canvas", { width: 640, height: 300, style: "width:100%; height:auto; display:block; border-radius:10px; background:var(--bg); border:1px solid var(--line)", "aria-label": "Waterfall of 70 requests" }) as HTMLCanvasElement;
  const sT = stat("until all 70 files have arrived", "--net"), sC = stat("connections opened", "--storage");
  const say = h("p.dim", { "aria-live": "polite", style: "min-height:3em; margin:0" });
  const RTT = 60, N = 70;
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:12px; align-content:start" }, pick, h("label.row", { for: "vr-loss", style: "gap:8px; color:var(--dim)" }, loss, "One packet is lost early on"), h("div.stats", {}, sT.el, sC.el), say),
      cv,
    ),
    h("p.note", {}, `Simplified: a ${RTT} ms round trip, no encryption, and enough bandwidth that only waiting matters. Each row is one file; the bar ends when it arrives. About 70 requests per page: HTTP Archive Web Almanac 2025.`),
    takeaway("1.1 kept the connection open, 2 sent many requests at once, and 3 runs on QUIC so one lost packet only delays its own file."),
  );
  function plan(): { s: number; e: number }[] {
    const out: { s: number; e: number }[] = [{ s: 0, e: 2 * RTT }];
    const start = 2 * RTT; // the page arrives; now the browser knows what else to ask for
    for (let i = 1; i < N; i++) {
      if (v === "1.0") { const batch = Math.floor((i - 1) / 6); out.push({ s: start + batch * 2 * RTT, e: start + (batch + 1) * 2 * RTT }); }
      else if (v === "1.1") { const k = Math.floor((i - 1) / 6); const s = start + RTT + k * RTT; out.push({ s, e: s + RTT }); } // one handshake per connection, then files one after another
      else { const s = start + (i - 1) * 1.5; out.push({ s, e: s + RTT }); }
    }
    if (loss.checked) {
      const lost = 5;
      if (v === "2" || v === "1.1") out.forEach((r, i) => { if (i >= lost && (v === "2" || (i - 1) % 6 === (lost - 1) % 6)) r.e += RTT * 1.5; });
      else out[lost].e += RTT * 1.5;
    }
    return out;
  }
  function draw() {
    const rows = plan(), end = Math.max(...rows.map((r) => r.e));
    const g = cv.getContext("2d")!, W = cv.width, H = cv.height, L = 8, T = 10;
    const x = (t: number) => L + (t / 1700) * (W - L - 10);
    g.clearRect(0, 0, W, H);
    g.strokeStyle = css("--line"); g.fillStyle = css("--faint"); g.font = "11px JetBrains Mono, monospace";
    for (let t = 0; t <= 1600; t += 200) { g.beginPath(); g.moveTo(x(t), T); g.lineTo(x(t), H - 18); g.stroke(); g.fillText(`${t} ms`, x(t) + 2, H - 5); }
    const rh = (H - 30 - T) / N;
    rows.forEach((r, i) => { g.fillStyle = i === 0 ? css("--good") : loss.checked && r.e - r.s > RTT * 1.6 ? css("--bad") : css(v === "3" ? "--cache" : "--net"); g.fillRect(x(r.s), T + i * rh, Math.max(2, x(r.e) - x(r.s)), Math.max(1.5, rh - 1)); });
    sT.v.textContent = `${fmt(end)} ms`;
    sC.v.textContent = v === "1.0" ? "70" : v === "1.1" ? "6" : "1";
    say.textContent = v === "1.0" ? "A fresh connection for every file, six at a time. Each one pays for a handshake first." : v === "1.1" ? "Six connections kept open, but each one carries its files one after another." : v === "2" ? (loss.checked ? "Everything on one connection, so one lost packet stalls every file behind it." : "Many requests at once on one connection, woven together.") : loss.checked ? "QUIC over UDP: the lost packet only delays its own file." : "Like HTTP/2, but on QUIC. About a fifth of web requests to Cloudflare use it.";
  }
  loss.addEventListener("change", () => { draw(); sfx("tick", 0.15); });
  draw();
}

/** Give up, wait, or retry? And is it safe to repeat? */
export function retryLab(bench: HTMLElement) {
  const OPTS = ["Give up", "Wait, then try again", "Try again: it's safe", "Don't repeat it blindly"];
  const Q: [string, number, string][] = [
    ["404 Not Found", 0, "The page doesn't exist. Trying again won't help."],
    ["429 Too Many Requests", 1, "Slow down and wait. Retrying straight away makes it worse."],
    ["503 Service Unavailable", 1, "Overloaded or in maintenance. Try again a little later."],
    ["GET /videos timed out", 2, "GET only reads. Asking twice changes nothing, so it's safe to repeat."],
    ["DELETE /cart/7 timed out", 2, "Deleting the same thing twice leaves the same result."],
    ["POST /payments timed out", 3, "POST creates something new. Repeat it and Maya might pay twice. (Episode 10 shows the fix.)"],
  ];
  const grid = h("div", { style: "display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr)); gap:10px" });
  const score = h("p.dim", { "aria-live": "polite" }, "What should the app do next?");
  let right = 0, done = 0;
  Q.forEach(([q, a, why]) => {
    const why_ = h("p.dim", { style: "margin:0; font-size:var(--step--1)", hidden: true }, why);
    const opts = h("div", { style: "display:grid; grid-template-columns:1fr 1fr; gap:6px" });
    OPTS.forEach((o, i) => {
      const b = h("button.btn", { type: "button", style: "justify-content:center; font-size:0.78rem; padding:7px" }, o);
      b.addEventListener("click", () => {
        if (opts.dataset.done) return; opts.dataset.done = "1"; done++;
        const ok = i === a; if (ok) right++;
        (opts.children[a] as HTMLElement).style.borderColor = "var(--good)"; (opts.children[a] as HTMLElement).style.color = "var(--good)";
        if (!ok) b.style.borderColor = "var(--bad)";
        why_.hidden = false; sfx(ok ? "hit" : "miss", 0.2);
        score.textContent = `${right} of ${done}` + (done === Q.length ? ". Status codes and methods tell every app whether to give up, wait, or retry." : "");
      });
      opts.append(b);
    });
    grid.append(h("div.q", { style: "align-content:start" }, h("b.mono", {}, q), opts, why_));
  });
  bench.append(grid, score, h("p.note", {}, "GET, PUT and DELETE are idempotent: repeating them has the same effect as doing them once (RFC 9110 §9.2.2)."),
    takeaway("The codes tell the browser, and every app, whether to give up, wait, or retry."));
}

/** Plain text on café Wi-Fi, and a server that can never speak first. */
export function limitsLab(bench: HTMLElement) {
  const https = h("input#lm-https", { type: "checkbox" }) as HTMLInputElement;
  const tamper = h("button.btn", { type: "button" }, "Someone on the Wi-Fi changes the page");
  const sees = h("pre.term", { style: "height:150px; white-space:pre-wrap" });
  const page = h("div.box", { style: "--bc: var(--good); min-height:auto" });
  function draw() {
    sees.style.color = https.checked ? "var(--faint)" : "var(--bad)";
    sees.textContent = https.checked ? "▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒\n▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒\n(sealed: unreadable, and any change is detected)" : "POST /login HTTP/1.1\nHost: shop.example\nCookie: session=7f3a9c…\n\nuser=maya&password=correct-horse";
    page.innerHTML = "<b>The page Maya sees</b><span>Download our app: <u>shop.example/app</u></span>"; page.style.setProperty("--bc", "var(--good)");
  }
  tamper.addEventListener("click", () => {
    if (https.checked) { page.innerHTML = "<b>The page Maya sees</b><span>The change broke the seal, so the browser rejected it. Maya sees the real page.</span>"; sfx("hit", 0.2); }
    else { page.style.setProperty("--bc", "var(--bad)"); page.innerHTML = '<b style="color:var(--bad)">The page Maya sees</b><span>Download our app: <u>evil.example/app</u> · and neither side noticed</span>'; sfx("miss", 0.2); }
  });
  https.addEventListener("change", () => { draw(); sfx("tick", 0.15); });
  // polling vs WebSocket
  let poll = 5;
  const pickPoll = seg("How often the page asks", [["every 2 s", 2], ["every 5 s", 5], ["every 15 s", 15]], poll, (x) => { poll = x; runChat(); });
  const sPoll = stat("average delay with asking", "--storage"), sWs = stat("average delay with a WebSocket", "--good"), sReq = stat("requests per minute while asking", "--dim");
  function runChat() {
    const r = seeded(5); const msgs = Array.from({ length: 40 }, () => r() * 600);
    const delay = msgs.reduce((s, t) => s + (Math.ceil(t / poll) * poll - t), 0) / msgs.length;
    sPoll.v.textContent = `${fmt(delay, 1)} s`; sWs.v.textContent = "≈ 0 s"; sReq.v.textContent = fmt(60 / poll);
  }
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:10px; align-content:start" }, h("span.eyebrow", {}, "Limit 1 · everyone in between can read it"),
        h("label.row", { for: "lm-https", style: "gap:8px; color:var(--text)" }, https, "Seal it inside encryption (HTTPS)"), sees, tamper, page),
      h("div", { style: "display:grid; gap:10px; align-content:start" }, h("span.eyebrow", {}, "Limit 2 · the server can never speak first"),
        h("p.dim", { style: "margin:0" }, "A chat message arrives on the server. Without a WebSocket, Maya only sees it the next time her page asks."), pickPoll, h("div.stats", {}, sPoll.el, sWs.el, sReq.el)),
    ),
    h("p.note", {}, "40 messages at random moments over 10 minutes. WebSockets start as one HTTP request asking to upgrade (RFC 6455)."),
    takeaway("HTTPS seals the conversation. WebSockets keep the line open both ways, so the server can push."),
  );
  draw(); runChat();
}
