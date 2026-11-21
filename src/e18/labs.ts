import { h, sfx, takeaway, fmt, sleep, reducedMotion } from "../kit/ui";
import { seg, stat, seeded } from "../kit/episode";
import { hash } from "../e13/ring";

const wait = (ms: number) => sleep(reducedMotion() ? 0 : ms);

/** Hero: data spread across machines by key. Add machines; then let one celebrity video get all the views. */
export function partitionHero() {
  const n = h("input#pt-n", { type: "range", min: 1, max: 32, step: 1, value: 8 }) as HTMLInputElement;
  const nO = h("output", {});
  const hot = h("input#pt-hot", { type: "checkbox" }) as HTMLInputElement;
  const grid = h("div", { style: "display:grid; grid-template-columns:repeat(8,minmax(0,1fr)); gap:5px" });
  const sCap = stat("requests a second, all machines", "--good"), sBusy = stat("busiest machine's share", "--storage");
  const say = h("p.dim", { "aria-live": "polite", style: "min-height:2.6em; margin:0" });
  const PER = 25000; // illustrative per-machine capacity
  let counts: number[] = [];
  function draw() {
    const N = +n.value; nO.textContent = String(N);
    const r = seeded(4); counts = Array(N).fill(0);
    for (let i = 0; i < 4000; i++) {
      const key = hot.checked && r() < 0.4 ? "video:celebrity" : `video:${Math.floor(r() * 1e6)}`;
      counts[hash(key) % N]++;
    }
    const max = Math.max(...counts), share = max / 4000;
    const cap = Math.min(N * PER, PER / share);
    sCap.v.textContent = fmt(cap); sBusy.v.textContent = `${fmt(share * 100)}%`;
    sBusy.v.style.color = `var(${share > 2.5 / N && N > 1 ? "--bad" : "--storage"})`;
    grid.innerHTML = "";
    counts.forEach((c, i) => {
      const load = c / (4000 / N);
      grid.append(h("div", { title: `machine ${i + 1}: ${c} requests`, style: `height:42px; border-radius:6px; border:1px solid var(--line); background:color-mix(in srgb, var(${load > 2 ? "--bad" : "--good"}) ${Math.min(90, 15 + load * 25)}%, var(--bg)); display:grid; place-items:center; font:700 0.65rem var(--mono); color:var(--text)` }, String(i + 1)));
    });
    say.textContent = hot.checked
      ? `One key always hashes to the same machine. Machine ${counts.indexOf(max) + 1} takes ${fmt(share * 100)}% of all requests, so the whole system is only as fast as that one.`
      : `Each item's key picks its machine, so every read and write touches just one place. ${N} machine${N > 1 ? "s" : ""}, ${N}× the capacity.`;
  }
  [n, hot].forEach((x) => x.addEventListener("input", () => { draw(); sfx("tick", 0.12); }));
  draw();
  return h("div.bench", { style: "display:grid; gap:12px" },
    h("label.field", { for: "pt-n" }, h("span", {}, "Machines: ", nO), n),
    h("label.row", { for: "pt-hot", style: "gap:8px; color:var(--text)" }, hot, "One celebrity video gets 40% of the views"),
    grid, h("div.stats", {}, sCap.el, sBusy.el), say,
    h("p.note", { style: "margin:0" }, "Illustrative: 25,000 requests a second per machine; keys hashed as in Episode 13."));
}

/** The break: split by table, and the join moves into your app. */
export function splitLab(bench: HTMLElement) {
  let split = false;
  const pick = seg("Database", [["One machine", false], ["Split by table (3 machines)", true]], split, (v) => { split = v; run(); });
  const steps = h("pre.term", { style: "height:auto; white-space:pre-wrap; min-height:170px" });
  const sTrips = stat("trips to a database", "--net"), sRules = stat("rules the database still checks", "--good");
  async function run() {
    steps.textContent = "";
    const s = (t: string) => { steps.textContent += t + "\n"; };
    if (!split) {
      s("App → DB: SELECT v.title, u.name FROM videos v JOIN users u …"); await wait(300);
      s("DB joins both tables itself, checks the foreign key, one transaction"); s("← 10 rows");
      sTrips.v.textContent = "1"; sRules.v.textContent = "all"; sRules.v.style.color = "var(--good)";
    } else {
      s("App → videos machine: SELECT id, title, creator_id … LIMIT 10"); await wait(300); s("← 10 videos, 8 different creators"); await wait(300);
      s("App → users machine: SELECT name WHERE id IN (8 ids)"); await wait(300); s("← 8 names"); await wait(300);
      s("App joins them in its own code"); s("⚠ creator_id 91 has no user: nothing stopped it"); s("⚠ a like + view count update now spans two machines");
      sTrips.v.textContent = "2+"; sRules.v.textContent = "fewer"; sRules.v.style.color = "var(--bad)"; sfx("miss", 0.2);
    }
  }
  bench.append(h("div.bench-grid", {}, h("div", { style: "display:grid; gap:12px; align-content:start" }, pick, h("div.stats", {}, sTrips.el, sRules.el),
    h("p.dim", { style: "margin:0" }, "And the views table alone is soon too big for any one machine.")), steps),
    takeaway("Once tables live on different machines, joins, foreign keys and transactions stop being free."));
  run();
}

