# How to execute a story (read this first, every session)

This folder holds one file per open story: `docs/stories/S-<id>.md`. Each file is written so that you can
finish the story by reading **this README + that one file + the source files it names**. You do not need
to read the whole repository or the other stories.

The board (status of every story, and which one to take next) is `docs/STORIES.md`.

---

## 1. The loop

1. Open `docs/STORIES.md`. Take the **first story in the "Ready queue"** whose status is `READY` and whose
   "Needs" are all `DONE`. Do not skip ahead and do not pick a `BLOCKED` or `REVIEW` story.
2. Open `docs/stories/S-<id>.md`. Read all of it before changing anything.
3. Set the status to `IN_PROGRESS` in two places: the story file header and the row in `docs/STORIES.md`.
4. Run the baseline: `npm ci` (first time only) then `npm run check`. It must be green before you start.
   If it is red before you changed anything, stop and write that in the logbook; do not "fix" unrelated code.
5. Do the **Steps** in order. Stay inside **Files to touch**. If you believe another file must change,
   write why in the logbook entry.
6. Add the **Tests** the story lists. Run `npm run check` until green.
7. Do the **Verify** section. For anything visual, use the running site (section 6).
8. Tick every box under **Acceptance**. A box you could not verify stays unticked, with one line saying why.
9. Set the final status (section 2) in the story file and in `docs/STORIES.md`.
10. Append a logbook entry (section 8). **Do not commit** (section 3).

One story per session unless the story says it pairs with another.

## 2. Statuses

| Status | Meaning |
|--------|---------|
| `READY` | Can be started now (once its "Needs" are `DONE`). |
| `IN_PROGRESS` | Someone started it. If the logbook shows no entry for it in the current session, read its last logbook entry and continue from there. |
| `REVIEW` | Work is finished, but a person must read it before it is published (legal or factual content). Treat as done for "Needs" only if the story that needs it says so. |
| `BLOCKED` | Waiting for the owner (an account, money, a decision, a file). The file says exactly what is missing. Do not work around it. |
| `DONE` | Every acceptance box ticked and `npm run check` green. |

If you get stuck for a reason the story did not foresee: leave the code in a working state
(`npm run check` green, or your changes reverted), set the status back to `READY`, and write what you
found in the logbook. A clear "this did not work because…" is a good outcome. A half-finished change
reported as done is not.

## 3. Rules that are never broken

These come from the owner and from `MASTER_PROMPT.md`. No story overrides them.

1. **Do not `git add`, `git commit` or `git push`.** Leave every change in the working tree. The owner reviews and commits.
2. **Do not run `npm run data:backfill`**, and do not download official pages in bulk or in batches. The owner runs it.
   Adding one named month with `npm run data:add -- YYYY-MM` is allowed only when a story says so.
3. **Never invent or guess a number, a date, a rule of law, or a fact about an agency.** If the source is not in
   the repository or you could not read it in this session, say so and stop that part.
4. **Never hand-edit a file in `data/bulletins/` or `data/visa-bulletins/`**, and never edit `data/sources/manifest.json` by hand.
5. **Never script a request to `travel.state.gov` or `uscis.gov`.** Both refuse scripts; we do not disguise ourselves as a browser (decision D19).
6. **No deploy, no posting, no emails, no sign-ups, no spending.** Prepare; the owner presses the button.
7. **No secrets and no personal data in the repository.** Build-time settings are public values only.
8. **No predictions.** Never write "will", "expected to", "should become current by", or an estimated date or waiting time.
   Past movement is described as past movement, with the words "not a forecast" nearby (decisions D10, D27).
9. **No legal advice.** Describe what the bulletin says and link to the official text. Never tell a reader what to file or whether they qualify.
10. A priority date is current only when it is **earlier than** the cut-off. Equal is not current (decision D31).

## 4. What this project is (60 seconds)

VisaPulse is a static website about the U.S. Visa Bulletin (monthly green-card cut-off dates).
A Node script reads JSON records and writes plain HTML into `dist/`. There is no server and no framework.

