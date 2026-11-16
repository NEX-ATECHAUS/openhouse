# Vibe-Coding Security Guards

**Companion to the Build Playbook - Security**

Code written fast and fluently ships the same few vulnerabilities again and again. Each one below pairs the risk with the concrete guard that stops it and the check that proves the guard is in place.

> **The stance:** the client is hostile, the network is hostile, and a signed-in tenant is only semi-trusted. Authorisation is decided on the server against the data, never in the UI. Untrusted input is data, never instructions. When anything is uncertain, fail closed.

---

## Five invariants everything rests on

If a change would break one of these, it is wrong by definition. They are not guidance; they are the floor.

1. **Row-level security on every table, always.** Never disabled to fix a bug - fix the policy. Tenants read and write only their own rows; ownership is resolved through server-side helpers, not a client-supplied id.
2. **Secrets are server-only.** Only a short allow-list of variables may be public; every other key, and every third-party call, stays on the server. No secret in a bundle, a response body, or a log.
3. **Validate before the database.** Every user input has a schema or a database constraint before it is stored. Client-side checks are a convenience, never the enforcement.
4. **Fail closed.** On any error, missing key, or uncertainty, deny and fall back to human review. Never auto-approve, auto-serve, or auto-act on failure.
5. **Untrusted text is data.** Visitor input, comment bodies, and model output are never treated as instructions, never executed, never rendered as raw markup.

---

## The fourteen guards

Stable reference ids (G01-G14) so a review can cite one directly. Audit every new surface against the relevant guards before it ships. Each guard is **Risk → Guard → Verify**.

