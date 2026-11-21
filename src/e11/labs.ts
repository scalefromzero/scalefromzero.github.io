import { h, sfx, takeaway, fmt, css, sleep, reducedMotion } from "../kit/ui";
import { seg, stat, seeded } from "../kit/episode";
import { worldMap, ORIGIN, EDGES, km, rttMs, nearest, type City } from "./map";

const EDGE_RTT = 5; // ms to a CDN server in your own city, illustrative

/** Hero: Sam opens the app from anywhere. With and without a CDN. */
export function cdnHero() {
  let user = EDGES[0], cdn = false;
  const box = h("div.mapbox", {});
  const toggle = h("input#hero-cdn", { type: "checkbox" }) as HTMLInputElement;
  const open = h("button.btn.primary", { type: "button" }, "Open the app");
  const sO = stat("one round trip to Virginia", "--storage"), sE = stat("one round trip to the nearest CDN city", "--good"), sP = stat("to load the page (3 round-trip waves)", "--net");
  const say = h("p.dim", { "aria-live": "polite", style: "min-height:3em; margin:0" }, "Tap any green city to put Sam there.");
  let map: Awaited<ReturnType<typeof worldMap>> | null = null;
  const calc = () => {
    const o = rttMs(km(user.ll, ORIGIN.ll)), e = Math.max(EDGE_RTT, rttMs(km(user.ll, nearest(user.ll)!.ll)));
    sO.v.textContent = `${fmt(o)} ms`; sE.v.textContent = `${fmt(e)} ms`;
    const page = cdn ? 3 * e + o : 3 * o;
    sP.v.textContent = `${fmt(page)} ms`;
    say.textContent = `Sam is in ${user.name}, ${fmt(Math.round(km(user.ll, ORIGIN.ll) / 100) * 100)} km from Virginia. ${cdn ? "Static files come from his own city; only his personal feed goes to Virginia." : "Every file comes from Virginia."}`;
  };
  toggle.addEventListener("change", () => { cdn = toggle.checked; calc(); sfx("tick", 0.15); });
  open.addEventListener("click", async () => {
    if (!map) return;
    map.clear(); calc(); sfx("whoosh", 0.2);
    if (!cdn) { for (let i = 0; i < 3; i++) { await map.arc(user.ll, ORIGIN.ll, css("--storage"), 0.8); await map.arc(ORIGIN.ll, user.ll, css("--storage"), 0.8); } }
    else { const e = nearest(user.ll)!; await Promise.all([map.arc(user.ll, e.ll, css("--good"), 0.4), map.arc(user.ll, ORIGIN.ll, css("--net"), 1)]); await map.arc(ORIGIN.ll, user.ll, css("--net"), 1); }
    sfx("hit", 0.2);
  });
  const el = h("div", { style: "display:grid; gap:10px; min-width:0" }, box,
    h("div.row", {}, h("label.row", { for: "hero-cdn", style: "gap:8px; color:var(--text)" }, toggle, "Use a CDN"), open),
    h("div.stats", { style: "grid-template-columns:repeat(auto-fit,minmax(130px,1fr))" }, sO.el, sE.el, sP.el), say);
  const start = async () => { map = await worldMap(box, (c) => { if (c.id === "iad") return; user = c; calc(); sfx("pop", 0.15); }); calc(); };
  return { el, start };
}

