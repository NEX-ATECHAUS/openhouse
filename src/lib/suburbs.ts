// Suburb centres for the area the app was first built for, Melbourne's
// outer east. Used by the sample listings, by "include surrounding
// suburbs" in demo mode, and as the fallback pin for an address added by
// hand when the geocoder cannot place it. Add a suburb here to widen it.

export type Suburb = {
  name: string;
  state: string;
  postcode: string;
  lat: number;
  lng: number;
  neighbours: string[];
};

export const SUBURBS: Suburb[] = [
  { name: "Croydon", state: "VIC", postcode: "3136", lat: -37.795, lng: 145.281, neighbours: ["Croydon South", "Croydon North", "Croydon Hills", "Mooroolbark", "Ringwood East", "Kilsyth"] },
  { name: "Croydon South", state: "VIC", postcode: "3136", lat: -37.812, lng: 145.283, neighbours: ["Croydon", "Ringwood East", "Bayswater North", "Kilsyth"] },
  { name: "Croydon North", state: "VIC", postcode: "3136", lat: -37.773, lng: 145.288, neighbours: ["Croydon", "Croydon Hills", "Mooroolbark"] },
  { name: "Croydon Hills", state: "VIC", postcode: "3136", lat: -37.776, lng: 145.262, neighbours: ["Croydon", "Croydon North", "Ringwood North"] },
  { name: "Ringwood", state: "VIC", postcode: "3134", lat: -37.814, lng: 145.229, neighbours: ["Ringwood East", "Ringwood North", "Heathmont", "Mitcham"] },
  { name: "Ringwood East", state: "VIC", postcode: "3135", lat: -37.812, lng: 145.251, neighbours: ["Ringwood", "Croydon", "Croydon South", "Heathmont", "Bayswater North"] },
  { name: "Ringwood North", state: "VIC", postcode: "3134", lat: -37.792, lng: 145.233, neighbours: ["Ringwood", "Croydon Hills"] },
  { name: "Heathmont", state: "VIC", postcode: "3135", lat: -37.828, lng: 145.245, neighbours: ["Ringwood", "Ringwood East", "Bayswater North"] },
  { name: "Mooroolbark", state: "VIC", postcode: "3138", lat: -37.785, lng: 145.313, neighbours: ["Croydon", "Croydon North", "Kilsyth"] },
  { name: "Kilsyth", state: "VIC", postcode: "3137", lat: -37.802, lng: 145.312, neighbours: ["Croydon", "Croydon South", "Mooroolbark"] },
  { name: "Bayswater North", state: "VIC", postcode: "3153", lat: -37.827, lng: 145.283, neighbours: ["Croydon South", "Ringwood East", "Heathmont"] },
  { name: "Mitcham", state: "VIC", postcode: "3132", lat: -37.817, lng: 145.193, neighbours: ["Ringwood"] },
];

export function findSuburb(name: string): Suburb | null {
  const wanted = name.trim().toLowerCase();
  return SUBURBS.find((s) => s.name.toLowerCase() === wanted) ?? null;
}

// The suburbs asked for, plus their neighbours when asked.
export function widenSuburbs(names: string[], includeSurrounding: boolean): string[] {
  const out = new Set<string>();
  for (const name of names) {
    const suburb = findSuburb(name);
    out.add(suburb?.name ?? name.trim());
    if (includeSurrounding && suburb !== null) {
      for (const neighbour of suburb.neighbours) out.add(neighbour);
    }
  }
  return [...out];
}
