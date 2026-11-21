import { h, sfx, takeaway, fmt, sleep, reducedMotion } from "../kit/ui";
import { seg, stat, seeded } from "../kit/episode";
import { chartBox, makeChart } from "../kit/chart";
import { hash } from "../e13/ring";

const wait = (ms: number) => sleep(reducedMotion() ? 0 : ms);
const box = (label: string, sub: string, c: string, extra = "") => h("div.box", { style: `--bc: var(${c}); min-height:auto; ${extra}` }, h("b", {}, label), h("span", {}, sub));

/** Hero: one leader, some replicas. Reads spread out; writes don't. Then kill the leader. */
export function replicaHero() {
  const n = h("input#rp-n", { type: "range", min: 0, max: 5, step: 1, value: 2 }) as HTMLInputElement;
  const nO = h("output", {});
  const kill = h("button.btn", { type: "button" }, "Kill the leader");
  const reset = h("button.btn", { type: "button" }, "Reset");
  const row = h("div", { style: "display:grid; grid-template-columns:repeat(auto-fit,minmax(88px,1fr)); gap:8px" });
  const sR = stat("reads a second the cluster can answer", "--good"), sW = stat("writes a second (still one leader)", "--storage");
  const say = h("p.dim", { "aria-live": "polite", style: "min-height:2.6em; margin:0" });
  const PER = 10000;
  let dead = false, promoted = -1;
  function draw() {
    const R = +n.value; nO.textContent = String(R);
    const alive = R + 1 - (dead && promoted < 0 ? 1 : 0);
    sR.v.textContent = fmt(alive * PER); sW.v.textContent = dead && promoted < 0 ? "0" : fmt(PER);
    row.innerHTML = "";
    row.append(dead ? box("💀 old leader", "gone", "--bad", "opacity:0.55") : box("Leader", "writes + reads", "--storage"));
    for (let i = 0; i < R; i++) row.append(i === promoted ? box("New leader", "promoted", "--storage") : box(`Replica ${i + 1}`, "reads", "--ram"));
  }
  n.addEventListener("input", () => { dead = false; promoted = -1; draw(); sfx("tick", 0.12); say.textContent = `${+n.value + 1} machines answer reads. Writes still all go through one.`; });
  kill.addEventListener("click", async () => {
    if (dead) return; dead = true; promoted = -1; draw(); sfx("powerdown", 0.25);
    if (+n.value === 0) { say.textContent = "No replicas: the whole app is down, and anything not on disk is gone."; return; }
    say.textContent = "The leader is gone. Writes stop while a replica is chosen…"; await wait(900);
    promoted = 0; draw(); sfx("hit", 0.2);
    say.textContent = "Replica 1 already had almost all the data, so it's promoted to leader. Writes resume.";
  });
  reset.addEventListener("click", () => { dead = false; promoted = -1; draw(); say.textContent = ""; });
  draw(); say.textContent = "Every write goes to the leader, which sends each change on to its replicas.";
  return h("div.bench", { style: "display:grid; gap:12px" },
    h("label.field", { for: "rp-n" }, h("span", {}, "Replicas: ", nO), n), row,
    h("div.row", {}, kill, reset), h("div.stats", {}, sR.el, sW.el), say,
    h("p.note", { style: "margin:0" }, "Illustrative: each machine answers 10,000 reads or writes a second."));
}

