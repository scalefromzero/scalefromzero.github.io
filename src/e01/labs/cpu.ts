import { lib } from "../../kit/libs";
import { h, sfx, takeaway, sleep, reducedMotion } from "../../kit/ui";

/** Fetch → decode → execute, one instruction at a time, for price × quantity. */
export function cpuLab(bench: HTMLElement) {
  const PROG = [
    { op: "LOAD  r1, [price]", c: "copy price from memory into r1" },
    { op: "LOAD  r2, [qty]", c: "copy quantity into r2" },
    { op: "MUL   r3, r1, r2", c: "multiply r1 by r2, keep it in r3" },
    { op: "STORE [total], r3", c: "copy r3 back to memory" },
  ];
  const lines = PROG.map((p, i) => h("div.ln", {}, h("span.faint", {}, String(i + 1)), h("span", {}, p.op), h("span.c", {}, p.c)));
  const stages = ["FETCH", "DECODE", "EXECUTE"].map((s) => h("div.stage", {}, s));
  const reg = (name: string) => { const b = h("b", {}, "–"); return { el: h("div.reg", {}, h("span", {}, name), b), b }; };
  const r1 = reg("r1"), r2 = reg("r2"), r3 = reg("r3"), pc = reg("PC (next line)");
  const price = h("input#price", { type: "number", value: 10, min: 0, max: 999 }) as HTMLInputElement;
  const qty = h("input#qty", { type: "number", value: 3, min: 0, max: 999 }) as HTMLInputElement;
  const total = h("b.mono", { style: "font-size:var(--step-1)" }, "?");
  const count = h("span.mono.dim", {}, "0 instructions run");
  const stepBtn = h("button.btn.primary", { type: "button" }, "Step");
  const runBtn = h("button.btn", { type: "button" }, "Run all");
  const resetBtn = h("button.btn", { type: "button" }, "Reset");
  let ip = 0, stage = -1, ran = 0, busy = false;
  const R = { r1: NaN, r2: NaN, r3: NaN };

  const show = () => {
    lines.forEach((l, i) => l.classList.toggle("pc", i === ip && ip < PROG.length));
    stages.forEach((s, i) => s.classList.toggle("on", i === stage));
    r1.b.textContent = isNaN(R.r1) ? "–" : String(R.r1);
    r2.b.textContent = isNaN(R.r2) ? "–" : String(R.r2);
    r3.b.textContent = isNaN(R.r3) ? "–" : String(R.r3);
    pc.b.textContent = ip < PROG.length ? String(ip + 1) : "done";
    count.textContent = `${ran} instruction${ran === 1 ? "" : "s"} run`;
  };
  async function pulse(el: HTMLElement) {
    if (reducedMotion()) return;
    const { animate } = await lib.anime();
    animate(el, { scale: [1.12, 1], duration: 420, ease: "outElastic(1, .6)" });
  }
  async function step() {
    if (busy || ip >= PROG.length) return;
    busy = true;
    for (stage = 0; stage < 3; stage++) {
      show(); sfx("tick", 0.2);
      await sleep(reducedMotion() ? 0 : 260);
    }
    if (ip === 0) { R.r1 = +price.value; pulse(r1.el); }
    if (ip === 1) { R.r2 = +qty.value; pulse(r2.el); }
    if (ip === 2) { R.r3 = R.r1 * R.r2; pulse(r3.el); }
    if (ip === 3) { total.textContent = String(R.r3); pulse(total); sfx("hit"); }
    ip++; ran++; stage = -1; show();
    busy = false;
  }
  stepBtn.addEventListener("click", step);
  runBtn.addEventListener("click", async () => { while (ip < PROG.length) await step(); });
  resetBtn.addEventListener("click", () => { ip = 0; stage = -1; R.r1 = R.r2 = R.r3 = NaN; total.textContent = "?"; show(); sfx("pop", 0.2); });
  [price, qty].forEach((i) => i.addEventListener("input", () => resetBtn.click()));
  show();

  bench.append(
    h("div.cpu-grid", {},
      h("div", {}, h("div.stages", {}, ...stages), h("div.prog", { role: "list", "aria-label": "Machine instructions" }, ...lines)),
      h("div", { style: "display:grid; gap:12px; align-content:start" },
        h("div.regs", {}, r1.el, r2.el, r3.el),
        h("div.regs", { style: "grid-template-columns: minmax(0,1fr)" }, pc.el),
        h("div.memrow", {}, h("label", { for: "price" }, "price", price), h("label", { for: "qty" }, "qty", qty), h("label", {}, "total", total)),
        h("div.row", {}, stepBtn, runBtn, resetBtn, count),
      ),
    ),
    h("p.note", {}, "A real core runs this loop billions of times a second, and modern chips overlap several instructions at once. The idea is the same."),
    takeaway("The CPU doesn't know what a price is. Load, multiply, store: browsers, games and AI are built from steps this small."),
  );
}
