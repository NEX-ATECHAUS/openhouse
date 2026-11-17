"use client";

import { useState } from "react";
import { HomeSpecs, priceLabel } from "@/components/home-card";
import { IconClock, IconPlus } from "@/components/icons";
import { PASTE_MAX_CHARS, PASTE_MAX_HOMES, parsePasted, type PasteState, type PastedHome } from "@/lib/paste-parse";
import { formatClock, formatDay } from "@/lib/time";
import type { Listing } from "@/lib/types";

// Homes pasted from a listing site. The owner copies a listing page, or
// a page of inspection times, from Domain, realestate.com.au or Homely
// in their own browser and pastes it here; nothing is fetched from
// those sites. The text is read on this device, shown back as a
// preview to tick, and only each ticked home's street and suburb go to
// the server, to be placed on the map.

type Placed = { data: { lat: number; lng: number; approximate: boolean } | null; error: string | null };

// The map lookup allows one request a second; a little over keeps clear.
const LOOKUP_GAP_MS = 1100;

function toListing(home: PastedHome, place: { lat: number; lng: number; approximate: boolean }): Listing {
  return {
    id: home.id,
    source: "pasted",
    address: home.suburb === "" ? home.street : `${home.street}, ${home.suburb}`,
    suburb: home.suburb,
    lat: place.lat,
    lng: place.lng,
    approximate: place.approximate,
    bedrooms: home.bedrooms,
    bathrooms: home.bathrooms,
    carSpaces: home.carSpaces,
    propertyType: home.propertyType,
    priceText: home.priceText.slice(0, 120),
    priceFrom: home.priceFrom,
    url: null,
    inspections: home.inspections,
  };
}

type Verdict = {
  // Can be added for the day chosen.
  pickable: boolean;
  // Ticked to begin with: pickable, and inside the search.
  suggested: boolean;
  notes: { text: string; tone: "amber" | "red" | "plain" }[];
};

function judge(home: PastedHome, day: string, minBedrooms: number, maxPrice: number | null, existing: Set<string>): Verdict {
  const notes: Verdict["notes"] = [];
  const onDay = home.inspections.some((w) => w.date === day);
  let pickable = true;
  if (existing.has(home.id)) {
    notes.push({ text: "Already in your list", tone: "plain" });
    pickable = false;
  }
  if (home.suburb === "") {
    notes.push({ text: "No suburb found: add it by hand", tone: "red" });
    pickable = false;
  }
  if (home.inspections.length === 0) {
    notes.push({ text: "No inspection time found", tone: "red" });
    pickable = false;
  } else if (!onDay) {
    const days = [...new Set(home.inspections.map((w) => w.date))].map(formatDay).join(", ");
    notes.push({ text: `Open ${days}, not the day chosen`, tone: "amber" });
    pickable = false;
  }
  let inSearch = true;
  if (home.bedrooms !== null && home.bedrooms < minBedrooms) {
    notes.push({ text: `Fewer than ${minBedrooms} bedrooms`, tone: "amber" });
    inSearch = false;
  }
  if (maxPrice !== null && home.priceFrom !== null && home.priceFrom > maxPrice) {
    notes.push({ text: "Over budget", tone: "amber" });
    inSearch = false;
  }
  return { pickable, suggested: pickable && inSearch, notes };
}

