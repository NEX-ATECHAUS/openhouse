"use client";

import { HouseArt } from "@/components/house-art";
import { IconBed, IconCheck, IconPin, IconSearch } from "@/components/icons";
import { STATES } from "@/lib/schemas";

// The top of the screen and step 1: where, how many bedrooms, the budget
// and the day. Bedrooms are chips rather than a menu, because there are
// only five answers and one tap is quicker than two.

export type SearchValues = {
  suburbs: string;
  state: (typeof STATES)[number];
  minBedrooms: number;
  maxPrice: string;
  date: string;
  includeSurrounding: boolean;
  includeUnpriced: boolean;
};

const BEDROOMS = [0, 1, 2, 3, 4];

export function SearchForm({
  values,
  busy,
  onChange,
  onSubmit,
}: {
  values: SearchValues;
  busy: boolean;
  onChange: (next: SearchValues) => void;
  onSubmit: () => void;
}) {
  const set = <K extends keyof SearchValues>(key: K, value: SearchValues[K]) => onChange({ ...values, [key]: value });
  return (
    <form
      className="hero"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="hero-art">
        <HouseArt variant="warm" id="hero" />
      </div>
      <div className="hero-body">
        <div className="hero-heading">
          <p className="hero-greeting">One search, one route, one day.</p>
          <h1>Find your open homes</h1>
        </div>
        <div className="field">
          <label className="searchbar">
            <IconPin />
            <span className="visually-hidden">Suburbs</span>
            <input
              value={values.suburbs}
              onChange={(event) => set("suburbs", event.target.value)}
              placeholder="Search by suburb, for example Croydon, Ringwood"
              autoComplete="off"
              required
            />
          </label>
          <span className="field-hint">Separate suburbs with a comma. Up to eight.</span>
        </div>
        <fieldset className="field">
          <legend className="field-label">Bedrooms, at least</legend>
          <div className="chips">
            {BEDROOMS.map((count) => (
              <label className="chip" key={count}>
                <input
                  className="chip-input"
                  type="radio"
                  name="minBedrooms"
                  checked={values.minBedrooms === count}
                  onChange={() => set("minBedrooms", count)}
                />
                {count === 0 ? null : <IconBed />}
                {count === 0 ? "Any" : `${count}+`}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="fields">
          <label className="field">
            <span className="field-label">Budget, up to ($)</span>
            <input
              className="input"
              inputMode="numeric"
              value={values.maxPrice}
              onChange={(event) => set("maxPrice", event.target.value)}
              placeholder="625000"
              required
            />
          </label>
          <label className="field">
            <span className="field-label">Day</span>
            <input className="input" type="date" value={values.date} onChange={(event) => set("date", event.target.value)} required />
          </label>
          <label className="field">
            <span className="field-label">State</span>
            <select className="input" value={values.state} onChange={(event) => set("state", event.target.value as SearchValues["state"])}>
              {STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="chips">
          <label className="chip">
            <input
              className="chip-input"
              type="checkbox"
              checked={values.includeSurrounding}
              onChange={(event) => set("includeSurrounding", event.target.checked)}
            />
            <IconCheck className="chip-tick" />
            Surrounding suburbs
          </label>
          <label className="chip">
            <input
              className="chip-input"
              type="checkbox"
              checked={values.includeUnpriced}
              onChange={(event) => set("includeUnpriced", event.target.checked)}
            />
            <IconCheck className="chip-tick" />
            Homes with no price stated
          </label>
        </div>
        <div className="actions">
          <button type="submit" className="button" disabled={busy}>
            <IconSearch />
            {busy ? "Looking" : "Find open homes"}
          </button>
        </div>
      </div>
    </form>
  );
}
