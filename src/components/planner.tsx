"use client";

import { useEffect, useMemo, useState } from "react";
import { AddHome } from "@/components/add-home";
import { DayPlan } from "@/components/day-plan";
import { DaySettings } from "@/components/day-settings";
import { HomeCard } from "@/components/home-card";
import { PasteHomes } from "@/components/paste-homes";
import { PAGE_SIZE, Pager } from "@/components/pager";
import { SearchForm, type SearchValues } from "@/components/search-form";
import { NOTES_KEY, readNotes, withNote, type Notes } from "@/lib/notes";
import { formatDay, isDay } from "@/lib/time";
import { straightLineKm } from "@/lib/travel-estimate";
import type { Listing, Plan, PlanSettings, TravelSource } from "@/lib/types";

// The whole app on one screen, in the order the job is done: say what
// you are looking for, pick the homes, plan the day. What you typed and
// the homes you added are kept in this browser, so the next visit
// starts where this one ended. Nothing is stored on a server.

const STORE_KEY = "openhouse-v1";

export const DEFAULT_SETTINGS: PlanSettings = {
  visitMinutes: 15,
  bufferMinutes: 5,
  breakMinutes: 30,
  breakAfter: 12 * 60,
};

type Stored = {
  search: SearchValues;
  settings: PlanSettings;
  radiusKm: number;
  manual: Listing[];
};

type SearchAnswer = { data: { listings: Listing[]; source: "sample" | "domain" } | null; error: string | null };
type PlanAnswer = { data: { plan: Plan; travelSource: TravelSource } | null; error: string | null };

function readStore(): Partial<Stored> {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw === null ? {} : (JSON.parse(raw) as Partial<Stored>);
  } catch {
    return {};
  }
}

