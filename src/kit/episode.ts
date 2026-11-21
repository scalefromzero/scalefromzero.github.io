import { byId, pad } from "./season";
import { footer, h, lab, quiz, takeaway, topbar, whenNear } from "./ui";

export type LabDef = { id: string; title: string; lede: string; chapter: string; s: number; colour: string; mount: (b: HTMLElement) => void | Promise<void> };
type Q = Parameters<typeof quiz>[0];

/** Builds a standard episode page: hero, labs (each mounted when near), interview quiz and the next-episode link. */
export function episodePage(o: {
  id: string; next: string; floor: string; accent: string;
  title: (string | Node)[]; lede: string;
  hero: HTMLElement; onHero?: () => void | Promise<void>; wide?: boolean;
  labs: LabDef[];
  quiz: { lede: string; chapter: string; s: number; items: Q };
  closing: string;
}) {
  const ep = byId(o.id), next = byId(o.next);
  topbar(ep);
  const app = document.getElementById("app")!;
  const first = o.labs[0].id;
  const watch = ep.youtube ? h("a.btn", { href: ep.youtube, target: "_blank", rel: "noopener" }, `▶ Watch Episode ${ep.n}`) : h("a.btn", { href: `#${first}` }, "Start the labs ↓");
  app.append(
    h(`section.ep-hero${o.wide ? ".wide" : ""}#top`, {},
      h("div.wrap", {},
        h("div.copy", {},
          h("span.eyebrow", { style: `color:var(${o.accent})` }, `Episode ${pad(ep.n)} · ${o.floor}`),
          h("h1", {}, ...o.title),
          h("p.lede", {}, o.lede),
          h("div.row", {}, watch, h("a.btn", { href: "#quiz" }, "Test yourself")),
          h("nav.toc", { "aria-label": "Labs" }, ...o.labs.map((l, i) => h("a", { href: `#${l.id}` }, `${pad(i + 1)} ${l.title.split(/[,?]/)[0]}`))),
        ),
        o.hero,
      ),
    ),
  );
  if (o.onHero) whenNear(o.hero, () => o.onHero!());
  o.labs.forEach((L, i) => {
    const { sec, bench } = lab({ id: L.id, ep, num: i + 1, title: L.title, lede: L.lede, chapter: L.chapter, seconds: L.s, colour: L.colour });
    app.append(sec);
    whenNear(sec, () => L.mount(bench));
  });
  const { sec, bench } = lab({ id: "quiz", ep, num: o.labs.length + 1, title: "The interview answer", lede: o.quiz.lede, chapter: o.quiz.chapter, seconds: o.quiz.s, colour: "good" });
  bench.append(quiz(o.quiz.items),
    takeaway(o.closing),
    h("div.row", { style: "margin-top:16px" },
      next.site ? h("a.btn.primary", { href: `../${next.id}/index.html` }, `Episode ${pad(next.n)}: ${next.title} →`) : h("span.chip", {}, `Next: Episode ${pad(next.n)} · ${next.title} · lab opens with the video`),
      h("a.btn", { href: "../index.html#season" }, "All episodes")));
  app.append(sec);
  footer();
}

/** Small stat block: big value over a label. */
export const stat = (k: string, c = "--text", v = "–") => { const val = h("span.v.tnum", { style: `color:var(${c})` }, v); return { el: h("div.stat", {}, val, h("span.k", {}, k)), v: val }; };

/** Segmented control. Returns the element; calls onPick with the chosen value. */
export function seg<T>(label: string, options: [string, T][], initial: T, onPick: (v: T) => void) {
  const el = h("div.seg", { role: "group", "aria-label": label });
  options.forEach(([t, v]) => {
    const b = h("button", { type: "button", "aria-pressed": String(v === initial) }, t);
    b.addEventListener("click", () => { [...el.children].forEach((x) => x.setAttribute("aria-pressed", String(x === b))); onPick(v); });
    el.append(b);
  });
  return el;
}

/** Seeded random numbers, so every visitor sees the same run. */
export const seeded = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
