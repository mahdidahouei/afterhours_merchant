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

The API is live and the app talks to it. `VITE_USE_MOCK` is `false` everywhere;
setting it to `true` swaps in `api/mock.ts`, which is kept as a rollback and for
working offline. Everything above the `OwnerApi` interface cannot tell the
difference. Verify with `grep -r "Oli Mazi" dist/` that it stays out of builds.

**The API allowlists CORS origins.** `localhost:5173` is allowed, so
`npm run dev` works; `afterhours-merchant.mahdidahouei.com` is not, so the Pages
deploy fails on every call until someone adds it. That is a backend config
entry, not something this repo can fix.

Every response carrying a Claim goes through `api/normalize.ts`. The contract
promises "lists are always lists", and four screens read `claim.photos.length`
and `claim.reservation.length` unguarded — one `null` where an empty array was
promised is a white screen. That held for free against the mock, which was
written alongside these types; against a real server it is an assumption, and
the boundary is where it costs nothing to stop assuming.

One control the design draws still has no field in the contract: menu-file
language. It is marked `PENDING_API` in `api/types.ts` and holds local state.
Everything else has landed — IG/TikTok are real OAuth, bookings are a real
integration, and the primary-platform star went with the chip row.

**"Where guests can book" is a single select, and it is fully online.** The
switch writes `Profile.reservable`; the choice writes
`Profile.reservationPlatforms` as one element. Its options come from
`GET /reservation-platforms`, which is the three we *integrate* with — not the
same thing as the platforms an owner may *use*, so whatever is already on the
profile is appended as an option rather than dropped. The backend asks that
would fix that properly are in
`docs/specs/2026-09-05-reservation-platform-picker.md`.

**The review screen's three accordions open one at a time, in sequence.** The
open one collapses, and only when that has finished does the next expand —
`Accordion` reports its own collapse through `onCollapsed` so the caller never
restates the duration. The numbers are the design's, not invented:
`480ms cubic-bezier(0.3, 0, 0, 1)`, no opacity fade, and a 20ms pause between
the two (the mock waits 500ms from the start of a 480ms collapse). The primary
button walks down the sections and only becomes "Looks good — add photos" on the
last one.

## Maps

`LocationMap` draws the listing's position on the Afterhours Mapbox style.

The pin in `assets/self-service/map-marker.png` is the app's own
`assets/icons/location.png`, recoloured from its charcoal `#3A393F` to the brand
brown `#321B15` — body only, so the white centre and the antialiased rim survive.
It is 88 x 102, not square: draw it 38 x 44 or it squashes.

**It is lazily imported and must stay that way.** mapbox-gl is ~1.9 MB — more
than the rest of this feature together — so it is its own `manualChunks` entry,
excluded from the service worker's precache by `globIgnores`, and pulled in only
when the details step renders. Importing it at the top of a module puts two
megabytes back on every first visit.

The map is a location picker: tapping it moves the pin, and the new coordinate
is reverse-geocoded through Mapbox to fill the address field, which the owner can
still type over. The map itself never moves — the pin goes to where they tapped
and the ground stays put.

**Animate the coordinate, not the transform.** Mapbox rewrites the marker's
`transform` on every frame of a pan or zoom, so a CSS transition on that property
animates the map's own movement too and the pin visibly lags a drag. The
coordinate is interpolated frame by frame instead.

**Style light, always.** The app has no dark theme — nothing in `tokens.css`, no
`darkMode` in the Tailwind config — so reading `prefers-color-scheme` put a night
map inside a white page. Switch on an app theme if one ever lands, never on the
OS.

**Neither the pin nor the address can be saved.** `PATCH /claim/place` takes
name, phone, websiteUri and neighbourhood; both are held in `DetailsStage` and
the screen says so. Adding `address` and `location` to `PlacePatch` is all that
is needed — `buildPatch` is where they go.

The token is a public `pk.` one — scoped by URL restrictions at Mapbox rather
than by secrecy — but **it is not committed**: GitHub's push protection rejects
Mapbox tokens on sight. It arrives per environment through the usual runtime
config path (`window.__ENV__.MAPBOX_TOKEN`): a ConfigMap in Kubernetes, the
`MAPBOX_TOKEN` secret in the Pages workflow, and `.env.development.local` for
`npm run dev`. Without one the step falls back to the address and a Google Maps
link, so a missing token is a degraded screen, never a broken one.

## The scanning step

`ScanPreview` is the little browser window that sweeps a scan line down a
skeleton page while `POST /claim/profile` runs. It is decoration and says so:
`aria-hidden`, because the server reports no progress at all during `scanning` —
the bar, the beats and the "what we're finding" list are all paced from a client
timer, and the bar deliberately stops at 90% because only a status change can
finish that screen.

Its two animations live in `tailwind.config.ts` as `scan-pulse` and
`scan-sweep`. Don't fold them into the existing `shimmer` keyframe — that one is
`ui/Skeleton`'s translate sweep and does something else. Both carry
`motion-reduce:animate-none`.

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

**A `NetworkOnly` rule is not enough on its own.** Workbox registers the
precache route before any runtime route, so anything matching `globPatterns`
is served from the precache and the rule below it never runs. `config.js`
matches `**/*.js`, so it must also be in `globIgnores` — it is the one file
whose contents change *after* the build (the Pages workflow injects
`MAPBOX_TOKEN`), which means its manifest revision never changes and a client
keeps whatever it cached the first time.

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

## Reusable widgets

**Use `ui/` primitives. Do not hand-roll a field because a design draws it
differently.** Every text input in the app is `ui/TextField`, every multi-line
one is `ui/Textarea`; a bespoke lookalike is a consistency bug even when it
matches the mock more closely. When a design and the shared widget disagree, the
widget gets updated — one change, everywhere — rather than forked locally.

The two raw `<input>`s left in `features/self-service` both earn it: the hidden
`type="file"` behind the photo picker, and the per-digit boxes in `OtpInput`,
which is a single field made of six elements and has no shared equivalent.

`TextField.trailing` reserves 3rem. It is for an icon or a spinner; a text pill
put there runs straight over the value. Notes go under the field instead.

## Runtime configuration

Read every runtime value with `||`, never `??`. `config.js` ships placeholders
as empty strings and a ConfigMap may mount a partial one; `""` is not nullish,
so `??` accepts it as configured and silently skips the build-time fallback.
That is exactly how the Mapbox token resolved to nothing in development.

`public/config.js` assigns `window.__ENV__` before the bundle parses. In
Kubernetes a per-environment ConfigMap is mounted over that path, so one image
serves every environment. `src/lib/env.ts` reads it and falls back to Vite's
build-time env for local `npm run dev`.
