import { answer, readBody } from "@/lib/api";
import { placeAddress } from "@/lib/geocode";
import { geocodeSchema } from "@/lib/schemas";

// Where an address added by hand or pasted sits on the map. Throttled to
// the geocoder's one request a second; the paste import spaces its
// lookups to match.
export async function POST(req: Request) {
  const { body, refusal } = await readBody(req, "geocode", 60, geocodeSchema);
  if (refusal !== null) return refusal;
  const { data, error } = await placeAddress(body.street, body.suburb, body.state);
  if (data === null) return answer(null, error ?? "That address could not be found.", 404);
  return answer(data, null);
}
