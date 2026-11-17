#!/usr/bin/env node
// The visual harness. One command that looks at every component the
// app actually uses, in the states they are actually in, at eight widths and in both themes, and says what is wrong.
//
// It builds, starts the server on a spare port, drives a headless
// browser over /visual, screenshots every block, applies the rules in
// src/lib/visual.ts, prints what it found and shuts the server down.
// One shot: nothing is left running and nothing waits for a keypress.
//
// Usage:
//   npm run visual              build, check, write the report
//   npm run visual -- --skip-build   reuse the build already in .next
//
// The report lands in visual-report/ (git ignored): one PNG per
// component per width per theme, and index.html to look through them.

import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  VISUAL_WIDTHS,
  VISUAL_THEMES,
  MIN_TAP_PX,
  MIN_GAP_PX,
  SLACK_PX,
  TOUCH_MAX_WIDTH,
  summariseFaults,
} from "../../src/lib/visual.ts";

const ROOT = resolve(import.meta.dirname, "..", "..");
const OUT = join(ROOT, "visual-report");
const PORT = Number(process.env.VISUAL_PORT ?? 4310);
const BASE = `http://127.0.0.1:${PORT}`;
const skipBuild = process.argv.includes("--skip-build");

// The harness runs against sample data with the harness route switched
// on, so nothing outbound is real.
const env = { ...process.env, VISUAL_HARNESS: "true", NEXT_PUBLIC_DEMO_MODE: "true" };
delete env.NODE_ENV;

function run(command, args, options = {}) {
  return new Promise((done, fail) => {
    const child = spawn(command, args, { cwd: ROOT, env, ...options });
    child.on("error", fail);
    child.on("exit", (code) =>
      code === 0 ? done() : fail(new Error(`${command} exited ${code}`))
    );
  });
}

// Playwright is installed for the machine, not for this project, so it
// is not in node_modules. Look where it lives before giving up.
function loadPlaywright() {
  const require = createRequire(import.meta.url);
  const candidates = [
    "playwright",
    process.env.VISUAL_PLAYWRIGHT,
    "/opt/node22/lib/node_modules/playwright/index.js",
    "/usr/lib/node_modules/playwright/index.js",
  ].filter(Boolean);
  for (const candidate of candidates) {
    try {
      return require(candidate);
    } catch {
      continue;
    }
  }
  throw new Error(
    "Playwright not found. Install it, or set VISUAL_PLAYWRIGHT to its index.js."
  );
}

