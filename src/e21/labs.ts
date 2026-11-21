import { h, sfx, takeaway, fmt, sleep, reducedMotion } from "../kit/ui";
import { seg, stat, seeded } from "../kit/episode";
import { flow } from "../kit/flow";
import { chartBox, makeChart } from "../kit/chart";

const wait = (ms: number) => sleep(reducedMotion() ? 0 : ms);

/** Hero: spread a file across three data centres. Destroy disks, or a whole building, and see if it can be rebuilt. */
export function durabilityHero() {
  let mode: "copies" | "ec" = "ec";
  const pick = seg("How the file is stored", [["3 full copies", "copies"], ["Pieces + recovery pieces (6 + 3)", "ec"]], mode, (v) => { mode = v as typeof mode; reset(); sfx("tick", 0.15); });
  const dcs = h("div", { style: "display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px" });
  const sOK = stat("can the video be rebuilt?", "--good"), sOver = stat("storage used, vs the file's size", "--storage"), sLeft = stat("pieces left", "--net");
  const fire = h("button.btn", { type: "button" }, "🔥 Lose data centre B");
  const reset_ = h("button.btn", { type: "button" }, "Reset");
  const say = h("p.dim", { "aria-live": "polite", style: "min-height:2.6em; margin:0" });
  let dead = new Set<number>();
  const layout = () => mode === "copies" ? [[0], [1], [2]].map((x) => x.map((i) => ({ i, label: "full copy" }))) : [0, 1, 2].map((d) => [0, 1, 2].map((k) => { const i = d * 3 + k; return { i, label: i < 6 ? `piece ${i + 1}` : `recovery ${i - 5}` }; }));
  function draw() {
    const L = layout(), total = L.flat().length, left = total - dead.size, need = mode === "copies" ? 1 : 6;
    const ok = left >= need;
    sOK.v.textContent = ok ? "yes" : "no, it's gone"; sOK.v.style.color = `var(${ok ? "--good" : "--bad"})`;
    sOver.v.textContent = mode === "copies" ? "3×" : "1.5×"; sLeft.v.textContent = `${left} of ${total} (need ${need})`;
    dcs.innerHTML = "";
    L.forEach((disks, d) => dcs.append(h("div.box", { style: "--bc: var(--net); min-height:auto" }, h("b", {}, `Data centre ${"ABC"[d]}`),
      ...disks.map(({ i, label }) => { const b = h("button.btn", { type: "button", style: `padding:6px 8px; font-size:0.75rem; justify-content:flex-start; ${dead.has(i) ? "opacity:0.45; text-decoration:line-through; border-color:var(--bad)" : ""}`, "aria-pressed": dead.has(i) ? "true" : "false" }, `💽 ${label}`); b.addEventListener("click", () => { dead.has(i) ? dead.delete(i) : dead.add(i); draw(); sfx(dead.has(i) ? "powerdown" : "pop", 0.18); }); return b; }))));
  }
  function reset() { dead = new Set(); draw(); say.textContent = mode === "copies" ? "Three whole copies, one per building. Simple, but triple the storage." : "Split into 6 pieces plus 3 recovery pieces, 3 per building. Any 6 of the 9 rebuild the file."; }
  fire.addEventListener("click", () => { layout()[1].forEach(({ i }) => dead.add(i)); draw(); sfx("powerdown", 0.25); say.textContent = "A whole building is gone, and the video can still be rebuilt from what's left. Tap disks to break more."; });
  reset_.addEventListener("click", reset);
  reset();
  return h("div.bench", { style: "display:grid; gap:12px" }, pick, dcs, h("div.row", {}, fire, reset_), h("div.stats", {}, sOK.el, sLeft.el, sOver.el), say,
    h("p.note", { style: "margin:0" }, "Tap any disk to break it. 6 + 3 is an illustrative erasure code; real services don't publish their exact scheme."));
}

