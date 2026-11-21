import "../kit/theme.css";
import "./hub.css";
import { FLOORS, SEASON, byId, pad } from "../kit/season";
import { footer, h, sfx, takeaway, topbar, whenNear, reducedMotion, ROOT } from "../kit/ui";
import { lib } from "../kit/libs";
import { mountTower } from "./tower3d";

const app = document.getElementById("app")!;
const e00 = byId("e00");
topbar(e00);

/* ── Hero ── */
const towerBox = <HTMLElement>h("div.tower-box", { role: "img", "aria-label": "A five-storey tower. Each floor is a part of the season; each window is an episode." },
  h("div.tower-fallback", {}, h("img", { src: `${ROOT}img/logo.svg`, alt: "", width: 140, height: 140 })),
);
const tip = h("div.tower-tip", { "aria-live": "polite" });
towerBox.append(tip);
const watchE00 = e00.youtube ? h("a.btn", { href: e00.youtube, target: "_blank", rel: "noopener" }, "▶ Watch the season trailer") : null;
app.append(
  h("section.hero", {},
    h("div.wrap", {},
      h("div.copy", {},
        h("span.eyebrow", {}, "Season 1 · Companion labs"),
        h("h1", {}, h("span.l1", {}, "Build it."), h("span.l2", {}, "Then break it.")),
        h("p.lede", {}, "Every episode of Scale From Zero gets a lab like this one. Slow time down, overflow a cache, pull the plug on a server, and watch the ideas from the video happen in front of you."),
        h("div.row", {},
          h("a.btn.primary", { href: "e01/index.html" }, "Start with Episode 1 →"),
          h("a.btn", { href: "#season" }, "See the season"),
          watchE00,
        ),
        h("p.faint", { style: "font-size: var(--step--1)" }, "Free. No sign-up. Works on a phone."),
      ),
      towerBox,
    ),
  ),
);
whenNear(towerBox, () => mountTower(towerBox, tip, (ep) => {
  sfx(ep.site ? "hit" : "miss");
  if (ep.site) location.href = ep.id === "e00" ? "#why" : `${ep.id}/index.html`;
}).catch(() => { tip.textContent = "3D isn't available in this browser. Use the season map below."; }));

/* ── Why (E00) ── */
const stats: [string, string, string][] = [
  ["≈ 75%", "of new code at Google is written by AI, then reviewed by engineers", "Sundar Pichai, April 2026"],
  ["84%", "of developers use AI tools or plan to", "Stack Overflow survey 2025"],
  ["46%", "don't trust the accuracy of what those tools produce", "Stack Overflow survey 2025"],
  ["2 in 3", "say their top frustration is answers that are almost right, but not quite", "Stack Overflow survey 2025"],
];
const why = h("section.lab.why#why", {},
  h("div.wrap", {},
    h("div.lab-head", {},
      h("div.intro", {}, h("span.eyebrow", {}, "Episode 00"), h("h2", {}, "If AI writes the code, why learn system design?"), h("p.dim", {}, "Typing code got cheap. Deciding where a hundred million people's data lives did not.")),
    ),
    h("div.bench", {},
      h("div.stats", {}, ...stats.map(([v, k, s]) => h("div.stat.stat-big", {}, h("span.v", {}, v), h("span.k", {}, k), h("span.faint", { style: "font-size:.75rem" }, s)))),
      h("p.note", {}, "Sources: ", h("a", { href: "https://the-decoder.com/google-says-75-percent-of-its-new-code-is-now-written-by-ai/", target: "_blank", rel: "noopener" }, "Google (via The Decoder)"), " · ", h("a", { href: "https://survey.stackoverflow.co/2025/ai", target: "_blank", rel: "noopener" }, "Stack Overflow Developer Survey 2025")),
    ),
  ),
);
app.append(why);

/* ── The house lab (Rough.js) ── */
const houseCanvas = <HTMLCanvasElement>h("canvas", { width: 640, height: 480, "aria-label": "Hand-drawn house being built floor by floor" });
const floorsIn = <HTMLInputElement>h("input#floors", { type: "range", min: 2, max: 10, value: 6 });
const speedIn = <HTMLInputElement>h("input#speed", { type: "range", min: 1, max: 10, value: 3 });
const planSel = <HTMLSelectElement>h("select#plan", {}, h("option", { value: "2" }, "Foundation for 2 floors"), h("option", { value: "10" }, "Foundation for 10 floors"));
const floorsOut = h("output", {}, "6"), speedOut = h("output", {}, "3×");
const verdict = h("p", { "aria-live": "polite", style: "font-family: var(--head); font-size: var(--step-1)" });
const buildBtn = h("button.btn.primary", { type: "button" }, "Build it");
const houseLab = h("section.lab#house", { style: "--accent: var(--storage)" },
  h("div.wrap", {},
    h("div.lab-head", {}, h("div.intro", {}, h("span.eyebrow", {}, "Lab 00 · The bricklayer"), h("h2", {}, "A faster bricklayer builds the wrong house faster"), h("p.dim", {}, "AI is a bricklayer that never gets tired. System design is the plan. Pick a plan, pick how many floors people need, and make the bricklayer as fast as you like."))),
    h("div.bench", {},
      h("div.house", {},
        houseCanvas,
        h("div", { style: "display:grid; gap:16px; align-content:start" },
          h("label.field", { for: "plan" }, "The plan (system design)", planSel),
          h("label.field", { for: "floors" }, h("span", {}, "Floors people actually need: ", floorsOut), floorsIn),
          h("label.field", { for: "speed" }, h("span", {}, "Bricklayer speed (AI): ", speedOut), speedIn),
          h("div.row", {}, buildBtn),
          verdict,
        ),
      ),
      takeaway("Speed doesn't fix a wrong plan. It just finds the cracks sooner, with people already inside."),
    ),
  ),
);
app.append(houseLab);

