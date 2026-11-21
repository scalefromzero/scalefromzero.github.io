import { lib } from "../../kit/libs";
import { h, sfx, takeaway, sleep, reducedMotion } from "../../kit/ui";

const N_TESTS = 120, SERVERS = 6;

/** Write → build → test → deploy a few servers at a time. Sneak in a bug and the line stops. */
export function pipelineLab(bench: HTMLElement) {
  const stages = ["Write", "Build", "Test", "Deploy"].map((s) => h("div.stage", {}, s));
  const tests = h("div.tests", { "aria-label": `${N_TESTS} automatic tests` }, ...Array.from({ length: N_TESTS }, () => h("i")));
  const fleet = h("div.fleet", {}, ...Array.from({ length: SERVERS }, (_, i) => h("div.srv", {}, `server ${i + 1}`, h("br"), "v1")));
  const bug = h("input#bug", { type: "checkbox" }) as HTMLInputElement;
  const go = h("button.btn.primary", { type: "button" }, "Ship a change");
  const out = h("p", { "aria-live": "polite", style: "min-height:2.6em" });
  let ver = 1, busy = false;
  go.addEventListener("click", async () => {
    if (busy) return; busy = true; go.setAttribute("disabled", "");
    stages.forEach((s) => s.classList.remove("on", "ok", "bad"));
    [...tests.children].forEach((t) => t.classList.remove("pass", "fail"));
    const d = reducedMotion() ? 0 : 1;
    out.textContent = "A developer pushes the change from a laptop.";
    stages[0].classList.add("ok"); sfx("pop", 0.2); await sleep(400 * d);
    stages[1].classList.add("on"); out.textContent = "A separate machine builds it."; await sleep(600 * d); stages[1].classList.replace("on", "ok");
    stages[2].classList.add("on"); out.textContent = `Running ${N_TESTS} automatic tests…`;
    const failAt = bug.checked ? 37 + Math.floor(Math.random() * 60) : -1;
    const { animate, stagger } = await lib.anime();
    const cells = [...tests.children] as HTMLElement[];
    cells.forEach((c, i) => c.classList.add(i === failAt ? "fail" : "pass"));
    if (!reducedMotion()) await animate(cells.slice(0, failAt >= 0 ? failAt + 1 : N_TESTS), { scale: [0, 1], duration: 300, delay: stagger(9), ease: "outBack" });
    if (failAt >= 0) {
      cells.slice(failAt + 1).forEach((c) => c.classList.remove("pass"));
      stages[2].classList.replace("on", "bad");
      out.innerHTML = `<b style="color:var(--bad)">Test ${failAt + 1} failed. The change stops here.</b> Customers never see it.`;
      sfx("miss", 0.35); busy = false; go.removeAttribute("disabled"); return;
    }
    stages[2].classList.replace("on", "ok");
    stages[3].classList.add("on"); ver++;
    const srvs = [...fleet.children] as HTMLElement[];
    for (let i = 0; i < SERVERS; i += 2) {
      out.textContent = `Copying v${ver} onto servers ${i + 1} and ${i + 2}. The rest keep serving.`;
      srvs.slice(i, i + 2).forEach((s, k) => { s.classList.add("new"); s.innerHTML = `server ${i + k + 1}<br>v${ver}`; });
      sfx("tick", 0.2); await sleep(650 * d);
    }
    stages[3].classList.replace("on", "ok");
    out.innerHTML = `<b style="color:var(--good)">v${ver} is live everywhere.</b> No downtime, and every test passed first.`;
    sfx("hit", 0.3); busy = false; go.removeAttribute("disabled");
  });
  bench.append(
    h("div.stages-row", {}, ...stages),
    h("div.bench-grid", { style: "margin-top:14px" }, h("div", { style: "display:grid; gap:10px" }, h("span.eyebrow", {}, `${N_TESTS} automatic tests`), tests), h("div", { style: "display:grid; gap:10px" }, h("span.eyebrow", {}, "Live servers"), fleet)),
    h("div.row", { style: "margin-top:14px" }, go, h("label.row", { for: "bug", style: "gap:8px; color:var(--dim)" }, bug, "Sneak a bug into the change")),
    out,
    takeaway("Nobody types changes straight onto live servers. The pipeline builds, tests, and rolls out a few servers at a time."),
  );
}
