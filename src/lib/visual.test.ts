import { test } from "node:test";
import assert from "node:assert/strict";
import { summariseFaults } from "./visual.ts";

test("the same fault at several widths is one line", () => {
  const base = { scenario: "card", kind: "overlap", what: "a over b", detail: "4px by 4px" };
  const lines = summariseFaults([
    { ...base, width: 390, theme: "light" },
    { ...base, width: 320, theme: "light" },
    { ...base, width: 320, theme: "dark" },
    { ...base, what: "c over d", width: 320, theme: "dark" },
  ]);
  assert.equal(lines.length, 2);
  assert.equal(lines[0], "card: overlap: a over b (4px by 4px) at 320, 390; both themes");
  assert.match(lines[1] ?? "", /at 320; dark$/);
});
