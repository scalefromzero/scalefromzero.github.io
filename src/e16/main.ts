import "../kit/theme.css";
import "../kit/labs.css";
import "../e05/e05.css";
import "../e04/e04.css";
import "../kit/extra.css";
import { h } from "../kit/ui";
import { episodePage } from "../kit/episode";
import { messageHero, routingLab, groupLab, e2eLab, dedupLab, limitLab } from "./labs";
import { flipCards } from "../e05/labs/postoffice";

const CARDS = [
  { icon: "☎️", post: "A direct line to your local post office", net: "The open connection", c: "--net", d: "Always connected, so the office can call you." },
  { icon: "📒", post: "The address book of which office serves each person", net: "The session registry", c: "--cache", d: "Routes each message server to server." },
  { icon: "📬", post: "The office holds your letters until you're home", net: "Store and forward", c: "--storage", d: "Up to 30 days, still sealed." },
  { icon: "🧾", post: "Tracking receipts: posted, delivered, opened", net: "The ticks", c: "--good", d: "One grey, two grey, two blue." },
  { icon: "🔏", post: "A sealed envelope only the recipient can open", net: "End-to-end encryption", c: "--ram", d: "The post office carries it but can't read it." },
];

// Chapter starts in the published cut, from the episode's package.
episodePage({
  id: "e16", next: "e17", floor: "Floor 4 · Real time", accent: "--good",
  title: ["How WhatsApp delivers ", h("em", { style: "color:var(--good)" }, "100 billion messages a day")],
  lede: "More than three billion people a month. A single server holding over two million connections. And every message locked so tightly that WhatsApp itself can't read it. Send one message from Maya to Sam, then turn Sam's phone off and try again.",
  hero: messageHero(), wide: true,
  labs: [
    { id: "routing", title: "Routing a message", lede: "Maya's server needs to know where Sam is right now. A registry records which chat server each phone is attached to.", chapter: "1:55", s: 115, colour: "good", mount: routingLab },
    { id: "groups", title: "Groups: one send, many copies", lede: "Maya writes once; the server fans it out to every member's device, online or not.", chapter: "2:48", s: 168, colour: "storage", mount: groupLab },
    { id: "e2e", title: "Locked end to end", lede: "Two phones agree a key that never crosses the network. This runs real encryption in your browser.", chapter: "3:47", s: 227, colour: "cache", mount: e2eLab },
    { id: "dedup", title: "Exactly once", lede: "A phone switches networks mid-send and tries again. Does Sam see it twice?", chapter: "5:22", s: 322, colour: "bad", mount: dedupLab },
    { id: "limit", title: "What encryption costs", lede: "If the server can't read messages, some features get much harder.", chapter: "5:56", s: 356, colour: "storage", mount: limitLab },
    { id: "postoffice", title: "The whole system, mapped", lede: "WhatsApp as a post office. Flip each card.", chapter: "5:56", s: 356, colour: "good", mount: (b) => flipCards(b, CARDS, "That's WhatsApp, as a post office.", "Keep a line open to every phone, route each message to the right server, hold it until it's delivered, and lock it so only the two ends can read it.", ["Post office", "WhatsApp"]) },
  ],
  quiz: {
    lede: "Clients keep a persistent connection to chat servers that hold millions of mostly idle connections. A session service records which server each user is on, so messages are routed server to server. Messages get unique IDs for de-duplication and are acknowledged for sent, delivered and read. Offline messages are stored and forwarded with a push notification; groups fan out per device; everything is end-to-end encrypted, with media encrypted and uploaded separately.",
    chapter: "8:03", s: 483,
    items: [
      { q: "What do two grey ticks mean?", options: ["The server has it", "It reached Sam's phone", "Sam read it"], answer: 1, why: "One grey: the server has it. Two grey: delivered. Two blue: read." },
      { q: "Sam's phone is off. What happens to Maya's message?", options: ["It's lost", "The server holds it, still encrypted, and sends a push notification", "Maya's phone keeps retrying forever"], answer: 1, why: "Store and forward: it's delivered when Sam reconnects, then the server deletes its copy." },
      { q: "How does Maya's server know where to send a message for Sam?", options: ["It asks every server", "A session registry records which server Sam is on", "It broadcasts to all phones"], answer: 1, why: "One lookup, then server-to-server routing." },
      { q: "With end-to-end encryption, what can WhatsApp's servers read?", options: ["The message text", "Only scrambled bytes, plus who's messaging whom and when", "Photos but not text"], answer: 1, why: "The key only exists on the two phones; metadata is still visible." },
      { q: "How are photos sent?", options: ["Pushed down the chat line", "Encrypted, uploaded to storage, and a link plus key sent in the message", "Unencrypted to save time"], answer: 1, why: "The storage only ever holds files it can't read." },
      { q: "A phone resends a message after a network switch. Why doesn't Sam see it twice?", options: ["The server spots the duplicate message ID", "TCP prevents it", "It does show twice"], answer: 0, why: "Unique message IDs make delivery exactly once." },
    ],
  },
  closing: "Keep a line open to every phone, route each message to the right server, hold it until it's delivered, and lock it so only the two ends can read it.",
});
