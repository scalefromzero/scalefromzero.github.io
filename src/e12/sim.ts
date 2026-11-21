import { seeded } from "../kit/episode";

export type Algo = "rr" | "wrr" | "lc" | "random" | "hash";
export type Srv = { id: number; weight: number; up: boolean; healthy: boolean; draining: boolean; active: number[]; served: number; fails: number };

/** A pool of servers behind a load balancer. Requests have a duration; each server works on up to `slots` at once (more = slower). */
export class Pool {
  servers: Srv[] = [];
  private rr = 0;
  private rnd = seeded(7);
  failed = 0; done = 0; waitSum = 0;
  constructor(n: number, public algo: Algo = "rr", weights?: number[]) { for (let i = 0; i < n; i++) this.add(weights?.[i] ?? 1); }
  add(weight = 1) { const id = this.servers.length + 1; this.servers.push({ id, weight, up: true, healthy: true, draining: false, active: [], served: 0, fails: 0 }); }
  /** Servers the load balancer will send to. If health checks are off, it still sends to dead ones. */
  candidates(checks: boolean) { return this.servers.filter((s) => !s.draining && (checks ? s.healthy : true)); }
  pick(checks: boolean, key?: number): Srv | null {
    const c = this.candidates(checks);
    if (!c.length) return null;
    switch (this.algo) {
      case "random": return c[Math.floor(this.rnd() * c.length)];
      case "lc": return c.reduce((a, b) => (b.active.length / b.weight < a.active.length / a.weight ? b : a));
      case "hash": return c[(key ?? 0) % c.length];
      case "wrr": { const list = c.flatMap((s) => Array(s.weight).fill(s)); return list[this.rr++ % list.length]; }
      default: return c[this.rr++ % c.length];
    }
  }
  /** Send one request that takes `dur` seconds of work. */
  send(dur: number, checks: boolean, key?: number) {
    const s = this.pick(checks, key);
    if (!s || !s.up) { this.failed++; if (s) s.fails++; return s; }
    s.active.push(dur); s.served++;
    return s;
  }
  /** Advance time. Each server splits its speed (= weight) across its active requests. */
  tick(dt: number) {
    for (const s of this.servers) {
      if (!s.up) { s.active = []; continue; }
      const n = s.active.length; if (!n) continue;
      const share = (s.weight * dt) / n;
      s.active = s.active.map((r) => r - share).filter((r) => { if (r <= 0) { this.done++; return false; } return true; });
      this.waitSum += n * dt;
    }
  }
}
