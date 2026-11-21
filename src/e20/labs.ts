import { h, sfx, takeaway, sleep, reducedMotion } from "../kit/ui";
import { seg, stat } from "../kit/episode";

const wait = (ms: number) => sleep(reducedMotion() ? 0 : ms);

/** Hero: two cash machines, one account with $100, and the cable between the cities is cut. */
export function atmHero() {
  let mode: "cp" | "ap" = "ap";
  const pick = seg("During a network split", [["Keep answering (A P)", "ap"], ["Refuse if unsure (C P)", "cp"]], mode, (v) => { mode = v as typeof mode; reset(); sfx("tick", 0.15); });
  const cut = h("input#atm-cut", { type: "checkbox", checked: true }) as HTMLInputElement;
  const go = h("button.btn.primary", { type: "button" }, "Maya and Sam each withdraw $100");
  const atm = (city: string) => { const s = h("div", { style: "font: 700 1rem var(--mono); min-height:3.2em" }, "Ready"); return { s, el: h("div.box", { style: "--bc: var(--net); min-height:auto" }, h("b", {}, `🏧 ${city}`), s) }; };
  const L = atm("London · Maya"), R = atm("Leeds · Sam");
  const wire = h("div", { style: "align-self:center; text-align:center; font: 700 0.8rem var(--mono)" });
  const bank = stat("left in the account", "--good"), paid = stat("cash paid out", "--storage");
  const say = h("p.dim", { "aria-live": "polite", style: "min-height:2.6em; margin:0" });
  function reset() { L.s.textContent = "Ready"; R.s.textContent = "Ready"; bank.v.textContent = "$100"; paid.v.textContent = "$0"; bank.v.style.color = "var(--good)"; wire.innerHTML = cut.checked ? '<span style="color:var(--bad)">✂ cable cut</span>' : '<span style="color:var(--good)">━━ linked ━━</span>'; say.textContent = "Their shared account has exactly $100."; }
  cut.addEventListener("change", reset);
  let busy = false;
  go.addEventListener("click", async () => {
    if (busy) return; busy = true; reset(); await wait(300);
    if (!cut.checked) {
      L.s.textContent = "✓ $100"; sfx("hit", 0.2); await wait(300); R.s.textContent = "✗ insufficient funds"; bank.v.textContent = "$0"; paid.v.textContent = "$100";
      say.textContent = "Linked: the machines check with each other, and only one withdrawal succeeds. Consistent and available.";
    } else if (mode === "ap") {
      L.s.textContent = "✓ $100"; R.s.textContent = "✓ $100"; sfx("miss", 0.25); await wait(500);
      wire.innerHTML = '<span style="color:var(--good)">━━ link back ━━</span>'; await wait(400);
      bank.v.textContent = "−$100"; bank.v.style.color = "var(--bad)"; paid.v.textContent = "$200";
      say.textContent = "Both sides answered. When the link returned, the bank had paid $200 from an account that held $100. Some answers can't be taken back.";
    } else {
      L.s.textContent = "✓ $100 (my side has the majority)"; R.s.textContent = "Service unavailable, try later"; sfx("tick", 0.2);
      bank.v.textContent = "$0"; paid.v.textContent = "$100";
      say.textContent = "Leeds can't reach the majority, so it refuses. Annoying for Sam, but the balance is never wrong.";
    }
    busy = false;
  });
  reset();
  return h("div.bench", { style: "display:grid; gap:12px" }, pick,
    h("label.row", { for: "atm-cut", style: "gap:8px; color:var(--text)" }, cut, "Cable between the cities is cut"),
    h("div", { style: "display:grid; grid-template-columns:1fr auto 1fr; gap:8px" }, L.el, wire, R.el),
    go, h("div.stats", {}, bank.el, paid.el), say);
}