```
data/bulletins/YYYY/YYYY-MM.json   verified records parsed from the official page (source of truth)
data/sources/manifest.json         for each verified month: archive snapshot + SHA-256 of the bytes parsed
data/visa-bulletins/               old third-party data, frozen; shown as "unverified" until replaced
src/lib/                           pure logic: period.js, labels.js, dataset.js, movement.js, parseBulletin.js, validateBulletin.js
src/site/                          HTML generation: html.js, layout.js, components.js, pages.js, chart.js, format.js, site.css
src/client/                        small browser scripts: site.js (every page), check.js (/check/), planner.jsx (/planner/)
src/greenCardTimeline.js           planner rules (pure);  src/GreenCardPlanner.jsx  planner form (React, only on /planner/)
scripts/                           build-site.mjs, dev.mjs, check-site.mjs, validate-data.mjs, build-data.mjs, fetch-archive.mjs, add-bulletin.mjs, crosscheck.mjs
test/                              node:test suites: site.test.js, dataset.test.js, parseBulletin.test.js, greenCardTimeline.test.js
docs/                              STRATEGY, DECISIONS, STORIES (board), stories/ (this folder), RUNBOOKS, LOGBOOK, growth/
```

Words used everywhere:

| Word | Meaning |
|------|---------|
| period | A bulletin month as `YYYY-MM`, for example `2025-06`. Helpers in `src/lib/period.js`. |
| line | A preference category the site has pages for (EB-2, F4, …). List: `LINES` in `src/lib/labels.js`. Each has `key`, `slug`, `code`, `name`, `group`. |
| area | A chargeability area. List: `AREAS` in `src/lib/labels.js` (`all`, `china`, `india`, `mexico`, `philippines`). |
| chart | `finalActionDates` or `datesForFiling`. List: `CHARTS`. Dates for Filing exists only from `2015-10`. |
| cut-off | A cell value: an ISO date `YYYY-MM-DD`, or the words `Current` or `Unavailable`. |
| view | One month of data as returned by `dataset.get(period)`; has `verified: true/false`. |
| dataset | `loadDataset({ officialDir, legacyDir })` from `src/lib/dataset.js`: `periods`, `verifiedPeriods`, `latestPeriod`, `get(period)`, `previousOf(period)`, `series(lineKey, chart, areaKey)`. |

Functions you will reuse (do not rewrite them):

| Need | Use |
|------|-----|
| Cut-off for a line and area in one month | `getCutoff(view, lineKey, chart, areaKey)` → `{ value, viaAll } \| null` (`src/lib/dataset.js`) |
| History of one line and area | `dataset.series(lineKey, chart, areaKey)` → `[{ period, value, viaAll, verified }]` |
| How a cut-off changed | `describeChange(current, previous)` → `{ type, label, days } \| null` (`src/lib/movement.js`) |
| Is a date current | `priorityDateStatus(priorityDate, cutoff)` → `'current' \| 'waiting' \| 'unavailable'` |
| Month maths | `shiftPeriod`, `formatPeriod`, `fiscalYearOf`, `periodRange`, `parsePeriod` (`src/lib/period.js`) |
| Show a cut-off or date | `formatCutoff(value)`, `formatDate(iso)` (`src/site/format.js`); `cutoffValue(value)` for HTML |
| Site addresses | `urls` in `src/site/format.js` (add new paths there, never hard-code them twice) |
| Official links | `OFFICIAL_LINKS` in `src/site/format.js` |

## 5. Commands

```bash
npm ci                 # install (Node 22 or newer; version in .nvmrc)
npm run check          # THE GATE: tests + typecheck + data validation + build + built-site check
npm test               # tests only (node:test, files in test/*.test.js)
npm run typecheck      # tsc --checkJs over src/lib, src/site, scripts
npm run build          # writes dist/
npm run dev            # preview on http://localhost:4321, rebuilds on change
```

Build-time settings are environment variables read in `scripts/build-site.mjs`, for example:
`SITE_URL=https://example.org npm run build` (turns on canonical links, sitemap, feed).

## 6. Looking at the site

- Start the preview with `npm run dev` (in the Claude desktop app: the `visapulse` entry in `.claude/launch.json`).
- Check any visual change at widths **375, 768 and 1280**, in **light and dark** theme (the ◐ button), with no console errors
  and no horizontal scrolling of the page.
- If you have no browser tool in this session, say so in the logbook and leave the visual acceptance boxes unticked.
  Do not claim a visual check you did not do.

## 7. Recipes

### 7.1 Add a page
1. Add the path to `urls` in `src/site/format.js`.
2. Write a renderer in `src/site/pages.js` (or a new file in `src/site/` if `pages.js` would pass about 600 lines).
   It takes `{ site, dataset, … }` and returns `layout({ site, path, nav, title, description, body })`.
