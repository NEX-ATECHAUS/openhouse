# Open House: Agent Guide, Build and Deploy

Rules file for an AI coding agent working on this repository. The agent loads
it at the start of every session, so these standards apply automatically
instead of being remembered. It is carried over from the Straight Line Solar
Hub build, edited for this project.

Open House finds the homes open for inspection near the ones you want to
see, filtered by bedrooms and budget, and plans the day: the order to
visit them, the drive between each, and a break.

House style for everything the agent writes (code comments, docs, UI copy,
commits): plain, calm language. No emojis. No em dashes or en dashes.

Two companion playbooks expand this file and carry the same authority:
docs/shipping-guide.md (the iteration loop, the gates, git and deploy
discipline) and docs/security-guards.md (the fourteen security guards,
G01 to G14, each risk with its guard and its verify). Audit any new
surface against the relevant guards before it ships, and run the
security pass in that file over any change touching a route, a query,
an input, an upload, or a secret.

---

## 1. How to start every session

1. Ask for the specific task and wait for it. Do not begin work on a vague
   goal. "Add a site-address field to the job form, validation included" is a
   task; "improve the form" is not.
2. Read before you write. Open the exact file you are about to change, or the
   closest existing example, first. Never write from memory or from a general
   idea of how the framework behaves.
3. Make one change at a time: one file, one section, then verify. Do not batch
   unrelated changes. A small diff is easy to review and easy to roll back.
4. When the task gives exact text (a label, placeholder, or heading), use it
   exactly. Do not paraphrase or improve it.
5. One concept gets one control and one name. Before adding a widget,
   list what the screen already shows. If the new thing overlaps an
   existing one, replace the old one in the same change; never stack a
   second version beside it. The same rule holds for names: a queue,
   field or status carries one name everywhere it appears, in the UI,
   the code and the docs.
6. After a UI change, review the whole screen as the user will see it,
   top to bottom, not just the fragment that changed. Run
   `npm run visual`, then read the pictures once as a stranger would.
   Two widgets doing the same job on one screen is a defect even when
   each looks right on its own. The design rules in section 4a apply
   to every change that touches a screen.

---

## 2. The stack

- Framework: Next.js App Router with React and TypeScript. Server components
  by default; add `"use client"` only where interactivity requires it.
- The app is one screen, `src/app/page.tsx`, whose working part is
  `src/components/planner.tsx`: search, pick the homes, plan the day.
- Listings: Domain's developer API, through the listings seam
  `src/lib/listings/` (`index.ts` chooses the source, `domain.ts` is the
  only file that calls Domain, `domain-parse.ts` reads its answer,
  `filter.ts` is the one rule for what is in or out, `sample.ts` is the
  demo data). Why Domain and nothing else: docs/data-sources.md.
- Homes added by hand: placed on the map by `src/lib/geocode.ts`
  (Nominatim, with the suburb centre from `src/lib/suburbs.ts` as the
  fallback, marked approximate).
- Drive times: `src/lib/travel.ts`. An estimate from distance by default
  (`travel-estimate.ts`); real road times from an OSRM server when
  `TRAVEL_PROVIDER=osrm`, falling back to the estimate. The screen says
  which was used.
- The planner: `src/lib/planner.ts`, pure and tested. It prefers, in
  order: must-sees, the most homes, the break, the least driving, the
  earliest finish.
- Leaving the app: `src/lib/export.ts` builds the Google Maps link and
  the calendar file. Nothing is sent anywhere.
- Storage: none on a server. The search, the settings and homes added by
  hand are kept in the browser (`localStorage`, key `openhouse-v1`).
  There is no database and there are no accounts. If either is added,
  bring the blueprint's seams with it (`db.ts`, `authz.ts`, the Supabase
  clients) rather than inventing new ones.
- API routes: `src/app/api/search`, `plan` and `geocode`. Each starts
  with `readBody()` from `src/lib/api.ts`.
