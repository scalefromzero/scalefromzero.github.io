import { flow } from "../../kit/flow";
import { h, sfx, takeaway, sleep, reducedMotion } from "../../kit/ui";

/** Replay the flash sale with numbers. Each requirement switches on one part of the design. */
export function designLab(bench: HTMLElement) {
  const f = flow([
    { key: "fans", name: "Fans", sub: "3,300 requests/s at peak", colour: "net" },
    { key: "lb", name: "Load balancer", sub: "spreads the work", colour: "net" },
    { key: "srv", name: "1 server", sub: "500 requests/s", colour: "cpu" },
    { key: "cache", name: "Cache", sub: "popular answers", colour: "cache" },
    { key: "db", name: "Database", sub: "the main copy", colour: "storage" },
    { key: "spare", name: "Spare copy", sub: "kept up to date", colour: "storage" },
  ], 3);
  const sw = (id: string, text: string, need: string) => {
    const i = h(`input#${id}`, { type: "checkbox" }) as HTMLInputElement;
    return { i, el: h("label.row", { for: id, style: "gap:10px; align-items:flex-start; color:var(--text)" }, i, h("span", {}, h("b", {}, text), h("br"), h("span.dim", { style: "font-size:var(--step--1)" }, need))) };
  };
  const tLB = sw("dz-lb", "Ten servers behind a load balancer", "because 3,300 ÷ 500 ≈ 7, plus room to spare"), tC = sw("dz-cache", "A cache for popular answers", "because p99 must stay under 0.5 s"), tS = sw("dz-spare", "A spare database copy", "because 99.99% can't depend on one box");
  const run = h("button.btn.primary", { type: "button" }, "Run the sale");
  const clock = h("span.chip", {}, "0:00 of 10:00");
  const meter = (k: string) => { const bar = h("i", { style: "width:0%" }); const b = h("b", {}, "–"); return { el: h("div.meter", { style: "grid-template-columns: 8em minmax(0,1fr) 11em" }, h("span", {}, k), h("div.track", {}, bar), b), bar, b }; };
  const mT = meter("Throughput"), mL = meter("p99 latency"), mA = meter("Availability");
  const say = h("p.dim", { "aria-live": "polite", style: "min-height:3em" }, "Switch on the parts the numbers ask for, then run the same flash sale.");
  const paint = () => {
    f.els.lb.style.opacity = tLB.i.checked ? "1" : "0.3";
    f.els.srv.querySelector("b")!.textContent = tLB.i.checked ? "10 servers" : "1 server";
    f.els.srv.querySelector("span")!.textContent = tLB.i.checked ? "5,000 requests/s together" : "500 requests/s";
    f.els.cache.style.opacity = tC.i.checked ? "1" : "0.3";
    f.els.spare.style.opacity = tS.i.checked ? "1" : "0.3";
    f.els.db.style.borderColor = ""; f.note("db", ""); f.note("spare", "");
  };
  [tLB.i, tC.i, tS.i].forEach((x) => x.addEventListener("change", () => { paint(); sfx("pop", 0.15); }));
  const set = (m: ReturnType<typeof meter>, pct: number, text: string, ok: boolean) => { m.bar.style.width = `${pct}%`; m.bar.style.background = `var(${ok ? "--good" : "--bad"})`; m.b.textContent = text; m.b.style.color = `var(${ok ? "--good" : "--bad"})`; };
  let busy = false;
  run.addEventListener("click", async () => {
    if (busy) return; busy = true; paint();
    const lb = tLB.i.checked, cache = tC.i.checked, spare = tS.i.checked;
    [mT, mL, mA].forEach((m) => { m.bar.style.width = "0%"; m.b.textContent = "…"; m.b.style.color = ""; });
    const path = lb ? ["fans", "lb", "srv", cache ? "cache" : "db", "srv", "fans"] : ["fans", "srv", cache ? "cache" : "db", "srv", "fans"];
    say.textContent = "Ten o'clock. Two million fans arrive.";
    for (let m = 0; m <= 10; m++) {
      clock.textContent = `${m}:00 of 10:00`;
      if (m === 1) set(mT, lb ? 100 : 15, lb ? "3,300/s served" : "500 of 3,300/s", lb);
      if (m === 2) set(mL, cache ? 100 : 35, cache ? "0.2 s" : "1.4 s", cache);
      if (m === 4) {
        f.els.db.style.borderColor = "var(--bad)"; f.note("db", "✕ died", "var(--bad)"); sfx("powerdown", 0.35);
        if (spare) { await sleep(reducedMotion() ? 0 : 500); f.note("spare", "✓ now the main copy"); sfx("hit", 0.3); say.textContent = "Minute four: the main database dies. The spare takes over within a few seconds."; }
        else say.textContent = "Minute four: the one database dies. Nothing is behind it. That's a single point of failure.";
      }
      if (m < 4 || spare) await f.travel(path, reducedMotion() ? 0 : 0.18, undefined, spare && m >= 4 ? "#4ADE80" : "#EEF2FF");
      else await sleep(reducedMotion() ? 0 : 400);
    }
    set(mA, spare ? 100 : 40, spare ? "≈ 5 s down" : "6 of 10 min down", spare);
    const all = lb && cache && spare;
    say.innerHTML = all ? '<b style="color:var(--good)">Same sale, same failure, and the fans keep buying.</b>' : `<b style="color:var(--bad)">${[!lb && "Too few servers", !cache && "p99 too slow", !spare && "one database"].filter(Boolean).join(" · ")}.</b> Switch on what the numbers asked for and run it again.`;
    sfx(all ? "hit" : "miss", 0.3);
    busy = false;
  });
  paint();
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:12px; align-content:start" }, tLB.el, tC.el, tS.el, h("div.row", {}, run, clock)),
      h("div", { style: "display:grid; gap:12px; min-width:0" }, f.el, h("div.meters", {}, mT.el, mL.el, mA.el), say),
    ),
    h("p.note", {}, "Latency and downtime figures are illustrative. The point is which requirement asks for which part."),
    takeaway("The numbers chose the design: ten servers, a cache, and a spare copy of the database."),
  );
}
