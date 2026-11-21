import { lib } from "../kit/libs";
import { h, sfx, takeaway, fmt, css } from "../kit/ui";
import { seg, stat } from "../kit/episode";
import { jsonHTML } from "./labs1";

/** The same video as JSON text and as real Protocol Buffers bytes. */
export function protoLab(bench: HTMLElement) {
  const title = h("input#pb-title", { type: "text", value: "How DNS works", "aria-label": "Title", style: "font: 600 0.95rem var(--mono); padding:8px 10px; border-radius:8px; border:1px solid var(--line); background:var(--bg); color:var(--text); width:100%" }) as HTMLInputElement;
  const likes = h("input#pb-likes", { type: "range", min: 0, max: 6, step: 0.01, value: Math.log10(1280) }) as HTMLInputElement;
  const likesOut = h("output", {});
  const schema = h("pre.json", {}, "message Video {\n  int32  id    = 1;\n  string title = 2;\n  int64  likes = 3;\n}");
  const js = h("pre.json", {}), pb = h("pre.json", { style: "color:var(--text)" });
  const sJ = stat("bytes as JSON", "--storage"), sP = stat("bytes as protobuf", "--good");
  const varint = (n: number) => { const out: number[] = []; do { let b = n & 0x7f; n = Math.floor(n / 128); if (n) b |= 0x80; out.push(b); } while (n); return out; };
  function draw() {
    const L = touched ? Math.round(10 ** +likes.value) - (+likes.value === 0 ? 1 : 0) : 1280;
    likesOut.textContent = fmt(L);
    const v = { id: 42, title: title.value, likes: L };
    const jsonText = JSON.stringify(v);
    js.innerHTML = jsonHTML(v);
    const t = new TextEncoder().encode(title.value);
    const fields: [string, number[], string][] = [
      ["--net", [0x08, ...varint(42)], "id: tag 1, varint 42"],
      ["--good", [0x12, ...varint(t.length), ...t], `title: tag 2, length ${t.length}, then the text`],
      ["--storage", [0x18, ...varint(L)], `likes: tag 3, varint ${fmt(L)}`],
    ];
    pb.innerHTML = fields.map(([c, b, d]) => `<span style="color:var(${c})">${b.map((x) => x.toString(16).padStart(2, "0")).join(" ")}</span>  <span style="color:var(--faint)">← ${d}</span>`).join("\n");
    const pbLen = fields.reduce((a, [, b]) => a + b.length, 0), jLen = new TextEncoder().encode(jsonText).length;
    sJ.v.textContent = String(jLen); sP.v.textContent = `${pbLen} (${Math.round((pbLen / jLen) * 100)}%)`;
  }
  let touched = false;
  title.addEventListener("input", draw); likes.addEventListener("input", () => { touched = true; draw(); });
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:10px; align-content:start" }, h("span.eyebrow", {}, "The contract (a .proto schema)"), schema, h("label.field", { for: "pb-title" }, "title", title), h("label.field", { for: "pb-likes" }, h("span", {}, "likes: ", likesOut), likes), h("div.stats", {}, sJ.el, sP.el)),
      h("div", { style: "display:grid; gap:8px; align-content:start" }, h("span.eyebrow", {}, "JSON: text with the names spelled out"), js, h("span.eyebrow", {}, "Protocol Buffers: real bytes, encoded in your browser"), pb),
    ),
    h("p.note", {}, "Protobuf replaces field names with small numbers from the schema and packs numbers into as few bytes as they need (varints). gRPC sends these over HTTP/2."),
    takeaway("gRPC: call a function on another server as if it were local. Smaller, faster and strict, but browsers can't call it directly, and humans can't read the messages."),
  );
  draw();
}

