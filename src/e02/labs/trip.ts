import { flow } from "../../kit/flow";
import { h, sfx, takeaway } from "../../kit/ui";

/** TixRush with no cache: one question, one trip to the database. */
export function tripLab(bench: HTMLElement) {
  const f = flow([
    { key: "phone", name: "Fan's phone", sub: "asks: how many seats?", colour: "net" },
    { key: "server", name: "Server", sub: "runs the TixRush code", colour: "cpu" },
    { key: "db", name: "Database", sub: "every concert, seat, order", colour: "storage" },
  ]);
  let trips = 0, busy = false;
  const count = h("span.v.tnum", {}, "0");
  const btn = h("button.btn.primary", { type: "button" }, "Load the concert page");
  const log = h("p.dim", { "aria-live": "polite" }, "One fan, one question.");
  btn.addEventListener("click", async () => {
    if (busy) return; busy = true;
    f.note("phone", "");
    await f.travel(["phone", "server", "db"], 0.45, (k) => { if (k === "db") { f.glow("db", true); sfx("tick", 0.3); } });
    f.glow("db", false);
    await f.travel(["db", "server", "phone"], 0.4);
    trips++; count.textContent = String(trips);
    f.note("phone", "✓ 40 seats left");
    log.textContent = `That fan's page cost ${trips === 1 ? "one trip" : "another trip"} to the database. ${trips} so far.`;
    sfx("pop", 0.3); busy = false;
  });
  bench.append(f.el,
    h("div.row", { style: "margin-top:14px; justify-content:space-between" }, btn, h("div.stat", {}, count, h("span.k", {}, "trips to the database"))),
    log, takeaway("On a quiet day, one trip per question is perfectly fine. Sale day is not a quiet day."));
}
