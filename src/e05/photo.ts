/** Maya's photo, painted in code so the site needs no image rights: a London skyline at dusk. */
export function paintPhoto(w = 480, hgt = 320): string {
  const c = document.createElement("canvas");
  c.width = w; c.height = hgt;
  const g = c.getContext("2d")!;
  const sky = g.createLinearGradient(0, 0, 0, hgt);
  sky.addColorStop(0, "#1e2a6b"); sky.addColorStop(0.55, "#f08a5d"); sky.addColorStop(1, "#f7c873");
  g.fillStyle = sky; g.fillRect(0, 0, w, hgt);
  g.fillStyle = "#ffe8a3"; g.beginPath(); g.arc(w * 0.68, hgt * 0.62, hgt * 0.11, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#1a1530";
  const base = hgt * 0.78;
  // river
  g.fillRect(0, base, w, hgt - base);
  g.fillStyle = "rgba(255,200,140,0.35)"; for (let i = 0; i < 9; i++) g.fillRect(w * 0.6 + i * 6 - 20, base + 8 + i * 6, 40 - i * 3, 2);
  g.fillStyle = "#1a1530";
  // skyline
  const blocks = [[0.02, 0.18, 0.1], [0.12, 0.3, 0.07], [0.19, 0.22, 0.09], [0.45, 0.26, 0.08], [0.53, 0.16, 0.12], [0.78, 0.34, 0.06], [0.84, 0.2, 0.14]];
  for (const [x, hh, ww] of blocks) g.fillRect(w * x, base - hgt * hh, w * ww, hgt * hh);
  // clock tower
  const tx = w * 0.3, tw = w * 0.055;
  g.fillRect(tx, base - hgt * 0.5, tw, hgt * 0.5);
  g.beginPath(); g.moveTo(tx - 2, base - hgt * 0.5); g.lineTo(tx + tw / 2, base - hgt * 0.64); g.lineTo(tx + tw + 2, base - hgt * 0.5); g.fill();
  g.fillStyle = "#ffe8a3"; g.beginPath(); g.arc(tx + tw / 2, base - hgt * 0.43, tw * 0.3, 0, Math.PI * 2); g.fill();
  // wheel
  g.strokeStyle = "#1a1530"; g.lineWidth = 3; g.beginPath(); g.arc(w * 0.66, base - hgt * 0.2, hgt * 0.17, 0, Math.PI * 2); g.stroke();
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.beginPath(); g.moveTo(w * 0.66, base - hgt * 0.2); g.lineTo(w * 0.66 + Math.cos(a) * hgt * 0.17, base - hgt * 0.2 + Math.sin(a) * hgt * 0.17); g.lineWidth = 1; g.stroke(); }
  g.fillStyle = "rgba(255,255,255,0.9)"; g.font = `700 ${Math.round(hgt * 0.07)}px Space Grotesk, sans-serif`; g.fillText("Hi Sam! 👋", w * 0.05, hgt * 0.14);
  return c.toDataURL("image/jpeg", 0.85);
}

/** Tiles of the photo as divs, each showing its own slice. Sizes are relative, so the grid can be any width. */
export function tiles(url: string, cols: number, rows: number) {
  const out: HTMLElement[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const el = document.createElement("div");
    el.className = "ptile";
    el.style.cssText = `aspect-ratio:${(3 / 2) * (rows / cols)}; background-image:url(${url}); background-size:${cols * 100}% ${rows * 100}%; background-position:${(c / (cols - 1)) * 100}% ${(r / (rows - 1)) * 100}%`;
    el.dataset.i = String(r * cols + c);
    out.push(el);
  }
  return out;
}
