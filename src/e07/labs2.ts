import { lib } from "../kit/libs";
import { h, sfx, takeaway, fmt, css, reducedMotion } from "../kit/ui";
import { seg, stat, seeded } from "../kit/episode";

const MISS = 90, HIT = 2; // ms, illustrative

/** Every answer comes with a time to live. Watch 60 visitors over two hours, hit or miss. */
export function cacheLab(bench: HTMLElement) {
  let ttl = 300;
  const pick = seg("Time to live", [["1 minute", 60], ["5 minutes", 300], ["1 hour", 3600], ["1 day", 86400]], ttl, (v) => { ttl = v; draw(); sfx("tick", 0.15); });
  const strip = h("div", { style: "display:flex; flex-wrap:wrap; gap:4px", role: "img", "aria-label": "Each visitor's lookup, hit or miss" });
  const sHit = stat("of lookups answered from the cache", "--good"), sAvg = stat("average lookup time", "--net"), sAsk = stat("questions sent to the real servers", "--storage");
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:12px; align-content:start" }, h("span.eyebrow", {}, "How long the resolver may reuse the answer"), pick, h("div.stats", {}, sHit.el, sAvg.el, sAsk.el)),
      h("div", { style: "display:grid; gap:8px; align-content:start" }, h("span.eyebrow", {}, "60 visitors over two hours, in arrival order"), strip,
        h("div.row", { style: "gap:6px" }, h("span.chip", { style: "color:var(--good)" }, h("i"), "cache hit, ~2 ms"), h("span.chip", { style: "color:var(--storage)" }, h("i"), "miss: walk the servers, ~90 ms"))),
    ),
    h("p.note", {}, "Visitor times and lookup times are illustrative. A longer time to live means fewer walks, but a change takes longer to reach everyone (lab 7)."),
    takeaway("Most lookups never leave the cache, and come back in a few milliseconds."),
  );
  const r = seeded(17);
  const times = Array.from({ length: 60 }, () => r() * 7200).sort((a, b) => a - b);
  function draw() {
    strip.innerHTML = "";
    let cachedAt = -Infinity, hits = 0, total = 0;
    for (const t of times) {
      const hit = t - cachedAt < ttl;
      if (!hit) cachedAt = t; else hits++;
      total += hit ? HIT : MISS;
      strip.append(h("i", { style: `display:block; width:14px; height:22px; border-radius:4px; background:var(${hit ? "--good" : "--storage"})`, title: `${fmt(t / 60)} min: ${hit ? "hit" : "miss"}` }));
    }
    sHit.v.textContent = `${Math.round((hits / 60) * 100)}%`;
    sAvg.v.textContent = `${fmt(total / 60)} ms`;
    sAsk.v.textContent = String(60 - hits);
  }
  draw();
}

/** Where does Maya's answer come from? Switch the caches on and off. */
export function layersLab(bench: HTMLElement) {
  const C = [
    { k: "browser", t: "Her browser remembers example.com", ms: 0 },
    { k: "os", t: "Her laptop remembers it", ms: 0 },
    { k: "res", t: "The resolver has a fresh answer", ms: 2 },
    { k: "tld", t: "The resolver knows who runs .com", ms: 0 },
  ];
  const boxes = C.map((c) => h(`input#ly-${c.k}`, { type: "checkbox", checked: c.k === "tld" }) as HTMLInputElement);
  const path = h("ol.hops", {});
  const big = stat("before the connection can even start", "--net");
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:10px; align-content:start" }, ...C.map((c, i) => h("label.row", { for: boxes[i].id, style: "gap:8px; color:var(--text)" }, boxes[i], c.t)), big.el),
      h("div", { style: "display:grid; gap:8px; align-content:start" }, h("span.eyebrow", {}, "Where the question goes"), path),
    ),
    h("p.note", {}, "Times are illustrative: about 2 ms to a nearby resolver, about 30 ms for each server it has to ask."),
    takeaway("Only after the address comes back can the TCP handshake from Episode 6 begin."),
  );
  function draw() {
    const [b, o, r, t] = boxes.map((x) => x.checked);
    const steps: [string, string][] = [["Browser's memory", b ? "found it" : "nothing"]];
    let ms = 0;
    if (!b) { steps.push(["Laptop's memory", o ? "found it" : "nothing"]); }
    if (!b && !o) { steps.push(["Resolver", r ? "cached answer" : "no answer: walk the tree"]); ms += 2; }
    if (!b && !o && !r) { if (!t) { steps.push(["Root server", "ask .com"]); ms += 30; } steps.push([".com servers", "ask example.com's servers"]); ms += 30; steps.push(["example.com's server", "203.0.113.10"]); ms += 30; }
    path.innerHTML = "";
    steps.forEach(([a, z], i) => path.append(h("li.on", { style: `--hc: var(${i === steps.length - 1 ? "--good" : "--net"})` }, h("span.n", {}, String(i + 1)), h("b", {}, a), h("span.faint", {}, ` · ${z}`))));
    big.v.textContent = ms === 0 ? "≈ 0 ms" : `≈ ${ms} ms`;
  }
  boxes.forEach((x) => x.addEventListener("change", () => { draw(); sfx("tick", 0.15); }));
  draw();
}

