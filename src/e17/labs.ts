import { h, sfx, takeaway, fmt, sleep, reducedMotion } from "../kit/ui";
import { seg, stat } from "../kit/episode";
import { chartBox, makeChart } from "../kit/chart";

const NS = "http://www.w3.org/2000/svg";
const wait = (ms: number) => sleep(reducedMotion() ? 0 : ms);

/** Hero: a wide, short B+ tree. Find one row among billions in a handful of reads; compare with reading the whole file. */
export function indexHero() {
  const rows = h("input#ix-rows", { type: "range", min: 3, max: 10, step: 1, value: 9 }) as HTMLInputElement;
  const rowsO = h("output", {});
  const find = h("button.btn.primary", { type: "button" }, "Find user 42");
  const sScan = stat("rows read, scanning the file", "--bad"), sIdx = stat("reads, using the index", "--good"), sLvl = stat("levels in the tree", "--ram");
  const svg = document.createElementNS(NS, "svg"); svg.setAttribute("viewBox", "0 0 520 250"); svg.setAttribute("role", "img"); svg.setAttribute("aria-label", "A B plus tree with a search path from the root to one leaf"); svg.style.cssText = "width:100%; height:auto; display:block";
  const say = h("p.dim", { "aria-live": "polite", style: "min-height:2.6em; margin:0" }, "Each node holds hundreds of sorted keys and points to hundreds of children.");
  const FAN = 500;
  const levels = (n: number) => Math.max(1, Math.ceil(Math.log(n) / Math.log(FAN)));
  function draw(path: number[] = []) {
    const n = 10 ** +rows.value, L = levels(n);
    rowsO.textContent = n >= 1e9 ? `${fmt(n / 1e9)} billion` : n >= 1e6 ? `${fmt(n / 1e6)} million` : fmt(n);
    sScan.v.textContent = n >= 1e9 ? `${fmt(n / 1e9)} billion` : n >= 1e6 ? `${fmt(n / 1e6)} million` : fmt(n); sIdx.v.textContent = String(L); sLvl.v.textContent = String(L);
    svg.innerHTML = "";
    const per = 5, gap = 230 / Math.max(L, 1);
    for (let l = 0; l < L; l++) {
      const y = 14 + l * gap, count = l === 0 ? 1 : per, w = l === 0 ? 150 : 80;
      for (let i = 0; i < count; i++) {
        const x = l === 0 ? 160 : 14 + i * 92;
        const on = path.length > l && (l === 0 || path[l] === i);
        svg.insertAdjacentHTML("beforeend", `<rect x="${x}" y="${y}" width="${w}" height="26" rx="6" fill="${on ? "#0f766e" : "#1a2350"}" stroke="${on ? "#2DD4BF" : "#3b4a8a"}" stroke-width="${on ? 2 : 1}"/>`);
        const keys = l === L - 1 ? (on ? "… 41 · 42 · 43 …" : "rows …") : on ? "… 12 · 40 · 57 …" : "· · · · ·";
        svg.insertAdjacentHTML("beforeend", `<text x="${x + w / 2}" y="${y + 17}" text-anchor="middle" font-size="10.5" font-family="monospace" fill="${on ? "#ccfbf1" : "#9aa5d6"}">${keys}</text>`);
        if (l > 0) {
          const px = l === 1 ? 235 : 14 + (path[l - 1] ?? 2) * 92 + 40;
          svg.insertAdjacentHTML("afterbegin", `<line x1="${px}" y1="${y - gap + 26}" x2="${x + w / 2}" y2="${y}" stroke="${on ? "#2DD4BF" : "#34407a"}" stroke-width="${on ? 2.5 : 1}"/>`);
        }
      }
      if (l > 0) svg.insertAdjacentHTML("beforeend", `<text x="512" y="${y + 17}" text-anchor="end" font-size="10" fill="#6b76a8">×${FAN ** l >= 1e6 ? `${fmt(FAN ** l / 1e6)}M` : FAN ** l >= 1e3 ? `${fmt(FAN ** l / 1e3)}k` : FAN ** l}</text>`);
    }
  }
  let busy = false;
  find.addEventListener("click", async () => {
    if (busy) return; busy = true;
    const L = levels(10 ** +rows.value), path = [0];
    for (let l = 1; l <= L; l++) { draw(path); sfx("tick", 0.15); await wait(450); path.push([2, 1, 3, 2, 0][l % 5]); }
    draw(path.slice(0, L)); sfx("hit", 0.2);
    say.textContent = `Found in ${L} read${L > 1 ? "s" : ""}. Reading the file instead means checking up to ${sScan.v.textContent} lines.`;
    busy = false;
  });
  rows.addEventListener("input", () => { draw(); say.textContent = "Each level multiplies the reach by about 500."; });
  draw();
  return h("div.bench", { style: "display:grid; gap:12px" },
    h("label.field", { for: "ix-rows" }, h("span", {}, "Rows in the users table: ", rowsO), rows),
    svg, h("div.row", {}, find), h("div.stats", {}, sScan.el, sIdx.el, sLvl.el), say,
    h("p.note", { style: "margin:0" }, "Example: about 500 keys per node, so 4 levels reach 500⁴ ≈ 62.5 billion rows."));
}

