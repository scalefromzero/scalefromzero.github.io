import { h, sfx, takeaway, fmt } from "../kit/ui";
import { seg, stat } from "../kit/episode";

const VIDEOS = [
  { id: 42, title: "How DNS works", likes: 1280, channel: "Scale From Zero" },
  { id: 43, title: "TCP vs UDP", likes: 960, channel: "Scale From Zero" },
  { id: 44, title: "Cats vs printers", likes: 88100, channel: "Office Pets" },
  { id: 45, title: "Five-minute pasta", likes: 4200, channel: "Quick Kitchen" },
];

/** Colour JSON for display. */
export function jsonHTML(v: unknown): string {
  return JSON.stringify(v, null, 2).replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/"([^"]+)":/g, '<span class="k">"$1"</span>:')
    .replace(/: "([^"]*)"/g, ': <span class="s">"$1"</span>')
    .replace(/: (-?\d+(\.\d+)?)/g, ': <span class="n">$1</span>');
}

/** Hero: the app reads `title`. Rename it on the server and watch phones go blank. */
export function contractHero() {
  let mode: "v1" | "rename" | "add" = "v1";
  const json = h("pre.json", { style: "max-height:300px" });
  const phone = h("div.phone", { "aria-label": "Maya's phone, drawing the home screen from the API's data" });
  const pick = seg("Server change", [["The contract (v1)", "v1"], ["Rename title → name", "rename"], ["Add a new optional field", "add"]], mode, (v) => { mode = v as typeof mode; draw(); });
  const say = h("p.dim", { "aria-live": "polite", style: "min-height:3em; margin:0" });
  function draw() {
    const data = { videos: VIDEOS.slice(0, 3).map((v) => mode === "rename" ? { id: v.id, name: v.title, likes: v.likes } : mode === "add" ? { id: v.id, title: v.title, likes: v.likes, duration_s: 540 } : { id: v.id, title: v.title, likes: v.likes }) };
    json.innerHTML = `GET /v1/videos?limit=3  →  200 OK\n\n${jsonHTML(data)}`;
    phone.innerHTML = "";
    phone.append(h("b", { style: "font-size:0.9rem; padding:0 4px" }, "Home"));
    data.videos.forEach((v) => {
      const title = (v as { title?: string }).title;
      phone.append(h(`div.card${title ? "" : ".blank"}`, {}, h("i"), h("div", { style: "display:grid; gap:4px" }, h("b", {}, title ?? "(missing)"), h("span", {}, `${fmt(v.likes)} likes`))));
    });
    say.innerHTML = mode === "rename" ? '<b style="color:var(--bad)">One renamed field, and every phone that hasn\'t updated shows an empty screen.</b>' : mode === "add" ? '<b style="color:var(--good)">Old apps ignore the new field and keep working.</b> Only add, never rename or remove.' : "The app only knows the address, what to send, and what comes back.";
    sfx(mode === "rename" ? "miss" : "tick", 0.2);
  }
  draw();
  return h("div.bench", { style: "display:grid; gap:10px" }, pick, h("div.contract-grid", {}, json, phone), say);
}

/** A tiny REST API that runs in your browser. */
export function restLab(bench: HTMLElement) {
  const db = { videos: VIDEOS.map((v) => ({ ...v })), comments: { 42: [{ id: 1, user: "sam", text: "Finally makes sense!" }, { id: 2, user: "ali", text: "The phone book bit 👌" }] } as Record<number, { id: number; user: string; text: string }[]>, next: 46 };
  let method = "GET";
  const pm = seg("Method", [["GET", "GET"], ["POST", "POST"], ["PUT", "PUT"], ["DELETE", "DELETE"]], method, (v) => { method = v; body.hidden = !(v === "POST" || v === "PUT"); });
  const path = h("input#rs-path", { type: "text", value: "/v1/videos", spellcheck: "false", "aria-label": "Path", style: "font: 600 0.95rem var(--mono); padding:8px 10px; border-radius:8px; border:1px solid var(--line); background:var(--bg); color:var(--text); width:100%" }) as HTMLInputElement;
  const body = h("textarea", { rows: 3, hidden: true, "aria-label": "Request body", style: "font: 500 0.85rem var(--mono); padding:8px; border-radius:8px; border:1px solid var(--line); background:var(--bg); color:var(--text); width:100%" }, '{"title": "My first video"}') as HTMLTextAreaElement;
  const send = h("button.btn.primary", { type: "button", style: "justify-self:start" }, "Send");
  const out = h("pre.json", { "aria-live": "polite", style: "min-height:220px" });
  const tries = h("div.row", { style: "gap:6px" }, ...[["GET", "/v1/videos"], ["GET", "/v1/videos/42"], ["GET", "/v1/videos/42/comments"], ["POST", "/v1/videos"], ["DELETE", "/v1/videos/45"], ["GET", "/v1/videos/999"]].map(([m, p]) => {
    const b = h("button.btn", { type: "button", style: "font-family:var(--mono); font-size:0.75rem" }, `${m} ${p}`);
    b.addEventListener("click", () => { method = m; [...pm.children].forEach((x) => x.setAttribute("aria-pressed", String(x.textContent === m))); body.hidden = !(m === "POST" || m === "PUT"); path.value = p; send.click(); });
    return b;
  }));
  function handle(m: string, p: string, b: string): [number, unknown] {
    const parts = p.split("?")[0].split("/").filter(Boolean);
    if (parts[0] !== "v1" || parts[1] !== "videos") return [404, { error: "not_found", message: "Try /v1/videos" }];
    const id = parts[2] ? Number(parts[2]) : null;
    if (parts[3] === "comments") { if (m !== "GET") return [405, { error: "method_not_allowed" }]; return db.comments[id!] ? [200, { comments: db.comments[id!] }] : [200, { comments: [] }]; }
    if (id === null) {
      if (m === "GET") return [200, { videos: db.videos.map(({ id, title, likes }) => ({ id, title, likes })), next_page_token: null }];
      if (m === "POST") { try { const j = JSON.parse(b); if (!j.title) return [400, { error: "missing_field", field: "title" }]; const v = { id: db.next++, title: String(j.title), likes: 0, channel: "Maya" }; db.videos.push(v); return [201, v]; } catch { return [400, { error: "invalid_json" }]; } }
      return [405, { error: "method_not_allowed" }];
    }
    const v = db.videos.find((x) => x.id === id);
    if (!v) return [404, { error: "not_found", id }];
    if (m === "GET") return [200, v];
    if (m === "DELETE") { db.videos = db.videos.filter((x) => x !== v); return [204, null]; }
    if (m === "PUT") { try { Object.assign(v, JSON.parse(b)); return [200, v]; } catch { return [400, { error: "invalid_json" }]; } }
    return [405, { error: "method_not_allowed" }];
  }
  const TEXT: Record<number, string> = { 200: "OK", 201: "Created", 204: "No Content", 400: "Bad Request", 404: "Not Found", 405: "Method Not Allowed" };
  send.addEventListener("click", () => {
    const [code, res] = handle(method, path.value.trim(), body.value);
    out.innerHTML = `${method} ${path.value.replace(/</g, "&lt;")}\n<span style="color:var(${code < 300 ? "--good" : "--bad"})">${code} ${TEXT[code]}</span>\n\n${res === null ? "(no body)" : jsonHTML(res)}`;
    sfx(code < 300 ? "hit" : "miss", 0.15);
  });
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:10px; align-content:start" }, pm, h("label.field", { for: "rs-path" }, "Path", path), body, send, h("span.eyebrow", {}, "Try these"), tries),
      out,
    ),
    h("p.note", {}, "Resources are nouns; HTTP methods are the verbs. Everything here runs in your browser; reload to reset."),
    takeaway("REST: /videos is the list, /videos/42 is one video, /videos/42/comments is its comments. GET reads, POST creates, PUT replaces, DELETE removes."),
  );
  send.click();
}