/** Round trips stack up: the browser can't ask for what it doesn't know about yet. */
export function distanceLab(bench: HTMLElement) {
  let city: City = EDGES[0];
  const pick = seg("Sam is in", EDGES.filter((c) => c.id !== "iad").slice(0, 6).map((c) => [c.name, c] as [string, City]), city, (v) => { city = v; draw(); sfx("tick", 0.15); });
  const waves = h("input#ds-w", { type: "range", min: 1, max: 12, step: 1, value: 6 }) as HTMLInputElement;
  const wOut = h("output", {});
  const sK = stat("away from Virginia", "--dim"), sR = stat("per round trip, at the speed of light in glass", "--storage"), sT = stat("just waiting, before any download time", "--bad");
  function draw() {
    const d = km(city.ll, ORIGIN.ll), r = rttMs(d);
    wOut.textContent = waves.value;
    sK.v.textContent = `${fmt(Math.round(d / 100) * 100)} km`; sR.v.textContent = `${fmt(r)} ms`;
    const t = r * +waves.value; sT.v.textContent = t >= 1000 ? `${fmt(t / 1000, 1)} s` : `${fmt(t)} ms`;
  }
  waves.addEventListener("input", draw);
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:12px; align-content:start" }, pick, h("label.field", { for: "ds-w" }, h("span", {}, "Round trips one after another: ", wOut), waves),
        h("p.dim", { style: "margin:0" }, "Connect, lock, ask for the page, then the scripts it mentions, then the files those scripts ask for… each wave waits for the last.")),
      h("div.stats", {}, sK.el, sR.el, sT.el),
    ),
    h("p.note", {}, "Straight-line distance; real cables are longer, so real times are worse. Light in glass: about 200,000 km a second."),
    takeaway("Eighty milliseconds becomes a second, then two. Distance is the problem."),
  );
  draw();
}

/** Pull: the first person in Sydney waits for Virginia; everyone after gets the copy. */
export function pullLab(bench: HTMLElement) {
  let ttl = 3600;
  const pick = seg("Cache-Control max-age", [["1 minute", 60], ["1 hour", 3600], ["1 day", 86400]], ttl, (v) => { ttl = v; draw(); sfx("tick", 0.15); });
  const strip = h("div", { style: "display:flex; flex-wrap:wrap; gap:4px" });
  const sH = stat("cache hit ratio", "--good"), sO = stat("requests that went all the way to Virginia", "--storage"), sA = stat("average wait for a thumbnail", "--net");
  const r = seeded(29), times = Array.from({ length: 80 }, () => r() * 6 * 3600).sort((a, b) => a - b);
  const MISS = 160 + EDGE_RTT, HIT = EDGE_RTT;
  function draw() {
    strip.innerHTML = ""; let at = -Infinity, hits = 0, sum = 0;
    for (const t of times) { const hit = t - at < ttl; if (!hit) at = t; else hits++; sum += hit ? HIT : MISS; strip.append(h("i", { style: `display:block; width:12px; height:20px; border-radius:3px; background:var(${hit ? "--good" : "--storage"})`, title: hit ? "hit" : "miss" })); }
    sH.v.textContent = `${Math.round((hits / times.length) * 100)}%`; sO.v.textContent = String(times.length - hits); sA.v.textContent = `${fmt(sum / times.length)} ms`;
  }
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:12px; align-content:start" }, h("span.eyebrow", {}, "How long the Sydney server may keep its copy"), pick, h("div.stats", {}, sH.el, sO.el, sA.el)),
      h("div", { style: "display:grid; gap:8px; align-content:start" }, h("span.eyebrow", {}, "80 people in Sydney ask for the same thumbnail over 6 hours"), strip,
        h("div.row", { style: "gap:6px" }, h("span.chip", { style: "color:var(--good)" }, h("i"), "hit: ~5 ms"), h("span.chip", { style: "color:var(--storage)" }, h("i"), "miss: fetch from Virginia, ~165 ms"))),
    ),
    h("p.note", {}, "Times are illustrative. How long a copy is kept comes from the Cache-Control header (RFC 9111), set by the origin."),
    takeaway("Pull: a miss fetches from the origin and keeps a copy; everyone after gets a hit."),
  );
  draw();
}

