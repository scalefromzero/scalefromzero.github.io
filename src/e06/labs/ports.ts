import { lib } from "../../kit/libs";
import { h, sfx, takeaway, reducedMotion } from "../../kit/ui";

const APPS = [
  { port: 51514, name: "Web browser", icon: "🌐", proto: "TCP", note: "temporary port; the bank's website listens on 443" },
  { port: 50000, name: "Video call", icon: "🎥", proto: "UDP", note: "example port" },
  { port: 51820, name: "Music app", icon: "🎵", proto: "TCP", note: "example port" },
];

/** An IP address finds the device; a port finds the app. Address a packet and watch where it goes. */
export async function portsLab(bench: HTMLElement) {
  const flats = APPS.map((a) => h("div.flat", { "data-port": a.port }, h("span", { style: "font-size:1.4rem" }, a.icon), h("b", {}, a.name), h("span.mono", {}, `${a.proto} · port ${a.port}`), h("span.faint", { style: "font-size:0.72rem" }, a.note)));
  const building = h("div.building", {}, h("div.roof", {}, h("span.eyebrow", {}, "Maya's laptop"), h("b.mono", {}, "203.0.113.42")), ...flats);
  const portSel = h("select#pt-port", { "aria-label": "Port on the label" }, ...[...APPS.map((a) => a.port), 443, 3000].map((p) => h("option", { value: p }, String(p)))) as HTMLSelectElement;
  const noPort = h("input#pt-none", { type: "checkbox" }) as HTMLInputElement;
  const pkt = h("div.postcard", { style: "max-width:330px" });
  const go = h("button.btn.primary", { type: "button", style: "justify-self:start" }, "Deliver the packet");
  const say = h("p.dim", { "aria-live": "polite", style: "min-height:3em" }, "Three apps share one IP address. The port number picks the app.");
  const count = h("span.v.tnum", { style: "color:var(--cache)" }, "0");
  function label() {
    pkt.innerHTML = `<span class="eyebrow">The packet's label</span><div class="pc-row"><span>TO</span><b class="mono">203.0.113.42${noPort.checked ? "" : `<span style="color:var(--cache)">:${portSel.value}</span>`}</b><span class="faint">${noPort.checked ? "address only" : "address + port"}</span></div>`;
  }
  [portSel, noPort].forEach((e) => e.addEventListener("change", () => { label(); sfx("tick", 0.15); }));
  go.addEventListener("click", async () => {
    flats.forEach((f) => f.classList.remove("hit", "miss", "ask"));
    if (noPort.checked) { flats.forEach((f) => f.classList.add("ask")); say.textContent = "Which one is the packet for? With only an IP address, the laptop can't tell."; sfx("miss", 0.2); return; }
    const p = +portSel.value, f = flats.find((x) => +x.dataset.port! === p);
    const { animate } = await lib.motion();
    if (!reducedMotion()) await animate(pkt, { x: [0, 24, 0] }, { duration: 0.35 });
    if (f) { f.classList.add("hit"); say.textContent = `Port ${p}: straight to the ${APPS.find((a) => a.port === p)!.name.toLowerCase()}.`; sfx("hit", 0.2); }
    else { say.innerHTML = p === 443 ? "Port 443 is where secure <i>websites</i> listen. Maya's laptop isn't a website, so nothing answers here: for TCP that's <b>connection refused</b>." : `Nothing lives at port ${p}. For TCP, that's <b>connection refused</b>: the handshake is turned away.`; sfx("miss", 0.2); }
  });
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:12px; align-content:start" }, pkt,
        h("label.field", { for: "pt-port" }, "Port on the label", portSel),
        h("label.row", { for: "pt-none", style: "gap:8px; color:var(--dim)" }, noPort, "Leave the port off"), go, say,
        h("div.stat", {}, count, h("span.k", {}, "ports on every device (0 to 65,535)"))),
      building,
    ),
    h("p.note", {}, "443 is the standard port for secure websites, on the website's side. The ports on Maya's laptop are examples: apps usually get a temporary one each time they connect."),
    takeaway("An IP address finds the device. The port is the apartment number after the street address."),
  );
  label();
  const { animate } = await lib.motion();
  const io = new IntersectionObserver((e) => { if (!e[0].isIntersecting) return; io.disconnect(); if (reducedMotion()) { count.textContent = "65,536"; return; } animate(0, 65536, { duration: 1.6, onUpdate: (v) => (count.textContent = Math.round(v).toLocaleString("en-US")) }); });
  io.observe(count);
}
