import { lib } from "../../kit/libs";
import { h, sfx, reducedMotion } from "../../kit/ui";
import { OPS, human, real } from "../data";

/** Hero widget: pick an operation, watch how long it takes if 1 ns lasted 1 s. */
export function stretchClock() {
  const big = h("div.big.tnum", {}, human(100));
  const small = h("div.small", {}, "Read from RAM · really ~100 ns");
  const readout = h("div.clock-readout", { "aria-live": "polite" }, h("span.eyebrow", {}, "If 1 nanosecond lasted 1 second"), big, small);
  const ops = h("div.ops");
  const maxLog = Math.log10(OPS[OPS.length - 1].ns);
  const pick = ["l1", "ram", "ssd", "net"];
  const buttons: HTMLElement[] = [];
  let tween: { kill: () => void } | null = null;

  async function show(i: number) {
    const op = OPS.filter((o) => pick.includes(o.key))[i];
    buttons.forEach((b, k) => b.setAttribute("aria-pressed", String(k === i)));
    readout.style.setProperty("--opc", `var(--${op.layer})`);
    small.textContent = `${op.label} · really ~${real(op.ns)} · ${op.note}`;
    sfx(op.ns > 1e6 ? "whoosh" : "tick", 0.3);
    if (reducedMotion()) { big.textContent = human(op.ns); return; }
    const { gsap } = await lib.gsap();
    tween?.kill();
    const o = { v: 0 };
    tween = gsap.to(o, { v: Math.log10(op.ns), duration: 1.1, ease: "power2.out", onUpdate: () => (big.textContent = human(10 ** o.v)) });
  }

  OPS.filter((o) => pick.includes(o.key)).forEach((op, i) => {
    const w = Math.max(3, (Math.log10(op.ns) / maxLog) * 100);
    const b = h("button.op", { type: "button", style: `--opc: var(--${op.layer})`, "aria-pressed": "false" },
      h("span.nm", {}, op.label), h("span.rt", {}, human(op.ns)), h("span.bar", {}, h("i", { style: `width:${w}%` })));
    b.addEventListener("click", () => show(i));
    buttons.push(b);
    ops.append(b);
  });
  buttons[1].setAttribute("aria-pressed", "true");
  readout.style.setProperty("--opc", "var(--ram)");
  return h("div.bench", {}, h("div.clock", {}, readout, ops, h("p.note", { style: "margin:0" }, "Bars are on a log scale: each step right is 10× slower.")));
}
