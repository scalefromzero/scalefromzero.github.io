import "../kit/theme.css";
import "../kit/labs.css";
import "./e03.css";
import { byId, pad } from "../kit/season";
import { footer, h, lab, quiz, takeaway, topbar, whenNear } from "../kit/ui";
import { scalingLab } from "../kit/labs/scaling";
import { mountMap3d } from "./map3d";
import { restaurantLab } from "./labs/restaurant";
import { requestLab } from "./labs/request";
import { dataLab } from "./labs/datalives";
import { pipelineLab } from "./labs/pipeline";
import { monitoringLab } from "./labs/monitoring";
import { externalLab } from "./labs/external";
import { flatMapLab } from "./labs/flatmap";

const ep = byId("e03");
const next = byId("e04");
topbar(ep);
const app = document.getElementById("app")!;

// Chapter starts in the published cut (v2, 8:07), from the render's cue file.
const LABS: { id: string; title: string; lede: string; chapter: string; s: number; colour: string; mount: (b: HTMLElement) => void | Promise<void> }[] = [
  { id: "restaurant", title: "Every app is a restaurant", lede: "A customer, a waiter, a kitchen, a shelf of ready dishes, a host at the door and a manager with a clipboard. Flip each one to see its job in an app.", chapter: "0:45", s: 45, colour: "net", mount: restaurantLab },
  { id: "request", title: "Client and server", lede: "The client asks; the server answers. Follow Maya's tap on Buy all the way to the server and back.", chapter: "1:23", s: 83, colour: "cpu", mount: requestLab },
  { id: "data", title: "Where data lives", lede: "Keep the seat list on the server itself, or on separate machines built to store it? Break the server and find out.", chapter: "2:02", s: 122, colour: "storage", mount: dataLab },
  { id: "pipeline", title: "Shipping code", lede: "Nobody types changes straight onto the live server. A pipeline builds, runs hundreds of tests, and rolls out a few servers at a time.", chapter: "2:39", s: 159, colour: "good", mount: pipelineLab },
  { id: "scaling", title: "One superhuman waiter, or ten normal ones?", lede: "Two million fans tap Buy in the same few minutes. Make the server bigger, or add more servers behind a load balancer.", chapter: "3:42", s: 222, colour: "ram", mount: scalingLab },
  { id: "monitoring", title: "The manager with the clipboard", lede: "Logs, metrics and alerts. It's five past ten, the busiest minute of the year, and one server quietly dies.", chapter: "4:45", s: 285, colour: "bad", mount: monitoringLab },
  { id: "external", title: "Other people's machines", lede: "TixRush doesn't build its own payment system. Its server calls another company's service to charge the card.", chapter: "5:57", s: 357, colour: "good", mount: externalLab },
  { id: "map", title: "The whole map", lede: "Put it all together, drawn flat like a diagram. Step through one request from Maya's phone and back.", chapter: "6:35", s: 395, colour: "net", mount: flatMapLab },
];

