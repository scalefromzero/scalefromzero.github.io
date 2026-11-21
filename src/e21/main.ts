import "../kit/theme.css";
import "../kit/labs.css";
import "../e05/e05.css";
import "../e04/e04.css";
import "../kit/extra.css";
import { h } from "../kit/ui";
import { episodePage } from "../kit/episode";
import { durabilityHero, keysLab, ninesLab, presignLab, multipartLab, mistakesLab, lifecycleLab } from "./labs";
import { flipCards } from "../e05/labs/postoffice";

const CARDS = [
  { icon: "🎟️", post: "A ticket with a unique number", net: "The key", c: "--net", d: "Unique in the bucket." },
  { icon: "🧥", post: "Racks behind the counter, maybe in several rooms", net: "Pieces across data centres", c: "--storage", d: "You never see them, and that's the point." },
  { icon: "🙋", post: "Show the ticket, get the coat back", net: "GET", c: "--good", d: "And PUT to hand one in." },
  { icon: "🏷️", post: "\"Blue, with a scarf\" on the ticket", net: "Metadata", c: "--cache", d: "The searchable facts live in a database." },
  { icon: "🔁", post: "Can't swap a button while it's checked in", net: "Objects are replaced whole", c: "--bad", d: "Take it out, hand in a new one." },
];

// Chapter times are ESTIMATES from the script's word counts (calibrated on E16); replace with the package's chapters once E21 is rendered.
episodePage({
  id: "e21", next: "e22", floor: "Floor 5 · Data at scale", accent: "--net",
  title: ["Where the internet ", h("em", { style: "color:var(--net)" }, "keeps its files")],
  lede: "Amazon S3 holds more than 500 trillion objects and answers over 200 million requests a second. Store ten million files, and expect to lose one about every ten thousand years. Spread a video across three data centres, then burn one down.",
  hero: durabilityHero(),
  labs: [
    { id: "keys", title: "Buckets and keys", lede: "It looks like folders. It isn't. Rename one and count the copies.", chapter: "2:15", s: 135, colour: "net", mount: keysLab },
    { id: "nines", title: "Eleven nines", lede: "How often would you expect to lose one file?", chapter: "2:51", s: 171, colour: "good", mount: ninesLab },
    { id: "presign", title: "Upload and serve", lede: "The app server hands out a pre-signed link and never touches the bytes.", chapter: "3:52", s: 232, colour: "storage", mount: presignLab },
    { id: "multipart", title: "Sam's upload, on a weak signal", lede: "Four gigabytes over a connection that keeps dropping.", chapter: "4:27", s: 267, colour: "cache", mount: multipartLab },
    { id: "mistakes", title: "When things break", lede: "Overwrite a file under an old key. Then make the bucket public.", chapter: "5:03", s: 303, colour: "bad", mount: mistakesLab },
    { id: "lifecycle", title: "Cheaper as it ages", lede: "Lifecycle rules move old files to colder storage.", chapter: "6:02", s: 362, colour: "good", mount: lifecycleLab },
    { id: "coatcheck", title: "The coat check", lede: "Object storage as a cloakroom at a huge venue. Flip each card.", chapter: "6:30", s: 390, colour: "net", mount: (b) => flipCards(b, CARDS, "That's object storage, as a coat check.", "Object storage is a giant, flat, nearly unbreakable dictionary of names to files, and the database just keeps the labels.", ["Cloakroom", "Object storage"]) },
  ],
  quiz: {
    lede: "Store media and large files as objects in a bucket under unique keys, with metadata in a database holding the key. Upload directly from the client with pre-signed URLs and multipart upload, so app servers never carry the bytes. Serve popular files through a CDN, use lifecycle rules for cold data, and mention eleven nines through replication across data centres, private buckets by default, and versioning.",
    chapter: "7:33", s: 453,
    items: [
      { q: "Is videos/sam/trip.mp4 inside a folder called sam?", options: ["Yes", "No, the slashes are just part of one flat key", "Only on Linux"], answer: 1, why: "Object storage is a flat dictionary from names to files." },
      { q: "How does object storage survive a whole data centre burning down?", options: ["Backups on tape", "Pieces and recovery pieces spread across several buildings", "A bigger disk"], answer: 1, why: "Any building can fail and the file is rebuilt from the rest." },
      { q: "Where do you search for every video by Sam, sorted by likes?", options: ["The bucket", "The database, which stores each object's key", "The CDN"], answer: 1, why: "The database keeps the labels; the bucket holds the bytes." },
      { q: "Why give the phone a pre-signed URL?", options: ["It's faster to type", "It uploads straight to the bucket, so app servers never carry the bytes", "It encrypts the file"], answer: 1, why: "One upload, one key, a few minutes." },
      { q: "Why upload a 4 GB video in parts?", options: ["Parts are cheaper", "A dropped connection only resends one part", "Buckets only take small files"], answer: 1, why: "Multipart upload." },
      { q: "You upload a new file under an old key, without versioning. What happens?", options: ["Both are kept", "The old file is replaced and gone", "The upload fails"], answer: 1, why: "Turn on versioning so it can be undone." },
    ],
  },
  closing: "Object storage is a giant, flat, nearly unbreakable dictionary of names to files, and the database just keeps the labels.",
});
