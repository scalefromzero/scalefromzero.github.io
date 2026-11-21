import { lib } from "../../kit/libs";
import { h, sfx, takeaway, css, fmt } from "../../kit/ui";

/** The manager with the clipboard: logs, metrics and alerts, plus a load balancer that checks health. */
export async function monitoringLab(bench: HTMLElement) {
  const N = 5;
  const alive = Array(N).fill(true), inRotation = Array(N).fill(true);
  let monitoring = true, clock = 5 * 60, sinceCheck = 0, angry = 0, alerted = false;
  const fleet = h("div.fleet", { style: "grid-template-columns: repeat(5, minmax(0,1fr))" });
  const logs = h("div.logs", { "aria-live": "off" });
  const alert = h("div.alert", { role: "alert" });
  const mon = h("input#mon", { type: "checkbox", checked: true }) as HTMLInputElement;
  const kill = h("button.btn", { type: "button", style: "border-color:var(--bad)" }, "Server 4 quietly dies");
  const heal = h("button.btn", { type: "button" }, "Restart everything");
  const clockEl = h("span.chip.tnum", {}, "10:05:00");
  const vFail = h("span.v.tnum", { style: "color:var(--bad)" }, "0%"), vAngry = h("span.v.tnum", { style: "color:var(--storage)" }, "0");
  const chartBox = h("div.chart-box", { style: "height:200px" }, h("canvas", { "aria-label": "Requests and failures per second" }));
  const paintFleet = () => {
    fleet.innerHTML = "";
    for (let i = 0; i < N; i++) fleet.append(h(`div.srv${alive[i] ? "" : ".dead"}`, {}, `server ${i + 1}`, h("br"), alive[i] ? "healthy" : inRotation[i] ? "dead, still sent orders" : "dead, removed"));
  };
  paintFleet();
  bench.append(
    h("div.row", { style: "justify-content:space-between; margin-bottom:12px" }, h("div.row", {}, kill, heal, h("label.row", { for: "mon", style: "gap:8px; color:var(--dim)" }, mon, "Monitoring and health checks")), clockEl),
    fleet,
    h("div.bench-grid", { style: "margin-top:14px" },
      h("div", { style: "display:grid; gap:8px" }, h("span.eyebrow", {}, "Logs · one line per request"), logs),
      h("div", { style: "display:grid; gap:8px" }, h("span.eyebrow", {}, "Metrics · numbers over time"), chartBox),
    ),
    alert,
    h("div.stats", { style: "margin-top:12px" }, h("div.stat", {}, vFail, h("span.k", {}, "requests failing right now")), h("div.stat", {}, vAngry, h("span.k", {}, "angry posts from fans"))),
    h("p.note", {}, "Alert rule: if more than 1 request in 20 fails, wake the engineer on duty. The load balancer checks every server every 3 seconds."),
    takeaway("Logs tell you what happened to one order. Metrics tell you how the whole room is doing. Alerts wake someone up before customers notice."),
  );
  const { Chart } = await lib.chart();
  const labels: string[] = [], okS: number[] = [], failS: number[] = [];
  const chart = new Chart(chartBox.querySelector("canvas")!, {
    type: "line",
    data: { labels, datasets: [
      { label: "requests/s", data: okS, borderColor: css("--ram"), borderWidth: 2, pointRadius: 0, tension: 0.3 },
      { label: "failures/s", data: failS, borderColor: css("--bad"), backgroundColor: "rgba(248,113,113,0.15)", fill: true, borderWidth: 2, pointRadius: 0, tension: 0.3 },
    ] },
    options: { animation: false, maintainAspectRatio: false, scales: { x: { ticks: { color: css("--faint"), maxTicksLimit: 5 }, grid: { display: false } }, y: { min: 0, max: 600, ticks: { color: css("--faint") }, grid: { color: "rgba(120,140,220,0.08)" } } }, plugins: { legend: { labels: { color: css("--dim"), boxWidth: 12 } } } },
  });
  const t = (s: number) => `10:${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const logLine = (text: string, err: boolean) => { logs.append(h(`div.${err ? "err" : "ok"}`, {}, text)); while (logs.children.length > 9) logs.firstElementChild!.remove(); };
  mon.addEventListener("change", () => { monitoring = mon.checked; if (!monitoring) { alert.classList.remove("on"); alerted = false; } sfx("pop", 0.2); });
  kill.addEventListener("click", () => { alive[3] = false; paintFleet(); sfx("powerdown", 0.35); });
  heal.addEventListener("click", () => { alive.fill(true); inRotation.fill(true); alerted = false; alert.classList.remove("on"); paintFleet(); sfx("hit", 0.3); });
  let seat = 80, vis = true;
  new IntersectionObserver((e) => (vis = e[0].isIntersecting)).observe(bench);
  setInterval(() => {
    if (!vis) return;
    clock++; sinceCheck++;
    clockEl.textContent = t(clock);
    const rot = inRotation.map((v, i) => (v ? i : -1)).filter((i) => i >= 0);
    const total = 500 + Math.round(Math.random() * 40);
    const per = total / rot.length;
    const fails = Math.round(rot.filter((i) => !alive[i]).length * per);
    if (monitoring && sinceCheck >= 3) { sinceCheck = 0; alive.forEach((a, i) => { if (!a && inRotation[i]) { inRotation[i] = false; logLine(`${t(clock)} load balancer: server ${i + 1} failed its health check, removed`, true); paintFleet(); } }); }
    labels.push(t(clock).slice(3)); okS.push(total - fails); failS.push(fails);
    if (labels.length > 40) { labels.shift(); okS.shift(); failS.shift(); }
    chart.update();
    const rate = fails / total;
    vFail.textContent = `${fmt(rate * 100)}%`;
    for (let k = 0; k < 2; k++) {
      const srv = rot[Math.floor(Math.random() * rot.length)];
      const ok = alive[srv];
      logLine(`${t(clock)} POST /buy seat ${seat++} → ${ok ? "200" : "503"} (server ${srv + 1})`, !ok);
    }
    if (rate > 0.05) {
      if (monitoring && !alerted) { alerted = true; alert.textContent = `ALERT ${t(clock)} · ${fmt(rate * 100)}% of requests failing (limit 5%) · paging the engineer on duty`; alert.classList.add("on"); sfx("miss", 0.4); }
      if (!monitoring) { angry += Math.round(rate * 40); vAngry.textContent = fmt(angry); }
    }
    if (rate === 0 && alerted && alive.some((a) => !a)) alert.textContent = `${alert.textContent!.split(" · paging")[0]} · resolved by the load balancer; engineer replaces server 4`;
  }, 1000);
}
