# The visual harness

One command that looks at the screens.

```
npm run visual
```

It builds the app, starts it on a spare port, opens a headless browser
over a gallery of the real components, and reports what is wrong. It
shuts the server down when it is finished. Nothing is left running and
nothing waits for a keypress, so it can be a gate.

The report lands in `visual-report/` (git ignored): one picture per
component per width per theme, and `index.html` to look through them
all at once.

On a machine whose installed browsers belong to a different Playwright
than the project's pinned one, point the harness at a browser binary:

```
VISUAL_CHROMIUM=/opt/pw-browsers/chromium npm run visual
```

## Why it exists

"Review the whole screen as the user will see it" was a rule that
depended on somebody remembering to look, at one width, in one theme,
on one day. Two widgets doing the same job on one card is a defect that
survives a clean build, a clean type-check and a full test suite. This
catches the shape of a screen the way the tests catch the sums.

## What it looks at

The gallery is `src/app/visual/page.tsx`. It renders the **real**
components, not a copy of their markup: a harness built from
hand-written markup drifts from what ships the first time somebody
changes a class name, and then it passes while the screen is broken.

Every component appears in the states that actually break it:
loaded and empty, connected and failed, read and being edited, with a
builder name and an address longer than anything real. The faults live
in the long cases.

Eight widths, from a 320px phone to a 1440px desk, in light and dark:
`VISUAL_WIDTHS` and `VISUAL_THEMES` in `src/lib/visual.ts`. Phone and
tablet widths are driven as touch screens, so anything that sizes
itself up for a thumb does.

## What counts as wrong

Seven things, all in `src/lib/visual.ts` so they are testable without
a browser:

- **page-overflow** - the page is wider than the screen. Names the
  element that reaches furthest, which is the one to fix. Anything
  inside something that scrolls sideways (a board column) is passed
  over: it cannot widen the page, so it is never the cause.
- **spills-out** - something sticks out the side of its own card.
- **overlap** - two pieces of text sitting on top of each other.
- **touching** - two blocks on a page standing under 12px apart, or
  on top of each other. Only a stack is judged (a block marked
  `stack`, which renders a piece of a page on the page's own rhythm),
  and only its direct children. This is the check a single component
  can never fail and the one that finds a card flush against the card
  above it.
- **on-canvas** - text drawn straight on the page canvas that reads
  under 3:1 there. Almost always card content staged bare: the fix is
  to stage the block on the surface the app uses (a `card`), or, if the
  app really puts it on the canvas, to give it an on-canvas token.
- **clipped** - text cut short by an ellipsis. Truncation is a choice
  made on purpose, with a title carrying the whole value, so a cut
  value with no title on it or an ancestor in the block is a fault. A
  heading is a fault however it is titled: a heading wraps.
- **tap-target** - a control under 44px, on touch widths. A tick box
  is measured by the label wrapped around it, because that is what a
  thumb lands on. A linked address in a row of details is read, not
  aimed at, and is left alone; a link drawn as a button is measured
  like a button.

Overlap and spill allow two pixels of slack: a rounded border sitting a
fraction over its parent is not a defect, and flagging it teaches
everyone to ignore the report.

The same fault at eight widths is reported as one line, with the widths
it happens at, so it reads as one thing to fix.

## Adding a component

Add a `<Block>` to `src/app/visual/page.tsx` with a name, a short note
about the state, and the component. Give it made-up data that is longer
and emptier than anything real. That is the whole job: the checks and
the screenshots follow.

## Adding a page

A page is its blocks in order. Add a `<Block stack>` and put in it what
the page puts on the screen, top to bottom, using the same components
and the same classes the page uses. The stack sits on the app
shell's `content` class, so it carries the page's real rhythm, and the
runner checks that every block stands off the one above it. A new
page gets a stack before it ships; a page whose composition changes
gets its stack changed in the same commit.

## The route

`/visual` exists only when `VISUAL_HARNESS=true`, which nothing but
`scripts/visual/run.mjs` sets and no deployment ever does. Without it
the page is a 404 and the proxy treats it like any other route. It
holds no real data: every value in it is invented.

The harness also runs in demo mode, so the listings source, the
geocoder and the router are all stubs. Nothing outside is called by a run.
