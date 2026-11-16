import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDomainResults } from "./domain-parse.ts";
import { priceFromText, withinBudget } from "../price.ts";

const listing = (over: Record<string, unknown> = {}) => ({
  id: 2019000001,
  listingSlug: "1-example-street-croydon-vic-3136-2019000001",
  priceDetails: { displayPrice: "$580,000 - $630,000" },
  propertyDetails: {
    displayableAddress: "1 Example Street, Croydon",
    suburb: "CROYDON",
    propertyType: "Unit",
    bedrooms: 2,
    bathrooms: 1,
    carspaces: 1,
    latitude: -37.79,
    longitude: 145.28,
  },
  inspectionSchedule: {
    times: [{ openingTime: "2026-11-21T11:00:00", closingTime: "2026-11-21T11:30:00" }],
  },
  ...over,
});

test("reads a single listing", () => {
  const [found] = parseDomainResults([{ type: "PropertyListing", listing: listing() }]);
  assert.equal(found?.id, "domain-2019000001");
  assert.equal(found?.priceFrom, 580000);
  assert.deepEqual(found?.inspections, [{ date: "2026-11-21", open: 660, close: 690 }]);
  assert.equal(found?.url, "https://www.domain.com.au/1-example-street-croydon-vic-3136-2019000001");
});

test("reads the listings nested in a project", () => {
  const found = parseDomainResults([
    { type: "Project", listings: [listing({ id: 1 }), listing({ id: 2 })] },
  ]);
  assert.equal(found.length, 2);
});

test("takes coordinates from geoLocation and assumes half an hour with no closing time", () => {
  const raw = listing({
    geoLocation: { latitude: -37.8, longitude: 145.2 },
    inspectionSchedule: { times: [{ openingTime: "2026-11-21T13:00:00" }] },
  });
  (raw.propertyDetails as Record<string, unknown>).latitude = undefined;
  (raw.propertyDetails as Record<string, unknown>).longitude = undefined;
  const [found] = parseDomainResults([{ listing: raw }]);
  assert.equal(found?.lat, -37.8);
  assert.deepEqual(found?.inspections, [{ date: "2026-11-21", open: 780, close: 810 }]);
});

test("leaves out what has no inspection time or no place on the map", () => {
  const noTimes = listing({ id: 3, inspectionSchedule: { times: [] } });
  const noPlace = listing({ id: 4, propertyDetails: { displayableAddress: "2 Example St" } });
  assert.deepEqual(parseDomainResults([{ listing: noTimes }, { listing: noPlace }, "junk", null]), []);
  assert.deepEqual(parseDomainResults({ not: "a list" }), []);
});

test("never builds a link from a slug that is not a plain slug", () => {
  const [found] = parseDomainResults([{ listing: listing({ listingSlug: "//evil.example/x" }) }]);
  assert.equal(found?.url, "https://www.domain.com.au/2019000001");
});

test("prices", () => {
  assert.equal(priceFromText("$580,000 - $630,000"), 580000);
  assert.equal(priceFromText("Offers over $1.2m"), 1200000);
  assert.equal(priceFromText("$595k"), 595000);
  assert.equal(priceFromText("Contact Agent"), null);
  assert.equal(priceFromText("Auction"), null);
  assert.equal(withinBudget(600000, 625000, false), true);
  assert.equal(withinBudget(650000, 625000, true), false);
  assert.equal(withinBudget(null, 625000, false), false);
  assert.equal(withinBudget(null, 625000, true), true);
});
