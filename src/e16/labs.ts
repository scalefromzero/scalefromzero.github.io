import { h, sfx, takeaway, fmt, sleep, reducedMotion } from "../kit/ui";
import { seg, stat } from "../kit/episode";
import { flow } from "../kit/flow";

const TICK = { sent: "✓", delivered: "✓✓", read: "✓✓" };
const tickEl = (state: keyof typeof TICK | "clock") => h("span", { style: `font-weight:700; color:${state === "read" ? "#38BDF8" : "#8b95b8"}` }, state === "clock" ? "🕓" : TICK[state]);

/** Hero: one message, end to end, with the ticks. Turn Sam's phone off and on. */
export function messageHero() {
  const f = flow([
    { key: "maya", name: "Maya's phone", sub: "locks the message", colour: "net" },
    { key: "a", name: "Chat server A", sub: "Maya's open line", colour: "good" },
    { key: "b", name: "Chat server B", sub: "Sam's open line", colour: "good" },
    { key: "sam", name: "Sam's phone", sub: "unlocks it", colour: "net" },
  ], 4);
  const online = h("input#wa-on", { type: "checkbox", checked: true }) as HTMLInputElement;
  const send = h("button.btn.primary", { type: "button" }, "Send \"Running late, 10 min\"");
  const open = h("button.btn", { type: "button" }, "Sam opens the chat");
  const bubble = h("div", { style: "justify-self:end; display:flex; gap:8px; align-items:center; padding:8px 12px; border-radius:14px; background:#1d4ed8; font-size:0.9rem; min-height:38px" }, "—");
  const say = h("p.dim", { "aria-live": "polite", style: "min-height:3em; margin:0" }, "WhatsApp keeps one open line from every phone to a chat server.");
  let state: "none" | "clock" | "sent" | "delivered" | "read" = "none", waiting = false, busy = false;
  const paint = () => { bubble.innerHTML = ""; if (state === "none") { bubble.textContent = "—"; return; } bubble.append("Running late, 10 min", tickEl(state)); };
  async function deliver() {
    await f.travel(["b", "sam"], reducedMotion() ? 0 : 0.5, undefined, "#4ADE80");
    f.note("b", ""); waiting = false;
    state = "delivered"; paint(); sfx("pop", 0.2);
    await f.travel(["sam", "b", "a", "maya"], reducedMotion() ? 0 : 0.3, undefined, "#94a3b8");
    say.textContent = "Two grey ticks: Sam's phone sent back a small receipt. Every tick is an acknowledgement.";
  }
  send.addEventListener("click", async () => {
    if (busy) return; busy = true; state = "clock"; paint();
    say.textContent = "Maya's phone locks the message with a key only Sam's phone has, then sends it up her open line.";
    await f.travel(["maya", "a"], reducedMotion() ? 0 : 0.5, undefined, "#A78BFA");
    state = "sent"; paint(); sfx("tick", 0.2);
    say.textContent = "One grey tick: the server has it. Server A looks up which server Sam is on, and hands it over.";
    await f.travel(["a", "b"], reducedMotion() ? 0 : 0.5, undefined, "#A78BFA");
    if (!online.checked) { waiting = true; f.note("b", "🔒 held, still encrypted", "var(--storage)"); say.textContent = "Sam's phone is off. Server B keeps the message, still locked, and sends a push notification through Apple or Google."; sfx("tick", 0.2); }
    else await deliver();
    busy = false;
  });
  online.addEventListener("change", async () => { sfx("tick", 0.15); if (online.checked && waiting && !busy) { busy = true; say.textContent = "Sam's phone reconnects. The waiting message flows down, and the server deletes its copy."; await deliver(); busy = false; } });
  open.addEventListener("click", async () => {
    if (state !== "delivered" || busy) return; busy = true;
    await f.travel(["sam", "b", "a", "maya"], reducedMotion() ? 0 : 0.3, undefined, "#38BDF8");
    state = "read"; paint(); sfx("hit", 0.2); say.textContent = "Two blue ticks: another receipt, travelling back the same way. Sam opened the chat."; busy = false;
  });
  return h("div.bench", { style: "display:grid; gap:12px" }, f.el,
    h("div.row", {}, send, open, h("label.row", { for: "wa-on", style: "gap:8px; color:var(--text)" }, online, "Sam's phone is on")),
    h("div", { style: "display:grid; padding:12px; border-radius:12px; background:#0b1124; border:1px solid var(--line)" }, h("span.eyebrow", {}, "Maya's chat with Sam"), bubble), say);
}

