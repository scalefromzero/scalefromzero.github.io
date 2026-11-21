import "../kit/theme.css";
import "../kit/labs.css";
import "../e05/e05.css";
import "../e04/e04.css";
import "../kit/extra.css";
import { h } from "../kit/ui";
import { episodePage } from "../kit/episode";
import { lbHero, dnsRrLab, proxyLab, algoLab, healthLab, layersLab, launchLab, sessionLab } from "./labs";
import { flipCards } from "../e05/labs/postoffice";

const CARDS = [
  { icon: "🚪", post: "One entrance everyone knows", net: "The public address", c: "--net", d: "It never changes, however many servers sit behind it." },
  { icon: "🧍", post: "The queue manager", net: "The load balancer", c: "--good", d: "Waves each traveller to the next free desk." },
  { icon: "🛄", post: "The check-in desks", net: "The servers", c: "--storage", d: "All doing the same job." },
  { icon: "👥", post: "A bigger desk with two agents", net: "Weighting", c: "--cache", d: "Gets more travellers." },
  { icon: "⛔", post: "A desk with a closed sign", net: "A failed health check", c: "--bad", d: "Gets nobody until it reopens." },
  { icon: "🧳", post: "A travel agent who books for you", net: "A forward proxy", c: "--ram", d: "Works for the traveller, not the airport." },
];

// Chapter starts in the published cut, from the episode's package.
episodePage({
  id: "e12", next: "e13", floor: "Floor 3 · Serving millions", accent: "--net",
  title: ["One address, ", h("em", { style: "color:var(--net)" }, "a thousand machines")],
  lede: "When you open a big app, your phone sends its request to one address. Behind it there might be thousands of machines, and the one that answers is chosen in a fraction of a millisecond. Pick the algorithm, crash some servers, and watch.",
  hero: lbHero(), wide: true,
  labs: [
    { id: "dns", title: "DNS round robin, and why it breaks", lede: "Put all twenty addresses in the DNS answer. Then crash one, and watch cached answers keep sending people to it.", chapter: "1:06", s: 66, colour: "storage", mount: dnsRrLab },
    { id: "proxies", title: "Forward and reverse proxies", lede: "The big idea is a middleman. Who does each one work for?", chapter: "2:43", s: 163, colour: "net", mount: proxyLab },
    { id: "algorithms", title: "Choosing a server", lede: "Round robin, weighted, least connections, random. Race them on the same requests, some of them slow.", chapter: "3:17", s: 197, colour: "good", mount: algoLab },
    { id: "health", title: "Health checks", lede: "Every few seconds, ask each server a tiny question. How often, and how many failures before it's removed?", chapter: "3:54", s: 234, colour: "bad", mount: healthLab },
    { id: "layers", title: "Layer 4 vs layer 7", lede: "One only sees addresses and ports. The other reads the HTTP request. See what each can do.", chapter: "4:24", s: 264, colour: "cache", mount: layersLab },
    { id: "launch", title: "Launch day: 20 become 40", lede: "Traffic climbs, server 7 crashes, and new servers start automatically. Play the hour.", chapter: "4:58", s: 298, colour: "net", mount: launchLab },
    { id: "stateless", title: "Keep the servers stateless", lede: "If a server keeps your login in its own memory, a crash logs you out. Unless sessions live somewhere shared.", chapter: "6:07", s: 367, colour: "storage", mount: sessionLab },
    { id: "airport", title: "The airport", lede: "The whole idea as an airport check-in hall. Flip each card.", chapter: "7:14", s: 434, colour: "good", mount: (b) => flipCards(b, CARDS, "That's a load balancer, as an airport.", "A load balancer is one front door that sends every request to a healthy server, and makes many machines look like one.", ["Airport", "Load balancing"]) },
  ],
  quiz: {
    lede: "The load balancer is a reverse proxy with one public address, in front of a pool of stateless servers. It picks a server with round robin, weighted round robin, least connections or hashing, and removes servers that fail health checks. Layer 4 for raw speed, layer 7 to route by path and terminate TLS. Run several load balancers, keep sessions in a shared store, and autoscale the pool.",
    chapter: "8:16", s: 496,
    items: [
      { q: "Why isn't DNS round robin enough on launch day?", options: ["DNS can't hold 20 addresses", "Cached answers keep sending people to dead servers, and DNS can't see load", "It's too expensive"], answer: 1, why: "Answers live until their TTL runs out, and DNS has no idea which servers are busy." },
      { q: "A load balancer is which kind of proxy?", options: ["Forward", "Reverse", "Neither"], answer: 1, why: "It works for the servers: users talk to it and never see what's behind." },
      { q: "Some requests take far longer than others. Which algorithm copes best?", options: ["Round robin", "Least connections", "DNS round robin"], answer: 1, why: "It sends each new request to the server with the fewest in progress." },
      { q: "A server's database is broken, but its web process still says 'I'm fine'. What's the fix?", options: ["A deeper health check", "A longer TTL", "Layer 4 balancing"], answer: 0, why: "Check what the server actually needs, not just that it's switched on." },
      { q: "Which load balancer can send /payments to a different group of servers?", options: ["Layer 4", "Layer 7", "Both"], answer: 1, why: "Only layer 7 reads the HTTP request and its path." },
      { q: "How do you stop the load balancer itself being a single point of failure?", options: ["Make it bigger", "Run several sharing one address", "Turn off health checks"], answer: 1, why: "If one fails, the others carry on." },
    ],
  },
  closing: "A load balancer is one front door that sends every request to a healthy server, and makes many machines look like one.",
});