/** Buckets and keys: one flat list. "Folders" are just part of the name. */
export function keysLab(bench: HTMLElement) {
  let keys = ["videos/sam/trip.mp4", "videos/sam/trip-thumb.jpg", "videos/sam/paris.mp4", "videos/maya/cooking.mp4", "videos/maya/cooking-thumb.jpg", "avatars/sam.png", "avatars/maya.png", "backups/2026-11-01.tar.gz"];
  const prefix = h("input#ky-p", { type: "text", value: "videos/sam/", "aria-label": "Prefix", style: "font: 500 0.9rem var(--mono); padding:8px 10px; border-radius:8px; border:1px solid var(--line); background:var(--bg); color:var(--text); width:100%" }) as HTMLInputElement;
  const list = h("pre.json", { style: "min-height:180px" });
  const ren = h("button.btn", { type: "button" }, "Rename \"folder\" videos/sam/ → videos/samuel/");
  const log = h("p", { "aria-live": "polite", style: "min-height:2.5em; margin:0" });
  function draw() {
    const p = prefix.value;
    list.innerHTML = `<span style="color:var(--faint)">bucket: sfz-video-app · ${keys.length} objects · one flat list</span>\n` + [...keys].sort().map((k) => k.startsWith(p) && p ? `<span class="s">${k}</span>` : k).join("\n");
  }
  prefix.addEventListener("input", draw);
  ren.addEventListener("click", async () => {
    const hit = keys.filter((k) => k.startsWith("videos/sam/"));
    if (!hit.length) { log.textContent = "Nothing left under videos/sam/."; return; }
    for (const k of hit) { keys.push(k.replace("videos/sam/", "videos/samuel/")); draw(); sfx("tick", 0.1); await wait(250); }
    keys = keys.filter((k) => !k.startsWith("videos/sam/")); draw();
    log.textContent = `${hit.length} objects copied to new keys, then ${hit.length} deleted. With a million videos, that's a million copies.`; sfx("hit", 0.2);
  });
  bench.append(h("div.bench-grid", {}, h("div", { style: "display:grid; gap:10px; align-content:start" }, h("label.field", { for: "ky-p" }, "List objects whose key starts with", prefix), ren, log,
    h("pre.json", {}, "PUT  /videos/sam/trip.mp4   → store\nGET  /videos/sam/trip.mp4   → read back")), list),
    takeaway("It looks like folders, but it's one giant flat dictionary from names to files. The slashes are just part of the name."));
  draw();
}

/** Eleven nines: how often would you expect to lose a file? */
export function ninesLab(bench: HTMLElement) {
  const files = h("input#nn-f", { type: "range", min: 3, max: 9, step: 1, value: 7 }) as HTMLInputElement;
  const fO = h("output", {});
  let d = 1e-11;
  const pick = seg("Where the files live", [["One disk in a server", 0.02], ["Two copies on two disks", 0.0004], ["Object storage, eleven nines", 1e-11]], d, (v) => { d = v; draw(); sfx("tick", 0.15); });
  const sYr = stat("files expected lost per year", "--bad"), sEvery = stat("one file lost about every", "--good");
  function draw() {
    const F = 10 ** +files.value; fO.textContent = fmt(F);
    const lost = F * d; sYr.v.textContent = lost >= 1 ? fmt(lost) : fmt(lost, 6);
    const yrs = 1 / lost; sEvery.v.textContent = yrs < 1 ? `${fmt(365 * yrs, 2)} days` : `${fmt(yrs)} years`;
    sEvery.v.style.color = `var(${yrs > 100 ? "--good" : "--bad"})`;
  }
  files.addEventListener("input", draw);
  bench.append(h("div.bench-grid", {}, h("div", { style: "display:grid; gap:12px; align-content:start" }, pick, h("label.field", { for: "nn-f" }, h("span", {}, "Files stored: ", fO), files)),
    h("div", { style: "display:grid; gap:10px; align-content:start" }, h("div.stats", {}, sYr.el, sEvery.el), h("p.dim", { style: "margin:0" }, "99.999999999% a year: store 10 million files and expect to lose one about every 10,000 years."))),
    h("p.note", {}, "Illustrative: a single disk fails about 1–2% of the time each year; two independent copies both failing before repair is far rarer. Amazon S3 is designed for 99.999999999% durability (AWS docs)."),
    takeaway("Durability comes from spreading pieces across many disks and buildings, so any one can fail."));
  draw();
}

