import "../kit/theme.css";
import "../kit/labs.css";
import "../e05/e05.css";
import "./e06.css";
import { byId, pad } from "../kit/season";
import { footer, h, lab, quiz, takeaway, topbar, whenNear } from "../kit/ui";
import { mountLanes } from "./lanes3d";
import { receiptsLab } from "./labs/receipts";
import { callLab } from "./labs/call";
import { sortLab } from "./labs/sort";
import { portsLab } from "./labs/ports";
import { handshakeLab } from "./labs/handshake";
import { reliableLab } from "./labs/reliable";
import { headersLab } from "./labs/headers";
import { wifiLab } from "./labs/wifi";
import { holLab } from "./labs/hol";
import { flipCards } from "../e05/labs/postoffice";

const ep = byId("e06");
const next = byId("e07");
topbar(ep);
const app = document.getElementById("app")!;

const CARDS = [
  { icon: "📮", post: "Registered mail", net: "TCP", c: "--good", d: "Numbered pages, a signature for every delivery, and a replacement if anything goes missing." },
  { icon: "☎️", post: "The phone call before you post it", net: "The handshake", c: "--storage", d: "Are you there? Yes, are you? Yes. SYN, SYN-ACK, ACK." },
  { icon: "📻", post: "A live radio broadcast", net: "UDP", c: "--net", d: "Miss a word and it's gone. The show doesn't stop for you." },
  { icon: "🏢", post: "The apartment number", net: "The port", c: "--cache", d: "So the letter reaches the right person in the building." },
];

// Chapter starts in the published cut (9:28), from the episode's package.
const LABS: { id: string; title: string; lede: string; chapter: string; s: number; colour: string; mount: (b: HTMLElement) => void | Promise<void> }[] = [
  { id: "receipts", title: "Who notices the missing piece?", lede: "IP is best effort: an overloaded router drops packets and tells nobody. The obvious fix: number every page and ask for a receipt.", chapter: "1:01", s: 61, colour: "good", mount: receiptsLab },
  { id: "call", title: "The video call that froze", lede: "The same fix on a video call. One packet of Maya's voice is lost, and everything behind it waits.", chapter: "1:56", s: 116, colour: "bad", mount: callLab },
  { id: "needs", title: "Two kinds of data", lede: "Some data must be complete and in order, even if it's a little late. Other data must be fresh. Sort them.", chapter: "2:27", s: 147, colour: "net", mount: sortLab },
  { id: "ports", title: "Ports: the apartment number", lede: "An IP address gets a packet to the right device. Maya's laptop is running three apps. Which one is the packet for?", chapter: "2:56", s: 176, colour: "cache", mount: portsLab },
  { id: "handshake", title: "The three-way handshake", lede: "Before any data moves, TCP says hello three times. Race it against UDP, which just sends.", chapter: "3:25", s: 205, colour: "storage", mount: handshakeLab },
  { id: "reliable", title: "TCP up close", lede: "Number, acknowledge, resend, hold back, slow down. Lose a few packets and watch TCP handle each one.", chapter: "3:58", s: 238, colour: "good", mount: reliableLab },
  { id: "udp", title: "UDP: eight bytes and nothing else", lede: "No handshake, no numbering, no receipts. Just two ports, a length and a checksum. Tap each field.", chapter: "4:30", s: 270, colour: "net", mount: headersLab },
  { id: "wifi", title: "On a bad connection", lede: "Weak Wi-Fi hits both. TCP gets slow but stays correct; UDP stays live but gets rough. And some offices block UDP completely.", chapter: "5:31", s: 331, colour: "storage", mount: wifiLab },
  { id: "quic", title: "Head-of-line blocking, and QUIC", lede: "On TCP, one lost packet holds up everything behind it. QUIC builds reliability on UDP with separate streams.", chapter: "6:01", s: 361, colour: "cache", mount: holLab },
  { id: "post", title: "Back at the post office", lede: "Registered mail, a phone call first, a live radio show, and the apartment number. Flip each card.", chapter: "7:08", s: 428, colour: "good", mount: (b) => flipCards(b, CARDS, "TCP trades speed for certainty. UDP trades certainty for speed.", "TCP is registered mail. UDP is live radio. The port is the apartment number.") },
];

