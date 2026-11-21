import { lib } from "../../kit/libs";
import { h, sfx, takeaway, fmt, reducedMotion } from "../../kit/ui";

const COOK = 12; // minutes per pizza in one oven (illustrative)

/** A pizza shop judged by three numbers. Change the ovens, the orders, and close the door. */
export async function pizzaLab(bench: HTMLElement) {
  const ovensIn = h("input#pz-ovens", { type: "range", min: 1, max: 4, step: 1, value: 2 }) as HTMLInputElement;
  const ordersIn = h("input#pz-orders", { type: "range", min: 4, max: 24, step: 1, value: 8 }) as HTMLInputElement;
  const ovensOut = h("output", {}), ordersOut = h("output", {});
  const close = h("button.btn", { type: "button", "aria-pressed": "false" }, "Close the shop for a while");
  const st = (k: string, sub: string, c: string) => { const v = h("span.v.tnum", { style: `color:var(${c})` }, "–"); return { el: h("div.stat", {}, h("span.eyebrow", { style: `color:var(${c})` }, k), v, h("span.k", {}, sub)), v }; };
  const sT = st("Throughput", "pizzas out per hour", "--storage"), sL = st("Latency", "minutes, order to door (slowest tonight)", "--cpu"), sA = st("Availability", "of the time, open when you call", "--good");
  const queue = h("div", { style: "display:flex; flex-wrap:wrap; gap:4px; min-height:34px; align-content:flex-start", "aria-label": "Orders waiting" });
  const ovenRow = h("div", { style: "display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:8px" });
  const door = h("div", { style: "display:flex; flex-wrap:wrap; gap:3px; min-height:30px" });
  const clock = h("span.chip", {}, "18:00");
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:12px; align-content:start" },
        h("label.field", { for: "pz-ovens" }, h("span", {}, "Ovens: ", ovensOut), ovensIn),
        h("label.field", { for: "pz-orders" }, h("span", {}, "Orders per hour: ", ordersOut), ordersIn),
        h("div.row", {}, close, clock),
        h("div.stats", { style: "grid-template-columns:1fr" }, sT.el, sL.el, sA.el),
      ),
      h("div", { style: "display:grid; gap:12px; align-content:start; min-width:0" },
        h("span.eyebrow", {}, "Orders waiting"), queue,
        h("span.eyebrow", {}, "Ovens"), ovenRow,
        h("span.eyebrow", {}, "Delivered"), door,
        h("div", { style: "display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; margin-top:6px" },
          ...[["Pizzas per hour", "requests per second", "--storage"], ["Minutes per pizza", "seconds per request", "--cpu"], ["Hours the shop is open", "share of time the app works", "--good"]].map(([a, b, c]) =>
            h("div.box", { style: `--bc: var(${c}); min-height:auto` }, h("b", { style: "font-size:0.9rem" }, a), h("span", {}, `→ ${b}`)))),
      ),
    ),
    h("p.note", {}, `Each oven cooks one pizza in ${COOK} minutes. One evening runs from 18:00 to midnight, a minute every 0.15 seconds.`),
    takeaway("Store, change, move. Shops and computers are judged by the same three numbers: how much, how fast, how often."),
  );

  const { animate } = await lib.motion();
  type Order = { at: number; el: HTMLElement };
  let minute = 0, open = true, openMins = 0, waiting: Order[] = [], ovens: (Order & { left: number } | null)[] = [], done: number[] = [], slowest = 0, owed = 0;
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const ovenEls: HTMLElement[] = [];
  function buildOvens() {
    ovenRow.innerHTML = ""; ovenEls.length = 0;
    const n = +ovensIn.value; ovensOut.textContent = String(n);
    for (let i = 0; i < 4; i++) {
      const bar = h("i", { style: "display:block; height:100%; width:0%; background:var(--storage); border-radius:6px" });
      const box = h("div.box", { style: `--bc: var(${i < n ? "--storage" : "--line"}); min-height:64px; opacity:${i < n ? 1 : 0.3}` }, h("b", { style: "font-size:0.85rem" }, i < n ? `Oven ${i + 1}` : "no oven"), h("div", { style: "height:8px; background:var(--line); border-radius:6px; overflow:hidden" }, bar));
      ovenRow.append(box); ovenEls.push(bar);
    }
    ovens = Array.from({ length: n }, (_, i) => ovens[i] ?? null);
  }
  function reset() {
    minute = 0; openMins = 0; waiting = []; done = []; slowest = 0; owed = 0; seed = 7; ovens = [];
    queue.innerHTML = ""; door.innerHTML = ""; buildOvens(); show();
  }
  function show() {
    ordersOut.textContent = ordersIn.value;
    const hrs = Math.max(1 / 60, minute / 60);
    sT.v.textContent = minute < 20 ? "–" : fmt(done.length / hrs, 1);
    const recent = done.slice(-10);
    sL.v.textContent = recent.length ? `${fmt(recent.reduce((a, b) => a + b, 0) / recent.length)} (${fmt(slowest)})` : "–";
    sA.v.textContent = minute ? `${fmt((openMins / minute) * 100, 1)}%` : "–";
    sA.v.style.color = openMins / Math.max(1, minute) < 0.95 ? "var(--bad)" : "var(--good)";
    clock.textContent = `${18 + Math.floor(minute / 60)}:${String(minute % 60).padStart(2, "0")}`;
  }
  function tick() {
    if (minute >= 360) { reset(); return; }
    minute++;
    if (open) openMins++;
    owed += +ordersIn.value / 60;
    while (owed >= 1 || (rnd() < 0.02 && owed > 0.6)) {
      owed -= 1;
      if (!open) { sfx("miss", 0.08); continue; }
      const el = h("span", { style: "font-size:1.15rem", title: "order" }, "🍕");
      queue.append(el); waiting.push({ at: minute, el });
      if (!reducedMotion()) animate(el, { scale: [0, 1] }, { duration: 0.25 });
    }
    ovens.forEach((o, i) => {
      if (o) { o.left--; ovenEls[i].style.width = `${((COOK - o.left) / COOK) * 100}%`; }
      if (o && o.left <= 0) {
        const lat = minute - o.at; done.push(lat); slowest = Math.max(slowest, lat);
        o.el.remove(); ovens[i] = null; ovenEls[i].style.width = "0%";
        const d = h("span", { style: "font-size:0.95rem" }, "📦"); door.append(d); if (door.children.length > 48) door.firstElementChild!.remove();
        sfx("pop", 0.05);
      }
      if (!ovens[i] && waiting.length && open) { const w = waiting.shift()!; ovens[i] = { ...w, left: COOK }; w.el.remove(); }
    });
    show();
  }
  ovensIn.addEventListener("input", () => { buildOvens(); show(); });
  ordersIn.addEventListener("input", show);
  close.addEventListener("click", () => {
    open = !open; close.setAttribute("aria-pressed", String(!open));
    close.textContent = open ? "Close the shop for a while" : "Open the shop again";
    sfx(open ? "hit" : "powerdown", 0.25);
  });
  reset();
  let vis = false; new IntersectionObserver((e) => (vis = e[0].isIntersecting)).observe(bench);
  setInterval(() => { if (vis) tick(); }, 150);
}