/** Routing: a registry of which server each connected phone is on. */
export function routingLab(bench: HTMLElement) {
  const PEOPLE = ["Maya", "Sam", "Ali", "Priya", "Tom", "Lena", "Omar", "Zoe"];
  const SERVERS = ["A", "B", "C"];
  let where: Record<string, string | null> = {};
  const r = () => SERVERS[Math.floor(Math.random() * 3)];
  const reg = h("pre.json", {});
  const grid = h("div", { style: "display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px" });
  const from = h("select#rt-from", { "aria-label": "Sender" }, ...PEOPLE.map((p) => h("option", { value: p }, p))) as HTMLSelectElement;
  const to = h("select#rt-to", { "aria-label": "Recipient" }, ...PEOPLE.map((p, i) => h("option", { value: p, selected: i === 1 }, p))) as HTMLSelectElement;
  const send = h("button.btn.primary", { type: "button" }, "Send");
  const crash = h("button.btn", { type: "button" }, "Crash server B");
  const say = h("p.dim", { "aria-live": "polite", style: "min-height:3em; margin:0" });
  function reset() { where = Object.fromEntries(PEOPLE.map((p, i) => [p, SERVERS[i % 3]])); draw(); say.textContent = "Every connected phone is attached to one chat server. The registry records which."; }
  function draw() {
    reg.innerHTML = `session registry\n${PEOPLE.map((p) => `  ${p.padEnd(6)} → ${where[p] ? `<span class="s">server ${where[p]}</span>` : '<span style="color:var(--faint)">offline</span>'}`).join("\n")}`;
    grid.innerHTML = "";
    SERVERS.forEach((s) => grid.append(h("div.box", { style: "--bc: var(--good); min-height:auto", "data-s": s }, h("b", {}, `Server ${s}`), h("span", {}, PEOPLE.filter((p) => where[p] === s).join(", ") || "—"))));
  }
  send.addEventListener("click", async () => {
    const a = from.value, b = to.value;
    if (!where[a]) { say.textContent = `${a} is offline and can't send right now.`; return; }
    const sa = where[a], sb = where[b];
    const box = (s: string) => grid.querySelector(`[data-s="${s}"]`) as HTMLElement;
    box(sa!).style.boxShadow = "0 0 0 2px var(--net)"; await sleep(reducedMotion() ? 0 : 350);
    if (sb) { box(sb).style.boxShadow = "0 0 0 2px var(--good)"; say.textContent = sa === sb ? `${a} and ${b} are both on server ${sa}: it pushes the message straight down ${b}'s line.` : `Server ${sa} looks up ${b} in the registry (server ${sb}) and hands the message over. Two servers, one lookup.`; sfx("hit", 0.2); }
    else { say.textContent = `${b} is offline. Server ${sa} keeps the message until ${b} reconnects.`; sfx("tick", 0.2); }
    setTimeout(() => draw(), 1200);
  });
  crash.addEventListener("click", () => { PEOPLE.forEach((p) => { if (where[p] === "B") where[p] = r() === "A" ? "A" : "C"; }); draw(); sfx("powerdown", 0.25); say.textContent = "Server B crashed. Its phones reconnected to A and C, the registry updated, and they pick up anything they missed."; });
  bench.append(
    h("div.bench-grid", {}, h("div", { style: "display:grid; gap:10px; align-content:start" }, h("div.row", {}, from, h("span", {}, "→"), to, send), crash, say, grid), reg),
    h("p.note", {}, "WhatsApp's servers were built in Erlang, which can run a tiny process for every connected phone. In January 2012 WhatsApp wrote that one server held over 2 million connections."),
    takeaway("Keep a record of which server each phone is on, and route each message server to server."),
  );
  reset();
}