/** Documents: two creator profiles with different fields. */
export function docLab(bench: HTMLElement) {
  let mode: "doc" | "sql" = "doc";
  const pick = seg("Store it in", [["Document database", "doc"], ["Table with a fixed schema", "sql"]], mode, (v) => { mode = v as typeof mode; draw(); sfx("tick", 0.15); });
  const A = { _id: "creator:43", name: "Sam", channel: "Sam Travels", links: { insta: "@samtravels" }, gear: ["DJI Mini", "GoPro"] };
  const B = { _id: "creator:51", name: "Priya", channel: "Priya Cooks", diet: "vegetarian", sponsor: { brand: "SpiceCo", until: "2027-03" }, live_schedule: ["Tue 18:00", "Sat 11:00"] };
  const out = h("div", { style: "display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr)); gap:12px" });
  const verdict = h("p", { "aria-live": "polite", style: "min-height:2.5em; margin:0" });
  function draw() {
    out.innerHTML = "";
    if (mode === "doc") {
      [A, B].forEach((d) => out.append(h("pre.json", {}, JSON.stringify(d, null, 2))));
      verdict.innerHTML = '<span style="color:var(--good)">Both saved.</span> Same collection, completely different fields. No schema change needed.';
    } else {
      out.append(h("pre.json", {}, "CREATE TABLE creators (\n  id int PRIMARY KEY,\n  name text, channel text\n);\n\nINSERT … Sam … gear = ['DJI Mini','GoPro']"),
        h("pre.json", { style: "color:var(--bad)" }, "ERROR: column \"gear\" does not exist\nERROR: column \"sponsor\" does not exist\n\n→ ALTER TABLE creators ADD COLUMN …\n  (a planned change, every few weeks)"));
      verdict.textContent = "Every new kind of field needs a schema change first, or a side table.";
    }
  }
  bench.append(pick, out, verdict,
    h("p.note", {}, "Key-value stores (Redis, Memcached) go one step simpler: a key in, a value out. DynamoDB handles both shapes."),
    takeaway("A document database stores each item as a nested bundle of fields, and items don't have to match."));
  draw();
}

/** Wide-column: partitioned by video, sorted by time. */
export function wideLab(bench: HTMLElement) {
  const VIDS = ["trip", "cooking", "chess", "guitar"];
  const VIEWERS = ["Maya", "Sam", "Ali", "Priya", "Tom", "Lena"];
  const parts: Record<string, { t: number; who: string }[]> = Object.fromEntries(VIDS.map((v) => [v, []]));
  let clock = 1000;
  const view = h("div", { style: "display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,150px),1fr)); gap:8px" });
  const add = h("button.btn.primary", { type: "button" }, "Record 20 views");
  const q1 = h("button.btn", { type: "button" }, "Last 5 views of \"trip\"");
  const q2 = h("button.btn", { type: "button" }, "Every video Maya watched");
  const say = h("p", { "aria-live": "polite", style: "min-height:2.6em; margin:0" });
  const r = seeded(3);
  function draw(hiPart?: string, all = false) {
    view.innerHTML = "";
    VIDS.forEach((v) => view.append(h("div.box", { style: `--bc: var(${hiPart === v ? "--good" : all ? "--bad" : "--line"}); min-height:150px` },
      h("b", {}, `partition: ${v}`), ...parts[v].slice(-6).reverse().map((e) => h("span", {}, `t=${e.t} · ${e.who}`)), parts[v].length > 6 ? h("span", {}, `… ${parts[v].length - 6} older`) : null)));
  }
  add.addEventListener("click", () => { for (let i = 0; i < 20; i++) { clock += 1 + Math.floor(r() * 9); parts[VIDS[Math.floor(r() * 4)]].push({ t: clock, who: VIEWERS[Math.floor(r() * 6)] }); } draw(); sfx("pop", 0.15); say.textContent = "Each view is appended to its video's partition, kept sorted by time."; });
  q1.addEventListener("click", () => { draw("trip"); sfx("hit", 0.2); say.innerHTML = `<span style="color:var(--good)">1 partition, 1 quick read.</span> The rows are already together and in time order.`; });
  q2.addEventListener("click", () => { const n = VIDS.reduce((a, v) => a + parts[v].filter((e) => e.who === "Maya").length, 0); draw(undefined, true); sfx("miss", 0.2); say.innerHTML = `<span style="color:var(--bad)">Every partition scanned</span> to find ${n} views. The data wasn't arranged for this question.`; });
  bench.append(h("div.row", {}, add, q1, q2), say, view,
    h("p.note", {}, "Cassandra and Google's Bigtable work this way: a partition key picks the machine, a clustering key sorts rows inside it."),
    takeaway("Wide-column stores shine for data written once and read in order, like events, logs and views over time."));
  add.click();
}

