import "../kit/theme.css";
import "../kit/labs.css";
import "../e05/e05.css";
import "../e04/e04.css";
import "../kit/extra.css";
import { h } from "../kit/ui";
import { episodePage } from "../kit/episode";
import { netflixHero, microLab, steeringLab, fillLab, abrLab, chaosLab, liveLab } from "./labs";
import { flipCards } from "../e05/labs/postoffice";

const CARDS = [
  { icon: "📜", post: "The TV app talks to Netflix's services", net: "APIs · Episode 10", c: "--net", d: "The contract between the app and the cloud." },
  { icon: "📦", post: "The video a short trip from you", net: "Open Connect, a CDN · Episode 11", c: "--good", d: "Boxes inside ISPs, filled overnight." },
  { icon: "🚦", post: "The gateway and every service's balancer", net: "Load balancers · Episode 12", c: "--storage", d: "Spreading requests, routing around failures." },
  { icon: "⭕", post: "Where each piece of cached data lives", net: "Consistent hashing · Episode 13", c: "--cache", d: "So adding a cache server doesn't reshuffle everything." },
];

// Chapter starts in the published cut, from the episode's package.
episodePage({
  id: "e14", next: "e15", floor: "Floor 3 · Serving millions", accent: "--bad",
  title: ["How Netflix streams to ", h("em", { style: "color:var(--bad)" }, "the whole world")],
  lede: "More than 325 million paid memberships. On one night in November 2024, 65 million streams watched the same boxing match at the same moment. Keeping that many people watching uses every idea from floor three. Open the app, then press play.",
  hero: netflixHero(), wide: true,
  labs: [
    { id: "gateway", title: "The front door and the services behind it", lede: "Every call goes through one API gateway, which fans out to hundreds of small services. Break some and see what Maya still gets.", chapter: "1:04", s: 64, colour: "cache", mount: microLab },
    { id: "steering", title: "Press play: steering picks the server", lede: "Which video servers should this TV use? The ones that have the file, are healthy, and are closest.", chapter: "2:31", s: 151, colour: "storage", mount: steeringLab },
    { id: "fill", title: "Filling the boxes at night", lede: "Netflix mostly pushes: it predicts what each area will watch and copies it during quiet hours. How much has to fit?", chapter: "2:31", s: 151, colour: "good", mount: fillLab },
    { id: "abr", title: "Many versions, adaptive bitrate", lede: "Every title is encoded in many qualities and cut into chunks. Make Maya's Wi-Fi dip.", chapter: "2:31", s: 151, colour: "net", mount: abrLab },
    { id: "chaos", title: "Failure on purpose: Chaos Monkey", lede: "Netflix switches off its own servers, at random, during working hours. How many copies do you need?", chapter: "5:06", s: 306, colour: "bad", mount: chaosLab },
    { id: "live", title: "Where it struggles: live events", lede: "A new series can be copied the night before. A live fight can't.", chapter: "6:08", s: 368, colour: "storage", mount: liveLab },
    { id: "floor3", title: "Floor three, mapped", lede: "One evening of Netflix uses every idea from this floor. Flip each card.", chapter: "7:15", s: 435, colour: "good", mount: (b) => flipCards(b, CARDS, "That's floor three, inside Netflix.", "Keep the small decisions in the cloud, put the heavy video right next to the viewer, and expect everything to break.", ["At Netflix", "The idea"]) },
  ],
  quiz: {
    lede: "Split it into a control plane and a data plane. The control plane runs in the cloud: an API gateway in front of stateless microservices behind load balancers, with a distributed cache using consistent hashing. The data plane is a CDN: pre-encode every title into many qualities and short chunks, push popular titles to boxes near viewers overnight, and let players adapt their bitrate. Test it all by breaking it on purpose.",
    chapter: "8:15", s: 495,
    items: [
      { q: "Where do almost all of Netflix's bytes come from?", options: ["Amazon's cloud", "Open Connect, its own CDN", "The viewer's ISP's own servers"], answer: 1, why: "Browsing runs in the cloud; video streams from Open Connect boxes." },
      { q: "What does the API gateway (Zuul) do?", options: ["Encodes video", "Checks who's asking and routes each request to the right service", "Stores watch history"], answer: 1, why: "It's a layer 7 reverse proxy, the idea from Episode 12." },
      { q: "Recommendations are down. What should Maya see?", options: ["An error page", "A plainer home screen, and play still works", "Nothing at all"], answer: 1, why: "Non-critical services fall back instead of failing the whole app." },
      { q: "Her Wi-Fi dips mid-episode. What happens?", options: ["The video stops", "The next chunks are fetched in a lower quality", "The TV reconnects to the cloud"], answer: 1, why: "Adaptive bitrate picks each chunk's quality from the measured speed." },
      { q: "Why does Netflix run Chaos Monkey in working hours?", options: ["It's cheaper", "So failures are found while engineers are there to watch", "To test the CDN only"], answer: 1, why: "Find weaknesses on a normal Tuesday, not during a premiere." },
      { q: "Why are live events harder than a new series?", options: ["Live video is bigger", "Nothing can be copied ahead, and everyone wants the same newest chunk at once", "Live events use UDP"], answer: 1, why: "The overnight fill and the smooth evening curve both disappear." },
    ],
  },
  closing: "Keep the small decisions in the cloud, put the heavy video right next to the viewer, and expect everything to break.",
});
