import "../kit/theme.css";
import "../kit/labs.css";
import "./e05.css";
import { byId, pad } from "../kit/season";
import { footer, h, lab, quiz, takeaway, topbar, whenNear } from "../kit/ui";
import { mountGlobe } from "./globe";
import { wiresLab } from "./labs/wires";
import { packetsLab } from "./labs/packets";
import { motorwayLab } from "./labs/motorway";
import { addressLab } from "./labs/address";
import { routerLab } from "./labs/router";
import { traceLab } from "./labs/trace";
import { oceanLab } from "./labs/ocean";
import { reassembleLab } from "./labs/reassemble";
import { healLab } from "./labs/heal";
import { lightLab } from "./labs/light";
import { postOfficeLab } from "./labs/postoffice";

const ep = byId("e05");
const next = byId("e06");
topbar(ep);
const app = document.getElementById("app")!;

// Chapter starts in the published cut (8:38), from the episode's package.
const LABS: { id: string; title: string; lede: string; chapter: string; s: number; colour: string; mount: (b: HTMLElement) => void | Promise<void> }[] = [
  { id: "wires", title: "Why not just run a wire?", lede: "Two computers? Run a wire between them. Now add a third, a tenth, a thousandth. Count the wires.", chapter: "1:24", s: 84, colour: "net", mount: wiresLab },
  { id: "packets", title: "Cut it into packets", lede: "The big idea: stop sending messages whole. Maya's photo is cut into small pieces, and each one gets a label.", chapter: "2:20", s: 140, colour: "net", mount: packetsLab },
  { id: "motorway", title: "Sharing the road", lede: "Packets from millions of people take turns on the same wires, like cars sharing a motorway instead of each family building its own road.", chapter: "2:20", s: 140, colour: "good", mount: motorwayLab },
  { id: "address", title: "Every device needs an address", lede: "On the internet, that's an IP address. The classic version is four numbers, each from 0 to 255.", chapter: "2:46", s: 166, colour: "good", mount: addressLab },
  { id: "router", title: "Be the router", lede: "A router reads only the destination, checks its table of signposts, and sends the packet one step closer. Then it forgets it. Try a shift.", chapter: "3:18", s: 198, colour: "cache", mount: routerLab },
  { id: "trace", title: "Follow one packet", lede: "Laptop, home router, internet provider, bigger networks, the ocean, London. Traceroute shows every hop.", chapter: "3:46", s: 226, colour: "storage", mount: traceLab },
  { id: "ocean", title: "Under the ocean", lede: "Not by satellite. By cable. Inside each one are hair-thin strands of glass, and your packet travels as flashes of light.", chapter: "4:11", s: 251, colour: "ram", mount: oceanLab },
  { id: "photo", title: "The photo, again", lede: "Three megabytes, about two thousand packets. They might take different paths and arrive out of order. Sam's phone puts them back together.", chapter: "4:37", s: 277, colour: "net", mount: reassembleLab },
  { id: "heal", title: "When things break", lede: "A ship drags its anchor across a cable. A router crashes. Watch the network route around the damage.", chapter: "5:04", s: 304, colour: "bad", mount: healLab },
  { id: "limits", title: "Two limits nobody can engineer away", lede: "The network makes no promises, and light in glass has a speed limit. Pick two cities and race the light.", chapter: "5:35", s: 335, colour: "storage", mount: lightLab },
  { id: "post", title: "The post office, mapped", lede: "Postcards, addresses, sorting offices and ships. Every piece of the internet has a post office twin.", chapter: "6:35", s: 395, colour: "cache", mount: postOfficeLab },
];

