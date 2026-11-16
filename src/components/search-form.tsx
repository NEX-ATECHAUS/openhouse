"use client";

import { STATES } from "@/lib/schemas";

// What to look for: where, how many bedrooms, the budget and the day.

export type SearchValues = {
  suburbs: string;
  state: (typeof STATES)[number];
  minBedrooms: number;
  maxPrice: string;
  date: string;
  includeSurrounding: boolean;
  includeUnpriced: boolean;
};

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
  const set = <K extends keyof SearchValues>(key: K, value: SearchValues[K]) =>
    onChange({ ...values, [key]: value });
  return (
    <form
      className="card"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div>
        <p className="tagline">Step 1</p>
        <h2>What are you looking for?</h2>
      </div>
      <div className="fields">
        <label className="field wide">
          <span className="field-label">Suburbs</span>
          <input
            className="input"
            value={values.suburbs}
            onChange={(event) => set("suburbs", event.target.value)}
            placeholder="Croydon, Ringwood"
            autoComplete="off"
            required
          />
          <span className="field-hint">Separate suburbs with a comma. Up to eight.</span>
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
        <label className="field">
          <span className="field-label">Bedrooms, at least</span>
          <select className="input" value={values.minBedrooms} onChange={(event) => set("minBedrooms", Number(event.target.value))}>
            {[0, 1, 2, 3, 4, 5].map((count) => (
              <option key={count} value={count}>
                {count === 0 ? "Any" : count}
              </option>
            ))}
          </select>
        </label>
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
      </div>
      <div className="checks">
        <label className="check">
          <input type="checkbox" checked={values.includeSurrounding} onChange={(event) => set("includeSurrounding", event.target.checked)} />
          <span>Include surrounding suburbs</span>
        </label>
        <label className="check">
          <input type="checkbox" checked={values.includeUnpriced} onChange={(event) => set("includeUnpriced", event.target.checked)} />
          <span>Include homes with no price stated</span>
        </label>
      </div>
      <div className="actions">
        <button type="submit" className="button" disabled={busy}>
          {busy ? "Looking" : "Find open homes"}
        </button>
      </div>
    </form>
  );
}