/** The break: a payment written as two separate steps, with a crash in between. Then with a transaction and a log. */
export function transferLab(bench: HTMLElement) {
  let tx = false;
  const pick = seg("Store", [["One big file", false], ["Database transaction", true]], tx, (v) => { tx = v; reset(); sfx("tick", 0.15); });
  const crash = h("input#tr-crash", { type: "checkbox", checked: true }) as HTMLInputElement;
  const go = h("button.btn.primary", { type: "button" }, "Maya pays Sam $50");
  const bal = { maya: 120, sam: 30 };
  const mB = stat("Maya", "--net"), sB = stat("Sam", "--net"), tot = stat("total money", "--good");
  const log = h("pre.term", { style: "height:190px; white-space:pre-wrap" });
  function paint() { mB.v.textContent = `$${bal.maya}`; sB.v.textContent = `$${bal.sam}`; tot.v.textContent = `$${bal.maya + bal.sam}`; tot.v.style.color = `var(${bal.maya + bal.sam === 150 ? "--good" : "--bad"})`; }
  function reset() { bal.maya = 120; bal.sam = 30; log.textContent = tx ? "BEGIN … COMMIT, with a write-ahead log" : "users.csv\n42, Maya, 120.00\n43, Sam, 30.00"; paint(); }
  let busy = false;
  go.addEventListener("click", async () => {
    if (busy) return; busy = true; reset(); log.textContent = "";
    const say = (t: string) => { log.textContent += t + "\n"; };
    if (!tx) {
      say("→ rewrite line 42: Maya 120.00 → 70.00"); bal.maya -= 50; paint(); await wait(600);
      if (crash.checked) { say("💥 server crashes"); sfx("powerdown", 0.25); await wait(700); say("↻ restart, read users.csv"); say("  Maya 70.00 · Sam 30.00\n  $50 has vanished."); sfx("miss", 0.2); }
      else { say("→ rewrite line 43: Sam 30.00 → 80.00"); bal.sam += 50; paint(); say("✓ done (this time)"); }
    } else {
      say("BEGIN;"); await wait(300);
      say("UPDATE users SET balance = balance - 50 WHERE id = 42;"); await wait(400);
      say("UPDATE users SET balance = balance + 50 WHERE id = 43;"); await wait(400);
      if (crash.checked) {
        say("💥 server crashes before COMMIT"); sfx("powerdown", 0.25); await wait(700);
        say("↻ restart: replay the log. No COMMIT record,\n  so both changes are undone. Maya 120 · Sam 30.");
      } else {
        say("COMMIT;  → log written to disk first, then 'done'"); bal.maya -= 50; bal.sam += 50; paint(); sfx("hit", 0.2); await wait(500);
        say("💥 crash a millisecond later? The log is on disk:\n  both changes come back. Nothing lost.");
      }
    }
    busy = false;
  });
  bench.append(
    h("div.bench-grid", {}, h("div", { style: "display:grid; gap:12px; align-content:start" }, pick,
      h("label.row", { for: "tr-crash", style: "gap:8px; color:var(--text)" }, crash, "Crash halfway"), go, h("div.stats", {}, mB.el, sB.el, tot.el)), log),
    takeaway("A transaction makes both changes happen together or not at all, and a log on disk makes finished changes survive a crash."),
  );
  reset();
}

