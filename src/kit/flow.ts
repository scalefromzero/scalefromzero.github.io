import { lib } from "./libs";
import { h, reducedMotion } from "./ui";

export interface FlowNode { key: string; name: string; sub: string; colour: string }

/** A row of boxes with a glowing token that travels between them. Used for request journeys. */
export function flow(nodes: FlowNode[], cols = nodes.length) {
  const els: Record<string, HTMLElement> = {};
  const notes: Record<string, HTMLElement> = {};
  const token = h("div.token", { style: "top:0" });
  const track = h("div.lane-track", { style: `grid-template-columns: repeat(${cols}, minmax(0, 1fr))` });
  for (const n of nodes) {
    notes[n.key] = h("span.has", {}, "");
    els[n.key] = h("div.box", { style: `--bc: var(--${n.colour})` }, h("b", {}, n.name), h("span", {}, n.sub), notes[n.key]);
    track.append(els[n.key]);
  }
  track.append(token);
  const pos = (k: string) => {
    const tr = track.getBoundingClientRect(), b = els[k].getBoundingClientRect();
    return { x: b.left - tr.left + b.width / 2 - 11, y: b.top - tr.top + b.height / 2 - 11 };
  };
  /** Move the token along keys; `onArrive` runs at each stop. */
  async function travel(path: string[], dur = 0.45, onArrive?: (k: string, i: number) => void | Promise<void>, colour = "#EEF2FF") {
    const { gsap } = await lib.gsap();
    const d = reducedMotion() ? 0 : dur;
    token.style.background = colour;
    gsap.set(token, { ...pos(path[0]), opacity: 1 });
    await onArrive?.(path[0], 0);
    for (let i = 1; i < path.length; i++) {
      await gsap.to(token, { ...pos(path[i]), duration: d, ease: "power1.inOut" });
      await onArrive?.(path[i], i);
    }
    gsap.to(token, { opacity: 0, duration: 0.25 });
  }
  const note = (k: string, text: string, colour = "var(--good)") => { notes[k].textContent = text; notes[k].style.color = colour; els[k].classList.toggle("holds", !!text); };
  const glow = (k: string, on: boolean) => { els[k].style.boxShadow = on ? "0 0 0 2px var(--bc), 0 0 24px -4px var(--bc)" : ""; };
  return { el: track, travel, note, glow, els };
}
