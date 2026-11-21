import { h, sfx, takeaway } from "../../kit/ui";

/** Keep the seat list on the server's own disk, or on separate machines? Then break the server. */
export function dataLab(bench: HTMLElement) {
  let mode: "local" | "db" = "local";
  let bookings = 3, broken = false;
  const seg = h("div.seg", { role: "group", "aria-label": "Where the seat list lives" });
  const bL = h("button", { type: "button", "aria-pressed": "true" }, "On the server's own disk");
  const bD = h("button", { type: "button", "aria-pressed": "false" }, "In a separate database");
  seg.append(bL, bD);
  const srv = h("div.box", { style: "--bc: var(--cpu)" });
  const db = h("div.box", { style: "--bc: var(--storage)" });
  const out = h("p", { "aria-live": "polite", style: "min-height:2.6em; font-family:var(--head); font-size:var(--step-1)" });
  const book = h("button.btn.primary", { type: "button" }, "Book a seat");
  const kill = h("button.btn", { type: "button", style: "border-color:var(--bad)" }, "The server breaks");
  const fix = h("button.btn", { type: "button", hidden: true }, "Start a new server");
  const paint = () => {
    srv.innerHTML = ""; db.innerHTML = "";
    srv.append(h("b", {}, broken ? "Server (broken)" : "Server"), h("span", {}, broken ? "✗ not responding" : "answers requests"));
    if (mode === "local") srv.append(h("span", { style: `color:var(${broken ? "--bad" : "--storage"})` }, broken ? "seat list: gone with it" : `seat list on its disk · ${bookings} bookings`));
    srv.style.opacity = broken ? "0.55" : "1";
    db.hidden = mode === "local";
    db.append(h("b", {}, "Database"), h("span", {}, "separate machines built to store data"), h("span", { style: "color:var(--good)" }, `seat list · ${bookings} bookings`));
  };
  const set = (m: typeof mode) => { mode = m; bookings = 3; broken = false; bL.setAttribute("aria-pressed", String(m === "local")); bD.setAttribute("aria-pressed", String(m === "db")); fix.hidden = true; kill.hidden = false; out.textContent = ""; paint(); sfx("pop", 0.2); };
  bL.addEventListener("click", () => set("local"));
  bD.addEventListener("click", () => set("db"));
  book.addEventListener("click", () => { if (broken) { out.innerHTML = "<span style='color:var(--bad)'>No server to take the booking.</span>"; sfx("miss", 0.3); return; } bookings++; paint(); sfx("tick", 0.25); out.textContent = `Booked. ${bookings} bookings saved.`; });
  kill.addEventListener("click", () => {
    broken = true; kill.hidden = true; fix.hidden = false; sfx("powerdown", 0.35);
    if (mode === "local") { out.innerHTML = `<span style="color:var(--bad)">Every booking broke with it.</span> The seat list lived on that one machine.`; }
    else out.innerHTML = `<span style="color:var(--storage)">The server is down, but the ${bookings} bookings are safe</span> in the database.`;
    paint();
  });
  fix.addEventListener("click", () => {
    broken = false; fix.hidden = true; kill.hidden = false;
    if (mode === "local") { bookings = 0; out.innerHTML = `<span style="color:var(--bad)">New server, empty disk: 0 bookings.</span> Fans who paid have no seats.`; sfx("miss", 0.35); }
    else { out.innerHTML = `<span style="color:var(--good)">New server connects to the database: all ${bookings} bookings are there.</span>`; sfx("hit", 0.35); }
    paint();
  });
  paint();
  bench.append(seg, h("div.lane-track", { style: "grid-template-columns: repeat(2, minmax(0,1fr)); margin-top:14px" }, srv, db), h("div.row", { style: "margin-top:12px" }, book, kill, fix), out,
    takeaway("Data lives on separate machines built to store it. Servers can come and go; the kitchen stays."));
}