/** Launch day: pull vs push, for a new episode everyone presses play on at once. */
export function pushLab(bench: HTMLElement) {
  let mode: "pull" | "push" = "pull";
  const pick = seg("How the CDN gets the file", [["Pull (on the first request)", "pull"], ["Push (before launch)", "push"]], mode, (v) => { mode = v as typeof mode; draw(); sfx("tick", 0.15); });
  const cities = h("input#ps-c", { type: "range", min: 50, max: 350, step: 10, value: 300 }) as HTMLInputElement;
  const cOut = h("output", {});
  const sM = stat("viewers who wait for a first miss", "--storage"), sO = stat("requests hitting the origin at 9:00", "--bad"), sS = stat("copies stored where nobody watches", "--dim");
  function draw() {
    const n = +cities.value; cOut.textContent = String(n);
    const watched = Math.round(n * 0.7);
    if (mode === "pull") { sM.v.textContent = fmt(watched); sO.v.textContent = fmt(watched); sS.v.textContent = "0"; }
    else { sM.v.textContent = "0"; sO.v.textContent = "0"; sS.v.textContent = fmt(n - watched); }
  }
  cities.addEventListener("input", draw);
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:12px; align-content:start" }, pick, h("label.field", { for: "ps-c" }, h("span", {}, "CDN cities: ", cOut), cities),
        h("p.dim", { style: "margin:0" }, "A new episode goes live at 9:00 and millions press play at once. Assume people watch in 70% of the cities.")),
      h("div.stats", {}, sM.el, sO.el, sS.el),
    ),
    h("p.note", {}, "Illustrative. Real CDNs also merge identical misses in one city into a single request to the origin."),
    takeaway("Most sites pull by default, and push only what they know will be popular."),
  );
  draw();
}

/** Changing a file: purge every copy, or give the new version a new name. Real SHA-256 fingerprints. */
export async function fingerprintLab(bench: HTMLElement) {
  const code = h("textarea#fp-code", { rows: 4, style: "width:100%; font: 500 0.85rem var(--mono); padding:10px; border-radius:10px; border:1px solid var(--line); background:var(--bg); color:var(--text)", "aria-label": "The script's contents" }, 'console.log("version 1");') as HTMLTextAreaElement;
  const name = h("b.mono", { style: "color:var(--good); font-size:var(--step-0); overflow-wrap:anywhere" }, "");
  const purge = h("button.btn", { type: "button" }, "Ship it as app.js, then purge");
  const finger = h("button.btn.primary", { type: "button" }, "Ship it with a fingerprinted name");
  const grid = h("div", { style: "display:grid; grid-template-columns:repeat(auto-fill,minmax(92px,1fr)); gap:6px" });
  const say = h("p.dim", { "aria-live": "polite", style: "min-height:3em; margin:0" });
  const cities = EDGES.filter((c) => c.id !== "iad");
  const state = cities.map(() => "v1");
  const paint = () => { grid.innerHTML = ""; cities.forEach((c, i) => grid.append(h("div.box", { style: `--bc: var(${state[i] === "v1" ? "--storage" : "--good"}); min-height:auto; text-align:center; padding:8px` }, h("b", { style: "font-size:0.78rem" }, c.name), h("span.mono", { style: "font-size:0.7rem" }, state[i])))); };
  const fp = async () => { try { const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(code.value)); return [...new Uint8Array(d)].slice(0, 4).map((x) => x.toString(16).padStart(2, "0")).join(""); } catch { let x = 0; for (const ch of code.value) x = (x * 31 + ch.charCodeAt(0)) >>> 0; return x.toString(16).slice(0, 8); } };
  const show = async () => { name.textContent = `app.${await fp()}.js`; };
  code.addEventListener("input", show);
  purge.addEventListener("click", async () => {
    say.textContent = "Purge sent to every city. Until it lands, some cities still serve the old app.js…"; sfx("whoosh", 0.2);
    for (let i = 0; i < cities.length; i++) { await sleep(reducedMotion() ? 0 : 180 + ((i * 97) % 5) * 60); state[i] = "v2"; paint(); }
    say.textContent = "Every copy thrown away and fetched again. It works, but it's slow, and all those misses hit the origin at once."; sfx("hit", 0.2);
  });
  finger.addEventListener("click", async () => {
    await show(); cities.forEach((_, i) => (state[i] = "v2")); paint(); sfx("hit", 0.2);
    say.textContent = `New pages ask for ${name.textContent}, a name no cache has ever seen, so it's fetched fresh. Old pages keep asking for the old name. Nothing has to be thrown away.`;
  });
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:10px; align-content:start" }, h("label.eyebrow", { for: "fp-code" }, "Edit the new script"), code, h("span.eyebrow", {}, "Its fingerprinted name (first bytes of its SHA-256)"), name, h("div.row", {}, finger, purge), say),
      h("div", { style: "display:grid; gap:8px; align-content:start" }, h("span.eyebrow", {}, "What each CDN city is serving"), grid, h("button.btn", { type: "button", onclick: () => { state.fill("v1"); paint(); say.textContent = ""; } }, "Reset to version 1")),
    ),
    h("p.note", {}, "The fingerprint is computed in your browser with the Web Crypto API. Change one character and the name changes."),
    takeaway("Give every file version a unique name, so updates never need a purge."),
  );
  await show(); paint();
}

