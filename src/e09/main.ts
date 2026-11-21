import "../kit/theme.css";
import "../kit/labs.css";
import "../e05/e05.css";
import "../e04/e04.css";
import "../kit/extra.css";
import { h } from "../kit/ui";
import { episodePage } from "../kit/episode";
import { sixStopsHero, budgetLab, addressBarLab, sharedKeyLab, paintLab } from "./labs1";
import { certLab, tlsLab, renderLab, seesLab, lifetimeLab } from "./labs2";
import { flipCards } from "../e05/labs/postoffice";

const CARDS = [
  { icon: "✉️", post: "Filling in the envelope", net: "The browser completing the address", c: "--net", d: "google.com becomes https://google.com/." },
  { icon: "📖", post: "The phone book", net: "DNS", c: "--cache", d: "Turns the name into a street address." },
  { icon: "📮", post: "Registered mail", net: "TCP", c: "--storage", d: "Nothing lost, nothing out of order." },
  { icon: "🔏", post: "A sealed envelope + a passport check", net: "TLS", c: "--good", d: "Only the real recipient can open it." },
  { icon: "📝", post: "The letter inside", net: "HTTP", c: "--ram", d: "Asks for exactly what you want." },
  { icon: "🚢", post: "Sorting offices and ships", net: "Routers and undersea cables", c: "--cpu", d: "Everything in between." },
];

// Chapter starts in the published cut, from the episode's package.
episodePage({
  id: "e09", next: "e10", floor: "Floor 2 · How the web works", accent: "--good",
  title: ["What happens when you type ", h("em", { style: "color:var(--good)" }, "google.com")],
  lede: "Maya is in a café. She types google.com and presses Enter. In well under a second the page is there. In that moment, almost everything from the last four episodes happened, in order, and her laptop agreed on a secret with a stranger while anyone on the café Wi-Fi could listen.",
  hero: sixStopsHero(), wide: true,
  labs: [
    { id: "budget", title: "Six stops, under a second", lede: "Where does the time go? Change the distance, the TLS version, and first visit versus repeat.", chapter: "0:33", s: 33, colour: "good", mount: budgetLab },
    { id: "browser", title: "Stop 1: the browser", lede: "Maya never typed a full address. Is it a website or a search? Type anything.", chapter: "1:03", s: 63, colour: "net", mount: addressBarLab },
    { id: "lock", title: "Stop 4: a shared key", lede: "The simplest lock: both sides hold the same key. This one is real encryption, running in your browser.", chapter: "2:35", s: 155, colour: "good", mount: sharedKeyLab },
    { id: "paint", title: "Mixing a secret in public", lede: "How do two strangers agree on a key while everyone listens? With paint, then with real numbers.", chapter: "4:42", s: 282, colour: "storage", mount: paintLab },
    { id: "certs", title: "Certificates", lede: "How does Maya's laptop know it's really Google? Check five certificates like a browser does.", chapter: "5:19", s: 319, colour: "cache", mount: certLab },
    { id: "tls", title: "The TLS handshake", lede: "All of that happens in one round trip in TLS 1.3. The older version needed two. Race them.", chapter: "5:54", s: 354, colour: "good", mount: tlsLab },
    { id: "draw", title: "Stop 6: drawing the page", lede: "HTML becomes a tree, styles decide how it looks, layout decides where, and paint puts it on screen.", chapter: "6:29", s: 389, colour: "cpu", mount: renderLab },
    { id: "sees", title: "What the padlock doesn't hide", lede: "HTTPS hides what you say, not who you're talking to. And sometimes the authority itself is the problem.", chapter: "7:27", s: 447, colour: "bad", mount: seesLab },
    { id: "lifetimes", title: "Shorter and shorter certificates", lede: "The longest a certificate can last keeps dropping, so a stolen key stops working sooner.", chapter: "8:35", s: 515, colour: "storage", mount: lifetimeLab },
    { id: "journey", title: "The whole journey", lede: "All six stops as one trip through the post office. Flip each card.", chapter: "9:15", s: 555, colour: "good", mount: (b) => flipCards(b, CARDS, "That's the whole of floor two.", "Find the address, open a line, lock it, ask, receive, and draw.", ["Post office", "On the web"]) },
  ],
  quiz: {
    lede: "The browser completes the address, preferring HTTPS, and checks its caches. DNS resolves the name. The browser opens TCP, or QUIC on repeat visits. TLS does a key exchange, the server proves its identity with a certificate signed by a trusted authority, and everything after is encrypted. Then HTTP travels inside, and the browser parses, styles, runs scripts and paints.",
    chapter: "10:25", s: 625,
    items: [
      { q: "Why can't Maya's laptop just send the shared key over the café Wi-Fi?", options: ["It's too big", "Anyone listening would copy it", "Routers block keys"], answer: 1, why: "That's why a key exchange is needed: both sides compute the same secret without ever sending it." },
      { q: "What does a certificate prove?", options: ["That the site is honest", "That this public key belongs to this name, vouched for by a trusted authority", "That the connection is fast"], answer: 1, why: "It's a passport for the name. It says nothing about whether the site itself is trustworthy." },
      { q: "The café router copies Google's real certificate. Why does the attack still fail?", options: ["Certificates can't be copied", "It can't prove it holds Google's private key", "The browser checks the router's IP"], answer: 1, why: "The server must sign the handshake with the private key that matches the certificate." },
      { q: "How many round trips does a TLS 1.3 handshake need?", options: ["One", "Two", "Three"], answer: 0, why: "TLS 1.2 needed two. TLS 1.3 does the key exchange, certificate and signature in one." },
      { q: "With HTTPS, what can the café network still see?", options: ["Your password", "The website's name and IP address", "The page you're reading"], answer: 1, why: "HTTPS hides what you say, not who you're talking to." },
      { q: "In what order does the browser draw a page?", options: ["Paint, layout, tree", "Tree (DOM), styles, layout, paint", "Styles, paint, tree"], answer: 1, why: "It builds the tree, applies styles, works out where each box goes, then paints." },
    ],
  },
  closing: "Every page is six stops: find the address, open a line, lock it, ask, receive, and draw.",
});
