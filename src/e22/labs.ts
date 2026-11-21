import { h, sfx, takeaway, fmt, sleep, reducedMotion } from "../kit/ui";
import { seg, stat } from "../kit/episode";
import { chartBox, makeChart } from "../kit/chart";
import { hash } from "../e13/ring";

const wait = (ms: number) => sleep(reducedMotion() ? 0 : ms);

/** Hero: a busy evening. Uploads flood in; converters work through the queue; turn on autoscaling. */
export function queueHero() {
  const rate = h("input#qh-r", { type: "range", min: 1, max: 40, step: 1, value: 12 }) as HTMLInputElement;
  const rO = h("output", {});
  const auto = h("input#qh-a", { type: "checkbox" }) as HTMLInputElement;
  const rush = h("button.btn.primary", { type: "button" }, "Evening rush: 1,000 uploads at once");
  const sDepth = stat("waiting in the queue", "--storage"), sAge = stat("oldest job has waited", "--bad"), sW = stat("converters running", "--good");
  const bar = h("div", { style: "height:14px; border-radius:7px; background:var(--storage); width:0%; transition:width .2s" });
  const box = chartBox("Queue length over time", 180);
  const say = h("p.dim", { "aria-live": "polite", style: "min-height:2.6em; margin:0" }, "Each upload says \"received\" in about a second. The converting happens later, at a steady pace.");
  let q: number[] = [], t = 0, workers = 5, hist: number[] = [];
  const PER = 0.5; // each converter finishes 0.5 videos per tick (illustrative)
  rate.addEventListener("input", () => { rO.textContent = `${rate.value} a minute`; });
  rO.textContent = `${rate.value} a minute`;
  rush.addEventListener("click", () => { for (let i = 0; i < 1000; i++) q.push(t); sfx("whoosh", 0.25); say.textContent = "A thousand uploads, and every one of them was told \"received\" straight away. The queue absorbs the flood."; });
  const el = h("div.bench", { style: "display:grid; gap:12px" },
    h("label.field", { for: "qh-r" }, h("span", {}, "Normal uploads: ", rO), rate),
    h("label.row", { for: "qh-a", style: "gap:8px; color:var(--text)" }, auto, "Start more converters when the queue is long"),
    rush, h("div", { style: "background:var(--bg2); border-radius:7px; border:1px solid var(--line)" }, bar),
    h("div.stats", {}, sDepth.el, sAge.el, sW.el), box, say,
    h("p.note", { style: "margin:0" }, "Illustrative: one tick is a minute; each converter finishes a video every two minutes."));
  let ch: Awaited<ReturnType<typeof makeChart>> | null = null;
  makeChart(box, "line", [], [{ label: "jobs waiting", data: [], colour: "--storage", fill: true }]).then((c) => { ch = c; });
  setInterval(() => {
    if (document.hidden) return;
    t++;
    for (let i = 0; i < +rate.value / 6; i++) q.push(t);
    if (auto.checked) workers = Math.min(200, Math.max(5, Math.ceil(q.length / 20))); else workers = 5;
    q = q.slice(Math.round(workers * PER));
    const depth = q.length, age = depth ? t - q[0] : 0;
    sDepth.v.textContent = fmt(depth); sAge.v.textContent = `${fmt(age)} min`; sW.v.textContent = String(workers);
    bar.style.width = `${Math.min(100, depth / 10)}%`;
    hist.push(depth); if (hist.length > 60) hist.shift();
    if (ch) { ch.labels(hist.map(() => "")); ch.set(0, hist); ch.update(); }
  }, reducedMotion() ? 600 : 300);
  return el;
}

/** The break: do everything inside the upload request, or queue it. */
export function inlineLab(bench: HTMLElement) {
  let queued = false;
  const pick = seg("Upload request", [["Do it all now", false], ["Save, publish, reply", true]], queued, (v) => { queued = v; run(); });
  const down = h("input#il-d", { type: "checkbox" }) as HTMLInputElement;
  const steps = h("pre.term", { style: "height:auto; white-space:pre-wrap; min-height:180px" });
  const sWait = stat("Sam waits", "--net"), sRes = stat("result", "--good");
  async function run() {
    steps.textContent = ""; const s = (x: string) => { steps.textContent += x + "\n"; };
    if (!queued) {
      s("convert video to 6 sizes ……… 4 min"); await wait(250); s("make thumbnails ……………… 8 s"); await wait(250);
      if (down.checked) { s("call notification service ✗ unavailable"); s("→ whole upload fails. The video was fine."); sWait.v.textContent = "4 min, then an error"; sRes.v.textContent = "failed"; sRes.v.style.color = "var(--bad)"; sfx("miss", 0.2); return; }
      s("notify followers ……………… 2 s"); s("update search index ………… 1 s"); s("→ done"); sWait.v.textContent = "≈ 4 min"; sRes.v.textContent = "done, eventually"; sRes.v.style.color = "var(--storage)";
    } else {
      s("save row in database ……… 20 ms"); s("publish \"video 42 uploaded\" … 10 ms"); s("→ reply: it's processing ✓"); await wait(300);
      s("\n(later, separately)"); s("converter, thumbnails, search: working");
      s(down.checked ? "notifier: down → message waits in its queue,\n          delivered when it's back" : "notifier: sent");
      sWait.v.textContent = "≈ 1 s"; sRes.v.textContent = "received"; sRes.v.style.color = "var(--good)"; sfx("hit", 0.2);
    }
  }
  down.addEventListener("change", run);
  bench.append(h("div.bench-grid", {}, h("div", { style: "display:grid; gap:12px; align-content:start" }, pick,
    h("label.row", { for: "il-d", style: "gap:8px; color:var(--text)" }, down, "Notification service is down for a moment"), h("div.stats", {}, sWait.el, sRes.el)), steps),
    takeaway("Say \"received\" straight away, and do the heavy work afterwards."));
  run();
}

