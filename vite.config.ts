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
  build: {
    rollupOptions: {
      // One HTML entry per page. Sub pages live in their own directory so
      // GitHub Pages serves them at clean URLs like /chat-bot/.
      input: ["index.html", "chat-bot/index.html"],
    },
  },
});
