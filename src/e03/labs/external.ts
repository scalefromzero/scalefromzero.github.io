import { flow } from "../../kit/flow";
import { h, sfx, takeaway } from "../../kit/ui";

/** Build payments yourself, or call another company's service? */
export function externalLab(bench: HTMLElement) {
  const JOBS = [
    "Connect to banks and card networks",
    "Follow the card industry's security rules",
    "Catch fraud before money moves",
    "Pass regular security audits",
    "Handle refunds and disputes",
    "Keep it running at 3 a.m. on sale day",
  ];
  const done = new Set<number>();
  const meter = h("i", { style: "width:0%; background:var(--storage)" });
  const status = h("p.dim", { "aria-live": "polite" }, "Tick what you'd have to build yourself.");
  const list = h("div.checklist", {}, ...JOBS.map((j, i) => {
    const cb = h("input", { type: "checkbox", id: `job${i}` }) as HTMLInputElement;
    cb.addEventListener("change", () => { cb.checked ? done.add(i) : done.delete(i); meter.style.width = `${(done.size / JOBS.length) * 100}%`; status.textContent = done.size === JOBS.length ? "All of that before TixRush sells a single ticket. Months of work, and a team to run it." : `${done.size} of ${JOBS.length} jobs. Each one is a project of its own.`; sfx("tick", 0.15); });
    return h("label", { for: `job${i}` }, cb, j);
  }));
  const f = flow([
    { key: "server", name: "TixRush server", sub: "calls the service", colour: "cpu" },
    { key: "pay", name: "Payment service", sub: "e.g. Stripe", colour: "good" },
    { key: "bank", name: "Fan's bank", sub: "approves the charge", colour: "storage" },
  ]);
  const pay = h("button.btn.primary", { type: "button" }, "Charge $85 for seat 12");
  const out = h("p.dim", { "aria-live": "polite" });
  pay.addEventListener("click", async () => {
    ["server", "pay", "bank"].forEach((k) => f.note(k, ""));
    await f.travel(["server", "pay", "bank"], 0.45);
    f.note("bank", "approved");
    await f.travel(["bank", "pay", "server"], 0.4);
    f.note("server", "✓ charged");
    out.textContent = "One request to another company's machines. They handle the banks, the rules and the fraud checks.";
    sfx("hit", 0.3);
  });
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:10px; align-content:start" }, h("span.eyebrow", {}, "Build it yourself"), list, h("div.meter", { style: "grid-template-columns: 6em minmax(0,1fr)" }, h("span", {}, "effort"), h("div.track", {}, meter)), status),
      h("div", { style: "display:grid; gap:10px; align-content:start" }, h("span.eyebrow", {}, "Or pay a company that already does it"), f.el, h("div.row", {}, pay), out),
    ),
    h("p.note", {}, "The same goes for emails, text messages and maps. These are external services: other teams' machines, which your app pays to use."),
    takeaway("A restaurant doesn't print its own money. Apps don't build their own payments."),
  );
}
