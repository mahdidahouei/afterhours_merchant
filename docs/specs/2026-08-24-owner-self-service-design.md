# Owner Self-Service — design

Status: approved 2026-08-24 · revised 2026-08-29 against the real swagger
Contract: `swagger/docs.json`, tags `owner-self-service` and
`Reservation Platform` (23 endpoints, `/api/v1/owner`)
Designs: `../self-service/Owner Self-Service - Connect.dc.html` — the Connect
variant supersedes the Gamified one; it is the same flow with step 6 attached.

## What it is

A restaurant owner finds their listing, proves ownership by SMS, corrects the
listing facts, lets us read their website to draft a profile, reviews and edits
that profile, adds photos, connects their booking system, and submits it for
review.

Nine screens over six user-facing steps, driven by seven claim statuses.

Step 6 is the old `/connect` widget folded in. Once this ships, `/connect` is
retired: the same job is done here, with the claim's own token instead of a
restaurant id chosen from a dropdown.

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
| 5 Review, 6 Photos, 7 Connect bookings | all three `drafted`, split by a local sub-step |
| 8 Saved | `live` |

The contract's status table requires two screens the design does not draw:
`submitted` ("With our team") and `approved` ("Almost there"). Both are built in
the same visual language as stage 7.

### Coming back

Every visit starts at the search box. Any token a previous visit left behind is
dropped on arrival, so a session is only ever something established by verifying
here and now. `401 session_expired` mid-flow does the same and returns the owner
to verification — the claim itself survives on the server.

After verification the claim comes back on `POST /sessions` and its `status`
picks the screen. That covers six of the seven statuses exactly.

The seventh, `drafted`, is one status across four screens (details, build,
photos, bookings) and the contract has no field naming which. **The client does
not fill that gap.** A returning owner lands on Build your profile and walks
forward; every step stays reachable from the rail, so nothing is unreachable and
nothing is lost.

Two approaches were built and removed: deriving the step from what the claim
holds (a connected platform implies bookings), and a `claimId`-keyed note in
`localStorage`. Both invent progress the server never reported, and the note is
simply wrong on a second device. `FIRST_DRAFTED_STEP` in `stages.ts` is where a
real step field plugs in.

### Going back

Steps 3–6 are navigable in both directions from the rail (and the mobile
stepper) for as long as the claim is `drafted`. Step 3 stays live because
`PATCH /claim/place` accepts the listing facts throughout; revisiting it saves
and returns rather than re-running the scan, which would otherwise overwrite a
profile the owner has since edited by hand.

Steps 1–2 are never navigable — a search box and a one-time code have nothing to
correct — and from `submitted` on the claim is with an admin.

Two screens hold unsaved edits in local state, so the rail cannot simply switch
`draftedStep`. Each registers a `leaveGuard` that commits before the page moves
and can refuse, leaving the owner on the screen with the failed save's error
already visible. Any future screen holding a draft must do the same.

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

## Step 6 — connect bookings

This is the connect widget, unchanged in substance. Both its reads are public
and already live, so they are **not mocked** even in development: the list, the
logos, the markdown instructions and the per-step screen recordings are the real
ones. Only `POST /claim/reservation` is stubbed, because the claim API is what
isn't live.

The guide's length and content belong to the platform, so the UI walks `steps[]`
and relies on one rule: a step carrying `need` asks for a credential, a step
without one is instruction. `need.field` picks between `integrationId` and
`apiKey` on `POST /claim/reservation`.

Three details of the real payload are easy to get wrong:

| Looks like | Actually |
| --- | --- |
| `need` absent when nothing is wanted | It is `[]` — and `[]` is truthy. Read it through `needOf()`. |
| `step` is the index | Formitable's second step is numbered `0`. Order by array position. |
| One credential per connection | Formitable wants an API key (step 1) *and* a restaurant key (step 2), both in one call. Credentials accumulate. |

`body` lines are markdown with links and bold — rendered as text they show
literal `**Beheer**`.

The list is exactly what the API returns; only the display order and the brand
casing ("GoTable", not "gotable") come from us, as the connect widget has always
done. An unrecognised platform still appears, at the end, under its own name.

Connecting is optional. "Connect" and "I'll connect later" both end with
`POST /claim/submit`; a restaurant with no integration is still a complete
listing.

## Contract corrections

Six things the hand-written contract note got wrong, found by reading the
swagger:

| Assumed | Actually |
| --- | --- |
| `PlaceCandidate.claimability` | Not returned. `GET /places` gives four fields; an already-claimed place surfaces as `place_already_claimed` at verification. |
| `POST /verifications` takes a phone | Takes `placeId` only. The "different number" option cannot exist — `POST /claim-tickets` is the escape hatch instead. |
| `PATCH /claim/place` takes `address` | It does not. Name, phone, websiteUri, neighbourhood only; nullable ones as `{set, value}`. |
| IG/TikTok are not in v1 | `POST /claim/social/{provider}/connect` is real OAuth. |
| Bookings are not in the claim | `POST /claim/reservation` and `Claim.reservation[]`. |
| `Photo` has width/height/uploadedAt | `photoId`, `position`, `url`. |

## Controls with no endpoint yet

Two remain, isolated behind `PENDING_API` in the feature's types. They hold
local state and are visibly local; nothing silently discards.

- menu file language (NL/EN/DE/FR) — `ClaimMenuFile` is title/link/type
- primary-platform star — `reservationPlatforms` is a flat list of strings

Four have since landed or been resolved: IG/TikTok connection is real OAuth,
the scan progress is cosmetic and stays so, establishment type is rendered as
the single value the contract defines, and search result cards carry no rating
because `GET /places` returns none.

## Backend flag

The API is not live. `endpoints.ts` defines an `OwnerApi` interface with two
implementations — `http.ts` (real) and `mock.ts` (in-memory, contract-faithful
including latency, error codes and status transitions). `VITE_USE_MOCK` picks.
Default off; `.env.development` turns it on.

## Structure

```
src/features/self-service/
  SelfServicePage.tsx     two phases, and the resume seed
  stages.ts               status → screen
  api/       types.ts · client.ts · http.ts · mock.ts · index.ts · queries.ts
  session/   tokenStore.ts · leaveGuard.ts
  stages/    FindStage · VerifyOwnershipStage · OtpStage · DetailsStage
             ScanningStage · PhotosStage · StatusStage
             Review/{index,StorySection,ContactSection,MenusSection,useProfileDraft}
             Bookings/{index,PlatformPicker,PlatformSteps}
  components/ ClaimLayout · JourneyRail · StepKicker · ProgressLine
              ChipPicker · PhotoGrid · OtpInput · FeedCards · ManualReview
              DevStageSwitcher (mock-only)
  content/   journey.ts
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
