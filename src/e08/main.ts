import "../kit/theme.css";
import "../kit/labs.css";
import "../e05/e05.css";
import "../e04/e04.css";
import "../kit/extra.css";
import { h } from "../kit/ui";
import { episodePage } from "../kit/episode";
import { conversationHero, requestLab, responseLab } from "./labs1";
import { cookieLab, versionsLab, retryLab, limitsLab } from "./labs2";
import { flipCards } from "../e05/labs/postoffice";

const CARDS = [
  { icon: "🧾", post: "Your order slip", net: "The request", c: "--net", d: "Everything the kitchen needs, written down." },
  { icon: "✋", post: "What you want done", net: "The method", c: "--net", d: "Bring me (GET), take this (POST), take it back (DELETE)." },
  { icon: "🍝", post: "The dish", net: "The path", c: "--cache", d: "/menu/pasta, /videos/42." },
  { icon: "📝", post: "Notes like 'no onions'", net: "The headers", c: "--cache", d: "Host, Accept, Cookie, Cache-Control." },
  { icon: "🍽️", post: "What comes back from the kitchen", net: "The response + status code", c: "--good", d: "200 here's your meal · 404 not on the menu · 503 kitchen swamped." },
  { icon: "🔢", post: "Your table number", net: "The cookie", c: "--storage", d: "So the waiter knows whose order it is." },
];

// Chapter starts in the published cut (9:20), from the episode's package.
episodePage({
  id: "e08", next: "e09", floor: "Floor 2 · How the web works", accent: "--net",
  title: ["HTTP, the ", h("em", { style: "color:var(--net)" }, "language"), " of the web"],
  lede: "To show you one ordinary web page, your browser makes around seventy separate requests. Every one is a short message in a language simple enough that you could read it, and even type it yourself. Try it.",
  hero: conversationHero(),
  labs: [
    { id: "request", title: "Anatomy of a request", lede: "A method, a path and a version, then headers one per line, then a blank line. Build one and tap each line.", chapter: "2:52", s: 172, colour: "net", mount: requestLab },
    { id: "response", title: "Anatomy of a response", lede: "The server answers in the same shape: a three-digit status code, headers, a blank line, then the body.", chapter: "3:23", s: 203, colour: "good", mount: responseLab },
    { id: "cookies", title: "Cookies", lede: "A stateless server forgets you after every request. So how does it know you're logged in? It doesn't. Your browser does.", chapter: "3:55", s: 235, colour: "storage", mount: cookieLab },
    { id: "versions", title: "Faster versions", lede: "Seventy files, a 60 ms round trip. Watch HTTP/1.0, 1.1, 2 and 3 load the same page.", chapter: "4:23", s: 263, colour: "cache", mount: versionsLab },
    { id: "retry", title: "Give up, wait, or retry?", lede: "When something goes wrong, the status code and the method tell every app what to do next.", chapter: "5:32", s: 332, colour: "bad", mount: retryLab },
    { id: "limits", title: "The limits of plain HTTP", lede: "Everyone in between can read and change it, and the server can never speak first.", chapter: "6:00", s: 360, colour: "storage", mount: limitsLab },
    { id: "restaurant", title: "The restaurant", lede: "The whole idea as a restaurant order. Flip each card.", chapter: "7:05", s: 425, colour: "good", mount: (b) => flipCards(b, CARDS, "That's HTTP, as a restaurant.", "A request says what you want, a response says what happened, and everything else is built on top.", ["Restaurant", "HTTP"]) },
  ],
  quiz: {
    lede: "The browser sends a method, a path, headers like Host and Cookie, and maybe a body. The server returns a status code, headers like Content-Type and Cache-Control, and a body. HTTP is stateless, so sessions ride in cookies or tokens. GET, PUT and DELETE are safe to repeat; POST usually isn't. HTTP/2 multiplexes, HTTP/3 runs on QUIC, and in production it all runs inside TLS.",
    chapter: "8:05", s: 485,
    items: [
      { q: "What does 'stateless' mean for an HTTP server?", options: ["It never stores any data", "Every request stands on its own; the server doesn't remember you between them", "It can't send status codes"], answer: 1, why: "That's why any server can answer any request, and why websites grow by adding servers." },
      { q: "A response starts with 404. What kind of problem is it?", options: ["The server crashed", "The request was wrong: that thing doesn't exist", "Look somewhere else"], answer: 1, why: "4xx means the request was wrong. 5xx means the server failed." },
      { q: "How does a stateless server know Maya is logged in?", options: ["It remembers her IP address", "Her browser sends a cookie with a session token on every request", "HTTP/2 keeps her logged in"], answer: 1, why: "Set-Cookie at login, then the browser attaches the cookie to every request to that site." },
      { q: "A payment request timed out. Why is blindly retrying risky?", options: ["POST creates something new, so Maya could pay twice", "GET requests can't be retried", "Retries are always blocked"], answer: 0, why: "GET, PUT and DELETE are idempotent. POST isn't." },
      { q: "What did HTTP/2 change?", options: ["It added encryption", "Many requests travel at once over one connection", "It runs over UDP"], answer: 1, why: "HTTP/2 multiplexes. HTTP/3 is the one that runs on QUIC over UDP." },
      { q: "How can a server push a chat message the moment it arrives?", options: ["Status code 302", "A WebSocket: one upgrade request, then the line stays open both ways", "A longer Cache-Control"], answer: 1, why: "Plain HTTP is always request then response; WebSockets keep the connection open." },
    ],
  },
  closing: "HTTP is a simple, stateless conversation. A request says what you want, a response says what happened.",
});
