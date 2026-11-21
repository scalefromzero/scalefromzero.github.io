import { lib } from "../kit/libs";
import { h, sfx, takeaway, fmt, css, reducedMotion } from "../kit/ui";
import { seg } from "../kit/episode";

/** A certificate is a passport for a website. Check five of them like a browser does. */
export function certLab(bench: HTMLElement) {
  type Case = { name: string; subject: string; issuer: string; valid: string; trusted: boolean; expired: boolean; key: boolean; note: string };
  const CASES: Case[] = [
    { name: "The real google.com", subject: "google.com", issuer: "A trusted authority", valid: "until 3 months from now", trusted: true, expired: false, key: true, note: "Name matches, signed by an authority on the built-in list, in date, and the server proves it holds the private key." },
    { name: "Expired", subject: "google.com", issuer: "A trusted authority", valid: "ended 12 days ago", trusted: true, expired: true, key: true, note: "Probably a forgotten renewal. The browser still has to refuse it." },
    { name: "Wrong name", subject: "shop.example", issuer: "A trusted authority", valid: "until next month", trusted: true, expired: false, key: true, note: "A real certificate, for a different website." },
    { name: "Unknown authority", subject: "google.com", issuer: "Cafe Router Inc.", valid: "until next year", trusted: false, expired: false, key: true, note: "Signed by someone who isn't on the browser's trusted list." },
    { name: "Copied certificate", subject: "google.com", issuer: "A trusted authority", valid: "until 3 months from now", trusted: true, expired: false, key: false, note: "The café router copied Google's real certificate, but can't sign with Google's private key, so the proof fails." },
  ];
  let c = CASES[0];
  const pick = seg("Certificate", CASES.map((x) => [x.name, x] as [string, Case]), c, (v) => { c = v; draw(); });
  const card = h("div.cert", {});
  const checks = h("div", { style: "display:grid; gap:6px" });
  const verdict = h("div.box", { style: "min-height:auto" });
  function draw() {
    card.innerHTML = `<b style="font-size:var(--step-0)">Certificate</b><div class="row2"><span>Issued to</span><b class="mono">${c.subject}</b></div><div class="row2"><span>Signed by</span><span>${c.issuer}</span></div><div class="row2"><span>Valid</span><span>${c.valid}</span></div><div class="row2"><span>Public key</span><span class="mono">04 a3 9f 1c … e2</span></div>`;
    const rows: [string, boolean][] = [["Signed by an authority I trust", c.trusted], ["The name matches google.com", c.subject === "google.com"], ["Still in date", !c.expired], ["Server proves it holds the private key", c.key]];
    checks.innerHTML = "";
    rows.forEach(([t, ok]) => checks.append(h("div.row", { style: `gap:8px; color:var(${ok ? "--good" : "--bad"})` }, h("b", {}, ok ? "✓" : "✕"), h("span", { style: "color:var(--text)" }, t))));
    const ok = rows.every(([, o]) => o);
    verdict.style.setProperty("--bc", `var(${ok ? "--good" : "--bad"})`);
    verdict.innerHTML = ok ? `<b style="color:var(--good)">🔒 Connection is secure</b><span>${c.note}</span>` : `<b style="color:var(--bad)">⚠ Your connection is not private</b><span>${c.note}</span>`;
    sfx(ok ? "hit" : "miss", 0.15);
  }
  bench.append(
    pick,
    h("div.bench-grid", { style: "margin-top:12px" }, card, h("div", { style: "display:grid; gap:10px; align-content:start" }, h("span.eyebrow", {}, "What Maya's browser checks"), checks, verdict)),
    takeaway("A certificate is a passport for a website. The warning page is the lock doing its job."),
  );
  draw();
}

