import "../kit/theme.css";
import "../kit/labs.css";
import "../e05/e05.css";
import "../e04/e04.css";
import "../kit/extra.css";
import { h } from "../kit/ui";
import { episodePage } from "../kit/episode";
import { atmHero, majorityLab, cartLab, featureLab, lwwLab, quorumLab } from "./labs";
import { flipCards } from "../e05/labs/postoffice";

const CARDS = [
  { icon: "☎️", post: "The phone line between the two branches", net: "The network", c: "--net", d: "Losing it is the partition." },
  { icon: "🛑", post: "\"No withdrawals until we can check with the other branch\"", net: "Choosing consistency (C P)", c: "--bad", d: "Careful manager." },
  { icon: "🤝", post: "\"Go ahead, we'll reconcile the books tonight\"", net: "Choosing availability (A P)", c: "--good", d: "Friendly manager." },
  { icon: "🐢", post: "Phoning the other branch before every transaction", net: "The latency trade-off", c: "--storage", d: "Correct on a normal day, but slow." },
];

episodePage({
  id: "e20", next: "e21", floor: "Floor 5 · Data at scale", accent: "--bad",
  title: ["Why you ", h("em", { style: "color:var(--bad)" }, "can't have everything")],
  lede: "Two cash machines, one account with $100, and the cable between the cities is cut. Maya and Sam each ask for all of it. Should the machines pay out? There are only two possible answers.",
  hero: atmHero(), wide: true,
  labs: [
    { id: "majority", title: "Choosing consistency", lede: "Five copies, split in two. Only the side with a majority may accept writes.", chapter: "3:26", s: 206, colour: "bad", mount: majorityLab },
    { id: "cart", title: "Choosing availability", lede: "A shopping cart must always accept an item. Remove something on one side, then merge.", chapter: "4:00", s: 240, colour: "good", mount: cartLab },
    { id: "features", title: "One app, different choices", lede: "Split the video app's network. Which features refuse, and which answer anyway?", chapter: "4:35", s: 275, colour: "net", mount: featureLab },
    { id: "lww", title: "Last write wins", lede: "Two people rename the same video on opposite sides of the split. Then nudge a clock.", chapter: "5:10", s: 310, colour: "storage", mount: lwwLab },
    { id: "quorum", title: "Quorums and the everyday cost", lede: "Choose how many copies a read and a write must reach. Then cut some off.", chapter: "6:13", s: 373, colour: "cache", mount: quorumLab },
    { id: "branches", title: "Two branches of a bank", lede: "CAP as two bank branches with the phone line down. Flip each card.", chapter: "6:48", s: 408, colour: "bad", mount: (b) => flipCards(b, CARDS, "That's CAP, as two bank branches.", "When the network splits, every copy must either refuse or risk being wrong, so decide in advance which mistake each feature can afford.", ["Bank", "Distributed system"]) },
  ],
  quiz: {
    lede: "In a distributed system partitions will happen, so during a partition you choose between consistency and availability, feature by feature. Payments, inventory and unique names are C P, with a majority so the minority side rejects writes. Feeds, likes and carts are A P, with eventual consistency and a clear merge rule. Even without partitions, stronger consistency costs latency (PACELC), and quorums let you tune it per request.",
    chapter: "7:49", s: 469,
    items: [
      { q: "Why is \"pick two of C, A and P\" misleading?", options: ["You can have all three", "Partitions happen anyway; the real choice is what to do during one", "P is the least important"], answer: 1, why: "For a system spread across machines, P isn't optional." },
      { q: "A C P system during a partition…", options: ["Answers everything", "Lets only the majority side accept writes; the other side refuses", "Loses data"], answer: 1, why: "Never wrong, sometimes unavailable." },
      { q: "Which feature should be A P?", options: ["Bank balance", "Unique usernames", "Like counts"], answer: 2, why: "A count that's off for a minute hurts nobody." },
      { q: "In Amazon's Dynamo cart, what's the known side effect of merging?", options: ["Items vanish", "Deleted items can reappear", "Carts empty"], answer: 1, why: "Acceptable for a cart, never for money." },
      { q: "N = 3 copies. Which guarantees a read sees the latest write?", options: ["W = 1, R = 1", "W = 2, R = 2", "W = 1, R = 2"], answer: 1, why: "R + W > N, so they overlap." },
      { q: "What does PACELC add?", options: ["A third choice during partitions", "Even without a partition, consistency costs latency", "A faster network"], answer: 1, why: "Else, choose latency or consistency." },
    ],
  },
  closing: "When the network splits, every copy must either refuse or risk being wrong, so decide in advance which mistake each feature can afford.",
});
