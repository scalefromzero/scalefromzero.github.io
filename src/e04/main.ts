import "../kit/theme.css";
import "../kit/labs.css";
import "./e04.css";
import { byId, pad } from "../kit/season";
import { footer, h, lab, quiz, takeaway, topbar, whenNear } from "../kit/ui";
import { heroRing } from "./ring";
import { flashSaleLab } from "./labs/flashsale";
import { pizzaLab } from "./labs/pizza";
import { serversLab } from "./labs/servers";
import { p99Lab } from "./labs/p99";
import { ninesLab } from "./labs/nines";
import { designLab } from "./labs/design";
import { fleetLab } from "./labs/fleet";
import { chainLab } from "./labs/chain";
import { redundancyLab } from "./labs/redundancy";
import { prioritiesLab } from "./labs/priorities";

const ep = byId("e04");
const next = byId("e05");
topbar(ep);
const app = document.getElementById("app")!;

// Chapter starts in the published cut (10:11), from the episode's package.
const LABS: { id: string; title: string; lede: string; chapter: string; s: number; colour: string; mount: (b: HTMLElement) => void | Promise<void> }[] = [
  { id: "sale", title: "The flash sale that broke", lede: "On a normal Tuesday, one server and one database are plenty. Then two million fans arrive in ten minutes. Every ball is a pile of requests waiting in line.", chapter: "2:04", s: 124, colour: "bad", mount: flashSaleLab },
  { id: "pizza", title: "Three numbers, one pizza shop", lede: "A shop keeps ingredients, cooks and delivers. A computer stores, changes and moves data. Both are judged by pizzas per hour, minutes per pizza, and whether they're open when you call.", chapter: "3:05", s: 185, colour: "storage", mount: pizzaLab },
  { id: "throughput", title: "Throughput: how many servers?", lede: "Throughput is how much work gets done per second. Turn the peak into a number of servers, then add room to spare.", chapter: "3:36", s: 216, colour: "ram", mount: serversLab },
  { id: "latency", title: "Averages lie", lede: "Latency is how long one request takes. Ninety-nine fast answers and one ten-second wait still make a decent average. The p99 tells the truth.", chapter: "4:08", s: 248, colour: "cpu", mount: p99Lab },
  { id: "availability", title: "Counting nines", lede: "Availability is the share of time the system works. Every extra nine cuts downtime by ten, and an SLO becomes an SLA when there's money back.", chapter: "4:43", s: 283, colour: "good", mount: ninesLab },
  { id: "again", title: "The sale, again, with numbers", lede: "Each number asks for one part of the design. Switch them on and replay the same flash sale, including the minute the database dies.", chapter: "5:20", s: 320, colour: "net", mount: designLab },
  { id: "fleet", title: "Crash, update, grow", lede: "A server crashes mid-sale. Another needs an update. Traffic keeps growing. And then the main database dies.", chapter: "6:00", s: 360, colour: "ram", mount: fleetLab },
  { id: "chain", title: "Nines multiply", lede: "A request passes through a load balancer, a server, a cache and a database. Each is up 99.9% of the time. The whole chain isn't.", chapter: "6:36", s: 396, colour: "bad", mount: chainLab },
  { id: "redundancy", title: "Side by side, and a budget", lede: "Put copies next to each other instead of in a row. Then turn the target into minutes you're allowed to spend.", chapter: "7:13", s: 433, colour: "good", mount: redundancyLab },
  { id: "priorities", title: "Same numbers, different priorities", lede: "Payments, video, games, ticket sales and nightly reports all use the three numbers. They just don't rank them the same way.", chapter: "8:31", s: 511, colour: "storage", mount: prioritiesLab },
];

