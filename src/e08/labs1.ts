import { h, sfx, takeaway, sleep, reducedMotion } from "../kit/ui";
import { seg } from "../kit/episode";

type Route = { status: string; type: string; cache: string; body: string; c: string };
const ROUTES: Record<string, Route> = {
  "/": { status: "200 OK", type: "text/html", cache: "max-age=60", body: "<!doctype html><h1>Example Domain</h1>…", c: "--good" },
  "/logo.png": { status: "200 OK", type: "image/png", cache: "max-age=31536000", body: "‰PNG ▒▒▒▒ (binary image data)", c: "--good" },
  "/old-page": { status: "301 Moved Permanently", type: "text/html", cache: "max-age=3600", body: "Location: /new-page", c: "--storage" },
  "/missing": { status: "404 Not Found", type: "text/html", cache: "no-store", body: "<h1>Not found</h1>", c: "--bad" },
};

/** Hero: type a real HTTP request, line by line, and read the response that comes back. */
export function conversationHero() {
  let path = "/";
  const pick = seg("Page to ask for", Object.keys(ROUTES).map((p) => [p, p] as [string, string]), path, (v) => { path = v; sfx("tick", 0.15); });
  const req = h("pre.term", { style: "height:150px; color:var(--net)", "aria-label": "The request" });
  const res = h("pre.term", { style: "height:170px", "aria-label": "The response" });
  const send = h("button.btn.primary", { type: "button" }, "Send the request");
  let busy = false;
  async function type(el: HTMLElement, lines: string[], colour?: string) {
    el.textContent = "";
    for (const l of lines) {
      if (reducedMotion()) { el.textContent += l + "\n"; continue; }
      for (const ch of l) { el.textContent += ch; await sleep(8); }
      el.textContent += "\n"; await sleep(60);
    }
    if (colour) el.style.color = colour;
  }
  send.addEventListener("click", async () => {
    if (busy) return; busy = true;
    const r = ROUTES[path];
    res.textContent = ""; res.style.color = "";
    sfx("whoosh", 0.2);
    await type(req, [`GET ${path} HTTP/1.1`, "Host: example.com", "Accept: text/html,image/*", "Cookie: session=7f3a9c…", ""]);
    await sleep(reducedMotion() ? 0 : 300);
    await type(res, [`HTTP/1.1 ${r.status}`, `Content-Type: ${r.type}`, `Cache-Control: ${r.cache}`, "", r.body]);
    res.style.color = `var(${r.c})`;
    sfx(r.c === "--bad" ? "miss" : "hit", 0.2);
    busy = false;
  });
  const el = h("div.bench", { style: "display:grid; gap:10px" }, h("span.eyebrow", {}, "Maya's browser → example.com"), pick, req, send, h("span.eyebrow", {}, "example.com → Maya's browser"), res);
  const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) { io.disconnect(); send.click(); } });
  io.observe(el);
  return el;
}

