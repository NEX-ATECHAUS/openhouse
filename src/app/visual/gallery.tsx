"use client";

import { AddHome } from "@/components/add-home";
import { DayPlan } from "@/components/day-plan";
import { DaySettings } from "@/components/day-settings";
import { HomeCard } from "@/components/home-card";
import { HomeNote } from "@/components/home-note";
import { HouseArt } from "@/components/house-art";
import { ThemeToggle } from "@/components/theme-toggle";
import { Pager } from "@/components/pager";
import { DEFAULT_SETTINGS, Planner } from "@/components/planner";
import { SearchForm } from "@/components/search-form";
import type { Listing, Plan } from "@/lib/types";

// The visual harness gallery: the real components, in the states that
// break them, with data longer and emptier than anything real. It
// exists only under VISUAL_HARNESS (see docs/visual-harness.md) and
// every value in it is invented.

const noop = () => {};

const home = (over: Partial<Listing> = {}): Listing => ({
  id: "v-1",
  source: "sample",
  address: "3/14 Wattlebird Lane, Croydon",
  suburb: "Croydon",
  lat: -37.795,
  lng: 145.281,
  approximate: false,
  bedrooms: 2,
  bathrooms: 1,
  carSpaces: 1,
  propertyType: "Unit",
  priceText: "$540,000 - $590,000",
  priceFrom: 540000,
  url: null,
  inspections: [{ date: "2026-11-21", open: 600, close: 630 }],
  ...over,
});

const LONG = home({
  id: "v-long",
  source: "domain",
  address:
    "Apartment 1204, Level 12, The Stringybark Residences Building C, 60-68 Peppermint Grove Boulevard East, Ringwood",
  priceText: "Expressions of interest closing Tuesday 24 November at 5pm unless sold prior, $470,000 - $515,000",
  url: "https://www.domain.com.au/1",
  inspections: [
    { date: "2026-11-21", open: 600, close: 630 },
    { date: "2026-11-21", open: 780, close: 810 },
    { date: "2026-11-21", open: 990, close: 1020 },
  ],
});

const EMPTY = home({
  id: "v-empty",
  source: "manual",
  address: "12 Example Street, Croydon",
  approximate: true,
  bedrooms: null,
  bathrooms: null,
  carSpaces: null,
  propertyType: null,
  priceText: "",
  priceFrom: null,
});

const SECOND = home({ id: "v-2", address: "2/7 Ironbark Rise, Croydon", inspections: [{ date: "2026-11-21", open: 690, close: 720 }] });

const LONG_NOTE =
  "Good light in the living room, north facing balcony. Noisy from the main road with the windows open.\nStrata about $900 a quarter, ask about the special levy. Storage cage in the basement. Agent says offers before the auction are welcome.";

const NOTES = { "v-1": { text: "Kitchen redone. Ask about the body corporate.", at: 1 }, "v-long": { text: LONG_NOTE, at: 1 } };

const PLAN: Plan = {
  stops: [
    { id: "v-1", travelMinutes: 0, arrive: 600, start: 600, leave: 615, open: 600, close: 630, breakBefore: null },
    { id: "v-long", travelMinutes: 19, arrive: 634, start: 634, leave: 649, open: 600, close: 660, breakBefore: null },
    { id: "v-2", travelMinutes: 12, arrive: 661, start: 690, leave: 705, open: 690, close: 720, breakBefore: null },
    { id: "v-empty", travelMinutes: 9, arrive: 759, start: 780, leave: 795, open: 780, close: 810, breakBefore: { start: 720, end: 750 } },
  ],
  skipped: [
    { id: "v-skip", reason: "clash" },
    { id: "v-short", reason: "too-short" },
  ],
  travelMinutes: 40,
  breakFitted: true,
};

const LISTINGS = new Map<string, Listing>(
  [home(), LONG, SECOND, EMPTY, home({ id: "v-skip", address: "8 Correa Crescent, Croydon" }), home({ id: "v-short", address: "9/3 Banksia Mews, Ringwood East" })].map(
    (listing) => [listing.id, listing]
  )
);

function Block({ name, note, stack, children }: { name: string; note: string; stack?: boolean; children: React.ReactNode }) {
  return (
    <section className="visual-block" data-visual={name}>
      <p className="tagline">
        {name}: {note}
      </p>
      {stack ? (
        <div className="visual-stage content" data-visual-stack>
          {children}
        </div>
      ) : (
        <div className="visual-stage card">{children}</div>
      )}
    </section>
  );
}

