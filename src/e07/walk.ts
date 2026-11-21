import { lib } from "../kit/libs";
import { h, sfx, reducedMotion } from "../kit/ui";

const NS = "http://www.w3.org/2000/svg";
const NODES = {
  maya: { x: 82, y: 210, name: "Maya's laptop", c: "#38BDF8" },
  res: { x: 250, y: 210, name: "Resolver", c: "#A78BFA" },
  root: { x: 490, y: 70, name: "Root server  .", c: "#F5A524" },
  com: { x: 490, y: 210, name: ".com servers", c: "#F5A524" },
  auth: { x: 490, y: 350, name: "example.com's server", c: "#4ADE80" },
};
type K = keyof typeof NODES;

/** Hero: the resolver walks root → .com → example.com, then remembers. */
export function dnsWalkHero() {
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 580 420"); svg.setAttribute("role", "img"); svg.setAttribute("aria-label", "A DNS lookup: Maya's laptop asks a resolver, which asks the root, .com and example.com's servers");
  svg.style.cssText = "width:100%; height:auto; display:block";
  const links = document.createElementNS(NS, "g"), dots = document.createElementNS(NS, "g"), nodes = document.createElementNS(NS, "g");
  svg.append(links, nodes, dots);
  const line = (a: K, b: K) => { const l = document.createElementNS(NS, "line"); l.setAttribute("x1", String(NODES[a].x)); l.setAttribute("y1", String(NODES[a].y)); l.setAttribute("x2", String(NODES[b].x)); l.setAttribute("y2", String(NODES[b].y)); l.setAttribute("stroke", "#26315A"); l.setAttribute("stroke-width", "2"); links.append(l); };
  line("maya", "res"); line("res", "root"); line("res", "com"); line("res", "auth");
  const boxes: Record<string, SVGRectElement> = {};
  (Object.keys(NODES) as K[]).forEach((k) => {
    const n = NODES[k];
    const g = document.createElementNS(NS, "g"); g.setAttribute("transform", `translate(${n.x},${n.y})`);
    const r = document.createElementNS(NS, "rect"); r.setAttribute("x", "-76"); r.setAttribute("y", "-24"); r.setAttribute("width", "152"); r.setAttribute("height", "48"); r.setAttribute("rx", "10"); r.setAttribute("fill", "#121A36"); r.setAttribute("stroke", n.c); r.setAttribute("stroke-width", "2");
    const t = document.createElementNS(NS, "text"); t.setAttribute("text-anchor", "middle"); t.setAttribute("dy", "5"); t.setAttribute("fill", "#EEF2FF"); t.setAttribute("font-size", "12.5"); t.setAttribute("font-weight", "700"); t.textContent = n.name;
    g.append(r, t); nodes.append(g); boxes[k] = r;
  });
  const memo = document.createElementNS(NS, "text"); memo.setAttribute("x", "250"); memo.setAttribute("y", "262"); memo.setAttribute("text-anchor", "middle"); memo.setAttribute("fill", "#A78BFA"); memo.setAttribute("font-size", "11"); memo.setAttribute("font-family", "JetBrains Mono, monospace"); svg.append(memo);
  const log = h("div.logs", { style: "height:132px; white-space:pre-wrap", "aria-live": "polite" });
  const go = h("button.btn.primary", { type: "button" }, "Look up example.com");
  const forget = h("button.btn", { type: "button" }, "Empty the caches");
  const expire = h("button.btn", { type: "button" }, "Let the answer expire");
  const time = h("span.chip", {}, "0 ms");
  let cache = { com: false, answer: 0 }, busy = false;
  const say = (t: string, cls = "ok") => { log.append(h("div", { class: cls }, t)); while (log.children.length > 7) log.firstElementChild!.remove(); };
  async function hop(a: K, b: K, colour: string) {
    const { gsap } = await lib.gsap();
    const c = document.createElementNS(NS, "circle"); c.setAttribute("r", "7"); c.setAttribute("fill", colour); c.setAttribute("cx", String(NODES[a].x)); c.setAttribute("cy", String(NODES[a].y)); dots.append(c);
    await gsap.fromTo(c, { attr: { cx: NODES[a].x, cy: NODES[a].y } }, { attr: { cx: NODES[b].x, cy: NODES[b].y }, duration: reducedMotion() ? 0 : 0.5, ease: "power1.inOut" });
    c.remove(); boxes[b].setAttribute("stroke-width", "4"); setTimeout(() => boxes[b].setAttribute("stroke-width", "2"), 400);
  }
  go.addEventListener("click", async () => {
    if (busy) return; busy = true; log.innerHTML = "";
    let ms = 0;
    say("Maya: where is example.com?"); await hop("maya", "res", "#38BDF8"); ms += 2;
    if (cache.answer > 0) { say("Resolver: I remember. 203.0.113.10 (cached).", "ok"); ms += 1; await hop("res", "maya", "#4ADE80"); sfx("hit", 0.25); }
    else {
      if (!cache.com) { say("Resolver → root: where is example.com?"); await hop("res", "root", "#A78BFA"); say("Root: don't know. Ask the .com servers.", "err"); await hop("root", "res", "#F5A524"); ms += 30; sfx("tick", 0.15); }
      else say("Resolver: I already know who runs .com. Skip the root.");
      say("Resolver → .com: where is example.com?"); await hop("res", "com", "#A78BFA"); say("Ask example.com's own servers.", "err"); await hop("com", "res", "#F5A524"); ms += 30; sfx("tick", 0.15);
      say("Resolver → example.com's server…"); await hop("res", "auth", "#A78BFA"); say("Authoritative: 203.0.113.10 (TTL 3600 s)", "ok"); await hop("auth", "res", "#4ADE80"); ms += 30;
      await hop("res", "maya", "#4ADE80"); sfx("hit", 0.25);
      cache = { com: true, answer: 1 };
    }
    memo.textContent = cache.answer ? "remembers: example.com → 203.0.113.10" : cache.com ? "remembers who runs .com" : "";
    time.textContent = `≈ ${ms} ms`;
    say(cache.answer && ms < 10 ? "Answer from the cache: no walk needed." : "Three hops, and the name is a number.");
    busy = false;
  });
  expire.addEventListener("click", () => { if (!cache.answer) return; cache.answer = 0; memo.textContent = "remembers who runs .com"; say("The answer's time to live ran out. The resolver still knows who runs .com."); sfx("tick", 0.2); });
  forget.addEventListener("click", () => { cache = { com: false, answer: 0 }; memo.textContent = ""; log.innerHTML = ""; time.textContent = "0 ms"; sfx("whoosh", 0.2); });
  const el = h("div.bench", { style: "display:grid; gap:10px" }, svg, h("div.row", {}, go, expire, forget, time), log,
    h("p.note", { style: "margin:0" }, "203.0.113.10 is an address reserved for examples. Times are illustrative."));
  const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) { io.disconnect(); setTimeout(() => go.click(), 600); } });
  io.observe(el);
  return el;
}
