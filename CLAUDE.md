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

`/claim` is owner self-service: find your listing, verify by SMS, let us read
your website, review the drafted profile, add photos, submit. See
`docs/specs/2026-08-24-owner-self-service-design.md`.

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

Because Tailwind colours are custom properties, **opacity modifiers
(`bg-color-primary/50`) do not work** — the `*Opacity` core plugins are off.
Use an explicit `rgb(… / …)` arbitrary value instead.

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
page state; everything after is a pure function of status. `stages.ts` holds that
mapping.

Every mutation returns the complete claim, so `useClaimMutation` replaces the
cache rather than invalidating it. Never merge, never refetch after a write.

`PUT /claim/profile` replaces outright: every save posts the whole Profile, even
when one accordion changed. Phone and address are listing facts and go to
`PATCH /claim/place`; email, socials and reservations are profile.

The API is not live yet. `VITE_USE_MOCK=true` (default in development) swaps in
`api/mock.ts`, a contract-faithful in-memory server. Everything above the
`OwnerApi` interface cannot tell the difference. Verify with
`grep -r "Oli Mazi" dist/` that it stays out of production builds.

Six controls the design draws have no field in the contract — menu-file
language, IG/TikTok feeds, the scan activity feed, establishment as a chip row,
the primary-platform star, ratings on result cards. They are marked `PENDING_API`
in `api/types.ts`, hold local state, and say on screen that they aren't saved yet.

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

`registerType: "prompt"`, not `autoUpdate` — a silent swap can replace a lazy
chunk mid-scroll. `ServiceWorkerPrompt` shows a reload bar instead.

Runtime caching rules live in `vite.config.ts`. Two must not change: **`.mp4` is
`NetworkOnly`** (range requests break under CacheFirst and the clips total
~26 MB) and **`config.js` is `NetworkOnly`** (a cached copy points the app at
the wrong backend after a redeploy).

## Runtime configuration

`public/config.js` assigns `window.__ENV__` before the bundle parses. In
Kubernetes a per-environment ConfigMap is mounted over that path, so one image
serves every environment. `src/lib/env.ts` reads it and falls back to Vite's
build-time env for local `npm run dev`.
