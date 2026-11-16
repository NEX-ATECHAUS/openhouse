"use client";

import type { Listing } from "@/lib/types";
import { formatClock } from "@/lib/time";

// One home in the list: what it is, when it is open, and the two
// choices about it (in the day or not, must-see or not). The same card
// shows a home from Domain, a sample and one added by hand.

const SOURCE_LABEL: Record<Listing["source"], string> = {
  domain: "Domain",
  sample: "Sample",
  manual: "Added by you",
};

export function homeFacts(listing: Listing): string {
  const parts = [
    listing.propertyType ?? "",
    listing.bedrooms === null ? "Bedrooms not stated" : `${listing.bedrooms} bed`,
    listing.bathrooms === null ? "" : `${listing.bathrooms} bath`,
    listing.carSpaces === null ? "" : `${listing.carSpaces} car`,
  ];
  return parts.filter((part) => part !== "").join(", ");
}

export function HomeCard({
  listing,
  included,
  mustSee,
  kmFromMustSee,
  outOfRange,
  onInclude,
  onMustSee,
  onRemove,
}: {
  listing: Listing;
  included: boolean;
  mustSee: boolean;
  // Distance from the nearest must-see, when there is one.
  kmFromMustSee: number | null;
  outOfRange: boolean;
  onInclude: (next: boolean) => void;
  onMustSee: (next: boolean) => void;
  onRemove?: () => void;
}) {
  const inDay = included && !outOfRange;
  return (
    <li className={inDay ? "home" : "home out"}>
      <div className="home-main">
        <p className="home-address">
          {listing.url === null ? (
            listing.address
          ) : (
            <a href={listing.url} target="_blank" rel="noopener noreferrer">
              {listing.address}
            </a>
          )}
        </p>
        <p className="home-facts">
          {listing.priceText === "" ? "Price not stated" : listing.priceText}
          {". "}
          {homeFacts(listing)}
        </p>
        <div className="pills">
          {listing.inspections.map((w) => (
            <span className="pill" key={`${w.open}-${w.close}`}>
              {formatClock(w.open)} to {formatClock(w.close)}
            </span>
          ))}
          <span className={listing.source === "sample" ? "pill amber" : "pill green"}>
            {SOURCE_LABEL[listing.source]}
          </span>
          {listing.approximate ? <span className="pill amber">Suburb pin only</span> : null}
          {kmFromMustSee !== null && !mustSee ? (
            <span className={outOfRange ? "pill red" : "pill"}>
              {kmFromMustSee.toFixed(1)} km from a must-see
            </span>
          ) : null}
        </div>
      </div>
      <div className="home-controls">
        <label className="check">
          <input
            type="checkbox"
            checked={included}
            disabled={mustSee}
            onChange={(event) => onInclude(event.target.checked)}
          />
          <span>{outOfRange && included ? "In my day (too far away)" : "In my day"}</span>
        </label>
        <div className="actions">
          <button
            type="button"
            className="button ghost small toggle"
            aria-pressed={mustSee}
            onClick={() => onMustSee(!mustSee)}
          >
            {mustSee ? "Must-see" : "Make must-see"}
          </button>
          {onRemove === undefined ? null : (
            <button type="button" className="button ghost small" onClick={onRemove}>
              Remove
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
