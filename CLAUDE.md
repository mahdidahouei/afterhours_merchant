# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Commands

```bash
npm run dev        # Vite dev server
npm run build      # typecheck + production build
npm run preview    # serve dist/ (the only way to exercise the service worker)
npm run lint       # ESLint, zero warnings tolerated
npm run typecheck  # tsc --noEmit
```

## What this is

The public Afterhours site for restaurants: a marketing landing page and a
four-step wizard that connects a restaurant's reservation platform. There is no
authenticated area and no dashboard — every route is public.

Routes: `/` · `/connect` · `/claim` · `/contact-us` · `/terms-and-conditions` ·
`/privacy-policy` · `*` (404).

`/claim` is owner self-service, in six steps: find your listing, verify by SMS,
check your details, build the drafted profile, add photos, connect bookings.
Step 6 is the old Connect widget folded in — `/connect` is retired once this is
live. See `docs/specs/2026-08-24-owner-self-service-design.md`.

## Working conventions

**Sizes are Figma logical pixels.** A number in a design maps 1:1 to CSS `px`.
Write `h-[44px]`, not a rem conversion.

**Desktop is the default context.** Unless smaller screens are explicitly
mentioned, a layout instruction refers to desktop. Don't touch `max-*` variants
speculatively.

## Architecture

```
src/
  app/        bootstrap: providers, router, analytics, service-worker prompt
  lib/        cross-cutting: cn, env, api client, errors, hooks
  styles/     tokens.css (single source of truth), fonts.css, global.css
  ui/         generic primitives — no app knowledge, never import from features/
  features/
    landing/  page + sections/ + components/ + content/ + hooks/
    connect/  page + steps/ + components/ + api.ts + types.ts + steps.ts
    contact/  page + steps/ + api.ts + schema.ts
    self-service/  the claim flow — api/ + session/ + stages/ + components/
    wizard/   card / body / actions shared by connect and contact
    legal/    markdown-backed terms and privacy
    errors/   404 and the whole-screen failure page
```

Rules that keep this navigable:

- `ui/` must never import from `features/`.
- Features must not import from each other. Shared wizard chrome lives in
  `features/wizard/`.
- **All copy lives in `features/landing/content/`.** Adding an FAQ entry or a
  partner tag is a data edit, never a component edit.

## Styling

**`src/styles/tokens.css` is the only place a brand colour or radius is
defined.** Tailwind maps to those custom properties (`"color-primary":
"var(--color-primary)"`), and the few CSS Modules read the same variables. Never
hard-code a hex outside that file.

Each mapped colour is declared twice: `--x-rgb` holds bare `R G B` channels and
`--x` is the `rgb(...)` the CSS Modules read. Tailwind takes the channel form
with `<alpha-value>`, so **opacity modifiers work** (`bg-color-primary/50`).
Adding a colour means adding both halves and the `tailwind.config.ts` entry —
half of it and the `/NN` variants silently generate nothing, with no error.

Tailwind for layout; `.module.scss` only for the four form primitives whose
focus and floating-label states Tailwind expresses badly.

**The base type scale in `global.css` is load-bearing.** `body` stays at the
browser's 16px while `p`, `a` and `button` step down to 14px. Unstyled
containers inherit that 16px line-height, and it sets the height of every pill
and tag that doesn't declare its own. Changing it shifts layout site-wide.

## Assets

One rule, no exceptions:

```ts
import Logo from "./logo.svg?react";  // React component
import logoUrl from "./logo.svg";     // URL string
```

`src/assets/` mirrors the feature tree. Large raster art is WebP; only small
icons stay PNG. `public/` holds what must keep a stable URL: fonts, hero media,
legal markdown, and `config.js`.

## Self-service

`claim.status` decides the screen and nothing else — not `kind`, not which call
just returned. Stages 0–2 happen before a claim exists, so those three are local
page state; everything after is a function of status. `stages.ts` holds that
mapping.

**`drafted` is the exception, and the only one.** One status covers four
screens — details, build, photos, bookings — so `draftedStep` is session state
on the page. It starts at `FIRST_DRAFTED_STEP` and is moved only by the owner:
the rail, and the Back/Next buttons. Nothing persists it.

**Do not reintroduce a client-side guess at which step they were on.** Deriving
it from photo counts or a localStorage note both invent a fact the server never
stated, and the note is wrong as soon as the claim is opened on another device.
When `Claim` grows a step field, seed `draftedStep` from the `POST /sessions`
response and delete `FIRST_DRAFTED_STEP`.

Arriving at `/claim` always shows the search box and clears any stored token —
in a `useState` initialiser, not an effect, because `useClaim` reads the token
during render.

Those four are also navigable in both directions from the journey rail, so an
owner can go back and fix something. Two of them hold unsaved edits in local
state, so the rail cannot just call `setDraftedStep` — the screen registers a
`leaveGuard` (`session/leaveGuard.ts`) that saves first and can refuse to leave.
Anything new that holds a draft must register one too, or the rail will discard
it silently. Steps 1–2 are never navigable: a search box and a one-time code
have nothing to edit.

Every mutation returns the complete claim, so `useClaimMutation` replaces the
cache rather than invalidating it. Never merge, never refetch after a write.

