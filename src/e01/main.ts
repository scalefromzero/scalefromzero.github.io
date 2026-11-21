import "../kit/theme.css";
import "../kit/labs.css";
import { byId, pad } from "../kit/season";
import { footer, h, lab, quiz, takeaway, topbar, whenNear } from "../kit/ui";
import { stretchClock } from "./labs/clock";
import { deskLab } from "./labs/desk";
import { bitsLab } from "./labs/bits";
import { powerLab } from "./labs/power";
import { cpuLab } from "./labs/cpu";
import { ladderLab } from "./labs/ladder";
import { cacheLab } from "./labs/cache";
import { mathLab } from "./labs/math";
import { hierarchyLab } from "./labs/hierarchy";
import { scalingLab } from "../kit/labs/scaling";
import { patternLab } from "./labs/pattern";

const ep = byId("e01");
const next = byId("e02");
topbar(ep);
const app = document.getElementById("app")!;

// Chapter starts in the published cut (v4, 10:07), from the render's cue file.
const LABS: { id: string; title: string; lede: string; chapter: string; s: number; colour: string; mount: (b: HTMLElement) => void | Promise<void> }[] = [
  { id: "desk", title: "Four parts, one desk", lede: "Storage is the filing cabinet, RAM is the desk, the CPU cache is the page in your hands, and the CPU is your brain. Ask for a report twice and see why the second time is instant.", chapter: "0:50", s: 50, colour: "storage", mount: deskLab },
  { id: "bits", title: "Everything is bits", lede: "A bit is a light switch: off or on. Eight make a byte, and we all agreed which pattern means which letter.", chapter: "1:31", s: 91, colour: "cpu", mount: bitsLab },
  { id: "power", title: "Pull the plug", lede: "Your document lives in RAM while you work on it. Storage is where it survives. Type something, save some of it, then cut the power.", chapter: "2:21", s: 141, colour: "ram", mount: powerLab },
  { id: "cpu", title: "Fetch, decode, execute", lede: "The CPU is a very fast instruction-following machine. Step through price times quantity the way the processor sees it.", chapter: "3:49", s: 229, colour: "cpu", mount: cpuLab },
  { id: "time", title: "Nanoseconds are not milliseconds", lede: "They sound alike. A millisecond is a million nanoseconds. Flip the axis to human time and the gaps stop being abstract.", chapter: "4:31", s: 271, colour: "net", mount: ladderLab },
  { id: "cache", title: "Hits and misses", lede: "The CPU checks its cache first. A hit is instant; a miss goes to RAM and keeps a copy. Try three kinds of program and two cache sizes.", chapter: "5:09", s: 309, colour: "cache", mount: cacheLab },
  { id: "math", title: "Why a tiny cache makes it 17× faster", lede: "A hundred requests. A cache hit costs 1, a trip to RAM costs 100. Slide the hit rate and watch the speed-up.", chapter: "5:57", s: 357, colour: "cache", mount: mathLab },
  { id: "hierarchy", title: "The memory hierarchy", lede: "Registers at the top, disks at the bottom. Faster means smaller, pricier and more forgetful. Pick a layer and compare.", chapter: "6:38", s: 398, colour: "ram", mount: hierarchyLab },
  { id: "scale", title: "Bigger machine, or more machines?", lede: "Scaling up buys a bigger box until there's no bigger box. Scaling out adds machines behind a load balancer. Turn up the traffic and unplug a server.", chapter: "7:09", s: 429, colour: "net", mount: scalingLab },
  { id: "pattern", title: "The same pattern, twice", lede: "Cache, RAM and SSD inside one computer. Server memory, Redis and a database across many. Ask for the same customer on both.", chapter: "8:34", s: 514, colour: "storage", mount: patternLab },
];

/* ── Hero ── */
const watch = ep.youtube ? h("a.btn.primary", { href: ep.youtube, target: "_blank", rel: "noopener" }, "▶ Watch Episode 1") : h("a.btn.primary", { href: "#desk" }, "Start the labs ↓");
app.append(
  h("section.ep-hero#top", {},
    h("div.wrap", {},
      h("div.copy", {},
        h("span.eyebrow", { style: "color:var(--ram)" }, `Episode ${pad(ep.n)} · Floor 1 · One machine`),
        h("h1", {}, "Inside ", h("em", {}, "one"), " computer"),
        h("p.lede", {}, "Slow time down so one nanosecond lasts a full second. Reading memory takes a couple of minutes. An SSD, about a day. Another computer across the internet, about three years. That gap is why the apps you use run on thousands of machines."),
        h("div.row", {}, watch, h("a.btn", { href: "#quiz" }, "Test yourself")),
        h("nav.toc", { "aria-label": "Labs" }, ...LABS.map((l, i) => h("a", { href: `#${l.id}` }, `${pad(i + 1)} ${l.title.split(",")[0]}`))),
      ),
      stretchClock(),
    ),
  ),
);

/* ── Labs ── */
LABS.forEach((L, i) => {
  const { sec, bench } = lab({ id: L.id, ep, num: i + 1, title: L.title, lede: L.lede, chapter: L.chapter, seconds: L.s, colour: L.colour });
  app.append(sec);
  whenNear(sec, () => L.mount(bench));
});

/* ── Recap + quiz ── */
const { sec: qs, bench: qb } = lab({ id: "quiz", ep, num: LABS.length + 1, title: "Five things to remember", lede: "Everything is bits. The CPU runs instructions. Data moves up from storage to RAM to cache to the CPU. Closer layers are faster but smaller, pricier and temporary. When one computer hits its limits, we combine many.", chapter: "9:24", seconds: 564, colour: "good" });
qb.append(quiz([
  { q: "If one nanosecond lasted a second, roughly how long would a round trip across the internet take?", options: ["About 2 minutes", "About a day", "About 3 years"], answer: 2, why: "~100 ms is 100 million ns, so 100 million seconds: a bit over three years. RAM is the 2-minute one, an SSD read the day-long one." },
  { q: "You type a long email and the power cuts before you save. Where was the unsaved text?", options: ["On the SSD", "In RAM", "In the CPU cache only"], answer: 1, why: "Apps work on a copy in RAM. RAM is volatile, so unsaved changes vanish. That's why autosave exists." },
  { q: "100 requests, 90 hit the cache (cost 1 each), 10 go to RAM (cost 100 each). Total cost?", options: ["190", "1,090", "10,000"], answer: 1, why: "90 × 1 + 10 × 100 = 1,090, against 10,000 without a cache. About 9× faster. At 95% it's 595, about 17×." },
  { q: "Why is looping through an array so cache-friendly?", options: ["Arrays are stored in the CPU", "A miss loads neighbouring values too (spatial locality)", "Arrays never change"], answer: 1, why: "The cache fetches a whole line of neighbouring addresses. The next few reads are already there." },
  { q: "Your one big server is maxed out and the next size up doesn't exist. What now?", options: ["Scale out: more machines behind a load balancer", "Add more RAM to the same machine", "Use a faster SSD"], answer: 0, why: "Vertical scaling has a ceiling. Horizontal scaling adds machines, and survives one of them dying." },
]));
qb.append(
  takeaway("Next: what happens when the cached copy is wrong."),
  h("div.row", { style: "margin-top:16px" },
    next.site ? h("a.btn.primary", { href: `../${next.id}/index.html` }, `Episode ${pad(next.n)}: ${next.title} →`) : h("span.chip", {}, `Next: Episode ${pad(next.n)} · ${next.title} · lab opens with the video`),
    h("a.btn", { href: "../index.html#season" }, "All episodes"),
  ),
);
app.append(qs);
footer();
