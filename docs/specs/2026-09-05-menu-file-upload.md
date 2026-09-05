# Menu file upload — backend requirement

Status: raised 2026-09-05 · blocking a shipped screen
Contract: `swagger/docs.json` (`/api/v1/owner`)
Screen: claim step 4, "Build your profile" → accordion 3, "Your menus"
Frontend: `src/features/self-service/stages/Review/MenusSection.tsx`,
`src/ui/FileDrop`

## What the screen now does

A menu file is one of three types — `pdf`, `webpage`, `image` — and the input
follows the type:

- **webpage** — a URL the owner types. Works today, unchanged.
- **pdf** / **image** — a file the owner picks or drags in. New.

The picker validates type and size, uploads, and stores the link it gets back on
`ClaimMenuFile.link`. An already-attached file shows its name, opens in a new
tab, and can be replaced or removed.

## The problem

**There is no endpoint to upload a menu file to a claim.**

Everything checked, and what it turned up:

- The claim surface has exactly one upload, `POST /claim/photos`. It takes
  `file` as form data and returns the whole `Claim` — but it attaches to
  `claim.photos`, the listing's gallery that step 5 renders. Wrong place; using
  it would put menu PDFs in the photo grid.
- `dto.ClaimMenuFile` is `{title, link, type}`. `link` is a string. There is no
  field for an uploaded asset, an id, or an upload token.
- The contract's only menu-upload routes are
  `POST /restaurants/{restaurantId}/menus` and its `/admin` twin. Both take a
  `restaurantId`, which a claim does not have — a claim becomes a restaurant
  only when an admin approves it. Both also *create a menu* carrying one PDF,
  which is a different shape from the claim's `menus[].files[]`.
- Probing the live API can't settle it either way: auth runs before routing, so
  every path under `/claim` returns the same 401 whether or not it exists. The
  swagger is the evidence, and it has nothing.

So an owner can currently only attach a menu by pasting a link to a file they
have already hosted somewhere else.

## Asked for

An upload that mirrors `POST /claim/photos` — session-authenticated, multipart,
one file — but returns a link instead of attaching to the gallery:

```
POST /claim/menus/files
Content-Type: multipart/form-data
  file: <the PDF or image>

201
{ "link": "https://cdn.afterhours.dev/menus/<...>" }
```

The front end is already written against exactly this: path and shape are in
`MENU_FILE_UPLOAD_PATH` in `src/features/self-service/api/http.ts`, and
`api/mock.ts` implements it so the flow can be exercised offline. When the route
lands, nothing on our side changes.

Two details worth agreeing on:

- **Accepted types and size.** The picker currently allows `application/pdf` for
  `pdf`, and `image/jpeg`, `image/png`, `image/webp` for `image`, up to 20MB.
  Tell us if the server's limits differ and we'll match them rather than letting
  the server be the one to say no.
- **Orphans.** The link is stored on the profile by a later
  `PUT /claim/profile`, so a file uploaded and then abandoned — the owner
  removes the row, or never saves — is never referenced. Either the server
  sweeps unreferenced uploads, or it doesn't and they accumulate; we just need
  to know which.

## Until then

The picker is wired and shipped. On an API without this route the upload fails,
the row shows the error in place, and nothing is silently lost — but a PDF or an
image cannot be attached during a claim. The `webpage` type is unaffected and
works normally.

## Related

- `docs/specs/2026-09-05-reservation-platform-picker.md` — the other open asks
  on this screen, including the blocking one about a reservation-platform
  catalogue.
- `ClaimMenuFile` still has no language field, so the NL/EN/DE/FR control on
  each file row holds local state and says so.
