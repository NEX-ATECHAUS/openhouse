// Drive times worked out from straight-line distance. Suburban streets
// run about 1.4 times the straight line, at about 32 km/h door to door
// once lights and turns are counted. It is an estimate and the screen
// says so; the OSRM seam in src/lib/travel.ts gives real road times.

export type Point = { lat: number; lng: number };

const ROAD_FACTOR = 1.4;
const KMH = 32;

export function straightLineKm(a: Point, b: Point): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function estimateDriveMinutes(a: Point, b: Point): number {
  const km = straightLineKm(a, b) * ROAD_FACTOR;
  if (km < 0.05) return 0;
  return Math.max(1, Math.ceil((km / KMH) * 60));
}

// Minutes from every point to every other, as rows.
export function estimateMatrix(points: Point[]): number[][] {
  return points.map((from) => points.map((to) => estimateDriveMinutes(from, to)));
}