/** Upload and serve: the app server hands out a pre-signed link and never touches the bytes. */
export function presignLab(bench: HTMLElement) {
  const f = flow([
    { key: "phone", name: "Sam's phone", sub: "4 GB video", colour: "net" },
    { key: "app", name: "App server", sub: "checks who he is", colour: "good" },
    { key: "bucket", name: "Bucket", sub: "object storage", colour: "storage" },
    { key: "db", name: "Database", sub: "title, owner, key", colour: "cache" },
    { key: "cdn", name: "CDN", sub: "near viewers", colour: "ram" },
  ], 5);
  const go = h("button.btn.primary", { type: "button" }, "Replay Sam's upload");
  const url = h("pre.json", {}, "—");
  const say = h("p.dim", { "aria-live": "polite", style: "min-height:2.6em; margin:0" });
  const sBytes = stat("bytes of video through the app server", "--good", "0");
  let busy = false;
  go.addEventListener("click", async () => {
    if (busy) return; busy = true; url.textContent = "—";
    say.textContent = "Sam's app asks the server for permission to upload."; await f.travel(["phone", "app"], reducedMotion() ? 0 : 0.5, undefined, "#94a3b8");
    url.textContent = `PUT https://sfz-video-app.storage.example/videos/sam/trip.mp4\n  ?X-Expires=600&X-Signature=9f2c…\n  (one upload · one key · 10 minutes)`;
    say.textContent = "The server checks who he is and replies with a pre-signed link for one key."; await f.travel(["app", "phone"], reducedMotion() ? 0 : 0.4, undefined, "#4ADE80");
    say.textContent = "The phone uploads the 4 GB straight to the bucket, in parts."; await f.travel(["phone", "app", "bucket"], reducedMotion() ? 0 : 0.9, undefined, "#FBBF24"); sfx("pop", 0.15);
    f.note("app", "bytes skip me", "var(--good)");
    say.textContent = "The server saves a row: title, Sam's ID, the object's key."; await f.travel(["app", "db"], reducedMotion() ? 0 : 0.5, undefined, "#A78BFA");
    say.textContent = "Viewers in Tokyo watch it through the CDN, which fetches it from the bucket once."; await f.travel(["bucket", "cdn"], reducedMotion() ? 0 : 0.5, undefined, "#2DD4BF"); sfx("hit", 0.2);
    f.note("app", "");
    say.textContent = "The app server never carried a single byte of video."; busy = false;
  });
  bench.append(h("div", { style: "display:grid; gap:12px" }, f.el, h("div.row", {}, go), url, sBytes.el, say),
    h("p.note", {}, "The orange token passes the app server's column on screen only; the upload goes straight from the phone to the bucket."),
    takeaway("Hand the client a short-lived signed link, so big files go straight to the bucket."));
}

/** Multipart upload over a weak signal. */
export function multipartLab(bench: HTMLElement) {
  const fail = h("input#mp-f", { type: "range", min: 0, max: 20, step: 1, value: 5 }) as HTMLInputElement;
  const fO = h("output", {});
  const part = h("input#mp-p", { type: "range", min: 1, max: 6, step: 1, value: 3 }) as HTMLInputElement;
  const pO = h("output", {});
  const go = h("button.btn.primary", { type: "button" }, "Upload 4 GB");
  const sOne = stat("sent as one big upload", "--bad"), sMulti = stat("sent in parts", "--good");
  const strip = h("div", { style: "display:flex; flex-wrap:wrap; gap:2px; min-height:24px" });
  const SIZES = [16, 32, 64, 100, 250, 500];
  function sizes() { return SIZES[+part.value - 1]; }
  function draw() { fO.textContent = `${fail.value}% per 100 MB`; pO.textContent = `${sizes()} MB`; }
  go.addEventListener("click", async () => {
    draw(); strip.innerHTML = "";
    const r = seeded(+fail.value * 7 + +part.value), p100 = +fail.value / 100, P = sizes(), total = 4096, n = Math.ceil(total / P);
    const pFail = 1 - (1 - p100) ** (P / 100);
    let sent = 0;
    for (let i = 0; i < n; i++) {
      let tries = 0; do { tries++; sent += P; } while (r() < pFail && tries < 50);
      strip.append(h("i", { title: `part ${i + 1}: ${tries} tr${tries > 1 ? "ies" : "y"}`, style: `display:block; width:${Math.max(4, 300 / n)}px; height:16px; border-radius:2px; background:var(${tries > 1 ? "--storage" : "--good"})` }));
      if (i % Math.ceil(n / 30) === 0) await wait(30);
    }
    sMulti.v.textContent = `${fmt(sent / 1024, 2)} GB`;
    const pWhole = 1 - (1 - p100) ** (total / 100);
    sOne.v.textContent = p100 === 0 ? "4.00 GB" : pWhole > 0.999 ? "never finishes" : `≈ ${fmt((total / 1024) / (1 - pWhole), 1)} GB`;
    sfx("hit", 0.2);
  });
  [fail, part].forEach((x) => x.addEventListener("input", draw));
  bench.append(h("div.bench-grid", {}, h("div", { style: "display:grid; gap:12px; align-content:start" },
    h("label.field", { for: "mp-f" }, h("span", {}, "Chance the signal drops: ", fO), fail),
    h("label.field", { for: "mp-p" }, h("span", {}, "Part size: ", pO), part), go),
    h("div", { style: "display:grid; gap:10px; align-content:start" }, h("div.stats", {}, sOne.el, sMulti.el), strip, h("p.dim", { style: "margin:0" }, "Amber parts failed once and were simply sent again."))),
    takeaway("Upload in parts, so a dropped connection only resends one part, not the whole video."));
  draw(); go.click();
}

