/** Season 1 of Scale From Zero: one entry per episode.
 *  To publish an episode's companion site: create the folder eNN/ (copy e01/ as a pattern), set `site: true`,
 *  and paste the YouTube link into `youtube` once the video is public. Chapter links then jump to the right second. */

export type Layer = "storage" | "ram" | "cache" | "cpu" | "net";

export interface Episode {
  id: string; // "e01"
  n: number;
  title: string;
  floor: 0 | 1 | 2 | 3 | 4 | 5;
  blurb: string;
  site: boolean; // companion site exists
  youtube: string; // full https://youtu.be/… link, or "" until published
  thumb?: string; // in public/img
}

export const FLOORS: { n: number; name: string; colour: Layer }[] = [
  { n: 1, name: "One machine", colour: "storage" },
  { n: 2, name: "How the web works", colour: "net" },
  { n: 3, name: "Serving millions", colour: "ram" },
  { n: 4, name: "Real time", colour: "cache" },
  { n: 5, name: "Data at scale", colour: "cpu" },
];

export const SEASON: Episode[] = [
  { id: "e00", n: 0, floor: 0, site: true, youtube: "", thumb: "img/e00.jpg", title: "Why System Design Matters When AI Writes the Code", blurb: "AI lays the bricks. Someone still has to draw the plan." },
  { id: "e01", n: 1, floor: 1, site: true, youtube: "", thumb: "img/e01.jpg", title: "Inside One Computer", blurb: "Bits, storage, RAM, CPU and cache, and why the same pattern runs the internet." },
  { id: "e02", n: 2, floor: 1, site: true, youtube: "", thumb: "img/e02.jpg", title: "When the Cache Is Wrong", blurb: "Caching, and why apps show seats that don't exist." },
  { id: "e03", n: 3, floor: 1, site: true, youtube: "", thumb: "img/e03.jpg", title: "What's Really Behind Every App", blurb: "The map of a real app, one box at a time." },
  { id: "e04", n: 4, floor: 1, site: true, youtube: "", thumb: "img/e04.jpg", title: "Why 99.9% Uptime Still Means 9 Hours Down", blurb: "How to measure a system: latency, percentiles, nines." },
  { id: "e05", n: 5, floor: 2, site: true, youtube: "", thumb: "img/e05.jpg", title: "How a Message Crosses the Internet", blurb: "Packets, routers and undersea cables." },
  { id: "e06", n: 6, floor: 2, site: true, youtube: "", thumb: "img/e06.jpg", title: "TCP vs UDP", blurb: "Reliable or fast: the two ways to send." },
  { id: "e07", n: 7, floor: 2, site: true, youtube: "", thumb: "img/e07.jpg", title: "DNS, the Internet's Phone Book", blurb: "How a name becomes an address." },
  { id: "e08", n: 8, floor: 2, site: true, youtube: "", thumb: "img/e08.jpg", title: "HTTP, the Language of the Web", blurb: "Requests, responses and status codes." },
  { id: "e09", n: 9, floor: 2, site: true, youtube: "", thumb: "img/e09.jpg", title: "What Really Happens When You Type google.com", blurb: "Every step, including HTTPS." },
  { id: "e10", n: 10, floor: 3, site: true, youtube: "", thumb: "img/e10.jpg", title: "APIs, the Contracts Behind Every App", blurb: "REST, GraphQL, gRPC and versioning." },
  { id: "e11", n: 11, floor: 3, site: true, youtube: "", thumb: "img/e11.jpg", title: "CDNs, the Internet Next Door", blurb: "Why your video comes from down the road." },
  { id: "e12", n: 12, floor: 3, site: false, youtube: "", title: "Load Balancers, One Address, a Thousand Machines", blurb: "Spreading requests and surviving failures." },
  { id: "e13", n: 13, floor: 3, site: false, youtube: "", title: "Consistent Hashing, Add a Server Without Chaos", blurb: "The ring that moves one user in six." },
  { id: "e14", n: 14, floor: 3, site: false, youtube: "", title: "How Netflix Streams to the Whole World", blurb: "Case study: Open Connect and chaos." },
  { id: "e15", n: 15, floor: 4, site: false, youtube: "", title: "WebSockets, When the Server Talks First", blurb: "Open lines instead of asking again." },
  { id: "e16", n: 16, floor: 4, site: false, youtube: "", title: "How WhatsApp Delivers 100 Billion Messages a Day", blurb: "Case study: ticks, waiting rooms, encryption." },
  { id: "e17", n: 17, floor: 5, site: false, youtube: "", title: "SQL Databases, Where Data Lives for Years", blurb: "Tables, indexes and ACID." },
  { id: "e18", n: 18, floor: 5, site: false, youtube: "", title: "NoSQL, When Data Doesn't Fit in Tables", blurb: "Four shapes of database." },
  { id: "e19", n: 19, floor: 5, site: false, youtube: "", title: "Replication and Sharding, Copies and Slices", blurb: "Copies for reads, slices for writes." },
  { id: "e20", n: 20, floor: 5, site: false, youtube: "", title: "The CAP Theorem, Why You Can't Have Everything", blurb: "What to give up when the network splits." },
  { id: "e21", n: 21, floor: 5, site: false, youtube: "", title: "Object Storage, Where the Internet Keeps Its Files", blurb: "Buckets, keys and eleven nines." },
  { id: "e22", n: 22, floor: 5, site: false, youtube: "", title: "Message Queues, Do It Later, Never Lose It", blurb: "Producers, consumers and dead letters." },
  { id: "e23", n: 23, floor: 5, site: false, youtube: "", title: "How Instagram Works", blurb: "Case study: IDs, feeds and likes." },
  { id: "e24", n: 24, floor: 5, site: false, youtube: "", title: "How YouTube Works, the Season Finale", blurb: "Case study: uploads, transcoding, recommendations." },
];

export const byId = (id: string) => SEASON.find((e) => e.id === id)!;
export const pad = (n: number) => String(n).padStart(2, "0");

/** A YouTube link that starts at `seconds`, or "" if the video isn't public yet. */
export function at(ep: Episode, seconds: number): string {
  if (!ep.youtube) return "";
  const u = new URL(ep.youtube);
  u.searchParams.set("t", String(Math.max(0, Math.floor(seconds))));
  return u.toString();
}
