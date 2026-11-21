import { h, sfx, takeaway, fmt } from "../kit/ui";
import { seg, stat } from "../kit/episode";
import { chartBox, makeChart } from "../kit/chart";

const big = (n: number) => n >= 1e9 ? `${fmt(n / 1e9, 1)} billion` : n >= 1e6 ? `${fmt(n / 1e6, 1)} million` : fmt(n);

/** Hero: Maya posts. Push it into every follower's feed, pull it when they open the app, or mix. */
export function fanoutHero() {
  let mode: "push" | "pull" | "mix" = "mix";
  const pick = seg("Build feeds by", [["Fan-out on write (push)", "push"], ["Fan-out on read (pull)", "pull"], ["Push, but pull celebrities", "mix"]], mode, (v) => { mode = v as typeof mode; draw(); sfx("tick", 0.15); });
  const f = h("input#fo-f", { type: "range", min: 2, max: 8.5, step: 0.1, value: 2.5 }) as HTMLInputElement;
  const fO = h("output", {});
  const sW = stat("feed writes when she posts", "--storage"), sR = stat("lookups when Sam opens the app", "--net"), sV = stat("verdict", "--good");
  const fol = h("input#fo-n", { type: "range", min: 10, max: 2000, step: 10, value: 300 }) as HTMLInputElement;
  const nO = h("output", {});
  const CELEB = 1e6;
  function draw() {
    const F = Math.round(10 ** +f.value), N = +fol.value;
    fO.textContent = big(F); nO.textContent = fmt(N);
    const celebsSamFollows = Math.max(1, Math.round(N / 100));
    let w: number, r: number;
    if (mode === "push") { w = F; r = 1; }
    else if (mode === "pull") { w = 0; r = N; }
    else { w = F >= CELEB ? 0 : F; r = 1 + celebsSamFollows; }
    sW.v.textContent = big(w); sR.v.textContent = fmt(r);
    const bad = w > 5e7 ? "posting one photo means " + big(w) + " writes" : r > 200 ? "every app open is " + fmt(r) + " lookups across shards" : "";
    sV.v.textContent = bad ? "too slow" : "fast"; sV.v.style.color = `var(${bad ? "--bad" : "--good"})`;
    say.textContent = bad ? `Problem: ${bad}.` : mode === "mix" ? (F >= CELEB ? "Maya is a celebrity here: her post isn't pushed. Followers pull it in when they open the app and merge it." : "Maya's post ID is pushed into each follower's ready-made feed. Sam's feed is one quick read, plus the few celebrities he follows.") : mode === "push" ? "Heavy work at post time, so opening the app is one quick read." : "Nothing to do at post time, but every app open has to gather posts from everyone Sam follows.";
  }
  const say = h("p.dim", { "aria-live": "polite", style: "min-height:2.6em; margin:0" });
  [f, fol].forEach((x) => x.addEventListener("input", draw));
  draw();
  return h("div.bench", { style: "display:grid; gap:12px" }, pick,
    h("label.field", { for: "fo-f" }, h("span", {}, "Maya's followers: ", fO), f),
    h("label.field", { for: "fo-n" }, h("span", {}, "Accounts Sam follows: ", nO), fol),
    h("div.stats", {}, sW.el, sR.el, sV.el), say,
    h("p.note", { style: "margin:0" }, "Illustrative: accounts over 1 million followers count as celebrities; about 1 in 100 accounts Sam follows is one."));
}

/** Instagram-style IDs: time, shard, counter. Every shard makes its own; sorting by ID sorts by time. */
export function idLab(bench: HTMLElement) {
  const EPOCH = 1314220021721n; // from Instagram's 2012 post
  const seq: Record<number, number> = {};
  const list: { id: bigint; shard: number; t: number }[] = [];
  const out = h("div", { style: "display:grid; gap:6px" });
  const sorted = h("pre.json", {});
  const make = (shard: number) => {
    const t = Date.now() + list.length * 7;
    seq[shard] = ((seq[shard] ?? 0) + 1) % 1024;
    const id = ((BigInt(t) - EPOCH) << 23n) | (BigInt(shard) << 10n) | BigInt(seq[shard]);
    list.push({ id, shard, t }); draw(); sfx("pop", 0.12);
  };
  function draw() {
    out.innerHTML = "";
    list.slice(-4).reverse().forEach(({ id }) => {
      const b = id.toString(2).padStart(64, "0");
      out.append(h("div", { style: "font: 500 0.72rem/1.5 var(--mono); overflow-x:auto; white-space:nowrap" },
        h("span", { style: "color:var(--faint)" }, b.slice(0, 23)), h("span", { style: "color:var(--net)" }, b.slice(23, 41)), " ", h("span", { style: "color:var(--storage)" }, b.slice(41, 54)), " ", h("span", { style: "color:var(--good)" }, b.slice(54)), h("span", { style: "color:var(--text)" }, `  = ${id}`)));
    });
    sorted.textContent = "sorted by ID → sorted by time\n" + [...list].sort((a, b) => (a.id < b.id ? -1 : 1)).slice(-6).map((x) => `${x.id}  shard ${String(x.shard).padStart(4)}  ${new Date(x.t).toISOString().slice(11, 23)}`).join("\n");
  }
  const btns = [7, 1341, 4011].map((s) => { const b = h("button.btn", { type: "button" }, `New post on shard ${s}`); b.addEventListener("click", () => make(s)); return b; });
  bench.append(h("div.row", {}, ...btns),
    h("p.dim", { style: "margin:4px 0" }, h("span", { style: "color:var(--net)" }, "■ milliseconds since a fixed start (41 bits)"), "  ", h("span", { style: "color:var(--storage)" }, "■ shard (13 bits)"), "  ", h("span", { style: "color:var(--good)" }, "■ counter in that shard (10 bits)")),
    out, sorted,
    h("p.note", {}, "The scheme Instagram described in \"Sharding & IDs at Instagram\" (2012), run in your browser with BigInt."),
    takeaway("Build each ID from time, shard and a counter: no central machine, no collisions, and IDs sort by time."));
  [7, 1341, 4011, 7].forEach(make);
}

