import type { Plan, PlanSettings, PlanStopInput, PlannedStop } from "./types.ts";

// The day planner. Given the open homes picked for one day, each with
// the window it is open, and the drive time between every pair, it finds
// the order that gets to the most of them.
//
// What it prefers, in order:
//   1. every must-see that can be reached,
//   2. the most homes,
//   3. the break fitted in, when one was asked for,
//   4. the least driving,
//   5. the earliest finish.
//
// A visit counts only when the whole of it fits inside the open window:
// you walk in at or after the opening time and are out by the close.
//
// It is a beam search: at each step every partial day is extended by
// each home still reachable, and the best few hundred partial days are
// kept. A Saturday is ten or twenty homes, where this finds the best
// order or one as good; it never returns a day that cannot be driven.

const BEAM = 400;

type State = {
  order: number[];
  visited: bigint;
  at: number;
  leave: number;
  travel: number;
  mustSees: number;
  breakTaken: boolean;
  stops: PlannedStop[];
};

function better(a: State, b: State, settings: PlanSettings): boolean {
  if (a.mustSees !== b.mustSees) return a.mustSees > b.mustSees;
  if (a.order.length !== b.order.length) return a.order.length > b.order.length;
  const aBreak = breakFitted(a, settings);
  const bBreak = breakFitted(b, settings);
  if (aBreak !== bBreak) return aBreak;
  if (a.travel !== b.travel) return a.travel < b.travel;
  return a.leave < b.leave;
}

// A day that ends before the break time never needed one.
function breakFitted(state: State, settings: PlanSettings): boolean {
  if (settings.breakMinutes <= 0) return true;
  return state.breakTaken || state.leave <= settings.breakAfter;
}

export function planDay(
  stops: PlanStopInput[],
  // matrix[i][j]: drive minutes from stop i to stop j, without the buffer.
  matrix: number[][],
  settings: PlanSettings
): Plan {
  const visit = Math.max(1, settings.visitMinutes);
  const tooShort = new Set<number>();
  stops.forEach((stop, i) => {
    if (!stop.windows.some((w) => w.close - w.open >= visit)) tooShort.add(i);
  });
  const usable = stops.map((_, i) => i).filter((i) => !tooShort.has(i));

  // The earliest a visit to stop i can start when arriving at `arrive`.
  const slot = (i: number, arrive: number) => {
    let best: { start: number; open: number; close: number } | null = null;
    for (const w of stops[i]?.windows ?? []) {
      const start = Math.max(arrive, w.open);
      if (start + visit <= w.close && (best === null || start < best.start)) {
        best = { start, open: w.open, close: w.close };
      }
    }
    return best;
  };

  let frontier: State[] = [];
  let best: State | null = null;
  const consider = (state: State) => {
    if (best === null || better(state, best, settings)) best = state;
  };

  for (const i of usable) {
    const first = slot(i, 0);
    if (first === null) continue;
    const stop: PlannedStop = {
      id: stops[i]?.id ?? "",
      travelMinutes: 0,
      arrive: first.start,
      start: first.start,
      leave: first.start + visit,
      open: first.open,
      close: first.close,
      breakBefore: null,
    };
    const state: State = {
      order: [i],
      visited: 1n << BigInt(i),
      at: i,
      leave: stop.leave,
      travel: 0,
      mustSees: stops[i]?.mustSee ? 1 : 0,
      breakTaken: false,
      stops: [stop],
    };
    frontier.push(state);
    consider(state);
  }

  while (frontier.length > 0) {
    // One state per (homes seen, where you are, break taken): the one
    // that got there with the earliest departure, then the least driving.
    const seen = new Map<string, State>();
    for (const state of frontier) {
      for (const j of usable) {
        if ((state.visited & (1n << BigInt(j))) !== 0n) continue;
        const drive = (matrix[state.at]?.[j] ?? 0) + settings.bufferMinutes;
        const options: boolean[] = [false];
        if (
          settings.breakMinutes > 0 &&
          !state.breakTaken &&
          state.leave >= settings.breakAfter
        ) {
          options.push(true);
        }
        for (const takeBreak of options) {
          const setOff = state.leave + (takeBreak ? settings.breakMinutes : 0);
          const arrive = setOff + drive;
          const found = slot(j, arrive);
          if (found === null) continue;
          const stop: PlannedStop = {
            id: stops[j]?.id ?? "",
            travelMinutes: drive,
            arrive,
            start: found.start,
            leave: found.start + visit,
            open: found.open,
            close: found.close,
            breakBefore: takeBreak ? { start: state.leave, end: setOff } : null,
          };
          const next: State = {
            order: [...state.order, j],
            visited: state.visited | (1n << BigInt(j)),
            at: j,
            leave: stop.leave,
            travel: state.travel + drive,
            mustSees: state.mustSees + (stops[j]?.mustSee ? 1 : 0),
            breakTaken: state.breakTaken || takeBreak,
            stops: [...state.stops, stop],
          };
          const key = `${next.visited}|${j}|${next.breakTaken ? 1 : 0}`;
          const rival = seen.get(key);
          if (
            rival === undefined ||
            next.leave < rival.leave ||
            (next.leave === rival.leave && next.travel < rival.travel)
          ) {
            seen.set(key, next);
          }
        }
      }
    }
    frontier = [...seen.values()];
    for (const state of frontier) consider(state);
    if (frontier.length > BEAM) {
      frontier.sort((a, b) => (better(a, b, settings) ? -1 : better(b, a, settings) ? 1 : 0));
      frontier = frontier.slice(0, BEAM);
    }
  }

  const chosen = best as State | null;
  const kept = new Set(chosen?.order ?? []);
  return {
    stops: chosen?.stops ?? [],
    skipped: stops
      .map((stop, i) => ({ stop, i }))
      .filter(({ i }) => !kept.has(i))
      .map(({ stop, i }) => ({
        id: stop.id,
        reason: tooShort.has(i) ? ("too-short" as const) : ("clash" as const),
      })),
    travelMinutes: chosen?.travel ?? 0,
    breakFitted: chosen === null ? true : breakFitted(chosen, settings),
  };
}