type Row = Record<string, string | number>;
/** Tables, keys and a schema that says no. */
export function tablesLab(bench: HTMLElement) {
  const users: Row[] = [{ id: 42, name: "Maya", email: "maya@mail.com", balance: 120 }, { id: 43, name: "Sam", email: "sam@mail.com", balance: 30 }];
  const videos: Row[] = [{ id: 7, title: "Trip to Lisbon", creator_id: 43 }];
  const table = (name: string, cols: string[], rows: Row[], hi?: Row) => h("div", { style: "display:grid; gap:4px; min-width:0" },
    h("span.eyebrow", {}, name),
    h("div", { style: "overflow-x:auto" }, h("table.dtable", {},
      h("thead", {}, h("tr", {}, ...cols.map((c) => h("th", {}, c + (c === "id" ? " 🔑" : c === "creator_id" ? " ↗" : ""))))),
      h("tbody", {}, ...rows.map((r) => h("tr", { class: r === hi ? "hi" : "" }, ...cols.map((c) => h("td", {}, String(r[c])))))))));
  const view = h("div", { style: "display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr)); gap:12px" });
  const out = h("pre.term", { style: "height:auto; min-height:72px; white-space:pre-wrap" }, "Try an insert.");
  function draw(hi?: Row) { view.innerHTML = ""; view.append(table("users", ["id", "name", "email", "balance"], users, hi), table("videos", ["id", "title", "creator_id"], videos, hi)); }
  const tries: [string, string, () => string | Row][] = [
    ["New video by Maya", "INSERT INTO videos VALUES (8, 'Cooking', 42);", () => { const r = { id: 8, title: "Cooking", creator_id: 42 }; if (videos.some((v) => v.id === 8)) return "ERROR: duplicate key, video 8 already exists (primary key)"; videos.push(r); return r; }],
    ["Video by user 99", "INSERT INTO videos VALUES (9, 'Mystery', 99);", () => "ERROR: foreign key violation. creator_id 99 is not a real user."],
    ["Email as balance", "UPDATE users SET balance = 'maya@mail.com' WHERE id = 42;", () => "ERROR: invalid input for type numeric: \"maya@mail.com\". The schema says balance is a number."],
    ["Second user 42", "INSERT INTO users VALUES (42, 'Imposter', 'x@y.z', 0);", () => "ERROR: duplicate key value violates unique constraint (primary key id = 42)"],
    ["Balance below zero", "UPDATE users SET balance = -10 WHERE id = 43;", () => "ERROR: new row violates check constraint \"balance >= 0\""],
  ];
  const btns = h("div.row", {}, ...tries.map(([label, sql, run]) => {
    const b = h("button.btn", { type: "button" }, label);
    b.addEventListener("click", () => { const r = run(); if (typeof r === "string") { out.innerHTML = ""; out.append(sql + "\n", h("span", { style: "color:var(--bad)" }, r)); sfx("miss", 0.2); draw(); } else { out.innerHTML = ""; out.append(sql + "\n", h("span", { style: "color:var(--good)" }, "INSERT 0 1")); sfx("hit", 0.2); draw(r); } });
    return b;
  }));
  bench.append(btns, out, view,
    h("p.note", {}, "Edgar Codd, \"A Relational Model of Data for Large Shared Data Banks\", 1970. SQL = Structured Query Language. Error messages styled after PostgreSQL."),
    takeaway("A schema, primary keys and foreign keys let the database refuse bad data before it's ever stored."));
  draw();
}

