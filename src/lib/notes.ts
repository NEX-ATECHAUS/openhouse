// Notes on homes, kept in this browser under their own key. One note per
// home, by listing id, so a note follows a home from search to search.
// Read back defensively: storage is anything the browser holds.

export const NOTES_KEY = "openhouse-notes-v1";
export const NOTE_MAX = 1000;
// The most notes kept; past this the oldest are let go.
const KEEP = 300;

export type Note = { text: string; at: number };
export type Notes = Record<string, Note>;

export function readNotes(raw: string | null): Notes {
  if (raw === null) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
  const out: Notes = {};
  for (const [id, value] of Object.entries(parsed)) {
    const note = value as { text?: unknown; at?: unknown };
    if (id.length <= 80 && typeof note?.text === "string" && note.text.trim() !== "" && typeof note.at === "number") {
      out[id] = { text: note.text.slice(0, NOTE_MAX), at: note.at };
    }
  }
  return out;
}

// The notes with one changed. An empty note removes it.
export function withNote(notes: Notes, id: string, text: string, now: number = Date.now()): Notes {
  const next: Notes = { ...notes };
  if (text.trim() === "") {
    delete next[id];
  } else {
    next[id] = { text: text.slice(0, NOTE_MAX), at: now };
  }
  const ids = Object.keys(next);
  if (ids.length > KEEP) {
    ids
      .sort((a, b) => (next[a]?.at ?? 0) - (next[b]?.at ?? 0))
      .slice(0, ids.length - KEEP)
      .forEach((old) => delete next[old]);
  }
  return next;
}