3. Register it in the `pages` array in `scripts/build-site.mjs`.
4. Add a test in `test/site.test.js` that renders it and asserts on its `<h1>` and one key sentence.
5. `npm run check`. The built-site check (`scripts/check-site.mjs`) requires on **every** page: a `<title>` of 10+ characters,
   a meta description of 20+ characters, **exactly one `<h1>`**, the words "Not legal advice" (the footer supplies them),
   and every internal `href`/`src` must resolve to a file in `dist/`.
   It also fails if the visible text contains the bare words `undefined`, `NaN`, `null` or `[object Object]`,
   so never use those words in copy, and never let a missing value reach the template.

### 7.2 Write HTML
- Always use the `html` tagged template from `src/site/html.js`. It escapes every `${value}` automatically.
- Use `raw(...)` only for a string this code base built itself. Never for anything from data, the environment or a user.
- To embed data for a browser script: `<script type="application/json" id="…">${jsonForScript(data)}</script>`.
- Conditional output: `${condition ? html`…` : ''}`. Lists: `${items.map((item) => html`…`)}`.

### 7.3 Add a browser script
1. Create `src/client/<name>.js`. Plain JavaScript, no dependencies. Build DOM with `document.createElement`
   (see the `el()` helper in `src/client/check.js`); **never** assign `innerHTML`.
2. In `scripts/build-site.mjs`: add it to `entryPoints`, then to `site.assets` (pattern: `checkJs`).
3. Add the new asset name to the `SiteContext` typedef at the top of `src/site/layout.js`.
4. Load it only on the page that needs it: pass `head: html`<script src="${site.assets.<name>}" defer></script>`` to `layout`.
5. The page must still be readable with JavaScript off. Put the fallback in `<noscript>` or render the static part at build time.
6. Shareable state goes in the URL **fragment** (`#a=b`), never the query string, so nothing a visitor types reaches a server.
7. Tests in `test/site.test.js` use a `site` fixture object; add your asset key there (pattern: `checkJs: '/c.js'`).

### 7.4 Add a build-time setting
1. Read it in `scripts/build-site.mjs` from `process.env`. Validate it (URLs through the existing `publicUrl()` helper).
2. Put it on the `site` object and add it to the `SiteContext` typedef in `src/site/layout.js`.
3. Document it in `.env.example` (a comment line and an empty value). Public values only.
4. The feature must be **absent** when the setting is unset, and a test must assert that.
5. Add the field to the `site` and `liveSite` fixtures at the top of `test/site.test.js`.

### 7.5 Add pure logic
Put it in `src/lib/<name>.js` with `// @ts-check` on line 1 and JSDoc types on every exported function.
No file-system or network access in `src/lib` except `dataset.js`. Add `test/<name>.test.js`.

### 7.6 Write a test
```js
import assert from 'node:assert/strict'
import test from 'node:test'
test('what it proves, in words', () => { assert.equal(actual, expected) })
```
Tests must not use the network or the clock. Functions that need "today" take it as a parameter.

### 7.7 Pages whose facts need a human check
Some stories write explanations of immigration rules. Those pages carry `reviewedOn: null` and are **not built**
until the owner sets a date. You finish the story as `REVIEW`. Never set `reviewedOn` yourself.

## 8. Logbook entry (append to the end of `docs/LOGBOOK.md`)

```
## YYYY-MM-DD HH:MM — S-<id> <title>
- Done: what changed, in two to five lines.
- Files: every file created or modified.
- Tests: <count> pass; `npm run check` green | red (say which step).
- Verified: what you looked at and how. Not verified: what you could not check, and why.
- Decisions: any choice the story left open (also add a D-number to docs/DECISIONS.md if it is lasting).
- Owner actions: anything only the owner can do next.
- Uncommitted: yes (owner reviews).
- NEXT: the next story id from the ready queue.
```

## 9. Difficulty labels

| Label | Meaning |
|-------|---------|
| Routine | Small, mechanical, well-specified. Suitable for the smallest model. |
| Careful | Several files or subtle wording. Suitable for a small model that follows the steps exactly. |
| Expert | Design judgement, tricky parsing, security, or legal-sensitive content. Use the strongest model available, or have its output reviewed. |
