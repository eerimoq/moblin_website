/** Where the backend in `backend/` is; the dev server proxies `/api` to a local one (see `vite.config.ts`). */
import { links } from "./links";

export const backendUrl = import.meta.env.DEV ? "/api" : links.api;