/* ── Hero: the year ring ── */
const ring = heroRing();
const watch = ep.youtube ? h("a.btn.primary", { href: ep.youtube, target: "_blank", rel: "noopener" }, "▶ Watch Episode 4") : h("a.btn.primary", { href: "#sale" }, "Start the labs ↓");
app.append(
  h("section.ep-hero#top", {},
    h("div.wrap", {},
      h("div.copy", {},
        h("span.eyebrow", { style: "color:var(--good)" }, `Episode ${pad(ep.n)} · Floor 1 · One machine`),
        h("h1", {}, "99.9% uptime still means ", h("em", { style: "color:var(--bad)" }, "9 hours down")),
        h("p.lede", {}, "It sounds perfect. It isn't. Picture a ticket sale that lasts ten minutes: if one bad hour lands inside it, the sale is over. Learn the three numbers every system is judged by, and how engineers turn a vague wish into a design."),
        h("div.row", {}, watch, h("a.btn", { href: "#quiz" }, "Test yourself")),
        h("nav.toc", { "aria-label": "Labs" }, ...LABS.map((l, i) => h("a", { href: `#${l.id}` }, `${pad(i + 1)} ${l.title.split(/[,:]/)[0]}`))),
      ),
      h("div.bench", {}, ring.el),
    ),
  ),
);
whenNear(ring.el, () => ring.start());

LABS.forEach((L, i) => {
  const { sec, bench } = lab({ id: L.id, ep, num: i + 1, title: L.title, lede: L.lede, chapter: L.chapter, seconds: L.s, colour: L.colour });
  app.append(sec);
  whenNear(sec, () => L.mount(bench));
});

const { sec: qs, bench: qb } = lab({ id: "quiz", ep, num: LABS.length + 1, title: "The interview answer", lede: "Before you draw a single box, ask for the numbers: requests per second at the peak, latency at the p99, and how many nines. Then let the numbers pick the design.", chapter: "9:06", seconds: 546, colour: "good" });
qb.append(quiz([
  { q: "Two million fans arrive in ten minutes, one request each. Roughly how many requests per second is that?", options: ["About 330", "About 3,300", "About 33,000"], answer: 1, why: "Ten minutes is 600 seconds. 2,000,000 ÷ 600 ≈ 3,300." },
  { q: "99 requests take 0.1 s and 1 takes 10 s. Why do engineers look at the p99 instead of the average?", options: ["The average hides the slow requests", "The p99 is easier to compute", "The average is always higher"], answer: 0, why: "The average still looks fine. Sorting every request and looking near the end shows what the slowest fans feel." },
  { q: "About how much downtime a year does 99.9% allow?", options: ["About 9 minutes", "About 9 hours", "About 9 days"], answer: 1, why: "0.1% of 8,760 hours is about 8.8 hours." },
  { q: "Four parts in a row are each up 99.9% of the time. The whole chain is up about…", options: ["99.9%", "99.6%", "99.99%"], answer: 1, why: "Nines multiply: 0.999 × 0.999 × 0.999 × 0.999 ≈ 0.996, about 35 hours down a year." },
  { q: "What turns a single point of failure into something that survives a crash?", options: ["A faster machine", "A copy side by side that can take over", "A longer contract"], answer: 1, why: "Redundancy: two copies that don't fail for the same reason are both down only one time in a million." },
  { q: "Your target is written into a customer contract with money back if you miss. That's an…", options: ["SLO", "SLA", "p99"], answer: 1, why: "An SLO is your own target. An SLA is a promise to customers with a penalty." },
]));
qb.append(
  takeaway("Design requirements aren't about making a system perfect. They're about deciding, in numbers, how imperfect it's allowed to be."),
  h("div.row", { style: "margin-top:16px" },
    next.site ? h("a.btn.primary", { href: `../${next.id}/index.html` }, `Episode ${pad(next.n)}: ${next.title} →`) : h("span.chip", {}, `Next: Episode ${pad(next.n)} · ${next.title} · lab opens with the video`),
    h("a.btn", { href: "../index.html#season" }, "All episodes"),
  ),
);
app.append(qs);
footer();
