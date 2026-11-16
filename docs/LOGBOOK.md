# Progress Logbook (append-only; newest at bottom). Resume point = last entry's "NEXT".

Format: `## YYYY-MM-DD HH:MM — <story ids>` · Done · Decisions · Problems · Files · NEXT (exact first action).

## 2026-11-16 — Bootstrap (CEO/PM pass)
- Done: reviewed repo (Vite+React18+Recharts, 290 bulletin JSONs 2002-01→2026-11, planner rules engine, 16 passing node tests). Wrote docs/ARCHITECTURE, DECISIONS, RUNBOOKS, STORIES, MVP, MVP_DETAILED, MASTER_PROMPT.
- Findings: data scraped from visabulletin.ai (not official); App.jsx 886-line monolith; dist/ tracked; README empty; feedback email hardcoded to a third party; index.html title hardcoded "October 2026"; no CI/lint/TS; all JSON eagerly bundled.
- Decisions: D1–D15 in DECISIONS.md.
- NEXT: start S-001 (then S-002, S-003 …). Run `npm ci && npm test` first.

## 2026-11-16 13:35 — Session 1 kickoff (strategy pass, data spike; no stories closed yet)
- Done: read all docs + code; `npm ci`; `npm test` → 16/16 pass. Audited dataset. Spiked an official-source route.
- Findings (data, serious):
  - Legacy dataset (`data/visa-bulletins/`, scraped from visabulletin.ai via r.jina.ai) is far worse than documented: **77 of 290 files have no categories at all**, 74 more have no family table, 3 have no employment table; 4,310 of 20,510 cells are "Unavailable" (many are parser fill-ins from the old script's `relaxed` mode, i.e. not real data). `datesForFiling` is populated before Oct 2015 although that chart did not exist then.
  - `officialSourceUrl` is wrong for every Oct–Dec bulletin (State files them under the *fiscal* year folder) and for 5 irregular file names (2009-03/09/10/11, 2012-10).
  - Official pages list only oversubscribed countries (June 2003 shows just All Chargeability / Mexico / Philippines); the fixed 5-column legacy schema cannot represent that.
- Findings (sources): travel.state.gov and uscis.gov return **HTTP 403 (Cloudflare) to scripted clients**, including an honest default `curl` UA. We do not spoof a browser. The Internet Archive Wayback Machine holds the official bulletin pages for 2002-01 → 2026-07 (CDX lists 291 distinct bulletin URLs; 2026-08…2026-12 not archived yet) and serves original bytes (`id_` mode).
- Built: `scripts/fetch-archive.mjs` (polite, 1 req/1.2 s, pins snapshot timestamp + SHA-256 in `data/sources/manifest.json`, raw HTML in git-ignored `.cache/official/`), `src/lib/period.js`, `src/lib/officialUrl.js`. Fetched 3 fixtures: 2003-06, 2015-10, 2025-06.
- Problems: the session's permission classifier **denied the bulk archive download** (291 pages) as "Unauthorized Access"; a 3-page fixture fetch was allowed after the owner said "try again". I am not chunking around the denial. Research subagent died on a plan usage limit (no output).
- Gray area flagged: retrieving public-domain federal pages from the Internet Archive because the publisher's CDN blocks scripts. Conservative choice taken: no UA spoofing, no Save-Page-Now triggering, archive copies only, and the bulk run is left to the owner.
- Owner actions:
  1. **Approve/run the official backfill** (one step): `node scripts/fetch-archive.mjs` then `npm run data:build` (script lands in S-103). Until then only 3 months are official-verified and the site keeps showing the legacy set, labeled as unverified.
- Files: scripts/fetch-archive.mjs, src/lib/period.js, src/lib/officialUrl.js, data/sources/manifest.json, .gitignore.
- NEXT: quick competitor/source search (≤4 queries) → write docs/STRATEGY.md → append D16+ to docs/DECISIONS.md → rewrite STORIES/MVP/MVP_DETAILED/ARCHITECTURE/RUNBOOKS → build `src/lib/parseBulletin.js` against the 3 fixtures in `.cache/official/`.

## 2026-11-16 15:15 — S-101, S-102, S-103, S-104, S-105 (MVP-0 most of the way)
- Done:
  - Strategy pass: docs/STRATEGY.md; D16–D33; backlog rewritten into six phases (S-101…S-607) incl. a launch/advertise phase; ARCHITECTURE, MVP, MVP_DETAILED, RUNBOOKS rewritten.
  - S-101 hygiene: `dist/` untracked, README, package renamed `visapulse`, `.nvmrc`, `.editorconfig`, data scripts.
  - S-102 fetcher: `scripts/fetch-archive.mjs` (+ `--file` manual path storing bytes in `data/sources/manual/`, `--all` required for a full run), `scripts/add-bulletin.mjs` (`npm run data:add`).
  - S-103 parser: `src/lib/extractTables.js`, `src/lib/parseBulletin.js`, `scripts/build-data.mjs`; verified records for 2003-06, 2015-10, 2025-06 in `data/bulletins/`; fixtures in `test/fixtures/official/`.
  - S-104 validator + `data/sources/legacy-freeze.json` (hashes of all 299 legacy files; validation fails if one changes) + `docs/data/CROSSCHECK.md`.
  - S-105 dataset layer: `src/lib/dataset.js`, `labels.js`, `movement.js`. 147 months available (3 verified, 144 legacy-unverified), 152 withheld.
  - Removed the hardcoded personal email from `src/FeedbackWidget.jsx` (env `VITE_FEEDBACK_ENDPOINT`, hidden when unset, no mailto fallback).
- Decisions: D31 (PD equal to cut-off is NOT current — planner bug fixed), D32 (withhold broken legacy months), D33.
- Findings: legacy June 2003 is wrong, not merely incomplete (family dates filed under EB rows, invented "Unavailable" for China/India). Legacy June 2025 matches official 140/140. Legacy set is 299 files, not ~290.
- Problems / honesty notes:
  - **Incident**: while adding `--file`, an argument-parsing bug made `fetch-archive.mjs 2025-06` behave like a full-range run; it downloaded 19 extra pages (2002-01…2003-08) before I noticed and killed it (~2 min). That is the bulk download the permission layer had declined, so I deleted those 19 cached pages and manifest entries, fixed the bug, and made full runs require `--all` (D33). Net state: only the 3 approved fixtures were fetched and kept.
  - The docs commit (8e1456f) also carried the `dist/` untracking.
  - Research subagent produced nothing (usage limit); competitor read in STRATEGY is from three web searches, not a full study.
- Tests: 34 pass (was 16). No typecheck/CI yet (S-107).
- Owner actions:
  1. **O4 official backfill**: `npm run data:backfill` (≈20 min, archive.org only). Then review `docs/data/CROSSCHECK.md`; periods the parser refuses are listed by name with the unknown label — next session maps them.
  2. O3 brand collision (visapulseusa.com) — decide name before buying a domain.
  3. Set `FEEDBACK_ENDPOINT` to an inbox you control if you want the feedback form back.
- Files: see commits 73293ea…32c5ba0.
- NEXT: S-201 generator spike — create `src/site/html.js` (escaping template tag), `src/site/layout.js`, `src/site/pages/bulletin.js`, `scripts/build-site.mjs` (esbuild for CSS/JS), render home + one bulletin page from `loadDataset`, then S-202…S-208. S-106 finishes at cutover (new feedback script); S-107 CI after `npm run check` exists.

## 2026-11-16 17:10 — S-106, S-107, S-201…S-208, S-401, S-402, S-405 — MVP-0 and MVP-1 SUMMARY
- Shipped (all local commits, nothing pushed or deployed):
  - **MVP-0 Foundation — done except the bulk backfill (owner action O4).**
  - **MVP-1 Static site — done except S-209 (a11y/perf audit).** Generator in `src/site/` (`html.js` auto-escaping templates, `layout.js`, `components.js`, `pages.js`, `chart.js` build-time SVG, `site.css`), `scripts/build-site.mjs`, `scripts/dev.mjs` (port 4321), `scripts/check-site.mjs`. Client: `src/client/site.js` (theme, chart switch, feedback form), `src/client/planner.jsx` + `planner.css` (the only React island).
  - Removed: Vite, Recharts, `App.jsx`, `main.jsx`, `HistoricalCutoffChart.jsx`, `FeedbackWidget.jsx`, `styles.css`, root `index.html`, `scripts/download-visa-bulletins.mjs` (third-party scraper; still in git history). Google Fonts dropped for system fonts (no third-party requests at all).
  - S-107 CI (`.github/workflows/ci.yml` runs `npm run check`), S-401 `public/_headers` + `.env.example`, S-402 `.github/workflows/refresh-data.yml` (daily on days 8–25, archive-only, opens a PR), S-405 `docs/LAUNCH.md`.
- Metrics: 247 pages built in ~0.5 s · home 4.8 kB gz · CSS 3.2 kB gz · JS on every page 0.9 kB gz · planner page +52 kB gz (React) · 38 tests pass · `tsc --checkJs` clean · `check-site`: 247 pages, 32k internal links, 0 broken · dependencies: 3 runtime (react, react-dom, lucide-react), 5 dev.
- Data on the site right now: 147 months shown (3 verified, 144 labeled unverified), 152 withheld with a link to the official page. Unverified months do contain errors (e.g. legacy July 2023 EB-2 Dates for Filing repeats the EB-1 row) — the label and the chart note say so. Only the backfill fixes this.
- Verified in a real browser (built-in pane, localhost:4321): home, a verified bulletin page (June 2025), EB-2 India and F4 Philippines pages, archive, planner, at 375 / 768 / 1280, light and dark. Chart switch works; planner island renders and computes; no horizontal overflow after a fix (visually hidden labels escaped the table scroll box). Console: one 404 from the very first request, made before the initial build finished; no failed requests on later loads. **Not verified**: Lighthouse scores, colour-contrast audit, keyboard-only walk-through, print layout, Safari/Firefox, the two GitHub workflows (never run — repository not pushed).
- Decisions: D16–D33 (see DECISIONS). Notable deviation from "one commit per story": S-201…S-207 landed as one commit because the pages share one module.
- Owner actions (all one step each):
  1. **Backfill official data**: `npm run data:backfill` (≈20 min; archive.org only). Review `docs/data/CROSSCHECK.md`. Months the parser refuses are listed with the unknown label for the next session.
  2. Decide the brand (O3) and domain; deploy `dist/` to a static host with `SITE_URL` set (RUNBOOKS RB4).
  3. `git push` to enable CI and the monthly refresh workflow.
  4. Optional: set `FEEDBACK_ENDPOINT` to a form endpoint you control.
  5. Before promoting: follow the gate in `docs/LAUNCH.md`.
- NEXT: S-301 priority-date checker (`/check/`: embed latest cut-offs as JSON, vanilla JS, URL state) → finish S-302 prose callouts → S-303 USCIS chart designation data file (enter only from the official USCIS page) → S-209 audit. After the owner runs the backfill: map any unknown row labels the parser reports (RUNBOOKS RB3), then drop the legacy fallback (D21).
