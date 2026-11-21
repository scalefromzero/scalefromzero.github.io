import { h, sfx, takeaway, fmt, sleep, reducedMotion } from "../kit/ui";
import { seg, stat, seeded } from "../kit/episode";
import { flow } from "../kit/flow";
import { chartBox, makeChart } from "../kit/chart";

const wait = (ms: number) => sleep(reducedMotion() ? 0 : ms);
const d = (s: number) => (reducedMotion() ? 0 : s);

/** Hero: the two journeys. Sam uploads; Maya presses play. */
export function journeysHero() {
  const f = flow([
    { key: "sam", name: "Sam's phone", sub: "2 GB, train Wi-Fi", colour: "net" },
    { key: "store", name: "Object storage", sub: "raw upload", colour: "storage" },
    { key: "queue", name: "Queue", sub: "process me", colour: "cache" },
    { key: "tx", name: "Transcoders", sub: "segments in parallel", colour: "bad" },
    { key: "edge", name: "Cache in Maya's ISP", sub: "a short trip", colour: "ram" },
    { key: "maya", name: "Maya's player", sub: "New York", colour: "good" },
  ], 3);
  const up = h("button.btn.primary", { type: "button" }, "Sam uploads");
  const play = h("button.btn", { type: "button" }, "Maya presses play");
  const say = h("p.dim", { "aria-live": "polite", style: "min-height:2.6em; margin:0" }, "Two journeys: the upload, and the watch.");
  let busy = false;
  up.addEventListener("click", async () => {
    if (busy) return; busy = true;
    say.textContent = "Resumable chunks go up to storage; a message goes on the queue."; await f.travel(["sam", "store"], d(0.6), undefined, "#38BDF8"); sfx("pop", 0.15);
    await f.travel(["store", "queue"], d(0.4), undefined, "#A78BFA");
    say.textContent = "Hundreds of machines convert short segments at the same time, into every resolution and format."; await f.travel(["queue", "tx"], d(0.4), undefined, "#A78BFA");
    f.note("tx", "360p ✓ … 1080p ✓ … 4K ✓", "var(--good)"); sfx("hit", 0.2); await wait(700);
    await f.travel(["tx", "store"], d(0.5), undefined, "#4ADE80");
    say.textContent = "Every version is stored. Low quality is ready first; 4K a little later."; busy = false;
  });
  play.addEventListener("click", async () => {
    if (busy) return; busy = true;
    say.textContent = "Popular videos already sit in a cache inside Maya's own internet provider."; await f.travel(["store", "edge"], d(0.5), undefined, "#2DD4BF");
    for (let i = 0; i < 3; i++) { await f.travel(["edge", "maya"], d(0.3), undefined, "#4ADE80"); sfx("tick", 0.1); }
    f.note("maya", "playing · 1080p", "var(--good)");
    say.textContent = "A few seconds at a time, in the best quality her connection allows. It starts in about a second."; busy = false;
  });
  return h("div.bench", { style: "display:grid; gap:12px" }, f.el, h("div.row", {}, up, play), say);
}

