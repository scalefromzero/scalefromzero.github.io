import { lib } from "../../kit/libs";
import { h, sfx, takeaway, reducedMotion } from "../../kit/ui";

const NUMS = [["Throughput", "--storage"], ["Latency", "--cpu"], ["Availability", "--good"], ["None of them much", "--dim"]] as const;
const APPS = [
  { name: "A payment system", icon: "💳", answer: 2, why: "Availability, and never charging twice. A payment page that's down loses money every minute." },
  { name: "A video app", icon: "🎬", answer: 0, why: "Throughput: moving huge amounts of data every second." },
  { name: "A multiplayer game", icon: "🎮", answer: 1, why: "Latency: a tenth of a second can decide a match." },
  { name: "A ticket sale", icon: "🎟️", answer: 0, why: "Throughput at one sharp peak: two million fans in ten minutes." },
  { name: "A nightly report", icon: "🌙", answer: 3, why: "It can be slow, and even down for an hour, and nobody minds." },
];

/** Same three numbers, different priorities. Pick the one that matters most. */
export async function prioritiesLab(bench: HTMLElement) {
  const grid = h("div", { style: "display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr)); gap:12px" });
  const score = h("p.dim", { "aria-live": "polite" }, "Pick the number each app cares about most.");
  let right = 0, done = 0;
  const { animate, stagger } = await lib.anime();
  APPS.forEach((a) => {
    const why = h("p.dim", { style: "margin:0; font-size:var(--step--1)", hidden: true }, a.why);
    const opts = h("div", { style: "display:grid; grid-template-columns:1fr 1fr; gap:6px" });
    NUMS.forEach(([n], i) => {
      const b = h("button.btn", { type: "button", style: `justify-content:center; font-size:0.8rem; padding:8px` }, n);
      b.addEventListener("click", () => {
        if (opts.dataset.done) return; opts.dataset.done = "1"; done++;
        const ok = i === a.answer; if (ok) right++;
        [...opts.children].forEach((x, k) => { const el = x as HTMLElement; el.style.opacity = k === a.answer || k === i ? "1" : "0.35"; if (k === a.answer) { el.style.borderColor = `var(${NUMS[k][1]})`; el.style.color = `var(${NUMS[k][1]})`; } });
        if (!ok) b.style.borderColor = "var(--bad)";
        why.hidden = false; sfx(ok ? "hit" : "miss", 0.25);
        score.textContent = `${right} of ${done}` + (done === APPS.length ? ". Same three numbers, different priorities." : "");
      });
      opts.append(b);
    });
    grid.append(h("div.q", { style: "align-content:start" }, h("div.row", { style: "gap:10px" }, h("span", { style: "font-size:1.6rem" }, a.icon), h("b", {}, a.name)), opts, why));
  });
  bench.append(grid, score, takeaway("Every system is judged by the same three numbers. What changes is which one comes first."));
  if (!reducedMotion()) animate([...grid.children], { opacity: [0, 1], translateY: [18, 0], delay: stagger(80), duration: 500, ease: "outQuad" });
}
