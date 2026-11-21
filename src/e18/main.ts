import "../kit/theme.css";
import "../kit/labs.css";
import "../e05/e05.css";
import "../e04/e04.css";
import "../kit/extra.css";
import { h } from "../kit/ui";
import { episodePage } from "../kit/episode";
import { partitionHero, splitLab, docLab, wideLab, graphLab, pickLab, eventualLab } from "./labs";
import { flipCards } from "../e05/labs/postoffice";

const CARDS = [
  { icon: "🪝", post: "A row of labelled hooks by the door", net: "Key-value store", c: "--net", d: "One hook, one thing, grab it instantly." },
  { icon: "📁", post: "A folder for each person, holding whatever papers they have", net: "Document database", c: "--cache", d: "Items don't have to match." },
  { icon: "🧾", post: "A till roll that only gets longer, sorted by time", net: "Wide-column database", c: "--storage", d: "Written once, read in order." },
  { icon: "📌", post: "A corkboard of photos joined by string", net: "Graph database", c: "--good", d: "The connections are the point." },
  { icon: "🗄️", post: "The locked filing cabinet with strict forms", net: "Your SQL database", c: "--bad", d: "Still there, for the important stuff." },
];

// Chapter times are ESTIMATES from the script's word counts (calibrated on E16); replace with the package's chapters once E18 is rendered.
episodePage({
  id: "e18", next: "e19", floor: "Floor 5 · Data at scale", accent: "--cache",
  title: ["When data ", h("em", { style: "color:var(--cache)" }, "doesn't fit in tables")],
  lede: "On Prime Day, one Amazon database service peaked at 192 million requests a second. No single machine could do that. Spread data across machines by key, then let one celebrity video get all the views.",
  hero: partitionHero(),
  labs: [
    { id: "split", title: "Split by table, and the join moves into your app", lede: "Users on one machine, videos on another. Watch what happens to a simple query.", chapter: "1:38", s: 98, colour: "bad", mount: splitLab },
    { id: "documents", title: "Key-value and documents", lede: "Two creator profiles, with completely different fields.", chapter: "3:06", s: 186, colour: "cache", mount: docLab },
    { id: "widecolumn", title: "Wide-column", lede: "Billions of views, grouped by video and sorted by time.", chapter: "3:36", s: 216, colour: "storage", mount: wideLab },
    { id: "graph", title: "Graph", lede: "People and videos are dots; every watch is a line.", chapter: "4:04", s: 244, colour: "good", mount: graphLab },
    { id: "rebuild", title: "Rebuild the video app", lede: "Pick the right kind of database for each piece of data.", chapter: "4:27", s: 267, colour: "net", mount: pickLab },
    { id: "eventual", title: "The count goes down", lede: "A like count read from two copies that haven't caught up with each other.", chapter: "5:00", s: 300, colour: "bad", mount: eventualLab },
    { id: "home", title: "Storage at home", lede: "The four shapes as storage at home. Flip each card.", chapter: "6:33", s: 393, colour: "cache", mount: (b) => flipCards(b, CARDS, "That's NoSQL, as storage at home.", "NoSQL trades joins and strict rules for the freedom to spread data across as many machines as you need.", ["At home", "Database"]) },
  ],
  quiz: {
    lede: "Start from the access patterns and the guarantees you need. SQL for structured, related data that needs joins and transactions. NoSQL to scale out writes, store flexible data, or serve a few specific patterns at huge volume: key-value for caches and sessions, documents for flexible records, wide-column for time-ordered events, graphs for relationships. Pick partition keys that spread load, and accept eventual consistency only where it's safe.",
    chapter: "7:33", s: 453,
    items: [
      { q: "What do NoSQL databases usually give up to spread across many machines?", options: ["Speed", "Joins and rules that span many records", "Storage space"], answer: 1, why: "In return, every read and write touches one place." },
      { q: "Where should login sessions checked on every request live?", options: ["Graph database", "Key-value store in memory", "Wide-column store"], answer: 1, why: "A key in, a value out, in under a millisecond." },
      { q: "Creator profiles keep gaining new kinds of fields. Best fit?", options: ["Document database", "Wide-column", "A strict SQL table"], answer: 0, why: "Documents in one collection don't have to match." },
      { q: "One celebrity's video gets all the views. What goes wrong?", options: ["Nothing", "Its one partition overheats while others sit idle", "The data is lost"], answer: 1, why: "A hot key. Split it or spread it." },
      { q: "A like count goes up, then briefly down. Why?", options: ["A bug", "Two copies haven't caught up with each other yet", "Someone unliked"], answer: 1, why: "Eventual consistency." },
      { q: "Where should payments live in this design?", options: ["Key-value store", "The SQL database", "Graph database"], answer: 1, why: "Anything where a wrong answer is unacceptable stays relational." },
    ],
  },
  closing: "NoSQL trades joins and strict rules for the freedom to spread data across as many machines as you need.",
});