/** Resumable upload on a train: carry on from the last chunk, or start over. */
export function resumableLab(bench: HTMLElement) {
  let resume = true;
  const pick = seg("When the Wi-Fi drops", [["Start over", false], ["Carry on from the last chunk", true]], resume, (v) => { resume = v; run(); });
  const drops = h("input#rs-d", { type: "range", min: 0, max: 12, step: 1, value: 6 }) as HTMLInputElement;
  const dO = h("output", {});
  const bar = h("div", { style: "height:16px; border-radius:8px; background:var(--net); width:0%" });
  const sT = stat("total time on the train", "--net"), sSent = stat("data actually sent", "--storage");
  const log = h("p.dim", { "aria-live": "polite", style: "min-height:2.4em; margin:0" });
  let token = 0;
  async function run() {
    const my = ++token, D = +drops.value; dO.textContent = `${D} times`;
    const r = seeded(D * 13 + 5), total = 2048, speed = 4; // MB per second
    const cuts = Array.from({ length: D }, () => 60 + r() * 900).sort((a, b) => a - b);
    let done = 0, sent = 0, t = 0, ci = 0, restarts = 0;
    while (done < total && t < 20000) {
      t += 1; done += speed; sent += speed;
      if (ci < cuts.length && t >= cuts[ci]) { ci++; restarts++; t += 20; done = resume ? Math.floor(done / 8) * 8 : 0; }
      if (t % 25 === 0) { bar.style.width = `${(done / total) * 100}%`; if (!reducedMotion()) await sleep(4); if (my !== token) return; }
    }
    bar.style.width = "100%";
    sT.v.textContent = `${fmt(t / 60, 1)} min`; sSent.v.textContent = `${fmt(sent / 1024, 1)} GB`;
    log.textContent = resume ? `${restarts} drops, and each time it carried on from the last 8 MB chunk.` : `${restarts} drops, and each one sent the upload back to zero.`;
    sfx(resume ? "hit" : "miss", 0.2);
  }
  drops.addEventListener("change", run);
  bench.append(h("div.bench-grid", {}, h("div", { style: "display:grid; gap:12px; align-content:start" }, pick, h("label.field", { for: "rs-d" }, h("span", {}, "Wi-Fi drops during the upload: ", dO), drops)),
    h("div", { style: "display:grid; gap:10px; align-content:start" }, h("div", { style: "background:var(--bg2); border:1px solid var(--line); border-radius:8px" }, bar), h("div.stats", {}, sT.el, sSent.el), log)),
    h("p.note", {}, "Illustrative: 2 GB at 4 MB/s, 8 MB chunks, 20 s to reconnect after each drop."),
    takeaway("A resumable upload carries on from the last chunk, not from the start."));
  run();
}

/** Transcoding: one machine, or cut the video into segments and convert them in parallel. */
export async function transcodeLab(bench: HTMLElement) {
  const len = h("input#tc-l", { type: "range", min: 1, max: 120, step: 1, value: 20 }) as HTMLInputElement;
  const m = h("input#tc-m", { type: "range", min: 1, max: 500, step: 1, value: 200 }) as HTMLInputElement;
  const lO = h("output", {}), mO = h("output", {});
  const s1 = stat("360p ready", "--good"), s2 = stat("4K ready", "--storage");
  const c = chartBox("Time until each version is ready", 220);
  bench.append(h("div.bench-grid", {}, h("div", { style: "display:grid; gap:12px; align-content:start" },
    h("label.field", { for: "tc-l" }, h("span", {}, "Video length: ", lO), len), h("label.field", { for: "tc-m" }, h("span", {}, "Machines working on it: ", mO), m), h("div.stats", {}, s1.el, s2.el)), c),
    h("p.note", {}, "Illustrative: converting takes 0.2× the video's length for 360p up to 4× for 4K on one machine; videos are cut into 10-second segments, plus 20 s to stitch. YouTube reported its own video chips (2021) were 20–33× more efficient than the servers they replaced."),
    takeaway("Cut the video into segments and convert them on hundreds of machines at once; low quality is ready first."));
  const R = [["360p", 0.2], ["720p", 0.6], ["1080p", 1.2], ["4K", 4]] as const;
  const ch = await makeChart(c, "bar", R.map((x) => x[0]), [{ label: "one machine (min)", data: [], colour: "--bad" }, { label: "in parallel (min)", data: [], colour: "--good" }], { yFmt: (v) => `${v} min` });
  function draw() {
    const L = +len.value, M = +m.value; lO.textContent = `${L} min`; mO.textContent = String(M);
    const segs = Math.ceil((L * 60) / 10);
    const one = R.map(([, k]) => L * k), par = R.map(([, k]) => (Math.ceil(segs / M) * 10 * k) / 60 + 20 / 60);
    s1.v.textContent = `${fmt(par[0] * 60)} s`; s2.v.textContent = par[3] < 1 ? `${fmt(par[3] * 60)} s` : `${fmt(par[3], 1)} min`;
    ch.set(0, one); ch.set(1, par); ch.update();
  }
  [len, m].forEach((x) => x.addEventListener("input", draw)); draw();
}

