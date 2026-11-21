import { lib } from "./libs";
import { css, h, reducedMotion } from "./ui";

/** A chart box plus a ready Chart.js instance with the site's dark styling. */
export function chartBox(label: string, height = 240) {
  return h("div.chart-box", { style: `height:${height}px` }, h("canvas", { "aria-label": label, role: "img" }));
}

type DS = { label: string; data: number[]; colour: string; type?: "bar" | "line"; dash?: boolean; fill?: boolean; yAxisID?: string };

export async function makeChart(box: HTMLElement, type: "bar" | "line", labels: string[], sets: DS[], o: { yFmt?: (v: number) => string; yMax?: number; stacked?: boolean; xTitle?: string; yTitle?: string; y2?: boolean; y2Fmt?: (v: number) => string } = {}) {
  const { Chart } = await lib.chart();
  const grid = "rgba(120,140,220,0.12)", tick = css("--faint");
  const scales: Record<string, unknown> = {
    x: { stacked: o.stacked, ticks: { color: tick, maxRotation: 0, autoSkip: true }, grid: { color: grid }, title: o.xTitle ? { display: true, text: o.xTitle, color: tick } : undefined },
    y: { stacked: o.stacked, beginAtZero: true, max: o.yMax, ticks: { color: tick, callback: o.yFmt ? (v: unknown) => o.yFmt!(+(v as number)) : undefined }, grid: { color: grid }, title: o.yTitle ? { display: true, text: o.yTitle, color: tick } : undefined },
  };
  if (o.y2) scales.y2 = { position: "right", beginAtZero: true, ticks: { color: tick, callback: o.y2Fmt ? (v: unknown) => o.y2Fmt!(+(v as number)) : undefined }, grid: { display: false } };
  const chart = new Chart(box.querySelector("canvas")!, {
    type,
    data: {
      labels,
      datasets: sets.map((s) => ({
        label: s.label, data: s.data, type: s.type, yAxisID: s.yAxisID,
        backgroundColor: s.fill ? css(s.colour) + "33" : css(s.colour), borderColor: css(s.colour), borderWidth: 2, borderRadius: 3,
        borderDash: s.dash ? [5, 4] : undefined, pointRadius: 0, tension: 0.25, fill: !!s.fill,
      })),
    } as never,
    options: { maintainAspectRatio: false, animation: { duration: reducedMotion() ? 0 : 400 }, plugins: { legend: { labels: { color: css("--dim"), boxWidth: 12 } } }, scales } as never,
  });
  return {
    chart,
    set(i: number, data: number[]) { chart.data.datasets[i].data = data as never; },
    labels(l: string[]) { chart.data.labels = l as never; },
    update() { chart.update(); },
  };
}
