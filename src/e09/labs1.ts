import { h, sfx, takeaway, fmt, sleep, reducedMotion } from "../kit/ui";
import { seg, stat } from "../kit/episode";

const STOPS = [
  { n: "Browser", d: "works out what you typed", c: "--net" },
  { n: "DNS", d: "name → address", c: "--cache" },
  { n: "Connect", d: "TCP handshake", c: "--storage" },
  { n: "Lock", d: "TLS handshake", c: "--good" },
  { n: "Ask + answer", d: "HTTP inside the lock", c: "--ram" },
  { n: "Draw", d: "pixels on screen", c: "--cpu" },
];

/** Hero: press Enter and watch the six stops light up against a one-second budget. */
export function sixStopsHero() {
  const RTT = 30; // a nearby Google server, illustrative
  const cost = [2, 20, RTT, RTT, RTT + 40, 120];
  const stops = h("div.stops", {}, ...STOPS.map((s, i) => h("div", { style: `--sc: var(${s.c})` }, h("b", {}, String(i + 1)), h("span", {}, s.n), h("br"), h("span.faint", { style: "font-size:0.68rem" }, s.d))));
  const bar = h("div", { style: "display:flex; height:16px; border-radius:8px; overflow:hidden; background:var(--line)" });
  const clock = h("span.v.tnum", { style: "color:var(--good)" }, "0 ms");
  const addr = h("div", { style: "font: 600 var(--step-1) var(--mono); padding:10px 14px; border-radius:12px; border:1px solid var(--line); background:var(--bg); display:flex; gap:8px; align-items:center" }, h("span", { style: "color:var(--faint)" }, "🔒"), h("span", {}, "google.com"), h("span.blink", { style: "color:var(--net)" }, "▍"));
  const enter = h("button.btn.primary", { type: "button" }, "Press Enter ⏎");
  const say = h("p.dim", { "aria-live": "polite", style: "min-height:3em; margin:0" }, "Maya is in a café. She types google.com.");
  let busy = false;
  enter.addEventListener("click", async () => {
    if (busy) return; busy = true;
    [...stops.children].forEach((c) => c.classList.remove("on")); bar.innerHTML = "";
    let t = 0; const total = cost.reduce((a, b) => a + b, 0);
    for (let i = 0; i < 6; i++) {
      stops.children[i].classList.add("on");
      const seg_ = h("i", { style: `display:block; height:100%; width:0%; background:var(${STOPS[i].c}); transition:width ${reducedMotion() ? 0 : 0.35}s` });
      bar.append(seg_); requestAnimationFrame(() => (seg_.style.width = `${(cost[i] / total) * 100}%`));
      say.textContent = `Stop ${i + 1}: ${STOPS[i].n}, ${STOPS[i].d}.`;
      sfx(i === 3 ? "hit" : "tick", 0.15);
      const t0 = t; t += cost[i];
      for (let k = 1; k <= 8; k++) { clock.textContent = `${fmt(t0 + ((t - t0) * k) / 8)} ms`; await sleep(reducedMotion() ? 0 : 55); }
    }
    say.textContent = `Page on screen in about ${fmt(total)} ms. Stop 4 is new: that's where we'll slow down.`;
    busy = false;
  });
  const el = h("div.bench", { style: "display:grid; gap:12px" }, addr, enter, stops, bar, h("div.row", { style: "justify-content:space-between" }, say, h("div.stat", {}, clock, h("span.k", {}, "since Enter"))),
    h("p.note", { style: "margin:0" }, "Illustrative first visit to a server about 30 ms away; real times vary with distance and device."));
  const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) { io.disconnect(); setTimeout(() => enter.click(), 500); } });
  io.observe(el);
  return el;
}