- Environment: read only in `src/lib/env.ts`. Nothing else touches
  `process.env`.
- Security headers: `src/proxy.ts` sets the content security policy with
  a nonce and `noindex` on every response.
- Hosting: Vercel, region pinned to syd1, with a preview deployment per
  branch.
- Validation and logging: zod on all input (`src/lib/schemas.ts`), the
  structured logger in `src/lib/logger.ts`. Log ids and counts, never an
  address someone typed.
- Demo mode (`NEXT_PUBLIC_DEMO_MODE`, on unless set to "false") serves
  the sample homes and stubs Domain, the router and the geocoder, so the
  app runs free and offline.

---

## 3. Golden rules (do not break these)

- **Never commit to the production branch.** Work on a feature branch. Merge
  to the review branch; merge to production only on explicit human approval.
- **Every outside service goes through its seam.** Listings only via
  `src/lib/listings/` (Domain is called only in `domain.ts`), drive
  times only via `src/lib/travel.ts`, geocoding only via
  `src/lib/geocode.ts`. A seam validates its inputs, calls one fixed
  host, and returns a `{ data, error }` shape or a stated fallback.
- **Read listings only from sources that allow it.** Domain's API is
  the source. realestate.com.au and homely.com.au have no public API
  and forbid scraping: never fetch, scrape or parse their pages. A home
  found there is added by hand. See docs/data-sources.md.
- **No accounts yet, so nothing private is stored.** The app keeps
  nothing on a server; searches and added homes live in the browser.
  Every API route goes through `readBody()` in `src/lib/api.ts` (same
  origin, throttle, size cap, zod). The day accounts are added, every
  route and action gets `requireUser()` at the top, in the same change.
- **Sample data is always marked.** Anything from
  `src/lib/listings/sample.ts` shows its Sample pill and the banner.
  A made-up home must never read as a real one.
- **Validate all input before it reaches the data layer.** Server-side, with
  a zod schema or explicit caps and coercion. Never trust a value from the
  client. The schemas are in `src/lib/schemas.ts`.
- **Strip secrets before the client.** Select explicit fields, never pass a
  raw row or API response into a client component. Anything passed as a prop
  is readable in the page source.
- **No secrets in the repo.** Keys live in Vercel per environment. Commit
  only `.env.example`. Never prefix a secret with `NEXT_PUBLIC_`.
- **Any LLM feature is hardened.** Untrusted text in a nonce-delimited data
  block inside a single user message; a safety pre-check that can only
  escalate; structured enum output that is never executed or rendered as raw
  HTML; fail safe to human review on any error; red-team cases as a build
  gate before shipping.
- **Dependencies are exact-pinned**, with an `overrides` block for transitive
  advisories and the lockfile committed. Do not add a package without a real
  need.

---

## 4. Conventions

- Server components by default; `"use client"` only for interactivity. No
  heavy client-side data library unless justified.
- API routes and seams return a consistent `{ data, error }` shape.
- Every async function has a typed try/catch. Errors are logged through the
  structured logger, never with raw `console.log`.
- Never log request bodies, message contents, or personal data. Log ids and
  counts. Log every failed authentication with a timestamp.
- UI copy is plain and calm, matching the house style.
- Homes and stops read in time order, earliest first, because that is
  the order the day happens in.
- Times are wall-clock times at the property (a day and minutes after
  midnight, see `src/lib/types.ts`). Never convert them between
  timezones.

---

## 4a. Design rules (every UI change, no exceptions)

The look is defined once, in `src/app/globals.css`, and applied
everywhere. A screen is not done when it works; it is done when it is
neat at every width in both themes, and the harness agrees.

- **One rhythm.** Blocks that sit directly on a page are spaced by the
  page (`.content > * + *` and `.column > * + *`, 20px), never by
  themselves. A page block carries no top or bottom margin of its own,
  and no pair of blocks gets its own spacing rule. Inside a card, what
  follows the description stands 14px off it by the shared rule.
