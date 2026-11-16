// The shapes the whole app shares. Times are wall-clock times in the
// property's own timezone, exactly as the listing site shows them: a day
// as "YYYY-MM-DD" and a time as minutes after midnight. Nothing here is
// converted between timezones, because an open home at 11:00 is at 11:00
// wherever the person planning happens to be.

export type ListingSource = "domain" | "sample" | "manual";

export type InspectionWindow = {
  date: string; // YYYY-MM-DD
  open: number; // minutes after midnight
  close: number; // minutes after midnight
};

export type Listing = {
  id: string;
  source: ListingSource;
  address: string;
  suburb: string;
  lat: number;
  lng: number;
  // True when the pin is only the suburb centre, not the house.
  approximate: boolean;
  bedrooms: number | null;
  bathrooms: number | null;
  carSpaces: number | null;
  propertyType: string | null;
  // The price as the agent wrote it, for example "$580,000 - $630,000".
  priceText: string;
  // The lowest dollar figure in priceText, or null when none is stated.
  priceFrom: number | null;
  url: string | null;
  inspections: InspectionWindow[];
};

export type SearchQuery = {
  suburbs: string[];
  state: string;
  minBedrooms: number;
  maxPrice: number;
  date: string;
  includeSurrounding: boolean;
  includeUnpriced: boolean;
};

export type PlanSettings = {
  // Minutes spent inside each home.
  visitMinutes: number;
  // Minutes added to every drive for parking and walking to the door.
  bufferMinutes: number;
  // One break of this length, 0 for none.
  breakMinutes: number;
  // The break is taken at or after this time of day.
  breakAfter: number;
};

export type PlanStopInput = {
  id: string;
  lat: number;
  lng: number;
  mustSee: boolean;
  windows: { open: number; close: number }[];
};

export type PlannedStop = {
  id: string;
  // Drive from the previous stop, buffer included. 0 for the first.
  travelMinutes: number;
  // When you pull up. Before `start` when you are early.
  arrive: number;
  // When you walk in: the later of arriving and the home opening.
  start: number;
  leave: number;
  open: number;
  close: number;
  // A break taken before driving to this stop.
  breakBefore: { start: number; end: number } | null;
};

export type SkipReason = "clash" | "too-short";

export type Plan = {
  stops: PlannedStop[];
  skipped: { id: string; reason: SkipReason }[];
  travelMinutes: number;
  // False when a break was asked for and the day had no room for it.
  breakFitted: boolean;
};

export type TravelSource = "estimate" | "osrm";