/** Mistakes: overwrite without versioning, and a public bucket. */
export function mistakesLab(bench: HTMLElement) {
  const ver = h("input#mk-v", { type: "checkbox" }) as HTMLInputElement;
  const pub = h("input#mk-p", { type: "checkbox" }) as HTMLInputElement;
  const store: { key: string; versions: string[] } = { key: "videos/sam/trip.mp4", versions: ["Sam's real trip video"] };
  const out = h("pre.term", { style: "height:auto; white-space:pre-wrap; min-height:150px" });
  const over = h("button.btn", { type: "button" }, "Upload a test file under the same key");
  const undo = h("button.btn", { type: "button" }, "Restore the previous version");
  const stranger = h("button.btn", { type: "button" }, "A stranger requests the file");
  const show = (t: string) => { out.textContent = `key: ${store.key}\nversions kept: ${store.versions.length}\ncurrent: "${store.versions[store.versions.length - 1]}"\n\n${t}`; };
  over.addEventListener("click", () => { if (ver.checked) store.versions.push("test.mp4 (oops)"); else store.versions = ["test.mp4 (oops)"]; show(ver.checked ? "Overwritten, but the old version is kept." : "Overwritten. Without versioning, the real video is gone."); sfx(ver.checked ? "tick" : "miss", 0.2); });
  undo.addEventListener("click", () => { if (store.versions.length > 1) { store.versions.pop(); show("Restored. Versioning made the overwrite undoable."); sfx("hit", 0.2); } else show(store.versions[0].startsWith("test") ? "Nothing to restore." : "Already the original."); });
  stranger.addEventListener("click", () => { show(pub.checked ? "GET → 200 OK. Anyone with the address can download it." : "GET → 403 Forbidden. Shared only through short-lived signed links."); sfx(pub.checked ? "miss" : "hit", 0.2); });
  bench.append(h("div.bench-grid", {}, h("div", { style: "display:grid; gap:10px; align-content:start" },
    h("label.row", { for: "mk-v", style: "gap:8px; color:var(--text)" }, ver, "Versioning on"),
    h("label.row", { for: "mk-p", style: "gap:8px; color:var(--text)" }, pub, "Bucket is public"), over, undo, stranger), out),
    h("p.note", {}, "Some of the biggest data leaks in recent years were simply files in a public bucket. Major clouds now block public access on new buckets by default."),
    takeaway("Block public access by default, and turn on versioning so an overwrite or delete can be undone."));
  show("Try it.");
}

/** Lifecycle rules: move old files to colder storage. */
export async function lifecycleLab(bench: HTMLElement) {
  const tb = h("input#lc-tb", { type: "range", min: 10, max: 500, step: 10, value: 100 }) as HTMLInputElement;
  const tbO = h("output", {});
  const s1 = stat("after 3 years, everything in standard", "--bad"), s2 = stat("with lifecycle rules", "--good");
  const c = chartBox("Monthly storage cost over three years", 240);
  bench.append(h("div.bench-grid", {}, h("div", { style: "display:grid; gap:12px; align-content:start" },
    h("label.field", { for: "lc-tb" }, h("span", {}, "New uploads a month: ", tbO), tb), h("div.stats", {}, s1.el, s2.el),
    h("pre.json", {}, "rule: after 30 days  → infrequent access\nrule: after 180 days → archive\nrule: tmp/ after 7 days → delete")), c),
    h("p.note", {}, "Illustrative prices per GB-month: standard $0.023, infrequent $0.0125, archive $0.004, roughly public list prices. Real bills add requests and data transfer out."),
    takeaway("Old files nobody watches can move to colder, much cheaper storage automatically."));
  const ch = await makeChart(c, "line", Array.from({ length: 36 }, (_, i) => (i % 6 === 0 ? `m${i}` : "")), [{ label: "all standard ($/month)", data: [], colour: "--bad" }, { label: "lifecycle ($/month)", data: [], colour: "--good" }], { yFmt: (v) => `$${fmt(v)}` });
  function draw() {
    const T = +tb.value * 1024; tbO.textContent = `${tb.value} TB`;
    const a: number[] = [], b: number[] = [];
    for (let m = 1; m <= 36; m++) {
      a.push(T * m * 0.023);
      const hot = Math.min(m, 1), warm = Math.max(0, Math.min(m, 6) - 1), cold = Math.max(0, m - 6);
      b.push(T * (hot * 0.023 + warm * 0.0125 + cold * 0.004));
    }
    s1.v.textContent = `$${fmt(a[35])}/mo`; s2.v.textContent = `$${fmt(b[35])}/mo`;
    ch.set(0, a); ch.set(1, b); ch.update();
  }
  tb.addEventListener("input", draw); draw();
}
