# Moblin website

Landing page for Moblin and its companion apps.

- `frontend/` is the website (SolidJS, TypeScript and Tailwind), deployed to
  GitHub Pages on every push to `main`.
- `backend/` is a Rust service deployed at `https://api.moblin.app`, which
  lists the streamers who recently went live with Moblin.

## Prerequisites

Node.js, Rust, [just](https://github.com/casey/just), Python 3 with
`pip install -r requirements.txt`, and `oxfmt`, `oxlint` and `codespell` for
the checks.

## Develop

```
cd frontend && npm install
just dev
```

and open http://localhost:5174. It runs the backend with made-up streamers and
the frontend. Run `just` for the other recipes.

## Checks

```
just style
just lint
just spell-check
just test
```

CI runs the same commands.
