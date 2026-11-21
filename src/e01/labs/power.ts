import { lib } from "../../kit/libs";
import { h, sfx, takeaway, reducedMotion } from "../../kit/ui";

/** RAM is fast and volatile; storage survives. Type, save, then pull the plug. */
export function powerLab(bench: HTMLElement) {
  const ramText = h("textarea#ram", { "aria-label": "Your document, open in RAM", spellcheck: "false" }) as HTMLTextAreaElement;
  ramText.value = "Trip plan, day one. Land at nine, train to the old town, lunch by the river. Day two is the museum and the night market.";
  const diskText = h("div.disk", { "aria-label": "The saved file on the SSD" });
  let saved = "Trip plan, day one. Land at nine, train to the old town.";
  diskText.textContent = saved;
  const ramStatus = h("span.chip", {}, h("i", { style: "color:var(--ram)" }), "powered");
  const ramPanel = h("div.mem-panel", {}, h("h3", {}, h("span", { style: "color:var(--ram)" }, "RAM · the open document"), ramStatus), ramText);
  const diskPanel = h("div.mem-panel", {}, h("h3", {}, h("span", { style: "color:var(--storage)" }, "SSD · the saved file"), h("span.chip", {}, "survives power cuts")), diskText);
  const saveBtn = h("button.btn", { type: "button" }, "Save");
  const plugBtn = h("button.btn", { type: "button", style: "border-color:var(--bad)" }, "Pull the plug");
  const bootBtn = h("button.btn", { type: "button", hidden: true }, "Turn it back on");
  const auto = h("input#autosave", { type: "checkbox" }) as HTMLInputElement;
  const msg = h("p.dim", { "aria-live": "polite" }, "The document is open in RAM. Part of it was saved earlier.");
  let timer = 0;

  const save = () => { saved = ramText.value; diskText.textContent = saved; sfx("pop", 0.3); msg.textContent = "Saved. The SSD now has the same text as RAM."; };
  saveBtn.addEventListener("click", save);
  auto.addEventListener("change", () => {
    clearInterval(timer);
    if (auto.checked) { timer = window.setInterval(() => { if (ramText.value !== saved && !ramText.disabled) { saved = ramText.value; diskText.textContent = saved; msg.textContent = "Autosaved."; } }, 4000); }
  });

  plugBtn.addEventListener("click", async () => {
    // Words that already match the saved file, in order, survive; everything after the first difference is unsaved.
    const ramW = ramText.value.split(/\s+/).filter(Boolean), diskW = saved.split(/\s+/).filter(Boolean);
    let same = 0;
    while (same < ramW.length && same < diskW.length && ramW[same] === diskW[same]) same++;
    const n = ramW.length - same;
    sfx("powerdown", 0.4);
    ramText.disabled = true;
    ramPanel.classList.add("off");
    ramStatus.lastChild!.textContent = "no power";
    plugBtn.hidden = true; saveBtn.setAttribute("disabled", ""); bootBtn.hidden = false;
    await dropWords(ramText.value, same);
    ramText.value = "";
    msg.innerHTML = n ? `<b style="color:var(--bad)">${n} unsaved word${n === 1 ? "" : "s"} gone.</b> RAM forgets everything when the power goes; the red words had never been saved. The SSD still has the rest.` : `<b style="color:var(--good)">Nothing lost.</b> Everything in RAM had already been saved to the SSD.`;
  });
  bootBtn.addEventListener("click", () => {
    ramPanel.classList.remove("off");
    ramPanel.querySelector("canvas.physics")?.remove();
    ramText.disabled = false; ramText.value = saved;
    ramStatus.lastChild!.textContent = "powered";
    plugBtn.hidden = false; saveBtn.removeAttribute("disabled"); bootBtn.hidden = true;
    msg.textContent = "Back on. The app copied the saved file from the SSD into RAM again.";
    sfx("hit", 0.3);
  });

  async function dropWords(text: string, savedCount: number) {
    if (!text.trim() || reducedMotion()) return;
    const MJ = await lib.matter();
    const r = ramPanel.getBoundingClientRect();
    const canvas = h("canvas.physics") as HTMLCanvasElement;
    const dpr = Math.min(devicePixelRatio, 2);
    canvas.width = r.width * dpr; canvas.height = r.height * dpr;
    ramPanel.append(canvas);
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.font = "500 15px 'SFZ Mono', monospace";
    const engine = MJ.Engine.create();
    engine.gravity.y = 1.1;
    const ta = ramText.getBoundingClientRect();
    let x = ta.left - r.left + 12, y = ta.top - r.top + 20;
    const bodies: { b: ReturnType<typeof MJ.Bodies.rectangle>; w: string; wd: number; kept: boolean }[] = [];
    for (const w of text.split(/\s+/).filter(Boolean)) {
      const wd = ctx.measureText(w).width + 6;
      if (x + wd > ta.right - r.left - 8) { x = ta.left - r.left + 12; y += 22; }
      const b = MJ.Bodies.rectangle(x + wd / 2, y, wd, 20, { restitution: 0.35, friction: 0.4, angle: (Math.random() - 0.5) * 0.1 });
      MJ.Body.setVelocity(b, { x: (Math.random() - 0.5) * 3, y: -Math.random() * 2 });
      bodies.push({ b, w, wd, kept: bodies.length < savedCount });
      x += wd + 4;
    }
    const floor = MJ.Bodies.rectangle(r.width / 2, r.height + 10, r.width * 2, 20, { isStatic: true });
    const wallL = MJ.Bodies.rectangle(-10, r.height / 2, 20, r.height * 2, { isStatic: true });
    const wallR = MJ.Bodies.rectangle(r.width + 10, r.height / 2, 20, r.height * 2, { isStatic: true });
    MJ.Composite.add(engine.world, [...bodies.map((o) => o.b), floor, wallL, wallR]);
    ramText.style.color = "transparent";
    const t0 = performance.now();
    await new Promise<void>((done) => {
      const tick = (t: number) => {
        MJ.Engine.update(engine, 1000 / 60);
        ctx.clearRect(0, 0, r.width, r.height);
        const fade = Math.max(0, 1 - Math.max(0, t - t0 - 1600) / 900);
        for (const { b, w, wd, kept } of bodies) {
          ctx.save(); ctx.translate(b.position.x, b.position.y); ctx.rotate(b.angle);
          ctx.globalAlpha = fade;
          ctx.fillStyle = kept ? "rgba(45,212,191,0.22)" : "rgba(248,113,113,0.30)"; ctx.fillRect(-wd / 2, -10, wd, 20);
          ctx.fillStyle = "#EEF2FF"; ctx.fillText(w, -wd / 2 + 3, 5);
          ctx.restore();
        }
        if (t - t0 < 2600) requestAnimationFrame(tick); else done();
      };
      requestAnimationFrame(tick);
    });
    ramText.style.color = "";
    canvas.remove();
  }

  bench.append(
    h("div.power", {}, ramPanel, diskPanel),
    h("div.row", { style: "margin-top:14px" }, saveBtn, plugBtn, bootBtn, h("label.row", { for: "autosave", style: "gap:6px; color:var(--dim); font-size:var(--step--1)" }, auto, "Autosave every 4 s")),
    msg,
    h("div.stats", { style: "margin-top:18px" },
      h("div.stat", {}, h("span.v", { style: "color:var(--storage)" }, "1 TB"), h("span.k", {}, "a typical laptop SSD: huge, permanent, slower")),
      h("div.stat", {}, h("span.v", { style: "color:var(--ram)" }, "16 GB"), h("span.k", {}, "typical laptop RAM: smaller, pricier, gone when power cuts")),
    ),
    takeaway("Apps work on a copy in RAM because the CPU can't wait on storage. Save writes it back. Autosave exists because RAM forgets."),
  );
}