- **No inline spacing.** `style={{ margin, padding, gap }}` is a defect.
  A spacing need that the shared rules do not cover becomes a named
  class in `globals.css`, next to the rule it varies, with a comment
  saying why.
- **One widget per concept.** Before adding a card, a row, a status, a
  button, find the component that already shows that concept and use
  it. A home is `HomeCard` wherever it comes from. Two versions of one widget on one screen, or across two
  screens, is a defect even when each looks right on its own.
- **Tokens, not values.** Colours, radii and shadows come from the
  variables at the top of `globals.css`. A colour that only works in
  one theme is wrong in both. The theme follows the device
  (`prefers-color-scheme`); there is no switch.
- **No single-edge accents.** A box, card, callout or note never
  carries a coloured bar down one side or along its top as its only
  decoration (`border-left: 4px solid`, `border-top: 6px solid`, an
  inset box-shadow stripe). That look reads as generated. A box has a
  full border, a filled tint, or nothing; emphasis comes from the
  fill, the type or a pill. This holds in the app, in mockups and in
  documents alike.
- **Touch first where thumbs are.** Every control meets the 44px floor
  on a touch screen (`@media (pointer: coarse)`); a mouse keeps the
  compact sizes.
- **Long and empty are the normal cases.** Design for an address of a hundred characters, a price written as
  a sentence, and a home with nothing known but its address. Truncation is a choice made on purpose, with a
  title attribute carrying the whole value.
- **The harness is the review.** Every component gets a block in
  `src/app/visual/page.tsx`; every page gets a stack. A change to a
  component, a page composition or `globals.css` runs `npm run visual`
  before commit and ships with nothing out of place. Then look at the
  pictures in `visual-report/`, top to bottom, as a stranger would.
  See docs/visual-harness.md.

---

## 5. Branch and deploy workflow

- `main` is production. Never commit to it directly.
- Work is committed and pushed to the working branch, gates passed, with
  nothing on production. When the owner says "push", `main` is
  fast-forwarded to the working branch and nothing else; never a merge,
  a rebase or a force. Then the production deployment is checked on
  Vercel (Ready, built from that commit) and its runtime logs read, and
  the result is reported plainly.
- A saved version is a new branch (`v1`, `v2`), made only when asked,
  and never touched again.
- Every branch gets its own Vercel preview URL. Verify a change on its
  preview before it goes to production.
- Verify on the real URL, not from memory: load the pages, watch for console
  errors, confirm the change is present and prior work is not regressed.
- Rollback is instant: promote a previous deployment, or revert the commit.
  Never hand-hotfix production.
- On a merge conflict, stop and explain it. Never force-merge or discard
  changes.
- Until accounts exist, a deployment with real Domain keys sits behind
  Vercel Deployment Protection, so a stranger cannot spend the Domain
  allowance. See docs/go-live-checklist.md.

---

## 6. Data-layer changes

There is no database yet. What the browser keeps is versioned by its
key (`openhouse-v1`): a change to its shape either reads the old shape
too or moves to a new key, so a returning visitor never meets a broken
screen. When a database is added, the blueprint's rules apply: numbered
migrations, expand then contract, a schema reference in `docs/`, and
never a hand edit to live data.

---

## 7. Feature flags

- Ship a user-facing capability behind a flag, off by default. Validate it on
  the review site, then flip the default on. The flag stays as an instant
  kill-switch.
- Enforce the flag in two places: the API route returns 403 when off, and the
  UI does not render the entry point. Do not rely on hiding the button alone.
- If something must never be switchable off (a safety or billing-correctness
  guarantee, such as never double-billing a stage), make it independent of
  the flag on purpose and document why.

---

## 8. Before every commit

- Clean production build, clean type-check, clean lint.
- `npm test` passes. The planner in `src/lib/planner.ts` is a build
  gate: any change to how a day is ordered, what counts as a visit, or
  the break needs its cases in `planner.test.ts`. The Domain parser and
  the calendar export carry theirs the same way.