/** Sam opens the app: gather from everyone he follows, or read one ready-made list. */
export async function openLab(bench: HTMLElement) {
  const n = h("input#op-n", { type: "range", min: 10, max: 2000, step: 10, value: 1000 }) as HTMLInputElement;
  const nO = h("output", {});
  const sPull = stat("pull: gather and merge", "--bad"), sPush = stat("push: read the ready-made list", "--good");
  const c = chartBox("Time to open the feed against accounts followed", 220);
  bench.append(h("div.bench-grid", {}, h("div", { style: "display:grid; gap:12px; align-content:start" }, h("label.field", { for: "op-n" }, h("span", {}, "Accounts Sam follows: ", nO), n), h("div.stats", {}, sPull.el, sPush.el)), c),
    h("p.note", {}, "Illustrative: lookups go to 64 shards in parallel batches of about 50 at a time, each round about 5 ms; reading a cached list and fetching 20 posts is about 15 ms."),
    takeaway("Fan-out on write does the heavy lifting when someone posts, so opening the app is fast."));
  const pull = (k: number) => 10 + Math.ceil(k / 50) * 5 + k * 0.05, push = () => 15;
  const xs = [10, 100, 250, 500, 1000, 1500, 2000];
  const ch = await makeChart(c, "line", xs.map(String), [{ label: "fan-out on read (ms)", data: xs.map(pull), colour: "--bad" }, { label: "fan-out on write (ms)", data: xs.map(push), colour: "--good" }], { yFmt: (v) => `${v} ms`, xTitle: "accounts followed" });
  function draw() { const k = +n.value; nO.textContent = fmt(k); sPull.v.textContent = `${fmt(pull(k))} ms`; sPush.v.textContent = `${push()} ms`; }
  n.addEventListener("input", draw); draw(); ch.update();
}

/** Ranking: score the candidates by signals. */
export function rankLab(bench: HTMLElement) {
  const POSTS = [
    { who: "Maya (best friend)", age: 3, close: 0.95, likes: 40, topic: "travel" },
    { who: "Coffee shop you follow", age: 1, close: 0.1, likes: 120, topic: "food" },
    { who: "Sam (cousin)", age: 20, close: 0.8, likes: 15, topic: "pets" },
    { who: "Football club", age: 2, close: 0.2, likes: 90000, topic: "sport" },
    { who: "Old classmate", age: 6, close: 0.3, likes: 8, topic: "travel" },
  ];
  const sl = (id: string, label: string, v: number) => { const i = h(`input#${id}`, { type: "range", min: 0, max: 10, step: 1, value: v }) as HTMLInputElement; const o = h("output", {}); return { i, o, el: h("label.field", { for: id }, h("span", {}, label, o), i) }; };
  const wClose = sl("rk-c", "Who you interact with most: ", 7), wNew = sl("rk-n", "How recent: ", 5), wPop = sl("rk-p", "How popular: ", 2), wTopic = sl("rk-t", "You tend to like travel: ", 4);
  const list = h("ol", { style: "display:grid; gap:6px; margin:0; padding-left:20px" });
  function draw() {
    [wClose, wNew, wPop, wTopic].forEach((s) => { s.o.textContent = s.i.value; });
    const scored = POSTS.map((p) => ({ p, s: +wClose.i.value * p.close + +wNew.i.value * (1 / (1 + p.age / 6)) + +wPop.i.value * (Math.log10(p.likes + 1) / 5) + (p.topic === "travel" ? +wTopic.i.value * 0.5 : 0) })).sort((a, b) => b.s - a.s);
    list.innerHTML = "";
    scored.forEach(({ p, s }, i) => list.append(h("li", {}, h("b", { style: `color:var(${i === 0 ? "--good" : "--text"})` }, p.who), h("span.dim", {}, ` · ${p.age} h ago · ${fmt(p.likes)} likes · ${p.topic} · score ${fmt(s, 1)}`))));
  }
  [wClose, wNew, wPop, wTopic].forEach((s) => s.i.addEventListener("input", draw));
  bench.append(h("div.bench-grid", {}, h("div", { style: "display:grid; gap:10px; align-content:start" }, wClose.el, wNew.el, wPop.el, wTopic.el), h("div", {}, h("span.eyebrow", {}, "Sam's feed, ranked"), list)),
    h("p.note", {}, "A toy score. Real ranking uses many learned signals, computed ahead of time and cached, in a fraction of a second per feed."),
    takeaway("The ready-made feed gives candidates; a ranking system scores them and puts the best first."));
  draw();
}