/** Majority: split five copies, and see which side may accept writes. */
export function majorityLab(bench: HTMLElement) {
  const N = 5, side = Array(N).fill(0);
  const nodes = h("div", { style: "display:grid; grid-template-columns:1fr 1fr; gap:12px" });
  const say = h("p", { "aria-live": "polite", style: "min-height:2.5em; margin:0" });
  const n = h("input#mj-n", { type: "range", min: 3, max: 7, step: 2, value: 5 }) as HTMLInputElement;
  const nO = h("output", {});
  let count = 5;
  function draw() {
    nO.textContent = String(count);
    const a = side.slice(0, count).filter((s) => s === 0).length, b = count - a, maj = Math.floor(count / 2) + 1;
    nodes.innerHTML = "";
    [0, 1].forEach((s) => {
      const k = s === 0 ? a : b, ok = k >= maj;
      nodes.append(h("div.box", { style: `--bc: var(${ok ? "--good" : "--bad"}); min-height:140px` },
        h("b", {}, `${s === 0 ? "East" : "West"} side · ${k} cop${k === 1 ? "y" : "ies"}`),
        h("span", {}, ok ? "✓ has a majority: accepts writes" : "✗ no majority: refuses writes"),
        h("div.row", { style: "gap:6px; margin-top:6px" }, ...side.slice(0, count).map((sd, i) => sd === s ? (() => { const b2 = h("button.btn", { type: "button", style: "padding:6px 10px" }, `DB ${i + 1} ⇄`); b2.addEventListener("click", () => { side[i] = 1 - side[i]; draw(); sfx("tick", 0.15); }); return b2; })() : null))));
    });
    say.textContent = `${count} copies: a side needs ${maj} to accept writes. At most one side can ever have a majority, so the two sides can never both say yes.`;
  }
  n.addEventListener("input", () => { count = +n.value; side.fill(0); for (let i = 0; i < Math.floor(count / 2); i++) side[count - 1 - i] = 1; draw(); });
  for (let i = 3; i < 5; i++) side[i] = 1;
  bench.append(h("label.field", { for: "mj-n" }, h("span", {}, "Copies: ", nO), n), h("p.dim", { style: "margin:0" }, "Tap a copy to move it across the split."), nodes, say,
    h("p.note", {}, "Consensus protocols such as Raft and Paxos are built on this idea; Google's Spanner uses Paxos groups."),
    takeaway("A C P system lets only the side with a majority accept writes; the other side waits."));
  draw();
}

/** Availability: the shopping cart merge, and the deleted item that comes back. */
export function cartLab(bench: HTMLElement) {
  const A = new Set(["Headphones", "Charger"]), B = new Set(["Headphones", "Charger"]);
  const view = h("div", { style: "display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr)); gap:10px" });
  const say = h("p", { "aria-live": "polite", style: "min-height:2.5em; margin:0" });
  let merged: Set<string> | null = null;
  const card = (t: string, s: Set<string>, c: string) => h("div.box", { style: `--bc: var(${c}); min-height:130px` }, h("b", {}, t), ...[...s].map((x) => h("span", {}, `🛒 ${x}`)));
  function draw() { view.innerHTML = ""; view.append(card("Copy A (phone)", A, "--net"), card("Copy B (laptop)", B, "--net")); if (merged) view.append(card("After the network returns", merged, "--good")); }
  const b1 = h("button.btn", { type: "button" }, "On the phone: remove Charger"), b2 = h("button.btn", { type: "button" }, "On the laptop: add Case"), b3 = h("button.btn.primary", { type: "button" }, "Network returns: merge");
  b1.addEventListener("click", () => { A.delete("Charger"); merged = null; draw(); sfx("tick", 0.15); say.textContent = "Removed on copy A. Copy B never heard about it."; });
  b2.addEventListener("click", () => { B.add("Case"); merged = null; draw(); sfx("pop", 0.15); say.textContent = "Added on copy B. The cart always accepts the item."; });
  b3.addEventListener("click", () => { merged = new Set([...A, ...B]); draw(); const back = !A.has("Charger") && merged.has("Charger"); sfx(back ? "miss" : "hit", 0.2); say.textContent = back ? "Merged by keeping everything from both sides: the Charger you removed is back. Fine for a cart, never for a bank balance." : "Merged by keeping everything from both sides."; });
  const reset = h("button.btn", { type: "button" }, "Reset");
  reset.addEventListener("click", () => { A.clear(); B.clear(); ["Headphones", "Charger"].forEach((x) => { A.add(x); B.add(x); }); merged = null; draw(); say.textContent = ""; });
  bench.append(h("div.row", {}, b1, b2, b3, reset), view, say,
    h("p.note", {}, "Amazon's Dynamo paper (2007) describes exactly this: carts always accept writes, and deleted items can occasionally resurface after a merge."),
    takeaway("An A P system answers anyway and sorts it out later; choose it where a short disagreement is harmless."));
  draw();
}

