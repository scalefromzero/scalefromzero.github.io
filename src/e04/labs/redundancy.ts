import { lib } from "../../kit/libs";
import { h, sfx, takeaway, fmt, reducedMotion } from "../../kit/ui";
import { downtime } from "../ring";

const BUDGET = 0.001 * 30 * 24 * 60; // 43.2 minutes in a 30-day month at 99.9%

/** Copies side by side, then an error budget you can spend. */
export async function redundancyLab(bench: HTMLElement) {
  /* Part A: copies side by side */
  const seg = h("div.seg", { role: "group", "aria-label": "Copies side by side" });
  let n = 2;
  [1, 2, 3].forEach((k) => {
    const b = h("button", { type: "button", "aria-pressed": String(k === n) }, `${k} cop${k > 1 ? "ies" : "y"}`);
    b.addEventListener("click", () => { n = k; [...seg.children].forEach((x) => x.setAttribute("aria-pressed", String(x === b))); drawA(); sfx("pop", 0.2); });
    seg.append(b);
  });
  const same = h("input#rd-same", { type: "checkbox" }) as HTMLInputElement;
  const copies = h("div", { style: "display:grid; gap:8px" });
  const aBig = h("span.v.tnum", {}, "–"), aOdds = h("span.v.tnum", { style: "color:var(--dim)" }, "–");
  const aSay = h("p.dim", { style: "margin:0" });
  function drawA() {
    copies.innerHTML = "";
    for (let i = 0; i < n; i++) copies.append(h("div.box", { style: "--bc: var(--storage); min-height:auto; flex-direction:row" }, h("b", {}, `Copy ${i + 1}`), h("span", {}, "up 99.9% of the time · either one can do the job")));
    const A = same.checked ? 0.999 : 1 - 0.001 ** n;
    const nines = Math.round(-Math.log10(1 - A));
    aBig.textContent = `${nines} nines`;
    aBig.style.color = `var(${nines >= 6 ? "--good" : nines >= 4 ? "--ram" : "--storage"})`;
    aOdds.textContent = `1 in ${fmt(same.checked ? 1000 : 1000 ** n)}`;
    aSay.textContent = same.checked ? "If both copies share the same power supply, one outage takes out both. You're back to three nines." : n === 1 ? "One copy: 99.9%, about nine hours down a year." : `${n} copies: all of them are down only ${aOdds.textContent} of the time. That's ${downtime((1 - A) * 8760)} a year.`;
  }
  same.addEventListener("change", () => { drawA(); sfx(same.checked ? "miss" : "hit", 0.2); });

  /* Part B: error budget */
  const left = h("i", { style: "width:100%; background:var(--good)" });
  const leftText = h("b", {}, "");
  const bSay = h("p.dim", { "aria-live": "polite", style: "min-height:3em" }, "A 99.9% target leaves about 43 minutes of downtime this month. That's your budget.");
  const log = h("div.logs", { style: "height:120px" });
  const btn = (t: string) => h("button.btn", { type: "button" }, t);
  const bRisky = btn("Ship a risky feature"), bCareful = btn("Ship a small, careful change"), bBreak = btn("Something breaks on its own"), bNew = btn("New month");
  let spent = 0, day = 1, seed = 5;
  const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  async function spend(min: number, what: string) {
    if (spent >= BUDGET && what !== "outage") { bSay.innerHTML = '<b style="color:var(--bad)">Budget gone. New features wait until things are stable again.</b> Only fixes ship now.'; sfx("miss", 0.25); return; }
    day = Math.min(30, day + 1 + Math.floor(r() * 3));
    spent += min;
    const rest = Math.max(0, BUDGET - spent);
    const { animate } = await lib.motion();
    const pct = (rest / BUDGET) * 100;
    if (reducedMotion()) left.style.width = `${pct}%`; else animate(left, { width: `${pct}%` }, { duration: 0.5 });
    left.style.background = `var(${pct > 50 ? "--good" : pct > 0 ? "--storage" : "--bad"})`;
    leftText.textContent = `${fmt(rest, 1)} of ${fmt(BUDGET, 1)} min left`;
    log.append(h("div", { class: min > 5 ? "err" : "ok" }, `day ${String(day).padStart(2, " ")} · ${what.padEnd(14, " ")} −${fmt(min, 1)} min`));
    if (log.children.length > 8) log.firstElementChild!.remove();
    if (rest <= 0) { bSay.innerHTML = '<b style="color:var(--bad)">Budget spent. Feature freeze:</b> new features wait until the system is stable again.'; sfx("powerdown", 0.3); }
    else bSay.textContent = min > 5 ? `That cost ${fmt(min, 0)} minutes. Spend the budget on risky changes if you like.` : "Barely a dent.";
    if (rest > 0) sfx(min > 5 ? "miss" : "tick", 0.2);
  }
  bRisky.addEventListener("click", () => spend(6 + r() * 10, "risky release"));
  bCareful.addEventListener("click", () => spend(r() * 1.2, "small change"));
  bBreak.addEventListener("click", () => spend(8 + r() * 6, "outage"));
  bNew.addEventListener("click", () => { spent = 0; day = 1; log.innerHTML = ""; left.style.width = "100%"; left.style.background = "var(--good)"; leftText.textContent = `${fmt(BUDGET, 1)} of ${fmt(BUDGET, 1)} min left`; bSay.textContent = "A fresh month, a fresh 43 minutes."; sfx("whoosh", 0.2); });
  leftText.textContent = `${fmt(BUDGET, 1)} of ${fmt(BUDGET, 1)} min left`;

  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:12px; align-content:start" },
        h("span.eyebrow", {}, "Side by side, not one after another"), seg, copies,
        h("label.row", { for: "rd-same", style: "gap:8px; color:var(--dim)" }, same, "Both copies share one power supply"),
        h("div.stats", {}, h("div.stat", {}, aBig, h("span.k", {}, "availability")), h("div.stat", {}, aOdds, h("span.k", {}, "chance all are down"))), aSay),
      h("div", { style: "display:grid; gap:12px; align-content:start; min-width:0" },
        h("span.eyebrow", {}, "The error budget, this month"),
        h("div.meter", { style: "grid-template-columns: 5em minmax(0,1fr) 12em" }, h("span", {}, "Budget"), h("div.track", {}, left), leftText),
        h("div.row", {}, bRisky, bCareful, bBreak, bNew), log, bSay),
    ),
    h("p.note", {}, "Copies only multiply their nines if they don't fail for the same reason. A 30-day month at 99.9% allows 43.2 minutes down."),
    takeaway("Redundancy makes a system fault tolerant. An error budget turns the target into minutes you can spend."),
  );
  drawA();
}