/** Graph: walk the lines. */
export function graphLab(bench: HTMLElement) {
  const NS = "http://www.w3.org/2000/svg";
  const P: Record<string, [number, number, string]> = {
    Maya: [70, 60, "person"], Sam: [70, 170, "person"], Ali: [190, 230, "person"], Priya: [300, 40, "person"],
    Trip: [210, 80, "video"], Chess: [330, 150, "video"], Guitar: [440, 70, "video"], Cooking: [450, 210, "video"],
  };
  const E: [string, string][] = [["Maya", "Trip"], ["Sam", "Trip"], ["Sam", "Chess"], ["Ali", "Chess"], ["Ali", "Cooking"], ["Priya", "Trip"], ["Priya", "Guitar"], ["Maya", "Sam"]];
  const svg = document.createElementNS(NS, "svg"); svg.setAttribute("viewBox", "0 0 520 270"); svg.style.cssText = "width:100%; height:auto; display:block"; svg.setAttribute("role", "img"); svg.setAttribute("aria-label", "A graph of people and the videos they watched");
  const say = h("p", { "aria-live": "polite", style: "min-height:2.6em; margin:0" });
  function draw(lit = new Set<string>(), litE = new Set<string>()) {
    svg.innerHTML = "";
    E.forEach(([a, b]) => { const on = litE.has(a + b); svg.insertAdjacentHTML("beforeend", `<line x1="${P[a][0]}" y1="${P[a][1]}" x2="${P[b][0]}" y2="${P[b][1]}" stroke="${on ? "#4ADE80" : "#2a3463"}" stroke-width="${on ? 3 : 1.5}"${a === "Maya" && b === "Sam" ? ' stroke-dasharray="4 4"' : ""}/>`); });
    Object.entries(P).forEach(([k, [x, y, t]]) => { const on = lit.has(k); svg.insertAdjacentHTML("beforeend", `<g><circle cx="${x}" cy="${y}" r="${t === "video" ? 24 : 20}" fill="${on ? (t === "video" ? "#7c3aed" : "#166534") : "#141b38"}" stroke="${t === "video" ? "#A78BFA" : "#4ADE80"}" stroke-width="2"/><text x="${x}" y="${y + 4}" text-anchor="middle" font-size="11" font-weight="700" fill="#e7ebff">${t === "video" ? "▶ " : ""}${k}</text></g>`); });
  }
  const also = h("button.btn.primary", { type: "button" }, "People who watched Trip also watched…");
  const fof = h("button.btn", { type: "button" }, "Friends of Maya's friends");
  also.addEventListener("click", async () => {
    const lit = new Set(["Trip"]), litE = new Set<string>();
    draw(lit, litE); await wait(350);
    const viewers = E.filter(([, b]) => b === "Trip").map(([a]) => a);
    viewers.forEach((v) => { lit.add(v); litE.add(v + "Trip"); }); draw(lit, litE); sfx("tick", 0.15); await wait(450);
    const recs = new Set<string>();
    E.forEach(([a, b]) => { if (viewers.includes(a) && P[b][2] === "video" && b !== "Trip") { recs.add(b); lit.add(b); litE.add(a + b); } });
    draw(lit, litE); sfx("hit", 0.2);
    say.innerHTML = `Two short walks along the lines: <b>${[...recs].join(", ")}</b>. In SQL that's a join of watches to itself, then to videos.`;
  });
  fof.addEventListener("click", () => { draw(new Set(["Maya", "Sam"]), new Set(["MayaSam"])); sfx("tick", 0.15); say.textContent = "Maya → Sam → Sam's friends. Each extra hop is one more step here, and one more join in SQL."; });
  bench.append(h("div.row", {}, also, fof), svg, say, takeaway("In a graph database, the relationships are the data, so questions about connections are short walks."));
  draw();
}

