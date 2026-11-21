import { SEASON, type Episode, at, pad } from "./season";

type Attrs = Record<string, string | number | boolean | EventListener | undefined>;

/** Tiny element builder: h("div.card#x", { onclick }, child, "text") */
export function h<K extends keyof HTMLElementTagNameMap>(sel: K | string, attrs: Attrs = {}, ...kids: (Node | string | null | undefined | false)[]): HTMLElement {
  const [tagPart, ...rest] = sel.split(/(?=[.#])/);
  const el = document.createElement(tagPart || "div");
  for (const r of rest) {
    if (r.startsWith(".")) el.classList.add(r.slice(1));
    else if (r.startsWith("#")) el.id = r.slice(1);
  }
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v as EventListener);
    else if (k === "html") el.innerHTML = String(v);
    else el.setAttribute(k, v === true ? "" : String(v));
  }
  for (const k of kids) if (k !== null && k !== undefined && k !== false) el.append(k);
  return el;
}

/** Path back to the site root from the current page ("." for the hub, ".." inside /eNN/). */
export const ROOT = /\/e\d\d(\/|\/index\.html)?$/.test(location.pathname) ? "../" : "./";
export const $ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector(s) as T;
export const css = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
export const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
export const fmt = (n: number, d = 0) => n.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d });

/* ── Per-viewer storage (best effort) ── */
export const store = {
  get<T>(k: string, fallback: T): T {
    try { const v = localStorage.getItem("sfz:" + k); return v === null ? fallback : (JSON.parse(v) as T); } catch { return fallback; }
  },
  set(k: string, v: unknown) { try { localStorage.setItem("sfz:" + k, JSON.stringify(v)); } catch { /* storage blocked */ } },
};

/* ── Sound effects from the videos (off until the viewer turns them on) ── */
const sfxCache = new Map<string, HTMLAudioElement>();
let soundOn = store.get("sound", false);
export function sfx(name: "pop" | "hit" | "miss" | "whoosh" | "tick" | "powerdown", vol = 0.35) {
  if (!soundOn) return;
  let a = sfxCache.get(name);
  if (!a) { a = new Audio(`${ROOT}sfx/${name}.mp3`); sfxCache.set(name, a); }
  const c = a.cloneNode() as HTMLAudioElement;
  c.volume = vol;
  c.play().catch(() => {});
}

/* ── Shared chrome ── */
export function topbar(current?: Episode) {
  const base = current && current.id !== "e00" ? "../" : "./";
  const home = base + "index.html";
  const prev = current ? SEASON.find((e) => e.n === current.n - 1 && e.site) : undefined;
  const next = current ? SEASON.find((e) => e.n === current.n + 1 && e.site) : undefined;
  const soundBtn = h("button.btn", { type: "button", "aria-pressed": String(soundOn), title: "Sound effects from the video" }, soundOn ? "Sound on" : "Sound off");
  soundBtn.addEventListener("click", () => {
    soundOn = !soundOn; store.set("sound", soundOn);
    soundBtn.setAttribute("aria-pressed", String(soundOn)); soundBtn.textContent = soundOn ? "Sound on" : "Sound off";
    sfx("pop");
  });
  const rail = h("div.progress-rail", { "aria-hidden": "true" });
  const bar = h("header.topbar", {},
    h("div.wrap", {},
      h("a.brand", { href: home, "aria-label": "Scale From Zero, season home" }, h("img", { src: `${ROOT}img/logo.svg`, alt: "" }), h("span", { html: "Scale <b>From Zero</b>" })),
      h("nav", { "aria-label": "Episodes" },
        current && current.id !== "e00" ? h("a.optional", { href: home + "#season" }, "All episodes") : h("a.optional", { href: "#season" }, "Episodes"),
        prev && prev.id !== "e00" ? h("a.optional", { href: `${base}${prev.id}/index.html` }, `← E${pad(prev.n)}`) : null,
        next ? h("a.optional", { href: `${base}${next.id}/index.html` }, `E${pad(next.n)} →`) : null,
        soundBtn,
      ),
    ),
    rail,
  );
  document.body.prepend(bar);
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    rail.style.transform = `scaleX(${max > 0 ? clamp(scrollY / max, 0, 1) : 0})`;
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

export function footer() {
  document.body.append(
    h("footer.footer", {},
      h("div.wrap", {},
        h("div", {}, h("b", {}, "Scale From Zero"), " · build software that scales, one floor at a time."),
        h("div", {}, "Numbers are rounded, order-of-magnitude figures; real hardware varies. Interactive labs built with open-source libraries: three.js, GSAP, D3, Chart.js, Matter.js, PixiJS, anime.js, Motion, Rough.js."),
      ),
    ),
  );
}

/** A lab section tied to a video chapter. */
export function lab(opts: { id: string; ep: Episode; num: number; title: string; lede: string; chapter: string; seconds: number; colour?: string }) {
  const link = at(opts.ep, opts.seconds);
  const tc = link
    ? h("a.timecode", { href: link, target: "_blank", rel: "noopener", title: "Watch this part of the episode" }, `▶ ${opts.chapter}`)
    : h("span.timecode", { title: "Chapter time in the episode" }, `Video ${opts.chapter}`);
  const bench = h("div.bench");
  const sec = h("section.lab", { id: opts.id, style: opts.colour ? `--accent: var(--${opts.colour})` : undefined },
    h("div.wrap", {},
      h("div.lab-head", {},
        h("div.intro", {}, h("span.eyebrow", {}, `Lab ${pad(opts.num)}`), h("h2", {}, opts.title), h("p.dim", {}, opts.lede)),
        h("div.lab-meta", {}, tc),
      ),
      bench,
    ),
  );
  return { sec, bench };
}

export function takeaway(text: string) {
  return h("p.takeaway", {}, h("b", {}, text));
}

/** Run `init` once when `el` comes near the viewport, so heavy labs don't all start at once. */
export function whenNear(el: Element, init: () => void | Promise<void>) {
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { io.disconnect(); Promise.resolve(init()).catch((err) => console.error(err)); }
  }, { rootMargin: "600px 0px" });
  io.observe(el);
}

/** Multiple-choice quiz with explanations. */
export function quiz(items: { q: string; options: string[]; answer: number; why: string }[]) {
  const box = h("div.quiz");
  let score = 0, answered = 0;
  const result = h("p.dim", { "aria-live": "polite" }, `0 of ${items.length} answered`);
  items.forEach((it, qi) => {
    const why = h("p.why", { hidden: true }, it.why);
    const opts = h("div.opts");
    it.options.forEach((o, oi) => {
      const b = h("button.btn.opt", { type: "button" }, o) as HTMLButtonElement;
      b.addEventListener("click", () => {
        if (opts.dataset.done) return;
        opts.dataset.done = "1";
        answered++;
        const right = oi === it.answer;
        if (right) score++;
        b.classList.add(right ? "right" : "wrong");
        (opts.children[it.answer] as HTMLElement).classList.add("right");
        why.hidden = false;
        sfx(right ? "hit" : "miss");
        result.textContent = `${score} of ${answered} right` + (answered === items.length ? (score === items.length ? ". Perfect run." : ". Try the labs again for the ones you missed.") : "");
      });
      opts.append(b);
    });
    box.append(h("div.q", {}, h("h3", {}, `${qi + 1}. ${it.q}`), opts, why));
  });
  box.append(result);
  return box;
}
