import "../kit/theme.css";
import "../kit/labs.css";
import "../e05/e05.css";
import "../e04/e04.css";
import "../kit/extra.css";
import { h } from "../kit/ui";
import { episodePage } from "../kit/episode";
import { replicaHero, lagLab, syncLab, shardKeyLab, logicalLab, splitBrainLab, fanoutLab } from "./labs";
import { flipCards } from "../e05/labs/postoffice";

const CARDS = [
  { icon: "📠", post: "Photocopying the master file for several clerks", net: "Replication", c: "--ram", d: "Many people can read at once." },
  { icon: "🧑‍💼", post: "The one clerk allowed to make changes", net: "The leader", c: "--storage", d: "Then updates everyone's copies." },
  { icon: "⏳", post: "Waiting until every copy is updated before saying done", net: "Synchronous", c: "--good", d: "Safe, but slower." },
  { icon: "📨", post: "Saying done now, updating copies later", net: "Asynchronous", c: "--net", d: "Fast, but copies lag." },
  { icon: "🗃️", post: "Splitting the cabinets by surname, A–F here, G–M there", net: "Sharding", c: "--cache", d: "Each clerk handles fewer files." },
];

episodePage({
  id: "e19", next: "e20", floor: "Floor 5 · Data at scale", accent: "--ram",
  title: ["Copies ", h("em", { style: "color:var(--ram)" }, "and slices")],
  lede: "In 2018, GitHub lost the link between two sites for 43 seconds and was degraded for over a day. The question underneath: which copy is the real one? Add replicas, then kill the leader.",
  hero: replicaHero(),
  labs: [
    { id: "lag", title: "Maya's vanishing comment", lede: "Her read goes to a replica that hasn't caught up yet.", chapter: "1:42", s: 102, colour: "bad", mount: lagLab },
    { id: "sync", title: "Sync or async", lede: "Wait for the copies, or say done now? Move the far replica to another continent.", chapter: "2:37", s: 157, colour: "net", mount: syncLab },
    { id: "shardkey", title: "The shard key", lede: "Fifty thousand people sign up today. Which shard takes the writes?", chapter: "3:41", s: 221, colour: "storage", mount: shardKeyLab },
    { id: "logical", title: "Logical shards", lede: "480 small slices on a few machines. Add one machine and see what moves.", chapter: "4:17", s: 257, colour: "good", mount: logicalLab },
    { id: "splitbrain", title: "Split brain", lede: "The old leader was only cut off, not dead. Now there are two.", chapter: "5:21", s: 321, colour: "bad", mount: splitBrainLab },
    { id: "fanout", title: "Questions across every shard", lede: "Top videos across all users means asking every shard.", chapter: "5:57", s: 357, colour: "cache", mount: fanoutLab },
    { id: "office", title: "The office", lede: "Copies and slices as a busy office. Flip each card.", chapter: "7:03", s: 423, colour: "ram", mount: (b) => flipCards(b, CARDS, "That's replication and sharding, as an office.", "Copies let you read more and survive failures. Slices let you write more.", ["Office", "Database"]) },
  ],
  quiz: {
    lede: "First add replication: a leader for writes and replicas for reads, synchronous to at least one nearby copy, asynchronous elsewhere. Handle lag with read-your-own-writes. When writes outgrow one leader, shard by a high-cardinality key that keeps related data together, with hashing and many logical shards. Call out cross-shard queries and transactions, hot shards, and failover with split-brain protection.",
    chapter: "8:08", s: 488,
    items: [
      { q: "What does adding replicas increase?", options: ["Write capacity", "Read capacity and survival when a machine dies", "Both equally"], answer: 1, why: "Every write still goes through one leader." },
      { q: "Maya's comment vanishes after a refresh. Best fix?", options: ["Synchronous replication everywhere", "Read her own recent writes from the leader", "More replicas"], answer: 1, why: "Read-your-own-writes." },
      { q: "Asynchronous replication risks…", options: ["Slow writes", "Losing the last few writes if the leader crashes", "Nothing"], answer: 1, why: "The leader said done before copies had it." },
      { q: "Why can range sharding by user ID go wrong?", options: ["It's random", "All new users land on the newest shard", "It needs more machines"], answer: 1, why: "Hash the key to spread writes." },
      { q: "Two machines both think they're the leader. This is…", options: ["Sharding", "Split brain", "Replica lag"], answer: 1, why: "Make the old leader step down first." },
      { q: "Why create many logical shards up front?", options: ["Faster queries", "Growing means moving a few slices, not reshuffling everything", "Fewer machines"], answer: 1, why: "The rule for finding data never changes." },
    ],
  },
  closing: "Copies let you read more and survive failures. Slices let you write more. And every copy is a promise you have to keep in sync.",
});
