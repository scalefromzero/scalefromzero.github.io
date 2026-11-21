import { lib } from "../../kit/libs";
import { h, sfx, takeaway, fmt, css, reducedMotion } from "../../kit/ui";

const CAP = 500; // illustrative: one server answers 500 requests a second
const PER_BALL = 500; // each ball is 500 requests a second, so the server drains one ball a second
const LIMIT = 200; // waiting balls before the database gives up (illustrative)
const SIM = 12; // one real second = 12 seconds of the sale

/** Requests fall into a queue in front of one server. Matter.js physics: the pile is the wait. */
export async function flashSaleLab(bench: HTMLElement) {
  const fans = h("input#fs-fans", { type: "range", min: 3, max: 7, step: 0.01, value: Math.log10(2_000_000) }) as HTMLInputElement;
  const fansOut = h("output", {});
  const retry = h("input#fs-retry", { type: "checkbox", checked: true }) as HTMLInputElement;
  const seg = h("div.seg", { role: "group", "aria-label": "Which day" });
  const days = [["Normal Tuesday", 5_000], ["Flash sale", 2_000_000]] as const;
  days.forEach(([name, n], i) => {
    const b = h("button", { type: "button", "aria-pressed": String(i === 1) }, name);
    b.addEventListener("click", () => { fans.value = String(Math.log10(n)); [...seg.children].forEach((x) => x.setAttribute("aria-pressed", String(x === b))); reset(); });
    seg.append(b);
  });
  const go = h("button.btn.primary", { type: "button" }, "Start the sale");
  const st = (k: string, c = "--text") => { const v = h("span.v.tnum", { style: `color:var(${c})` }, "–"); return { el: h("div.stat", {}, v, h("span.k", {}, k)), v }; };
  const sIn = st("requests arriving each second", "--net"), sOut = st("one server answers each second", "--good"), sWait = st("seconds a new request waits", "--bad"), sClock = st("minutes into the sale");
  const canvas = h("canvas", { width: 640, height: 300, style: "width:100%; height:auto; display:block; border-radius:12px; background:var(--bg); border:1px solid var(--line)", "aria-label": "Requests piling up in front of one server" }) as HTMLCanvasElement;
  const say = h("p.dim", { "aria-live": "polite", style: "min-height:3em" }, "Two million fans in ten minutes. Press start.");
  bench.append(
    h("div.bench-grid", {},
      h("div", { style: "display:grid; gap:12px; align-content:start" },
        seg,
        h("label.field", { for: "fs-fans" }, h("span", {}, "Fans in ten minutes: ", fansOut), fans),
        h("label.row", { for: "fs-retry", style: "gap:8px; color:var(--dim)" }, retry, "Fans tap again when it's slow"),
        h("div.stats", {}, sIn.el, sOut.el, sWait.el, sClock.el),
        h("div.row", {}, go),
      ),
      h("div", { style: "display:grid; gap:8px; min-width:0" }, canvas, say),
    ),
    h("p.note", {}, `Each ball is ${fmt(PER_BALL)} requests a second. The server answers ${fmt(CAP)} a second, so it removes one ball a second. Time runs ${SIM}× fast. Server speed and the breaking point are illustrative.`),
    takeaway("The design wasn't wrong. Nobody had asked how much, how fast and how often."),
  );

  const M = await lib.matter();
  const { Engine, Bodies, Composite } = M;
  canvas.width = Math.round(Math.max(320, Math.min(640, canvas.clientWidth || 640)));
  const W = canvas.width, H = canvas.height;
  const engine = Engine.create({ gravity: { x: 0, y: 1 } });
  const wallOpts = { isStatic: true };
  Composite.add(engine.world, [
    Bodies.rectangle(W / 2, H + 10, W, 20, wallOpts),
    Bodies.rectangle(-10, H / 2, 20, H * 2, wallOpts),
    Bodies.rectangle(W + 10, H / 2, 20, H * 2, wallOpts),
  ]);
  const ctx = canvas.getContext("2d")!;
  const cNet = css("--net"), cBad = css("--bad"), cGood = css("--good"), cLine = css("--line"), cDim = css("--faint");
  let balls: ReturnType<typeof Bodies.circle>[] = [];
  let running = false, dead = false, t = 0, owed = 0, drainOwed = 0, lastWait = 0;
  const rps = () => 10 ** +fans.value / 600;

  function readouts() {
    const n = 10 ** +fans.value;
    fansOut.textContent = fmt(Number(n.toPrecision(2)));
    const arriving = rps() * (retry.checked ? 1 + Math.min(1, balls.length / 120) : 1);
    sIn.v.textContent = arriving < 10 ? fmt(arriving, 1) : fmt(Number(arriving.toPrecision(2)));
    sOut.v.textContent = dead ? "0" : fmt(CAP);
    lastWait = (balls.length * PER_BALL) / CAP;
    sWait.v.textContent = dead ? "∞" : lastWait < 1 ? "< 1" : fmt(lastWait);
    sClock.v.textContent = fmt((t * SIM) / 60, 1);
  }
  function reset() {
    balls.forEach((b) => Composite.remove(engine.world, b)); balls = [];
    running = false; dead = false; t = 0; owed = 0; drainOwed = 0;
    go.textContent = "Start the sale";
    say.textContent = 10 ** +fans.value < 50_000 ? "A normal day. Press start." : `${fmt(Number((10 ** +fans.value).toPrecision(2)))} fans in ten minutes is about ${fmt(Math.round(rps() / 100) * 100)} requests a second. Press start.`;
    readouts();
  }
  fans.addEventListener("input", () => { [...seg.children].forEach((x) => x.setAttribute("aria-pressed", "false")); reset(); });
  go.addEventListener("click", () => {
    if (running) { reset(); return; }
    running = true; go.textContent = "Reset"; sfx("whoosh", 0.25);
  });

  let last = performance.now();
  let vis = true; new IntersectionObserver((e) => (vis = e[0].isIntersecting)).observe(canvas);
  function frame(now: number) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!vis) return;
    if (running && t * SIM < 600) {
      t += dt;
      const ballsPerSec = (rps() / PER_BALL) * (retry.checked ? 1 + Math.min(1, balls.length / 120) : 1);
      owed += Math.min(40, ballsPerSec) * dt;
      while (owed >= 1 && balls.length < 320) {
        owed -= 1;
        const b = Bodies.circle(40 + Math.random() * (W - 80), -10, 8.5, { restitution: 0.15, friction: 0.05, density: 0.002 });
        Composite.add(engine.world, b); balls.push(b);
      }
      if (!dead) {
        drainOwed += (CAP / PER_BALL) * dt;
        while (drainOwed >= 1 && balls.length) {
          drainOwed -= 1;
          let lo = 0; balls.forEach((b, i) => { if (b.position.y > balls[lo].position.y) lo = i; });
          Composite.remove(engine.world, balls[lo]); balls.splice(lo, 1);
          if (Math.random() < 0.3) sfx("tick", 0.05);
        }
        if (balls.length >= LIMIT) {
          dead = true; sfx("powerdown", 0.4);
          say.innerHTML = `<b style="color:var(--bad)">Minute ${fmt((t * SIM) / 60, 1)}: the database stopped answering.</b> Waiting requests became slow requests, fans tapped again, and the whole site went dark.`;
        } else if (balls.length > 20) say.textContent = `For every request the server answers, about ${fmt(rps() / CAP, 1)} more join the line. A new request now waits ${fmt(lastWait)} seconds.`;
        else if (t > 2) say.textContent = "The server keeps up. Nothing waits for long.";
      }
    } else if (running && !dead && t * SIM >= 600) { say.textContent = "Ten minutes, and the server kept up the whole time."; running = false; }
    if (!reducedMotion() || running) { const steps = Math.ceil((dt * 1000) / 16.6); for (let k = 0; k < steps; k++) Engine.update(engine, (dt * 1000) / steps); }
    // draw
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = cLine; ctx.setLineDash([6, 6]);
    const limY = H - Math.round((LIMIT / Math.floor(W / 17)) * 14.5 + 8); ctx.beginPath(); ctx.moveTo(0, limY); ctx.lineTo(W, limY); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = cDim; ctx.font = "12px JetBrains Mono, monospace"; ctx.fillText("database gives up about here", 10, limY - 6);
    for (const b of balls) { ctx.beginPath(); ctx.arc(b.position.x, b.position.y, 8.5, 0, Math.PI * 2); ctx.fillStyle = dead ? cBad : cNet; ctx.globalAlpha = dead ? 0.55 : 0.9; ctx.fill(); }
    ctx.globalAlpha = 1;
    ctx.fillStyle = dead ? cBad : cGood; ctx.fillRect(W / 2 - 60, H - 6, 120, 6);
    ctx.fillStyle = dead ? cBad : cGood; ctx.font = "600 12px Inter, sans-serif"; ctx.textAlign = "center"; ctx.fillText(dead ? "SERVER + DATABASE DOWN" : "ONE SERVER · 500/s", W / 2, H - 12); ctx.textAlign = "left";
    if (running || dead) readouts();
  }
  reset();
  requestAnimationFrame(frame);
}
