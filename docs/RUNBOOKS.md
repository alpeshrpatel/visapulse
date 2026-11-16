# Runbooks

## RB1 Local development
```bash
npm ci
npm run dev        # builds, serves http://localhost:4321, rebuilds on change
npm test           # node:test — parser, validator, dataset, planner rules, renderers
npm run check      # test + typecheck + data:validate + build + check-site  (the gate; same as CI)
npm run build      # -> dist/ (never committed)
```

## RB2 Monthly data refresh
The next month's bulletin appears on travel.state.gov around the 8th–20th (e.g. the December bulletin in mid-November).
Automated path (S-402): a scheduled workflow opens a pull request. Manual path:
1. `npm run data:add -- 2026-12` — looks for an Internet Archive snapshot of the official page, pins it, parses it.
2. If no snapshot exists yet: open the official page in a browser, save it as "Webpage, HTML only", then
   `npm run data:add -- 2026-12 --file ~/Downloads/visa-bulletin-for-december-2026.html`.
   (Do not script requests to travel.state.gov and do not fake a browser — D19.)
3. `npm run data:validate` must pass. Read the printed movement table; spot-check three cells against the official page.
4. Commit `data: add bulletin 2026-12`, open a PR, merge → host redeploys.
5. Add the USCIS chart designation for the month to `data/uscis-filing-charts.json` from the official USCIS page (S-303).
6. Append a logbook entry.

## RB3 Official backfill (one-time, owner action O4)
```bash
npm run data:backfill     # fetch-archive for 2002-01 → latest, then build-data, validate, cross-check
```
Takes about 20 minutes (one request every 1.2 s). The parser stops at the first page it does not fully understand
and names the row/column; add the label to the mapping in `src/lib/parseBulletin.js` **only after reading the official
page**, add a fixture test, and re-run (it resumes from cache). Review `docs/data/CROSSCHECK.md` before merging.

## RB4 Deploy (static host)
Build command `npm run build`, output `dist`, Node from `.nvmrc`. Environment: `SITE_URL` (e.g. https://example.com),
optional `FEEDBACK_ENDPOINT`. Cloudflare Pages recommended; Netlify works unchanged. Rollback = redeploy the previous build.

## RB5 A number looks wrong in production
1. Open the page's "official source" link and its archive snapshot; compare the cell.
2. Parser bug → fix, add a fixture test, `npm run data:build -- <period> --force`, PR.
3. Official correction (State republished) → `node scripts/fetch-archive.mjs <period> --refresh`, rebuild, PR; note it in the logbook.
4. Never hand-edit a file in `data/bulletins/`.

## RB6 New category, sub-category or area column
The parser will throw with the unseen label. Read the official page, add the label → key mapping in
`src/lib/parseBulletin.js`, add display names in `src/lib/labels.js`, add a fixture test, rebuild the affected months.

## RB7 Agent session start / resume (MANDATORY)
1. Read `docs/LOGBOOK.md` (bottom entry's NEXT), then `docs/STRATEGY.md`, `docs/DECISIONS.md`, `docs/STORIES.md`.
2. `git status`, `npm ci`, `npm run check`.
3. Take the first unfinished story; one commit per story; flip its status; append a logbook entry before context fills.
4. Never ask the owner; if blocked on money, credentials or a legal call: mark `BLOCKED`, log it under "Owner actions" with a default, move on.
5. Owner-only: push, deploy, publish, send, spend.

## RB8 Feedback spam or abuse
Unset `FEEDBACK_ENDPOINT` and redeploy (the widget disappears). The form already has a honeypot and a client throttle.