/** Sam's visit: dozens of static files from his city, one personal request to Virginia. */
export function visitLab(bench: HTMLElement) {
  const on = h("input#vs-on", { type: "checkbox", checked: true }) as HTMLInputElement;
  const rows = h("div.meters", {});
  const sT = stat("for the app to open in Sydney", "--good");
  const FILES: [string, boolean][] = [["index.html", false], ["app.3f9a1c.js", true], ["styles.8b21.css", true], ["logo.svg", true], ["thumb-1.jpg", true], ["thumb-2.jpg", true], ["thumb-3.jpg", true], ["font.woff2", true], ["/v1/feed (Sam's personal feed)", false]];
  const o = rttMs(km(EDGES[0].ll, ORIGIN.ll));
  function draw() {
    rows.innerHTML = ""; let t = 0;
    FILES.forEach(([f, stat_]) => {
      const ms = on.checked && stat_ ? EDGE_RTT : o;
      t = Math.max(t, ms);
      rows.append(h("div.meter", { style: "grid-template-columns: minmax(0,13em) minmax(0,1fr) 8em" }, h("span.mono", { style: "font-size:0.75rem" }, f), h("div.track", {}, h("i", { style: `width:${(ms / o) * 100}%; background:var(${ms === EDGE_RTT ? "--good" : "--storage"})` })), h("b", {}, `${fmt(ms)} ms · ${ms === EDGE_RTT ? "HIT" : on.checked ? "origin" : "Virginia"}`)));
    });
    const total = (on.checked ? 2 * o : 3 * o) + 120;
    sT.v.textContent = `≈ ${fmt(total)} ms`; sT.v.style.color = on.checked ? "var(--good)" : "var(--bad)";
  }
  on.addEventListener("change", () => { draw(); sfx("tick", 0.15); });
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:12px; align-content:start" }, h("label.row", { for: "vs-on", style: "gap:8px; color:var(--text)" }, on, "Static files behind a CDN"), sT.el,
        h("p.dim", { style: "margin:0" }, "The page and Sam's feed are personal, so they still go to Virginia. Everything that's the same for everyone comes from Sydney.")),
      rows,
    ),
    h("p.note", {}, "Illustrative: one round trip per file, after the connection is open."),
    takeaway("Dozens of long trips have become one, and the app opens in a blink."),
  );
  draw();
}

