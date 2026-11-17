import { priceFromText } from "./price.ts";
import { DEFAULT_OPEN_MINUTES, addDays, isDay, weekdayOf } from "./time.ts";
import type { InspectionWindow } from "./types.ts";

// Reading homes out of text the owner copied from a listing site in
// their own browser and pasted in: a listing page, or a page of
// inspection times. Nothing here fetches anything. The text is read on
// the device; only each home's street and suburb go to the server, to
// be placed on the map.
//
// Listing sites lay the same facts out in two ways, and the reader
// works out which from the text itself:
//   address first: the address, then its price, rooms and times;
//   time first: a time, then the address open at that time.
// Price, rooms and type always follow their address.
//
// A rule worth knowing, shown to the owner in the preview so it can be
// checked: a time written without am or pm, before 8, is taken as pm,
// because open homes run in the day.

export const PASTE_MAX_CHARS = 50_000;
export const PASTE_MAX_HOMES = 25;

export const PASTE_STATES = ["VIC", "NSW", "QLD", "SA", "WA", "TAS", "ACT", "NT"] as const;
export type PasteState = (typeof PASTE_STATES)[number];

export type PastedHome = {
  // From the address, so pasting the same home twice finds it again.
  id: string;
  street: string;
  // Empty when the text did not say.
  suburb: string;
  state: PasteState;
  priceText: string;
  priceFrom: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  carSpaces: number | null;
  propertyType: string | null;
  inspections: InspectionWindow[];
};

export type PasteResult = { homes: PastedHome[]; moreThanLimit: number };

const STREET_TYPES = [
  "street", "st", "road", "rd", "avenue", "ave", "av", "court", "ct", "crescent", "cres", "cr",
  "drive", "dr", "lane", "ln", "place", "pl", "parade", "pde", "way", "close", "cl", "grove",
  "gr", "gve", "boulevard", "boulevarde", "blvd", "bvd", "terrace", "tce", "rise", "walk", "mews",
  "circuit", "cct", "highway", "hwy", "square", "sq", "esplanade", "esp", "track", "trail",
  "row", "gardens", "gdns", "view", "vista", "ridge", "glade", "green", "link", "loop", "path",
  "promenade", "point", "pt", "retreat", "heights", "hts", "chase", "crest", "pass", "court",
  "nook", "outlook", "parkway", "pkwy", "strand", "wynd", "glen", "dale", "vale", "hill",
].join("|");