async function waitForServer(deadlineMs = 90_000) {
  const until = Date.now() + deadlineMs;
  while (Date.now() < until) {
    try {
      const answer = await fetch(`${BASE}/visual`);
      if (answer.status === 200) {
        return;
      }
      if (answer.status === 404) {
        throw new Error(
          "The harness route answered 404: VISUAL_HARNESS did not reach the server."
        );
      }
    } catch (problem) {
      if (String(problem.message).includes("404")) {
        throw problem;
      }
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`The server did not answer on ${BASE} in time.`);
}

// Everything below runs inside the page. It is one function so it can
// be handed to the browser whole; it returns plain data, never a
// handle, because nothing here crosses back except JSON.
function inspect({ slack, minTap, minGap, checkTap }) {
  const describe = (el) => {
    const raw = typeof el.className === "string" ? el.className.trim() : "";
    const cls = raw === "" ? "" : "." + raw.split(/\s+/).slice(0, 2).join(".");
    const text = (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 30);
    return `${el.tagName.toLowerCase()}${cls}${text === "" ? "" : ` "${text}"`}`;
  };

  // checkVisibility is the browser's own answer, and the only one that
  // gets a closed disclosure right: the content of a shut <details> is
  // still laid out and still has a rectangle, sitting exactly on top of
  // whatever comes after it. Measured by hand that reads as an overlap
  // on every card with a Details toggle, which is nonsense.
  const visible = (el) => {
    const shown = el.checkVisibility({
      opacityProperty: true,
      visibilityProperty: true,
      contentVisibilityAuto: true,
    });
    if (!shown) return false;
    // A thing one pixel wide is hidden, whatever the browser says: the
    // clipped file input behind a Photo button is the usual case.
    const box = el.getBoundingClientRect();
    return box.width > 1 && box.height > 1;
  };

  // Anything deliberately lifted out of the flow, and anything inside
  // something that scrolls or clips, is left alone: an overlay sitting
  // on top of a card is the design, not a fault.
  const lifted = (el, root) => {
    for (let at = el; at !== null && at !== root; at = at.parentElement) {
      const style = getComputedStyle(at);
      if (style.position !== "static" && style.position !== "relative") return true;
      if (style.overflowX !== "visible" || style.overflowY !== "visible") return true;
    }
    return false;
  };

  // Inside something that scrolls or clips sideways. Such a thing can
  // be as wide as it likes without widening the page, so it is never
  // the reason the page is too wide. Only the ancestors are asked: the
  // element's own overflow says nothing about its own box.
  const inScroller = (el, root) => {
    for (let at = el.parentElement; at !== null && at !== root; at = at.parentElement) {
      if (getComputedStyle(at).overflowX !== "visible") return true;
    }
    return false;
  };

  const faults = [];

  // Text drawn straight on the canvas has to read on the canvas. Card
  // text staged bare on the page looks fine in the code and unreadable
  // in the picture, so it is measured: the ancestors are walked up to
  // the stage, and only a leaf that reaches it with no solid, tinted or
  // pictured background on the way is judged, against the canvas colour.
  const parseColor = (text) => {
    const m = /rgba?\(([^)]+)\)/.exec(text ?? "");
    if (m === null) return null;
    const p = m[1].split(",").map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const luminance = ({ r, g, b }) => {
    const f = (v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const contrast = (a, b) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
  const canvas = parseColor(getComputedStyle(document.body).backgroundColor);
  // The stage itself is asked too: a block staged on a card reads on the
  // card, and stopping one short judged card text against the page.
  const onCanvas = (el, stage) => {
    const end = stage.parentElement;
    for (let at = el; at !== null && at !== end; at = at.parentElement) {
      const style = getComputedStyle(at);
      if (style.backgroundImage !== "none") return false;
      const fill = parseColor(style.backgroundColor);
      if (fill !== null && fill.a > 0) return false;
    }
    return true;
  };

  // Off the side of the screen. Named by the element that reaches
  // furthest, because that is the one to fix. A column inside a board
  // that scrolls sideways reaches further still and is not the cause,
  // so anything inside a scroller is passed over.
  const main = document.querySelector("main");
  const pageWidth = document.documentElement.scrollWidth;
  if (pageWidth > window.innerWidth + slack) {
    let worst = null;
    let edge = 0;
    for (const el of document.querySelectorAll("main *")) {
      if (!visible(el) || inScroller(el, main)) continue;
      const right = el.getBoundingClientRect().right;
      if (right > edge) {
        edge = right;
        worst = el;
      }
    }
    faults.push({
      scenario: worst?.closest("[data-visual]")?.dataset.visual ?? "page",
      kind: "page-overflow",
      what: worst === null ? "the page" : describe(worst),
      detail: `${pageWidth}px wide in a ${window.innerWidth}px screen`,
    });
  }

  for (const block of document.querySelectorAll("[data-visual]")) {
    const scenario = block.dataset.visual;
    const bounds = block.getBoundingClientRect();
    const inside = [...block.querySelectorAll("*")].filter(visible);

    // Sticking out the side of its own card.
    for (const el of inside) {
      if (lifted(el, block)) continue;
      const box = el.getBoundingClientRect();
      const over = Math.round(
        Math.max(bounds.left - box.left, box.right - bounds.right)
      );
      if (over > slack) {
        faults.push({
          scenario,
          kind: "spills-out",
          what: describe(el),
          detail: `${over}px past the edge`,
        });
      }
    }

    // Two pieces of text sitting on top of each other. Only leaves
    // with their own words, so a card is never reported for
    // containing its own contents.
    const leaves = inside.filter(
      (el) =>
        el.children.length === 0 &&
        (el.textContent ?? "").trim() !== "" &&
        !lifted(el, block)
    );
    for (let i = 0; i < leaves.length; i += 1) {
      for (let j = i + 1; j < leaves.length; j += 1) {
        const a = leaves[i].getBoundingClientRect();
        const b = leaves[j].getBoundingClientRect();
        const across = Math.round(
          Math.min(a.right, b.right) - Math.max(a.left, b.left)
        );
        const down = Math.round(
          Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
        );
        if (across > slack && down > slack) {
          faults.push({
            scenario,
            kind: "overlap",
            what: `${describe(leaves[i])} over ${describe(leaves[j])}`,
            detail: `${across}px by ${down}px`,
          });
        }
      }
    }

    // Two blocks on a page standing too close, or on top of each
    // other. Only a stack is judged, and only its own children: the
    // rhythm between page blocks is the page's, and a component is
    // never blamed for where the page put it.
    // Colour is judged on every element with words of its own, lifted or
    // not: a positioned tick or a span with a child still has to read.
    // That is a wider set than the geometry checks use on purpose.
    if (canvas !== null) {
      const worded = inside.filter((el) =>
        [...el.childNodes].some(
          (node) => node.nodeType === 3 && (node.textContent ?? "").trim() !== ""
        )
      );
      for (const leaf of worded) {
        const stage = leaf.closest(".visual-stage") ?? block;
        if (!onCanvas(leaf, stage)) continue;
        const ink = parseColor(getComputedStyle(leaf).color);
        if (ink === null || ink.a < 0.5) continue;
        const ratio = contrast(ink, canvas);
        if (ratio < 3) {
          faults.push({
            scenario,
            kind: "on-canvas",
            what: describe(leaf),
            detail: `${ratio.toFixed(2)}:1 on the canvas; stage it on the surface the app uses, or give it an on-canvas token`,
          });
        }
      }
    }
    // Text cut short by an ellipsis. Truncation is a choice made on
    // purpose, with a title carrying the whole value, so a cut value
    // with no title in reach is a fault. A heading is a fault however it
    // is titled: a title is not a way to read a heading, so it wraps.
    for (const el of inside) {
      const style = getComputedStyle(el);
      if (style.textOverflow !== "ellipsis" || style.overflowX === "visible") continue;
      if (el.scrollWidth <= el.clientWidth + slack) continue;
      const heading = /^H[1-6]$/.test(el.tagName);
      const titled = el.closest("[title]");
      if (!heading && titled !== null && block.contains(titled)) continue;
      faults.push({
        scenario,
        kind: "clipped",
        what: describe(el),
        detail: heading
          ? "a heading cut by an ellipsis; let it wrap"
          : "cut by an ellipsis with no title carrying the whole value",
      });
    }

    for (const stack of block.querySelectorAll("[data-visual-stack]")) {
      // A bar that sticks to the bottom of the screen is measured where
      // it sticks, not where it sits in the page, so it is left out.
      const rows = [...stack.children].filter(
        (el) => visible(el) && getComputedStyle(el).position === "static"
      );
      for (let i = 1; i < rows.length; i += 1) {
        const above = rows[i - 1].getBoundingClientRect();
        const below = rows[i].getBoundingClientRect();
        const gap = Math.round(below.top - above.bottom);
        if (gap < minGap) {
          faults.push({
            scenario,
            kind: "touching",
            what: `${describe(rows[i - 1])} then ${describe(rows[i])}`,
            detail: `${gap}px apart, floor is ${minGap}`,
          });
        }
      }
    }

    // Too small to hit with a thumb. Controls only: a linked address
    // inside a row of details is read, not aimed at, and padding every
    // one of those to 44px would pull the details grid apart. A link
    // drawn as a button is a button and is measured like one.
    if (checkTap) {
      const controls = block.querySelectorAll(
        'button, [role="button"], select, textarea, summary, a.button, input:not([type="hidden"])'
      );
      for (const el of controls) {
        if (!visible(el)) continue;
        // A checkbox is as big as the label wrapped around it, because
        // that whole label is what a thumb can land on.
        const target = el.closest("label") ?? el;
        const box = target.getBoundingClientRect();
        const smallest = Math.round(Math.min(box.width, box.height));
        if (smallest < minTap) {
          faults.push({
            scenario,
            kind: "tap-target",
            what: describe(el),
            detail: `${Math.round(box.width)}x${Math.round(box.height)}px, floor is ${minTap}`,
          });
        }
      }
    }
  }

  return faults;
}

async function main() {
  if (!skipBuild) {
    console.log("Building with the harness route switched on.");
    await run("npm", ["run", "build"], { stdio: "inherit" });
  } else if (!existsSync(join(ROOT, ".next"))) {
    throw new Error("--skip-build was asked for, but there is no build in .next.");
  }

  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(join(OUT, "shots"), { recursive: true });

  const server = spawn("node_modules/.bin/next", ["start", "-p", String(PORT)], {
    cwd: ROOT,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let serverLog = "";
  server.stdout.on("data", (chunk) => (serverLog += chunk));
  server.stderr.on("data", (chunk) => (serverLog += chunk));

  const faults = [];
  const shots = new Map();
  try {
    await waitForServer().catch((problem) => {
      throw new Error(`${problem.message}\n${serverLog.slice(-2000)}`);
    });

    const { chromium } = loadPlaywright();
    // VISUAL_CHROMIUM points at a browser binary, for a machine whose
    // installed browsers belong to a different Playwright than the pinned
    // one. Unset, Playwright uses its own, as CI does.
    const browser = await chromium.launch(
      process.env.VISUAL_CHROMIUM ? { executablePath: process.env.VISUAL_CHROMIUM } : {}
    );
    try {
      for (const theme of VISUAL_THEMES) {
        for (const width of VISUAL_WIDTHS) {
          const page = await browser.newPage({
            viewport: { width, height: 900 },
            deviceScaleFactor: 1,
            colorScheme: theme,
            // A phone and a tablet are touch, so the page is asked the
            // same question a phone asks it: pointer is coarse, and
            // anything sized for a thumb sizes itself up.
            hasTouch: width <= TOUCH_MAX_WIDTH,
          });
          // Offline on purpose. Nothing outside the harness gets to
          // decide what the page looks like, or to make a run hang
          // because somebody else's server is slow. The fonts are
          // served from the build, not from Google.
          await page.route("**/*", (route) => {
            const url = route.request().url();
            const local =
              url.startsWith(BASE) ||
              url.startsWith("data:") ||
              url.startsWith("blob:");
            return local ? route.continue() : route.abort();
          });
          await page.goto(`${BASE}/visual`, { waitUntil: "load" });
          await page.waitForSelector("[data-visual]");
          await page.evaluate(() => document.fonts.ready);

          const found = await page.evaluate(inspect, {
            slack: SLACK_PX,
            minTap: MIN_TAP_PX,
            minGap: MIN_GAP_PX,
            checkTap: width <= TOUCH_MAX_WIDTH,
          });
          for (const fault of found) {
            faults.push({ ...fault, width, theme });
          }

          for (const block of await page.locator("[data-visual]").all()) {
            const scenario = await block.getAttribute("data-visual");
            const file = join("shots", scenario, `${theme}-${width}.png`);
            mkdirSync(join(OUT, "shots", scenario), { recursive: true });
            await block.screenshot({ path: join(OUT, file) });
            if (!shots.has(scenario)) shots.set(scenario, []);
            shots.get(scenario).push({ theme, width, file });
          }
          await page.close();
        }
      }
    } finally {
      await browser.close();
    }
  } finally {
    server.kill("SIGTERM");
  }

  writeFileSync(join(OUT, "index.html"), contactSheet(shots, faults));

  const lines = summariseFaults(faults);
  const scenarios = shots.size;
  const pictures = [...shots.values()].reduce((n, list) => n + list.length, 0);
  console.log(
    `\n${scenarios} components, ${VISUAL_WIDTHS.length} widths, ${VISUAL_THEMES.length} themes: ${pictures} pictures in visual-report/index.html`
  );
  if (lines.length === 0) {
    console.log("Nothing out of place.");
    return;
  }
  console.log(`\n${lines.length} to fix:\n`);
  for (const line of lines) {
    console.log(`  ${line}`);
  }
  process.exitCode = 1;
}

function contactSheet(shots, faults) {
  const escape = (text) =>
    String(text).replace(/[&<>"]/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]
    );
  const lines = summariseFaults(faults);
  const byScenario = [...shots.entries()]
    .map(([scenario, list]) => {
      const cells = list
        .map(
          (shot) =>
            `<figure><img loading="lazy" src="${escape(shot.file)}" alt=""><figcaption>${escape(shot.theme)} ${shot.width}</figcaption></figure>`
        )
        .join("");
      const count = faults.filter((f) => f.scenario === scenario).length;
      return `<section><h2>${escape(scenario)} <small>${count === 0 ? "clean" : `${count} faults`}</small></h2><div class="row">${cells}</div></section>`;
    })
    .join("");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Visual harness</title>
<style>
 body { font: 14px system-ui, sans-serif; background: #061c1e; color: #e8f5f6; margin: 0; padding: 24px; }
 h1 { font-size: 20px; margin: 0 0 4px; }
 h2 { font-size: 15px; margin: 28px 0 8px; }
 small { font-weight: 400; color: #a5c9cb; }
 ul { padding-left: 18px; color: #ffd9d0; }
 li { margin-bottom: 4px; font-family: ui-monospace, monospace; font-size: 12px; }
 .row { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 8px; align-items: flex-start; }
 figure { margin: 0; flex: none; }
 img { display: block; background: #0d2f32; border: 1px solid #1f4d50; max-height: 460px; width: auto; }
 figcaption { font-size: 11px; color: #a5c9cb; padding-top: 4px; }
</style></head><body>
<h1>Visual harness</h1>
<p><small>${escape(new Date().toISOString())} &middot; widths ${VISUAL_WIDTHS.join(", ")}</small></p>
${lines.length === 0 ? "<p>Nothing out of place.</p>" : `<ul>${lines.map((l) => `<li>${escape(l)}</li>`).join("")}</ul>`}
${byScenario}
</body></html>`;
}

main().catch((problem) => {
  console.error(problem.message);
  process.exit(1);
});
