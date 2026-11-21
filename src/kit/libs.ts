/**
 * The animation & visualisation toolbox shared by every episode site.
 *
 * Every library is installed from npm and bundled by Vite, but loaded lazily:
 * a page downloads a library only when one of its labs calls `lib.x()`.
 * Adding a library: `npm i <pkg>`, then add one line below.
 *
 * | key       | package      | best for                                              | licence |
 * |-----------|--------------|-------------------------------------------------------|---------|
 * | three     | three        | 3D scenes (hierarchies, buildings, globes, packets)   | MIT     |
 * | gsap      | gsap         | timelines, scroll-linked storytelling (ScrollTrigger) | GSAP standard licence (free, incl. plugins) |
 * | motion    | motion       | small springy UI animations, inView/scroll helpers    | MIT     |
 * | anime     | animejs      | staggered SVG/DOM sequences, morphing                 | MIT     |
 * | d3        | d3           | data-driven SVG: scales, axes, log charts, layouts    | ISC     |
 * | chart     | chart.js     | quick live charts (line/bar)                          | MIT     |
 * | matter    | matter-js    | 2D physics (things falling, colliding, piling up)     | MIT     |
 * | pixi      | pixi.js      | fast 2D WebGL sprites/particles (thousands of requests)| MIT    |
 * | p5        | p5           | creative-coding sketches, generative visuals          | LGPL-2.1 |
 * | rough     | roughjs      | hand-drawn diagram style                              | MIT     |
 * | lottie    | lottie-web   | playing After Effects/Lottie JSON animations          | MIT     |
 * | lenis     | lenis        | smooth scrolling                                      | MIT     |
 */
export const lib = {
  three: () => import("three"),
  threeOrbit: () => import("three/examples/jsm/controls/OrbitControls.js"),
  gsap: async () => {
    const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
    gsap.registerPlugin(ScrollTrigger);
    return { gsap, ScrollTrigger };
  },
  motion: () => import("motion"),
  anime: () => import("animejs"),
  d3: () => import("d3"),
  chart: async () => {
    const m = await import("chart.js");
    m.Chart.register(...m.registerables);
    return m;
  },
  matter: () => import("matter-js").then((m) => m.default ?? m),
  pixi: () => import("pixi.js"),
  p5: () => import("p5").then((m) => m.default),
  rough: () => import("roughjs").then((m) => m.default),
  lottie: () => import("lottie-web").then((m) => m.default),
  lenis: () => import("lenis").then((m) => m.default),
} as const;

export type LibKey = keyof typeof lib;