/** TLS 1.3 vs TLS 1.2: draw the round trips and race them. */
export async function tlsLab(bench: HTMLElement) {
  let rtt = 60;
  const pick = seg("Round trip", [["10 ms", 10], ["60 ms", 60], ["150 ms", 150]], rtt, (v) => { rtt = v; });
  const run = h("button.btn.primary", { type: "button", style: "justify-self:start" }, "Race them");
  const W = 600, H = 300;
  const mk = () => { const s = document.createElementNS("http://www.w3.org/2000/svg", "svg"); s.setAttribute("viewBox", `0 0 ${W} ${H}`); s.style.cssText = "width:100%; height:auto; display:block"; return s; };
  const s13 = mk(), s12 = mk();
  const t13 = h("b.mono", { style: "color:var(--good)" }, "–"), t12 = h("b.mono", { style: "color:var(--storage)" }, "–");
  bench.append(
    h("div.row", {}, pick, run),
    h("div.bench-grid", { style: "margin-top:12px" },
      h("div", { style: "display:grid; gap:6px" }, h("div.row", { style: "justify-content:space-between" }, h("span.eyebrow", { style: "color:var(--good)" }, "TLS 1.3"), t13), s13),
      h("div", { style: "display:grid; gap:6px" }, h("div.row", { style: "justify-content:space-between" }, h("span.eyebrow", { style: "color:var(--storage)" }, "TLS 1.2"), t12), s12)),
    h("p.note", {}, "Both start after the TCP handshake. Time runs downwards. TLS 1.3 is RFC 8446."),
    takeaway("TLS 1.3 does the key exchange, the certificate and the signature in one round trip. The older version needed two."),
  );
  const { gsap } = await lib.gsap();
  const draw = async (svg: SVGSVGElement, msgs: [boolean, string, string][], out: HTMLElement) => {
    svg.innerHTML = `<line x1="80" y1="20" x2="80" y2="${H}" stroke="#38BDF8" stroke-width="3"/><line x1="520" y1="20" x2="520" y2="${H}" stroke="#4ADE80" stroke-width="3"/><text x="80" y="14" text-anchor="middle" fill="#EEF2FF" font-size="13" font-weight="700">Maya</text><text x="520" y="14" text-anchor="middle" fill="#EEF2FF" font-size="13" font-weight="700">Google</text>`;
    const step = (H - 50) / 5; // one-way trip; both diagrams share the same time scale
    for (let i = 0; i < msgs.length; i++) {
      const [fromMaya, label, col] = msgs[i];
      const y0 = 30 + i * step, y1 = y0 + step;
      const x0 = fromMaya ? 80 : 520, x1 = fromMaya ? 520 : 80;
      const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
      l.setAttribute("x1", String(x0)); l.setAttribute("y1", String(y0)); l.setAttribute("x2", String(x0)); l.setAttribute("y2", String(y0)); l.setAttribute("stroke", col); l.setAttribute("stroke-width", "3");
      const tx = document.createElementNS("http://www.w3.org/2000/svg", "text");
      tx.setAttribute("x", "300"); tx.setAttribute("y", String((y0 + y1) / 2 - 6)); tx.setAttribute("text-anchor", "middle"); tx.setAttribute("fill", col); tx.setAttribute("font-size", "12"); tx.setAttribute("font-weight", "700"); tx.textContent = label;
      svg.append(l, tx);
      await gsap.to(l, { attr: { x2: x1, y2: y1 }, duration: reducedMotion() ? 0 : (rtt / 2) * 0.012, ease: "none" });
      out.textContent = `${fmt(((i + 1) * rtt) / 2)} ms`;
    }
  };
  run.addEventListener("click", async () => {
    sfx("whoosh", 0.2);
    await Promise.all([
      draw(s13, [[true, "hello + key share", "#4ADE80"], [false, "key share + certificate + signature + finished", "#4ADE80"], [true, "finished + GET / (encrypted)", "#A78BFA"]], t13),
      draw(s12, [[true, "hello", "#F5A524"], [false, "hello + certificate + key share", "#F5A524"], [true, "key share + finished", "#F5A524"], [false, "finished", "#F5A524"], [true, "GET / (encrypted)", "#A78BFA"]], t12),
    ]);
    sfx("hit", 0.2);
  });
  run.click();
}

