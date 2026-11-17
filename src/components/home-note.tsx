"use client";

import { useEffect, useId, useRef, useState } from "react";
import { IconPencil } from "@/components/icons";
import { NOTE_MAX } from "@/lib/notes";

// A note on one home. One tap opens it, it saves as you type, and Done
// closes it. The same control sits on the home in the list and on its
// stop in the day, so a note typed standing in the kitchen shows in both.

export function HomeNote({
  text,
  saved,
  onChange,
  startOpen = false,
}: {
  text: string;
  // False when the browser refused to keep it.
  saved: boolean;
  onChange: (next: string) => void;
  startOpen?: boolean;
}) {
  const [open, setOpen] = useState(startOpen);
  const opened = useRef(false);
  const box = useRef<HTMLTextAreaElement>(null);
  const id = useId();

  // Opened with a tap: focus the box with the cursor after the last
  // word, so what is typed next adds to the note rather than going in
  // front of it.
  useEffect(() => {
    if (!open || !opened.current) return;
    opened.current = false;
    const field = box.current;
    if (field === null) return;
    field.focus();
    field.setSelectionRange(field.value.length, field.value.length);
  }, [open]);

  const openNote = () => {
    opened.current = true;
    setOpen(true);
  };

  if (open) {
    return (
      <div className="note">
        <label className="visually-hidden" htmlFor={id}>
          Note
        </label>
        <textarea
          id={id}
          className="input note-input"
          value={text}
          maxLength={NOTE_MAX}
          ref={box}
          placeholder="What stood out? Light, noise, parking, storage, the feel of the street."
          onChange={(event) => onChange(event.target.value)}
        />
        <div className="actions">
          <button type="button" className="button small" onClick={() => setOpen(false)}>
            Done
          </button>
          <span className={saved ? "small muted" : "small"} role={saved ? undefined : "alert"}>
            {saved
              ? "Saved as you type, in this browser."
              : "This browser is not keeping notes, so this one lasts only until the page is closed."}
          </span>
        </div>
      </div>
    );
  }

  if (text.trim() === "") {
    return (
      <div className="actions">
        <button type="button" className="button ghost small" onClick={openNote}>
          <IconPencil />
          Add a note
        </button>
      </div>
    );
  }

  return (
    <div className="note">
      <p className="note-text">{text}</p>
      <div className="actions">
        <button type="button" className="button ghost small" onClick={openNote}>
          <IconPencil />
          Edit note
        </button>
      </div>
    </div>
  );
}