/* ── Hero: the globe ── */
const globeBox = h("div.globe-box", { role: "img", "aria-label": "A night globe with a route from New York to London" });
const sendBtn = h("button.btn.primary", { type: "button" }, "Tap send");
const counter = h("span.chip", {}, "0 of 24 packets arrived");
const caption = h("p.dim", { "aria-live": "polite", style: "margin:0; min-height:3em" }, "Maya in New York sends a photo to Sam in London, about 5,500 km away.");
const watch = ep.youtube ? h("a.btn", { href: ep.youtube, target: "_blank", rel: "noopener" }, "▶ Watch Episode 5") : h("a.btn", { href: "#wires" }, "Start the labs ↓");
app.append(
  h("section.ep-hero#top", {},
    h("div.wrap", {},
      h("div.copy", {},
        h("span.eyebrow", { style: "color:var(--net)" }, `Episode ${pad(ep.n)} · Floor 2 · How the web works`),
        h("h1", {}, "How a message crosses ", h("em", { style: "color:var(--net)" }, "the internet")),
        h("p.lede", {}, "You tap send. Less than a second later, your message lands on a phone in London. On the way it was chopped into pieces, passed between machines that have never heard of you, and pushed through a glass cable on the floor of the Atlantic. Nobody planned that route in advance."),
        h("div.row", {}, watch, h("a.btn", { href: "#quiz" }, "Test yourself")),
        h("nav.toc", { "aria-label": "Labs" }, ...LABS.map((l, i) => h("a", { href: `#${l.id}` }, `${pad(i + 1)} ${l.title.split(/[,?]/)[0]}`))),
      ),
      h("div", { style: "display:grid; gap:10px; min-width:0" }, globeBox, h("div.row", {}, sendBtn, counter), caption),
    ),
  ),
);
whenNear(globeBox, async () => {
  try {
    const g = await mountGlobe(globeBox, (n, id, detour) => {
      counter.textContent = `${n} of ${g.packets} packets arrived`;
      if (detour) caption.textContent = `Packet #${id} took a different route, through Lisbon. It still got there.`;
      if (n === g.packets) caption.textContent = "All 24 here (the real photo is about 2,000 packets). Sam's phone puts them back together, all in well under a second.";
    });
    sendBtn.addEventListener("click", () => { counter.textContent = `0 of ${g.packets} packets arrived`; caption.textContent = "The photo is chopped into packets. Each one finds its own way, hop by hop."; g.send(); });
  } catch (e) { console.warn(e); caption.textContent = "3D isn't available in this browser. The labs below show the same journey."; }
});

LABS.forEach((L, i) => {
  const { sec, bench } = lab({ id: L.id, ep, num: i + 1, title: L.title, lede: L.lede, chapter: L.chapter, seconds: L.s, colour: L.colour });
  app.append(sec);
  whenNear(sec, () => L.mount(bench));
});

const { sec: qs, bench: qb } = lab({ id: "quiz", ep, num: LABS.length + 1, title: "The interview answer", lede: "The app splits the data into packets, each with the sender's and receiver's IP addresses. Routers forward them hop by hop across backbone networks and undersea cables. The receiver reassembles them. IP is best effort, so TCP on top handles order and lost packets.", chapter: "7:29", seconds: 449, colour: "good" });
qb.append(quiz([
  { q: "A thousand computers, each wired directly to every other one. About how many wires?", options: ["About a thousand", "About half a million", "About a million"], answer: 1, why: "1,000 × 999 ÷ 2 = 499,500. That's why the internet shares wires instead." },
  { q: "Roughly how many packets does a 3 MB photo become?", options: ["About 20", "About 2,000", "About 2 million"], answer: 1, why: "Each packet holds up to about 1,500 bytes. 3,000,000 ÷ 1,500 = 2,000." },
  { q: "What does a router read on each packet?", options: ["The whole message", "Only the destination address", "The sender's password"], answer: 1, why: "It reads the destination, checks its table, sends the packet one hop closer, and forgets it." },
  { q: "How does most traffic between continents travel?", options: ["Satellites", "Undersea cables", "Radio towers"], answer: 1, why: "Hundreds of cables on the sea floor carry almost all of it. Satellites carry only a tiny fraction." },
  { q: "Why can't New York to London ever take less than about 28 ms one way?", options: ["Routers are slow", "Light in glass covers about 200,000 km a second", "Cables are too old"], answer: 1, why: "About 5,500 km ÷ 200,000 km/s ≈ 28 ms. Physics sets the floor." },
  { q: "IP does its best but promises nothing. What puts packets back in order and asks for missing ones?", options: ["DNS", "TCP", "The router"], answer: 1, why: "TCP numbers every packet, checks what arrived, and asks for the missing ones again. That's the next episode." },
]));
qb.append(
  takeaway("The internet doesn't send messages. It forwards small labelled packets, one hop at a time, and nobody needs to know the whole route."),
  h("div.row", { style: "margin-top:16px" },
    next.site ? h("a.btn.primary", { href: `../${next.id}/index.html` }, `Episode ${pad(next.n)}: ${next.title} →`) : h("span.chip", {}, `Next: Episode ${pad(next.n)} · ${next.title} · lab opens with the video`),
    h("a.btn", { href: "../index.html#season" }, "All episodes"),
  ),
);
app.append(qs);
footer();
