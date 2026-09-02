# Moblin website

Landing page for Moblin and the rest of the Moblin family: Mobcam, Moblink and
the remote control relays.

Built with SolidJS, TypeScript and Tailwind CSS. Static, no backend.

## Develop

```
npm install
npm run dev
```

## Build

```
npm run build
npm run preview
```

The site is built into `dist/`.

## Deploy

Every push to `main` builds the site and deploys it to GitHub Pages through
`.github/workflows/deploy.yml`. Enable Pages in the repository settings with
"GitHub Actions" as the source.

To serve it on a custom domain, add a `public/CNAME` file containing the
domain and point the domain's DNS at GitHub Pages.

## Content

All links live in `src/data/links.ts`. The product cards are defined in
`src/data/products.ts` and the feature cards in `src/data/features.ts`.

Logos come from the `docs/logos` folder in the Moblin repository.
