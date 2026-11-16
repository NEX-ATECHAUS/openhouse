import type { Listing, SearchQuery } from "../types.ts";
import { withinBudget } from "../price.ts";

// The one filter every source's listings pass through, so a home is in
// or out by the same rule whether it came from Domain or the samples:
// open on the chosen day, enough bedrooms, inside the budget. A listing
// that does not state its bedrooms is kept; the card shows that.
// Returned earliest opening first, because a day is read in time order.

export function filterForDay(listings: Listing[], query: SearchQuery): Listing[] {
  return listings
    .map((listing) => ({
      ...listing,
      inspections: listing.inspections
        .filter((w) => w.date === query.date)
        .sort((a, b) => a.open - b.open),
    }))
    .filter(
      (listing) =>
        listing.inspections.length > 0 &&
        (listing.bedrooms === null || listing.bedrooms >= query.minBedrooms) &&
        withinBudget(listing.priceFrom, query.maxPrice, query.includeUnpriced)
    )
    .sort(
      (a, b) =>
        (a.inspections[0]?.open ?? 0) - (b.inspections[0]?.open ?? 0) ||
        a.address.localeCompare(b.address)
    );
}
