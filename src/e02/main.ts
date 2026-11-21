import "../kit/theme.css";
import "../kit/labs.css";
import { byId, pad } from "../kit/season";
import { lib } from "../kit/libs";
import { footer, h, lab, quiz, takeaway, topbar, whenNear, fmt, sfx, reducedMotion } from "../kit/ui";
import { tripLab } from "./labs/trip";
import { saleDayLab } from "./labs/saleday";
import { hitMissLab } from "./labs/hitmiss";
import { layersLab } from "./labs/layers";
import { staleLab } from "./labs/stale";
import { ttlLab } from "./labs/ttl";
import { writesLab } from "./labs/writes";
import { evictLab } from "./labs/evict";
import { goldenLab } from "./labs/golden";

const ep = byId("e02");
const next = byId("e03");
topbar(ep);
const app = document.getElementById("app")!;

// Chapter starts in the published cut (v2, 9:46), from the render's cue file.
const LABS: { id: string; title: string; lede: string; chapter: string; s: number; colour: string; mount: (b: HTMLElement) => void | Promise<void> }[] = [
  { id: "tixrush", title: "One question, one trip", lede: "Meet TixRush, the made-up ticket site the season builds. A fan's phone asks the server, the server asks the database, and the answer comes back.", chapter: "0:50", s: 50, colour: "storage", mount: tripLab },
  { id: "saleday", title: "Sale day", lede: "Two million fans refreshing in the same minute is about 33,000 questions a second. The database is careful, not fast. Watch the queue.", chapter: "1:26", s: 86, colour: "bad", mount: saleDayLab },
  { id: "hitmiss", title: "Hit and miss", lede: "A cache is a small, fast place that keeps a copy of an answer. Check it first: a hit is instant, a miss goes to the database and leaves a copy behind.", chapter: "2:55", s: 175, colour: "ram", mount: hitMissLab },
  { id: "everywhere", title: "Caches everywhere", lede: "Your browser, a server near your city, Redis next to the server. Open the same page twice and see which copy answers.", chapter: "3:41", s: 221, colour: "net", mount: layersLab },
  { id: "stale", title: "When the whiteboard lies", lede: "The warehouse sells forty seats online. Nobody updates the board. A copy that is out of date is called stale.", chapter: "4:21", s: 261, colour: "bad", mount: staleLab },
  { id: "ttl", title: "Time to live", lede: "Give every note an expiry time. Short means fresh but busy; long means calm but old. Slide it and watch both lines.", chapter: "5:11", s: 311, colour: "cache", mount: ttlLab },
  { id: "writes", title: "When a seat is sold", lede: "Three ways to keep the copy honest: write both, wipe the note, or update the board and tell the warehouse later.", chapter: "5:55", s: 355, colour: "storage", mount: writesLab },
  { id: "eviction", title: "Who gets wiped?", lede: "The whiteboard is full and a new answer arrives. Oldest first, least used, or least recently used?", chapter: "6:50", s: 410, colour: "cache", mount: evictLab },
  { id: "golden", title: "The golden rule", lede: "Use the cache for showing, and the database for deciding. Two fans, one last seat.", chapter: "7:37", s: 457, colour: "good", mount: goldenLab },
];

