import { h, sfx, takeaway, fmt } from "../kit/ui";
import { seg, stat } from "../kit/episode";

/** One big hosts file for the whole internet: fine at a few hundred lines, impossible at 400 million. */
export function hostsLab(bench: HTMLElement) {
  const n = h("input#hs-n", { type: "range", min: 2, max: 8.62, step: 0.01, value: 2.5 }) as HTMLInputElement;
  const nOut = h("output", {});
  const down = h("input#hs-down", { type: "checkbox" }) as HTMLInputElement;
  const file = h("pre.term", { style: "height:150px", "aria-label": "The hosts file" });
  const sSize = stat("size of the one list", "--storage"), sDl = stat("for every device to download it once", "--net"), sCh = stat("changes to approve every day", "--bad");
  const say = h("p.dim", { "aria-live": "polite", style: "min-height:3em" });
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:12px; align-content:start" },
        h("label.field", { for: "hs-n" }, h("span", {}, "Names on the internet: ", nOut), n),
        h("label.row", { for: "hs-down", style: "gap:8px; color:var(--dim)" }, down, "The one office that keeps the list goes offline"),
        h("div.stats", {}, sSize.el, sDl.el, sCh.el), say),
      file,
    ),
    h("p.note", {}, "About 40 bytes per line, a 10 Mbit/s download, and 1% of names changing each day are illustrative. Today there are about 411.6 million registered domain names (Verisign, Q3 2026)."),
    takeaway("One list, kept in one place, simply cannot work at the size of the internet."),
  );
  const names = ["maya-laptop", "bank", "example", "office-printer", "news", "shop", "mail", "video", "games", "school"];
  function draw() {
    const N = Math.round(10 ** +n.value);
    nOut.textContent = N >= 1e6 ? `${fmt(N / 1e6, 1)} million` : fmt(N);
    const bytes = N * 40;
    sSize.v.textContent = bytes >= 1e9 ? `${fmt(bytes / 1e9, 1)} GB` : bytes >= 1e6 ? `${fmt(bytes / 1e6, 1)} MB` : `${fmt(bytes / 1e3, 1)} KB`;
    const sec = (bytes * 8) / 10e6;
    sDl.v.textContent = sec < 1 ? "< 1 s" : sec < 120 ? `${fmt(sec)} s` : `${fmt(sec / 60)} min`;
    sCh.v.textContent = fmt(Math.max(1, Math.round(N * 0.01)));
    const lines = ["# hosts: every computer's name and number", ...Array.from({ length: 7 }, (_, i) => `203.0.113.${10 + i}    ${names[i]}`), N > 10 ? `# … ${fmt(Math.max(0, N - 7))} more lines` : ""];
    file.textContent = lines.join("\n");
    file.style.opacity = down.checked ? "0.35" : "1";
    say.innerHTML = down.checked ? '<b style="color:var(--bad)">The office is down.</b> No new names, no changes, and new devices can\'t get the list at all.' : N < 5000 ? "A few hundred computers: the file is tiny, lookups are instant, and there's one source of truth." : N < 1e6 ? "It's getting heavy. Every change waits for one office, and every copy is out of date within hours." : "Hundreds of millions of names: the list is out of date before anyone finishes downloading it.";
    sSize.v.style.color = N > 1e6 ? "var(--bad)" : "var(--storage)";
  }
  n.addEventListener("input", draw); down.addEventListener("change", () => { draw(); sfx(down.checked ? "powerdown" : "hit", 0.25); });
  draw();
}