/** Recommendations in two stages. */
export function recLab(bench: HTMLElement) {
  const cand = h("input#rc-c", { type: "range", min: 1, max: 5, step: 0.1, value: 2.5 }) as HTMLInputElement;
  const cO = h("output", {});
  const sOne = stat("score every video carefully", "--bad"), sTwo = stat("two stages", "--good");
  const funnel = h("div", { style: "display:grid; gap:6px" });
  const TOTAL = 2e10, CAREFUL = 0.05, FAST = 2; // ms per careful score; ms for the fast candidate stage (index lookup)
  function draw() {
    const C = Math.round(10 ** +cand.value); cO.textContent = fmt(C);
    const one = (TOTAL * CAREFUL) / 1000, two = (FAST + C * CAREFUL) / 1000; // seconds, one machine
    sOne.v.textContent = `${fmt(one / 86400, 1)} days`; sTwo.v.textContent = two < 1 ? `${fmt(two * 1000)} ms` : `${fmt(two, 1)} s`;
    sTwo.v.style.color = `var(${two < 0.3 ? "--good" : "--bad"})`;
    funnel.innerHTML = "";
    ([["Every video", "20 billion", 100, "--line"], ["Stage 1: fast candidates", fmt(C), 55, "--net"], ["Stage 2: careful ranking", "top 20 shown", 20, "--good"]] as const).forEach(([a, b, w, col]) =>
      funnel.append(h("div", { style: `width:${w}%; min-width:180px; margin:0 auto; padding:8px 12px; border-radius:10px; border:1px solid var(${col}); background:color-mix(in srgb, var(${col}) 12%, var(--bg)); text-align:center` }, h("b", {}, a), h("div.dim", { style: "font-size:0.8rem" }, b))));
  }
  cand.addEventListener("input", draw);
  bench.append(h("div.bench-grid", {}, h("div", { style: "display:grid; gap:12px; align-content:start" }, h("label.field", { for: "rc-c" }, h("span", {}, "Candidates from stage 1: ", cO), cand), h("div.stats", {}, sOne.el, sTwo.el)), funnel),
    h("p.note", {}, "Illustrative costs: a careful score about 0.05 ms per video on one machine. The two-stage design is from \"Deep Neural Networks for YouTube Recommendations\" (Covington et al., 2016)."),
    takeaway("Narrow billions to a few hundred fast, then score those carefully."));
  draw();
}

/** Counting views: events, bot checks, and a count that updates in jumps. */
export function viewsLab(bench: HTMLElement) {
  const bots = h("input#vw-b", { type: "range", min: 0, max: 80, step: 5, value: 30 }) as HTMLInputElement;
  const bO = h("output", {});
  const go = h("button.btn.primary", { type: "button" }, "Premiere: 60 seconds of views");
  const sRaw = stat("view events received", "--storage"), sShown = stat("count on the page", "--good"), sBot = stat("rejected as bots", "--bad");
  bots.addEventListener("input", () => { bO.textContent = `${bots.value}%`; }); bO.textContent = `${bots.value}%`;
  go.addEventListener("click", async () => {
    const r = seeded(+bots.value + 1); let raw = 0, real = 0, shown = 0, rej = 0;
    for (let s = 1; s <= 60; s++) {
      const n = 800 + Math.floor(r() * 400);
      for (let i = 0; i < n; i++) { raw++; if (r() * 100 < +bots.value) rej++; else real++; }
      if (s % 15 === 0) { shown = real; sfx("tick", 0.12); }
      sRaw.v.textContent = fmt(raw); sShown.v.textContent = fmt(shown); sBot.v.textContent = fmt(rej);
      await wait(40);
    }
  });
  bench.append(h("div", { style: "display:grid; gap:12px" }, h("label.field", { for: "vw-b" }, h("span", {}, "Share of views from bots refreshing: ", bO), bots), go, h("div.stats", {}, sRaw.el, sShown.el, sBot.el)),
    h("p.note", {}, "Illustrative: checks run in 15-second batches here, so the page count pauses, then jumps."),
    takeaway("Views are events checked in a pipeline before they count, so the number runs a little behind, on purpose."));
  go.click();
}

