import "../kit/theme.css";
import "../kit/labs.css";
import "../e05/e05.css";
import "../e04/e04.css";
import "../kit/extra.css";
import { h } from "../kit/ui";
import { episodePage } from "../kit/episode";
import { dnsWalkHero } from "./walk";
import { hostsLab, splitLab, resolverLab } from "./labs1";
import { cacheLab, layersLab, outageLab, propagationLab, privacyLab } from "./labs2";
import { flipCards } from "../e05/labs/postoffice";

const CARDS = [
  { icon: "👤", post: "The person's name", net: "The domain name", c: "--net", d: "example.com: easy for people to remember." },
  { icon: "☎️", post: "Their phone number", net: "The IP address", c: "--good", d: "203.0.113.10: what routers actually use." },
  { icon: "🎧", post: "Directory assistance", net: "The resolver", c: "--cache", d: "You ask once; they do all the searching." },
  { icon: "📚", post: "The shelf of country directories", net: "The root", c: "--storage", d: "Tells the operator which directory to open." },
  { icon: "📖", post: "The country's directory", net: "The .com servers", c: "--storage", d: "Points to each name's own front desk." },
  { icon: "🏢", post: "The person's front desk", net: "The authoritative server", c: "--good", d: "The only place with the current number." },
  { icon: "⏳", post: "How long the operator trusts their note", net: "The time to live", c: "--ram", d: "After that, they look it up again." },
];

// Chapter starts in the published cut, from the episode's package.
episodePage({
  id: "e07", next: "e08", floor: "Floor 2 · How the web works", accent: "--cache",
  title: ["How a name becomes ", h("em", { style: "color:var(--cache)" }, "a number")],
  lede: "On 4 October 2021, Facebook, Instagram and WhatsApp vanished for about six hours. The servers were still running. What disappeared was the answer to one tiny question every phone asks before anything loads: where is Facebook? Follow how that question gets answered.",
  hero: dnsWalkHero(),
  labs: [
    { id: "list", title: "One big list", lede: "The early internet kept every name in one file called hosts. Grow the internet and watch the file.", chapter: "1:55", s: 115, colour: "storage", mount: hostsLab },
    { id: "split", title: "Split the name", lede: "Read a web address from right to left. Each level only knows who runs the level below it.", chapter: "2:51", s: 171, colour: "cache", mount: splitLab },
    { id: "walk", title: "Be the resolver", lede: "Maya's laptop asks you one question. Walk the tree yourself: root, then .org, then the site's own servers.", chapter: "3:53", s: 233, colour: "net", mount: resolverLab },
    { id: "ttl", title: "Caching and the time to live", lede: "Doing the walk for every click would be slow, so everyone remembers. For how long is the time to live.", chapter: "4:23", s: 263, colour: "good", mount: cacheLab },
    { id: "maya", title: "Maya's lookup", lede: "Browser, laptop, resolver: three memories before anyone walks the tree. Switch them on and off.", chapter: "4:54", s: 294, colour: "net", mount: layersLab },
    { id: "break", title: "When things break", lede: "The root sounds like a single point of failure. It isn't. The weak spot is lower down.", chapter: "5:28", s: 328, colour: "bad", mount: outageLab },
    { id: "propagate", title: "Why changes take time", lede: "Move a website to a new address. Old answers live on until their time to live runs out.", chapter: "6:09", s: 369, colour: "storage", mount: propagationLab },
    { id: "privacy", title: "Trust, not secrecy", lede: "Classic DNS questions travel unencrypted, and a fake answer can send you to the wrong server.", chapter: "6:40", s: 400, colour: "cache", mount: privacyLab },
    { id: "phonebook", title: "The phone book", lede: "The whole idea as a phone book and an operator. Flip each card.", chapter: "7:12", s: 432, colour: "good", mount: (b) => flipCards(b, CARDS, "That's DNS, as a phone book.", "DNS turns names into numbers by asking a chain of servers, each knowing only the next step.", ["Phone book", "DNS"]) },
  ],
  quiz: {
    lede: "The browser checks its cache, then the operating system's. On a miss it asks a recursive resolver, which walks root → top-level domain → authoritative servers. Every answer is cached for its time to live, so most lookups take a few milliseconds. Then the browser opens a TCP connection to the address.",
    chapter: "8:16", s: 496,
    items: [
      { q: "Why does DNS exist at all?", options: ["Routers only understand numbers, people remember names", "To encrypt web traffic", "To make pages load in order"], answer: 0, why: "Every device has an IP address, but people type names. DNS turns one into the other." },
      { q: "In what order does a resolver ask, on a full miss?", options: ["Authoritative, .com, root", "Root, .com, authoritative", ".com, root, authoritative"], answer: 1, why: "The root points to .com, .com points to the domain's own servers, and those hold the real answer." },
      { q: "What does a TTL on a DNS answer control?", options: ["How fast the server replies", "How long the answer may be reused", "How many hops the walk takes"], answer: 1, why: "Time to live: resolvers, laptops and browsers keep the answer that long." },
      { q: "You're moving a site to a new address tomorrow. What should you do today?", options: ["Raise the TTL", "Lower the TTL", "Turn off DNS"], answer: 1, why: "A short TTL means old cached answers expire within minutes of the switch." },
      { q: "What made the 2016 Dyn outage so widespread?", options: ["All 13 root servers failed", "Many big sites depended on one DNS provider", "Browsers stopped caching"], answer: 1, why: "A flood of traffic hit one provider that answered DNS for Twitter, Netflix, PayPal and more." },
      { q: "Which one hides your DNS questions from the café Wi-Fi?", options: ["DNSSEC", "DNS over HTTPS", "A longer TTL"], answer: 1, why: "DNS over HTTPS encrypts the questions. DNSSEC signs answers so fakes can be caught, but doesn't hide them." },
    ],
  },
  closing: "DNS turns names into numbers by asking a chain of servers, each knowing only the next step, and everyone remembers the answer for a while.",
});