/** The time budget: first visit vs repeat visit, TLS 1.2 vs 1.3, near vs far. */
export function budgetLab(bench: HTMLElement) {
  let rtt = 30, tls = 1, repeat = false;
  const pR = seg("Distance to the server", [["Same city · 10 ms", 10], ["Nearby · 30 ms", 30], ["Other side of the world · 150 ms", 150]], rtt, (v) => { rtt = v; draw(); });
  const pT = seg("TLS version", [["TLS 1.3 · 1 round trip", 1], ["TLS 1.2 · 2 round trips", 2]], tls, (v) => { tls = v; draw(); });
  const rep = h("input#bg-rep", { type: "checkbox" }) as HTMLInputElement;
  const rows = h("div.meters", {});
  const total = stat("from Enter to a usable page", "--good");
  function draw() {
    repeat = rep.checked;
    const parts: [string, number, string][] = [
      ["Browser", 2, "--net"],
      ["DNS", repeat ? 1 : 20, "--cache"],
      ["Connect (TCP)", repeat ? 0 : rtt, "--storage"],
      ["Lock (TLS)", repeat ? rtt : tls * rtt, "--good"],
      ["Ask + answer", rtt + 40, "--ram"],
      ["Draw", 120, "--cpu"],
    ];
    const sum = parts.reduce((a, [, v]) => a + v, 0);
    rows.innerHTML = "";
    parts.forEach(([n, v, c]) => { const i = h("i", { style: `width:${(v / 600) * 100}%; background:var(${c})` }); rows.append(h("div.meter", { style: "grid-template-columns: 8em minmax(0,1fr) 5em" }, h("span", {}, n), h("div.track", {}, i), h("b", {}, `${fmt(v)} ms`))); });
    total.v.textContent = `${fmt(sum)} ms`;
    total.v.style.color = sum < 1000 ? "var(--good)" : "var(--bad)";
    sfx("tick", 0.1);
  }
  rep.addEventListener("change", draw);
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:12px; align-content:start" }, pR, pT, h("label.row", { for: "bg-rep", style: "gap:8px; color:var(--text)" }, rep, "Repeat visit: DNS cached, QUIC instead of TCP"), total.el),
      rows,
    ),
    h("p.note", {}, "Illustrative model. On repeat visits QUIC combines the connection and the lock into one round trip. Drawing time depends heavily on the page and the device."),
    takeaway("All six stops usually fit in well under a second. Round trips are the biggest lever."),
  );
  draw();
}