const ADDRESS_RE = new RegExp(
  String.raw`^(?:address:?\s*)?((?:(?:unit|apt|apartment|villa|lot|shop)\s+)?\d+[a-z]?(?:\s*[/-]\s*\d+[a-z]?)?\s+(?:[a-z][a-z'.-]*\s+){1,4}(?:${STREET_TYPES})\.?)(?=[\s,]|$)(?:(?:\s*,\s*|\s+)([a-z][a-z' -]{1,40}?))?(?:\s*,?\s+(vic|nsw|qld|sa|wa|tas|act|nt)\.?)?(?:\s*,?\s+(\d{4}))?\s*$`,
  "i"
);

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const DATE_RE = /(?:\b(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*\.?,?\s+)?\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?(?:,?\s+(\d{4}))?/i;
const WEEKDAY_RE = /\b(sun|mon|tue|wed|thu|fri|sat)(?:day|s|sday|nesday|rsday|urday|r|rs|urs)?\b/i;
const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const T = String.raw`(?<![\d:.])(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?`;
const RANGE_RE = new RegExp(String.raw`${T}\s*(?:-|–|—|to|until)\s*${T}(?!\d)`, "gi");
const SINGLE_RE = /(?<![\d:.$])(\d{1,2})(?:[:.](\d{2}))\s*(am|pm|a\.m\.|p\.m\.)?(?!\d)|(?<![\d:.$])(\d{1,2})\s*(am|pm|a\.m\.|p\.m\.)(?![a-z])/gi;

const TYPES_RE = /\b(house|townhouse|apartment|unit|villa|flat|studio|duplex|semi-detached|terrace)\b/i;

function titleCase(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/(^|[\s'-])([a-z])/g, (_, edge: string, letter: string) => edge + letter.toUpperCase());
}

function homeId(street: string, suburb: string): string {
  return `pasted-${`${street} ${suburb}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70)}`;
}

type Meridiem = "am" | "pm" | null;

function meridiem(text: string | undefined): Meridiem {
  if (text === undefined) return null;
  return text.toLowerCase().startsWith("p") ? "pm" : "am";
}

// The ways an hour can be read: as written with am or pm; or, without,
// as the morning and the afternoon reading of it.
function readings(hour: number, minute: number, mer: Meridiem): number[] {
  if (minute > 59 || hour > 23) return [];
  if (mer !== null) {
    if (hour < 1 || hour > 12) return [];
    return [((hour % 12) + (mer === "pm" ? 12 : 0)) * 60 + minute];
  }
  if (hour > 12 || hour === 0) return [hour * 60 + minute];
  return [(hour % 12) * 60 + minute, ((hour % 12) + 12) * 60 + minute];
}

// A lone time with no am or pm, before 8, is the afternoon.
function daytime(options: number[]): number | null {
  if (options.length === 0) return null;
  if (options.length === 1) return options[0] ?? null;
  return options.find((m) => m >= 8 * 60 && m < 20 * 60) ?? options[0] ?? null;
}

function rangeWindow(m: RegExpExecArray): { open: number; close: number } | null {
  const [, h1, m1, mer1, h2, m2, mer2] = m;
  // "2 - 3" could be anything; a time has minutes or am or pm on a side.
  if (m1 === undefined && mer1 === undefined && m2 === undefined && mer2 === undefined) return null;
  const startOptions = readings(Number(h1), Number(m1 ?? 0), meridiem(mer1));
  // "10:00 - 10:30am": the end's am or pm stands for both.
  const endMer = meridiem(mer2) ?? meridiem(mer1);
  const endOptions = readings(Number(h2), Number(m2 ?? 0), meridiem(mer2) ?? null);
  let open: number | null;
  let close: number | null;
  if (mer2 !== undefined && mer1 === undefined) {
    close = endOptions[0] ?? null;
    open = close === null ? null : ([...startOptions].reverse().find((v) => v < close!) ?? null);
  } else if (mer1 !== undefined) {
    open = startOptions[0] ?? null;
    const ends = mer2 !== undefined ? endOptions : readings(Number(h2), Number(m2 ?? 0), null);
    close = open === null ? null : (ends.find((v) => v > open!) ?? null);
  } else {
    open = daytime(startOptions);
    close = open === null ? null : (endOptions.find((v) => v > open!) ?? null);
  }
  void endMer;
  if (open === null || close === null || close <= open || close - open > 6 * 60) return null;
  return { open, close };
}

function timesIn(line: string): { open: number; close: number }[] {
  const found: { open: number; close: number }[] = [];
  let rest = line;
  for (const m of line.matchAll(RANGE_RE)) {
    const window = rangeWindow(m);
    if (window !== null) {
      found.push(window);
      rest = rest.replace(m[0], " ");
    }
  }
  for (const m of rest.matchAll(SINGLE_RE)) {
    const hour = Number(m[1] ?? m[4]);
    const minute = Number(m[2] ?? 0);
    const open = daytime(readings(hour, minute, meridiem(m[3] ?? m[5])));
    if (open !== null) found.push({ open, close: Math.min(open + DEFAULT_OPEN_MINUTES, 1439) });
  }
  return found;
}

// The day a date written without a year means: this year's, or next
// year's when this year's is more than a month gone.
function dayFor(dayOfMonth: number, month: number, year: number | null, today: string): string | null {
  const thisYear = Number(today.slice(0, 4));
  const pad = (n: number) => String(n).padStart(2, "0");
  const make = (y: number) => `${y}-${pad(month + 1)}-${pad(dayOfMonth)}`;
  if (year !== null) {
    const day = make(year);
    return isDay(day) ? day : null;
  }
  const day = make(thisYear);
  if (!isDay(day)) return null;
  return day < addDays(today, -31) ? make(thisYear + 1) : day;
}

function dateIn(line: string, today: string, hasTime: boolean): string | null {
  const full = DATE_RE.exec(line);
  if (full !== null) {
    return dayFor(Number(full[1]), MONTHS.indexOf((full[2] ?? "").toLowerCase()), full[3] === undefined ? null : Number(full[3]), today);
  }
  // A day named on its own only counts on a short line or beside a time,
  // so "Sun-drenched living" is never read as a Sunday.
  if (!hasTime && line.length > 25) return null;
  if (/\btoday\b/i.test(line)) return today;
  if (/\btomorrow\b/i.test(line)) return addDays(today, 1);
  const named = WEEKDAY_RE.exec(line);
  if (named !== null) {
    const wanted = WEEKDAYS.indexOf((named[1] ?? "").toLowerCase());
    return addDays(today, (wanted - weekdayOf(today) + 7) % 7);
  }
  return null;
}

type Line =
  | { kind: "address"; street: string; suburb: string; state: PasteState | null }
  | { kind: "time"; windows: InspectionWindow[] }
  | { kind: "other"; text: string };

export function parsePasted(
  text: string,
  { today, defaultDay, defaultState }: { today: string; defaultDay: string; defaultState: PasteState }
): PasteResult {
  const lines = text
    .slice(0, PASTE_MAX_CHARS)
    .split(/\r?\n|\u2028/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line !== "");

  let currentDay: string | null = null;
  const read: Line[] = [];
  for (const line of lines) {
    const address = ADDRESS_RE.exec(line);
    if (address !== null) {
      const state = address[3]?.toUpperCase() as PasteState | undefined;
      read.push({
        kind: "address",
        street: titleCase(address[1] ?? "").replace(/\s*\/\s*/g, "/"),
        suburb: titleCase(address[2] ?? ""),
        state: state ?? null,
      });
      continue;
    }
    // A price line and an auction line carry no inspection: an auction
    // time is not an open home.
    const quiet = line.includes("$") || /auction/i.test(line);
    const windows = quiet ? [] : timesIn(line);
    const day = quiet ? null : dateIn(line, today, windows.length > 0);
    if (day !== null) currentDay = day;
    if (windows.length > 0) {
      const on = currentDay ?? defaultDay;
      read.push({ kind: "time", windows: windows.map((w) => ({ date: on, ...w })) });
    } else {
      read.push({ kind: "other", text: line });
    }
  }

  const firstAddress = read.findIndex((l) => l.kind === "address");
  const firstTime = read.findIndex((l) => l.kind === "time");
  const timeFirst = firstTime !== -1 && firstAddress !== -1 && firstTime < firstAddress;

  const homes = new Map<string, PastedHome>();
  const order: PastedHome[] = [];
  let current: PastedHome | null = null;
  let waiting: InspectionWindow[] = [];

  for (const line of read) {
    if (line.kind === "address") {
      const id = homeId(line.street, line.suburb);
      const existing = homes.get(id);
      current =
        existing ??
        {
          id,
          street: line.street,
          suburb: line.suburb,
          state: line.state ?? defaultState,
          priceText: "",
          priceFrom: null,
          bedrooms: null,
          bathrooms: null,
          carSpaces: null,
          propertyType: null,
          inspections: [],
        };
      if (existing === undefined) {
        homes.set(id, current);
        order.push(current);
      }
      if (timeFirst) {
        current.inspections.push(...waiting);
        waiting = [];
      }
      continue;
    }
    if (line.kind === "time") {
      if (timeFirst) waiting.push(...line.windows);
      else current?.inspections.push(...line.windows);
      continue;
    }
    if (current === null) continue;
    const text = line.text;
    if (current.priceText === "" && text.length <= 120 && (text.includes("$") || /^(auction|contact agent|price on application|expressions? of interest|by negotiation|under offer)/i.test(text))) {
      current.priceText = text;
      current.priceFrom = priceFromText(text);
    }
    const beds = /(\d{1,2})\s*(?:beds?|bedrooms?|br)(?![a-z])/i.exec(text);
    if (current.bedrooms === null && beds !== null) current.bedrooms = Number(beds[1]);
    const baths = /(\d{1,2})\s*(?:baths?|bathrooms?)(?![a-z])/i.exec(text);
    if (current.bathrooms === null && baths !== null) current.bathrooms = Number(baths[1]);
    const cars = /(\d{1,2})\s*(?:parking|cars?|car spaces?|garages?|carports?)(?![a-z])/i.exec(text);
    if (current.carSpaces === null && cars !== null) current.carSpaces = Number(cars[1]);
    const kind = text.length <= 40 && !text.includes("$") ? TYPES_RE.exec(text) : null;
    if (current.propertyType === null && kind !== null) current.propertyType = titleCase(kind[1] ?? "");
  }

  for (const home of order) {
    const seen = new Set<string>();
    home.inspections = home.inspections
      .filter((w) => {
        const key = `${w.date}|${w.open}|${w.close}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.date.localeCompare(b.date) || a.open - b.open);
  }

  return { homes: order.slice(0, PASTE_MAX_HOMES), moreThanLimit: Math.max(0, order.length - PASTE_MAX_HOMES) };
}