/** Acknowledge: a converter crashes halfway; the message reappears. Is the consumer safe to repeat? */
export function ackLab(bench: HTMLElement) {
  const crash = h("input#ak-c", { type: "checkbox", checked: true }) as HTMLInputElement;
  const idem = h("input#ak-i", { type: "checkbox" }) as HTMLInputElement;
  const go = h("button.btn.primary", { type: "button" }, "Process \"video 42 uploaded\"");
  const log = h("pre.term", { style: "height:auto; white-space:pre-wrap; min-height:200px" });
  const sN = stat("notifications Sam's followers got", "--net");
  go.addEventListener("click", async () => {
    log.textContent = ""; const s = (x: string) => { log.textContent += x + "\n"; };
    let sent = 0; const done = new Set<string>();
    const work = async (who: string, dies: boolean) => {
      s(`${who} takes msg-7f3 · queue hides it for 30 s`); await wait(350);
      if (idem.checked && done.has("msg-7f3")) { s(`${who}: already did msg-7f3 → skip`); } else { s(`${who}: send notifications ✓`); sent++; if (idem.checked) done.add("msg-7f3"); }
      await wait(300);
      if (dies) { s(`💥 ${who} crashes before acknowledging`); sfx("powerdown", 0.2); await wait(500); s("… 30 s pass, msg-7f3 reappears"); await wait(300); return false; }
      s(`${who}: ack → queue deletes msg-7f3`); return true;
    };
    if (!(await work("worker A", crash.checked))) await work("worker B", false);
    sN.v.textContent = `${sent}×`; sN.v.style.color = `var(${sent > 1 ? "--bad" : "--good"})`; sfx(sent > 1 ? "miss" : "hit", 0.2);
    s(sent > 1 ? "\nNo job lost, but it ran twice." : "\nNo job lost, and done exactly once in effect.");
  });
  bench.append(h("div.bench-grid", {}, h("div", { style: "display:grid; gap:12px; align-content:start" },
    h("label.row", { for: "ak-c", style: "gap:8px; color:var(--text)" }, crash, "Worker A crashes after the work, before the ack"),
    h("label.row", { for: "ak-i", style: "gap:8px; color:var(--text)" }, idem, "Consumer remembers message IDs it has done"), go, sN.el), log),
    takeaway("At-least-once delivery never loses a job but can repeat one, so consumers must be safe to repeat."));
  go.click();
}

/** Publish and subscribe: each subscriber gets its own copy. Add a new one without touching the upload code. */
export function pubsubLab(bench: HTMLElement) {
  const subs = ["Video converter", "Thumbnail maker", "Notifier", "Search indexer"];
  const view = h("div", { style: "display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,150px),1fr)); gap:8px" });
  const counts: Record<string, number> = {};
  const pub = h("button.btn.primary", { type: "button" }, "Publish \"video uploaded\"");
  const add = h("button.btn", { type: "button" }, "Next month: add Captions");
  const code = h("pre.json", {}, "// upload code\nsaveRow(video)\npublish(\"video-uploaded\", { id: 42 })\n// lines changed when adding a subscriber: 0");
  let n = 0;
  function draw(flash = false) { view.innerHTML = ""; subs.forEach((s) => view.append(h("div.box", { style: `--bc: var(${flash ? "--good" : "--line"}); min-height:auto` }, h("b", {}, s), h("span", {}, `${counts[s] ?? 0} message${(counts[s] ?? 0) === 1 ? "" : "s"} received`)))); }
  pub.addEventListener("click", async () => { n++; subs.forEach((s) => { counts[s] = (counts[s] ?? 0) + 1; }); draw(true); sfx("pop", 0.2); await wait(400); draw(); });
  add.addEventListener("click", () => { if (subs.includes("Captions")) return; subs.push("Captions"); counts.Captions = 0; draw(); sfx("hit", 0.2); });
  bench.append(h("div.row", {}, pub, add), h("div", { style: "display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr)); gap:12px; margin-top:10px" }, h("div", { style: "display:grid; gap:6px; align-content:start" }, h("span.eyebrow", {}, "topic: video-uploaded"), view), code),
    h("p.note", {}, "Captions only sees messages published after it subscribed; with a log (next lab) it could replay the old ones."),
    takeaway("With publish-subscribe, every interested service gets its own copy, and new ones just subscribe."));
  draw(); void n;
}