/** Stop 1: website or search? */
export function addressBarLab(bench: HTMLElement) {
  const input = h("input#ab-in", { type: "text", value: "google.com", spellcheck: "false", autocomplete: "off", "aria-label": "What Maya types", style: "font: 600 var(--step-0) var(--mono); padding:10px 12px; border-radius:10px; border:1px solid var(--line); background:var(--bg); color:var(--text); width:100%" }) as HTMLInputElement;
  const out = h("div.box", { style: "min-height:auto" });
  const tries = h("div.row", { style: "gap:6px" }, ...["google.com", "how tall is everest", "example.org/news", "http://example.com", "localhost:3000", "hello"].map((t) => { const b = h("button.btn", { type: "button", style: "font-family:var(--mono); font-size:0.8rem" }, t); b.addEventListener("click", () => { input.value = t; draw(); sfx("tick", 0.15); }); return b; }));
  function draw() {
    const v = input.value.trim();
    const explicit = /^[a-z]+:\/\//i.test(v);
    const host = v.replace(/^[a-z]+:\/\//i, "").split(/[/?#]/)[0];
    const looksDomain = !/\s/.test(v) && (/^[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?$/i.test(host) || /^localhost(:\d+)?$/i.test(host));
    if (!v) { out.innerHTML = "<b>Type something</b>"; return; }
    if (looksDomain) {
      const url = explicit ? v : `https://${v}${v.includes("/") ? "" : "/"}`;
      out.style.setProperty("--bc", "var(--good)");
      out.innerHTML = `<b>A website</b><span class="mono" style="color:var(--text)">${url.replace(/</g, "&lt;")}</span><span>${explicit && v.startsWith("http:") ? "You typed http:// yourself, so the browser uses it, and warns you the page isn't secure." : "The browser fills in the rest and tries the secure version, HTTPS, first."}</span>`;
    } else {
      out.style.setProperty("--bc", "var(--net)");
      out.innerHTML = `<b>A search</b><span class="mono" style="color:var(--text)">https://www.google.com/search?q=${encodeURIComponent(v)}</span><span>No dot that looks like a domain, so it goes to the search engine.</span>`;
    }
  }
  input.addEventListener("input", draw);
  bench.append(
    h("div.bench-grid", {}, h("div", { style: "display:grid; gap:10px; align-content:start" }, h("label.eyebrow", { for: "ab-in" }, "Type into the address bar"), input, tries), out),
    h("p.note", {}, "Simplified version of the browser's rules. Chrome has tried HTTPS first by default since 2021."),
    takeaway("Before anything leaves the laptop, the browser decides what you meant and checks its own memory."),
  );
  draw();
}

/** Stop 4, part one: a real shared key (AES-GCM, in your browser) and what an eavesdropper sees. */
export async function sharedKeyLab(bench: HTMLElement) {
  const msg = h("textarea#sk-msg", { rows: 3, style: "width:100%; font: 500 0.9rem var(--mono); padding:10px; border-radius:10px; border:1px solid var(--line); background:var(--bg); color:var(--text); resize:vertical", "aria-label": "Maya's message" }, "search: best coffee near me") as HTMLTextAreaElement;
  const wire = h("pre.json", { style: "min-height:90px", "aria-label": "What travels over the café Wi-Fi" });
  const server = h("div.box", { style: "--bc: var(--good); min-height:auto" });
  const enc = h("button.btn.primary", { type: "button" }, "Lock and send");
  const flip = h("button.btn", { type: "button" }, "Someone flips one bit on the way");
  const wrongKey = h("button.btn", { type: "button" }, "Eavesdropper tries a guessed key");
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:10px; align-content:start" }, h("label.eyebrow", { for: "sk-msg" }, "Maya's laptop"), msg, h("div.row", {}, enc, flip, wrongKey)),
      h("div", { style: "display:grid; gap:10px; align-content:start" }, h("span.eyebrow", {}, "On the café Wi-Fi"), wire, h("span.eyebrow", {}, "Google's server, holding the same key"), server),
    ),
    h("p.note", {}, "This runs real AES-256-GCM in your browser with the Web Crypto API: the same kind of cipher HTTPS uses after the handshake. A fresh random key is made each time you load the page."),
    takeaway("With a shared key, the traffic is just noise to anyone else, and any change is caught. The hard part is sharing the key."),
  );
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) { wire.textContent = "Your browser blocks the Web Crypto API on this page (it needs HTTPS)."; return; }
  const key = await subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  let iv = new Uint8Array(12), ct = new Uint8Array(0);
  const hex = (b: Uint8Array) => [...b].map((x) => x.toString(16).padStart(2, "0")).join(" ");
  async function deliver(k: CryptoKey, note: string) {
    try { const pt = await subtle!.decrypt({ name: "AES-GCM", iv }, k, ct); server.style.setProperty("--bc", "var(--good)"); server.innerHTML = `<b style="color:var(--good)">Unlocked</b><span class="mono" style="color:var(--text)">${new TextDecoder().decode(pt).replace(/</g, "&lt;")}</span>`; sfx("hit", 0.2); }
    catch { server.style.setProperty("--bc", "var(--bad)"); server.innerHTML = `<b style="color:var(--bad)">Rejected</b><span>${note}</span>`; sfx("miss", 0.2); }
  }
  enc.addEventListener("click", async () => {
    iv = crypto.getRandomValues(new Uint8Array(12));
    ct = new Uint8Array(await subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(msg.value)));
    wire.textContent = hex(ct); await deliver(key, "");
  });
  flip.addEventListener("click", async () => { if (!ct.length) return; ct[0] ^= 1; wire.textContent = hex(ct) + "\n(first bit flipped)"; await deliver(key, "The check stamped on the message no longer matches. One flipped bit, and the whole message is thrown away."); });
  wrongKey.addEventListener("click", async () => { if (!ct.length) return; const guess = await subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["decrypt"]); await deliver(guess, "Wrong key: there are 2²⁵⁶ possible keys, far too many to try."); });
  enc.click();
}

