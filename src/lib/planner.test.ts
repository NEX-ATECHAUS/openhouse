import { test } from "node:test";
import assert from "node:assert/strict";
import { planDay } from "./planner.ts";
import type { PlanSettings, PlanStopInput } from "./types.ts";

const settings: PlanSettings = {
  visitMinutes: 15,
  bufferMinutes: 5,
  breakMinutes: 0,
  breakAfter: 12 * 60,
};

const stop = (id: string, open: number, close: number, mustSee = false): PlanStopInput => ({
  id,
  lat: 0,
  lng: 0,
  mustSee,
  windows: [{ open, close }],
});

// Every pair the same drive apart.
const flat = (n: number, minutes: number) =>
  Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 0 : minutes)));

const h = (hour: number, minute = 0) => hour * 60 + minute;

test("visits homes in time order and carries the drive between them", () => {
  const plan = planDay(
    [stop("b", h(11), h(11, 30)), stop("a", h(10), h(10, 30)), stop("c", h(12), h(12, 30))],
    flat(3, 10),
    settings
  );
  assert.deepEqual(plan.stops.map((s) => s.id), ["a", "b", "c"]);
  assert.equal(plan.skipped.length, 0);
  // 10 minute drive plus the 5 minute buffer, twice.
  assert.equal(plan.travelMinutes, 30);
  const b = plan.stops[1];
  assert.equal(b?.arrive, h(10, 30));
  assert.equal(b?.start, h(11));
  assert.equal(b?.leave, h(11, 15));
});

test("a visit has to finish inside the open window", () => {
  // Leaves a at 10:15, 25 minutes away: arrives 10:40, b shuts at 10:45.
  const plan = planDay([stop("a", h(10), h(10, 30)), stop("b", h(10, 15), h(10, 45))], flat(2, 20), settings);
  assert.equal(plan.stops.length, 1);
  assert.deepEqual(plan.skipped, [{ id: plan.stops[0]?.id === "a" ? "b" : "a", reason: "clash" }]);
});

test("a must-see is kept even when dropping it would fit more homes", () => {
  const stops = [
    stop("x", h(10), h(10, 30)),
    stop("y", h(10, 30), h(11)),
    // Far away and overlapping both.
    stop("must", h(10), h(11), true),
  ];
  const matrix = [
    [0, 5, 60],
    [5, 0, 60],
    [60, 60, 0],
  ];
  const plan = planDay(stops, matrix, settings);
  assert.ok(plan.stops.some((s) => s.id === "must"));
});

test("picks the most homes when all cannot be seen", () => {
  const stops = [
    stop("a", h(10), h(10, 30)),
    stop("b", h(10), h(10, 30)),
    stop("c", h(10, 45), h(11, 15)),
    stop("d", h(11, 30), h(12)),
  ];
  const plan = planDay(stops, flat(4, 10), settings);
  assert.equal(plan.stops.length, 3);
  assert.equal(plan.skipped.length, 1);
  assert.equal(plan.skipped[0]?.reason, "clash");
});

test("a window shorter than the visit is reported as too short", () => {
  const plan = planDay([stop("a", h(10), h(10, 10)), stop("b", h(11), h(11, 30))], flat(2, 5), settings);
  assert.deepEqual(plan.stops.map((s) => s.id), ["b"]);
  assert.deepEqual(plan.skipped, [{ id: "a", reason: "too-short" }]);
});

test("takes the break after the break time when the day has room", () => {
  const withBreak = { ...settings, breakMinutes: 30, breakAfter: h(12) };
  const plan = planDay(
    [stop("a", h(11), h(11, 30)), stop("b", h(12), h(12, 30)), stop("c", h(13, 30), h(14))],
    flat(3, 10),
    withBreak
  );
  assert.equal(plan.stops.length, 3);
  assert.equal(plan.breakFitted, true);
  const c = plan.stops[2];
  assert.deepEqual(c?.breakBefore, { start: h(12, 15), end: h(12, 45) });
  assert.equal(c?.arrive, h(13));
});

test("keeps the homes and says so when the break does not fit", () => {
  const withBreak = { ...settings, breakMinutes: 45, breakAfter: h(11) };
  const plan = planDay(
    [stop("a", h(11), h(11, 30)), stop("b", h(11, 30), h(12)), stop("c", h(12), h(12, 30))],
    flat(3, 10),
    withBreak
  );
  assert.equal(plan.stops.length, 3);
  assert.equal(plan.breakFitted, false);
});

test("uses a later window on the same day when the first is missed", () => {
  const twice: PlanStopInput = {
    id: "twice",
    lat: 0,
    lng: 0,
    mustSee: false,
    windows: [
      { open: h(10), close: h(10, 30) },
      { open: h(13), close: h(13, 30) },
    ],
  };
  const plan = planDay([stop("a", h(10), h(10, 20)), twice], flat(2, 20), settings);
  assert.equal(plan.stops.length, 2);
  assert.equal(plan.stops[1]?.start, h(13));
});

test("an empty day is an empty plan", () => {
  const plan = planDay([], [], settings);
  assert.deepEqual(plan.stops, []);
  assert.equal(plan.breakFitted, true);
});

test("a full Saturday of twenty homes plans without missing a reachable one", () => {
  const stops = Array.from({ length: 20 }, (_, i) => stop(`s${i}`, h(9) + i * 30, h(9) + i * 30 + 30));
  const plan = planDay(stops, flat(20, 8), settings);
  assert.equal(plan.stops.length, 20);
});
