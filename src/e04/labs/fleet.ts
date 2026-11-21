import { h, sfx, takeaway, fmt, sleep, reducedMotion } from "../../kit/ui";

const LOAD = 3300, CAP = 500;

/** Crash, update and grow a fleet of servers behind a load balancer, and lose the main database. */
export function fleetLab(bench: HTMLElement) {
  type S = { n: number; state: "up" | "dead" | "updating" | "new" };
  let servers: S[] = [], next = 1, dbMain = "A", dbSpare: string | null = "B", busy = false;
  const fleetEl = h("div.fleet4", { "aria-live": "polite" });
  const lbBox = h("div.box", { style: "--bc: var(--net); min-height:auto; text-align:center" }, h("b", {}, "Load balancer"), h("span", {}, "sends work only to healthy servers"));
  const dbRow = h("div", { style: "display:grid; grid-template-columns:1fr 1fr; gap:8px" });
  const capBar = h("i", { style: "width:0%" });
  const capText = h("b", {}, "");
  const say = h("p.dim", { "aria-live": "polite", style: "min-height:3em" }, "Ten servers, planned with room to spare. The sale is running at 3,300 requests a second.");
  const btn = (t: string) => h("button.btn", { type: "button" }, t);
  const bCrash = btn("Crash a server"), bUpd = btn("Update them, one at a time"), bAdd = btn("Add a server"), bDb = btn("Main database dies"), bReset = btn("Reset");
  function paint() {
    fleetEl.innerHTML = "";
    servers.forEach((s) => fleetEl.append(h(`div.srv.${s.state}`, {}, `S${s.n}`, h("br"), h("span", {}, s.state === "dead" ? "crashed" : s.state === "updating" ? "updating" : s.state === "new" ? "new" : "up"))));
    const up = servers.filter((s) => s.state === "up" || s.state === "new").length;
    const cap = up * CAP, ok = cap >= LOAD;
    capBar.style.width = `${Math.min(100, (LOAD / Math.max(cap, 1)) * 100)}%`;
    capBar.style.background = `var(${!ok ? "--bad" : LOAD / cap > 0.85 ? "--storage" : "--good"})`;
    capText.textContent = `${up} up · ${fmt(cap)}/s vs ${fmt(LOAD)}/s`;
    capText.style.color = ok ? "" : "var(--bad)";
    dbRow.innerHTML = "";
    dbRow.append(
      h("div.box", { style: "--bc: var(--storage); min-height:auto" }, h("b", {}, `Database ${dbMain}`), h("span", {}, "main copy · takes writes")),
      dbSpare ? h("div.box", { style: "--bc: var(--storage); min-height:auto; opacity:.75" }, h("b", {}, `Database ${dbSpare}`), h("span", {}, "spare · kept up to date")) : h("div.box", { style: "--bc: var(--bad); min-height:auto" }, h("b", {}, "No spare yet"), h("span", {}, "building a new one…")),
    );
    return ok;
  }
  function reset() { servers = Array.from({ length: 10 }, (_, i) => ({ n: i + 1, state: "up" as const })); next = 11; dbMain = "A"; dbSpare = "B"; say.textContent = "Ten servers, planned with room to spare. The sale is running at 3,300 requests a second."; paint(); }
  bCrash.addEventListener("click", () => {
    const alive = servers.filter((s) => s.state === "up" || s.state === "new");
    if (!alive.length) return;
    alive[Math.floor(alive.length / 2)].state = "dead";
    const ok = paint(); sfx(ok ? "powerdown" : "miss", 0.3);
    say.textContent = ok ? "A server crashed. The load balancer noticed and stopped sending it work. The others carry the load, because we planned room to spare." : "Too many servers down: the rest can't carry 3,300 a second. Requests start to queue. Add servers.";
  });
  bUpd.addEventListener("click", async () => {
    if (busy) return; busy = true;
    say.textContent = "Updating on purpose, calmly: take one server out, update it, put it back, then the next.";
    for (const s of servers) {
      if (s.state !== "up" && s.state !== "new") continue;
      s.state = "updating"; paint(); sfx("tick", 0.12);
      await sleep(reducedMotion() ? 0 : 320);
      s.state = "up"; paint();
    }
    say.textContent = "Every healthy server updated, and the sale never noticed.";
    sfx("hit", 0.25); busy = false;
  });
  bAdd.addEventListener("click", () => {
    servers.forEach((s) => { if (s.state === "new") s.state = "up"; });
    servers.push({ n: next++, state: "new" }); paint(); sfx("pop", 0.25);
    say.textContent = "Traffic grew? Add a server. The load balancer starts sending it work.";
  });
  bDb.addEventListener("click", async () => {
    if (!dbSpare) return;
    sfx("powerdown", 0.35);
    say.textContent = `Database ${dbMain} died. Database ${dbSpare} becomes the main copy…`;
    dbMain = dbSpare; dbSpare = null; paint();
    await sleep(reducedMotion() ? 0 : 1400);
    dbSpare = String.fromCharCode(dbMain.charCodeAt(0) + 1); paint(); sfx("hit", 0.25);
    say.textContent = `Database ${dbMain} is now the main copy, and we built a new spare, ${dbSpare}. Fans kept buying the whole time.`;
  });
  bReset.addEventListener("click", reset);
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:10px; align-content:start" }, bCrash, bUpd, bAdd, bDb, bReset),
      h("div", { style: "display:grid; gap:10px; min-width:0" }, lbBox, fleetEl,
        h("div.meter", { style: "grid-template-columns: 3.5em minmax(0,1fr) auto" }, h("span", {}, "Load"), h("div.track", {}, capBar), capText),
        dbRow, say),
    ),
    h("p.note", {}, "Each server handles 500 requests a second (illustrative). Green bar: comfortable. Amber: close to the limit. Red: not enough servers."),
    takeaway("Crashes, updates and growth are all the same move: the load balancer only sends work to healthy servers."),
  );
  reset();
}
