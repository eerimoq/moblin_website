# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

The landing page for Moblin (moblin.app) and its companion apps. Moblin Cloud, the streamers'
tip pages and their dashboard, is its own repository, `moblin_cloud`, at cloud.moblin.app. Two
independent projects live here:

- `frontend/` — a static site (SolidJS + TypeScript + Tailwind v4 + Vite), deployed to GitHub Pages.
- `backend/` — a small Rust (axum) service deployed at `https://api.moblin.app` as a Docker image, published by the Deploy images workflow on every tag. It serves the "Streamers" list and the "Erik is live on Twitch" status.

`README.md` only covers getting started; the rest is described below and in the code.

## Commands

All checks are driven by the `justfile` at the repo root (CI runs exactly these):

```
just style          # oxfmt (frontend) + cargo fmt (backend)
just style-check
just lint           # oxlint --deny-warnings + cargo clippy --all-targets -D warnings
just spell-check    # codespell, configured in .codespellrc
just test           # cargo test (backend only; the frontend has no tests)
```

`just system-test [--interactive] [pattern]` runs the black box system tests in `tests/` (Python, `systest`, like Moblin's `tests/`): they start the release backend and drive its API like Moblin and the frontend. Not run in CI; see `tests/README.md`.

Run a single backend test: `cd backend && cargo test store::tests::list_is_capped` (tests are inline `#[cfg(test)]` modules per file).

`just dev` starts everything in one terminal: `dev-backend` and `dev-frontend`. The development recipes are all in the `dev` group of `just --list`. Otherwise development needs two terminals:

```
just dev-backend    # cargo run --allow-unattested on port 8070 with backend/database.sqlite, then seeds fake streamers via scripts/seed_backend.py
just dev-frontend   # vite dev server on port 5174; proxies /api -> localhost:8070
```

`dev-backend` looks the tip pages up in Moblin Cloud's `just dev-backend` on port 8080, so the seeded `admin`, `premium` and `normal` streamers link to their pages while it runs and have none otherwise.

Frontend build: `cd frontend && npm run build` (runs `tsc --noEmit` first, so type errors fail the build).

## Frontend architecture

- **Multi-page, no router.** Each page is its own HTML entry listed in `vite.config.ts` (`index.html`, `chat-bot/index.html`, `docs/index.html`, `cards/index.html`) with its own `src/*.tsx` entry that renders a page component. Sub pages live in a directory so GitHub Pages serves clean URLs like `/chat-bot/`. Add a page by adding all three: the HTML file, the entry, and the `rollupOptions.input` line. `404.html` is what GitHub Pages serves for unknown paths; it renders a not found page, except for the addresses Moblin Cloud had on moblin.app (`/twitch/`, `/kick/`, `/dashboard/`, `/device/`, `/account/`, `/admin/`, `/page/`, `/terms/` and `/song-requests/`), which it redirects to the same path, query and hash on `https://cloud.moblin.app` (`not-found.tsx`), so old tip page links and bookmarks keep working.
- **Base path is dynamic.** `vite.config.ts` uses `/` when `public/CNAME` exists and `/moblin_website/` otherwise. Anything referencing a file under `public/` must go through `asset()` in `src/asset.ts`; never hardcode a leading slash in a src attribute.
- **Content lives in `src/data/`, not in components.** URLs in `links.ts` (Moblin Cloud's dashboard as `links.cloud`), products/features/reviews/chat-bot commands in their own files. Components in `src/components/` are one section each and are composed in order in `App.tsx`.
- **Backend access** goes through `links.api` in `data/links.ts`: `backendUrl` in `config.js`, a plain script every HTML entry loads before its module, so the backend is configured at deploy time, not build time: `public/config.js` has `/api` (proxied to the backend by the dev server), and the Deploy frontend workflow overwrites it in `dist/` with the repository variable `BACKEND_URL` (`https://api.moblin.app` for moblin.app), which GitHub Pages needs since it can't proxy `/api`. A new HTML entry needs the `<script src="/config.js"></script>` too. `data/streamers.ts` fetches the list once as a module-level SolidJS resource; each streamer's Tip page link and Moblin icon are the `page` the backend answers, absolute URLs on Moblin Cloud. `twitch.ts` polls `/twitch/live` every five minutes through `poll` in `src/poll.ts` (which runs the interval only while the tab is visible and refreshes once when it becomes visible again) and falls back to "not live" on any error; that is the only poll.
- **Theming** is Tailwind v4 `@theme` tokens in `src/index.css` (e.g. `bg-card`, `text-leaf`, `font-display`). Dark is the default; light is the same token names overridden under `prefers-color-scheme: light`. Use the tokens, not raw colors.
- **Localization** is `src/i18n.ts`: wrap every user-visible English string in `t("...")` (placeholders like `{name}` filled from the second argument) or `tRich("...", { link: <a>...</a> })` for sentences with elements in them. The English string is the key, and `scripts/translate.py` (`just machine-translate`, like Moblin's) finds them with a regex, so the first argument must be a double-quoted literal (or literals joined with `+`), never a variable. It also picks up the `<title>` of every HTML entry, which `i18n.ts` translates. Translations live in `src/locales/<code>.json`, one per language, and only the chosen one is loaded, with top-level await before any module using `t()` runs, so `t()` works at module level in `src/data/`. The language comes from the footer's picker (saved in `localStorage`, reloads the page) or the browser. Strings without a translation show in English; run `just machine-translate` after adding or changing strings. The trading cards and the generated settings reference stay English.
- Icons are inline stroke SVGs in `components/Icon.tsx` keyed by `IconName`; platform logos on a colored disc are `BrandIcon`.

## Backend architecture

One binary, `backend/src/main.rs`, wired together from the modules below. It stops on SIGTERM or Ctrl-C by finishing the requests in flight first (axum's graceful shutdown).

- `api.rs` — the axum router and `Api`; the handlers are in `api/streamers.rs`. Routes: `GET /streamers`, `POST /streamers/live/challenge`, `POST /streamers/live`, `GET /twitch/live`. The live post paths are registered outside this repo (in Moblin, under its `MOBLIN_WEBSITE_API_URL`) and must not be renamed. CORS allows only the origin of `--frontend-url` (env `FRONTEND_URL`), which has no default so a copy never points at moblin.app by mistake.
- `store.rs` — list of streamers, newest post first, kept in memory and saved in the `streamers` table on every change (one row per streamer, its channels with their profile, live flag and stream as JSON), so it survives restarts; pending lookups start over and the live check runs a minute after starting. It keeps the `--max-streamers` most recent posters (so a newcomer is still around when the live check runs a minute later) plus any older streamer who is still live, up to another `--max-streamers`; `streamers()` lists live streamers first, capped at `--max-streamers`. A streamer is identified by sharing any channel (platform + case-insensitive name); going live again moves to the top and keeps any already-looked-up profile and the live flag. Each listed channel carries a `Lookup` (pending with retry backoff, or done) that serializes flat into the channel JSON as `avatar`/`displayName`, plus `live` (only ever true for Twitch and Kick channels). `GET /streamers` adds each streamer's `page` from `cloud.rs`.
- `cloud.rs` — the streamers' Moblin Cloud tip pages. A background task asks Moblin Cloud's backend at `--cloud-url` (env `CLOUD_URL`, `https://cloud-api.moblin.app` for moblin.app) every minute for the pages of the listed streamers' Twitch and Kick logins, lowercase with Kick's `_` read as `-`, with `GET /pages/addresses?logins=twitch:<login>,kick:<slug>`, which answers an object keyed by the logins that have a page, each with the page's `url` and Moblin's `icon` (an image URL, or null). `GET /streamers` answers the first Twitch or Kick channel's page that is known as the streamer's `page`, null when none is; the last answer is kept while Moblin Cloud does not answer, and without `--cloud-url` there are no pages.
- `profiles.rs` — a background task that pulls the next due lookup from the store and resolves display name and avatar per platform (Twitch via Helix, YouTube via `og:` meta tags with unavatar.io fallback, Kick via `kick.rs`, its public channels API), with `--lookup-spacing` between requests.
- `app_attest.rs` — verifies Apple App Attest attestations and assertions so only the Moblin app can post live: `Attestation` is the base64 fields a client sends (`keyId`, `attestation`, `attestationChallenge` and the `assertion`, all optional so a missing one is a clear error), and `verify` checks them against the signed body of the live post. Stateless by design: the app resends its attestation every time and the server re-verifies the chain each time, deliberately ignoring certificate validity dates. Tests use public sample vectors in `src/testdata/`. Moblin Cloud has a copy of it for its WebSocket.
- `challenges.rs` — one-time 32-byte challenges, 120 s lifetime, that every live post must consume.
- `database.rs` — the SQLite database (`rusqlite`, SQLite bundled) at `--database`, in memory without it, holding only the `streamers` table, created with `CREATE TABLE IF NOT EXISTS` on start, so a schema change needs the existing database changed by hand.
- `twitch.rs` / `live.rs` / `live_status.rs` — Helix client with a cached app access token; a once-per-minute cache of whether the featured channel is live; and a background task that checks which listed channels are live every five minutes and one minute after a live post: all Twitch channels in one streams request, Kick channels one by one with `--lookup-spacing` between them.

Everything optional degrades rather than fails: without Twitch credentials, Twitch profiles come back empty and `/twitch/live` answers 503; without `--cloud-url`, the streamers have no tip pages. `--allow-unattested` disables App Attest for the live post, for local development and the system tests only.

## Conventions

- **Do not write comments or docstrings.**
- **Magic numbers are fine, and often preferred, when used in a single place.** Do not hoist a literal
  into a named constant just because it is a literal — only name it when the same value is used in more
  than one place.
- Rust edition 2024 (let-chains are used). Clippy warnings are errors in CI.
- The `/streamers/live` request shape (`channels`, `challenge`, `keyId`, `attestation`, `attestationChallenge`, header `moblin-assertion`) is a contract with the Moblin iOS app; changing it requires an app change too.
- `GET /pages/addresses` is a contract with Moblin Cloud's backend; changing it requires a change there too.
- Streamers appear in the list only if they opted in inside the Moblin app. Site copy must not imply that everyone who goes live is listed.

## Reporting

- Never mention styling or formatting changes (oxfmt, cargo fmt output) in summaries, reviews or commit
  messages.
