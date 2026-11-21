# Scale From Zero Labs

Interactive companion sites for **Scale From Zero**, the system design series that builds software from one computer to millions of users. Every episode gets its own page of hands-on labs, linked from the video description.

| Page | URL (after deploy) |
|---|---|
| Season hub + Episode 00 | `https://karamathalip.github.io/scale-from-zero/` |
| Episode 01, Inside One Computer | `https://karamathalip.github.io/scale-from-zero/e01/` |
| Episode 02, When the Cache Is Wrong | `https://karamathalip.github.io/scale-from-zero/e02/` |
| Episode 03, What's Really Behind Every App | `https://karamathalip.github.io/scale-from-zero/e03/` |
| Episode NN | `https://karamathalip.github.io/scale-from-zero/eNN/` |

## Run it

```bash
npm ci
npm run dev        # http://localhost:5173  (hub) and /e01/
npm run build      # type-checks, then writes dist/
npm run preview    # serves dist/ exactly as GitHub Pages will
```

Node 20 or newer.

## Deploy (GitHub Pages)

1. Push to `main`. `.github/workflows/deploy.yml` builds and publishes `dist/`.
2. One time only: repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.

The build uses relative paths, so it works under `/scale-from-zero/`, on a custom domain, or from any folder.

## Layout

```
index.html            season hub (E00 content, 3D tower, season map)
e01/ e02/ e03/        one index.html per episode
src/kit/              shared by every episode
  libs.ts             the animation toolbox, lazy-loaded (see below)
  season.ts           all 25 episodes: titles, floors, site on/off, YouTube links
  ui.ts               top bar, footer, lab sections, quiz, sound effects
  theme.css           colours, fonts and components from the videos
  labs.css            shared lab widgets (meters, slots, lanes, charts)
  flow.ts             boxes-and-arrows diagram with travelling tokens
  labs/scaling.ts     scale up vs scale out lab (E01, E03)
src/hub/              hub page code (three.js tower, Rough.js house lab)
src/eNN/              episode code; one file per lab in labs/
public/               fonts, sound effects and thumbnails from the videos
```

## The animation toolbox

Every library is installed from npm and bundled, but a page only downloads a library when one of its labs calls it (`await lib.three()`, `await lib.gsap()`, …).

| Key | Library | Use it for | Used in |
|---|---|---|---|
| `three` | three.js | 3D scenes | hub tower, E01 hierarchy, E03 3D map |
| `gsap` | GSAP + ScrollTrigger | timelines, tweened numbers, scroll stories | hub, E01, E02 hero, E03 map trace |
| `d3` | D3 | data-driven SVG, log scales, axes | E01 latency ladder, E03 flat map |
| `chart` | Chart.js | live line and bar charts | E01 cache labs, E02 sale day/TTL/eviction, E03 monitoring |
| `matter` | Matter.js | 2D physics | E01 power cut |
| `pixi` | PixiJS | thousands of moving sprites (requests, packets) | E01 + E03 scaling, E02 hit and miss |
| `anime` | anime.js | staggered DOM/SVG sequences | E01 bits/CPU, E03 restaurant/pipeline |
| `rough` | Rough.js | hand-drawn diagrams | hub house, E01 desk, E02 whiteboard |
| `motion` | Motion | springy UI micro-animations | available |
| `p5` | p5.js | creative-coding sketches | available |
| `lottie` | lottie-web | After Effects / Lottie animations | available |
| `lenis` | Lenis | smooth scrolling | available |

Add a library: `npm i <package>`, then add one line to `src/kit/libs.ts`.

Licences: all MIT/ISC except p5.js (LGPL-2.1) and GSAP (free "standard" licence, not OSI open source; fine for this use).

## Add an episode page

1. Copy `e01/index.html` to `eNN/index.html`. Change the `<title>`, description, `og:image` and the script path to `/src/eNN/main.ts`.
2. Create `src/eNN/main.ts` (copy `src/e01/main.ts`) and put one lab per file in `src/eNN/labs/`.
3. In `src/kit/season.ts`, set `site: true` for the episode. Its window lights up on the hub tower and its card links to the page.
4. When the video is public, paste its link into `youtube`. Every lab's chapter button then jumps to that moment in the video.
5. `npm run build`, check `npm run preview`, push.

Vite finds every `eNN/index.html` automatically, so nothing else needs changing.

## Rules the labs follow

- Every lab maps to a video chapter, with the same words and numbers as the narration.
- Numbers are rounded orders of magnitude, with sources on the page.
- Works on a phone, and respects "reduce motion".
- Sound effects are off until the viewer turns them on.
- No sign-up, no tracking. Only the viewer's sound setting is remembered, in their own browser.