/** Ten videos at a time, with a page token, versus "give me everything". */
export function pageLab(bench: HTMLElement) {
  const TOTAL = 10_000_000;
  let limit = 10, cursor = 0;
  const pick = seg("Page size", [["limit=10", 10], ["limit=50", 50]], limit, (v) => { limit = v; reset(); });
  const list = h("div", { style: "display:grid; gap:4px; max-height:280px; overflow:auto; padding-right:4px" });
  const req = h("pre.json", {});
  const more = h("button.btn.primary", { type: "button" }, "Scroll for more");
  const all = h("button.btn", { type: "button" }, "Ask for everything (no limit)");
  const sGot = stat("videos downloaded", "--good"), sReq = stat("requests", "--net");
  let reqs = 0;
  const token = (n: number) => btoa(`after:${n}`).replace(/=+$/, "");
  function page() {
    const t = cursor ? token(cursor) : "";
    const items = Array.from({ length: limit }, (_, i) => cursor + i + 1);
    cursor += limit; reqs++;
    req.innerHTML = `GET /v1/videos?limit=${limit}${t ? `&page_token=${t}` : ""}\n\n${jsonHTML({ videos: [`…${limit} videos…`], next_page_token: token(cursor) })}`;
    items.forEach((n) => list.append(h("div", { style: "display:flex; gap:8px; align-items:center; font-size:0.82rem; padding:4px 6px; border-radius:6px; background:var(--panel)" }, h("span.mono.faint", {}, `#${fmt(n)}`), `Video ${fmt(n)}`)));
    list.scrollTop = 1e9;
    sGot.v.textContent = fmt(cursor); sReq.v.textContent = String(reqs);
  }
  function reset() { cursor = 0; reqs = 0; list.innerHTML = ""; page(); }
  more.addEventListener("click", () => { page(); sfx("pop", 0.15); });
  all.addEventListener("click", () => {
    req.innerHTML = `GET /v1/videos\n\n<span style="color:var(--bad)">Server: reading ${fmt(TOTAL)} rows… ≈ ${fmt((TOTAL * 300) / 1e9, 1)} GB of JSON…\n504 Gateway Timeout</span>`;
    sfx("powerdown", 0.3);
  });
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:10px; align-content:start" }, pick, h("div.row", {}, more, all), h("div.stats", {}, sGot.el, sReq.el), req),
      h("div", { style: "display:grid; gap:8px" }, h("span.eyebrow", {}, `Maya's home screen · ${fmt(TOTAL)} videos on the server`), list),
    ),
    h("p.note", {}, "The page token tells the server where the last page ended (Google AIP-158 style). About 300 bytes per video is illustrative."),
    takeaway("Give every list a default limit and a page token. Nobody downloads ten million videos at once."),
  );
  reset();
}

/** A payment on a weak connection: retries without and with an idempotency key. */
export function idempotencyLab(bench: HTMLElement) {
  const key = h("input#id-key", { type: "checkbox" }) as HTMLInputElement;
  const pay = h("button.btn.primary", { type: "button", style: "justify-self:start" }, "Pay $85 on a weak connection");
  const log = h("pre.term", { style: "height:200px; white-space:pre-wrap", "aria-live": "polite" });
  const ledger = h("div", { style: "display:grid; gap:6px" });
  const total = stat("charged to Maya", "--good", "$0");
  let charges: string[] = [];
  const seen = new Map<string, string>();
  pay.addEventListener("click", () => {
    charges = []; seen.clear(); log.textContent = ""; ledger.innerHTML = "";
    const k = Math.random().toString(16).slice(2, 10);
    for (let attempt = 1; attempt <= 3; attempt++) {
      log.textContent += `→ POST /v1/payments  {"amount": 8500}${key.checked ? `\n  Idempotency-Key: ${k}` : ""}\n`;
      let result: string;
      if (key.checked && seen.has(k)) result = `${seen.get(k)} (same key: returning the first result)`;
      else { const id = `pay_${charges.length + 1}`; charges.push(id); result = `201 Created ${id}`; if (key.checked) seen.set(k, `201 Created ${id}`); }
      log.textContent += attempt < 3 ? `  server: ${result}\n← (reply lost on the weak connection… the app retries)\n\n` : `  server: ${result}\n← ${result.split(" (")[0]}  ✓ the app finally hears back\n`;
    }
    charges.forEach((c) => ledger.append(h("div.box", { style: `--bc: var(${charges.length > 1 ? "--bad" : "--good"}); min-height:auto; flex-direction:row` }, h("b.mono", {}, c), h("span", {}, "$85.00"))));
    total.v.textContent = `$${charges.length * 85}`; total.v.style.color = charges.length > 1 ? "var(--bad)" : "var(--good)";
    sfx(charges.length > 1 ? "miss" : "hit", 0.25);
  });
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:10px; align-content:start" }, h("label.row", { for: "id-key", style: "gap:8px; color:var(--text)" }, key, "Send an idempotency key with the payment"), pay, total.el, h("span.eyebrow", {}, "The server's ledger"), ledger),
      log,
    ),
    h("p.note", {}, "Idempotency-Key is an IETF draft header; Stripe and many payment APIs use the same idea."),
    takeaway("If the same key arrives twice, the server returns the first result instead of charging again."),
  );
}

