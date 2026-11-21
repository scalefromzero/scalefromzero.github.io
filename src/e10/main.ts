import "../kit/theme.css";
import "../kit/labs.css";
import "../e05/e05.css";
import "../e04/e04.css";
import "../kit/extra.css";
import { h } from "../kit/ui";
import { episodePage } from "../kit/episode";
import { contractHero, restLab, graphqlLab } from "./labs1";
import { protoLab, pageLab, idempotencyLab, rateLab, styleLab } from "./labs2";
import { flipCards } from "../e05/labs/postoffice";

const CARDS = [
  { icon: "🔌", post: "The socket's shape", net: "The API contract", c: "--net", d: "What you can ask for, what you must send, what you'll get back." },
  { icon: "🔦", post: "Any appliance with the right plug", net: "Any app that follows the API", c: "--good", d: "Written by anyone, in any language." },
  { icon: "🏭", post: "The power station behind the wall", net: "The server's implementation", c: "--cache", d: "Hidden. It can be rebuilt without the app noticing." },
  { icon: "🔁", post: "Old sockets staying in the walls for years", net: "Versioning", c: "--storage", d: "/v2 arrives; /v1 keeps running while people move." },
  { icon: "⚡", post: "The fuse that trips", net: "The rate limit", c: "--bad", d: "One appliance drawing too much can't black out the house." },
];

// Chapter starts in the published cut, from the episode's package.
episodePage({
  id: "e10", next: "e11", floor: "Floor 3 · Serving millions", accent: "--net",
  title: ["APIs, the ", h("em", { style: "color:var(--net)" }, "contracts"), " behind every app"],
  lede: "When you open an app on your phone, it isn't loading a web page. It's talking to an API. And when one of those APIs changes a single field the wrong way, apps all over the world can break overnight. Try it.",
  hero: contractHero(), wide: true,
  labs: [
    { id: "rest", title: "REST: resources and verbs", lede: "Videos, users, comments: nouns with addresses. The HTTP methods from Episode 8 are the verbs. This little API runs in your browser.", chapter: "3:27", s: 207, colour: "storage", mount: restLab },
    { id: "graphql", title: "GraphQL: ask for exactly what you need", lede: "To draw one screen, REST might need many requests and send fields nobody uses. Pick the fields and compare.", chapter: "4:07", s: 247, colour: "cache", mount: graphqlLab },
    { id: "grpc", title: "gRPC: compact, strict, fast", lede: "The contract is a schema, and messages are packed into bytes. Here's the same video as JSON and as real protobuf.", chapter: "4:41", s: 281, colour: "good", mount: protoLab },
    { id: "pages", title: "Maya's home screen, ten at a time", lede: "Ten videos and a page token. Scroll for more. Then see what happens without a limit.", chapter: "5:16", s: 316, colour: "net", mount: pageLab },
    { id: "idempotency", title: "The payment that ran twice", lede: "A phone on a weak connection sends a payment, doesn't hear back, and tries again.", chapter: "5:49", s: 349, colour: "bad", mount: idempotencyLab },
    { id: "styles", title: "No style is perfect", lede: "REST, GraphQL or gRPC? Pick the one that fits each job.", chapter: "6:22", s: 382, colour: "storage", mount: styleLab },
    { id: "limits", title: "Rate limits", lede: "One app has a bug and calls the API in a tight loop. Everyone else slows down, unless every client has a limit.", chapter: "6:54", s: 414, colour: "bad", mount: rateLab },
    { id: "socket", title: "The wall socket", lede: "The whole idea as a wall socket. Flip each card.", chapter: "7:30", s: 450, colour: "good", mount: (b) => flipCards(b, CARDS, "That's an API, as a wall socket.", "An API is a promise. Say exactly what you'll accept and return, and never break it without a new version.", ["Wall socket", "API"]) },
  ],
  quiz: {
    lede: "Start with the resources. Map each action to a method and a path, like POST /v1/videos. Define the bodies and error codes. Add pagination with a limit and a page token, a version in the path, idempotency keys for anything that creates or charges, and rate limits per client. Then pick a style and say why.",
    chapter: "8:31", s: 511,
    items: [
      { q: "Which change can you make without breaking existing apps?", options: ["Rename a field", "Make a field required", "Add a new optional field"], answer: 2, why: "Old apps ignore fields they don't know. Renaming or requiring breaks them." },
      { q: "In REST, what does GET /v1/videos/42/comments mean?", options: ["Delete video 42", "Read the comments of video 42", "Create a comment"], answer: 1, why: "Nouns in the path, the HTTP method as the verb." },
      { q: "What problem does GraphQL mainly solve?", options: ["Encryption", "Screens needing many requests and getting unused fields", "Rate limiting"], answer: 1, why: "One query asks for exactly the fields needed, across resources, in one trip." },
      { q: "Where is gRPC most popular?", options: ["Between servers inside the data centre", "Public browser APIs", "Email"], answer: 0, why: "Compact binary messages and generated code suit server-to-server calls. Browsers need extra help to call it." },
      { q: "How does an idempotency key stop a double charge?", options: ["It encrypts the payment", "The server returns the first result if the same key arrives again", "It slows the app down"], answer: 1, why: "Retries carry the same key, so the server recognises the repeat." },
      { q: "A client goes over its rate limit. What status code should it get?", options: ["404", "429", "500"], answer: 1, why: "429 Too Many Requests: slow down and try again later." },
    ],
  },
  closing: "An API is a promise. Say exactly what you'll accept and return, and never break it without a new version.",
});