/** Mixing a secret in public, with paint, then with real (tiny) numbers. */
export function paintLab(bench: HTMLElement) {
  const PALETTE = ["#ef4444", "#3b82f6", "#a855f7", "#10b981", "#f97316", "#ec4899"];
  const YELLOW = "#facc15";
  let m = PALETTE[0], s = PALETTE[1];
  const hx = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const mix = (cs: string[], w: number[]) => { const rgb = [0, 1, 2].map((k) => Math.round(cs.reduce((a, c, i) => a + hx(c)[k] * w[i], 0) / w.reduce((a, b) => a + b, 0))); return `#${rgb.map((x) => x.toString(16).padStart(2, "0")).join("")}`; };
  const sw = (c: string, label: string) => h("div", { style: "display:grid; justify-items:center; gap:4px; font-size:0.72rem; color:var(--dim); text-align:center" }, h("div.swatch", { style: `background:${c}` }), label);
  const pickRow = (who: string, set: (c: string) => void) => h("div.row", { style: "gap:6px" }, h("span", { style: "width:6.5em; font-size:var(--step--1)" }, who), ...PALETTE.map((c) => { const b = h("button", { type: "button", style: `width:28px; height:28px; border-radius:50%; background:${c}; border:2px solid var(--line); cursor:pointer`, "aria-label": `${who} picks ${c}` }); b.addEventListener("click", () => { set(c); draw(); sfx("pop", 0.15); }); return b; }));
  const stage = h("div", { style: "display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; align-items:start" });
  const eaves = h("p.dim", { style: "margin:0" });
  // numbers version
  const a = h("input#pt-a", { type: "range", min: 2, max: 21, step: 1, value: 6 }) as HTMLInputElement;
  const b = h("input#pt-b", { type: "range", min: 2, max: 21, step: 1, value: 15 }) as HTMLInputElement;
  const nums = h("pre.json", {});
  const pw = (g: number, e: number, p: number) => { let r = 1; for (let i = 0; i < e; i++) r = (r * g) % p; return r; };
  function draw() {
    const mm = mix([YELLOW, m], [1, 1]), sm = mix([YELLOW, s], [1, 1]);
    const fm = mix([sm, m], [2, 1]), fs = mix([mm, s], [2, 1]);
    stage.innerHTML = "";
    stage.append(
      h("div", { style: "display:grid; gap:8px; justify-items:center" }, h("b", {}, "Maya"), sw(m, "her secret"), sw(mm, "sends: yellow + secret"), sw(fm, "adds her secret to the server's mix")),
      h("div", { style: "display:grid; gap:8px; justify-items:center" }, h("b", { style: "color:var(--bad)" }, "Café Wi-Fi sees"), sw(YELLOW, "the public yellow"), sw(mm, "Maya's mix"), sw(sm, "the server's mix")),
      h("div", { style: "display:grid; gap:8px; justify-items:center" }, h("b", {}, "Google's server"), sw(s, "its secret"), sw(sm, "sends: yellow + secret"), sw(fs, "adds its secret to Maya's mix")),
    );
    eaves.innerHTML = fm === fs ? `<b style="color:var(--good)">Both end up with the same colour.</b> The listener saw yellow and both mixtures, but you can't unmix paint.` : "";
    const p = 23, g = 5, A = pw(g, +a.value, p), B = pw(g, +b.value, p);
    nums.textContent = `public:   p = 23, g = 5\nMaya:     secret a = ${a.value}   sends A = 5^${a.value} mod 23 = ${A}\nServer:   secret b = ${b.value}   sends B = 5^${b.value} mod 23 = ${B}\nMaya:     B^a mod 23 = ${pw(B, +a.value, p)}\nServer:   A^b mod 23 = ${pw(A, +b.value, p)}   ← the same shared secret\nListener: sees 23, 5, ${A}, ${B} and has to guess a or b.`;
  }
  [a, b].forEach((x) => x.addEventListener("input", draw));
  bench.append(
    h("div", { style: "display:grid; gap:10px" }, pickRow("Maya picks", (c) => (m = c)), pickRow("Server picks", (c) => (s = c)), stage, eaves),
    h("div.bench-grid", { style: "margin-top:16px" },
      h("div", { style: "display:grid; gap:10px; align-content:start" }, h("span.eyebrow", {}, "The same trick with real (tiny) maths"),
        h("label.field", { for: "pt-a" }, "Maya's secret a", a), h("label.field", { for: "pt-b" }, "Server's secret b", b)),
      nums,
    ),
    h("p.note", {}, "This is Diffie–Hellman key exchange (1976). Real keys use numbers hundreds of digits long, or elliptic curves, so guessing the secret is hopeless. Here p = 23, so you could guess it by hand."),
    takeaway("Two strangers can agree on a secret while everyone listens. That's a key exchange."),
  );
  draw();
}
