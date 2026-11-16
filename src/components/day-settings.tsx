"use client";

import type { PlanSettings } from "@/lib/types";
import { parseClock, toClockInput } from "@/lib/time";

// How the day should run: time in each home, the allowance for parking,
// the break, and how far from a must-see is still worth the drive.

export const RADIUS_CHOICES = [0, 2, 5, 10] as const;

export function DaySettings({
  settings,
  radiusKm,
  hasMustSee,
  onSettings,
  onRadius,
}: {
  settings: PlanSettings;
  radiusKm: number;
  hasMustSee: boolean;
  onSettings: (next: PlanSettings) => void;
  onRadius: (next: number) => void;
}) {
  const set = (patch: Partial<PlanSettings>) => onSettings({ ...settings, ...patch });
  return (
    <fieldset className="fields">
      <label className="field">
        <span className="field-label">Time in each home</span>
        <select className="input" value={settings.visitMinutes} onChange={(event) => set({ visitMinutes: Number(event.target.value) })}>
          {[10, 15, 20, 25, 30].map((minutes) => (
            <option key={minutes} value={minutes}>
              {minutes} min
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span className="field-label">Parking and walking</span>
        <select className="input" value={settings.bufferMinutes} onChange={(event) => set({ bufferMinutes: Number(event.target.value) })}>
          {[0, 3, 5, 8, 10].map((minutes) => (
            <option key={minutes} value={minutes}>
              {minutes === 0 ? "None" : `${minutes} min a drive`}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span className="field-label">Break</span>
        <select className="input" value={settings.breakMinutes} onChange={(event) => set({ breakMinutes: Number(event.target.value) })}>
          {[0, 15, 30, 45, 60].map((minutes) => (
            <option key={minutes} value={minutes}>
              {minutes === 0 ? "No break" : `${minutes} min`}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span className="field-label">Break not before</span>
        <input
          className="input"
          type="time"
          value={toClockInput(settings.breakAfter)}
          disabled={settings.breakMinutes === 0}
          onChange={(event) => {
            const minutes = parseClock(event.target.value);
            if (minutes !== null) set({ breakAfter: minutes });
          }}
        />
      </label>
      <label className="field wide">
        <span className="field-label">How far from a must-see</span>
        <select className="input" value={radiusKm} disabled={!hasMustSee} onChange={(event) => onRadius(Number(event.target.value))}>
          {RADIUS_CHOICES.map((km) => (
            <option key={km} value={km}>
              {km === 0 ? "Any distance" : `Within ${km} km`}
            </option>
          ))}
        </select>
        <span className="field-hint">
          {hasMustSee
            ? "Homes further than this from every must-see are left out of the day."
            : "Make a home a must-see to keep the day close to it."}
        </span>
      </label>
    </fieldset>
  );
}