/** One buggy app in a tight loop. Rate limits keep everyone else fast. */
export async function rateLab(bench: HTMLElement) {
  const limits = h("input#rl-on", { type: "checkbox" }) as HTMLInputElement;
  const bug = h("input#rl-bug", { type: "checkbox", checked: true }) as HTMLInputElement;
  const sLat = stat("Maya's app: wait per request", "--good"), s429 = stat("429s sent to the buggy app (per second)", "--bad"), sLoad = stat("server load", "--storage");
  const box = h("div.chart-box", { style: "height:220px" }, h("canvas", { "aria-label": "Maya's request time over the last 30 seconds" }));
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:10px; align-content:start" },
        h("label.row", { for: "rl-bug", style: "gap:8px; color:var(--text)" }, bug, "A buggy app calls the API in a tight loop"),
        h("label.row", { for: "rl-on", style: "gap:8px; color:var(--text)" }, limits, "Rate limit: 20 requests per second per client"),
        h("div.stats", {}, sLat.el, s429.el, sLoad.el)),
      box,
    ),
    h("p.note", {}, "Illustrative: the server handles 1,000 requests a second; normal apps send a few; the buggy one sends 5,000. Over-limit requests get 429 Too Many Requests (RFC 6585)."),
    takeaway("Put a rate limit on every client, and answer 429 when they go over. The fuse trips for one appliance, not the whole house."),
  );
  const { Chart } = await lib.chart();
  const data: number[] = Array(30).fill(20);
  const chart = new Chart(box.querySelector("canvas")!, {
    type: "line", data: { labels: data.map((_, i) => (i % 5 === 0 ? `${i - 30} s` : "")), datasets: [{ label: "Maya's request time (ms)", data: [...data], borderColor: css("--good"), borderWidth: 2.5, pointRadius: 0, tension: 0.3 }] },
    options: { maintainAspectRatio: false, animation: false, plugins: { legend: { labels: { color: css("--dim"), boxWidth: 12 } } }, scales: { y: { type: "logarithmic", min: 10, max: 10000, ticks: { color: css("--faint"), callback: (v) => ([10, 100, 1000, 10000].includes(+v) ? `${v} ms` : "") }, grid: { color: "rgba(120,140,220,0.08)" } }, x: { ticks: { color: css("--faint"), autoSkip: false, maxRotation: 0 }, grid: { display: false } } } },
  });
  let vis = false; new IntersectionObserver((e) => (vis = e[0].isIntersecting)).observe(box);
  setInterval(() => {
    if (!vis) return;
    const normal = 30, buggy = bug.checked ? 5000 : 0;
    const accepted = normal + (limits.checked ? Math.min(20, buggy) : buggy);
    const load = accepted / 1000;
    const lat = load < 0.9 ? 20 / (1 - load) : 20 * Math.min(400, 10 + (load - 0.9) * 120);
    data.shift(); data.push(Math.min(9000, lat));
    chart.data.datasets[0].data = [...data] as never; chart.update();
    sLat.v.textContent = `${fmt(Math.min(9000, lat))} ms`; sLat.v.style.color = lat > 200 ? "var(--bad)" : "var(--good)";
    s429.v.textContent = limits.checked ? fmt(Math.max(0, buggy - 20)) : "0";
    sLoad.v.textContent = `${fmt(Math.min(999, load * 100))}%`;
  }, 400);
}

/** No style is perfect: pick the one that fits. */
export function styleLab(bench: HTMLElement) {
  const S = [["REST", "--storage"], ["GraphQL", "--cache"], ["gRPC", "--good"]] as const;
  const Q: [string, number, string][] = [
    ["A public API other companies will build on", 0, "Simple, predictable, easy to cache, works from any language and the browser."],
    ["A phone app with many different screens, each needing a mix of data", 1, "Each screen asks for exactly the fields it needs, in one trip."],
    ["A recommendation service your own servers call a million times a second", 2, "Compact binary messages and generated code, between your own servers."],
    ["A website that wants responses cached by browsers and CDNs", 0, "GET on a URL is the easiest thing in the world to cache."],
    ["Internal services written in five different languages, with a strict contract", 2, "One .proto file generates matching client and server code for each language."],
  ];
  const grid = h("div", { style: "display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr)); gap:10px" });
  const score = h("p.dim", { "aria-live": "polite" }, "Which style fits best?");
  let right = 0, done = 0;
  Q.forEach(([q, a, why]) => {
    const w = h("p.dim", { style: "margin:0; font-size:var(--step--1)", hidden: true }, why);
    const opts = h("div", { style: "display:grid; grid-template-columns:repeat(3,1fr); gap:6px" });
    S.forEach(([n], i) => {
      const b = h("button.btn", { type: "button", style: "justify-content:center; padding:7px" }, n);
      b.addEventListener("click", () => {
        if (opts.dataset.done) return; opts.dataset.done = "1"; done++;
        const ok = i === a; if (ok) right++;
        const g = opts.children[a] as HTMLElement; g.style.borderColor = `var(${S[a][1]})`; g.style.color = `var(${S[a][1]})`;
        if (!ok) b.style.borderColor = "var(--bad)";
        w.hidden = false; sfx(ok ? "hit" : "miss", 0.2);
        score.textContent = `${right} of ${done}` + (done === Q.length ? ". The real skill isn't picking a favourite. It's knowing which one fits." : "");
      });
      opts.append(b);
    });
    grid.append(h("div.q", { style: "align-content:start" }, h("b", {}, q), opts, w));
  });
  bench.append(grid, score, takeaway("REST for public APIs, gRPC between internal services, GraphQL when many different screens need flexible data."));
}
