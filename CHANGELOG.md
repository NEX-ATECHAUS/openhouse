# Changelog

Dated sections, newest first, in plain words, with who asked.

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
