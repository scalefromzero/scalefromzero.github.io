import { h, sfx, takeaway } from "../../kit/ui";

const CARDS = [
  { icon: "✉️", post: "A postcard", net: "A packet", c: "--net", d: "Too much to say? Send a stack of them." },
  { icon: "🏷️", post: "The address on each card", net: "The IP address", c: "--good", d: "Where it came from and where it's going." },
  { icon: "🏤", post: "A sorting office", net: "A router", c: "--cache", d: "Reads the address, sends the card to the next office closer to home, without knowing the full route." },
  { icon: "🚢", post: "Ships between continents", net: "Undersea cables", c: "--ram", d: "Almost all traffic between continents goes this way." },
  { icon: "🔢", post: "Numbers on the cards", net: "TCP", c: "--storage", d: "So the reader can put them back in order. Next episode." },
];

type Card = { icon: string; post: string; net: string; c: string; d: string };

/** The whole idea as a post office. Flip each card to see what it is on the internet. */
export function postOfficeLab(bench: HTMLElement) {
  flipCards(bench, CARDS, "That's the whole internet, as a post office.", "The internet doesn't send messages. It forwards small labelled packets, one hop at a time.");
}

/** Post-office flip cards, shared by episodes that map an analogy. */
export function flipCards(bench: HTMLElement, CARDS: Card[], doneText: string, take: string) {
  const grid = h("div.flip-grid");
  let flipped = 0;
  const say = h("p.dim", { "aria-live": "polite" }, "Tap a card to flip it.");
  CARDS.forEach((c) => {
    const card = h("button.flip", { type: "button", style: `--fc: var(${c.c})`, "aria-label": `${c.post}. Tap to see what it is on the internet.` },
      h("div.face", {}, h("span.k", {}, "Post office"), h("span", { style: "font-size:2rem" }, c.icon), h("b", {}, c.post)),
      h("div.face.back", {}, h("span.k", {}, "Internet"), h("b", {}, c.net), h("span.d", {}, c.d)));
    card.addEventListener("click", () => {
      const on = card.classList.toggle("turned");
      if (on && !card.dataset.seen) { card.dataset.seen = "1"; flipped++; }
      say.textContent = flipped === CARDS.length ? doneText : `${flipped} of ${CARDS.length} flipped.`;
      sfx("pop", 0.2);
    });
    grid.append(card);
  });
  bench.append(grid, say, takeaway(take));
}
