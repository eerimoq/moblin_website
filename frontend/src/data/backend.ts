/** Where the backend in `backend/` is: `backendUrl` in `config.js`, which every page loads before its own code, `/api` on the same domain unless the deploy replaces it; the dev server proxies `/api` to a local one (see `vite.config.ts`). */
import { links } from "./links";

export const backendUrl = links.api;
