# Data sources

Where the open homes, the drive times and the map pins come from, why,
and what is still to be confirmed against the live services. Researched
16 November 2026.

## Open homes: Domain's developer API

Domain is the only Australian portal with an API a developer can sign
up for. It is the one source the app reads.

| Source | Public API | Used | Why |
|---|---|---|---|
| domain.com.au | Yes, developer.domain.com.au | Yes | Search returns listings with their inspection times |
| realestate.com.au | No. Its APIs are for partners under a commercial agreement | No | Its terms forbid scraping and the site blocks bots |
| homely.com.au | No | No | No API; automated access is not permitted |
| Other portals (view.com.au, allhomes, property.com.au) | None found | No | Allhomes is owned by Domain |
| Scraper services (Apify, RapidAPI) | Unofficial | No | They break when a site changes and carry the terms-of-use risk |

A home found on a site the app does not read gets in two ways, neither
of which touches that site:

- **Paste homes from a listing site.** Open a listing, or the page of
  inspection times, in your own browser, select the page, copy it and
  paste it in. The app reads the addresses, prices, rooms, type and
  inspection days and times out of the text on the device
  (`src/lib/paste-parse.ts`), shows them as a preview to tick, and adds
  the ticked ones. It works out from the text whether the site puts the
  address or the time first. An auction time is never read as an open
  home; a time without am or pm before 8 is read as pm; a start time
  alone runs half an hour, as with Domain. Up to 25 homes a paste.
- **Add a home yourself**, for one home: the address and the times.
  That is also how the home you are already going to gets into the day.

### How the app calls Domain

- `POST https://api.domain.com.au/v1/listings/residential/_search`,
  from `src/lib/listings/domain.ts` and nowhere else.
- Sent: `listingType: "Sale"`, `minBedrooms`, `maxPrice`, and one
  `locations` entry per suburb (`state`, `suburb`,
  `includeSurroundingSuburbs`), a hundred to a page, three pages at most.
- Sign-in: an API key in `X-Api-Key`, or an OAuth client (client
  credentials to `https://auth.domain.com.au/v1/connect/token`, scope
  `api_listings_read`). The project needs the Agents and Listings package.
- Read from each listing: the address, coordinates, bedrooms, bathrooms,
  car spaces, property type, `priceDetails.displayPrice` and
  `inspectionSchedule.times`. The day filter is applied by the app.

### Still to confirm with real keys

The developer portal could not be reached while this was built, so the
shapes above come from Domain's published documentation and not from a
live call. `domain-parse.ts` reads defensively for that reason. On the
first search with real keys, check:

1. **Sign-up is open** and which plan the project is on. The free tier
   was reported at about 500 calls a day; one search is one to three.
2. **Each inspection carries a closing time.** When one does not, the
   app assumes half an hour (`DEFAULT_OPEN_MINUTES`).
3. **Where the coordinates sit** (`propertyDetails` or `geoLocation`;
   both are read).
4. **`includeSurroundingSuburbs`** is accepted on a location.
5. **Hidden prices.** Agents enter a search price even when the listing
   says "Contact agent" or "Auction", and `maxPrice` is understood to
   filter on it. Such a home shows as "price not stated"; untick
   "Include homes with no price stated" to leave them out.
6. **The listing link.** Built from `listingSlug`, or the id when there
   is no slug.

Change `domain-parse.ts` and its test together when any of these turns
out different.

## Drive times

- **The estimate (default).** Straight-line distance times 1.4, at
  32 km/h, in `src/lib/travel-estimate.ts`. Good enough to order a day
  in neighbouring suburbs; the screen calls it an estimate.
- **OSRM (`TRAVEL_PROVIDER=osrm`).** Real road times, without traffic,
  from the server at `OSRM_BASE_URL`. The public demo server allows
  light personal use at one request a second with no uptime promise.
  When it does not answer, the estimate is used and the screen says so.
- **Not used:** Google Routes (needs a billing account; about 10,000
  free matrix elements a month) and OpenRouteService (free key, 500
  matrix calls a day). Either slots into `src/lib/travel.ts`.

On the day, the Google Maps link gives live traffic.

## Map pins for homes added by hand

Nominatim (OpenStreetMap), from `src/lib/geocode.ts`: one request a
second at most, an identifying User-Agent (`GEOCODER_CONTACT`). When it
cannot place the address, the suburb centre from `src/lib/suburbs.ts`
is used and the home is marked "Suburb pin only". That table covers
Croydon, Ringwood and their neighbours; add suburbs to widen it.