/** Read a name right to left: root, top level, domain, and whoever each one hands over to. */
export function splitLab(bench: HTMLElement) {
  const input = h("input#sp-name", { type: "text", value: "www.example.com", spellcheck: "false", autocomplete: "off", "aria-label": "A web address", style: "font: 600 var(--step-0) var(--mono); padding:10px 12px; border-radius:10px; border:1px solid var(--line); background:var(--bg); color:var(--text); width:100%" }) as HTMLInputElement;
  const tree = h("div", { style: "display:grid; gap:8px" });
  const presets = seg("Examples", [["www.example.com", "www.example.com"], ["mail.example.co.uk", "mail.example.co.uk"], ["docs.example.org", "docs.example.org"]], "www.example.com", (v) => { input.value = v; draw(); sfx("tick", 0.15); });
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:12px; align-content:start" }, h("label", { for: "sp-name", class: "eyebrow" }, "Type any web address"), input, presets,
        h("p.dim", {}, "Read it from right to left. Each level only knows who runs the level directly below it.")),
      tree,
    ),
    takeaway("Split the name and hand out the pieces. That handing over of responsibility is called delegation, and it's the whole trick."),
  );
  const C = ["--storage", "--cache", "--net", "--good", "--ram", "--cpu"];
  function draw() {
    const parts = input.value.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0].split(".").filter(Boolean);
    tree.innerHTML = "";
    const levels = [{ label: ".", who: "The root. Knows who runs every top-level name like .com, .org and .uk.", c: C[0] }];
    for (let i = parts.length - 1; i >= 0; i--) {
      const name = parts.slice(i).join(".");
      const depth = parts.length - i;
      const who = depth === 1 ? `The .${name} servers. Know who runs every name ending in .${name}.` : i === 0 ? `Whoever runs ${parts.slice(1).join(".")} decides what ${name} points to.` : `${name}'s own servers. Hold its real addresses, and can hand out names below it.`;
      levels.push({ label: depth === 1 ? `.${name}` : name, who, c: C[Math.min(depth, C.length - 1)] });
    }
    levels.forEach((l, i) => tree.append(h("div.box", { style: `--bc: var(${l.c}); min-height:auto; margin-left:${Math.min(i, 5) * 18}px` }, h("b.mono", {}, l.label), h("span", {}, l.who))));
  }
  input.addEventListener("input", draw);
  draw();
}

/** Be the resolver: follow the referrals yourself. */
export function resolverLab(bench: HTMLElement) {
  const SERVERS = [
    { k: "root", name: "A root server", c: "--storage" },
    { k: "org", name: "The .org servers", c: "--cache" },
    { k: "auth", name: "example.org's servers", c: "--good" },
  ] as const;
  let step = 0, asks = 0;
  const log = h("div.logs", { style: "height:170px; white-space:pre-wrap", "aria-live": "polite" });
  const known = h("p.mono", { style: "margin:0; font-size:0.8rem; color:var(--dim)" });
  const buttons = h("div", { style: "display:grid; gap:8px" });
  const reset = h("button.btn", { type: "button" }, "Start again");
  const add = (t: string, cls = "ok") => { log.append(h("div", { class: cls }, t)); log.scrollTop = 1e9; };
  function knownText() { known.textContent = step === 0 ? "You know: the root servers' addresses (built in)." : step === 1 ? "You know: who runs .org." : step === 2 ? "You know: who runs example.org." : "You know: shop.example.org → 203.0.113.25"; }
  SERVERS.forEach((s, i) => {
    const b = h("button.btn", { type: "button", style: `justify-content:flex-start; border-color:var(${s.c})` }, `Ask ${s.name}`);
    b.addEventListener("click", () => {
      if (step > 2) return;
      asks++;
      if (i > step) { add(`You don't know where ${s.name} are yet. Ask someone higher up first.`, "err"); sfx("miss", 0.2); return; }
      add(`→ ${s.name}: where is shop.example.org?`);
      if (i < step) { add(`  ${s.name}: I already told you: ask ${SERVERS[step].name}.`, "err"); sfx("miss", 0.2); return; }
      if (i === 0) add("  Root: I don't know, but here are the servers for .org.");
      if (i === 1) add("  .org: I don't know either. Here are example.org's servers.");
      if (i === 2) { add("  example.org: shop.example.org is 203.0.113.25. Keep it for 300 s.", "ok"); add(`Done in ${asks} question${asks > 1 ? "s" : ""}. These last servers are authoritative: they hold the real answer.`); sfx("hit", 0.3); }
      else sfx("pop", 0.2);
      step++; knownText();
    });
    buttons.append(b);
  });
  reset.addEventListener("click", () => { step = 0; asks = 0; log.innerHTML = ""; add("Maya's laptop asks you: where is shop.example.org?"); knownText(); });
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:12px; align-content:start" }, h("span.eyebrow", {}, "You are the resolver"), buttons, known, reset),
      log,
    ),
    h("p.note", {}, "203.0.113.25 is reserved for examples. Real resolvers also remember each referral, so next time they skip straight to .org."),
    takeaway("Three hops, and the name is a number. Each server only knows the next step."),
  );
  reset.click();
}