export function PasteHomes({
  day,
  today,
  state,
  minBedrooms,
  maxPrice,
  existing,
  onAdd,
  initialText = "",
}: {
  day: string;
  today: string;
  state: PasteState;
  minBedrooms: number;
  maxPrice: number | null;
  // Ids of homes already pasted or added, so they are not added twice.
  existing: Set<string>;
  onAdd: (homes: Listing[]) => void;
  // For the visual harness: open with this text already read.
  initialText?: string;
}) {
  const read = (text: string) => parsePasted(text, { today, defaultDay: day, defaultState: state });
  const [text, setText] = useState(initialText);
  const [found, setFound] = useState(() => (initialText === "" ? null : read(initialText)));
  const [picked, setPicked] = useState<Set<string>>(() =>
    initialText === ""
      ? new Set()
      : new Set(read(initialText).homes.filter((home) => judge(home, day, minBedrooms, maxPrice, existing).suggested).map((home) => home.id))
  );
  const [progress, setProgress] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<{ tone: "plain" | "amber" | "red"; text: string } | null>(null);

  function readText() {
    const result = read(text);
    setFound(result);
    setOutcome(null);
    setPicked(new Set(result.homes.filter((home) => judge(home, day, minBedrooms, maxPrice, existing).suggested).map((home) => home.id)));
  }

  async function addPicked() {
    if (found === null) return;
    const chosen = found.homes.filter((home) => picked.has(home.id));
    const added: Listing[] = [];
    const missed: string[] = [];
    let stopped = false;
    for (const [index, home] of chosen.entries()) {
      setProgress(`Placing ${index + 1} of ${chosen.length} on the map`);
      const started = Date.now();
      try {
        const response = await fetch("/api/geocode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ street: home.street, suburb: home.suburb, state: home.state }),
        });
        if (response.status === 429) {
          stopped = true;
          break;
        }
        const answer = (await response.json()) as Placed;
        if (answer.data === null) missed.push(home.street);
        else added.push(toListing(home, answer.data));
      } catch {
        missed.push(home.street);
      }
      const wait = LOOKUP_GAP_MS - (Date.now() - started);
      if (wait > 0 && index < chosen.length - 1) await new Promise((done) => setTimeout(done, wait));
    }
    setProgress(null);
    if (added.length > 0) onAdd(added);
    const left = chosen.length - added.length - missed.length;
    const parts = [added.length === 1 ? "1 home added." : `${added.length} homes added.`];
    if (missed.length > 0) parts.push(`Not found on the map: ${missed.join("; ")}. Add those by hand.`);
    if (stopped) parts.push(`${left} not added yet: too many lookups at once. Wait a minute, then add them again.`);
    setOutcome({ tone: missed.length > 0 || stopped ? "amber" : "plain", text: parts.join(" ") });
    const done = new Set(added.map((home) => home.id));
    setPicked((current) => new Set([...current].filter((id) => !done.has(id))));
  }

  const busy = progress !== null;
  const verdicts = new Map((found?.homes ?? []).map((home) => [home.id, judge(home, day, minBedrooms, maxPrice, existing)]));
  const count = [...picked].filter((id) => verdicts.get(id)?.pickable).length;

  return (
    <details className="disclosure" open={initialText !== "" ? true : undefined}>
      <summary>
        <IconPlus />
        Paste homes from a listing site
      </summary>
      <p className="small muted">
        On Domain, realestate.com.au or Homely, open a listing or the inspection times, select the page, copy it and paste it here. The text is read on this
        device; nothing is fetched from those sites.
      </p>
      <label className="visually-hidden" htmlFor="paste-text">
        Pasted text
      </label>
      <textarea
        id="paste-text"
        className="input area"
        value={text}
        maxLength={PASTE_MAX_CHARS}
        placeholder={"12 Example Street, Croydon VIC 3136\n$600,000 - $650,000\n2 beds 1 bath 1 car\nSaturday 21 November, 10:00am - 10:30am"}
        onChange={(event) => setText(event.target.value)}
      />
      <div className="actions">
        <button type="button" className="button ghost" disabled={busy || text.trim() === ""} onClick={readText}>
          Find homes in this text
        </button>
        {text === "" ? null : (
          <button
            type="button"
            className="button ghost"
            disabled={busy}
            onClick={() => {
              setText("");
              setFound(null);
              setOutcome(null);
            }}
          >
            Clear
          </button>
        )}
      </div>
      {found === null ? null : found.homes.length === 0 ? (
        <p className="notice amber">No address was found in that text. Copy the whole listing, including the address line, and paste it again.</p>
      ) : (
        <>
          <p className="small muted">
            {found.homes.length === 1 ? "1 home found" : `${found.homes.length} homes found`} for {formatDay(day)}. Check the times against the site before
            you add them; untick any you do not want.
            {found.moreThanLimit > 0 ? ` Only the first ${PASTE_MAX_HOMES} are shown; paste the rest after.` : ""}
          </p>
          <ul className="paste-list">
            {found.homes.map((home) => {
              const verdict = verdicts.get(home.id)!;
              const view = toListing(home, { lat: 0, lng: 0, approximate: false });
              const today_ = home.inspections.filter((w) => w.date === day);
              return (
                <li key={home.id} className="paste-item">
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={verdict.pickable && picked.has(home.id)}
                      disabled={!verdict.pickable || busy}
                      onChange={(event) =>
                        setPicked((current) => {
                          const next = new Set(current);
                          if (event.target.checked) next.add(home.id);
                          else next.delete(home.id);
                          return next;
                        })
                      }
                    />
                    <span className="home-address">{view.address}</span>
                  </label>
                  <p className="home-facts">{priceLabel(view)}</p>
                  <HomeSpecs listing={view} />
                  <div className="pills">
                    {today_.map((w) => (
                      <span className="pill" key={`${w.open}-${w.close}`}>
                        <IconClock />
                        {formatClock(w.open)} to {formatClock(w.close)}
                      </span>
                    ))}
                    {verdict.notes.map((note) => (
                      <span key={note.text} className={note.tone === "plain" ? "pill wrap" : `pill wrap ${note.tone}`}>
                        {note.text}
                      </span>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="actions">
            <button type="button" className="button" disabled={busy || count === 0} onClick={() => void addPicked()}>
              {busy ? progress : count === 1 ? "Add 1 home" : `Add ${count} homes`}
            </button>
          </div>
        </>
      )}
      {outcome === null ? null : (
        <p className={outcome.tone === "plain" ? "notice" : `notice ${outcome.tone}`} role="status">
          {outcome.text}
        </p>
      )}
    </details>
  );
}
