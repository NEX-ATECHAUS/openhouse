# Go-live checklist

What a person has to do before Open House shows real open homes. Each
item says what to do and how to know it is done.

## Domain (the listings)

- [ ] **Create a Domain developer account** at developer.domain.com.au
  and a project in it.
- [ ] **Add the Agents and Listings package** to the project.
- [ ] **Create a credential**: an API key, or an OAuth client.
- [ ] **Add it to Vercel** (Production and Preview): `DOMAIN_API_KEY`,
  or `DOMAIN_CLIENT_ID` and `DOMAIN_CLIENT_SECRET`. Never with a
  `NEXT_PUBLIC_` prefix.
- [ ] **Turn demo mode off**: `NEXT_PUBLIC_DEMO_MODE=false`, then redeploy.
  Done when the amber "Sample data" banner is gone and homes carry a
  green "Domain" pill.
- [ ] **Run the six checks** under "Still to confirm with real keys" in
  docs/data-sources.md, against a Saturday search for Croydon and
  Ringwood, comparing three homes with domain.com.au by eye.

## Vercel

- [ ] **Create the project** from this repository. `vercel.json` pins
  the region to Sydney.
- [ ] **Turn on Deployment Protection** (Settings, Deployment
  Protection) for Production and Preview. The app has no accounts, so
  this is what stops a stranger spending the Domain allowance.
- [ ] **Decide the production branch** and how "push" works (CLAUDE.md
  section 5).

## Optional

- [ ] **Real road times**: `TRAVEL_PROVIDER=osrm`. The default
  `OSRM_BASE_URL` is the public demo server, fine for one person
  planning a Saturday. Done when the plan reads "Drive times are road
  times without traffic".
- [ ] **Geocoder contact**: set `GEOCODER_CONTACT` to an email address,
  as Nominatim's policy asks.
- [ ] **More suburbs**: add them to `src/lib/suburbs.ts` so a home added
  by hand there can fall back to its suburb centre.

## Parked (decided, not built)

- Accounts and saved days across devices. Today everything is kept in
  the one browser.
- A starting point (leaving from home) and a drive back.
- A map of the day inside the app. The Google Maps link covers it.
- Walking or public transport between homes.
- An alert when a planned home's time changes or it sells.
