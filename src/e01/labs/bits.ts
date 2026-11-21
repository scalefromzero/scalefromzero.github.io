import { lib } from "../../kit/libs";
import { h, sfx, takeaway, reducedMotion } from "../../kit/ui";

/** Eight light switches make a byte; a byte can mean a letter. Plus the b vs B trap. */
export function bitsLab(bench: HTMLElement) {
  let value = 0b01000001; // "A", the example from the video
  const sws: HTMLElement[] = [];
  const glyph = h("span.glyph", {}, "A");
  const dec = h("b.tnum", {}, "65");
  const bin = h("span.mono.dim", {}, "01000001");
  const switches = h("div.switches", { role: "group", "aria-label": "Eight bits, most significant first" });
  for (let i = 7; i >= 0; i--) {
    const b = h("button.sw", { type: "button", "aria-label": `Bit worth ${2 ** i}` }, "0", h("small", {}, String(2 ** i)));
    b.addEventListener("click", () => { value ^= 1 << i; sfx("tick", 0.3); render(); });
    sws.push(b);
    switches.append(b);
  }
  function render() {
    sws.forEach((b, k) => { const on = !!(value & (1 << (7 - k))); b.setAttribute("aria-pressed", String(on)); b.firstChild!.textContent = on ? "1" : "0"; });
    dec.textContent = String(value);
    bin.textContent = value.toString(2).padStart(8, "0");
    const printable = value >= 32 && value < 127;
    glyph.textContent = printable ? String.fromCharCode(value) : "·";
    glyph.title = printable ? "" : "Not a printable letter";
  }
  render();

  // Type a word → its bytes
  const input = h("input#word", { type: "text", value: "Hi!", maxlength: 12, "aria-label": "Type a word", style: "width:100%" }) as HTMLInputElement;
  const rows = h("div.word-bytes", { "aria-live": "polite" });
  async function word() {
    rows.innerHTML = "";
    const bytes = new TextEncoder().encode(input.value);
    const chars = [...input.value];
    let bi = 0;
    for (const ch of chars) {
      const n = new TextEncoder().encode(ch).length;
      for (let k = 0; k < n; k++, bi++) {
        const v = bytes[bi];
        const bits = h("span.bits", {}, ...[...v.toString(2).padStart(8, "0")].map((c) => h(c === "1" ? "span.on" : "span")));
        rows.append(h("div.wb", {}, h("span.ch", {}, k === 0 ? ch : "↳"), bits, h("span.dim", {}, `${v}`)));
      }
    }
    if (!reducedMotion() && rows.children.length) {
      const { animate, stagger } = await lib.anime();
      animate(rows.querySelectorAll(".bits span"), { scaleY: [0, 1], duration: 380, delay: stagger(12), ease: "outBack" });
    }
    total.textContent = `${bytes.length} byte${bytes.length === 1 ? "" : "s"} = ${bytes.length * 8} bits`;
  }
  const total = h("p.dim.mono");
  input.addEventListener("input", word);
  word();

  // b vs B
  const amt = h("input#mbps", { type: "number", value: 80, min: 0, step: 1, "aria-label": "Megabits per second", style: "width:7ch; background:var(--bg2); color:var(--text); border:1px solid var(--line); border-radius:10px; padding:9px 10px; font:700 1rem var(--mono)" }) as HTMLInputElement;
  const conv = h("b.mono");
  const doConv = () => { const v = Math.max(0, +amt.value || 0); conv.textContent = `${v} Mb = ${+(v / 8).toFixed(2)} MB`; };
  amt.addEventListener("input", doConv); doConv();

  bench.append(
    h("div.bench-grid", {},
      h("div", {},
        h("p.dim", { style: "margin-bottom:12px" }, "Tap the switches. Each one is a bit: off is 0, on is 1."),
        switches,
        h("div.byte-out", {}, glyph, h("div.stat", {}, h("span.k", {}, "as a number"), dec), h("div.stat", {}, h("span.k", {}, "as bits"), bin)),
      ),
      h("div", { style: "display:grid; gap:12px; align-content:start" },
        h("label.field", { for: "word" }, "Type anything. Every character becomes bytes.", input),
        rows, total,
        h("div", { style: "border-top:1px solid var(--line); padding-top:12px; display:grid; gap:8px" },
          h("span.eyebrow", {}, "The b / B trap"),
          h("div.row", {}, amt, h("span.dim", {}, "megabits per second"), h("span", {}, "→"), conv),
          h("p.note", { style: "margin:0" }, "Lowercase b is bits, uppercase B is bytes. Internet plans are sold in Mb/s; downloads show MB/s."),
        ),
      ),
    ),
    takeaway("Text, photos, music and apps are all just patterns of bits that we agreed mean something."),
  );
}
