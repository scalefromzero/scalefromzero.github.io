import "../kit/theme.css";
import "../kit/labs.css";
import "../e05/e05.css";
import "../e04/e04.css";
import "../kit/extra.css";
import { h } from "../kit/ui";
import { episodePage } from "../kit/episode";
import { indexHero, transferLab, tablesLab, joinLab, isolationLab, breakLab, injectionLab } from "./labs";
import { flipCards } from "../e05/labs/postoffice";

const CARDS = [
  { icon: "🗄️", post: "A shelf of identical forms", net: "A table", c: "--storage", d: "Every row has the same columns." },
  { icon: "📝", post: "The blank form", net: "The schema", c: "--net", d: "Says exactly which boxes must be filled." },
  { icon: "🔢", post: "The unique number on every form", net: "The primary key", c: "--good", d: "Like user 42." },
  { icon: "👉", post: "\"See member 42\"", net: "A foreign key", c: "--cache", d: "Must point at a real row." },
  { icon: "🗂️", post: "The card catalogue", net: "An index", c: "--ram", d: "Sorted, so any book is a few steps away." },
  { icon: "🧑‍💼", post: "A librarian who finishes the whole loan, or nothing", net: "A transaction", c: "--bad", d: "Card stamped and book handed over, together." },
];

episodePage({
  id: "e17", next: "e18", floor: "Floor 5 · Data at scale", accent: "--storage",
  title: ["Find one row in a billion, ", h("em", { style: "color:var(--storage)" }, "and never lose a payment")],
  lede: "There are probably more than a trillion SQL databases in use, and the idea behind them is over fifty years old. Grow the table to ten billion rows, then find user 42.",
  hero: indexHero(),
  labs: [
    { id: "transfer", title: "The vanishing $50", lede: "Maya pays Sam fifty dollars, and the server crashes halfway. Try it with a file, then with a transaction.", chapter: "1:37", s: 97, colour: "bad", mount: transferLab },
    { id: "tables", title: "Tables with rules", lede: "Users, videos, a primary key and a foreign key. Try to sneak bad data in.", chapter: "2:35", s: 155, colour: "storage", mount: tablesLab },
    { id: "join", title: "Asking questions", lede: "The ten most viewed videos by creators in London. Two tables, one join, and a plan the database picks for you.", chapter: "3:48", s: 228, colour: "net", mount: joinLab },
    { id: "isolation", title: "Two payments at once", lede: "Maya has $120 and pays two people $50 at the same moment. What's left?", chapter: "4:17", s: 257, colour: "good", mount: isolationLab },
    { id: "break", title: "When things break", lede: "One query per comment, instead of one query for all of them.", chapter: "5:22", s: 322, colour: "bad", mount: breakLab },
    { id: "library", title: "The library", lede: "A relational database as a library. Flip each card.", chapter: "6:56", s: 416, colour: "storage", mount: (b) => flipCards(b, CARDS, "That's a relational database, as a library.", "Tables with rules, an index to find anything in a few steps, and transactions that are all or nothing.", ["Library", "Database"]) },
    { id: "injection", title: "SQL injection", lede: "What happens when an app pastes your text straight into a query.", chapter: "7:28", s: 448, colour: "cache", mount: injectionLab },
  ],
  quiz: {
    lede: "Choose a relational database when the data is structured, with clear relationships, and you need transactions and strong consistency. Design tables, primary and foreign keys, then add indexes for the queries you run most. ACID transactions keep money and inventory correct. Scale reads with caching and read replicas; when one machine can't take the writes, shard or use distributed SQL.",
    chapter: "8:02", s: 482,
    items: [
      { q: "Why does finding one user among billions take only about four reads?", options: ["The data is cached in RAM", "A B+ tree index has hundreds of branches per level, so it's very short", "The database reads in parallel"], answer: 1, why: "With ~500 keys per node, 4 levels cover tens of billions of rows." },
      { q: "A video's creator_id points to a user that doesn't exist. What stops it?", options: ["The primary key", "A foreign key", "An index"], answer: 1, why: "A foreign key must match a real row in the other table." },
      { q: "The server crashes after taking $50 from Maya but before giving it to Sam. With a transaction:", options: ["Sam gets it anyway", "Both changes are undone; no money is lost", "Maya loses $50"], answer: 1, why: "Atomicity: all or nothing." },
      { q: "What makes a committed change survive a power cut?", options: ["Isolation", "It was written to a log on disk before saying done", "The schema"], answer: 1, why: "Durability, via the write-ahead log." },
      { q: "A page runs one query per comment. What's this called?", options: ["A deadlock", "The N+1 problem", "Sharding"], answer: 1, why: "Batch it into one query." },
      { q: "How do you prevent SQL injection?", options: ["Hide the database", "Pass user input separately, as a parameter", "Use NoSQL"], answer: 1, why: "Parameterised queries keep data out of the query's code." },
    ],
  },
  closing: "A relational database is tables with rules, an index to find anything in a few steps, and transactions that are all or nothing.",
});