let building = 0;
async function drawHouse(progress: number, floors: number, plan: number) {
  const rough = await lib.rough();
  const ctx = houseCanvas.getContext("2d")!;
  ctx.clearRect(0, 0, 640, 480);
  const rc = rough.canvas(houseCanvas);
  const strong = plan >= floors;
  const ground = 440, fh = Math.min(36, 360 / floors), w = 220, x = 210;
  rc.line(30, ground, 610, ground, { stroke: "#5B6690", roughness: 1.5 });
  // foundation sized by the plan
  const fdW = plan >= 10 ? 300 : 240, fdH = plan >= 10 ? 26 : 12;
  rc.rectangle(320 - fdW / 2, ground, fdW, fdH, { fill: "#F5A524", fillStyle: "cross-hatch", stroke: "#F5A524", hachureGap: 6 });
  const built = Math.floor(progress * floors);
  for (let i = 0; i < built; i++) {
    const y = ground - (i + 1) * fh;
    const cracked = !strong && i >= plan;
    rc.rectangle(x, y, w, fh, { stroke: cracked ? "#F87171" : "#EEF2FF", strokeWidth: 1.4, fill: cracked ? "rgba(248,113,113,0.15)" : "rgba(56,189,248,0.10)", fillStyle: "solid", roughness: cracked ? 2.6 : 1.1 });
    for (let k = 0; k < 3; k++) rc.rectangle(x + 24 + k * 66, y + fh * 0.25, 40, fh * 0.45, { stroke: "#38BDF8", roughness: 1.2 });
    if (cracked) rc.linearPath([[x + 30 + (i * 37) % 120, y], [x + 60 + (i * 23) % 90, y + fh * 0.5], [x + 40 + (i * 53) % 110, y + fh]], { stroke: "#F87171", strokeWidth: 2 });
  }
  if (built === floors) rc.polygon([[x - 14, ground - floors * fh], [x + w / 2, ground - floors * fh - 50], [x + w + 14, ground - floors * fh]], { stroke: "#EEF2FF", fill: "#FB7185", fillStyle: "hachure", hachureGap: 7 });
  ctx.fillStyle = "#A3AED3"; ctx.font = "600 15px 'SFZ Mono', monospace";
  ctx.fillText(`${built}/${floors} floors · ${Math.round(progress * floors * 1000)} bricks`, 30, 32);
}
async function build() {
  const floors = +floorsIn.value, plan = +planSel.value, speed = +speedIn.value;
  const run = ++building;
  const dur = reducedMotion() ? 0 : 4200 / speed;
  const t0 = performance.now();
  verdict.textContent = "Building…";
  buildBtn.setAttribute("disabled", "");
  let lastFloor = -1;
  await new Promise<void>((done) => {
    const step = async (t: number) => {
      if (run !== building) return done();
      const p = dur === 0 ? 1 : Math.min(1, (t - t0) / dur);
      const f = Math.floor(p * floors);
      if (f !== lastFloor) { lastFloor = f; sfx(f > plan ? "miss" : "pop", 0.25); }
      await drawHouse(p, floors, plan);
      if (p < 1) requestAnimationFrame(step); else done();
    };
    requestAnimationFrame(step);
  });
  buildBtn.removeAttribute("disabled");
  const secs = (dur / 1000).toFixed(1);
  if (plan >= floors) { verdict.innerHTML = `<span style="color:var(--good)">Solid.</span> ${floors} floors in ${secs} s, and the plan holds.`; sfx("hit"); }
  else { verdict.innerHTML = `<span style="color:var(--bad)">Cracks above floor ${plan}.</span> Built in ${secs} s. The speed didn't help; the plan was wrong.`; sfx("powerdown", 0.3); }
}
floorsIn.addEventListener("input", () => { floorsOut.textContent = floorsIn.value; drawHouse(1, +floorsIn.value, +planSel.value); verdict.textContent = ""; });
speedIn.addEventListener("input", () => { speedOut.textContent = speedIn.value + "×"; });
planSel.addEventListener("change", () => { drawHouse(1, +floorsIn.value, +planSel.value); verdict.textContent = ""; });
buildBtn.addEventListener("click", build);
whenNear(houseLab, () => drawHouse(1, 6, 2).then(() => { verdict.innerHTML = `<span style="color:var(--bad)">Cracks above floor 2.</span> Change the plan, or press Build it.`; }));

