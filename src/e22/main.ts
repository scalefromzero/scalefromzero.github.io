import "../kit/theme.css";
import "../kit/labs.css";
import "../e05/e05.css";
import "../e04/e04.css";
import "../kit/extra.css";
import { h } from "../kit/ui";
import { episodePage } from "../kit/episode";
import { queueHero, inlineLab, ackLab, pubsubLab, logLab, dlqLab } from "./labs";
import { flipCards } from "../e05/labs/postoffice";

const CARDS = [
  { icon: "🧾", post: "The waiter clips an order ticket to the rail", net: "Producer and queue", c: "--net", d: "Then goes back to the tables." },
  { icon: "👩‍🍳", post: "Each cook takes the next ticket when they're free", net: "Consumers", c: "--good", d: "At their own pace." },
  { icon: "📌", post: "The ticket stays on the spike until the dish goes out", net: "Acknowledgement", c: "--storage", d: "No order forgotten." },
  { icon: "📋", post: "Drinks, mains and dessert copied to each station", net: "Publish-subscribe", c: "--cache", d: "Everyone gets their own copy." },
  { icon: "🗑️", post: "A ticket nobody can read goes to the manager's tray", net: "Dead letter queue", c: "--bad", d: "A human looks at it." },
];

episodePage({
  id: "e22", next: "e23", floor: "Floor 5 · Data at scale", accent: "--storage",
  title: ["Do it later, ", h("em", { style: "color:var(--storage)" }, "never lose it")],
  lede: "On Prime Day, one Amazon queue service peaked at 213 million messages a second. LinkedIn says Kafka handles over seven trillion a day. Throw a thousand uploads at once at a queue, then let it start more workers.",
  hero: queueHero(),
  labs: [
    { id: "inline", title: "Do it all now?", lede: "Convert, thumbnail, notify and index, all inside the upload request. Then knock the notifier over.", chapter: "1:42", s: 102, colour: "bad", mount: inlineLab },
    { id: "ack", title: "Acknowledge", lede: "A worker crashes halfway. Is the job lost, or done twice?", chapter: "3:09", s: 189, colour: "storage", mount: ackLab },
    { id: "pubsub", title: "Publish and subscribe", lede: "One event, many services. Then add a new one.", chapter: "3:43", s: 223, colour: "cache", mount: pubsubLab },
    { id: "log", title: "Logs and partitions", lede: "Messages that stay after they're read, split across machines by key.", chapter: "4:13", s: 253, colour: "net", mount: logLab },
    { id: "dlq", title: "The poison message", lede: "A corrupt video crashes every consumer that touches it.", chapter: "5:23", s: 323, colour: "bad", mount: dlqLab },
    { id: "kitchen", title: "The kitchen", lede: "A message queue as a restaurant kitchen. Flip each card.", chapter: "6:56", s: 416, colour: "storage", mount: (b) => flipCards(b, CARDS, "That's a message queue, as a kitchen.", "A message queue lets one part of a system say this happened, and lets the rest deal with it safely, at their own pace.", ["Kitchen", "Queues"]) },
  ],
  quiz: {
    lede: "Accept the request quickly, write durable state, and publish an event to a topic. Consumers subscribe and process asynchronously, scaling with queue depth. Delivery is at least once, so consumers are idempotent, with retries, back-off and a dead letter queue. Use a log like Kafka for high throughput, replay or per-key ordering, and a simple queue for independent jobs. The trade-off: eventual completion instead of instant results.",
    chapter: "7:55", s: 475,
    items: [
      { q: "Why put the video conversion on a queue?", options: ["It's faster to convert", "Sam gets \"received\" in a second and the slow work happens afterwards", "Queues compress video"], answer: 1, why: "Decoupling the request from the work." },
      { q: "A consumer crashes before acknowledging. What happens to the message?", options: ["It's lost", "It reappears after a timeout and another consumer takes it", "The queue stops"], answer: 1, why: "At-least-once delivery." },
      { q: "So what must every consumer be?", options: ["Fast", "Safe to repeat (idempotent)", "Written in Java"], answer: 1, why: "A job can occasionally run twice." },
      { q: "A captions service is added next month. What changes in the upload code?", options: ["A new API call", "Nothing; it subscribes to the topic", "A new database"], answer: 1, why: "Publish-subscribe." },
      { q: "What does a log like Kafka allow that a simple queue doesn't?", options: ["Replaying history, since reading doesn't delete", "Smaller messages", "No partitions"], answer: 0, why: "Each consumer tracks its own offset." },
      { q: "A corrupt message keeps crashing consumers. Fix?", options: ["Retry forever", "Move it to a dead letter queue after a few tries", "Delete the queue"], answer: 1, why: "A human can look at it." },
    ],
  },
  closing: "A message queue lets one part of a system say this happened, and lets the rest deal with it safely, at their own pace.",
});