/** A log with partitions: keys keep order; consumers keep their own position; a new one can replay. */
export function logLab(bench: HTMLElement) {
  const P = 3, parts: string[][] = [[], [], []];
  const offsets: Record<string, number[]> = { "Converter": [0, 0, 0], "Search": [0, 0, 0] };
  const view = h("div", { style: "display:grid; gap:6px" });
  const offs = h("pre.json", {});
  const VIDS: string[] = []; for (let i = 1; VIDS.length < 3; i++) { const v = `v${i}`; if (!VIDS.some((x) => hash(x) % P === hash(v) % P)) VIDS.push(v); } const EVT = ["uploaded", "converted", "published"]; let k = 0;
  const write = h("button.btn.primary", { type: "button" }, "Write 6 events");
  const readC = h("button.btn", { type: "button" }, "Converter reads");
  const addR = h("button.btn", { type: "button" }, "New service: replay from the start");
  function draw() {
    view.innerHTML = "";
    parts.forEach((p, i) => view.append(h("div", { style: "display:flex; gap:4px; align-items:center; overflow-x:auto" }, h("b", { style: "font: 700 0.75rem var(--mono); min-width:96px" }, `partition ${i}`),
      ...p.map((e, j) => h("span.chip", { style: `white-space:nowrap; ${j < offsets.Converter[i] ? "opacity:0.55" : ""}` }, `${j}: ${e}`)))));
    offs.textContent = "each consumer remembers how far it has got\n" + Object.entries(offsets).map(([c, o]) => `  ${c.padEnd(10)} ${o.map((x, i) => `p${i}@${x}`).join("  ")}`).join("\n");
  }
  write.addEventListener("click", () => { for (let i = 0; i < 6; i++) { const v = VIDS[k % 3], e = `${v} ${EVT[Math.floor(k / 3) % 3]}`; parts[hash(v) % P].push(e); k++; } draw(); sfx("pop", 0.15); });
  readC.addEventListener("click", () => { offsets.Converter = parts.map((p) => p.length); draw(); sfx("tick", 0.15); });
  addR.addEventListener("click", () => { offsets["Captions"] = [0, 0, 0]; draw(); sfx("hit", 0.2); offs.textContent += "\n\nCaptions starts at offset 0: every event is still there to replay."; });
  bench.append(h("div.row", {}, write, readC, addR), view, offs,
    h("p.note", {}, "Kafka works this way. Every event for the same video has the same key, so it lands in the same partition, in order. Reading doesn't delete anything."),
    takeaway("A log keeps messages after they're read, so each consumer tracks its own position, and new ones can replay history."));
  write.click();
}

/** Poison messages: retry forever, or a dead letter queue. */
export function dlqLab(bench: HTMLElement) {
  let dlq = false;
  const pick = seg("After a message fails", [["Retry forever", false], ["3 tries, then dead letter queue", true]], dlq, (v) => { dlq = v; run(); });
  const log = h("pre.term", { style: "height:auto; white-space:pre-wrap; min-height:190px" });
  const sC = stat("consumer crashes", "--bad"), sOK = stat("good jobs finished", "--good");
  async function run() {
    log.textContent = ""; const s = (x: string) => { log.textContent += x + "\n"; };
    let crashes = 0, good = 0;
    const queue = ["v40 ok", "v41 CORRUPT", "v42 ok", "v43 ok"]; let tries = 0;
    for (let step = 0; step < 10 && queue.length; step++) {
      const m = queue.shift()!;
      if (m.includes("CORRUPT")) {
        tries++; crashes++; s(`take ${m} → 💥 consumer crashes (try ${tries})`);
        if (dlq && tries >= 3) { s("  → moved to the dead letter queue for a human"); sfx("tick", 0.15); continue; }
        queue.unshift(m); await wait(150); continue;
      }
      good++; s(`take ${m} → ✓`); await wait(120);
    }
    if (queue.length) s("… and on, and on. The jobs behind it wait.");
    sC.v.textContent = dlq ? String(crashes) : "∞"; sOK.v.textContent = `${good} of 3`;
    sfx(dlq ? "hit" : "miss", 0.2);
  }
  bench.append(h("div.bench-grid", {}, h("div", { style: "display:grid; gap:12px; align-content:start" }, pick, h("div.stats", {}, sC.el, sOK.el),
    h("p.dim", { style: "margin:0" }, "In a strictly ordered queue, one broken message blocks everything behind it.")), log),
    takeaway("After a few failed attempts, move the message to a dead letter queue instead of retrying forever."));
  run();
}
