import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePasted } from "./paste-parse.ts";

// Made-up homes in the three layouts listing sites use. None is real.
const opts = { today: "2026-11-17", defaultDay: "2026-11-21", defaultState: "VIC" as const };
const h = (hour: number, minute = 0) => hour * 60 + minute;

test("a listing page: address first, times under a date heading", () => {
  const { homes } = parsePasted(
    `3/14 Wattlebird Lane, Croydon VIC 3136
$540,000 - $590,000
2 Beds2 Baths1 Parking
Apartment / Unit / Flat
Inspections
Saturday, 21 November
10:00am - 10:30am
Sunday 22 Nov
11:00am - 11:30am`,
    opts
  );
  assert.equal(homes.length, 1);
  const home = homes[0]!;
  assert.equal(home.street, "3/14 Wattlebird Lane");
  assert.equal(home.suburb, "Croydon");
  assert.equal(home.state, "VIC");
  assert.equal(home.priceFrom, 540000);
  assert.equal(home.bedrooms, 2);
  assert.equal(home.bathrooms, 2);
  assert.equal(home.carSpaces, 1);
  assert.equal(home.propertyType, "Apartment");
  assert.deepEqual(home.inspections, [
    { date: "2026-11-21", open: h(10), close: h(10, 30) },
    { date: "2026-11-22", open: h(11), close: h(11, 30) },
  ]);
});

test("an inspection times page: the time first, then the home open at it", () => {
  const { homes } = parsePasted(
    `Saturday 21 November
10:00am - 10:30am
2/7 Ironbark Rise, Croydon
$560,000 - $610,000
2 beds 1 bath 1 car
11:30 - 12:00pm
5/21 Lyrebird Court, Croydon VIC 3136
Auction Sat 28 Nov 1:00pm
3 Bed 1 Bath 1 Car
Townhouse`,
    opts
  );
  assert.deepEqual(
    homes.map((home) => [home.street, home.inspections.map((w) => [w.date, w.open, w.close])]),
    [
      ["2/7 Ironbark Rise", [["2026-11-21", h(10), h(10, 30)]]],
      // "11:30 - 12:00pm" is 11:30 in the morning, not at night.
      ["5/21 Lyrebird Court", [["2026-11-21", h(11, 30), h(12)]]],
    ]
  );
  // The auction line is the price, and its time is not an open home.
  assert.equal(homes[1]?.priceText, "Auction Sat 28 Nov 1:00pm");
  assert.equal(homes[1]?.priceFrom, null);
  assert.equal(homes[1]?.propertyType, "Townhouse");
});

test("one line with the day and a start time only runs the default half hour", () => {
  const { homes } = parsePasted(
    `1/9 Sugargum Walk, Croydon South, Vic 3136
$575,000
Inspection Sat 21 Nov 11:15am`,
    opts
  );
  assert.equal(homes[0]?.suburb, "Croydon South");
  assert.deepEqual(homes[0]?.inspections, [{ date: "2026-11-21", open: h(11, 15), close: h(11, 45) }]);
});

test("a time with no day takes the day chosen; an afternoon hour without pm is pm", () => {
  const { homes } = parsePasted(`12 Correa Crescent Ringwood\n1:00 - 1:30`, opts);
  assert.deepEqual(homes[0]?.inspections, [{ date: "2026-11-21", open: h(13), close: h(13, 30) }]);
});

test("a home without a suburb or a time is still found, so the preview can say what is missing", () => {
  const { homes } = parsePasted(`8 Banksia Mews\n$500,000`, opts);
  assert.equal(homes[0]?.suburb, "");
  assert.deepEqual(homes[0]?.inspections, []);
});

test("prices, room counts and descriptions are never read as times or days", () => {
  const { homes } = parsePasted(
    `4/30 Boobook Street, Ringwood East
$510,000 - $550,000
Sun-drenched living with 2 - 3 bedrooms on offer and 2 bathrooms throughout the home
Built in 2015`,
    opts
  );
  assert.deepEqual(homes[0]?.inspections, []);
});

test("the same home pasted twice is one home with both times", () => {
  const { homes } = parsePasted(
    `6/45 Rosella Avenue, Ringwood\nSat 21 Nov 1:00pm - 1:30pm\n6/45 Rosella Ave, Ringwood\n`,
    opts
  );
  // "Avenue" and "Ave" are written differently, so they stay two homes;
  // the same spelling twice is one.
  const again = parsePasted(`6/45 Rosella Avenue, Ringwood\nSat 21 Nov 1:00pm - 1:30pm\n6/45 Rosella Avenue, Ringwood\nSat 21 Nov 3:00pm - 3:30pm`, opts);
  assert.equal(homes.length, 2);
  assert.equal(again.homes.length, 1);
  assert.equal(again.homes[0]?.inspections.length, 2);
});

test("a date earlier this year means next year", () => {
  const { homes } = parsePasted(`1 Example Street, Croydon\n10 January 10:00am - 10:30am`, opts);
  assert.equal(homes[0]?.inspections[0]?.date, "2027-01-10");
});

test("the number of homes is capped and the rest are counted", () => {
  const text = Array.from({ length: 30 }, (_, i) => `${i + 1} Example Street, Croydon\n10:00am - 10:30am`).join("\n");
  const { homes, moreThanLimit } = parsePasted(text, opts);
  assert.equal(homes.length, 25);
  assert.equal(moreThanLimit, 5);
});

test("a suburb ending in the letters of a state keeps them", () => {
  const { homes } = parsePasted(`1/26 Heathbell Road, Heathmont\n2 Example Street, Mount Waverley VIC 3149\n3 Example Street, Croydon, Vic\n4 Example Street Croydon 3136`, opts);
  assert.deepEqual(
    homes.map((home) => [home.street, home.suburb, home.state]),
    [
      ["1/26 Heathbell Road", "Heathmont", "VIC"],
      ["2 Example Street", "Mount Waverley", "VIC"],
      ["3 Example Street", "Croydon", "VIC"],
      ["4 Example Street", "Croydon", "VIC"],
    ]
  );
});