/** The break: Maya's comment vanishes after a refresh. Then read your own writes. */
export function lagLab(bench: HTMLElement) {
  const lag = h("input#lg-l", { type: "range", min: 0, max: 5, step: 0.5, value: 2 }) as HTMLInputElement;
  const lagO = h("output", {});
  const ryow = h("input#lg-r", { type: "checkbox" }) as HTMLInputElement;
  const go = h("button.btn.primary", { type: "button" }, "Post a comment, then refresh");
  const feed = h("div", { style: "display:grid; gap:6px; padding:12px; border-radius:12px; background:#0b1124; border:1px solid var(--line); min-height:130px; align-content:start" });
  const log = h("pre.term", { style: "height:auto; white-space:pre-wrap; min-height:130px" });
  lag.addEventListener("input", () => { lagO.textContent = `${lag.value} s`; });
  lagO.textContent = `${lag.value} s`;
  go.addEventListener("click", async () => {
    feed.innerHTML = ""; log.textContent = "";
    const L = +lag.value * 1000, t0 = performance.now();
    const base = [h("div.chip", {}, "Sam: great video!"), h("div.chip", {}, "Ali: 🔥")];
    log.textContent += "write → leader: \"Love this place\" ✓\n"; sfx("pop", 0.15); await wait(400);
    const el = performance.now() - t0;
    const toLeader = ryow.checked;
    const seen = toLeader || el >= L;
    log.textContent += `refresh → ${toLeader ? "leader (your own recent write)" : "replica 2"}${!toLeader ? ` · ${el >= L ? "caught up" : `still ${fmt((L - el) / 1000, 1)} s behind`}` : ""}\n`;
    feed.append(...base); if (seen) feed.append(h("div.chip", { style: "color:var(--good)" }, "Maya: Love this place"));
    sfx(seen ? "hit" : "miss", 0.2);
    log.textContent += seen ? "Maya sees her comment.\n" : "Maya's comment has vanished. 😟\n";
  });
  bench.append(h("div.bench-grid", {}, h("div", { style: "display:grid; gap:12px; align-content:start" },
    h("label.field", { for: "lg-l" }, h("span", {}, "Replica lag: ", lagO), lag),
    h("label.row", { for: "lg-r", style: "gap:8px; color:var(--text)" }, ryow, "Read your own recent writes from the leader"), go, feed), log),
    takeaway("Replicas fall slightly behind. For your own recent changes, read from the leader."));
  go.click();
}

/** Sync or async: how long each write takes, and what a crash can lose. */
export async function syncLab(bench: HTMLElement) {
  let mode: "sync" | "async" | "semi" = "semi";
  const pick = seg("Replication", [["Synchronous (wait for all)", "sync"], ["Asynchronous", "async"], ["One nearby in sync, rest async", "semi"]], mode, (v) => { mode = v as typeof mode; draw(); sfx("tick", 0.15); });
  const far = h("input#sy-far", { type: "range", min: 10, max: 250, step: 10, value: 150 }) as HTMLInputElement;
  const farO = h("output", {});
  const sLat = stat("time for each write", "--net"), sLost = stat("committed writes lost if the leader dies", "--bad");
  const c = chartBox("Write latency by replication mode", 200);
  bench.append(h("div.bench-grid", {}, h("div", { style: "display:grid; gap:12px; align-content:start" }, pick,
    h("label.field", { for: "sy-far" }, h("span", {}, "Round trip to the far replica (other continent): ", farO), far),
    h("div.stats", {}, sLat.el, sLost.el)), c),
    h("p.note", {}, "Illustrative: 2 ms to write locally, 1 ms to a replica in the same region, 1,000 writes a second, async replicas about 50 ms behind."),
    takeaway("Synchronous never loses a committed write but makes every write wait; asynchronous is fast but can lose the last few."));
  const ch = await makeChart(c, "bar", ["Synchronous", "Asynchronous", "Semi-sync"], [{ label: "ms per write", data: [], colour: "--net" }], { yFmt: (v) => `${v} ms` });
  function draw() {
    const F = +far.value; farO.textContent = `${F} ms`;
    const lat = { sync: 2 + F, async: 2, semi: 3 }, lost = { sync: "0", async: "≈ 50", semi: "0" };
    sLat.v.textContent = `${lat[mode]} ms`; sLost.v.textContent = lost[mode];
    sLost.v.style.color = `var(${lost[mode] === "0" ? "--good" : "--bad"})`;
    ch.set(0, [lat.sync, lat.async, lat.semi]); ch.update();
  }
  far.addEventListener("input", draw);
  draw();
}

