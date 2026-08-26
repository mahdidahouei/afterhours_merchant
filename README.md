# Afterhours — Merchant

The public Afterhours site for restaurants: the marketing landing page and the
connect widget that links a restaurant's reservation platform to Afterhours.

## Getting started

```bash
npm install
npm run dev
```

The dev server reads `.env.development` for the API base URL. To exercise the
service worker you need a real build:

```bash
npm run build && npm run preview
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck, then production build into `dist/` |
| `npm run preview` | Serve `dist/` — the only way to test the service worker |
| `npm run lint` | ESLint, zero warnings tolerated |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run format` | Prettier, including Tailwind class sorting |

## Routes

| Path | Page |
| --- | --- |
| `/` | Landing |
| `/connect` | Connect wizard — restaurant → platform → guide steps → success |
| `/claim` | Owner self-service — find → verify → details → scan → review → photos |
| `/contact-us` | Two-part contact form |
| `/terms-and-conditions` | Markdown from `public/legal/` |
| `/privacy-policy` | Markdown from `public/legal/` |
| `*` | 404 |

## Project layout

```
public/            fonts, hero media, legal markdown, runtime config.js
src/
  app/             providers, router, analytics, service-worker prompt
  lib/             cn, env, api client, error system, hooks
  styles/          tokens.css · fonts.css · global.css
  ui/              Button, TextField, Textarea, Select, SearchField,
                   Dialog, Drawer, Spinner, Skeleton, VideoPlayer,
                   ErrorState, ErrorBoundary
  features/
    landing/       page, 10 sections, and all copy under content/
    connect/       the wizard, its API layer and step machine
    contact/       the contact form
    self-service/  the claim flow (8 screens, 15 endpoints)
    wizard/        card / body / actions shared by connect and contact
    legal/         markdown-backed legal pages
    errors/        404 and whole-screen failure
```

`ui/` never imports from `features/`, and features never import each other.

## Owner self-service

`/claim` is built against an API that is not live yet. Development runs against
an in-memory stand-in:

```
VITE_USE_MOCK=true   # .env.development — the whole flow is clickable
VITE_USE_MOCK=false  # .env.production  — real endpoints
```

The mock reproduces the contract's latency, status transitions and error codes.
In it, the OTP `000000` fails and any other six digits succeed. Turning the flag
off is the only change needed when the backend ships.

## Configuration

`public/config.js` sets `window.__ENV__` before the app bundle parses:

```js
window.__ENV__ = { API_BASE_URL: "https://dev-api.afthr.com/api/v1/owner" };
```

In Kubernetes a per-environment ConfigMap is mounted over that file, so the same
image is built once and promoted through environments unchanged. Locally the app
falls back to `VITE_API_BASE_URL` from the `.env` files.

## Deployment

Two targets, one codebase. Everything that references an asset by URL goes
through `import.meta.env.BASE_URL` (see `src/lib/assetUrl.ts`), so the app works
at the domain root and under a subpath without a second build config.

### GitHub Pages

Live at **https://afterhours-merchant.mahdidahouei.com**

`.github/workflows/deploy.yml` builds and publishes on every push to `main`.
Because the site is served from the root of a custom domain, it builds with
`BASE_PATH=/`. It also writes `dist/CNAME` (Pages reads the custom domain from
the published artifact — without it, deploying from Actions can clear the
domain set in Settings), copies `index.html` to `404.html` (Pages has no rewrite
rules, so that is how a deep link reaches the router), and drops a `.nojekyll`.

Moving back to a bare `<user>.github.io/<repo>/` site means dropping the CNAME
step and setting `BASE_PATH` to `/${{ github.event.repository.name }}/`. Nothing
in the app changes — every asset URL already resolves against
`import.meta.env.BASE_URL`.

The Pages build sets `VITE_USE_MOCK=true`: the owner API is not live yet, so
without it every screen past the search box would be an error state. It also
turns on the "Screens" jump-to panel, which is what makes the deploy browsable.
Set it to `false` once the API ships.

### Container

`docker build` produces an nginx image serving `dist/` at the domain root. `nginx.conf` sets the
cache headers that matter: content-hashed `/assets/` immutable for a year,
`config.js` and `sw.js` never cached, HTML always revalidated.

`cloudbuild.yaml` builds the image, pushes it, and updates the dev overlay in
the manifests repo.

## Adding things

- **A new FAQ entry, partner tag or benefit** — edit the matching file in
  `src/features/landing/content/`. No component changes.
- **A new landing section** — add it under `sections/`, then add one entry to
  the `SECTIONS` list in `LandingPage.tsx`. It is lazy-loaded and wrapped in its
  own error boundary automatically.
- **A new page** — add a feature folder and one route in `src/app/router.tsx`.

See `CLAUDE.md` for the conventions that keep the above true.
