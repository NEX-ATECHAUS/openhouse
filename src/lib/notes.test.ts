import { test } from "node:test";
import assert from "node:assert/strict";
import { NOTE_MAX, readNotes, withNote } from "./notes.ts";

test("a note is kept, changed and removed when emptied", () => {
  let notes = withNote({}, "a", "Great light", 1);
  assert.deepEqual(notes, { a: { text: "Great light", at: 1 } });
  notes = withNote(notes, "a", "Great light, noisy road", 2);
  assert.equal(notes.a?.text, "Great light, noisy road");
  notes = withNote(notes, "a", "   ", 3);
  assert.deepEqual(notes, {});
});

test("a note is cut at the limit", () => {
  const notes = withNote({}, "a", "x".repeat(NOTE_MAX + 50), 1);
  assert.equal(notes.a?.text.length, NOTE_MAX);
});

test("past the limit the oldest notes are let go", () => {
  let notes = {};
  for (let i = 0; i < 305; i += 1) notes = withNote(notes, `h${i}`, "note", i);
  assert.equal(Object.keys(notes).length, 300);
  assert.equal("h0" in notes, false);
  assert.equal("h304" in notes, true);
});

test("whatever the browser holds is read safely", () => {
  assert.deepEqual(readNotes(null), {});
  assert.deepEqual(readNotes("not json"), {});
  assert.deepEqual(readNotes("[1,2]"), {});
  assert.deepEqual(readNotes(JSON.stringify({ a: { text: "ok", at: 1 }, b: { text: 5, at: 1 }, c: "x", d: { text: " ", at: 1 } })), {
    a: { text: "ok", at: 1 },
  });
});