/* ── Hero: the 10:00 switch ── */
const qps = 2_000_000 / 60;
const big = h("div.big.tnum", { style: "color:var(--bad)" }, fmt(qps));
const sub = h("div.small", {}, "questions reaching the database every second");
const sw = h("button.btn", { type: "button", "aria-pressed": "false", style: "justify-content:center; font-size:var(--step-0); padding:14px" }, "Turn the cache on");
const bar = h("i", { style: "display:block; height:100%; width:100%; border-radius:10px; background:var(--bad); transition:width .2s" });
let on = false;
sw.addEventListener("click", async () => {
  on = !on;
  sw.setAttribute("aria-pressed", String(on)); sw.textContent = on ? "Turn the cache off" : "Turn the cache on";
  const target = on ? 2 : qps;
  big.style.color = on ? "var(--good)" : "var(--bad)"; bar.style.background = on ? "var(--good)" : "var(--bad)";
  sfx(on ? "hit" : "powerdown", 0.3);
  const { gsap } = await lib.gsap();
  const o = { v: on ? qps : 2 };
  gsap.to(o, { v: target, duration: reducedMotion() ? 0 : 1.2, ease: "power3.out", onUpdate: () => { big.textContent = fmt(o.v); bar.style.width = `${Math.max(1, (o.v / qps) * 100)}%`; } });
  sub.textContent = on ? "questions reaching the database every second. The rest are cache hits." : "questions reaching the database every second";
});
const watch = ep.youtube ? h("a.btn.primary", { href: ep.youtube, target: "_blank", rel: "noopener" }, "▶ Watch Episode 2") : h("a.btn.primary", { href: "#tixrush" }, "Start the labs ↓");
app.append(
  h("section.ep-hero#top", {},
    h("div.wrap", {},
      h("div.copy", {},
        h("span.eyebrow", { style: "color:var(--cache)" }, `Episode ${pad(ep.n)} · Floor 1 · One machine`),
        h("h1", {}, "When the cache is ", h("em", { style: "color:var(--bad)" }, "wrong")),
        h("p.lede", {}, "Ten o'clock. Tickets for the biggest concert of the year go on sale, and two million fans hit refresh. One simple trick keeps the site alive. It comes with a catch so famous that programmers call it one of the only two hard things in computer science."),
        h("div.row", {}, watch, h("a.btn", { href: "#quiz" }, "Test yourself")),
        h("nav.toc", { "aria-label": "Labs" }, ...LABS.map((l, i) => h("a", { href: `#${l.id}` }, `${pad(i + 1)} ${l.title}`))),
      ),
      h("div.bench", {}, h("div.clock", {},
        h("div.clock-readout", { "aria-live": "polite" }, h("span.eyebrow", {}, "10:00 · two million fans refreshing"), big, sub, h("div.track", { style: "height:10px; border-radius:10px; background:var(--line); overflow:hidden; margin-top:8px" }, bar)),
        sw,
        h("p.note", { style: "margin:0" }, "With a cache, each seats-left note is fetched once and reused for a few seconds, so the database sees a handful of questions instead of tens of thousands."),
      )),
    ),
  ),
);

LABS.forEach((L, i) => {
  const { sec, bench } = lab({ id: L.id, ep, num: i + 1, title: L.title, lede: L.lede, chapter: L.chapter, seconds: L.s, colour: L.colour });
  app.append(sec);
  whenNear(sec, () => L.mount(bench));
});

const { sec: qs, bench: qb } = lab({ id: "quiz", ep, num: LABS.length + 1, title: "Four things to remember", lede: "A cache keeps a copy close by. A copy can be wrong, so it needs an expiry time or a way to be wiped. When memory is full, remove what nobody has looked at in a while. And use the cache for showing, the database for deciding.", chapter: "9:01", seconds: 541, colour: "good" });
qb.append(quiz([
  { q: "Two million fans each refresh once in the same minute. Roughly how many questions per second is that?", options: ["About 3,300", "About 33,000", "About 2,000,000"], answer: 1, why: "2,000,000 ÷ 60 seconds ≈ 33,333 questions every second." },
  { q: "The cache doesn't have the answer, so the server asks the database and saves a copy. What is that called?", options: ["A cache hit", "A cache miss", "Write-back"], answer: 1, why: "A miss goes to the slow place and leaves a copy behind, so the next question is a hit." },
  { q: "Which data should get the shortest time to live?", options: ["The concert poster", "The concert description", "The number of seats left"], answer: 2, why: "Seats left changes every second. Posters and descriptions barely change, so they can be cached for hours." },
  { q: "Which write strategy can lose sales if the cache crashes?", options: ["Write-through", "Update, then wipe the note", "Write-back"], answer: 2, why: "Write-back updates the cache now and the database later. If the cache dies first, those sales are gone." },
  { q: "A fan presses Buy. Where should the server check whether the seat is free?", options: ["The cache, because it's faster", "The database, the single source of truth", "The fan's browser cache"], answer: 1, why: "Cache for showing, database for deciding. A stale answer at checkout would sell the same seat twice." },
]));
qb.append(
  takeaway("TixRush now has three boxes: a server, a cache and a database. A real app has a dozen more."),
  h("div.row", { style: "margin-top:16px" },
    next.site ? h("a.btn.primary", { href: `../${next.id}/index.html` }, `Episode ${pad(next.n)}: ${next.title} →`) : h("span.chip", {}, `Next: Episode ${pad(next.n)} · ${next.title}`),
    h("a.btn", { href: "../index.html#season" }, "All episodes"),
  ),
);
app.append(qs);
footer();
