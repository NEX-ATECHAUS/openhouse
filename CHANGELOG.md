# Changelog

Dated sections, newest first, in plain words, with who asked.

## 17 November 2026: Dark mode switch and notes on homes

Asked for by the owner.

- **Dark mode switch.** A Light mode / Dark mode button in the header.
  Until it is used the page follows the device; the choice is kept in
  this browser and applied before the page paints, so it never flashes
  the wrong theme. Dark mode now has a dark page with a faint warm
  glow; light mode keeps the logo gradient.
- **Notes on each home.** "Add a note" on every home: one tap opens it,
  it saves as you type, Done closes it. The same note shows, and can be
  changed, on the home's stop in the day, so a note typed standing in
  the house is there in both places. Notes outlive a search (kept per
  home in this browser, up to 300) and go into the calendar file. If
  the browser will not keep them, the note says so.
- **Fixed: semicolons in the calendar file.** Since the first build, a
  semicolon in an address, price or note was written unescaped, which a
  calendar app can misread. The test had the same slip, so it passed
  anyway; both are corrected.

## 17 November 2026: The page in the logo's colour

Asked for by the owner: the page background the same as the logo
tile's.

- The page is now the logo's peach to coral gradient, in both themes.
  Cards keep their own colours (white, or dark in dark mode).
- Text straight on the page, the "Open House" name, uses the logo's
  dark ink. The logo tile gained a thin light ring and a soft shadow so
  it does not disappear into a page of its own colour.
- The visual harness judged text on a staged card against the page,
  never against the card; with a light page that raised 21 false
  faults. It now checks the card too.

## 17 November 2026: Clearer Domain refusals

Asked for by the owner, after the first live search returned 502.

- The live search reached Domain and signed in, but Domain answered 403
  to the search itself. The screen now says that the sign-in worked and
  that listings access is the likely gap, instead of pointing at the keys.
- Domain's own reason for a refusal (its message field, cut short) is
  now written to the log with the status, so the next one says exactly
  what to fix.

## 17 November 2026: The first design's type, back

Asked for by the owner: the fonts of the first design, with everything
else as the new look.

- Headings, prices, stop times and the day's totals in Albert Sans
  again, at its lighter weight; the small labels ("STEP 2", "DRIVING")
  in Fira Mono capitals again; Inter stays for the text.
- The two font packages removed with the new look are back.

## 17 November 2026: Fields match

Asked for by the owner, from a screenshot in Safari: the dropdowns did
not match the other fields.

- **Every field is the same pill.** Text, date, time and dropdown fields
  share one height (46px) and the round ends. Safari drew its dropdowns
  square and short and its time field tall; the browser's own drawing
  is now switched off and the dropdowns carry their own chevron, in the
  muted ink of each theme.
- **Room for the longest choice.** Fields share a row only while each
  is at least 180px wide, so "5 min a drive" is never cut short; Plan
  the day now reads as two neat columns on a desk.

## 17 November 2026: New look

Asked for by the owner, from a reference design: a softer, lighter
look with illustrated houses.

- **The look.** A pale grey page, big rounded white cards, pill-shaped
  fields, buttons and chips, and one warm peach to coral accent for the
  main action. Both themes.
- **The top of the page.** The heading, an illustrated street and the
  search together in one card. The suburb search is a single pill with
  a pin; bedrooms are tap chips (Any, 1+ to 4+); the two options are
  chips that show a tick when on.
- **Homes.** Each has a small illustrated picture (one of four
  palettes, always the same for a home), the price in large type, and
  bedrooms, bathrooms, car spaces and type with icons. Must-see is a
  heart that fills. On a phone the details run full width under the
  picture.
- **The day.** Numbered stops in warm circles; drives, waits and the
  break as pills with icons. The three totals now sit in one row on a
  phone, with the short form ("4h 52m") so nothing breaks across lines.
- **Housekeeping.** Two fonts no longer used were removed. Next.js
  moved from 16.4.2 to the patch release 16.4.6 for a moderate advisory
  (information disclosure through `use cache` with `unstable_cache()`;
  the app uses neither, so it was not exposed).

## 16 November 2026: First build

Asked for by the owner: find the open homes near the one being viewed
and plan the day, built on the Straight Line Solar Hub blueprint and
styled after the supplied reference stylesheets.

- **Search.** Suburbs, state, bedrooms at least, budget up to, and the
  day (the coming Saturday to start with). Options to include the
  surrounding suburbs and homes with no price stated.
- **Pick the homes.** Every home open that day, earliest first, ten to
  a page. Untick one to leave it out; make one a must-see to keep it in
  the day before anything else. With a must-see, the day can be kept
  within 2, 5 or 10 km of it.
- **Add a home yourself.** For the home already being viewed, or one
  found on a site the app does not read. It joins as a must-see.
- **Plan the day.** The order that reaches the most homes inside their
  open times, with the drive between each, time to spare, and one break
  after a chosen time. Homes that did not fit are listed with the reason.
- **Take it with you.** The route opens in Google Maps; the stops
  download as a calendar file.
- **Sources.** Domain's developer API is the listings source, behind
  one seam. realestate.com.au and homely.com.au have no public API and
  are not read. Until Domain keys are added the app runs on sample
  homes, marked as samples. See docs/data-sources.md.
- **From the blueprint.** The rulebook, the shipping guide, the security
  guards, the visual harness, CI, exact-pinned packages, the env,
  logger and rate-limit seams, the proxy's security headers, and the
  shared pager. Not carried over because nothing here needs them yet:
  accounts and the database, email, the AI seam, PDFs, and the scope
  register (there is no signed proposal to measure against).
- **Not yet checked against the live service.** The Domain request and
  answer shapes come from documentation; the first search with real
  keys is the check. Listed in docs/go-live-checklist.md.