/** The shard key: range vs hash, for a wave of new sign-ups. */
export async function shardKeyLab(bench: HTMLElement) {
  let mode: "range" | "hash" = "range";
  const pick = seg("Shard by", [["Range of user IDs", "range"], ["Hash of user ID", "hash"]], mode, (v) => { mode = v as typeof mode; draw(); sfx("tick", 0.15); });
  const sMax = stat("busiest shard's share of new writes", "--storage");
  const c = chartBox("New sign-ups per shard", 220);
  bench.append(h("div.bench-grid", {}, h("div", { style: "display:grid; gap:12px; align-content:start" }, pick, sMax.el,
    h("p.dim", { style: "margin:0" }, "8 shards, a million user IDs each. Today, 50,000 new people sign up, getting IDs 7,950,001 onwards.")), c),
    takeaway("Range sharding sends every new user to the newest shard; hashing spreads them evenly."));
  const ch = await makeChart(c, "bar", Array.from({ length: 8 }, (_, i) => `S${i + 1}`), [{ label: "new sign-ups", data: [], colour: "--storage" }]);
  function draw() {
    const counts = Array(8).fill(0);
    for (let id = 7950001; id < 8000001; id++) counts[mode === "range" ? Math.min(7, Math.floor((id - 1) / 1e6)) : hash(`u${id}`) % 8]++;
    const mx = Math.max(...counts); sMax.v.textContent = `${fmt((mx / 50000) * 100)}%`;
    sMax.v.style.color = `var(${mx > 12000 ? "--bad" : "--good"})`;
    ch.set(0, counts); ch.update();
  }
  draw();
}

/** Logical shards: 480 slices on a few machines; growing moves slices, not rows. */
export function logicalLab(bench: HTMLElement) {
  const LOG = 480;
  const n = h("input#lo-n", { type: "range", min: 8, max: 64, step: 8, value: 32 }) as HTMLInputElement;
  const nO = h("output", {});
  const add = h("button.btn.primary", { type: "button" }, "Add one machine");
  const grid = h("div", { style: "display:grid; grid-template-columns:repeat(40,minmax(0,1fr)); gap:2px; max-width:640px" });
  const sMoved = stat("data moved, logical shards", "--good"), sNaive = stat("data moved, hash mod machines", "--bad"), sPer = stat("logical shards per machine", "--ram");
  let N = 32, owner: number[] = [];
  const COLORS = ["#38BDF8", "#4ADE80", "#FBBF24", "#A78BFA", "#2DD4BF", "#FB7185", "#F472B6", "#94A3B8"];
  function layout(m: number) { owner = Array.from({ length: LOG }, (_, i) => Math.floor((i * m) / LOG)); }
  function draw(moved = new Set<number>()) {
    nO.textContent = String(N); sPer.v.textContent = fmt(LOG / N, 1);
    grid.innerHTML = "";
    owner.forEach((o, i) => grid.append(h("i", { title: `logical shard ${i} → machine ${o + 1}`, style: `display:block; aspect-ratio:1; border-radius:2px; background:${moved.has(i) ? "#fff" : COLORS[o % 8]}; opacity:${moved.has(i) ? 1 : 0.55}` })));
  }
  n.addEventListener("input", () => { N = +n.value; layout(N); draw(); sMoved.v.textContent = "–"; sNaive.v.textContent = "–"; });
  add.addEventListener("click", () => {
    const per = Math.floor(LOG / (N + 1)), moved = new Set<number>();
    const load = Array(N).fill(0); owner.forEach((o) => load[o]++);
    for (let k = 0; k < per; k++) { const m = load.indexOf(Math.max(...load)); const i = owner.findIndex((o, j) => o === m && !moved.has(j)); owner[i] = N; load[m]--; moved.add(i); }
    let naive = 0; for (let u = 0; u < 20000; u++) { const hh = hash(`w${u}`); if (hh % N !== hh % (N + 1)) naive++; }
    N++; n.value = String(Math.min(64, N));
    sMoved.v.textContent = `${fmt((moved.size / LOG) * 100, 1)}%`; sNaive.v.textContent = `${fmt((naive / 20000) * 100)}%`;
    draw(moved); sfx("hit", 0.2);
  });
  layout(N); draw();
  bench.append(h("div", { style: "display:grid; gap:12px" }, h("label.field", { for: "lo-n" }, h("span", {}, "Physical databases: ", nO), n), h("div.row", {}, add), grid, h("div.stats", {}, sMoved.el, sNaive.el, sPer.el)),
    h("p.note", {}, "Notion described 480 logical shards on 32 physical databases, keyed by workspace (Notion engineering blog, 2021). White squares are the slices that moved."),
    takeaway("Create many small logical shards up front, so growing the database means moving a few slices, not reshuffling everything."));
}

