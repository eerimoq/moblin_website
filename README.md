# Moblin website

Landing page for Moblin and the rest of the Moblin family: Mobcam, Moblink and
the remote control relays.

## Develop

```
npm install
npm run dev
```

## Build

```
npm run build
```

## Deploy

Every push to `main` builds the site and deploys it to GitHub Pages through
`.github/workflows/deploy.yml`. Enable Pages in the repository settings with
"GitHub Actions" as the source.

Without a custom domain the site is served from
https://eerimoq.github.io/moblin_website/ and the build uses `/moblin_website/`
as its base path. To serve it on a custom domain, add a `public/CNAME` file
containing the domain and point the domain's DNS at GitHub Pages. When that
file exists the build switches to `/` automatically (see `vite.config.ts`).
