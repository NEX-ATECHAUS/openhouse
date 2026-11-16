import { test } from "node:test";
import assert from "node:assert/strict";
import { mapsLinks, planToIcs } from "./export.ts";
import type { Listing, PlannedStop } from "./types.ts";

const listing: Listing = {
  id: "a",
  source: "sample",
  address: "1 Example St, Croydon\nBEGIN:VEVENT",
  suburb: "Croydon",
  lat: -37.79,
  lng: 145.28,
  approximate: false,
  bedrooms: 2,
  bathrooms: 1,
  carSpaces: 1,
  propertyType: "Unit",
  priceText: "$580,000; negotiable",
  priceFrom: 580000,
  url: null,
  inspections: [],
};
const stop: PlannedStop = {
  id: "a", travelMinutes: 0, arrive: 660, start: 660, leave: 675, open: 660, close: 690, breakBefore: null,
};

test("the calendar file has one event at the walk-in time, with text escaped", () => {
  const ics = planToIcs("2026-11-21", [stop], new Map([["a", listing]]), new Date("2026-11-16T00:00:00Z"));
  assert.match(ics, /DTSTART:20261121T110000\r\n/);
  assert.match(ics, /DTEND:20261121T111500\r\n/);
  assert.equal(ics.match(/^BEGIN:VEVENT\r$/gm)?.length, 1);
  assert.match(ics, /LOCATION:1 Example St\\, Croydon\\nBEGIN:VEVENT\r\n/);
  assert.match(ics, /\$580\\,000\; negotiable/);
});

test("maps links chain when the day is longer than one link holds", () => {
  const points = Array.from({ length: 14 }, (_, i) => ({ lat: -37.8 + i / 1000, lng: 145.2 }));
  const links = mapsLinks(points);
  assert.equal(links.length, 2);
  assert.match(links[0] ?? "", /origin=-37.800000%2C145.200000/);
  assert.match(links[1] ?? "", /origin=-37.790000%2C145.200000/);
  assert.match(links[1] ?? "", /destination=-37.787000%2C145.200000/);
  assert.equal(mapsLinks([]).length, 0);
  assert.equal(mapsLinks([points[0]!]).length, 1);
});