- `npm run visual` reports nothing out of place. It renders the real
  components at eight widths in both themes and looks for overflow,
  overlap and tap targets under 44px. A change to a component or to
  `globals.css` gets a run; see docs/visual-harness.md.
- `npm run audit:ci` shows no critical or high issues.
- No secret is committed and none is exposed to the browser bundle.
- No debug logging of personal data left in.
- A dated changelog entry in `CHANGELOG.md` describes what changed, in
  plain words, and who asked.

## Before every push

- Every acceptance point confirmed against the running app, not from memory.
- Changed pages render with no console errors.
- The changed screen reviewed whole: no duplicated controls, and no
  concept shown twice under two names. The harness pictures in
  `visual-report/` are the record of that look.
- Access controls still hold; prior approved work is not regressed.
- After a push to production, the deployment is checked on Vercel
  (Ready, from the pushed commit) and its runtime logs read, as in
  section 5.
- On a machine whose browsers belong to a different Playwright than the
  pinned one: `VISUAL_CHROMIUM=/opt/pw-browsers/chromium npm run visual`.
- Report honestly: if a check failed or a step was skipped, say so with the
  output. State when something is done and verified, plainly.

---

## 9. Never do this

- `eval` or `new Function` on any input.
- `dangerouslySetInnerHTML` (or any raw HTML injection) with user input.
- Call Domain, the router or the geocoder outside their seams.
- Fetch or scrape realestate.com.au, homely.com.au or any portal's
  pages.
- Add a dependency without a real need, or an unpinned version.
- Put a watch mode, an interactive prompt, or a long-running foreground
  server into a command that is supposed to be a one-shot gate.
- Claim something works without verifying it against the running app.

---

## 10. Corrections not to repeat

Carried over from the Hub build, where each one was learned the hard
way. Add to this list the day a correction is given on this project.

### Logic and rules

- **Never invent a rule to fill a gap.** When the code needs a rule
  nobody stated (how long an open home runs when no closing time is
  given, whether a visit may run past the close), ask, or make it a
  setting, and write it where it can be read.
- **One concept, one calculation.** Whether a home is in the day, how
  far it is from a must-see, how long a drive takes: each comes from
  one function, so two parts of the screen can never disagree.
- **Nothing vanishes.** A home left out of the day, or dropped by the
  planner, stays on the screen and says why.
- **Use the owner's words.** Open home, must-see, break, budget.

### Verifying

- **Check the fix where the bug was seen:** the same screen, width,
  device and input. Tests passing is not the same as fixed.
- **After a logic change, walk the neighbouring flows** (search, leave
  a home out, make a must-see, add a home by hand, plan, plan again)
  before saying it works.
- **Verify a safety or access claim before stating it.**
- **The screen never says something happened until it has.** A failed
  search says it failed, never shows as an empty list; an action that
  cannot reach the server says so. A drive time that is an estimate is
  called an estimate.
- **Anything about an outside service is checked against that service**
  before it is called true. The Domain request and answer shapes in
  `domain.ts` came from documentation, not from a live call; see
  docs/data-sources.md for what is still to confirm.

### Anything visual

- **Review the picture at full size before sending it**: even spacing,
  no figure shown twice, every word spelled right, buttons one style
  and one height, nothing cramped, cut or stacked without a gap.
- **Sample data is realistic and consistent.**
- **Long lists page at ten**, with the shared `Pager`.
- **Every part of a screen is reachable with a mouse on a desktop.**
- **No page scrolls sideways on a phone.** Check 320, 390 and 430 wide.
- **Hover only where there is hover.**
- **Fewer controls, in steps.**
- **Single-edge accents are banned everywhere** (section 4a).

### Deliverables and communication

- **Account for every item in a source.**
- **Small plans, one at a time**, in plain words.
- **Errors say why and what to do next,** in plain words, on screen.
- **Build from the user's side.**
- **When asked for a short list, give a short list.**

---

Prepared by Nex-a.
