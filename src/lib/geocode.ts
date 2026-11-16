import "server-only";

import { getGeocoderEnv, isDemoMode } from "@/lib/env";
import { logger } from "@/lib/logger";
import { findSuburb } from "@/lib/suburbs";

// The geocoding seam: where on the map is an address typed by hand.
// Nominatim (OpenStreetMap) when it is switched on and answers; the
// suburb centre otherwise, marked approximate so the screen can say the
// pin is only the suburb. One fixed host; the address travels only as a
// query value. Nominatim's policy is one request a second with an
// identifying User-Agent, which the route's rate limit keeps well under.

const HOST = "https://nominatim.openstreetmap.org/search";
const TIMEOUT_MS = 8_000;

export type Placed = { lat: number; lng: number; approximate: boolean };

export async function placeAddress(
  street: string,
  suburb: string,
  state: string
): Promise<{ data: Placed | null; error: string | null }> {
  const env = getGeocoderEnv();
  if (!isDemoMode() && env.provider === "nominatim") {
    try {
      const params = new URLSearchParams({
        street,
        city: suburb,
        state,
        country: "Australia",
        format: "jsonv2",
        limit: "1",
      });
      const contact = env.contact === "" ? "" : ` ${env.contact}`;
      const answer = await fetch(`${HOST}?${params.toString()}`, {
        headers: { "User-Agent": `openhouse-planner (personal use)${contact}` },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: "no-store",
      });
      if (answer.ok) {
        const body: unknown = await answer.json();
        const first = Array.isArray(body) ? (body[0] as { lat?: unknown; lon?: unknown } | undefined) : undefined;
        const lat = Number(first?.lat);
        const lng = Number(first?.lon);
        // Inside Australia, or it is not the address that was meant.
        if (Number.isFinite(lat) && Number.isFinite(lng) && lat < -9 && lat > -45 && lng > 110 && lng < 155) {
          return { data: { lat, lng, approximate: false }, error: null };
        }
      } else {
        logger.warn("geocode_refused", { status: answer.status });
      }
    } catch (problem) {
      logger.warn("geocode_failed", { reason: problem instanceof Error ? problem.name : "unknown" });
    }
  }
  const centre = findSuburb(suburb);
  if (centre !== null) {
    return { data: { lat: centre.lat, lng: centre.lng, approximate: true }, error: null };
  }
  return {
    data: null,
    error: "That address could not be found on the map. Check the street and suburb, then try again.",
  };
}