/** Root servers vs a single DNS provider: where the real weak spot is. */
export function outageLab(bench: HTMLElement) {
  const two = h("input#ou-two", { type: "checkbox" }) as HTMLInputElement;
  const attack = h("button.btn.primary", { type: "button" }, "Flood DNS provider A");
  const heal = h("button.btn", { type: "button" }, "Stop the attack");
  const sites = [["example.com", false], ["shop.example", false], ["news.example", false], ["tixrush.example", true]] as const;
  const list = h("div", { style: "display:grid; gap:6px" });
  let down = false;
  function draw() {
    list.innerHTML = "";
    sites.forEach(([name, canTwo]) => {
      const hasTwo = canTwo && two.checked;
      const ok = !down || hasTwo;
      list.append(h("div.box", { style: `--bc: var(${ok ? "--good" : "--bad"}); min-height:auto; flex-direction:row` }, h("b.mono", {}, name), h("span", {}, `${hasTwo ? "providers A + B" : "provider A only"} · ${ok ? "reachable" : "can't be found"}`)));
    });
  }
  attack.addEventListener("click", () => { down = true; draw(); sfx("powerdown", 0.3); });
  heal.addEventListener("click", () => { down = false; draw(); sfx("hit", 0.2); });
  two.addEventListener("change", () => { draw(); sfx("tick", 0.15); });
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:12px; align-content:start" },
        h("div.stats", {}, h("div.stat", {}, h("span.v.tnum", { style: "color:var(--storage)" }, "13"), h("span.k", {}, "root server names")), h("div.stat", {}, h("span.v.tnum", { style: "color:var(--cache)" }, "12"), h("span.k", {}, "independent operators")), h("div.stat", {}, h("span.v.tnum", { style: "color:var(--good)" }, "≈ 2,000"), h("span.k", {}, "copies worldwide; the nearest one answers"))),
        h("p.dim", { style: "margin:0" }, "The root isn't the weak spot. A company that answers DNS for thousands of websites is. In 2016 a flood from hacked cameras and home routers hit one such company, Dyn."),
        h("label.row", { for: "ou-two", style: "gap:8px; color:var(--text)" }, two, "tixrush.example also uses a second DNS provider"),
        h("div.row", {}, attack, heal)),
      list,
    ),
    h("p.note", {}, "Root server figures: root-servers.org. The sites here are made-up examples."),
    takeaway("Big companies use more than one DNS provider, so one attack can't make them disappear."),
  );
  draw();
}

