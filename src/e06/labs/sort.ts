import { lib } from "../../kit/libs";
import { h, sfx, takeaway, reducedMotion } from "../../kit/ui";

const ITEMS = [
  { icon: "💸", name: "Paying the rent", tcp: true, why: "Every digit has to arrive. A little late is fine; wrong is not." },
  { icon: "🌐", name: "Loading a web page", tcp: true, why: "A page with missing pieces is broken. It can wait a moment." },
  { icon: "📧", name: "Sending an email", tcp: true, why: "Complete and in order, even if it takes a second longer." },
  { icon: "📁", name: "Downloading a file", tcp: true, why: "One missing byte can corrupt the whole file." },
  { icon: "📞", name: "A voice call", tcp: false, why: "A late word is worth nothing. Skip it and keep talking." },
  { icon: "🎥", name: "A video call", tcp: false, why: "Fresh beats complete. A blocky frame is better than a frozen one." },
  { icon: "🎮", name: "An online game", tcp: false, why: "Where the other player is now matters, not where they were." },
];

/** Some data must be complete and in order. Some must be fresh. Sort them. */
export async function sortLab(bench: HTMLElement) {
  const grid = h("div", { style: "display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr)); gap:10px" });
  let right = 0, done = 0;
  const score = h("p.dim", { "aria-live": "polite" }, "Pick a delivery for each one.");
  ITEMS.forEach((it) => {
    const why = h("p.dim", { style: "margin:0; font-size:var(--step--1)", hidden: true }, it.why);
    const bT = h("button.btn", { type: "button", style: "justify-content:center; padding:8px" }, "Complete + in order");
    const bU = h("button.btn", { type: "button", style: "justify-content:center; padding:8px" }, "Fresh");
    const pick = (tcp: boolean, b: HTMLElement) => {
      if (why.dataset.done) return; why.dataset.done = "1"; done++;
      const ok = tcp === it.tcp; if (ok) right++;
      const good = it.tcp ? bT : bU;
      good.style.borderColor = `var(${it.tcp ? "--good" : "--net"})`; good.style.color = `var(${it.tcp ? "--good" : "--net"})`;
      good.textContent = it.tcp ? "TCP ✓ complete + in order" : "UDP ✓ fresh";
      if (!ok) b.style.borderColor = "var(--bad)";
      why.hidden = false; sfx(ok ? "hit" : "miss", 0.2);
      score.textContent = `${right} of ${done}` + (done === ITEMS.length ? ". Two kinds of data, two delivery services, both on top of IP." : "");
    };
    bT.addEventListener("click", () => pick(true, bT)); bU.addEventListener("click", () => pick(false, bU));
    grid.append(h("div.q", { style: "align-content:start" }, h("div.row", { style: "gap:10px" }, h("span", { style: "font-size:1.5rem" }, it.icon), h("b", {}, it.name)), h("div", { style: "display:grid; grid-template-columns:1fr 1fr; gap:6px" }, bT, bU), why));
  });
  bench.append(grid, score, takeaway("There isn't one right answer. There are two kinds of data, so the internet offers two delivery services."));
  if (!reducedMotion()) { const { animate, stagger } = await lib.anime(); animate([...grid.children], { opacity: [0, 1], translateY: [16, 0], delay: stagger(70), duration: 450, ease: "outQuad" }); }
}
