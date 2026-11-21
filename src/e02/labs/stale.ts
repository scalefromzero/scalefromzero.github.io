import { lib } from "../../kit/libs";
import { h, sfx, takeaway, css } from "../../kit/ui";

/** The whiteboard that lies: the warehouse changes, the board doesn't. */
export async function staleLab(bench: HTMLElement) {
  let truth = 40, board: number | null = 40, upset = 0, missed = 0;
  const canvas = h("canvas", { width: 640, height: 300, style: "width:100%; height:auto; background:var(--bg); border:1px solid var(--line); border-radius:12px", "aria-label": "Box office whiteboard and the warehouse" }) as HTMLCanvasElement;
  const log = h("div.log", { "aria-live": "polite" });
  const sell = h("button.btn", { type: "button" }, "Warehouse sells 20 online");
  const ret = h("button.btn", { type: "button" }, "Warehouse gets 30 returns");
  const ask = h("button.btn.primary", { type: "button" }, "A fan asks the clerk");
  const wipe = h("button.btn", { type: "button" }, "Wipe the board");
  const sUp = h("span.v.tnum", { style: "color:var(--bad)" }, "0"), sMiss = h("span.v.tnum", { style: "color:var(--storage)" }, "0");
  const line = (t: string, cls = "") => { log.append(h(`span${cls ? "." + cls : ""}`, {}, t)); while (log.children.length > 6) log.firstElementChild!.remove(); };
  bench.append(
    h("div.bench-grid", {}, canvas, h("div", { style: "display:grid; gap:12px; align-content:start" }, h("div.row", {}, ask, sell, ret, wipe), log,
      h("div.stats", {}, h("div.stat", {}, sUp, h("span.k", {}, "fans who paid for seats that don't exist")), h("div.stat", {}, sMiss, h("span.k", {}, "fans turned away from empty seats"))))),
    h("p.note", {}, "\"There are only two hard things in Computer Science: cache invalidation and naming things.\" Phil Karlton, as quoted by ", h("a", { href: "https://martinfowler.com/bliki/TwoHardThings.html", target: "_blank", rel: "noopener" }, "Martin Fowler"), "."),
    takeaway("A cache holds a copy, and a copy can fall out of date. A stale cache is fast, confident, and wrong."),
  );
  const rough = await lib.rough();
  const ctx = canvas.getContext("2d")!;
  function draw() {
    ctx.clearRect(0, 0, 640, 300);
    const rc = rough.canvas(canvas);
    const wrong = board !== null && board !== truth;
    rc.rectangle(30, 40, 300, 170, { stroke: wrong ? css("--bad") : css("--cache"), strokeWidth: 2, fill: "rgba(238,242,255,0.06)", fillStyle: "solid" });
    rc.rectangle(370, 70, 240, 150, { stroke: css("--storage"), strokeWidth: 2, fill: "rgba(245,165,36,0.10)", fillStyle: "cross-hatch", hachureGap: 10 });
    rc.line(450, 70, 490, 40, { stroke: css("--storage") }); rc.line(490, 40, 530, 70, { stroke: css("--storage") });
    ctx.fillStyle = css("--dim"); ctx.font = "600 14px 'SFZ Mono', monospace";
    ctx.fillText("WHITEBOARD (the cache)", 46, 30);
    ctx.fillText("WAREHOUSE (the database)", 380, 250);
    ctx.fillStyle = wrong ? css("--bad") : css("--text"); ctx.font = "700 44px 'SFZ Head', sans-serif";
    ctx.fillText(board === null ? "(empty)" : board === 0 ? "SOLD OUT" : `${board} seats left`, 50, 140);
    ctx.fillStyle = css("--storage"); ctx.font = "700 40px 'SFZ Head', sans-serif";
    ctx.fillText(`${truth}`, 470, 160);
    ctx.font = "500 14px 'SFZ Mono', monospace"; ctx.fillStyle = css("--dim"); ctx.fillText("seats really left", 430, 190);
    if (wrong) { ctx.fillStyle = css("--bad"); ctx.font = "700 15px 'SFZ Mono', monospace"; ctx.fillText("STALE", 250, 200); }
  }
  draw();
  line("The board and the warehouse agree: 40 seats.");
  sell.addEventListener("click", () => { const n = Math.min(20, truth); truth -= n; draw(); line(`Warehouse sold ${n} online. Nobody touched the board.`, "miss"); sfx("tick", 0.3); });
  ret.addEventListener("click", () => { truth += 30; draw(); line("30 tickets returned to the warehouse. The board doesn't know.", "miss"); sfx("tick", 0.3); });
  wipe.addEventListener("click", () => { board = null; draw(); line("Board wiped. The next fan's question goes to the warehouse."); sfx("pop", 0.3); });
  ask.addEventListener("click", () => {
    if (board === null) { board = truth; draw(); line(`Clerk phones the warehouse: ${truth} seats. Writes it on the board.`, "hit"); sfx("whoosh", 0.25); return; }
    if (board > 0 && truth === 0) { upset++; sUp.textContent = String(upset); line(`Board says ${board}. Fan pays, then hears: no seats. Refund.`, "miss"); sfx("miss", 0.35); }
    else if (board === 0 && truth > 0) { missed++; sMiss.textContent = String(missed); line(`Board says SOLD OUT. Fan leaves, while ${truth} seats sit empty.`, "miss"); sfx("miss", 0.35); }
    else if (board > 0) { truth--; board--; draw(); line(`Board says ${board + 1}. Fan buys one, clerk updates both.`, "hit"); sfx("hit", 0.3); }
    else line("Sold out, and it really is.");
  });
}
