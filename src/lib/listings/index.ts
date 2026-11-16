import "server-only";

import { isDemoMode } from "@/lib/env";
import type { Listing, SearchQuery } from "@/lib/types";
import { widenSuburbs } from "@/lib/suburbs";
import { searchDomain } from "./domain";
import { filterForDay } from "./filter";
import { sampleListings } from "./sample";

// The listings seam. Pages and routes ask here; which source answers is
// decided here and nowhere else.

export type SearchResult = {
  listings: Listing[];
  source: "sample" | "domain";
};

export async function searchListings(
  query: SearchQuery
): Promise<{ data: SearchResult | null; error: string | null }> {
  if (isDemoMode()) {
    const suburbs = widenSuburbs(query.suburbs, query.includeSurrounding);
    return {
      data: { listings: filterForDay(sampleListings(query, suburbs), query), source: "sample" },
      error: null,
    };
  }
  const { data, error } = await searchDomain(query);
  if (data === null) {
    return { data: null, error };
  }
  return { data: { listings: filterForDay(data, query), source: "domain" }, error: null };
}
