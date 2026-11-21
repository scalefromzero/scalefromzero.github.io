import "../kit/theme.css";
import "../kit/labs.css";
import "../e05/e05.css";
import "../e04/e04.css";
import "../kit/extra.css";
import { h } from "../kit/ui";
import { episodePage } from "../kit/episode";
import { cdnHero, distanceLab, pullLab, pushLab, fingerprintLab, visitLab, outageLab, shieldLab } from "./labs";
import { flipCards } from "../e05/labs/postoffice";

const CARDS = [
  { icon: "🏭", post: "The central warehouse", net: "The origin", c: "--storage", d: "Where the real files and the database live." },
  { icon: "🏪", post: "Local shops in every neighbourhood", net: "CDN servers", c: "--good", d: "Copies of what everyone wants, close by." },
  { icon: "📦", post: "Restocking when a customer first asks", net: "Pull", c: "--net", d: "A miss fetches from the origin and keeps a copy." },
  { icon: "🚚", post: "Sending a hot product before launch day", net: "Push", c: "--cache", d: "No first miss, but copies sit where nobody buys." },
  { icon: "📅", post: "The best-before date", net: "The time to live", c: "--ram", d: "How long a copy may be served." },
  { icon: "⚠️", post: "A product recall", net: "A purge", c: "--bad", d: "Every shop throws its copy away." },
  { icon: "🎂", post: "A birthday cake with your name on it", net: "Dynamic, personal content", c: "--cpu", d: "Still has to come from the kitchen: the origin." },
];

const hero = cdnHero();
// Chapter starts in the published cut, from the episode's package.
episodePage({
  id: "e11", next: "e12", floor: "Floor 3 · Serving millions", accent: "--good",
  title: ["CDNs, the internet ", h("em", { style: "color:var(--good)" }, "next door")],
  lede: "The video app keeps all its servers in Virginia. Sam opens it in Sydney, about fifteen and a half thousand kilometres away, and it still opens in a blink. Because the files he sees never came from Virginia. Put Sam anywhere on the map and see why.",
  hero: hero.el, onHero: hero.start, wide: true,
  labs: [
    { id: "far", title: "Far away", lede: "One page needs dozens of files, and the browser can't ask for what it doesn't know about yet. Round trips stack up.", chapter: "0:35", s: 35, colour: "storage", mount: distanceLab },
    { id: "pull", title: "Pull: hit and miss", lede: "The Sydney server doesn't have the thumbnail yet. It fetches it from Virginia, sends it to Sam, and keeps a copy.", chapter: "3:16", s: 196, colour: "net", mount: pullLab },
    { id: "push", title: "Push: before anyone asks", lede: "A new episode goes live and millions press play at the same moment. Pull or push?", chapter: "3:46", s: 226, colour: "cache", mount: pushLab },
    { id: "change", title: "Changing a file", lede: "Hundreds of cities hold the old script. Purge them all, or give the new version a new name?", chapter: "4:16", s: 256, colour: "storage", mount: fingerprintLab },
    { id: "visit", title: "Sam's visit", lede: "Static files from his own city, and one request all the way to Virginia for his personal feed.", chapter: "4:49", s: 289, colour: "good", mount: visitLab },
    { id: "break", title: "When a CDN breaks", lede: "One city down is easy. The whole CDN down at once is the hard case. Break things on the map.", chapter: "5:20", s: 320, colour: "bad", mount: outageLab },
    { id: "shield", title: "Origin shield", lede: "A new file, 300 cities, all missing at once. Without a middle layer, the origin gets flattened.", chapter: "6:31", s: 391, colour: "cache", mount: shieldLab },
    { id: "supermarket", title: "The supermarket", lede: "The whole idea as a supermarket chain. Flip each card.", chapter: "7:03", s: 423, colour: "good", mount: (b) => flipCards(b, CARDS, "That's a CDN, as a supermarket chain.", "A CDN is a cache, spread across the world, so the files everyone needs are always a short trip away.", ["Supermarket", "CDN"]) },
  ],
  quiz: {
    lede: "Put static content (images, video, scripts, styles) behind a CDN, cached in cities close to users. Pull for most files with sensible cache times, push for content you know will be popular. Give every file version a unique name, so updates never need a purge. Keep personal requests going to the origin, protect it with an origin shield, and consider edge computing or a second CDN for the most critical paths.",
    chapter: "8:03", s: 483,
    items: [
      { q: "Why is Sydney to Virginia slow even at the speed of light?", options: ["Servers in Virginia are slow", "Each round trip takes about 160 ms, and pages need several", "Sydney has bad Wi-Fi"], answer: 1, why: "About 15,500 km each way in glass is roughly 80 ms one way, and round trips stack up." },
      { q: "What should a CDN cache?", options: ["Sam's bank balance", "Files that are the same for everyone, like scripts and thumbnails", "Every API response"], answer: 1, why: "Personal, dynamic content still has to come from the origin." },
      { q: "With pull, who waits for the origin?", options: ["Everyone", "The first person in each city (a cache miss)", "Nobody"], answer: 1, why: "The first request in a city misses and fetches; later ones hit the copy." },
      { q: "What's the most common way to ship a new version of a script?", options: ["Purge every CDN city", "Give it a new fingerprinted file name", "Lower the TTL to zero"], answer: 1, why: "New pages ask for a name no cache has seen. Nothing has to be thrown away." },
      { q: "What does an origin shield do?", options: ["Encrypts the origin", "Makes CDN cities ask one regional cache first", "Blocks bots"], answer: 1, why: "Hundreds of misses become a handful of requests to the origin." },
      { q: "Why do the biggest companies use more than one CDN?", options: ["It's cheaper", "So one CDN outage can't take them down", "Browsers require it"], answer: 1, why: "In 2021 and 2025, single CDN incidents took large parts of the web offline." },
    ],
  },
  closing: "A CDN is a cache spread across the world, so the files everyone needs are always a short trip away.",
});
