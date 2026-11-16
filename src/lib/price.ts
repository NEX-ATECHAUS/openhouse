// Reading a price out of the words an agent wrote. "$580,000 - $630,000"
// gives 580000; "$1.2m" gives 1200000; "Contact agent" and "Auction"
// give null, which the screen shows as "price not stated".

export function priceFromText(text: string): number | null {
  const found = /\$\s*([\d,]+(?:\.\d+)?)\s*(k|m|mil|million)?/i.exec(text);
  if (found === null) return null;
  const figure = Number((found[1] ?? "").replace(/,/g, ""));
  if (!Number.isFinite(figure) || figure <= 0) return null;
  const unit = (found[2] ?? "").toLowerCase();
  const dollars = unit === "k" ? figure * 1000 : unit === "" ? figure : figure * 1_000_000;
  // A figure too small to be a sale price is a typo or a weekly rent.
  return dollars >= 10_000 ? Math.round(dollars) : null;
}

export function formatDollars(amount: number): string {
  return `$${Math.round(amount).toLocaleString("en-AU")}`;
}

// Whether a listing sits inside the budget. A listing with no stated
// price passes only when the search asked to include those.
export function withinBudget(
  priceFrom: number | null,
  maxPrice: number,
  includeUnpriced: boolean
): boolean {
  return priceFrom === null ? includeUnpriced : priceFrom <= maxPrice;
}
