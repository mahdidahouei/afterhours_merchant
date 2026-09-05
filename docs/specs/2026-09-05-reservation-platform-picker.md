# "Where guests can book" — backend requirements

Status: raised 2026-09-05 · needs a decision before this ships
Contract: `swagger/docs.json` (`/api/v1/owner`)
Screen: claim step 4, "Build your profile" → accordion 2, "Contact &
reservations"
Frontend: `src/features/self-service/stages/Review/ContactSection.tsx`

## What changed on the front end

That block used to be a multi-select: chips for each platform the scan found, a
free-text box and an **Add** button, plus a star to mark one as primary. The
star was never sent anywhere — the contract has no notion of a primary — so it
was local state on the page and the UI said as much.

It is now a **single select**. One platform, chosen from a dropdown styled to
look exactly like the text fields beside it, with "Choose a reservation
platform" as its resting label. The star is gone entirely, along with the last
piece of unsaved state on this screen.

## What already works, with no change needed

- **The "We take reservations" switch is already online.** It writes
  `Profile.reservable`, which `PUT /claim/profile` persists like any other
  profile field. Nothing to do.
- **The chosen platform is already online.** It is written as the single
  element of `Profile.reservationPlatforms` and saved by the same call.

So the screen has no local-only state left. Everything below is about making
the data model fit what the screen now is, not about making it work.

## Requests

### R1 — a catalogue of reservation platforms to choose from

**This is the blocking one.**

`GET /reservation-platforms` returns the three platforms we have a live
integration with — `formitable`, `guestplan`, `gotable`. That list exists to
drive step 6 (connecting a real booking integration), and it is the only list
of platforms the API has.

But this field is a different thing. `Profile.reservationPlatforms` is
documented as *"Free text read off the website. Not a connected integration."*
— it is where the owner's guests book today, whether or not we integrate with
it. The scan routinely returns **OpenTable**, **TheFork**, **Resengo** and
similar, and the design's own mock shows exactly those two as the example.

Right now the dropdown can only offer the three integrated platforms, so an
owner on OpenTable has no row to pick. The front end works around this by
appending whatever value is already on the profile as an extra option, purely
so that opening the picker cannot silently erase what the scan found. That is a
guard, not a solution.

**Asked for:** a list of the reservation platforms an owner may select.

The cheapest shape is another array on the existing vocabulary endpoint, beside
the ones the same screen already reads:

```
GET /taxonomy
{
  "cuisines": [...],
  "establishmentTypes": [...],
  "perfectFor": [...],
  "vibes": [...],
  "reservationPlatforms": ["Formitable", "Guestplan", "GoTable",
                           "OpenTable", "TheFork", "Resengo", ...]   ← new
}
```

A separate endpoint is fine too. What matters is that it is the *selectable*
list, not the *integrated* list, and that it is ordered the way it should be
displayed.

### R2 — one value, not a list

`Profile.reservationPlatforms` is `string[]`. The screen is now single-select
and writes an array of at most one element.

Either is acceptable; please confirm which:

- **(a)** Leave the field as an array and treat 0 or 1 elements as the
  contract. Nothing changes on either side. Note that the array can still
  arrive from a scan with several entries, and the picker will show the first
  and drop the rest on the next save.
- **(b)** Add `reservationPlatform: string | null` and deprecate the array.
  Cleaner, and it removes the "drop the rest" behaviour above.

`PUT /claim/profile` replaces the profile outright, so neither option needs a
migration on our side.

### R3 — canonical spelling

`GET /reservation-platforms` returns lowercase keys (`"formitable"`), while
`Profile.reservationPlatforms` holds brand casing from the scan
(`"Formitable"`). The picker currently stores **brand casing**, because that is
what the field already contains and what a directory page would render, and it
matches case-insensitively so both spellings resolve to one row.

If the directory would rather key off a stable identifier, say so and we will
send whatever R1's list returns verbatim — an `{id, name}` pair works too.

### R4 — what happens when "We take reservations" is off

The screen keeps the chosen platform and dims the picker, so switching the
toggle back on doesn't look like it lost the answer. Should the server clear
`reservationPlatforms` when `reservable` is `false`, or keep it? We are happy
either way; we just need to know, because "keep" means a profile can be
`reservable: false` with a platform still set.

### R5 — `reservationUrl`

`Profile.reservationUrl` is still in the contract but no longer has a field on
this screen: the design does not draw one. The value round-trips untouched on
save, so nothing is lost. Confirm whether it should stay (populated by the scan
only), or be dropped from the profile.

## Related, already raised elsewhere

Not part of this section, listed so they aren't re-discovered:

- `PATCH /claim/place` has no `address` or `location`, so the details step's map
  picker cannot save what the owner pins.
- `ClaimMenuFile` has no language field, so the NL/EN/DE/FR control on the menus
  accordion holds local state.
- `Profile.tagline` and `Profile.moments` have been retired from the UI. They
  stay on the type so a save round-trips them rather than nulling them; if they
  are also being retired product-side, they can come off the contract.
