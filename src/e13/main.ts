import "../kit/theme.css";
import "../kit/labs.css";
import "../e05/e05.css";
import "../e04/e04.css";
import "../kit/extra.css";
import { h } from "../kit/ui";
import { episodePage } from "../kit/episode";
import { ringHero, modLab, vnodeLab, busyLab, hotLab } from "./labs";
import { flipCards } from "../e05/labs/postoffice";

const CARDS = [
  { icon: "🏠", post: "Houses around a ring road", net: "Users (keys) on the ring", c: "--net", d: "Each placed by its hash." },
  { icon: "📦", post: "Parcel lockers on the same road", net: "Servers on the ring", c: "--good", d: "Also placed by hashing their names." },
  { icon: "➡️", post: "Use the next locker clockwise", net: "The lookup rule", c: "--storage", d: "No dividing by the number of servers." },
  { icon: "🆕", post: "A new locker opens", net: "Adding a server", c: "--cache", d: "Only the houses just before it switch." },
  { icon: "🏢", post: "One company with signs all along the road", net: "Virtual nodes", c: "--ram", d: "Many spots per server keep the shares even." },
];

// Chapter starts in the published cut, from the episode's package.
episodePage({
  id: "e13", next: "e14", floor: "Floor 3 · Serving millions", accent: "--cache",
  title: ["Add a server ", h("em", { style: "color:var(--cache)" }, "without chaos")],
  lede: "Add one server to a group of four, and with the simplest method four out of five users get sent somewhere new, on the busiest night of the year. One small change to the maths fixes it. Add and remove servers on the ring and count who moves.",
  hero: ringHero(), wide: true,
  labs: [
    { id: "mod", title: "Hash and divide", lede: "Hash the user ID, divide by the number of servers, keep the remainder. Then add a server.", chapter: "1:06", s: 66, colour: "storage", mount: modLab },
    { id: "vnodes", title: "Virtual nodes", lede: "With only five points on the ring, the gaps are uneven. Slide up the number of points per server.", chapter: "3:54", s: 234, colour: "cache", mount: vnodeLab },
    { id: "night", title: "The busy night, again", lede: "A fifth cache server joins. Every moved user misses the cache and hits the database. Compare the two methods.", chapter: "5:00", s: 300, colour: "bad", mount: busyLab },
    { id: "hot", title: "Hot keys and replicas", lede: "A celebrity's key lives on one server. And if that server dies, so does the data, unless it's copied clockwise.", chapter: "5:28", s: 328, colour: "storage", mount: hotLab },
    { id: "lockers", title: "Lockers on a ring road", lede: "The whole idea as parcel lockers on a circular road. Flip each card.", chapter: "6:59", s: 419, colour: "good", mount: (b) => flipCards(b, CARDS, "That's consistent hashing, as a ring road.", "Put servers and keys on the same circle; each key walks clockwise to its server, so change only touches the neighbours.", ["Ring road", "Consistent hashing"]) },
  ],
  quiz: {
    lede: "Plain hashing with a remainder moves almost every key when the number of servers changes. Consistent hashing places servers and keys on a ring, and each key goes to the next server clockwise, so adding or removing a server moves only about 1/N of the keys. Use virtual nodes for even spread, replicate to the next servers clockwise, and handle hot keys separately.",
    chapter: "7:59", s: 479,
    items: [
      { q: "Going from 4 to 5 servers with hash mod N, roughly how many users move?", options: ["About 1 in 5", "About 4 in 5", "None"], answer: 1, why: "Almost every remainder changes when you divide by a different number." },
      { q: "On a hash ring, which server does a key go to?", options: ["The nearest one", "The next one clockwise", "A random one"], answer: 1, why: "Hash the key, find its spot, walk clockwise to the first server." },
      { q: "Adding a fifth server to a ring moves about…", options: ["Everyone", "About 1/5 of users", "Nobody"], answer: 1, why: "Only users between the new server and the one before it move." },
      { q: "What are virtual nodes for?", options: ["Encryption", "Placing each server many times so shares are even", "Backups"], answer: 1, why: "With few points the gaps are uneven; many points smooth them out." },
      { q: "A celebrity's key gets huge traffic. Does consistent hashing fix that?", options: ["Yes", "No: it spreads keys, not load", "Only with fewer servers"], answer: 1, why: "A hot key still lives on one server. Add a cache in front or split the key." },
      { q: "When is consistent hashing not needed?", options: ["Servers are stateless and share one cache", "Each server holds a slice of a database", "Each server keeps its own cache"], answer: 0, why: "If it doesn't matter where a request lands, round robin is simpler." },
    ],
  },
  closing: "Put servers and keys on the same circle, and each key walks clockwise to its server, so change only touches the neighbours.",
});
