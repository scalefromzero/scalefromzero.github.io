import { h, sfx, takeaway, sleep, reducedMotion } from "../../kit/ui";

// Illustrative 14-hop path, New York to London, with reserved example addresses (as in the episode).
const HOPS: [string, string, number, string][] = [
  ["home router", "192.168.1.1", 2, "home"],
  ["internet provider", "203.0.113.1", 9, "isp"],
  ["provider, New York", "203.0.113.65", 11, "isp"],
  ["provider, New York", "203.0.113.129", 12, "isp"],
  ["backbone, New York", "198.51.100.1", 13, "bb"],
  ["backbone, New York", "198.51.100.17", 14, "bb"],
  ["backbone, New Jersey landing", "198.51.100.33", 15, "bb"],
  ["transatlantic cable", "198.51.100.49", 66, "sea"],
  ["backbone, Cornwall landing", "192.0.2.1", 67, "bb"],
  ["backbone, London", "192.0.2.17", 70, "bb"],
  ["backbone, London", "192.0.2.33", 71, "bb"],
  ["Sam's provider, London", "192.0.2.65", 72, "isp"],
  ["Sam's provider, London", "192.0.2.97", 73, "isp"],
  ["Sam's phone", "198.51.100.7", 75, "end"],
];
const COLOR: Record<string, string> = { home: "--net", isp: "--cache", bb: "--storage", sea: "--ram", end: "--good" };

/** Follow one packet hop by hop, the way traceroute prints it. */
export function traceLab(bench: HTMLElement) {
  const term = h("pre.term", { "aria-live": "polite" });
  const path = h("ol.hops");
  const run = h("button.btn.primary", { type: "button" }, "Run traceroute");
  const hopsChip = h("span.chip", {}, "0 hops");
  const copy = h("button.btn", { type: "button" }, "Copy the command");
  const os = h("select", { "aria-label": "Your computer" }, h("option", { value: "tracert bbc.co.uk" }, "Windows: tracert"), h("option", { value: "traceroute bbc.co.uk" }, "Mac or Linux: traceroute"));
  copy.addEventListener("click", async () => { try { await navigator.clipboard.writeText((os as HTMLSelectElement).value); copy.textContent = "Copied ✓"; } catch { copy.textContent = (os as HTMLSelectElement).value; } });
  HOPS.forEach(([name], i) => path.append(h("li", {}, h("span.n", {}, String(i + 1)), name)));
  let busy = false;
  run.addEventListener("click", async () => {
    if (busy) return; busy = true;
    term.textContent = "$ traceroute sam-phone.example\ntraceroute to 198.51.100.7, 30 hops max\n";
    [...path.children].forEach((li) => li.classList.remove("on"));
    for (const [i, [name, ip, ms, kind]] of HOPS.entries()) {
      await sleep(reducedMotion() ? 0 : kind === "sea" ? 900 : 260);
      const line = `${String(i + 1).padStart(2, " ")}  ${ip.padEnd(15, " ")} ${String(ms).padStart(3, " ")} ms   ${name}\n`;
      term.append(kind === "sea" ? Object.assign(document.createElement("span"), { textContent: line, style: "color:var(--ram)" }) : line);
      const li = path.children[i] as HTMLElement; li.classList.add("on"); li.style.setProperty("--hc", `var(${COLOR[kind]})`);
      hopsChip.textContent = `${i + 1} hop${i ? "s" : ""}`;
      sfx(kind === "sea" ? "whoosh" : "tick", kind === "sea" ? 0.25 : 0.08);
      term.scrollTop = term.scrollHeight;
    }
    sfx("hit", 0.25); busy = false;
  });
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:12px; align-content:start" }, h("div.row", {}, run, hopsChip), path),
      h("div", { style: "display:grid; gap:12px; align-content:start; min-width:0" }, term,
        h("p.dim", { style: "margin:0" }, "Notice the jump in time at the ocean: that one hop is about 5,500 km of glass."),
        h("span.eyebrow", {}, "Try it on your own computer"), h("div.row", {}, os, copy)),
    ),
    h("p.note", {}, "Illustrative trace with reserved example addresses, like the one in the episode. Your own run will show different names and times. Some networks hide their hops and print * instead."),
    takeaway("A packet often crosses a dozen or more routers before it arrives."),
  );
}
