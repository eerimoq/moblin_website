# Moblin website

Landing page for Moblin and the rest of the Moblin family: Mobcam, Moblink and
the remote control relays.

The website lives in `frontend/` and its backend in `backend/`.

## Develop

```
cd frontend
npm install
npm run dev
```

The "Streamers" section is fetched from the backend in `backend/`, a small
Rust service the deployed site expects at `https://api.moblin.app`. The dev
server proxies `/api` to one running locally, so start it in another terminal:

```
just backend-run
```

## Backend

The Moblin app tells the backend who went live by posting to
`/streamers/live`. Only the Moblin app itself may do so: every post is signed
with [App Attest](https://developer.apple.com/documentation/devicecheck/establishing-your-app-s-integrity),
and the backend verifies the attestation and assertion before listing anyone
(see `backend/src/app_attest.rs`). Posts must carry a fresh one-time
challenge from `/streamers/live/challenge`.

The App ID and App Attest environment the backend accepts default to the
distributed Moblin app, and can be changed with `--app-id` and
`--app-attest-environment` (apps installed by Xcode use the `development`
environment). `just backend-run` starts the backend with `--allow-unattested`
so that `scripts/seed_backend.py` can fill it with made-up streamers.

Twitch display names and avatars come from the
[Helix users endpoint](https://dev.twitch.tv/docs/api/reference/#get-users),
authenticated with an app access token from the
[client credentials grant flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#client-credentials-grant-flow).
Register an application in the
[Twitch developer console](https://dev.twitch.tv/console/apps) and pass its
client ID and secret with `--twitch-client-id` and `--twitch-client-secret`
(or `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET`). Without them Twitch
streamers are listed without a display name and avatar.

## Build

```
cd frontend
npm run build
```

## Deploy

Every push to `main` builds the site and deploys it to GitHub Pages through
`.github/workflows/deploy.yml`. Enable Pages in the repository settings with
"GitHub Actions" as the source.

Without a custom domain the site is served from
https://eerimoq.github.io/moblin_website/ and the build uses `/moblin_website/`
as its base path. To serve it on a custom domain, add a `frontend/public/CNAME` file
containing the domain and point the domain's DNS at GitHub Pages. When that
file exists the build switches to `/` automatically (see
`frontend/vite.config.ts`).