/** Gangnam Style and the 32-bit counter. */
export function overflowLab(bench: HTMLElement) {
  const i32 = new Int32Array(1), I64 = { v: 0n };
  const start = 2147000000; i32[0] = start; I64.v = BigInt(start);
  const s32 = stat("32-bit counter", "--bad"), s64 = stat("64-bit counter", "--good");
  const add = h("button.btn.primary", { type: "button" }, "+100 million views");
  const reset = h("button.btn", { type: "button" }, "Reset to 2,147,000,000");
  const say = h("p", { "aria-live": "polite", style: "min-height:2.4em; margin:0" });
  function draw() { s32.v.textContent = fmt(i32[0]); s64.v.textContent = BigInt(I64.v).toLocaleString("en-US"); }
  add.addEventListener("click", () => { i32[0] = i32[0] + 100_000_000; I64.v += 100_000_000n; draw(); const wrapped = i32[0] < 0; sfx(wrapped ? "miss" : "pop", 0.2); say.textContent = wrapped ? "The 32-bit counter ran past 2,147,483,647 and wrapped round to a large negative number." : "Both counters agree, for now."; });
  reset.addEventListener("click", () => { i32[0] = start; I64.v = BigInt(start); draw(); say.textContent = ""; });
  bench.append(h("div.row", {}, add, reset), h("div.stats", {}, s32.el, s64.el), say,
    h("p.note", {}, "Real integer arithmetic in your browser (Int32Array vs BigInt). In December 2014 YouTube said it had already moved the view counter to 64 bits, which can count past 9 quintillion."),
    takeaway("Every limit you think you'll never hit, a big enough system eventually will."));
  draw();
}

/** A huge premiere: millions arrive before any nearby cache has a copy. */
export async function premiereLab(bench: HTMLElement) {
  let warm = false;
  const pick = seg("Before the premiere", [["Caches are empty", false], ["Pre-load caches near viewers", true]], warm, (v) => { warm = v; draw(); sfx("tick", 0.15); });
  const sPeak = stat("peak requests reaching the main data centre", "--bad");
  const c = chartBox("Requests reaching the main data centre in the first minute", 220);
  bench.append(h("div.bench-grid", {}, h("div", { style: "display:grid; gap:12px; align-content:start" }, pick, sPeak.el,
    h("p.dim", { style: "margin:0" }, "2 million people press play in the same minute, through 2,000 nearby cache servers.")), c),
    h("p.note", {}, "Illustrative: a cold cache server passes requests through for about 2 seconds until its first copy arrives; requests for the same piece are not merged."),
    takeaway("For a big premiere, put the video in caches near viewers before anyone presses play."));
  const ch = await makeChart(c, "bar", Array.from({ length: 30 }, (_, i) => (i % 5 === 0 ? `${i * 2} s` : "")), [{ label: "requests to origin", data: [], colour: "--bad" }], { yFmt: (v) => `${fmt(v / 1000)}k` });
  function draw() {
    const r = seeded(warm ? 3 : 4), data: number[] = [];
    for (let i = 0; i < 30; i++) { const arriving = 2e6 / 30 * (0.6 + r() * 0.8); data.push(warm ? 2000 * 0.01 : i === 0 ? arriving : i === 1 ? arriving * 0.3 : 2000 * 0.02); }
    sPeak.v.textContent = fmt(Math.max(...data)); sPeak.v.style.color = `var(${warm ? "--good" : "--bad"})`;
    ch.set(0, data); ch.update();
  }
  draw();
}
