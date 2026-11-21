import { flow } from "../../kit/flow";
import { h, sfx, takeaway, sleep, reducedMotion } from "../../kit/ui";

/** Two fans press Buy on the last seat. Decide from the cache, or from the database. */
export function goldenLab(bench: HTMLElement) {
  let mode: "cache" | "db" = "cache";
  const seg = h("div.seg", { role: "group", "aria-label": "Where checkout looks" });
  const bC = h("button", { type: "button", "aria-pressed": "true" }, "Checkout reads the cache");
  const bD = h("button", { type: "button", "aria-pressed": "false" }, "Checkout asks the database");
  seg.append(bC, bD);
  const f = flow([
    { key: "maya", name: "Maya", sub: "presses Buy", colour: "net" },
    { key: "sam", name: "Sam", sub: "presses Buy", colour: "cache" },
    { key: "cache", name: "Cache", sub: "says: 1 seat left", colour: "ram" },
    { key: "db", name: "Database", sub: "single source of truth", colour: "storage" },
  ]);
  const out = h("p", { "aria-live": "polite", style: "font-family:var(--head); font-size:var(--step-1); min-height:2.6em" });
  const go = h("button.btn.primary", { type: "button" }, "Both press Buy on the last seat");
  const set = (m: typeof mode) => { mode = m; bC.setAttribute("aria-pressed", String(m === "cache")); bD.setAttribute("aria-pressed", String(m === "db")); out.textContent = ""; ["maya", "sam", "cache", "db"].forEach((k) => f.note(k, "")); sfx("pop", 0.2); };
  bC.addEventListener("click", () => set("cache"));
  bD.addEventListener("click", () => set("db"));
  go.addEventListener("click", async () => {
    ["maya", "sam", "cache", "db"].forEach((k) => f.note(k, ""));
    out.textContent = "";
    if (mode === "cache") {
      await f.travel(["maya", "cache"], 0.4); f.note("maya", "✓ cache says free, charged", "var(--storage)");
      await f.travel(["sam", "cache"], 0.3); f.note("sam", "✓ cache says free, charged", "var(--storage)");
      await sleep(reducedMotion() ? 0 : 300);
      f.note("cache", "still says 1 seat", "var(--bad)");
      out.innerHTML = `<span style="color:var(--bad)">Seat 12 sold twice.</span> Both fans paid. One of them is getting a refund and an apology.`;
      sfx("miss", 0.4);
    } else {
      await f.travel(["maya", "db"], 0.45); f.note("db", "seat 12 → Maya", "var(--good)"); f.note("maya", "✓ booked and charged");
      await f.travel(["sam", "db"], 0.35); f.note("sam", "sold out, not charged", "var(--dim)");
      f.note("cache", "used only for showing", "var(--dim)");
      out.innerHTML = `<span style="color:var(--good)">One seat, one owner.</span> The database decided, in order. Sam sees "sold out" and keeps his money.`;
      sfx("hit", 0.35);
    }
  });
  bench.append(seg, h("div", { style: "margin-top:14px" }, f.el), h("div.row", { style: "margin-top:12px" }, go), out,
    takeaway("Use the cache for showing, and the database for deciding. A stale number on a page is an annoyance; a stale answer at checkout sells a seat twice."));
}