/** Rebuild the video app: pick a store for each kind of data. */
export function pickLab(bench: HTMLElement) {
  const OPTS = ["Key-value", "Document", "Wide-column", "Graph", "SQL"];
  const ITEMS: [string, string, string][] = [
    ["Login sessions, checked on every request", "Key-value", "In memory, by session token, in under a millisecond."],
    ["Creator profiles with ever-changing fields", "Document", "Each profile is a flexible nested document."],
    ["Every single view, billions a day", "Wide-column", "Appended to the video's partition, sorted by time."],
    ["Who watched what, for recommendations", "Graph", "\"Also watched\" is a walk along the lines."],
    ["Payments", "SQL", "The part that must never be wrong keeps ACID transactions."],
  ];
  const score = h("p", { "aria-live": "polite", style: "margin:0" });
  let right = 0;
  const rows = ITEMS.map(([what, ans, why]) => {
    const fb = h("span.dim", { style: "font-size:0.85rem" });
    const btns = OPTS.map((o) => { const b = h("button.btn", { type: "button", style: "padding:6px 10px; font-size:0.8rem" }, o); b.addEventListener("click", () => {
      if (b.parentElement!.dataset.done) return; b.parentElement!.dataset.done = "1";
      const ok = o === ans; if (ok) right++;
      b.style.borderColor = `var(${ok ? "--good" : "--bad"})`; fb.innerHTML = `${ok ? "✓" : `✗ ${ans}.`} ${why}`; sfx(ok ? "hit" : "miss", 0.2);
      score.textContent = `${right} right so far.`;
    }); return b; });
    return h("div", { style: "display:grid; gap:6px; padding:10px 0; border-bottom:1px solid var(--line)" }, h("b", {}, what), h("div.row", { style: "gap:6px" }, ...btns), fb);
  });
  bench.append(...rows, score, takeaway("Using several kinds of database, each for what it does best, is completely normal."));
}

/** Eventual consistency: a like count read from two copies that haven't caught up. */
export function eventualLab(bench: HTMLElement) {
  const lag = h("input#ev-lag", { type: "range", min: 0, max: 3000, step: 100, value: 1500 }) as HTMLInputElement;
  const lagO = h("output", {});
  const start = h("button.btn.primary", { type: "button" }, "Like it, then refresh 8 times");
  const reads = h("div", { style: "display:flex; flex-wrap:wrap; gap:6px; min-height:48px" });
  const say = h("p", { "aria-live": "polite", style: "min-height:2.5em; margin:0" });
  lag.addEventListener("input", () => { lagO.textContent = `${lag.value} ms`; });
  lagO.textContent = `${lag.value} ms`;
  start.addEventListener("click", async () => {
    reads.innerHTML = ""; const L = +lag.value, t0 = performance.now(), r = seeded(Math.floor(t0) % 1000 + 1);
    let prev = 1201, flips = 0;
    for (let i = 0; i < 8; i++) {
      const el = performance.now() - t0, copy = r() < 0.5 ? "A" : "B";
      const v = copy === "A" || el >= L ? 1201 : 1200;
      if (v < prev) flips++; prev = v;
      reads.append(h("span.chip", { style: `color:var(${v === 1201 ? "--good" : "--bad"})` }, `${copy}: ♥ ${fmt(v)}`)); sfx("tick", 0.1);
      await sleep(250);
    }
    say.textContent = flips ? `The count went down ${flips} time${flips > 1 ? "s" : ""}: some refreshes hit copy B, which hadn't caught up yet. It always settles at 1,201.` : "Every read saw 1,201. With a short lag, copies agree before you notice.";
  });
  bench.append(h("div", { style: "display:grid; gap:12px" }, h("label.field", { for: "ev-lag" }, h("span", {}, "Copy B is behind by: ", lagO), lag), start, reads, say),
    h("p.note", {}, "BASE: basically available, soft state, eventually consistent. Many NoSQL databases let you ask for an up-to-date read per request, at the cost of speed."),
    takeaway("Without strict rules, copies can disagree for a moment. Fine for likes, never for payments."));
  start.click();
}
