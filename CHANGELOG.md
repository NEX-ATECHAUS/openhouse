# Changelog

Dated sections, newest first, in plain words, with who asked.

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