/** Take down a city, or the whole CDN. Users are routed to the nearest city that's still up. */
export async function outageLab(bench: HTMLElement) {
  const box = h("div.mapbox", {});
  const down = new Set<string>();
  const two = h("input#ou2-two", { type: "checkbox" }) as HTMLInputElement;
  const global = h("button.btn", { type: "button" }, "The whole CDN breaks");
  const fix = h("button.btn", { type: "button" }, "Fix everything");
  const send = h("button.btn.primary", { type: "button" }, "Send Sam's request (Sydney)");
  const say = h("p.dim", { "aria-live": "polite", style: "min-height:3em; margin:0" }, "Tap a city to take it offline.");
  bench.append(box,
    h("div.row", { style: "margin-top:10px" }, send, global, fix, h("label.row", { for: "ou2-two", style: "gap:8px; color:var(--text)" }, two, "Use a second CDN")), say,
    h("p.note", {}, "June 2021: one customer's valid settings change triggered a hidden bug, and 85% of Fastly's network returned errors for most of an hour. November 2025: one file inside Cloudflare doubled in size, and much of the web broke for hours."),
    takeaway("One city down is easy. The whole CDN down is the hard case, which is why the biggest companies use more than one."));
  const map = await worldMap(box, (c) => { if (c.id === "iad") return; down.has(c.id) ? down.delete(c.id) : down.add(c.id); map.setDown(down); sfx(down.has(c.id) ? "powerdown" : "hit", 0.2); });
  global.addEventListener("click", () => { EDGES.forEach((c) => down.add(c.id)); map.setDown(down); sfx("powerdown", 0.3); say.textContent = "Every CDN city is returning errors at once."; });
  fix.addEventListener("click", () => { down.clear(); map.setDown(down); map.clear(); say.textContent = "All cities back up."; sfx("hit", 0.2); });
  send.addEventListener("click", async () => {
    map.clear();
    const sam = EDGES[0].ll;
    const n = nearest(sam, (c) => !down.has(c.id));
    if (!n) {
      if (two.checked) { say.textContent = "CDN A is down everywhere, so traffic switches to CDN B. Sam barely notices."; await map.arc(sam, EDGES[1].ll, css("--net")); sfx("hit", 0.2); }
      else { say.innerHTML = '<b style="color:var(--bad)">Error 503 from every city.</b> The origin is fine, but nobody can reach it through the CDN.'; sfx("miss", 0.25); }
      return;
    }
    say.textContent = n.id === "syd" ? "Sydney is up: a few milliseconds." : `Sydney is down, so Sam is sent to the next closest city: ${n.name}, about ${fmt(rttMs(km(sam, n.ll)))} ms away.`;
    await map.arc(sam, n.ll, css("--good"), 0.7); sfx("pop", 0.2);
  });
}

/** Origin shield: every city asks one regional cache first. */
export function shieldLab(bench: HTMLElement) {
  const on = h("input#sh-on", { type: "checkbox" }) as HTMLInputElement;
  const cities = h("input#sh-c", { type: "range", min: 10, max: 350, step: 10, value: 300 }) as HTMLInputElement;
  const cOut = h("output", {});
  const sO = stat("requests reaching the origin for one new file", "--storage");
  const viz = h("div", { style: "display:grid; gap:10px" });
  function draw() {
    const n = +cities.value; cOut.textContent = String(n);
    const shields = 4;
    sO.v.textContent = on.checked ? String(shields) : String(n);
    sO.v.style.color = on.checked ? "var(--good)" : "var(--bad)";
    viz.innerHTML = "";
    const dots = (k: number, c: string) => h("div", { style: "display:flex; flex-wrap:wrap; gap:3px" }, ...Array.from({ length: Math.min(k, 350) }, () => h("i", { style: `display:block; width:7px; height:7px; border-radius:50%; background:var(${c})` })));
    viz.append(h("span.eyebrow", {}, `${n} CDN cities miss at once`), dots(n, "--good"));
    if (on.checked) viz.append(h("span.eyebrow", {}, `${shields} regional shields (one per continent region)`), dots(shields, "--cache"));
    viz.append(h("span.eyebrow", {}, "Origin in Virginia receives"), dots(on.checked ? shields : n, "--storage"));
  }
  [on, cities].forEach((x) => x.addEventListener("input", () => { draw(); sfx("tick", 0.1); }));
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:12px; align-content:start" }, h("label.row", { for: "sh-on", style: "gap:8px; color:var(--text)" }, on, "Add an origin shield"), h("label.field", { for: "sh-c" }, h("span", {}, "CDN cities: ", cOut), cities), sO.el,
        h("p.dim", { style: "margin:0" }, "Edge computing goes further: small pieces of code run on the CDN servers themselves, like checking a login or resizing an image.")),
      viz,
    ),
    h("p.note", {}, "Illustrative counts. Cloudflare alone lists about 350 cities."),
    takeaway("An origin shield turns hundreds of misses into a handful, so the origin isn't flattened by its own CDN."),
  );
  draw();
}