/* ── Four decisions ── */
const decisions = [
  ["Where does the data live?", "One database, or copies around the world?", "TixRush starts with one database. When fans in three continents buy at once, copies near them answer faster, but now the copies can disagree."],
  ["What happens when something breaks?", "In a big system, something is always breaking.", "A server dies mid-sale. Does the checkout retry somewhere else, or does the fan lose the ticket they just paid for?"],
  ["How fast, for how many people?", "Ten users and ten million need different designs.", "A sale opens at 10:00 and two million people press Buy in the same second. One machine can't take that."],
  ["What does it cost?", "A perfect design that bankrupts you is the wrong design.", "Running 500 servers all year for one hour of peak traffic is a choice someone has to defend."],
];
const decGrid = h("div.decisions");
decisions.forEach(([t, s, ex], i) => {
  const exEl = h("p.ex", { hidden: true }, ex);
  const b = h("button.decision", { type: "button", "aria-expanded": "false" }, h("span.num", {}, `Decision ${i + 1}`), h("h3", {}, t), h("p.dim", {}, s), exEl);
  b.addEventListener("click", () => { const open = b.getAttribute("aria-expanded") === "true"; b.setAttribute("aria-expanded", String(!open)); exEl.hidden = open; sfx("pop"); });
  decGrid.append(b);
});
app.append(h("section.lab#decisions", { style: "--accent: var(--cache)" },
  h("div.wrap", {},
    h("div.lab-head", {}, h("div.intro", {}, h("span.eyebrow", {}, "The four decisions"), h("h2", {}, "What AI can list, but someone has to choose"), h("p.dim", {}, "None of these has a single right answer. They're trade-offs. Tap one to see it inside TixRush, the made-up ticket site the series builds."))),
    decGrid,
  ),
));

/* ── Season map ── */
const season = h("section.lab#season", { style: "--accent: var(--net)" },
  h("div.wrap", {},
    h("div.lab-head", {}, h("div.intro", {}, h("span.eyebrow", {}, "Season 1 · 25 episodes"), h("h2", {}, "One floor at a time"), h("p.dim", {}, "From one computer to Instagram and YouTube. Each episode's lab opens the week its video comes out."))),
  ),
);
const mapWrap = season.querySelector(".wrap")!;
const card = (e: (typeof SEASON)[number], fc: string) => {
  const inner = [
    h("div.thumb", {}, e.thumb ? h("img", { src: `${ROOT}${e.thumb}`, alt: "", loading: "lazy" }) : `E${pad(e.n)}`),
    h("div.meta", {}, h("span.mono.faint", {}, `Episode ${pad(e.n)}`), h("b", {}, e.title), h("span", {}, e.blurb)),
    e.site ? h("span.chip.tag.live", {}, "Lab open") : h("span.chip.tag", {}, "Coming"),
  ];
  return e.site
    ? h("a.ep", { href: e.id === "e00" ? "#why" : `${e.id}/index.html`, style: `--fc: var(--${fc})` }, ...inner)
    : h("div.ep.soon", { style: `--fc: var(--${fc})` }, ...inner);
};
mapWrap.append(h("div.floor", { style: "--fc: var(--net)" }, h("div.floor-name", {}, h("span.eyebrow", {}, "Lobby"), h("h3", {}, "Why it matters")), h("div.eps", {}, card(e00, "net"))));
for (const f of FLOORS) {
  mapWrap.append(h("div.floor", { style: `--fc: var(--${f.colour})` },
    h("div.floor-name", {}, h("span.eyebrow", {}, `Floor ${f.n}`), h("h3", {}, f.name)),
    h("div.eps", {}, ...SEASON.filter((e) => e.floor === f.n).map((e) => card(e, f.colour))),
  ));
}
app.append(season);

/* ── How every episode works ── */
app.append(h("section.lab#method", { style: "--accent: var(--ram)" },
  h("div.wrap", {},
    h("div.lab-head", {}, h("div.intro", {}, h("span.eyebrow", {}, "How it works"), h("h2", {}, "Every episode, the same four steps"), h("p.dim", {}, "Made for complete beginners first. If you've used apps but never written code, you can follow every one."))),
    h("ol.method", {},
      h("li", {}, h("h3", {}, "An everyday picture"), h("p.dim", {}, "A desk, a pizza shop, a phone book. Something you already understand.")),
      h("li", {}, h("h3", {}, "The real name"), h("p.dim", {}, "Cache, load balancer, replica. The word engineers use.")),
      h("li", {}, h("h3", {}, "Build TixRush"), h("p.dim", {}, "A made-up ticket site that grows one box at a time.")),
      h("li", {}, h("h3", {}, "How real companies do it"), h("p.dim", {}, "Netflix, WhatsApp, Instagram, YouTube, from what they've published.")),
    ),
  ),
));
footer();
