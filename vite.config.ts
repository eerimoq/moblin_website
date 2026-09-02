import { existsSync } from "node:fs";
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";

// On a custom domain (public/CNAME present) the site lives at the root.
// Until then GitHub Pages serves it from https://eerimoq.github.io/moblin_website/.
const base = existsSync("public/CNAME") ? "/" : "/moblin_website/";

export default defineConfig({
  base,
  plugins: [solid(), tailwindcss()],
});
