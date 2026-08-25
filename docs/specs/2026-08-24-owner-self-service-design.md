# Owner Self-Service — design

Status: approved 2026-08-24
Contract: "Owner Self-Service — API contract" (15 endpoints, `/api/v1/owner`)
Designs: `../self-service/Owner Self-Service - Gamified.dc.html`

## What it is

A restaurant owner finds their listing, proves ownership by SMS, corrects the
listing facts, lets us read their website to draft a profile, reviews and edits
that profile, adds photos, and submits it for review.

Eight screens, driven by seven claim statuses.

## The state machine

`claim.status` decides what renders — never `kind`, never which call just
returned. But stages 0–2 happen before a claim exists, so there are two phases:

```
Phase A — no token      search → verifyOwnership → otp
Phase B — token         status decides, and nothing else
```

| Design stage | Driven by |
| --- | --- |
| 0 Find, 1 Verify ownership, 2 OTP | Phase A local state |
| 3 Check your details | `verified`, and `scan_failed` (same screen + `scanError`) |
| 4 Reading your website | `scanning` — poll `GET /claim` every 2s |
| 5 Review, 6 Photos | both `drafted`, split by a local sub-step |
| 7 Saved | `live` |

The contract's status table requires two screens the design does not draw:
`submitted` ("With our team") and `approved` ("Almost there"). Both are built in
the same visual language as stage 7.

Resume is not a separate call: a stored token means `GET /session` then
`GET /claim`, then render from status. `401 session_expired` drops the token and
returns to verification — the claim survives.

## Auth boundary

`lib/api.ts` exposes `createApiClient()`. `api` stays the public, token-free
client used by landing, connect and contact. Self-service builds its own
`ownerApi` instance that attaches the bearer token.

This split is deliberate and load-bearing: a claim token must never ride along
on a landing-page request.

## Errors

The contract is RFC 9457 `application/problem+json` with a stable `code`.
`toAppError` parses it into `ProblemError extends AppError`, carrying `code`,
`attemptsRemaining`, `currentStatus`, `expectedStatus`, `missingFields`.

Every code has a defined behaviour:

| Code | Behaviour |
| --- | --- |
| `invalid_code` | Keep the field, show attempts remaining |
| `code_expired` | Swap the verify button for "send a new code" |
| `too_many_attempts` | Lock the form for `Retry-After` |
| `place_already_claimed` | Dead end at search, point at support |
| `no_phone_on_listing` | Offer the listing-request form |
| `session_expired` | Drop token, back to verification |
| `wrong_status` | Re-render from `currentStatus` |
| `profile_incomplete` | Highlight the exact `missingFields` on the accordions |
| `photo_too_large` / `unsupported_media_type` | Caught client-side first |
| `rate_limited` | Respect `Retry-After` |

## Data seams

`PUT /claim/profile` replaces outright — every save posts the complete Profile,
even when the user edits one accordion.

The review screen writes to two endpoints. Story, cuisines, vibes, menus,
socials, email and reservations are profile → `PUT /claim/profile`. Phone and
address are listing facts → `PATCH /claim/place`. There is exactly one phone
field in the whole API and it lives on `Place`.

## Controls with no endpoint yet

The design draws six controls the contract has no field for. They are built and
marked, not dropped:

- menu file language (NL/EN/DE/FR)
- Instagram / TikTok feed connection
- scan activity feed and progress percentage
- establishment type as a chip row (contract: one value)
- primary-platform star
- rating / review count on search result cards (contract: search is thin)

Each is isolated behind `PENDING_API` in the feature's types with a one-line
note. They hold local state and are visibly local; nothing silently discards.

## Backend flag

The API is not live. `endpoints.ts` defines an `OwnerApi` interface with two
implementations — `http.ts` (real) and `mock.ts` (in-memory, contract-faithful
including latency, error codes and status transitions). `VITE_USE_MOCK` picks.
Default off; `.env.development` turns it on.

## Structure

```
src/features/self-service/
  SelfServicePage.tsx
  api/       types.ts · client.ts · http.ts · mock.ts · index.ts · queries.ts
  session/   useSession.ts
  stages/    Find · VerifyOwnership · Otp · Details · Scanning
             Review/{index,StorySection,ContactSection,MenusSection}
             Photos · Status
  components/ JourneyRail · MilestoneToast · StepKicker · ChipPicker
              PhotoGrid · OtpInput · ProfileStrength
  content/   journey.ts · copy.ts
```

New generic primitives land in `ui/`: `Chip`, `Switch`, `Accordion`, `Toast`.
The `wizard/` chrome is not reused — this layout is a full-page rail, not a
centred card.

## Responsive

At `lg` and up, a fixed 280px journey rail lists the five steps with subtitles.
Below `lg` the rail collapses to the top progress line, the step kicker
("Step 3 of 5 · Check your details") and the compact five-dot stepper the design
already provides. Photo grid is 2-up on mobile, 4-up on desktop. OTP boxes stay
on one line at 375px.

Photo reorder must work on touch, which native HTML5 drag and drop cannot do —
`@dnd-kit/core` and `@dnd-kit/sortable` are the only new runtime dependencies.

## Entry point

New route `/claim`. The landing header gains a third action, "Claim your
restaurant", in the desktop nav and the mobile drawer. Nothing existing moves.

## Build order

1. Session, API layer, error extension, mock
2. Phase A — find, verify ownership, OTP
3. Phase B — details, scanning, review
4. Photos, status screens, landing entry