/** Change an address and watch old answers live on until their time to live runs out. Chart.js. */
export async function propagationLab(bench: HTMLElement) {
  let ttl = 86400;
  const pick = seg("Time to live on the old answer", [["1 day", 86400], ["1 hour", 3600], ["5 minutes", 300]], ttl, (v) => { ttl = v; draw(); sfx("tick", 0.15); });
  const say = h("p.dim", { "aria-live": "polite", style: "min-height:3em" });
  const box = h("div.chart-box", { style: "height:240px" }, h("canvas", { "aria-label": "Share of visitors reaching the new address over time" }));
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:12px; align-content:start" }, h("span.eyebrow", {}, "example.com moves from 203.0.113.10 to 203.0.113.99"), pick, say),
      box,
    ),
    h("p.note", {}, "Each of 1,000 resolvers cached the old answer at a random moment before the switch. Engineers lower the TTL a day ahead, so the switch spreads in minutes."),
    takeaway("A change 'takes time to propagate' because old answers live on until their time to live runs out."),
  );
  const { Chart } = await lib.chart();
  const hours = Array.from({ length: 49 }, (_, i) => i / 2);
  const chart = new Chart(box.querySelector("canvas")!, {
    type: "line",
    data: { labels: hours.map((x) => (x % 4 === 0 ? `${x} h` : "")), datasets: [{ label: "visitors reaching the new address", data: [], borderColor: css("--good"), backgroundColor: "rgba(74,222,128,0.12)", fill: true, pointRadius: 0, borderWidth: 2.5, stepped: false }] },
    options: { maintainAspectRatio: false, animation: { duration: reducedMotion() ? 0 : 500 }, plugins: { legend: { labels: { color: css("--dim"), boxWidth: 12 } } }, scales: { y: { min: 0, max: 100, ticks: { color: css("--faint"), callback: (v) => `${v}%` }, grid: { color: "rgba(120,140,220,0.08)" } }, x: { title: { display: true, text: "hours after the switch", color: css("--dim") }, ticks: { color: css("--faint"), autoSkip: false, maxRotation: 0 }, grid: { display: false } } } },
  });
  function draw() {
    // a resolver that cached at a uniformly random moment within the TTL expires at a uniform time in [0, ttl]
    const pct = hours.map((x) => Math.min(100, ((x * 3600) / ttl) * 100));
    chart.data.datasets[0].data = pct as never; chart.update();
    say.textContent = ttl >= 86400 ? "With a one-day time to live, some visitors still reach the old server a full day later." : ttl >= 3600 ? "With one hour, everyone has the new address within the hour." : "Five minutes: lowered the day before, so the switch reaches everyone almost at once.";
  }
  draw();
}

/** Who can see your lookups, and can anyone fake an answer? */
export function privacyLab(bench: HTMLElement) {
  const doh = h("input#pv-doh", { type: "checkbox" }) as HTMLInputElement;
  const sec = h("input#pv-sec", { type: "checkbox" }) as HTMLInputElement;
  const fake = h("button.btn", { type: "button" }, "Someone sends a fake answer");
  const watcher = h("div.logs", { style: "height:150px; white-space:pre-wrap", "aria-label": "What someone on the café Wi-Fi sees" });
  const result = h("p", { "aria-live": "polite", style: "min-height:3em; margin:0" });
  const names = ["mybank.example", "health-clinic.example", "news.example", "jobs.example", "dating.example"];
  function draw() {
    watcher.innerHTML = "";
    names.forEach((n) => watcher.append(h("div", { class: doh.checked ? "ok" : "err" }, doh.checked ? "TLS · ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒" : `DNS question: where is ${n}?`)));
  }
  fake.addEventListener("click", () => {
    if (sec.checked) { result.innerHTML = '<b style="color:var(--good)">Signature check failed. The fake answer is thrown away.</b>'; sfx("hit", 0.25); }
    else { result.innerHTML = '<b style="color:var(--bad)">Maya\'s laptop believes it.</b> mybank.example now points at someone else\'s server.'; sfx("miss", 0.25); }
  });
  doh.addEventListener("change", () => { draw(); sfx("tick", 0.15); });
  sec.addEventListener("change", () => { result.textContent = ""; sfx("tick", 0.15); });
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:12px; align-content:start" },
        h("label.row", { for: "pv-doh", style: "gap:8px; color:var(--text)" }, doh, "Send DNS questions inside HTTPS (DNS over HTTPS)"),
        h("label.row", { for: "pv-sec", style: "gap:8px; color:var(--text)" }, sec, "Each level signs its answers (DNSSEC)"),
        fake, result),
      h("div", { style: "display:grid; gap:8px" }, h("span.eyebrow", {}, "What someone on the café Wi-Fi sees"), watcher),
    ),
    h("p.note", {}, "Classic DNS travels unencrypted (RFC 7626). DNS over HTTPS is RFC 8484; DNSSEC is RFC 4033. Encryption hides the questions; signatures catch fake answers. You need both."),
    takeaway("Classic DNS was built on trust, not secrecy. Encryption and signatures were added later."),
  );
  draw();
}