/** Groups: one send, a copy for every member's device, and receipts from each. */
export function groupLab(bench: HTMLElement) {
  const size = h("input#gp-n", { type: "range", min: 2, max: 1024, step: 1, value: 50 }) as HTMLInputElement;
  const dev = h("input#gp-d", { type: "range", min: 1, max: 5, step: 1, value: 2 }) as HTMLInputElement;
  const off = h("input#gp-off", { type: "range", min: 0, max: 100, step: 1, value: 20 }) as HTMLInputElement;
  const sO = h("output", {}), dO = h("output", {}), oO = h("output", {});
  const sCopies = stat("encrypted copies the server delivers", "--net"), sNow = stat("delivered right away", "--good"), sWait = stat("held until those devices reconnect", "--storage"), sBlue = stat("receipts needed for two blue ticks", "--cache");
  const dots = h("div", { style: "display:flex; flex-wrap:wrap; gap:3px; max-height:180px; overflow:hidden" });
  function draw() {
    const n = +size.value, d = +dev.value, o = +off.value / 100;
    sO.textContent = String(n); dO.textContent = String(d); oO.textContent = `${off.value}%`;
    const members = n - 1, copies = members * d;
    sCopies.v.textContent = fmt(copies); sNow.v.textContent = fmt(Math.round(copies * (1 - o))); sWait.v.textContent = fmt(Math.round(copies * o)); sBlue.v.textContent = fmt(members);
    dots.innerHTML = "";
    for (let i = 0; i < Math.min(copies, 400); i++) dots.append(h("i", { style: `display:block; width:8px; height:8px; border-radius:2px; background:var(${i / Math.min(copies, 400) < 1 - o ? "--good" : "--storage"})` }));
  }
  [size, dev, off].forEach((x) => x.addEventListener("input", draw));
  bench.append(
    h("div.bench-grid", {}, h("div", { style: "display:grid; gap:12px; align-content:start" },
      h("label.field", { for: "gp-n" }, h("span", {}, "People in the group: ", sO), size),
      h("label.field", { for: "gp-d" }, h("span", {}, "Devices per person (phone + linked): ", dO), dev),
      h("label.field", { for: "gp-off" }, h("span", {}, "Devices offline right now: ", oO), off)),
      h("div", { style: "display:grid; gap:10px; align-content:start" }, h("div.stats", {}, sCopies.el, sNow.el, sWait.el, sBlue.el), dots)),
    h("p.note", {}, "Maya's phone sends the message once; the server fans it out. Since multi-device, each device has its own key, so each gets its own encrypted copy. Groups can hold up to 1,024 people; up to 4 linked devices per phone."),
    takeaway("A group message only shows two blue ticks once every member has read it."),
  );
  draw();
}

/** Real end-to-end encryption in your browser: two phones agree a key with ECDH; the server only sees scrambled bytes. */
export async function e2eLab(bench: HTMLElement) {
  const text = h("input#e2-t", { type: "text", value: "The spare key is under the blue pot", "aria-label": "Maya's message", style: "font: 500 0.9rem var(--body); padding:8px 10px; border-radius:8px; border:1px solid var(--line); background:var(--bg); color:var(--text); width:100%" }) as HTMLInputElement;
  const send = h("button.btn.primary", { type: "button", style: "justify-self:start" }, "Lock and send");
  const col = (t: string) => h("div", { style: "display:grid; gap:6px; align-content:start" }, h("span.eyebrow", {}, t));
  const maya = col("Maya's phone"), server = col("WhatsApp's server sees"), sam = col("Sam's phone");
  const mOut = h("pre.json", {}), sOut = h("pre.json", { style: "color:var(--faint)" }), samOut = h("pre.json", {});
  maya.append(mOut); server.append(sOut); sam.append(samOut);
  const tryServer = h("button.btn", { type: "button" }, "Server tries to read it");
  const verdict = h("p", { "aria-live": "polite", style: "min-height:2em; margin:0" });
  bench.append(
    h("div", { style: "display:grid; gap:10px" }, h("label.field", { for: "e2-t" }, "Message", text), h("div.row", {}, send, tryServer)),
    h("div", { style: "display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr)); gap:12px; margin-top:12px" }, maya, server, sam),
    verdict,
    h("p.note", {}, "Runs real ECDH (P-256) key agreement and AES-256-GCM with the Web Crypto API. WhatsApp uses the Signal protocol (since April 2016), which adds identity keys, signed pre-keys and a new key for every message; this shows the core idea only."),
    takeaway("WhatsApp's servers carry the message, store it and deliver it, but all they ever see is scrambled bytes."),
  );
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) { verdict.textContent = "This browser blocks the Web Crypto API here (it needs HTTPS)."; return; }
  const gen = () => subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveKey"]);
  const [mk, sk, server_] = await Promise.all([gen(), gen(), gen()]);
  const derive = (priv: CryptoKey, pub: CryptoKey) => subtle.deriveKey({ name: "ECDH", public: pub }, priv, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
  const kM = await derive(mk.privateKey, sk.publicKey), kS = await derive(sk.privateKey, mk.publicKey), kX = await derive(server_.privateKey, mk.publicKey);
  const fp = async (k: CryptoKey) => [...new Uint8Array(await subtle.exportKey("raw", k))].slice(0, 6).map((b) => b.toString(16).padStart(2, "0")).join(" ");
  const pubHex = async (k: CryptoKey) => [...new Uint8Array(await subtle.exportKey("raw", k))].slice(1, 7).map((b) => b.toString(16).padStart(2, "0")).join("");
  let iv = new Uint8Array(12), ct = new Uint8Array(0);
  send.addEventListener("click", async () => {
    iv = crypto.getRandomValues(new Uint8Array(12));
    ct = new Uint8Array(await subtle.encrypt({ name: "AES-GCM", iv }, kM, new TextEncoder().encode(text.value)));
    mOut.textContent = `public key: ${await pubHex(mk.publicKey)}…\nshared key: ${await fp(kM)} …\n\n"${text.value}"`;
    sOut.textContent = `from: Maya → to: Sam\n${[...ct].slice(0, 48).map((b) => b.toString(16).padStart(2, "0")).join(" ")} …`;
    await sleep(reducedMotion() ? 0 : 400);
    const pt = await subtle.decrypt({ name: "AES-GCM", iv }, kS, ct);
    samOut.textContent = `public key: ${await pubHex(sk.publicKey)}…\nshared key: ${await fp(kS)} …  (same!)\n\n"${new TextDecoder().decode(pt)}"`;
    verdict.innerHTML = '<span style="color:var(--good)">Both phones computed the same key from each other\'s public keys. It never crossed the network.</span>';
    sfx("hit", 0.2);
  });
  tryServer.addEventListener("click", async () => {
    if (!ct.length) return;
    try { await subtle.decrypt({ name: "AES-GCM", iv }, kX, ct); verdict.textContent = "?"; }
    catch { verdict.innerHTML = '<span style="color:var(--bad)">Decryption failed.</span> The server only has the public keys, so it can\'t compute the shared key.'; sfx("miss", 0.2); }
  });
  send.click();
}