`PUT /claim/profile` replaces outright: every save posts the whole Profile, even
when one accordion changed. Phone is a listing fact and goes to
`PATCH /claim/place`; email, socials and reservations are profile.

`PATCH /claim/place` takes `{set, value}` for its nullable fields — omitted means
unchanged, `set: true` with an empty value clears. Use `write()` / `keep()` from
`api/types.ts` rather than building those by hand. It has **no `address`**: the
address is Google's and the directory keys off it, so the details screen shows it
read-only.

`Profile.reservationPlatforms` is free text the scan read off the website.
`Claim.reservation` is a live integration. Not the same thing.

**Step 6 is the connect widget, and it is not mocked.** `GET
/reservation-platforms` and `/reservation-platforms/{id}/guide` are public and
live, so `mock.ts` delegates both to `httpOwnerApi` — the three platforms, their
logos, the markdown and the videos are real. Three things about the payload bite:
`need` is `[]` (truthy!) when a step wants nothing, so read it through
`needOf()`; `step` is not an index (Formitable's second step is numbered 0);
and credentials accumulate across steps — Formitable asks for an API key on step
1 and a restaurant key on step 2, and both go in one `POST /claim/reservation`.
`body` lines are markdown and must be rendered as such.

The API is not live yet. `VITE_USE_MOCK=true` (default in development) swaps in
`api/mock.ts`, a contract-faithful in-memory server that persists its claim to
localStorage so a reload resumes instead of looking like an expired session.
Everything above the `OwnerApi` interface cannot tell the difference. Verify with
`grep -r "Oli Mazi" dist/` that it stays out of production builds.

Two controls the design draws still have no field in the contract: menu-file
language and the primary-platform star. They are marked `PENDING_API` in
`api/types.ts` and hold local state. Everything else that used to be listed here
has landed — IG/TikTok are real OAuth, bookings are a real integration.

## Errors

`src/lib/errors/` is the whole system:

- The Axios response interceptor converts every failure to an `AppError` at the
  boundary, so **every `catch` and every React Query `error` in the app is
  already an `AppError`** — components never touch Axios.
- `AppError.kind` is a closed set of eight; `isRetryable` drives whether a retry
  is offered or attempted.
- `reportError` is the single logging chokepoint. Wire a real error tracker
  there and nowhere else.
- Module order matters: `AppError.ts` must not import `ProblemError.ts`.
  `ProblemError` extends `AppError`, so `normalize.ts` is the only module that
  imports both. Reintroducing that cycle throws
  "Cannot access 'AppError' before initialization" at runtime, which typecheck
  will not catch.
- `ErrorState` renders a failed fetch; `ErrorBoundary` catches render crashes.
  Landing wraps each lazy section in its own boundary so one failure can't blank
  the page.

## Service worker

**A new build takes over by itself.** `skipWaiting` + `clientsClaim` mean it
installs, activates and claims open tabs without asking, so the next load is
always the new one. There is no update bar and nothing to press.

`registerType: "prompt"` is still set, and does *not* mean the user is prompted:
with no waiting worker there is nothing to prompt about. It means this app
decides what happens on update, and it decides to do nothing visible.
`"autoUpdate"` reloads the open tab the instant the worker activates — measured,
not assumed — which on `/claim` would throw away a half-filled form.

That leaves one hazard, and it is not the worker's fault: a tab open across a
deploy can ask for a lazy chunk whose hashed filename no longer exists on the
server. `src/app/reloadOnStaleChunk.ts` listens for Vite's `vite:preloadError`
and reloads once per minute per tab. Don't remove it while routes are lazy.

`ServiceWorkerUpdater` is what registers the worker (`injectRegister: null`
means nothing else does) and holds the hourly `registration.update()` — that
poll is what makes a pinned tab's next reload land on the new build.

Runtime caching rules live in `vite.config.ts`. Two must not change: **`.mp4` is
`NetworkOnly`** (range requests break under CacheFirst and the clips total
~26 MB) and **`config.js` is `NetworkOnly`** (a cached copy points the app at
the wrong backend after a redeploy).

## Deploy targets

The app ships to two places and must keep working in both: an nginx container,
and GitHub Pages at https://afterhours-merchant.mahdidahouei.com. Both currently
serve from a domain root, so `BASE_PATH` is `/` for each — but the subpath case
is still supported and must not regress, because a bare github.io project site
would need it.

`base` in `vite.config.ts` comes from `BASE_PATH`. Anything that references a
`public/` file at runtime must go through `assetUrl()` or be a root-absolute
path in `index.html` (Vite rewrites those). A hard-coded `"/media/..."` in TS
will 404 on Pages.

The service worker's `runtimeCaching` patterns match on a path *segment*
(`includes("/fonts/")`), never on the string start — a root-anchored pattern
silently stops matching under a base.

## Runtime configuration

`public/config.js` assigns `window.__ENV__` before the bundle parses. In
Kubernetes a per-environment ConfigMap is mounted over that path, so one image
serves every environment. `src/lib/env.ts` reads it and falls back to Vite's
build-time env for local `npm run dev`.
