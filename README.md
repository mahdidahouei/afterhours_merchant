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
| `/claim` | Owner self-service — find → verify → details → scan → build → photos → bookings |
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
    self-service/  the claim flow (9 screens, 23 endpoints)
    wizard/        card / body / actions shared by connect and contact
    legal/         markdown-backed legal pages
    errors/        404 and whole-screen failure
```

`ui/` never imports from `features/`, and features never import each other.

## Owner self-service

`/claim` runs against the real owner API. `VITE_USE_MOCK` still exists and still
switches in `api/mock.ts`, but it is `false` everywhere now — development, the
Pages deploy and production alike. Nothing above the `OwnerApi` interface knows
the difference, so flipping it back is a one-line rollback if the API goes down
mid-demo.

```
VITE_USE_MOCK=false  # everywhere. true swaps in the in-memory stand-in.
```

The mock is tree-shaken out of a `false` build entirely — no seed data, no
storage helpers, no "Screens" panel.

> **The API allowlists CORS origins.** `localhost:5173`, `merchant.afthr.com`,
> `afthr.com` and `dev-merchant.afthr.com` are on it;
> `afterhours-merchant.mahdidahouei.com` is **not**, so every call from the Pages
> deploy fails until it is added. Nothing in this repo can work around that —
> Pages is static, so there is nothing to proxy through.

The six steps, and what each one calls:

| Step | Screen | Endpoints |
| --- | --- | --- |
| 1 | Find your restaurant | `GET /places` |
| 2 | Verify ownership | `POST /verifications` · `POST /sessions` · `POST /claim-tickets` |
| 3 | Check your details | `PATCH /claim/place` · `POST /claim/profile` |
| 4 | Build your profile | `GET /taxonomy` · `PUT /claim/profile` |
| 5 | Add your photos | `POST/PATCH/DELETE /claim/photos` · `POST /claim/social/{provider}/connect` |
| 6 | Connect bookings | `GET /reservation-platforms` (+ `/guide`, both live) · `POST /claim/reservation` · `POST /claim/submit` |

### Going back

The journey rail and the mobile stepper are navigation once a profile exists:
any of steps 3–6 can be returned to, in either direction. Step 3 keeps working
after the profile is drafted — `PATCH /claim/place` accepts the listing facts
throughout — so fixing a phone number does not mean redoing anything, and it
never re-runs the website scan over a profile that has since been edited by
hand.

Screens holding unsaved edits register a `leaveGuard` so the rail saves them on
the way out, or stays put and shows the error if that save fails.

### Coming back

Every visit to `/claim` starts at the search box. A session is something an
owner establishes by verifying, there and then — a token left in the browser by
a previous visit is dropped on arrival, so it can never short-circuit the first
step.

After verification, `POST /sessions` returns the claim and its `status` decides
the screen: `scan_failed` reopens on the details form with the error, `submitted`
on the waiting screen, `live` on the finished listing, and so on.

**What the API cannot say is which of the four editing screens they were last
on**, because `drafted` is a single status covering details, build, photos and
bookings. A returning owner therefore lands on Build your profile, and walks
forward from there — nothing is lost, and every step remains reachable from the
rail.

That is deliberate. Guessing the step from photo counts, or remembering it in
`localStorage`, would both be the client inventing a fact the server never
stated, and the second would be wrong the moment the owner opened the claim on
another device. **Add a step field to `Claim`** and `SelfServicePage` seeds
`draftedStep` from it; `FIRST_DRAFTED_STEP` in `stages.ts` marks the spot.

Only two things are stored in the browser: the bearer token for the current
session, and — in development only — the mock's own claim, which stands in for
the server's database.

## Updates

The service worker installs a new build, activates it and claims open tabs on
its own — there is no "a new version is available" bar, and no way for someone
to sit on a stale build because they never pressed it. The next load after a
deploy is the new version.

An already-open tab is deliberately *not* reloaded out from under whoever is
using it; that would discard a half-filled form on `/claim`. It keeps running
the build it started with until it next loads — except when it asks for a lazy
chunk the deploy has deleted, which reloads it automatically rather than
blanking the section.

## Maps

The details step draws the listing on Mapbox. The token is public by design but
GitHub's push protection rejects Mapbox tokens, so it is never committed:

```bash
echo 'VITE_MAPBOX_TOKEN=pk.…' > .env.development.local   # gitignored
```

For the Pages deploy, set a repository secret named `MAPBOX_TOKEN` — the
workflow writes it into `dist/config.js` after the build. In Kubernetes it goes
in the ConfigMap beside `API_BASE_URL`.

Without a token the map falls back to the address and a Google Maps link.

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

The Pages build sets `VITE_USE_MOCK=false` and points at the dev API through
`public/config.js`, so the deploy exercises the real thing.

**It will fail on every call until `afterhours-merchant.mahdidahouei.com` is
added to the API's CORS allowlist.** The requests come back with no
`Access-Control-Allow-Origin` and the browser drops them before the app sees a
response — which surfaces as "We couldn't reach Afterhours", since a blocked
response and an unreachable server are indistinguishable from script.

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