/** One screen, two ways to fetch it: several REST calls vs one GraphQL query. */
export function graphqlLab(bench: HTMLElement) {
  const FIELDS = [["title", true], ["likes", true], ["description", false], ["upload_date", false], ["comments.text", true], ["comments.author.avatar", true]] as const;
  const boxes = FIELDS.map(([f, on]) => h(`input#gq-${f.replace(/\./g, "-")}`, { type: "checkbox", checked: on }) as HTMLInputElement);
  const rest = h("pre.json", {}), gql = h("pre.json", {});
  const sR = stat("REST: requests · bytes", "--storage"), sG = stat("GraphQL: requests · bytes", "--cache");
  function draw() {
    const want = FIELDS.filter((_, i) => boxes[i].checked).map(([f]) => f);
    const needComments = want.some((w) => w.startsWith("comments")), needAvatars = want.includes("comments.author.avatar");
    const reqs = ["GET /v1/videos/42  (all 9 fields of the video)", ...(needComments ? ["GET /v1/videos/42/comments  (all fields of 20 comments)"] : []), ...(needAvatars ? ["GET /v1/users/sam", "GET /v1/users/ali", "GET /v1/users/… ×18 more"] : [])];
    const restBytes = 900 + (needComments ? 20 * 260 : 0) + (needAvatars ? 20 * 520 : 0);
    rest.textContent = reqs.join("\n");
    const q = `query {\n  video(id: 42) {\n${want.filter((w) => !w.startsWith("comments")).map((w) => `    ${w}`).join("\n")}${needComments ? `\n    comments(first: 20) {\n      text${needAvatars ? "\n      author { avatar }" : ""}\n    }` : ""}\n  }\n}`;
    gql.textContent = `POST /graphql\n\n${q}`;
    const gBytes = 60 + want.filter((w) => !w.startsWith("comments")).length * 40 + (needComments ? 20 * 70 : 0) + (needAvatars ? 20 * 50 : 0);
    sR.v.textContent = `${reqs.length === 5 ? 22 : reqs.length} · ${fmt(restBytes / 1000, 1)} KB`;
    sG.v.textContent = `1 · ${fmt(gBytes / 1000, 1)} KB`;
  }
  boxes.forEach((b) => b.addEventListener("change", () => { draw(); sfx("tick", 0.15); }));
  bench.append(
    h("div", { style: "display:grid; gap:10px" }, h("span.eyebrow", {}, "What the video screen shows"), h("div.row", { style: "gap:14px" }, ...FIELDS.map(([f], i) => h("label.row", { for: boxes[i].id, style: "gap:6px; font: 500 0.85rem var(--mono)" }, boxes[i], f)))),
    h("div.bench-grid", { style: "margin-top:12px" },
      h("div", { style: "display:grid; gap:8px" }, h("span.eyebrow", { style: "color:var(--storage)" }, "REST"), rest, sR.el),
      h("div", { style: "display:grid; gap:8px" }, h("span.eyebrow", { style: "color:var(--cache)" }, "GraphQL"), gql, sG.el)),
    h("p.note", {}, "Byte counts are illustrative. GraphQL was created at Facebook (2012) and open-sourced in 2015; in Postman's 2025 survey about a third of respondents use it, and 93% use REST."),
    takeaway("GraphQL: one address, and the app asks for exactly the fields it wants. The cost: one clever query can be expensive, and responses are harder to cache."),
  );
  draw();
}