/** Stop 6: from HTML text to pixels, one step at a time. */
export function renderLab(bench: HTMLElement) {
  const STEPS = ["HTML arrives", "Build the tree (DOM)", "Apply the styles", "Layout: where each box goes", "Paint"];
  let i = 0;
  const html = `<body>\n  <header>Google</header>\n  <input placeholder="Search">\n  <button>Search</button>\n  <footer>Privacy · Terms</footer>\n</body>`;
  const view = h("div", { style: "min-height:250px; border-radius:12px; border:1px solid var(--line); background:var(--bg); padding:14px; overflow:hidden" });
  const label = h("b", {}, "");
  const prev = h("button.btn", { type: "button" }, "← Back"), next = h("button.btn.primary", { type: "button" }, "Next step →");
  function draw() {
    label.textContent = `${i + 1} of 5 · ${STEPS[i]}`;
    view.innerHTML = "";
    if (i === 0) view.append(h("pre.json", { style: "margin:0; border:0; background:none" }, html));
    if (i === 1 || i === 2) {
      const node = (t: string, depth: number, style = "") => h("div", { style: `margin-left:${depth * 22}px; font: 600 0.85rem/1.9 var(--mono); color:var(--text)` }, `${depth ? "└ " : ""}${t}`, i === 2 && style ? h("span", { style: "color:var(--cache); font-weight:500; margin-left:8px" }, style) : "");
      view.append(node("body", 0, "background: white"), node("header", 1, "font-size: 40px; text-align: center"), node("input", 1, "width: 60%; border-radius: 20px"), node("button", 1, "background: #f1f3f4"), node("footer", 1, "font-size: 12px; color: grey"));
    }
    if (i >= 3) {
      const paint = i === 4;
      const box = (txt: string, st: string) => h("div", { style: `${st}; ${paint ? "" : "border:1px dashed #38BDF8; color:#38BDF8; background:none; font: 500 0.7rem var(--mono);"} display:grid; place-items:center` }, paint ? txt : `${txt} box`);
      const page = h("div", { style: `display:grid; gap:12px; justify-items:center; padding:18px; border-radius:10px; ${paint ? "background:#fff; color:#202124" : ""}` },
        box("Google", "font: 700 34px var(--head); width:60%; height:52px"),
        box("Search", "width:60%; height:38px; border-radius:20px; " + (paint ? "border:1px solid #dfe1e5; color:#9aa0a6" : "")),
        box("Search", "width:110px; height:34px; border-radius:6px; " + (paint ? "background:#f1f3f4; font-size:13px" : "")),
        box("Privacy · Terms", "width:100%; height:24px; " + (paint ? "font-size:11px; color:#70757a" : "")));
      view.append(page);
    }
    (prev as HTMLButtonElement).disabled = i === 0; (next as HTMLButtonElement).disabled = i === 4;
  }
  prev.addEventListener("click", () => { i = Math.max(0, i - 1); draw(); sfx("tick", 0.15); });
  next.addEventListener("click", () => { i = Math.min(4, i + 1); draw(); sfx(i === 4 ? "hit" : "tick", 0.15); });
  bench.append(
    h("div.bench-grid", {}, h("div", { style: "display:grid; gap:12px; align-content:start" }, label, h("div.row", {}, prev, next),
      h("p.dim", { style: "margin:0" }, "Scripts can change the tree at any point, and the browser keeps repainting as the rest of the files arrive.")), view),
    takeaway("Tree, styles, layout, paint. From Enter to a usable page, all six stops usually fit in well under a second."),
  );
  draw();
}