/** Retries and duplicates: the phone resends, the server spots the same message ID. */
export function dedupLab(bench: HTMLElement) {
  const ids = h("input#dd-id", { type: "checkbox", checked: true }) as HTMLInputElement;
  const go = h("button.btn.primary", { type: "button", style: "justify-self:start" }, "Send while switching from Wi-Fi to mobile data");
  const log = h("pre.term", { style: "height:170px; white-space:pre-wrap" });
  const chat = h("div", { style: "display:grid; gap:6px; padding:12px; border-radius:12px; background:#0b1124; border:1px solid var(--line); min-height:120px; align-content:start" });
  go.addEventListener("click", () => {
    log.textContent = ""; chat.innerHTML = ""; chat.append(h("span.eyebrow", {}, "Sam's chat"));
    const id = `3EB0${Math.random().toString(16).slice(2, 10).toUpperCase()}`;
    const seen = new Set<string>(); let shown = 0;
    for (let i = 1; i <= 3; i++) {
      log.textContent += `→ send "On my way" ${ids.checked ? `id=${id}` : "(no id)"}\n`;
      const dup = ids.checked && seen.has(id);
      if (dup) log.textContent += "  server: already have this id → acknowledge, don't deliver again\n";
      else { seen.add(id); shown++; chat.append(h("div", { style: "justify-self:start; padding:6px 10px; border-radius:12px; background:var(--panel); font-size:0.85rem" }, "On my way")); log.textContent += "  server: delivered to Sam\n"; }
      log.textContent += i < 3 ? "← (acknowledgement lost while the network switched; phone retries)\n\n" : "← ✓ acknowledgement received\n";
    }
    sfx(shown > 1 ? "miss" : "hit", 0.2);
  });
  bench.append(
    h("div.bench-grid", {}, h("div", { style: "display:grid; gap:12px; align-content:start" }, h("label.row", { for: "dd-id", style: "gap:8px; color:var(--text)" }, ids, "Every message carries a unique ID"), go, chat), log),
    takeaway("The phone sends it again; the server spots the duplicate by its unique ID, so Sam only sees it once."),
  );
  go.click();
}

/** What encryption costs: what the server can and can't see. */
export function limitLab(bench: HTMLElement) {
  let mode: "e2e" | "server" = "e2e";
  const pick = seg("Encryption", [["End to end", "e2e"], ["Only between phone and server", "server"]], mode, (v) => { mode = v as typeof mode; draw(); sfx("tick", 0.15); });
  const list = h("div", { style: "display:grid; gap:6px" });
  function draw() {
    const e = mode === "e2e";
    const rows: [string, boolean][] = [["Who is messaging whom, and when", true], ["How often, and how big the messages are", true], ["The words in the message", !e], ["The photos and videos", !e], ["Search your history on the server", !e], ["Scan content for spam and abuse", !e], ["A backup the company can read", !e]];
    list.innerHTML = "";
    rows.forEach(([t, can]) => list.append(h("div.box", { style: `--bc: var(${can ? "--storage" : "--good"}); min-height:auto; flex-direction:row` }, h("b", {}, can ? "👁 server can" : "🔒 server can't"), h("span", {}, t))));
  }
  bench.append(h("div.bench-grid", {}, h("div", { style: "display:grid; gap:12px; align-content:start" }, pick,
    h("p.dim", { style: "margin:0" }, "End-to-end encryption has a price: features that need the content get harder, and spam is fought with signals around messages instead.")), list),
    h("p.note", {}, "Encrypted backups (since 2021) use a key only the user holds. Undelivered messages wait on the server for up to 30 days (WhatsApp privacy policy)."),
    takeaway("If the server can't read messages, it can't search them for you, or build features that need the content."));
  draw();
}
