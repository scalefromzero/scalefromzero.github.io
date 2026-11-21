import "../kit/theme.css";
import "../kit/labs.css";
import "../e05/e05.css";
import "../e04/e04.css";
import "../kit/extra.css";
import { h } from "../kit/ui";
import { episodePage } from "../kit/episode";
import { journeysHero, resumableLab, transcodeLab, recLab, viewsLab, overflowLab, premiereLab } from "./labs";
import { flipCards } from "../e05/labs/postoffice";

const CARDS = [
  { icon: "🖥️", post: "Floor one", net: "One computer", c: "--storage", d: "Caches, memory, latency and throughput." },
  { icon: "🌐", post: "Floor two", net: "The network", c: "--net", d: "Packets, TCP, DNS and HTTPS carry every chunk." },
  { icon: "🏢", post: "Floor three", net: "Serving millions", c: "--cache", d: "APIs, CDNs, load balancers, consistent hashing." },
  { icon: "⚡", post: "Floor four", net: "Real time", c: "--good", d: "Open connections keep the comments live." },
  { icon: "🗄️", post: "Floor five", net: "Data at scale", c: "--ram", d: "SQL, sharding, replication, CAP, object storage, queues." },
];

// Chapter times are ESTIMATES from the script's word counts (calibrated on E16); replace with the package's chapters once E24 is rendered.
episodePage({
  id: "e24", floor: "Floor 5 · Season finale", accent: "--bad",
  title: ["How YouTube works: ", h("em", { style: "color:var(--bad)" }, "the whole season in one press of play")],
  lede: "More than twenty billion videos, over five hundred hours uploaded every minute, and playback that starts in about a second. Follow Sam's upload, then press play as Maya.",
  hero: journeysHero(), wide: true,
  labs: [
    { id: "resumable", title: "Uploading from a train", lede: "Two gigabytes over Wi-Fi that keeps dropping.", chapter: "0:52", s: 52, colour: "net", mount: resumableLab },
    { id: "transcode", title: "Transcoding in parallel", lede: "One machine, or hundreds converting segments at once?", chapter: "1:21", s: 81, colour: "bad", mount: transcodeLab },
    { id: "recs", title: "Recommendations in two stages", lede: "Choose from twenty billion videos in a fraction of a second.", chapter: "3:31", s: 211, colour: "good", mount: recLab },
    { id: "views", title: "Counting views", lede: "Why a new video's count pauses, then jumps.", chapter: "4:01", s: 241, colour: "storage", mount: viewsLab },
    { id: "gangnam", title: "Gangnam Style and the 32-bit counter", lede: "The largest number a common 32-bit counter can hold is 2,147,483,647.", chapter: "4:30", s: 270, colour: "bad", mount: overflowLab },
    { id: "premiere", title: "A huge premiere", lede: "Millions press play at once, before any nearby cache has a copy.", chapter: "6:05", s: 365, colour: "cache", mount: premiereLab },
    { id: "season", title: "The whole season", lede: "Every floor, inside one press of upload and one press of play. Flip each card.", chapter: "7:06", s: 426, colour: "ram", mount: (b) => flipCards(b, CARDS, "That's the whole season.", "Big systems are small, simple ideas, stacked carefully, one floor at a time.", ["Floor", "What it holds"]) },
  ],
  quiz: {
    lede: "Upload with resumable chunks into object storage, then publish an event to a queue. Transcode asynchronously in parallel segments into multiple resolutions and codecs. Store metadata in a sharded, replicated database. Serve video through a CDN with caches close to viewers, using adaptive bitrate streaming. Count views and likes through an event pipeline with fraud checks and cached totals. Recommend with a fast candidate stage, then a careful ranking stage.",
    chapter: "8:00", s: 480,
    items: [
      { q: "Sam's Wi-Fi drops mid-upload. With a resumable upload…", options: ["It starts again", "It carries on from the last chunk", "The video is lost"], answer: 1, why: "Chunks already sent are kept." },
      { q: "Why is the low-quality version often ready first?", options: ["It's uploaded first", "Segments are converted in parallel, and low quality is cheapest", "It's cached"], answer: 1, why: "4K takes the most computing." },
      { q: "Where does Maya's video usually come from?", options: ["YouTube's head office", "A cache inside her internet provider", "Sam's phone"], answer: 1, why: "Popular videos sit a short trip away." },
      { q: "How do recommendations pick from billions in a fraction of a second?", options: ["Score every video", "A fast candidate stage, then careful ranking of a few hundred", "Random choice"], answer: 1, why: "Two-stage design, 2016 paper." },
      { q: "Why can a new video's view count pause, then jump?", options: ["A bug", "Views are checked for bots in a pipeline before they count", "Caching the page"], answer: 1, why: "Careful, delayed counting." },
      { q: "What did Gangnam Style nearly overflow?", options: ["A 32-bit counter, max 2,147,483,647", "The CDN", "A 64-bit counter"], answer: 0, why: "YouTube had already moved to 64 bits." },
    ],
  },
  closing: "Big systems are small, simple ideas, stacked carefully, one floor at a time.",
});