/** Asking questions: a JOIN, with and without an index. The planner chooses. */
export function joinLab(bench: HTMLElement) {
  const sql = h("pre.json", {}, "SELECT v.title, u.name\nFROM videos v JOIN users u ON v.creator_id = u.id\nWHERE u.city = 'London'\nORDER BY v.views DESC LIMIT 10;");
  const vids = h("input#jn-v", { type: "range", min: 3, max: 9, step: 1, value: 7 }) as HTMLInputElement;
  const vO = h("output", {});
  const idx = h("input#jn-ix", { type: "checkbox", checked: true }) as HTMLInputElement;
  const plan = h("pre.term", { style: "white-space:pre; height:auto; white-space:pre-wrap; min-height:120px" });
  const sRead = stat("rows the database reads", "--storage"), sTime = stat("rough time (illustrative)", "--net");
  function draw() {
    const V = 10 ** +vids.value, U = V / 20;
    vO.textContent = fmt(V);
    let rows: number, lines: string[];
    if (idx.checked) {
      const london = Math.round(U * 0.01);
      rows = Math.round(london * 20 * 0.05) + london + 10;
      lines = ["Limit 10", "  → Nested loop join", `    → Index scan users(city)  ~${fmt(london)}`, `    → Index scan videos(creator_id)  ~${fmt(rows - london - 10)}`];
    } else {
      rows = V + U;
      lines = ["Limit 10", "  → Sort by views", "    → Hash join", `      → Full scan videos  ${fmt(V)}`, `      → Full scan users   ${fmt(U)}`];
    }
    plan.textContent = "Query plan (chosen by the database)\n" + lines.join("\n");
    sRead.v.textContent = fmt(rows);
    const ms = rows / 2e5 * 1000; sTime.v.textContent = ms < 1 ? "< 1 ms" : ms < 1000 ? `${fmt(ms)} ms` : `${fmt(ms / 1000, 1)} s`;
  }
  [vids, idx].forEach((x) => x.addEventListener("input", () => { draw(); sfx("tick", 0.12); }));
  bench.append(h("div.bench-grid", {}, h("div", { style: "display:grid; gap:12px; align-content:start" }, sql,
    h("label.field", { for: "jn-v" }, h("span", {}, "Videos in the table: ", vO), vids),
    h("label.row", { for: "jn-ix", style: "gap:8px; color:var(--text)" }, idx, "Indexes on city and creator"),
    h("div.stats", {}, sRead.el, sTime.el)), plan),
    h("p.note", {}, "The plan is simplified, in the style of PostgreSQL's EXPLAIN. Assumes 1 in 20 rows is a user, 1% of users are in London, and about 200,000 rows read per second per query."),
    takeaway("You describe what you want; the database works out how, using its indexes."));
  draw();
}

/** Isolation: two payments at the same moment. */
export function isolationLab(bench: HTMLElement) {
  let iso = false;
  const pick = seg("Two payments at once", [["No isolation", false], ["Transactions (isolated)", true]], iso, (v) => { iso = v; run(); });
  const lanes = h("div", { style: "display:grid; grid-template-columns:1fr 1fr; gap:10px" });
  const sBal = stat("Maya's balance afterwards", "--net"), sOk = stat("should be", "--good", "$20");
  async function run() {
    lanes.innerHTML = "";
    const A = h("pre.term", { style: "height:auto; white-space:pre-wrap; min-height:150px; margin:0" }), B = h("pre.term", { style: "white-space:pre-wrap; min-height:150px; margin:0" });
    lanes.append(h("div", {}, h("span.eyebrow", {}, "Pays Sam $50"), A), h("div", {}, h("span.eyebrow", {}, "Pays Ali $50"), B));
    let bal = 120;
    const s = (el: HTMLElement, t: string) => { el.textContent += t + "\n"; };
    if (!iso) {
      s(A, "read balance → 120"); await wait(300); s(B, "read balance → 120"); await wait(300);
      s(A, "write 120 − 50 = 70"); bal = 70; await wait(300); s(B, "write 120 − 50 = 70"); bal = 70; await wait(300);
      s(B, "⚠ overwrote the first payment"); sfx("miss", 0.2);
    } else {
      s(A, "BEGIN · lock row 42"); s(B, "BEGIN · wait for row 42 …"); await wait(400);
      s(A, "read 120 → write 70"); bal = 70; await wait(300); s(A, "COMMIT · unlock"); await wait(300);
      s(B, "lock row 42 · read 70"); await wait(300); s(B, "write 70 − 50 = 20 · COMMIT"); bal = 20; sfx("hit", 0.2);
    }
    sBal.v.textContent = `$${bal}`; sBal.v.style.color = `var(${bal === 20 ? "--good" : "--bad"})`;
  }
  bench.append(pick, lanes, h("div.stats", {}, sBal.el, sOk.el),
    h("p.note", {}, "Real databases use row locks or multiple versions of each row (MVCC); the result is the same: as if one ran after the other."),
    takeaway("Isolation means two transactions behave as if they ran one after the other."));
  run();
}

