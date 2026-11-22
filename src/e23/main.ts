import "../kit/theme.css";
import "../kit/labs.css";
import "../e05/e05.css";
import "../e04/e04.css";
import "../kit/extra.css";
import { h } from "../kit/ui";
import { episodePage } from "../kit/episode";
import { fanoutHero, idLab, openLab, rankLab, likesLab, sharedLab } from "./labs";
import { flipCards } from "../e05/labs/postoffice";

const CARDS = [
  { icon: "📱", post: "The app talks to…", net: "APIs (Floor 3)", c: "--net", d: "Behind load balancers." },
  { icon: "🖼️", post: "The photos sit in…", net: "Object storage + CDN", c: "--storage", d: "Stored once, served from nearby." },
  { icon: "🗂️", post: "Posts and follows live in…", net: "Sharded SQL, with replicas", c: "--ram", d: "Sharded by user." },
  { icon: "⚡", post: "Feeds and counters sit in…", net: "Caches", c: "--cache", d: "Built before anyone asks." },
  { icon: "📨", post: "Slow work runs through…", net: "Queues", c: "--good", d: "Sizes, checks, fan-out." },
];

episodePage({
  id: "e23", next: "e24", floor: "Floor 5 · Case study", accent: "--cache",
  title: ["How Instagram ", h("em", { style: "color:var(--cache)" }, "builds your feed")],
  lede: "More than three billion people a month, and a company of thirteen people when Facebook bought it in 2012. Follow one post from Maya's phone into her followers' feeds, then make Maya a celebrity.",
  hero: fanoutHero(),
  labs: [
    { id: "ids", title: "Clever IDs", lede: "Thousands of shards, no central counter. Build each ID from time, shard and a counter.", chapter: "2:29", s: 149, colour: "net", mount: idLab },
    { id: "open", title: "Sam opens the app", lede: "Gather posts from everyone he follows, or read one list that's already waiting.", chapter: "3:22", s: 202, colour: "bad", mount: openLab },
    { id: "rank", title: "Ranking", lede: "The ready-made list gives candidates. Now score them.", chapter: "4:51", s: 291, colour: "good", mount: rankLab },
    { id: "likes", title: "Likes pour in", lede: "Thousands of likes a second on one post. Where does the count live?", chapter: "5:19", s: 319, colour: "storage", mount: likesLab },
    { id: "shared", title: "When things break", lede: "Instagram, WhatsApp and Facebook shared the same network and DNS.", chapter: "6:25", s: 385, colour: "bad", mount: sharedLab },
    { id: "season", title: "The season, in one app", lede: "How Instagram uses every floor. Flip each card.", chapter: "7:31", s: 451, colour: "cache", mount: (b) => flipCards(b, CARDS, "That's the whole season, inside Instagram.", "Store the photo once, do the slow work later, and build each feed before anyone asks for it, except for the very famous.", ["Instagram", "Building block"]) },
  ],
  quiz: {
    lede: "Upload photos directly to object storage and process sizes and checks through a queue. Serve images through a CDN. Store users, posts and follows in a database sharded by user ID, with replicas and time-sortable IDs generated per shard. Build feeds with fan-out on write into cached lists, pull celebrity posts at read time, then rank. Keep like counts in a cache with eventual consistency; call out hot keys and cache warm-up.",
    chapter: "7:56", s: 476,
    items: [
      { q: "Why does Instagram build IDs from time + shard + counter?", options: ["Shorter URLs", "Every shard makes unique IDs alone, and they sort by time", "Encryption"], answer: 1, why: "No central counter, no bottleneck." },
      { q: "Fan-out on write means…", options: ["Gathering posts when Sam opens the app", "Adding the post ID to each follower's ready-made feed when Maya posts", "Writing photos to many disks"], answer: 1, why: "Heavy work at post time, fast reads." },
      { q: "Why not push a celebrity's post into every feed?", options: ["Hundreds of millions of feed writes for one photo", "Celebrities don't post", "It's illegal"], answer: 0, why: "Pull the few huge accounts at read time." },
      { q: "Why might the like count be a few seconds behind?", options: ["A bug", "Counts are cached or batched so one row isn't hammered", "Bots"], answer: 1, why: "An A P choice nobody minds." },
      { q: "Where do photos load from when you scroll?", options: ["The main database", "A CDN server near you", "Maya's phone"], answer: 1, why: "Original storage is barely touched." },
      { q: "What did the October 2021 outage show?", options: ["CDNs are slow", "Sharing infrastructure shares failures", "Queues lose data"], answer: 1, why: "Same network and DNS, all down together." },
    ],
  },
  closing: "Store the photo once, do the slow work later, and build each feed before anyone asks for it, except for the very famous.",
});
