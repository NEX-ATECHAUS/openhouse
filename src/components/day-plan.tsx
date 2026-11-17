"use client";

import { HomeSpecs, priceLabel } from "@/components/home-card";
import { HomeNote } from "@/components/home-note";
import { IconCalendar, IconCar, IconClock, IconCoffee, IconRoute } from "@/components/icons";
import { mapsLinks, planToIcs } from "@/lib/export";
import { formatClock, formatDay, formatDuration, formatDurationShort } from "@/lib/time";
import type { Notes } from "@/lib/notes";
import type { Listing, Plan, TravelSource } from "@/lib/types";

// The day, in the order it happens: each stop with when to walk in and
// when to leave, and between stops the drive, any wait and the break.

const SKIP_WORDS = {
  clash: "It is open at the same time as homes that fit the day better.",
  "too-short": "It is open for less time than a visit takes.",
} as const;

function downloadCalendar(day: string, plan: Plan, listings: Map<string, Listing>, notes: Notes) {
  const file = new Blob([planToIcs(day, plan.stops, listings, notes)], { type: "text/calendar" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = `open-homes-${day}.ics`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function DayPlan({
  day,
  plan,
  listings,
  travelSource,
  breakAsked,
  notes,
  notesSaved,
  onNote,
}: {
  day: string;
  plan: Plan;
  listings: Map<string, Listing>;
  travelSource: TravelSource;
  breakAsked: boolean;
  notes: Notes;
  notesSaved: boolean;
  onNote: (id: string, next: string) => void;
}) {
  const first = plan.stops[0];
  const last = plan.stops[plan.stops.length - 1];
  if (first === undefined || last === undefined) {
    return <p className="empty">None of the homes picked can be visited. Try a shorter time in each home.</p>;
  }
  const points = plan.stops
    .map((stop) => listings.get(stop.id))
    .filter((listing): listing is Listing => listing !== undefined);
  const links = mapsLinks(points);

  return (
    <>
      <div>
        <p className="tagline">{formatDay(day)}</p>
        <h3>
          {plan.stops.length === 1 ? "1 home" : `${plan.stops.length} homes`}, {formatClock(first.start)} to {formatClock(last.leave)}
        </h3>
      </div>
      <div className="totals">
        <div className="total">
          <p className="tagline">Homes</p>
          <p className="total-figure">{plan.stops.length}</p>
        </div>
        <div className="total">
          <p className="tagline">Driving</p>
          <p className="total-figure" title={formatDuration(plan.travelMinutes)}>
            {formatDurationShort(plan.travelMinutes)}
          </p>
        </div>
        <div className="total">
          <p className="tagline">Out for</p>
          <p className="total-figure" title={formatDuration(last.leave - first.start)}>
            {formatDurationShort(last.leave - first.start)}
          </p>
        </div>
      </div>
      {breakAsked && !plan.breakFitted ? (
        <p className="notice amber">The break did not fit without dropping a home, so it was left out. Leave a home out of the day to make room.</p>
      ) : null}
      <ol className="day">
        {plan.stops.map((stop, index) => {
          const listing = listings.get(stop.id);
          const wait = stop.start - stop.arrive;
          return (
            <li key={stop.id} className="day-item">
              {index === 0 ? null : (
                <div className="between">
                  {stop.breakBefore === null ? null : (
                    <span className="pill amber">
                      <IconCoffee />
                      Break {formatClock(stop.breakBefore.start)} to {formatClock(stop.breakBefore.end)}
                    </span>
                  )}
                  <span className="pill">
                    <IconCar />
                    {formatDuration(stop.travelMinutes)} drive
                  </span>
                  {wait > 0 ? (
                    <span className="pill">
                      <IconClock />
                      {formatDuration(wait)} to spare
                    </span>
                  ) : null}
                </div>
              )}
              <div className="stop">
                <span className="stop-number">{index + 1}</span>
                <div className="stop-body">
                  <p className="stop-time">
                    {formatClock(stop.start)} to {formatClock(stop.leave)}
                  </p>
                  <p className="home-address">{listing?.address ?? "A home no longer in the list"}</p>
                  {listing === undefined ? null : (
                    <>
                      <p className="home-facts">{priceLabel(listing)}</p>
                      <HomeSpecs listing={listing} />
                    </>
                  )}
                  <p className="small muted">
                    Open {formatClock(stop.open)} to {formatClock(stop.close)}
                  </p>
                  <HomeNote text={notes[stop.id]?.text ?? ""} saved={notesSaved} onChange={(next) => onNote(stop.id, next)} />
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="actions">
        {links.map((link, index) => (
          <a key={link} className="button accent" href={link} target="_blank" rel="noopener noreferrer">
            <IconRoute />
            {links.length === 1 ? "Open the route in Google Maps" : `Google Maps, part ${index + 1}`}
          </a>
        ))}
        <button type="button" className="button ghost" onClick={() => downloadCalendar(day, plan, listings, notes)}>
          <IconCalendar />
          Add to my calendar
        </button>
      </div>
      <p className="small muted">
        {travelSource === "osrm"
          ? "Drive times are road times without traffic."
          : "Drive times are estimates from the distance between homes. Check the route on the day."}
      </p>
      {plan.skipped.length === 0 ? null : (
        <div className="notice">
          <p>
            <strong>{plan.skipped.length === 1 ? "1 home did not fit." : `${plan.skipped.length} homes did not fit.`}</strong>
          </p>
          <ul>
            {plan.skipped.map((skip) => (
              <li key={skip.id}>
                {listings.get(skip.id)?.address ?? "A home"}: {SKIP_WORDS[skip.reason]}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