export function Planner({ defaultDate, today, demo }: { defaultDate: string; today: string; demo: boolean }) {
  const [search, setSearch] = useState<SearchValues>({
    suburbs: "Croydon, Ringwood",
    state: "VIC",
    minBedrooms: 2,
    maxPrice: "625000",
    date: defaultDate,
    includeSurrounding: true,
    includeUnpriced: true,
  });
  const [settings, setSettings] = useState<PlanSettings>(DEFAULT_SETTINGS);
  const [radiusKm, setRadiusKm] = useState(0);
  const [manual, setManual] = useState<Listing[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [found, setFound] = useState<Listing[] | null>(null);
  const [searchedDate, setSearchedDate] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchProblem, setSearchProblem] = useState<string | null>(null);

  const [left, setLeft] = useState<Set<string>>(new Set());
  const [mustSee, setMustSee] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);

  const [plan, setPlan] = useState<{ plan: Plan; travelSource: TravelSource; day: string } | null>(null);
  const [planning, setPlanning] = useState(false);
  const [planProblem, setPlanProblem] = useState<string | null>(null);

  // Notes on homes, kept apart from the search so a note outlives it.
  const [notes, setNotes] = useState<Notes>({});
  const [notesSaved, setNotesSaved] = useState(true);

  // Bring back the last visit, once, after the first paint.
  useEffect(() => {
    const stored = readStore();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the browser's store can only be read after mount
    setLoaded(true);
    if (stored.search !== undefined) {
      // A day already gone is replaced by the coming Saturday.
      const date = isDay(stored.search.date ?? "") && stored.search.date >= today ? stored.search.date : defaultDate;
      setSearch((current) => ({ ...current, ...stored.search, date }));
    }
    if (stored.settings !== undefined) setSettings((current) => ({ ...current, ...stored.settings }));
    if (typeof stored.radiusKm === "number") setRadiusKm(stored.radiusKm);
    if (Array.isArray(stored.manual)) {
      setManual(stored.manual);
      // A home added by hand is a must-see; a pasted one is a candidate.
      setMustSee(new Set(stored.manual.filter((home) => home.source === "manual").map((home) => home.id)));
    }
    try {
      setNotes(readNotes(window.localStorage.getItem(NOTES_KEY)));
    } catch {
      setNotesSaved(false);
    }
  }, [defaultDate, today]);

  // Saved on every keystroke, so a note is never lost to a closed tab.
  // A note does not change the plan, so the plan on screen stays.
  function saveNote(id: string, text: string) {
    const next = withNote(notes, id, text);
    setNotes(next);
    try {
      window.localStorage.setItem(NOTES_KEY, JSON.stringify(next));
      setNotesSaved(true);
    } catch {
      setNotesSaved(false);
    }
  }

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify({ search, settings, radiusKm, manual } satisfies Stored));
    } catch {
      // A browser that refuses storage still plans the day.
    }
  }, [loaded, search, settings, radiusKm, manual]);

  const day = searchedDate ?? search.date;

  // Every home for the day: the ones added by hand first, then the
  // search results, each list earliest opening first.
  const homes = useMemo(() => {
    const mine = manual
      .filter((home) => home.inspections.some((w) => w.date === day))
      .map((home) => ({ ...home, inspections: home.inspections.filter((w) => w.date === day) }));
    return [...mine, ...(found ?? [])];
  }, [manual, found, day]);

  const mustSeeHomes = useMemo(() => homes.filter((home) => mustSee.has(home.id)), [homes, mustSee]);

  const distance = useMemo(() => {
    const out = new Map<string, number>();
    if (mustSeeHomes.length === 0) return out;
    for (const home of homes) {
      out.set(home.id, Math.min(...mustSeeHomes.map((anchor) => straightLineKm(anchor, home))));
    }
    return out;
  }, [homes, mustSeeHomes]);

  const outOfRange = (home: Listing) =>
    radiusKm > 0 && mustSeeHomes.length > 0 && !mustSee.has(home.id) && (distance.get(home.id) ?? 0) > radiusKm;
  const inDay = homes.filter((home) => !left.has(home.id) && !outOfRange(home));

  // Any change to what is in the day makes the plan on screen untrue.
  const changed = () => {
    setPlan(null);
    setPlanProblem(null);
  };

  async function runSearch() {
    const maxPrice = Number(search.maxPrice.replace(/[$,\s]/g, ""));
    if (!Number.isFinite(maxPrice) || maxPrice <= 0) {
      setSearchProblem("Enter the budget as a number, for example 625000.");
      return;
    }
    setSearching(true);
    setSearchProblem(null);
    changed();
    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          suburbs: search.suburbs.split(",").map((s) => s.trim()).filter((s) => s !== ""),
          state: search.state,
          minBedrooms: search.minBedrooms,
          maxPrice: Math.round(maxPrice),
          date: search.date,
          includeSurrounding: search.includeSurrounding,
          includeUnpriced: search.includeUnpriced,
        }),
      });
      const answer = (await response.json()) as SearchAnswer;
      if (answer.data === null) {
        setSearchProblem(answer.error ?? "The search failed. Try again.");
        return;
      }
      setFound(answer.data.listings);
      setSearchedDate(search.date);
      setLeft(new Set());
      setPage(0);
    } catch {
      setSearchProblem("The app could not be reached. Check your connection, then try again.");
    } finally {
      setSearching(false);
    }
  }

  async function runPlan() {
    setPlanning(true);
    setPlanProblem(null);
    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stops: inDay.map((home) => ({
            id: home.id,
            lat: home.lat,
            lng: home.lng,
            mustSee: mustSee.has(home.id),
            windows: home.inspections.map((w) => ({ open: w.open, close: w.close })),
          })),
          settings,
        }),
      });
      const answer = (await response.json()) as PlanAnswer;
      if (answer.data === null) {
        setPlan(null);
        setPlanProblem(answer.error ?? "The day could not be planned. Try again.");
        return;
      }
      setPlan({ ...answer.data, day });
    } catch {
      setPlanProblem("The app could not be reached. Check your connection, then try again.");
    } finally {
      setPlanning(false);
    }
  }

  const toggle = (set: Set<string>, id: string, on: boolean) => {
    const next = new Set(set);
    if (on) next.add(id);
    else next.delete(id);
    return next;
  };

  const mineIds = useMemo(() => new Set(manual.map((home) => home.id)), [manual]);
  const budget = Number(search.maxPrice.replace(/[$,\s]/g, ""));
  const pastedBudget = Number.isFinite(budget) && budget > 0 ? budget : null;

  const shown = homes.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const byId = useMemo(() => new Map(homes.map((home) => [home.id, home])), [homes]);

  return (
    <>
      {demo ? (
        <p className="notice amber">
          Sample data. These homes are made up so the planner can be tried. Connect Domain to see real open homes; the steps are in docs/go-live-checklist.md.
        </p>
      ) : null}
      <SearchForm values={search} busy={searching} onChange={setSearch} onSubmit={() => void runSearch()} />
      {searchProblem === null ? null : (
        <p className="notice red" role="alert">
          {searchProblem}
        </p>
      )}
      <div className="columns">
        <div className="column">
          <section className="card">
            <div className="card-head">
              <div>
                <p className="tagline">Step 2</p>
                <h2>Pick the homes</h2>
              </div>
              {homes.length === 0 ? null : (
                <span className="pill">
                  {inDay.length} of {homes.length} in the day
                </span>
              )}
            </div>
            {found === null && homes.length === 0 ? (
              <p className="empty">Search above to see the homes open on {formatDay(search.date)}.</p>
            ) : homes.length === 0 ? (
              <p className="empty">
                No open homes match on {formatDay(day)}. Try another day, a higher budget or the surrounding suburbs.
              </p>
            ) : (
              <>
                <p className="small muted">
                  Open on {formatDay(day)}, earliest first. Untick a home to leave it out. A must-see is kept in the day before anything else.
                </p>
                <ul className="homes">
                  {shown.map((home) => (
                    <HomeCard
                      key={home.id}
                      listing={home}
                      included={!left.has(home.id)}
                      mustSee={mustSee.has(home.id)}
                      kmFromMustSee={distance.get(home.id) ?? null}
                      outOfRange={outOfRange(home)}
                      onInclude={(on) => {
                        setLeft(toggle(left, home.id, !on));
                        changed();
                      }}
                      onMustSee={(on) => {
                        setMustSee(toggle(mustSee, home.id, on));
                        if (on) setLeft(toggle(left, home.id, false));
                        changed();
                      }}
                      onRemove={
                        home.source === "manual" || home.source === "pasted"
                          ? () => {
                              setManual(manual.filter((mine) => mine.id !== home.id));
                              setMustSee(toggle(mustSee, home.id, false));
                              changed();
                            }
                          : undefined
                      }
                      note={notes[home.id]?.text ?? ""}
                      noteSaved={notesSaved}
                      onNote={(text) => saveNote(home.id, text)}
                    />
                  ))}
                </ul>
                <Pager page={page} total={homes.length} onPage={setPage} />
              </>
            )}
            <AddHome
              date={day}
              state={search.state}
              onAdd={(home) => {
                setManual([...manual, home]);
                setMustSee(toggle(mustSee, home.id, true));
                setPage(0);
                changed();
              }}
            />
            <PasteHomes
              day={day}
              today={today}
              state={search.state}
              minBedrooms={search.minBedrooms}
              maxPrice={pastedBudget}
              existing={mineIds}
              onAdd={(pasted) => {
                const fresh = new Map(pasted.map((home) => [home.id, home]));
                setManual([...manual.filter((mine) => !fresh.has(mine.id)), ...pasted]);
                setLeft(new Set([...left].filter((id) => !fresh.has(id))));
                setPage(0);
                changed();
              }}
            />
          </section>
        </div>
        <div className="column">
          <section className="card">
            <div>
              <p className="tagline">Step 3</p>
              <h2>Plan the day</h2>
            </div>
            <DaySettings
              settings={settings}
              radiusKm={radiusKm}
              hasMustSee={mustSeeHomes.length > 0}
              onSettings={(next) => {
                setSettings(next);
                changed();
              }}
              onRadius={(next) => {
                setRadiusKm(next);
                changed();
              }}
            />
            <div className="actions">
              <button type="button" className="button accent" disabled={planning || inDay.length === 0} onClick={() => void runPlan()}>
                {planning ? "Planning" : plan === null ? "Plan my day" : "Plan again"}
              </button>
              {inDay.length === 0 ? <span className="small muted">Pick at least one home first.</span> : null}
            </div>
            {planProblem === null ? null : (
              <p className="notice red" role="alert">
                {planProblem}
              </p>
            )}
            {plan === null ? null : (
              <DayPlan
                day={plan.day}
                plan={plan.plan}
                listings={byId}
                travelSource={plan.travelSource}
                breakAsked={settings.breakMinutes > 0}
                notes={notes}
                notesSaved={notesSaved}
                onNote={saveNote}
              />
            )}
          </section>
        </div>
      </div>
    </>
  );
}