/** One app, different choices: pick C P or A P for each feature. */
export function featureLab(bench: HTMLElement) {
  const F: [string, "CP" | "AP", string][] = [
    ["Likes and view counts", "AP", "Both regions keep counting; totals are added when the link returns."],
    ["Comments", "AP", "A comment might show up in the other region a little late."],
    ["Payments", "CP", "The side without a majority stops taking payments and says try again."],
    ["Claiming a new username", "CP", "Two people must never get the same one."],
    ["Who's online right now", "AP", "Presence that's a few seconds stale is fine."],
    ["The last concert ticket", "CP", "Selling it twice can't be taken back."],
  ];
  const score = h("p", { style: "margin:0" }); let right = 0, done = 0;
  bench.append(...F.map(([name, ans, why]) => {
    const fb = h("span.dim", { style: "font-size:0.85rem" });
    const mk = (k: "CP" | "AP", label: string) => { const b = h("button.btn", { type: "button", style: "padding:6px 10px; font-size:0.8rem" }, label); b.addEventListener("click", () => { if (fb.textContent) return; const ok = k === ans; if (ok) right++; done++; b.style.borderColor = `var(${ok ? "--good" : "--bad"})`; fb.textContent = `${ok ? "✓" : `✗ ${ans === "CP" ? "C P" : "A P"}.`} ${why}`; sfx(ok ? "hit" : "miss", 0.2); score.textContent = `${right} of ${done} right.`; }); return b; };
    return h("div", { style: "display:grid; gap:6px; padding:10px 0; border-bottom:1px solid var(--line)" }, h("b", {}, name), h("div.row", { style: "gap:6px" }, mk("CP", "Refuse if unsure (C P)"), mk("AP", "Answer anyway (A P)")), fb);
  }), score, takeaway("Choose per feature, not per company."));
}

/** Last write wins, and clocks that don't agree. */
export function lwwLab(bench: HTMLElement) {
  const skew = h("input#lw-s", { type: "range", min: -2000, max: 2000, step: 100, value: 800 }) as HTMLInputElement;
  const sO = h("output", {});
  const out = h("pre.term", { style: "height:auto; white-space:pre-wrap; min-height:150px" });
  const sWin = stat("title that survives", "--storage");
  function draw() {
    const s = +skew.value; sO.textContent = `${s > 0 ? "+" : ""}${s} ms`;
    const tMaya = 5000, tSam = 5300; // real times: Sam's edit really came 300 ms later
    const stampMaya = tMaya + s, stampSam = tSam;
    const f = (ms: number) => `10:00:${(ms / 1000).toFixed(3).padStart(6, "0")}`;
    const win = stampMaya > stampSam ? "Maya" : "Sam";
    out.textContent = `East · Maya renames the video "Lisbon trip"\n   really at ${f(tMaya)} · stamped ${f(stampMaya)}\nWest · Sam renames it "Portugal 2026"\n   really at ${f(tSam)} · stamped ${f(stampSam)}\n\nLink returns → last write wins → keep "${win === "Maya" ? "Lisbon trip" : "Portugal 2026"}"\n${win === "Maya" ? "⚠ Sam's edit really came last, but it was silently thrown away." : "Sam's edit came last and wins. Maya's is silently gone."}`;
    sWin.v.textContent = win === "Maya" ? "Lisbon trip" : "Portugal 2026"; sWin.v.style.color = `var(${win === "Maya" ? "--bad" : "--storage"})`;
  }
  skew.addEventListener("input", () => { draw(); sfx("tick", 0.1); });
  bench.append(h("div.bench-grid", {}, h("div", { style: "display:grid; gap:12px; align-content:start" }, h("label.field", { for: "lw-s" }, h("span", {}, "East server's clock is off by: ", sO), skew), sWin.el,
    h("p.dim", { style: "margin:0" }, "Either way, one person's edit is thrown away without a word. With a clock that's a little fast, it can even be the newer one.")), out),
    takeaway("Last write wins is simple, but it silently drops edits, and depends on clocks that are never perfectly in sync."));
  draw();
}