/* ── Hero: two lanes ── */
const box = h("div.lanes-box", { role: "img", "aria-label": "Two delivery lanes: TCP on top, UDP below, with packets flowing from Maya to Sam" });
const loseBtn = h("button.btn.primary", { type: "button" }, "Lose a packet on both lanes");
const st = (k: string, c: string) => { const v = h("span.v.tnum", { style: `color:var(${c}); font-size:var(--step-1)` }, "0"); return { el: h("div.stat", {}, v, h("span.k", {}, k)), v }; };
const sT = st("TCP delivered, in order", "--good"), sW = st("TCP waiting behind a gap", "--bad"), sU = st("UDP delivered", "--net"), sS = st("UDP skipped", "--storage");
const caption = h("p.dim", { "aria-live": "polite", style: "margin:0; min-height:3em" }, "Packets flow from Maya to Sam on both lanes. Lose one and compare.");
const watch = ep.youtube ? h("a.btn", { href: ep.youtube, target: "_blank", rel: "noopener" }, "▶ Watch Episode 6") : h("a.btn", { href: "#receipts" }, "Start the labs ↓");
app.append(
  h("section.ep-hero.wide#top", {},
    h("div.wrap", {},
      h("div.copy", {},
        h("span.eyebrow", { style: "color:var(--net)" }, `Episode ${pad(ep.n)} · Floor 2 · How the web works`),
        h("h1", {}, h("em", { style: "color:var(--good)" }, "Certain"), " vs ", h("em", { style: "color:var(--net)" }, "fast")),
        h("p.lede", {}, "Right now, some of the packets you send are getting lost. For your bank, one missing piece is unacceptable. For your video call, waiting for it is worse than losing it. Two opposite needs, so the internet built two ways to deliver: TCP and UDP."),
        h("div.row", {}, watch, h("a.btn", { href: "#quiz" }, "Test yourself")),
        h("nav.toc", { "aria-label": "Labs" }, ...LABS.map((l, i) => h("a", { href: `#${l.id}` }, `${pad(i + 1)} ${l.title.split(/[,:?]/)[0]}`))),
      ),
      h("div", { style: "display:grid; gap:10px; min-width:0" }, box, h("div.row", {}, loseBtn), h("div.stats", { style: "grid-template-columns:repeat(auto-fit,minmax(110px,1fr))" }, sT.el, sW.el, sU.el, sS.el), caption),
    ),
  ),
);
whenNear(box, async () => {
  try {
    let wasStalled = false;
    const m = await mountLanes(box, (s) => {
      sT.v.textContent = String(s.tcpDone); sW.v.textContent = String(s.tcpWaiting); sU.v.textContent = String(s.udpDone); sS.v.textContent = String(s.udpSkipped);
      if (s.stalled && !wasStalled) caption.textContent = "TCP noticed the gap. Everything that arrived after it waits until the copy comes back. UDP just keeps going.";
      if (!s.stalled && wasStalled) caption.textContent = "The copy arrived. TCP hands everything over at once, complete and in order.";
      wasStalled = s.stalled;
    });
    loseBtn.addEventListener("click", () => m.lose(1));
  } catch (e) { console.warn(e); caption.textContent = "3D isn't available in this browser. The labs below show the same idea."; }
});

LABS.forEach((L, i) => {
  const { sec, bench } = lab({ id: L.id, ep, num: i + 1, title: L.title, lede: L.lede, chapter: L.chapter, seconds: L.s, colour: L.colour });
  app.append(sec);
  whenNear(sec, () => L.mount(bench));
});

const { sec: qs, bench: qb } = lab({ id: "quiz", ep, num: LABS.length + 1, title: "The interview answer", lede: "Both run on IP and use ports to reach the right app. TCP: connection based, three-way handshake, numbers and acknowledges, resends, delivers in order, slows down under congestion. UDP: connectionless, no guarantees, tiny overhead. TCP for correctness, UDP for freshness, and QUIC builds reliability on UDP when you need both.", chapter: "8:10", seconds: 490, colour: "good" });
qb.append(quiz([
  { q: "What does IP do when an overloaded router drops your packet?", options: ["Sends it again automatically", "Nothing: it doesn't tell anyone", "Slows the sender down"], answer: 1, why: "IP is best effort. Noticing and resending is TCP's job." },
  { q: "What are the three messages of TCP's handshake, in order?", options: ["ACK, SYN, SYN-ACK", "SYN, SYN-ACK, ACK", "HELLO, OK, GO"], answer: 1, why: "SYN (I'd like to talk), SYN-ACK (got it), ACK (got yours). It costs one round trip before any data." },
  { q: "One TCP packet is lost. What happens to the data that arrived after it?", options: ["It's handed to the app straight away", "It's thrown away", "It's held back until the gap is filled"], answer: 2, why: "TCP delivers in order, so later data waits behind the gap: head-of-line blocking." },
  { q: "Why do video calls prefer UDP?", options: ["UDP is encrypted", "A late piece of voice is worth nothing, so skipping beats waiting", "UDP never loses packets"], answer: 1, why: "Freshness matters more than completeness. A tiny blip beats a frozen screen." },
  { q: "What does a port number tell the receiving device?", options: ["Which app the packet is for", "Which country it came from", "How many packets follow"], answer: 0, why: "The IP address finds the device; the port is the apartment number that finds the app." },
  { q: "QUIC runs on top of which protocol?", options: ["TCP", "UDP", "DNS"], answer: 1, why: "QUIC rebuilds numbering, resending and encryption on top of UDP, with separate streams. HTTP/3 runs on it." },
]));
qb.append(
  takeaway("TCP trades speed for certainty. UDP trades certainty for speed."),
  h("div.row", { style: "margin-top:16px" },
    next.site ? h("a.btn.primary", { href: `../${next.id}/index.html` }, `Episode ${pad(next.n)}: ${next.title} →`) : h("span.chip", {}, `Next: Episode ${pad(next.n)} · ${next.title} · lab opens with the video`),
    h("a.btn", { href: "../index.html#season" }, "All episodes"),
  ),
);
app.append(qs);
footer();
