import "../kit/theme.css";
import "../kit/labs.css";
import "../e05/e05.css";
import "../e04/e04.css";
import "../kit/extra.css";
import { h } from "../kit/ui";
import { episodePage } from "../kit/episode";
import { chatHero, pollLab, techniquesLab, handshakeLab, scaleLab, stampedeLab } from "./labs";
import { flipCards } from "../e05/labs/postoffice";

const CARDS = [
  { icon: "📞", post: "Calling the post office every minute: any mail?", net: "Polling", c: "--storage", d: "Almost always the answer is no." },
  { icon: "⏳", post: "Calling once and staying on hold until a letter arrives", net: "Long polling", c: "--cache", d: "Fewer wasted calls, but you call back each time." },
  { icon: "☎️", post: "An open phone line", net: "A WebSocket", c: "--good", d: "Either of you can speak at any moment." },
  { icon: "👋", post: "\"Are you still there?\"", net: "The heartbeat (ping / pong)", c: "--net", d: "Notice a dead line quickly." },
  { icon: "🔁", post: "The call drops; you call back and ask what you missed", net: "Reconnect + message IDs", c: "--ram", d: "Nothing gets lost." },
];

// Chapter starts in the published cut, from the episode's package.
episodePage({
  id: "e15", next: "e16", floor: "Floor 4 · Real time", accent: "--good",
  title: ["When the server ", h("em", { style: "color:var(--good)" }, "talks first")],
  lede: "Sam types a message in London. Before he's lifted his thumb, it pops up on Maya's phone in New York, and her phone never asked for it. But HTTP can't do that: the server only ever answers questions. Send a few messages both ways and compare.",
  hero: chatHero(), wide: true,
  labs: [
    { id: "polling", title: "Keep asking: the cost of polling", lede: "The simplest fix is to ask every second. Now do it for a million people.", chapter: "1:01", s: 61, colour: "storage", mount: pollLab },
    { id: "techniques", title: "Four ways to get updates", lede: "Polling, long polling, server-sent events and WebSockets, on the same ten seconds.", chapter: "2:42", s: 162, colour: "cache", mount: techniquesLab },
    { id: "handshake", title: "The handshake and tiny frames", lede: "It starts as a normal HTTP request with one extra header. The server answers 101, and the pipe opens.", chapter: "3:13", s: 193, colour: "good", mount: handshakeLab },
    { id: "scaling", title: "Scaling open lines", lede: "Connections stay open for hours, each one holding memory on one server. How many servers, and how do they talk?", chapter: "4:20", s: 260, colour: "net", mount: scaleLab },
    { id: "stampede", title: "When a server restarts", lede: "Every phone connected to it reconnects at the same instant. Unless they wait a small random time first.", chapter: "5:22", s: 322, colour: "bad", mount: stampedeLab },
    { id: "phone", title: "The phone line", lede: "The whole idea as a post office and a phone. Flip each card.", chapter: "6:59", s: 419, colour: "good", mount: (b) => flipCards(b, CARDS, "That's real time, as a phone line.", "HTTP is asking questions. A WebSocket is keeping the line open, so either side can talk the moment it has something to say.", ["Post office", "Real time"]) },
  ],
  quiz: {
    lede: "HTTP is request and response, so the server can't push. Polling works but wastes requests and adds delay. Long polling and server-sent events help, and SSE is great for one-way streams. For two-way, low-latency messaging, use WebSockets: an HTTP upgrade, then a persistent full-duplex connection. Keep connections on their server, link servers with pub/sub, send heartbeats, reconnect with jitter, and resume by message ID.",
    chapter: "7:58", s: 478,
    items: [
      { q: "Why can't plain HTTP deliver a chat message the instant it's sent?", options: ["It's too slow", "The server can only answer requests; it never speaks first", "It doesn't support text"], answer: 1, why: "Request, then response. The browser has to ask." },
      { q: "What status code accepts a WebSocket upgrade?", options: ["200 OK", "101 Switching Protocols", "301 Moved"], answer: 1, why: "After 101, the connection stops being HTTP and becomes an open pipe." },
      { q: "Which technique sends updates only from server to client?", options: ["Server-sent events", "WebSockets", "Polling"], answer: 0, why: "SSE streams one way down a single request; WebSockets are two-way." },
      { q: "Maya is on server A, Sam on server B. How does Sam's message reach her?", options: ["Server B opens a new line to Maya", "Server B publishes it on a message bus; server A pushes it down Maya's line", "Maya polls server B"], answer: 1, why: "Every chat server listens on the bus." },
      { q: "A chat server restarts. What stops a reconnection stampede?", options: ["Bigger servers", "Waiting a small random time before reconnecting", "Polling instead"], answer: 1, why: "Jitter spreads a million reconnects out over several seconds." },
      { q: "How does a phone avoid losing messages sent while it was disconnected?", options: ["It doesn't", "On reconnect it asks for everything after the last message ID it saw", "The server resends everything"], answer: 1, why: "Message IDs let it resume exactly where it left off." },
    ],
  },
  closing: "HTTP is asking questions. A WebSocket is keeping the line open, so either side can talk the moment it has something to say.",
});
