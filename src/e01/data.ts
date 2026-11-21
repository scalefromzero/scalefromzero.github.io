/** Episode 1 numbers. Order-of-magnitude latencies; real hardware varies by 2–10×.
 *  Sources: Peter Norvig, "Teach Yourself Programming in Ten Years" (latency table);
 *  Colin Scott, "Latency numbers every programmer should know" (interactive, by year). */

export interface Op { key: string; label: string; ns: number; layer: "cpu" | "cache" | "ram" | "storage" | "net"; note: string }

export const OPS: Op[] = [
  { key: "l1", label: "Read from L1 cache", ns: 1, layer: "cache", note: "the page in your hands" },
  { key: "l2", label: "Read from L2 cache", ns: 4, layer: "cache", note: "a little further away" },
  { key: "l3", label: "Read from L3 cache", ns: 15, layer: "cache", note: "shared by all cores" },
  { key: "ram", label: "Read from RAM", ns: 100, layer: "ram", note: "the desk" },
  { key: "ssd", label: "Read from an SSD", ns: 100_000, layer: "storage", note: "the filing cabinet" },
  { key: "dc", label: "Data-centre round trip", ns: 500_000, layer: "net", note: "another machine in the same building" },
  { key: "hdd", label: "Hard disk seek", ns: 5_000_000, layer: "storage", note: "a spinning platter and a moving arm" },
  { key: "net", label: "Internet round trip", ns: 100_000_000, layer: "net", note: "another computer, another continent" },
];

/** Human time if 1 ns lasted 1 s. */
export function human(seconds: number): string {
  const units: [number, string][] = [[31_557_600, "year"], [2_629_800, "month"], [86_400, "day"], [3600, "hour"], [60, "minute"], [1, "second"]];
  for (const [s, name] of units) {
    if (seconds >= s) {
      const v = seconds / s;
      const r = v >= 10 ? Math.round(v) : Math.round(v * 10) / 10;
      return `${r} ${name}${r === 1 ? "" : "s"}`;
    }
  }
  return `${Math.round(seconds * 1000) / 1000} seconds`;
}

/** Real time, in the unit people use. */
export function real(ns: number): string {
  if (ns >= 1e9) return `${+(ns / 1e9).toPrecision(3)} s`;
  if (ns >= 1e6) return `${+(ns / 1e6).toPrecision(3)} ms`;
  if (ns >= 1e3) return `${+(ns / 1e3).toPrecision(3)} µs`;
  return `${+ns.toPrecision(3)} ns`;
}

export const SOURCES = [
  ["Norvig, latency numbers", "https://norvig.com/21-days.html#answers"],
  ["Colin Scott, latency by year", "https://colin-scott.github.io/personal_website/research/interactive_latency.html"],
];