/** Split brain: the old leader was only cut off, not dead. */
export function splitBrainLab(bench: HTMLElement) {
  let fence = false;
  const pick = seg("When the old leader loses contact", [["Keeps accepting writes", false], ["Steps down (fencing)", true]], fence, (v) => { fence = v; run(); });
  const left = h("pre.term", { style: "height:auto; white-space:pre-wrap; min-height:180px; margin:0" }), right = h("pre.term", { style: "white-space:pre-wrap; min-height:180px; margin:0" });
  const sC = stat("writes that conflict when the link returns", "--bad");
  async function run() {
    left.textContent = ""; right.textContent = ""; sC.v.textContent = "…";
    const L = (t: string) => { left.textContent += t + "\n"; }, R = (t: string) => { right.textContent += t + "\n"; };
    L("leader · east"); R("replica · west"); await wait(300);
    L("─── network link cut ───"); R("─── network link cut ───"); sfx("powerdown", 0.2); await wait(500);
    R("can't reach leader → promote myself"); R("I am the leader now"); await wait(400);
    if (!fence) {
      L("I'm still the leader"); L("✓ accept write: Maya likes video 7"); R("✓ accept write: Maya unlikes video 7"); await wait(300);
      L("✓ accept write: Sam renames channel"); R("✓ accept write: Sam deletes channel"); await wait(400);
      L("─── link returns ───"); R("─── link returns ───"); L("⚠ two leaders, two histories"); sC.v.textContent = "4"; sfx("miss", 0.2);
    } else {
      L("lost contact with the majority → step down"); L("✗ refuse writes (read-only)"); await wait(300);
      R("✓ accept write: Maya likes video 7"); R("✓ accept write: Sam renames channel"); await wait(400);
      L("─── link returns ───"); L("rejoin as a replica, catch up"); sC.v.textContent = "0"; sC.v.style.color = "var(--good)"; sfx("hit", 0.2); return;
    }
    sC.v.style.color = "var(--bad)";
  }
  bench.append(pick, h("div", { style: "display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr)); gap:10px; margin-top:10px" }, left, right), sC.el,
    h("p.note", {}, "Roughly what happened to GitHub on 21 October 2018: a 43-second network cut, writes moved coasts, and both sides held changes the other didn't (GitHub's post-incident analysis)."),
    takeaway("Before a new leader takes over, make sure the old one steps down."));
  run();
}

/** Cross-shard queries: ask every shard, wait for the slowest. */
export async function fanoutLab(bench: HTMLElement) {
  const n = h("input#fo-n", { type: "range", min: 1, max: 64, step: 1, value: 8 }) as HTMLInputElement;
  const nO = h("output", {});
  const sOne = stat("typical single-shard query", "--good"), sAll = stat("typical query across every shard", "--bad");
  const c = chartBox("Query time against number of shards", 220);
  bench.append(h("div.bench-grid", {}, h("div", { style: "display:grid; gap:12px; align-content:start" },
    h("label.field", { for: "fo-n" }, h("span", {}, "Shards: ", nO), n), h("div.stats", {}, sOne.el, sAll.el),
    h("p.dim", { style: "margin:0" }, "\"Top videos across all users\" must ask every shard and combine the answers, so it's as slow as the slowest shard.")), c),
    h("p.note", {}, "Simulated: each shard usually answers in about 5 ms, but 1 in 50 answers takes 50–100 ms."),
    takeaway("Choose a shard key that keeps related data together, so most queries touch one shard."));
  const r = seeded(11);
  const sample = () => (r() < 0.02 ? 50 + r() * 50 : 3 + r() * 4);
  const median = (k: number) => { const xs = Array.from({ length: 301 }, () => Math.max(...Array.from({ length: k }, sample))).sort((a, b) => a - b); return xs[150]; };
  const xs = [1, 2, 4, 8, 16, 32, 64], ys = xs.map(median);
  const ch = await makeChart(c, "line", xs.map(String), [{ label: "median ms, all shards", data: ys, colour: "--bad" }, { label: "one shard", data: xs.map(() => ys[0]), colour: "--good", dash: true }], { yFmt: (v) => `${v} ms`, xTitle: "shards" });
  function draw() { const k = +n.value; nO.textContent = String(k); sOne.v.textContent = `${fmt(ys[0], 1)} ms`; sAll.v.textContent = `${fmt(median(k), 1)} ms`; }
  n.addEventListener("input", draw); draw(); ch.update();
}
