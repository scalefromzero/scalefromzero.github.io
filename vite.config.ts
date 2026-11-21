import { defineConfig } from "vite";
import { readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// Every folder named eNN/ with an index.html becomes its own page: /e01/, /e02/, …
const episodes = readdirSync(__dirname, { withFileTypes: true })
  .filter((d) => d.isDirectory() && /^e\d\d$/.test(d.name) && existsSync(resolve(__dirname, d.name, "index.html")))
  .map((d) => d.name);

export default defineConfig({
  // Relative base: the same build works at scalefromzero.github.io/ (or any sub-path), on a custom domain, or in a preview.
  base: "./",
  build: {
    target: "es2022",
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      input: {
        hub: resolve(__dirname, "index.html"),
        ...Object.fromEntries(episodes.map((e) => [e, resolve(__dirname, e, "index.html")])),
      },
    },
  },
});
