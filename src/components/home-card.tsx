"use client";

import { HomeNote } from "@/components/home-note";
import { HouseArt, artVariantFor } from "@/components/house-art";
import { IconBath, IconBed, IconCar, IconClock, IconHeart, IconHouse } from "@/components/icons";
import type { Listing } from "@/lib/types";
import { formatClock } from "@/lib/time";

// One home in the list: a picture, the price, what it is, when it is
// open, and the two choices about it (in the day or not, must-see or
// not). The same card shows a home from Domain, a sample and one added
// by hand.

const SOURCE_LABEL: Record<Listing["source"], string> = {
  domain: "Domain",
  sample: "Sample",
  manual: "Added by you",
};

export function priceLabel(listing: Listing): string {
  return listing.priceText === "" ? "Price not stated" : listing.priceText;
}

// Bedrooms, bathrooms, car spaces and the kind of home, each with its
// icon. Used by the list and the day, so the two always read the same.
export function HomeSpecs({ listing }: { listing: Listing }) {
  return (
    <ul className="specs">
      <li className="spec">
        <IconBed />
        {listing.bedrooms === null ? "Bedrooms not stated" : `${listing.bedrooms} bed`}
      </li>
      {listing.bathrooms === null ? null : (
        <li className="spec">
          <IconBath />
          {listing.bathrooms} bath
        </li>
      )}
      {listing.carSpaces === null ? null : (
        <li className="spec">
          <IconCar />
          {listing.carSpaces} car
        </li>
      )}
      {listing.propertyType === null ? null : (
        <li className="spec">
          <IconHouse />
          {listing.propertyType}
        </li>
      )}
    </ul>
  );
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
  note,
  noteSaved,
  onNote,
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
  note: string;
  noteSaved: boolean;
  onNote: (next: string) => void;
}) {
  const inDay = included && !outOfRange;
  return (
    <li className={inDay ? "home" : "home out"}>
      <div className="home-thumb">
        <HouseArt variant={artVariantFor(listing.id)} id={listing.id} />
      </div>
      <div className="home-title">
        <p className="home-address">
          {listing.url === null ? (
            listing.address
          ) : (
            <a href={listing.url} target="_blank" rel="noopener noreferrer">
              {listing.address}
            </a>
          )}
        </p>
        <p className="home-price">{priceLabel(listing)}</p>
      </div>
      <div className="home-details">
        <HomeSpecs listing={listing} />
        <div className="pills">
          {listing.inspections.map((w) => (
            <span className="pill" key={`${w.open}-${w.close}`}>
              <IconClock />
              {formatClock(w.open)} to {formatClock(w.close)}
            </span>
          ))}
          <span className={listing.source === "sample" ? "pill amber" : "pill green"}>{SOURCE_LABEL[listing.source]}</span>
          {listing.approximate ? <span className="pill amber">Suburb pin only</span> : null}
          {kmFromMustSee !== null && !mustSee ? (
            <span className={outOfRange ? "pill red" : "pill"}>{kmFromMustSee.toFixed(1)} km from a must-see</span>
          ) : null}
        </div>
      </div>
      <div className="home-controls">
        <label className="check">
          <input type="checkbox" checked={included} disabled={mustSee} onChange={(event) => onInclude(event.target.checked)} />
          <span>{outOfRange && included ? "In my day (too far away)" : "In my day"}</span>
        </label>
        <div className="actions">
          <button type="button" className="button ghost small toggle" aria-pressed={mustSee} onClick={() => onMustSee(!mustSee)}>
            <IconHeart />
            {mustSee ? "Must-see" : "Make must-see"}
          </button>
          {onRemove === undefined ? null : (
            <button type="button" className="button ghost small" onClick={onRemove}>
              Remove
            </button>
          )}
        </div>
      </div>
      <div className="home-note">
        <HomeNote text={note} saved={noteSaved} onChange={onNote} />
      </div>
    </li>
  );
}
