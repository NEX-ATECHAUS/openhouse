import { test } from "node:test";
import assert from "node:assert/strict";
import { THEME_KEY, THEME_SCRIPT } from "./theme.ts";

test("the pre-paint script reads the same key the switch writes", () => {
  assert.equal(THEME_KEY, "openhouse-theme");
  assert.ok(THEME_SCRIPT.includes(`getItem("${THEME_KEY}")`));
  assert.ok(!THEME_SCRIPT.includes("undefined"));
});