/* ── Hero: the map in 3D ── */
const mapBox = h("div.map-box", { role: "img", "aria-label": "3D map of an app: phone, load balancer, servers, cache, database, payment service, monitoring and pipeline" });
const stepSay = h("p.map-step.dim", { "aria-live": "polite" }, "Tap Buy to send Maya's request through the map.");
const buy = h("button.btn.primary", { type: "button" }, "Tap Buy");
const zoom = h("button.btn", { type: "button" }, "Zoom out: copies around the world");
const watch = ep.youtube ? h("a.btn", { href: ep.youtube, target: "_blank", rel: "noopener" }, "▶ Watch Episode 3") : h("a.btn", { href: "#restaurant" }, "Start the labs ↓");
const SAY: Record<string, string> = { phone: "Maya's phone sends the request.", lb: "The load balancer picks a server.", s2: "A server handles it.", cache: "The server checks the cache.", db: "Then the database: is seat 12 free? Book it.", pay: "The payment company charges the card." };
let hops = 0;
app.append(
  h("section.ep-hero.wide#top", {},
    h("div.wrap", {},
      h("div.copy", {},
        h("span.eyebrow", { style: "color:var(--net)" }, `Episode ${pad(ep.n)} · Floor 1 · One machine`),
        h("h1", {}, "What's really behind ", h("em", { style: "color:var(--net)" }, "every app")),
        h("p.lede", {}, "When you tap Buy, it feels like talking to one computer. Behind that button is a whole team of machines, each with a single job. In November 2022, one ticket presale planned for 1.5 million fans drew 14 million people, bots included."),
        h("div.row", {}, watch, h("a.btn", { href: "#quiz" }, "Test yourself")),
        h("p.note", { style: "margin:0" }, "Presale figures: Ticketmaster and Live Nation, as reported by ", h("a", { href: "https://www.rollingstone.com/music/music-news/ticketmaster-cancels-general-on-sale-taylor-swift-the-eras-tour-1234632678/", target: "_blank", rel: "noopener" }, "Rolling Stone"), "."),
        h("nav.toc", { "aria-label": "Labs" }, ...LABS.map((l, i) => h("a", { href: `#${l.id}` }, `${pad(i + 1)} ${l.title.split(",")[0]}`))),
      ),
      h("div", { style: "display:grid; gap:10px; min-width:0" }, mapBox, h("div.row", {}, buy, zoom), stepSay),
    ),
  ),
);
whenNear(mapBox, async () => {
  try {
    const m = await mountMap3d(mapBox, (k) => { hops++; stepSay.textContent = hops >= 11 ? "Seat booked. Every step also wrote a log line for monitoring." : SAY[k] ?? "The answer travels back."; });
    buy.addEventListener("click", () => { hops = 0; m.trace(); });
    zoom.addEventListener("click", async () => { const z = await m.zoom(); zoom.textContent = z ? "Zoom back in" : "Zoom out: copies around the world"; stepSay.textContent = z ? "The big apps run the same map many times over, in data centres around the world." : "Tap Buy to send Maya's request through the map."; });
  } catch { stepSay.textContent = "3D isn't available in this browser. The flat map in Lab 08 shows the same thing."; }
});

LABS.forEach((L, i) => {
  const { sec, bench } = lab({ id: L.id, ep, num: i + 1, title: L.title, lede: L.lede, chapter: L.chapter, seconds: L.s, colour: L.colour });
  app.append(sec);
  whenNear(sec, () => L.mount(bench));
});

const { sec: qs, bench: qb } = lab({ id: "quiz", ep, num: LABS.length + 1, title: "The restaurant, one more time", lede: "The customer is the client and the waiter is the server. The kitchen is the database and the shelf is the cache. More waiters is horizontal scaling, and the host is the load balancer. The manager is monitoring.", chapter: "7:24", seconds: 444, colour: "good" });
qb.append(quiz([
  { q: "In an app, what is the client?", options: ["The company that owns the app", "Your phone or browser, the part that asks", "The database"], answer: 1, why: "The client asks; the server answers." },
  { q: "Why don't servers keep the only copy of the data on their own disk?", options: ["Disks are too slow", "If that one machine breaks, the data breaks with it", "It's against the law"], answer: 1, why: "Data lives on separate machines built to store it, so servers can come and go." },
  { q: "One test fails in the pipeline. What happens to the change?", options: ["It goes live anyway", "It stops there; customers never see it", "Half the servers get it"], answer: 1, why: "Code only reaches the servers when every test passes, and then a few servers at a time." },
  { q: "Adding more servers of the same size behind a load balancer is called…", options: ["Vertical scaling", "Horizontal scaling", "Caching"], answer: 1, why: "Vertical is one bigger machine; horizontal is more machines." },
  { q: "More than 1 request in 20 is failing. Which part of monitoring wakes the engineer?", options: ["Logs", "Metrics", "Alerts"], answer: 2, why: "Logs record each request, metrics show the trend, alerts wake someone up when a rule is crossed." },
]));
qb.append(
  takeaway("How many waiters do you actually need, and how fast must the food arrive? Next: the numbers every system is judged by."),
  h("div.row", { style: "margin-top:16px" },
    next.site ? h("a.btn.primary", { href: `../${next.id}/index.html` }, `Episode ${pad(next.n)}: ${next.title} →`) : h("span.chip", {}, `Next: Episode ${pad(next.n)} · ${next.title} · lab opens with the video`),
    h("a.btn", { href: "../index.html#season" }, "All episodes"),
  ),
);
app.append(qs);
footer();