/** What the café network can still see, and what HTTPS doesn't promise. */
export function seesLab(bench: HTMLElement) {
  const ROWS: [string, string, boolean][] = [
    ["The website's name", "google.com (sent in the clear during the handshake)", true],
    ["The server's IP address", "needed by every router on the way", true],
    ["How much data, and when", "sizes and timing of packets", true],
    ["Which page or search", "hidden inside the lock", false],
    ["Your cookies and password", "hidden inside the lock", false],
    ["The page that comes back", "hidden, and any change is caught", false],
  ];
  const dns = h("input#se-dns", { type: "checkbox" }) as HTMLInputElement;
  const list = h("div", { style: "display:grid; gap:6px" });
  function draw() {
    list.innerHTML = "";
    const rows = dns.checked ? [["Your DNS lookups", "hidden: sent inside HTTPS", false] as [string, string, boolean], ...ROWS] : [["Your DNS lookups", "readable: classic DNS isn't encrypted", true] as [string, string, boolean], ...ROWS];
    rows.forEach(([a, b, vis]) => list.append(h("div.box", { style: `--bc: var(${vis ? "--bad" : "--good"}); min-height:auto; flex-direction:row` }, h("b", {}, vis ? "👁 " + a : "🔒 " + a), h("span", {}, b))));
  }
  dns.addEventListener("change", () => { draw(); sfx("tick", 0.15); });
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:12px; align-content:start" },
        h("label.row", { for: "se-dns", style: "gap:8px; color:var(--text)" }, dns, "Use encrypted DNS"),
        h("p.dim", { style: "margin:0" }, "The padlock only proves you're talking to the site whose name is on the certificate. Fake login pages get certificates too."),
        h("div.box", { style: "--bc: var(--storage); min-height:auto" }, h("b", {}, "2011: DigiNotar"), h("span", {}, "A Dutch certificate authority was hacked, and fake certificates for Google were used against people in Iran. Browsers removed it from their trusted lists; it went bankrupt within weeks."))),
      list,
    ),
    takeaway("HTTPS hides what you say, not who you're talking to. A secure connection to the wrong website is still the wrong website."),
  );
  draw();
}

/** The longest a certificate may last, over time. Chart.js step chart. */
export async function lifetimeLab(bench: HTMLElement) {
  const box = h("div.chart-box", { style: "height:260px" }, h("canvas", { "aria-label": "Maximum certificate lifetime in days, by year" }));
  bench.append(
    box,
    h("p.note", {}, "Maximum validity for public website certificates set by the CA/Browser Forum: 60 months before 2015, 39 months from 2015, 825 days from 2018, 398 days from 2020, then ballot SC-081: 200 days from March 2026, 100 days from March 2027, 47 days from March 2029. Let's Encrypt has always issued 90-day certificates, automatically."),
    takeaway("Shorter lives mean a stolen key stops working sooner. Automation makes renewing every few weeks painless."),
  );
  const { Chart } = await lib.chart();
  const pts = [[2014, 1826], [2015.25, 1186], [2018.2, 825], [2020.7, 398], [2026.2, 200], [2027.2, 100], [2029.2, 47], [2030, 47]];
  new Chart(box.querySelector("canvas")!, {
    type: "line",
    data: { datasets: [{ label: "longest allowed (days)", data: pts.map(([x, y]) => ({ x, y })), stepped: "before", borderColor: css("--good"), backgroundColor: "rgba(74,222,128,0.12)", fill: true, pointRadius: 3, borderWidth: 2.5 }] },
    options: { maintainAspectRatio: false, parsing: false, plugins: { legend: { labels: { color: css("--dim"), boxWidth: 12 } }, tooltip: { callbacks: { label: (c) => `${fmt(c.parsed.y ?? 0)} days` } } },
      scales: { x: { type: "linear", min: 2014, max: 2030, ticks: { color: css("--faint"), stepSize: 2, callback: (v) => String(v) }, grid: { color: "rgba(120,140,220,0.08)" } }, y: { type: "logarithmic", min: 30, max: 2000, ticks: { color: css("--faint"), callback: (v) => ([50, 100, 200, 500, 1000, 2000].includes(+v) ? `${v} days` : "") }, grid: { color: "rgba(120,140,220,0.08)" } } } },
  });
}