/** When things break: N+1 queries and the forgotten index. */
export async function breakLab(bench: HTMLElement) {
  const n = h("input#np-n", { type: "range", min: 10, max: 500, step: 10, value: 200 }) as HTMLInputElement;
  const rtt = h("input#np-r", { type: "range", min: 0.2, max: 5, step: 0.1, value: 1 }) as HTMLInputElement;
  const nO = h("output", {}), rO = h("output", {});
  const s1 = stat("one query per comment", "--bad"), s2 = stat("one query for all of them", "--good"), s3 = stat("round trips saved", "--storage");
  const box = chartBox("Page load time against number of comments");
  bench.append(h("div.bench-grid", {}, h("div", { style: "display:grid; gap:12px; align-content:start" },
    h("label.field", { for: "np-n" }, h("span", {}, "Comments on the page: ", nO), n),
    h("label.field", { for: "np-r" }, h("span", {}, "Each trip to the database: ", rO), rtt),
    h("div.stats", {}, s1.el, s2.el, s3.el),
    h("pre.json", {}, "-- N+1: once for the page, then once per comment\nSELECT * FROM users WHERE id = $1;  ×N\n\n-- batched\nSELECT * FROM users WHERE id = ANY($1);")), box),
    h("p.note", {}, "Illustrative: each query costs one round trip plus about 0.1 ms of work."),
    takeaway("Load related rows in one query, not one per item."));
  const c = await makeChart(box, "line", [], [{ label: "N+1 (ms)", data: [], colour: "--bad" }, { label: "batched (ms)", data: [], colour: "--good" }], { yFmt: (v) => `${v} ms` });
  function draw() {
    const N = +n.value, R = +rtt.value; nO.textContent = String(N); rO.textContent = `${R} ms`;
    const a = (N + 1) * (R + 0.1), b = 2 * R + 0.1 * (1 + N / 50);
    s1.v.textContent = `${fmt(a)} ms`; s2.v.textContent = `${fmt(b, 1)} ms`; s3.v.textContent = fmt(N - 1);
    const xs = Array.from({ length: 11 }, (_, i) => i * 50);
    c.labels(xs.map(String)); c.set(0, xs.map((x) => (x + 1) * (R + 0.1))); c.set(1, xs.map((x) => 2 * R + 0.1 * (1 + x / 50))); c.update();
  }
  [n, rtt].forEach((x) => x.addEventListener("input", draw));
  draw();
}

/** SQL injection, with a harmless placeholder, on a tiny in-browser table. */
export function injectionLab(bench: HTMLElement) {
  const USERS = [["Maya", "maya@mail.com"], ["Sam", "sam@mail.com"], ["Ali", "ali@mail.com"], ["Priya", "priya@mail.com"]];
  const input = h("input#inj-in", { type: "text", value: "Sam", "aria-label": "Search by name", style: "font: 500 0.9rem var(--mono); padding:8px 10px; border-radius:8px; border:1px solid var(--line); background:var(--bg); color:var(--text); width:100%" }) as HTMLInputElement;
  const trick = h("button.btn", { type: "button" }, "Type  ' OR '1'='1");
  const bad = h("pre.json", {}), good = h("pre.json", {});
  const res = (rows: string[][], ok: boolean) => `\n\n${ok ? "→" : "⚠"} ${rows.length} row${rows.length === 1 ? "" : "s"}: ${rows.map((r) => r[0]).join(", ") || "none"}`;
  function draw() {
    const v = input.value;
    const q = `SELECT name, email FROM users\nWHERE name = '${v}';`;
    const hacked = /'\s*or\s*'1'\s*=\s*'1/i.test(v);
    const r1 = hacked ? USERS : USERS.filter((u) => u[0] === v);
    bad.innerHTML = ""; bad.append(h("span", { style: "color:var(--bad)" }, "Pasting the text into the query\n"), q, res(r1, !hacked));
    good.innerHTML = ""; good.append(h("span", { style: "color:var(--good)" }, "Passing it separately\n"), "SELECT name, email FROM users\nWHERE name = $1;\n-- $1 = " + JSON.stringify(v), res(USERS.filter((u) => u[0] === v), true));
  }
  input.addEventListener("input", draw);
  trick.addEventListener("click", () => { input.value = "' OR '1'='1"; draw(); sfx("miss", 0.2); });
  bench.append(h("div", { style: "display:grid; gap:10px" }, h("label.field", { for: "inj-in" }, "Search for a user by name", input), h("div.row", {}, trick)),
    h("div", { style: "display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr)); gap:12px; margin-top:12px" }, bad, good),
    h("p.note", {}, "A harmless textbook example on a fake four-row table in your browser. OWASP Top 10: Injection; fix with parameterised queries."),
    takeaway("Always pass user input separately from the query, never paste it in."));
  draw();
}
