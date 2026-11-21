import { h, sfx, takeaway, fmt } from "../../kit/ui";

const UDP = [["Source port", 2, "Which app sent it."], ["Destination port", 2, "Which app it's for."], ["Length", 2, "How big the packet is."], ["Checksum", 2, "A quick sum to spot damage on the way."]] as const;
const TCP = [
  ["Source port", 2, "Which app sent it."], ["Destination port", 2, "Which app it's for."],
  ["Sequence number", 4, "Where this data sits in the stream. TCP numbers every byte."],
  ["Acknowledgement number", 4, "\"I have everything up to here.\" The receipt."],
  ["Header length + flags", 2, "Includes SYN and ACK, the handshake flags."],
  ["Window", 2, "How much more the receiver can take right now."],
  ["Checksum", 2, "A quick sum to spot damage on the way."], ["Urgent pointer", 2, "Rarely used."],
] as const;

/** UDP's label is eight bytes. TCP's is at least twenty. Tap a field; slide the payload to see the overhead. */
export function headersLab(bench: HTMLElement) {
  const info = h("p", { "aria-live": "polite", style: "min-height:3em; margin:0" }, "Tap a field to see what it's for.");
  const bar = (fields: readonly (readonly [string, number, string])[], colour: string, total: number) => h("div.hdr", { style: `grid-template-columns:${fields.map(([, b]) => `${b}fr`).join(" ")} ${20 - total}fr` },
    ...fields.map(([n, b, d]) => { const x = h("button", { type: "button", style: `--hc: var(${colour})`, title: n }, h("b", {}, n), h("span", {}, `${b} B`)); x.addEventListener("click", () => { info.innerHTML = `<b style="color:var(${colour})">${n}</b> · ${b} bytes · ${d}`; sfx("tick", 0.15); }); return x; }),
    ...(total < 20 ? [h("span.hdr-empty", {})] : []));
  const pay = h("input#hd-pay", { type: "range", min: 20, max: 1400, step: 10, value: 160 }) as HTMLInputElement;
  const payOut = h("output", {});
  const u = h("span.v.tnum", { style: "color:var(--net)" }), t = h("span.v.tnum", { style: "color:var(--good)" });
  function calc() {
    const p = +pay.value; payOut.textContent = `${fmt(p)} bytes`;
    u.textContent = `${fmt((8 / (p + 8)) * 100, 1)}%`; t.textContent = `${fmt((20 / (p + 20)) * 100, 1)}%`;
  }
  pay.addEventListener("input", calc);
  bench.append(
    h("div", { style: "display:grid; gap:12px" },
      h("div.row", { style: "justify-content:space-between" }, h("span.eyebrow", { style: "color:var(--net)" }, "UDP label · 8 bytes"), h("span.faint.mono.scale-note", { style: "font-size:0.75rem" }, "drawn to the same scale")), bar(UDP, "--net", 8),
      h("span.eyebrow", { style: "color:var(--good)" }, "TCP label · at least 20 bytes"), bar(TCP, "--good", 20),
      info),
    h("div.bench-grid", { style: "margin-top:16px" },
      h("label.field", { for: "hd-pay" }, h("span", {}, "Data in each packet: ", payOut), pay),
      h("div.stats", {}, h("div.stat", {}, u, h("span.k", {}, "of each UDP packet is label")), h("div.stat", {}, t, h("span.k", {}, "of each TCP packet is label")))),
    h("p.note", {}, "Header sizes from the protocol standards (RFC 768 for UDP, RFC 9293 for TCP). TCP's label can grow beyond 20 bytes with options. Both are wrapped inside an IP label of another 20 bytes or more."),
    takeaway("UDP sends the packet and forgets it. That sounds careless, but it means nothing ever waits."),
  );
  calc();
}