/** Likes: one counter row hammered, or sharded counters, or a cache flushed in batches. */
export function likesLab(bench: HTMLElement) {
  const rate = h("input#lk-r", { type: "range", min: 100, max: 20000, step: 100, value: 5000 }) as HTMLInputElement;
  const rO = h("output", {});
  let mode: "one" | "split" | "batch" = "one";
  const pick = seg("Keep the count in", [["One counter row", "one"], ["16 counters added together", "split"], ["Cache, saved every 2 s", "batch"]], mode, (v) => { mode = v as typeof mode; draw(); sfx("tick", 0.15); });
  const sOK = stat("likes a second the count can keep up with", "--good"), sLag = stat("how far behind the number you see is", "--storage"), sDB = stat("database writes a second for the count", "--net");
  const ROW = 1000; // illustrative updates a second one row can take under locking
  function draw() {
    const R = +rate.value; rO.textContent = fmt(R);
    const cap = mode === "one" ? ROW : mode === "split" ? ROW * 16 : Infinity;
    sOK.v.textContent = cap === Infinity ? "practically any" : fmt(cap); sOK.v.style.color = `var(${R > cap ? "--bad" : "--good"})`;
    sLag.v.textContent = R > cap ? "growing (queued up)" : mode === "batch" ? "≈ 2 s" : "≈ 0"; sLag.v.style.color = `var(${R > cap ? "--bad" : "--storage"})`;
    sDB.v.textContent = mode === "batch" ? "0.5" : fmt(Math.min(R, cap));
  }
  rate.addEventListener("input", draw);
  bench.append(h("div", { style: "display:grid; gap:12px" }, pick, h("label.field", { for: "lk-r" }, h("span", {}, "Likes a second on a popular post: ", rO), rate), h("div.stats", {}, sOK.el, sLag.el, sDB.el)),
    h("p.note", {}, "Illustrative: one row can take about 1,000 locked updates a second. Each like is still saved as its own row so you can see who liked what; only the total is approximate."),
    takeaway("Split or batch the counter; the number can be a few seconds behind, and nobody minds."));
  draw();
}

/** Shared infrastructure: October 2021. */
export function sharedLab(bench: HTMLElement) {
  const deps: Record<string, string[]> = { "Facebook": ["Backbone network", "DNS", "Login"], "Instagram": ["Backbone network", "DNS", "Login"], "WhatsApp": ["Backbone network", "DNS"], "Messenger": ["Backbone network", "DNS", "Login"] };
  const infra = ["Backbone network", "DNS", "Login"];
  const down = new Set<string>();
  const apps = h("div", { style: "display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,130px),1fr)); gap:8px" });
  const say = h("p", { "aria-live": "polite", style: "min-height:2.4em; margin:0" });
  const tog = h("div.row", {}, ...infra.map((x) => { const b = h("button.btn", { type: "button" }, `Break ${x}`); b.addEventListener("click", () => { down.has(x) ? down.delete(x) : down.add(x); b.style.borderColor = down.has(x) ? "var(--bad)" : ""; draw(); sfx(down.has(x) ? "powerdown" : "pop", 0.2); }); return b; }));
  function draw() {
    apps.innerHTML = ""; let n = 0;
    Object.entries(deps).forEach(([a, d]) => { const isDown = d.some((x) => down.has(x)); if (isDown) n++; apps.append(h("div.box", { style: `--bc: var(${isDown ? "--bad" : "--good"}); min-height:auto` }, h("b", {}, a), h("span", {}, isDown ? "down" : "up"))); });
    say.textContent = down.size === 0 ? "Break one shared piece." : `${n} of 4 apps down from ${down.size} shared failure${down.size > 1 ? "s" : ""}.`;
  }
  bench.append(tog, apps, say,
    h("p.note", {}, "On 4 October 2021 a configuration change disconnected Facebook's backbone and its DNS servers withdrew their routes; Facebook, Instagram, WhatsApp and Messenger were down for about six hours (Meta engineering post, Oct 2021). The dependency map here is simplified."),
    takeaway("Sharing infrastructure saves money, but it also shares failures."));
  draw();
}

