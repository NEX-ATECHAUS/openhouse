import type { Notes } from "./notes.ts";
import type { Listing, PlannedStop } from "./types.ts";

// What leaves the app for the day itself: a calendar file and a Google
// Maps link. Both are built from the plan; neither calls anything.

const pad = (n: number) => String(n).padStart(2, "0");

function stamp(day: string, minutes: number): string {
  return `${day.replace(/-/g, "")}T${pad(Math.floor(minutes / 60))}${pad(minutes % 60)}00`;
}

// Calendar text has its own escaping, and a value with a line break in
// it could otherwise start a property of its own.
function icsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

// One event per home, at the time you walk in. The times carry no
// timezone on purpose: they are the times on the day, wherever the phone
// thinks it is.
export function planToIcs(
  day: string,
  stops: PlannedStop[],
  listings: Map<string, Listing>,
  notes: Notes = {},
  now: Date = new Date()
): string {
  const made = now.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Open House//Planner//EN", "CALSCALE:GREGORIAN"];
  stops.forEach((stop, index) => {
    const listing = listings.get(stop.id);
    if (listing === undefined) return;
    const facts = [
      listing.priceText === "" ? "Price not stated" : listing.priceText,
      listing.bedrooms === null ? "" : `${listing.bedrooms} bed`,
      listing.url ?? "",
      notes[stop.id] === undefined ? "" : `Note: ${notes[stop.id]?.text ?? ""}`,
    ].filter((part) => part !== "");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${day}-${index + 1}-${stop.id.replace(/[^a-zA-Z0-9-]/g, "")}@openhouse`,
      `DTSTAMP:${made}`,
      `DTSTART:${stamp(day, stop.start)}`,
      `DTEND:${stamp(day, stop.leave)}`,
      `SUMMARY:${icsText(`Open home ${index + 1}: ${listing.address}`)}`,
      `LOCATION:${icsText(listing.address)}`,
      `DESCRIPTION:${icsText(facts.join("\n"))}`,
      "END:VEVENT"
    );
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

// Google Maps takes an origin, a destination and up to nine stops
// between on a phone. A longer day is given as several links, each
// starting where the last one ended.
const MAX_BETWEEN = 9;

export function mapsLinks(points: { lat: number; lng: number }[]): string[] {
  if (points.length === 0) return [];
  const at = (p: { lat: number; lng: number }) => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`;
  const links: string[] = [];
  let from = 0;
  do {
    const to = Math.min(from + MAX_BETWEEN + 1, points.length - 1);
    const leg = points.slice(from, to + 1);
    const first = leg[0];
    const last = leg[leg.length - 1];
    if (first === undefined || last === undefined) break;
    const params = new URLSearchParams({ api: "1", travelmode: "driving", destination: at(last) });
    if (leg.length > 1) params.set("origin", at(first));
    const between = leg.slice(1, -1).map(at).join("|");
    if (between !== "") params.set("waypoints", between);
    links.push(`https://www.google.com/maps/dir/?${params.toString()}`);
    from = to;
  } while (from < points.length - 1);
  return links;
}
