"use client";

import { useState } from "react";
import { IconPlus } from "@/components/icons";
import { STATES } from "@/lib/schemas";
import { parseClock } from "@/lib/time";
import type { Listing } from "@/lib/types";

// Adding a home by hand: the one you are already going to, or one found
// on a site the app cannot read (realestate.com.au, homely.com.au). The
// address is placed on the map by the server; the home joins the day as
// a must-see.

type Answer = { data: { lat: number; lng: number; approximate: boolean } | null; error: string | null };

export function AddHome({
  date,
  state,
  onAdd,
}: {
  date: string;
  state: (typeof STATES)[number];
  onAdd: (listing: Listing) => void;
}) {
  const [street, setStreet] = useState("");
  const [suburb, setSuburb] = useState("");
  const [open, setOpen] = useState("11:00");
  const [close, setClose] = useState("11:30");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  async function submit() {
    const opens = parseClock(open);
    const closes = parseClock(close);
    if (opens === null || closes === null || closes <= opens) {
      setProblem("The closing time has to be after the opening time.");
      return;
    }
    setBusy(true);
    setProblem(null);
    try {
      const response = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ street, suburb, state }),
      });
      const answer = (await response.json()) as Answer;
      if (answer.data === null) {
        setProblem(answer.error ?? "That address could not be found. Try again.");
        return;
      }
      onAdd({
        id: `manual-${Date.now()}`,
        source: "manual",
        address: `${street.trim()}, ${suburb.trim()}`,
        suburb: suburb.trim(),
        lat: answer.data.lat,
        lng: answer.data.lng,
        approximate: answer.data.approximate,
        bedrooms: null,
        bathrooms: null,
        carSpaces: null,
        propertyType: null,
        priceText: "",
        priceFrom: null,
        url: null,
        inspections: [{ date, open: opens, close: closes }],
      });
      setStreet("");
    } catch {
      setProblem("The app could not be reached. Check your connection, then try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="disclosure">
      <summary>
        <IconPlus />
        Add a home yourself
      </summary>
      <p className="small muted">
        For the home you are already going to, or one you found on another site. It is added as a must-see for the day chosen above.
      </p>
      <form
        className="fields"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <label className="field wide">
          <span className="field-label">Street address</span>
          <input className="input" value={street} onChange={(event) => setStreet(event.target.value)} placeholder="12 Example Street" autoComplete="off" required />
        </label>
        <label className="field">
          <span className="field-label">Suburb</span>
          <input className="input" value={suburb} onChange={(event) => setSuburb(event.target.value)} placeholder="Croydon" autoComplete="off" required />
        </label>
        <label className="field">
          <span className="field-label">Opens</span>
          <input className="input" type="time" value={open} onChange={(event) => setOpen(event.target.value)} required />
        </label>
        <label className="field">
          <span className="field-label">Closes</span>
          <input className="input" type="time" value={close} onChange={(event) => setClose(event.target.value)} required />
        </label>
        <div className="field wide">
          <div className="actions">
            <button type="submit" className="button ghost" disabled={busy}>
              {busy ? "Finding the address" : "Add this home"}
            </button>
          </div>
        </div>
      </form>
      {problem === null ? null : (
        <p className="notice red" role="alert">
          {problem}
        </p>
      )}
    </details>
  );
}
