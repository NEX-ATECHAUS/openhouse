import { answer, readBody } from "@/lib/api";
import { searchListings } from "@/lib/listings";
import { searchSchema } from "@/lib/schemas";

// Open homes for one day. Calls Domain (or the samples in demo mode)
// through the listings seam. Throttled, because every search spends
// some of Domain's daily allowance.
export async function POST(req: Request) {
  const { body, refusal } = await readBody(req, "search", 20, searchSchema);
  if (refusal !== null) return refusal;
  const { data, error } = await searchListings(body);
  if (data === null) return answer(null, error ?? "The search failed. Try again.", 502);
  return answer(data, null);
}
