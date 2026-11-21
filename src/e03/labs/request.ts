import { flow } from "../../kit/flow";
import { h, sfx, takeaway, sleep, reducedMotion } from "../../kit/ui";

/** Maya taps Buy: her phone asks, the server (brain, desk, cabinet) answers. */
export function requestLab(bench: HTMLElement) {
  const f = flow([
    { key: "phone", name: "Maya's phone", sub: "the client · asks", colour: "net" },
    { key: "net", name: "The internet", sub: "carries the request", colour: "faint" },
    { key: "brain", name: "Server · brain", sub: "does the work", colour: "cpu" },
    { key: "desk", name: "Server · desk", sub: "what it's working on now (RAM)", colour: "ram" },
  ]);
  const out = h("p.dim", { "aria-live": "polite", style: "min-height:1.6em" }, "Tap Buy to send the request.");
  const buy = h("button.btn.primary", { type: "button" }, "Buy seat 12");
  let busy = false;
  buy.addEventListener("click", async () => {
    if (busy) return; busy = true;
    ["phone", "net", "brain", "desk"].forEach((k) => f.note(k, ""));
    out.textContent = "Request leaves the phone…";
    await f.travel(["phone", "net", "brain"], 0.45, (k) => { if (k === "brain") { f.note("brain", "checks the request"); sfx("tick", 0.25); } });
    await f.travel(["brain", "desk", "brain"], 0.3, (k) => { if (k === "desk") f.note("desk", "seat 12: free → booked"); });
    out.textContent = "The server writes the answer…";
    await sleep(reducedMotion() ? 0 : 250);
    await f.travel(["brain", "net", "phone"], 0.4);
    f.note("phone", "✓ Seat booked");
    out.innerHTML = "<b style='color:var(--good)'>Seat booked.</b> One request, one answer. The server has no screen and no keyboard; it just answers, day and night.";
    sfx("hit", 0.3); busy = false;
  });
  bench.append(f.el, h("div.row", { style: "margin-top:14px" }, buy), out,
    takeaway("The client asks, the server answers. Inside the server are the same parts from Episode 1: a brain, a desk and a cabinet."));
}