/** Build a request and see what every line means. */
export function requestLab(bench: HTMLElement) {
  const METHODS: Record<string, string> = { GET: "read something", POST: "send something new, like a form or a payment", PUT: "replace something", DELETE: "remove something" };
  let method = "GET";
  const pick = seg("Method", Object.keys(METHODS).map((m) => [m, m] as [string, string]), method, (v) => { method = v; draw(); sfx("tick", 0.15); });
  const path = h("input#rq-path", { type: "text", value: "/videos/42", spellcheck: "false", "aria-label": "Path", style: "font: 600 0.95rem var(--mono); padding:8px 10px; border-radius:8px; border:1px solid var(--line); background:var(--bg); color:var(--text)" }) as HTMLInputElement;
  const hasCookie = h("input#rq-cookie", { type: "checkbox", checked: true }) as HTMLInputElement;
  const lines = h("div", { style: "display:grid; gap:4px" });
  const explain = h("p.dim", { "aria-live": "polite", style: "min-height:3em; margin:0" }, "Tap a line to see what it does.");
  function draw() {
    const L: [string, string][] = [
      [`${method} ${path.value || "/"} HTTP/1.1`, `The request line: method, path and version. ${method} means ${METHODS[method]}.`],
      ["Host: example.com", "Which website. One server can host thousands of sites, so it needs to know which one you mean."],
      ["Accept: application/json", "Which formats the browser or app understands."],
      ...(hasCookie.checked ? [["Cookie: session=7f3a9c…", "Proof of who's asking, from an earlier login."] as [string, string]] : []),
      ...(method === "POST" || method === "PUT" ? [["Content-Type: application/json", "What's in the body below."] as [string, string]] : []),
      ["", "A blank line ends the headers."],
      ...(method === "POST" || method === "PUT" ? [['{"title": "My new video"}', "The body: the data being sent."] as [string, string]] : []),
    ];
    lines.innerHTML = "";
    L.forEach(([t, d], i) => {
      const b = h("button", { type: "button", class: "reqline", style: `--hc: var(${i === 0 ? "--net" : "--cache"})` }, t || "↵ (blank line)");
      b.addEventListener("click", () => { explain.textContent = d; sfx("tick", 0.1); });
      lines.append(b);
    });
  }
  path.addEventListener("input", draw); hasCookie.addEventListener("change", draw);
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:12px; align-content:start" }, pick, h("label.field", { for: "rq-path" }, "Path", path), h("label.row", { for: "rq-cookie", style: "gap:8px; color:var(--dim)" }, hasCookie, "Logged in (send the cookie)"), explain),
      lines,
    ),
    takeaway("A request is a method, a path, headers one per line, a blank line, and sometimes a body. Plain text anyone can read."),
  );
  draw();
}

/** Status codes: what happened, and what the browser should do next. */
export function responseLab(bench: HTMLElement) {
  const CODES: [string, string, string, string][] = [
    ["200", "OK", "Success. Here's what you asked for.", "--good"],
    ["201", "Created", "Success. A new thing was made, like an order.", "--good"],
    ["301", "Moved Permanently", "Look somewhere else. The browser follows the new address and remembers it.", "--storage"],
    ["304", "Not Modified", "Your saved copy is still good. Nothing is resent.", "--storage"],
    ["401", "Unauthorized", "Who are you? Log in first.", "--bad"],
    ["403", "Forbidden", "I know who you are, and the answer is no.", "--bad"],
    ["404", "Not Found", "That doesn't exist. Trying again won't help.", "--bad"],
    ["429", "Too Many Requests", "Slow down and wait before trying again.", "--bad"],
    ["500", "Internal Server Error", "The server hit a bug. Not your fault.", "--cpu"],
    ["502", "Bad Gateway", "A server in the middle couldn't get an answer from the one behind it.", "--cpu"],
    ["503", "Service Unavailable", "Overloaded or down for maintenance. Try again a little later.", "--cpu"],
  ];
  const grid = h("div", { style: "display:flex; flex-wrap:wrap; gap:6px" });
  const card = h("div.box", { style: "min-height:auto" });
  const classes = h("div", { style: "display:grid; grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); gap:6px" }, ...[["2xx", "success", "--good"], ["3xx", "look elsewhere", "--storage"], ["4xx", "your request was wrong", "--bad"], ["5xx", "the server failed", "--cpu"]].map(([a, b, c]) => h("div.box", { style: `--bc: var(${c}); min-height:auto; text-align:center` }, h("b.mono", {}, a), h("span", {}, b))));
  CODES.forEach(([code, name, d, c]) => {
    const b = h("button.btn", { type: "button", style: `border-color:var(${c}); font-family:var(--mono)` }, code);
    b.addEventListener("click", () => { card.style.setProperty("--bc", `var(${c})`); card.innerHTML = `<b class="mono" style="font-size:var(--step-1); color:var(${c})">${code} ${name}</b><span>${d}</span>`; sfx(c === "--good" ? "hit" : c === "--storage" ? "tick" : "miss", 0.15); });
    grid.append(b);
  });
  (grid.children[0] as HTMLElement).click();
  bench.append(classes, h("div.bench-grid", { style: "margin-top:14px" }, grid, card),
    h("p.note", {}, "Codes and meanings from RFC 9110 §15 (429 is RFC 6585)."),
    takeaway("The first digit says what kind of thing happened. That's why every browser and app can react, even to a code it's never seen."));
}