### G01 - Broken access control
- **Risk:** a route using a privilege-bypassing (service-role) client trusts the request, so anyone reaching it acts as an admin.
- **Guard:** every such route authorises the caller and the specific row itself. Server actions re-check role even when only linked from an admin screen. The UI hiding a control is never the control. A layout is not a wall either: when a layout refuses (shows a message, redirects or calls notFound), the page under it still runs and its data is sent in the response, readable in the page source (checked against this app's Next.js, 9 November 2026). So who may open a section is decided in the proxy by role before any page runs (`routeDecision` in `src/lib/route-access.ts`): installers never receive an office page, managers never receive Accounts, Sales reaches only the preview accounts. A page that shows money also checks the role itself where it can.
- **Verify:** grep for the admin client; confirm each use is preceded by an auth + ownership check. A new office route is under a prefix in `OFFICE_PREFIXES`, and an admin-only one in `ADMIN_PREFIXES`; `src/lib/route-access.test.ts` lists the routes it must refuse.

### G02 - Insecure direct object access
- **Risk:** private files served by guessable URL, or a record returned because its id was known.
- **Guard:** private media flows through an authorised proxy that re-checks RLS under the caller's own session, then redirects to a short-lived signed URL. Any failure returns 404, never confirming the object exists.
- **Verify:** request another tenant's media id while signed in as the wrong tenant; expect 404.

### G03 - Server-side request forgery
- **Risk:** the server fetches a URL taken from a record a user can write, reaching internal addresses or cloud metadata.
- **Guard:** a strict resolver returns only app-owned URLs (a signed private-object URL or the known public host) and null for anything else. The server and headless browser fetch nothing outside that set.
- **Verify:** set a media field to an internal URL, trigger the export, and confirm it is skipped, not fetched.

### G04 - Stored cross-site scripting
- **Risk:** a user value shown as a link or markup on a public page carries a `javascript:` scheme or an HTML payload.
- **Guard:** URL fields shown as links get a scheme check at the database, not only in the browser. Text renders through auto-escaping; rich text allows https links only; raw-HTML sinks are escaped at the source.
- **Verify:** insert `javascript:` directly into the column; the constraint rejects it.

### G05 - State-changing GET
- **Risk:** a link that acts on a bare visit (approve, delete, publish) is triggered by email scanners and link previews.
- **Guard:** a GET never mutates. It renders a review page; the action happens only on an explicit POST the person chose.
- **Verify:** curl the link with GET; confirm nothing changed server-side.

### G06 - Tokens & magic links
- **Risk:** reusable, long-lived, or enumerable tokens; error messages that reveal whether a token exists.
- **Guard:** tokens are high-entropy, single-use, and time-boxed, validated server-side, nulled on use. Actions are idempotent and errors are generic.
- **Verify:** reuse a spent token and an expired one; both return the same generic failure.

### G07 - Timing-unsafe comparison
- **Risk:** comparing a secret with `===` leaks how many characters matched, letting it be recovered over time.
- **Guard:** gate keys and cron bearer tokens compare in constant time, with a helper that also works in edge runtimes. A missing secret rejects rather than comparing against "undefined".
- **Verify:** grep for `=== process.env` / bearer comparisons; all route through the constant-time helper.

### G08 - File uploads
- **Risk:** trusting the client's content-type or filename; storing executable or oversized files; world-readable buckets.
- **Guard:** validate by magic bytes, enforce an allow-list and size cap, rename to a random id, and store in a private bucket served only through the proxy (G02). Large uploads re-check bytes on finalize.
- **Verify:** rename a script to `.png` and upload; it is rejected on byte inspection.

### G09 - Secret exposure
- **Risk:** a key prefixed public "just to make it work"; a secret echoed in an error, a health check, or a log.
- **Guard:** only a known allow-list may be public. Unauthenticated endpoints reveal no provider inventory and no raw error text; personal data stays out of logs and breadcrumbs.
- **Verify:** grep the client bundle for secret names; read the health response for leaks.

### G10 - Rate limits & abuse
- **Risk:** public write and expensive endpoints open to floods; forms harvested by bots.
- **Guard:** public and costly routes are throttled per client; forms carry a honeypot and length caps enforced at the database too. Where a flow inserts directly, compensating controls plus human review apply.
- **Verify:** hammer the endpoint past the window; expect 429.

### G11 - Prompt injection & LLM misuse
- **Risk:** untrusted text steering the model; model output executed or rendered; auto-acting on a low-confidence result.
- **Guard:** untrusted input reaches the model only inside nonce-delimited data markers, never a system prompt. Output is a bounded enum, never executed. A safety pre-check can only escalate; on any doubt it falls back to human review.
- **Verify:** the offline red-team suite passes as a commit gate for any change to that surface.

### G12 - Injection sinks
- **Risk:** `eval`, `new Function`, shell exec, string-built SQL, or raw-HTML injection of user text.
- **Guard:** none of those sinks with user input. Queries are parameterised through the client or typed RPC; raw-HTML rendering is escaped and, where unavoidable, sanitised.
- **Verify:** grep for the sink patterns; each hit is either absent or provably not user-fed.

### G13 - CORS & origins
- **Risk:** a wildcard `Access-Control-Allow-Origin` that lets any site call authenticated endpoints.
- **Guard:** never `*`. Validate the origin with a protocol + host-suffix check and echo back only an allowed origin. Same-origin stays same-origin until a cross-origin need is real.
- **Verify:** grep for `Allow-Origin`; confirm no wildcard and a real suffix check.

### G14 - Dependencies
- **Risk:** a known-vulnerable transitive package, or an `audit fix --force` that silently downgrades a major.
- **Guard:** `npm audit` stays at zero high and critical. Prefer targeted version pins/overrides over risky major changes; pin exact versions and build with `npm ci`.
- **Verify:** run `npm audit` in the pre-ship gate; review any override for scope.

---

## The security pass (before you push)

Run this over any change that touches a route, a query, an input, an upload, a link rendered publicly, or a secret. It is part of the definition of done, not a separate ceremony.

- [ ] **No secret client-side** - no new public-prefixed key; no third-party call from the browser; nothing sensitive in a response or log
- [ ] **Every new input is validated before the database** - a schema or a database constraint, not only a client check (G04, G12)
- [ ] **RLS holds on any new table, and admin-client routes authorise the caller** - ownership resolved server-side; the row is checked, not just the role (G01, G02)
- [ ] **No state change on GET; public writes are rate-limited** - mutations behind POST; throttles and honeypots on public forms (G05, G10)
- [ ] **Server-fetched and publicly-linked URLs are constrained** - strict resolver for server fetch; scheme-checked link fields (G03, G04)
- [ ] **Any LLM change passes the red-team gate** - nonce-delimited input, bounded output, fail-safe to human review (G11)
- [ ] **Dependencies clean** - `npm audit` shows zero high and critical (G14)

---

## Running a full audit

Beyond the per-change pass, sweep the whole app on a cadence - after a burst of features, before a milestone. The method that surfaced real issues here:

1. **Map the attack surface** - enumerate every route, every use of the privilege-bypassing client, and every place user input is stored, fetched, or rendered.
2. **Grep the known sinks** - dangerous functions, wildcard CORS, public-prefixed secrets, admin client without an auth check, server fetch of stored values, raw-HTML rendering.
3. **Trace the write paths** - follow how each input reaches the database and how each stored value is later rendered or fetched. Client-only validation is the tell.
4. **Rank honestly** - severity by real blast radius, not label. Note what the framework or RLS already mitigates, and say so.
5. **Fix one at a time, verify, commit** - each fix runs the gates and a targeted proof (a rejected payload, a 404, a replayed migration) before the next begins.

---

*Why guards, not vibes:* fluent code is confident code, and confidence is exactly what hides these defects. A guard turns a judgement call into a check anyone can run - so the speed stays and the hole does not.

**Hostile client · hostile network · semi-trusted tenant · fail closed**