/** Quorums: how many copies must agree, what it costs in speed, and what survives an outage. */
export function quorumLab(bench: HTMLElement) {
  const n = h("input#qu-n", { type: "range", min: 3, max: 7, step: 1, value: 3 }) as HTMLInputElement;
  const w = h("input#qu-w", { type: "range", min: 1, max: 7, step: 1, value: 2 }) as HTMLInputElement;
  const r = h("input#qu-r", { type: "range", min: 1, max: 7, step: 1, value: 2 }) as HTMLInputElement;
  const down = h("input#qu-d", { type: "range", min: 0, max: 6, step: 1, value: 1 }) as HTMLInputElement;
  const nO = h("output", {}), wO = h("output", {}), rO = h("output", {}), dO = h("output", {});
  const sFresh = stat("every read sees the latest write? (needs R + W > N)", "--good"), sW = stat("writes still work?", "--net"), sR = stat("reads still work?", "--net"), sLat = stat("read latency (illustrative)", "--storage");
  const dots = h("div", { style: "display:flex; gap:6px; flex-wrap:wrap" });
  const RTT = [1, 1, 80, 80, 150, 150, 220];
  function draw() {
    const N = +n.value; [w, r, down].forEach((x) => { x.max = String(x === down ? N - 1 : N); if (+x.value > +x.max) x.value = x.max; });
    const W = +w.value, R = +r.value, D = +down.value;
    nO.textContent = String(N); wO.textContent = String(W); rO.textContent = String(R); dO.textContent = String(D);
    const fresh = R + W > N;
    sFresh.v.textContent = fresh ? "yes" : "maybe not"; sFresh.v.style.color = `var(${fresh ? "--good" : "--bad"})`;
    const up = N - D;
    sW.v.textContent = up >= W ? "yes" : "no"; sW.v.style.color = `var(${up >= W ? "--good" : "--bad"})`;
    sR.v.textContent = up >= R ? "yes" : "no"; sR.v.style.color = `var(${up >= R ? "--good" : "--bad"})`;
    sLat.v.textContent = `${RTT[R - 1]} ms`;
    dots.innerHTML = "";
    for (let i = 0; i < N; i++) dots.append(h("span.chip", { style: `color:var(${i >= N - D ? "--bad" : "--good"})` }, `${i >= N - D ? "✗" : "●"} copy ${i + 1} · ${RTT[i]} ms`));
  }
  [n, w, r, down].forEach((x) => x.addEventListener("input", () => { draw(); sfx("tick", 0.1); }));
  bench.append(h("div.bench-grid", {}, h("div", { style: "display:grid; gap:10px; align-content:start" },
    h("label.field", { for: "qu-n" }, h("span", {}, "Copies (N): ", nO), n),
    h("label.field", { for: "qu-w" }, h("span", {}, "A write waits for (W): ", wO), w),
    h("label.field", { for: "qu-r" }, h("span", {}, "A read asks (R): ", rO), r),
    h("label.field", { for: "qu-d" }, h("span", {}, "Copies cut off or down: ", dO), down)),
    h("div", { style: "display:grid; gap:10px; align-content:start" }, h("div.stats", {}, sFresh.el, sW.el, sR.el, sLat.el), dots)),
    h("p.note", {}, "Copies are spread over regions: two nearby, the rest farther away. Waiting for more copies means waiting for farther ones. That everyday cost is the 'else' half of PACELC."),
    takeaway("If a read and a write both reach a majority, they overlap, so the read sees the latest write. The price is speed, every day."));
  draw();
}
