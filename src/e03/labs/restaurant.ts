import { lib } from "../../kit/libs";
import { h, sfx, takeaway, reducedMotion } from "../../kit/ui";

const PAIRS = [
  { r: "The customer", rd: "sits down and asks", a: "Client", ad: "your phone or browser. Its job is to ask.", c: "--net" },
  { r: "The waiter", rd: "carries the order", a: "Server", ad: "a computer whose only job is answering requests", c: "--cpu" },
  { r: "The kitchen", rd: "keeps ingredients, cooks", a: "Database", ad: "where the app keeps what it must never lose", c: "--storage" },
  { r: "The shelf by the door", rd: "dishes already made", a: "Cache", ad: "answers asked for again and again, ready to go", c: "--cache" },
  { r: "The host", rd: "picks the next waiter", a: "Load balancer", ad: "spreads requests so no server drowns", c: "--ram" },
  { r: "The manager", rd: "clipboard, watches the room", a: "Monitoring", ad: "logs, metrics and alerts", c: "--bad" },
];

/** Restaurant ↔ app: flip every card between the two views. */
export function restaurantLab(bench: HTMLElement) {
  const cards = PAIRS.map((p) => {
    const b = h("button.flip", { type: "button", style: `--fc: var(${p.c})`, "aria-label": `${p.r}: tap to see the app part` },
      h("div.face", {}, h("span.k", {}, "Restaurant"), h("b", {}, p.r), h("span.d", {}, p.rd)),
      h("div.face.back", {}, h("span.k", {}, "In an app"), h("b", {}, p.a), h("span.d", {}, p.ad)));
    b.addEventListener("click", () => { b.classList.toggle("turned"); sfx("whoosh", 0.18); });
    return b;
  });
  const all = h("button.btn.primary", { type: "button" }, "Flip them all");
  let turned = false;
  all.addEventListener("click", async () => {
    turned = !turned;
    all.textContent = turned ? "Back to the restaurant" : "Flip them all";
    if (reducedMotion()) { cards.forEach((c) => c.classList.toggle("turned", turned)); return; }
    const { stagger, createTimer } = await lib.anime();
    void stagger;
    cards.forEach((c, i) => createTimer({ duration: i * 90, onComplete: () => { c.classList.toggle("turned", turned); sfx("tick", 0.12); } }));
  });
  bench.append(h("div.row", { style: "margin-bottom:14px" }, all), h("div.flip-grid", {}, ...cards),
    takeaway("Every app you use is built just like this restaurant. Each machine has a single job."));
}
