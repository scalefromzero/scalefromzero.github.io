import { h, sfx, takeaway } from "../../kit/ui";

type Mode = "through" | "aside" | "back";

/** Three ways to keep the copy honest when a seat is sold. */
export function writesLab(bench: HTMLElement) {
  const MODES: { k: Mode; name: string; how: string }[] = [
    { k: "through", name: "Write-through", how: "Update the warehouse and the board at the same moment." },
    { k: "aside", name: "Update, then wipe", how: "Update the warehouse; wipe the note. The next question refills it. The most common pattern." },
    { k: "back", name: "Write-back", how: "Update the board now; tell the warehouse later. Fastest, but risky." },
  ];
  let mode: Mode = "aside", db = 40, cache: number | null = 40, pending = 0, writes = 0, lost = 0;
  const seg = h("div.seg", { role: "group", "aria-label": "Write strategy" });
  const how = h("p.dim", {});
  const vDb = h("span.v.tnum", { style: "color:var(--storage)" }), vC = h("span.v.tnum", { style: "color:var(--ram)" });
  const vW = h("span.v.tnum"), vP = h("span.v.tnum", { style: "color:var(--cache)" }), vL = h("span.v.tnum", { style: "color:var(--bad)" });
  const log = h("div.log", { "aria-live": "polite" });
  const line = (t: string, cls = "") => { log.append(h(`span${cls ? "." + cls : ""}`, {}, t)); while (log.children.length > 6) log.firstElementChild!.remove(); };
  const buy = h("button.btn.primary", { type: "button" }, "A fan buys a seat");
  const ask = h("button.btn", { type: "button" }, "Another fan asks");
  const sync = h("button.btn", { type: "button" }, "Tell the warehouse now");
  const fire = h("button.btn", { type: "button", style: "border-color:var(--bad)" }, "The box office burns down");
  const paint = () => {
    vDb.textContent = String(db); vC.textContent = cache === null ? "wiped" : String(cache);
    vW.textContent = String(writes); vP.textContent = String(pending); vL.textContent = String(lost);
    sync.hidden = mode !== "back";
  };
  const btns = MODES.map((m) => {
    const b = h("button", { type: "button", "aria-pressed": String(m.k === mode) }, m.name);
    b.addEventListener("click", () => { mode = m.k; db = 40; cache = 40; pending = 0; writes = 0; lost = 0; log.innerHTML = ""; btns.forEach((x, i) => x.setAttribute("aria-pressed", String(MODES[i].k === mode))); how.textContent = m.how; line("Reset: 40 seats in both places."); paint(); sfx("pop", 0.2); });
    seg.append(b); return b;
  });
  void btns;
  buy.addEventListener("click", () => {
    if (mode === "through") { db--; cache = (cache ?? db + 1) - 1; writes += 2; line("Sold. Wrote the warehouse and the board: 2 writes before the sale is finished.", "hit"); }
    if (mode === "aside") { db--; cache = null; writes += 1; line("Sold. Warehouse updated, note wiped: 1 write.", "hit"); }
    if (mode === "back") { cache = (cache ?? db) - 1; pending++; writes += 1; line(`Sold. Board updated instantly. ${pending} sale${pending === 1 ? "" : "s"} waiting to reach the warehouse.`, "miss"); }
    sfx("hit", 0.25); paint();
  });
  ask.addEventListener("click", () => {
    if (cache === null) { cache = db; writes += 1; line(`Note was wiped, so this question went to the warehouse (${db}) and refilled the board.`); sfx("whoosh", 0.2); }
    else line(`The board says ${cache}. Answered instantly.`, "hit");
    paint();
  });
  sync.addEventListener("click", () => { db -= pending; line(`Warehouse told about ${pending} sales.`, "hit"); pending = 0; paint(); });
  fire.addEventListener("click", () => {
    if (mode === "back" && pending) { lost += pending; line(`The board is gone, and ${pending} sale${pending === 1 ? "" : "s"} never reached the warehouse. Lost forever.`, "miss"); pending = 0; sfx("powerdown", 0.35); }
    else line("The board is gone, but every sale is safe in the warehouse. The next question rebuilds the board.", "hit");
    cache = null; paint();
  });
  how.textContent = MODES[1].how;
  line("40 seats in both places. Pick a strategy and sell.");
  paint();
  bench.append(
    seg, how,
    h("div.bench-grid", { style: "margin-top:12px" },
      h("div", { style: "display:grid; gap:12px" }, h("div.row", {}, buy, ask, sync, fire), log),
      h("div.stats", {}, h("div.stat", {}, vDb, h("span.k", {}, "warehouse (database)")), h("div.stat", {}, vC, h("span.k", {}, "board (cache)")), h("div.stat", {}, vW, h("span.k", {}, "writes so far")), h("div.stat", {}, vP, h("span.k", {}, "sales not yet in the warehouse")), h("div.stat", {}, vL, h("span.k", {}, "sales lost forever"))),
    ),
    takeaway("For tickets and money, never let the only copy of a sale live in the cache."),
  );
}
