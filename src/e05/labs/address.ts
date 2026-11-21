import { lib } from "../../kit/libs";
import { h, sfx, takeaway, fmt, reducedMotion } from "../../kit/ui";

const OCT = ["--net", "--good", "--cache", "--storage"];

/** Build an IPv4 address from four numbers, see its 32 bits, then meet the much longer IPv6. */
export async function addressLab(bench: HTMLElement) {
  const start = [203, 0, 113, 42];
  const sliders = start.map((v, i) => h(`input#ip-${i}`, { type: "range", min: 0, max: 255, step: 1, value: v, "aria-label": `Number ${i + 1} of 4`, style: "flex:1; min-width:0" }) as HTMLInputElement);
  const dotted = h("div.ipbig", { "aria-live": "polite" });
  const bits = h("div.bits");
  const counter = h("span.v.tnum", { style: "color:var(--net)" }, "0");
  const v6 = h("div.box", { style: "--bc: var(--good); min-height:auto" },
    h("b", {}, "The newer version: IPv6"),
    h("span.mono", { style: "font-size:var(--step-0); color:var(--text)" }, "2001:db8::42"),
    h("span", {}, "128 bits instead of 32: about 340 trillion trillion trillion addresses (3.4 × 10³⁸)"));
  const bar = h("i", { style: "display:block; height:100%; width:0%; background:var(--good); border-radius:8px" });
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:12px; align-content:start" },
        h("span.eyebrow", {}, "The classic version: IPv4, four numbers from 0 to 255"),
        ...sliders.map((s, i) => h("label.row", { for: s.id, style: `gap:10px; flex-wrap:nowrap; --accent: var(${OCT[i]})` }, h("span.mono", { style: `color:var(${OCT[i]}); width:2.2em` }, `#${i + 1}`), s)),
        dotted, bits),
      h("div", { style: "display:grid; gap:14px; align-content:start" },
        h("div.stat", {}, counter, h("span.k", {}, "possible IPv4 addresses (2³²)")),
        h("p.dim", { style: "margin:0" }, "About four point three billion. That sounds like a lot until you count every phone, laptop and smart fridge on the planet."),
        v6,
        h("div", { style: "display:grid; gap:6px" },
          h("span.k", { style: "font-size:var(--step--1); color:var(--dim)" }, "People reaching Google over IPv6, April 2026"),
          h("div", { style: "height:14px; background:var(--line); border-radius:8px; overflow:hidden" }, bar),
          h("b.mono", { style: "color:var(--good)" }, "≈ 50%"))),
    ),
    h("p.note", {}, "203.0.113.x and 2001:db8:: are reserved for examples, so they never point at a real device. IPv6 share: ", h("a", { href: "https://blog.apnic.net/2026/04/28/google-hits-50-ipv6/", target: "_blank", rel: "noopener" }, "APNIC blog, April 2026"), "."),
    takeaway("Every device needs an address for the label to work. On the internet, that's an IP address."),
  );
  function show() {
    const v = sliders.map((s) => +s.value);
    dotted.innerHTML = v.map((n, i) => `<span style="color:var(${OCT[i]})">${n}</span>`).join('<span class="faint">.</span>');
    bits.innerHTML = v.map((n, i) => `<span style="color:var(${OCT[i]})">${n.toString(2).padStart(8, "0")}</span>`).join(" ");
  }
  sliders.forEach((s) => s.addEventListener("input", () => { show(); sfx("tick", 0.08); }));
  show();
  const { animate } = await lib.motion();
  const total = 2 ** 32;
  if (reducedMotion()) { counter.textContent = fmt(total); bar.style.width = "50%"; return; }
  const io = new IntersectionObserver((e) => {
    if (!e[0].isIntersecting) return; io.disconnect();
    animate(0, total, { duration: 2.2, ease: "easeOut", onUpdate: (x) => (counter.textContent = fmt(Math.round(x))) });
    animate(bar, { width: ["0%", "50%"] }, { duration: 1.4, delay: 0.6 });
  });
  io.observe(counter);
}
