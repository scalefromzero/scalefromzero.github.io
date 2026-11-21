/** FNV-1a 32-bit, then a murmur-style finaliser so nearby strings spread evenly. Deterministic in every browser. */
export function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return h >>> 0;
}
export const MAX = 2 ** 32;

export type Point = { pos: number; server: string };

/** A hash ring with `vnodes` points per server. */
export class Ring {
  points: Point[] = [];
  constructor(public servers: string[], public vnodes = 1) { this.build(); }
  build() {
    this.points = this.servers.flatMap((s) => Array.from({ length: this.vnodes }, (_, i) => ({ pos: hash(this.vnodes === 1 ? s : `${s}#${i}`), server: s })));
    this.points.sort((a, b) => a.pos - b.pos);
  }
  /** Walk clockwise from the key's spot to the first server point. */
  lookup(key: string): string {
    const k = hash(key), p = this.points;
    let lo = 0, hi = p.length;
    while (lo < hi) { const m = (lo + hi) >> 1; if (p[m].pos < k) lo = m + 1; else hi = m; }
    return p[lo % p.length].server;
  }
  /** The next n distinct servers clockwise (for replicas). */
  replicas(key: string, n: number): string[] {
    const k = hash(key), p = this.points, out: string[] = [];
    let i = p.findIndex((x) => x.pos >= k); if (i < 0) i = 0;
    for (let j = 0; j < p.length && out.length < n; j++) { const s = p[(i + j) % p.length].server; if (!out.includes(s)) out.push(s); }
    return out;
  }
}

export const modLookup = (key: string, n: number) => `S${(hash(key) % n) + 1}`;
export const USERS = Array.from({ length: 20000 }, (_, i) => `user-${i}`);