export function Gallery() {
  return (
    <>
      <Block name="home-card" note="a sample home, in the day">
        <ul className="homes">
          <HomeCard listing={home()} included mustSee={false} kmFromMustSee={null} outOfRange={false} onInclude={noop} onMustSee={noop} note="" noteSaved onNote={noop} />
        </ul>
      </Block>
      <Block name="home-card-long" note="a long address, a long price, three times, a must-see elsewhere">
        <ul className="homes">
          <HomeCard listing={LONG} included mustSee={false} kmFromMustSee={3.4} outOfRange={false} onInclude={noop} onMustSee={noop} note={LONG_NOTE} noteSaved onNote={noop} />
        </ul>
      </Block>
      <Block name="home-card-empty" note="added by hand: nothing known, suburb pin, must-see, removable">
        <ul className="homes">
          <HomeCard listing={EMPTY} included mustSee kmFromMustSee={0} outOfRange={false} onInclude={noop} onMustSee={noop} onRemove={noop} note="" noteSaved onNote={noop} />
        </ul>
      </Block>
      <Block name="home-card-out" note="left out, and too far from the must-see">
        <ul className="homes">
          <HomeCard listing={SECOND} included={false} mustSee={false} kmFromMustSee={1.2} outOfRange={false} onInclude={noop} onMustSee={noop} note="Second bedroom small." noteSaved onNote={noop} />
          <HomeCard listing={LONG} included mustSee={false} kmFromMustSee={12.6} outOfRange onInclude={noop} onMustSee={noop} note="" noteSaved onNote={noop} />
        </ul>
      </Block>
      <Block name="home-note-open" note="a note being written, and one the browser will not keep">
        <HomeNote text={LONG_NOTE} saved onChange={noop} startOpen />
        <HomeNote text="" saved={false} onChange={noop} startOpen />
      </Block>
      <Block name="theme-toggle" note="the light and dark switch">
        <ThemeToggle />
      </Block>
      <Block name="pager" note="the second page of three">
        <Pager page={1} total={27} onPage={noop} />
      </Block>
      <Block name="add-home" note="closed, as it first appears">
        <AddHome date="2026-11-21" state="VIC" onAdd={noop} />
      </Block>
      <Block name="day-settings" note="with a must-see">
        <DaySettings settings={DEFAULT_SETTINGS} radiusKm={5} hasMustSee onSettings={noop} onRadius={noop} />
      </Block>
      <Block name="day-settings-empty" note="no break and no must-see: two controls switched off">
        <DaySettings settings={{ ...DEFAULT_SETTINGS, breakMinutes: 0 }} radiusKm={0} hasMustSee={false} onSettings={noop} onRadius={noop} />
      </Block>
      <Block name="day-plan" note="four stops, a wait, a break, two that did not fit">
        <DayPlan day="2026-11-21" plan={PLAN} listings={LISTINGS} travelSource="estimate" breakAsked notes={NOTES} notesSaved onNote={noop} />
      </Block>
      <Block name="day-plan-one" note="one stop, the break left out, road times">
        <DayPlan
          day="2026-11-21"
          plan={{ stops: PLAN.stops.slice(0, 1), skipped: [], travelMinutes: 0, breakFitted: false }}
          listings={LISTINGS}
          travelSource="osrm"
          breakAsked
          notes={{}}
          notesSaved
          onNote={noop}
        />
      </Block>
      <Block name="day-plan-none" note="nothing could be visited">
        <DayPlan day="2026-11-21" plan={{ stops: [], skipped: [], travelMinutes: 0, breakFitted: true }} listings={LISTINGS} travelSource="estimate" breakAsked={false} notes={{}} notesSaved onNote={noop} />
      </Block>
      <Block name="house-art" note="the four palettes the homes are drawn in">
        <div className="art-row">
          {(["warm", "sky", "rose", "mint"] as const).map((variant) => (
            <div className="home-thumb" key={variant}>
              <HouseArt variant={variant} id={`v-${variant}`} />
            </div>
          ))}
        </div>
      </Block>
      <Block name="notices" note="the three tones and the empty state">
        <p className="notice">2 homes did not fit.</p>
        <p className="notice amber">Sample data. These homes are made up so the planner can be tried.</p>
        <p className="notice red">Domain could not be reached. Check the connection, then try again.</p>
        <p className="empty">Search above to see the homes open on Saturday 21 November.</p>
      </Block>
      <Block name="search-form" note="as it first appears" stack>
        <SearchForm
          values={{ suburbs: "Croydon, Ringwood", state: "VIC", minBedrooms: 2, maxPrice: "625000", date: "2026-11-21", includeSurrounding: true, includeUnpriced: true }}
          busy={false}
          onChange={noop}
          onSubmit={noop}
        />
      </Block>
      <Block name="page-home" note="the whole page before a search, sample banner first" stack>
        <Planner defaultDate="2026-11-21" today="2026-11-16" demo />
      </Block>
    </>
  );
}
